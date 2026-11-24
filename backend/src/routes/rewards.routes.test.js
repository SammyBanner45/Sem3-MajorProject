const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const test = require('node:test');
const { once } = require('node:events');
const { createApp } = require('../index');

process.env.JWT_SECRET = 'route-test-jwt-secret-with-more-than-32-bytes';
process.env.PASSWORD_PEPPER = 'route-test-password-pepper-with-more-than-32-bytes';

async function startApp(t, prisma) {
  const server = createApp({ prisma }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  return (path, token) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function makeToken(userId) {
  return jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, {
    algorithm: 'HS256', subject: userId, expiresIn: '7d',
  });
}

function couponsPrisma() {
  const users = new Set(['coupon-owner', 'other-user']);
  const ownedCoupons = new Map();
  const submissions = new Map();
  const start = new Date();
  submissions.set('coupon-owner', Array.from({ length: 7 }, (_, index) => ({
    status: 'approved', createdAt: new Date(start.getTime() - index * 86400000),
  })));
  submissions.set('other-user', []);
  const calls = { userLookup: [], submissionQueries: [], rewardQueries: [] };
  const prisma = {
    user: {
      findUnique: async ({ where }) => {
        calls.userLookup.push(where.id);
        return users.has(where.id) ? { id: where.id, role: 'USER' } : null;
      },
    },
    profile: {
      findUnique: async ({ where }) => ({ id: where.id }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    submission: {
      findMany: async ({ where }) => {
        calls.submissionQueries.push(where);
        return (submissions.get(where.userId) || []).filter((row) => row.status === where.status);
      },
    },
    coupon: { findFirst: async () => null },
    userCoupon: {
      findFirst: async ({ where }) => ownedCoupons.get(`${where.userId}:${where.milestoneDay}`) || null,
      create: async ({ data }) => {
        const row = {
          id: `reward-${ownedCoupons.size + 1}`,
          ...data,
          awardedAt: new Date('2026-11-09T00:00:00.000Z'),
          isRedeemed: false,
          coupon: null,
        };
        ownedCoupons.set(`${data.userId}:${data.milestoneDay}`, row);
        return row;
      },
      findMany: async ({ where }) => {
        calls.rewardQueries.push(where);
        return [...ownedCoupons.values()].filter((row) => row.userId === where.userId);
      },
    },
    $transaction: async (callback) => callback(prisma),
  };
  return { prisma, calls };
}

test('GET /api/coupons/me uses requireAuth, preserves its response contract, and isolates users', async (t) => {
  const fake = couponsPrisma();
  const request = await startApp(t, fake.prisma);

  assert.equal((await request('/api/coupons/me')).status, 401);
  assert.equal((await request('/api/coupons/me', 'not-a-valid-token')).status, 401);
  assert.deepEqual(fake.calls.userLookup, []);

  const ownerResponse = await request('/api/coupons/me', makeToken('coupon-owner'));
  assert.equal(ownerResponse.status, 200);
  const ownerData = await ownerResponse.json();
  assert.deepEqual(Object.keys(ownerData).sort(), ['coupons', 'currentStreak']);
  assert.equal(ownerData.currentStreak, 7);
  assert.equal(ownerData.coupons.length, 1);
  assert.deepEqual(Object.keys(ownerData.coupons[0]).sort(), [
    'awardedAt', 'code', 'description', 'discount', 'isRedeemed', 'milestoneDay', 'title',
  ]);
  assert.deepEqual(fake.calls.userLookup, ['coupon-owner']);
  assert.ok(fake.calls.submissionQueries.every((where) => where.userId === 'coupon-owner'));
  assert.ok(fake.calls.rewardQueries.every((where) => where.userId === 'coupon-owner'));

  const otherResponse = await request('/api/coupons/me', makeToken('other-user'));
  assert.equal(otherResponse.status, 200);
  const otherData = await otherResponse.json();
  assert.equal(otherData.currentStreak, 0);
  assert.deepEqual(otherData.coupons, []);
  assert.deepEqual(fake.calls.userLookup, ['coupon-owner', 'other-user']);
  assert.equal(fake.calls.rewardQueries.at(-1).userId, 'other-user');
});

test('GET /api/leaderboard uses requireAuth and preserves the private response contract', async (t) => {
  const calls = { userLookup: [], leaderboard: [] };
  const prisma = {
    user: {
      findUnique: async ({ where }) => {
        calls.userLookup.push(where.id);
        return where.id === 'leader-user' ? { id: where.id, role: 'USER' } : null;
      },
    },
    submission: {
      findMany: async (args) => {
        calls.leaderboard.push(args);
        return [{
          userId: 'private-user-id',
          status: 'approved',
          reviewedAt: new Date('2026-11-05T12:00:00.000Z'),
          task: { points: 25 },
          profile: { displayName: 'Eco Member', email: 'private@example.test' },
          passwordHash: 'must-not-be-returned',
        }];
      },
    },
  };
  const request = await startApp(t, prisma);

  assert.equal((await request('/api/leaderboard')).status, 401);
  assert.equal((await request('/api/leaderboard', 'not-a-valid-token')).status, 401);
  assert.deepEqual(calls.userLookup, []);
  assert.deepEqual(calls.leaderboard, []);

  const response = await request('/api/leaderboard', makeToken('leader-user'));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(Object.keys(data).sort(), ['leaders', 'period', 'winner']);
  assert.deepEqual(Object.keys(data.period).sort(), ['month', 'timeZone']);
  assert.equal(data.period.timeZone, 'Asia/Kolkata');
  assert.deepEqual(data.leaders, [{ rank: 1, displayName: 'Eco Member', points: 25 }]);
  assert.deepEqual(data.winner, { rank: 1, displayName: 'Eco Member', points: 25 });
  assert.deepEqual(calls.userLookup, ['leader-user']);
  assert.equal(calls.leaderboard.length, 1);
  assert.deepEqual(calls.leaderboard[0].where.status, 'approved');
  assert.ok(calls.leaderboard[0].where.reviewedAt.gte instanceof Date);
  assert.ok(calls.leaderboard[0].where.reviewedAt.lt instanceof Date);
  assert.deepEqual(calls.leaderboard[0].select, {
    userId: true,
    status: true,
    task: { select: { points: true } },
    profile: { select: { displayName: true } },
  });
});
