import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Users,
  Briefcase,
  FileText,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  UserCheck,
  UserX} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/common/LoadingSpinner'
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer} from 'recharts'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface DashboardStats {
  users: {
    total: number
    employers: number
    jobSeekers: number
    admins: number
    active: number
    suspended: number
    growth: number
  }
  jobs: {
    total: number
    open: number
    closed: number
    draft: number
    archived: number
    growth: number
  }
  applications: {
    total: number
    pending: number
    reviewed: number
    shortlisted: number
    interview: number
    accepted: number
    rejected: number
    growth: number
  }
  analytics: {
    totalViews: number
    averageApplicationsPerJob: number
    jobsLast30Days: number
    usersLast30Days: number
    responseRate: number
    interviewRate: number
    offerRate: number
  }
  system: {
    health: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
    databaseSize: string
    cacheHitRate: number
    activeSessions: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B']

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange] = useState('30d')
  // eslint-disable-next-line no-empty-pattern
  const [] = useState<'line' | 'bar' | 'area'>('line')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/super-admin/dashboard?range=${timeRange}`)
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/super-admin/export/report', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `system_report_${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: "Export Complete",
        description: "System report downloaded successfully",
      })
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export system report",
      })
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const userTypeData = [
    { name: 'Employers', value: stats.users.employers, color: '#0088FE' },
    { name: 'Job Seekers', value: stats.users.jobSeekers, color: '#00C49F' },
    { name: 'Admins', value: stats.users.admins, color: '#FFBB28' }
  ]

  const jobStatusData = [
    { name: 'Open', value: stats.jobs.open, color: '#00C49F' },
    { name: 'Closed', value: stats.jobs.closed, color: '#FF8042' },
    { name: 'Draft', value: stats.jobs.draft, color: '#FFBB28' },
    { name: 'Archived', value: stats.jobs.archived, color: '#8884D8' }
  ]

  const applicationStatusData = [
    { name: 'Pending', value: stats.applications.pending },
    { name: 'Reviewed', value: stats.applications.reviewed },
    { name: 'Shortlisted', value: stats.applications.shortlisted },
    { name: 'Interview', value: stats.applications.interview },
    { name: 'Accepted', value: stats.applications.accepted },
    { name: 'Rejected', value: stats.applications.rejected }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-8 w-8" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">System overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {stats.system.health !== 'healthy' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700">
                System health is {stats.system.health}. Some features may be affected.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.users.growth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${stats.users.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.users.growth)}% from last month
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.jobs.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.jobs.growth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${stats.jobs.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.jobs.growth)}% from last month
                  </span>
                </div>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold">{stats.applications.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.applications.growth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${stats.applications.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.applications.growth)}% from last month
                  </span>
                </div>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold">{stats.analytics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.analytics.averageApplicationsPerJob} avg per job</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Response Rate</p>
              <p className="text-3xl font-bold text-green-600">{stats.analytics.responseRate}%</p>
              <Progress value={stats.analytics.responseRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Interview Rate</p>
              <p className="text-3xl font-bold text-blue-600">{stats.analytics.interviewRate}%</p>
              <Progress value={stats.analytics.interviewRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Offer Rate</p>
              <p className="text-3xl font-bold text-purple-600">{stats.analytics.offerRate}%</p>
              <Progress value={stats.analytics.offerRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Distribution</TabsTrigger>
          <TabsTrigger value="jobs">Job Status</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of user types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {userTypeData.map((type) => (
                    <div key={type.name} className="flex justify-between items-center">
                      <span className="text-sm">{type.name}</span>
                      <div className="flex items-center gap-4">
                        <Progress value={(type.value / stats.users.total) * 100} className="w-32" />
                        <span className="text-sm font-medium">{type.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Active vs Suspended accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Active Users</p>
                        <p className="text-2xl font-bold text-green-600">{stats.users.active.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Percentage</p>
                      <p className="text-lg font-semibold">{((stats.users.active / stats.users.total) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserX className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-500">Suspended Users</p>
                        <p className="text-2xl font-bold text-red-600">{stats.users.suspended.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Percentage</p>
                      <p className="text-lg font-semibold">{((stats.users.suspended / stats.users.total) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Current status of all job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Jobs posted in last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <p className="text-4xl font-bold text-blue-600">{stats.analytics.jobsLast30Days.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-2">New jobs posted</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>vs previous period</span>
                      <span className="text-green-600">+{stats.jobs.growth}%</span>
                    </div>
                    <Progress value={50 + stats.jobs.growth} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Status Overview</CardTitle>
              <CardDescription>Distribution of all job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={applicationStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {applicationStatusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Platform performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Server className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-sm font-medium">{Math.floor(stats.system.uptime / 3600)}h</p>
              <p className="text-xs text-gray-500">Uptime</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Database className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-sm font-medium">{stats.system.databaseSize}</p>
              <p className="text-xs text-gray-500">Database Size</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Activity className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <p className="text-sm font-medium">{stats.system.cacheHitRate}%</p>
              <p className="text-xs text-gray-500">Cache Hit Rate</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <p className="text-sm font-medium">{stats.system.activeSessions}</p>
              <p className="text-xs text-gray-500">Active Sessions</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto text-red-500 mb-2" />
              <p className="text-sm font-medium">Real-time</p>
              <p className="text-xs text-gray-500">Monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminDashboard