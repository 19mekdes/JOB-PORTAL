/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  Briefcase,
  Users,
  Eye,
  MapPin,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalApplications: number
  totalViews: number
  pendingApplications: number
  reviewedApplications: number
  shortlistedApplications: number
  interviewApplications: number
  acceptedApplications: number
  rejectedApplications: number
  thisMonthJobs: number
  thisMonthApplications: number
  thisMonthViews: number
}

interface RecentJob {
  id: string
  title: string
  location: string
  salary_range: string
  applications_count: number
  views_count: number
  status: string
  created_at: string
}

interface RecentApplication {
  id: string
  job_title: string
  applicant_name: string
  applicant_email: string
  status: string
  applied_at: string
}

const DashboardContent: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalViews: 0,
    pendingApplications: 0,
    reviewedApplications: 0,
    shortlistedApplications: 0,
    interviewApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    thisMonthJobs: 0,
    thisMonthApplications: 0,
    thisMonthViews: 0
  })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/employer/dashboard')
      setStats(response.data.data)
      setRecentJobs(response.data.data.recentJobs || [])
      setRecentApplications(response.data.data.recentApplications || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      })
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Handle non-string status values
  const getStatusBadge = (status: string | number | undefined | null) => {
    if (!status) {
      return <Badge variant="secondary" className="border-0">Unknown</Badge>
    }
    
    const statusStr = String(status).toLowerCase()
    
    switch (statusStr) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800 border-0">Reviewed</Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-100 text-purple-800 border-0">Shortlisted</Badge>
      case 'interview':
        return <Badge className="bg-indigo-100 text-indigo-800 border-0">Interview</Badge>
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-0">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>
      default:
        return <Badge variant="secondary" className="border-0">{statusStr}</Badge>
    }
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60))
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} minutes ago`
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
    return `${Math.floor(diff / 1440)} days ago`
  }

  const applicationTrendData = [
    { month: 'Jan', applications: 45, views: 120 },
    { month: 'Feb', applications: 52, views: 145 },
    { month: 'Mar', applications: 48, views: 138 },
    { month: 'Apr', applications: 61, views: 167 },
    { month: 'May', applications: 73, views: 189 },
    { month: 'Jun', applications: 85, views: 210 },
  ]

  const statsCards = [
    { title: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, change: `+${stats.thisMonthJobs} this month`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Jobs', value: stats.activeJobs, icon: CheckCircle, change: 'Currently hiring', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Applications', value: stats.totalApplications, icon: Users, change: `+${stats.thisMonthApplications} this month`, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, change: `+${stats.thisMonthViews} this month`, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Employer'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your jobs today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-gray-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Application Status Overview */}
      <Card className="mb-6 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Application Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
            <div>
              <div className="h-2 bg-yellow-500 rounded-full mb-2" />
              <p className="text-xl font-bold">{stats.pendingApplications}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div>
              <div className="h-2 bg-blue-500 rounded-full mb-2" />
              <p className="text-xl font-bold">{stats.reviewedApplications}</p>
              <p className="text-xs text-gray-500">Reviewed</p>
            </div>
            <div>
              <div className="h-2 bg-purple-500 rounded-full mb-2" />
              <p className="text-xl font-bold">{stats.shortlistedApplications}</p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </div>
            <div>
              <div className="h-2 bg-indigo-500 rounded-full mb-2" />
              <p className="text-xl font-bold">{stats.interviewApplications}</p>
              <p className="text-xs text-gray-500">Interview</p>
            </div>
            <div>
              <div className="h-2 bg-green-500 rounded-full mb-2" />
              <p className="text-xl font-bold">{stats.acceptedApplications}</p>
              <p className="text-xs text-gray-500">Accepted</p>
            </div>
            <div>
              <div className="h-2 bg-red-500 rounded-full mb-2" />
              <p className="text-xl font-bold">{stats.rejectedApplications}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Application Trend</CardTitle>
            <p className="text-sm text-gray-500">Monthly applications and views</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={applicationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Application Distribution</CardTitle>
            <p className="text-sm text-gray-500">Status breakdown</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={applicationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <Link to="/employer/jobs">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No jobs posted yet</p>
                <Link to="/employer/post-job">
                  <Button variant="link" size="sm" className="mt-2">Post your first job</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count} apps</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views_count} views</span>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Applications</CardTitle>
            <Link to="/employer/applications">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{app.applicant_name}</p>
                      <p className="text-sm text-gray-500">{app.job_title}</p>
                      <p className="text-xs text-gray-400 mt-1">Applied {getTimeAgo(app.applied_at)}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default DashboardContent