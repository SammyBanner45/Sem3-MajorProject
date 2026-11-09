const express = require('express');
const { createCouponsController } = require('../controllers/coupons.controller');
const { requireAuth } = require('../middleware/auth');

function createCouponsRouter(prisma) {
  const router = express.Router();
  router.use(requireAuth(prisma));
  router.get('/me', createCouponsController(prisma).getMine);
  return router;
}

module.exports = { createCouponsRouter };
