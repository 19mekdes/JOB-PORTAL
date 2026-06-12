"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const settingsController_1 = require("../controllers/settingsController");
const router = express_1.default.Router();
// Debug middleware to log all requests
router.use((req, res, next) => {
    console.log(`📌 [Admin Route] ${req.method} ${req.originalUrl}`);
    next();
});
// Add to your admin routes (after auth middleware)
router.get('/settings', settingsController_1.getSettings);
router.put('/settings', settingsController_1.updateSettings);
// Apply authentication to all admin routes
router.use(authMiddleware_1.authMiddleware);
// Apply admin authorization (Admin or Super Admin) to all routes
router.use(authMiddleware_1.isAdmin);
// ========== DASHBOARD ==========
router.get('/dashboard/stats', adminController_1.getDashboardStats);
router.get('/analytics', adminController_1.getAnalytics);
// ========== USER MANAGEMENT ==========
router.get('/users', adminController_1.getAllUsers);
router.get('/users/:userId', adminController_1.getUserById);
router.put('/users/:userId/status', adminController_1.updateUserStatus);
// Super Admin only routes
router.put('/users/:userId', authMiddleware_1.isSuperAdmin, adminController_1.updateUser);
router.post('/users/:userId/reset-password', authMiddleware_1.isSuperAdmin, adminController_1.resetPassword);
// Allow Admins to delete users (employers/seekers) as well as Super Admins
router.delete('/users/:userId', authMiddleware_1.isAdmin, adminController_1.deleteUser);
// ========== JOB MANAGEMENT ==========
router.get('/jobs', adminController_1.getAllJobs);
router.get('/jobs/:jobId', adminController_1.getJobById);
router.put('/jobs/:jobId/status', adminController_1.updateJobStatus);
router.delete('/jobs/:jobId', authMiddleware_1.isSuperAdmin, adminController_1.deleteJob);
// ========== BULK ACTIONS (Super Admin only) ==========
router.post('/jobs/bulk-delete', authMiddleware_1.isSuperAdmin, adminController_1.bulkDeleteJobs);
router.post('/users/bulk-status', authMiddleware_1.isSuperAdmin, adminController_1.bulkUpdateUserStatus);
// ========== APPLICATION MANAGEMENT ==========
router.get('/applications', adminController_1.getApplications);
router.put('/applications/:applicationId/status', adminController_1.updateApplicationStatus);
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
exports.default = router;
