const { asyncHandler } = require('../lib/asyncHandler');
const { getMyStreak } = require('../services/streak.service');

function createStreakController(prisma) {
  return {
    getMine: asyncHandler(async (req, res) => {
      const streak = await getMyStreak(prisma, req.user.id);
      return res.status(200).json(streak);
    }),
  };
}

module.exports = { createStreakController };
