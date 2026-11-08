let prismaPromise;

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set before creating Prisma Client');
  }

  if (!prismaPromise) {
    prismaPromise = Promise.all([
      import('../generated/prisma/client.mts'),
      import('@prisma/adapter-pg'),
    ]).then(([{ PrismaClient }, { PrismaPg }]) => {
      const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
      return new PrismaClient({ adapter });
    }).catch((error) => {
      prismaPromise = undefined;
      throw error;
    });
  }

  return prismaPromise;
}

module.exports = { getPrismaClient };
