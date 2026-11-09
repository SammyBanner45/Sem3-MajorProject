const express = require('express');
const requireAuth = require('../middleware/requireAuth.dev');
const { list, mine, redeem, use, wallet } = require('../controllers/rewards.controller');

const router = express.Router();
router.use(requireAuth);
router.get('/', list);
router.post('/:id/redeem', redeem);
router.get('/mine', mine);
router.get('/wallet', wallet);
router.patch('/wallet/:id/use', use);

module.exports = router;
