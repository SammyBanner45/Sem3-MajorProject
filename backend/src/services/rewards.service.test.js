const assert = require('node:assert/strict');
const test = require('node:test');

const { getWallet } = require('./rewards.service');

test('wallet merges streak and purchased coupons with their source', async () => {
  const client = {
    redemption: { findMany: async () => [{ id: 'r1', code: 'ECO-AAAA-BBBB', status: 'active', expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(), reward: { title: 'Jute bag' } }] },
    userCoupon: { findMany: async () => [{ code: 'STREAK-1', isRedeemed: false, awardedAt: new Date(), coupon: { title: 'Streak coupon' } }] }
  };
  const wallet = await getWallet('user-id', client);
  assert.deepEqual(wallet.map((item) => item.source), ['streak', 'purchased']);
});
