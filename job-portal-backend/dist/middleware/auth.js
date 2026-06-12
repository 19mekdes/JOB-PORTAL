"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.'
            });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};
exports.authMiddleware = authMiddleware;
exports.default = exports.authMiddleware;
