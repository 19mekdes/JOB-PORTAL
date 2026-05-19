"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.refreshToken = exports.resendVerificationEmail = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.logout = exports.getMe = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// Helper function to generate JWT token
const generateToken = (userId, email) => {
    const payload = { id: userId, email: email };
    const secret = process.env.JWT_SECRET;
    // Use type assertion to bypass TypeScript checking
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    return token;
};
// Helper function to generate refresh token
const generateRefreshToken = (userId) => {
    const payload = { id: userId };
    const secret = process.env.JWT_REFRESH_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '30d' });
    return token;
};
// ========== REGISTER USER ==========
const register = async (req, res) => {
    try {
        const { email, password, full_name, user_type, phone, location } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }
        // Get user type
        const userType = await prisma.userType.findFirst({
            where: { type_name: user_type }
        });
        if (!userType) {
            res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
            return;
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                user_type_id: userType.id,
                is_active: true
            }
        });
        // Create profile based on user type
        if (user_type === 'Job Seeker') {
            await prisma.jobSeekerProfile.create({
                data: {
                    user_id: user.id,
                    full_name: full_name,
                    phone: phone || null,
                    location: location || null,
                    skills: []
                }
            });
        }
        else if (user_type === 'Employer') {
            await prisma.employerProfile.create({
                data: {
                    user_id: user.id,
                    company_name: full_name,
                    location: location || null,
                    industry_id: 1 // Default industry
                }
            });
        }
        // Generate token
        const token = generateToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id);
        res.status(201).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                user_type: user_type,
                full_name: full_name
            },
            message: 'Registration successful'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.register = register;
// ========== LOGIN USER ==========
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Check if user is active
        if (!user.is_active) {
            res.status(401).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
            return;
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Generate tokens
        const token = generateToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id);
        // Get profile data
        const profile = user.seeker_profile || user.employer_profile;
        const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name;
        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                user_type: user.user_type.type_name,
                full_name: fullName,
                profile_completed: !!profile
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.login = login;
// ========== GET CURRENT USER ==========
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: {
                        industry: true
                    }
                },
                notifications: {
                    where: { is_read: false },
                    orderBy: { created_at: 'desc' },
                    take: 10
                }
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const profile = user.seeker_profile || user.employer_profile;
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                user_type: user.user_type.type_name,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
                profile: profile,
                unread_notifications: user.notifications.length,
                notifications: user.notifications
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getMe = getMe;
// ========== LOGOUT USER ==========
const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.logout = logout;
// ========== CHANGE PASSWORD ==========
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        // Verify current password
        const isPasswordValid = await bcryptjs_1.default.compare(current_password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
            return;
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(new_password, 10);
        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });
        // Create notification
        await prisma.notification.create({
            data: {
                user_id: req.user.id,
                title: 'Password Changed',
                message: 'Your password was successfully changed.',
                type: 'security'
            }
        });
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.changePassword = changePassword;
// ========== FORGOT PASSWORD ==========
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            // For security, don't reveal if email exists
            res.json({
                success: true,
                message: 'If an account exists with that email, you will receive a password reset link'
            });
            return;
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour
        console.log(`Password reset link: http://localhost:3000/reset-password/${resetToken}`);
        res.json({
            success: true,
            message: 'If an account exists with that email, you will receive a password reset link'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.forgotPassword = forgotPassword;
// ========== RESET PASSWORD ==========
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { new_password } = req.body;
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.resetPassword = resetPassword;
// ========== VERIFY EMAIL ==========
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.verifyEmail = verifyEmail;
// ========== RESEND VERIFICATION EMAIL ==========
const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        res.json({
            success: true,
            message: 'Verification email sent successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
// ========== REFRESH TOKEN ==========
const refreshToken = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
            return;
        }
        // Verify refresh token
        const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
            return;
        }
        // Generate new access token
        const newToken = generateToken(user.id, user.email);
        res.json({
            success: true,
            token: newToken
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};
exports.refreshToken = refreshToken;
// ========== UPDATE PROFILE ==========
const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, location, skills, company_name, website } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        let updatedProfile;
        if (user.user_type.type_name === 'Job Seeker' && user.seeker_profile) {
            updatedProfile = await prisma.jobSeekerProfile.update({
                where: { user_id: user.id },
                data: {
                    full_name: full_name || undefined,
                    phone: phone || undefined,
                    location: location || undefined,
                    skills: skills || undefined
                }
            });
        }
        else if (user.user_type.type_name === 'Employer' && user.employer_profile) {
            updatedProfile = await prisma.employerProfile.update({
                where: { user_id: user.id },
                data: {
                    company_name: company_name || undefined,
                    website: website || undefined,
                    location: location || undefined
                }
            });
        }
        res.json({
            success: true,
            data: updatedProfile,
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateProfile = updateProfile;
