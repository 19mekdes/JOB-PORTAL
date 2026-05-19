/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  Users, 
  Briefcase, 
  FileText, 
  Eye, 
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import api from '../../services/api'
import { RootState } from '../../redux/store'

interface DashboardStats {
  users: {
    total: number
    employers: number
    jobSeekers: number
    admins: number
    active: number
    suspended: number
  }
  jobs: {
    total: number
    open: number
    closed: number
    draft: number
    archived: number
  }
  applications: {
    total: number
    pending: number
    reviewed: number
    shortlisted: number
    interview: number
    accepted: number
    rejected: number
  }
  analytics: {
    totalViews: number
    averageApplicationsPerJob: number
    jobsLast30Days: number
    usersLast30Days: number
  }
}

interface RecentUser {
  id: string
  email: string
  user_type: { type_name: string }
  created_at: string
  is_active: boolean
}

interface RecentJob {
  id: string
  title: string
  employer: { company_name: string }
  status: { status_name: string }
  created_at: string
  views_count: number
  applications_count: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, usersRes, jobsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=5'),
        api.get('/admin/jobs?limit=5')
      ])
      setStats(statsRes.data.data)
      setRecentUsers(usersRes.data.data)
      setRecentJobs(jobsRes.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/suspend`)
      fetchDashboardData()
    } catch (error) {
      console.error('Error suspending user:', error)
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/activate`)
      fetchDashboardData()
    } catch (error) {
      console.error('Error activating user:', error)
    }
  }

  const handleModerateJob = async (jobId: string, status: string) => {
    try {
      await api.put(`/admin/jobs/${jobId}/moderate`, { status })
      fetchDashboardData()
    } catch (error) {
      console.error('Error moderating job:', error)
    }
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: `+${stats?.analytics.usersLast30Days || 0} this month`
    },
    {
      title: 'Total Jobs',
      value: stats?.jobs.total || 0,
      icon: Briefcase,
      color: 'bg-green-500',
      trend: `+${stats?.analytics.jobsLast30Days || 0} this month`
    },
    {
      title: 'Applications',
      value: stats?.applications.total || 0,
      icon: FileText,
      color: 'bg-purple-500',
      trend: `${stats?.analytics.averageApplicationsPerJob || 0} avg per job`
    },
    {
      title: 'Total Views',
      value: stats?.analytics.totalViews || 0,
      icon: Eye,
      color: 'bg-orange-500',
      trend: 'Total job views'
    }
  ]

  // Chart data
  const jobStatusData = [
    { name: 'Open', value: stats?.jobs.open || 0, color: '#00C49F' },
    { name: 'Closed', value: stats?.jobs.closed || 0, color: '#FF8042' },
    { name: 'Draft', value: stats?.jobs.draft || 0, color: '#FFBB28' },
    { name: 'Archived', value: stats?.jobs.archived || 0, color: '#8884D8' }
  ]

  const applicationStatusData = [
    { name: 'Pending', value: stats?.applications.pending || 0 },
    { name: 'Reviewed', value: stats?.applications.reviewed || 0 },
    { name: 'Shortlisted', value: stats?.applications.shortlisted || 0 },
    { name: 'Interview', value: stats?.applications.interview || 0 },
    { name: 'Accepted', value: stats?.applications.accepted || 0 },
    { name: 'Rejected', value: stats?.applications.rejected || 0 }
  ]

  const userTypeData = [
    { name: 'Employers', value: stats?.users.employers || 0, color: '#0088FE' },
    { name: 'Job Seekers', value: stats?.users.jobSeekers || 0, color: '#00C49F' },
    { name: 'Admins', value: stats?.users.admins || 0, color: '#FFBB28' }
  ]

  // Format percentage for label
  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const totalJobs = (stats?.jobs.open || 0) + (stats?.jobs.closed || 0) + (stats?.jobs.draft || 0) + (stats?.jobs.archived || 0)
  const totalUsers = (stats?.users.employers || 0) + (stats?.users.jobSeekers || 0) + (stats?.users.admins || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Current status of all job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatPercent(value, totalJobs)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of user types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatPercent(value, totalUsers)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Application Status Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Application Status Overview</CardTitle>
                <CardDescription>Distribution of all job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={applicationStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {applicationStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest registered users on the platform</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.user_type.type_name}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {user.is_active ? (
                              <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="link">View All Users</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest job postings on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.employer.company_name}</TableCell>
                      <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{job.views_count}</TableCell>
                      <TableCell>{job.applications_count}</TableCell>
                      <TableCell>
                        <Badge variant={job.status.status_name === 'Open' ? 'success' : 'secondary'}>
                          {job.status.status_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {job.status.status_name === 'Open' ? (
                              <DropdownMenuItem onClick={() => handleModerateJob(job.id, 'Closed')}>
                                Close Job
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleModerateJob(job.id, 'Open')}>
                                Reopen Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="link">View All Jobs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
              <CardDescription>Overview of all job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {applicationStatusData.map((status) => (
                  <Card key={status.name}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{status.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{status.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <Button variant="link">View All Applications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard