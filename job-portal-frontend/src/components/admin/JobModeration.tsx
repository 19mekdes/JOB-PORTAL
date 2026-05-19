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
  Briefcase} from 'lucide-react'
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
  requirements: import("react/jsx-runtime").JSX.Element
  benefits: import("react/jsx-runtime").JSX.Element
  id: string
  title: string
  description: string
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isModerateDialogOpen, setIsModerateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [moderationNote, setModerationNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    fetchJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setJobs(response.data.data)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load jobs. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleModerate = async () => {
    if (!selectedJob || !selectedStatus) return

    try {
      await api.put(`/admin/jobs/${selectedJob.id}/moderate`, {
        status: selectedStatus,
        moderation_note: moderationNote
      })
      toast({
        variant: "success",
        title: "Success",
        description: `Job ${selectedStatus.toLowerCase()} successfully`,
      })
      await fetchJobs()
      setIsModerateDialogOpen(false)
      setSelectedJob(null)
      setModerationNote('')
      setSelectedStatus('')
    } catch (error) {
      console.error('Error moderating job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to moderate job. Please try again.",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedJob) return

    try {
      await api.delete(`/admin/jobs/${selectedJob.id}`)
      toast({
        variant: "success",
        title: "Success",
        description: "Job deleted successfully",
      })
      await fetchJobs()
      setIsDeleteDialogOpen(false)
      setSelectedJob(null)
    } catch (error) {
      console.error('Error deleting job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job. Please try again.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge variant="success">Open</Badge>
      case 'Closed':
        return <Badge variant="secondary">Closed</Badge>
      case 'Draft':
        return <Badge variant="warning">Draft</Badge>
      case 'Archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status.status_name === 'Open').length,
    closed: jobs.filter(j => j.status.status_name === 'Closed').length,
    draft: jobs.filter(j => j.status.status_name === 'Draft').length,
    totalViews: jobs.reduce((sum, j) => sum + j.views_count, 0),
    totalApplications: jobs.reduce((sum, j) => sum + j.applications_count, 0)
  }

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
          <p className="text-gray-500 mt-1">Review and manage job postings</p>
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
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              <p className="text-xs text-gray-500">Closed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalApplications.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Applications</p>
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
                placeholder="Search by title or description..."
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
                <SelectItem value="Archived">Archived</SelectItem>
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
          <CardDescription>Review and moderate job listings</CardDescription>
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
                          <p>{job.title}</p>
                          <p className="text-xs text-gray-500">{job.employment_type.type_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {job.employer.company_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{job.employer.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                          {job.is_remote && <Badge variant="outline" className="ml-1">Remote</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(job.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-3 w-3" /> {job.views_count}
                          <Briefcase className="h-3 w-3 ml-1" /> {job.applications_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(job.status.status_name)}
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
                  {selectedJob.employer.company_name} • Posted {new Date(selectedJob.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedJob.employment_type.type_name}</Badge>
                  {selectedJob.is_remote && <Badge variant="secondary">Remote</Badge>}
                  <Badge variant="outline">{selectedJob.industry.industry_name}</Badge>
                  {getStatusBadge(selectedJob.status.status_name)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedJob.location}
                  </div>
                  {selectedJob.salary_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {selectedJob.salary_range}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    {selectedJob.views_count} views
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    {selectedJob.applications_count} applications
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Job Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedJob.description}
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
                    <span className="text-sm">{selectedJob.employer.company_name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {selectedJob.employer.user.email}
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
        <DialogContent className="sm:max-w-106.25">
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
              <div>{selectedJob && getStatusBadge(selectedJob.status.status_name)}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting
              "{selectedJob?.title}" from {selectedJob?.employer.company_name}.
              All applications associated with this job will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default JobModeration