import express from 'express'
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getEmployerJobs,
  getJobStats,
  getJobApplications,
  searchJobs,
  getJobsByIndustry,
  getJobsByLocation,
  getRecommendedJobs,
  toggleJobStatus,
  getJobFilters
} from '../controllers/jobController'
import { protect } from '../middleware/authMiddleware'
import { authorize, isEmployer } from '../middleware/roleMiddleware'
import { jobValidation, jobUpdateValidation } from '../middleware/validationMiddleware'

const router = express.Router()

// ========== PUBLIC ROUTES (No authentication required) ==========
// Get all jobs with filters
router.get('/', getAllJobs)

// Search jobs
router.get('/search', searchJobs)

// Get job by ID
router.get('/:id', getJobById)

// Get job filters (industries, employment types, locations)
router.get('/filters/options', getJobFilters)

// Get jobs by industry
router.get('/industry/:industryId', getJobsByIndustry)

// Get jobs by location
router.get('/location/:city', getJobsByLocation)

// ========== PROTECTED ROUTES (Authentication required) ==========
// Get recommended jobs for job seeker
router.get('/recommended', protect, getRecommendedJobs)

// ========== EMPLOYER ONLY ROUTES ==========
// Create a new job
router.post('/', protect, authorize('Employer'), jobValidation, createJob)

// Get employer's jobs
router.get('/employer/my-jobs', protect, isEmployer, getEmployerJobs)

// Get job statistics for employer
router.get('/employer/stats', protect, isEmployer, getJobStats)

// Get applications for employer's job
router.get('/:jobId/applications', protect, isEmployer, getJobApplications)

// Update a job
router.put('/:id', protect, authorize('Employer'), jobUpdateValidation, updateJob)

// Toggle job status (Open/Closed)
router.patch('/:id/toggle-status', protect, authorize('Employer'), toggleJobStatus)

// Delete a job
router.delete('/:id', protect, authorize('Employer'), deleteJob)

export default router