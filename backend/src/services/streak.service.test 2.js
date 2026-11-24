const assert = require('node:assert/strict');
const test = require('node:test');
const {
  calculateCurrentStreak,
  dateKeyToKolkataMidnight,
  getNextMilestone,
  getMyStreak,
} = require('./streak.service');

function approved(...createdAt) {
  return createdAt.map((date) => ({ status: 'approved', createdAt: new Date(date) }));
}

const now = new Date('2026-11-09T12:00:00.000Z'); // 17:30 in Kolkata, Nov 9.

test('no approved submissions gives zero and null last date', () => {
  assert.deepEqual(calculateCurrentStreak([], now), { currentStreak: 0, latestApprovedDate: null });
});

test('today, yesterday and consecutive approved days count', () => {
  assert.equal(calculateCurrentStreak(approved('2026-11-09T02:00:00Z'), now).currentStreak, 1);
  assert.equal(calculateCurrentStreak(approved('2026-11-08T02:00:00Z'), now).currentStreak, 1);
  assert.equal(calculateCurrentStreak(approved(
    '2026-11-07T02:00:00Z', '2026-11-08T02:00:00Z', '2026-11-09T02:00:00Z',
  ), now).currentStreak, 3);
});

test('duplicate days count once and gaps break the current streak', () => {
  assert.equal(calculateCurrentStreak(approved(
    '2026-11-08T02:00:00Z', '2026-11-09T02:00:00Z', '2026-11-09T16:00:00Z',
  ), now).currentStreak, 2);
  assert.equal(calculateCurrentStreak(approved(
    '2026-11-06T02:00:00Z', '2026-11-08T02:00:00Z', '2026-11-09T02:00:00Z',
  ), now).currentStreak, 2);
  assert.equal(calculateCurrentStreak(approved(
    '2026-11-05T02:00:00Z', '2026-11-06T02:00:00Z', '2026-11-07T02:00:00Z',
  ), now).currentStreak, 0);
});

test('dates use Asia/Kolkata across UTC midnight and Kolkata midnight', () => {
  assert.equal(calculateCurrentStreak(approved('2026-11-08T18:29:59.999Z'), now).latestApprovedDate, '2026-11-08');
  assert.equal(calculateCurrentStreak(approved('2026-11-08T18:30:00.000Z'), now).latestApprovedDate, '2026-11-09');
  assert.equal(calculateCurrentStreak(approved('2026-11-08T19:00:00.000Z'), now).currentStreak, 1);
});

test('month and year boundaries remain consecutive by calendar day', () => {
  const nov1 = new Date('2026-11-01T12:00:00Z');
  assert.equal(calculateCurrentStreak(approved('2026-10-31T08:00:00Z', '2026-11-01T08:00:00Z'), nov1).currentStreak, 2);
  const jan1 = new Date('2027-01-01T12:00:00Z');
  assert.equal(calculateCurrentStreak(approved('2026-12-31T08:00:00Z', '2027-01-01T08:00:00Z'), jan1).currentStreak, 2);
});

test('date conversion and malformed approved submission data are handled explicitly', () => {
  assert.equal(dateKeyToKolkataMidnight('2026-11-09').toISOString(), '2026-11-08T18:30:00.000Z');
  assert.throws(() => calculateCurrentStreak([{ status: 'pending', createdAt: now }], now), /incomplete or invalid/);
  assert.throws(() => calculateCurrentStreak([{ status: 'approved', createdAt: 'invalid' }], now), /invalid createdAt/);
});

test('milestone sequence and differences are correct', () => {
  for (const [streak, milestone, daysToNext] of [
    [0, 7, 7], [5, 7, 2], [7, 15, 8], [14, 15, 1], [15, 30, 15],
    [30, 60, 30], [31, 60, 29], [60, 120, 60], [61, 120, 59],
  ]) {
    assert.equal(getNextMilestone(streak), milestone);
    assert.equal(milestone - streak, daysToNext);
  }
});

test('streak recalculation is scoped to one user and synchronizes profile fields', async () => {
  const calls = [];
  const records = [
    ...approved('2026-11-08T18:29:59Z', '2026-11-09T02:00:00Z'),
    { status: 'pending', createdAt: new Date('2026-11-07T02:00:00Z') },
    { status: 'rejected', createdAt: new Date('2026-11-06T02:00:00Z') },
  ];
  const result = await getMyStreak({
    profile: {
      findUnique: async ({ where }) => { calls.push({ where }); return { id: where.id }; },
      update: async ({ where, data }) => { calls.push({ where, data }); return { id: where.id }; },
    },
    submission: {
      findMany: async ({ where }) => {
        calls.push({ where });
        return records.filter((record) => record.status === where.status);
      },
    },
  }, 'user-a', now);
  assert.deepEqual(result, { currentStreak: 2, lastStreakDate: '2026-11-09', nextMilestone: 7, daysToNext: 5 });
  assert.deepEqual(calls[0].where, { id: 'user-a' });
  assert.deepEqual(calls[1].where, { userId: 'user-a', status: 'approved' });
  assert.deepEqual(calls[2], {
    where: { id: 'user-a' },
    data: { currentStreak: 2, lastStreakDate: new Date('2026-11-08T18:30:00.000Z') },
  });
});

test('missing profile is reported safely without querying submissions', async () => {
  let queried = false;
  await assert.rejects(getMyStreak({
    profile: { findUnique: async () => null },
    submission: { findMany: async () => { queried = true; return []; } },
  }, 'missing-user', now), (error) => error.status === 404 && error.code === 'PROFILE_NOT_FOUND');
  assert.equal(queried, false);
});
