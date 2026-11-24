const { randomUUID } = require('node:crypto');
const { HttpError } = require('../lib/httpError');
const { createAccessToken } = require('./jwt');
const { hashPassword, isLegacyPasswordHash, verifyPassword } = require('./passwords');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailUniqueConflict(error) {
  if (error?.code !== 'P2002') return false;
  const target = error.meta?.target;
  const targets = Array.isArray(target) ? target : [target];
  return targets.some((item) => typeof item === 'string' && (
    item === 'email' || item.endsWith('.email') || item === 'users_email_key' || item === 'profiles_email_key'
  ));
}

function requireObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }
}

function requireExactFields(body, fields) {
  requireObject(body);
  const keys = Object.keys(body);
  const missing = fields.find((field) => !Object.hasOwn(body, field));
  const unexpected = keys.find((field) => !fields.includes(field));
  if (missing || unexpected) {
    const field = unexpected || missing;
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request fields are invalid.', { field });
  }
}

function normalizeAndValidateEmail(value) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Email must be a valid email address.', { field: 'email' });
  }
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Email must be a valid email address.', { field: 'email' });
  }
  return email;
}

function validateSignupFields(body) {
  requireExactFields(body, ['email', 'password', 'displayName']);
  const email = normalizeAndValidateEmail(body.email);

  if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Password must be 8–128 characters.', { field: 'password' });
  }

  if (typeof body.displayName !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be 2–30 characters.', { field: 'displayName' });
  }
  const displayName = body.displayName.trim();
  if (displayName.length < 2 || displayName.length > 30) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be 2–30 characters.', { field: 'displayName' });
  }

  return { email, password: body.password, displayName };
}

function validateLoginFields(body) {
  requireExactFields(body, ['email', 'password']);
  const email = normalizeAndValidateEmail(body.email);
  if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Password must be 8–128 characters.', { field: 'password' });
  }
  return { email, password: body.password };
}

function safeAuthResponse(user, profile) {
  return {
    user: { id: user.id, email: user.email, role: user.role },
    profile: { id: profile.id, displayName: profile.displayName },
    token: createAccessToken(user),
  };
}

async function signup(prisma, body) {
  const { email, password, displayName } = validateSignupFields(body);
  const passwordHash = await hashPassword(password);
  const id = randomUUID();

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { id, email, passwordHash, role: 'USER' },
      });
      const profile = await tx.profile.create({
        data: { id, displayName },
      });
      return { user, profile };
    });
  } catch (error) {
    if (isEmailUniqueConflict(error)) {
      throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }
    throw error;
  }

  return safeAuthResponse(created.user, created.profile);
}

async function login(prisma, body) {
  const { email, password } = validateLoginFields(body);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  if (!user.profile) {
    throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  }

  if (isLegacyPasswordHash(user.passwordHash)) {
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash },
        data: { passwordHash },
      });
      if (updated.count > 0) {
        await tx.profile.updateMany({
          where: { id: user.id, passwordHash: user.passwordHash },
          data: { passwordHash },
        });
      }
    });
  }

  return safeAuthResponse(user, user.profile);
}

module.exports = {
  signup,
  login,
  validateSignupFields,
  validateLoginFields,
};
