// src/routes/adminRoutes.ts
import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllJobs,
  getJobById,
  updateJobStatus,
  deleteJob,
  getAnalytics,
  bulkDeleteJobs,
  bulkUpdateUserStatus,
  updateUser,
  resetPassword,
  deleteUser,
  getApplications,
  updateApplicationStatus
} from '../controllers/adminController';
import { authMiddleware, isAdmin, isSuperAdmin, authorizeAny } from '../middleware/authMiddleware';
import {
  getSettings,
  updateSettings
} from '../controllers/settingsController'


const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`📌 [Admin Route] ${req.method} ${req.originalUrl}`);
  next();
});
// Add to your admin routes (after auth middleware)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)
// Apply authentication to all admin routes
router.use(authMiddleware);

// Apply admin authorization (Admin or Super Admin) to all routes
router.use(isAdmin);

// ========== DASHBOARD ==========
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// ========== USER MANAGEMENT ==========
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);

// Super Admin only routes
router.put('/users/:userId', isSuperAdmin, updateUser);
router.post('/users/:userId/reset-password', isSuperAdmin, resetPassword);
router.delete('/users/:userId', isSuperAdmin, deleteUser);

// ========== JOB MANAGEMENT ==========
router.get('/jobs', getAllJobs);
router.get('/jobs/:jobId', getJobById);
router.put('/jobs/:jobId/status', updateJobStatus);
router.delete('/jobs/:jobId', isSuperAdmin, deleteJob);

// ========== BULK ACTIONS (Super Admin only) ==========
router.post('/jobs/bulk-delete', isSuperAdmin, bulkDeleteJobs);
router.post('/users/bulk-status', isSuperAdmin, bulkUpdateUserStatus);

// ========== APPLICATION MANAGEMENT ==========
router.get('/applications', getApplications);
router.put('/applications/:applicationId/status', updateApplicationStatus);

console.log('✅ Admin routes registered successfully:');
console.log('   GET    /users');
console.log('   GET    /users/:userId');
console.log('   PUT    /users/:userId/status');
console.log('   PUT    /users/:userId (Super Admin)');
console.log('   POST   /users/:userId/reset-password (Super Admin)');
console.log('   DELETE /users/:userId (Super Admin)');
console.log('   GET    /jobs');
console.log('   PUT    /jobs/:jobId/status');
console.log('   DELETE /jobs/:jobId (Super Admin)');

export default router;