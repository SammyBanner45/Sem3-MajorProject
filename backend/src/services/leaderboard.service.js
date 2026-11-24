const TIME_ZONE = 'Asia/Kolkata';

function getKolkataMonthRange(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) throw new TypeError('The current date is invalid.');

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const startAt = new Date(Date.UTC(year, month - 1, 1) - (5.5 * 60 * 60 * 1000));
  const endAt = new Date(Date.UTC(year, month, 1) - (5.5 * 60 * 60 * 1000));

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    startAt,
    endAt,
  };
}

function compareNames(left, right) {
  const byNormalizedName = left.displayName.localeCompare(right.displayName, 'en', { sensitivity: 'base' });
  if (byNormalizedName !== 0) return byNormalizedName;
  const byExactName = left.displayName.localeCompare(right.displayName, 'en');
  if (byExactName !== 0) return byExactName;
  return left.userId.localeCompare(right.userId);
}

function rankSubmissions(submissions) {
  const totals = new Map();
  for (const submission of submissions) {
    if (submission.status !== 'approved' || !submission.profile || !submission.task) continue;
    const existing = totals.get(submission.userId);
    if (existing) {
      existing.points += submission.task.points;
    } else {
      totals.set(submission.userId, {
        userId: submission.userId,
        displayName: submission.profile.displayName,
        points: submission.task.points,
      });
    }
  }

  return [...totals.values()]
    .sort((left, right) => right.points - left.points || compareNames(left, right))
    .map((entry, index) => ({ rank: index + 1, displayName: entry.displayName, points: entry.points }));
}

async function getMonthlyLeaderboard(prisma, now = new Date()) {
  const range = getKolkataMonthRange(now);
  const submissions = await prisma.submission.findMany({
    where: {
      status: 'approved',
      // Approved legacy rows with null reviewedAt are intentionally excluded:
      // their approval month cannot be established reliably.
      reviewedAt: { gte: range.startAt, lt: range.endAt },
    },
    select: {
      userId: true,
      status: true,
      task: { select: { points: true } },
      profile: { select: { displayName: true } },
    },
  });
  const leaders = rankSubmissions(submissions);

  return {
    period: { month: range.month, timeZone: TIME_ZONE },
    leaders,
    winner: leaders[0] || null,
  };
}

module.exports = { TIME_ZONE, getKolkataMonthRange, rankSubmissions, getMonthlyLeaderboard };
