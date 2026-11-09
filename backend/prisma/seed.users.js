const path = require('node:path');
const dotenv = require('dotenv');
const { getPrismaClient } = require('../src/lib/prisma');
const { hashPassword } = require('../src/services/passwords');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedAccounts = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@ecosync.example',
    displayName: 'EcoSync Admin',
    role: 'ADMIN',
    passwordEnv: 'SEED_ADMIN_PASSWORD',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'sample1@ecosync.example',
    displayName: 'Sample User One',
    role: 'USER',
    passwordEnv: 'SEED_USER_1_PASSWORD',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'sample2@ecosync.example',
    displayName: 'Sample User Two',
    role: 'USER',
    passwordEnv: 'SEED_USER_2_PASSWORD',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'sample3@ecosync.example',
    displayName: 'Sample User Three',
    role: 'USER',
    passwordEnv: 'SEED_USER_3_PASSWORD',
  },
];

function readPasswords(env = process.env, accounts = seedAccounts) {
  const missing = accounts.filter((account) => {
    const password = env[account.passwordEnv];
    return typeof password !== 'string' || password.length < 8 || password.length > 128;
  });
  if (missing.length) {
    throw new Error(`Set valid 8–128 character seed passwords: ${missing.map((item) => item.passwordEnv).join(', ')}`);
  }
  return new Map(accounts.map((account) => [account.email, env[account.passwordEnv]]));
}

async function seedUsers(prisma, env = process.env, logger = console) {
  const toCreate = [];
  const issues = [];
  let skipped = 0;

  for (const account of seedAccounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true },
    });

    if (existing) {
      const profile = await prisma.profile.findUnique({ where: { id: existing.id }, select: { id: true } });
      if (!profile) {
        const message = `Existing account ${account.email} (id ${existing.id}) has no profile; left unchanged.`;
        logger.error(message);
        issues.push(message);
      } else {
        logger.log(`Skipped existing account ${account.email}; left unchanged.`);
        skipped += 1;
      }
      continue;
    }

    const conflictingId = await prisma.user.findUnique({
      where: { id: account.id },
      select: { id: true, email: true },
    });
    if (conflictingId) {
      const message = `Seed ID ${account.id} is already used by ${conflictingId.email || 'a credential-less account'}; left unchanged.`;
      logger.error(message);
      issues.push(message);
      continue;
    }
    toCreate.push(account);
  }

  if (issues.length) {
    throw new Error(`Seed stopped with ${issues.length} issue(s): ${issues.join(' ')}`);
  }

  const passwords = readPasswords(env, toCreate);
  const passwordHashes = new Map();
  for (const account of toCreate) {
    passwordHashes.set(account.email, await hashPassword(passwords.get(account.email)));
  }

  let created = 0;
  for (const account of toCreate) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: account.id,
            email: account.email,
            passwordHash: passwordHashes.get(account.email),
            role: account.role,
          },
        });
        await tx.profile.create({
          data: { id: account.id, displayName: account.displayName },
        });
      });
      logger.log(`Created account ${account.email}.`);
      created += 1;
    } catch (error) {
      if (error.code === 'P2002') {
        const concurrent = await prisma.user.findUnique({
          where: { email: account.email },
          select: { id: true },
        });
        if (concurrent) {
          const profile = await prisma.profile.findUnique({ where: { id: concurrent.id }, select: { id: true } });
          if (profile) {
            logger.log(`Skipped concurrently created account ${account.email}; left unchanged.`);
            skipped += 1;
            continue;
          }
        }
        const message = `Could not create ${account.email} because a unique account identifier is already in use; no existing account was changed.`;
        logger.error(message);
        issues.push(message);
      } else {
        throw error;
      }
    }
  }

  if (issues.length) {
    throw new Error(`Seed completed with ${issues.length} issue(s): ${issues.join(' ')}`);
  }
  return { created, skipped };
}

async function main() {
  const prisma = await getPrismaClient();
  try {
    const result = await seedUsers(prisma);
    console.log(`User seed complete: ${result.created} created, ${result.skipped} skipped.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`User seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { seedAccounts, readPasswords, seedUsers };
