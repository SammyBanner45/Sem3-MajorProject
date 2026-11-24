const express = require('express');
const { createProfileController } = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

function createProfileRouter(prisma) {
  const router = express.Router();
  const controller = createProfileController(prisma);
  router.use(requireAuth(prisma));
  router.get('/me', controller.getMe);
  router.patch('/me', controller.patchMe);
  router.delete('/me', controller.deleteMe);
  return router;
}

module.exports = { createProfileRouter };
