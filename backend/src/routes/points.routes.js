const express = require('express');
const requireAuth = require('../middleware/requireAuth.dev');
const { history, ledger, summary } = require('../controllers/points.controller');

const router = express.Router();
router.use(requireAuth);
router.get('/summary', summary);
router.get('/history', history);
router.get('/ledger', ledger);

module.exports = router;
