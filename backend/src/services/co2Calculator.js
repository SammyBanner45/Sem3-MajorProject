const factors = require('../../../frontend/src/data/emissionFactors.json');

function assertNonNegativeNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative finite number`);
  }
}

function calculateTravel(distanceKm, vehicle) {
  assertNonNegativeNumber(distanceKm, 'distanceKm');

  const factor = factors.travel[vehicle];
  if (!factor) {
    throw new RangeError(`Unknown travel vehicle: ${vehicle}`);
  }

  return distanceKm * factor.value;
}

function calculateFood({ items, isVeg, deliveryKm = 0, packaging = false }) {
  const itemCount = Array.isArray(items) ? items.length : items;
  assertNonNegativeNumber(itemCount, 'items');
  if (!Number.isInteger(itemCount)) {
    throw new TypeError('items must be a non-negative integer or an array');
  }
  if (typeof isVeg !== 'boolean') {
    throw new TypeError('isVeg must be a boolean');
  }
  assertNonNegativeNumber(deliveryKm, 'deliveryKm');
  if (typeof packaging !== 'boolean') {
    throw new TypeError('packaging must be a boolean');
  }

  const itemFactor = isVeg ? factors.food.vegItem : factors.food.nonVegItem;
  const deliveryEmissions = deliveryKm * factors.food.deliveryVehicle.value;
  const packagingEmissions = packaging ? factors.food.packaging.value : 0;

  return itemCount * itemFactor.value + deliveryEmissions + packagingEmissions;
}

module.exports = { calculateTravel, calculateFood };
