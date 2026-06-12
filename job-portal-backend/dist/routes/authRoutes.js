"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// ========== PUBLIC ROUTES (No authentication required) ==========
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/refresh-token', authController_1.refreshToken);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password/:token', authController_1.resetPassword);
router.post('/verify-reset-token', authController_1.verifyResetToken);
// ========== PROTECTED ROUTES (Authentication required) ==========
router.get('/me', authMiddleware_1.authMiddleware, authController_1.getMe);
router.post('/logout', authMiddleware_1.authMiddleware, authController_1.logout);
router.post('/change-password', authMiddleware_1.authMiddleware, authController_1.changePassword);
router.put('/profile', authMiddleware_1.authMiddleware, authController_1.updateProfile);
// ========== ROLE-BASED ROUTES ==========
router.get('/admin/dashboard', authMiddleware_1.authMiddleware, authMiddleware_1.isAdmin, (req, res) => {
    res.json({ message: 'Admin access granted' });
});
router.get('/employer/dashboard', authMiddleware_1.authMiddleware, authMiddleware_1.isEmployer, (req, res) => {
    res.json({ message: 'Employer access granted' });
});
router.get('/jobseeker/dashboard', authMiddleware_1.authMiddleware, authMiddleware_1.isJobSeeker, (req, res) => {
    res.json({ message: 'Job Seeker access granted' });
});
exports.default = router;
