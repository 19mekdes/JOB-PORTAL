import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  Menu,
  LogOut,
  Bell,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Import all admin components - FIXED to match your actual file names
import Dashboard from './admin/Dashboard'
import UsersManagement from './admin/Users'
import JobsManagement from './admin/Jobs'
import ApplicationsManagement from './admin/Applications'
import Analytics from './admin/Analytics'
import BackupRestore from './admin/BackupRestore'
import SettingsPage from './admin/Settings'

const AdminPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state: RootState) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Navigation items with components - FIXED paths
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
    { path: '/admin/users', label: 'User Management', icon: Users, component: UsersManagement },
    { path: '/admin/jobs', label: 'Job Moderation', icon: Briefcase, component: JobsManagement },
    { path: '/admin/applications', label: 'Applications', icon: FileText, component: ApplicationsManagement },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, component: Analytics },
    { path: '/admin/backup', label: 'Backup & Restore', icon: Database, component: BackupRestore },
    { path: '/admin/settings', label: 'Settings', icon: Settings, component: SettingsPage },
  ]

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'A'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Mock data for dashboard stats
  const stats = [
    { title: 'Total Users', value: '12,847', icon: Users, change: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Jobs', value: '3,421', icon: Briefcase, change: '+8%', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Applications', value: '45,892', icon: FileText, change: '+23%', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Pending Reports', value: '23', icon: AlertCircle, change: '-5%', color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  // Mock data for recent users
  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Employer', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Job Seeker', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Job Seeker', status: 'inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Employer', status: 'active' },
  ]

  // Mock data for pending jobs
  const pendingJobs = [
    { id: 1, title: 'Senior React Developer', company: 'TechCorp', posted: '2024-01-15' },
    { id: 2, title: 'Product Manager', company: 'Innovate Inc', posted: '2024-01-14' },
    { id: 3, title: 'UX Designer', company: 'Design Studio', posted: '2024-01-13' },
  ]

  // If not admin or super admin
  if (user?.user_type !== 'Admin' && user?.user_type !== 'Super Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="text-center p-8 max-w-md shadow-lg">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">
            Admin privileges required to access this page.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  // Find current component to render
  const CurrentComponent = navItems.find(item => item.path === location.pathname)?.component || Dashboard

  // Dashboard content
  if (location.pathname === '/admin/dashboard') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="font-semibold text-lg text-gray-900 hidden sm:inline">
                  Admin Panel
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent p-0 h-7 w-48 focus-visible:ring-0 text-sm"
                />
              </div>
              <button className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate('/profile')}>
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getInitials(user?.full_name || user?.email || 'A')}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="hover:shadow-lg transition border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {stat.change}
                        </p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Users</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.role === 'Employer' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Moderation</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/jobs')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.company} • {job.posted}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-green-600 h-8 w-8 p-0">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 h-8 w-8 p-0">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'New user registered', user: 'john@example.com', time: '2 minutes ago' },
                  { action: 'Job posted for review', user: 'techcorp@example.com', time: '15 minutes ago' },
                  { action: 'Report filed for spam', user: 'jane@example.com', time: '1 hour ago' },
                  { action: 'User account suspended', user: 'Admin', time: '3 hours ago' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.user}</p>
                    </div>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // For other admin routes (users, jobs, etc.)
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg text-gray-900">
              {navItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {user?.user_type}
            </Badge>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(user?.full_name || user?.email || 'A')}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16 transition-all duration-300`}>
          <nav className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content - Renders the selected component */}
        <main className="flex-1 p-6 bg-white">
          <CurrentComponent />
        </main>
      </div>
    </div>
  )
}

export default AdminPage