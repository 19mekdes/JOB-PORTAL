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
  Filter,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

// Custom Dropdown Component
interface DropdownOption {
  value: string
  label: string
}

const CustomDropdown: React.FC<{
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon?: React.ReactNode
}> = ({ options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
}

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    closed: 0
  })

  const statusOptions: DropdownOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'closed', label: 'Closed' }
  ]

  const employmentTypeOptions: DropdownOption[] = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'internship', label: 'Internship' }
  ]

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build params for backend filtering
      const params: any = {}
      
      if (searchTerm) params.search = searchTerm
      
      // Map status filter for backend
      if (statusFilter !== 'all') {
        const statusMap: Record<string, string> = {
          'pending': 'Pending',
          'approved': 'Open',
          'rejected': 'Rejected',
          'closed': 'Closed'
        }
        params.status = statusMap[statusFilter]
      }
      
      // Map employment type for backend
      if (employmentTypeFilter !== 'all') {
        const typeMap: Record<string, string> = {
          'full-time': 'Full-time',
          'part-time': 'Part-time',
          'contract': 'Contract',
          'remote': 'Remote',
          'hybrid': 'Hybrid',
          'internship': 'Internship'
        }
        params.employment_type = typeMap[employmentTypeFilter]
      }
      
      const response = await api.get('/admin/jobs', { params })
      
      let jobsData = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        jobsData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        jobsData = response.data
      }
      
      setJobs(jobsData)
      
      // Calculate stats from jobs data
      const calculated = jobsData.reduce((acc: any, job: Job) => {
        acc.total++
        const statusName = job.status?.status_name?.toLowerCase()
        if (statusName === 'pending') acc.pending++
        else if (statusName === 'open' || statusName === 'approved') acc.approved++
        else if (statusName === 'rejected') acc.rejected++
        else if (statusName === 'closed') acc.closed++
        return acc
      }, { total: 0, pending: 0, approved: 0, rejected: 0, closed: 0 })
      setStats(calculated)
      
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

  // Client-side filtering as backup
  const filteredJobs = jobs.filter(job => {
    // Status filter
    let matchesStatus = true
    if (statusFilter !== 'all') {
      const jobStatus = job.status?.status_name?.toLowerCase()
      if (statusFilter === 'pending' && jobStatus !== 'pending') matchesStatus = false
      else if (statusFilter === 'approved' && jobStatus !== 'open' && jobStatus !== 'approved') matchesStatus = false
      else if (statusFilter === 'rejected' && jobStatus !== 'rejected') matchesStatus = false
      else if (statusFilter === 'closed' && jobStatus !== 'closed') matchesStatus = false
    }
    
    // Employment type filter
    let matchesEmploymentType = true
    if (employmentTypeFilter !== 'all') {
      const jobType = job.employment_type?.type_name?.toLowerCase()
      if (employmentTypeFilter === 'full-time' && jobType !== 'full-time') matchesEmploymentType = false
      else if (employmentTypeFilter === 'part-time' && jobType !== 'part-time') matchesEmploymentType = false
      else if (employmentTypeFilter === 'contract' && jobType !== 'contract') matchesEmploymentType = false
      else if (employmentTypeFilter === 'remote' && jobType !== 'remote') matchesEmploymentType = false
      else if (employmentTypeFilter === 'hybrid' && jobType !== 'hybrid') matchesEmploymentType = false
      else if (employmentTypeFilter === 'internship' && jobType !== 'internship') matchesEmploymentType = false
    }
    
    // Search filter
    const matchesSearch = searchTerm === '' || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesEmploymentType && matchesSearch
  })

  const updateJobStatus = async (jobId: string, status: string, reason?: string) => {
    try {
      let backendStatus = status
      if (status === 'approved' || status === 'Approve') backendStatus = 'Open'
      else if (status === 'rejected' || status === 'Reject') backendStatus = 'Rejected'
      else if (status === 'closed') backendStatus = 'Closed'
      
      await api.put(`/admin/jobs/${jobId}/moderate`, { status: backendStatus, reason })
      
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Moderation</h1>
          <p className="text-gray-500 mt-1">Review, approve, and manage job postings</p>
        </div>
        <Button variant="outline" onClick={() => fetchJobs()} className="bg-white border-gray-300 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition" onClick={() => { setStatusFilter('all'); setEmploymentTypeFilter('all'); setSearchTerm(''); }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-yellow-200 shadow-sm cursor-pointer hover:bg-yellow-50 transition" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-green-200 shadow-sm cursor-pointer hover:bg-green-50 transition" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-red-200 shadow-sm cursor-pointer hover:bg-red-50 transition" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition" onClick={() => setStatusFilter('closed')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-gray-300"
              />
            </div>

            {/* Status Dropdown */}
            <CustomDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
              icon={<Filter className="h-4 w-4 text-gray-400" />}
            />

            {/* Employment Type Dropdown */}
            <CustomDropdown
              options={employmentTypeOptions}
              value={employmentTypeFilter}
              onChange={setEmploymentTypeFilter}
              placeholder="All Types"
              icon={<Briefcase className="h-4 w-4 text-gray-400" />}
            />

            {/* Clear Filters Button */}
            {(statusFilter !== 'all' || employmentTypeFilter !== 'all' || searchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all')
                  setEmploymentTypeFilter('all')
                  setSearchTerm('')
                }}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="text-gray-900">
              Job Listings
              <span className="text-sm text-gray-500 ml-2">({filteredJobs.length} jobs)</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {stats.pending > 0 && (
            <div className="mb-4 flex gap-2 p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-700">{stats.pending} jobs pending review</span>
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
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No jobs found</p>
              {(statusFilter !== 'all' || employmentTypeFilter !== 'all' || searchTerm) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all')
                    setEmploymentTypeFilter('all')
                    setSearchTerm('')
                  }}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-gray-700">Job Title</TableHead>
                    <TableHead className="text-gray-700">Company</TableHead>
                    <TableHead className="text-gray-700">Type</TableHead>
                    <TableHead className="text-gray-700">Location</TableHead>
                    <TableHead className="text-gray-700">Posted</TableHead>
                    <TableHead className="text-gray-700">Apps</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-right text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 bg-blue-100">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {job.employer?.company_name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">{job.employer?.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getEmploymentTypeBadge(job.employment_type?.type_name || 'Full-time')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{job.location || 'Remote'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(job.created_at)}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-blue-600">{job.applications_count || 0}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status?.status_name)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                          {(job.status?.status_name === 'Open' || job.status?.status_name === 'Approved') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:bg-gray-50"
                              onClick={() => updateJobStatus(job.id, 'closed')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
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

      {/* Job Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white border border-gray-200">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 text-gray-900">
                  <Briefcase className="h-5 w-5" />
                  Job Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Job Header */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
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
                        onClick={() => updateJobStatus(selectedJob.id, 'closed')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Job
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
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
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Approve Job Posting</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to approve this job?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approving this job will make it visible to all job seekers.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => selectedJob && updateJobStatus(selectedJob.id, 'approved')}
            >
              Approve Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Job Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reject Job Posting</DialogTitle>
            <DialogDescription className="text-gray-500">
              Provide a reason for rejecting this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedJob && updateJobStatus(selectedJob.id, 'rejected', rejectReason)}
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