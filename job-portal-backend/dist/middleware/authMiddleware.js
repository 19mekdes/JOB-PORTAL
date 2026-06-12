"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.authorizeAny = exports.isJobSeeker = exports.isSuperAdmin = exports.isAdmin = exports.isEmployer = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Basic auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            full_name: decoded.full_name || ''
        };
        // Get full user data including role
        const fullUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { user_type: true, seeker_profile: true, employer_profile: true }
        });
        req.fullUser = fullUser;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
exports.protect = exports.authMiddleware;
// Role checking middleware
const isEmployer = async (req, res, next) => {
    try {
        const user = req.fullUser || await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (!user || user.user_type?.type_name !== 'Employer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This resource is only available for employers.',
                required_role: 'Employer',
                your_role: user?.user_type?.type_name || 'Unknown'
            });
        }
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
};
exports.isEmployer = isEmployer;
const isAdmin = async (req, res, next) => {
    try {
        const user = req.fullUser || await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        const role = user?.user_type?.type_name;
        if (!user || (role !== 'Admin' && role !== 'Super Admin')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This resource is only available for administrators.',
                required_role: 'Admin or Super Admin',
                your_role: role || 'Unknown'
            });
        }
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
};
exports.isAdmin = isAdmin;
const isSuperAdmin = async (req, res, next) => {
    try {
        const user = req.fullUser || await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (!user || user.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This resource is only available for super administrators.',
                required_role: 'Super Admin',
                your_role: user?.user_type?.type_name || 'Unknown'
            });
        }
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
};
exports.isSuperAdmin = isSuperAdmin;
const isJobSeeker = async (req, res, next) => {
    try {
        const user = req.fullUser || await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (!user || user.user_type?.type_name !== 'Job Seeker') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This resource is only available for job seekers.',
                required_role: 'Job Seeker',
                your_role: user?.user_type?.type_name || 'Unknown'
            });
        }
        next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
};
exports.isJobSeeker = isJobSeeker;
// Authorize any of the provided roles
const authorizeAny = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = req.fullUser || await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { user_type: true }
            });
            const userRole = user?.user_type?.type_name;
            if (!user || !roles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}`,
                    required_roles: roles,
                    your_role: userRole || 'Unknown'
                });
            }
            next();
        }
        catch (error) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
    };
};
exports.authorizeAny = authorizeAny;
