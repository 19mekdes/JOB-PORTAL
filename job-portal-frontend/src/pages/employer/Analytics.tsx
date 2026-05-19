/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/employer/Analytics.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AnalyticsData {
  totalJobs: number
  activeJobs: number
  totalApplications: number
  totalViews: number
  thisMonthJobs: number
  thisMonthApplications: number
  thisMonthViews: number
  pendingApplications: number
  reviewedApplications: number
  shortlistedApplications: number
  interviewApplications: number
  acceptedApplications: number
  rejectedApplications: number
  jobsByMonth: Array<{ month: string; count: number }>
  applicationsByMonth: Array<{ month: string; count: number }>
  viewsByMonth: Array<{ month: string; count: number }>
  topJobs: Array<{ id: string; title: string; applications: number; views: number; status: string }>
}

const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6months')
  const [data, setData] = useState<AnalyticsData>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalViews: 0,
    thisMonthJobs: 0,
    thisMonthApplications: 0,
    thisMonthViews: 0,
    pendingApplications: 0,
    reviewedApplications: 0,
    shortlistedApplications: 0,
    interviewApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    jobsByMonth: [],
    applicationsByMonth: [],
    viewsByMonth: [],
    topJobs: []
  })

  useEffect(() => {
    fetchAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch employer dashboard data
      const dashboardRes = await api.get('/employer/dashboard')
      const dashboardData = dashboardRes.data.data
      
      // Fetch all jobs to calculate monthly stats
      const jobsRes = await api.get('/employer/jobs')
      const jobs = jobsRes.data.data || []
      
      // Fetch all applications
      const appsRes = await api.get('/employer/applications')
      const applications = appsRes.data.data || []
      
      // Calculate real statistics
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // Filter jobs and applications for this month
      const thisMonthJobs = jobs.filter(job => {
        const jobDate = new Date(job.created_at)
        return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear
      }).length
      
      const thisMonthApplications = applications.filter(app => {
        const appDate = new Date(app.applied_at)
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear
      }).length
      
      const thisMonthViews = jobs.reduce((sum, job) => {
        const jobDate = new Date(job.created_at)
        if (jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear) {
          return sum + (job.views_count || 0)
        }
        return sum
      }, 0)
      
      // Calculate status counts
      const pendingApps = applications.filter(app => app.status?.status_name === 'Pending').length
      const reviewedApps = applications.filter(app => app.status?.status_name === 'Reviewed').length
      const shortlistedApps = applications.filter(app => app.status?.status_name === 'Shortlisted').length
      const interviewApps = applications.filter(app => app.status?.status_name === 'Interview').length
      const acceptedApps = applications.filter(app => app.status?.status_name === 'Accepted').length
      const rejectedApps = applications.filter(app => app.status?.status_name === 'Rejected').length
      
      // Calculate monthly trends (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last6Months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        last6Months.push({
          month: months[d.getMonth()],
          year: d.getFullYear(),
          index: i
        })
      }
      
      const jobsByMonth = last6Months.map(m => {
        const count = jobs.filter(job => {
          const jobDate = new Date(job.created_at)
          return jobDate.getMonth() === months.indexOf(m.month) && jobDate.getFullYear() === m.year
        }).length
        return { month: m.month, count }
      })
      
      const applicationsByMonth = last6Months.map(m => {
        const count = applications.filter(app => {
          const appDate = new Date(app.applied_at)
          return appDate.getMonth() === months.indexOf(m.month) && appDate.getFullYear() === m.year
        }).length
        return { month: m.month, count }
      })
      
      const viewsByMonth = last6Months.map(m => {
        const count = jobs.reduce((sum, job) => {
          const jobDate = new Date(job.created_at)
          if (jobDate.getMonth() === months.indexOf(m.month) && jobDate.getFullYear() === m.year) {
            return sum + (job.views_count || 0)
          }
          return sum
        }, 0)
        return { month: m.month, count }
      })
      
      // Calculate top jobs by applications
      const topJobs = jobs
        .map(job => ({
          id: job.id,
          title: job.title,
          applications: job.applications_count || 0,
          views: job.views_count || 0,
          status: job.status?.status_name || 'Unknown'
        }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 5)
      
      setData({
        totalJobs: dashboardData.totalJobs || jobs.length,
        activeJobs: dashboardData.activeJobs || jobs.filter(j => j.status?.status_name === 'Open').length,
        totalApplications: dashboardData.totalApplications || applications.length,
        totalViews: dashboardData.totalViews || jobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
        thisMonthJobs,
        thisMonthApplications,
        thisMonthViews,
        pendingApplications: pendingApps,
        reviewedApplications: reviewedApps,
        shortlistedApplications: shortlistedApps,
        interviewApplications: interviewApps,
        acceptedApplications: acceptedApps,
        rejectedApplications: rejectedApps,
        jobsByMonth,
        applicationsByMonth,
        viewsByMonth,
        topJobs
      })
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analytics data",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const exportData = {
        exported_at: new Date().toISOString(),
        period,
        data
      }
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics_${period}_${new Date().toISOString()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({ title: "Success", description: "Data exported successfully" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to export data" })
    }
  }

  const statusData = [
    { name: 'Pending', value: data.pendingApplications, color: '#f59e0b' },
    { name: 'Reviewed', value: data.reviewedApplications, color: '#3b82f6' },
    { name: 'Shortlisted', value: data.shortlistedApplications, color: '#8b5cf6' },
    { name: 'Interview', value: data.interviewApplications, color: '#06b6d4' },
    { name: 'Accepted', value: data.acceptedApplications, color: '#10b981' },
    { name: 'Rejected', value: data.rejectedApplications, color: '#ef4444' }
  ].filter(item => item.value > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your job posting performance</p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalJobs}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{data.thisMonthJobs} this month
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{data.activeJobs}</p>
                <p className="text-xs text-gray-500 mt-1">Currently hiring</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalApplications}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{data.thisMonthApplications} this month
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Views</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalViews}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{data.thisMonthViews} this month
                </p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Applications Trend</CardTitle>
            <p className="text-sm text-gray-500">Monthly application count</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.applicationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Views Trend</CardTitle>
            <p className="text-sm text-gray-500">Monthly job views</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.viewsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Application Status Distribution</CardTitle>
            <p className="text-sm text-gray-500">Breakdown of all applications</p>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No application data available</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie 
                      data={statusData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      dataKey="value" 
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {statusData.map((status) => (
                    <div key={status.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs text-gray-600">{status.name}</span>
                      <span className="text-xs font-semibold text-gray-900">{status.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Jobs</CardTitle>
            <p className="text-sm text-gray-500">Jobs with most applications</p>
          </CardHeader>
          <CardContent>
            {data.topJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No job data available</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/employer/post-job')}
                  className="mt-2"
                >
                  Post your first job
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topJobs.map((job, index) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => navigate(`/employer/jobs/${job.id}/applications`)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                        <p className="font-medium text-gray-900">{job.title}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.applications} application{job.applications !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {job.views} views
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{job.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jobs Trend Chart */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Jobs Posted Trend</CardTitle>
          <p className="text-sm text-gray-500">Monthly job posting activity</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.jobsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics