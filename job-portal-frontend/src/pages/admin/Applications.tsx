/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Briefcase,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageSquare
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Application {
  id: string
  cover_letter: string
  resume_url: string
  applied_at: string
  updated_at: string
  job: {
    id: string
    title: string
    location: string
    employer: {
      id: string
      company_name: string
      user: {
        email: string
        full_name: string
      }
    }
  }
  seeker: {
    id: string
    full_name: string
    phone: string
    location: string
    skills: string[]
    user: {
      email: string
      full_name: string
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

const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0
  })

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/applications?page=${page}&limit=20&search=${searchTerm}&status=${statusFilter}`)
      setApplications(response.data.data || [])
      setTotalPages(response.data.pagination?.pages || 1)
      
      if (response.data.stats) {
        setStats(response.data.stats)
      }
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
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      await api.put(`/admin/applications/${applicationId}/status`, { status })
      toast({
        title: "Success",
        description: `Application ${status.toLowerCase()} successfully`,
      })
      fetchApplications()
      setIsDetailOpen(false)
      setIsStatusUpdateOpen(false)
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update application status",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reviewed</Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Shortlisted</Badge>
      case 'interview':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Interview</Badge>
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Accepted
        </Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
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

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.seeker?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status?.status_name === statusFilter
    const matchesTab = activeTab === 'all' || app.status?.status_name.toLowerCase() === activeTab
    return matchesSearch && matchesStatus && matchesTab
  })

  if (loading) {
    return (
      <div className="space-y-4 bg-white rounded-xl p-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">Manage and review all job applications</p>
        </div>
        <Button variant="outline" onClick={() => fetchApplications()} className="bg-white border-gray-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => { setActiveTab('all'); setStatusFilter('all') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-yellow-200 bg-white" onClick={() => { setActiveTab('pending'); setStatusFilter('Pending') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-blue-200 bg-white" onClick={() => { setActiveTab('reviewed'); setStatusFilter('Reviewed') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-purple-200 bg-white" onClick={() => { setActiveTab('shortlisted'); setStatusFilter('Shortlisted') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.shortlisted}</p>
            <p className="text-xs text-gray-500">Shortlisted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-indigo-200 bg-white" onClick={() => { setActiveTab('interview'); setStatusFilter('Interview') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.interview}</p>
            <p className="text-xs text-gray-500">Interview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-green-200 bg-white" onClick={() => { setActiveTab('accepted'); setStatusFilter('Accepted') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            <p className="text-xs text-gray-500">Accepted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-red-200 bg-white" onClick={() => { setActiveTab('rejected'); setStatusFilter('Rejected') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 bg-gray-100">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <CardTitle className="text-gray-900">
                  {activeTab === 'all' ? 'All Applications' : 
                   activeTab === 'pending' ? 'Pending Applications' :
                   activeTab === 'reviewed' ? 'Reviewed Applications' :
                   activeTab === 'shortlisted' ? 'Shortlisted Applications' :
                   activeTab === 'interview' ? 'Interview Applications' :
                   activeTab === 'accepted' ? 'Accepted Applications' : 'Rejected Applications'}
                  <span className="text-sm text-gray-500 ml-2">({filteredApplications.length})</span>
                </CardTitle>
                <div className="flex gap-3 flex-wrap">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by job, applicant, company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white border-gray-300"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white border-gray-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
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
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="text-gray-700">Applicant</TableHead>
                        <TableHead className="text-gray-700">Job</TableHead>
                        <TableHead className="text-gray-700">Company</TableHead>
                        <TableHead className="text-gray-700">Applied</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                        <TableHead className="text-right text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id} className="hover:bg-gray-50 border-b border-gray-100">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 bg-blue-100">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {app.seeker?.full_name?.charAt(0) || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{app.seeker?.full_name}</p>
                                <p className="text-xs text-gray-500">{app.seeker?.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{app.job?.title}</p>
                              <p className="text-xs text-gray-500">{app.job?.location}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{app.job?.employer?.company_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{formatDate(app.applied_at)}</TableCell>
                          <TableCell>{getStatusBadge(app.status?.status_name)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app)
                                setIsDetailOpen(true)
                              }}
                              className="hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-white border-gray-300"
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="bg-white border-gray-300"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5" />
                  Application Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Applicant Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 bg-blue-200">
                      <AvatarFallback className="bg-blue-200 text-blue-700 text-xl">
                        {selectedApp.seeker?.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedApp.seeker?.full_name}</h2>
                      <p className="text-gray-600">{selectedApp.seeker?.user?.email}</p>
                      {selectedApp.seeker?.phone && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {selectedApp.seeker.phone}
                        </div>
                      )}
                      {selectedApp.seeker?.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {selectedApp.seeker.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Information
                  </h3>
                  <p className="font-medium text-gray-900">{selectedApp.job?.title}</p>
                  <p className="text-gray-600">{selectedApp.job?.employer?.company_name}</p>
                  <p className="text-gray-500 text-sm mt-1">{selectedApp.job?.location}</p>
                </div>

                {/* Skills */}
                {selectedApp.seeker?.skills && selectedApp.seeker.skills.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.seeker.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-200 text-gray-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApp.cover_letter && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Cover Letter
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedApp.cover_letter}</p>
                  </div>
                )}

                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedApp.status?.status_name)}
                    <span className="text-sm text-gray-500">
                      Updated: {formatDate(selectedApp.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Update Status */}
                <div className="border-t pt-4 border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex gap-3 flex-wrap">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => updateApplicationStatus(selectedApp.id, newStatus)}
                      disabled={!newStatus || newStatus === selectedApp.status?.status_name}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminApplications