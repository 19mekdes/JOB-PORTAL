/* eslint-disable @typescript-eslint/no-explicit-any */
// ========== RE-EXPORT ALL TYPES ==========
export * from './auth'
export * from './user'
export * from './job'
export * from './application'
export type { BookmarkedJob } from './api'

// ========== CORE TYPES ==========

// User Types
export interface User {
  id: string
  email: string
  password?: string
  user_type_id: number
  user_type?: UserType
  is_active: boolean
  email_verified?: boolean
  created_at: string
  updated_at: string
  last_login?: string
  seeker_profile?: JobSeekerProfile
  employer_profile?: EmployerProfile
}

export interface UserType {
  id: number
  type_name: 'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'
  users?: User[]
  created_at: string
}

// Profile Types
export interface JobSeekerProfile {
  id: string
  full_name: string
  phone: string | null
  resume_url: string | null
  skills: string[]
  experience: string | null
  education: string | null
  location: string | null
  user_id: string
  user?: User
  applications?: JobApplication[]
  bookmarks?: JobBookmark[]
}

export interface EmployerProfile {
  id: string
  company_name: string
  company_description: string | null
  website: string | null
  logo_url: string | null
  industry_id: number
  company_size: string | null
  location: string | null
  user_id: string
  user?: User
  industry?: JobIndustry
  jobs?: JobPost[]
  notes?: JobApplicationNote[]
}

// Job Types
export interface JobPost {
  id: string
  title: string
  description: string
  requirements: string | null
  benefits: string | null
  employer_id: string
  industry_id: number
  employment_type_id: number
  salary_min: number | null
  salary_max: number | null
  salary_range: string | null
  location: string
  is_remote: boolean
  status_id: number
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
  employer?: EmployerProfile
  industry?: JobIndustry
  employment_type?: EmploymentType
  status?: JobPostStatus
  applications?: JobApplication[]
  bookmarks?: JobBookmark[]
}

export interface JobIndustry {
  id: number
  industry_name: string
  employers?: EmployerProfile[]
  jobs?: JobPost[]
}

export interface EmploymentType {
  id: number
  type_name: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid' | 'Internship'
  jobs?: JobPost[]
}

export interface JobPostStatus {
  id: number
  status_name: 'Open' | 'Closed' | 'Draft' | 'Archived'
  jobs?: JobPost[]
}

// Application Types
export interface JobApplication {
  id: string
  job_id: string
  seeker_id: string
  resume_url: string | null
  cover_letter: string | null
  status_id: number
  employer_notes: string | null
  applied_at: string
  updated_at: string
  job?: JobPost
  seeker?: JobSeekerProfile
  status?: JobApplicationStatus
  notes?: JobApplicationNote[]
}

export interface JobApplicationStatus {
  id: number
  status_name: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected'
  applications?: JobApplication[]
}

export interface JobApplicationNote {
  id: number
  application_id: string
  employer_id: string
  note_text: string
  created_at: string
  application?: JobApplication
  employer?: EmployerProfile
}

// Bookmark Types
export interface JobBookmark {
  id: number
  seeker_id: string
  job_id: string
  created_at: string
  seeker?: JobSeekerProfile
  job?: JobPost
}

// Notification Types
export interface Notification {
  id: number
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  user?: User
}

export interface NotificationPreference {
  id: number
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  application_updates: boolean
  new_job_alerts: boolean
  status_changes: boolean
  marketing_emails: boolean
  weekly_digest: boolean
  created_at: string
  updated_at: string
  user?: User
}

// Search Types
export interface SearchLog {
  id: number
  user_id: string | null
  search_term: string
  filters: any
  results_count: number
  created_at: string
  user?: User
}

// System Types
export interface SystemSetting {
  id: number
  site_name: string
  site_description: string
  contact_email: string
  enable_registration: boolean
  require_email_verification: boolean
  max_job_posts_per_employer: number
  max_applications_per_seeker: number
  job_expiry_days: number
  maintenance_mode: boolean
  allowed_file_types: string[]
  max_file_size_mb: number
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  admin_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string | null
  created_at: string
  admin?: User
}

// ========== REQUEST/RESPONSE TYPES ==========
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ========== FILTER TYPES ==========
export interface JobFilters {
  search?: string
  location?: string
  industry?: number
  employment_type?: number
  min_salary?: number
  max_salary?: number
  is_remote?: boolean
  is_featured?: boolean
  date_posted?: string
  experience_level?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'salary_high' | 'salary_low' | 'relevance'
}

export interface ApplicationFilters {
  status?: string
  job_id?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest'
}

export interface UserFilters {
  search?: string
  user_type?: string
  is_active?: string
  page?: number
  limit?: number
}

// ========== FORM TYPES ==========
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  user_type: 'Job Seeker' | 'Employer'
  phone?: string
  location?: string
}

export interface JobFormData {
  title: string
  description: string
  requirements: string
  benefits: string
  location: string
  employment_type_id: number
  industry_id: number
  salary_min: string
  salary_max: string
  is_remote: boolean
}

export interface ApplicationFormData {
  cover_letter: string
  resume_url: string
  phone?: string
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
  availability?: string
  expected_salary?: string
}

// ========== COMPONENT PROPS TYPES ==========
export interface JobCardProps {
  job: JobPost
  variant?: 'default' | 'compact' | 'featured'
  showActions?: boolean
  onSave?: () => void
  onApply?: () => void
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  showPageSizeSelector?: boolean
  showTotal?: boolean
  showFirstLast?: boolean
}

// ========== ENUM TYPES ==========
export type UserRole = 'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'
export type JobStatus = 'Open' | 'Closed' | 'Draft' | 'Archived'
export type ApplicationStatus = 'Pending' | 'Reviewed' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected'
export type EmploymentTypeName = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid' | 'Internship'
export type NotificationType = 'application_submitted' | 'application_received' | 'status_change' | 'new_job' | 'interview_scheduled' | 'message' | 'job_alert' | 'application_withdrawn' | 'account_suspended' | 'account_activated'

// ========== CONSTANT VALUES ==========
export const USER_TYPES = {
  JOB_SEEKER: 'Job Seeker' as const,
  EMPLOYER: 'Employer' as const,
  ADMIN: 'Admin' as const,
  SUPER_ADMIN: 'Super Admin' as const
}

export const JOB_STATUSES = {
  OPEN: 'Open' as const,
  CLOSED: 'Closed' as const,
  DRAFT: 'Draft' as const,
  ARCHIVED: 'Archived' as const
}

export const APPLICATION_STATUSES = {
  PENDING: 'Pending' as const,
  REVIEWED: 'Reviewed' as const,
  SHORTLISTED: 'Shortlisted' as const,
  INTERVIEW: 'Interview' as const,
  ACCEPTED: 'Accepted' as const,
  REJECTED: 'Rejected' as const
}

export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'Full-time' as const,
  PART_TIME: 'Part-time' as const,
  CONTRACT: 'Contract' as const,
  REMOTE: 'Remote' as const,
  HYBRID: 'Hybrid' as const,
  INTERNSHIP: 'Internship' as const
}