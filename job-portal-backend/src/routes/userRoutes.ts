import express from 'express';
import {
  // Profile Management
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  
  // Job Seeker Specific
  getJobSeekerProfile,
  updateJobSeekerProfile,
  uploadResume,
  deleteResume,
  getSavedJobs,
  
  // Employer Specific
  getEmployerProfile,
  updateEmployerProfile,
  uploadCompanyLogo,
  getCompanyJobs,
  getCompanyApplicants,
  
  // Settings & Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  
  // Activity & Stats
  getActivityLog,
  getApplicationStats,
  getJobStats
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = './uploads/';
    
    if (file.fieldname === 'resume') {
      uploadDir = './uploads/resumes/';
    } else if (file.fieldname === 'logo') {
      uploadDir = './uploads/logos/';
    } else if (file.fieldname === 'profile_image') {
      uploadDir = './uploads/profiles/';
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (file.fieldname === 'resume') {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed'), false);
    }
  } else if (file.fieldname === 'logo' || file.fieldname === 'profile_image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const router = express.Router();

// All user routes require authentication
router.use(protect);

// ========== PROFILE MANAGEMENT ==========
// Get current user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', updateProfile);

// Update password
router.put('/change-password', updatePassword);

// Delete account
router.delete('/account', deleteAccount);

// ========== JOB SEEKER SPECIFIC ROUTES ==========
// Get job seeker profile
router.get('/seeker/profile', authorize('Job Seeker'), getJobSeekerProfile);

// Update job seeker profile
router.put('/seeker/profile', authorize('Job Seeker'), updateJobSeekerProfile);

// Upload resume
router.post('/seeker/resume', authorize('Job Seeker'), upload.single('resume'), uploadResume);

// Delete resume
router.delete('/seeker/resume', authorize('Job Seeker'), deleteResume);

// Get saved/bookmarked jobs
router.get('/seeker/saved-jobs', authorize('Job Seeker'), getSavedJobs);

// Get application stats for job seeker
router.get('/seeker/application-stats', authorize('Job Seeker'), getApplicationStats);

// ========== EMPLOYER SPECIFIC ROUTES ==========
// Get employer profile
router.get('/employer/profile', authorize('Employer'), getEmployerProfile);

// Update employer profile
router.put('/employer/profile', authorize('Employer'), updateEmployerProfile);

// Upload company logo
router.post('/employer/logo', authorize('Employer'), upload.single('logo'), uploadCompanyLogo);

// Get all jobs posted by employer
router.get('/employer/jobs', authorize('Employer'), getCompanyJobs);

// Get all applicants for employer's jobs
router.get('/employer/applicants', authorize('Employer'), getCompanyApplicants);

// Get job stats for employer
router.get('/employer/job-stats', authorize('Employer'), getJobStats);

// ========== SETTINGS & PREFERENCES ==========
// Get notification preferences
router.get('/notification-preferences', getNotificationPreferences);

// Update notification preferences
router.put('/notification-preferences', updateNotificationPreferences);

// ========== ACTIVITY LOGS ==========
// Get user activity log
router.get('/activity-log', getActivityLog);

export default router;