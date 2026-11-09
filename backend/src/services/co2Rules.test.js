const assert = require('node:assert/strict');
const test = require('node:test');

const { awardWithinDailyCap, canAddTravelLog, foodPoints, isDuplicateTrip, kolkataDateKey, remainingDailyPoints } = require('./co2Rules');

test('daily points are capped at five and only the remainder is awarded', () => {
  assert.deepEqual(awardWithinDailyCap(1.4, 4), { pointsEarned: 1, capReached: true });
  assert.deepEqual(awardWithinDailyCap(0.4, 4), { pointsEarned: 0.4, capReached: false });
  assert.equal(remainingDailyPoints(5), 0);
});

test('food points combine the veg base and accepted nudges', () => {
  assert.equal(foodPoints(true, ['cutlery', 'combine']), 0.7);
  assert.equal(foodPoints(false, ['cutlery']), 0.2);
});

test('daily boundaries use Asia/Kolkata date keys', () => {
  assert.equal(kolkataDateKey(new Date('2026-11-09T19:00:00.000Z')), '2026-11-10');
});

test('duplicate trips are blocked and the tenth travel log is the limit', () => {
  const trip = { origin: 'A', destination: 'B', chosenVehicle: 'bus' };
  assert.equal(isDuplicateTrip([{ details: { origin: 'A', destination: 'B', chosenVehicle: 'bus' } }], trip), true);
  assert.equal(isDuplicateTrip([{ details: { origin: 'A', destination: 'C', chosenVehicle: 'bus' } }], trip), false);
  assert.equal(canAddTravelLog(9), true);
  assert.equal(canAddTravelLog(10), false);
});
