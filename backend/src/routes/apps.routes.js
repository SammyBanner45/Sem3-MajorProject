const express = require('express');
const requireAuth = require('../middleware/requireAuth.dev');
const { listApps, createApp, deleteApp } = require('../controllers/apps.controller');

const router = express.Router();
router.use(requireAuth);
router.get('/', listApps);
router.post('/', createApp);
router.delete('/:id', deleteApp);

module.exports = router;
