// src/pages/superadmin/JobModeration.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, Trash2, MoreVertical, RefreshCw, AlertCircle,
  Briefcase, Eye, Clock, ThumbsUp, ThumbsDown, CheckCircle, XCircle,
  MapPin, DollarSign, Calendar, Building, Users
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  benefits: string | null
  location: string
  salary_min: number | null
  salary_max: number | null
  is_remote: boolean
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
  employer_id: string
  employment_type_id: number
  industry_id: number
  status_id: number
  employer: {
    id: string
    company_name: string
    logo_url: string | null
    location: string | null
    user: {
      email: string
      full_name: string
    }
  }
  industry: {
    id: number
    industry_name: string
  } | null
  employment_type: {
    id: number
    type_name: string
  } | null
  status: {
    id: number
    status_name: string
  } | null
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

const JobModeration: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    closed: 0,
    draft: 0,
    archived: 0
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Fetch jobs from backend
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/jobs')
      console.log('Jobs response:', response.data)
      
      let allJobs: Job[] = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        allJobs = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        allJobs = response.data
      }
      
      setJobs(allJobs)
      
      const jobStats: JobStats = {
        total: allJobs.length,
        pending: allJobs.filter(j => j.status?.status_name === 'Pending').length,
        approved: allJobs.filter(j => j.status?.status_name === 'Open').length,
        rejected: allJobs.filter(j => j.status?.status_name === 'Rejected').length,
        closed: allJobs.filter(j => j.status?.status_name === 'Closed').length,
        draft: allJobs.filter(j => j.status?.status_name === 'Draft').length,
        archived: allJobs.filter(j => j.status?.status_name === 'Archived').length
      }
      setStats(jobStats)
      
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err)
      setError(err.message || 'Failed to fetch jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Approve job
  const handleApproveJob = async () => {
    if (!selectedJob) return
    setSubmitting(true)
    try {
      await api.put(`/admin/jobs/${selectedJob.id}/status`, { status: 'Open' })
      toast({ title: "Success", description: `${selectedJob.title} has been approved!` })
      setIsApproveDialogOpen(false)
      fetchJobs()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Reject job
  const handleRejectJob = async () => {
    if (!selectedJob) return
    setSubmitting(true)
    try {
      await api.put(`/admin/jobs/${selectedJob.id}/status`, { status: 'Rejected' })
      toast({ title: "Success", description: `${selectedJob.title} has been rejected` })
      setIsRejectDialogOpen(false)
      setRejectionReason('')
      fetchJobs()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete job
  const handleDeleteJob = async () => {
    if (!selectedJob) return
    setSubmitting(true)
    try {
      await api.delete(`/admin/jobs/${selectedJob.id}`)
      toast({ title: "Success", description: `${selectedJob.title} has been deleted` })
      setIsDeleteDialogOpen(false)
      fetchJobs()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const openViewDialog = (job: Job) => {
    console.log('Opening view dialog for job:', job)
    setSelectedJob(job)
    setIsViewDialogOpen(true)
    setOpenMenuId(null)
  }

  const openApproveDialog = (job: Job) => {
    setSelectedJob(job)
    setIsApproveDialogOpen(true)
    setOpenMenuId(null)
  }

  const openRejectDialog = (job: Job) => {
    setSelectedJob(job)
    setRejectionReason('')
    setIsRejectDialogOpen(true)
    setOpenMenuId(null)
  }

  const openDeleteDialog = (job: Job) => {
    setSelectedJob(job)
    setIsDeleteDialogOpen(true)
    setOpenMenuId(null)
  }

  const toggleMenu = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === jobId ? null : jobId)
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700"><XCircle className="h-3 w-3 mr-1" /> Closed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status || 'Unknown'}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Not specified'
  }

  const getInitials = (name: string) => {
    if (!name) return 'CO'
    return name.charAt(0).toUpperCase()
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'pending' && job.status?.status_name === 'Pending') ||
                         (filterStatus === 'approved' && job.status?.status_name === 'Open') ||
                         (filterStatus === 'rejected' && job.status?.status_name === 'Rejected') ||
                         (filterStatus === 'closed' && job.status?.status_name === 'Closed')
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Moderation</h1>
          <p className="text-gray-500 mt-1">Review, approve, and manage job postings from employers</p>
        </div>
        <Button variant="outline" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold">{stats.total}</p></div>
              <Briefcase className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Pending Review</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600">{stats.approved}</p></div>
              <ThumbsUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Rejected</p><p className="text-2xl font-bold text-red-600">{stats.rejected}</p></div>
              <ThumbsDown className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 pb-3">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>All Job Listings ({filteredJobs.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64 border-gray-300" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 border-gray-300"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <Alert className="m-4 bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /><AlertDescription>{error}</AlertDescription></Alert>}
          
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-500">Loading jobs...</p></div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12"><Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No jobs found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Job Title & Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Salary</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Applications</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Posted</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-blue-100">
                            {job.employer?.logo_url ? <AvatarImage src={job.employer.logo_url} /> : <AvatarFallback>{getInitials(job.employer?.company_name || 'C')}</AvatarFallback>}
                          </Avatar>
                          <div><p className="font-medium">{job.title}</p><p className="text-sm text-gray-500">{job.employer?.company_name}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{job.is_remote ? 'Remote' : job.location || '-'}</td>
                      <td className="py-3 px-4 text-sm">{formatSalary(job.salary_min, job.salary_max)}</td>
                      <td className="py-3 px-4 text-sm"><Badge variant="outline" className="bg-blue-50">{job.applications_count || 0} Apps</Badge></td>
                      <td className="py-3 px-4">{getStatusBadge(job.status?.status_name)}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(job.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <button
                            onClick={(e) => toggleMenu(job.id, e)}
                            className="inline-flex items-center justify-center rounded-md hover:bg-gray-100 h-8 w-8 p-0 transition-colors"
                            type="button"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          {openMenuId === job.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                              <button
                                onClick={() => openViewDialog(job)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" /> View Details
                              </button>
                              
                              {job.status?.status_name === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => openApproveDialog(job)}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <ThumbsUp className="h-4 w-4" /> Approve Job
                                  </button>
                                  <button
                                    onClick={() => openRejectDialog(job)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <ThumbsDown className="h-4 w-4" /> Reject Job
                                  </button>
                                </>
                              )}
                              
                              {(job.status?.status_name === 'Open' || job.status?.status_name === 'Rejected' || job.status?.status_name === 'Closed') && (
                                <button
                                  onClick={() => openDeleteDialog(job)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete Job
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== VIEW JOB DETAILS DIALOG ========== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl bg-white border border-gray-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              {/* Company Header */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16 bg-blue-100">
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                    {getInitials(selectedJob.employer?.company_name || 'C')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-gray-600">{selectedJob.employer?.company_name}</p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedJob.status?.status_name)}
                    {selectedJob.is_remote && <Badge variant="outline" className="bg-blue-50">Remote</Badge>}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium">{selectedJob.is_remote ? 'Remote' : selectedJob.location || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Salary</p><p className="text-sm font-medium">{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Employment Type</p><p className="text-sm font-medium">{selectedJob.employment_type?.type_name || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Industry</p><p className="text-sm font-medium">{selectedJob.industry?.industry_name || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Applications</p><p className="text-sm font-medium">{selectedJob.applications_count || 0}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Views</p><p className="text-sm font-medium">{selectedJob.views_count || 0}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Posted</p><p className="text-sm font-medium">{formatDate(selectedJob.created_at)}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Updated</p><p className="text-sm font-medium">{formatDate(selectedJob.updated_at)}</p></div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.benefits}</p>
                </div>
              )}

              {/* Employer Contact */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Employer Contact</h3>
                <p className="text-gray-700">{selectedJob.employer?.user?.email}</p>
              </div>

              <DialogFooter>
                {selectedJob.status?.status_name === 'Pending' && (
                  <div className="flex gap-2">
                    <Button onClick={() => { setIsViewDialogOpen(false); openApproveDialog(selectedJob); }} className="bg-green-600">Approve</Button>
                    <Button onClick={() => { setIsViewDialogOpen(false); openRejectDialog(selectedJob); }} variant="destructive">Reject</Button>
                  </div>
                )}
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Job</AlertDialogTitle>
            <AlertDialogDescription>Approve <span className="font-semibold">{selectedJob?.title}</span>? It will become visible to job seekers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveJob} className="bg-green-600">{submitting ? 'Approving...' : 'Approve'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Job</AlertDialogTitle>
            <AlertDialogDescription>Reject <span className="font-semibold">{selectedJob?.title}</span>? The employer will be notified.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <textarea className="w-full min-h-[80px] px-3 py-2 border rounded-md" placeholder="Enter reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectJob} className="bg-red-600">{submitting ? 'Rejecting...' : 'Reject'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <span className="font-semibold">{selectedJob?.title}</span>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-red-600">{submitting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default JobModeration