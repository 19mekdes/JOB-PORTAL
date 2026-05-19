const express = require('express');
const router = express.Router();
const { getMyApplications } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-applications', protect, getMyApplications);

module.exports = router;
