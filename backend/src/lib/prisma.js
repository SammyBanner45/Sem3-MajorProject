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

// Existing Member 2/3 controllers import Prisma synchronously. This lazy facade
// preserves that interface while the Prisma 7 ESM client and PG adapter load asynchronously.
function createDelegateProxy(delegateName) {
  return new Proxy({}, {
    get(_target, method) {
      if (method === 'then') return undefined;
      return (...args) => getPrismaClient().then((client) => client[delegateName][method](...args));
    },
  });
}

const prisma = new Proxy({}, {
  get(_target, property) {
    if (property === 'then') return undefined;
    if (property === 'getPrismaClient') return getPrismaClient;
    if (property === '$disconnect') {
      return (...args) => getPrismaClient().then((client) => client.$disconnect(...args));
    }
    return createDelegateProxy(property);
  },
});

module.exports = prisma;
