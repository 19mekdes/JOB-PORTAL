"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMaintenanceMode = exports.validateSystemSettings = exports.logSuperAdminAction = exports.sensitiveOperationRateLimit = exports.ensureLastSuperAdmin = exports.preventSelfModification = exports.isSuperAdminOrAdmin = exports.isSuperAdmin = void 0;
// ========== SUPER ADMIN AUTHENTICATION ==========
// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    if (req.user.user_type.type_name !== 'Super Admin') {
        res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin privileges required.',
            required_role: 'Super Admin',
            your_role: req.user.user_type.type_name
        });
        return;
    }
    next();
};
exports.isSuperAdmin = isSuperAdmin;
// Check if user is Super Admin or Admin (with restrictions)
const isSuperAdminOrAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    const role = req.user.user_type.type_name;
    if (role !== 'Super Admin' && role !== 'Admin') {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Super Admin privileges required.',
            required_role: 'Admin or Super Admin',
            your_role: role
        });
        return;
    }
    next();
};
exports.isSuperAdminOrAdmin = isSuperAdminOrAdmin;
// Check if Super Admin is trying to modify their own account
const preventSelfModification = (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?.id;
    if (targetId === currentUserId) {
        res.status(400).json({
            success: false,
            message: 'You cannot modify your own Super Admin account through this operation'
        });
        return;
    }
    next();
};
exports.preventSelfModification = preventSelfModification;
// Check if there's at least one Super Admin remaining
const ensureLastSuperAdmin = async (req, res, next) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const targetId = req.params.id;
        // Get target user's role
        const targetUser = await prisma.user.findUnique({
            where: { id: targetId },
            include: { user_type: true }
        });
        if (!targetUser) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        // If not deleting a Super Admin, allow
        if (targetUser.user_type.type_name !== 'Super Admin') {
            next();
            return;
        }
        // Count remaining Super Admins
        const superAdminCount = await prisma.user.count({
            where: {
                user_type: { type_name: 'Super Admin' },
                is_active: true
            }
        });
        if (superAdminCount <= 1) {
            res.status(400).json({
                success: false,
                message: 'Cannot delete the last Super Admin account. Please create another Super Admin first.'
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.ensureLastSuperAdmin = ensureLastSuperAdmin;
// Rate limiting for sensitive operations
const operationCounts = new Map();
const sensitiveOperationRateLimit = (maxRequests = 5, windowMs = 60 * 1000) => {
    return (req, res, next) => {
        const userId = req.user?.id || req.ip || 'unknown';
        const now = Date.now();
        const record = operationCounts.get(userId);
        if (record) {
            if (now > record.resetTime) {
                operationCounts.set(userId, { count: 1, resetTime: now + windowMs });
                next();
            }
            else if (record.count < maxRequests) {
                record.count++;
                operationCounts.set(userId, record);
                next();
            }
            else {
                res.status(429).json({
                    success: false,
                    message: `Too many sensitive operations. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`
                });
            }
        }
        else {
            operationCounts.set(userId, { count: 1, resetTime: now + windowMs });
            next();
        }
    };
};
exports.sensitiveOperationRateLimit = sensitiveOperationRateLimit;
// Log super admin actions
const logSuperAdminAction = (action) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        const originalJson = res.json;
        let responseBody = null;
        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            console.log(`[SUPER_ADMIN_ACTION]`, {
                action,
                admin_id: req.user?.id,
                admin_email: req.user?.email,
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
                ip: req.ip,
                user_agent: req.get('user-agent')
            });
        });
        next();
    };
};
exports.logSuperAdminAction = logSuperAdminAction;
// Validate system settings update
const validateSystemSettings = (req, res, next) => {
    const settings = req.body;
    const validSettings = [
        'site_name', 'site_description', 'contact_email', 'enable_registration',
        'require_email_verification', 'max_job_posts_per_employer', 'max_applications_per_seeker',
        'job_expiry_days', 'maintenance_mode', 'allowed_file_types', 'max_file_size_mb'
    ];
    const invalidKeys = Object.keys(settings).filter(key => !validSettings.includes(key));
    if (invalidKeys.length > 0) {
        res.status(400).json({
            success: false,
            message: `Invalid settings: ${invalidKeys.join(', ')}`,
            valid_settings: validSettings
        });
        return;
    }
    // Validate numeric values
    if (settings.max_job_posts_per_employer && settings.max_job_posts_per_employer < 1) {
        res.status(400).json({
            success: false,
            message: 'max_job_posts_per_employer must be at least 1'
        });
        return;
    }
    if (settings.max_applications_per_seeker && settings.max_applications_per_seeker < 1) {
        res.status(400).json({
            success: false,
            message: 'max_applications_per_seeker must be at least 1'
        });
        return;
    }
    if (settings.job_expiry_days && settings.job_expiry_days < 1) {
        res.status(400).json({
            success: false,
            message: 'job_expiry_days must be at least 1'
        });
        return;
    }
    if (settings.max_file_size_mb && (settings.max_file_size_mb < 1 || settings.max_file_size_mb > 100)) {
        res.status(400).json({
            success: false,
            message: 'max_file_size_mb must be between 1 and 100'
        });
        return;
    }
    next();
};
exports.validateSystemSettings = validateSystemSettings;
// Check maintenance mode (for all routes)
const checkMaintenanceMode = async (req, res, next) => {
    try {
        // Skip for Super Admin
        if (req.user?.user_type.type_name === 'Super Admin') {
            next();
            return;
        }
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        // Use type assertion to bypass TypeScript check
        const prismaAny = prisma;
        const settings = await prismaAny.systemSetting?.findFirst();
        if (settings?.maintenance_mode) {
            res.status(503).json({
                success: false,
                message: 'System is under maintenance. Please try again later.',
                maintenance_mode: true
            });
            return;
        }
        next();
    }
    catch (error) {
        // If no settings table, continue
        next();
    }
};
exports.checkMaintenanceMode = checkMaintenanceMode;
// ========== EXPORT ALL ==========
exports.default = {
    isSuperAdmin: exports.isSuperAdmin,
    isSuperAdminOrAdmin: exports.isSuperAdminOrAdmin,
    preventSelfModification: exports.preventSelfModification,
    ensureLastSuperAdmin: exports.ensureLastSuperAdmin,
    sensitiveOperationRateLimit: exports.sensitiveOperationRateLimit,
    logSuperAdminAction: exports.logSuperAdminAction,
    validateSystemSettings: exports.validateSystemSettings,
    checkMaintenanceMode: exports.checkMaintenanceMode
};
