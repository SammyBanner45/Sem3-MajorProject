const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const {
  submitPhoto,
  getMySubmissions,
  streamSubmissionPhoto
} = require('../controllers/submissions.controller');

const router = express.Router();

// Vercel functions have an ephemeral, read-only application bundle. Keep
// uploads in memory there and persist them through Supabase Storage in the
// service layer. Local development retains disk-backed uploads.
const uploadDir = path.join(__dirname, '../uploads');

const MIME_EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Random filename, never use original name
    const ext = MIME_EXT_MAP[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomName = `${crypto.randomUUID()}${ext}`;
    cb(null, randomName);
  }
});

const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : diskStorage;

const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      const error = new Error('Invalid file type. Only image/jpeg, image/png, and image/webp are accepted.');
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    cb(null, true);
  }
});

// Middleware to catch Multer-specific errors cleanly and respond with 400
function handleUpload(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 5 MB limit' });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    return next();
  });
}

// All submissions endpoints require authentication
router.use(requireAuth(prisma));

router.post('/', handleUpload, submitPhoto);
router.get('/mine', getMySubmissions);
router.get('/:id/photo', streamSubmissionPhoto);

module.exports = router;
