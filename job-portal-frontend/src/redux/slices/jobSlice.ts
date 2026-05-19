/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export interface Job {
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
}

interface JobState {
  jobs: Job[]
  currentJob: Job | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  totalJobs: number
  filters: {
    search?: string
    location?: string
    industry?: number
    employment_type?: number
    min_salary?: number
    max_salary?: number
    is_remote?: boolean
    page?: number
    limit?: number
    sort?: string
  }
}

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  totalJobs: 0,
  filters: {
    page: 1,
    limit: 10,
    sort: 'recent'
  }
}

export const fetchJobs = createAsyncThunk(
  'jobs/fetch',
  async (filters: any) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    const response = await api.get(`/jobs${params.toString() ? `?${params}` : ''}`)
    return response.data
  }
)

export const fetchJobById = createAsyncThunk(
  'jobs/fetchById',
  async (id: string) => {
    const response = await api.get(`/jobs/${id}`)
    return response.data
  }
)

export const createJob = createAsyncThunk(
  'jobs/create',
  async (jobData: any) => {
    const response = await api.post('/jobs', jobData)
    return response.data
  }
)

export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ id, jobData }: { id: string; jobData: any }) => {
    const response = await api.put(`/jobs/${id}`, jobData)
    return response.data
  }
)

export const deleteJob = createAsyncThunk(
  'jobs/delete',
  async (id: string) => {
    await api.delete(`/jobs/${id}`)
    return id
  }
)

export const toggleJobStatus = createAsyncThunk(
  'jobs/toggleStatus',
  async (id: string) => {
    const response = await api.patch(`/jobs/${id}/toggle-status`)
    return response.data
  }
)

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 }
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        sort: 'recent'
      }
    },
    setCurrentPage: (state, action) => {
      state.filters.page = action.payload
    },
    clearCurrentJob: (state) => {
      state.currentJob = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateJobInList: (state, action) => {
      const index = state.jobs.findIndex(job => job.id === action.payload.id)
      if (index !== -1) {
        state.jobs[index] = { ...state.jobs[index], ...action.payload }
      }
    },
    removeJobFromList: (state, action) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false
        state.jobs = action.payload.data
        state.totalPages = action.payload.pagination?.pages || 1
        state.currentPage = action.payload.pagination?.page || 1
        state.totalJobs = action.payload.pagination?.total || 0
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch jobs'
      })
      // Fetch Job By ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentJob = action.payload.data
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch job details'
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false
        state.jobs.unshift(action.payload.data)
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to create job'
      })
      // Update Job
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job.id === action.payload.data.id)
        if (index !== -1) {
          state.jobs[index] = action.payload.data
        }
        if (state.currentJob?.id === action.payload.data.id) {
          state.currentJob = action.payload.data
        }
      })
      // Delete Job
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(job => job.id !== action.payload)
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null
        }
      })
      // Toggle Job Status
      .addCase(toggleJobStatus.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job.id === action.payload.data.id)
        if (index !== -1) {
          state.jobs[index] = action.payload.data
        }
        if (state.currentJob?.id === action.payload.data.id) {
          state.currentJob = action.payload.data
        }
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  clearCurrentJob,
  clearError,
  updateJobInList,
  removeJobFromList
} = jobSlice.actions

export default jobSlice.reducer