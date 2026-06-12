import { Router } from 'express';
import multer from 'multer';
import {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  addApplicationNote
} from '../controllers/applicationController';
import{ protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Job seeker routes
router.post('/apply/:jobId', protect, authorize('Job Seeker'), upload.single('resume'), applyForJob);
router.get('/my-applications', protect, authorize('Job Seeker'), getMyApplications);

// Employer routes
router.get('/job/:jobId', protect, authorize('Employer', 'Admin', 'Super Admin'), getJobApplications);
router.put('/:applicationId/status', protect, authorize('Employer', 'Admin', 'Super Admin'), updateApplicationStatus);
router.post('/:applicationId/notes', protect, authorize('Employer', 'Admin', 'Super Admin'), addApplicationNote);

export default router;