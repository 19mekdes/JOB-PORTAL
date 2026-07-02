/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './api'
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

export interface JobResponse {
  data: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface JobStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
    total_views: number
    total_applications: number
  }>
  byIndustry: Array<{
    industry: string
    count: number
  }>
  byEmploymentType: Array<{
    type: string
    count: number
  }>
  byLocation: Array<{
    location: string
    count: number
  }>
}

export interface CreateJobData {
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

export interface UpdateJobData extends Partial<CreateJobData> {
  status?: 'Open' | 'Closed' | 'Draft' | 'Archived'
}

// ========== JOB SEEKER SERVICES ==========

// Get all jobs with filters
export const getJobs = async (filters: JobFilters = {}): Promise<JobResponse> => {
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.location) params.append('location', filters.location)
  if (filters.industry) params.append('industry', filters.industry.toString())
  if (filters.employment_type) params.append('employment_type', filters.employment_type.toString())
  if (filters.min_salary) params.append('min_salary', filters.min_salary.toString())
  if (filters.max_salary) params.append('max_salary', filters.max_salary.toString())
  if (filters.is_remote !== undefined) params.append('is_remote', filters.is_remote.toString())
  if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString())
  if (filters.date_posted) params.append('date_posted', filters.date_posted)
  if (filters.experience_level) params.append('experience_level', filters.experience_level)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sort) params.append('sort', filters.sort)
  
  const response = await api.get(`/jobs${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Get job by ID
export const getJobById = async (id: string): Promise<Job> => {
  const response = await api.get(`/jobs/${id}`)
  return response.data.data
}

// Search jobs
export const searchJobs = async (query: string, page: number = 1, limit: number = 10): Promise<JobResponse> => {
  const response = await api.get(`/jobs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
  return response.data
}

// Get jobs by industry
export const getJobsByIndustry = async (industryId: number, page: number = 1, limit: number = 10): Promise<JobResponse> => {
  const response = await api.get(`/jobs/industry/${industryId}?page=${page}&limit=${limit}`)
  return response.data
}

// Get jobs by location
export const getJobsByLocation = async (city: string, page: number = 1, limit: number = 10): Promise<JobResponse> => {
  const response = await api.get(`/jobs/location/${encodeURIComponent(city)}?page=${page}&limit=${limit}`)
  return response.data
}

// Get recommended jobs for job seeker
export const getRecommendedJobs = async (limit: number = 10): Promise<Job[]> => {
  const response = await api.get(`/jobs/recommended?limit=${limit}`)
  return response.data.data
}

// Get job filters options (industries, employment types, locations)
export const getJobFilters = async (): Promise<{
  industries: Array<{ id: number; industry_name: string }>
  employment_types: Array<{ id: number; type_name: string }>
  locations: string[]
  salary_range: { min: number; max: number }
}> => {
  const response = await api.get('/jobs/filters/options')
  return response.data.data
}

// ========== EMPLOYER SERVICES ==========

// Create a new job posting
export const createJob = async (jobData: CreateJobData): Promise<Job> => {
  const response = await api.post('/jobs', jobData)
  return response.data.data
}

// Update an existing job
export const updateJob = async (id: string, jobData: UpdateJobData): Promise<Job> => {
  const response = await api.put(`/jobs/${id}`, jobData)
  return response.data.data
}

// Delete a job posting
export const deleteJob = async (id: string): Promise<void> => {
  await api.delete(`/jobs/${id}`)
}

// Get employer's jobs
export const getEmployerJobs = async (status?: string, page: number = 1, limit: number = 10): Promise<JobResponse> => {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  
  const response = await api.get(`/jobs/employer/my-jobs${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Get job statistics for employer
export const getJobStats = async (): Promise<JobStats> => {
  const response = await api.get('/jobs/employer/stats')
  return response.data.data
}

// Get applications for a specific job (employer view)
export const getJobApplications = async (jobId: string, status?: string, page: number = 1, limit: number = 10): Promise<any> => {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  
  const response = await api.get(`/jobs/${jobId}/applications${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Toggle job status (Open/Close)
export const toggleJobStatus = async (id: string): Promise<Job> => {
  const response = await api.patch(`/jobs/${id}/toggle-status`)
  return response.data.data
}

// Archive a job
export const archiveJob = async (id: string): Promise<Job> => {
  const response = await api.patch(`/jobs/${id}/archive`)
  return response.data.data
}

// Duplicate a job posting
export const duplicateJob = async (id: string): Promise<Job> => {
  const response = await api.post(`/jobs/${id}/duplicate`)
  return response.data.data
}

// ========== ADMIN SERVICES ==========

// Get all jobs for admin (with filters)
export const getAllJobsForAdmin = async (filters: {
  search?: string
  status?: string
  employer?: string
  page?: number
  limit?: number
}): Promise<JobResponse> => {
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.status) params.append('status', filters.status)
  if (filters.employer) params.append('employer', filters.employer)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await api.get(`/admin/jobs${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Moderate job (change status)
export const moderateJob = async (jobId: string, status: string, moderationNote?: string): Promise<Job> => {
  const response = await api.put(`/admin/jobs/${jobId}/moderate`, { status, moderation_note: moderationNote })
  return response.data.data
}

// ========== HELPER FUNCTIONS ==========

// Get salary range display string
export const formatSalaryRange = (min: number | null, max: number | null): string => {
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

// Get relative time (e.g., "2 days ago")
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

// Filter jobs by salary range
export const filterJobsBySalary = (jobs: Job[], minSalary: number, maxSalary: number): Job[] => {
  return jobs.filter(job => {
    const jobMin = job.salary_min || 0
    const jobMax = job.salary_max || Infinity
    return jobMax >= minSalary && jobMin <= maxSalary
  })
}

// Filter jobs by job types
export const filterJobsByTypes = (jobs: Job[], types: string[]): Job[] => {
  if (types.length === 0) return jobs
  return jobs.filter(job => types.includes(job.employment_type.type_name))
}

// Filter jobs by industries
export const filterJobsByIndustries = (jobs: Job[], industries: string[]): Job[] => {
  if (industries.length === 0) return jobs
  return jobs.filter(job => industries.includes(job.industry.industry_name))
}

// Sort jobs
export const sortJobs = (jobs: Job[], sortBy: string): Job[] => {
  const sorted = [...jobs]
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    case 'salary_high':
      return sorted.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0))
    case 'salary_low':
      return sorted.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0))
    default:
      return sorted
  }
}

// Get unique locations from jobs
export const getUniqueLocations = (jobs: Job[]): string[] => {
  const locations = new Set(jobs.map(job => job.location))
  return Array.from(locations).sort()
}

// Get unique industries from jobs
export const getUniqueIndustries = (jobs: Job[]): string[] => {
  const industries = new Set(jobs.map(job => job.industry.industry_name))
  return Array.from(industries).sort()
}

// Get unique job types from jobs
export const getUniqueJobTypes = (jobs: Job[]): string[] => {
  const types = new Set(jobs.map(job => job.employment_type.type_name))
  return Array.from(types).sort()
}

const jobService = {
  // Job Seeker
  getJobs,
  getJobById,
  searchJobs,
  getJobsByIndustry,
  getJobsByLocation,
  getRecommendedJobs,
  getJobFilters,
  
  // Employer
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
  getJobStats,
  getJobApplications,
  toggleJobStatus,
  archiveJob,
  duplicateJob,
  
  // Admin
  getAllJobsForAdmin,
  moderateJob,
  
  // Helpers
  formatSalaryRange,
  getRelativeTime,
  filterJobsBySalary,
  filterJobsByTypes,
  filterJobsByIndustries,
  sortJobs,
  getUniqueLocations,
  getUniqueIndustries,
  getUniqueJobTypes
}

export default jobService