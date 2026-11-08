const { asyncHandler } = require('../lib/asyncHandler');
const profileService = require('../services/profileService');

function createProfileController(prisma) {
  return {
    getMe: asyncHandler(async (req, res) => {
      const profile = await profileService.getMyProfile(prisma, req.user.id);
      return res.status(200).json({ profile });
    }),
    patchMe: asyncHandler(async (req, res) => {
      const profile = await profileService.updateMyProfile(prisma, req.user.id, req.body);
      return res.status(200).json({ profile });
    }),
    deleteMe: asyncHandler(async (req, res) => {
      await profileService.deleteMyAccount(prisma, req.user.id);
      return res.status(204).end();
    }),
  };
}

module.exports = { createProfileController };
