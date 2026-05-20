"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/uploadRoutes.ts
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware"); // ← Use 'protect' instead of 'authMiddleware'
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// ========== UPLOAD COVER IMAGE ==========
router.post('/cover', authMiddleware_1.protect, uploadMiddleware_1.uploadCover, async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        // Delete old cover image if exists
        if (profile.cover_image) {
            const oldPath = path_1.default.join(process.cwd(), profile.cover_image);
            if (fs_1.default.existsSync(oldPath)) {
                fs_1.default.unlinkSync(oldPath);
            }
        }
        const coverUrl = `/uploads/covers/${req.file.filename}`;
        const updatedProfile = await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: { cover_image: coverUrl }
        });
        res.json({
            success: true,
            data: { cover_image: updatedProfile.cover_image },
            message: 'Cover image uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error uploading cover image:', error);
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== UPLOAD PROFILE PICTURE (AVATAR) ==========
router.post('/avatar', authMiddleware_1.protect, uploadMiddleware_1.uploadAvatar, async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        // Delete old avatar if exists
        if (profile.avatar) {
            const oldPath = path_1.default.join(process.cwd(), profile.avatar);
            if (fs_1.default.existsSync(oldPath)) {
                fs_1.default.unlinkSync(oldPath);
            }
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const updatedProfile = await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: { avatar: avatarUrl }
        });
        res.json({
            success: true,
            data: { avatar: updatedProfile.avatar },
            message: 'Profile picture uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error uploading profile picture:', error);
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== UPLOAD RESUME ==========
router.post('/resume', authMiddleware_1.protect, uploadMiddleware_1.uploadResume, async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        // Delete old resume if exists
        if (profile.resume_url) {
            const oldPath = path_1.default.join(process.cwd(), profile.resume_url);
            if (fs_1.default.existsSync(oldPath)) {
                fs_1.default.unlinkSync(oldPath);
            }
        }
        const resumeUrl = `/uploads/resumes/${req.file.filename}`;
        const updatedProfile = await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: { resume_url: resumeUrl }
        });
        res.json({
            success: true,
            data: { resume_url: updatedProfile.resume_url },
            message: 'Resume uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error uploading resume:', error);
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== DELETE COVER IMAGE ==========
router.delete('/cover', authMiddleware_1.protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        if (profile.cover_image) {
            const imagePath = path_1.default.join(process.cwd(), profile.cover_image);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: { cover_image: null }
        });
        res.json({ success: true, message: 'Cover image removed successfully' });
    }
    catch (error) {
        console.error('Error removing cover image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== DELETE PROFILE PICTURE ==========
router.delete('/avatar', authMiddleware_1.protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        if (profile.avatar) {
            const imagePath = path_1.default.join(process.cwd(), profile.avatar);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: { avatar: null }
        });
        res.json({ success: true, message: 'Profile picture removed successfully' });
    }
    catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== DELETE RESUME ==========
router.delete('/resume', authMiddleware_1.protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        if (profile.resume_url) {
            const filePath = path_1.default.join(process.cwd(), profile.resume_url);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: { resume_url: null }
        });
        res.json({ success: true, message: 'Resume removed successfully' });
    }
    catch (error) {
        console.error('Error removing resume:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
