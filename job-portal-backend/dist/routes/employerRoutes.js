"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const employerController_1 = require("../controllers/employerController");
const router = (0, express_1.Router)();
// First apply auth middleware to all routes
router.use(authMiddleware_1.authMiddleware);
// Then apply role-based authorization
router.use((0, authMiddleware_1.authorizeAny)('Employer', 'Admin', 'Super Admin'));
// Company management
router.get('/company-profile', employerController_1.getCompanyProfile);
router.put('/company-profile', employerController_1.updateCompanyProfile);
router.get('/managed-companies', employerController_1.getManagedCompanies);
router.post('/managed-companies', employerController_1.addManagedCompany);
// Job management
router.post('/jobs', employerController_1.postJob);
router.get('/jobs', employerController_1.getMyJobs);
router.put('/jobs/:jobId', employerController_1.updateJob);
router.delete('/jobs/:jobId', employerController_1.deleteJob);
exports.default = router;
