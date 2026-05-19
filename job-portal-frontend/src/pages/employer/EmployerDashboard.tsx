/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
  UserCircle,
  TrendingUp,
  Eye,
  MapPin,
  CheckCircle,
  Plus,
  Building2,
  FileText,
  X,
  Clock as ClockIcon,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

// Dashboard content component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DashboardContent: React.FC = () => {
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
  const { user } = useSelector((state: RootState) => state.auth)

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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
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
        return <Badge variant="secondary" className="border-0">{status}</Badge>
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

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: any
}

// Main EmployerDashboard Component with Sidebar and Outlet
const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state: RootState) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const navItems = [
    { path: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employer/jobs', label: 'My Jobs', icon: Briefcase },
    { path: '/employer/applications', label: 'Applications', icon: FileText },
    { path: '/employer/post-job', label: 'Post a Job', icon: Plus },
    { path: '/employer/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/employer/profile', label: 'Company Profile', icon: Building2 },
    { path: '/employer/settings', label: 'Settings', icon: Settings },
  ]

  useEffect(() => {
    fetchNotifications()
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
        setMobileSidebarOpen(false)
      } else {
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications')
      if (response.data.success) {
        setNotifications(response.data.data || [])
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'job':
        return <Briefcase className="h-4 w-4 text-green-500" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60))
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} minutes ago`
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
    return `${Math.floor(diff / 1440)} days ago`
  }

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'E'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActiveRoute = (path: string) => {
    if (path === '/employer/dashboard') {
      return location.pathname === '/employer/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-lg transition-transform duration-300
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        ${mobileSidebarOpen ? 'translate-x-0 w-64' : ''}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/employer/dashboard" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Employer Hub</span>
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{user?.full_name || 'Employer'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  className="border-0 bg-transparent p-0 h-7 w-80 focus-visible:ring-0 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications Dropdown */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
                  <div className="sticky top-0 bg-white border-b border-gray-100 p-3 flex justify-between items-center">
                    <DropdownMenuLabel className="p-0 text-gray-900 font-semibold">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`p-3 cursor-pointer flex items-start gap-3 ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <ClockIcon className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-400">
                              {getTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none ml-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/employer/profile')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/employer/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content - This is where child routes will render */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Import missing components
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default EmployerDashboard