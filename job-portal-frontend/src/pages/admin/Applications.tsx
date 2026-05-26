/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
 
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
  MessageSquare,
  Download,
  Filter,
  Calendar,
  Building2,
  Mail,
  User,
  TrendingUp,
  AlertCircle
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
    is_remote: boolean
    salary_range: string
    employer: {
      id: string
      company_name: string
      logo_url: string
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
    experience: string
    education: string
    bio: string
    user: {
      email: string
      full_name: string
    }
  }
  status: {
    id: number
    status_name: string
  }
  employer_notes?: string
}

interface ApplicationStats {
  total: number
  pending: number
  reviewed: number
  shortlisted: number
  interview: number
  accepted: number
  rejected: number
  conversionRate: number
}

const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [dateRange] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [, setIsStatusUpdateOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [moderationNote, setModerationNote] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [companies, setCompanies] = useState<string[]>([])
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    conversionRate: 0
  })

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (companyFilter !== 'all') params.append('company', companyFilter)
      if (dateRange !== 'all') params.append('date_range', dateRange)
      
      const response = await api.get(`/admin/applications?${params.toString()}`)
      setApplications(response.data.data || [])
      setTotalPages(response.data.pagination?.pages || 1)
      
      if (response.data.stats) {
        const totalProcessed = response.data.stats.reviewed + response.data.stats.shortlisted + 
                               response.data.stats.interview + response.data.stats.accepted + 
                               response.data.stats.rejected
        const conversionRate = totalProcessed > 0 
          ? Math.round((response.data.stats.accepted / totalProcessed) * 100) 
          : 0
        setStats({
          ...response.data.stats,
          conversionRate
        })
      }
      
      // Extract unique companies for filter
      const uniqueCompanies = [...new Set(response.data.data.map((app: Application) => app.job?.employer?.company_name).filter(Boolean))]
      setCompanies(uniqueCompanies as string[])
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
  }, [page, searchTerm, statusFilter, companyFilter, dateRange])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const updateApplicationStatus = async (applicationId: string, status: string, note?: string) => {
    try {
      await api.put(`/admin/applications/${applicationId}/status`, { 
        status, 
        note 
      })
      toast({
        title: "Success",
        description: `Application ${status.toLowerCase()} successfully`,
      })
      fetchApplications()
      setIsDetailOpen(false)
      setIsStatusUpdateOpen(false)
      setNewStatus('')
      setModerationNote('')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update application status",
      })
    }
  }

  const exportToCSV = () => {
    const headers = ['Applicant Name', 'Email', 'Job Title', 'Company', 'Applied Date', 'Status']
    const csvData = applications.map(app => [
      app.seeker?.full_name,
      app.seeker?.user?.email,
      app.job?.title,
      app.job?.employer?.company_name,
      formatDate(app.applied_at),
      app.status?.status_name
    ])
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Started",
      description: "Applications exported to CSV",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Reviewed
        </Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
          <Star className="h-3 w-3" />
          Shortlisted
        </Badge>
      case 'interview':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Interview
        </Badge>
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

  const getTimeAgo = (date: string) => {
    // eslint-disable-next-line react-hooks/purity
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.seeker?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status?.status_name === statusFilter
    const matchesCompany = companyFilter === 'all' || app.job?.employer?.company_name === companyFilter
    const matchesTab = activeTab === 'all' || app.status?.status_name.toLowerCase() === activeTab
    return matchesSearch && matchesStatus && matchesCompany && matchesTab
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications Management</h1>
          <p className="text-gray-500 mt-1">Monitor and moderate all job applications across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="bg-white border-gray-300">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => fetchApplications()} className="bg-white border-gray-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => { setActiveTab('all'); setStatusFilter('all'); setCompanyFilter('all') }}>
          <CardContent className="pt-4 text-center">
            <FileText className="h-5 w-5 mx-auto text-gray-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-yellow-200 bg-white" onClick={() => { setActiveTab('pending'); setStatusFilter('Pending') }}>
          <CardContent className="pt-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-blue-200 bg-white" onClick={() => { setActiveTab('reviewed'); setStatusFilter('Reviewed') }}>
          <CardContent className="pt-4 text-center">
            <Eye className="h-5 w-5 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-purple-200 bg-white" onClick={() => { setActiveTab('shortlisted'); setStatusFilter('Shortlisted') }}>
          <CardContent className="pt-4 text-center">
            <Star className="h-5 w-5 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.shortlisted}</p>
            <p className="text-xs text-gray-500">Shortlisted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-indigo-200 bg-white" onClick={() => { setActiveTab('interview'); setStatusFilter('Interview') }}>
          <CardContent className="pt-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-indigo-600">{stats.interview}</p>
            <p className="text-xs text-gray-500">Interview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-green-200 bg-white" onClick={() => { setActiveTab('accepted'); setStatusFilter('Accepted') }}>
          <CardContent className="pt-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            <p className="text-xs text-gray-500">Accepted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-red-200 bg-white" onClick={() => { setActiveTab('rejected'); setStatusFilter('Rejected') }}>
          <CardContent className="pt-4 text-center">
            <XCircle className="h-5 w-5 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500">Acceptance Rate</p>
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
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
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
                  {companies.length > 0 && (
                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                      <SelectTrigger className="w-48 bg-white border-gray-300">
                        <SelectValue placeholder="Filter by company" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map(company => (
                          <SelectItem key={company} value={company}>{company}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{app.job?.employer?.company_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-700">{formatDate(app.applied_at)}</p>
                              <p className="text-xs text-gray-400">{getTimeAgo(app.applied_at)}</p>
                            </div>
                          </TableCell>
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
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5" />
                  Application Details
                </DialogTitle>
                <DialogDescription>
                  Review complete application information and update status
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg ${
                  selectedApp.status?.status_name === 'Pending' ? 'bg-yellow-50 border border-yellow-200' :
                  selectedApp.status?.status_name === 'Accepted' ? 'bg-green-50 border border-green-200' :
                  selectedApp.status?.status_name === 'Rejected' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        selectedApp.status?.status_name === 'Pending' ? 'bg-yellow-100' :
                        selectedApp.status?.status_name === 'Accepted' ? 'bg-green-100' :
                        selectedApp.status?.status_name === 'Rejected' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {selectedApp.status?.status_name === 'Pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                        {selectedApp.status?.status_name === 'Reviewed' && <Eye className="h-5 w-5 text-blue-600" />}
                        {selectedApp.status?.status_name === 'Shortlisted' && <Star className="h-5 w-5 text-purple-600" />}
                        {selectedApp.status?.status_name === 'Interview' && <Calendar className="h-5 w-5 text-indigo-600" />}
                        {selectedApp.status?.status_name === 'Accepted' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {selectedApp.status?.status_name === 'Rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Status</p>
                        <p className="font-semibold text-gray-900">{selectedApp.status?.status_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm text-gray-700">{formatDate(selectedApp.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Applicant Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Applicant Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApp.seeker?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-700">{selectedApp.seeker?.user?.email}</p>
                        </div>
                      </div>
                      {selectedApp.seeker?.phone && (
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <p className="text-sm text-gray-700">{selectedApp.seeker.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedApp.seeker?.location && (
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <p className="text-sm text-gray-700">{selectedApp.seeker.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Job Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Position</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApp.job?.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-700">{selectedApp.job?.employer?.company_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm text-gray-700">{selectedApp.job?.location}</p>
                      </div>
                      {selectedApp.job?.salary_range && (
                        <div>
                          <p className="text-xs text-gray-500">Salary Range</p>
                          <p className="text-sm text-gray-700">{selectedApp.job.salary_range}</p>
                        </div>
                      )}
                    </div>
                  </div>
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

                {/* Resume Link */}
                {selectedApp.resume_url && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Resume</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(selectedApp.resume_url, '_blank')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  </div>
                )}

                {/* Admin Note (if exists) */}
                {selectedApp.employer_notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Admin Note
                    </h3>
                    <p className="text-sm text-gray-700">{selectedApp.employer_notes}</p>
                  </div>
                )}

                <Separator />

                {/* Update Status Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Update Application Status</h3>
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
                    <Input
                      placeholder="Add a note (optional)"
                      value={moderationNote}
                      onChange={(e) => setModerationNote(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => updateApplicationStatus(selectedApp.id, newStatus, moderationNote)}
                      disabled={!newStatus || newStatus === selectedApp.status?.status_name}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Update Status
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: The applicant will be notified via email when you update the status.
                  </p>
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