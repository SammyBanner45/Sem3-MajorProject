const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const { createAuthRouter } = require('./routes/auth');
const { createProfileRouter } = require('./routes/profile');
const { errorHandler } = require('./middleware/errorHandler');
const { assertJwtSecret } = require('./services/jwt');
const { assertPasswordPepper } = require('./services/passwords');
const { getPrismaClient } = require('./lib/prisma');

function corsOptions(origins = process.env.CORS_ORIGINS || '') {
  const allowedOrigins = new Set(origins.split(',').map((origin) => origin.trim()).filter(Boolean));
  return {
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  };
}

function createApp({ prisma }) {
  if (!prisma) {
    throw new TypeError('createApp requires a Prisma client');
  }

  const app = express();
  app.use(cors(corsOptions()));
  app.use(express.json());
  app.use('/health', healthRouter);
  app.use('/api/auth', createAuthRouter(prisma));
  app.use('/api/profile', createProfileRouter(prisma));
  app.use(errorHandler);
  return app;
}

async function startServer({ port = process.env.PORT || 5000 } = {}) {
  assertJwtSecret();
  assertPasswordPepper();
  const prisma = await getPrismaClient();
  const app = createApp({ prisma });
  const server = app.listen(port, () => {
    console.log(`🚀 Backend listening on port ${port}`);
  });
  server.on('close', () => {
    prisma.$disconnect().catch((error) => {
      console.error('Failed to disconnect Prisma Client:', error);
    });
  });
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Backend startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { createApp, corsOptions, startServer };
