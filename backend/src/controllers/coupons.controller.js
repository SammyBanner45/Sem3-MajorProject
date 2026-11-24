const { asyncHandler } = require('../lib/asyncHandler');
const { getMyCoupons } = require('../services/coupons.service');

function createCouponsController(prisma) {
  return {
    getMine: asyncHandler(async (req, res) => {
      const result = await getMyCoupons(prisma, req.user.id);
      return res.status(200).json(result);
    }),
  };
}

module.exports = { createCouponsController };
