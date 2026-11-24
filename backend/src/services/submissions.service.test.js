const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');

// Mock ../lib/prisma in require cache
let mockTasks = {};
let mockSubmissions = [];
let mockProfiles = {};

const mockPrisma = {
  task: {
    findUnique: async ({ where }) => mockTasks[where.id] || null
  },
  submission: {
    findFirst: async ({ where }) => {
      return (
        mockSubmissions.find((s) => {
          if (where.userId && s.userId !== where.userId) return false;
          if (where.taskId && s.taskId !== where.taskId) return false;
          if (where.status?.in && !where.status.in.includes(s.status)) return false;
          if (where.createdAt?.gte && s.createdAt < where.createdAt.gte) return false;
          if (where.createdAt?.lte && s.createdAt > where.createdAt.lte) return false;
          return true;
        }) || null
      );
    },
    findUnique: async ({ where }) => {
      return mockSubmissions.find((s) => s.id === where.id) || null;
    },
    findMany: async ({ where }) => {
      return mockSubmissions
        .filter((s) => s.userId === where.userId)
        .map((s) => ({
          ...s,
          task: mockTasks[s.taskId] || null
        }));
    },
    create: async ({ data }) => {
      if (data.taskId === 'trigger-db-error') {
        throw new Error('Database connection failed');
      }
      const record = {
        id: `sub-${Date.now()}-${Math.random()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        task: mockTasks[data.taskId] || null
      };
      mockSubmissions.push(record);
      return record;
    }
  },
  profile: {
    findUnique: async ({ where }) => mockProfiles[where.id] || null
  }
};

require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'),
  filename: require.resolve('../lib/prisma'),
  loaded: true,
  exports: mockPrisma
};

const {
  createSubmission,
  getUserSubmissions,
  getSubmissionPhoto,
  SubmissionError
} = require('./submissions.service');

// Helper to create a temporary dummy file for testing cleanup
function createTempTestFile() {
  const tmpDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  fs.writeFileSync(tmpPath, 'test-image-binary-data');
  return tmpPath;
}

test('createSubmission rejects missing file with 400', async () => {
  await assert.rejects(
    async () => {
      await createSubmission({ userId: 'u-1', taskId: 't-1', file: null });
    },
    (err) => err instanceof SubmissionError && err.statusCode === 400 && err.message.includes('Photo is required')
  );
});

test('createSubmission rejects missing taskId with 400 and removes uploaded file', async () => {
  const filePath = createTempTestFile();
  const file = { path: filePath, filename: path.basename(filePath) };

  await assert.rejects(
    async () => {
      await createSubmission({ userId: 'u-1', taskId: '', file });
    },
    (err) => err instanceof SubmissionError && err.statusCode === 400 && err.message.includes('taskId is required')
  );

  // Verify file was deleted
  assert.equal(fs.existsSync(filePath), false, 'Temp file should have been deleted');
});

test('createSubmission rejects non-existent task with 404 and removes file', async () => {
  const filePath = createTempTestFile();
  const file = { path: filePath, filename: path.basename(filePath) };

  await assert.rejects(
    async () => {
      await createSubmission({ userId: 'u-1', taskId: 'unknown-task-id', file });
    },
    (err) => err instanceof SubmissionError && err.statusCode === 404 && err.message.includes('Task not found')
  );

  assert.equal(fs.existsSync(filePath), false, 'Temp file should have been deleted');
});

test('createSubmission rejects challenge submission on non-matching challengeDate', async () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  mockTasks['ch-yesterday'] = {
    id: 'ch-yesterday',
    title: 'Yesterday Challenge',
    type: 'challenge',
    challengeDate: yesterday
  };

  const filePath = createTempTestFile();
  const file = { path: filePath, filename: path.basename(filePath) };

  await assert.rejects(
    async () => {
      await createSubmission({ userId: 'u-1', taskId: 'ch-yesterday', file });
    },
    (err) =>
      err instanceof SubmissionError &&
      err.statusCode === 400 &&
      err.message.includes('A challenge can only be submitted on its scheduled challenge date')
  );

  assert.equal(fs.existsSync(filePath), false);
});

test('createSubmission enforces one non-rejected submission per task per day (409 Conflict)', async () => {
  mockTasks['act-1'] = {
    id: 'act-1',
    title: 'Bicycle Commute',
    type: 'activity'
  };

  // First submission succeeds
  const filePath1 = createTempTestFile();
  const file1 = { path: filePath1, filename: path.basename(filePath1) };
  const sub1 = await createSubmission({ userId: 'u-user-daily', taskId: 'act-1', file: file1 });
  assert.equal(sub1.status, 'pending');

  // Second submission on same day rejected with 409
  const filePath2 = createTempTestFile();
  const file2 = { path: filePath2, filename: path.basename(filePath2) };
  await assert.rejects(
    async () => {
      await createSubmission({ userId: 'u-user-daily', taskId: 'act-1', file: file2 });
    },
    (err) =>
      err instanceof SubmissionError &&
      err.statusCode === 409 &&
      err.message.includes('already submitted photo proof')
  );

  assert.equal(fs.existsSync(filePath2), false);

  // Clean up sub1 file
  fs.unlinkSync(filePath1);
});

test('createSubmission cleans up uploaded file if database write fails', async () => {
  mockTasks['trigger-db-error'] = {
    id: 'trigger-db-error',
    title: 'Error Task',
    type: 'activity'
  };

  const filePath = createTempTestFile();
  const file = { path: filePath, filename: path.basename(filePath) };

  await assert.rejects(async () => {
    await createSubmission({ userId: 'u-db-err', taskId: 'trigger-db-error', file });
  }, /Database connection failed/);

  assert.equal(fs.existsSync(filePath), false, 'Uploaded file must be deleted on DB failure');
});

test('getUserSubmissions returns submissions mapped with task title', async () => {
  const result = await getUserSubmissions('u-user-daily');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0].taskTitle, 'Bicycle Commute');
  assert.equal(result[0].status, 'pending');
});

test('getSubmissionPhoto checks owner and admin authorization', async () => {
  const filePath = createTempTestFile();
  const subId = 'sub-photo-test';
  mockSubmissions.push({
    id: subId,
    userId: 'owner-id',
    taskId: 'act-1',
    photoUrl: `uploads/${path.basename(filePath)}`,
    status: 'pending'
  });

  // Non-owner, non-admin rejected with 403
  await assert.rejects(
    async () => {
      await getSubmissionPhoto({ submissionId: subId, userId: 'other-user', userRole: 'user' });
    },
    (err) => err instanceof SubmissionError && err.statusCode === 403
  );

  // Owner allowed
  const ownerResult = await getSubmissionPhoto({ submissionId: subId, userId: 'owner-id', userRole: 'user' });
  assert.equal(ownerResult.filePath, filePath);
  assert.equal(ownerResult.contentType, 'image/jpeg');

  // Admin allowed even if not owner
  const adminResult = await getSubmissionPhoto({ submissionId: subId, userId: 'admin-id', userRole: 'admin' });
  assert.equal(adminResult.filePath, filePath);

  // Cleanup
  fs.unlinkSync(filePath);
});
