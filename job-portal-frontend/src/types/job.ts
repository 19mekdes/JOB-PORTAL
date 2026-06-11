import { EmployerProfile, JobIndustry, EmploymentType, JobPostStatus } from './index'

// ========== JOB TYPES ==========
export interface Job {
  is_hybrid: boolean
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
  employer_id: string
  industry_id: number
  employment_type_id: number
  status_id: number
  
  // Relations
  employer?: EmployerProfile
  industry?: JobIndustry
  employment_type?: EmploymentType
  status?: JobPostStatus
  
  // Computed fields
  has_applied?: boolean
  is_saved?: boolean
  match_score?: number
}

// ========== JOB STATUS ==========
export type JobStatusType = 'Open' | 'Closed' | 'Draft' | 'Archived'

export interface JobStatusInfo {
  id: number
  status_name: JobStatusType
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  description: string
}

// ========== JOB FILTERS ==========
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

// ========== JOB SORT OPTIONS ==========
export interface JobSortOption {
  value: string
  label: string
  icon: string
}

export const JOB_SORT_OPTIONS: JobSortOption[] = [
  { value: 'recent', label: 'Most Recent', icon: 'Clock' },
  { value: 'oldest', label: 'Oldest First', icon: 'Calendar' },
  { value: 'salary_high', label: 'Highest Salary', icon: 'TrendingUp' },
  { value: 'salary_low', label: 'Lowest Salary', icon: 'TrendingDown' },
  { value: 'relevance', label: 'Most Relevant', icon: 'Star' }
]

// ========== DATE POSTED OPTIONS ==========
export interface DatePostedOption {
  value: string
  label: string
  days: number | null
}

export const DATE_POSTED_OPTIONS: DatePostedOption[] = [
  { value: 'all', label: 'Any time', days: null },
  { value: 'today', label: 'Today', days: 1 },
  { value: 'week', label: 'Last 7 days', days: 7 },
  { value: 'month', label: 'Last 30 days', days: 30 },
  { value: 'quarter', label: 'Last 90 days', days: 90 }
]

// ========== EXPERIENCE LEVEL OPTIONS ==========
export interface ExperienceLevelOption {
  value: string
  label: string
  yearsMin: number | null
  yearsMax: number | null
}

export const EXPERIENCE_LEVEL_OPTIONS: ExperienceLevelOption[] = [
  { value: 'all', label: 'Any Experience', yearsMin: null, yearsMax: null },
  { value: 'entry', label: 'Entry Level (0-2 years)', yearsMin: 0, yearsMax: 2 },
  { value: 'mid', label: 'Mid Level (3-5 years)', yearsMin: 3, yearsMax: 5 },
  { value: 'senior', label: 'Senior Level (6-9 years)', yearsMin: 6, yearsMax: 9 },
  { value: 'lead', label: 'Lead (10+ years)', yearsMin: 10, yearsMax: null },
  { value: 'executive', label: 'Executive', yearsMin: 15, yearsMax: null }
]

// ========== JOB REQUEST TYPES ==========
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
  status?: JobStatusType
}

export interface BulkJobActionRequest {
  job_ids: string[]
  action: 'delete' | 'archive' | 'close' | 'open'
}

// ========== JOB RESPONSE TYPES ==========
export interface JobResponse {
  data: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters?: JobFilters
}

export interface SingleJobResponse {
  data: Job
  related_jobs?: Job[]
}

// ========== JOB STATISTICS ==========
export interface JobStatistics {
  total: number
  byStatus: {
    status: JobStatusType
    count: number
    total_views: number
    total_applications: number
  }[]
  byIndustry: {
    industry: string
    count: number
  }[]
  byEmploymentType: {
    type: string
    count: number
  }[]
  byLocation: {
    location: string
    count: number
  }[]
  recentActivity: {
    date: string
    count: number
  }[]
}

export interface EmployerJobStats {
  total_jobs: number
  total_views: number
  total_applications: number
  breakdown: {
    status: JobStatusType
    count: number
    total_views: number
    total_applications: number
  }[]
}

// ========== JOB MATCHING ==========
export interface JobMatch {
  job: Job
  match_score: number
  match_reasons: string[]
  missing_skills: string[]
  matching_skills: string[]
}

export interface JobRecommendationRequest {
  limit?: number
  include_applied?: boolean
  min_match_score?: number
}

// ========== JOB ALERTS ==========
export interface JobAlert {
  id: string
  user_id: string
  name: string
  filters: JobFilters
  frequency: 'daily' | 'weekly'
  is_active: boolean
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateJobAlertRequest {
  name: string
  filters: JobFilters
  frequency: 'daily' | 'weekly'
}

export interface UpdateJobAlertRequest extends Partial<CreateJobAlertRequest> {
  is_active?: boolean
}

// ========== JOB SAVED SEARCH ==========
export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: JobFilters
  created_at: string
  updated_at: string
}

export interface CreateSavedSearchRequest {
  name: string
  filters: JobFilters
}

// ========== HELPER FUNCTIONS ==========
export const getJobStatusInfo = (status: JobStatusType): JobStatusInfo => {
  const statusMap: Record<JobStatusType, JobStatusInfo> = {
    Open: {
      id: 1,
      status_name: 'Open',
      label: 'Open',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      icon: 'CheckCircle',
      description: 'Job is active and accepting applications'
    },
    Closed: {
      id: 2,
      status_name: 'Closed',
      label: 'Closed',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      icon: 'XCircle',
      description: 'Job is no longer accepting applications'
    },
    Draft: {
      id: 3,
      status_name: 'Draft',
      label: 'Draft',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      icon: 'Edit',
      description: 'Job is in draft mode, not visible to applicants'
    },
    Archived: {
      id: 4,
      status_name: 'Archived',
      label: 'Archived',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      icon: 'Archive',
      description: 'Job has been archived'
    }
  }
  return statusMap[status]
}

export const formatSalary = (min: number | null, max: number | null): string => {
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }
  if (min) {
    return `From $${min.toLocaleString()}`
  }
  if (max) {
    return `Up to $${max.toLocaleString()}`
  }
  return 'Not specified'
}

export const getRelativeTime = (date: string): string => {
  const now = new Date()
  const jobDate = new Date(date)
  const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export const isJobOpen = (job: Job): boolean => {
  return job.status?.status_name === 'Open'
}

export const canApplyForJob = (job: Job, userId?: string): boolean => {
  if (!userId) return false
  if (!isJobOpen(job)) return false
  if (job.has_applied) return false
  return true
}

export const calculateMatchScore = (job: Job, userSkills: string[]): number => {
  if (!job.requirements) return 0
  
  const jobRequirements = job.requirements.toLowerCase()
  let matchCount = 0
  
  userSkills.forEach(skill => {
    if (jobRequirements.includes(skill.toLowerCase())) {
      matchCount++
    }
  })
  
  return Math.round((matchCount / userSkills.length) * 100)
}

export const getExperienceLevelFromYears = (years: number): string => {
  if (years <= 2) return 'entry'
  if (years <= 5) return 'mid'
  if (years <= 9) return 'senior'
  if (years <= 14) return 'lead'
  return 'executive'
}