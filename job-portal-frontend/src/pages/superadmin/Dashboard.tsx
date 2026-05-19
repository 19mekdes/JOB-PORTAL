// src/pages/superadmin/Dashboard.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, Shield, Activity, TrendingUp, Clock, Server,
  Briefcase, FileCheck, AlertCircle,
  Download, RefreshCw, ArrowUpRight,
  Smartphone, Laptop, Tablet,
  Building, Database, Settings
} from 'lucide-react'
import {
  BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

const SuperAdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [stats] = useState({
    totalAdmins: 12,
    activeAdmins: 9,
    totalUsers: 28457,
    activeUsers: 18762,
    totalEmployers: 3421,
    totalJobs: 4321,
    activeJobs: 2894,
    pendingJobs: 527,
    totalApplications: 45678,
    pendingApplications: 1234,
    reviewedApplications: 2345,
    acceptedApplications: 3456,
    rejectedApplications: 5678,
    dailyApplications: 1892,
    dailyNewUsers: 347,
    dailyNewJobs: 89,
    systemUptime: 99.95,
    serverLoad: 42,
    apiResponseTime: 234,
    databaseSize: '2.4 GB',
    storageUsed: 45,
    pendingVerifications: 156
  })

  // Chart data
  const userGrowthData = [
    { name: 'Jan', users: 18500, jobs: 2100, applications: 12500 },
    { name: 'Feb', users: 19200, jobs: 2350, applications: 14200 },
    { name: 'Mar', users: 21100, jobs: 2680, applications: 16800 },
    { name: 'Apr', users: 23200, jobs: 2950, applications: 19500 },
    { name: 'May', users: 25400, jobs: 3210, applications: 22800 },
    { name: 'Jun', users: 28457, jobs: 3421, applications: 26700 },
  ]

  const applicationStatusData = [
    { name: 'Pending', value: 1234, color: '#f59e0b' },
    { name: 'Reviewed', value: 2345, color: '#3b82f6' },
    { name: 'Shortlisted', value: 3456, color: '#8b5cf6' },
    { name: 'Accepted', value: 5678, color: '#10b981' },
    { name: 'Rejected', value: 3456, color: '#ef4444' },
  ]

  const jobByIndustryData = [
    { industry: 'Technology', jobs: 1245, growth: 15 },
    { industry: 'Healthcare', jobs: 892, growth: 8 },
    { industry: 'Finance', jobs: 745, growth: 12 },
    { industry: 'Education', jobs: 634, growth: 5 },
    { industry: 'Retail', jobs: 523, growth: 3 },
    { industry: 'Manufacturing', jobs: 432, growth: 7 },
  ]

  const trafficByDeviceData = [
    { name: 'Desktop', value: 65, icon: Laptop },
    { name: 'Mobile', value: 28, icon: Smartphone },
    { name: 'Tablet', value: 7, icon: Tablet },
  ]

  const recentActivities = [
    { user: 'John Doe', action: 'Posted new job', target: 'Senior Developer', time: '2 minutes ago', type: 'job', icon: Briefcase },
    { user: 'Sarah Smith', action: 'Applied for job', target: 'UI/UX Designer', time: '5 minutes ago', type: 'application', icon: FileCheck },
    { user: 'Admin User', action: 'Approved company', target: 'Tech Corp', time: '15 minutes ago', type: 'admin', icon: Shield },
    { user: 'Mike Johnson', action: 'Registered new account', target: 'employer@company.com', time: '1 hour ago', type: 'user', icon: Users },
    { user: 'Super Admin', action: 'Updated system settings', target: 'Email configuration', time: '2 hours ago', type: 'system', icon: Settings },
  ]

  const topPerformingJobs = [
    { title: 'Senior React Developer', company: 'Tech Corp', applications: 234, views: 1234, matchRate: 85 },
    { title: 'Product Manager', company: 'Innovate Inc', applications: 189, views: 987, matchRate: 78 },
    { title: 'UX Designer', company: 'Creative Studio', applications: 156, views: 876, matchRate: 82 },
    { title: 'Data Scientist', company: 'Analytics Pro', applications: 145, views: 765, matchRate: 79 },
  ]

  const systemMetrics = [
    { name: 'CPU Usage', value: stats.serverLoad, unit: '%', status: 'good', color: '#10b981' },
    { name: 'Memory Usage', value: 68, unit: '%', status: 'warning', color: '#f59e0b' },
    { name: 'Disk Space', value: stats.storageUsed, unit: '%', status: 'good', color: '#3b82f6' },
    { name: 'API Response', value: stats.apiResponseTime, unit: 'ms', status: 'good', color: '#8b5cf6' },
  ]

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with period selector - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['day', 'week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors capitalize ${
                  selectedPeriod === period ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8 sm:h-9">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 sm:h-9">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards Row 1 - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow border border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12.5%</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">vs last month</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">New today: +{stats.dailyNewUsers}</span>
                <span className="text-gray-500">Active: {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Jobs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalJobs.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+8.3%</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">vs last month</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Open: {stats.activeJobs}</span>
                <span className="text-gray-500">Pending: {stats.pendingJobs}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Applications</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalApplications.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+23.7%</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">vs last month</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Today: +{stats.dailyApplications}</span>
                <span className="text-gray-500">Acceptance: 24%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">System Health</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.systemUptime}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <Activity className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Operational</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-orange-50">
                <Server className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
              <Progress value={stats.serverLoad} className="h-1" />
              <p className="text-xs text-gray-500 mt-2">Server Load: {stats.serverLoad}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Row 2 - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Admins</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalAdmins}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-gray-100">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Employers</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalEmployers.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-gray-100">
                <Building className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending Jobs</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.pendingJobs}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-yellow-50">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Verifications</p>
                <p className="text-lg sm:text-xl font-bold text-orange-600">{stats.pendingVerifications}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-orange-50">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Database</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.databaseSize}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-full bg-gray-100">
                <Database className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Responsive */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="bg-gray-100 w-full flex flex-wrap h-auto">
          <TabsTrigger value="growth" className="flex-1 text-xs sm:text-sm">Growth Trends</TabsTrigger>
          <TabsTrigger value="applications" className="flex-1 text-xs sm:text-sm">Applications</TabsTrigger>
          <TabsTrigger value="industry" className="flex-1 text-xs sm:text-sm">Industry Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-gray-900">Platform Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-75">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Users" />
                      <Area type="monotone" dataKey="jobs" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Jobs" />
                      <Area type="monotone" dataKey="applications" stackId="3" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Applications" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-gray-900">Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-62.5">
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={applicationStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {applicationStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
                  {applicationStatusData.map((status) => (
                    <div key={status.name} className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs sm:text-sm text-gray-600">{status.name}</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">{status.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-gray-900">Traffic by Device</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={trafficByDeviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 sm:gap-6 mt-4">
                  {trafficByDeviceData.map((device) => {
                    const Icon = device.icon
                    return (
                      <div key={device.name} className="text-center">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mx-auto" />
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">{device.name}</p>
                        <p className="text-xs text-gray-500">{device.value}%</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="industry">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-gray-900">Jobs by Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-75">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={jobByIndustryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="industry" stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Number of Jobs" />
                      <Bar dataKey="growth" fill="#10b981" radius={[4, 4, 0, 0]} name="Growth (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Health and Top Jobs - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-gray-900">System Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {systemMetrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs sm:text-sm text-gray-600">{metric.name}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{metric.value}{metric.unit}</span>
                  </div>
                  <Progress value={metric.value} className="h-1.5 sm:h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-gray-900">Top Performing Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {topPerformingJobs.map((job, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div>
                    <p className="font-medium text-sm sm:text-base text-gray-900">{job.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{job.company}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-gray-900">{job.applications} apps</p>
                    <p className="text-xs text-green-600">{job.matchRate}% match</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Responsive */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-base sm:text-lg text-gray-900">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-gray-600">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100 shrink-0">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                        <span className="font-medium text-gray-900"> {activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs text-gray-500 font-normal w-fit">
                    {activity.type}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminDashboard