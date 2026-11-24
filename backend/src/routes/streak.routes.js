const express = require('express');
const { createStreakController } = require('../controllers/streak.controller');
const { requireAuth } = require('../middleware/auth');

function createStreakRouter(prisma) {
  const router = express.Router();
  router.use(requireAuth(prisma));
  router.get('/', createStreakController(prisma).getMine);
  return router;
}

module.exports = { createStreakRouter };
