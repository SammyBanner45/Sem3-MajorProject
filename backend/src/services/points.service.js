const { kolkataMonthBounds, kolkataMonthKey } = require('./co2Rules');

const MONTH_TARGET = 30;

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

async function readPointData(userId, client) {
  const [submissions, logs, redemptions] = await Promise.all([
    client.submission.findMany({ where: { userId, status: 'approved' }, include: { task: true }, orderBy: { createdAt: 'desc' } }),
    client.co2Log.findMany({ where: { userId, status: 'logged' }, orderBy: { createdAt: 'desc' } }),
    client.redemption.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  ]);
  return { submissions, logs, redemptions };
}

function calculateTotals({ submissions, logs, redemptions }) {
  const earned = sum(submissions.map((submission) => submission.task?.points)) + sum(logs.map((log) => log.pointsEarned));
  const spent = sum(redemptions.map((redemption) => redemption.cost));
  return { earned, spent, balance: earned - spent };
}

async function getPointsSummary(userId, client) {
  const data = await readPointData(userId, client);
  const { start, end } = kolkataMonthBounds();
  const monthSubmissions = data.submissions.filter((item) => item.createdAt >= start && item.createdAt < end);
  const monthLogs = data.logs.filter((item) => item.createdAt >= start && item.createdAt < end);
  const totals = calculateTotals(data);
  const monthEarned = sum(monthSubmissions.map((item) => item.task?.points)) + sum(monthLogs.map((item) => item.pointsEarned));
  return {
    earned: totals.earned,
    spent: totals.spent,
    balance: totals.balance,
    monthEarned,
    monthTarget: MONTH_TARGET,
    totalEmittedKg: sum(data.logs.map((item) => item.co2Kg)),
    monthEmittedKg: sum(monthLogs.map((item) => item.co2Kg)),
    savedKg: totals.earned
  };
}

async function getPointsHistory(userId, months, client) {
  const count = Math.min(Math.max(Number(months) || 6, 1), 24);
  const data = await readPointData(userId, client);
  const [currentYear, currentMonth] = kolkataMonthKey(new Date()).split('-').map(Number);
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(Date.UTC(currentYear, currentMonth - 1 - index, 1));
    const key = kolkataMonthKey(date);
    const savedKg = sum(data.submissions.filter((item) => kolkataMonthKey(item.createdAt) === key).map((item) => item.task?.points)) + sum(data.logs.filter((item) => kolkataMonthKey(item.createdAt) === key).map((item) => item.pointsEarned));
    const emittedKg = sum(data.logs.filter((item) => kolkataMonthKey(item.createdAt) === key).map((item) => item.co2Kg));
    rows.push({ month: key, savedKg, emittedKg });
  }
  return rows;
}

async function getPointsLedger(userId, limit, client) {
  const data = await readPointData(userId, client);
  const entries = [
    ...data.submissions.map((item) => ({ date: item.createdAt, description: `Approved task: ${item.task?.title || 'Activity'}`, amount: Number(item.task?.points || 0), source: 'task' })),
    ...data.logs.map((item) => ({ date: item.loggedAt || item.createdAt, description: `${item.type === 'travel' ? 'Travel' : 'Food'} CO₂ estimate`, amount: Number(item.pointsEarned || 0), source: 'co2' })),
    ...data.redemptions.map((item) => ({ date: item.createdAt, description: 'Reward redemption', amount: -Number(item.cost || 0), source: 'redemption' }))
  ];
  return entries.sort((first, second) => new Date(second.date) - new Date(first.date)).slice(0, Math.min(Math.max(Number(limit) || 30, 1), 100));
}

module.exports = { MONTH_TARGET, calculateTotals, getPointsHistory, getPointsLedger, getPointsSummary, readPointData };
