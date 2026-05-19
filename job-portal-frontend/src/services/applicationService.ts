import api from './api'

// ========== TYPES ==========
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
  job: {
    id: string
    title: string
    description: string
    location: string
    salary_range: string | null
    created_at: string
    is_remote: boolean
    employer: {
      id: string
      company_name: string
      logo_url: string | null
      user: {
        email: string
      }
    }
    employment_type: {
      id: number
      type_name: string
    }
    industry: {
      id: number
      industry_name: string
    }
  }
  notes?: Array<{
    id: number
    note_text: string
    created_at: string
    employer: {
      company_name: string
      user: {
        email: string
      }
    }
  }>
}

export interface ApplicationStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  byMonth: Array<{
    month: string
    count: number
  }>
}

export interface ApplicationFilters {
  status?: string
  job_id?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest'
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

// ========== JOB SEEKER APPLICATION SERVICES ==========

// Get all applications for the current job seeker
export const getMyApplications = async (filters: ApplicationFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sort) params.append('sort', filters.sort)
  
  const response = await api.get(`/applications/my-applications${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Get a single application by ID (job seeker view)
export const getApplicationById = async (id: string): Promise<Application> => {
  const response = await api.get(`/applications/${id}`)
  return response.data.data
}

// Apply for a job
export const applyForJob = async (jobId: string, data: {
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
}) => {
  const response = await api.post('/applications', { job_id: jobId, ...data })
  return response.data.data
}

// Withdraw an application
export const withdrawApplication = async (id: string): Promise<void> => {
  await api.delete(`/applications/my-applications/${id}/withdraw`)
}

// Get application statistics for job seeker
export const getApplicationStats = async (): Promise<ApplicationStats> => {
  const response = await api.get('/applications/my-stats')
  return response.data.data
}

// Export applications to CSV
export const exportApplications = async (): Promise<Blob> => {
  const response = await api.get('/applications/export', {
    responseType: 'blob'
  })
  return response.data
}

// ========== EMPLOYER APPLICATION SERVICES ==========

// Get applications for a specific job (employer view)
export const getJobApplications = async (jobId: string, filters: ApplicationFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sort) params.append('sort', filters.sort)
  
  const response = await api.get(`/applications/job/${jobId}${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Get all applications for employer (across all jobs)
export const getAllEmployerApplications = async (filters: ApplicationFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sort) params.append('sort', filters.sort)
  
  const response = await api.get(`/applications/employer/all${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Update application status
export const updateApplicationStatus = async (id: string, status: string, feedback?: string): Promise<Application> => {
  const response = await api.put(`/applications/${id}/status`, { status, feedback })
  return response.data.data
}

// Add note to application
export const addApplicationNote = async (id: string, note: string): Promise<ApplicationNote> => {
  const response = await api.post(`/applications/${id}/notes`, { note_text: note })
  return response.data.data
}

// Get all notes for an application
export const getApplicationNotes = async (id: string): Promise<ApplicationNote[]> => {
  const response = await api.get(`/applications/${id}/notes`)
  return response.data.data
}

// Export job applications to CSV
export const exportJobApplications = async (jobId: string): Promise<Blob> => {
  const response = await api.get(`/applications/job/${jobId}/export`, {
    responseType: 'blob'
  })
  return response.data
}

// Bulk update application status
export const bulkUpdateApplicationStatus = async (ids: string[], status: string): Promise<{ updated_count: number }> => {
  const response = await api.put('/applications/bulk/status', { ids, status })
  return response.data.data
}

// ========== ADMIN APPLICATION SERVICES ==========

// Get all applications (admin view)
export const getAllApplicationsForAdmin = async (filters: {
  status?: string
  job_id?: string
  page?: number
  limit?: number
}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.job_id) params.append('job_id', filters.job_id)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await api.get(`/admin/applications${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Get application by ID (admin view)
export const getApplicationByIdForAdmin = async (id: string): Promise<Application> => {
  const response = await api.get(`/admin/applications/${id}`)
  return response.data.data
}

// ========== HELPER FUNCTIONS ==========

// Get status color for UI
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'Reviewed':
      return 'bg-blue-100 text-blue-800'
    case 'Shortlisted':
      return 'bg-green-100 text-green-800'
    case 'Interview':
      return 'bg-purple-100 text-purple-800'
    case 'Accepted':
      return 'bg-green-100 text-green-800'
    case 'Rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Get status badge variant for shadcn/ui
export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'Pending':
      return 'warning'
    case 'Reviewed':
      return 'secondary'
    case 'Shortlisted':
      return 'success'
    case 'Interview':
      return 'default'
    case 'Accepted':
      return 'success'
    case 'Rejected':
      return 'destructive'
    default:
      return 'secondary'
  }
}

// Get status icon name
export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'Clock'
    case 'Reviewed':
      return 'Eye'
    case 'Shortlisted':
      return 'Users'
    case 'Interview':
      return 'Calendar'
    case 'Accepted':
      return 'CheckCircle'
    case 'Rejected':
      return 'XCircle'
    default:
      return 'FileText'
  }
}

// Calculate application success rate
export const calculateSuccessRate = (applications: Application[]): number => {
  if (applications.length === 0) return 0
  const accepted = applications.filter(app => app.status.status_name === 'Accepted').length
  return Math.round((accepted / applications.length) * 100)
}

// Calculate average response time (in days)
export const calculateAverageResponseTime = (applications: Application[]): number => {
  const withResponseDate = applications.filter(app => 
    app.updated_at && app.applied_at && app.status.status_name !== 'Pending'
  )
  
  if (withResponseDate.length === 0) return 0
  
  const totalDays = withResponseDate.reduce((sum, app) => {
    const applied = new Date(app.applied_at)
    const updated = new Date(app.updated_at)
    const days = Math.ceil((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
    return sum + days
  }, 0)
  
  return Math.round(totalDays / withResponseDate.length)
}

// Filter applications by date range
export const filterApplicationsByDateRange = (
  applications: Application[],
  startDate: Date,
  endDate: Date
): Application[] => {
  return applications.filter(app => {
    const appliedDate = new Date(app.applied_at)
    return appliedDate >= startDate && appliedDate <= endDate
  })
}

// Group applications by month
export const groupApplicationsByMonth = (applications: Application[]): Record<string, Application[]> => {
  const grouped: Record<string, Application[]> = {}
  
  applications.forEach(app => {
    const date = new Date(app.applied_at)
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }
    grouped[monthKey].push(app)
  })
  
  return grouped
}

const applicationService = {
  // Job Seeker
  getMyApplications,
  getApplicationById,
  applyForJob,
  withdrawApplication,
  getApplicationStats,
  exportApplications,
  
  // Employer
  getJobApplications,
  getAllEmployerApplications,
  updateApplicationStatus,
  addApplicationNote,
  getApplicationNotes,
  exportJobApplications,
  bulkUpdateApplicationStatus,
  
  // Admin
  getAllApplicationsForAdmin,
  getApplicationByIdForAdmin,
  
  // Helpers
  getStatusColor,
  getStatusBadgeVariant,
  getStatusIcon,
  calculateSuccessRate,
  calculateAverageResponseTime,
  filterApplicationsByDateRange,
  groupApplicationsByMonth
}

export default applicationService