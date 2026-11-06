const prisma = require('../lib/prisma');

const VALID_STATUSES = new Set(['pending', 'approved', 'rejected']);

/**
 * Helper to map a submission with joined relation data
 */
function mapSubmission(sub) {
  return {
    id: sub.id,
    taskId: sub.taskId,
    taskTitle: sub.task ? sub.task.title : 'Unknown Task',
    taskType: sub.task ? sub.task.type : undefined,
    points: sub.task ? sub.task.points : 0,
    userId: sub.userId,
    displayName: sub.profile ? sub.profile.displayName : 'Unknown User',
    status: sub.status,
    photoUrl: `/api/submissions/${sub.id}/photo`,
    rawPhotoUrl: sub.photoUrl,
    rejectionReason: sub.rejectionReason,
    reviewedAt: sub.reviewedAt,
    reviewedBy: sub.reviewedBy,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt
  };
}

/**
 * GET /api/admin/submissions?status=pending
 * Lists submissions sorted oldest first.
 */
async function listSubmissions(req, res, next) {
  try {
    const statusQuery = req.query.status || 'pending';

    if (!VALID_STATUSES.has(statusQuery)) {
      return res.status(400).json({
        error: `Invalid status query. Must be one of: ${Array.from(VALID_STATUSES).join(', ')}`
      });
    }

    const submissions = await prisma.submission.findMany({
      where: { status: statusQuery },
      orderBy: { createdAt: 'asc' }, // oldest first
      include: {
        task: {
          select: {
            id: true,
            title: true,
            points: true,
            type: true
          }
        },
        profile: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    return res.json(submissions.map(mapSubmission));
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/submissions/:id
 * Body: { action: 'approve' | 'reject', reason?: string }
 *
 * Rules:
 * - Only pending submissions can be updated (returns 409 otherwise)
 * - Rejection requires a non-empty reason
 * - Sets status, reviewedAt, reviewedBy = req.user.id
 * - Does NOT calculate or write points, streaks, or coupons here.
 */
async function reviewSubmission(req, res, next) {
  try {
    const submissionId = req.params.id;
    const { action, reason } = req.body || {};

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    if (action === 'reject' && (!reason || typeof reason !== 'string' || !reason.trim())) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Only update pending submissions
    if (submission.status !== 'pending') {
      return res.status(409).json({
        error: `Cannot update submission with status '${submission.status}'. Only pending submissions can be reviewed.`
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const reviewedAt = new Date();
    const reviewedBy = req.user.id;
    const rejectionReason = action === 'reject' ? reason.trim() : null;

    // Update only the submission row
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        reviewedAt,
        reviewedBy,
        rejectionReason
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            points: true,
            type: true
          }
        },
        profile: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    return res.json(mapSubmission(updated));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listSubmissions,
  reviewSubmission,
  mapSubmission
};
