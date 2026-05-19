import { body, param, query, validationResult, ValidationChain } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

// ========== GENERAL VALIDATION MIDDLEWARE ==========
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: (err as any).path,
        message: err.msg,
        value: (err as any).value
      }))
    })
    return
  }
  next()
}

// ========== AUTH VALIDATIONS ==========
export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  
  body('user_type')
    .isIn(['Job Seeker', 'Employer'])
    .withMessage('User type must be either Job Seeker or Employer'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Invalid phone number format')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
]

export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

export const changePasswordValidation: ValidationChain[] = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
    .custom((value: string, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must be different from current password')
      }
      return true
    }),
]

export const forgotPasswordValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
]

export const resetPasswordValidation: ValidationChain[] = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
]

// ========== JOB VALIDATIONS ==========
export const jobValidation: ValidationChain[] = [
  body('title')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters')
    .trim()
    .escape(),
  
  body('description')
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ min: 50 })
    .withMessage('Job description must be at least 50 characters')
    .trim(),
  
  body('requirements')
    .optional()
    .isLength({ min: 20 })
    .withMessage('Requirements should be at least 20 characters if provided')
    .trim(),
  
  body('benefits')
    .optional()
    .trim(),
  
  body('location')
    .notEmpty()
    .withMessage('Job location is required')
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
  
  body('employment_type_id')
    .isInt({ min: 1 })
    .withMessage('Valid employment type is required'),
  
  body('industry_id')
    .isInt({ min: 1 })
    .withMessage('Valid industry is required'),
  
  body('salary_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  
  body('salary_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
    .custom((value: number, { req }) => {
      if (req.body.salary_min && value && value < req.body.salary_min) {
        throw new Error('Maximum salary must be greater than or equal to minimum salary')
      }
      return true
    }),
  
  body('is_remote')
    .optional()
    .isBoolean()
    .withMessage('is_remote must be a boolean'),
]

export const jobUpdateValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid job ID format'),
  
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ min: 50 })
    .withMessage('Job description must be at least 50 characters'),
  
  body('employment_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid employment type is required'),
  
  body('industry_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid industry is required'),
  
  body('salary_max')
    .optional()
    .custom((value: number, { req }) => {
      if (req.body.salary_min && value && value < req.body.salary_min) {
        throw new Error('Maximum salary must be greater than or equal to minimum salary')
      }
      return true
    }),
]

// ========== APPLICATION VALIDATIONS ==========
export const applicationValidation: ValidationChain[] = [
  body('job_id')
    .isUUID()
    .withMessage('Invalid job ID format'),
  
  body('cover_letter')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters')
    .trim(),
  
  body('resume_url')
    .optional()
    .isURL()
    .withMessage('Invalid resume URL format')
    .trim(),
]

export const applicationStatusValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid application ID format'),
  
  body('status')
    .isIn(['Pending', 'Reviewed', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'])
    .withMessage('Invalid application status'),
  
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters'),
]

export const applicationNoteValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid application ID format'),
  
  body('note_text')
    .notEmpty()
    .withMessage('Note text is required')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Note must be between 3 and 1000 characters')
    .trim(),
]

// ========== PROFILE VALIDATIONS ==========
export const seekerProfileValidation: ValidationChain[] = [
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Invalid phone number format'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .isString()
    .withMessage('Each skill must be a string')
    .trim(),
  
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('linkedin_url')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL format'),
  
  body('github_url')
    .optional()
    .isURL()
    .withMessage('Invalid GitHub URL format'),
  
  body('portfolio_url')
    .optional()
    .isURL()
    .withMessage('Invalid portfolio URL format'),
]

export const employerProfileValidation: ValidationChain[] = [
  body('company_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .trim()
    .escape(),
  
  body('company_description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Company description cannot exceed 1000 characters'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL format'),
  
  body('industry_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid industry is required'),
  
  body('company_size')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
    .withMessage('Invalid company size'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('founded_year')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Founded year must be between 1800 and ${new Date().getFullYear()}`),
]

// ========== PARAMETER VALIDATIONS ==========
export const idParamValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
]

export const jobIdParamValidation: ValidationChain[] = [
  param('jobId')
    .isUUID()
    .withMessage('Invalid job ID format'),
]

export const userIdParamValidation: ValidationChain[] = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
]

// ========== QUERY VALIDATIONS ==========
export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
]

export const jobFiltersValidation: ValidationChain[] = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters')
    .trim(),
  
  query('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
  
  query('industry')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid industry ID')
    .toInt(),
  
  query('employment_type')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid employment type ID')
    .toInt(),
  
  query('min_salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number')
    .toFloat(),
  
  query('is_remote')
    .optional()
    .isBoolean()
    .withMessage('is_remote must be a boolean')
    .toBoolean(),
  
  query('sort')
    .optional()
    .isIn(['recent', 'oldest', 'salary_high', 'salary_low'])
    .withMessage('Invalid sort option'),
  
  ...paginationValidation
]

// ========== BOOKMARK VALIDATIONS ==========
export const bookmarkValidation: ValidationChain[] = [
  param('jobId')
    .isUUID()
    .withMessage('Invalid job ID format'),
]

// ========== NOTIFICATION VALIDATIONS ==========
export const notificationIdsValidation: ValidationChain[] = [
  body('notification_ids')
    .isArray()
    .withMessage('notification_ids must be an array')
    .notEmpty()
    .withMessage('notification_ids cannot be empty'),
  
  body('notification_ids.*')
    .isInt({ min: 1 })
    .withMessage('Each notification ID must be a positive integer'),
]

export const notificationPreferencesValidation: ValidationChain[] = [
  body('email_notifications')
    .optional()
    .isBoolean()
    .withMessage('email_notifications must be a boolean'),
  
  body('push_notifications')
    .optional()
    .isBoolean()
    .withMessage('push_notifications must be a boolean'),
  
  body('application_updates')
    .optional()
    .isBoolean()
    .withMessage('application_updates must be a boolean'),
  
  body('new_job_alerts')
    .optional()
    .isBoolean()
    .withMessage('new_job_alerts must be a boolean'),
  
  body('status_changes')
    .optional()
    .isBoolean()
    .withMessage('status_changes must be a boolean'),
  
  body('marketing_emails')
    .optional()
    .isBoolean()
    .withMessage('marketing_emails must be a boolean'),
  
  body('weekly_digest')
    .optional()
    .isBoolean()
    .withMessage('weekly_digest must be a boolean'),
]

// ========== ADMIN VALIDATIONS ==========
export const moderateJobValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid job ID format'),
  
  body('status')
    .isIn(['Open', 'Closed', 'Draft', 'Archived'])
    .withMessage('Invalid job status'),
  
  body('moderation_note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Moderation note cannot exceed 500 characters'),
]

export const industryValidation: ValidationChain[] = [
  body('industry_name')
    .notEmpty()
    .withMessage('Industry name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Industry name must be between 2 and 50 characters')
    .trim()
    .escape(),
]

// ========== EXPERIENCE & EDUCATION VALIDATIONS ==========
export const experienceValidation: ValidationChain[] = [
  body('title')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('company')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value: string, { req }) => {
      if (value && !req.body.current && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date')
      }
      return true
    }),
  
  body('current')
    .optional()
    .isBoolean()
    .withMessage('current must be a boolean'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
]

export const educationValidation: ValidationChain[] = [
  body('degree')
    .notEmpty()
    .withMessage('Degree is required')
    .isLength({ max: 100 })
    .withMessage('Degree cannot exceed 100 characters'),
  
  body('institution')
    .notEmpty()
    .withMessage('Institution name is required')
    .isLength({ max: 100 })
    .withMessage('Institution name cannot exceed 100 characters'),
  
  body('field_of_study')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Field of study cannot exceed 100 characters'),
  
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value: string, { req }) => {
      if (value && !req.body.current && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date')
      }
      return true
    }),
  
  body('current')
    .optional()
    .isBoolean()
    .withMessage('current must be a boolean'),
  
  body('grade')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Grade cannot exceed 10 characters'),
]

// ========== EXPORT ALL ==========
export default {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  jobValidation,
  jobUpdateValidation,
  applicationValidation,
  applicationStatusValidation,
  applicationNoteValidation,
  seekerProfileValidation,
  employerProfileValidation,
  idParamValidation,
  jobIdParamValidation,
  userIdParamValidation,
  paginationValidation,
  jobFiltersValidation,
  bookmarkValidation,
  notificationIdsValidation,
  notificationPreferencesValidation,
  moderateJobValidation,
  industryValidation,
  experienceValidation,
  educationValidation
}