/* eslint-disable @typescript-eslint/no-explicit-any */
// ========== API RESPONSE TYPES ==========
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

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

// ========== AUTH TYPES ==========
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  user_type: 'Job Seeker' | 'Employer'
  phone?: string
  location?: string
}

export interface AuthResponse {
  success: boolean
  token: string
  refreshToken?: string
  user: {
    id: string
    email: string
    user_type: string
    full_name?: string
    email_verified?: boolean
    profile_completed?: boolean
  }
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

// ========== USER TYPES ==========
export interface User {
  id: string
  email: string
  user_type: {
    id: number
    type_name: string
  }
  is_active: boolean
  email_verified?: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface UserProfile {
  id: string
  email: string
  user_type: string
  full_name?: string
  phone?: string
  location?: string
  avatar?: string
  created_at: string
  updated_at: string
}

// ========== JOB TYPES ==========
export interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  benefits: string | null
  location: string
  salary_range: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
  updated_at: string
  views_count: number
  applications_count: number
  is_remote: boolean
  is_featured?: boolean
  is_premium?: boolean
  employer: {
    id: string
    company_name: string
    logo_url: string | null
    company_description?: string | null
    website?: string | null
  }
  industry: {
    id: number
    industry_name: string
  }
  employment_type: {
    id: number
    type_name: string
  }
  status: {
    id: number
    status_name: string
  }
  has_applied?: boolean
  is_saved?: boolean
  match_score?: number
}

export interface CreateJobRequest {
  title: string
  description: string
  requirements?: string
  benefits?: string
  location: string
  employment_type_id: number
  industry_id: number
  salary_min?: number
  salary_max?: number
  is_remote?: boolean
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: 'Open' | 'Closed' | 'Draft' | 'Archived'
}

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

// ========== APPLICATION TYPES ==========
export interface Application {
  id: string
  job_id: string
  cover_letter: string
  resume_url: string
  applied_at: string
  updated_at: string
  status: {
    id: number
    status_name: string
  }
  job: Job
  notes?: ApplicationNote[]
}

export interface ApplicationNote {
  id: number
  application_id: string
  employer_id: string
  note_text: string
  created_at: string
  employer?: {
    user: {
      email: string
    }
    company_name: string
  }
}

export interface CreateApplicationRequest {
  job_id: string
  cover_letter: string
  resume_url?: string
  additional_info?: {
    phone?: string
    portfolio_url?: string
    linkedin_url?: string
    github_url?: string
    availability?: string
    expected_salary?: string
  }
}

export interface UpdateApplicationStatusRequest {
  status: string
  feedback?: string
}

export interface ApplicationFilters {
  status?: string
  job_id?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest'
}

// ========== PROFILE TYPES ==========
export interface SeekerProfile {
  id: string
  full_name: string
  phone: string | null
  location: string | null
  skills: string[]
  experience: any[] | string | null
  education: any[] | string | null
  bio: string | null
  title: string | null
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  availability: string | null
  created_at: string
  updated_at: string
}

export interface EmployerProfile {
  id: string
  company_name: string
  company_description: string | null
  website: string | null
  logo_url: string | null
  industry_id: number
  industry?: {
    id: number
    industry_name: string
  }
  company_size: string | null
  location: string | null
  phone: string | null
  founded_year: number | null
  headquarters: string | null
  social_links?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
  }
  created_at: string
  updated_at: string
}

export interface UpdateSeekerProfileRequest {
  full_name?: string
  phone?: string
  location?: string
  skills?: string[]
  experience?: any
  education?: any
  bio?: string
  title?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  availability?: string
}

export interface UpdateEmployerProfileRequest {
  company_name?: string
  company_description?: string
  website?: string
  industry_id?: number
  company_size?: string
  location?: string
  phone?: string
  founded_year?: number
  headquarters?: string
  social_links?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
  }
}

// ========== NOTIFICATION TYPES ==========
export interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: {
    job_id?: string
    application_id?: string
    company_name?: string
    job_title?: string
  }
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  application_updates: boolean
  new_job_alerts: boolean
  status_changes: boolean
  marketing_emails: boolean
  weekly_digest: boolean
  interview_reminders: boolean
  message_notifications: boolean
  job_recommendations: boolean
}

export interface NotificationFilters {
  type?: string
  is_read?: boolean
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

// ========== BOOKMARK TYPES ==========
export interface BookmarkedJob {
  id: number
  job: Job
  created_at: string
}

export interface BookmarkFilters {
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'title' | 'company'
}

// ========== ADMIN TYPES ==========
export interface AdminUser {
  id: string
  email: string
  user_type: {
    id: number
    type_name: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
  employer_profile?: {
    company_name: string
  }
}

export interface CreateAdminRequest {
  email: string
  password: string
  full_name: string
  role: 'Admin' | 'Super Admin'
}

export interface UpdateAdminRequest {
  email?: string
  is_active?: boolean
  role?: 'Admin' | 'Super Admin'
}

export interface AuditLog {
  id: number
  admin_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
  created_at: string
  admin?: {
    email: string
    user_type?: {
      type_name: string
    }
  }
}

export interface SystemSettings {
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
}

// ========== INDUSTRY TYPES ==========
export interface Industry {
  id: number
  industry_name: string
  _count?: {
    jobs: number
    employers: number
  }
}

// ========== EMPLOYMENT TYPE TYPES ==========
export interface EmploymentType {
  id: number
  type_name: string
}

// ========== FILE UPLOAD TYPES ==========
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mime_type: string
  public_id?: string
}

export interface MultipleUploadResponse {
  files: UploadResponse[]
  total: number
  successful: number
  failed: number
}

// ========== DASHBOARD TYPES ==========
export interface DashboardStats {
  users: {
    total: number
    employers: number
    jobSeekers: number
    admins: number
  }
  jobs: {
    total: number
    open: number
    closed: number
    draft: number
    archived: number
  }
  applications: {
    total: number
    pending: number
    reviewed: number
    shortlisted: number
    interview: number
    accepted: number
    rejected: number
  }
  analytics: {
    totalViews: number
    averageApplicationsPerJob: number
    jobsLast30Days: number
    usersLast30Days: number
  }
}

// ========== REPORT TYPES ==========
export interface ReportFilters {
  type: 'users' | 'jobs' | 'applications' | 'analytics'
  format: 'pdf' | 'csv' | 'excel'
  dateRange: {
    from: Date
    to: Date
  }
  includeCharts?: boolean
  includeTables?: boolean
}

// ========== SEARCH TYPES ==========
export interface SearchFilters {
  keyword: string
  location: string
  jobType: string
  experienceLevel: string
  salaryMin: number
  salaryMax: number
  remoteOnly: boolean
  datePosted: string
  industry: string[]
  page: number
  limit: number
  sort: string
}

// ========== HELPER TYPES ==========
export type StatusType = 'Pending' | 'Reviewed' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected'
export type JobStatusType = 'Open' | 'Closed' | 'Draft' | 'Archived'
export type UserType = 'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'
export type EmploymentTypeName = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid' | 'Internship'