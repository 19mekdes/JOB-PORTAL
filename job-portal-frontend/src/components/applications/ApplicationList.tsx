import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Clock, 
  Eye, 
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Users,
  FileText,
  Calendar,
  TrendingUp} from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Application {
  id: string
  job_id: string
  cover_letter: string
  resume_url: string
  applied_at: string
  updated_at: string
  status: {
    id: number
    status_name: string
  }
  job: {
    id: string
    title: string
    location: string
    salary_range: string
    created_at: string
    is_remote: boolean
    employer: {
      company_name: string
      logo_url: string | null
    }
    employment_type: {
      type_name: string
    }
    industry: {
      industry_name: string
    }
  }
  notes?: Array<{
    id: number
    note_text: string
    created_at: string
    employer: {
      user: {
        email: string
      }
      company_name: string
    }
  }>
}

interface ApplicationStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
  }>
  byMonth: Array<{
    month: string
    count: number
  }>
}

const ApplicationList: React.FC = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/applications/my-applications')
      setApplications(response.data.data)
      setStats(response.data.statistics)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your applications",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/applications/my-applications/${applicationId}/withdraw`)
      toast({
        variant: "success",
        title: "Application Withdrawn",
        description: "Your application has been withdrawn successfully",
      })
      fetchApplications()
    } catch (error) {
      console.error('Error withdrawing application:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to withdraw application",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="warning" className="bg-yellow-500">Pending Review</Badge>
      case 'Reviewed':
        return <Badge variant="info" className="bg-blue-500">Reviewed</Badge>
      case 'Shortlisted':
        return <Badge variant="success" className="bg-green-500">Shortlisted</Badge>
      case 'Interview':
        return <Badge variant="info" className="bg-purple-500">Interview Scheduled</Badge>
      case 'Accepted':
        return <Badge variant="success">Accepted! 🎉</Badge>
      case 'Rejected':
        return <Badge variant="destructive">Not Selected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'Reviewed':
        return <Eye className="h-5 w-5 text-blue-500" />
      case 'Shortlisted':
        return <Users className="h-5 w-5 text-green-500" />
      case 'Interview':
        return <Calendar className="h-5 w-5 text-purple-500" />
      case 'Accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.job.employer.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status.status_name === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status.status_name] = (acc[app.status.status_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading your applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">Track and manage your job applications</p>
        </div>
        <Button variant="outline" onClick={fetchApplications}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-gray-500">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <ClockIcon className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{statusCounts['Pending'] || 0}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {(statusCounts['Shortlisted'] || 0) + (statusCounts['Interview'] || 0) + (statusCounts['Accepted'] || 0)}
              </p>
              <p className="text-xs text-gray-500">Positive Responses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-purple-600">{stats?.byMonth[0]?.count || 0}</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Timeline Chart */}
      {stats?.byMonth && stats.byMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Trend</CardTitle>
            <CardDescription>Monthly application activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byMonth.slice(0, 6).map((month) => (
                <div key={month.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{month.month}</span>
                    <span>{month.count} applications</span>
                  </div>
                  <Progress value={(month.count / Math.max(...stats.byMonth.map(m => m.count), 1)) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending Review</SelectItem>
                <SelectItem value="Reviewed">Reviewed</SelectItem>
                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Not Selected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your filters" 
                  : "You haven't applied to any jobs yet"}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate('/jobs')}>
                  Browse Jobs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Section - Job Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {getStatusIcon(application.status.status_name)}
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => navigate(`/jobs/${application.job.id}`)}
                        >
                          {application.job.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span>{application.job.employer.company_name}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.job.location}
                            {application.job.is_remote && <Badge variant="outline" className="ml-1">Remote</Badge>}
                          </div>
                          {application.job.salary_range && (
                            <div className="flex items-center gap-1">
                              💰 {application.job.salary_range}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {application.job.employment_type.type_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(application.status.status_name)}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      {application.status.status_name === 'Pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleWithdraw(application.id)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Application Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedApplication.job.title}</DialogTitle>
                <DialogDescription>
                  {selectedApplication.job.employer.company_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status Section */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Application Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedApplication.status.status_name)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Applied on</p>
                    <p className="font-medium">
                      {new Date(selectedApplication.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Application Timeline */}
                <div>
                  <h4 className="font-semibold mb-3">Application Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Application Submitted</p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedApplication.applied_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedApplication.status.status_name !== 'Pending' && (
                      <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Application {selectedApplication.status.status_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedApplication.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Job Details */}
                <div>
                  <h4 className="font-semibold mb-3">Job Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p>{selectedApplication.job.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Employment Type</p>
                      <p>{selectedApplication.job.employment_type.type_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Industry</p>
                      <p>{selectedApplication.job.industry.industry_name}</p>
                    </div>
                    {selectedApplication.job.salary_range && (
                      <div>
                        <p className="text-gray-500">Salary Range</p>
                        <p>{selectedApplication.job.salary_range}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <h4 className="font-semibold mb-2">Your Cover Letter</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                </div>

                {/* Resume */}
                {selectedApplication.resume_url && (
                  <div>
                    <h4 className="font-semibold mb-2">Resume/CV</h4>
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedApplication.resume_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </Button>
                  </div>
                )}

                {/* Employer Notes */}
                {selectedApplication.notes && selectedApplication.notes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Employer Notes</h4>
                    <div className="space-y-3">
                      {selectedApplication.notes.map((note) => (
                        <div key={note.id} className="bg-blue-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{note.employer.company_name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{note.note_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApplicationList