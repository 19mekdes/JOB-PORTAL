"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissions = exports.isUserSuperAdmin = exports.isUserAdmin = exports.getUserRole = exports.authorizeAny = exports.isOwnJob = exports.isOwnEmployerProfile = exports.isOwnSeekerProfile = exports.isSuperAdmin = exports.isAdmin = exports.isEmployer = exports.isJobSeeker = exports.requireRoleLevel = exports.checkPermission = exports.authorize = exports.UserRoles = void 0;
// ========== USER TYPE CONSTANTS ==========
exports.UserRoles = {
    JOB_SEEKER: 'Job Seeker',
    EMPLOYER: 'Employer',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin'
};
// ========== ROLE HIERARCHY ==========
const roleHierarchy = {
    [exports.UserRoles.JOB_SEEKER]: 1,
    [exports.UserRoles.EMPLOYER]: 2,
    [exports.UserRoles.ADMIN]: 3,
    [exports.UserRoles.SUPER_ADMIN]: 4
};
const rolePermissions = {
    [exports.UserRoles.JOB_SEEKER]: [
        { resource: 'profile', actions: ['read', 'update'] },
        { resource: 'jobs', actions: ['read', 'search', 'apply'] },
        { resource: 'applications', actions: ['create', 'read', 'withdraw'] },
        { resource: 'bookmarks', actions: ['create', 'read', 'delete'] },
        { resource: 'notifications', actions: ['read', 'update'] }
    ],
    [exports.UserRoles.EMPLOYER]: [
        { resource: 'profile', actions: ['read', 'update'] },
        { resource: 'jobs', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'applications', actions: ['read', 'update', 'create_note'] },
        { resource: 'notifications', actions: ['read', 'update'] }
    ],
    [exports.UserRoles.ADMIN]: [
        { resource: 'users', actions: ['read', 'update', 'suspend', 'activate', 'delete'] },
        { resource: 'jobs', actions: ['read', 'moderate', 'delete'] },
        { resource: 'applications', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'industries', actions: ['read', 'create', 'update'] }
    ],
    [exports.UserRoles.SUPER_ADMIN]: [
        { resource: '*', actions: ['*'] } // Full access
    ]
};
// ========== CHECK IF USER HAS PERMISSION ==========
const hasPermission = (userRole, resource, action) => {
    if (userRole === exports.UserRoles.SUPER_ADMIN)
        return true;
    const permissions = rolePermissions[userRole];
    if (!permissions)
        return false;
    return permissions.some(permission => (permission.resource === resource || permission.resource === '*') &&
        (permission.actions.includes(action) || permission.actions.includes('*')));
};
// ========== BASIC ROLE AUTHORIZATION ==========
// Authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }
        const userRole = req.user.user_type.type_name;
        if (!roles.includes(userRole)) {
            res.status(403).json({
                success: false,
                message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}`,
                required_roles: roles,
                your_role: userRole
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
// ========== PERMISSION-BASED AUTHORIZATION ==========
// Check specific permission
const checkPermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }
        const userRole = req.user.user_type.type_name;
        if (!hasPermission(userRole, resource, action)) {
            res.status(403).json({
                success: false,
                message: `Access denied. You don't have permission to ${action} ${resource}`,
                required: { resource, action },
                your_role: userRole
            });
            return;
        }
        next();
    };
};
exports.checkPermission = checkPermission;
// ========== ROLE HIERARCHY CHECK ==========
// Check if user role is at least minimum role
const requireRoleLevel = (minimumRole) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }
        const userRole = req.user.user_type.type_name;
        const userLevel = roleHierarchy[userRole];
        const requiredLevel = roleHierarchy[minimumRole];
        if (userLevel < requiredLevel) {
            res.status(403).json({
                success: false,
                message: `Access denied. This resource requires ${minimumRole} or higher role`,
                required_role: minimumRole,
                your_role: userRole
            });
            return;
        }
        next();
    };
};
exports.requireRoleLevel = requireRoleLevel;
// ========== SPECIFIC ROLE MIDDLEWARES ==========
// Check if user is Job Seeker
const isJobSeeker = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    if (req.user.user_type.type_name !== exports.UserRoles.JOB_SEEKER) {
        res.status(403).json({
            success: false,
            message: 'This resource is only available for job seekers',
            required_role: exports.UserRoles.JOB_SEEKER,
            your_role: req.user.user_type.type_name
        });
        return;
    }
    next();
};
exports.isJobSeeker = isJobSeeker;
// Check if user is Employer
const isEmployer = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    if (req.user.user_type.type_name !== exports.UserRoles.EMPLOYER) {
        res.status(403).json({
            success: false,
            message: 'This resource is only available for employers',
            required_role: exports.UserRoles.EMPLOYER,
            your_role: req.user.user_type.type_name
        });
        return;
    }
    next();
};
exports.isEmployer = isEmployer;
// Check if user is Admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    const userRole = req.user.user_type.type_name;
    if (userRole !== exports.UserRoles.ADMIN && userRole !== exports.UserRoles.SUPER_ADMIN) {
        res.status(403).json({
            success: false,
            message: 'This resource is only available for administrators',
            required_role: 'Admin or Super Admin',
            your_role: userRole
        });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
        return;
    }
    if (req.user.user_type.type_name !== exports.UserRoles.SUPER_ADMIN) {
        res.status(403).json({
            success: false,
            message: 'This resource is only available for super administrators',
            required_role: exports.UserRoles.SUPER_ADMIN,
            your_role: req.user.user_type.type_name
        });
        return;
    }
    next();
};
exports.isSuperAdmin = isSuperAdmin;
// ========== RESOURCE OWNERSHIP CHECK ==========
// Check if user owns the resource (for job seekers)
const isOwnSeekerProfile = (getSeekerIdFromRequest) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
                return;
            }
            // Super Admin bypass
            if (req.user.user_type.type_name === exports.UserRoles.SUPER_ADMIN) {
                next();
                return;
            }
            const targetSeekerId = await getSeekerIdFromRequest(req);
            const userSeekerId = req.user.seeker_profile?.id;
            if (!targetSeekerId || targetSeekerId !== userSeekerId) {
                res.status(403).json({
                    success: false,
                    message: 'You can only access your own profile'
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
};
exports.isOwnSeekerProfile = isOwnSeekerProfile;
// Check if user owns the resource (for employers)
const isOwnEmployerProfile = (getEmployerIdFromRequest) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
                return;
            }
            // Super Admin bypass
            if (req.user.user_type.type_name === exports.UserRoles.SUPER_ADMIN) {
                next();
                return;
            }
            const targetEmployerId = await getEmployerIdFromRequest(req);
            const userEmployerId = req.user.employer_profile?.id;
            if (!targetEmployerId || targetEmployerId !== userEmployerId) {
                res.status(403).json({
                    success: false,
                    message: 'You can only access your own company profile'
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
};
exports.isOwnEmployerProfile = isOwnEmployerProfile;
// Check if user owns a specific job
const isOwnJob = (getJobIdFromRequest) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
                return;
            }
            // Super Admin bypass
            if (req.user.user_type.type_name === exports.UserRoles.SUPER_ADMIN) {
                next();
                return;
            }
            const jobId = await getJobIdFromRequest(req);
            const userEmployerId = req.user.employer_profile?.id;
            if (!jobId || !userEmployerId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const job = await prisma.jobPost.findFirst({
                where: {
                    id: jobId,
                    employer_id: userEmployerId
                }
            });
            if (!job) {
                res.status(403).json({
                    success: false,
                    message: 'You can only access your own jobs'
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
};
exports.isOwnJob = isOwnJob;
// ========== COMBINED AUTHORIZATION ==========
// Authorize multiple conditions
const authorizeAny = (...middlewares) => {
    return async (req, res, next) => {
        let passed = false;
        let lastError = null;
        for (const middleware of middlewares) {
            try {
                await new Promise((resolve, reject) => {
                    middleware(req, res, (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve(true);
                    });
                });
                passed = true;
                break;
            }
            catch (error) {
                lastError = error;
            }
        }
        if (passed) {
            next();
        }
        else {
            res.status(403).json({
                success: false,
                message: 'Access denied. None of the required conditions were met.',
                error: lastError?.message || 'Authorization failed'
            });
        }
    };
};
exports.authorizeAny = authorizeAny;
// ========== GET USER ROLE ==========
const getUserRole = (req) => {
    if (!req.user)
        return null;
    return req.user.user_type.type_name;
};
exports.getUserRole = getUserRole;
// ========== CHECK IF USER IS ADMIN ==========
const isUserAdmin = (req) => {
    if (!req.user)
        return false;
    const role = req.user.user_type.type_name;
    return role === exports.UserRoles.ADMIN || role === exports.UserRoles.SUPER_ADMIN;
};
exports.isUserAdmin = isUserAdmin;
// ========== CHECK IF USER IS SUPER ADMIN ==========
const isUserSuperAdmin = (req) => {
    if (!req.user)
        return false;
    return req.user.user_type.type_name === exports.UserRoles.SUPER_ADMIN;
};
exports.isUserSuperAdmin = isUserSuperAdmin;
// ========== GET USER PERMISSIONS ==========
const getUserPermissions = (req) => {
    if (!req.user)
        return [];
    const userRole = req.user.user_type.type_name;
    return rolePermissions[userRole] || [];
};
exports.getUserPermissions = getUserPermissions;
// ========== EXPORT ALL ==========
exports.default = {
    UserRoles: exports.UserRoles,
    authorize: exports.authorize,
    checkPermission: exports.checkPermission,
    requireRoleLevel: exports.requireRoleLevel,
    isJobSeeker: exports.isJobSeeker,
    isEmployer: exports.isEmployer,
    isAdmin: exports.isAdmin,
    isSuperAdmin: exports.isSuperAdmin,
    isOwnSeekerProfile: exports.isOwnSeekerProfile,
    isOwnEmployerProfile: exports.isOwnEmployerProfile,
    isOwnJob: exports.isOwnJob,
    authorizeAny: exports.authorizeAny,
    getUserRole: exports.getUserRole,
    isUserAdmin: exports.isUserAdmin,
    isUserSuperAdmin: exports.isUserSuperAdmin,
    getUserPermissions: exports.getUserPermissions
};
