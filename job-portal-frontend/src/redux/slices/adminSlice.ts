import { createSlice, createAsyncThunk, } from '@reduxjs/toolkit'
import api from '../../services/api'

// ========== TYPES ==========
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
  _count?: {
    notifications: number
    search_logs: number
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

interface AdminState {
  users: User[]
  jobs: Job[]
  industries: Industry[]
  stats: DashboardStats | null
  selectedUser: User | null
  selectedJob: Job | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  filters: {
    search: string
    user_type: string
    is_active: string
    status: string
    employer: string
  }
}

// ========== INITIAL STATE ==========
const initialState: AdminState = {
  users: [],
  jobs: [],
  industries: [],
  stats: null,
  selectedUser: null,
  selectedJob: null,
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  filters: {
    search: '',
    user_type: 'all',
    is_active: 'all',
    status: 'all',
    employer: ''
  }
}

// ========== ASYNC THUNKS ==========

// Dashboard Stats
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async () => {
    const response = await api.get('/admin/stats')
    return response.data.data
  }
)

// User Management
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params: {
    search?: string
    user_type?: string
    is_active?: string
    page?: number
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.user_type && params.user_type !== 'all') queryParams.append('user_type', params.user_type)
    if (params.is_active && params.is_active !== 'all') queryParams.append('is_active', params.is_active)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const response = await api.get(`/admin/users${queryParams.toString() ? `?${queryParams}` : ''}`)
    return response.data
  }
)

export const getUserById = createAsyncThunk(
  'admin/getUserById',
  async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data.data
  }
)

export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async (userId: string) => {
    const response = await api.put(`/admin/users/${userId}/suspend`)
    return response.data.data
  }
)

export const activateUser = createAsyncThunk(
  'admin/activateUser',
  async (userId: string) => {
    const response = await api.put(`/admin/users/${userId}/activate`)
    return response.data.data
  }
)

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId: string) => {
    await api.delete(`/admin/users/${userId}`)
    return userId
  }
)

// Job Management
export const fetchJobsForAdmin = createAsyncThunk(
  'admin/fetchJobs',
  async (params: {
    search?: string
    status?: string
    employer?: string
    page?: number
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.employer) queryParams.append('employer', params.employer)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const response = await api.get(`/admin/jobs${queryParams.toString() ? `?${queryParams}` : ''}`)
    return response.data
  }
)

export const getJobByIdForAdmin = createAsyncThunk(
  'admin/getJobById',
  async (jobId: string) => {
    const response = await api.get(`/admin/jobs/${jobId}`)
    return response.data.data
  }
)

export const moderateJob = createAsyncThunk(
  'admin/moderateJob',
  async ({ jobId, status, moderation_note }: { jobId: string; status: string; moderation_note?: string }) => {
    const response = await api.put(`/admin/jobs/${jobId}/moderate`, { status, moderation_note })
    return response.data.data
  }
)

export const deleteJobAsAdmin = createAsyncThunk(
  'admin/deleteJob',
  async (jobId: string) => {
    await api.delete(`/admin/jobs/${jobId}`)
    return jobId
  }
)

// Industry Management
export const fetchIndustries = createAsyncThunk(
  'admin/fetchIndustries',
  async () => {
    const response = await api.get('/admin/industries')
    return response.data.data
  }
)

export const createIndustry = createAsyncThunk(
  'admin/createIndustry',
  async (industryName: string) => {
    const response = await api.post('/admin/industries', { industry_name: industryName })
    return response.data.data
  }
)

export const updateIndustry = createAsyncThunk(
  'admin/updateIndustry',
  async ({ id, industry_name }: { id: number; industry_name: string }) => {
    const response = await api.put(`/admin/industries/${id}`, { industry_name })
    return response.data.data
  }
)

export const deleteIndustry = createAsyncThunk(
  'admin/deleteIndustry',
  async (id: number) => {
    await api.delete(`/admin/industries/${id}`)
    return id
  }
)

// ========== SLICE ==========
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.currentPage = 1
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        user_type: 'all',
        is_active: 'all',
        status: 'all',
        employer: ''
      }
      state.currentPage = 1
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null
    },
    clearSelectedJob: (state) => {
      state.selectedJob = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateUserInList: (state, action) => {
      const index = state.users.findIndex(user => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload }
      }
    },
    removeUserFromList: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload)
    },
    updateJobInList: (state, action) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id)
      if (index !== -1) {
        state.jobs[index] = { ...state.jobs[index], ...action.payload }
      }
    },
    removeJobFromList: (state, action) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload)
    },
    updateIndustryInList: (state, action) => {
      const index = state.industries.findIndex(industry => industry.id === action.payload.id)
      if (index !== -1) {
        state.industries[index] = action.payload
      }
    },
    removeIndustryFromList: (state, action) => {
      state.industries = state.industries.filter(industry => industry.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch dashboard stats'
      })
      
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload.data
        state.totalPages = action.payload.pagination?.pages || 1
        state.currentPage = action.payload.pagination?.page || 1
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch users'
      })
      
      // Get User By ID
      .addCase(getUserById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedUser = action.payload
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch user details'
      })
      
      // Suspend User
      .addCase(suspendUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload
        }
      })
      
      // Activate User
      .addCase(activateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload
        }
      })
      
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload)
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null
        }
      })
      
      // Fetch Jobs
      .addCase(fetchJobsForAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchJobsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false
        state.jobs = action.payload.data
        state.totalPages = action.payload.pagination?.pages || 1
        state.currentPage = action.payload.pagination?.page || 1
      })
      .addCase(fetchJobsForAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch jobs'
      })
      
      // Get Job By ID
      .addCase(getJobByIdForAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getJobByIdForAdmin.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedJob = action.payload
      })
      .addCase(getJobByIdForAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch job details'
      })
      
      // Moderate Job
      .addCase(moderateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job.id === action.payload.id)
        if (index !== -1) {
          state.jobs[index] = action.payload
        }
        if (state.selectedJob?.id === action.payload.id) {
          state.selectedJob = action.payload
        }
      })
      
      // Delete Job
      .addCase(deleteJobAsAdmin.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(job => job.id !== action.payload)
        if (state.selectedJob?.id === action.payload) {
          state.selectedJob = null
        }
      })
      
      // Fetch Industries
      .addCase(fetchIndustries.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchIndustries.fulfilled, (state, action) => {
        state.isLoading = false
        state.industries = action.payload
      })
      .addCase(fetchIndustries.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch industries'
      })
      
      // Create Industry
      .addCase(createIndustry.fulfilled, (state, action) => {
        state.industries.push(action.payload)
      })
      
      // Update Industry
      .addCase(updateIndustry.fulfilled, (state, action) => {
        const index = state.industries.findIndex(industry => industry.id === action.payload.id)
        if (index !== -1) {
          state.industries[index] = action.payload
        }
      })
      
      // Delete Industry
      .addCase(deleteIndustry.fulfilled, (state, action) => {
        state.industries = state.industries.filter(industry => industry.id !== action.payload)
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  clearSelectedUser,
  clearSelectedJob,
  clearError,
  updateUserInList,
  removeUserFromList,
  updateJobInList,
  removeJobFromList,
  updateIndustryInList,
  removeIndustryFromList
} = adminSlice.actions

export default adminSlice.reducer