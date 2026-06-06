/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from 'react'
import {
  Bell,
  Moon,
  Sun,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  Loader2,
  Key,
  Palette
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'

type ActiveTab = 'security' | 'notifications' | 'appearance'

interface NotificationPreferences {
  email_notifications: boolean
  application_alerts: boolean
  job_alerts: boolean
  marketing_emails: boolean
}

const EmployerSettings = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { darkMode, toggleDarkMode } = useTheme()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('security')
  const [loading, setLoading] = useState(false)

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    application_alerts: true,
    job_alerts: true,
    marketing_emails: false,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    fetchNotificationPreferences()
  }, [])

  const fetchNotificationPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences')
      if (response.data.success) {
        setNotifications(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Passwords do not match',
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      })
      return
    }

    try {
      setLoading(true)
      await api.post('/auth/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      })

      setPasswordMessage({
        type: 'success',
        text: 'Password updated successfully!',
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      setTimeout(() => {
        setPasswordMessage(null)
      }, 3000)
    } catch (error: any) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update password',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const updated = { ...notifications, [key]: value }
      setNotifications(updated)
      
      await api.put('/notifications/preferences', updated)
      
      toast({
        title: "Success",
        description: "Notification preferences updated",
      })
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update preferences",
      })
      fetchNotificationPreferences()
    }
  }

  const sidebarItems = [
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ]

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account security and preferences</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className={`rounded-2xl border p-6 lg:col-span-3 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            
            {/* SECURITY SECTION */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Security</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your password and security preferences</p>
                </div>

                {/* Password Update Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <h3 className="font-medium">Change Password</h3>
                  
                  {passwordMessage && (
                    <div className={`rounded-xl p-3 text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Current Password"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent pl-10 pr-10 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="New Password (min. 6 characters)"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent pl-10 pr-10 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm New Password"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Update Password
                  </Button>
                </form>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose how you want to receive updates</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-600 p-4">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive general updates via email.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference('email_notifications', !notifications.email_notifications)}
                      className={`relative h-6 w-12 rounded-full transition-all duration-300 ${notifications.email_notifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${notifications.email_notifications ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-600 p-4">
                    <div>
                      <h3 className="font-medium">Application Alerts</h3>
                      <p className="text-sm text-gray-500">Get notified when someone applies to your jobs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference('application_alerts', !notifications.application_alerts)}
                      className={`relative h-6 w-12 rounded-full transition-all duration-300 ${notifications.application_alerts ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${notifications.application_alerts ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-600 p-4">
                    <div>
                      <h3 className="font-medium">Job Alerts</h3>
                      <p className="text-sm text-gray-500">Receive updates about your job postings.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference('job_alerts', !notifications.job_alerts)}
                      className={`relative h-6 w-12 rounded-full transition-all duration-300 ${notifications.job_alerts ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${notifications.job_alerts ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-600 p-4">
                    <div>
                      <h3 className="font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive promotional offers and updates.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference('marketing_emails', !notifications.marketing_emails)}
                      className={`relative h-6 w-12 rounded-full transition-all duration-300 ${notifications.marketing_emails ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${notifications.marketing_emails ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE SECTION */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Appearance</h2>
                  <p className="text-sm text-gray-500 mt-1">Customize how the platform looks for you</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-600 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {darkMode ? <Moon className="h-4 w-4 text-blue-600" /> : <Sun className="h-4 w-4 text-blue-600" />}
                      <h3 className="font-medium">Dark Mode</h3>
                    </div>
                    <p className="text-sm text-gray-500">Toggle between dark and light themes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className={`relative h-6 w-12 rounded-full transition-all duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${darkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployerSettings