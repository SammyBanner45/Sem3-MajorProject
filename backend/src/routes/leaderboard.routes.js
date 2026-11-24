const express = require('express');
const { createLeaderboardController } = require('../controllers/leaderboard.controller');
const { requireAuth } = require('../middleware/auth');

function createLeaderboardRouter(prisma) {
  const router = express.Router();
  router.use(requireAuth(prisma));
  router.get('/', createLeaderboardController(prisma).getCurrentMonth);
  return router;
}

module.exports = { createLeaderboardRouter };
