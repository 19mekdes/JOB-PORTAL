import api from './api'

// ========== TYPES ==========
export interface UserFilters {
  search?: string
  user_type?: string
  is_active?: string
  page?: number
  limit?: number
}

export interface JobFilters {
  search?: string
  status?: string
  employer?: string
  page?: number
  limit?: number
}

export interface User {
  id: string
  email: string
  user_type: {
    id: number
    type_name: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
  seeker_profile?: {
    id: string
    full_name: string
    phone: string | null
    location: string | null
    skills: string[]
  }
  employer_profile?: {
    id: string
    company_name: string
    company_description: string | null
    website: string | null
    logo_url: string | null
    location: string | null
    company_size: string | null
    industry: {
      industry_name: string
    }
  }
}

export interface Job {
  id: string
  title: string
  description: string
  location: string
  salary_range: string | null
  created_at: string
  views_count: number
  applications_count: number
  is_remote: boolean
  employer: {
    id: string
    company_name: string
    user: {
      email: string
    }
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
}

export interface Industry {
  id: number
  industry_name: string
  _count?: {
    jobs: number
    employers: number
  }
}

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
  }
  applications: {
    total: number
  }
  recent: {
    users: User[]
    jobs: Job[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applications: any[]
  }
}

// ========== DASHBOARD ==========
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/stats')
  return response.data.data
}

// ========== USER MANAGEMENT ==========
export const getUsers = async (filters: UserFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.user_type && filters.user_type !== 'all') params.append('user_type', filters.user_type)
  if (filters.is_active && filters.is_active !== 'all') params.append('is_active', filters.is_active)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await api.get(`/admin/users${params.toString() ? `?${params}` : ''}`)
  return response.data
}

export const getUserById = async (userId: string): Promise<User> => {
  const response = await api.get(`/admin/users/${userId}`)
  return response.data.data
}

export const suspendUser = async (userId: string): Promise<User> => {
  const response = await api.put(`/admin/users/${userId}/suspend`)
  return response.data.data
}

export const activateUser = async (userId: string): Promise<User> => {
  const response = await api.put(`/admin/users/${userId}/activate`)
  return response.data.data
}

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/admin/users/${userId}`)
}

// ========== JOB MANAGEMENT ==========
export const getJobsForAdmin = async (filters: JobFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.employer) params.append('employer', filters.employer)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await api.get(`/admin/jobs${params.toString() ? `?${params}` : ''}`)
  return response.data
}

export const getJobByIdForAdmin = async (jobId: string): Promise<Job> => {
  const response = await api.get(`/admin/jobs/${jobId}`)
  return response.data.data
}

export const moderateJob = async (jobId: string, status: string, moderationNote?: string): Promise<Job> => {
  const response = await api.put(`/admin/jobs/${jobId}/moderate`, { 
    status, 
    moderation_note: moderationNote 
  })
  return response.data.data
}

export const deleteJobAsAdmin = async (jobId: string): Promise<void> => {
  await api.delete(`/admin/jobs/${jobId}`)
}

// ========== APPLICATION MANAGEMENT ==========
export const getAllApplications = async (filters: {
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

export const getApplicationByIdForAdmin = async (applicationId: string) => {
  const response = await api.get(`/admin/applications/${applicationId}`)
  return response.data.data
}

// ========== INDUSTRY MANAGEMENT ==========
export const getIndustries = async (): Promise<Industry[]> => {
  const response = await api.get('/admin/industries')
  return response.data.data
}

export const createIndustry = async (industryName: string): Promise<Industry> => {
  const response = await api.post('/admin/industries', { industry_name: industryName })
  return response.data.data
}

export const updateIndustry = async (id: number, industryName: string): Promise<Industry> => {
  const response = await api.put(`/admin/industries/${id}`, { industry_name: industryName })
  return response.data.data
}

export const deleteIndustry = async (id: number): Promise<void> => {
  await api.delete(`/admin/industries/${id}`)
}

// ========== REPORTING ==========
export const generateReport = async (filters: {
  type: 'users' | 'jobs' | 'applications' | 'analytics'
  format: 'pdf' | 'csv' | 'excel'
  dateRange: {
    from: Date
    to: Date
  }
  includeCharts?: boolean
  includeTables?: boolean
}) => {
  const response = await api.post('/admin/reports/generate', filters, {
    responseType: 'blob'
  })
  return response.data
}

export const exportUsers = async (format: 'json' | 'csv' = 'json') => {
  const response = await api.get(`/admin/export/users?format=${format}`, {
    responseType: format === 'csv' ? 'blob' : 'json'
  })
  return response.data
}

export const exportJobs = async (format: 'json' | 'csv' = 'json') => {
  const response = await api.get(`/admin/export/jobs?format=${format}`, {
    responseType: format === 'csv' ? 'blob' : 'json'
  })
  return response.data
}

// ========== SYSTEM SETTINGS ==========
export const getSystemSettings = async () => {
  const response = await api.get('/admin/settings')
  return response.data.data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateSystemSettings = async (settings: any) => {
  const response = await api.put('/admin/settings', settings)
  return response.data.data
}

export const toggleMaintenanceMode = async (enabled: boolean) => {
  const response = await api.post('/admin/settings/maintenance', { enabled })
  return response.data.data
}

// ========== SYSTEM HEALTH ==========
export const getSystemHealth = async () => {
  const response = await api.get('/admin/health')
  return response.data.data
}

// ========== AUDIT LOGS ==========
export const getAuditLogs = async (filters: {
  admin_id?: string
  action?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) => {
  const params = new URLSearchParams()
  if (filters.admin_id) params.append('admin_id', filters.admin_id)
  if (filters.action) params.append('action', filters.action)
  if (filters.start_date) params.append('start_date', filters.start_date)
  if (filters.end_date) params.append('end_date', filters.end_date)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await api.get(`/admin/audit-logs${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// ========== BACKUP & RESTORE ==========
export const getBackups = async () => {
  const response = await api.get('/admin/backups')
  return response.data.data
}

export const createBackup = async () => {
  const response = await api.post('/admin/backups/create')
  return response.data.data
}

export const downloadBackup = async (backupId: string) => {
  const response = await api.get(`/admin/backups/${backupId}/download`, {
    responseType: 'blob'
  })
  return response.data
}

export const restoreBackup = async (backupId: string) => {
  const response = await api.post(`/admin/backups/${backupId}/restore`)
  return response.data
}

export const deleteBackup = async (backupId: string) => {
  await api.delete(`/admin/backups/${backupId}`)
}

export const updateBackupSettings = async (settings: {
  auto_backup_enabled: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_time: string
  retention_days: number
  include_files: boolean
  include_database: boolean
  backup_destination: 'local' | 'cloud' | 'both'
}) => {
  const response = await api.put('/admin/backup-settings', settings)
  return response.data.data
}

// ========== DATA CLEANUP ==========
export const cleanupOldData = async (days: number = 90) => {
  const response = await api.post(`/admin/cleanup?days=${days}`)
  return response.data.data
}

// ========== SYSTEM STATISTICS ==========
export const getSystemStats = async () => {
  const response = await api.get('/admin/stats/system')
  return response.data.data
}

const adminService = {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getUsers,
  getUserById,
  suspendUser,
  activateUser,
  deleteUser,
  
  // Job Management
  getJobsForAdmin,
  getJobByIdForAdmin,
  moderateJob,
  deleteJobAsAdmin,
  
  // Application Management
  getAllApplications,
  getApplicationByIdForAdmin,
  
  // Industry Management
  getIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  
  // Reporting
  generateReport,
  exportUsers,
  exportJobs,
  
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  toggleMaintenanceMode,
  
  // System Health
  getSystemHealth,
  
  // Audit Logs
  getAuditLogs,
  
  // Backup & Restore
  getBackups,
  createBackup,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  updateBackupSettings,
  
  // Data Cleanup
  cleanupOldData,
  
  // System Statistics
  getSystemStats
}

export default adminService