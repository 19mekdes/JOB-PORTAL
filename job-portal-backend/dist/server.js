"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/resumes';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
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
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
        }
    }
});
// ========== CORS CONFIGURATION ==========
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
}));
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
// ========== AUTH MIDDLEWARE ==========
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
// ========== SUPER ADMIN MIDDLEWARE ==========
const superAdminMiddleware = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (user?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' });
        }
        next();
    }
    catch (error) {
        res.status(403).json({ success: false, message: 'Access denied' });
    }
};
// ========== NOTIFICATION HELPER FUNCTION ==========
async function createNotification(userId, title, message, type, metadata) {
    try {
        return await prisma.notification.create({
            data: {
                user_id: userId,
                title,
                message,
                type,
                metadata: metadata || {},
                created_at: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}
// ========== NOTIFICATION ROUTES ==========
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        const unreadCount = await prisma.notification.count({
            where: { user_id: userId, is_read: false }
        });
        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/notifications/unread/count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await prisma.notification.count({
            where: { user_id: userId, is_read: false }
        });
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { id: parseInt(id), user_id: userId },
            data: { is_read: true }
        });
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true }
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await prisma.notification.deleteMany({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== INITIALIZE DEFAULT DATA ==========
async function initializeDefaultData() {
    const userTypes = await prisma.userType.findMany();
    if (userTypes.length === 0) {
        await prisma.userType.createMany({
            data: [
                { type_name: 'Job Seeker' },
                { type_name: 'Employer' },
                { type_name: 'Admin' },
                { type_name: 'Super Admin' }
            ]
        });
    }
    const jobStatuses = await prisma.jobPostStatus.findMany();
    if (jobStatuses.length === 0) {
        await prisma.jobPostStatus.createMany({
            data: [
                { status_name: 'Open' },
                { status_name: 'Closed' },
                { status_name: 'Draft' },
                { status_name: 'Archived' }
            ]
        });
    }
    const appStatuses = await prisma.jobApplicationStatus.findMany();
    if (appStatuses.length === 0) {
        await prisma.jobApplicationStatus.createMany({
            data: [
                { status_name: 'Pending' },
                { status_name: 'Reviewed' },
                { status_name: 'Shortlisted' },
                { status_name: 'Interview' },
                { status_name: 'Accepted' },
                { status_name: 'Rejected' }
            ]
        });
    }
    const empTypes = await prisma.employmentType.findMany();
    if (empTypes.length === 0) {
        await prisma.employmentType.createMany({
            data: [
                { type_name: 'Full-time' },
                { type_name: 'Part-time' },
                { type_name: 'Contract' },
                { type_name: 'Remote' },
                { type_name: 'Hybrid' },
                { type_name: 'Internship' }
            ]
        });
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
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const userType = await prisma.userType.findFirst({ where: { type_name: user_type } });
        if (!userType) {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                user_type_id: userType.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        if (user_type === 'Job Seeker') {
            await prisma.jobSeekerProfile.create({
                data: { user_id: user.id, full_name: full_name, skills: [] }
            });
        }
        else if (user_type === 'Employer') {
            const defaultIndustry = await prisma.jobIndustry.findFirst();
            await prisma.employerProfile.create({
                data: { user_id: user.id, company_name: full_name, industry_id: defaultIndustry?.id || 1 }
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, user_type, full_name } });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: { user_type: true, seeker_profile: true, employer_profile: true }
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name;
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                user_type: user.user_type.type_name,
                full_name: fullName,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ========== PROFILE ROUTE ==========
app.get('/api/profile/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true, seeker_profile: true, employer_profile: { include: { industry: true } } }
        });
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        const profile = user.seeker_profile || user.employer_profile;
        res.json({ success: true, data: { user: { id: user.id, email: user.email, user_type: user.user_type.type_name }, profile } });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ========== EMPLOYER DASHBOARD ROUTES ==========
// Get employer dashboard data
app.get('/api/employer/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer profile not found' });
        }
        const jobs = await prisma.jobPost.findMany({
            where: { employer_id: employer.id },
            include: { status: true }
        });
        const applications = await prisma.jobApplication.findMany({
            where: { job_id: { in: jobs.map(j => j.id) } },
            include: { seeker: { include: { user: true } }, status: true, job: true },
            orderBy: { applied_at: 'desc' },
            take: 5
        });
        const totalApplications = await prisma.jobApplication.count({
            where: { job_id: { in: jobs.map(j => j.id) } }
        });
        const totalViews = jobs.reduce((sum, job) => sum + (job.views_count || 0), 0);
        const activeJobs = jobs.filter(j => j.status?.status_name === 'Open').length;
        const acceptedApps = await prisma.jobApplication.count({
            where: {
                job_id: { in: jobs.map(j => j.id) },
                status: { status_name: 'Accepted' }
            }
        });
        const successRate = totalApplications > 0 ? Math.round((acceptedApps / totalApplications) * 100) : 0;
        const recentJobs = jobs.slice(0, 5).map(job => ({
            id: job.id,
            title: job.title,
            location: job.location,
            salary_range: job.salary_range,
            applications_count: job.applications_count,
            views_count: job.views_count,
            status: job.status?.status_name,
            created_at: job.created_at
        }));
        const recentApplications = applications.map(app => ({
            id: app.id,
            job_title: app.job.title,
            applicant_name: app.seeker.full_name,
            applicant_email: app.seeker.user.email,
            status: app.status?.status_name,
            applied_at: app.applied_at
        }));
        res.json({
            success: true,
            data: {
                totalJobs: jobs.length,
                activeJobs,
                totalApplications,
                totalViews,
                successRate,
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
// Get employer jobs
app.get('/api/employer/jobs', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer profile not found' });
        }
        const jobs = await prisma.jobPost.findMany({
            where: { employer_id: employer.id },
            include: { industry: true, employment_type: true, status: true },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: jobs });
    }
    catch (error) {
        console.error('Error fetching employer jobs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get employer applications
app.get('/api/employer/applications', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer profile not found' });
        }
        const applications = await prisma.jobApplication.findMany({
            where: { job: { employer_id: employer.id } },
            include: {
                job: true,
                seeker: {
                    include: { user: true }
                },
                status: true
            },
            orderBy: { applied_at: 'desc' }
        });
        res.json({ success: true, data: applications });
    }
    catch (error) {
        console.error('Error fetching employer applications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== JOB ROUTES ==========
// Get all jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await prisma.jobPost.findMany({
            include: { employer: { include: { user: true } }, industry: true, employment_type: true, status: true },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: jobs, pagination: { page: 1, limit: jobs.length, total: jobs.length, pages: 1 } });
    }
    catch (error) {
        console.error('Jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Get single job
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await prisma.jobPost.findUnique({
            where: { id: req.params.id },
            include: { employer: { include: { user: true } }, industry: true, employment_type: true, status: true }
        });
        if (!job)
            return res.status(404).json({ success: false, message: 'Job not found' });
        // Increment view count
        await prisma.jobPost.update({
            where: { id: req.params.id },
            data: { views_count: { increment: 1 } }
        });
        res.json({ success: true, data: job });
    }
    catch (error) {
        console.error('Job detail error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Create job
app.post('/api/jobs', authMiddleware, async (req, res) => {
    try {
        const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true, employer_profile: true }
        });
        if (user?.user_type?.type_name !== 'Employer') {
            return res.status(403).json({ success: false, message: 'Only employers can post jobs' });
        }
        if (!user.employer_profile) {
            return res.status(403).json({ success: false, message: 'Please complete your employer profile first' });
        }
        if (!title || !description || !location || !employment_type_id || !industry_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (description.length < 50) {
            return res.status(400).json({ success: false, message: 'Description must be at least 50 characters' });
        }
        const openStatus = await prisma.jobPostStatus.findFirst({
            where: { status_name: 'Open' }
        });
        const job = await prisma.jobPost.create({
            data: {
                title,
                description,
                requirements: requirements || '',
                benefits: benefits || '',
                location,
                employer_id: user.employer_profile.id,
                employment_type_id: parseInt(employment_type_id),
                industry_id: parseInt(industry_id),
                salary_min: salary_min ? parseFloat(salary_min) : null,
                salary_max: salary_max ? parseFloat(salary_max) : null,
                is_remote: is_remote || false,
                status_id: openStatus.id,
                created_at: new Date(),
                views_count: 0,
                applications_count: 0
            },
            include: { industry: true, employment_type: true, status: true }
        });
        console.log(`✅ New job posted: ${job.title}`);
        res.status(201).json({ success: true, data: job, message: 'Job posted successfully' });
    }
    catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update job
app.put('/api/jobs/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote, status_id } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true, employer_profile: true }
        });
        if (user?.user_type?.type_name !== 'Employer') {
            return res.status(403).json({ success: false, message: 'Only employers can update jobs' });
        }
        const existingJob = await prisma.jobPost.findUnique({
            where: { id },
            include: { employer: true }
        });
        if (!existingJob) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        if (existingJob.employer.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only update your own jobs' });
        }
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
        console.error('Error updating job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete job
app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true, employer_profile: true }
        });
        const job = await prisma.jobPost.findUnique({
            where: { id },
            include: { employer: true }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        const isOwner = job.employer.user_id === req.user.id;
        const isAdmin = user?.user_type?.type_name === 'Admin' || user?.user_type?.type_name === 'Super Admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this job' });
        }
        await prisma.jobPost.delete({ where: { id } });
        res.json({ success: true, message: 'Job deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== INDUSTRIES ROUTES ==========
app.get('/api/industries', async (req, res) => {
    try {
        const industries = await prisma.jobIndustry.findMany({
            orderBy: { industry_name: 'asc' }
        });
        res.json({ success: true, data: industries });
    }
    catch (error) {
        console.error('Error fetching industries:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== EMPLOYMENT TYPES ROUTES ==========
app.get('/api/employment-types', async (req, res) => {
    try {
        const employmentTypes = await prisma.employmentType.findMany({
            orderBy: { type_name: 'asc' }
        });
        res.json({ success: true, data: employmentTypes });
    }
    catch (error) {
        console.error('Error fetching employment types:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get all saved job IDs
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('📌 Fetching bookmarks for user:', userId);
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            console.log('No job seeker profile found');
            return res.json({ success: true, data: [] });
        }
        const bookmarks = await prisma.jobBookmark.findMany({
            where: { seeker_id: seeker.id },
            select: { job_id: true }
        });
        const savedJobIds = bookmarks.map(b => b.job_id);
        console.log('📌 Returning saved job IDs:', savedJobIds);
        res.json({ success: true, data: savedJobIds });
    }
    catch (error) {
        console.error('Error fetching bookmarks:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== ADMIN USER MANAGEMENT ENDPOINTS ==========
// Get all users (Admin only)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin or super admin
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { search, role, status, page = 1, limit = 10 } = req.query;
        let where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { seeker_profile: { full_name: { contains: search, mode: 'insensitive' } } },
                { employer_profile: { company_name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (role && role !== 'all') {
            where.user_type = { type_name: role };
        }
        if (status && status !== 'all') {
            where.is_active = status === 'active';
        }
        const users = await prisma.user.findMany({
            where,
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: { industry: true }
                }
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { created_at: 'desc' }
        });
        const total = await prisma.user.count({ where });
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.seeker_profile?.full_name || user.employer_profile?.company_name || user.email.split('@')[0],
            email: user.email,
            user_type: user.user_type.type_name,
            status: user.is_active ? 'active' : 'inactive',
            phone: user.seeker_profile?.phone || user.employer_profile?.company_name || '',
            location: user.seeker_profile?.location || user.employer_profile?.location || '',
            company: user.employer_profile?.company_name || '',
            joined: user.created_at,
            last_active: user.updated_at
        }));
        res.json({
            success: true,
            data: formattedUsers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update user status (activate/suspend)
app.put('/api/admin/users/:userId/status', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { userId } = req.params;
        const { status } = req.body; // 'active' or 'inactive'
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                is_active: status === 'active',
                updated_at: new Date()
            }
        });
        console.log(`✅ User ${userId} status updated to ${status}`);
        res.json({ success: true, message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully` });
    }
    catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete user (Admin only)
app.delete('/api/admin/users/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { userId } = req.params;
        // Check if trying to delete own account
        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        // Get user to check their role
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            include: { user_type: true }
        });
        if (!userToDelete) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Prevent admin from deleting super admin
        if (userToDelete.user_type?.type_name === 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete Super Admin account' });
        }
        // Soft delete - deactivate instead of hard delete
        await prisma.user.update({
            where: { id: userId },
            data: {
                is_active: false,
                updated_at: new Date()
            }
        });
        console.log(`✅ User ${userId} deactivated by admin`);
        res.json({ success: true, message: 'User deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get user details by ID
app.get('/api/admin/users/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: { industry: true }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const formattedUser = {
            id: user.id,
            email: user.email,
            user_type: user.user_type.type_name,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            profile: user.seeker_profile || user.employer_profile,
            stats: {
                job_count: user.employer_profile ? await prisma.jobPost.count({ where: { employer_id: user.employer_profile.id } }) : 0,
                application_count: user.seeker_profile ? await prisma.jobApplication.count({ where: { seeker_id: user.seeker_profile.id } }) : 0
            }
        };
        res.json({ success: true, data: formattedUser });
    }
    catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Reset user password (Admin only)
app.post('/api/admin/users/:userId/reset-password', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { userId } = req.params;
        const { newPassword } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                updated_at: new Date()
            }
        });
        console.log(`✅ Password reset for user ${userId}`);
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}); // Add to your server.ts
// ========== ADMIN USER MANAGEMENT ENDPOINTS ==========
// Get all users with filters (matches frontend)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { search, user_type, is_active, page = 1, limit = 10 } = req.query;
        let where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { seeker_profile: { full_name: { contains: search, mode: 'insensitive' } } },
                { employer_profile: { company_name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (user_type && user_type !== 'all') {
            where.user_type = { type_name: user_type };
        }
        if (is_active && is_active !== 'all') {
            where.is_active = is_active === 'true';
        }
        const users = await prisma.user.findMany({
            where,
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: { industry: true }
                },
                _count: {
                    select: {
                        notifications: true,
                        search_logs: true
                    }
                }
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { created_at: 'desc' }
        });
        const total = await prisma.user.count({ where });
        res.json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Suspend user (matches frontend)
app.put('/api/admin/users/:userId/suspend', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { userId } = req.params;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                is_active: false,
                updated_at: new Date()
            }
        });
        console.log(`✅ User ${userId} suspended`);
        res.json({ success: true, message: 'User suspended successfully' });
    }
    catch (error) {
        console.error('Error suspending user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Activate user (matches frontend)
app.put('/api/admin/users/:userId/activate', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { userId } = req.params;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                is_active: true,
                updated_at: new Date()
            }
        });
        console.log(`✅ User ${userId} activated`);
        res.json({ success: true, message: 'User activated successfully' });
    }
    catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update user (matches frontend)
app.put('/api/admin/users/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { userId } = req.params;
        const { email, user_type, is_active } = req.body;
        // Get user type ID
        const userType = await prisma.userType.findFirst({
            where: { type_name: user_type }
        });
        if (!userType) {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                email: email,
                user_type_id: userType.id,
                is_active: is_active,
                updated_at: new Date()
            }
        });
        console.log(`✅ User ${userId} updated`);
        res.json({ success: true, message: 'User updated successfully' });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete user (matches frontend)
app.delete('/api/admin/users/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (currentUser?.user_type?.type_name !== 'Admin' && currentUser?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { userId } = req.params;
        // Prevent deleting super admin
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            include: { user_type: true }
        });
        if (userToDelete?.user_type?.type_name === 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete Super Admin' });
        }
        // Soft delete - deactivate instead of hard delete
        await prisma.user.update({
            where: { id: userId },
            data: {
                is_active: false,
                updated_at: new Date()
            }
        });
        console.log(`✅ User ${userId} deactivated`);
        res.json({ success: true, message: 'User deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// In your GET /applications/:id endpoint, ensure you're including education and experience
app.get('/api/applications/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const application = await prisma.jobApplication.findUnique({
            where: { id: id },
            include: {
                job: {
                    include: {
                        employer: {
                            include: { user: true }
                        },
                        industry: true,
                        employment_type: true,
                        status: true
                    }
                },
                seeker: {
                    include: {
                        user: true
                    }
                },
                status: true,
                notes: {
                    include: { employer: true },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        // Also fetch the job seeker's profile separately to get education and experience
        const seekerProfile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: application?.seeker.user_id },
            select: {
                education: true,
                experience: true,
                skills: true,
                full_name: true,
                phone: true,
                location: true
            }
        });
        const formattedApplication = {
            ...application,
            seeker: {
                ...application.seeker,
                education: seekerProfile?.education || [],
                experience: seekerProfile?.experience || [],
                skills: seekerProfile?.skills || []
            }
        };
        res.json({ success: true, data: formattedApplication });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}); // In your server.ts, update the application details endpoint
app.get('/api/applications/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Get application with seeker profile
        const application = await prisma.jobApplication.findUnique({
            where: { id: id },
            include: {
                job: { include: { employer: { include: { user: true } } } },
                seeker: { include: { user: true } },
                status: true,
                notes: { include: { employer: true } }
            }
        });
        // Get full job seeker profile with education and experience
        const seekerProfile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: application?.seeker.user_id }
        });
        const response = {
            ...application,
            seeker: {
                ...application?.seeker,
                skills: seekerProfile?.skills || [],
                experience: seekerProfile?.experience || [],
                education: seekerProfile?.education || []
            }
        };
        res.json({ success: true, data: response });
    }
    catch (error) {
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
            data: {
                job_id: jobId,
                seeker_id: seeker.id,
                cover_letter: coverLetter || null,
                resume_url: req.file ? `/uploads/resumes/${req.file.filename}` : null,
                status_id: pendingStatus.id,
                applied_at: new Date()
            }
        });
        await prisma.jobPost.update({ where: { id: jobId }, data: { applications_count: { increment: 1 } } });
        // Create notification for employer
        await createNotification(job.employer.user_id, 'New Application Received', `${seeker.full_name} applied for ${job.title}`, 'application_update', { job_id: jobId, application_id: application.id });
        // Create notification for job seeker (confirmation)
        await createNotification(req.user.id, 'Application Submitted', `Your application for ${job.title} has been submitted successfully`, 'application_update', { job_id: jobId, application_id: application.id });
        res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
    }
    catch (error) {
        console.error('Apply error:', error);
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
        console.error('Get applications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ========== UPDATE APPLICATION STATUS WITH NOTIFICATION ==========
app.put('/api/applications/:applicationId/status', authMiddleware, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { statusId, notes } = req.body;
        const userId = req.user.id;
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer profile not found' });
        }
        const application = await prisma.jobApplication.findFirst({
            where: { id: applicationId },
            include: { job: true, seeker: true }
        });
        if (!application || application.job.employer_id !== employer.id) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        const updatedApplication = await prisma.jobApplication.update({
            where: { id: applicationId },
            data: {
                status_id: parseInt(statusId),
                employer_notes: notes || null,
                updated_at: new Date()
            },
            include: { status: true }
        });
        // Get status name
        const status = await prisma.jobApplicationStatus.findUnique({
            where: { id: parseInt(statusId) }
        });
        // Notify job seeker
        await createNotification(application.seeker.user_id, 'Application Status Updated', `Your application for ${application.job.title} has been ${status?.status_name}`, 'status_change', { application_id: applicationId, status: status?.status_name });
        res.json({ success: true, data: updatedApplication, message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== SUPER ADMIN ROUTES ==========
app.get('/api/super-admin/admins', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const admins = await prisma.user.findMany({
            where: {
                user_type: {
                    type_name: { in: ['Admin', 'Super Admin'] }
                }
            },
            include: { user_type: true, seeker_profile: true, employer_profile: true },
            orderBy: { created_at: 'desc' }
        });
        const formattedAdmins = admins.map(admin => ({
            id: admin.id,
            name: admin.seeker_profile?.full_name || admin.employer_profile?.company_name || admin.email.split('@')[0],
            email: admin.email,
            role: admin.user_type.type_name,
            status: admin.is_active ? 'active' : 'inactive',
            last_active: admin.updated_at ? new Date(admin.updated_at).toLocaleString() : 'Never',
            created_at: new Date(admin.created_at).toLocaleDateString()
        }));
        res.json({ success: true, data: formattedAdmins });
    }
    catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.post('/api/super-admin/admins', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { email, password, full_name, role } = req.body;
        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const userType = await prisma.userType.findFirst({
            where: { type_name: role || 'Admin' }
        });
        if (!userType) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                user_type_id: userType.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        await prisma.jobSeekerProfile.create({
            data: {
                user_id: user.id,
                full_name: full_name,
                skills: []
            }
        });
        console.log(`✅ New ${role} created: ${email}`);
        res.status(201).json({ success: true, message: `${role} created successfully` });
    }
    catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.delete('/api/super-admin/admins/:adminId', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { adminId } = req.params;
        if (adminId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        await prisma.user.update({
            where: { id: adminId },
            data: { is_active: false, updated_at: new Date() }
        });
        console.log(`✅ Admin deactivated: ${adminId}`);
        res.json({ success: true, message: 'Admin deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get employer profile
app.get('/api/employer/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId },
            include: { industry: true }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer profile not found' });
        }
        res.json({ success: true, data: employer });
    }
    catch (error) {
        console.error('Error fetching employer profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update employer profile
app.put('/api/employer/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { company_name, company_description, website, location, company_size } = req.body;
        const employer = await prisma.employerProfile.update({
            where: { user_id: userId },
            data: {
                company_name: company_name,
                company_description: company_description,
                website: website,
                location: location,
                company_size: company_size
            }
        });
        res.json({ success: true, data: employer, message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Error updating employer profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/super-admin/audit-logs', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const auditLogs = await prisma.auditLog.findMany({
            take: 50,
            include: { admin: { select: { email: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: auditLogs });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== GET SINGLE APPLICATION DETAILS ==========
app.get('/api/applications/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Get the application with all related data
        const application = await prisma.jobApplication.findUnique({
            where: { id: id },
            include: {
                job: {
                    include: {
                        employer: {
                            include: {
                                user: true
                            }
                        },
                        industry: true,
                        employment_type: true,
                        status: true
                    }
                },
                seeker: {
                    include: {
                        user: true
                    }
                },
                status: true,
                notes: {
                    include: {
                        employer: true
                    },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        // Check if user has permission to view this application
        const isJobSeeker = application.seeker.user_id === userId;
        const isEmployer = application.job.employer.user_id === userId;
        const isAdmin = await prisma.user.findFirst({
            where: {
                id: userId,
                user_type: {
                    type_name: { in: ['Admin', 'Super Admin'] }
                }
            }
        });
        if (!isJobSeeker && !isEmployer && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        // Format the response
        const formattedApplication = {
            id: application.id,
            job_id: application.job_id,
            job: {
                id: application.job.id,
                title: application.job.title,
                description: application.job.description,
                location: application.job.location,
                salary_range: application.job.salary_range,
                employment_type: application.job.employment_type,
                industry: application.job.industry,
                employer: {
                    id: application.job.employer.id,
                    company_name: application.job.employer.company_name,
                    company_description: application.job.employer.company_description,
                    website: application.job.employer.website,
                    logo_url: application.job.employer.logo_url,
                    location: application.job.employer.location,
                    user: {
                        email: application.job.employer.user.email
                    }
                }
            },
            seeker: {
                id: application.seeker.id,
                full_name: application.seeker.full_name,
                phone: application.seeker.phone,
                email: application.seeker.user.email,
                skills: application.seeker.skills,
                experience: application.seeker.experience,
                education: application.seeker.education,
                location: application.seeker.location,
                resume_url: application.seeker.resume_url
            },
            status: application.status,
            cover_letter: application.cover_letter,
            resume_url: application.resume_url,
            employer_notes: application.employer_notes,
            applied_at: application.applied_at,
            updated_at: application.updated_at,
            notes: application.notes
        };
        res.json({ success: true, data: formattedApplication });
    }
    catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== ADD NOTE TO APPLICATION ==========
app.post('/api/applications/:id/notes', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const userId = req.user.id;
        console.log('Adding note to application:', { id, note, userId });
        // Get employer profile
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer profile not found' });
        }
        // Check if application exists and belongs to employer's job
        const application = await prisma.jobApplication.findFirst({
            where: {
                id: id,
                job: {
                    employer_id: employer.id
                }
            },
            include: {
                job: true
            }
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found or not owned by you' });
        }
        // Add note
        const applicationNote = await prisma.jobApplicationNote.create({
            data: {
                application_id: id,
                employer_id: employer.id,
                note_text: note,
                created_at: new Date()
            },
            include: {
                employer: true
            }
        });
        console.log('Note added successfully:', applicationNote.id);
        res.status(201).json({
            success: true,
            data: applicationNote,
            message: 'Note added successfully'
        });
    }
    catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== UPDATE APPLICATION STATUS ==========
app.put('/api/applications/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { statusId } = req.body;
        const userId = req.user.id;
        console.log('Updating application status:', { id, statusId, userId });
        // Get the application
        const application = await prisma.jobApplication.findUnique({
            where: { id: id },
            include: {
                job: {
                    include: {
                        employer: true
                    }
                },
                seeker: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        // Check if user is the employer or admin
        const isEmployer = application.job.employer.user_id === userId;
        const isAdmin = await prisma.user.findFirst({
            where: {
                id: userId,
                user_type: {
                    type_name: { in: ['Admin', 'Super Admin'] }
                }
            }
        });
        if (!isEmployer && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Only employers can update application status' });
        }
        // Update status
        const updatedApplication = await prisma.jobApplication.update({
            where: { id: id },
            data: {
                status_id: statusId,
                updated_at: new Date()
            },
            include: {
                status: true
            }
        });
        // Get status name
        const status = await prisma.jobApplicationStatus.findUnique({
            where: { id: statusId }
        });
        // Create notification for job seeker
        await createNotification(application.seeker.user_id, 'Application Status Updated', `Your application for ${application.job.title} has been ${status?.status_name}`, 'status_change', { application_id: id, status: status?.status_name });
        console.log('Status updated successfully:', updatedApplication.id);
        res.json({
            success: true,
            data: updatedApplication,
            message: `Status updated to ${status?.status_name}`
        });
    }
    catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== GET APPLICATION NOTES ==========
app.get('/api/applications/:id/notes', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notes = await prisma.jobApplicationNote.findMany({
            where: {
                application_id: id,
                employer: {
                    user_id: userId
                }
            },
            include: {
                employer: true
            },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: notes });
    }
    catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get all applications for admin
app.get('/api/admin/applications', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (user?.user_type?.type_name !== 'Admin' && user?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const applications = await prisma.jobApplication.findMany({
            include: {
                job: {
                    include: {
                        employer: {
                            include: { user: true }
                        },
                        employment_type: true
                    }
                },
                seeker: {
                    include: { user: true }
                },
                status: true
            },
            orderBy: { applied_at: 'desc' }
        });
        res.json({ success: true, data: applications });
    }
    catch (error) {
        console.error('Error fetching admin applications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== ADMIN JOB MODERATION ROUTES ==========
// Get all jobs for admin (with filters)
app.get('/api/admin/jobs', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin or super admin
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (user?.user_type?.type_name !== 'Admin' && user?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { status, search } = req.query;
        let where = {};
        if (status && status !== 'all') {
            where.status = { status_name: status };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { employer: { company_name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const jobs = await prisma.jobPost.findMany({
            where,
            include: {
                employer: true,
                industry: true,
                employment_type: true,
                status: true
            },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: jobs });
    }
    catch (error) {
        console.error('Error fetching admin jobs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update job status (approve/reject)
app.put('/api/admin/jobs/:jobId/status', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status } = req.body;
        // Check admin permission
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (user?.user_type?.type_name !== 'Admin' && user?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        // Get status record
        const statusRecord = await prisma.jobPostStatus.findFirst({
            where: { status_name: status }
        });
        if (!statusRecord) {
            return res.status(404).json({ success: false, message: 'Status not found' });
        }
        // Update job
        const job = await prisma.jobPost.update({
            where: { id: jobId },
            data: {
                status_id: statusRecord.id,
                updated_at: new Date()
            },
            include: {
                employer: true,
                status: true
            }
        });
        // Create notification for employer
        await createNotification(job.employer.user_id, `Job ${status}`, `Your job "${job.title}" has been ${status.toLowerCase()} by admin.`, 'job_update', { job_id: jobId, status: status });
        res.json({ success: true, data: job, message: `Job ${status.toLowerCase()} successfully` });
    }
    catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete job (admin only)
app.delete('/api/admin/jobs/:jobId', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.params;
        // Check admin permission
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { user_type: true }
        });
        if (user?.user_type?.type_name !== 'Admin' && user?.user_type?.type_name !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const job = await prisma.jobPost.findUnique({
            where: { id: jobId },
            include: { employer: true }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        await prisma.jobPost.delete({ where: { id: jobId } });
        // Notify employer
        await createNotification(job.employer.user_id, 'Job Deleted', `Your job "${job.title}" has been deleted by an administrator.`, 'job_update', { job_id: jobId });
        res.json({ success: true, message: 'Job deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get all users for admin
app.get('/api/admin/users', authMiddleware, async (req, res) => {
    // Check admin permission
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { user_type: true }
    });
    if (user?.user_type?.type_name !== 'Admin' && user?.user_type?.type_name !== 'Super Admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const users = await prisma.user.findMany({
        include: {
            user_type: true,
            seeker_profile: true,
            employer_profile: {
                include: {
                    jobs: true
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: users });
});
// Update user status
app.put('/api/admin/users/:userId/status', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const { is_active } = req.body;
    const user = await prisma.user.update({
        where: { id: userId },
        data: { is_active, updated_at: new Date() }
    });
    res.json({ success: true, data: user });
});
// Get analytics data
app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
    try {
        const { period } = req.query;
        const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // User Statistics
        const totalUsers = await prisma.user.count();
        const totalJobSeekers = await prisma.user.count({ where: { user_type: { type_name: 'Job Seeker' } } });
        const totalEmployers = await prisma.user.count({ where: { user_type: { type_name: 'Employer' } } });
        const totalAdmins = await prisma.user.count({ where: { user_type: { type_name: { in: ['Admin', 'Super Admin'] } } } });
        const newUsersThisMonth = await prisma.user.count({
            where: { created_at: { gte: startDate } }
        });
        const activeUsers = await prisma.user.count({ where: { is_active: true } });
        const userGrowth = totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0;
        // Job Statistics
        const totalJobs = await prisma.jobPost.count();
        const activeJobs = await prisma.jobPost.count({ where: { status: { status_name: 'Open' } } });
        const closedJobs = await prisma.jobPost.count({ where: { status: { status_name: 'Closed' } } });
        const newJobsThisMonth = await prisma.jobPost.count({ where: { created_at: { gte: startDate } } });
        const jobGrowth = totalJobs > 0 ? Math.round((newJobsThisMonth / totalJobs) * 100) : 0;
        const jobsByIndustry = await prisma.jobIndustry.findMany({
            include: { jobs: true },
            take: 5
        });
        const jobsByType = await prisma.employmentType.findMany({
            include: { jobs: true }
        });
        // Application Statistics
        const totalApplications = await prisma.jobApplication.count();
        const pendingApplications = await prisma.jobApplication.count({ where: { status: { status_name: 'Pending' } } });
        const reviewedApplications = await prisma.jobApplication.count({ where: { status: { status_name: 'Reviewed' } } });
        const shortlistedApplications = await prisma.jobApplication.count({ where: { status: { status_name: 'Shortlisted' } } });
        const interviewApplications = await prisma.jobApplication.count({ where: { status: { status_name: 'Interview' } } });
        const acceptedApplications = await prisma.jobApplication.count({ where: { status: { status_name: 'Accepted' } } });
        const rejectedApplications = await prisma.jobApplication.count({ where: { status: { status_name: 'Rejected' } } });
        // Engagement Metrics
        const totalViews = await prisma.jobPost.aggregate({ _sum: { views_count: true } });
        const averageViewsPerJob = totalJobs > 0 ? Math.round((totalViews._sum.views_count || 0) / totalJobs) : 0;
        const averageApplicationsPerJob = totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0;
        const conversionRate = totalViews._sum.views_count > 0 ? Math.round((totalApplications / (totalViews._sum.views_count || 1)) * 100) : 0;
        // Top Skills (from job seeker profiles)
        const allSkills = await prisma.jobSeekerProfile.findMany({
            select: { skills: true }
        });
        const skillCount = {};
        allSkills.forEach(profile => {
            profile.skills.forEach(skill => {
                skillCount[skill] = (skillCount[skill] || 0) + 1;
            });
        });
        const topSkills = Object.entries(skillCount)
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Top Employers
        const topEmployers = await prisma.employerProfile.findMany({
            include: { jobs: true },
            take: 5,
            orderBy: { jobs: { _count: 'desc' } }
        });
        res.json({
            success: true,
            data: {
                totalUsers,
                totalJobSeekers,
                totalEmployers,
                totalAdmins,
                newUsersThisMonth,
                userGrowth,
                activeUsers,
                totalJobs,
                activeJobs,
                closedJobs,
                newJobsThisMonth,
                jobGrowth,
                jobsByIndustry: jobsByIndustry.map(i => ({ industry: i.industry_name, count: i.jobs.length })),
                jobsByType: jobsByType.map(t => ({ type: t.type_name, count: t.jobs.length })),
                totalApplications,
                pendingApplications,
                reviewedApplications,
                shortlistedApplications,
                interviewApplications,
                acceptedApplications,
                rejectedApplications,
                totalViews: totalViews._sum.views_count || 0,
                averageViewsPerJob,
                averageApplicationsPerJob,
                conversionRate,
                topSkills,
                topEmployers: topEmployers.map(e => ({ name: e.company_name, jobCount: e.jobs.length, views: e.jobs.reduce((sum, j) => sum + (j.views_count || 0), 0) }))
            }
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== SUPER ADMIN ROUTES ==========
// Get all admins (Super Admin only)
app.get('/api/super-admin/admins-list', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { search, role, status } = req.query;
        let where = {
            user_type: {
                type_name: { in: ['Admin', 'Super Admin'] }
            }
        };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { seeker_profile: { full_name: { contains: search, mode: 'insensitive' } } },
                { employer_profile: { company_name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (role && role !== 'all') {
            where.user_type = { type_name: role === 'super_admin' ? 'Super Admin' : 'Admin' };
        }
        if (status && status !== 'all') {
            where.is_active = status === 'active';
        }
        const admins = await prisma.user.findMany({
            where,
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            },
            orderBy: { created_at: 'desc' }
        });
        const formattedAdmins = admins.map(admin => ({
            id: admin.id,
            name: admin.seeker_profile?.full_name || admin.employer_profile?.company_name || admin.email.split('@')[0],
            email: admin.email,
            phone: admin.seeker_profile?.phone || '', // Fixed: removed employer_profile?.phone
            role: admin.user_type.type_name === 'Super Admin' ? 'super_admin' : 'admin',
            status: admin.is_active ? 'active' : 'inactive',
            region: admin.employer_profile?.location || admin.seeker_profile?.location || 'Global',
            last_active: admin.updated_at ? new Date(admin.updated_at).toISOString() : new Date(admin.created_at).toISOString(),
            joined: new Date(admin.created_at).toISOString()
        }));
        res.json({
            success: true,
            admins: formattedAdmins,
            total: formattedAdmins.length
        });
    }
    catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create new admin (Super Admin only)
app.post('/api/super-admin/admins', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { name, email, password, phone, role, region } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Name, email and password are required' });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }
        const userType = await prisma.userType.findFirst({
            where: { type_name: role === 'super_admin' ? 'Super Admin' : 'Admin' }
        });
        if (!userType) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                user_type_id: userType.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        // Create profile for the admin
        await prisma.jobSeekerProfile.create({
            data: {
                user_id: user.id,
                full_name: name,
                phone: phone || null,
                location: region || null,
                skills: []
            }
        });
        console.log(`✅ New ${role} created: ${email}`);
        res.status(201).json({ success: true, message: `${role} created successfully` });
    }
    catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update admin (Super Admin only)
app.put('/api/super-admin/admins/:adminId', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { adminId } = req.params;
        const { name, email, phone, role, region, status, password } = req.body;
        // Cannot modify your own role
        if (adminId === req.user.id && role !== 'super_admin') {
            return res.status(400).json({ success: false, error: 'Cannot change your own role' });
        }
        // Get user type if role is changing
        let userTypeId;
        if (role) {
            const userType = await prisma.userType.findFirst({
                where: { type_name: role === 'super_admin' ? 'Super Admin' : 'Admin' }
            });
            userTypeId = userType?.id;
        }
        // Update user
        const updateData = {};
        if (email)
            updateData.email = email;
        if (userTypeId)
            updateData.user_type_id = userTypeId;
        if (status !== undefined)
            updateData.is_active = status === 'active';
        if (password && password.trim() !== '') {
            updateData.password = await bcryptjs_1.default.hash(password, 10);
        }
        updateData.updated_at = new Date();
        await prisma.user.update({
            where: { id: adminId },
            data: updateData
        });
        // Update profile
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: adminId }
        });
        if (profile) {
            await prisma.jobSeekerProfile.update({
                where: { id: profile.id },
                data: {
                    full_name: name || profile.full_name,
                    phone: phone !== undefined ? phone : profile.phone,
                    location: region !== undefined ? region : profile.location
                }
            });
        }
        console.log(`✅ Admin updated: ${email || adminId}`);
        res.json({ success: true, message: 'Admin updated successfully' });
    }
    catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Delete/Deactivate admin (Super Admin only)
app.delete('/api/super-admin/admins/:adminId', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { adminId } = req.params;
        if (adminId === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }
        // Soft delete - deactivate instead of hard delete
        await prisma.user.update({
            where: { id: adminId },
            data: {
                is_active: false,
                updated_at: new Date()
            }
        });
        console.log(`✅ Admin deactivated: ${adminId}`);
        res.json({ success: true, message: 'Admin deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        message: 'Backend server is running',
        timestamp: new Date().toISOString()
    });
});
// ========== BACKUP & RESTORE ENDPOINTS ==========
// Get all backups
app.get('/api/super-admin/backups', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        // Return backup data (in production, this would come from database or file system)
        const backups = [
            {
                id: '1',
                name: 'Full System Backup',
                type: 'full',
                size: '2.4 GB',
                status: 'completed',
                created_at: new Date().toISOString(),
                created_by: 'System'
            },
            {
                id: '2',
                name: 'Database Backup',
                type: 'database',
                size: '856 MB',
                status: 'completed',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                created_by: 'System'
            },
            {
                id: '3',
                name: 'User Data Backup',
                type: 'partial',
                size: '124 MB',
                status: 'failed',
                created_at: new Date(Date.now() - 172800000).toISOString(),
                created_by: 'System'
            }
        ];
        res.json({
            success: true,
            data: backups
        });
    }
    catch (error) {
        console.error('Error fetching backups:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Create backup
app.post('/api/super-admin/backups/create', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { backupType } = req.body;
        // Create new backup record
        const newBackup = {
            id: Date.now().toString(),
            name: `${backupType === 'full' ? 'Full System' : backupType === 'database' ? 'Database' : 'Partial'} Backup - ${new Date().toLocaleString()}`,
            type: backupType,
            size: 'Calculating...',
            status: 'pending',
            created_at: new Date().toISOString(),
            created_by: req.user?.email || 'System'
        };
        // Simulate backup process (in production, implement actual backup logic)
        setTimeout(() => {
            console.log(`✅ Backup ${newBackup.id} completed`);
        }, 3000);
        res.json({
            success: true,
            message: 'Backup initiated successfully',
            data: newBackup
        });
    }
    catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Download backup
app.get('/api/super-admin/backups/:id/download', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Create a downloadable file
        const content = JSON.stringify({
            backup_id: id,
            created_at: new Date().toISOString(),
            message: 'This is a sample backup file. In production, this would contain actual backup data.'
        }, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup_${id}.json`);
        res.send(content);
    }
    catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete backup
app.delete('/api/super-admin/backups/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting backup: ${id}`);
        res.json({
            success: true,
            message: 'Backup deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Restore backup
app.post('/api/super-admin/backups/:id/restore', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Restoring backup: ${id}`);
        // In production, implement actual restore logic here
        res.json({
            success: true,
            message: 'Restore initiated successfully. This may take a few minutes.'
        });
    }
    catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get storage statistics
app.get('/api/super-admin/storage-stats', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        // In production, calculate actual storage usage
        res.json({
            success: true,
            data: {
                used: 3.4,
                total: 50,
                percentage: 6.8,
                unit: 'GB'
            }
        });
    }
    catch (error) {
        console.error('Error fetching storage stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Correct update for job seeker profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, bio, skills, experience, education, phone, location } = req.body;
        // Find profile by user_id
        const profile = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        // Update using profile.id
        const updatedProfile = await prisma.jobSeekerProfile.update({
            where: { id: profile.id },
            data: {
                full_name: full_name || undefined,
                phone: phone || undefined,
                location: location || undefined,
                skills: skills || undefined
            }
        });
        res.json({
            success: true,
            data: { profile: updatedProfile },
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
app.get('/api/super-admin/health', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const [totalUsers, totalJobs, totalApplications, activeJobs] = await Promise.all([
            prisma.user.count(),
            prisma.jobPost.count(),
            prisma.jobApplication.count(),
            prisma.jobPost.count({ where: { status: { status_name: 'Open' } } })
        ]);
        res.json({
            success: true,
            data: {
                status: 'healthy',
                total_users: totalUsers,
                total_jobs: totalJobs,
                total_applications: totalApplications,
                active_jobs: activeJobs,
                uptime: process.uptime(),
                timestamp: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update application status - FIXED
app.put('/api/applications/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { statusId } = req.body; // Changed from 'status' to 'statusId'
        const application = await prisma.jobApplication.update({
            where: { id: id },
            data: {
                status_id: parseInt(statusId),
                updated_at: new Date()
            }
        });
        res.json({
            success: true,
            data: application,
            message: 'Status updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Add note to application - FIXED
app.post('/api/applications/:id/notes', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { note_text } = req.body; // Make sure this matches
        const userId = req.user.id;
        const employer = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer not found' });
        }
        const note = await prisma.jobApplicationNote.create({
            data: {
                application_id: id,
                employer_id: employer.id,
                note_text: note_text, // Use note_text
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            data: note,
            message: 'Note added successfully'
        });
    }
    catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== BOOKMARK/SAVE JOB ENDPOINTS ==========
// Get all saved jobs for current user
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching bookmarks for user:', userId);
        // Find job seeker profile
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            console.log('No job seeker profile found');
            return res.json({ success: true, data: [] });
        }
        const bookmarks = await prisma.jobBookmark.findMany({
            where: { seeker_id: seeker.id },
            include: {
                job: true
            }
        });
        console.log(`Found ${bookmarks.length} bookmarks`);
        res.json({ success: true, data: bookmarks });
    }
    catch (error) {
        console.error('Error fetching bookmarks:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Check if job is saved
app.get('/api/bookmarks/check/:jobId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { jobId } = req.params;
        console.log('Checking bookmark for user:', userId, 'job:', jobId);
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            return res.json({ success: true, data: { isBookmarked: false } });
        }
        const bookmark = await prisma.jobBookmark.findFirst({
            where: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        res.json({ success: true, data: { isBookmarked: !!bookmark } });
    }
    catch (error) {
        console.error('Error checking bookmark:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Save a job (Add to bookmarks)
app.post('/api/bookmarks/:jobId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { jobId } = req.params;
        console.log('Saving job:', jobId, 'for user:', userId);
        // Get or create job seeker profile
        let seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            // Create profile if doesn't exist
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            seeker = await prisma.jobSeekerProfile.create({
                data: {
                    user_id: userId,
                    full_name: user?.email?.split('@')[0] || 'User',
                    skills: []
                }
            });
            console.log('Created new job seeker profile:', seeker.id);
        }
        // Check if already saved
        const existing = await prisma.jobBookmark.findFirst({
            where: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Job already saved' });
        }
        const bookmark = await prisma.jobBookmark.create({
            data: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        console.log('Job saved successfully:', bookmark.id);
        res.json({ success: true, data: bookmark, message: 'Job saved successfully' });
    }
    catch (error) {
        console.error('Error saving job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Remove saved job
app.delete('/api/bookmarks/:jobId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { jobId } = req.params;
        console.log('Removing bookmark for job:', jobId, 'user:', userId);
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        const result = await prisma.jobBookmark.deleteMany({
            where: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        console.log('Bookmark removed, count:', result.count);
        res.json({ success: true, message: 'Job removed from saved' });
    }
    catch (error) {
        console.error('Error removing bookmark:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== START SERVER ==========
async function startServer() {
    try {
        await initializeDefaultData();
        console.log('✅ Default data initialized');
        // Check if Notification table exists, if not create it
        try {
            await prisma.$executeRaw `
        CREATE TABLE IF NOT EXISTS "Notification" (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          metadata JSONB,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE
        )
      `;
            console.log('✅ Notification table ready');
        }
        catch (error) {
            console.log('Notification table may already exist');
        }
        if (!fs_1.default.existsSync('./uploads/resumes')) {
            fs_1.default.mkdirSync('./uploads/resumes', { recursive: true });
        }
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}/api`);
            console.log(`✅ All routes enabled including notifications and employer dashboard`);
            console.log(`\n📋 Employer Routes:`);
            console.log(`  GET    /api/employer/dashboard`);
            console.log(`  GET    /api/employer/jobs`);
            console.log(`  GET    /api/employer/applications`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
