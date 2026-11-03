require('dotenv').config();

const express = require('express');
const cors = require('cors');
// Upstream routers
const appsRouter = require('./routes/apps.routes');
const co2Router = require('./routes/co2.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint (your original implementation)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EcoSync API',
    timestamp: new Date().toISOString()
  });
});

// Upstream API routes
app.use('/api/apps', appsRouter);
app.use('/api/co2', co2Router);

// Upstream error handling middleware
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof TypeError || error instanceof RangeError ? 400 : 500;
  return res.status(status).json({ error: error.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EcoSync backend listening on port ${PORT}`);
  });
}

module.exports = app;
