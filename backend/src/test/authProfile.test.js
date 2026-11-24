const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const test = require('node:test');
const { once } = require('node:events');
const { createApp } = require('../index');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { seedUsers } = require('../../prisma/seed.users');
const { assertJwtSecret } = require('../services/jwt');
const { assertPasswordPepper, hashPassword, verifyPassword } = require('../services/passwords');

process.env.JWT_SECRET = 'test-only-jwt-secret-with-more-than-32-bytes';
process.env.PASSWORD_PEPPER = 'test-only-password-pepper-with-more-than-32-bytes';
process.env.CORS_ORIGINS = 'http://localhost:5173';

function prismaError(code, meta) {
  return Object.assign(new Error(code), { code, meta });
}

function createFakePrisma() {
  const users = new Map();
  const profiles = new Map();

  const prisma = {
    user: {
      create: async ({ data }) => {
        if ([...users.values()].some((user) => user.email === data.email)) throw prismaError('P2002', { target: ['email'] });
        if (users.has(data.id)) throw prismaError('P2002', { target: ['id'] });
        const user = { ...data };
        users.set(user.id, user);
        return { ...user };
      },
      findUnique: async ({ where, include, select }) => {
        const user = where.id
          ? users.get(where.id)
          : [...users.values()].find((item) => item.email === where.email);
        if (!user) return null;
        if (include?.profile) return { ...user, profile: profiles.get(user.id) || null };
        if (select) return Object.fromEntries(Object.keys(select).map((key) => [key, user[key]]));
        return { ...user };
      },
      delete: async ({ where }) => {
        const user = users.get(where.id);
        if (!user) throw prismaError('P2025');
        users.delete(where.id);
        profiles.delete(where.id);
        return { ...user };
      },
      updateMany: async ({ where, data }) => {
        const user = users.get(where.id);
        if (!user || user.passwordHash !== where.passwordHash) return { count: 0 };
        Object.assign(user, data);
        return { count: 1 };
      },
    },
    profile: {
      create: async ({ data }) => {
        if (!users.has(data.id)) throw new Error('Profile must have matching User id');
        const profile = { ...data };
        profiles.set(profile.id, profile);
        return { ...profile };
      },
      findUnique: async ({ where }) => {
        const profile = profiles.get(where.id);
        return profile ? { ...profile } : null;
      },
      update: async ({ where, data }) => {
        const profile = profiles.get(where.id);
        if (!profile) throw prismaError('P2025');
        Object.assign(profile, data);
        return { ...profile };
      },
      updateMany: async ({ where, data }) => {
        const profile = profiles.get(where.id);
        if (!profile || profile.passwordHash !== where.passwordHash) return { count: 0 };
        Object.assign(profile, data);
        return { count: 1 };
      },
    },
    $transaction: async (callback) => {
      const userSnapshot = new Map([...users].map(([id, user]) => [id, { ...user }]));
      const profileSnapshot = new Map([...profiles].map(([id, profile]) => [id, { ...profile }]));
      try {
        return await callback(prisma);
      } catch (error) {
        users.clear();
        profiles.clear();
        for (const [id, user] of userSnapshot) users.set(id, user);
        for (const [id, profile] of profileSnapshot) profiles.set(id, profile);
        throw error;
      }
    },
    $disconnect: async () => {},
  };

  return { prisma, users, profiles };
}

async function startServer(t, prisma, extraRoutes) {
  const app = createApp({ prisma });
  if (extraRoutes) extraRoutes(app, prisma);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const address = server.address();
  return {
    request: (path, options = {}) => fetch(`http://127.0.0.1:${address.port}${path}`, options),
  };
}

function json(body, token) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  };
}

function bearer(token, method = 'GET', body) {
  return {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

test('signup normalizes email, hashes password, and creates matching User/Profile IDs', async (t) => {
  const { prisma, users, profiles } = createFakePrisma();
  const server = await startServer(t, prisma);
  const response = await server.request('/api/auth/signup', json({
    email: '  Person@Example.COM ',
    password: 'password-123',
    displayName: '  Person Name  ',
  }));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.email, 'person@example.com');
  assert.equal(body.user.role, 'USER');
  assert.equal(body.profile.displayName, 'Person Name');
  assert.equal(body.profile.id, body.user.id);
  assert.equal(body.user.passwordHash, undefined);
  assert.equal(body.profile.passwordHash, undefined);
  assert.equal(users.get(body.user.id).passwordHash.includes('password-123'), false);
  assert.equal(await verifyPassword('password-123', users.get(body.user.id).passwordHash), true);
  assert.equal(profiles.has(body.user.id), true);
  assert.ok(body.token);
});

test('peppered bcrypt pre-hashing distinguishes long passwords and requires a strong pepper', async () => {
  const password = 'a'.repeat(80);
  const passwordHash = await hashPassword(password);
  assert.match(passwordHash, /^bcrypt-hmac-sha384-v1:\$2b\$/);
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword(`${'a'.repeat(72)}different`, passwordHash), false);
  assert.throws(() => assertPasswordPepper('too-short'), /at least 32 bytes/);
});

test('JWT secrets shorter than 32 bytes are rejected', () => {
  assert.throws(() => assertJwtSecret('short'), /at least 32 bytes/);
  assert.equal(assertJwtSecret(process.env.JWT_SECRET), process.env.JWT_SECRET);
});

test('signup transaction rolls back User creation if Profile creation fails', async () => {
  const { prisma, users, profiles } = createFakePrisma();
  prisma.profile.create = async () => { throw new Error('simulated profile insert failure'); };
  const authService = require('../services/authService');

  await assert.rejects(authService.signup(prisma, {
    email: 'rollback@example.com', password: 'password-123', displayName: 'Rollback',
  }), /simulated profile insert failure/);
  assert.equal(users.size, 0);
  assert.equal(profiles.size, 0);
});

test('signup rejects duplicate email with 409 and does not create another account', async (t) => {
  const { prisma, users } = createFakePrisma();
  const server = await startServer(t, prisma);
  const payload = { email: 'person@example.com', password: 'password-123', displayName: 'Person' };
  assert.equal((await server.request('/api/auth/signup', json(payload))).status, 201);
  const response = await server.request('/api/auth/signup', json(payload));
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.error.code, 'EMAIL_ALREADY_EXISTS');
  assert.equal(users.size, 1);
});

test('signup rejects invalid email, short password, and unexpected fields', async (t) => {
  const { prisma } = createFakePrisma();
  const server = await startServer(t, prisma);
  for (const payload of [
    { email: 'not-an-email', password: 'password-123', displayName: 'Person' },
    { email: 'person@example.com', password: 'short', displayName: 'Person' },
    { email: 'person@example.com', password: 'password-123', displayName: 'Person', role: 'ADMIN' },
  ]) {
    const response = await server.request('/api/auth/signup', json(payload));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  }
});

test('login succeeds and rejects incorrect passwords and credential-less legacy users generically', async (t) => {
  const { prisma, users, profiles } = createFakePrisma();
  const passwordHash = await hashPassword('correct-password');
  users.set('00000000-0000-4000-8000-000000000011', {
    id: '00000000-0000-4000-8000-000000000011', email: 'person@example.com', passwordHash, role: 'USER',
  });
  profiles.set('00000000-0000-4000-8000-000000000011', {
    id: '00000000-0000-4000-8000-000000000011', displayName: 'Person',
  });
  users.set('00000000-0000-4000-8000-000000000012', {
    id: '00000000-0000-4000-8000-000000000012', email: 'legacy@example.com', passwordHash: null, role: 'USER',
  });
  profiles.set('00000000-0000-4000-8000-000000000012', {
    id: '00000000-0000-4000-8000-000000000012', displayName: null,
  });
  const server = await startServer(t, prisma);

  const success = await server.request('/api/auth/login', json({ email: ' PERSON@EXAMPLE.COM ', password: 'correct-password' }));
  const successBody = await success.json();
  assert.equal(success.status, 200);
  assert.equal(successBody.user.id, '00000000-0000-4000-8000-000000000011');
  assert.equal(successBody.passwordHash, undefined);
  const tokenPayload = jwt.verify(successBody.token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  assert.equal(jwt.decode(successBody.token, { complete: true }).header.alg, 'HS256');
  assert.equal(tokenPayload.sub, '00000000-0000-4000-8000-000000000011');
  assert.equal(tokenPayload.role, 'USER');
  assert.equal(tokenPayload.exp - tokenPayload.iat, 7 * 24 * 60 * 60);

  for (const payload of [
    { email: 'person@example.com', password: 'wrong-password' },
    { email: 'legacy@example.com', password: 'anything-123' },
    { email: 'missing@example.com', password: 'anything-123' },
  ]) {
    const response = await server.request('/api/auth/login', json(payload));
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'INVALID_CREDENTIALS');
  }
});

test('successful login upgrades legacy SHA-256-prehashed bcrypt in User and Profile', async (t) => {
  const { prisma, users, profiles } = createFakePrisma();
  const id = '00000000-0000-4000-8000-000000000013';
  const password = 'legacy-password-123';
  const oldInput = createHash('sha256').update(password, 'utf8').digest('base64');
  const oldHash = await bcrypt.hash(oldInput, 12);
  users.set(id, { id, email: 'legacy-hash@example.com', passwordHash: oldHash, role: 'USER' });
  profiles.set(id, { id, displayName: 'Legacy Hash', passwordHash: oldHash });
  const server = await startServer(t, prisma);

  const response = await server.request('/api/auth/login', json({ email: 'legacy-hash@example.com', password }));
  assert.equal(response.status, 200);
  assert.match(users.get(id).passwordHash, /^bcrypt-hmac-sha384-v1:/);
  assert.equal(profiles.get(id).passwordHash, users.get(id).passwordHash);
  assert.equal(await verifyPassword(password, users.get(id).passwordHash), true);
});

test('login rejects passwords outside the documented length limits', async (t) => {
  const { prisma } = createFakePrisma();
  const server = await startServer(t, prisma);
  for (const password of ['', 'short', 'x'.repeat(129)]) {
    const response = await server.request('/api/auth/login', json({ email: 'person@example.com', password }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  }
});

test('profile GET, PATCH validation, update, and DELETE are scoped to the token user', async (t) => {
  const { prisma, users, profiles } = createFakePrisma();
  const id = '00000000-0000-4000-8000-000000000021';
  users.set(id, { id, email: 'owner@example.com', passwordHash: null, role: 'USER' });
  profiles.set(id, { id, displayName: 'Owner' });
  const otherId = '00000000-0000-4000-8000-000000000022';
  users.set(otherId, { id: otherId, email: 'other@example.com', passwordHash: null, role: 'USER' });
  profiles.set(otherId, { id: otherId, displayName: 'Other' });
  const token = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, { subject: id, expiresIn: '7d' });
  const server = await startServer(t, prisma);

  const get = await server.request('/api/profile/me', bearer(token));
  assert.deepEqual(await get.json(), { profile: { id, displayName: 'Owner' } });

  const patch = await server.request('/api/profile/me', bearer(token, 'PATCH', { displayName: '  New Name ' }));
  assert.equal(patch.status, 200);
  assert.deepEqual(await patch.json(), { profile: { id, displayName: 'New Name' } });

  for (const body of [{ displayName: 'x' }, { displayName: 'Valid Name', role: 'ADMIN' }, {}]) {
    const response = await server.request('/api/profile/me', bearer(token, 'PATCH', body));
    assert.equal(response.status, 400);
  }

  const deleted = await server.request('/api/profile/me', bearer(token, 'DELETE'));
  assert.equal(deleted.status, 204);
  assert.equal(users.has(id), false);
  assert.equal(profiles.has(id), false);
  assert.equal(users.has(otherId), true);
  assert.equal(profiles.has(otherId), true);
});

test('requireAuth handles missing, invalid, expired, and valid bearer tokens', async (t) => {
  const { prisma, users, profiles } = createFakePrisma();
  const id = '00000000-0000-4000-8000-000000000031';
  users.set(id, { id, email: 'person@example.com', role: 'USER' });
  profiles.set(id, { id, displayName: 'Person' });
  const expired = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, { subject: id, expiresIn: -1 });
  const valid = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, { subject: id, expiresIn: '7d' });
  const wrongAlgorithm = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, {
    algorithm: 'HS384', subject: id, expiresIn: '7d',
  });
  const invalidRole = jwt.sign({ role: 'SUPERUSER' }, process.env.JWT_SECRET, {
    algorithm: 'HS256', subject: id, expiresIn: '7d',
  });
  const missingSubject = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, {
    algorithm: 'HS256', expiresIn: '7d',
  });
  const server = await startServer(t, prisma, (app) => {
    app.get('/auth-probe', requireAuth(prisma), (req, res) => res.json({ user: req.user }));
  });

  for (const token of [null, 'not-a-jwt', expired, wrongAlgorithm, invalidRole, missingSubject]) {
    const response = await server.request('/auth-probe', token
      ? { headers: { authorization: `Bearer ${token}` } }
      : {});
    assert.equal(response.status, 401);
  }

  const response = await server.request('/auth-probe', { headers: { authorization: `Bearer ${valid}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: { id, role: 'USER' } });
});

test('CORS allows configured origins and omits access for unlisted origins', async (t) => {
  const { prisma } = createFakePrisma();
  const server = await startServer(t, prisma);

  const allowed = await server.request('/health', { headers: { origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const denied = await server.request('/health', { headers: { origin: 'https://attacker.example' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('requireAdmin allows admins and rejects non-admin users', () => {
  function run(role) {
    const response = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    let nextCalled = false;
    requireAdmin({ user: role ? { id: 'id', role } : undefined }, response, () => { nextCalled = true; });
    return { response, nextCalled };
  }

  assert.equal(run('ADMIN').nextCalled, true);
  assert.equal(run('USER').response.statusCode, 403);
  assert.equal(run(undefined).response.statusCode, 401);
});

test('user seed skips existing users without modifying credentials or profile', async () => {
  const { prisma, users, profiles } = createFakePrisma();
  const existingId = seedAccountsId('admin');
  users.set(existingId, {
    id: existingId,
    email: 'admin@ecosync.example',
    passwordHash: 'keep-this-hash',
    role: 'USER',
  });
  profiles.set(existingId, { id: existingId, displayName: 'Existing name' });
  const env = {
    SEED_ADMIN_PASSWORD: 'admin-password',
    SEED_USER_1_PASSWORD: 'user-one-password',
    SEED_USER_2_PASSWORD: 'user-two-password',
    SEED_USER_3_PASSWORD: 'user-three-password',
  };
  const logs = [];
  const result = await seedUsers(prisma, env, { log: (message) => logs.push(message), error: (message) => logs.push(message) });

  assert.deepEqual(result, { created: 3, skipped: 1 });
  assert.equal(users.get(existingId).passwordHash, 'keep-this-hash');
  assert.equal(users.get(existingId).role, 'USER');
  assert.equal(profiles.get(existingId).displayName, 'Existing name');

  const originalUsers = new Map([...users].map(([id, user]) => [id, { ...user }]));
  const originalProfiles = new Map([...profiles].map(([id, profile]) => [id, { ...profile }]));
  const secondRun = await seedUsers(prisma, {}, { log() {}, error() {} });
  assert.deepEqual(secondRun, { created: 0, skipped: 4 });
  assert.deepEqual(users, originalUsers);
  assert.deepEqual(profiles, originalProfiles);
});

test('user seed reports existing accounts that lack profiles without repairing them', async () => {
  const { prisma, users, profiles } = createFakePrisma();
  const existingId = seedAccountsId('admin');
  users.set(existingId, {
    id: existingId,
    email: 'admin@ecosync.example',
    passwordHash: null,
    role: 'USER',
  });
  const errors = [];
  const env = {
    SEED_ADMIN_PASSWORD: 'admin-password',
    SEED_USER_1_PASSWORD: 'user-one-password',
    SEED_USER_2_PASSWORD: 'user-two-password',
    SEED_USER_3_PASSWORD: 'user-three-password',
  };

  await assert.rejects(
    seedUsers(prisma, env, { log() {}, error: (message) => errors.push(message) }),
    /has no profile; left unchanged/,
  );
  assert.equal(users.get(existingId).passwordHash, null);
  assert.equal(profiles.has(existingId), false);
  assert.equal(errors.length, 1);
});

test('user seed detects a fixed-ID collision before creating other accounts', async () => {
  const { prisma, users, profiles } = createFakePrisma();
  const collisionId = seedAccountsId('admin');
  users.set(collisionId, {
    id: collisionId,
    email: 'different@example.com',
    passwordHash: 'keep-this-hash',
    role: 'USER',
  });
  profiles.set(collisionId, { id: collisionId, displayName: 'Keep this profile' });
  const beforeUsers = new Map([...users].map(([id, user]) => [id, { ...user }]));
  const beforeProfiles = new Map([...profiles].map(([id, profile]) => [id, { ...profile }]));
  const errors = [];

  await assert.rejects(
    seedUsers(prisma, {}, { log() {}, error: (message) => errors.push(message) }),
    /Seed ID .* already used/,
  );
  assert.deepEqual(users, beforeUsers);
  assert.deepEqual(profiles, beforeProfiles);
  assert.equal(errors.length, 1);
});

function seedAccountsId(kind) {
  return kind === 'admin' ? '00000000-0000-4000-8000-000000000001' : '';
}
