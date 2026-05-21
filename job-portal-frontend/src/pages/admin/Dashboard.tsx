/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Briefcase, 
  FileText, 
  Clock, 
  TrendingUp, 
  Eye, 
  Settings,
  RefreshCw
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
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
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalUsers: number
  totalJobSeekers: number
  totalEmployers: number
  totalAdmins: number
  totalJobs: number
  activeJobs: number
  closedJobs: number
  totalApplications: number
  pendingApplications: number
  reviewedApplications: number
  shortlistedApplications: number
  interviewApplications: number
  acceptedApplications: number
  rejectedApplications: number
  newUsersThisMonth: number
  newJobsThisMonth: number
  newApplicationsThisMonth: number
  totalViews: number
  averageViewsPerJob: number
  averageApplicationsPerJob: number
  conversionRate: number
}

interface ChartData {
  month: string
  users: number
  jobs: number
  applications: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobSeekers: 0,
    totalEmployers: 0,
    totalAdmins: 0,
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    reviewedApplications: 0,
    shortlistedApplications: 0,
    interviewApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    newUsersThisMonth: 0,
    newJobsThisMonth: 0,
    newApplicationsThisMonth: 0,
    totalViews: 0,
    averageViewsPerJob: 0,
    averageApplicationsPerJob: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [growthData, setGrowthData] = useState<ChartData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [topJobs, setTopJobs] = useState<any[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data
      const response = await api.get(`/admin/analytics?period=${period}`)
      const data = response.data.data
      
      setStats({
        totalUsers: data.totalUsers || 0,
        totalJobSeekers: data.totalJobSeekers || 0,
        totalEmployers: data.totalEmployers || 0,
        totalAdmins: data.totalAdmins || 0,
        totalJobs: data.totalJobs || 0,
        activeJobs: data.activeJobs || 0,
        closedJobs: data.closedJobs || 0,
        totalApplications: data.totalApplications || 0,
        pendingApplications: data.pendingApplications || 0,
        reviewedApplications: data.reviewedApplications || 0,
        shortlistedApplications: data.shortlistedApplications || 0,
        interviewApplications: data.interviewApplications || 0,
        acceptedApplications: data.acceptedApplications || 0,
        rejectedApplications: data.rejectedApplications || 0,
        newUsersThisMonth: data.newUsersThisMonth || 0,
        newJobsThisMonth: data.newJobsThisMonth || 0,
        newApplicationsThisMonth: data.newApplicationsThisMonth || 0,
        totalViews: data.totalViews || 0,
        averageViewsPerJob: data.averageViewsPerJob || 0,
        averageApplicationsPerJob: data.averageApplicationsPerJob || 0,
        conversionRate: data.conversionRate || 0
      })
      
      // Set chart data
      if (data.jobsByMonth) {
        setGrowthData(data.jobsByMonth)
      } else {
        // Fallback mock data
        setGrowthData([
          { month: 'Jan', users: 1200, jobs: 450, applications: 890 },
          { month: 'Feb', users: 1350, jobs: 520, applications: 1020 },
          { month: 'Mar', users: 1480, jobs: 580, applications: 1150 },
          { month: 'Apr', users: 1620, jobs: 610, applications: 1280 },
          { month: 'May', users: 1750, jobs: 680, applications: 1420 },
          { month: 'Jun', users: 1890, jobs: 720, applications: 1580 }
        ])
      }
      
      // Set application status distribution
      if (data.applicationsByStatus) {
        const colors: Record<string, string> = {
          'Pending': '#f59e0b',
          'Reviewed': '#3b82f6',
          'Shortlisted': '#8b5cf6',
          'Interview': '#06b6d4',
          'Accepted': '#10b981',
          'Rejected': '#ef4444'
        }
        setStatusData(data.applicationsByStatus.map((item: any) => ({
          name: item.status,
          value: item.count,
          color: colors[item.status] || '#6b7280'
        })))
      } else {
        setStatusData([
          { name: 'Pending', value: stats.pendingApplications, color: '#f59e0b' },
          { name: 'Reviewed', value: stats.reviewedApplications, color: '#3b82f6' },
          { name: 'Shortlisted', value: stats.shortlistedApplications, color: '#8b5cf6' },
          { name: 'Interview', value: stats.interviewApplications, color: '#06b6d4' },
          { name: 'Accepted', value: stats.acceptedApplications, color: '#10b981' },
          { name: 'Rejected', value: stats.rejectedApplications, color: '#ef4444' }
        ])
      }
      
      // Fetch top jobs
      try {
        const jobsResponse = await api.get('/admin/jobs?limit=5')
        if (jobsResponse.data.success) {
          setTopJobs(jobsResponse.data.data.slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching top jobs:', error)
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to load dashboard data" 
      })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers.toLocaleString(), 
      icon: Users, 
      subValue: `👥 ${stats.totalJobSeekers} Job Seekers | 🏢 ${stats.totalEmployers} Employers`,
      change: `+${stats.newUsersThisMonth} this month`, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      title: 'Total Jobs', 
      value: stats.totalJobs.toLocaleString(), 
      icon: Briefcase, 
      subValue: `✅ ${stats.activeJobs} Active | ❌ ${stats.closedJobs} Closed`,
      change: `+${stats.newJobsThisMonth} new this month`, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      title: 'Applications', 
      value: stats.totalApplications.toLocaleString(), 
      icon: FileText, 
      subValue: `📊 Avg ${stats.averageApplicationsPerJob} per job`,
      change: `+${stats.newApplicationsThisMonth} this month`, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      title: 'Views', 
      value: stats.totalViews.toLocaleString(), 
      icon: Eye, 
      subValue: `👁️ Avg ${stats.averageViewsPerJob} per job`,
      change: `${stats.conversionRate}% conversion rate`, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of platform activity and metrics</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-gray-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.subValue}</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users" />
                <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} name="Jobs" />
                <Line type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} name="Applications" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.filter(s => s.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Bar Chart */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Jobs */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Top Performing Jobs</h3>
            <button 
              onClick={() => navigate('/admin/jobs')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>
          {topJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No jobs data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topJobs.map((job, index) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.employer?.company_name || 'Unknown Company'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      {job.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      {job.applications_count || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              onClick={() => navigate('/admin/jobs?status=pending')}
              className="p-3 bg-yellow-50 rounded-lg text-yellow-700 hover:bg-yellow-100 transition text-sm font-medium"
            >
              <Clock className="h-4 w-4 mx-auto mb-1" />
              Review Pending Jobs
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="p-3 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition text-sm font-medium"
            >
              <Users className="h-4 w-4 mx-auto mb-1" />
              Manage Users
            </button>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="p-3 bg-purple-50 rounded-lg text-purple-700 hover:bg-purple-100 transition text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4 mx-auto mb-1" />
              View Reports
            </button>
            <button 
              onClick={() => navigate('/admin/settings')}
              className="p-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
            >
              <Settings className="h-4 w-4 mx-auto mb-1" />
              System Settings
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard