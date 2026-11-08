const assert = require('node:assert/strict');
const test = require('node:test');
const requireAdmin = require('./requireAdmin');

test('requireAdmin allows access when x-dev-role is admin and x-dev-user-id is present', () => {
  const req = {
    headers: {
      'x-dev-user-id': 'admin-user-1',
      'x-dev-role': 'admin'
    },
    get(name) {
      return this.headers[name.toLowerCase()];
    }
  };
  let statusCode = null;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      return this;
    }
  };

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'admin-user-1');
  assert.equal(req.user.role, 'admin');
  assert.equal(statusCode, null);
});

test('requireAdmin rejects unauthenticated request with 401', () => {
  const req = {
    headers: { 'x-dev-role': 'admin' },
    get(name) {
      return this.headers[name.toLowerCase()];
    }
  };
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;
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

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
  assert.deepEqual(jsonBody, { error: 'Authentication required' });
});

test('requireAdmin rejects non-admin role with 403', () => {
  const req = {
    headers: {
      'x-dev-user-id': 'normal-user',
      'x-dev-role': 'user'
    },
    get(name) {
      return this.headers[name.toLowerCase()];
    }
  };
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;
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

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.deepEqual(jsonBody, { error: 'Admin access required' });
});

test('requireAdmin is disabled in production', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const req = {
      headers: {
        'x-dev-user-id': 'admin-user-1',
        'x-dev-role': 'admin'
      },
      get(name) {
        return this.headers[name.toLowerCase()];
      }
    };
    let statusCode = null;
    let jsonBody = null;
    let nextCalled = false;
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

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403);
    assert.deepEqual(jsonBody, { error: 'Dev admin middleware is disabled in production' });
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
