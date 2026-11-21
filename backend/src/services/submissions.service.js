const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../lib/prisma');

const PHOTO_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'submission-photos';
let storageBucketPromise;

function supabaseStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase Storage is not configured. Set SUPABASE_URL and a server-side Supabase service key.');
  }
  return { baseUrl: supabaseUrl.replace(/\/$/, ''), serviceKey };
}

function storageObjectUrl(bucket, objectPath) {
  const { baseUrl } = supabaseStorageConfig();
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

async function ensurePrivateStorageBucket() {
  const { baseUrl, serviceKey } = supabaseStorageConfig();
  const bucketUrl = `${baseUrl}/storage/v1/bucket/${encodeURIComponent(PHOTO_BUCKET)}`;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  async function verifyPrivateBucket() {
    const response = await fetch(bucketUrl, { headers });
    if (!response.ok) {
      throw new Error(`Could not verify the '${PHOTO_BUCKET}' Supabase Storage bucket (HTTP ${response.status}).`);
    }
    const bucket = await response.json();
    if (bucket.public !== false) {
      throw new Error(`The '${PHOTO_BUCKET}' Supabase Storage bucket must be private.`);
    }
  }

  const existing = await fetch(bucketUrl, { headers });
  if (existing.ok) {
    const bucket = await existing.json();
    if (bucket.public !== false) {
      throw new Error(`The '${PHOTO_BUCKET}' Supabase Storage bucket must be private.`);
    }
    return;
  }
  if (existing.status !== 404) {
    throw new Error(`Could not check the '${PHOTO_BUCKET}' Supabase Storage bucket (HTTP ${existing.status}).`);
  }

  const createResponse = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: PHOTO_BUCKET,
      name: PHOTO_BUCKET,
      public: false,
      file_size_limit: 5 * 1024 * 1024,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
    })
  });
  if (createResponse.ok) return;
  if (createResponse.status === 409) return verifyPrivateBucket();
  throw new Error(`Could not create the private '${PHOTO_BUCKET}' Supabase Storage bucket (HTTP ${createResponse.status}).`);
}

async function ensureStorageBucket() {
  if (!storageBucketPromise) {
    storageBucketPromise = ensurePrivateStorageBucket().catch((error) => {
      storageBucketPromise = undefined;
      throw error;
    });
  }
  return storageBucketPromise;
}

async function uploadPhotoToStorage({ objectPath, file }) {
  await ensureStorageBucket();
  const { serviceKey } = supabaseStorageConfig();
  const response = await fetch(storageObjectUrl(PHOTO_BUCKET, objectPath), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.mimetype,
      'x-upsert': 'false'
    },
    body: file.buffer
  });
  if (!response.ok) {
    throw new Error(`Could not store photo in Supabase Storage (HTTP ${response.status}). Check that the private '${PHOTO_BUCKET}' bucket exists.`);
  }
}

async function downloadPhotoFromStorage(objectPath) {
  const { serviceKey } = supabaseStorageConfig();
  const response = await fetch(storageObjectUrl(PHOTO_BUCKET, objectPath), {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  if (response.status === 404) throw new SubmissionError('Photo file not found in storage', 404);
  if (!response.ok) throw new Error(`Could not retrieve photo from Supabase Storage (HTTP ${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

async function deletePhotoFromStorage(objectPath) {
  const { baseUrl, serviceKey } = supabaseStorageConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(PHOTO_BUCKET)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prefixes: [objectPath] })
  });
  if (!response.ok) {
    console.error(`Could not clean up photo in Supabase Storage (HTTP ${response.status}).`);
  }
}

class SubmissionError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function safeDeleteFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to clean up uploaded file:', err);
    }
  }
}

function getKolkataDayBounds(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.format(new Date(date)).split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  const endOfDay = new Date(Date.UTC(y, m, d + 1, 0, 0, 0) - (5.5 * 60 * 60 * 1000) - 1);
  return { startOfDay, endOfDay };
}

function isSameKolkataDate(date1, date2) {
  if (!date1 || !date2) return false;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(date1)) === formatter.format(new Date(date2));
}

/**
 * Creates a submission with file validation, task validation,
 * challenge date restrictions, and daily spam prevention.
 */
async function createSubmission({ userId, taskId, file }) {
  if (!file) {
    throw new SubmissionError('Photo is required', 400);
  }

  if (!taskId) {
    safeDeleteFile(file.path);
    throw new SubmissionError('taskId is required', 400);
  }

  let storedObjectPath;
  try {
    // 1. Task must exist and be active
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      safeDeleteFile(file.path);
      throw new SubmissionError('Task not found', 404);
    }

    // 2. A challenge can only be submitted on its challengeDate
    if (task.type === 'challenge') {
      if (!task.challengeDate || !isSameKolkataDate(task.challengeDate, new Date())) {
        safeDeleteFile(file.path);
        throw new SubmissionError('A challenge can only be submitted on its scheduled challenge date', 400);
      }
    }

    // 3. Limit each user to one non-rejected submission per task per day (Asia/Kolkata)
    const { startOfDay, endOfDay } = getKolkataDayBounds();
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId,
        taskId,
        status: { in: ['pending', 'approved'] },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existingSubmission) {
      safeDeleteFile(file.path);
      throw new SubmissionError('You have already submitted photo proof for this task today', 409);
    }

    // Persist production photos in Supabase Storage. Local development keeps
    // its existing disk-backed behavior for compatibility with the web app.
    let photoUrl;
    if (process.env.VERCEL) {
      const ext = file.mimetype === 'image/png' ? '.png'
        : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      storedObjectPath = `${userId}/${crypto.randomUUID()}${ext}`;
      await uploadPhotoToStorage({ objectPath: storedObjectPath, file });
      photoUrl = `storage://${storedObjectPath}`;
    } else {
      photoUrl = `uploads/${file.filename}`;
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        taskId,
        photoUrl,
        status: 'pending'
      },
      include: {
        task: {
          select: {
            title: true,
            type: true,
            points: true
          }
        }
      }
    });

    return submission;
  } catch (error) {
    // Clean up file if database write or checks failed
    safeDeleteFile(file.path);
    if (storedObjectPath) {
      await deletePhotoFromStorage(storedObjectPath).catch(() => {});
    }
    throw error;
  }
}

/**
 * Retrieves submissions for the given user with task details.
 */
async function getUserSubmissions(userId) {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          type: true,
          points: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return submissions.map((sub) => ({
    id: sub.id,
    taskId: sub.taskId,
    taskTitle: sub.task ? sub.task.title : 'Unknown Task',
    taskType: sub.task ? sub.task.type : undefined,
    points: sub.task ? sub.task.points : undefined,
    status: sub.status,
    date: sub.createdAt,
    createdAt: sub.createdAt,
    reviewedAt: sub.reviewedAt,
    rejectionReason: sub.rejectionReason,
    photoUrl: `/api/submissions/${sub.id}/photo`
  }));
}

/**
 * Authorizes and retrieves the file path of a submission's photo.
 */
async function getSubmissionPhoto({ submissionId, userId, userRole }) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId }
  });

  if (!submission) {
    throw new SubmissionError('Submission not found', 404);
  }

  // Check if owner or admin
  let isAdmin = userRole === 'admin';
  if (!isAdmin && userId) {
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (profile && profile.role === 'admin') {
      isAdmin = true;
    }
  }

  const isOwner = submission.userId === userId;
  if (!isOwner && !isAdmin) {
    throw new SubmissionError('Forbidden: You do not have permission to view this photo', 403);
  }

  if (submission.photoUrl.startsWith('storage://')) {
    const objectPath = submission.photoUrl.slice('storage://'.length);
    const ext = path.extname(objectPath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const buffer = await downloadPhotoFromStorage(objectPath);
    return { buffer, contentType };
  }

  const filename = path.basename(submission.photoUrl);
  const filePath = path.join(__dirname, '../uploads', filename);

  if (!fs.existsSync(filePath)) {
    throw new SubmissionError('Photo file not found on disk', 404);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  return { filePath, contentType };
}

module.exports = {
  SubmissionError,
  safeDeleteFile,
  getKolkataDayBounds,
  isSameKolkataDate,
  createSubmission,
  getUserSubmissions,
  getSubmissionPhoto
};
