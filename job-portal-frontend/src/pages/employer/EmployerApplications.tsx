/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Clock, 
  Briefcase, 
  Mail, 
  MapPin, 
  Calendar,
  Eye,
  Star,
  FileText,
  ArrowLeft,
  Search,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
  MessageCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import api from '@/services/api'
import { toast } from '@/hooks/use-toast'

interface Application {
  id: string
  job_title?: string      
  candidate_name?: string 
  candidate_email?: string
  location?: string       
  job?: {
    title: string
    location: string
  }
  seeker?: {
    full_name: string
    location?: string
    user?: {
      email: string
      full_name?: string
    }
  }
  status?: {
    status_name: string
  }
  applied_at: string
  cover_letter?: string
  resume_url?: string
}

const EmployerApplications: React.FC = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/employer/applications')
      console.log('API Response:', response.data)
      
      let appsData = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        appsData = response.data.data
      } else if (Array.isArray(response.data)) {
        appsData = response.data
      } else {
        appsData = []
      }
      
      setApplications(appsData)
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
    if (!status) return <Badge variant="secondary" className="rounded-full px-3 py-1">Pending</Badge>
    
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-700 border-0 rounded-full px-3 py-1">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-50 text-blue-700 border-0 rounded-full px-3 py-1">Reviewed</Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-50 text-purple-700 border-0 rounded-full px-3 py-1">Shortlisted</Badge>
      case 'interview':
        return <Badge className="bg-indigo-50 text-indigo-700 border-0 rounded-full px-3 py-1">Interview</Badge>
      case 'accepted':
        return <Badge className="bg-emerald-50 text-emerald-700 border-0 rounded-full px-3 py-1">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-0 rounded-full px-3 py-1">Rejected</Badge>
      default:
        return <Badge variant="secondary" className="rounded-full px-3 py-1">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="h-3 w-3 text-amber-500" />
    
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-500" />
      case 'accepted':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />
      case 'rejected':
        return <XCircle className="h-3 w-3 text-rose-500" />
      default:
        return <Star className="h-3 w-3 text-blue-500" />
    }
  }

  const getTimeAgo = (date: string) => {
    if (!date) return 'Recently'
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return `${Math.floor(diff / 7)} weeks ago`
  }

  const getUserInitial = (name: string) => {
    if (!name || name === 'Unknown Candidate') return 'U'
    return name.charAt(0).toUpperCase()
  }

  // FIXED: Bulletproof fallbacks matching both explicit nested joins and flat server responses
  const getSeekerName = (application: Application) => {
    return application.candidate_name || 
           application.seeker?.full_name || 
           application.seeker?.user?.full_name || 
           'Unknown Candidate'
  }

  const getSeekerEmail = (application: Application) => {
    return application.candidate_email || 
           application.seeker?.user?.email || 
           'No email provided'
  }

  const getJobTitle = (application: Application) => {
    return application.job_title || 
           application.job?.title || 
           'Unknown Job Position'
  }

  const getSeekerLocation = (application: Application) => {
    return application.location || 
           application.job?.location || 
           application.seeker?.location || 
           'Location not specified'
  }

  const filteredApplications = applications.filter(app => {
    const seekerName = getSeekerName(app).toLowerCase()
    const jobTitle = getJobTitle(app).toLowerCase()
    const seekerEmail = getSeekerEmail(app).toLowerCase()
    
    const matchesSearch = searchTerm === '' || 
      seekerName.includes(searchTerm.toLowerCase()) ||
      jobTitle.includes(searchTerm.toLowerCase()) ||
      seekerEmail.includes(searchTerm.toLowerCase())
    
    const appStatus = app.status?.status_name || 'Pending'
    const matchesStatus = statusFilter === 'all' || appStatus.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(a => (a.status?.status_name || 'Pending') === 'Pending').length,
    shortlisted: applications.filter(a => a.status?.status_name === 'Shortlisted').length,
    interview: applications.filter(a => a.status?.status_name === 'Interview').length,
    accepted: applications.filter(a => a.status?.status_name === 'Accepted').length,
    rejected: applications.filter(a => a.status?.status_name === 'Rejected').length,
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading applicant listings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/employer/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 rounded-xl"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage candidate applications</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchApplications}
          className="border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-purple-600">{stats.shortlisted}</p>
          <p className="text-xs text-gray-500">Shortlisted</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-indigo-600">{stats.interview}</p>
          <p className="text-xs text-gray-500">Interview</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-emerald-600">{stats.accepted}</p>
          <p className="text-xs text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-rose-600">{stats.rejected}</p>
          <p className="text-xs text-gray-500">Rejected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, job, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl border-gray-200 bg-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center py-16">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your filters" 
                : "When candidates apply, they'll appear here"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApplications.map((application) => (
            <Card 
              key={application.id} 
              className="group border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden bg-white cursor-pointer"
              onClick={() => navigate(`/employer/applications/${application.id}`)}
            >
              <CardContent className="p-5">
                {/* Identity Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-gray-50">
                      <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                        {getUserInitial(getSeekerName(application))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-base">
                        {getSeekerName(application)}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {getSeekerEmail(application)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(application.status?.status_name || 'Pending')}
                </div>

                {/* Job Position Details Block */}
                <div className="space-y-2 mb-4 pt-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{getJobTitle(application)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{getSeekerLocation(application)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Applied {getTimeAgo(application.applied_at)}</span>
                  </div>
                </div>

                {/* Lower Action Control Divider Row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {getStatusIcon(application.status?.status_name || 'Pending')}
                    <span className="capitalize font-medium">{application.status?.status_name || 'Pending'}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/employer/applications/${application.id}`)
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold h-8"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Review
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-md">
                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${getSeekerEmail(application)}`} className="cursor-pointer">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          Send Email
                        </DropdownMenuItem>
                        {application.resume_url && (
                          <DropdownMenuItem onClick={() => window.open(application.resume_url, '_blank')} className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            View Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigate(`/employer/applications/${application.id}`)} className="cursor-pointer">
                          <MessageCircle className="h-4 w-4 mr-2 text-gray-500" />
                          Add Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmployerApplications