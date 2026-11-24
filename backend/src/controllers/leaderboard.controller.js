const { asyncHandler } = require('../lib/asyncHandler');
const { getMonthlyLeaderboard } = require('../services/leaderboard.service');

function createLeaderboardController(prisma) {
  return {
    getCurrentMonth: asyncHandler(async (req, res) => {
      const result = await getMonthlyLeaderboard(prisma);
      return res.status(200).json(result);
    }),
  };
}

module.exports = { createLeaderboardController };
