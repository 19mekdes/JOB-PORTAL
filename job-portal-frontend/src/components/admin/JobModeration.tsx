/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search,
  RefreshCw,
  MoreHorizontal,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  TrendingUp,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  _count?: {
    applications: number
    bookmarks: number
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
  const [totalJobs, setTotalJobs] = useState(0)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isModerateDialogOpen, setIsModerateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [moderationNote, setModerationNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

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
      setJobs(response.data.data || [])
      setTotalPages(response.data.pagination?.pages || 1)
      setTotalJobs(response.data.pagination?.total || 0)
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load jobs. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleModerate = async () => {
    if (!selectedJob || !selectedStatus) return

    try {
      // ✅ FIXED: Use the correct endpoint
      await api.put(`/admin/jobs/${selectedJob.id}/status`, {
        status: selectedStatus,
        reason: moderationNote
      })
      
      toast({
        title: "Success",
        description: `Job ${selectedStatus.toLowerCase()} successfully`,
      })
      await fetchJobs()
      setIsModerateDialogOpen(false)
      setSelectedJob(null)
      setModerationNote('')
      setSelectedStatus('')
    } catch (error: any) {
      console.error('Error moderating job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to moderate job. Please try again.",
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
        description: error.response?.data?.message || "Failed to delete job. Please try again.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge className="bg-green-100 text-green-800">Open</Badge>
      case 'Closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      case 'Draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'Archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      case 'Pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate statistics from all jobs (not just current page)
  const [allJobsStats, setAllJobsStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    draft: 0,
    pending: 0,
    totalViews: 0,
    totalApplications: 0
  })

  // Fetch stats separately or calculate from API response
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/jobs?limit=1')
        if (response.data.stats) {
          setAllJobsStats({
            total: response.data.stats.total || 0,
            open: response.data.stats.approved || 0,
            closed: response.data.stats.closed || 0,
            draft: response.data.stats.draft || 0,
            pending: response.data.stats.pending || 0,
            totalViews: 0,
            totalApplications: 0
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  // Calculate stats from current jobs (fallback)
  const currentStats = {
    total: jobs.length,
    open: jobs.filter(j => j.status?.status_name === 'Open').length,
    closed: jobs.filter(j => j.status?.status_name === 'Closed').length,
    draft: jobs.filter(j => j.status?.status_name === 'Draft').length,
    pending: jobs.filter(j => j.status?.status_name === 'Pending').length,
    totalViews: jobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
    totalApplications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)
  }

  const displayStats = allJobsStats.total > 0 ? allJobsStats : currentStats

  if (isLoading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Moderation</h1>
          <p className="text-gray-500 mt-1">Review and manage job postings across all companies</p>
        </div>
        <Button variant="outline" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="h-5 w-5 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{displayStats.total}</p>
              <p className="text-xs text-gray-500">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{displayStats.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-orange-600">{displayStats.pending || 0}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-5 w-5 mx-auto text-gray-500 mb-2" />
              <p className="text-2xl font-bold text-gray-600">{displayStats.closed}</p>
              <p className="text-xs text-gray-500">Closed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="h-5 w-5 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{displayStats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-5 w-5 mx-auto text-indigo-500 mb-2" />
              <p className="text-2xl font-bold">{displayStats.totalApplications.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold">
                {displayStats.totalJobs > 0 
                  ? Math.round((displayStats.open / displayStats.total) * 100) 
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">Open Rate</p>
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
                placeholder="Search by title, description, or company..."
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
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Views/Apps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          {job.is_remote && <Badge variant="outline" className="ml-1">Remote</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(job.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-3 w-3" /> {job.views_count || 0}
                          <Briefcase className="h-3 w-3 ml-1" /> {job.applications_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(job.status?.status_name || 'Unknown')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedJob(job)
                              setIsViewDialogOpen(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedJob(job)
                              setSelectedStatus('')
                              setModerationNote('')
                              setIsModerateDialogOpen(true)
                            }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Moderate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedJob(job)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
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
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderate Job Dialog */}
      <Dialog open={isModerateDialogOpen} onOpenChange={setIsModerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Moderate Job Posting</DialogTitle>
            <DialogDescription>
              Change the status of this job posting and provide a reason if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Job Title</label>
              <p className="text-sm text-gray-600">{selectedJob?.title}</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Current Status</label>
              <div>{selectedJob && getStatusBadge(selectedJob.status?.status_name || 'Unknown')}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open (Approve)</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Moderation Note (Optional)</label>
              <Textarea
                placeholder="Provide a reason for this change..."
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">This note will be shared with the employer.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleModerate} disabled={!selectedStatus}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting
              "<strong>{selectedJob?.title}</strong>" from <strong>{selectedJob?.employer?.company_name}</strong>.
              <br /><br />
              All applications associated with this job will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Yes, Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default JobModeration