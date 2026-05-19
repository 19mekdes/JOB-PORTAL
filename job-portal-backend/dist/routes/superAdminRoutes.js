"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const superAdminController_1 = require("../controllers/superAdminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
// All Super Admin routes require authentication and Super Admin role
router.use(authMiddleware_1.protect);
router.use((0, roleMiddleware_1.authorize)('Super Admin'));
// ========== SYSTEM SETTINGS ==========
router.get('/settings', superAdminController_1.getSystemSettings);
router.put('/settings', superAdminController_1.updateSystemSettings);
// ========== ADMIN MANAGEMENT ==========
router.get('/admins', superAdminController_1.getAllAdmins);
router.get('/admins/:adminId', superAdminController_1.getAdminById);
router.post('/admins', superAdminController_1.createAdmin);
router.put('/admins/:adminId', superAdminController_1.updateAdmin);
router.delete('/admins/:adminId', superAdminController_1.deleteAdmin);
router.put('/admins/:adminId/role', superAdminController_1.updateAdminRole);
// ========== SYSTEM HEALTH ==========
router.get('/health', superAdminController_1.getSystemHealth);
router.get('/logs', superAdminController_1.getSystemLogs);
router.post('/cache/clear', superAdminController_1.clearCache);
// ========== ADVANCED ANALYTICS ==========
router.get('/analytics/advanced', superAdminController_1.getAdvancedAnalytics);
router.get('/analytics/revenue', superAdminController_1.getRevenueReport);
router.get('/analytics/growth', superAdminController_1.getUserGrowthReport);
// ========== BACKUP & MAINTENANCE ==========
router.post('/backup', superAdminController_1.createBackup);
router.get('/backups', superAdminController_1.getBackups);
router.post('/backup/restore/:backupId', superAdminController_1.restoreBackup);
router.post('/maintenance/toggle', superAdminController_1.toggleMaintenanceMode);
// ========== EMAIL TEMPLATES ==========
router.get('/email-templates', superAdminController_1.getEmailTemplates);
router.put('/email-templates/:templateId', superAdminController_1.updateEmailTemplate);
// ========== AUDIT LOGS ==========
router.get('/audit-logs', superAdminController_1.getAuditLogs);
router.delete('/audit-logs', superAdminController_1.clearAuditLogs);
exports.default = router;
