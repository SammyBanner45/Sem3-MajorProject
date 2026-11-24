const express = require('express');
const { createAuthController } = require('../controllers/authController');

function createAuthRouter(prisma) {
  const router = express.Router();
  const controller = createAuthController(prisma);
  router.post('/signup', controller.signup);
  router.post('/login', controller.login);
  return router;
}

module.exports = { createAuthRouter };
