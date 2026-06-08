/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search,
  RefreshCw,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Users
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Job {
  id: string
  title: string
  description: string
  requirements: string
  benefits: string
  location: string
  salary_range: string
  created_at: string
  updated_at: string
  views_count: number
  applications_count: number
  is_remote: boolean
  employer: {
    id: string
    company_name: string
    logo_url: string | null
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

interface JobFilters {
  search: string
  status: string
  employer: string
  page: number
  limit: number
}

const JobModeration: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    status: 'all',
    employer: '',
    page: 1,
    limit: 10
  })
  const [totalPages, setTotalPages] = useState(1)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    closed: 0,
    totalViews: 0,
    totalApplications: 0
  })

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.employer) params.append('employer', filters.employer)
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())

      const response = await api.get(`/admin/jobs?${params.toString()}`)
      
      let jobsData = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        jobsData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        jobsData = response.data
      }
      
      // Filter out invalid/corrupt jobs
      const validJobs = jobsData.filter(job => {
        return job && 
               job.id && 
               job.title && 
               typeof job.title === 'string' &&
               job.title.trim().length > 0 &&
               job.title.trim() !== 'M' &&
               job.title.trim() !== 'A' &&
               job.title.trim() !== 'C' &&
               !job.title.toLowerCase().includes('activate') &&
               !job.title.toLowerCase().includes('settings') &&
               !job.title.toLowerCase().includes('windows')
      })
      
      setJobs(validJobs)
      setTotalPages(response.data?.pagination?.pages || 1)
      
      if (response.data?.stats) {
        setStats({
          total: response.data.stats.total || validJobs.length,
          pending: response.data.stats.pending || 0,
          approved: response.data.stats.approved || response.data.stats.open || 0,
          rejected: response.data.stats.rejected || 0,
          closed: response.data.stats.closed || 0,
          totalViews: 0,
          totalApplications: 0
        })
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load jobs",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ========== CORRECTED: Approve Job ==========
  const handleApprove = async () => {
    if (!selectedJob) return

    try {
      console.log('Approving job:', selectedJob.id)
      const response = await api.put(`/admin/jobs/${selectedJob.id}/approve`, {})
      console.log('Approve response:', response.data)
      
      toast({
        title: "Success",
        description: "Job approved successfully",
      })
      await fetchJobs()
      setIsApproveDialogOpen(false)
      setSelectedJob(null)
    } catch (error: any) {
      console.error('Error approving job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to approve job",
      })
    }
  }

  // ========== CORRECTED: Reject Job ==========
  const handleReject = async () => {
    if (!selectedJob) return

    try {
      console.log('Rejecting job:', selectedJob.id, 'Reason:', rejectReason)
      const response = await api.put(`/admin/jobs/${selectedJob.id}/reject`, { reason: rejectReason })
      console.log('Reject response:', response.data)
      
      toast({
        title: "Success",
        description: "Job rejected successfully",
      })
      await fetchJobs()
      setIsRejectDialogOpen(false)
      setSelectedJob(null)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error rejecting job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to reject job",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedJob) return

    try {
      await api.delete(`/admin/jobs/${selectedJob.id}`)
      toast({
        title: "Success",
        description: "Job deleted successfully",
      })
      await fetchJobs()
      setIsDeleteDialogOpen(false)
      setSelectedJob(null)
    } catch (error: any) {
      console.error('Error deleting job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete job",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>
      case 'Closed':
        return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1"><XCircle className="h-3 w-3" /> Closed</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Moderation</h1>
          <p className="text-gray-500 mt-1">Review and manage job postings from all companies</p>
        </div>
        <Button variant="outline" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="h-5 w-5 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-5 w-5 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-5 w-5 mx-auto text-gray-500 mb-2" />
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              <p className="text-xs text-gray-500">Closed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title or company..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Open">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by employer name..."
              value={filters.employer}
              onChange={(e) => setFilters({ ...filters, employer: e.target.value, page: 1 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Postings</CardTitle>
          <CardDescription>Review and moderate job listings from all companies</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">No jobs found</p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Job Title</TableHead>
                      <TableHead className="w-[180px]">Company</TableHead>
                      <TableHead className="w-[150px]">Location</TableHead>
                      <TableHead className="w-[100px]">Posted</TableHead>
                      <TableHead className="w-[60px] text-center">Apps</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[100px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{job.title}</p>
                            <p className="text-xs text-gray-500">{job.employment_type?.type_name || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {job.employer?.company_name?.charAt(0).toUpperCase() || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{job.employer?.company_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {job.location || 'Not specified'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium text-blue-600">
                            {job.applications_count || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status?.status_name || 'Unknown')}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job)
                                setIsViewDialogOpen(true)
                              }}
                              title="View Details"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job)
                                setIsDeleteDialogOpen(true)
                              }}
                              title="Delete Job"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {filters.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  {selectedJob.employer?.company_name || 'Unknown Company'} • Posted {new Date(selectedJob.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedJob.employment_type?.type_name || 'N/A'}</Badge>
                  {selectedJob.is_remote && <Badge variant="secondary">Remote</Badge>}
                  <Badge variant="outline">{selectedJob.industry?.industry_name || 'N/A'}</Badge>
                  {getStatusBadge(selectedJob.status?.status_name || 'Unknown')}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedJob.location || 'Not specified'}
                  </div>
                  {selectedJob.salary_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {selectedJob.salary_range}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    {selectedJob.views_count || 0} views
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    {selectedJob.applications_count || 0} applications
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Job Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedJob.description || 'No description provided'}
                  </p>
                </div>

                {selectedJob.requirements && (
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedJob.requirements}
                    </p>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div>
                    <h4 className="font-semibold mb-2">Benefits</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedJob.benefits}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">About the Employer</h4>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedJob.employer?.company_name || 'Unknown'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {selectedJob.employer?.user?.email || 'No email available'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedJob.status?.status_name === 'Pending' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setIsViewDialogOpen(false)
                        setIsApproveDialogOpen(true)
                      }} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve Job
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsViewDialogOpen(false)
                        setIsRejectDialogOpen(true)
                      }} 
                      variant="destructive"
                    >
                      Reject Job
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{selectedJob?.title}"?
              <br />
              This job will become visible to all job seekers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject "{selectedJob?.title}"?
              <br />
              The employer will be notified with your reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason (Optional)</label>
            <Textarea
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
              Reject Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedJob?.title}"?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default JobModeration