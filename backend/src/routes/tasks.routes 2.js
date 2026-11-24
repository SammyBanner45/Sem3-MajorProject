const express = require('express');
const { getTasks, getDailyChallenge } = require('../controllers/tasks.controller');

const router = express.Router();

// Specific routes before generic /
router.get('/daily-challenge', getDailyChallenge);
router.get('/', getTasks);

module.exports = router;
