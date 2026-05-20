"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Add this at the top of server.ts right after imports
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
console.log('🚀 Starting server initialization...');
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const nodemailer_1 = __importDefault(require("nodemailer"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// ========== CLOUDINARY CONFIGURATION ==========
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Helper to extract Cloudinary Public ID from an image URL for deletion
const getPublicIdFromUrl = (url) => {
    try {
        // Expected format: .../upload/v123456789/jobportal/images/img-name.jpg
        const parts = url.split('/upload/');
        if (parts.length < 2)
            return null;
        // Remove the version segment (e.g., "v123456789/") and file extension
        const pathWithExtension = parts[1].replace(/^v\d+\//, '');
        return pathWithExtension.substring(0, pathWithExtension.lastIndexOf('.'));
    }
    catch (error) {
        console.error('Error parsing Cloudinary URL public ID:', error);
        return null;
    }
};
// ========== MULTER CONFIGURATION ==========
// 1. Keep Local Engine for Resumes
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/resumes';
        if (!fs_1.default.existsSync(uploadDir))
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `resume-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
});
// 2. NEW: Cloudinary Engine for Images
const cloudinaryImageStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        return {
            folder: 'jobportal/images',
            allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
            public_id: `img-${Date.now()}-${Math.round(Math.random() * 1E9)}`
        };
    }
});
const uploadImage = (0, multer_1.default)({
    storage: cloudinaryImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});
// Configure email transporter (use your email service)
const emailTransporter = nodemailer_1.default.createTransport({
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// Email template function
async function sendEmail(to, subject, html) {
    try {
        await emailTransporter.sendMail({
            from: `"Job Portal" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`✅ Email sent to ${to}`);
    }
    catch (error) {
        console.error('Email sending failed:', error);
    }
}
// Send application status update email
async function sendApplicationStatusEmail(userEmail, userName, jobTitle, status, companyName) {
    const statusColors = {
        'Pending': '#f59e0b',
        'Reviewed': '#3b82f6',
        'Shortlisted': '#8b5cf6',
        'Interview': '#06b6d4',
        'Accepted': '#10b981',
        'Rejected': '#ef4444'
    };
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; background: ${statusColors[status] || '#6b7280'}; color: white; }
        .button { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Job Portal</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>Your application status for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
          <p style="text-align: center; margin: 30px 0;">
            <span class="status">${status}</span>
          </p>
          <p>Log in to your account to view more details and next steps.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/applications" class="button">View Applications</a>
          </p>
        </div>
        <div class="footer">
          <p>Job Portal - Connecting Talent with Opportunity</p>
          <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    await sendEmail(userEmail, `Application Status Update: ${status}`, html);
    // Send new job alert email
    async function sendNewJobAlertEmail(userEmail, userName, jobs) {
        const jobsList = jobs.map(job => `
    <div style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
      <h3 style="margin: 0 0 5px 0;">${job.title}</h3>
      <p style="color: #6b7280; margin: 0;">${job.employer?.company_name || 'Unknown Company'} • ${job.location}</p>
      <p style="color: #6b7280; font-size: 14px;">Salary: ${job.salary_range || 'Competitive'}</p>
      <a href="${process.env.FRONTEND_URL}/jobs/${job.id}" style="color: #2563eb; text-decoration: none;">View Details →</a>
    </div>
  `).join('');
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Jobs Matching Your Preferences</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>We found ${jobs.length} new job${jobs.length > 1 ? 's' : ''} that match your profile:</p>
          ${jobsList}
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/jobs" class="button">Browse All Jobs</a>
          </p>
        </div>
        <div class="footer">
          <p>You received this email because you subscribed to job alerts.</p>
          <p><a href="${process.env.FRONTEND_URL}/jobseeker/preferences">Manage Preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
        await sendEmail(userEmail, `🔔 New Job${jobs.length > 1 ? 's' : ''} Alert`, html);
    }
    // ========== MIDDLEWARE ==========
    app.use((0, cors_1.default)({ origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
    app.options('*', (0, cors_1.default)());
    app.use(express_1.default.json());
    app.use('/uploads', express_1.default.static('uploads'));
    // ========== AUTH MIDDLEWARE ==========
    const authMiddleware = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader)
                return res.status(401).json({ success: false, message: 'No token provided' });
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (error) {
            res.status(401).json({ success: false, message: 'Invalid token' });
        }
    };
    const superAdminMiddleware = async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { user_type: true } });
            if (user?.user_type?.type_name !== 'Super Admin')
                return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' });
            next();
        }
        catch (error) {
            res.status(403).json({ success: false, message: 'Access denied' });
        }
    };
    async function createNotification(userId, title, message, type, metadata) {
        try {
            return await prisma.notification.create({
                data: { user_id: userId, title, message, type, metadata: metadata || {}, created_at: new Date() }
            });
        }
        catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }
    // ========== INITIALIZE DEFAULT DATA ==========
    async function initializeDefaultData() {
        const userTypes = await prisma.userType.findMany();
        if (userTypes.length === 0) {
            await prisma.userType.createMany({ data: [{ type_name: 'Job Seeker' }, { type_name: 'Employer' }, { type_name: 'Admin' }, { type_name: 'Super Admin' }] });
        }
        const jobStatuses = await prisma.jobPostStatus.findMany();
        if (jobStatuses.length === 0) {
            await prisma.jobPostStatus.createMany({ data: [{ status_name: 'Open' }, { status_name: 'Closed' }, { status_name: 'Draft' }, { status_name: 'Archived' }] });
        }
        const appStatuses = await prisma.jobApplicationStatus.findMany();
        if (appStatuses.length === 0) {
            await prisma.jobApplicationStatus.createMany({ data: [{ status_name: 'Pending' }, { status_name: 'Reviewed' }, { status_name: 'Shortlisted' }, { status_name: 'Interview' }, { status_name: 'Accepted' }, { status_name: 'Rejected' }] });
        }
        const empTypes = await prisma.employmentType.findMany();
        if (empTypes.length === 0) {
            await prisma.employmentType.createMany({ data: [{ type_name: 'Full-time' }, { type_name: 'Part-time' }, { type_name: 'Contract' }, { type_name: 'Remote' }, { type_name: 'Hybrid' }, { type_name: 'Internship' }] });
        }
        const industries = await prisma.jobIndustry.findMany();
        if (industries.length === 0) {
            const industryList = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Construction'];
            for (const industry of industryList) {
                await prisma.jobIndustry.create({ data: { industry_name: industry } });
            }
        }
    }
    // ========== AUTH ROUTES ==========
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, full_name, user_type } = req.body;
            await initializeDefaultData();
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser)
                return res.status(400).json({ success: false, message: 'User already exists' });
            const userType = await prisma.userType.findFirst({ where: { type_name: user_type } });
            if (!userType)
                return res.status(400).json({ success: false, message: 'Invalid user type' });
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const user = await prisma.user.create({ data: { email, password: hashedPassword, user_type_id: userType.id, is_active: true, created_at: new Date(), updated_at: new Date() } });
            if (user_type === 'Job Seeker') {
                await prisma.jobSeekerProfile.create({ data: { user_id: user.id, full_name: full_name, skills: [] } });
            }
            else if (user_type === 'Employer') {
                const defaultIndustry = await prisma.jobIndustry.findFirst();
                await prisma.employerProfile.create({ data: { user_id: user.id, company_name: full_name, industry_id: defaultIndustry?.id || 1 } });
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, user_type, full_name } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await prisma.user.findUnique({ where: { email }, include: { user_type: true, seeker_profile: true, employer_profile: true } });
            if (!user)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name;
            res.json({ success: true, token, user: { id: user.id, email: user.email, user_type: user.user_type.type_name, full_name: fullName } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== PROFILE ROUTES ==========
    app.get('/api/profile/me', authMiddleware, async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { user_type: true, seeker_profile: true, employer_profile: { include: { industry: true } } }
            });
            if (!user)
                return res.status(404).json({ success: false, message: 'User not found' });
            const profile = user.seeker_profile || user.employer_profile;
            res.json({
                success: true,
                data: {
                    user: { id: user.id, email: user.email, user_type: user.user_type?.type_name },
                    profile
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.put('/api/auth/profile', authMiddleware, uploadImage.single('avatar'), async (req, res) => {
        try {
            const userId = req.user.id;
            const { full_name, phone, location, title, bio, linkedin_url, github_url, portfolio_url, availability, skills, cover_image } = req.body;
            let profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
            if (!profile) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                profile = await prisma.jobSeekerProfile.create({ data: { user_id: userId, full_name: user?.full_name || 'Job Seeker', skills: [] } });
            }
            const updateData = {};
            if (req.file) {
                if (profile.avatar) {
                    const oldPublicId = getPublicIdFromUrl(profile.avatar);
                    if (oldPublicId)
                        await cloudinary_1.v2.uploader.destroy(oldPublicId);
                }
                updateData.avatar = req.file.path; // Cloudinary URL
            }
            if (cover_image && cover_image !== 'undefined')
                updateData.cover_image = cover_image;
            if (full_name && full_name !== 'undefined')
                updateData.full_name = full_name;
            if (phone && phone !== 'undefined')
                updateData.phone = phone;
            if (location && location !== 'undefined')
                updateData.location = location;
            if (title && title !== 'undefined')
                updateData.title = title;
            if (bio && bio !== 'undefined')
                updateData.bio = bio;
            if (linkedin_url && linkedin_url !== 'undefined')
                updateData.linkedin_url = linkedin_url;
            if (github_url && github_url !== 'undefined')
                updateData.github_url = github_url;
            if (portfolio_url && portfolio_url !== 'undefined')
                updateData.portfolio_url = portfolio_url;
            if (availability && availability !== 'undefined')
                updateData.availability = availability;
            if (skills && skills !== 'undefined') {
                updateData.skills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(s => s) : skills;
            }
            const updatedProfile = await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: updateData });
            if (full_name) {
                await prisma.user.update({ where: { id: userId }, data: { full_name } });
            }
            res.json({ success: true, data: { profile: updatedProfile }, message: 'Profile updated successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== JOB SEEKER PROFILE CLOUD UPLOADS ==========
    app.post('/api/profile/cover', authMiddleware, uploadImage.single('cover_image'), async (req, res) => {
        try {
            const userId = req.user.id;
            if (!req.file)
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            let profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
            if (!profile) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                profile = await prisma.jobSeekerProfile.create({ data: { user_id: userId, full_name: user?.full_name || 'Job Seeker', skills: [] } });
            }
            if (profile.cover_image) {
                const oldPublicId = getPublicIdFromUrl(profile.cover_image);
                if (oldPublicId)
                    await cloudinary_1.v2.uploader.destroy(oldPublicId);
            }
            const updatedProfile = await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { cover_image: req.file.path } });
            res.json({ success: true, data: { cover_image: updatedProfile.cover_image }, message: 'Cover image uploaded successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.post('/api/profile/avatar', authMiddleware, uploadImage.single('avatar'), async (req, res) => {
        try {
            const userId = req.user.id;
            if (!req.file)
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            let profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
            if (!profile) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                profile = await prisma.jobSeekerProfile.create({ data: { user_id: userId, full_name: user?.full_name || 'Job Seeker', skills: [] } });
            }
            if (profile.avatar) {
                const oldPublicId = getPublicIdFromUrl(profile.avatar);
                if (oldPublicId)
                    await cloudinary_1.v2.uploader.destroy(oldPublicId);
            }
            const updatedProfile = await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { avatar: req.file.path } });
            res.json({ success: true, data: { avatar: updatedProfile.avatar }, message: 'Profile picture uploaded successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.delete('/api/profile/cover', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
            if (!profile || !profile.cover_image)
                return res.status(404).json({ success: false, message: 'Cover image not found' });
            const oldPublicId = getPublicIdFromUrl(profile.cover_image);
            if (oldPublicId)
                await cloudinary_1.v2.uploader.destroy(oldPublicId);
            await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { cover_image: null } });
            res.json({ success: true, message: 'Cover image removed successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== EMPLOYER PROFILE ROUTES ==========
    app.get('/api/employer/profile', authMiddleware, async (req, res) => {
        try {
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: req.user.id }, include: { industry: true } });
            if (!employer)
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            res.json({ success: true, data: employer });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.put('/api/employer/profile', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const { company_name, company_description, website, location, company_size, industry_id } = req.body;
            const employer = await prisma.employerProfile.update({
                where: { user_id: userId },
                data: { company_name, company_description, website, location, company_size, industry_id: industry_id ? parseInt(industry_id) : undefined }
            });
            res.json({ success: true, data: employer, message: 'Profile updated successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== EMPLOYER PROFILE CLOUD UPLOADS ==========
    app.post('/api/employer/cover', authMiddleware, uploadImage.single('cover_image'), async (req, res) => {
        try {
            const userId = req.user.id;
            if (!req.file)
                return res.status(400).json({ success: false, message: 'No banner file uploaded' });
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } });
            if (!employer)
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            if (employer.cover_image) {
                const oldPublicId = getPublicIdFromUrl(employer.cover_image);
                if (oldPublicId)
                    await cloudinary_1.v2.uploader.destroy(oldPublicId);
            }
            const updated = await prisma.employerProfile.update({
                where: { id: employer.id },
                data: { cover_image: req.file.path } // Secure Cloudinary Link URL
            });
            res.json({ success: true, data: { cover_image: updated.cover_image }, message: 'Company banner uploaded successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.post('/api/employer/logo', authMiddleware, uploadImage.single('logo'), async (req, res) => {
        try {
            const userId = req.user.id;
            if (!req.file)
                return res.status(400).json({ success: false, message: 'No logo file uploaded' });
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } });
            if (!employer)
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            if (employer.logo_url) {
                const oldPublicId = getPublicIdFromUrl(employer.logo_url);
                if (oldPublicId)
                    await cloudinary_1.v2.uploader.destroy(oldPublicId);
            }
            const updated = await prisma.employerProfile.update({
                where: { id: employer.id },
                data: { logo_url: req.file.path } // Secure Cloudinary Link URL
            });
            res.json({ success: true, data: { logo_url: updated.logo_url }, message: 'Company logo uploaded successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.delete('/api/employer/cover', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } });
            if (!employer || !employer.cover_image)
                return res.status(404).json({ success: false, message: 'Company banner not found' });
            const oldPublicId = getPublicIdFromUrl(employer.cover_image);
            if (oldPublicId)
                await cloudinary_1.v2.uploader.destroy(oldPublicId);
            await prisma.employerProfile.update({ where: { id: employer.id }, data: { cover_image: null } });
            res.json({ success: true, message: 'Company banner removed successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== JOB ROUTES ==========
    app.get('/api/jobs', async (req, res) => {
        try {
            const jobs = await prisma.jobPost.findMany({
                where: { status_id: 1 },
                include: { employer: { include: { user: true } }, industry: true, employment_type: true, status: true },
                orderBy: { created_at: 'desc' }
            });
            res.json({ success: true, data: jobs });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.get('/api/jobs/:id', async (req, res) => {
        try {
            const job = await prisma.jobPost.findUnique({
                where: { id: req.params.id },
                include: { employer: { include: { user: true } }, industry: true, employment_type: true, status: true }
            });
            if (!job)
                return res.status(404).json({ success: false, message: 'Job not found' });
            if (job.status.status_name !== 'Open') {
                const authHeader = req.headers.authorization;
                if (authHeader) {
                    try {
                        const decoded = jsonwebtoken_1.default.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                        const employer = await prisma.employerProfile.findFirst({ where: { user_id: decoded.id } });
                        if (employer && employer.id === job.employer_id)
                            return res.json({ success: true, data: job });
                    }
                    catch (e) { }
                }
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            await prisma.jobPost.update({ where: { id: req.params.id }, data: { views_count: { increment: 1 } } });
            res.json({ success: true, data: job });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.post('/api/jobs', authMiddleware, async (req, res) => {
        try {
            const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote } = req.body;
            const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { user_type: true, employer_profile: true } });
            if (user?.user_type?.type_name !== 'Employer')
                return res.status(403).json({ success: false, message: 'Only employers can post jobs' });
            if (!user.employer_profile)
                return res.status(403).json({ success: false, message: 'Please complete your employer profile first' });
            if (!title || !description || !location || !employment_type_id || !industry_id)
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            const openStatus = await prisma.jobPostStatus.findFirst({ where: { status_name: 'Open' } });
            const job = await prisma.jobPost.create({
                data: {
                    title, description, requirements: requirements || '', benefits: benefits || '', location,
                    employer_id: user.employer_profile.id, employment_type_id: parseInt(employment_type_id),
                    industry_id: parseInt(industry_id), salary_min: salary_min ? parseFloat(salary_min) : null,
                    salary_max: salary_max ? parseFloat(salary_max) : null, is_remote: is_remote || false,
                    status_id: openStatus.id, created_at: new Date(), views_count: 0, applications_count: 0
                }
            });
            res.status(201).json({ success: true, data: job, message: 'Job posted successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.put('/api/jobs/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote, status_id } = req.body;
            const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { employer_profile: true } });
            if (!user?.employer_profile)
                return res.status(403).json({ success: false, message: 'Employer not found' });
            const existingJob = await prisma.jobPost.findFirst({ where: { id, employer_id: user.employer_profile.id } });
            if (!existingJob)
                return res.status(404).json({ success: false, message: 'Job not found' });
            const updatedJob = await prisma.jobPost.update({
                where: { id },
                data: {
                    title: title || existingJob.title,
                    description: description || existingJob.description,
                    requirements: requirements !== undefined ? requirements : existingJob.requirements,
                    benefits: benefits !== undefined ? benefits : existingJob.benefits,
                    location: location || existingJob.location,
                    employment_type_id: employment_type_id ? parseInt(employment_type_id) : existingJob.employment_type_id,
                    industry_id: industry_id ? parseInt(industry_id) : existingJob.industry_id,
                    salary_min: salary_min !== undefined ? parseFloat(salary_min) : existingJob.salary_min,
                    salary_max: salary_max !== undefined ? parseFloat(salary_max) : existingJob.salary_max,
                    is_remote: is_remote !== undefined ? is_remote : existingJob.is_remote,
                    status_id: status_id || existingJob.status_id,
                    updated_at: new Date()
                }
            });
            res.json({ success: true, data: updatedJob, message: 'Job updated successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { user_type: true, employer_profile: true } });
            const job = await prisma.jobPost.findUnique({ where: { id }, include: { employer: true } });
            if (!job)
                return res.status(404).json({ success: false, message: 'Job not found' });
            const isOwner = job.employer.user_id === req.user.id;
            const isAdmin = user?.user_type?.type_name === 'Admin' || user?.user_type?.type_name === 'Super Admin';
            if (!isOwner && !isAdmin)
                return res.status(403).json({ success: false, message: 'Not authorized' });
            await prisma.jobPost.delete({ where: { id } });
            res.json({ success: true, message: 'Job deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== EMPLOYER DASHBOARD & ANALYTICS ==========
    // Get employer dashboard statistics
    app.get('/api/employer/dashboard', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            // Find employer profile
            const employer = await prisma.employerProfile.findFirst({
                where: { user_id: userId }
            });
            if (!employer) {
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            }
            // Get all jobs for this employer with relations
            const jobs = await prisma.jobPost.findMany({
                where: { employer_id: employer.id },
                include: {
                    status: true,
                    employment_type: true, // ← Add this to include employment_type
                    _count: {
                        select: { applications: true }
                    }
                }
            });
            // Calculate statistics
            const totalJobs = jobs.length;
            const activeJobs = jobs.filter(job => job.status?.status_name === 'Open').length;
            const closedJobs = jobs.filter(job => job.status?.status_name === 'Closed').length;
            const draftJobs = jobs.filter(job => job.status?.status_name === 'Draft').length;
            const totalApplications = jobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0);
            // Get recent applications (last 10)
            const recentApplications = await prisma.jobApplication.findMany({
                where: {
                    job: {
                        employer_id: employer.id
                    }
                },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true
                        }
                    },
                    seeker: {
                        select: {
                            id: true,
                            full_name: true,
                            avatar: true
                        }
                    },
                    status: true
                },
                orderBy: { applied_at: 'desc' },
                take: 10
            });
            // Get recent jobs (last 5)
            const recentJobs = await prisma.jobPost.findMany({
                where: { employer_id: employer.id },
                include: {
                    status: true,
                    employment_type: true // ← Add this here too
                },
                orderBy: { created_at: 'desc' },
                take: 5
            });
            // Get applications by status
            const applicationsByStatus = await prisma.jobApplication.groupBy({
                by: ['status_id'],
                where: {
                    job: {
                        employer_id: employer.id
                    }
                },
                _count: {
                    id: true
                }
            });
            // Get status names
            const statuses = await prisma.jobApplicationStatus.findMany();
            const statusCounts = applicationsByStatus.map(item => ({
                status: statuses.find(s => s.id === item.status_id)?.status_name || 'Unknown',
                count: item._count.id
            }));
            res.json({
                success: true,
                data: {
                    totalJobs,
                    activeJobs,
                    closedJobs,
                    draftJobs,
                    totalApplications,
                    recentApplications,
                    recentJobs,
                    applicationsByStatus: statusCounts
                }
            });
        }
        catch (error) {
            console.error('Error fetching employer dashboard:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // Get employer analytics/charts data
    app.get('/api/employer/analytics', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const { period = '30d' } = req.query;
            // Calculate date range
            const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const employer = await prisma.employerProfile.findFirst({
                where: { user_id: userId }
            });
            if (!employer) {
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            }
            // Get jobs with employment_type relation
            const jobs = await prisma.jobPost.findMany({
                where: { employer_id: employer.id },
                include: {
                    employment_type: true, // ← Add this
                    applications: {
                        where: {
                            applied_at: { gte: startDate }
                        }
                    }
                }
            });
            // Applications over time
            const applicationsOverTime = await prisma.jobApplication.findMany({
                where: {
                    job: { employer_id: employer.id },
                    applied_at: { gte: startDate }
                },
                select: {
                    applied_at: true,
                    status: true
                },
                orderBy: { applied_at: 'asc' }
            });
            // Group applications by date
            const applicationsByDate = {};
            applicationsOverTime.forEach(app => {
                const date = app.applied_at.toISOString().split('T')[0];
                applicationsByDate[date] = (applicationsByDate[date] || 0) + 1;
            });
            // Jobs by type
            const jobsByType = jobs.reduce((acc, job) => {
                const type = job.employment_type?.type_name || 'Unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});
            // Applications by status
            const allApplications = await prisma.jobApplication.findMany({
                where: { job: { employer_id: employer.id } },
                include: { status: true }
            });
            const applicationsByStatus = allApplications.reduce((acc, app) => {
                const status = app.status?.status_name || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});
            // View trends (job views over time)
            const jobViews = jobs.map(job => ({
                title: job.title,
                views: job.views_count || 0,
                applications: job.applications_count || 0
            }));
            res.json({
                success: true,
                data: {
                    applicationsOverTime: Object.entries(applicationsByDate).map(([date, count]) => ({ date, count })),
                    jobsByType: Object.entries(jobsByType).map(([type, count]) => ({ type, count })),
                    applicationsByStatus: Object.entries(applicationsByStatus).map(([status, count]) => ({ status, count })),
                    topJobs: jobViews.sort((a, b) => b.views - a.views).slice(0, 5),
                    totalViews: jobs.reduce((sum, job) => sum + (job.views_count || 0), 0),
                    totalApplications: allApplications.length
                }
            });
        }
        catch (error) {
            console.error('Error fetching employer analytics:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== EMPLOYER DASHBOARD ==========
    app.get('/api/employer/dashboard', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const employer = await prisma.employerProfile.findFirst({
                where: { user_id: userId }
            });
            if (!employer) {
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            }
            // Get all jobs
            const jobs = await prisma.jobPost.findMany({
                where: { employer_id: employer.id },
                include: {
                    status: true,
                    employment_type: true,
                    _count: {
                        select: { applications: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            // Get all applications with job and seeker info
            const allApplications = await prisma.jobApplication.findMany({
                where: {
                    job: { employer_id: employer.id }
                },
                include: {
                    status: true,
                    job: {
                        select: { id: true, title: true }
                    },
                    seeker: {
                        include: {
                            user: {
                                select: { id: true, email: true, full_name: true }
                            }
                        }
                    }
                },
                orderBy: { applied_at: 'desc' }
            });
            // Calculate stats
            const totalJobs = jobs.length;
            const activeJobs = jobs.filter(job => job.status?.status_name === 'Open').length;
            const totalApplications = allApplications.length;
            const totalViews = jobs.reduce((sum, job) => sum + (job.views_count || 0), 0);
            // This month stats
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const thisMonthJobs = jobs.filter(job => {
                const jobDate = new Date(job.created_at);
                return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
            }).length;
            const thisMonthApplications = allApplications.filter(app => {
                const appDate = new Date(app.applied_at);
                return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
            }).length;
            const thisMonthViews = jobs.reduce((sum, job) => {
                const jobDate = new Date(job.created_at);
                if (jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear) {
                    return sum + (job.views_count || 0);
                }
                return sum;
            }, 0);
            // Status counts
            const pendingApplications = allApplications.filter(app => app.status?.status_name === 'Pending').length;
            const reviewedApplications = allApplications.filter(app => app.status?.status_name === 'Reviewed').length;
            const shortlistedApplications = allApplications.filter(app => app.status?.status_name === 'Shortlisted').length;
            const interviewApplications = allApplications.filter(app => app.status?.status_name === 'Interview').length;
            const acceptedApplications = allApplications.filter(app => app.status?.status_name === 'Accepted').length;
            const rejectedApplications = allApplications.filter(app => app.status?.status_name === 'Rejected').length;
            // FORMAT RECENT JOBS - Extract status_name as string
            const recentJobs = jobs.slice(0, 5).map(job => ({
                id: job.id,
                title: job.title,
                location: job.location,
                applications_count: job._count?.applications || 0,
                views_count: job.views_count || 0,
                status: job.status?.status_name || 'Unknown', // ← Convert to string!
                created_at: job.created_at
            }));
            // FORMAT RECENT APPLICATIONS - Extract status_name as string
            const recentApplications = allApplications.slice(0, 5).map(app => ({
                id: app.id,
                job_title: app.job?.title || 'Unknown Position',
                applicant_name: app.seeker?.full_name || app.seeker?.user?.full_name || 'Anonymous',
                status: app.status?.status_name || 'Pending', // ← Convert to string!
                applied_at: app.applied_at,
                applied_days_ago: Math.floor((Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24))
            }));
            res.json({
                success: true,
                data: {
                    totalJobs,
                    activeJobs,
                    totalApplications,
                    totalViews,
                    pendingApplications,
                    reviewedApplications,
                    shortlistedApplications,
                    interviewApplications,
                    acceptedApplications,
                    rejectedApplications,
                    thisMonthJobs,
                    thisMonthApplications,
                    thisMonthViews,
                    recentJobs,
                    recentApplications
                }
            });
        }
        catch (error) {
            console.error('Error fetching employer dashboard:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== EMPLOYER JOB ROUTES ==========
    app.get('/api/employer/jobs', authMiddleware, async (req, res) => {
        try {
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!employer)
                return res.status(404).json({ success: false, message: 'Employer profile not found' });
            const jobs = await prisma.jobPost.findMany({ where: { employer_id: employer.id }, include: { industry: true, employment_type: true, status: true }, orderBy: { created_at: 'desc' } });
            res.json({ success: true, data: jobs });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== UPDATE JOB STATUS (Open/Close job) ==========
    app.put('/api/jobs/:id/status', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'Open' or 'Closed'
            console.log(`Updating job ${id} status to:`, status);
            if (!status) {
                return res.status(400).json({ success: false, message: 'Status is required' });
            }
            // Verify employer owns this job
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { employer_profile: true }
            });
            if (!user?.employer_profile) {
                return res.status(403).json({ success: false, message: 'Employer not found' });
            }
            // Check if job exists and belongs to employer
            const job = await prisma.jobPost.findFirst({
                where: {
                    id: id,
                    employer_id: user.employer_profile.id
                }
            });
            if (!job) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            // Get the status record
            const statusRecord = await prisma.jobPostStatus.findFirst({
                where: { status_name: status }
            });
            if (!statusRecord) {
                return res.status(404).json({ success: false, message: `Status '${status}' not found` });
            }
            // Update job status
            const updatedJob = await prisma.jobPost.update({
                where: { id: id },
                data: {
                    status_id: statusRecord.id,
                    updated_at: new Date()
                },
                include: {
                    status: true,
                    industry: true,
                    employment_type: true
                }
            });
            console.log(`✅ Job ${id} status updated to ${status}`);
            res.json({
                success: true,
                data: updatedJob,
                message: `Job ${status.toLowerCase()} successfully`
            });
        }
        catch (error) {
            console.error('Error updating job status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== REOPEN JOB (Set status to Open) ==========
    app.put('/api/jobs/:id/reopen', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`Reopening job: ${id}`);
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { employer_profile: true }
            });
            if (!user?.employer_profile) {
                return res.status(403).json({ success: false, message: 'Employer not found' });
            }
            const job = await prisma.jobPost.findFirst({
                where: {
                    id: id,
                    employer_id: user.employer_profile.id
                }
            });
            if (!job) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            const openStatus = await prisma.jobPostStatus.findFirst({
                where: { status_name: 'Open' }
            });
            if (!openStatus) {
                return res.status(404).json({ success: false, message: 'Open status not found' });
            }
            const updatedJob = await prisma.jobPost.update({
                where: { id: id },
                data: {
                    status_id: openStatus.id,
                    updated_at: new Date()
                },
                include: {
                    status: true,
                    industry: true,
                    employment_type: true
                }
            });
            console.log(`✅ Job ${id} reopened successfully`);
            res.json({
                success: true,
                data: updatedJob,
                message: 'Job reopened successfully'
            });
        }
        catch (error) {
            console.error('Error reopening job:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== CLOSE JOB (Set status to Closed) ==========
    app.put('/api/jobs/:id/close', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`Closing job: ${id}`);
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { employer_profile: true }
            });
            if (!user?.employer_profile) {
                return res.status(403).json({ success: false, message: 'Employer not found' });
            }
            const job = await prisma.jobPost.findFirst({
                where: {
                    id: id,
                    employer_id: user.employer_profile.id
                }
            });
            if (!job) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            const closedStatus = await prisma.jobPostStatus.findFirst({
                where: { status_name: 'Closed' }
            });
            if (!closedStatus) {
                return res.status(404).json({ success: false, message: 'Closed status not found' });
            }
            const updatedJob = await prisma.jobPost.update({
                where: { id: id },
                data: {
                    status_id: closedStatus.id,
                    updated_at: new Date()
                },
                include: {
                    status: true,
                    industry: true,
                    employment_type: true
                }
            });
            console.log(`✅ Job ${id} closed successfully`);
            res.json({
                success: true,
                data: updatedJob,
                message: 'Job closed successfully'
            });
        }
        catch (error) {
            console.error('Error closing job:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== UPDATE JOB ==========
    app.put('/api/jobs/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote, status_id } = req.body;
            console.log('Updating job:', { id, employment_type_id, industry_id, status_id });
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { employer_profile: true }
            });
            if (!user?.employer_profile) {
                return res.status(403).json({ success: false, message: 'Employer not found' });
            }
            const existingJob = await prisma.jobPost.findFirst({
                where: { id, employer_id: user.employer_profile.id }
            });
            if (!existingJob) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            // Build update data dynamically
            const updateData = {};
            if (title !== undefined)
                updateData.title = title;
            if (description !== undefined)
                updateData.description = description;
            if (requirements !== undefined)
                updateData.requirements = requirements;
            if (benefits !== undefined)
                updateData.benefits = benefits;
            if (location !== undefined)
                updateData.location = location;
            if (is_remote !== undefined)
                updateData.is_remote = is_remote;
            // Handle employment_type_id - ensure it's a number
            if (employment_type_id !== undefined && employment_type_id !== null && employment_type_id !== '') {
                updateData.employment_type_id = typeof employment_type_id === 'string'
                    ? parseInt(employment_type_id)
                    : employment_type_id;
            }
            // Handle industry_id - ensure it's a number
            if (industry_id !== undefined && industry_id !== null && industry_id !== '') {
                updateData.industry_id = typeof industry_id === 'string'
                    ? parseInt(industry_id)
                    : industry_id;
            }
            // Handle status_id - ensure it's a number
            if (status_id !== undefined && status_id !== null && status_id !== '') {
                updateData.status_id = typeof status_id === 'string'
                    ? parseInt(status_id)
                    : status_id;
            }
            // Handle salary fields
            if (salary_min !== undefined && salary_min !== null && salary_min !== '') {
                updateData.salary_min = typeof salary_min === 'string'
                    ? parseFloat(salary_min)
                    : salary_min;
            }
            if (salary_max !== undefined && salary_max !== null && salary_max !== '') {
                updateData.salary_max = typeof salary_max === 'string'
                    ? parseFloat(salary_max)
                    : salary_max;
            }
            updateData.updated_at = new Date();
            console.log('Update data being sent to Prisma:', updateData);
            const updatedJob = await prisma.jobPost.update({
                where: { id },
                data: updateData,
                include: {
                    industry: true,
                    employment_type: true,
                    status: true
                }
            });
            console.log('Job updated successfully:', updatedJob.id);
            res.json({
                success: true,
                data: updatedJob,
                message: 'Job updated successfully'
            });
        }
        catch (error) {
            console.error('Error updating job:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.put('/api/jobs/:id/status', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, message: 'Status is required' });
            }
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { employer_profile: true }
            });
            if (!user?.employer_profile) {
                return res.status(403).json({ success: false, message: 'Employer not found' });
            }
            const job = await prisma.jobPost.findFirst({
                where: { id, employer_id: user.employer_profile.id }
            });
            if (!job) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }
            const statusRecord = await prisma.jobPostStatus.findFirst({
                where: { status_name: status }
            });
            if (!statusRecord) {
                return res.status(404).json({ success: false, message: `Status '${status}' not found` });
            }
            const updatedJob = await prisma.jobPost.update({
                where: { id },
                data: {
                    status_id: statusRecord.id,
                    updated_at: new Date()
                }
            });
            res.json({ success: true, data: updatedJob, message: `Job ${status.toLowerCase()} successfully` });
        }
        catch (error) {
            console.error('Error updating job status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== UPDATE JOB STATUS ==========
    app.put('/api/jobs/:id/status', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            console.log('=== UPDATE JOB STATUS ===');
            console.log('Job ID:', id);
            console.log('Request body:', req.body);
            console.log('Status received:', status);
            // Validate status is provided
            if (!status) {
                return res.status(400).json({ success: false, message: 'Status is required' });
            }
            // Validate status value
            if (status !== 'Open' && status !== 'Closed') {
                return res.status(400).json({ success: false, message: 'Status must be either "Open" or "Closed"' });
            }
            // Get the employer profile
            const employer = await prisma.employerProfile.findFirst({
                where: { user_id: req.user.id }
            });
            if (!employer) {
                return res.status(403).json({ success: false, message: 'Employer profile not found' });
            }
            // Check if job exists and belongs to this employer
            const job = await prisma.jobPost.findFirst({
                where: {
                    id: id,
                    employer_id: employer.id
                }
            });
            if (!job) {
                return res.status(404).json({ success: false, message: 'Job not found or you do not have permission' });
            }
            // Get the status record from database
            const statusRecord = await prisma.jobPostStatus.findFirst({
                where: { status_name: status }
            });
            if (!statusRecord) {
                return res.status(404).json({ success: false, message: `Status '${status}' not found in database` });
            }
            // Update the job status
            const updatedJob = await prisma.jobPost.update({
                where: { id: id },
                data: {
                    status_id: statusRecord.id,
                    updated_at: new Date()
                },
                include: {
                    status: true,
                    industry: true,
                    employment_type: true
                }
            });
            console.log(`✅ Job ${id} status updated to ${status}`);
            res.json({
                success: true,
                data: updatedJob,
                message: `Job ${status.toLowerCase()} successfully`
            });
        }
        catch (error) {
            console.error('Error updating job status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // SPECIFIC ROUTES FIRST - put this BEFORE any generic routes
    app.put('/api/jobs/:id/status', authMiddleware, async (req, res) => {
        // ... status update logic
    });
    // Then generic routes
    app.put('/api/jobs/:id', authMiddleware, async (req, res) => {
        // ... general update logic
    });
    app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
        // ... delete logic
    });
    // ========== LOGIN ENDPOINT ==========
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('🔐 Login attempt for email:', email);
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    user_type: true,
                    seeker_profile: true,
                    employer_profile: true
                }
            });
            if (!user) {
                console.log('❌ User not found:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            // Check if user is active
            if (!user.is_active) {
                console.log('❌ Account deactivated:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
            }
            // Verify password
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                console.log('❌ Invalid password for:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, user_type: user.user_type?.type_name }, process.env.JWT_SECRET, { expiresIn: '7d' });
            // Get user type name
            const userTypeName = user.user_type?.type_name || 'Job Seeker';
            // Get full name from profile
            let fullName = user.full_name || null;
            if (!fullName) {
                if (user.seeker_profile) {
                    fullName = user.seeker_profile.full_name;
                }
                else if (user.employer_profile) {
                    fullName = user.employer_profile.company_name;
                }
            }
            const responseUser = {
                id: user.id,
                email: user.email,
                user_type: userTypeName,
                full_name: fullName
            };
            console.log('✅ Login successful for:', email);
            console.log('👤 User type:', userTypeName);
            console.log('🔑 Token generated:', token ? 'Yes' : 'No');
            res.json({
                success: true,
                token,
                user: responseUser
            });
        }
        catch (error) {
            console.error('❌ Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });
    // ========== JOB SEEKER PREFERENCES ==========
    // Get job seeker preferences
    app.get('/api/jobseeker/preferences', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            // Check if user is a job seeker
            const seeker = await prisma.jobSeekerProfile.findFirst({
                where: { user_id: userId }
            });
            if (!seeker) {
                return res.status(403).json({ success: false, message: 'Only job seekers can access preferences' });
            }
            // Get or create preferences
            let preferences = await prisma.jobSeekerPreference.findUnique({
                where: { seeker_id: seeker.id }
            });
            if (!preferences) {
                preferences = await prisma.jobSeekerPreference.create({
                    data: {
                        seeker_id: seeker.id,
                        job_alerts_enabled: true,
                        email_notifications: true,
                        push_notifications: false,
                        profile_visibility: 'public',
                        preferred_job_types: [],
                        preferred_industries: [],
                        notification_frequency: 'instant',
                        resume_visibility: true,
                        allow_employer_contact: true
                    }
                });
            }
            res.json({ success: true, data: preferences });
        }
        catch (error) {
            console.error('Error fetching preferences:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // Update job seeker preferences
    app.put('/api/jobseeker/preferences', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const { job_alerts_enabled, email_notifications, push_notifications, profile_visibility, preferred_job_types, preferred_locations, preferred_industries, min_salary, max_salary, experience_level, notification_frequency, resume_visibility, allow_employer_contact } = req.body;
            const seeker = await prisma.jobSeekerProfile.findFirst({
                where: { user_id: userId }
            });
            if (!seeker) {
                return res.status(403).json({ success: false, message: 'Only job seekers can update preferences' });
            }
            const preferences = await prisma.jobSeekerPreference.upsert({
                where: { seeker_id: seeker.id },
                update: {
                    job_alerts_enabled,
                    email_notifications,
                    push_notifications,
                    profile_visibility,
                    preferred_job_types,
                    preferred_locations,
                    preferred_industries,
                    min_salary,
                    max_salary,
                    experience_level,
                    notification_frequency,
                    resume_visibility,
                    allow_employer_contact,
                    updated_at: new Date()
                },
                create: {
                    seeker_id: seeker.id,
                    job_alerts_enabled: job_alerts_enabled ?? true,
                    email_notifications: email_notifications ?? true,
                    push_notifications: push_notifications ?? false,
                    profile_visibility: profile_visibility ?? 'public',
                    preferred_job_types: preferred_job_types ?? [],
                    preferred_locations: preferred_locations ?? [],
                    preferred_industries: preferred_industries ?? [],
                    min_salary: min_salary ?? null,
                    max_salary: max_salary ?? null,
                    experience_level: experience_level ?? 'entry',
                    notification_frequency: notification_frequency ?? 'instant',
                    resume_visibility: resume_visibility ?? true,
                    allow_employer_contact: allow_employer_contact ?? true
                }
            });
            res.json({ success: true, data: preferences, message: 'Preferences updated successfully' });
        }
        catch (error) {
            console.error('Error updating preferences:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== GET USER PROFILE (for Settings page) ==========
    app.get('/api/profile/me', authMiddleware, async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    user_type: true,
                    seeker_profile: true,
                    employer_profile: { include: { industry: true } }
                }
            });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            // Handle both seeker and employer profiles
            let profile = null;
            let fullName = user.full_name || null;
            let phone = null;
            let title = null;
            let avatar = null;
            let coverImage = null;
            if (user.seeker_profile) {
                profile = user.seeker_profile;
                fullName = fullName || profile.full_name;
                phone = profile.phone;
                title = profile.title;
                avatar = profile.avatar;
                coverImage = profile.cover_image;
            }
            else if (user.employer_profile) {
                profile = user.employer_profile;
                fullName = fullName || profile.company_name;
                phone = profile.phone;
                title = null;
                avatar = profile.logo_url;
                coverImage = profile.cover_image;
            }
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        user_type: user.user_type?.type_name,
                        full_name: fullName
                    },
                    profile: {
                        ...profile,
                        full_name: fullName,
                        phone: phone,
                        title: title,
                        avatar: avatar,
                        cover_image: coverImage
                    }
                }
            });
        }
        catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== GET NOTIFICATION PREFERENCES ==========
    app.get('/api/notifications/preferences', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            // Get or create notification preferences
            let preferences = await prisma.notificationPreference.findUnique({
                where: { user_id: userId }
            });
            if (!preferences) {
                // Create default preferences with correct field names
                preferences = await prisma.notificationPreference.create({
                    data: {
                        user_id: userId,
                        email_notifications: true,
                        application_updates: true, // Changed from application_alerts
                        marketing_emails: false,
                        push_notifications: true,
                        status_changes: true,
                        weekly_digest: false
                    }
                });
            }
            // Map the response to match frontend expectations
            res.json({
                success: true,
                data: {
                    email_notifications: preferences.email_notifications,
                    application_alerts: preferences.application_updates, // Map to frontend field name
                    marketing_emails: preferences.marketing_emails,
                    push_notifications: preferences.push_notifications,
                    status_changes: preferences.status_changes,
                    weekly_digest: preferences.weekly_digest
                }
            });
        }
        catch (error) {
            console.error('Error fetching notification preferences:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== UPDATE NOTIFICATION PREFERENCES ==========
    app.put('/api/notifications/preferences', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const { email_notifications, application_alerts, // Frontend sends this
            marketing_emails, push_notifications, status_changes, weekly_digest } = req.body;
            // Update with correct field names
            const preferences = await prisma.notificationPreference.upsert({
                where: { user_id: userId },
                update: {
                    email_notifications: email_notifications !== undefined ? email_notifications : undefined,
                    application_updates: application_alerts !== undefined ? application_alerts : undefined, // Map to correct field
                    marketing_emails: marketing_emails !== undefined ? marketing_emails : undefined,
                    push_notifications: push_notifications !== undefined ? push_notifications : undefined,
                    status_changes: status_changes !== undefined ? status_changes : undefined,
                    weekly_digest: weekly_digest !== undefined ? weekly_digest : undefined,
                    updated_at: new Date()
                },
                create: {
                    user_id: userId,
                    email_notifications: email_notifications ?? true,
                    application_updates: application_alerts ?? true, // Map to correct field
                    marketing_emails: marketing_emails ?? false,
                    push_notifications: push_notifications ?? true,
                    status_changes: status_changes ?? true,
                    weekly_digest: weekly_digest ?? false
                }
            });
            // Return mapped response
            res.json({
                success: true,
                data: {
                    email_notifications: preferences.email_notifications,
                    application_alerts: preferences.application_updates,
                    marketing_emails: preferences.marketing_emails,
                    push_notifications: preferences.push_notifications,
                    status_changes: preferences.status_changes,
                    weekly_digest: preferences.weekly_digest
                },
                message: 'Notification preferences updated successfully'
            });
        }
        catch (error) {
            console.error('Error updating notification preferences:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== APPLICATION ROUTES ==========
    app.post('/api/applications/apply/:jobId', authMiddleware, upload.single('resume'), async (req, res) => {
        try {
            const { jobId } = req.params;
            const { coverLetter } = req.body;
            const job = await prisma.jobPost.findUnique({ where: { id: jobId }, include: { status: true, employer: true } });
            if (!job)
                return res.status(404).json({ success: false, message: 'Job not found' });
            if (job.status.status_name !== 'Open')
                return res.status(400).json({ success: false, message: 'Job is no longer accepting applications' });
            let seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!seeker) {
                const user = await prisma.user.findUnique({ where: { id: req.user.id } });
                seeker = await prisma.jobSeekerProfile.create({ data: { user_id: req.user.id, full_name: user?.email?.split('@')[0] || 'User', skills: [] } });
            }
            const existing = await prisma.jobApplication.findFirst({ where: { job_id: jobId, seeker_id: seeker.id } });
            if (existing)
                return res.status(400).json({ success: false, message: 'You have already applied for this job' });
            const pendingStatus = await prisma.jobApplicationStatus.findFirst({ where: { status_name: 'Pending' } });
            const application = await prisma.jobApplication.create({
                data: { job_id: jobId, seeker_id: seeker.id, cover_letter: coverLetter || null, resume_url: req.file ? `/uploads/resumes/${req.file.filename}` : null, status_id: pendingStatus.id, applied_at: new Date() }
            });
            await prisma.jobPost.update({ where: { id: jobId }, data: { applications_count: { increment: 1 } } });
            await createNotification(job.employer.user_id, 'New Application Received', `${seeker.full_name} applied for ${job.title}`, 'application_update', { job_id: jobId, application_id: application.id });
            await createNotification(req.user.id, 'Application Submitted', `Your application for ${job.title} has been submitted successfully`, 'application_update', { job_id: jobId, application_id: application.id });
            res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.get('/api/applications/my-applications', authMiddleware, async (req, res) => {
        try {
            const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!seeker)
                return res.json({ success: true, data: [] });
            const applications = await prisma.jobApplication.findMany({
                where: { seeker_id: seeker.id },
                include: { job: { include: { employer: true, industry: true, employment_type: true } }, status: true },
                orderBy: { applied_at: 'desc' }
            });
            res.json({ success: true, data: applications });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.get('/api/employer/applications', authMiddleware, async (req, res) => {
        try {
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!employer)
                return res.json({ success: true, data: [] });
            const jobs = await prisma.jobPost.findMany({ where: { employer_id: employer.id }, select: { id: true } });
            const jobIds = jobs.map(j => j.id);
            const applications = await prisma.jobApplication.findMany({
                where: { job_id: { in: jobIds } },
                include: { job: true, seeker: { include: { user: true } }, status: true },
                orderBy: { applied_at: 'desc' }
            });
            res.json({ success: true, data: applications });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.get('/api/applications/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } });
            const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
            const application = await prisma.jobApplication.findFirst({
                where: {
                    id: id,
                    OR: [
                        { job: { employer_id: employer?.id } },
                        { seeker_id: seeker?.id }
                    ]
                },
                include: {
                    job: {
                        include: {
                            employer: { include: { user: true } },
                            industry: true,
                            employment_type: true,
                            status: true
                        }
                    },
                    seeker: { include: { user: true } },
                    status: true,
                    notes: { include: { employer: true }, orderBy: { created_at: 'desc' } }
                }
            });
            if (!application)
                return res.status(404).json({ success: false, message: 'Application not found' });
            res.json({ success: true, data: application });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.put('/api/applications/:id/status', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { statusId } = req.body;
            const application = await prisma.jobApplication.update({
                where: { id: id },
                data: { status_id: parseInt(statusId), updated_at: new Date() },
                include: { status: true }
            });
            res.json({ success: true, data: application, message: 'Status updated successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.post('/api/applications/:id/notes', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { note_text } = req.body;
            const userId = req.user.id;
            const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } });
            if (!employer)
                return res.status(404).json({ success: false, message: 'Employer not found' });
            const note = await prisma.jobApplicationNote.create({
                data: { application_id: id, employer_id: employer.id, note_text: note_text, created_at: new Date() }
            });
            res.json({ success: true, data: note, message: 'Note added successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== BOOKMARK ROUTES ==========
    app.get('/api/bookmarks', authMiddleware, async (req, res) => {
        try {
            const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!seeker)
                return res.json({ success: true, data: [] });
            const bookmarks = await prisma.jobBookmark.findMany({
                where: { seeker_id: seeker.id },
                include: { job: true }
            });
            res.json({ success: true, data: bookmarks });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.post('/api/bookmarks/:jobId', authMiddleware, async (req, res) => {
        try {
            const { jobId } = req.params;
            let seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!seeker) {
                const user = await prisma.user.findUnique({ where: { id: req.user.id } });
                seeker = await prisma.jobSeekerProfile.create({ data: { user_id: req.user.id, full_name: user?.email?.split('@')[0] || 'User', skills: [] } });
            }
            const existing = await prisma.jobBookmark.findFirst({ where: { job_id: jobId, seeker_id: seeker.id } });
            if (existing)
                return res.status(400).json({ success: false, message: 'Job already saved' });
            const bookmark = await prisma.jobBookmark.create({ data: { job_id: jobId, seeker_id: seeker.id } });
            res.json({ success: true, data: bookmark, message: 'Job saved successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.delete('/api/bookmarks/:jobId', authMiddleware, async (req, res) => {
        try {
            const { jobId } = req.params;
            const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user.id } });
            if (!seeker)
                return res.status(404).json({ success: false, message: 'Profile not found' });
            await prisma.jobBookmark.deleteMany({ where: { job_id: jobId, seeker_id: seeker.id } });
            res.json({ success: true, message: 'Job removed from saved' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== NOTIFICATION ROUTES ==========
    app.get('/api/notifications', authMiddleware, async (req, res) => {
        try {
            const notifications = await prisma.notification.findMany({
                where: { user_id: req.user.id },
                orderBy: { created_at: 'desc' },
                take: 50
            });
            const unreadCount = notifications.filter(n => !n.is_read).length;
            res.json({ success: true, data: notifications, unreadCount });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== LOOKUP TABLES ==========
    app.get('/api/job-statuses', async (req, res) => {
        try {
            res.json({ success: true, data: await prisma.jobPostStatus.findMany({ orderBy: { id: 'asc' } }) });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    app.get('/api/employment-types', async (req, res) => {
        try {
            res.json({ success: true, data: await prisma.employmentType.findMany({ orderBy: { type_name: 'asc' } }) });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
    // ========== SERVER INITIALIZATION ==========
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
