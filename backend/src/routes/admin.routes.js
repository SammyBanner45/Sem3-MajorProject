const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const {
  listSubmissions,
  reviewSubmission
} = require('../controllers/admin.controller');

const router = express.Router();

// Protect all admin endpoints with requireAdmin
router.use(requireAdmin);

router.get('/submissions', listSubmissions);
router.patch('/submissions/:id', reviewSubmission);

module.exports = router;
