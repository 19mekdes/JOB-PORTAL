/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Bell,
  BellDot,
  CheckCheck,
  X,
  Mail,
  Briefcase,
  Calendar,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Star
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { RootState } from '../../redux/store'
import api from '../../services/api'

interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: {
    job_id?: string
    application_id?: string
    company_name?: string
    job_title?: string
  }
}

interface NotificationBellProps {
  className?: string
  onNotificationClick?: (notification: Notification) => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'application_submitted':
    case 'application_received':
      return <Briefcase className="h-4 w-4 text-blue-500" />
    case 'status_change':
      return <TrendingUp className="h-4 w-4 text-purple-500" />
    case 'new_job':
      return <Star className="h-4 w-4 text-yellow-500" />
    case 'interview_scheduled':
      return <Calendar className="h-4 w-4 text-green-500" />
    case 'message':
      return <MessageSquare className="h-4 w-4 text-indigo-500" />
    case 'job_alert':
      return <Bell className="h-4 w-4 text-orange-500" />
    case 'application_withdrawn':
      return <X className="h-4 w-4 text-red-500" />
    case 'account_suspended':
    case 'account_activated':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <Mail className="h-4 w-4 text-gray-500" />
  }
}

const getTimeAgo = (date: string) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return `${months}mo ago`
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  onNotificationClick
}) => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
      // Poll for new notifications every 30 seconds
      intervalRef.current = setInterval(fetchUnreadCount, 30000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/notifications?limit=20')
      // FIXED: API response structure
      const data = response.data.data
      // Check if data is an array or has notifications property
      if (Array.isArray(data)) {
        setNotifications(data)
      } else if (data?.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count || 0)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count')
      setUnreadCount(response.data.data?.count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setIsMarkingAll(true)
    try {
      await api.put('/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notifications as read",
      })
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    // Handle navigation based on notification type
    if (notification.metadata?.job_id) {
      navigate(`/jobs/${notification.metadata.job_id}`)
    } else if (notification.metadata?.application_id) {
      navigate(`/applications/${notification.metadata.application_id}`)
    } else if (notification.type === 'application_received') {
      navigate('/employer/applications')
    }
    
    onNotificationClick?.(notification)
    setIsOpen(false)
  }

  if (!user) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}>
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5 text-gray-700" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isMarkingAll}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4 inline mr-1" />
              Mark all read
            </button>
          )}
        </div>
        
        <ScrollArea className="h-100">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No notifications</p>
              <p className="text-sm text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(notification.created_at)}
                        </span>
                        {notification.metadata?.company_name && (
                          <Badge variant="outline" className="text-xs">
                            {notification.metadata.company_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <button
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/notifications')
                }}
              >
                View All Notifications
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell