require('dotenv').config();
const express = require('express');
const cors = require('cors');
const appsRouter = require('./routes/apps.routes');
const co2Router = require('./routes/co2.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/apps', appsRouter);
app.use('/api/co2', co2Router);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof TypeError || error instanceof RangeError ? 400 : 500;
  return res.status(status).json({ error: error.message || 'Internal server error' });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`EcoSync API listening on port ${port}`));
}

module.exports = app;
