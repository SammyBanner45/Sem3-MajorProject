const fs = require('fs');
const {
  createSubmission,
  getUserSubmissions,
  getSubmissionPhoto,
  SubmissionError
} = require('../services/submissions.service');

/**
 * POST /api/submissions
 * Multipart form data: taskId, photo
 */
async function submitPhoto(req, res, next) {
  try {
    const { taskId } = req.body || {};
    const userId = req.user.id;

    const submission = await createSubmission({
      userId,
      taskId,
      file: req.file
    });

    return res.status(201).json(submission);
  } catch (error) {
    if (error instanceof SubmissionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
}

/**
 * GET /api/submissions/mine
 */
async function getMySubmissions(req, res, next) {
  try {
    const userId = req.user.id;
    const submissions = await getUserSubmissions(userId);
    return res.json(submissions);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/submissions/:id/photo
 * Streams photo file if requester is owner or admin
 */
async function streamSubmissionPhoto(req, res, next) {
  try {
    const submissionId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { filePath, contentType } = await getSubmissionPhoto({
      submissionId,
      userId,
      userRole
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');

    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (err) => next(err));
    return readStream.pipe(res);
  } catch (error) {
    if (error instanceof SubmissionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
}

module.exports = {
  submitPhoto,
  getMySubmissions,
  streamSubmissionPhoto
};
