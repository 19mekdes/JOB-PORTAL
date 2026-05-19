"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRequest = exports.rateLimit = exports.restrictToOwnUser = exports.optionalAuth = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ========== PROTECT MIDDLEWARE ==========
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this resource. Please log in.'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
            return;
        }
        if (!user.is_active) {
            res.status(401).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        else {
            res.status(401).json({
                success: false,
                message: 'Not authorized',
                error: error.message
            });
        }
    }
};
exports.protect = protect;
// ========== OPTIONAL AUTH MIDDLEWARE ==========
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: {
                    user_type: true,
                    seeker_profile: true,
                    employer_profile: true
                }
            });
            if (user && user.is_active) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
// ========== RESTRICT TO OWN USER OR ADMIN ==========
const restrictToOwnUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }
        const isAdmin = req.user.user_type.type_name === 'Admin' ||
            req.user.user_type.type_name === 'Super Admin';
        const isOwnUser = req.user.id === userId;
        if (!isOwnUser && !isAdmin) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to access this resource'
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
exports.restrictToOwnUser = restrictToOwnUser;
// ========== RATE LIMITING MIDDLEWARE ==========
const requestCounts = new Map();
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const identifier = req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const record = requestCounts.get(identifier);
        if (record) {
            if (now > record.resetTime) {
                requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
                next();
            }
            else if (record.count < maxRequests) {
                record.count++;
                requestCounts.set(identifier, record);
                next();
            }
            else {
                res.status(429).json({
                    success: false,
                    message: `Too many requests. Please try again later.`
                });
            }
        }
        else {
            requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
            next();
        }
    };
};
exports.rateLimit = rateLimit;
// ========== LOG REQUEST MIDDLEWARE ==========
const logRequest = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.logRequest = logRequest;
// ========== REMOVED - requireEmailVerification (email_verified doesn't exist) ==========
// ========== REMOVED - validateCsrf (session doesn't exist) ==========
// ========== EXPORT ALL ==========
exports.default = {
    protect: exports.protect,
    optionalAuth: exports.optionalAuth,
    restrictToOwnUser: exports.restrictToOwnUser,
    rateLimit: exports.rateLimit,
    logRequest: exports.logRequest
};
