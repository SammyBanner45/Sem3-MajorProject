const assert = require('node:assert/strict');
const test = require('node:test');
const {
  awardHistoricalMilestonesInTransaction,
  awardMilestone,
  getEligibleMilestones,
  getHistoricalMilestones,
  getMyCoupons,
} = require('./coupons.service');

function sevenDayStreak(now) {
  return Array.from({ length: 7 }, (_value, index) => ({
    status: 'approved',
    createdAt: new Date(now.getTime() - index * 24 * 60 * 60 * 1000),
  }));
}

function createPrisma({ submissions, templates = [] } = {}) {
  const userCoupons = new Map();
  const queries = [];
  let createCount = 0;
  let isolationLevel;
  let submissionRows = submissions || [];
  const keyFor = (id, milestoneDay) => `${id}:${milestoneDay}`;
  const couponMap = new Map(templates.map((coupon) => [coupon.id, coupon]));

  function withCoupon(record) {
    if (!record) return null;
    return { ...record, coupon: record.couponId ? couponMap.get(record.couponId) || null : null };
  }

  const prisma = {
    profile: {
      findUnique: async ({ where }) => ({ id: where.id }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    submission: {
      findMany: async ({ where }) => {
        queries.push({ type: 'submissions', where });
        return submissionRows.filter((submission) => !where.status || submission.status === where.status);
      },
    },
    coupon: {
      findFirst: async ({ where }) => templates.find((item) =>
        item.milestoneDays === where.milestoneDays &&
        (where.isRecurring === undefined || item.isRecurring === where.isRecurring)) || null,
    },
    userCoupon: {
      findFirst: async ({ where }) => {
        queries.push({ type: 'coupon', where });
        return withCoupon(userCoupons.get(keyFor(where.userId, where.milestoneDay)));
      },
      findMany: async ({ where }) => {
        queries.push({ type: 'list', where });
        return [...userCoupons.values()]
          .filter((coupon) => coupon.userId === where.userId)
          .sort((left, right) => left.milestoneDay - right.milestoneDay)
          .map(withCoupon);
      },
      create: async ({ data }) => {
        createCount += 1;
        const record = {
          id: `coupon-${createCount}`,
          ...data,
          awardedAt: new Date('2026-05-20T10:00:00.000Z'),
          isRedeemed: false,
        };
        userCoupons.set(keyFor(data.userId, data.milestoneDay), record);
        return withCoupon(record);
      },
    },
    $transaction: async (callback, options) => {
      isolationLevel = options?.isolationLevel;
      return callback(prisma);
    },
  };

  return {
    prisma, userCoupons, queries,
    setSubmissions(rows) { submissionRows = rows; },
    get createCount() { return createCount; },
    get isolationLevel() { return isolationLevel; },
  };
}

test('coupon milestones include 7, 15, 30, and recurring 60-day intervals', () => {
  assert.deepEqual(getEligibleMilestones(6), []);
  assert.deepEqual(getEligibleMilestones(7), [7]);
  assert.deepEqual(getEligibleMilestones(29), [7, 15]);
  assert.deepEqual(getEligibleMilestones(30), [7, 15, 30]);
  assert.deepEqual(getEligibleMilestones(120), [7, 15, 30, 60, 120]);
  assert.throws(() => getEligibleMilestones(-1), /non-negative integer/);
});

test('eligible coupons are awarded once, linked to a template, and scoped to the requester', async () => {
  const now = new Date('2026-05-20T10:00:00.000Z');
  const templates = [{
    id: 'coupon-template-7', title: 'Seven day reward', description: 'Demo', discount: '10% demo',
    milestoneDays: 7, isRecurring: false,
  }];
  const fake = createPrisma({ submissions: sevenDayStreak(now), templates });
  let nextCode = 1;
  const options = { now, codeFactory: () => `ECO-TEST-${nextCode++}` };

  const first = await getMyCoupons(fake.prisma, 'user-a', options);
  const second = await getMyCoupons(fake.prisma, 'user-a', options);

  assert.equal(fake.createCount, 1);
  assert.equal(fake.isolationLevel, 'Serializable');
  assert.deepEqual(first.coupons.map((coupon) => coupon.milestoneDay), [7]);
  assert.deepEqual(second.coupons.map((coupon) => coupon.code), ['ECO-TEST-1']);
  assert.equal(first.coupons[0].title, 'Seven day reward');
  assert.equal(fake.userCoupons.get('user-a:7').userId, 'user-a');
  assert.ok(fake.queries.filter((query) => query.type === 'coupon').every((query) => query.where.userId === 'user-a'));
  assert.ok(fake.queries.filter((query) => query.type === 'list').every((query) => query.where.userId === 'user-a'));
});

test('recurring milestone awards use a recurring catalog coupon when available', async () => {
  const now = new Date('2026-05-20T10:00:00.000Z');
  const submissions = Array.from({ length: 60 }, (_value, index) => ({
    status: 'approved', createdAt: new Date(now.getTime() - index * 24 * 60 * 60 * 1000),
  }));
  const template = {
    id: 'recurring-60', title: 'Recurring reward', description: 'Every 60 days', discount: 'Demo only',
    milestoneDays: 60, isRecurring: true,
  };
  const fake = createPrisma({ submissions, templates: [template] });
  let nextCode = 1;

  const result = await getMyCoupons(fake.prisma, 'user-a', {
    now,
    codeFactory: () => `ECO-TEST-${nextCode++}`,
  });

  assert.deepEqual(result.coupons.map((coupon) => coupon.milestoneDay), [7, 15, 30, 60]);
  assert.equal(fake.userCoupons.get('user-a:60').couponId, 'recurring-60');
  assert.equal(result.coupons.at(-1).title, 'Recurring reward');
});

test('coupon list response contains only the authenticated user’s rewards', async () => {
  const now = new Date('2026-05-20T10:00:00.000Z');
  const fake = createPrisma({ submissions: sevenDayStreak(now) });
  await getMyCoupons(fake.prisma, 'user-a', { now, codeFactory: () => 'ECO-A' });
  await getMyCoupons(fake.prisma, 'user-b', { now, codeFactory: () => 'ECO-B' });

  const own = await fake.prisma.userCoupon.findMany({ where: { userId: 'user-a' } });
  assert.deepEqual(own.map((coupon) => coupon.code), ['ECO-A']);
  assert.ok(own.every((coupon) => coupon.userId === 'user-a'));
});

test('day-seven reward persists after the user later loses the streak', async () => {
  const milestoneDay = new Date('2026-04-07T10:00:00.000Z');
  const laterDay = new Date('2026-05-20T10:00:00.000Z');
  const earnedWeek = Array.from({ length: 7 }, (_, index) => ({
    status: 'approved', createdAt: new Date('2026-04-01T08:00:00.000Z').getTime() + index * 86400000,
  }));
  const fake = createPrisma({ submissions: earnedWeek });
  const first = await getMyCoupons(fake.prisma, 'user-a', { now: milestoneDay, codeFactory: () => 'ECO-PERSISTENT-7' });
  fake.setSubmissions([...earnedWeek, { status: 'approved', createdAt: new Date('2026-05-20T08:00:00.000Z') }]);
  const later = await getMyCoupons(fake.prisma, 'user-a', { now: laterDay, codeFactory: () => 'ECO-PERSISTENT-7' });

  assert.equal(first.currentStreak, 7);
  assert.equal(later.currentStreak, 1);
  assert.deepEqual(later.coupons.map(({ milestoneDay, code }) => ({ milestoneDay, code })), [
    { milestoneDay: 7, code: 'ECO-PERSISTENT-7' },
  ]);
});

test('delayed approval backfills milestones from historical approved submission dates', async () => {
  const dates = Array.from({ length: 7 }, (_, index) => ({
    status: 'pending', createdAt: new Date(Date.UTC(2026, 0, 1 + index, 12)),
  }));
  assert.deepEqual(getHistoricalMilestones(dates.map(({ createdAt }) => ({ createdAt }))), [7]);
  const fake = createPrisma({ submissions: dates });
  await fake.prisma.$transaction((tx) => awardHistoricalMilestonesInTransaction(tx, 'user-a', () => 'ECO-DELAYED-7'));
  // The no-row transaction above establishes that pending rows cannot earn rewards.
  assert.equal(fake.createCount, 0);
  fake.setSubmissions(dates.map((row) => ({ ...row, status: 'approved' })));
  await fake.prisma.$transaction((tx) => awardHistoricalMilestonesInTransaction(tx, 'user-a', () => 'ECO-DELAYED-7'));
  assert.equal(fake.userCoupons.get('user-a:7').code, 'ECO-DELAYED-7');
});

test('pending and rejected submissions never qualify for historical coupon milestones', async () => {
  const rows = Array.from({ length: 7 }, (_, index) => ({
    status: index === 6 ? 'rejected' : 'pending',
    createdAt: new Date(Date.UTC(2026, 0, 1 + index, 12)),
  }));
  const fake = createPrisma({ submissions: rows });
  await fake.prisma.$transaction((tx) => awardHistoricalMilestonesInTransaction(tx, 'user-a'));
  assert.equal(fake.createCount, 0);
});

test('repeated historical approval processing does not duplicate a milestone', async () => {
  const now = new Date('2026-05-20T10:00:00.000Z');
  const rows = sevenDayStreak(now);
  const fake = createPrisma({ submissions: rows });
  await fake.prisma.$transaction((tx) => awardHistoricalMilestonesInTransaction(tx, 'user-a', () => 'ECO-ONCE'));
  await fake.prisma.$transaction((tx) => awardHistoricalMilestonesInTransaction(tx, 'user-a', () => 'ECO-TWICE'));
  assert.equal(fake.createCount, 1);
  assert.equal(fake.userCoupons.get('user-a:7').code, 'ECO-ONCE');
});

test('concurrent award attempts return the same persisted milestone reward', async () => {
  const records = new Map();
  let waiting = 0;
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  const tx = {
    userCoupon: {
      findFirst: async ({ where }) => records.get(`${where.userId}:${where.milestoneDay}`) || null,
      create: async ({ data }) => {
        waiting += 1;
        if (waiting === 2) release();
        await barrier;
        const key = `${data.userId}:${data.milestoneDay}`;
        if (records.has(key)) {
          const error = new Error('Serializable conflict');
          error.code = 'P2034';
          throw error;
        }
        const record = { ...data, coupon: null };
        records.set(key, record);
        return record;
      },
    },
    coupon: { findFirst: async () => null },
  };
  const prisma = {
    $transaction: async (callback) => callback(tx),
    userCoupon: { findFirst: async ({ where }) => records.get(`${where.userId}:${where.milestoneDay}`) || null },
  };

  const [left, right] = await Promise.all([
    awardMilestone(prisma, 'user-a', 7, () => 'ECO-CONCURRENT-A'),
    awardMilestone(prisma, 'user-a', 7, () => 'ECO-CONCURRENT-B'),
  ]);
  assert.equal(records.size, 1);
  assert.equal(left.code, right.code);
});

test('serialization conflicts are retried before awarding a milestone', async () => {
  const fake = createPrisma();
  const originalTransaction = fake.prisma.$transaction;
  let attempts = 0;
  fake.prisma.$transaction = async (...args) => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('serialization conflict');
      error.code = 'P2034';
      throw error;
    }
    return originalTransaction(...args);
  };

  const reward = await awardMilestone(fake.prisma, 'user-a', 7, () => 'ECO-RETRIED');
  assert.equal(attempts, 2);
  assert.equal(reward.code, 'ECO-RETRIED');
});
