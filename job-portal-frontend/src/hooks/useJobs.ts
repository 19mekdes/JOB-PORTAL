/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { toast } from '@/hooks/use-toast'
import api from '../services/api'

interface Job {
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

interface JobFilters {
  keyword?: any
  jobTypes?: any[]
  industries?: any[]
  remoteOnly?: any
  datePosted?: string
  sortBy?: string
  experienceLevels?: never[]
  salaryRange?: [number, number]
  featuredOnly?: boolean
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

interface UseJobsReturn {
  jobs: Job[]
  currentJob: Job | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  totalJobs: number
  filters: JobFilters
  setFilters: (filters: JobFilters) => void
  fetchJobs: () => Promise<void>
  fetchJobById: (id: string) => Promise<Job | null>
  createJob: (jobData: any) => Promise<Job | null>
  updateJob: (id: string, jobData: any) => Promise<Job | null>
  deleteJob: (id: string) => Promise<boolean>
  toggleJobStatus: (id: string) => Promise<boolean>
  saveJob: (id: string) => Promise<boolean>
  unsaveJob: (id: string) => Promise<boolean>
  checkSavedStatus: (id: string) => Promise<boolean>
  getEmployerJobs: () => Promise<Job[]>
  getJobStats: () => Promise<any>
  getRecommendedJobs: (limit?: number) => Promise<Job[]>
}

export const useJobs = (initialFilters?: JobFilters): UseJobsReturn => {
  useSelector((state: RootState) => state.auth)
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 10,
    sort: 'recent',
    ...initialFilters
  })

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort
      }
      if (filters.search) params.search = filters.search
      if (filters.location) params.location = filters.location
      if (filters.industry) params.industry = filters.industry
      if (filters.employment_type) params.employment_type = filters.employment_type
      if (filters.min_salary) params.min_salary = filters.min_salary
      if (filters.max_salary) params.max_salary = filters.max_salary
      if (filters.is_remote !== undefined) params.is_remote = filters.is_remote
      if (filters.is_featured !== undefined) params.is_featured = filters.is_featured
      if (filters.date_posted) params.date_posted = filters.date_posted
      if (filters.experience_level) params.experience_level = filters.experience_level
      
      const response = await api.get('/jobs', { params })
      setJobs(response.data.data)
      setTotalPages(response.data.pagination.pages)
      setCurrentPage(response.data.pagination.page)
      setTotalJobs(response.data.pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch jobs')
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load jobs",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const fetchJobById = useCallback(async (id: string): Promise<Job | null> => {
    setIsLoading(true)
    try {
      const response = await api.get(`/jobs/${id}`)
      setCurrentJob(response.data.data)
      return response.data.data
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch job details",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createJob = useCallback(async (jobData: any): Promise<Job | null> => {
    try {
      const response = await api.post('/jobs', jobData)
      toast({
        variant: "success",
        title: "Success",
        description: "Job posted successfully",
      })
      return response.data.data
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to post job",
      })
      return null
    }
  }, [])

  const updateJob = useCallback(async (id: string, jobData: any): Promise<Job | null> => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData)
      toast({
        variant: "success",
        title: "Success",
        description: "Job updated successfully",
      })
      if (currentJob?.id === id) {
        setCurrentJob(response.data.data)
      }
      return response.data.data
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update job",
      })
      return null
    }
  }, [currentJob])

  const deleteJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/jobs/${id}`)
      toast({
        variant: "success",
        title: "Success",
        description: "Job deleted successfully",
      })
      setJobs(prev => prev.filter(job => job.id !== id))
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to delete job",
      })
      return false
    }
  }, [])

  const toggleJobStatus = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await api.patch(`/jobs/${id}/toggle-status`)
      toast({
        variant: "success",
        title: "Success",
        description: `Job ${response.data.data.status.status_name.toLowerCase()} successfully`,
      })
      setJobs(prev => prev.map(job => 
        job.id === id ? response.data.data : job
      ))
      if (currentJob?.id === id) {
        setCurrentJob(response.data.data)
      }
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update job status",
      })
      return false
    }
  }, [currentJob])

  const saveJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.post(`/bookmarks/${id}`)
      toast({
        title: "Saved",
        description: "Job saved successfully",
      })
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, is_saved: true } : job
      ))
      if (currentJob?.id === id) {
        setCurrentJob({ ...currentJob, is_saved: true })
      }
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to save job",
      })
      return false
    }
  }, [currentJob])

  const unsaveJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/bookmarks/${id}`)
      toast({
        title: "Removed",
        description: "Job removed from saved",
      })
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, is_saved: false } : job
      ))
      if (currentJob?.id === id) {
        setCurrentJob({ ...currentJob, is_saved: false })
      }
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to remove saved job",
      })
      return false
    }
  }, [currentJob])

  const checkSavedStatus = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await api.get(`/bookmarks/check/${id}`)
      return response.data.data.isBookmarked
    } catch (err) {
      console.error('Error checking saved status:', err)
      return false
    }
  }, [])

  const getEmployerJobs = useCallback(async (): Promise<Job[]> => {
    try {
      const response = await api.get('/jobs/employer/my-jobs')
      return response.data.data
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch your jobs",
      })
      return []
    }
  }, [])

  const getJobStats = useCallback(async (): Promise<any> => {
    try {
      const response = await api.get('/jobs/employer/stats')
      return response.data.data
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch job statistics",
      })
      return null
    }
  }, [])

  const getRecommendedJobs = useCallback(async (limit: number = 10): Promise<Job[]> => {
    try {
      const response = await api.get(`/jobs/recommended?limit=${limit}`)
      return response.data.data
    } catch (err: any) {
      console.error('Error fetching recommended jobs:', err)
      return []
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    currentJob,
    isLoading,
    error,
    totalPages,
    currentPage,
    totalJobs,
    filters,
    setFilters,
    fetchJobs,
    fetchJobById,
    createJob,
    updateJob,
    deleteJob,
    toggleJobStatus,
    saveJob,
    unsaveJob,
    checkSavedStatus,
    getEmployerJobs,
    getJobStats,
    getRecommendedJobs
  }
}

// Hook for job filters (simplified)
interface UseJobFiltersReturn {
  filters: JobFilters
  updateFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => void
  resetFilters: () => void
  activeFilterCount: number
}

export const useJobFilters = (initialFilters?: JobFilters): UseJobFiltersReturn => {
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 10,
    sort: 'recent',
    ...initialFilters
  })

  const updateFilter = useCallback(<K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      sort: 'recent',
      keyword: '',
      jobTypes: [],
      industries: [],
      remoteOnly: false,
      datePosted: 'any',
      sortBy: 'recent',
      experienceLevels: [],
      salaryRange: [0, 200000],
      featuredOnly: false
    })
  }, [])

  const activeFilterCount = useCallback(() => {
    let count = 0
    if (filters.search) count++
    if (filters.location) count++
    if (filters.industry) count++
    if (filters.employment_type) count++
    if (filters.min_salary) count++
    if (filters.max_salary) count++
    if (filters.is_remote) count++
    if (filters.is_featured) count++
    if (filters.date_posted) count++
    if (filters.experience_level) count++
    return count
  }, [filters])

  return {
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount: activeFilterCount()
  }
}

// Hook for saved jobs
interface UseSavedJobsReturn {
  savedJobs: Job[]
  isLoading: boolean
  fetchSavedJobs: () => Promise<void>
  saveJob: (id: string) => Promise<boolean>
  unsaveJob: (id: string) => Promise<boolean>
  isSaved: (id: string) => boolean
}

export const useSavedJobs = (): UseSavedJobsReturn => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSavedJobs = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/bookmarks')
      setSavedJobs(response.data.data.map((item: any) => item.job))
    } catch (err) {
      console.error('Error fetching saved jobs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.post(`/bookmarks/${id}`)
      await fetchSavedJobs()
      toast({
        title: "Saved",
        description: "Job saved successfully",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to save job",
      })
      return false
    }
  }, [fetchSavedJobs])

  const unsaveJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/bookmarks/${id}`)
      await fetchSavedJobs()
      toast({
        title: "Removed",
        description: "Job removed from saved",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to remove saved job",
      })
      return false
    }
  }, [fetchSavedJobs])

  const isSaved = useCallback((id: string): boolean => {
    return savedJobs.some(job => job.id === id)
  }, [savedJobs])

  useEffect(() => {
    fetchSavedJobs()
  }, [fetchSavedJobs])

  return {
    savedJobs,
    isLoading,
    fetchSavedJobs,
    saveJob,
    unsaveJob,
    isSaved
  }
}

export default useJobs