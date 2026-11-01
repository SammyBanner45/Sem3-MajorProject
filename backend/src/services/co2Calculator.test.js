const assert = require('node:assert/strict');
const test = require('node:test');

const { calculateFood, calculateTravel } = require('./co2Calculator');

test('calculateTravel uses the selected vehicle factor', () => {
  assert.ok(Math.abs(calculateTravel(10, 'bus') - 0.89) < Number.EPSILON);
});

test('calculateTravel rejects unsupported vehicles', () => {
  assert.throws(() => calculateTravel(10, 'spaceship'), /Unknown travel vehicle/);
});

test('calculateFood combines items, delivery, and packaging emissions', () => {
  assert.equal(calculateFood({
    items: 2,
    isVeg: true,
    deliveryKm: 5,
    packaging: true
  }), 2.46);
});

test('calculateFood supports item arrays and omits optional additions', () => {
  assert.equal(calculateFood({ items: ['dal', 'rice'], isVeg: true }), 1.4);
});
