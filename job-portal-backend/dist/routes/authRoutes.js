"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = express_1.default.Router();
// ========== PUBLIC ROUTES (No authentication required) ==========
router.post('/register', validationMiddleware_1.registerValidation, authController_1.register);
router.post('/login', validationMiddleware_1.loginValidation, authController_1.login);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password/:token', authController_1.resetPassword);
router.get('/verify-email/:token', authController_1.verifyEmail);
router.post('/resend-verification', authController_1.resendVerificationEmail);
router.post('/refresh-token', authController_1.refreshToken);
// ========== PROTECTED ROUTES (Authentication required) ==========
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
router.post('/logout', authMiddleware_1.protect, authController_1.logout);
router.post('/change-password', authMiddleware_1.protect, authController_1.changePassword);
router.put('/profile', authMiddleware_1.protect, authController_1.updateProfile);
exports.default = router;
