/* eslint-disable react-hooks/immutability */
// src/pages/JobSeekerLayout.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { logout } from '@/redux/slices/authSlice'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Bookmark,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
  X,
  Clock as ClockIcon,
  MessageSquare,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const JobSeekerLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [liveAvatar, setLiveAvatar] = useState<string | null>(null)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { path: '/applications', label: 'My Applications', icon: FileText },
    { path: '/bookmarks', label: 'Saved Jobs', icon: Bookmark },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
    { path: '/jobseeker/preferences', label: 'Preferences', icon: Settings },
  ]

  useEffect(() => {
    fetchNotifications()
    if (user) {
      fetchLiveProfileAvatar()
    }
    
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
  }, [user, location.pathname])

  const fetchLiveProfileAvatar = async () => {
    try {
      const response = await api.get('/profile/me')
      const profileData = response.data.data?.profile
      if (profileData?.avatar) {
        setLiveAvatar(profileData.avatar)
      } else {
        setLiveAvatar(null)
      }
    } catch (error) {
      console.error('Error synchronizing layout image assets:', error)
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
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'job':
        return <Briefcase className="h-4 w-4 text-green-600" />
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
    return 'U'
  }

  // ✅ FIXED: Complete logout function
  const handleLogout = () => {
    console.log('🔓 Logging out...')
    
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
    
    // Clear axios default headers (if you have axios instance)
    delete api.defaults.headers.common['Authorization']
    
    // Navigate to login page
    navigate('/login', { replace: true })
    
    // Force reload to clear any cached state
    setTimeout(() => {
      window.location.href = '/login'
    }, 50)
    
    toast({
      title: "Signed Out",
      description: "You have been successfully logged out.",
    })
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
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

      {/* Desktop Sidebar Wrapper */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileSidebarOpen ? 'translate-x-0 w-64' : ''}
        hidden lg:block
      `}>
        <div className="flex flex-col h-full">
          {/* Header Bar Identity logo */}
          <div className={`flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'} h-16 border-b border-gray-200`}>
            {sidebarOpen ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">JobSeeker Hub</span>
                </Link>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-5 w-5 text-gray-500" />
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="flex items-center justify-center w-full">
                  <Briefcase className="h-7 w-7 text-blue-600" />
                </Link>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="absolute -right-3 top-5 p-1 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-100 transition"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4 text-gray-500" />
                </button>
              </>
            )}
          </div>

          {/* Fixed Sidebar Profile Card Component Section */}
          {sidebarOpen ? (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-100">
                  {liveAvatar && <AvatarImage src={liveAvatar} alt="Profile Picture" className="object-cover" />}
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user?.full_name || 'Job Seeker'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 border-b border-gray-200 flex justify-center">
              <Avatar className="h-10 w-10 border border-gray-100">
                {liveAvatar && <AvatarImage src={liveAvatar} alt="Profile Picture" className="object-cover" />}
                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Navigation Items map */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                  } ${!sidebarOpen && 'justify-center'}`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Logout Action Footer link container - FIXED */}
          <div className={`p-4 border-t border-gray-200 ${!sidebarOpen && 'flex justify-center'}`}>
            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition ${!sidebarOpen ? 'justify-center w-full' : 'w-full'}`}
              title={!sidebarOpen ? 'Sign Out' : ''}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Responsive Left Drawer Sidebar */}
      <div className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-lg transition-transform duration-300
        lg:hidden
        ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">JobSeeker Hub</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-gray-100">
                {liveAvatar && <AvatarImage src={liveAvatar} alt="Profile Picture" className="object-cover" />}
                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{user?.full_name || 'Job Seeker'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

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

          {/* Mobile Logout Button - FIXED */}
          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout Block Container */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Navbar Header Component bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search jobs..."
                  className="border-0 bg-transparent p-0 h-7 w-80 focus-visible:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications Dropdown Container */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
                    <Bell className="h-5 w-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0 bg-white border border-gray-200 shadow-lg">
                  <div className="sticky top-0 bg-white border-b border-gray-100 p-3 flex justify-between items-center">
                    <DropdownMenuLabel className="p-0 text-gray-900 font-semibold text-sm">
                      Notifications
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">New notifications will appear here</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`p-3 cursor-pointer flex items-start gap-3 ${
                          !notification.is_read ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-800'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
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

              {/* Fixed Top-Right Dropdown Account Menu Component */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none ml-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition cursor-pointer">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      {liveAvatar && <AvatarImage src={liveAvatar} alt="Navbar Profile Trigger" className="object-cover" />}
                      <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-600 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                  <DropdownMenuLabel className="text-gray-900 font-semibold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-gray-100">
                    <UserCircle className="mr-2 h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/jobseeker/preferences')} className="cursor-pointer hover:bg-gray-100">
                    <Settings className="mr-2 h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Preferences</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4 text-red-600" />
                    <span className="text-red-600">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* View Inject Window */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default JobSeekerLayout