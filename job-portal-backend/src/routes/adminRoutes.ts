const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllJobs,
  updateJobStatus,
  getAnalytics
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication and Admin/Super Admin role
router.use(protect);
router.use(authorize('Admin', 'Super Admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);

// Job management
router.get('/jobs', getAllJobs);
router.put('/jobs/:jobId/status', updateJobStatus);

export default router;