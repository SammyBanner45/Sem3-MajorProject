const assert = require('node:assert/strict');
const test = require('node:test');

// Mock ../lib/prisma in require cache so tests run without needing @prisma/client installed
const mockPrisma = {
  task: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({})
  }
};
require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'),
  filename: require.resolve('../lib/prisma'),
  loaded: true,
  exports: mockPrisma
};

const activities = require('../data/activities.json');
const challenges = require('../data/challenges.json');
const { getKolkataDayBounds, enrichTask, getTasks, getDailyChallenge } = require('./tasks.controller');

test('activities.json contains ~10 valid activities with title, description, icon, points', () => {
  assert.ok(activities.length >= 10 && activities.length <= 15, `Found ${activities.length} activities`);
  for (const act of activities) {
    assert.equal(typeof act.title, 'string');
    assert.ok(act.title.length > 0);
    assert.equal(typeof act.description, 'string');
    assert.equal(typeof act.icon, 'string');
    assert.ok(act.icon.length > 0);
    assert.equal(typeof act.points, 'number');
    assert.ok(act.points > 0);
  }
});

test('challenges.json contains ~14 valid challenges with bonus points', () => {
  assert.ok(challenges.length >= 14 && challenges.length <= 20, `Found ${challenges.length} challenges`);
  for (const ch of challenges) {
    assert.equal(typeof ch.title, 'string');
    assert.ok(ch.title.length > 0);
    assert.equal(typeof ch.description, 'string');
    assert.equal(typeof ch.icon, 'string');
    assert.ok(ch.icon.length > 0);
    assert.equal(typeof ch.points, 'number');
    // Challenges give bonus points (e.g. >= 30)
    assert.ok(ch.points >= 30, `Expected bonus points >= 30, got ${ch.points}`);
  }
});

test('getKolkataDayBounds accurately returns start and end of day in Asia/Kolkata', () => {
  const { startOfDay, endOfDay } = getKolkataDayBounds();
  assert.ok(startOfDay instanceof Date);
  assert.ok(endOfDay instanceof Date);
  assert.ok(startOfDay < endOfDay);

  const startFormatted = startOfDay.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
  const endFormatted = endOfDay.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });

  assert.equal(startFormatted, '00:00:00');
  assert.equal(endFormatted, '23:59:59');
});

test('enrichTask enriches task with icon from dataset if not present', () => {
  const taskWithoutIcon = { id: 'uuid-1', title: 'Bicycle Commute', points: 20 };
  const enriched = enrichTask(taskWithoutIcon);
  assert.equal(enriched.icon, '🚲');

  const taskWithExistingIcon = { id: 'uuid-2', title: 'Custom', icon: '🌟' };
  assert.equal(enrichTask(taskWithExistingIcon).icon, '🌟');
});

test('getTasks rejects invalid type parameter with 400', async () => {
  const req = { query: { type: 'invalid-type' } };
  let statusCode = null;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  await getTasks(req, res, () => {});
  assert.equal(statusCode, 400);
  assert.deepEqual(jsonBody, { error: "type must be 'activity' or 'challenge'" });
});

test('getDailyChallenge returns 404 when no challenge is scheduled', async () => {
  mockPrisma.task.findFirst = async () => null;
  const req = {};
  let statusCode = null;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  await getDailyChallenge(req, res, () => {});
  assert.equal(statusCode, 404);
  assert.deepEqual(jsonBody, { error: 'No daily challenge found for today' });
});

test('getDailyChallenge returns challenge with icon when found', async () => {
  mockPrisma.task.findFirst = async () => ({
    id: 'uuid-ch-1',
    title: 'Zero Single-Use Plastic Day',
    points: 50,
    type: 'challenge'
  });
  const req = {};
  let statusCode = null;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  await getDailyChallenge(req, res, () => {});
  assert.equal(statusCode, null);
  assert.equal(jsonBody.title, 'Zero Single-Use Plastic Day');
  assert.equal(jsonBody.icon, '🚫');
  assert.equal(jsonBody.points, 50);
});
