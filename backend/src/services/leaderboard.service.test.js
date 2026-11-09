const assert = require('node:assert/strict');
const test = require('node:test');
const { getKolkataMonthRange, getMonthlyLeaderboard, rankSubmissions } = require('./leaderboard.service');

test('current month range follows Asia/Kolkata across the UTC month boundary', () => {
  const range = getKolkataMonthRange(new Date('2026-03-31T19:00:00.000Z'));
  assert.equal(range.month, '2026-04');
  assert.equal(range.startAt.toISOString(), '2026-03-31T18:30:00.000Z');
  assert.equal(range.endAt.toISOString(), '2026-04-30T18:30:00.000Z');
});

test('approved points are summed and equal scores rank deterministically by display name', () => {
  const ranked = rankSubmissions([
    { userId: 'private-a', status: 'approved', task: { points: 10 }, profile: { displayName: 'Zara' } },
    { userId: 'private-b', status: 'approved', task: { points: 15 }, profile: { displayName: 'Asha' } },
    { userId: 'private-a', status: 'approved', task: { points: 5 }, profile: { displayName: 'Zara' } },
    { userId: 'private-c', status: 'pending', task: { points: 99 }, profile: { displayName: 'Pending' } },
    { userId: 'private-d', status: 'rejected', task: { points: 100 }, profile: { displayName: 'Rejected' } },
  ]);

  assert.deepEqual(ranked, [
    { rank: 1, displayName: 'Asha', points: 15 },
    { rank: 2, displayName: 'Zara', points: 15 },
  ]);
  assert.ok(ranked.every((entry) => !Object.hasOwn(entry, 'userId')));
});

test('identical display names and equal points use the private user id as a stable final tie-breaker', () => {
  const ranked = rankSubmissions([
    { userId: 'z-user', status: 'approved', task: { points: 25 }, profile: { displayName: 'Alex' } },
    { userId: 'a-user', status: 'approved', task: { points: 25 }, profile: { displayName: 'Alex' } },
  ]);
  assert.deepEqual(ranked, [
    { rank: 1, displayName: 'Alex', points: 25 },
    { rank: 2, displayName: 'Alex', points: 25 },
  ]);
});

test('monthly leaderboard filters to approved records inside the Kolkata month and hides identifiers', async () => {
  const now = new Date('2026-03-31T19:00:00.000Z');
  const range = getKolkataMonthRange(now);
  const rows = [
    { userId: 'before', status: 'approved', createdAt: new Date(range.startAt.getTime() - 86400000), reviewedAt: new Date(range.startAt.getTime() - 1), task: { points: 100 }, profile: { displayName: 'Before' } },
    { userId: 'user-a', status: 'approved', createdAt: new Date(range.startAt.getTime() - 86400000), reviewedAt: range.startAt, task: { points: 10 }, profile: { displayName: 'Asha' } },
    { userId: 'user-b', status: 'approved', createdAt: new Date(range.startAt.getTime() - 86400000), reviewedAt: new Date(range.endAt.getTime() - 1), task: { points: 15 }, profile: { displayName: 'Balu' } },
    { userId: 'pending', status: 'pending', createdAt: now, reviewedAt: now, task: { points: 200 }, profile: { displayName: 'Pending' } },
    { userId: 'rejected', status: 'rejected', createdAt: now, reviewedAt: now, task: { points: 400 }, profile: { displayName: 'Rejected' } },
    { userId: 'legacy-null', status: 'approved', createdAt: now, reviewedAt: null, task: { points: 500 }, profile: { displayName: 'Legacy Null' } },
    { userId: 'end', status: 'approved', createdAt: now, reviewedAt: range.endAt, task: { points: 300 }, profile: { displayName: 'End' } },
  ];
  let query;
  const prisma = {
    submission: {
      findMany: async (args) => {
        query = args;
        const { gte, lt } = args.where.reviewedAt;
        return rows.filter((row) => row.status === args.where.status && row.reviewedAt && row.reviewedAt >= gte && row.reviewedAt < lt);
      },
    },
  };

  const result = await getMonthlyLeaderboard(prisma, now);

  assert.equal(query.where.status, 'approved');
  assert.equal(query.where.reviewedAt.gte.toISOString(), '2026-03-31T18:30:00.000Z');
  assert.equal(query.where.reviewedAt.lt.toISOString(), '2026-04-30T18:30:00.000Z');
  assert.equal(result.period.month, '2026-04');
  assert.deepEqual(result.leaders, [
    { rank: 1, displayName: 'Balu', points: 15 },
    { rank: 2, displayName: 'Asha', points: 10 },
  ]);
  assert.deepEqual(result.winner, { rank: 1, displayName: 'Balu', points: 15 });
  assert.ok(result.leaders.every((entry) => Object.keys(entry).sort().join(',') === 'displayName,points,rank'));
});

test('approval in the current month earns current-month points even when submission was created earlier', async () => {
  const now = new Date('2026-04-01T00:00:00.000Z');
  let query;
  const prisma = {
    submission: {
      findMany: async (args) => {
        query = args;
        return [{
          userId: 'user-a', status: 'approved',
          createdAt: new Date('2026-03-31T18:29:59.000Z'),
          reviewedAt: new Date('2026-03-31T18:30:00.000Z'),
          task: { points: 10 }, profile: { displayName: 'Asha' },
        }];
      },
    },
  };

  const result = await getMonthlyLeaderboard(prisma, now);
  assert.equal(query.where.reviewedAt.gte.toISOString(), '2026-03-31T18:30:00.000Z');
  assert.equal(result.leaders[0].points, 10);
});

test('approved rows with null reviewedAt are excluded from the leaderboard query', async () => {
  let query;
  const prisma = { submission: { findMany: async (args) => { query = args; return []; } } };
  await getMonthlyLeaderboard(prisma, new Date('2026-04-15T00:00:00.000Z'));
  assert.deepEqual(query.where.reviewedAt, {
    gte: new Date('2026-03-31T18:30:00.000Z'),
    lt: new Date('2026-04-30T18:30:00.000Z'),
  });
});

test('empty monthly leaderboard has no winner', async () => {
  const result = await getMonthlyLeaderboard({ submission: { findMany: async () => [] } }, new Date('2026-01-01T00:00:00Z'));
  assert.deepEqual(result.leaders, []);
  assert.equal(result.winner, null);
});
