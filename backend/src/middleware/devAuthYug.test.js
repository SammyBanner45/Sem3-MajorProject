const assert = require('node:assert/strict');
const test = require('node:test');
const devAuthYug = require('./devAuthYug');

test('devAuthYug sets req.user when x-dev-user-id header is provided', () => {
  const req = {
    headers: { 'x-dev-user-id': 'test-user-123' },
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

  devAuthYug(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'test-user-123');
  assert.equal(statusCode, null);
});

test('devAuthYug rejects with 401 when x-dev-user-id header is absent', () => {
  const req = {
    headers: {},
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

  devAuthYug(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
  assert.deepEqual(jsonBody, { error: 'Authentication required' });
});

test('devAuthYug is disabled in production', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const req = {
      headers: { 'x-dev-user-id': 'test-user-123' },
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

    devAuthYug(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403);
    assert.deepEqual(jsonBody, { error: 'Dev authentication is disabled in production' });
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
