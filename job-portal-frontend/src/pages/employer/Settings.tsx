/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import { useState, useEffect, useRef } from 'react'
import {
  Bell,
  Moon,
  Sun,
  User,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Camera,
  Save,
  Loader2,
  Phone,
  Briefcase,
  Mail,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext' // Import the theme hook
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ActiveTab = 'profile' | 'security' | 'notifications'

interface ProfileData {
  full_name: string
  email: string
  phone: string
  position: string
  avatar: string | null
}

interface NotificationPreferences {
  email_notifications: boolean
  application_alerts: boolean
  marketing_emails: boolean
}

const Settings = () => {
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useSelector((state: RootState) => state.auth)
  const { darkMode, toggleDarkMode } = useTheme() // Use global theme
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    avatar: null,
  })

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    application_alerts: true,
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
    fetchProfile()
    fetchNotificationPreferences()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/profile/me')
      const data = response.data.data
      const userData = data.user
      const profileDataResult = data.profile

      setProfileData({
        full_name: userData?.full_name || profileDataResult?.full_name || '',
        email: userData?.email || '',
        phone: profileDataResult?.phone || '',
        position: profileDataResult?.title || profileDataResult?.position || '',
        avatar: profileDataResult?.avatar || null,
      })

      if (profileDataResult?.avatar) {
        setAvatarPreview(profileDataResult.avatar)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select an image file",
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Image size must be less than 5MB",
        })
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return false
    
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      
      const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        const avatarUrl = response.data.data.avatar
        setProfileData(prev => ({ ...prev, avatar: avatarUrl }))
        setAvatarPreview(avatarUrl)
        setAvatarFile(null)
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        })
        return true
      }
      return false
    
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to upload profile picture",
      })
      return false
    } finally {
      setUploadingAvatar(false)
    }
  }

  const deleteAvatar = async () => {
    try {
      const response = await api.delete('/profile/avatar')
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, avatar: null }))
        setAvatarPreview(null)
        setAvatarFile(null)
        toast({
          title: "Success",
          description: "Profile picture removed successfully",
        })
      }
    
    } catch (error: any) {
      console.error('Error deleting avatar:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to remove profile picture",
      })
    } finally {
      setShowDeleteAvatarDialog(false)
    }
  }

  const handleSaveProfile = async () => {
    if (avatarFile) {
      const uploadSuccess = await uploadAvatar()
      if (!uploadSuccess) return
    }
    
    setSavingProfile(true)
    try {
      await api.put('/auth/profile', {
        full_name: profileData.full_name,
        phone: profileData.phone,
        title: profileData.position,
      })
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      
      await fetchProfile()
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
      })
    } finally {
      setSavingProfile(false)
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
      await api.put('/auth/change-password', {
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
    { id: 'profile' as const, label: 'Profile Settings', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
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
          <p className="text-sm text-gray-500">Manage your account settings and preferences.</p>
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
            
            {/* PROFILE SECTION */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Profile Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your personal information and profile picture</p>
                </div>

                {/* Avatar / Profile Picture */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-600">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt="Profile" className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-blue-600 text-white text-2xl">
                          {profileData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 rounded-full bg-blue-600 p-2 text-white shadow-lg hover:bg-blue-700 transition"
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or WEBP. Max 5MB.</p>
                    {profileData.avatar && (
                      <button
                        onClick={() => setShowDeleteAvatarDialog(true)}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="full_name"
                        value={profileData.full_name}
                        onChange={handleProfileChange}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        disabled
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 pl-10 pr-4 py-3 outline-none cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support for assistance.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Job Title / Position</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="position"
                        value={profileData.position}
                        onChange={handleProfileChange}
                        placeholder="e.g., HR Manager, Recruiter"
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile || uploadingAvatar}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {savingProfile || uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Profile
                </Button>
              </div>
            )}

            {/* SECURITY SECTION */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Security</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your password and security preferences</p>
                </div>

                {/* Dark Mode - Now using global toggle */}
                <div className="flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-600 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {darkMode ? <Moon className="h-4 w-4 text-blue-600" /> : <Sun className="h-4 w-4 text-blue-600" />}
                      <h3 className="font-medium">Dark Mode</h3>
                    </div>
                    <p className="text-sm text-gray-500">Toggle between dark and light themes globally.</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDarkMode} // Use global toggle function
                    className={`relative h-6 w-12 rounded-full transition-all duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${darkMode ? 'left-7' : 'left-1'}`} />
                  </button>
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
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Current Password"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
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
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="New Password"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm Password"
                    required
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
                      <p className="text-sm text-gray-500">Receive updates via email.</p>
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
                      <p className="text-sm text-gray-500">Get notified for new applications.</p>
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
          </div>
        </div>
      </div>

      {/* Delete Avatar Confirmation Dialog */}
      <AlertDialog open={showDeleteAvatarDialog} onOpenChange={setShowDeleteAvatarDialog}>
        <AlertDialogContent className={darkMode ? 'dark bg-gray-800 text-white' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture?</AlertDialogTitle>
            <AlertDialogDescription className={darkMode ? 'text-gray-400' : ''}>
              This action will permanently remove your profile picture. You can upload a new one anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : ''}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteAvatar} className="bg-red-600 hover:bg-red-700">
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Settings