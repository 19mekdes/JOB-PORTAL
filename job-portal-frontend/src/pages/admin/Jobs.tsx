/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Building2} from 'lucide-react'
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Job {
  id: string
  title: string
  description: string
  requirements: string
  benefits: string
  location: string
  salary_range: string
  is_remote: boolean
  views_count: number
  applications_count: number
  created_at: string
  status: {
    id: number
    status_name: string
  }
  employer: {
    id: string
    company_name: string
    user: {
      email: string
    }
  }
  industry: {
    industry_name: string
  }
  employment_type: {
    type_name: string
  }
}

const AdminJobs: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/jobs')
      setJobs(response.data.data || [])
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

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      await api.put(`/admin/jobs/${jobId}/status`, { status })
      toast({
        title: "Success",
        description: `Job ${status.toLowerCase()} successfully`,
      })
      fetchJobs()
      setIsDetailOpen(false)
      setIsRejectOpen(false)
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case 'closed':
        return <Badge className="bg-blue-100 text-blue-800">Closed</Badge>
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

  const getStats = () => {
    const total = jobs.length
    const pending = jobs.filter(j => j.status?.status_name === 'Pending').length
    const approved = jobs.filter(j => j.status?.status_name === 'Open').length
    const rejected = jobs.filter(j => j.status?.status_name === 'Rejected').length
    const closed = jobs.filter(j => j.status?.status_name === 'Closed').length

    return { total, pending, approved, rejected, closed }
  }

  const stats = getStats()

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status?.status_name === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Moderation</h1>
          <p className="text-gray-500 mt-1">Review, approve, and manage job postings</p>
        </div>
        <Button variant="outline" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.closed}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Jobs ({filteredJobs.length})</CardTitle>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-500">ID: {job.id.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{job.employer?.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{job.location || 'Remote'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(job.created_at)}</TableCell>
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
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {job.status?.status_name === 'Pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600"
                                onClick={() => updateJobStatus(job.id, 'Open')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600"
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
                            className="text-red-600"
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Job Header */}
                <div className="bg-blue-50 p-5 rounded-xl">
                  <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedJob.employer?.company_name}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {selectedJob.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      {selectedJob.salary_range || 'Competitive'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      {selectedJob.employment_type?.type_name || 'Full-time'}
                    </span>
                    {selectedJob.is_remote && (
                      <Badge variant="secondary" className="text-xs">Remote</Badge>
                    )}
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
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Moderation Actions</h3>
                  <div className="flex gap-3">
                    {selectedJob.status?.status_name === 'Pending' && (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateJobStatus(selectedJob.id, 'Open')}
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

      {/* Reject Job Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejecting this job..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the employer.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedJob && updateJobStatus(selectedJob.id, 'Rejected')}
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