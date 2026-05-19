"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controllers/profileController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
// All profile routes require authentication
router.use(authMiddleware_1.protect);
// ========== BASIC PROFILE ROUTES ==========
// Get current user's profile
router.get('/me', profileController_1.getProfile);
// Get profile completion percentage
router.get('/me/completion', profileController_1.getProfileCompletion);
// ========== JOB SEEKER PROFILE ROUTES ==========
// Update job seeker profile
router.put('/seeker', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.updateSeekerProfile);
// Upload resume (Job Seeker)
router.post('/seeker/resume', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.uploadResume);
// Delete resume (Job Seeker)
router.delete('/seeker/resume', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.deleteResume);
// Update skills (Job Seeker)
router.put('/seeker/skills', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.updateSkills);
// Add experience (Job Seeker)
router.post('/seeker/experience', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.addExperience);
// Update experience (Job Seeker)
router.put('/seeker/experience/:expId', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.updateExperience);
// Delete experience (Job Seeker)
router.delete('/seeker/experience/:expId', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.deleteExperience);
// Add education (Job Seeker)
router.post('/seeker/education', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.addEducation);
// Update education (Job Seeker)
router.put('/seeker/education/:eduId', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.updateEducation);
// Delete education (Job Seeker)
router.delete('/seeker/education/:eduId', (0, roleMiddleware_1.authorize)('Job Seeker'), profileController_1.deleteEducation);
// ========== EMPLOYER PROFILE ROUTES ==========
// Update employer profile
router.put('/employer', (0, roleMiddleware_1.authorize)('Employer'), profileController_1.updateEmployerProfile);
// Upload company logo (Employer)
router.post('/employer/logo', (0, roleMiddleware_1.authorize)('Employer'), profileController_1.uploadCompanyLogo);
// Delete company logo (Employer)
router.delete('/employer/logo', (0, roleMiddleware_1.authorize)('Employer'), profileController_1.deleteCompanyLogo);
// ========== PUBLIC PROFILE ROUTES ==========
// Get public profile by user ID (no authentication required)
router.get('/public/:userId', profileController_1.getPublicProfile);
// Get job seeker profile by ID (for employers)
router.get('/seeker/:seekerId', (0, roleMiddleware_1.authorize)('Employer'), profileController_1.getSeekerProfileById);
// Get employer profile by ID (for job seekers)
router.get('/employer/:employerId', profileController_1.getEmployerProfileById);
exports.default = router;
