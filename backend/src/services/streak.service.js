const { HttpError } = require('../lib/httpError');

const TIME_ZONE = 'Asia/Kolkata';

function kolkataDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function moveDateKey(dayKey, offset) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function dateKeyToKolkataMidnight(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  // 00:00 Asia/Kolkata is 18:30 UTC on the previous day.
  return new Date(Date.UTC(year, month - 1, day) - (5.5 * 60 * 60 * 1000));
}

function calculateCurrentStreak(approvedSubmissions, now = new Date()) {
  if (!Array.isArray(approvedSubmissions)) {
    throw new TypeError('Approved submissions must be an array.');
  }
  const today = kolkataDateKey(now);
  if (!today) throw new TypeError('The current date is invalid.');

  const days = new Set();
  for (const submission of approvedSubmissions) {
    if (!submission || submission.status !== 'approved' || submission.createdAt == null) {
      throw new TypeError('Approved submission data is incomplete or invalid.');
    }
    const day = kolkataDateKey(submission.createdAt);
    if (!day) throw new TypeError('Approved submission has an invalid createdAt date.');
    days.add(day);
  }

  const latestApprovedDate = [...days].sort().at(-1) || null;
  let day = days.has(today) ? today : moveDateKey(today, -1);
  let currentStreak = 0;
  if (days.has(day)) {
    while (days.has(day)) {
      currentStreak += 1;
      day = moveDateKey(day, -1);
    }
  }

  // Walking from today or yesterday naturally returns zero for older activity.
  return { currentStreak, latestApprovedDate };
}

function getNextMilestone(currentStreak) {
  if (!Number.isInteger(currentStreak) || currentStreak < 0) {
    throw new TypeError('Current streak must be a non-negative integer.');
  }
  if (currentStreak < 7) return 7;
  if (currentStreak < 15) return 15;
  if (currentStreak < 30) return 30;
  return (Math.floor(currentStreak / 60) + 1) * 60;
}

async function getMyStreak(prisma, userId, now = new Date()) {
  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { id: true } });
  if (!profile) throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');

  const submissions = await prisma.submission.findMany({
    where: { userId, status: 'approved' },
    select: { status: true, createdAt: true },
  });
  const { currentStreak, latestApprovedDate } = calculateCurrentStreak(submissions, now);
  const lastStreakDate = latestApprovedDate ? dateKeyToKolkataMidnight(latestApprovedDate) : null;

  await prisma.profile.update({
    where: { id: userId },
    data: { currentStreak, lastStreakDate },
  });

  const nextMilestone = getNextMilestone(currentStreak);
  return {
    currentStreak,
    lastStreakDate: latestApprovedDate,
    nextMilestone,
    daysToNext: nextMilestone - currentStreak,
  };
}

module.exports = {
  TIME_ZONE,
  kolkataDateKey,
  moveDateKey,
  dateKeyToKolkataMidnight,
  calculateCurrentStreak,
  getNextMilestone,
  getMyStreak,
};
