const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const appsRouter = require('./routes/apps.routes');
const co2Router = require('./routes/co2.routes');
const tasksRouter = require('./routes/tasks.routes');
const submissionsRouter = require('./routes/submissions.routes');
const adminRouter = require('./routes/admin.routes');
const healthRouter = require('./routes/health');
const { createAuthRouter } = require('./routes/auth');
const { createProfileRouter } = require('./routes/profile');
const { createStreakRouter } = require('./routes/streak.routes');
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
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'EcoSync API', timestamp: new Date().toISOString() });
  });

  app.use('/api/apps', appsRouter);
  app.use('/api/co2', co2Router);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/submissions', submissionsRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api/auth', createAuthRouter(prisma));
  app.use('/api/profile', createProfileRouter(prisma));
  app.use('/api/streak', createStreakRouter(prisma));
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
