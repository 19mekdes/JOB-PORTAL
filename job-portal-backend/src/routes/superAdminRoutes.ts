import express from 'express';
import {
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  
  // Admin Management
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateAdminRole,
  
  // System Health
  getSystemHealth,
  getSystemLogs,
  clearCache,
  
  // Advanced Analytics
  getAdvancedAnalytics,
  getRevenueReport,
  getUserGrowthReport,
  
  // Backup & Maintenance
  createBackup,
  getBackups,
  restoreBackup,
  toggleMaintenanceMode,
  
  // Email Templates
  getEmailTemplates,
  updateEmailTemplate,
  
  // Audit Logs
  getAuditLogs,
  clearAuditLogs
} from '../controllers/superAdminController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = express.Router();

// All Super Admin routes require authentication and Super Admin role
router.use(protect);
router.use(authorize('Super Admin'));

// ========== SYSTEM SETTINGS ==========
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// ========== ADMIN MANAGEMENT ==========
router.get('/admins', getAllAdmins);
router.get('/admins/:adminId', getAdminById);
router.post('/admins', createAdmin);
router.put('/admins/:adminId', updateAdmin);
router.delete('/admins/:adminId', deleteAdmin);
router.put('/admins/:adminId/role', updateAdminRole);

// ========== SYSTEM HEALTH ==========
router.get('/health', getSystemHealth);
router.get('/logs', getSystemLogs);
router.post('/cache/clear', clearCache);

// ========== ADVANCED ANALYTICS ==========
router.get('/analytics/advanced', getAdvancedAnalytics);
router.get('/analytics/revenue', getRevenueReport);
router.get('/analytics/growth', getUserGrowthReport);

// ========== BACKUP & MAINTENANCE ==========
router.post('/backup', createBackup);
router.get('/backups', getBackups);
router.post('/backup/restore/:backupId', restoreBackup);
router.post('/maintenance/toggle', toggleMaintenanceMode);

// ========== EMAIL TEMPLATES ==========
router.get('/email-templates', getEmailTemplates);
router.put('/email-templates/:templateId', updateEmailTemplate);

// ========== AUDIT LOGS ==========
router.get('/audit-logs', getAuditLogs);
router.delete('/audit-logs', clearAuditLogs);

export default router;