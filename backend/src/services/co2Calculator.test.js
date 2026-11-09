const assert = require('node:assert/strict');
const test = require('node:test');

const factors = require('../../../frontend/src/data/emissionFactors.json');
const { calculateFood, calculateSavings, calculateTravel } = require('./co2Calculator');

const vehicles = ['walk', 'bicycle', 'motorbike', 'auto_rickshaw', 'cab_petrol', 'cab_ev', 'bus', 'metro'];

test('every travel vehicle has a finite factor and only walk/bicycle are zero', () => {
  for (const vehicle of vehicles) assert.equal(Number.isNaN(factors.travel[vehicle].value), false);
  assert.deepEqual(vehicles.filter((vehicle) => factors.travel[vehicle].value === 0), ['walk', 'bicycle']);
});

test('calculateSavings uses cab_petrol as baseline', () => {
  const result = calculateSavings('bus', 10);
  assert.ok(Math.abs(result.co2Kg - 0.89) < Number.EPSILON);
  assert.equal(result.baselineKg, 1.92);
  assert.equal(result.savedKg, 1.03);
  assert.equal(result.points, 1.03);
});

test('only bus, metro and cab_ev earn travel points', () => {
  for (const vehicle of vehicles) {
    const result = calculateSavings(vehicle, 10);
    if (['bus', 'metro', 'cab_ev'].includes(vehicle)) assert.equal(result.points, result.savedKg);
    else assert.equal(result.points, 0);
  }
});

test('savings never become negative', () => {
  assert.equal(calculateSavings('cab_petrol', 10).savedKg, 0);
  assert.equal(calculateSavings('motorbike', 10).savedKg > 0, true);
});

test('unknown travel vehicles throw', () => {
  assert.throws(() => calculateSavings('spaceship', 10), /Unknown travel vehicle/);
});

test('legacy travel calculation and food calculation remain available', () => {
  assert.ok(Math.abs(calculateTravel(10, 'bus') - 0.89) < Number.EPSILON);
  assert.equal(calculateFood({ items: 2, isVeg: true, deliveryKm: 5, packaging: true }), 2.46);
});
