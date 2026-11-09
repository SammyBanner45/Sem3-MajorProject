const prisma = require('../lib/prisma');
const { awardHistoricalMilestonesInTransaction } = require('../services/coupons.service');

const VALID_STATUSES = new Set(['pending', 'approved', 'rejected']);
const SERIALIZATION_RETRIES = 4;

class ReviewConflict extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function approveWithRewards(submissionId, reviewedBy, reviewedAt) {
  for (let attempt = 0; attempt < SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.findUnique({ where: { id: submissionId } });
        if (!submission) throw new ReviewConflict(404, 'Submission not found');
        if (submission.status !== 'pending') {
          throw new ReviewConflict(409, `Cannot update submission with status '${submission.status}'. Only pending submissions can be reviewed.`);
        }

        const updated = await tx.submission.update({
          where: { id: submissionId },
          data: { status: 'approved', reviewedAt, reviewedBy, rejectionReason: null },
          include: {
            task: { select: { id: true, title: true, points: true, type: true } },
            profile: { select: { id: true, displayName: true, email: true } },
          },
        });

        await awardHistoricalMilestonesInTransaction(tx, submission.userId);
        return updated;
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error instanceof ReviewConflict) throw error;
      if (error?.code !== 'P2034' && error?.code !== 'P2002') throw error;
      if (attempt === SERIALIZATION_RETRIES - 1) throw error;
    }
  }
  throw new Error('Could not approve submission after serialization retries.');
}

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
 * - Approved submissions and newly earned milestone coupons commit atomically.
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

    const reviewedAt = new Date();
    const reviewedBy = req.user.id;

    if (action === 'approve') {
      try {
        const updated = await approveWithRewards(submissionId, reviewedBy, reviewedAt);
        return res.json(mapSubmission(updated));
      } catch (error) {
        if (error instanceof ReviewConflict) {
          return res.status(error.status).json({ error: error.message });
        }
        return next(error);
      }
    }

    const rejectionReason = reason.trim();

    // Update only the submission row
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'rejected',
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
