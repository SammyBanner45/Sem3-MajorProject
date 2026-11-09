const crypto = require('node:crypto');
const { kolkataMonthBounds } = require('./co2Rules');
const { getPointsSummary } = require('./points.service');
const { HttpError } = require('../lib/httpError');

class RewardConflict extends HttpError {
  constructor(message) { super(409, 'REWARD_CONFLICT', message); }
}

function makeCode() {
  return `ECO-${crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase()}`;
}

async function listRewards(userId, client) {
  const [rewards, summary] = await Promise.all([
    client.reward.findMany({ where: { isActive: true }, orderBy: { cost: 'asc' } }),
    getPointsSummary(userId, client)
  ]);
  const { start, end } = kolkataMonthBounds();
  const redemptions = await client.redemption.findMany({ where: { userId, createdAt: { gte: start, lt: end } }, select: { rewardId: true } });
  const redeemed = new Set(redemptions.map((item) => item.rewardId));
  return { balance: summary.balance, rewards: rewards.map((reward) => ({ ...reward, canAfford: summary.balance >= reward.cost && reward.stock > 0 && !redeemed.has(reward.id), alreadyRedeemedThisMonth: redeemed.has(reward.id) })) };
}

async function redeemReward(userId, rewardId, client) {
  return client.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) throw new RewardConflict('Reward is not available.');
    const summary = await getPointsSummary(userId, tx);
    if (summary.balance < reward.cost) throw new RewardConflict(`You need ${(reward.cost - summary.balance).toFixed(2)} more points.`);
    const { start, end } = kolkataMonthBounds();
    const previous = await tx.redemption.count({ where: { userId, rewardId, createdAt: { gte: start, lt: end } } });
    if (previous) throw new RewardConflict('This offer has already been redeemed this month.');
    const stockUpdate = await tx.reward.updateMany({ where: { id: rewardId, isActive: true, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
    if (!stockUpdate.count) throw new RewardConflict('This reward is out of stock.');
    const redemption = await tx.redemption.create({ data: { userId, rewardId, cost: reward.cost, code: makeCode(), status: 'active', expiresAt: new Date(Date.now() + reward.validDays * 24 * 60 * 60 * 1000) }, include: { reward: true } });
    return redemption;
  }, { isolationLevel: 'Serializable' });
}

async function getMine(userId, client) {
  const redemptions = await client.redemption.findMany({ where: { userId }, include: { reward: true }, orderBy: { createdAt: 'desc' } });
  return redemptions.map((item) => ({ ...item, status: item.status === 'active' && item.expiresAt < new Date() ? 'expired' : item.status }));
}

async function getWallet(userId, client) {
  const [purchased, streakCoupons] = await Promise.all([
    client.redemption.findMany({ where: { userId }, include: { reward: true }, orderBy: { createdAt: 'desc' } }),
    client.userCoupon.findMany({ where: { userId }, include: { coupon: true }, orderBy: { awardedAt: 'desc' } })
  ]);
  return [
    ...streakCoupons.map((item) => ({ source: 'streak', title: item.coupon?.title || 'Streak coupon', code: item.code, status: item.isRedeemed ? 'used' : 'active', expiresAt: null, awardedAt: item.awardedAt })),
    ...purchased.map((item) => ({ source: 'purchased', title: item.reward.title, code: item.code, status: item.status === 'active' && item.expiresAt < new Date() ? 'expired' : item.status, expiresAt: item.expiresAt, awardedAt: item.createdAt, id: item.id }))
  ];
}

module.exports = { RewardConflict, getMine, getWallet, listRewards, redeemReward };
