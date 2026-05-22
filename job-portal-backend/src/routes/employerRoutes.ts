import { Router } from 'express';
import { authMiddleware, isEmployer, isAdmin, isSuperAdmin, authorizeAny } from '../middleware/authMiddleware';
import {
  postJob,
  getMyJobs,
  updateJob,
  deleteJob,
  getCompanyProfile,
  updateCompanyProfile,
  addManagedCompany,
  getManagedCompanies
} from '../controllers/employerController';

const router = Router();

// First apply auth middleware to all routes
router.use(authMiddleware);

// Then apply role-based authorization
router.use(authorizeAny('Employer', 'Admin', 'Super Admin'));

// Company management
router.get('/company-profile', getCompanyProfile);
router.put('/company-profile', updateCompanyProfile);
router.get('/managed-companies', getManagedCompanies);
router.post('/managed-companies', addManagedCompany);

// Job management
router.post('/jobs', postJob);
router.get('/jobs', getMyJobs);
router.put('/jobs/:jobId', updateJob);
router.delete('/jobs/:jobId', deleteJob);

export default router;