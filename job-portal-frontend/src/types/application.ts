/* eslint-disable @typescript-eslint/no-explicit-any */
import { Job } from './index'

// ========== APPLICATION STATUS ==========
export type ApplicationStatus = 
  | 'Pending' 
  | 'Reviewed' 
  | 'Shortlisted' 
  | 'Interview' 
  | 'Accepted' 
  | 'Rejected'

export interface ApplicationStatusInfo {
  id: number
  status_name: ApplicationStatus
  description?: string
  color: string
  icon: string
  order: number
}

// ========== APPLICATION NOTE ==========
export interface ApplicationNote {
  id: number
  application_id: string
  employer_id: string
  note_text: string
  created_at: string
  updated_at?: string
  employer?: {
    id: string
    company_name: string
    user: {
      id: string
      email: string
    }
  }
}

export interface CreateApplicationNoteRequest {
  note_text: string
}

// ========== APPLICATION ==========
export interface Application {
  id: string
  job_id: string
  seeker_id: string
  cover_letter: string
  resume_url: string | null
  status_id: number
  employer_notes: string | null
  applied_at: string
  updated_at: string
  
  // Relations
  job?: Job
  seeker?: {
    id: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
    skills: string[]
    experience: string | null
    education: string | null
    resume_url: string | null
  }
  status?: ApplicationStatusInfo
  notes?: ApplicationNote[]
}

// ========== APPLICATION REQUEST TYPES ==========
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
  status: ApplicationStatus
  feedback?: string
}

export interface BulkUpdateApplicationStatusRequest {
  application_ids: string[]
  status: ApplicationStatus
}

// ========== APPLICATION FILTERS ==========
export interface ApplicationFilters {
  status?: ApplicationStatus | 'all'
  job_id?: string
  seeker_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'status'
}

// ========== APPLICATION RESPONSE TYPES ==========
export interface ApplicationResponse {
  data: Application[]
  statistics?: ApplicationStatistics
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SingleApplicationResponse {
  data: Application
}

// ========== APPLICATION STATISTICS ==========
export interface ApplicationStatistics {
  total: number
  byStatus: {
    status: ApplicationStatus
    count: number
    percentage: number
  }[]
  byMonth: {
    month: string
    count: number
    year: number
  }[]
  averageResponseTime: number
  applicationRate: number
  interviewRate: number
  offerRate: number
}

// ========== APPLICATION TIMELINE ==========
export interface ApplicationTimelineEvent {
  id: string
  application_id: string
  event_type: 'submitted' | 'status_change' | 'note_added' | 'interview_scheduled'
  title: string
  description: string
  created_at: string
  metadata?: Record<string, any>
}

export interface ApplicationTimeline {
  application_id: string
  events: ApplicationTimelineEvent[]
}

// ========== INTERVIEW SCHEDULING ==========
export interface InterviewSchedule {
  id: string
  application_id: string
  scheduled_date: string
  scheduled_time: string
  duration: number // minutes
  type: 'video' | 'phone' | 'in-person'
  location?: string
  meeting_link?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  created_at: string
  updated_at: string
}

export interface ScheduleInterviewRequest {
  application_id: string
  scheduled_date: string
  scheduled_time: string
  duration?: number
  type: 'video' | 'phone' | 'in-person'
  location?: string
  meeting_link?: string
  notes?: string
}

// ========== APPLICATION EXPORT ==========
export interface ApplicationExportOptions {
  format: 'csv' | 'pdf' | 'excel'
  include_fields?: string[]
  date_range?: {
    from: string
    to: string
  }
  status_filter?: ApplicationStatus[]
  job_ids?: string[]
}

export interface ApplicationExportData {
  id: string
  job_title: string
  company_name: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  applicant_location: string | null
  skills: string[]
  status: string
  applied_at: string
  updated_at: string
  cover_letter: string
  resume_url: string | null
}

// ========== HELPER TYPES ==========
export interface ApplicationStatusCount {
  status: ApplicationStatus
  count: number
  color: string
  label: string
}

export interface ApplicationActivity {
  date: string
  applications: number
  interviews: number
  offers: number
  rejections: number
}

// ========== CONSTANTS ==========
export const APPLICATION_STATUSES: Record<ApplicationStatus, ApplicationStatusInfo> = {
  Pending: {
    id: 1,
    status_name: 'Pending',
    description: 'Application awaiting review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Clock',
    order: 1
  },
  Reviewed: {
    id: 2,
    status_name: 'Reviewed',
    description: 'Application has been reviewed',
    color: 'bg-blue-100 text-blue-800',
    icon: 'Eye',
    order: 2
  },
  Shortlisted: {
    id: 3,
    status_name: 'Shortlisted',
    description: 'Candidate has been shortlisted',
    color: 'bg-green-100 text-green-800',
    icon: 'Users',
    order: 3
  },
  Interview: {
    id: 4,
    status_name: 'Interview',
    description: 'Interview scheduled',
    color: 'bg-purple-100 text-purple-800',
    icon: 'Calendar',
    order: 4
  },
  Accepted: {
    id: 5,
    status_name: 'Accepted',
    description: 'Application accepted',
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle',
    order: 5
  },
  Rejected: {
    id: 6,
    status_name: 'Rejected',
    description: 'Application rejected',
    color: 'bg-red-100 text-red-800',
    icon: 'XCircle',
    order: 6
  }
}

// ========== HELPER FUNCTIONS ==========
export const getStatusInfo = (status: ApplicationStatus): ApplicationStatusInfo => {
  return APPLICATION_STATUSES[status]
}

export const getStatusColor = (status: ApplicationStatus): string => {
  return APPLICATION_STATUSES[status]?.color || 'bg-gray-100 text-gray-800'
}

export const getStatusIcon = (status: ApplicationStatus): string => {
  return APPLICATION_STATUSES[status]?.icon || 'FileText'
}

export const getStatusLabel = (status: ApplicationStatus): string => {
  return APPLICATION_STATUSES[status]?.status_name || status
}

export const isFinalStatus = (status: ApplicationStatus): boolean => {
  return status === 'Accepted' || status === 'Rejected'
}

export const isActiveStatus = (status: ApplicationStatus): boolean => {
  return !isFinalStatus(status)
}

export const getNextStatuses = (currentStatus: ApplicationStatus): ApplicationStatus[] => {
  const order = {
    Pending: ['Reviewed', 'Rejected'],
    Reviewed: ['Shortlisted', 'Rejected'],
    Shortlisted: ['Interview', 'Rejected'],
    Interview: ['Accepted', 'Rejected'],
    Accepted: [],
    Rejected: []
  }
  return (order[currentStatus] as ApplicationStatus[]) || []
}

export const canUpdateStatus = (currentStatus: ApplicationStatus, newStatus: ApplicationStatus): boolean => {
  if (isFinalStatus(currentStatus)) return false
  const nextStatuses = getNextStatuses(currentStatus)
  return nextStatuses.includes(newStatus)
}