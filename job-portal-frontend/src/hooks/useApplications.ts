/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { toast } from '@/hooks/use-toast'
import api from '../services/api'

interface Application {
  id: string
  job_id: string
  seeker_id: string
  cover_letter: string | null
  resume_url: string | null
  employer_notes: string | null
  applied_at: string
  updated_at: string
  status_id: number

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
    applications_count: number
    views_count: number

    employer: {
      id: string
      company_name: string
      logo_url: string | null
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
    employer_id: string
  }>
}

interface ApplicationFilters {
  status?: string
  job_id?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest'
}

interface ApplicationStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
  }>
  byMonth: Array<{
    month: string
    count: number
  }>
}

interface UseApplicationsReturn {
  applications: Application[]
  stats: ApplicationStats | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  filters: ApplicationFilters
  setFilters: (filters: ApplicationFilters) => void
  fetchApplications: () => Promise<void>
  fetchApplicationById: (id: string) => Promise<Application | null>
  applyForJob: (jobId: string, data: any) => Promise<Application | null>
  updateApplicationStatus: (
    id: string,
    status: string,
    feedback?: string
  ) => Promise<boolean>
  addNote: (id: string, note: string) => Promise<boolean>
  withdrawApplication: (id: string) => Promise<boolean>
  exportApplications: () => Promise<void>
  isMissingProfile: boolean
}

export const useApplications = (
  initialFilters?: ApplicationFilters
): UseApplicationsReturn => {
  const { user } = useSelector((state: RootState) => state.auth)

  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMissingProfile, setIsMissingProfile] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    page: 1,
    limit: 10,
    sort: 'recent',
    ...initialFilters
  })

  // ================= FETCH APPLICATIONS =================

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setIsMissingProfile(false)

    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort
      }

      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }

      if (filters.job_id) {
        params.job_id = filters.job_id
      }

      const response = await api.get(
        '/applications/my-applications',
        { params }
      )

      console.log('Applications API Response:', response.data)

      const appsData = Array.isArray(response.data?.data)
        ? response.data.data
        : []

      setApplications(appsData)

      setStats({
        total: appsData.length,
        byStatus: calculateStatusStats(appsData),
        byMonth: calculateMonthlyStats(appsData)
      })

      setTotalPages(1)
      setCurrentPage(1)
    } catch (err: any) {
      console.error('Error fetching applications:', err)

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch applications'

      if (
        errorMessage.includes('profile') ||
        errorMessage.includes('seeker') ||
        err.response?.status === 404
      ) {
        setIsMissingProfile(true)
        setApplications([])
        setStats(null)
        setError(null)
      } else {
        setError(errorMessage)

        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load applications'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, filters])

  // ================= STATUS STATS =================

  const calculateStatusStats = (apps: Application[]) => {
    const statusMap = new Map<string, number>()

    apps.forEach(app => {
      const statusName = app.status?.status_name || 'Unknown'

      statusMap.set(
        statusName,
        (statusMap.get(statusName) || 0) + 1
      )
    })

    return Array.from(statusMap.entries()).map(
      ([status, count]) => ({
        status,
        count
      })
    )
  }

  // ================= MONTHLY STATS =================

  const calculateMonthlyStats = (apps: Application[]) => {
    const monthMap = new Map<string, number>()

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]

    apps.forEach(app => {
      const date = new Date(app.applied_at)

      const monthName = months[date.getMonth()]
      const year = date.getFullYear()

      const key = `${monthName} ${year}`

      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    })

    return Array.from(monthMap.entries()).map(
      ([month, count]) => ({
        month,
        count
      })
    )
  }

  // ================= GET APPLICATION BY ID =================

  const fetchApplicationById = useCallback(
    async (id: string): Promise<Application | null> => {
      try {
        const response = await api.get(`/applications/${id}`)

        return response.data?.data || null
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            err.response?.data?.message ||
            'Failed to fetch application details'
        })

        return null
      }
    },
    []
  )

  // ================= APPLY FOR JOB =================

  const applyForJob = useCallback(
    async (
      jobId: string,
      data: any
    ): Promise<Application | null> => {
      if (isMissingProfile) {
        toast({
          variant: 'destructive',
          title: 'Complete Your Profile',
          description:
            'Please complete your seeker profile before applying for jobs'
        })

        return null
      }

      try {
        // FIXED ROUTE
        const response = await api.post(
          `/applications/apply/${jobId}`,
          data,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        toast({
          variant: 'success',
          title: 'Application Submitted!',
          description:
            'Your application has been sent successfully'
        })

        await fetchApplications()

        return response.data?.data || null
      } catch (err: any) {
        console.error(err)

        toast({
          variant: 'destructive',
          title: 'Application Failed',
          description:
            err.response?.data?.message ||
            'Failed to submit application'
        })

        return null
      }
    },
    [fetchApplications, isMissingProfile]
  )

  // ================= UPDATE STATUS =================

  const updateApplicationStatus = useCallback(
    async (
      id: string,
      status: string,
      feedback?: string
    ): Promise<boolean> => {
      try {
        await api.put(`/applications/${id}/status`, {
          status,
          feedback
        })

        toast({
          variant: 'success',
          title: 'Status Updated',
          description: `Application status changed to ${status}`
        })

        await fetchApplications()

        return true
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description:
            err.response?.data?.message ||
            'Failed to update status'
        })

        return false
      }
    },
    [fetchApplications]
  )

  // ================= ADD NOTE =================

  const addNote = useCallback(
    async (id: string, note: string): Promise<boolean> => {
      try {
        await api.post(`/applications/${id}/notes`, {
          note
        })

        toast({
          title: 'Note Added',
          description: 'Your note has been added successfully'
        })

        await fetchApplications()

        return true
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            err.response?.data?.message ||
            'Failed to add note'
        })

        return false
      }
    },
    [fetchApplications]
  )

  // ================= WITHDRAW =================

  const withdrawApplication = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.delete(`/applications/${id}/withdraw`)

        toast({
          title: 'Application Withdrawn',
          description:
            'Your application has been withdrawn successfully'
        })

        await fetchApplications()

        return true
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            err.response?.data?.message ||
            'Failed to withdraw application'
        })

        return false
      }
    },
    [fetchApplications]
  )

  // ================= EXPORT =================

  const exportApplications = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get(
        '/applications/export',
        {
          responseType: 'blob'
        }
      )

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      )

      const link = document.createElement('a')

      link.href = url

      link.setAttribute(
        'download',
        `applications_${new Date().toISOString()}.csv`
      )

      document.body.appendChild(link)

      link.click()

      link.remove()

      toast({
        title: 'Export Complete',
        description: 'Applications exported successfully'
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description:
          err.response?.data?.message ||
          'Failed to export applications'
      })
    }
  }, [])

  // ================= EFFECT =================

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  return {
    applications,
    stats,
    isLoading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    fetchApplications,
    fetchApplicationById,
    applyForJob,
    updateApplicationStatus,
    addNote,
    withdrawApplication,
    exportApplications,
    isMissingProfile
  }
}