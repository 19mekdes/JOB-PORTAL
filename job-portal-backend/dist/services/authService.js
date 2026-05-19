"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// ========== AUTH SERVICE ==========
class AuthService {
    constructor() {
        this.prisma = prisma;
    }
    // Helper function to generate JWT token
    generateToken(userId, email) {
        const payload = { id: userId, email: email };
        const secret = process.env.JWT_SECRET || 'default_secret';
        const options = {
            expiresIn: '7d'
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    // Helper function to generate refresh token
    generateRefreshToken(userId) {
        const payload = { id: userId };
        const secret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
        const options = {
            expiresIn: '30d'
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    // ========== REGISTER ==========
    async register(userData) {
        const { email, password, full_name, user_type, phone, location } = userData;
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Get user type
        const userType = await this.prisma.userType.findFirst({
            where: { type_name: user_type }
        });
        if (!userType) {
            throw new Error('Invalid user type');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                user_type_id: userType.id,
                is_active: true
            }
        });
        // Create profile based on user type
        if (user_type === 'Job Seeker') {
            await this.prisma.jobSeekerProfile.create({
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
            await this.prisma.employerProfile.create({
                data: {
                    user_id: user.id,
                    company_name: full_name,
                    location: location || null,
                    industry_id: 1
                }
            });
        }
        // Generate token
        const token = this.generateToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);
        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                user_type: user_type,
                full_name: full_name
            }
        };
    }
    // ========== LOGIN ==========
    async login(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            }
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (!user.is_active) {
            throw new Error('Your account has been suspended. Please contact support.');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const token = this.generateToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);
        const profile = user.seeker_profile || user.employer_profile;
        const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name;
        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                user_type: user.user_type.type_name,
                full_name: fullName,
                profile_completed: !!profile
            }
        };
    }
    // ========== GET CURRENT USER ==========
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
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
            throw new Error('User not found');
        }
        const profile = user.seeker_profile || user.employer_profile;
        return {
            id: user.id,
            email: user.email,
            user_type: user.user_type.type_name,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            profile: profile,
            unread_notifications: user.notifications.length,
            notifications: user.notifications
        };
    }
    // ========== CHANGE PASSWORD ==========
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        await this.prisma.notification.create({
            data: {
                user_id: userId,
                title: 'Password Changed',
                message: 'Your password was successfully changed.',
                type: 'security'
            }
        });
        return { message: 'Password changed successfully' };
    }
    // ========== FORGOT PASSWORD ==========
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            // For security, don't reveal if email exists
            return { message: 'If an account exists, a password reset link will be sent' };
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 1);
        console.log(`Password reset link: http://localhost:3000/reset-password/${resetToken}`);
        return { message: 'If an account exists, a password reset link will be sent' };
    }
    // ========== RESET PASSWORD ==========
    async resetPassword(token, newPassword) {
        // For now, just return success
        // In production, verify token and update password
        return { message: 'Password reset successfully' };
    }
    // ========== REFRESH TOKEN ==========
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.id }
            });
            if (!user) {
                throw new Error('Invalid refresh token');
            }
            const newToken = this.generateToken(user.id, user.email);
            return { token: newToken };
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    // ========== UPDATE PROFILE ==========
    async updateProfile(userId, profileData) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        let updatedProfile;
        if (user.user_type.type_name === 'Job Seeker' && user.seeker_profile) {
            updatedProfile = await this.prisma.jobSeekerProfile.update({
                where: { user_id: userId },
                data: {
                    full_name: profileData.full_name,
                    phone: profileData.phone,
                    location: profileData.location,
                    skills: profileData.skills
                }
            });
        }
        else if (user.user_type.type_name === 'Employer' && user.employer_profile) {
            updatedProfile = await this.prisma.employerProfile.update({
                where: { user_id: userId },
                data: {
                    company_name: profileData.company_name,
                    website: profileData.website,
                    location: profileData.location
                }
            });
        }
        return updatedProfile;
    }
}
exports.AuthService = AuthService;
// ========== DEFAULT EXPORT ==========
exports.default = new AuthService();
