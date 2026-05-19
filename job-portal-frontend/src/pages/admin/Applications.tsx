/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  FileText} from 'lucide-react'
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
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Application {
  id: string
  job_id: string
  seeker_id: string
  cover_letter: string
  resume_url: string
  employer_notes: string
  status: {
    id: number
    status_name: string
  }
  applied_at: string
  updated_at: string
  job: {
    id: string
    title: string
    description: string
    location: string
    salary_range: string
    is_remote: boolean
    employer: {
      id: string
      company_name: string
      location: string
      website: string
      logo_url: string
      user: {
        email: string
      }
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
  seeker: {
    id: string
    full_name: string
    phone: string
    email: string
    skills: string[]
    experience: string
    education: string
    location: string
    resume_url: string
    user: {
      email: string
    }
  }
  notes?: Array<{
    id: number
    note_text: string
    created_at: string
    employer: {
      company_name: string
    }
  }>
}

const AdminApplications: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/applications')
      console.log('Applications data:', response.data)
      setApplications(response.data.data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load applications",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reviewed</Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Shortlisted</Badge>
      case 'interview':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Interview</Badge>
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCount = (statusName: string) => {
    return applications.filter(a => a.status?.status_name === statusName).length
  }

  const stats = {
    total: applications.length,
    pending: getStatusCount('Pending'),
    reviewed: getStatusCount('Reviewed'),
    shortlisted: getStatusCount('Shortlisted'),
    interview: getStatusCount('Interview'),
    accepted: getStatusCount('Accepted'),
    rejected: getStatusCount('Rejected')
  }

  const filteredApplications = applications.filter(app => {
    if (!app || !app.job || !app.seeker) return false
    
    const matchesSearch = 
      app.job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.seeker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status?.status_name === statusFilter
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
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">Manage and review all job applications</p>
        </div>
        <div className="flex gap-2">
          {applications.length > 0 && (
            <Button variant="outline" onClick={() => toast({ title: "Export", description: "Export feature coming soon" })}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Button variant="outline" onClick={fetchApplications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('Pending')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('Reviewed')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('Shortlisted')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.shortlisted}</p>
            <p className="text-xs text-gray-500">Shortlisted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('Interview')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.interview}</p>
            <p className="text-xs text-gray-500">Interview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('Accepted')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            <p className="text-xs text-gray-500">Accepted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('Rejected')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Applications ({filteredApplications.length})</CardTitle>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job, applicant, company..."
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
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No applications found</p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button variant="link" onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job / Applicant</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow 
                      key={app.id} 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => {
                        setSelectedApplication(app)
                        setIsDetailOpen(true)
                      }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{app.job?.title || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{app.seeker?.full_name || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{app.job?.employer?.company_name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{app.job?.location || 'Remote'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status?.status_name || 'Unknown')}</TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">{formatDate(app.applied_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Application Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Job Information */}
                <div className="bg-blue-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Job Information</h3>
                  </div>
                  <p className="font-medium text-gray-900">{selectedApplication.job?.title}</p>
                  <p className="text-sm text-gray-600">{selectedApplication.job?.employer?.company_name}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {selectedApplication.job?.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      {selectedApplication.job?.salary_range || 'Competitive'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      {selectedApplication.job?.employment_type?.type_name || 'Full-time'}
                    </span>
                    {selectedApplication.job?.is_remote && (
                      <Badge variant="secondary" className="text-xs">Remote</Badge>
                    )}
                  </div>
                </div>

                {/* Applicant Information */}
                <div className="bg-green-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Applicant Information</h3>
                  </div>
                  <p className="font-medium text-gray-900">{selectedApplication.seeker?.full_name}</p>
                  <div className="space-y-2 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.seeker?.email || selectedApplication.seeker?.user?.email}</span>
                    </div>
                    {selectedApplication.seeker?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedApplication.seeker.phone}</span>
                      </div>
                    )}
                    {selectedApplication.seeker?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{selectedApplication.seeker.location}</span>
                      </div>
                    )}
                  </div>
                  {selectedApplication.seeker?.skills && selectedApplication.seeker.skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplication.seeker.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold">Cover Letter</h3>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                )}

                {/* Status & Timeline */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Status</p>
                      {getStatusBadge(selectedApplication.status?.status_name)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Applied On</p>
                      <p className="text-sm font-medium">{formatDate(selectedApplication.applied_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="text-sm font-medium">{formatDate(selectedApplication.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Application Notes */}
                {selectedApplication.notes && selectedApplication.notes.length > 0 && (
                  <div className="bg-yellow-50 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold">Employer Notes</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedApplication.notes.map((note) => (
                        <div key={note.id} className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-gray-700">{note.note_text}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400">{note.employer?.company_name}</p>
                            <p className="text-xs text-gray-400">{formatDate(note.created_at)}</p>
                          </div>
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

export default AdminApplications