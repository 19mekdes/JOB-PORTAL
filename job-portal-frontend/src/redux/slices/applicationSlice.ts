import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'
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

interface ApplicationState {
  applications: Application[]
  currentApplication: Application | null
  stats: ApplicationStats | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  totalItems: number
  filters: ApplicationFilters
}

// ========== INITIAL STATE ==========
const initialState: ApplicationState = {
  applications: [],
  currentApplication: null,
  stats: null,
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  filters: {
    status: 'all',
    page: 1,
    limit: 10,
    sort: 'recent'
  }
}

// Fetch all applications for job seeker
export const fetchMyApplications = createAsyncThunk(
  'applications/fetchMyApplications',
  async (filters: ApplicationFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sort) params.append('sort', filters.sort)
    
    const response = await api.get(`/applications/my-applications${params.toString() ? `?${params}` : ''}`)
    return response.data
  }
)

// Fetch single application by ID
export const fetchApplicationById = createAsyncThunk(
  'applications/fetchApplicationById',
  async (id: string) => {
    const response = await api.get(`/applications/${id}`)
    return response.data.data
  }
)

// Apply for a job
export const applyForJob = createAsyncThunk(
  'applications/applyForJob',
  async ({ jobId, coverLetter, resumeUrl }: { jobId: string; coverLetter: string; resumeUrl: string }) => {
    const response = await api.post('/applications', {
      job_id: jobId,
      cover_letter: coverLetter,
      resume_url: resumeUrl
    })
    return response.data.data
  }
)

// Update application status (Employer)
export const updateApplicationStatus = createAsyncThunk(
  'applications/updateApplicationStatus',
  async ({ id, status, feedback }: { id: string; status: string; feedback?: string }) => {
    const response = await api.put(`/applications/${id}/status`, { status, feedback })
    return response.data.data
  }
)

// Add note to application (Employer)
export const addApplicationNote = createAsyncThunk(
  'applications/addApplicationNote',
  async ({ id, note }: { id: string; note: string }) => {
    const response = await api.post(`/applications/${id}/notes`, { note_text: note })
    return response.data.data
  }
)

// Withdraw application (Job Seeker)
export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async (id: string) => {
    await api.delete(`/applications/my-applications/${id}/withdraw`)
    return id
  }
)

// Get applications for a specific job (Employer)
export const fetchJobApplications = createAsyncThunk(
  'applications/fetchJobApplications',
  async ({ jobId, filters }: { jobId: string; filters?: ApplicationFilters }) => {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.sort) params.append('sort', filters.sort)
    
    const response = await api.get(`/applications/job/${jobId}${params.toString() ? `?${params}` : ''}`)
    return { data: response.data, jobId }
  }
)

// Export applications to CSV
export const exportApplications = createAsyncThunk(
  'applications/exportApplications',
  async (jobId?: string) => {
    const url = jobId ? `/applications/job/${jobId}/export` : '/applications/export'
    const response = await api.get(url, { responseType: 'blob' })
    return response.data
  }
)

// ========== SLICE ==========
const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ApplicationFilters>>) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 }
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        page: 1,
        limit: 10,
        sort: 'recent'
      }
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateApplicationInList: (state, action: PayloadAction<Application>) => {
      const index = state.applications.findIndex(app => app.id === action.payload.id)
      if (index !== -1) {
        state.applications[index] = action.payload
      }
    },
    removeApplicationFromList: (state, action: PayloadAction<string>) => {
      state.applications = state.applications.filter(app => app.id !== action.payload)
    },
    resetState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.isLoading = false
        state.applications = action.payload.data
        state.stats = action.payload.statistics
        state.totalPages = action.payload.pagination?.pages || 1
        state.currentPage = action.payload.pagination?.page || 1
        state.totalItems = action.payload.pagination?.total || 0
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch applications'
      })
      
      // Fetch Application By ID
      .addCase(fetchApplicationById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentApplication = action.payload
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch application details'
      })
      
      // Apply For Job
      .addCase(applyForJob.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.isLoading = false
        state.applications.unshift(action.payload)
        state.totalItems += 1
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to submit application'
      })
      
      // Update Application Status
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const index = state.applications.findIndex(app => app.id === action.payload.id)
        if (index !== -1) {
          state.applications[index] = action.payload
        }
        if (state.currentApplication?.id === action.payload.id) {
          state.currentApplication = action.payload
        }
        // Update stats if needed
        if (state.stats) {
          // Refresh stats or update locally
        }
      })
      
      // Add Application Note
      .addCase(addApplicationNote.fulfilled, (state, action) => {
        if (state.currentApplication) {
          if (!state.currentApplication.notes) {
            state.currentApplication.notes = []
          }
          state.currentApplication.notes.push(action.payload)
        }
      })
      
      // Withdraw Application
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter(app => app.id !== action.payload)
        if (state.currentApplication?.id === action.payload) {
          state.currentApplication = null
        }
        state.totalItems -= 1
      })
      
      // Fetch Job Applications (Employer)
      .addCase(fetchJobApplications.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.isLoading = false
        state.applications = action.payload.data.data
        state.stats = action.payload.data.statistics
        state.totalPages = action.payload.data.pagination?.pages || 1
        state.currentPage = action.payload.data.pagination?.page || 1
        state.totalItems = action.payload.data.pagination?.total || 0
      })
      .addCase(fetchJobApplications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch job applications'
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  clearCurrentApplication,
  clearError,
  updateApplicationInList,
  removeApplicationFromList,
  resetState
} = applicationSlice.actions

export default applicationSlice.reducer