/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  RefreshCw,
  Edit2,
  Plus,
  GraduationCap,
  Camera,
  X,
  Upload
} from 'lucide-react'
import { FaLinkedin } from 'react-icons/fa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  start_date: string
  end_date: string
  current: boolean
  description: string
}

interface Education {
  id: string
  institution: string
  degree: string
  field_of_study: string
  start_date: string
  end_date: string
  current: boolean
  description: string
}

interface SeekerProfileData {
  id: string
  email: string
  full_name: string
  phone: string | null
  location: string | null
  title: string | null
  bio: string | null
  skills: string[]
  experience: Experience[]
  education: Education[]
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  availability: string | null
  cover_image: string | null
  avatar: string | null
}

const availabilityOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'two_weeks', label: '2 Weeks Notice' },
  { value: 'one_month', label: '1 Month Notice' },
  { value: 'negotiable', label: 'Negotiable' }
]

const SeekerProfile: React.FC = () => {
  const [profile, setProfile] = useState<SeekerProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [activeTab, setActiveTab] = useState('basic')

  // Cover Image state
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSavingCover, setIsSavingCover] = useState(false)

  // Profile Picture (Avatar) state
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)

  // Skills state
  const [newSkill, setNewSkill] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  // Experience states
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  const [expFormData, setExpFormData] = useState<Experience>({
    id: '',
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    current: false,
    description: ''
  })

  // Education states
  const [showEduForm, setShowEduForm] = useState(false)
  const [editingEdu, setEditingEdu] = useState<Education | null>(null)
  const [eduFormData, setEduFormData] = useState<Education>({
    id: '',
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    current: false,
    description: ''
  })

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    title: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    availability: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/profile/me')
      const data = response.data.data
      setProfile(data.profile)
      setSkills(data.profile?.skills || [])
      
      setFormData({
        full_name: data.profile?.full_name || '',
        phone: data.profile?.phone || '',
        location: data.profile?.location || '',
        title: data.profile?.title || '',
        bio: data.profile?.bio || '',
        linkedin_url: data.profile?.linkedin_url || '',
        github_url: data.profile?.github_url || '',
        portfolio_url: data.profile?.portfolio_url || '',
        availability: data.profile?.availability || ''
      })
      
      if (data.profile?.cover_image) {
        setCoverPreview(data.profile.cover_image)
      } else {
        setCoverPreview(null)
      }
      
      if (data.profile?.avatar) {
        setProfilePicturePreview(data.profile.avatar)
      } else {
        setProfilePicturePreview(null)
      }
      
      calculateCompletion(data.profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCompletion = (profile: SeekerProfileData) => {
    if (!profile) return
    let completed = 0
    const total = 11
    
    if (profile.full_name) completed++
    if (profile.title) completed++
    if (profile.bio) completed++
    if (profile.skills && profile.skills.length > 0) completed++
    if (profile.experience && profile.experience.length > 0) completed++
    if (profile.education && profile.education.length > 0) completed++
    if (profile.resume_url) completed++
    if (profile.phone) completed++
    if (profile.location) completed++
    if (profile.cover_image) completed++
    if (profile.avatar) completed++
    
    setCompletionPercentage(Math.round((completed / total) * 100))
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Error", description: "Please upload an image file" })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Error", description: "Image must be less than 5MB" })
        return
      }
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setProfilePicture(file)
      setProfilePicturePreview(URL.createObjectURL(file))
    }
  }

  const saveCoverImage = async () => {
    if (!coverImage) return
    setIsSavingCover(true)
    try {
      const data = new FormData()
      data.append('cover_image', coverImage)
      
      const response = await api.post('/profile/cover', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        toast({ title: "Success", description: "Cover image permanently updated!" })
        setCoverImage(null)
        await fetchProfile()
      }
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update cover image" })
    } finally {
      setIsSavingCover(false)
    }
  }

  const saveProfilePicture = async () => {
    if (!profilePicture) return
    setIsSavingAvatar(true)
    try {
      const data = new FormData()
      data.append('avatar', profilePicture)
      
      const response = await api.post('/profile/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        toast({ title: "Success", description: "Profile picture permanently updated!" })
        setProfilePicture(null)
        await fetchProfile()
      }
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile picture" })
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await api.put('/auth/profile', formData)
      toast({ title: "Success", description: "Profile updated successfully" })
      await fetchProfile()
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        title: profile.title || '',
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        portfolio_url: profile.portfolio_url || '',
        availability: profile.availability || ''
      })
    }
  }

  const addSkill = async () => {
    if (!newSkill.trim()) return
    if (skills.includes(newSkill.trim())) {
      toast({ variant: "destructive", title: "Error", description: "Skill already exists" })
      return
    }
    const updatedSkills = [...skills, newSkill.trim()]
    setSkills(updatedSkills)
    setNewSkill('')
    try {
      await api.put('/auth/profile', { skills: updatedSkills })
      toast({ title: "Success", description: "Skill added" })
      await fetchProfile()
    } catch (error) {
      console.error(error)
    }
  }

  const removeSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove)
    setSkills(updatedSkills)
    try {
      await api.put('/auth/profile', { skills: updatedSkills })
      toast({ title: "Success", description: "Skill removed" })
      await fetchProfile()
    } catch (error) {
      console.error(error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your professional profile</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Profile Completion</div>
          <div className="w-32">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">{completionPercentage}% complete</p>
          </div>
        </div>
      </div>

      {/* Main Combined Wrapper for Banner Image & Overlapping Profile Circle */}
      <div className="relative mb-20">
        {/* Fixed Card container: background becomes crisp light-gray fallback only when image doesn't exist */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm relative h-48 bg-gray-100">
          {coverPreview ? (
            <div className="w-full h-full absolute inset-0">
              {/* Forced edge-to-edge absolute layout rendering to cover original gradient backgrounds completely */}
              <img src={coverPreview} alt="Cover Banner" className="w-full h-full object-cover" />
              {!coverImage && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.delete('/profile/cover')
                      toast({ title: "Success", description: "Cover image removed" })
                      await fetchProfile()
                    } catch (error) {
                      toast({ variant: "destructive", title: "Error", description: "Failed to remove cover image" })
                    }
                  }}
                  className="absolute top-3 right-3 z-10 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            /* Gradient background displays contextually only when no image is active */
            <div className="flex items-center justify-center h-full flex-col bg-gradient-to-r from-blue-500 to-purple-600">
              <Upload className="h-10 w-10 text-white/50 mb-2" />
              <p className="text-white/70 text-sm">Click camera icon to upload cover image</p>
            </div>
          )}

          {/* Action Control Panel Layout for Cover Updates */}
          <div className="absolute bottom-4 right-4 flex gap-2 items-center z-30">
            {coverImage && (
              <Button 
                type="button"
                size="sm" 
                onClick={saveCoverImage} 
                disabled={isSavingCover}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-medium"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSavingCover ? 'Saving...' : 'Save Cover'}
              </Button>
            )}
            
            <input
              type="file"
              id="cover-file-hidden-input"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleCoverImageChange}
            />
            <button
              type="button"
              onClick={() => document.getElementById('cover-file-hidden-input')?.click()}
              className="bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition flex items-center justify-center border border-gray-200 cursor-pointer"
            >
              <Camera className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </Card>

        {/* Separated Overlapping Avatar Placement Container */}
        <div className="absolute -bottom-12 left-6 z-40 flex items-end gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
              {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Avatar Profile Picture" className="h-full w-full rounded-full object-cover" />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                  {getInitials(formData.full_name || 'U')}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Absolute Camera circle trigger floating on top of avatar background */}
            <div className="absolute bottom-0 right-0 z-50">
              <input
                type="file"
                id="avatar-file-hidden-input"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleProfilePictureChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('avatar-file-hidden-input')?.click()}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full shadow-md transition border border-white flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>

          {/* Contextual Save Button for Avatar changes */}
          {profilePicture && (
            <Button 
              type="button"
              size="sm" 
              onClick={saveProfilePicture} 
              disabled={isSavingAvatar}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md mb-1 h-8 text-xs font-medium flex items-center"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSavingAvatar ? 'Uploading...' : 'Save Profile Pic'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Component Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Sidebar Profile" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-blue-500 text-white text-xl">
                    {getInitials(formData.full_name || 'U')}
                  </AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-xl font-semibold mt-2 text-gray-900">{formData.full_name || 'Add your name'}</h2>
              <p className="text-sm text-gray-500">{formData.title || 'Add your title'}</p>
              
              <div className="mt-4 space-y-2 text-sm">
                {formData.location && (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {formData.location}
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-left">
                <h4 className="font-semibold text-sm text-gray-700">Profile Strength</h4>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-xs text-gray-500">
                  {completionPercentage < 30 && "Complete your profile to stand out"}
                  {completionPercentage >= 30 && completionPercentage < 70 && "You're on the right track!"}
                  {completionPercentage >= 70 && "Great profile! You're ready to apply"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details Info Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              {formData.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{formData.phone}</span>
                </div>
              )}
              {profile.linkedin_url && (
                <div className="flex items-center gap-2 text-sm">
                  <FaLinkedin className="h-4 w-4 text-blue-600" />
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    LinkedIn
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Management Tabs section */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger value="basic" className="data-[state=active]:bg-white">Basic Info</TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-white">Skills</TabsTrigger>
              <TabsTrigger value="experience" className="data-[state=active]:bg-white">Experience</TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-white">Education</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-gray-900">Basic Information</CardTitle>
                      <CardDescription className="text-gray-500">Update your personal and professional details</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-gray-300">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving} className="border-gray-300">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700">Full Name</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Professional Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Phone Number</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Availability</Label>
                      <select
                        value={formData.availability || ''}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        disabled={!isEditing}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
                      >
                        <option value="">Select availability</option>
                        {availabilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Bio / Summary</Label>
                    <Textarea
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Skills & Expertise</CardTitle>
                  <CardDescription className="text-gray-500">Add your technical and professional skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Add New Skill</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="e.g., JavaScript, React, Python"
                        className="border-gray-300"
                      />
                      <Button onClick={addSkill} className="bg-blue-600 hover:bg-blue-700 text-white">Add</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700">Your Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.length === 0 ? (
                        <p className="text-gray-500 text-sm">No skills added yet</p>
                      ) : (
                        skills.map((skill, index) => (
                          <Badge key={index} className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm border border-blue-200 flex items-center gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-500 text-blue-400 font-bold">×</button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default SeekerProfile