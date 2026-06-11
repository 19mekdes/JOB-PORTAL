/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, Eye, RefreshCw, AlertCircle, FileText, 
  CheckCircle, XCircle, Clock, UserCheck, Users,
  Mail, Download,
  MoreVertical, Send} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

// Types
interface Application {
  id: string
  job_id: string
  seeker_id: string
  cover_letter: string | null
  resume_url: string | null
  applied_at: string
  updated_at: string
  status_id: number
  job: {
    id: string
    title: string
    location: string
    is_remote: boolean
    salary_min: number | null
    salary_max: number | null
    employer: {
      id: string
      company_name: string
      logo_url: string | null
      user: {
        email: string
      }
    }
    employment_type: {
      id: number
      type_name: string
    } | null
  }
  seeker: {
    id: string
    full_name: string
    phone: string | null
    location: string | null
    avatar: string | null
    skills: string[]
    user: {
      email: string
    }
  }
  status: {
    id: number
    status_name: string
  }
}

interface ApplicationStats {
  total: number
  pending: number
  reviewed: number
  shortlisted: number
  interview: number
  accepted: number
  rejected: number
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0
  })

  // Fetch applications from backend
  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching applications from /admin/applications...')
      const response = await api.get('/admin/applications')
      console.log('Applications response:', response.data)
      
      let allApplications: Application[] = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        allApplications = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        allApplications = response.data
      }
      
      setApplications(allApplications)
      
      // Calculate stats
      const appStats: ApplicationStats = {
        total: allApplications.length,
        pending: allApplications.filter(a => a.status?.status_name === 'Pending').length,
        reviewed: allApplications.filter(a => a.status?.status_name === 'Reviewed').length,
        shortlisted: allApplications.filter(a => a.status?.status_name === 'Shortlisted').length,
        interview: allApplications.filter(a => a.status?.status_name === 'Interview').length,
        accepted: allApplications.filter(a => a.status?.status_name === 'Accepted').length,
        rejected: allApplications.filter(a => a.status?.status_name === 'Rejected').length
      }
      setStats(appStats)
      
    } catch (err: any) {
      console.error('Failed to fetch applications:', err)
      setError(err.message || 'Failed to fetch applications')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplications()
  }, [fetchApplications])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Toggle menu
  const toggleMenu = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === appId ? null : appId)
  }

  // Update application status
  const handleUpdateStatus = async () => {
    if (!selectedApplication || !newStatus) return
    
    setSubmitting(true)
    try {
      // Find status ID
      const statusMap: Record<string, number> = {
        'Pending': 1,
        'Reviewed': 2,
        'Shortlisted': 3,
        'Interview': 4,
        'Accepted': 5,
        'Rejected': 6
      }
      
      const statusId = statusMap[newStatus] || 1
      
      await api.put(`/admin/applications/${selectedApplication.id}/status`, { 
        status: newStatus,
        status_id: statusId
      })
      
      toast({ title: "Success", description: `Application status updated to ${newStatus}` })
      setIsStatusDialogOpen(false)
      setOpenMenuId(null)
      fetchApplications()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to update status" })
    } finally {
      setSubmitting(false)
    }
  }

  const openViewDialog = (application: Application) => {
    setSelectedApplication(application)
    setIsViewDialogOpen(true)
    setOpenMenuId(null)
  }

  const openStatusDialog = (application: Application) => {
    setSelectedApplication(application)
    setNewStatus(application.status?.status_name || 'Pending')
    setIsStatusDialogOpen(true)
    setOpenMenuId(null)
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <UserCheck className="h-3 w-3 mr-1" /> Reviewed
        </Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Shortlisted
        </Badge>
      case 'interview':
        return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
          <Users className="h-3 w-3 mr-1" /> Interview
        </Badge>
      case 'accepted':
        return <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Accepted
        </Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" /> Rejected
        </Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status || 'Unknown'}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const getInitials = (name: string) => {
    if (!name) return 'JD'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.seeker?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.seeker?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
      app.status?.status_name?.toLowerCase() === filterStatus.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications Management</h1>
          <p className="text-gray-500 mt-1">Monitor and manage all job applications across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchApplications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => {
            toast({ title: "Export", description: "Export feature coming soon" })
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reviewed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold text-purple-600">{stats.shortlisted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interview</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.interview}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 pb-3">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="text-gray-900">All Applications ({filteredApplications.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, job, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80 border-gray-300"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 border-gray-300 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert className="m-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Applicant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Job & Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Applied Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-blue-100">
                            {app.seeker?.avatar ? (
                              <AvatarImage src={app.seeker.avatar} />
                            ) : (
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                {getInitials(app.seeker?.full_name || 'User')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{app.seeker?.full_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{app.seeker?.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{app.job?.title || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{app.job?.employer?.company_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {app.job?.is_remote ? 'Remote' : app.job?.location || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(app.applied_at)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(app.status?.status_name)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <button
                            onClick={(e) => toggleMenu(app.id, e)}
                            className="inline-flex items-center justify-center rounded-md hover:bg-gray-100 h-8 w-8 p-0 transition-colors"
                            type="button"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          {openMenuId === app.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                              <button
                                onClick={() => openViewDialog(app)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" /> View Details
                              </button>
                              <button
                                onClick={() => openStatusDialog(app)}
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <Send className="h-4 w-4" /> Update Status
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => {
                                  window.location.href = `mailto:${app.seeker?.user?.email}`
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" /> Contact Applicant
                              </button>
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

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl bg-white border border-gray-200 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Application Details</DialogTitle>
            <DialogDescription>Detailed information about the job application</DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16 bg-blue-100">
                  {selectedApplication.seeker?.avatar ? (
                    <AvatarImage src={selectedApplication.seeker.avatar} />
                  ) : (
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                      {getInitials(selectedApplication.seeker?.full_name || 'User')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedApplication.seeker?.full_name}</h3>
                  <p className="text-gray-500">{selectedApplication.seeker?.user?.email}</p>
                  {selectedApplication.seeker?.phone && (
                    <p className="text-sm text-gray-500 mt-1">{selectedApplication.seeker.phone}</p>
                  )}
                  {selectedApplication.seeker?.location && (
                    <p className="text-sm text-gray-500">{selectedApplication.seeker.location}</p>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedApplication.status?.status_name)}
                </div>
              </div>

              {/* Job Info */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Job Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{selectedApplication.job?.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{selectedApplication.job?.employer?.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>{selectedApplication.job?.is_remote ? 'Remote' : selectedApplication.job?.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    <p>{selectedApplication.job?.employment_type?.type_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Cover Letter</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              )}

              {/* Resume */}
              {selectedApplication.resume_url && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Resume</h4>
                  <a 
                    href={selectedApplication.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Resume
                  </a>
                </div>
              )}

              {/* Skills */}
              {selectedApplication.seeker?.skills && selectedApplication.seeker.skills.length > 0 && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.seeker.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Timeline */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Application Timeline</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Applied:</span>
                    <span className="text-sm">{formatDate(selectedApplication.applied_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Updated:</span>
                    <span className="text-sm">{formatDate(selectedApplication.updated_at)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false)
                  openStatusDialog(selectedApplication)
                }} className="bg-blue-600 hover:bg-blue-700">
                  Update Status
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Application Status</DialogTitle>
            <DialogDescription>
              Update status for <span className="font-semibold">{selectedApplication?.seeker?.full_name}</span>'s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-700 font-medium">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1.5 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Applications