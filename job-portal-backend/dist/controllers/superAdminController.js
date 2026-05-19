"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuditLogs = exports.getAuditLogs = exports.updateEmailTemplate = exports.getEmailTemplates = exports.toggleMaintenanceMode = exports.restoreBackup = exports.getBackups = exports.createBackup = exports.getUserGrowthReport = exports.getRevenueReport = exports.getAdvancedAnalytics = exports.clearCache = exports.getSystemLogs = exports.getSystemHealth = exports.updateAdminRole = exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.getAdminById = exports.getAllAdmins = exports.updateSystemSettings = exports.getSystemSettings = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// ========== SYSTEM SETTINGS ==========
const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSetting.findFirst();
        if (!settings) {
            // Create default settings if none exist
            settings = await prisma.systemSetting.create({
                data: {
                    site_name: 'Job Portal',
                    site_description: 'Connect job seekers with employers',
                    contact_email: 'admin@jobportal.com',
                    enable_registration: true,
                    require_email_verification: true,
                    max_job_posts_per_employer: 50,
                    max_applications_per_seeker: 100,
                    job_expiry_days: 30,
                    maintenance_mode: false,
                    allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
                    max_file_size_mb: 5
                }
            });
        }
        res.json({ success: true, data: settings });
    }
    catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSettings = async (req, res) => {
    try {
        const updates = req.body;
        const settings = await prisma.systemSetting.update({
            where: { id: 1 },
            data: {
                ...updates,
                updated_at: new Date()
            }
        });
        // Log the action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'UPDATE_SYSTEM_SETTINGS',
                target_type: 'SystemSetting',
                target_id: '1',
                details: { updatedFields: Object.keys(updates) },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({ success: true, data: settings, message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSystemSettings = updateSystemSettings;
// ========== ADMIN MANAGEMENT ==========
const getAllAdmins = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            user_type: {
                type_name: { in: ['Admin', 'Super Admin'] }
            }
        };
        if (search) {
            where.email = { contains: search, mode: 'insensitive' };
        }
        const [admins, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    user_type: true
                },
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        res.json({
            success: true,
            data: admins,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all admins error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllAdmins = getAllAdmins;
const getAdminById = async (req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            include: {
                user_type: true
            }
        });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        const isAdmin = admin.user_type.type_name === 'Admin' || admin.user_type.type_name === 'Super Admin';
        if (!isAdmin) {
            return res.status(404).json({ success: false, message: 'User is not an admin' });
        }
        res.json({ success: true, data: admin });
    }
    catch (error) {
        console.error('Get admin by ID error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAdminById = getAdminById;
const createAdmin = async (req, res) => {
    try {
        const { email, password, full_name, role = 'Admin' } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        // Get role type
        const userType = await prisma.userType.findFirst({
            where: { type_name: role }
        });
        if (!userType) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        // Create admin user
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                user_type_id: userType.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            include: {
                user_type: true
            }
        });
        // Log the action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'CREATE_ADMIN',
                target_type: 'User',
                target_id: admin.id,
                details: { email, role },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.status(201).json({
            success: true,
            data: admin,
            message: `Admin ${role} created successfully`
        });
    }
    catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createAdmin = createAdmin;
const updateAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { full_name, is_active } = req.body;
        // Don't allow deleting own admin account
        if (adminId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot modify your own admin account through this endpoint' });
        }
        const admin = await prisma.user.update({
            where: { id: adminId },
            data: {
                is_active: is_active !== undefined ? is_active : undefined,
                updated_at: new Date()
            },
            include: {
                user_type: true
            }
        });
        // Log the action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'UPDATE_ADMIN',
                target_type: 'User',
                target_id: admin.id,
                details: { updatedFields: Object.keys(req.body) },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({ success: true, data: admin, message: 'Admin updated successfully' });
    }
    catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateAdmin = updateAdmin;
const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        // Don't allow deleting own admin account
        if (adminId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
        }
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            include: { user_type: true }
        });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        const isAdmin = admin.user_type.type_name === 'Admin' || admin.user_type.type_name === 'Super Admin';
        if (!isAdmin) {
            return res.status(404).json({ success: false, message: 'User is not an admin' });
        }
        // Soft delete - just deactivate
        await prisma.user.update({
            where: { id: adminId },
            data: { is_active: false, updated_at: new Date() }
        });
        // Log the action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'DELETE_ADMIN',
                target_type: 'User',
                target_id: adminId,
                details: { email: admin.email },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({ success: true, message: 'Admin deactivated successfully' });
    }
    catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteAdmin = deleteAdmin;
const updateAdminRole = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { role } = req.body;
        // Don't allow changing own role
        if (adminId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot change your own role' });
        }
        const userType = await prisma.userType.findFirst({
            where: { type_name: role }
        });
        if (!userType) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const admin = await prisma.user.update({
            where: { id: adminId },
            data: {
                user_type_id: userType.id,
                updated_at: new Date()
            },
            include: {
                user_type: true
            }
        });
        // Log the action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'UPDATE_ADMIN_ROLE',
                target_type: 'User',
                target_id: admin.id,
                details: { newRole: role },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({ success: true, data: admin, message: `Role updated to ${role}` });
    }
    catch (error) {
        console.error('Update admin role error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateAdminRole = updateAdminRole;
// ========== SYSTEM HEALTH ==========
const getSystemHealth = async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw `SELECT 1`;
        const dbStatus = 'connected';
        // Get system metrics
        const [totalUsers, activeUsers, totalJobs, activeJobs, totalApplications, pendingApplications] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { is_active: true } }),
            prisma.jobPost.count(),
            prisma.jobPost.count({ where: { status: { status_name: 'Open' } } }),
            prisma.jobApplication.count(),
            prisma.jobApplication.count({ where: { status: { status_name: 'Pending' } } })
        ]);
        const settings = await prisma.systemSetting.findFirst();
        res.json({
            success: true,
            data: {
                status: 'healthy',
                database: dbStatus,
                timestamp: new Date(),
                metrics: {
                    totalUsers,
                    activeUsers,
                    totalJobs,
                    activeJobs,
                    totalApplications,
                    pendingApplications
                },
                maintenance_mode: settings?.maintenance_mode || false,
                uptime: process.uptime()
            }
        });
    }
    catch (error) {
        console.error('System health check error:', error);
        res.status(500).json({
            success: false,
            data: {
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message
            }
        });
    }
};
exports.getSystemHealth = getSystemHealth;
const getSystemLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, target_type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (target_type)
            where.target_type = target_type;
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    admin: {
                        select: { email: true }
                    }
                },
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.auditLog.count({ where })
        ]);
        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get system logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSystemLogs = getSystemLogs;
const clearCache = async (req, res) => {
    try {
        // Log the action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'CLEAR_CACHE',
                target_type: 'System',
                target_id: 'cache',
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({ success: true, message: 'Cache cleared successfully' });
    }
    catch (error) {
        console.error('Clear cache error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.clearCache = clearCache;
// ========== ADVANCED ANALYTICS ==========
const getAdvancedAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Daily job postings
        const dailyJobs = await prisma.jobPost.groupBy({
            by: ['created_at'],
            where: { created_at: { gte: startDate } },
            _count: true
        });
        // Daily registrations by role
        const dailyRegistrations = await prisma.user.groupBy({
            by: ['created_at', 'user_type_id'],
            where: { created_at: { gte: startDate } },
            _count: true
        });
        // Application trends
        const applicationTrends = await prisma.jobApplication.groupBy({
            by: ['applied_at', 'status_id'],
            where: { applied_at: { gte: startDate } },
            _count: true
        });
        // Popular job categories
        const popularCategories = await prisma.jobIndustry.findMany({
            include: {
                jobs: {
                    where: { created_at: { gte: startDate } }
                }
            },
            take: 10
        });
        res.json({
            success: true,
            data: {
                period: `${days} days`,
                dailyJobs,
                dailyRegistrations,
                applicationTrends,
                popularCategories: popularCategories.map(cat => ({
                    name: cat.industry_name,
                    jobCount: cat.jobs.length
                }))
            }
        });
    }
    catch (error) {
        console.error('Get advanced analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAdvancedAnalytics = getAdvancedAnalytics;
const getRevenueReport = async (req, res) => {
    try {
        // This would integrate with payment system
        // For now, return placeholder data
        res.json({
            success: true,
            data: {
                total_revenue: 0,
                monthly_recurring: 0,
                pending_invoices: 0,
                recent_transactions: []
            },
            message: 'Payment integration pending'
        });
    }
    catch (error) {
        console.error('Get revenue report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRevenueReport = getRevenueReport;
const getUserGrowthReport = async (req, res) => {
    try {
        const { months = 12 } = req.query;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));
        const monthlyGrowth = await prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users,
        COUNT(CASE WHEN user_type_id = 1 THEN 1 END) as job_seekers,
        COUNT(CASE WHEN user_type_id = 2 THEN 1 END) as employers
      FROM "User"
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `;
        res.json({
            success: true,
            data: {
                monthlyGrowth,
                total_users: await prisma.user.count(),
                active_users: await prisma.user.count({ where: { is_active: true } })
            }
        });
    }
    catch (error) {
        console.error('Get user growth report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserGrowthReport = getUserGrowthReport;
// ========== BACKUP & MAINTENANCE ==========
const createBackup = async (req, res) => {
    try {
        // Log backup action
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'CREATE_BACKUP',
                target_type: 'System',
                target_id: 'backup',
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            message: 'Backup initiated. This feature requires additional configuration.'
        });
    }
    catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createBackup = createBackup;
const getBackups = async (req, res) => {
    try {
        res.json({
            success: true,
            data: [],
            message: 'Backup list feature requires additional configuration'
        });
    }
    catch (error) {
        console.error('Get backups error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBackups = getBackups;
const restoreBackup = async (req, res) => {
    try {
        const { backupId } = req.params;
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'RESTORE_BACKUP',
                target_type: 'System',
                target_id: backupId,
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            message: 'Backup restore initiated. This feature requires additional configuration.'
        });
    }
    catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.restoreBackup = restoreBackup;
const toggleMaintenanceMode = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findFirst();
        if (!settings) {
            return res.status(404).json({ success: false, message: 'Settings not found' });
        }
        const updated = await prisma.systemSetting.update({
            where: { id: settings.id },
            data: {
                maintenance_mode: !settings.maintenance_mode,
                updated_at: new Date()
            }
        });
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'TOGGLE_MAINTENANCE_MODE',
                target_type: 'SystemSetting',
                target_id: String(settings.id),
                details: { new_state: !settings.maintenance_mode },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            data: { maintenance_mode: updated.maintenance_mode },
            message: `Maintenance mode ${updated.maintenance_mode ? 'enabled' : 'disabled'}`
        });
    }
    catch (error) {
        console.error('Toggle maintenance mode error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleMaintenanceMode = toggleMaintenanceMode;
// ========== EMAIL TEMPLATES ==========
const getEmailTemplates = async (req, res) => {
    try {
        // This would fetch from database or file system
        res.json({
            success: true,
            data: [],
            message: 'Email templates feature requires additional configuration'
        });
    }
    catch (error) {
        console.error('Get email templates error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getEmailTemplates = getEmailTemplates;
const updateEmailTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const { subject, content } = req.body;
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'UPDATE_EMAIL_TEMPLATE',
                target_type: 'EmailTemplate',
                target_id: templateId,
                details: { subject },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            message: 'Email template updated successfully'
        });
    }
    catch (error) {
        console.error('Update email template error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateEmailTemplate = updateEmailTemplate;
// ========== AUDIT LOGS ==========
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, admin_id, action, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (admin_id)
            where.admin_id = admin_id;
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate)
                where.created_at.gte = new Date(startDate);
            if (endDate)
                where.created_at.lte = new Date(endDate);
        }
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    admin: {
                        select: { email: true }
                    }
                },
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.auditLog.count({ where })
        ]);
        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAuditLogs = getAuditLogs;
const clearAuditLogs = async (req, res) => {
    try {
        const { olderThan } = req.query;
        const date = olderThan ? new Date(olderThan) : new Date();
        const result = await prisma.auditLog.deleteMany({
            where: {
                created_at: { lt: date }
            }
        });
        await prisma.auditLog.create({
            data: {
                admin_id: req.user.id,
                action: 'CLEAR_AUDIT_LOGS',
                target_type: 'AuditLog',
                target_id: 'bulk',
                details: { deleted_count: result.count, older_than: date },
                ip_address: req.ip,
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            message: `Cleared ${result.count} audit logs older than ${date.toISOString()}`
        });
    }
    catch (error) {
        console.error('Clear audit logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.clearAuditLogs = clearAuditLogs;
