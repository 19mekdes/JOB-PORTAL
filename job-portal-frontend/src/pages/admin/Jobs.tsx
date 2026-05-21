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
  Mail
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [activeTab, setActiveTab] = useState('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    closed: 0,
    draft: 0,
    archived: 0
  })

  // Synchronize Tab and Selection Filters cleanly
  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (val === 'all') setStatusFilter('all')
    else if (val === 'pending') setStatusFilter('Pending')
    else if (val === 'approved') setStatusFilter('Open')
    else if (val === 'rejected') setStatusFilter('Rejected')
    else if (val === 'closed') setStatusFilter('Closed')
  }

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/jobs?page=${page}&limit=20&search=${searchTerm}&status=${statusFilter}`)
      setJobs(response.data.data || [])
      setTotalPages(response.data.pagination?.pages || 1)
      
      if (response.data.stats) {
        setStats(response.data.stats)
      } else {
        // Fallback fallback calculation client-side if data stats missing from response
        const calculated = (response.data.data || []).reduce((acc: any, j: Job) => {
          acc.total++
          const st = j.status?.status_name?.toLowerCase()
          if (st === 'pending') acc.pending++
          else if (st === 'open' || st === 'approved') acc.approved++
          else if (st === 'rejected') acc.rejected++
          else if (st === 'closed') acc.closed++
          else if (st === 'draft') acc.draft++
          else if (st === 'archived') acc.archived++
          return acc
        }, { total: 0, pending: 0, approved: 0, rejected: 0, closed: 0, draft: 0, archived: 0 })
        setStats(calculated)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load jobs",
      })
    }
     {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const updateJobStatus = async (jobId: string, status: string, reason?: string) => {
    try {
      await api.put(`/admin/jobs/${jobId}/status`, { status, reason })
      toast({
        title: "Success",
        description: `Job ${status.toLowerCase()} successfully`,
      })
      fetchJobs()
      setIsDetailOpen(false)
      setIsRejectOpen(false)
      setIsApproveOpen(false)
      setRejectReason('')
    } catch (error) {
      console.error('Error updating job status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update job status",
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
      } catch (error) {
        console.error('Error deleting job:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete job",
        })
      }
    }
  }

  const bulkAction = async (action: string) => {
    const selectedJobs = jobs.filter(j => j.status?.status_name === 'Pending')
    if (selectedJobs.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No pending jobs to process",
      })
      return
    }
    
    try {
      await api.post('/admin/jobs/bulk-action', { 
        jobIds: selectedJobs.map(j => j.id), 
        action 
      })
      toast({
        title: "Success",
        description: `${selectedJobs.length} jobs ${action}d successfully`,
      })
      fetchJobs()
    } catch (error) {
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
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>
      case 'closed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Closed</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status?.status_name === statusFilter
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && job.status?.status_name === 'Pending') ||
      (activeTab === 'approved' && (job.status?.status_name === 'Open' || job.status?.status_name === 'Approved')) ||
      (activeTab === 'rejected' && job.status?.status_name === 'Rejected') ||
      (activeTab === 'closed' && job.status?.status_name === 'Closed')
    return matchesSearch && matchesStatus && matchesTab
  })

  if (loading) {
    return (
      <div className="space-y-4 bg-white rounded-xl p-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
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
        <Button variant="outline" onClick={() => fetchJobs()} className="bg-white border-gray-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => handleTabChange('all')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-yellow-200 bg-white" onClick={() => handleTabChange('pending')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-green-200 bg-white" onClick={() => handleTabChange('approved')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-red-200 bg-white" onClick={() => handleTabChange('rejected')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-blue-200 bg-white" onClick={() => handleTabChange('closed')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.closed}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            <p className="text-xs text-gray-500">Draft</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
            <p className="text-xs text-gray-500">Archived</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="all" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">All Jobs</TabsTrigger>
          <TabsTrigger value="pending" className="bg-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="bg-white data-[state=active]:bg-green-600 data-[state=active]:text-white">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="bg-white data-[state=active]:bg-red-600 data-[state=active]:text-white">Rejected</TabsTrigger>
          <TabsTrigger value="closed" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <CardTitle className="text-gray-900">
                  {activeTab === 'all' ? 'All Jobs' : 
                   activeTab === 'pending' ? 'Pending Review' :
                   activeTab === 'approved' ? 'Approved Jobs' :
                   activeTab === 'rejected' ? 'Rejected Jobs' : 'Closed Jobs'}
                  <span className="text-sm text-gray-500 ml-2">({filteredJobs.length})</span>
                </CardTitle>
                <div className="flex gap-3 flex-wrap">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by title or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white border-gray-300"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white border-gray-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No jobs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="text-gray-700">Job Title</TableHead>
                        <TableHead className="text-gray-700">Company</TableHead>
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
                              <p className="text-xs text-gray-500">{job.employment_type?.type_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {job.employer?.company_name?.charAt(0) || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-700">{job.employer?.company_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{job.location || 'Remote'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{formatDate(job.created_at)}</TableCell>
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-white border-gray-300"
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="bg-white border-gray-300"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
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
                    {selectedJob.is_remote && (
                      <Badge variant="secondary" className="text-xs">Remote</Badge>
                    )}
                    {getStatusBadge(selectedJob.status?.status_name)}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.description}</p>
                </div>

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
                  <div className="grid grid-cols-4 gap-4 text-center">
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
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{formatDate(selectedJob.updated_at)}</p>
                      <p className="text-xs text-gray-500">Updated</p>
                    </div>
                  </div>
                </div>

                {/* Employer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Employer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{selectedJob.employer?.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{selectedJob.employer?.user?.email}</span>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => updateJobStatus(selectedJob.id, 'Closed')}
                      >
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
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Approve Job Posting</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to approve this job?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approving this job will make it visible to all job seekers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} className="border-gray-300 bg-white">
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
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} className="border-gray-300 bg-white">
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