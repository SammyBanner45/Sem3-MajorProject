function kolkataDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function moveDay(dayKey, amount) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function countCurrentStreak(approvedActivityDates, now = new Date()) {
  const days = new Set(approvedActivityDates.map(kolkataDayKey).filter(Boolean));
  const today = kolkataDayKey(now);
  if (!today) return 0;

  // A streak from yesterday remains current until the current local day ends.
  let day = days.has(today) ? today : moveDay(today, -1);
  if (!days.has(day)) return 0;

  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = moveDay(day, -1);
  }
  return streak;
}

export function summarizeSubmissions(submissions, now) {
  if (!Array.isArray(submissions)) throw new Error('Submission history has an unexpected response format.');
  const approved = submissions.filter((submission) => submission?.status === 'approved');
  const totalPoints = approved.reduce((total, submission) => {
    const points = Number(submission.points);
    return total + (Number.isFinite(points) ? points : 0);
  }, 0);
  const activityDates = approved
    .filter((submission) => submission.taskType === 'activity')
    .map((submission) => submission.date || submission.createdAt)
    .filter(Boolean);

  return {
    totalPoints,
    currentStreak: countCurrentStreak(activityDates, now),
  };
}
