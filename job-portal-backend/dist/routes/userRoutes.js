"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = './uploads/';
        if (file.fieldname === 'resume') {
            uploadDir = './uploads/resumes/';
        }
        else if (file.fieldname === 'logo') {
            uploadDir = './uploads/logos/';
        }
        else if (file.fieldname === 'profile_image') {
            uploadDir = './uploads/profiles/';
        }
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file.fieldname === 'resume') {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed'), false);
        }
    }
    else if (file.fieldname === 'logo' || file.fieldname === 'profile_image') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only image files are allowed'), false);
        }
    }
    else {
        cb(null, true);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});
const router = express_1.default.Router();
// All user routes require authentication
router.use(authMiddleware_1.protect);
// ========== PROFILE MANAGEMENT ==========
// Get current user profile
router.get('/profile', userController_1.getProfile);
// Update user profile
router.put('/profile', userController_1.updateProfile);
// Update password
router.put('/change-password', userController_1.updatePassword);
// Delete account
router.delete('/account', userController_1.deleteAccount);
// ========== JOB SEEKER SPECIFIC ROUTES ==========
// Get job seeker profile
router.get('/seeker/profile', (0, roleMiddleware_1.authorize)('Job Seeker'), userController_1.getJobSeekerProfile);
// Update job seeker profile
router.put('/seeker/profile', (0, roleMiddleware_1.authorize)('Job Seeker'), userController_1.updateJobSeekerProfile);
// Upload resume
router.post('/seeker/resume', (0, roleMiddleware_1.authorize)('Job Seeker'), upload.single('resume'), userController_1.uploadResume);
// Delete resume
router.delete('/seeker/resume', (0, roleMiddleware_1.authorize)('Job Seeker'), userController_1.deleteResume);
// Get saved/bookmarked jobs
router.get('/seeker/saved-jobs', (0, roleMiddleware_1.authorize)('Job Seeker'), userController_1.getSavedJobs);
// Get application stats for job seeker
router.get('/seeker/application-stats', (0, roleMiddleware_1.authorize)('Job Seeker'), userController_1.getApplicationStats);
// ========== EMPLOYER SPECIFIC ROUTES ==========
// Get employer profile
router.get('/employer/profile', (0, roleMiddleware_1.authorize)('Employer'), userController_1.getEmployerProfile);
// Update employer profile
router.put('/employer/profile', (0, roleMiddleware_1.authorize)('Employer'), userController_1.updateEmployerProfile);
// Upload company logo
router.post('/employer/logo', (0, roleMiddleware_1.authorize)('Employer'), upload.single('logo'), userController_1.uploadCompanyLogo);
// Get all jobs posted by employer
router.get('/employer/jobs', (0, roleMiddleware_1.authorize)('Employer'), userController_1.getCompanyJobs);
// Get all applicants for employer's jobs
router.get('/employer/applicants', (0, roleMiddleware_1.authorize)('Employer'), userController_1.getCompanyApplicants);
// Get job stats for employer
router.get('/employer/job-stats', (0, roleMiddleware_1.authorize)('Employer'), userController_1.getJobStats);
// ========== SETTINGS & PREFERENCES ==========
// Get notification preferences
router.get('/notification-preferences', userController_1.getNotificationPreferences);
// Update notification preferences
router.put('/notification-preferences', userController_1.updateNotificationPreferences);
// ========== ACTIVITY LOGS ==========
// Get user activity log
router.get('/activity-log', userController_1.getActivityLog);
exports.default = router;
