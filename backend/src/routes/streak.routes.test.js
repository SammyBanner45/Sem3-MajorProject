const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const test = require('node:test');
const { once } = require('node:events');
const { createApp } = require('../index');
const { kolkataDateKey } = require('../services/streak.service');

process.env.JWT_SECRET = 'test-only-jwt-secret-with-more-than-32-bytes';
process.env.PASSWORD_PEPPER = 'test-only-password-pepper-with-more-than-32-bytes';
process.env.CORS_ORIGINS = 'http://localhost:5173';

test('GET /api/streak requires auth and derives the user only from the token', async (t) => {
  const requestedUsers = [];
  const activityTimestamp = new Date();
  const todayKey = kolkataDateKey(activityTimestamp);
  const prisma = {
    user: { findUnique: async ({ where }) => ({ id: where.id, role: 'USER' }) },
    profile: {
      findUnique: async ({ where }) => ({ id: where.id }),
      update: async ({ where }) => ({ id: where.id }),
    },
    submission: {
      findMany: async ({ where }) => {
        requestedUsers.push(where.userId);
        return [{ status: 'approved', createdAt: activityTimestamp }];
      },
    },
  };
  const server = createApp({ prisma }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  const request = (path, options) => fetch(`http://127.0.0.1:${address.port}${path}`, options);

  assert.equal((await request('/api/streak')).status, 401);

  const token = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, {
    algorithm: 'HS256', subject: 'authenticated-user', expiresIn: '7d',
  });
  const response = await request('/api/streak?userId=somebody-else', {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    currentStreak: 1,
    lastStreakDate: todayKey,
    nextMilestone: 7,
    daysToNext: 6,
  });
  assert.deepEqual(requestedUsers, ['authenticated-user']);
});

test('GET /api/streak returns a safe not-found error when the authenticated profile is missing', async (t) => {
  const prisma = {
    user: { findUnique: async ({ where }) => ({ id: where.id, role: 'USER' }) },
    profile: { findUnique: async () => null },
    submission: { findMany: async () => { throw new Error('must not query submissions'); } },
  };
  const server = createApp({ prisma }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const token = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, { subject: 'missing-profile', expiresIn: '7d' });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/streak`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' },
  });
});
