const assert = require('node:assert/strict');
const test = require('node:test');

const { calculateTotals, getPointsHistory } = require('./points.service');

test('points totals keep earned separate from spent and derive balance', () => {
  assert.deepEqual(calculateTotals({
    submissions: [{ task: { points: 4 } }],
    logs: [{ pointsEarned: 1.25 }],
    redemptions: [{ cost: 2 }]
  }), { earned: 5.25, spent: 2, balance: 3.25 });
});

test('points history returns requested months newest first', async () => {
  const emptyClient = {
    submission: { findMany: async () => [] },
    co2Log: { findMany: async () => [] },
    redemption: { findMany: async () => [] }
  };
  const history = await getPointsHistory('user-id', 2, emptyClient);
  assert.equal(history.length, 2);
  assert.ok(history[0].month > history[1].month);
});
