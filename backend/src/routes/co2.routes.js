const express = require('express');
const requireAuth = require('../middleware/requireAuth.dev');
const { estimateTravel, saveTravel, createPendingFood, logFood, listLogs, summary, searchLocations, saveGrocery } = require('../controllers/co2.controller');

const router = express.Router();
router.use(requireAuth);
router.get('/locations', searchLocations);
router.post('/travel/estimate', estimateTravel);
router.post('/travel', saveTravel);
router.post('/food/pending', createPendingFood);
router.patch('/food/:id', logFood);
router.post('/grocery', saveGrocery);
router.get('/logs', listLogs);
router.get('/summary', summary);

module.exports = router;
