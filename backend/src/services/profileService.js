const { HttpError } = require('../lib/httpError');

function validateDisplayNamePatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }
  const keys = Object.keys(body);
  const unexpected = keys.find((key) => key !== 'displayName');
  if (unexpected || !Object.hasOwn(body, 'displayName')) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Only displayName may be updated.', {
      field: unexpected || 'displayName',
    });
  }
  if (typeof body.displayName !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be 2–30 characters.', { field: 'displayName' });
  }
  const displayName = body.displayName.trim();
  if (displayName.length < 2 || displayName.length > 30) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be 2–30 characters.', { field: 'displayName' });
  }
  return displayName;
}

async function getMyProfile(prisma, userId) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  return { id: profile.id, displayName: profile.displayName };
}

async function updateMyProfile(prisma, userId, body) {
  const displayName = validateDisplayNamePatch(body);
  try {
    const profile = await prisma.profile.update({
      where: { id: userId },
      data: { displayName },
    });
    return { id: profile.id, displayName: profile.displayName };
  } catch (error) {
    if (error.code === 'P2025') throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
    throw error;
  }
}

async function deleteMyAccount(prisma, userId) {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    if (error.code === 'P2025') throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
    throw error;
  }
}

module.exports = { getMyProfile, updateMyProfile, deleteMyAccount, validateDisplayNamePatch };
