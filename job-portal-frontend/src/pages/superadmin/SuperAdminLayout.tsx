/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
// src/pages/superadmin/SuperAdminLayout.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { logout } from '@/redux/slices/authSlice'
import { 
  LayoutDashboard, Users, Shield, FileText, Settings, Activity, Database,
  ChevronLeft, ChevronRight, LogOut, UserCircle, Bell, Search, 
  Building2, Briefcase, BarChart3, 
  Menu} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

// Import all super admin components
import SuperAdminDashboard from './Dashboard'
import AdminsManagement from './AdminsManagement'
import CompanyManagement from './CompanyManagement'
import AuditLogs from './AuditLogs'
import JobModeration from './JobModeration'
import BackupRestore from './BackupRestore'
import Applications from './Applications'
import Analytics from './Analytics'
import SystemHealth from './SystemHealth'
import SettingsPage from './Settings'

interface NavItem {
  id: string
  title: string
  icon: React.ElementType
  path: string
  component: React.ReactNode
}

interface AdminProfile {
  id: string
  email: string
  full_name: string
  avatar: string
  role: string
}

const SuperAdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    pendingReviews: 0
  })

  const navItems: NavItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard', component: <SuperAdminDashboard /> },
    { id: 'admins', title: 'Admin Management', icon: Users, path: '/super-admin/admins', component: <AdminsManagement /> },
    { id: 'companies', title: 'Companies', icon: Building2, path: '/super-admin/companies', component: <CompanyManagement /> },
    { id: 'jobs', title: 'Job Moderation', icon: Briefcase, path: '/super-admin/jobs', component: <JobModeration /> },
    { id: 'applications', title: 'Applications', icon: FileText, path: '/super-admin/applications', component: <Applications /> },
    { id: 'analytics', title: 'Analytics', icon: BarChart3, path: '/super-admin/analytics', component: <Analytics /> },
    { id: 'audit', title: 'Audit Logs', icon: FileText, path: '/super-admin/audit', component: <AuditLogs /> },
    { id: 'backup', title: 'Backup & Restore', icon: Database, path: '/super-admin/backup', component: <BackupRestore /> },
    { id: 'health', title: 'System Health', icon: Activity, path: '/super-admin/health', component: <SystemHealth /> },
    { id: 'settings', title: 'Settings', icon: Settings, path: '/super-admin/settings', component: <SettingsPage /> },
  ]

  useEffect(() => {
    fetchAdminProfile()
    fetchNotifications()
    fetchSystemStats()
    
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/admin/profile')
      if (response.data.success) {
        setAdminProfile(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error)
    }
  }

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

  const fetchSystemStats = async () => {
    try {
      const response = await api.get('/super-admin/stats')
      if (response.data.success) {
        setSystemStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: number) => {
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
      toast({ title: "Success", description: "All notifications marked as read" })
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'user': return <Users className="h-4 w-4 text-blue-500" />
      case 'job': return <Briefcase className="h-4 w-4 text-green-500" />
      case 'application': return <FileText className="h-4 w-4 text-purple-500" />
      case 'admin': return <Shield className="h-4 w-4 text-red-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
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
    if (adminProfile?.full_name) return adminProfile.full_name.charAt(0).toUpperCase()
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'SA'
  }

  const getUserName = () => {
    if (adminProfile?.full_name) return adminProfile.full_name
    if (user?.full_name) return user.full_name
    if (user?.email) return user.email.split('@')[0]
    return 'Super Admin'
  }

  // FIXED: Complete logout function that works immediately
  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('admin_token')
    localStorage.removeItem('accessToken')
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Dispatch Redux logout action to clear state
    dispatch(logout())
    
    // Clear axios default headers
    delete api.defaults.headers.common['Authorization']
    
    // Navigate to login page
    navigate('/login', { replace: true })
    
    // Show toast message
    toast({ 
      title: "Logged out", 
      description: "You have been logged out successfully" 
    })
    
    // Force reload to clear any cached state
    setTimeout(() => {
      window.location.href = '/login'
    }, 50)
  }

  const getCurrentComponent = () => {
    const currentItem = navItems.find(item => item.id === activeTab)
    return currentItem ? currentItem.component : <SuperAdminDashboard />
  }

  // Update active tab based on URL path
  useEffect(() => {
    const currentPath = location.pathname
    const currentItem = navItems.find(item => item.path === currentPath)
    if (currentItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(currentItem.id)
    }
  }, [location.pathname])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm hidden lg:flex`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg text-gray-800">Super Admin</span>
            </div>
          ) : (
            <Shield className="h-6 w-6 text-blue-600 mx-auto" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Info Section */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-blue-100">
                {adminProfile?.avatar ? (
                  <AvatarImage src={adminProfile.avatar} />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                    {getUserInitial()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{getUserName()}</p>
                <p className="text-xs text-gray-500 truncate">Super Administrator</p>
                <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">Full Access</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    navigate(item.path)
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">{item.title}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer Section - FIXED LOGOUT */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-8 w-8">
                  {adminProfile?.avatar ? (
                    <AvatarImage src={adminProfile.avatar} />
                  ) : (
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      {getUserInitial()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">{getUserName()}</p>
                    <p className="text-xs text-gray-500">Super Admin</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-700">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/super-admin/profile')} className="text-gray-600 cursor-pointer">
                <UserCircle className="h-4 w-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/super-admin/settings')} className="text-gray-600 cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <div className="flex flex-col h-full">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-lg text-gray-800">Super Admin</span>
              </div>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-blue-100">
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{getUserName()}</p>
                  <p className="text-xs text-gray-500">Super Administrator</p>
                  <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">Full Access</Badge>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
              <div className="space-y-1 px-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        navigate(item.path)
                        setMobileSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium flex-1 text-left">{item.title}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Mobile Logout Button - FIXED */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {navItems.find(item => item.id === activeTab)?.title}
                </h2>
                <p className="text-sm text-gray-500">
                  Super Admin Panel • {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  className="border-0 bg-transparent p-0 h-7 w-64 focus-visible:ring-0 text-sm"
                />
              </div>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0 bg-white border-gray-200">
                  <div className="sticky top-0 bg-white border-b border-gray-100 p-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                          !notif.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notif.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                        </div>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none ml-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition">
                    <Avatar className="h-8 w-8">
                      {adminProfile?.avatar ? (
                        <AvatarImage src={adminProfile.avatar} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                          {getUserInitial()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                  <DropdownMenuLabel className="text-gray-900">
                    <div>
                      <p>{getUserName()}</p>
                      <p className="text-xs text-gray-500 font-normal">Super Administrator</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/super-admin/profile')} className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/super-admin/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {getCurrentComponent()}
        </div>
      </main>
    </div>
  )
}

export default SuperAdminLayout