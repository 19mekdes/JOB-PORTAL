/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, Save, RefreshCw, User } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar: string
  role: string
  created_at: string
}

const SuperAdminProfile: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState({ full_name: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/profile')
      setProfile(response.data.data)
      setFormData({ full_name: response.data.data.full_name || '' })
      if (response.data.data.avatar) {
        setAvatarPreview(response.data.data.avatar)
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
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Error", description: "Please upload an image file" })
        return
      }
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
    const data = new FormData()
    data.append('avatar', avatarFile)
    try {
      await api.post('/admin/profile/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast({ title: "Success", description: "Profile picture updated!" })
      setAvatarFile(null)
      await fetchProfile()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const cancelUpload = () => {
    setAvatarFile(null)
    setAvatarPreview(profile?.avatar || null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      await api.put('/admin/profile', formData)
      toast({ title: "Success", description: "Profile updated" })
      await fetchProfile()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update" })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    const name = formData.full_name || profile?.full_name || 'Super Admin'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Profile</h1>
          <p className="text-gray-500">Manage your account settings</p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-700">Super Administrator</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-yellow-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your profile picture and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-2xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="text-white">
                  <Camera className="h-6 w-6" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upload a profile picture</p>
              <p className="text-xs text-gray-400">JPEG, PNG up to 2MB</p>
              {avatarFile && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={uploadAvatar} disabled={uploadingAvatar} className="bg-yellow-600">
                    {uploadingAvatar ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelUpload}>Cancel</Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input value={profile?.email || ''} disabled className="mt-1.5 bg-gray-50" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={updateProfile} disabled={saving} className="bg-yellow-600 hover:bg-yellow-700">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminProfile