 
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Eye, 
  Users, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  MoreVertical,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Power,
  PowerOff,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Job {
  id: string
  title: string
  location: string
  salary_range: string
  applications_count: number
  views_count: number
  status: {
    id: number
    status_name: string
  }
  created_at: string
}

const EmployerJobs: React.FC = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [actionType, setActionType] = useState<'close' | 'reopen' | 'delete' | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/employer/jobs')
      setJobs(response.data.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load jobs",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseJob = async (job: Job) => {
    try {
      await api.put(`/jobs/${job.id}/status`, { status_id: 2 })
      toast({
        title: "Job Closed",
        description: `${job.title} has been closed. Job seekers will no longer see it.`,
      })
      fetchJobs()
    } catch (error) {
      console.error('Error closing job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to close job",
      })
    }
  }

  const handleReopenJob = async (job: Job) => {
    try {
      await api.put(`/jobs/${job.id}/status`, { status_id: 1 })
      toast({
        title: "Job Reopened",
        description: `${job.title} has been reopened. Job seekers can now see it.`,
      })
      fetchJobs()
    } catch (error) {
      console.error('Error reopening job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reopen job",
      })
    }
  }

  const handleDeleteJob = async (job: Job) => {
    try {
      await api.delete(`/jobs/${job.id}`)
      toast({
        title: "Job Deleted",
        description: `${job.title} has been deleted.`,
      })
      fetchJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job",
      })
    }
  }

  const confirmAction = () => {
    if (!selectedJob) return
    if (actionType === 'close') handleCloseJob(selectedJob)
    else if (actionType === 'reopen') handleReopenJob(selectedJob)
    else if (actionType === 'delete') handleDeleteJob(selectedJob)
    setIsDialogOpen(false)
    setSelectedJob(null)
    setActionType(null)
    setOpenMenuId(null)
  }

  const openConfirmDialog = (job: Job, type: 'close' | 'reopen' | 'delete') => {
    setSelectedJob(job)
    setActionType(type)
    setIsDialogOpen(true)
    setOpenMenuId(null)
  }

  const handleCopyLink = (jobId: string, jobTitle: string) => {
    const link = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(link)
    toast({ 
      title: "Link Copied", 
      description: `Link for ${jobTitle} copied to clipboard` 
    })
    setOpenMenuId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Badge className="bg-green-100 text-green-700 border-0 rounded-full px-3 py-1 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Open
        </Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-600 border-0 rounded-full px-3 py-1 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Closed
        </Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700 border-0 rounded-full px-3 py-1 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Draft
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your job postings</p>
        </div>
        <Button onClick={() => navigate('/employer/post-job')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Post a Job
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Open</p>
          <p className="text-2xl font-bold text-green-600">
            {jobs.filter(j => j.status?.status_name === 'Open').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Closed</p>
          <p className="text-2xl font-bold text-gray-600">
            {jobs.filter(j => j.status?.status_name === 'Closed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">
            {jobs.filter(j => j.status?.status_name === 'Draft').length}
          </p>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
          <p className="text-gray-500 mb-6">Post your first job to start receiving applications</p>
          <Button onClick={() => navigate('/employer/post-job')}>Post a Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <Card key={job.id} className="border border-gray-200 hover:shadow-lg transition-all rounded-xl overflow-hidden">
              <CardContent className="p-5">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 mb-2">
                      {job.title}
                    </h3>
                    {getStatusBadge(job.status?.status_name)}
                  </div>
                  
                  {/* 3-Dot Menu - FIXED */}
                  <DropdownMenu open={openMenuId === job.id} onOpenChange={(open) => setOpenMenuId(open ? job.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                        onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                      <DropdownMenuLabel className="text-gray-900">Job Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Edit Option */}
                      <DropdownMenuItem 
                        onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 mr-2 text-blue-600" />
                        Edit Job
                      </DropdownMenuItem>
                      
                      {/* Copy Link Option */}
                      <DropdownMenuItem 
                        onClick={() => handleCopyLink(job.id, job.title)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4 mr-2 text-gray-600" />
                        Copy Job Link
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Close/Reopen Options */}
                      {job.status?.status_name === 'Open' && (
                        <DropdownMenuItem 
                          onClick={() => openConfirmDialog(job, 'close')}
                          className="cursor-pointer hover:bg-amber-50 text-amber-600"
                        >
                          <PowerOff className="h-4 w-4 mr-2" />
                          Close Job
                          <span className="ml-auto text-xs text-gray-400">Hide from seekers</span>
                        </DropdownMenuItem>
                      )}
                      
                      {job.status?.status_name === 'Closed' && (
                        <DropdownMenuItem 
                          onClick={() => openConfirmDialog(job, 'reopen')}
                          className="cursor-pointer hover:bg-green-50 text-green-600"
                        >
                          <Power className="h-4 w-4 mr-2" />
                          Reopen Job
                          <span className="ml-auto text-xs text-gray-400">Show to seekers</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {/* Delete Option */}
                      <DropdownMenuItem 
                        onClick={() => openConfirmDialog(job, 'delete')}
                        className="cursor-pointer hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Job
                        <span className="ml-auto text-xs text-gray-400">Permanent</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{job.salary_range || 'Competitive salary'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Posted {formatDate(job.created_at)}</span>
                  </div>
                </div>

                {/* Stats & Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{job.applications_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{job.views_count || 0}</span>
                    </div>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className="flex gap-1">
                    {job.status?.status_name === 'Open' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openConfirmDialog(job, 'close')}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2 text-xs"
                        title="Close Job"
                      >
                        <PowerOff className="h-3 w-3" />
                      </Button>
                    )}
                    {job.status?.status_name === 'Closed' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openConfirmDialog(job, 'reopen')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 h-7 px-2 text-xs"
                        title="Reopen Job"
                      >
                        <Power className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2 text-xs"
                      title="Edit Job"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openConfirmDialog(job, 'delete')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                      title="Delete Job"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'close' && 'Close Job Posting'}
              {actionType === 'reopen' && 'Reopen Job Posting'}
              {actionType === 'delete' && 'Delete Job Posting'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'close' && (
                <>
                  Are you sure you want to close <strong>{selectedJob?.title}</strong>?
                  <br />
                  <span className="text-amber-600 text-sm">Closed jobs will not be visible to job seekers.</span>
                </>
              )}
              {actionType === 'reopen' && (
                <>
                  Are you sure you want to reopen <strong>{selectedJob?.title}</strong>?
                  <br />
                  <span className="text-green-600 text-sm">Reopened jobs will be visible to job seekers again.</span>
                </>
              )}
              {actionType === 'delete' && (
                <>
                  Are you sure you want to permanently delete <strong>{selectedJob?.title}</strong>?
                  <br />
                  <span className="text-red-600 text-sm">This action cannot be undone.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                actionType === 'close' ? 'bg-amber-600 hover:bg-amber-700' :
                actionType === 'reopen' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700'
              }
            >
              {actionType === 'close' && 'Yes, Close Job'}
              {actionType === 'reopen' && 'Yes, Reopen Job'}
              {actionType === 'delete' && 'Yes, Delete Job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EmployerJobs