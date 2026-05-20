"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const applicationController_1 = require("../controllers/applicationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = (0, express_1.Router)();
// Configure multer for file upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `resume-${uniqueSuffix}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
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
// Job seeker routes
router.post('/apply/:jobId', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Job Seeker'), upload.single('resume'), applicationController_1.applyForJob);
router.get('/my-applications', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Job Seeker'), applicationController_1.getMyApplications);
// Employer routes
router.get('/job/:jobId', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer', 'Admin', 'Super Admin'), applicationController_1.getJobApplications);
router.put('/:applicationId/status', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer', 'Admin', 'Super Admin'), applicationController_1.updateApplicationStatus);
router.post('/:applicationId/notes', authMiddleware_1.protect, (0, roleMiddleware_1.authorize)('Employer', 'Admin', 'Super Admin'), applicationController_1.addApplicationNote);
exports.default = router;
