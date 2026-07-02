import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

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

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  stats: NotificationStats | null
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  totalItems: number
  filters: NotificationFilters
}

// ========== INITIAL STATE ==========
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  stats: null,
  preferences: null,
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  filters: {
    page: 1,
    limit: 20
  }
}

// Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (filters: NotificationFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString())
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    
    const response = await api.get(`/notifications${params.toString() ? `?${params}` : ''}`)
    return response.data
  }
)

// Get unread count
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const response = await api.get('/notifications/unread/count')
    return response.data.data.count
  }
)

// Get notification statistics
export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchNotificationStats',
  async () => {
    const response = await api.get('/notifications/stats')
    return response.data.data
  }
)

// Get notification preferences
export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchNotificationPreferences',
  async () => {
    const response = await api.get('/notifications/preferences')
    return response.data.data
  }
)

// Update notification preferences
export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updateNotificationPreferences',
  async (preferences: Partial<NotificationPreferences>) => {
    const response = await api.put('/notifications/preferences', preferences)
    return response.data.data
  }
)

// Mark a single notification as read
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number) => {
    await api.put(`/notifications/${id}/read`)
    return id
  }
)

// Mark multiple notifications as read
export const markMultipleAsRead = createAsyncThunk(
  'notifications/markMultipleAsRead',
  async (ids: number[]) => {
    await api.put('/notifications/read/multiple', { notification_ids: ids })
    return ids
  }
)

// Mark all notifications as read
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await api.put('/notifications/all/read')
    return true
  }
)

// Delete a single notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id: number) => {
    await api.delete(`/notifications/${id}`)
    return id
  }
)

// Delete all read notifications
export const deleteAllRead = createAsyncThunk(
  'notifications/deleteAllRead',
  async () => {
    await api.delete('/notifications/read/all')
    return true
  }
)

// Send test notification
export const sendTestNotification = createAsyncThunk(
  'notifications/sendTestNotification',
  async () => {
    const response = await api.post('/notifications/test/send')
    return response.data.data
  }
)

// ========== SLICE ==========
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<NotificationFilters>>) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 }
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20
      }
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetState: () => initialState,
    // Optimistic update: mark as read
    optimisticMarkAsRead: (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.is_read) {
        notification.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
        if (state.stats) {
          state.stats.unread = Math.max(0, state.stats.unread - 1)
        }
      }
    },
    // Optimistic update: mark all as read
    optimisticMarkAllAsRead: (state) => {
      state.notifications.forEach(n => {
        n.is_read = true
      })
      state.unreadCount = 0
      if (state.stats) {
        state.stats.unread = 0
      }
    },
    // Optimistic update: delete notification
    optimisticDeleteNotification: (state, action: PayloadAction<number>) => {
      const deleted = state.notifications.find(n => n.id === action.payload)
      if (deleted && !deleted.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
        if (state.stats) {
          state.stats.unread = Math.max(0, state.stats.unread - 1)
        }
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
      state.totalItems -= 1
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      state.totalItems += 1
      state.unreadCount += 1
      if (state.stats) {
        state.stats.unread += 1
        state.stats.total += 1
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false
        state.notifications = action.payload.data.notifications
        state.unreadCount = action.payload.data.unread_count
        state.totalPages = action.payload.pagination?.pages || 1
        state.currentPage = action.payload.pagination?.page || 1
        state.totalItems = action.payload.pagination?.total || 0
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch notifications'
      })
      
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
      
      // Fetch Notification Stats
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      
      // Fetch Notification Preferences
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload
      })
      
      // Update Notification Preferences
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload)
        if (notification && !notification.is_read) {
          notification.is_read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
          if (state.stats) {
            state.stats.unread = Math.max(0, state.stats.unread - 1)
          }
        }
      })
      
      // Mark Multiple as Read
      .addCase(markMultipleAsRead.fulfilled, (state, action) => {
        const ids = action.payload
        let markedCount = 0
        state.notifications.forEach(notification => {
          if (ids.includes(notification.id) && !notification.is_read) {
            notification.is_read = true
            markedCount++
          }
        })
        state.unreadCount = Math.max(0, state.unreadCount - markedCount)
        if (state.stats) {
          state.stats.unread = Math.max(0, state.stats.unread - markedCount)
        }
      })
      
      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.is_read = true
        })
        state.unreadCount = 0
        if (state.stats) {
          state.stats.unread = 0
        }
      })
      
      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deleted = state.notifications.find(n => n.id === action.payload)
        if (deleted && !deleted.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
          if (state.stats) {
            state.stats.unread = Math.max(0, state.stats.unread - 1)
          }
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload)
        state.totalItems -= 1
      })
      
      // Delete All Read
      .addCase(deleteAllRead.fulfilled, (state) => {
        state.notifications = state.notifications.filter(n => !n.is_read)
        // Unread count stays the same, total items decreases
        state.totalItems = state.notifications.length
      })
      
      // Send Test Notification
      .addCase(sendTestNotification.fulfilled, (state, action) => {
        // Optionally add test notification to list
        if (action.payload) {
          state.notifications.unshift(action.payload)
          state.totalItems += 1
          state.unreadCount += 1
        }
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  clearError,
  resetState,
  optimisticMarkAsRead,
  optimisticMarkAllAsRead,
  optimisticDeleteNotification,
  addNotification
} = notificationSlice.actions

export default notificationSlice.reducer