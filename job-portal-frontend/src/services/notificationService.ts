import api from './api'

export interface Notification {
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

export interface NotificationStats {
  total: number
  unread: number
  last_30_days: number
  by_type: Array<{
    type: string
    count: number
  }>
}

export interface NotificationFilters {
  type?: string
  is_read?: boolean
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface NotificationPreferences {
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

export interface NotificationResponse {
  notifications: Notification[]
  grouped?: Record<string, Notification[]>
  unread_count: number
  total: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ========== NOTIFICATION SERVICES ==========

// Get all notifications for current user
export const getNotifications = async (filters: NotificationFilters = {}): Promise<NotificationResponse> => {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString())
  if (filters.start_date) params.append('start_date', filters.start_date)
  if (filters.end_date) params.append('end_date', filters.end_date)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await api.get(`/notifications${params.toString() ? `?${params}` : ''}`)
  return response.data.data
}

// Get unread notification count
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread/count')
  return response.data.data.count
}

// Get notification by ID
export const getNotificationById = async (id: number): Promise<Notification> => {
  const response = await api.get(`/notifications/${id}`)
  return response.data.data
}

// Mark a notification as read
export const markAsRead = async (id: number): Promise<Notification> => {
  const response = await api.put(`/notifications/${id}/read`)
  return response.data.data
}

// Mark multiple notifications as read
export const markMultipleAsRead = async (ids: number[]): Promise<{ updated_count: number }> => {
  const response = await api.put('/notifications/read/multiple', { notification_ids: ids })
  return response.data.data
}

// Mark all notifications as read
export const markAllAsRead = async (): Promise<{ updated_count: number }> => {
  const response = await api.put('/notifications/all/read')
  return response.data.data
}

// Delete a notification
export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}`)
}

// Delete all read notifications
export const deleteAllRead = async (): Promise<{ deleted_count: number }> => {
  const response = await api.delete('/notifications/read/all')
  return response.data.data
}

// Get notification statistics
export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await api.get('/notifications/stats')
  return response.data.data
}

// Get notification preferences
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get('/notifications/preferences')
  return response.data.data
}

// Update notification preferences
export const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
  const response = await api.put('/notifications/preferences', preferences)
  return response.data.data
}

// Send test notification
export const sendTestNotification = async (): Promise<Notification> => {
  const response = await api.post('/notifications/test/send')
  return response.data.data
}

// ========== HELPER FUNCTIONS ==========

// Get notification icon based on type
export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'application_submitted':
    case 'application_received':
      return 'Briefcase'
    case 'status_change':
      return 'TrendingUp'
    case 'new_job':
      return 'Star'
    case 'interview_scheduled':
      return 'Calendar'
    case 'message':
      return 'MessageSquare'
    case 'job_alert':
      return 'Bell'
    case 'application_withdrawn':
      return 'X'
    case 'account_suspended':
    case 'account_activated':
      return 'AlertCircle'
    default:
      return 'Mail'
  }
}

// Get notification color based on type
export const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'application_submitted':
    case 'application_received':
      return 'text-blue-500'
    case 'status_change':
      return 'text-purple-500'
    case 'new_job':
      return 'text-yellow-500'
    case 'interview_scheduled':
      return 'text-green-500'
    case 'message':
      return 'text-indigo-500'
    case 'job_alert':
      return 'text-orange-500'
    case 'application_withdrawn':
      return 'text-red-500'
    case 'account_suspended':
    case 'account_activated':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

// Get notification type label
export const getNotificationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    application_submitted: 'Application Submitted',
    application_received: 'Application Received',
    status_change: 'Status Update',
    new_job: 'New Job',
    interview_scheduled: 'Interview Scheduled',
    message: 'Message',
    job_alert: 'Job Alert',
    application_withdrawn: 'Application Withdrawn',
    account_suspended: 'Account Suspended',
    account_activated: 'Account Activated'
  }
  return labels[type] || type
}

// Format notification time (relative)
export const formatNotificationTime = (date: string): string => {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffMs = now.getTime() - notificationDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
}

// Format notification date (full)
export const formatNotificationDate = (date: string): string => {
  return new Date(date).toLocaleString()
}

// Group notifications by date
export const groupNotificationsByDate = (notifications: Notification[]): Record<string, Notification[]> => {
  const grouped: Record<string, Notification[]> = {}
  
  notifications.forEach(notification => {
    const date = new Date(notification.created_at).toLocaleDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(notification)
  })
  
  return grouped
}

// Filter notifications by type
export const filterNotificationsByType = (notifications: Notification[], type: string): Notification[] => {
  if (type === 'all') return notifications
  return notifications.filter(n => n.type === type)
}

// Filter notifications by read status
export const filterNotificationsByReadStatus = (notifications: Notification[], isRead: boolean): Notification[] => {
  return notifications.filter(n => n.is_read === isRead)
}

// Get unread notifications
export const getUnreadNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(n => !n.is_read)
}

// Get read notifications
export const getReadNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(n => n.is_read)
}

// Get notifications by date range
export const getNotificationsByDateRange = (
  notifications: Notification[],
  startDate: Date,
  endDate: Date
): Notification[] => {
  return notifications.filter(n => {
    const date = new Date(n.created_at)
    return date >= startDate && date <= endDate
  })
}

// Get recent notifications (last N days)
export const getRecentNotifications = (notifications: Notification[], days: number = 7): Notification[] => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  return notifications.filter(n => new Date(n.created_at) >= cutoffDate)
}

// Get notification count by type
export const getNotificationCountByType = (notifications: Notification[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  notifications.forEach(notification => {
    counts[notification.type] = (counts[notification.type] || 0) + 1
  })
  return counts
}

// Check if there are unread notifications
export const hasUnreadNotifications = (notifications: Notification[]): boolean => {
  return notifications.some(n => !n.is_read)
}

// Get notification navigation path
export const getNotificationNavigationPath = (notification: Notification): string => {
  if (notification.metadata?.job_id) {
    return `/jobs/${notification.metadata.job_id}`
  }
  if (notification.metadata?.application_id) {
    return `/applications/${notification.metadata.application_id}/status`
  }
  if (notification.type === 'application_received') {
    return '/employer/applications'
  }
  return '/notifications'
}

const notificationService = {
  // API methods
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getNotificationStats,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  
  // Helper methods
  getNotificationIcon,
  getNotificationColor,
  getNotificationTypeLabel,
  formatNotificationTime,
  formatNotificationDate,
  groupNotificationsByDate,
  filterNotificationsByType,
  filterNotificationsByReadStatus,
  getUnreadNotifications,
  getReadNotifications,
  getNotificationsByDateRange,
  getRecentNotifications,
  getNotificationCountByType,
  hasUnreadNotifications,
  getNotificationNavigationPath
}

export default notificationService