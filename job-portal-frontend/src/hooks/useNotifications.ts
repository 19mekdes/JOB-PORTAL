/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { toast } from '@/hooks/use-toast'
import api from '../services/api'

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

interface NotificationFilters {
  type?: string
  is_read?: boolean
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

interface NotificationStats {
  total: number
  unread: number
  last_30_days: number
  by_type: Array<{
    type: string
    count: number
  }>
}

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  application_updates: boolean
  new_job_alerts: boolean
  status_changes: boolean
  marketing_emails: boolean
  weekly_digest: boolean
  interview_reminders: boolean
  message_notifications: boolean
  job_recommendations: boolean
}

interface UseNotificationsReturn {
  notifications: Notification[]
  stats: NotificationStats | null
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  unreadCount: number
  filters: NotificationFilters
  setFilters: (filters: NotificationFilters) => void
  fetchNotifications: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchPreferences: () => Promise<void>
  markAsRead: (id: number) => Promise<boolean>
  markMultipleAsRead: (ids: number[]) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (id: number) => Promise<boolean>
  deleteAllRead: () => Promise<boolean>
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<boolean>
  sendTestNotification: () => Promise<boolean>
  getUnreadCount: () => Promise<number>
}

export const useNotifications = (initialFilters?: NotificationFilters): UseNotificationsReturn => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
    ...initialFilters
  })

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit
      }
      if (filters.type) params.type = filters.type
      if (filters.is_read !== undefined) params.is_read = filters.is_read
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      
      const response = await api.get('/notifications', { params })
      setNotifications(response.data.data.notifications)
      setTotalPages(response.data.pagination.pages)
      setCurrentPage(response.data.pagination.page)
      setUnreadCount(response.data.data.unread_count)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }, [user, filters])

  const fetchStats = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await api.get('/notifications/stats')
      setStats(response.data.data)
    } catch (err: any) {
      console.error('Error fetching notification stats:', err)
    }
  }, [user])

  const fetchPreferences = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await api.get('/notifications/preferences')
      setPreferences(response.data.data)
    } catch (err: any) {
      console.error('Error fetching notification preferences:', err)
    }
  }, [user])

  const markAsRead = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: prev.unread - 1 } : null)
      }
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to mark notification as read",
      })
      return false
    }
  }, [stats])

  const markMultipleAsRead = useCallback(async (ids: number[]): Promise<boolean> => {
    try {
      await api.put('/notifications/read/multiple', { notification_ids: ids })
      setNotifications(prev => prev.map(n => 
        ids.includes(n.id) ? { ...n, is_read: true } : n
      ))
      const markedCount = ids.length
      setUnreadCount(prev => Math.max(0, prev - markedCount))
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: prev.unread - markedCount } : null)
      }
      toast({
        title: "Success",
        description: `${markedCount} notification${markedCount > 1 ? 's' : ''} marked as read`,
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to mark notifications as read",
      })
      return false
    }
  }, [stats])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      await api.put('/notifications/all/read')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: 0 } : null)
      }
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to mark all as read",
      })
      return false
    }
  }, [stats])

  const deleteNotification = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/notifications/${id}`)
      const deleted = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        if (stats) {
          setStats(prev => prev ? { ...prev, unread: prev.unread - 1 } : null)
        }
      }
      toast({
        title: "Success",
        description: "Notification deleted",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to delete notification",
      })
      return false
    }
  }, [notifications, stats])

  const deleteAllRead = useCallback(async (): Promise<boolean> => {
    try {
      await api.delete('/notifications/read/all')
      setNotifications(prev => prev.filter(n => !n.is_read))
      toast({
        title: "Success",
        description: "All read notifications deleted",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to delete read notifications",
      })
      return false
    }
  }, [])

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const response = await api.put('/notifications/preferences', prefs)
      setPreferences(prev => prev ? { ...prev, ...response.data.data } : response.data.data)
      toast({
        variant: "success",
        title: "Success",
        description: "Notification preferences updated",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update preferences",
      })
      return false
    }
  }, [])

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      await api.post('/notifications/test/send')
      toast({
        title: "Test Sent",
        description: "Test notification has been sent",
      })
      return true
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to send test notification",
      })
      return false
    }
  }, [])

  const getUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const response = await api.get('/notifications/unread/count')
      return response.data.data.count
    } catch (err) {
      console.error('Error fetching unread count:', err)
      return 0
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchStats()
      fetchPreferences()
    }
  }, [user, fetchNotifications, fetchStats, fetchPreferences])

  // Real-time polling for new notifications (every 30 seconds)
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      getUnreadCount().then(count => {
        if (count > unreadCount) {
          fetchNotifications()
          fetchStats()
          // Show toast for new notification
          toast({
            title: "New Notification",
            description: "You have a new notification",
          })
        }
        setUnreadCount(count)
      })
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, unreadCount, fetchNotifications, fetchStats, getUnreadCount])

  return {
    notifications,
    stats,
    preferences,
    isLoading,
    error,
    totalPages,
    currentPage,
    unreadCount,
    filters,
    setFilters,
    fetchNotifications,
    fetchStats,
    fetchPreferences,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    updatePreferences,
    sendTestNotification,
    getUnreadCount
  }
}

// Hook for real-time notification subscription (WebSocket)
export const useRealtimeNotifications = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [lastNotification, setLastNotification] = useState<Notification | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (!user) return

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLastNotification(data)
      // Show toast for real-time notification
      toast({
        title: data.title,
        description: data.message,
      })
    }

    websocket.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setWs(websocket)

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [user])

  const sendMessage = useCallback((message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }, [ws])

  return {
    isConnected,
    lastNotification,
    sendMessage
  }
}

// Hook for notification badge (simplified)
export const useNotificationBadge = () => {
  const { unreadCount, fetchStats } = useNotifications()
  
  useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
  return {
    count: unreadCount,
    hasUnread: unreadCount > 0
  }
}

export default useNotifications