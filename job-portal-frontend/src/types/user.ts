import { JobPost, JobApplication, Notification, SearchLog, JobIndustry, JobApplicationNote, JobBookmark } from './index'
import { USER_ROLES } from './auth'

// ========== USER TYPES ==========
export type UserRole = 'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'

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
  notifications?: Notification[]
  search_logs?: SearchLog[]
  notification_preference?: NotificationPreference
}

export interface UserType {
  id: number
  type_name: UserRole
  users?: User[]
  created_at: string
}

// ========== PROFILE TYPES ==========
export interface JobSeekerProfile {
  id: string
  full_name: string
  phone: string | null
  resume_url: string | null
  skills: string[]
  experience: string | null
  education: string | null
  location: string | null
  title?: string | null
  bio?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  availability?: string | null
  user_id: string
  user?: User
  applications?: JobApplication[]
  bookmarks?: JobBookmark[]
  created_at?: string
  updated_at?: string
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
  phone?: string | null
  founded_year?: number | null
  headquarters?: string | null
  social_links?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
  }
  user_id: string
  user?: User
  industry?: JobIndustry
  jobs?: JobPost[]
  notes?: JobApplicationNote[]
  created_at?: string
  updated_at?: string
}

// ========== USER PREFERENCES ==========
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
  interview_reminders?: boolean
  message_notifications?: boolean
  job_recommendations?: boolean
  created_at: string
  updated_at: string
  user?: User
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  date_format: string
  items_per_page: number
  email_notifications: boolean
  push_notifications: boolean
}

// ========== USER STATISTICS ==========
export interface UserStatistics {
  total_applications: number
  total_saved_jobs: number
  total_profile_views: number
  application_success_rate: number
  average_response_time: number
  monthly_activity: {
    month: string
    applications: number
    interviews: number
    offers: number
  }[]
}

export interface EmployerStatistics {
  total_jobs: number
  active_jobs: number
  total_applications: number
  total_views: number
  average_applications_per_job: number
  interview_rate: number
  hire_rate: number
  top_industries: {
    industry: string
    count: number
  }[]
  recent_activity: {
    date: string
    applications: number
    views: number
  }[]
}

// ========== USER ACTIVITY ==========
export interface UserActivity {
  id: string
  user_id: string
  action: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any
  ip_address: string
  user_agent: string
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
  last_activity: string
  ip_address: string
  user_agent: string
  is_active: boolean
}

// ========== USER SETTINGS ==========
export interface UserSettings {
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  job_alerts_enabled: boolean
  resume_public: boolean
  profile_visibility: 'public' | 'private' | 'employers_only'
  two_factor_enabled: boolean
  language: string
  timezone: string
}

export interface UpdateUserSettingsRequest {
  email_notifications?: boolean
  push_notifications?: boolean
  job_alerts_enabled?: boolean
  resume_public?: boolean
  profile_visibility?: 'public' | 'private' | 'employers_only'
  language?: string
  timezone?: string
}

// ========== USER SEARCH ==========
export interface UserSearchFilters {
  search?: string
  user_type?: UserRole
  is_active?: boolean
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'name' | 'email'
}

export interface UserSearchResponse {
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: UserSearchFilters
}

// ========== HELPER TYPES ==========
export interface UserProfileCompletion {
  percentage: number
  completed_fields: string[]
  missing_fields: string[]
  sections: {
    section: string
    completed: number
    total: number
    percentage: number
  }[]
}

export interface UserActivitySummary {
  last_active: string
  total_logins: number
  devices: {
    device: string
    browser: string
    os: string
    last_used: string
  }[]
}

// ========== CONSTANTS ==========

export const PROFILE_VISIBILITY_OPTIONS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  EMPLOYERS_ONLY: 'employers_only'
} as const

export type ProfileVisibility = typeof PROFILE_VISIBILITY_OPTIONS[keyof typeof PROFILE_VISIBILITY_OPTIONS]

// ========== HELPER FUNCTIONS ==========
export const getUserDisplayName = (user: User): string => {
  if (user.seeker_profile?.full_name) {
    return user.seeker_profile.full_name
  }
  if (user.employer_profile?.company_name) {
    return user.employer_profile.company_name
  }
  return user.email.split('@')[0]
}

export const getUserAvatar = (user: User): string | null => {
  if (user.employer_profile?.logo_url) {
    return user.employer_profile.logo_url
  }
  return null
}

export const getUserInitials = (user: User): string => {
  const name = getUserDisplayName(user)
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const isProfileComplete = (profile: JobSeekerProfile): boolean => {
  return !!(
    profile.full_name &&
    profile.skills &&
    profile.skills.length > 0 &&
    profile.resume_url
  )
}

export const getProfileCompletion = (profile: JobSeekerProfile): UserProfileCompletion => {
  const fields = {
    full_name: !!profile.full_name,
    phone: !!profile.phone,
    location: !!profile.location,
    skills: profile.skills && profile.skills.length > 0,
    resume_url: !!profile.resume_url,
    title: !!profile.title,
    bio: !!profile.bio,
    experience: !!profile.experience,
    education: !!profile.education
  }
  
  const completedFields = Object.keys(fields).filter(key => fields[key as keyof typeof fields])
  const missingFields = Object.keys(fields).filter(key => !fields[key as keyof typeof fields])
  const percentage = Math.round((completedFields.length / Object.keys(fields).length) * 100)
  
  const sections = [
    {
      section: 'Basic Information',
      completed: [fields.full_name, fields.title].filter(Boolean).length,
      total: 2,
      percentage: Math.round(([fields.full_name, fields.title].filter(Boolean).length / 2) * 100)
    },
    {
      section: 'Contact Details',
      completed: [fields.phone, fields.location].filter(Boolean).length,
      total: 2,
      percentage: Math.round(([fields.phone, fields.location].filter(Boolean).length / 2) * 100)
    },
    {
      section: 'Professional Details',
      completed: [fields.skills, fields.bio, fields.experience, fields.education].filter(Boolean).length,
      total: 4,
      percentage: Math.round(([fields.skills, fields.bio, fields.experience, fields.education].filter(Boolean).length / 4) * 100)
    },
    {
      section: 'Documents',
      completed: [fields.resume_url].filter(Boolean).length,
      total: 1,
      percentage: fields.resume_url ? 100 : 0
    }
  ]
  
  return {
    percentage,
    completed_fields: completedFields,
    missing_fields: missingFields,
    sections
  }
}

export const canUserApply = (user: User): boolean => {
  return user.user_type?.type_name === USER_ROLES.JOB_SEEKER && user.is_active
}

export const canUserPostJob = (user: User): boolean => {
  return user.user_type?.type_name === USER_ROLES.EMPLOYER && user.is_active
}

export const isUserAdmin = (user: User): boolean => {
  return user.user_type?.type_name === USER_ROLES.ADMIN || 
         user.user_type?.type_name === USER_ROLES.SUPER_ADMIN
}

export const isUserSuperAdmin = (user: User): boolean => {
  return user.user_type?.type_name === USER_ROLES.SUPER_ADMIN
}