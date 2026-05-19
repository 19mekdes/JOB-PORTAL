/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Briefcase,
  Eye,
  Users,
  Edit,
  Trash2,
  Copy,
  Archive,
  MoreHorizontal,
  Search,
  RefreshCw,
  Plus,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/common/LoadingSpinner'
import { toast } from '@/hooks/use-toast'
import { RootState } from '@/redux/store'
import { useJobs } from '@/hooks/useJobs'
import api from '@/services/api'

interface Job {
  id: string
  title: string
  description: string
  location: string
  salary_range: string | null
  is_remote: boolean
  created_at: string
  updated_at: string
  views_count: number
  applications_count: number
  status: {
    id: number
    status_name: string
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

const statusColors: Record<string, string> = {
  Open: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-800',
  Draft: 'bg-yellow-100 text-yellow-800',
  Archived: 'bg-red-100 text-red-800'
}

const ManageJobsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { getEmployerJobs, deleteJob, toggleJobStatus } = useJobs()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
    totalApplications: 0
  })

  useEffect(() => {
    if (user?.user_type === 'Employer') {
      // eslint-disable-next-line react-hooks/immutability
      fetchJobs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const jobsData = await getEmployerJobs()
      setJobs(jobsData)
      
      // Calculate stats
      const open = jobsData.filter((j: Job) => j.status.status_name === 'Open').length
      const closed = jobsData.filter((j: Job) => j.status.status_name === 'Closed').length
      const draft = jobsData.filter((j: Job) => j.status.status_name === 'Draft').length
      const archived = jobsData.filter((j: Job) => j.status.status_name === 'Archived').length
      const totalViews = jobsData.reduce((sum: number, j: Job) => sum + j.views_count, 0)
      const totalApplications = jobsData.reduce((sum: number, j: Job) => sum + j.applications_count, 0)
      
      setStats({
        total: jobsData.length,
        open,
        closed,
        draft,
        archived,
        totalViews,
        totalApplications
      })
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your jobs",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteJob = async () => {
    if (!deleteJobId) return
    
    const success = await deleteJob(deleteJobId)
    if (success) {
      await fetchJobs()
    }
    setIsDeleteDialogOpen(false)
    setDeleteJobId(null)
  }

  const handleToggleStatus = async (jobId: string, _status_name?: string) => {
    const success = await toggleJobStatus(jobId)
    if (success) {
      await fetchJobs()
    }
  }

  const handleDuplicateJob = async (job: Job) => {
    try {
      const { id, created_at, updated_at, views_count, applications_count, ...jobData } = job
      const duplicateData = {
        ...jobData,
        title: `${job.title} (Copy)`,
        status: 'draft'
      }
      await api.post('/jobs', duplicateData)
      toast({
        variant: "success",
        title: "Job Duplicated",
        description: "Job has been duplicated as draft",
      })
      await fetchJobs()
    } catch (error) {
      console.error('Error duplicating job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate job",
      })
    }
  }

  const handleArchiveJob = async (jobId: string) => {
    try {
      await api.patch(`/jobs/${jobId}/archive`)
      toast({
        variant: "success",
        title: "Job Archived",
        description: "Job has been moved to archive",
      })
      await fetchJobs()
    } catch (error) {
      console.error('Error archiving job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to archive job",
      })
    }
  }

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || job.status.status_name === statusFilter
      return matchesSearch && matchesStatus
    })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (user?.user_type !== 'Employer') {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-500">This page is only available for employers</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-500 mt-1">View and manage all your job postings</p>
        </div>
        <Button onClick={() => navigate('/employer/post-job')}>
          <Plus className="h-4 w-4 mr-2" />
          Post a Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.open}</p>
            <p className="text-xs text-gray-500">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-xs text-gray-500">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.totalApplications.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Job Postings</CardTitle>
              <CardDescription>
                {filteredJobs.length} jobs found
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No jobs found</p>
              <Button variant="link" onClick={() => navigate('/employer/post-job')}>
                Post your first job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left Section - Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                              {job.is_remote && <Badge variant="secondary" className="ml-1">Remote</Badge>}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {job.employment_type.type_name}
                            </span>
                            {job.salary_range && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {job.salary_range}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Eye className="h-3 w-3" />
                          {job.views_count} views
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="h-3 w-3" />
                          {job.applications_count} applications
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Right Section - Status & Actions */}
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[job.status.status_name]}>
                        {job.status.status_name}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/jobs/${job.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Job
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Job
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/employer/jobs/${job.id}/applications`)}>
                            <Users className="mr-2 h-4 w-4" />
                            View Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(job.id, job.status.status_name)}>
                            {job.status.status_name === 'Open' ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Close Job
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Reopen Job
                              </>
                            )}
                          </DropdownMenuItem>
                          {job.status.status_name !== 'Archived' && (
                            <DropdownMenuItem onClick={() => handleArchiveJob(job.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setDeleteJobId(job.id)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  {job.status.status_name === 'Open' && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Application Rate</span>
                        <span>{job.views_count > 0 ? Math.round((job.applications_count / job.views_count) * 100) : 0}%</span>
                      </div>
                      <Progress 
                        value={job.views_count > 0 ? (job.applications_count / job.views_count) * 100 : 0} 
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone.
              All applications associated with this job will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ManageJobsPage