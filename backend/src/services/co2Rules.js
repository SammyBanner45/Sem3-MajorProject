const KOLKATA_OFFSET = '+05:30';
const DAILY_POINTS_CAP = 5;
const MAX_TRAVEL_LOGS_PER_DAY = 10;

function kolkataDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function kolkataDayBounds(date = new Date()) {
  const key = kolkataDateKey(date);
  const start = new Date(`${key}T00:00:00${KOLKATA_OFFSET}`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function kolkataMonthBounds(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit'
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const start = new Date(`${parts.year}-${parts.month}-01T00:00:00${KOLKATA_OFFSET}`);
  const nextMonth = new Date(Date.UTC(Number(parts.year), Number(parts.month), 1));
  const nextYear = nextMonth.getUTCFullYear();
  const nextMonthNumber = String(nextMonth.getUTCMonth() + 1).padStart(2, '0');
  return { start, end: new Date(`${nextYear}-${nextMonthNumber}-01T00:00:00${KOLKATA_OFFSET}`) };
}

function kolkataMonthKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}`;
}

function remainingDailyPoints(earnedToday) {
  if (typeof earnedToday !== 'number' || !Number.isFinite(earnedToday) || earnedToday < 0) {
    throw new TypeError('earnedToday must be a non-negative finite number');
  }
  return Math.max(0, DAILY_POINTS_CAP - earnedToday);
}

function awardWithinDailyCap(requestedPoints, earnedToday) {
  if (typeof requestedPoints !== 'number' || !Number.isFinite(requestedPoints) || requestedPoints < 0) {
    throw new TypeError('requestedPoints must be a non-negative finite number');
  }
  const award = Math.min(requestedPoints, remainingDailyPoints(earnedToday));
  return { pointsEarned: award, capReached: award < requestedPoints };
}

function foodPoints(isVeg, nudges) {
  if (typeof isVeg !== 'boolean') throw new TypeError('isVeg must be a boolean');
  if (!Array.isArray(nudges) || nudges.some((nudge) => typeof nudge !== 'string')) throw new TypeError('nudges must be an array of strings');
  return (isVeg ? 0.3 : 0) + nudges.length * 0.2;
}

function isDuplicateTrip(trips, trip) {
  if (!Array.isArray(trips)) throw new TypeError('trips must be an array');
  return trips.some((candidate) => candidate.details?.origin === trip.origin
    && candidate.details?.destination === trip.destination
    && (candidate.details?.chosenVehicle || candidate.details?.vehicle) === trip.chosenVehicle);
}

function canAddTravelLog(travelLogCount) {
  return Number.isInteger(travelLogCount) && travelLogCount < MAX_TRAVEL_LOGS_PER_DAY;
}

module.exports = { DAILY_POINTS_CAP, MAX_TRAVEL_LOGS_PER_DAY, awardWithinDailyCap, canAddTravelLog, foodPoints, isDuplicateTrip, kolkataDateKey, kolkataDayBounds, kolkataMonthBounds, kolkataMonthKey, remainingDailyPoints };
