/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Briefcase, 
  FileText, 
  Clock, 
  TrendingUp, 
  CheckCircle,
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
      
      console.log('Dashboard API Response:', response.data)
      
      // Extract data from backend structure
      const backendData = response.data?.data || response.data || {}
      
      // Calculate totals from backend data
      const dailyJobs = backendData.dailyJobs || []
      const totalJobs = dailyJobs.reduce((sum: number, job: any) => sum + (job.count || 0), 0)
      
      const applicationStats = backendData.applicationStats || []
      const pendingApps = applicationStats.find((s: any) => s.status === 'Pending')?.count || 0
      const interviewApps = applicationStats.find((s: any) => s.status === 'Interview')?.count || 0
      const acceptedApps = applicationStats.find((s: any) => s.status === 'Accepted')?.count || 0
      const totalApplications = pendingApps + interviewApps + acceptedApps
      
      // Get top employers
      const topEmployers = backendData.topEmployers || []
      
      // Create monthly chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      const jobsByMonth: ChartData[] = months.map(month => ({
        month,
        users: 0,
        jobs: 0,
        applications: 0
      }))
      
      // Distribute job counts across months (simplified - put most in current month)
      if (totalJobs > 0) {
        jobsByMonth[5].jobs = totalJobs // Put all jobs in June for demo
      }
      if (totalApplications > 0) {
        jobsByMonth[5].applications = totalApplications
      }
      
      // Create status data for pie chart
      const newStatusData: StatusData[] = []
      const statusColors: Record<string, string> = {
        'Pending': '#f59e0b',
        'Interview': '#06b6d4',
        'Accepted': '#10b981'
      }
      
      if (pendingApps > 0) {
        newStatusData.push({ name: 'Pending', value: pendingApps, color: statusColors['Pending'] })
      }
      if (interviewApps > 0) {
        newStatusData.push({ name: 'Interview', value: interviewApps, color: statusColors['Interview'] })
      }
      if (acceptedApps > 0) {
        newStatusData.push({ name: 'Accepted', value: acceptedApps, color: statusColors['Accepted'] })
      }
      
      // Update stats with calculated values
      setStats({
        totalUsers: 0, // Your backend doesn't provide this yet
        totalJobSeekers: 0,
        totalEmployers: 0,
        totalAdmins: 0,
        totalJobs: totalJobs,
        activeJobs: totalJobs,
        closedJobs: 0,
        totalApplications: totalApplications,
        pendingApplications: pendingApps,
        reviewedApplications: 0,
        shortlistedApplications: 0,
        interviewApplications: interviewApps,
        acceptedApplications: acceptedApps,
        rejectedApplications: 0,
        newUsersThisMonth: 0,
        newJobsThisMonth: totalJobs,
        newApplicationsThisMonth: totalApplications,
        totalViews: 0,
        averageViewsPerJob: 0,
        averageApplicationsPerJob: totalJobs > 0 ? parseFloat((totalApplications / totalJobs).toFixed(1)) : 0,
        conversionRate: totalApplications > 0 ? Math.round((acceptedApps / totalApplications) * 100) : 0
      })
      
      setGrowthData(jobsByMonth)
      setStatusData(newStatusData)
      
      // Set top jobs from topEmployers data
      const formattedTopJobs = topEmployers.map((employer: any, index: number) => ({
        id: index,
        title: employer.name,
        employer: { company_name: employer.name },
        views_count: 0,
        applications_count: employer.jobCount || 0
      }))
      setTopJobs(formattedTopJobs.slice(0, 5))
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to load dashboard data" 
      })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { 
      title: 'Total Jobs', 
      value: stats.totalJobs.toLocaleString(), 
      icon: Briefcase, 
      subValue: `✅ ${stats.activeJobs.toLocaleString()} Active | ❌ ${stats.closedJobs.toLocaleString()} Closed`,
      change: `+${stats.newJobsThisMonth.toLocaleString()} new this month`, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      title: 'Applications', 
      value: stats.totalApplications.toLocaleString(), 
      icon: FileText, 
      subValue: `📊 Avg ${stats.averageApplicationsPerJob} per job`,
      change: `+${stats.newApplicationsThisMonth.toLocaleString()} this month`, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      title: 'Pending Review', 
      value: stats.pendingApplications.toLocaleString(), 
      icon: Clock, 
      subValue: `⏳ Needs attention`,
      change: `${stats.pendingApplications} waiting`, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50' 
    },
    { 
      title: 'Accepted', 
      value: stats.acceptedApplications.toLocaleString(), 
      icon: CheckCircle, 
      subValue: `🎉 Successful placements`,
      change: `${stats.conversionRate}% conversion rate`, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
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
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
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
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
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
            className="border-gray-300 bg-white"
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
            <Card key={stat.title} className="border border-gray-200 shadow-sm hover:shadow-md transition bg-white">
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
        <Card className="border border-gray-200 shadow-sm bg-white">
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
                <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} name="Jobs" />
                <Line type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} name="Applications" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
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
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Jobs */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Top Performing Employers</h3>
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
              <p>No employer data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topJobs.map((employer, index) => (
                <div key={employer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{employer.title}</p>
                      <p className="text-sm text-gray-500">Total Jobs: {employer.applications_count}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      {employer.applications_count} jobs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-gray-200 shadow-sm bg-white">
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