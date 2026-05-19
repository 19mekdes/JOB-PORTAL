/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Search,
  Eye,
  Mail,
  Download,
  RefreshCw,
  MoreHorizontal,
  Clock,
  CheckCircle,
  FileText,
  MapPin,
  Briefcase,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Application {
  id: string
  job_id: string
  job_title: string
  cover_letter: string
  resume_url: string
  applied_at: string
  updated_at: string
  seeker: {
    id: string
    full_name: string
    email: string
    phone: string | null
    location: string | null
    skills: string[]
    experience: string | null
    education: string | null
    resume_url: string | null
  }
  status: {
    id: number
    status_name: string
  }
  match_score?: number
}

interface JobDetails {
  id: string
  title: string
  location: string
  employment_type: {
    type_name: string
  }
}

const statusOptions = [
  { value: 'all', label: 'All Applications', color: 'bg-gray-500' },
  { value: 'Pending', label: 'Pending Review', color: 'bg-yellow-500' },
  { value: 'Reviewed', label: 'Reviewed', color: 'bg-blue-500' },
  { value: 'Shortlisted', label: 'Shortlisted', color: 'bg-green-500' },
  { value: 'Interview', label: 'Interview', color: 'bg-purple-500' },
  { value: 'Accepted', label: 'Accepted', color: 'bg-green-600' },
  { value: 'Rejected', label: 'Rejected', color: 'bg-red-500' }
]

const JobApplicationsList: React.FC = () => {
  const { jobId } = useParams<{ jobId?: string }>()
  const [applications, setApplications] = useState<Application[]>([])
  const [job, setJob] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (jobId) {
        // Fetch applications for specific job
        const [applicationsRes, jobRes] = await Promise.all([
          api.get(`/applications/job/${jobId}`),
          api.get(`/jobs/${jobId}`)
        ])
        setApplications(applicationsRes.data.data)
        setJob(jobRes.data.data)
      } else {
        // Fetch all applications for employer
        const response = await api.get('/applications/employer/all')
        setApplications(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load applications",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedApplication || !newStatus) return
    
    setIsUpdating(true)
    try {
      await api.put(`/applications/${selectedApplication.id}/status`, {
        status: newStatus,
        feedback: feedback
      })
      toast({
        variant: "success",
        title: "Status Updated",
        description: `Application status changed to ${newStatus}`,
      })
      setIsStatusDialogOpen(false)
      setNewStatus('')
      setFeedback('')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update application status",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status)
    return (
      <Badge className={option?.color}>
        {option?.label || status}
      </Badge>
    )
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.seeker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.seeker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.job_title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || app.status.status_name === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      } else if (sortBy === 'name') {
        return a.seeker.full_name.localeCompare(b.seeker.full_name)
      } else if (sortBy === 'match') {
        return (b.match_score || 0) - (a.match_score || 0)
      }
      return 0
    })

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status.status_name === 'Pending').length,
    reviewed: applications.filter(a => a.status.status_name === 'Reviewed').length,
    shortlisted: applications.filter(a => a.status.status_name === 'Shortlisted').length,
    interview: applications.filter(a => a.status.status_name === 'Interview').length,
    accepted: applications.filter(a => a.status.status_name === 'Accepted').length,
    rejected: applications.filter(a => a.status.status_name === 'Rejected').length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {job ? `Applications for ${job.title}` : 'All Applications'}
          </h1>
          <p className="text-gray-500 mt-1">
            {job ? `Manage candidates for this position` : 'Manage all job applications'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Job Details (if specific job) */}
      {job && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {job.employment_type.type_name}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {applications.length} Applications
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Pending')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Reviewed')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Shortlisted')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
            <p className="text-xs text-gray-500">Shortlisted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Interview')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.interview}</p>
            <p className="text-xs text-gray-500">Interview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Accepted')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
            <p className="text-xs text-gray-500">Accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
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
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Latest First</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="match">Match Score</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setSortBy('date')
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            {filteredApplications.length} applications found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Left Section - Candidate Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {application.seeker.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-lg">{application.seeker.full_name}</h4>
                      <p className="text-sm text-gray-500">{application.seeker.email}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        {application.seeker.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.seeker.location}
                          </span>
                        )}
                        {application.match_score && (
                          <span className={`flex items-center gap-1 ${getMatchScoreColor(application.match_score)}`}>
                            <TrendingUp className="h-3 w-3" />
                            {application.match_score}% match
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Skills Preview */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {application.seeker.skills.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {application.seeker.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{application.seeker.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="flex items-center gap-3 mt-3 md:mt-0">
                    {getStatusBadge(application.status.status_name)}
                    
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
                          setSelectedApplication(application)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${application.seeker.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedApplication(application)
                          setNewStatus('')
                          setFeedback('')
                          setIsStatusDialogOpen(true)
                        }}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        {application.resume_url && (
                          <DropdownMenuItem onClick={() => window.open(application.resume_url, '_blank')}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Resume
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>Application Details</DialogTitle>
                <DialogDescription>
                  Review candidate's application
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="application">Application</TabsTrigger>
                  <TabsTrigger value="skills">Skills & Experience</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                        {selectedApplication.seeker.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedApplication.seeker.full_name}</h3>
                      <p className="text-gray-500">{selectedApplication.seeker.email}</p>
                      {selectedApplication.seeker.phone && (
                        <p className="text-sm text-gray-500">{selectedApplication.seeker.phone}</p>
                      )}
                    </div>
                  </div>
                  {selectedApplication.seeker.location && (
                    <div>
                      <Label>Location</Label>
                      <p className="text-gray-700">{selectedApplication.seeker.location}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="application" className="space-y-4 mt-4">
                  <div>
                    <Label>Cover Letter</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </div>
                  </div>
                  {selectedApplication.resume_url && (
                    <Button variant="outline" onClick={() => window.open(selectedApplication.resume_url, '_blank')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  )}
                </TabsContent>
                
                <TabsContent value="skills" className="space-y-4 mt-4">
                  <div>
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedApplication.seeker.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  {selectedApplication.seeker.experience && (
                    <div>
                      <Label>Experience</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedApplication.seeker.experience}</p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.seeker.education && (
                    <div>
                      <Label>Education</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedApplication.seeker.education}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of this application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.filter(s => s.value !== 'all').map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Feedback (Optional)</Label>
              <Textarea
                placeholder="Add feedback for the candidate..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={!newStatus || isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobApplicationsList