const fs = require('node:fs');
const path = require('node:path');

let prismaPromise;

function getPostgresConfig(connectionString) {
  const url = new URL(connectionString);
  // node-postgres replaces its explicit `ssl` config when SSL parameters are
  // present in the connection string. Remove those parameters so the bundled
  // Supabase CA and strict certificate verification are always applied.
  for (const parameter of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parameter);
  }

  return {
    connectionString: url.toString(),
    ssl: {
      ca: fs.readFileSync(path.resolve(__dirname, '../generated/supabase-prod-ca-2021.crt'), 'utf8'),
      rejectUnauthorized: true,
    },
    max: 1,
  };
}

function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL must be set before creating Prisma Client');
  }

  if (!prismaPromise) {
    prismaPromise = Promise.all([
      import('../generated/prisma/client.mts'),
      import('@prisma/adapter-pg'),
    ]).then(([{ PrismaClient }, { PrismaPg }]) => {
      const adapter = new PrismaPg(getPostgresConfig(connectionString));
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
    if (property === '$transaction') {
      return (...args) => getPrismaClient().then((client) => client.$transaction(...args));
    }
    return createDelegateProxy(property);
  },
});

module.exports = prisma;
