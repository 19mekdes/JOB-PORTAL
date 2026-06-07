/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Briefcase,
  Eye,
  MapPin,
  DollarSign,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Building2,
  Clock,
  AlertCircle,
  Mail,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Job {
  id: string
  title: string
  description: string
  requirements: string
  benefits: string
  location: string
  salary_min: number | null
  salary_max: number | null
  salary_range: string
  is_remote: boolean
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
  status: {
    id: number
    status_name: string
  }
  employer: {
    id: string
    company_name: string
    logo_url?: string
    user: {
      email: string
      full_name?: string
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
}

interface JobStats {
  total: number
  pending: number
  approved: number
  rejected: number
  closed: number
  draft: number
  archived: number
}

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [employmentTypes, setEmploymentTypes] = useState<{ id: number; type_name: string }[]>([])
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    closed: 0,
    draft: 0,
    archived: 0
  })

  // Fetch employment types for filter
  useEffect(() => {
    const fetchEmploymentTypes = async () => {
      try {
        const response = await api.get('/employment-types')
        if (response.data.success) {
          setEmploymentTypes(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching employment types:', error)
        // Fallback employment types
        setEmploymentTypes([
          { id: 1, type_name: 'Full-time' },
          { id: 2, type_name: 'Part-time' },
          { id: 3, type_name: 'Contract' },
          { id: 4, type_name: 'Remote' },
          { id: 5, type_name: 'Hybrid' },
          { id: 6, type_name: 'Internship' }
        ])
      }
    }
    fetchEmploymentTypes()
  }, [])

  // Synchronize Tab and Selection Filters cleanly
  const handleTabChange = (val: string) => {
    setActiveTab(val)
    setPage(1)
    if (val === 'all') setStatusFilter('all')
    else if (val === 'pending') setStatusFilter('Pending')
    else if (val === 'approved') setStatusFilter('Open')
    else if (val === 'rejected') setStatusFilter('Rejected')
    else if (val === 'closed') setStatusFilter('Closed')
  }

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build params
      const params: any = { limit: 50 }
      if (searchTerm) params.search = searchTerm
      if (statusFilter !== 'all') params.status = statusFilter
      if (employmentTypeFilter !== 'all') params.employment_type = employmentTypeFilter
      
      console.log('Fetching jobs with params:', params)
      
      const response = await api.get('/admin/jobs', { params })
      
      console.log('Jobs API Response:', response.data)
      
      // Handle different response structures
      let jobsData = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        jobsData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        jobsData = response.data
      }
      
      setJobs(jobsData)
      
      // Handle stats from response
      let statsData = response.data?.stats
      if (!statsData && response.data?.data?.stats) statsData = response.data.data.stats
      if (!statsData && response.data?.stats) statsData = response.data.stats
      
      if (statsData) {
        setStats({
          total: statsData.total || 0,
          pending: statsData.pending || 0,
          approved: statsData.approved || statsData.open || 0,
          rejected: statsData.rejected || 0,
          closed: statsData.closed || 0,
          draft: statsData.draft || 0,
          archived: statsData.archived || 0
        })
      } else {
        // Calculate stats from jobs data if not provided
        const calculated = jobsData.reduce((acc: any, job: Job) => {
          acc.total++
          const statusName = job.status?.status_name?.toLowerCase()
          if (statusName === 'pending') acc.pending++
          else if (statusName === 'open' || statusName === 'approved') acc.approved++
          else if (statusName === 'rejected') acc.rejected++
          else if (statusName === 'closed') acc.closed++
          else if (statusName === 'draft') acc.draft++
          else if (statusName === 'archived') acc.archived++
          return acc
        }, { total: 0, pending: 0, approved: 0, rejected: 0, closed: 0, draft: 0, archived: 0 })
        setStats(calculated)
      }
      
      setTotalPages(response.data?.pagination?.pages || 1)
      
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load jobs",
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, employmentTypeFilter])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const updateJobStatus = async (jobId: string, status: string, reason?: string) => {
    try {
      await api.put(`/admin/jobs/${jobId}/moderate`, { status, reason })
      toast({
        title: "Success",
        description: `Job ${status.toLowerCase()} successfully`,
      })
      fetchJobs()
      setIsDetailOpen(false)
      setIsRejectOpen(false)
      setIsApproveOpen(false)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error updating job status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update job status",
      })
    }
  }

  const deleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/jobs/${jobId}`)
        toast({
          title: "Success",
          description: "Job deleted successfully",
        })
        fetchJobs()
        setIsDetailOpen(false)
      } catch (error: any) {
        console.error('Error deleting job:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.response?.data?.message || "Failed to delete job",
        })
      }
    }
  }

  const bulkAction = async (action: string) => {
    const pendingJobs = jobs.filter(j => j.status?.status_name === 'Pending')
    if (pendingJobs.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No pending jobs to process",
      })
      return
    }
    
    try {
      for (const job of pendingJobs) {
        await api.put(`/admin/jobs/${job.id}/moderate`, { 
          status: action === 'approve' ? 'Open' : 'Rejected',
          reason: action === 'approve' ? 'Bulk approval' : 'Bulk rejection'
        })
      }
      toast({
        title: "Success",
        description: `${pendingJobs.length} jobs ${action}d successfully`,
      })
      fetchJobs()
    } catch (error: any) {
      console.error('Error performing bulk action:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process bulk action",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1"><XCircle className="h-3 w-3" />Closed</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Archived</Badge>
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>
    }
  }

  const getEmploymentTypeBadge = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'full-time':
        return <Badge className="bg-blue-100 text-blue-800">Full-time</Badge>
      case 'part-time':
        return <Badge className="bg-purple-100 text-purple-800">Part-time</Badge>
      case 'contract':
        return <Badge className="bg-orange-100 text-orange-800">Contract</Badge>
      case 'remote':
        return <Badge className="bg-green-100 text-green-800">Remote</Badge>
      case 'hybrid':
        return <Badge className="bg-teal-100 text-teal-800">Hybrid</Badge>
      case 'internship':
        return <Badge className="bg-pink-100 text-pink-800">Internship</Badge>
      default:
        return <Badge variant="outline">{typeName || 'Full-time'}</Badge>
    }
  }

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSalary = (job: Job) => {
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
    }
    return job.salary_range || 'Competitive'
  }

  // Filter jobs based on active tab and employment type
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && job.status?.status_name === 'Pending') ||
      (activeTab === 'approved' && (job.status?.status_name === 'Open' || job.status?.status_name === 'Approved')) ||
      (activeTab === 'rejected' && job.status?.status_name === 'Rejected') ||
      (activeTab === 'closed' && job.status?.status_name === 'Closed')
    
    const matchesEmploymentType = employmentTypeFilter === 'all' || 
      job.employment_type?.type_name?.toLowerCase() === employmentTypeFilter.toLowerCase()
    
    return matchesSearch && matchesTab && matchesEmploymentType
  })

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center items-center h-96 bg-white">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white">
        <div className="bg-white">
          <h1 className="text-2xl font-bold text-gray-900">Job Moderation</h1>
          <p className="text-gray-500 mt-1">Review, approve, and manage job postings</p>
        </div>
        <Button variant="outline" onClick={() => fetchJobs()} className="bg-white border-gray-300 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-white">
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => handleTabChange('all')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-yellow-200" onClick={() => handleTabChange('pending')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-green-200" onClick={() => handleTabChange('approved')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-red-200" onClick={() => handleTabChange('rejected')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => handleTabChange('closed')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            <p className="text-xs text-gray-500">Draft</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
            <p className="text-xs text-gray-500">Archived</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white space-y-4">
        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2 flex-wrap">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Jobs
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => handleTabChange('approved')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => handleTabChange('rejected')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Rejected ({stats.rejected})
          </button>
          <button
            onClick={() => handleTabChange('closed')}
            className={`px-4 py-2 rounded-lg transition ${activeTab === 'closed' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Closed ({stats.closed})
          </button>
        </div>

        {/* Employment Type Filter */}
        <div className="flex items-center gap-3 flex-wrap bg-white">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">Employment Type:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setEmploymentTypeFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                employmentTypeFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {employmentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setEmploymentTypeFilter(type.type_name)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  employmentTypeFilter === type.type_name 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.type_name}
              </button>
            ))}
          </div>
          {employmentTypeFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEmploymentTypeFilter('all')}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear filter
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Jobs Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 bg-white">
          <div className="flex justify-between items-center flex-wrap gap-4 bg-white">
            <CardTitle className="bg-white text-gray-900">
              {activeTab === 'all' ? 'All Jobs' : 
               activeTab === 'pending' ? 'Pending Review' :
               activeTab === 'approved' ? 'Approved Jobs' :
               activeTab === 'rejected' ? 'Rejected Jobs' : 'Closed Jobs'}
              <span className="text-sm text-gray-500 ml-2">({filteredJobs.length})</span>
            </CardTitle>
            <div className="flex gap-3 flex-wrap bg-white">
              <div className="relative w-64 bg-white">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white border-gray-300"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          {/* Bulk Actions for Pending Tab */}
          {activeTab === 'pending' && filteredJobs.length > 0 && (
            <div className="mb-4 flex gap-2 p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-700">{filteredJobs.length} jobs pending review</span>
              <Button 
                size="sm" 
                onClick={() => bulkAction('approve')}
                className="ml-auto bg-green-600 hover:bg-green-700 text-white"
              >
                Approve All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => bulkAction('reject')}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Reject All
              </Button>
            </div>
          )}

          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No jobs found</p>
              {employmentTypeFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => setEmploymentTypeFilter('all')}
                  className="mt-4"
                >
                  Clear employment type filter
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="text-gray-700 bg-gray-50">Job Title</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Company</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Type</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Location</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Posted</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Apps</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Status</TableHead>
                    <TableHead className="text-right text-gray-700 bg-gray-50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50 border-b border-gray-100 bg-white">
                      <TableCell className="bg-white">
                        <div className="bg-white">
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-500">{getEmploymentTypeBadge(job.employment_type?.type_name || 'Full-time')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="bg-white">
                        <div className="flex items-center gap-2 bg-white">
                          <Avatar className="h-6 w-6 bg-blue-100">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {job.employer?.company_name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">{job.employer?.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="bg-white">
                        {getEmploymentTypeBadge(job.employment_type?.type_name || 'Full-time')}
                      </TableCell>
                      <TableCell className="bg-white">
                        <div className="flex items-center gap-1 bg-white">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{job.location || 'Remote'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm bg-white">{formatDate(job.created_at)}</TableCell>
                      <TableCell className="bg-white">
                        <span className="text-sm font-medium text-blue-600">{job.applications_count || 0}</span>
                      </TableCell>
                      <TableCell className="bg-white">{getStatusBadge(job.status?.status_name)}</TableCell>
                      <TableCell className="text-right bg-white">
                        <div className="flex justify-end gap-2 bg-white">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job)
                              setIsDetailOpen(true)
                            }}
                            className="hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          {(job.status?.status_name === 'Pending') && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedJob(job)
                                  setIsApproveOpen(true)
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedJob(job)
                                  setIsRejectOpen(true)
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Detail Dialog - Add Employment Type to display */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
          {selectedJob && (
            <>
              <DialogHeader className="bg-white">
                <DialogTitle className="text-xl flex items-center gap-2 text-gray-900 bg-white">
                  <Briefcase className="h-5 w-5" />
                  Job Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 bg-white">
                {/* Job Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
                  <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-600">{selectedJob.employer?.company_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {selectedJob.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      {formatSalary(selectedJob)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      {selectedJob.employment_type?.type_name || 'Full-time'}
                    </span>
                    {getStatusBadge(selectedJob.status?.status_name)}
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {selectedJob.requirements && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.requirements}</p>
                  </div>
                )}

                {/* Benefits */}
                {selectedJob.benefits && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.benefits}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{selectedJob.views_count || 0}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{selectedJob.applications_count || 0}</p>
                      <p className="text-xs text-gray-500">Applications</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{formatDate(selectedJob.created_at)}</p>
                      <p className="text-xs text-gray-500">Posted</p>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="border-t pt-4 border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Moderation Actions</h3>
                  <div className="flex gap-3 flex-wrap">
                    {selectedJob.status?.status_name === 'Pending' && (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setIsDetailOpen(false)
                            setIsApproveOpen(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Job
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            setIsDetailOpen(false)
                            setIsRejectOpen(true)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Job
                        </Button>
                      </>
                    )}
                    {(selectedJob.status?.status_name === 'Open' || selectedJob.status?.status_name === 'Approved') && (
                      <Button 
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                        onClick={() => updateJobStatus(selectedJob.id, 'Closed')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Job
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50 bg-white"
                      onClick={() => deleteJob(selectedJob.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Job
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Job Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="bg-white">
          <DialogHeader className="bg-white">
            <DialogTitle className="text-gray-900">Approve Job Posting</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to approve this job?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 bg-white">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approving this job will make it visible to all job seekers.
              </p>
            </div>
          </div>
          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} className="bg-white border-gray-300">
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => selectedJob && updateJobStatus(selectedJob.id, 'Open')}
            >
              Approve Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Job Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-white">
          <DialogHeader className="bg-white">
            <DialogTitle className="text-gray-900">Reject Job Posting</DialogTitle>
            <DialogDescription className="text-gray-500">
              Provide a reason for rejecting this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 bg-white">
            <div className="bg-white">
              <Label htmlFor="reason" className="text-gray-700">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejecting this job..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-2 bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the employer.
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Rejected jobs will not be visible to job seekers.
              </p>
            </div>
          </div>
          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} className="bg-white border-gray-300">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedJob && updateJobStatus(selectedJob.id, 'Rejected', rejectReason)}
            >
              Reject Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminJobs