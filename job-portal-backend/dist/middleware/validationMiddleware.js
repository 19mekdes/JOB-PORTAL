"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.educationValidation = exports.experienceValidation = exports.industryValidation = exports.moderateJobValidation = exports.notificationPreferencesValidation = exports.notificationIdsValidation = exports.bookmarkValidation = exports.jobFiltersValidation = exports.paginationValidation = exports.userIdParamValidation = exports.jobIdParamValidation = exports.idParamValidation = exports.employerProfileValidation = exports.seekerProfileValidation = exports.applicationNoteValidation = exports.applicationStatusValidation = exports.applicationValidation = exports.jobUpdateValidation = exports.jobValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.changePasswordValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
// ========== GENERAL VALIDATION MIDDLEWARE ==========
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
        return;
    }
    next();
};
exports.validate = validate;
// ========== AUTH VALIDATIONS ==========
exports.registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email address is required')
        .normalizeEmail()
        .trim(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
    (0, express_validator_1.body)('full_name')
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .trim()
        .escape(),
    (0, express_validator_1.body)('user_type')
        .isIn(['Job Seeker', 'Employer'])
        .withMessage('User type must be either Job Seeker or Employer'),
    (0, express_validator_1.body)('phone')
        .optional()
        .matches(/^[0-9+\-\s()]{10,15}$/)
        .withMessage('Invalid phone number format')
        .trim(),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters')
        .trim(),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email address is required')
        .normalizeEmail()
        .trim(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
exports.changePasswordValidation = [
    (0, express_validator_1.body)('current_password')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('new_password')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number')
        .custom((value, { req }) => {
        if (value === req.body.current_password) {
            throw new Error('New password must be different from current password');
        }
        return true;
    }),
];
exports.forgotPasswordValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email address is required')
        .normalizeEmail(),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.param)('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    (0, express_validator_1.body)('new_password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
];
// ========== JOB VALIDATIONS ==========
exports.jobValidation = [
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('Job title is required')
        .isLength({ min: 5, max: 100 })
        .withMessage('Job title must be between 5 and 100 characters')
        .trim()
        .escape(),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Job description is required')
        .isLength({ min: 50 })
        .withMessage('Job description must be at least 50 characters')
        .trim(),
    (0, express_validator_1.body)('requirements')
        .optional()
        .isLength({ min: 20 })
        .withMessage('Requirements should be at least 20 characters if provided')
        .trim(),
    (0, express_validator_1.body)('benefits')
        .optional()
        .trim(),
    (0, express_validator_1.body)('location')
        .notEmpty()
        .withMessage('Job location is required')
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.body)('employment_type_id')
        .isInt({ min: 1 })
        .withMessage('Valid employment type is required'),
    (0, express_validator_1.body)('industry_id')
        .isInt({ min: 1 })
        .withMessage('Valid industry is required'),
    (0, express_validator_1.body)('salary_min')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum salary must be a positive number'),
    (0, express_validator_1.body)('salary_max')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum salary must be a positive number')
        .custom((value, { req }) => {
        if (req.body.salary_min && value && value < req.body.salary_min) {
            throw new Error('Maximum salary must be greater than or equal to minimum salary');
        }
        return true;
    }),
    (0, express_validator_1.body)('is_remote')
        .optional()
        .isBoolean()
        .withMessage('is_remote must be a boolean'),
];
exports.jobUpdateValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid job ID format'),
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ min: 5, max: 100 })
        .withMessage('Job title must be between 5 and 100 characters')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ min: 50 })
        .withMessage('Job description must be at least 50 characters'),
    (0, express_validator_1.body)('employment_type_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid employment type is required'),
    (0, express_validator_1.body)('industry_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid industry is required'),
    (0, express_validator_1.body)('salary_max')
        .optional()
        .custom((value, { req }) => {
        if (req.body.salary_min && value && value < req.body.salary_min) {
            throw new Error('Maximum salary must be greater than or equal to minimum salary');
        }
        return true;
    }),
];
// ========== APPLICATION VALIDATIONS ==========
exports.applicationValidation = [
    (0, express_validator_1.body)('job_id')
        .isUUID()
        .withMessage('Invalid job ID format'),
    (0, express_validator_1.body)('cover_letter')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Cover letter cannot exceed 2000 characters')
        .trim(),
    (0, express_validator_1.body)('resume_url')
        .optional()
        .isURL()
        .withMessage('Invalid resume URL format')
        .trim(),
];
exports.applicationStatusValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid application ID format'),
    (0, express_validator_1.body)('status')
        .isIn(['Pending', 'Reviewed', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'])
        .withMessage('Invalid application status'),
    (0, express_validator_1.body)('feedback')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Feedback cannot exceed 500 characters'),
];
exports.applicationNoteValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid application ID format'),
    (0, express_validator_1.body)('note_text')
        .notEmpty()
        .withMessage('Note text is required')
        .isLength({ min: 3, max: 1000 })
        .withMessage('Note must be between 3 and 1000 characters')
        .trim(),
];
// ========== PROFILE VALIDATIONS ==========
exports.seekerProfileValidation = [
    (0, express_validator_1.body)('full_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .trim()
        .escape(),
    (0, express_validator_1.body)('phone')
        .optional()
        .matches(/^[0-9+\-\s()]{10,15}$/)
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),
    (0, express_validator_1.body)('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array'),
    (0, express_validator_1.body)('skills.*')
        .optional()
        .isString()
        .withMessage('Each skill must be a string')
        .trim(),
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    (0, express_validator_1.body)('linkedin_url')
        .optional()
        .isURL()
        .withMessage('Invalid LinkedIn URL format'),
    (0, express_validator_1.body)('github_url')
        .optional()
        .isURL()
        .withMessage('Invalid GitHub URL format'),
    (0, express_validator_1.body)('portfolio_url')
        .optional()
        .isURL()
        .withMessage('Invalid portfolio URL format'),
];
exports.employerProfileValidation = [
    (0, express_validator_1.body)('company_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters')
        .trim()
        .escape(),
    (0, express_validator_1.body)('company_description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Company description cannot exceed 1000 characters'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Invalid website URL format'),
    (0, express_validator_1.body)('industry_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid industry is required'),
    (0, express_validator_1.body)('company_size')
        .optional()
        .isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
        .withMessage('Invalid company size'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),
    (0, express_validator_1.body)('founded_year')
        .optional()
        .isInt({ min: 1800, max: new Date().getFullYear() })
        .withMessage(`Founded year must be between 1800 and ${new Date().getFullYear()}`),
];
// ========== PARAMETER VALIDATIONS ==========
exports.idParamValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid ID format'),
];
exports.jobIdParamValidation = [
    (0, express_validator_1.param)('jobId')
        .isUUID()
        .withMessage('Invalid job ID format'),
];
exports.userIdParamValidation = [
    (0, express_validator_1.param)('userId')
        .isUUID()
        .withMessage('Invalid user ID format'),
];
// ========== QUERY VALIDATIONS ==========
exports.paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
];
exports.jobFiltersValidation = [
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Search term cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.query)('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters')
        .trim(),
    (0, express_validator_1.query)('industry')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid industry ID')
        .toInt(),
    (0, express_validator_1.query)('employment_type')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid employment type ID')
        .toInt(),
    (0, express_validator_1.query)('min_salary')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum salary must be a positive number')
        .toFloat(),
    (0, express_validator_1.query)('is_remote')
        .optional()
        .isBoolean()
        .withMessage('is_remote must be a boolean')
        .toBoolean(),
    (0, express_validator_1.query)('sort')
        .optional()
        .isIn(['recent', 'oldest', 'salary_high', 'salary_low'])
        .withMessage('Invalid sort option'),
    ...exports.paginationValidation
];
// ========== BOOKMARK VALIDATIONS ==========
exports.bookmarkValidation = [
    (0, express_validator_1.param)('jobId')
        .isUUID()
        .withMessage('Invalid job ID format'),
];
// ========== NOTIFICATION VALIDATIONS ==========
exports.notificationIdsValidation = [
    (0, express_validator_1.body)('notification_ids')
        .isArray()
        .withMessage('notification_ids must be an array')
        .notEmpty()
        .withMessage('notification_ids cannot be empty'),
    (0, express_validator_1.body)('notification_ids.*')
        .isInt({ min: 1 })
        .withMessage('Each notification ID must be a positive integer'),
];
exports.notificationPreferencesValidation = [
    (0, express_validator_1.body)('email_notifications')
        .optional()
        .isBoolean()
        .withMessage('email_notifications must be a boolean'),
    (0, express_validator_1.body)('push_notifications')
        .optional()
        .isBoolean()
        .withMessage('push_notifications must be a boolean'),
    (0, express_validator_1.body)('application_updates')
        .optional()
        .isBoolean()
        .withMessage('application_updates must be a boolean'),
    (0, express_validator_1.body)('new_job_alerts')
        .optional()
        .isBoolean()
        .withMessage('new_job_alerts must be a boolean'),
    (0, express_validator_1.body)('status_changes')
        .optional()
        .isBoolean()
        .withMessage('status_changes must be a boolean'),
    (0, express_validator_1.body)('marketing_emails')
        .optional()
        .isBoolean()
        .withMessage('marketing_emails must be a boolean'),
    (0, express_validator_1.body)('weekly_digest')
        .optional()
        .isBoolean()
        .withMessage('weekly_digest must be a boolean'),
];
// ========== ADMIN VALIDATIONS ==========
exports.moderateJobValidation = [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid job ID format'),
    (0, express_validator_1.body)('status')
        .isIn(['Open', 'Closed', 'Draft', 'Archived'])
        .withMessage('Invalid job status'),
    (0, express_validator_1.body)('moderation_note')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Moderation note cannot exceed 500 characters'),
];
exports.industryValidation = [
    (0, express_validator_1.body)('industry_name')
        .notEmpty()
        .withMessage('Industry name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Industry name must be between 2 and 50 characters')
        .trim()
        .escape(),
];
// ========== EXPERIENCE & EDUCATION VALIDATIONS ==========
exports.experienceValidation = [
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('Job title is required')
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),
    (0, express_validator_1.body)('company')
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ max: 100 })
        .withMessage('Company name cannot exceed 100 characters'),
    (0, express_validator_1.body)('start_date')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    (0, express_validator_1.body)('end_date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
        .custom((value, { req }) => {
        if (value && !req.body.current && new Date(value) <= new Date(req.body.start_date)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('current')
        .optional()
        .isBoolean()
        .withMessage('current must be a boolean'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
];
exports.educationValidation = [
    (0, express_validator_1.body)('degree')
        .notEmpty()
        .withMessage('Degree is required')
        .isLength({ max: 100 })
        .withMessage('Degree cannot exceed 100 characters'),
    (0, express_validator_1.body)('institution')
        .notEmpty()
        .withMessage('Institution name is required')
        .isLength({ max: 100 })
        .withMessage('Institution name cannot exceed 100 characters'),
    (0, express_validator_1.body)('field_of_study')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Field of study cannot exceed 100 characters'),
    (0, express_validator_1.body)('start_date')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    (0, express_validator_1.body)('end_date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
        .custom((value, { req }) => {
        if (value && !req.body.current && new Date(value) <= new Date(req.body.start_date)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('current')
        .optional()
        .isBoolean()
        .withMessage('current must be a boolean'),
    (0, express_validator_1.body)('grade')
        .optional()
        .isLength({ max: 10 })
        .withMessage('Grade cannot exceed 10 characters'),
];
// ========== EXPORT ALL ==========
exports.default = {
    validate: exports.validate,
    registerValidation: exports.registerValidation,
    loginValidation: exports.loginValidation,
    changePasswordValidation: exports.changePasswordValidation,
    forgotPasswordValidation: exports.forgotPasswordValidation,
    resetPasswordValidation: exports.resetPasswordValidation,
    jobValidation: exports.jobValidation,
    jobUpdateValidation: exports.jobUpdateValidation,
    applicationValidation: exports.applicationValidation,
    applicationStatusValidation: exports.applicationStatusValidation,
    applicationNoteValidation: exports.applicationNoteValidation,
    seekerProfileValidation: exports.seekerProfileValidation,
    employerProfileValidation: exports.employerProfileValidation,
    idParamValidation: exports.idParamValidation,
    jobIdParamValidation: exports.jobIdParamValidation,
    userIdParamValidation: exports.userIdParamValidation,
    paginationValidation: exports.paginationValidation,
    jobFiltersValidation: exports.jobFiltersValidation,
    bookmarkValidation: exports.bookmarkValidation,
    notificationIdsValidation: exports.notificationIdsValidation,
    notificationPreferencesValidation: exports.notificationPreferencesValidation,
    moderateJobValidation: exports.moderateJobValidation,
    industryValidation: exports.industryValidation,
    experienceValidation: exports.experienceValidation,
    educationValidation: exports.educationValidation
};
