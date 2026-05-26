// src/pages/admin/AdminProfile.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Bell,
  Shield,
  Save,
  RefreshCw,
  Camera,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  LogOut,
  Key,
  Smartphone,
  Globe,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { useDispatch } from 'react-redux'
import { logout } from '@/redux/slices/authSlice'

interface AdminProfileData {
  id: string
  email: string
  full_name: string
  phone: string
  location: string
  avatar: string
  role: string
  created_at: string
  last_login: string
  two_factor_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  security_alerts: boolean
}

const AdminProfile: React.FC = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState<AdminProfileData | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [securityScore, setSecurityScore] = useState(0)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  // Calculate security score
  useEffect(() => {
    let score = 0
    if (profile?.two_factor_enabled) score += 50
    if (profile?.email_notifications) score += 25
    if (profile?.security_alerts) score += 25
    setSecurityScore(score)
  }, [profile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/profile')
      const data = response.data.data
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        location: data.location || ''
      })
      if (data.avatar) {
        setAvatarPreview(data.avatar)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile" })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Error", description: "Please upload an image file (JPEG, PNG, or GIF)" })
        return
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Error", description: "Image must be less than 2MB" })
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return
    
    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', avatarFile)
    
    try {
      const response = await api.post('/admin/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        toast({ title: "Success", description: "Profile picture updated successfully!" })
        setAvatarFile(null)
        // Refresh profile to get new avatar URL
        await fetchProfile()
      } else {
        throw new Error(response.data.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to upload profile picture" 
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const deleteAvatar = async () => {
    setDeletingAvatar(true)
    try {
      const response = await api.delete('/admin/profile/avatar')
      
      if (response.data.success) {
        toast({ title: "Success", description: "Profile picture removed successfully!" })
        setAvatarPreview(null)
        setAvatarFile(null)
        await fetchProfile()
      } else {
        throw new Error(response.data.message || 'Deletion failed')
      }
    } catch (error: any) {
      console.error('Error deleting avatar:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to remove profile picture" 
      })
    } finally {
      setDeletingAvatar(false)
    }
  }

  const cancelAvatarUpload = () => {
    setAvatarFile(null)
    if (avatarPreview && !profile?.avatar) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    } else if (profile?.avatar) {
      setAvatarPreview(profile.avatar)
      setAvatarFile(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      await api.put('/admin/profile', formData)
      toast({ title: "Success", description: "Profile updated successfully" })
      await fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" })
      return
    }
    
    if (passwordData.new_password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" })
      return
    }
    
    setSaving(true)
    try {
      await api.put('/admin/profile/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      toast({ title: "Success", description: "Password updated successfully" })
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to update password" })
    } finally {
      setSaving(false)
    }
  }

  const updatePreferences = async (key: string, value: boolean) => {
    try {
      await api.put('/admin/profile/preferences', { [key]: value })
      setProfile(prev => prev ? { ...prev, [key]: value } : null)
      toast({ title: "Success", description: "Preferences updated" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update preferences" })
    }
  }

  const enableTwoFactor = async () => {
    try {
      const response = await api.post('/admin/profile/2fa/enable')
      toast({ title: "Success", description: "Two-factor authentication enabled" })
      fetchProfile()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to enable 2FA" })
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'A'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">Administrator</Badge>
      </div>

      {/* Security Score Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">Security Score</p>
              <p className="text-2xl font-bold text-blue-900">{securityScore}%</p>
              <p className="text-xs text-blue-700 mt-1">Your account security level</p>
            </div>
            <div className="flex-1 max-w-md">
              <Progress value={securityScore} className="h-2 bg-blue-200" />
              <div className="flex justify-between text-xs text-blue-700 mt-2">
                <span>⚠️ Weak</span>
                <span>🟡 Moderate</span>
                <span>✅ Strong</span>
              </div>
            </div>
            {securityScore < 100 && (
              <Button variant="outline" size="sm" onClick={() => setActiveTab('security')} className="border-blue-300 text-blue-700">
                Improve Security
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section with Upload */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Admin Avatar" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                        {getInitials(profile?.full_name || 'Admin')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white p-1"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleAvatarChange}
                  />
                </div>
                
                {/* Avatar Action Buttons */}
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-sm text-gray-600">Upload a profile picture</p>
                  <p className="text-xs text-gray-400">JPEG, PNG, GIF up to 2MB</p>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-gray-300"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                    {avatarPreview && profile?.avatar && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={deleteAvatar}
                        disabled={deletingAvatar}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {deletingAvatar ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Preview & Confirm Section */}
              {avatarFile && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">New Profile Picture Ready</p>
                        <p className="text-xs text-blue-600">{avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelAvatarUpload}
                        className="border-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={uploadAvatar} 
                        disabled={uploadingAvatar}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {uploadingAvatar ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Picture
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1.5"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={profile?.email || ''}
                    disabled
                    className="mt-1.5 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1.5"
                    placeholder="+251 912 345 678"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1.5"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Current Password</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showPassword}
                      onCheckedChange={setShowPassword}
                    />
                    <span className="text-sm text-gray-600">Show passwords</span>
                  </div>
                  <Button onClick={updatePassword} disabled={saving} className="bg-blue-600">
                    <Key className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  {profile?.two_factor_enabled ? (
                    <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                  ) : (
                    <Button onClick={enableTwoFactor} variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  )}
                </div>
                {profile?.two_factor_enabled && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Two-factor authentication is enabled for your account
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Session Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Session Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Login</span>
                    <span className="text-gray-900">{profile?.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Created</span>
                    <span className="text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive email updates about platform activity</p>
                </div>
                <Switch
                  checked={profile?.email_notifications || false}
                  onCheckedChange={(checked) => updatePreferences('email_notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={profile?.push_notifications || false}
                  onCheckedChange={(checked) => updatePreferences('push_notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-gray-500">Get alerts about suspicious login attempts</p>
                </div>
                <Switch
                  checked={profile?.security_alerts || false}
                  onCheckedChange={(checked) => updatePreferences('security_alerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminProfile