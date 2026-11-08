const assert = require('node:assert/strict');
const test = require('node:test');

let mockSubmissions = [];

const mockPrisma = {
  submission: {
    findMany: async ({ where, orderBy }) => {
      let filtered = mockSubmissions.filter((s) => s.status === where.status);
      if (orderBy?.createdAt === 'asc') {
        filtered = filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      return filtered;
    },
    findUnique: async ({ where }) => {
      return mockSubmissions.find((s) => s.id === where.id) || null;
    },
    update: async ({ where, data, include }) => {
      const idx = mockSubmissions.findIndex((s) => s.id === where.id);
      if (idx === -1) throw new Error('Not found');
      mockSubmissions[idx] = {
        ...mockSubmissions[idx],
        ...data,
        updatedAt: new Date()
      };
      return mockSubmissions[idx];
    }
  }
};

require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'),
  filename: require.resolve('../lib/prisma'),
  loaded: true,
  exports: mockPrisma
};

const {
  listSubmissions,
  reviewSubmission,
  mapSubmission
} = require('./admin.controller');

test('mapSubmission formats submission correctly with task and profile details', () => {
  const raw = {
    id: 'sub-1',
    taskId: 'task-1',
    task: { title: 'Bicycle Commute', points: 20, type: 'activity' },
    userId: 'user-1',
    profile: { displayName: 'John Doe' },
    status: 'pending',
    photoUrl: 'uploads/abc.jpg',
    createdAt: new Date('2026-11-06T10:00:00Z')
  };

  const mapped = mapSubmission(raw);
  assert.equal(mapped.taskTitle, 'Bicycle Commute');
  assert.equal(mapped.points, 20);
  assert.equal(mapped.displayName, 'John Doe');
  assert.equal(mapped.photoUrl, '/api/submissions/sub-1/photo');
});

test('listSubmissions validates status query and rejects invalid status with 400', async () => {
  const req = { query: { status: 'invalid-status' } };
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

  await listSubmissions(req, res, () => {});
  assert.equal(statusCode, 400);
  assert.ok(jsonBody.error.includes('Invalid status query'));
});

test('listSubmissions returns submissions sorted oldest first', async () => {
  mockSubmissions = [
    {
      id: 'sub-newer',
      taskId: 't-1',
      task: { title: 'T1', points: 10 },
      userId: 'u-1',
      profile: { displayName: 'U1' },
      status: 'pending',
      photoUrl: 'uploads/2.jpg',
      createdAt: new Date('2026-11-06T12:00:00Z')
    },
    {
      id: 'sub-older',
      taskId: 't-2',
      task: { title: 'T2', points: 20 },
      userId: 'u-2',
      profile: { displayName: 'U2' },
      status: 'pending',
      photoUrl: 'uploads/1.jpg',
      createdAt: new Date('2026-11-06T08:00:00Z')
    }
  ];

  const req = { query: {} };
  let jsonBody = null;
  const res = {
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  await listSubmissions(req, res, () => {});
  assert.equal(jsonBody.length, 2);
  // Oldest first
  assert.equal(jsonBody[0].id, 'sub-older');
  assert.equal(jsonBody[1].id, 'sub-newer');
});

test('reviewSubmission rejects invalid action with 400', async () => {
  const req = { params: { id: 'sub-older' }, body: { action: 'delete' }, user: { id: 'admin-1' } };
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

  await reviewSubmission(req, res, () => {});
  assert.equal(statusCode, 400);
  assert.deepEqual(jsonBody, { error: "action must be 'approve' or 'reject'" });
});

test('reviewSubmission rejects rejection without reason with 400', async () => {
  const req = { params: { id: 'sub-older' }, body: { action: 'reject' }, user: { id: 'admin-1' } };
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

  await reviewSubmission(req, res, () => {});
  assert.equal(statusCode, 400);
  assert.deepEqual(jsonBody, { error: 'Rejection reason is required' });
});

test('reviewSubmission returns 404 for non-existent submission', async () => {
  const req = { params: { id: 'non-existent' }, body: { action: 'approve' }, user: { id: 'admin-1' } };
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

  await reviewSubmission(req, res, () => {});
  assert.equal(statusCode, 404);
  assert.deepEqual(jsonBody, { error: 'Submission not found' });
});

test('reviewSubmission rejects already reviewed submission with 409 Conflict', async () => {
  mockSubmissions.push({
    id: 'sub-already-approved',
    status: 'approved',
    taskId: 't-1',
    userId: 'u-1'
  });

  const req = { params: { id: 'sub-already-approved' }, body: { action: 'approve' }, user: { id: 'admin-1' } };
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

  await reviewSubmission(req, res, () => {});
  assert.equal(statusCode, 409);
  assert.ok(jsonBody.error.includes('Only pending submissions can be reviewed'));
});

test('reviewSubmission approves a pending submission successfully', async () => {
  const req = {
    params: { id: 'sub-older' },
    body: { action: 'approve' },
    user: { id: 'admin-user-id' }
  };
  let jsonBody = null;
  const res = {
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  await reviewSubmission(req, res, () => {});
  assert.equal(jsonBody.status, 'approved');
  assert.equal(jsonBody.reviewedBy, 'admin-user-id');
  assert.ok(jsonBody.reviewedAt);
  assert.equal(jsonBody.rejectionReason, null);
});

test('reviewSubmission rejects a pending submission with reason', async () => {
  const req = {
    params: { id: 'sub-newer' },
    body: { action: 'reject', reason: 'Blurry photo' },
    user: { id: 'admin-user-id' }
  };
  let jsonBody = null;
  const res = {
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  await reviewSubmission(req, res, () => {});
  assert.equal(jsonBody.status, 'rejected');
  assert.equal(jsonBody.reviewedBy, 'admin-user-id');
  assert.equal(jsonBody.rejectionReason, 'Blurry photo');
  assert.ok(jsonBody.reviewedAt);
});
