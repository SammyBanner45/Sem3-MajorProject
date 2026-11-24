const prisma = require('../lib/prisma');
const { getMine, getWallet, listRewards, redeemReward } = require('../services/rewards.service');

async function list(req, res, next) { try { return res.json(await listRewards(req.user.id, prisma)); } catch (error) { return next(error); } }
async function redeem(req, res, next) { try { return res.status(201).json(await redeemReward(req.user.id, req.params.id, prisma)); } catch (error) { return next(error); } }
async function mine(req, res, next) { try { return res.json(await getMine(req.user.id, prisma)); } catch (error) { return next(error); } }
async function wallet(req, res, next) { try { return res.json(await getWallet(req.user.id, prisma)); } catch (error) { return next(error); } }
async function use(req, res, next) {
  try {
    const result = await prisma.redemption.updateMany({ where: { id: req.params.id, userId: req.user.id, status: 'active' }, data: { status: 'used' } });
    if (!result.count) return res.status(404).json({ error: 'Active purchased coupon not found' });
    return res.json({ status: 'used' });
  } catch (error) { return next(error); }
}

module.exports = { list, mine, redeem, use, wallet };
