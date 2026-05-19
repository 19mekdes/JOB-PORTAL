"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = express_1.default.Router();
// ========== PUBLIC ROUTES (No authentication required) ==========
// Get all jobs with filters
router.get('/', jobController_1.getAllJobs);
// Search jobs
router.get('/search', jobController_1.searchJobs);
// Get job by ID
router.get('/:id', jobController_1.getJobById);
// Get job filters (industries, employment types, locations)
router.get('/filters/options', jobController_1.getJobFilters);
// Get jobs by industry
router.get('/industry/:industryId', jobController_1.getJobsByIndustry);
// Get jobs by location
router.get('/location/:city', jobController_1.getJobsByLocation);
// ========== PROTECTED ROUTES (Authentication required) ==========
// Get recommended jobs for job seeker
router.get('/recommended', authMiddleware_1.protect, jobController_1.getRecommendedJobs);
// ========== EMPLOYER ONLY ROUTES ==========
// Create a new job
router.post('/', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer'), validationMiddleware_1.jobValidation, jobController_1.createJob);
// Get employer's jobs
router.get('/employer/my-jobs', authMiddleware_1.protect, roleMiddleware_1.isEmployer, jobController_1.getEmployerJobs);
// Get job statistics for employer
router.get('/employer/stats', authMiddleware_1.protect, roleMiddleware_1.isEmployer, jobController_1.getJobStats);
// Get applications for employer's job
router.get('/:jobId/applications', authMiddleware_1.protect, roleMiddleware_1.isEmployer, jobController_1.getJobApplications);
// Update a job
router.put('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer'), validationMiddleware_1.jobUpdateValidation, jobController_1.updateJob);
// Toggle job status (Open/Closed)
router.patch('/:id/toggle-status', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer'), jobController_1.toggleJobStatus);
// Delete a job
router.delete('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer'), jobController_1.deleteJob);
exports.default = router;
