/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Eye,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/common/LoadingSpinner'
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
    description: string
    location: string
    salary_range: string | null
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
}

interface ApplicationStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  byMonth: Array<{
    month: string
    count: number
  }>
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Reviewed: 'bg-blue-100 text-blue-800',
  Shortlisted: 'bg-green-100 text-green-800',
  Interview: 'bg-purple-100 text-purple-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800'
}

const statusIcons: Record<string, React.ReactNode> = {
  Pending: <Clock className="h-4 w-4" />,
  Reviewed: <Eye className="h-4 w-4" />,
  Shortlisted: <CheckCircle className="h-4 w-4" />,
  Interview: <Calendar className="h-4 w-4" />,
  Accepted: <CheckCircle className="h-4 w-4" />,
  Rejected: <XCircle className="h-4 w-4" />
}

const MyApplications: React.FC = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // eslint-disable-next-line no-empty-pattern
  const [] = useState('all')

  useEffect(() => {
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
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return
    
    try {
      await api.delete(`/applications/my-applications/${applicationId}/withdraw`)
      toast({ title: "Application Withdrawn", description: "Your application has been withdrawn successfully" })
      fetchApplications()
    } catch (error) {
      console.error('Error withdrawing application:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to withdraw application" })
    }
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.job.employer.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || app.status.status_name === statusFilter
      return matchesSearch && matchesStatus
    })

  const getStatusCount = (status: string) => {
    return applications.filter(app => app.status.status_name === status).length
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{applications.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Pending')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{getStatusCount('Pending')}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Reviewed')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{getStatusCount('Reviewed')}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Shortlisted')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{getStatusCount('Shortlisted')}</p>
            <p className="text-xs text-gray-500">Shortlisted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Interview')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{getStatusCount('Interview')}</p>
            <p className="text-xs text-gray-500">Interview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('Accepted')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-700">{getStatusCount('Accepted')}</p>
            <p className="text-xs text-gray-500">Accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Application Stats Chart */}
      {stats && stats.byMonth && stats.byMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Activity</CardTitle>
            <CardDescription>Monthly application trends</CardDescription>
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
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Section - Job Info */}
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/jobs/${application.job.id}`)}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                          {application.job.title}
                        </h3>
                        <p className="text-gray-600">{application.job.employer.company_name}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.job.location}
                            {application.job.is_remote && <Badge variant="secondary" className="ml-1">Remote</Badge>}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {application.job.employment_type.type_name}
                          </span>
                          {application.job.salary_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {application.job.salary_range}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <Badge className={statusColors[application.status.status_name]}>
                      <span className="flex items-center gap-1">
                        {statusIcons[application.status.status_name]}
                        {application.status.status_name}
                      </span>
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      Applied {getTimeAgo(application.applied_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applications/${application.id}/status`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Track
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
    </div>
  )
}

export default MyApplications