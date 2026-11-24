const { asyncHandler } = require('../lib/asyncHandler');
const authService = require('../services/authService');

function createAuthController(prisma) {
  return {
    signup: asyncHandler(async (req, res) => {
      const result = await authService.signup(prisma, req.body);
      return res.status(201).json(result);
    }),
    login: asyncHandler(async (req, res) => {
      const result = await authService.login(prisma, req.body);
      return res.status(200).json(result);
    }),
  };
}

module.exports = { createAuthController };
