// ========== APP CONFIGURATION ==========
export const APP_NAME = 'JobPortal'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Connect job seekers with employers'

// ========== API CONFIGURATION ==========
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const API_TIMEOUT = 30000
export const REFRESH_TOKEN_URL = '/auth/refresh-token'

// ========== STORAGE KEYS ==========
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  REMEMBER_ME: 'rememberMe',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recentSearches',
  RECENT_JOBS: 'recentJobs',
  JOB_FILTERS: 'jobFilters',
  NOTIFICATION_PREFS: 'notificationPrefs'
} as const

// ========== ROUTES ==========
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  JOBS: '/jobs',
  JOB_DETAILS: (id: string) => `/jobs/${id}`,
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: (token: string) => `/reset-password/${token}`,
  VERIFY_EMAIL: (token: string) => `/verify-email/${token}`,
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  MY_APPLICATIONS: '/applications',
  MY_BOOKMARKS: '/bookmarks',
  EMPLOYER_JOBS: '/employer/jobs',
  EMPLOYER_POST_JOB: '/employer/post-job',
  ADMIN: '/admin',
  SUPER_ADMIN: '/super-admin',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404'
} as const

// ========== USER ROLES ==========
export const USER_ROLES = {
  JOB_SEEKER: 'Job Seeker',
  EMPLOYER: 'Employer',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// ========== JOB STATUS ==========
export const JOB_STATUS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived'
} as const

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS]

// ========== APPLICATION STATUS ==========
export const APPLICATION_STATUS = {
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
} as const

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS]

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  [APPLICATION_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [APPLICATION_STATUS.REVIEWED]: 'bg-blue-100 text-blue-800',
  [APPLICATION_STATUS.SHORTLISTED]: 'bg-green-100 text-green-800',
  [APPLICATION_STATUS.INTERVIEW]: 'bg-purple-100 text-purple-800',
  [APPLICATION_STATUS.ACCEPTED]: 'bg-green-100 text-green-800',
  [APPLICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800'
}

// ========== EMPLOYMENT TYPES ==========
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  INTERNSHIP: 'Internship'
} as const

export type EmploymentType = typeof EMPLOYMENT_TYPES[keyof typeof EMPLOYMENT_TYPES]

// ========== NOTIFICATION TYPES ==========
export const NOTIFICATION_TYPES = {
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_RECEIVED: 'application_received',
  STATUS_CHANGE: 'status_change',
  NEW_JOB: 'new_job',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  MESSAGE: 'message',
  JOB_ALERT: 'job_alert',
  APPLICATION_WITHDRAWN: 'application_withdrawn',
  ACCOUNT_SUSPENDED: 'account_suspended',
  ACCOUNT_ACTIVATED: 'account_activated'
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

// ========== PAGINATION ==========
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

// ========== FILE UPLOAD ==========
export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
export const MAX_IMAGE_SIZE_MB = 2
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

// ========== DATE FORMATS ==========
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy h:mm a',
  API: 'yyyy-MM-dd',
  API_FULL: 'yyyy-MM-dd HH:mm:ss',
  MONTH_YEAR: 'MMM yyyy',
  YEAR: 'yyyy'
} as const

// ========== SALARY CONSTANTS ==========
export const MIN_SALARY = 0
export const MAX_SALARY = 200000
export const SALARY_STEP = 10000

// ========== EXPERIENCE LEVELS ==========
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive'
} as const

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[keyof typeof EXPERIENCE_LEVELS]

export const EXPERIENCE_YEARS: Record<ExperienceLevel, { min: number; max: number | null }> = {
  [EXPERIENCE_LEVELS.ENTRY]: { min: 0, max: 2 },
  [EXPERIENCE_LEVELS.MID]: { min: 3, max: 5 },
  [EXPERIENCE_LEVELS.SENIOR]: { min: 6, max: 9 },
  [EXPERIENCE_LEVELS.LEAD]: { min: 10, max: null },
  [EXPERIENCE_LEVELS.EXECUTIVE]: { min: 15, max: null }
}

// ========== DATE RANGES ==========
export const DATE_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL: 'all'
} as const

export type DateRange = typeof DATE_RANGES[keyof typeof DATE_RANGES]

export const DATE_RANGE_DAYS: Record<DateRange, number | null> = {
  [DATE_RANGES.TODAY]: 1,
  [DATE_RANGES.WEEK]: 7,
  [DATE_RANGES.MONTH]: 30,
  [DATE_RANGES.QUARTER]: 90,
  [DATE_RANGES.YEAR]: 365,
  [DATE_RANGES.ALL]: null
}

// ========== SORT OPTIONS ==========
export const SORT_OPTIONS = {
  RECENT: 'recent',
  OLDEST: 'oldest',
  SALARY_HIGH: 'salary_high',
  SALARY_LOW: 'salary_low',
  RELEVANCE: 'relevance'
} as const

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS]

// ========== THEME ==========
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const

export type Theme = typeof THEMES[keyof typeof THEMES]

// ========== LANGUAGE ==========
export const LANGUAGES = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  ZH: 'zh'
} as const

export type Language = typeof LANGUAGES[keyof typeof LANGUAGES]

// ========== REGEX PATTERNS ==========
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9+\-\s()]{10,15}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  COMPANY_NAME: /^[a-zA-Z0-9\s&.,-]{2,100}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/
} as const

// ========== ERROR MESSAGES ==========
export const ERROR_MESSAGES = {
  // Auth Errors
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters with at least one letter, one number, and one special character',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  EMAIL_EXISTS: 'An account with this email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  
  // Job Errors
  JOB_NOT_FOUND: 'Job not found',
  JOB_EXPIRED: 'This job posting has expired',
  ALREADY_APPLIED: 'You have already applied for this position',
  
  // File Upload Errors
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'File type is not allowed',
  UPLOAD_FAILED: 'Failed to upload file. Please try again',
  
  // General Errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  SOMETHING_WRONG: 'Something went wrong. Please try again',
  REQUIRED_FIELD: 'This field is required'
} as const

// ========== SUCCESS MESSAGES ==========
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Redirecting...',
  REGISTER_SUCCESS: 'Registration successful! Please check your email to verify your account',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  RESET_LINK_SENT: 'Password reset link sent to your email',
  PASSWORD_RESET: 'Password reset successful. Please login with your new password',
  EMAIL_VERIFIED: 'Email verified successfully',
  JOB_POSTED: 'Job posted successfully',
  JOB_UPDATED: 'Job updated successfully',
  JOB_DELETED: 'Job deleted successfully',
  APPLICATION_SUBMITTED: 'Application submitted successfully',
  APPLICATION_WITHDRAWN: 'Application withdrawn successfully',
  STATUS_UPDATED: 'Status updated successfully',
  NOTE_ADDED: 'Note added successfully',
  BOOKMARK_ADDED: 'Job saved successfully',
  BOOKMARK_REMOVED: 'Job removed from saved'
} as const

// ========== LOCAL STORAGE DEFAULTS ==========
export const DEFAULT_SETTINGS = {
  theme: THEMES.LIGHT,
  language: LANGUAGES.EN,
  itemsPerPage: DEFAULT_LIMIT,
  emailNotifications: true,
  pushNotifications: true
} as const

// ========== ANIMATION DURATIONS ==========
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
} as const

// ========== DEBOUNCE DELAYS ==========
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  TYPE: 500,
  SAVE: 1000
} as const

// ========== TOAST DURATIONS ==========
export const TOAST_DURATIONS = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000
} as const