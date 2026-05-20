/* eslint-disable react-hooks/immutability */
// src/pages/CompanyProfile.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { 
  Building2, 
  Globe, 
  MapPin, 
  Users, 
  Save, 
  Edit2, 
  Camera, 
  X, 
  Upload,
  Phone,
  Calendar,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Link as LinkIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CompanyProfile {
  id: string
  company_name: string
  company_description: string
  website: string
  logo_url: string
  cover_image?: string | null
  location: string
  company_size: string
  phone?: string
  founded_year?: number | null
  headquarters?: string
  social_links?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
  }
  industry?: {
    id: number
    industry_name: string
  }
}

interface SocialLinks {
  linkedin: string
  twitter: string
  facebook: string
  instagram: string
}

const CompanyProfile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [industries, setIndustries] = useState<any[]>([])

  // Local File States
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSavingCover, setIsSavingCover] = useState(false)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSavingLogo, setIsSavingLogo] = useState(false)

  // Native Reference Upload Links
  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    website: '',
    location: '',
    company_size: '',
    phone: '',
    founded_year: '',
    headquarters: '',
    industry_id: ''
  })

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchIndustries()
  }, [])

  const fetchIndustries = async () => {
    try {
      const response = await api.get('/industries')
      setIndustries(response.data.data)
    } catch (error) {
      console.error('Error fetching industries:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/employer/profile')
      
      const profileData = response.data.data?.profile || response.data.data

      setProfile(profileData)
      setFormData({
        company_name: profileData?.company_name || '',
        company_description: profileData?.company_description || '',
        website: profileData?.website || '',
        location: profileData?.location || '',
        company_size: profileData?.company_size || '',
        phone: profileData?.phone || '',
        founded_year: profileData?.founded_year?.toString() || '',
        headquarters: profileData?.headquarters || '',
        industry_id: profileData?.industry_id?.toString() || ''
      })

      setSocialLinks({
        linkedin: profileData?.social_links?.linkedin || '',
        twitter: profileData?.social_links?.twitter || '',
        facebook: profileData?.social_links?.facebook || '',
        instagram: profileData?.social_links?.instagram || ''
      })

      if (profileData?.cover_image) {
        setCoverPreview(profileData.cover_image)
      } else {
        setCoverPreview(null)
      }

      if (profileData?.logo_url) {
        setLogoPreview(profileData.logo_url)
      } else {
        setLogoPreview(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load company profile",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Error", description: "Please choose an image file" })
        return
      }
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Error", description: "Please choose an image file" })
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const saveCoverImage = async () => {
    if (!coverImage) return
    setIsSavingCover(true)
    try {
      const data = new FormData()
      data.append('cover_image', coverImage)
      const response = await api.post('/employer/cover', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        toast({ title: "Success", description: "Company banner saved successfully!" })
        setCoverImage(null)
        await fetchProfile()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload cover banner" })
    } finally {
      setIsSavingCover(false)
    }
  }

  const saveCompanyLogo = async () => {
    if (!logoFile) return
    setIsSavingLogo(true)
    try {
      const data = new FormData()
      data.append('logo', logoFile)
      const response = await api.post('/employer/logo', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        toast({ title: "Success", description: "Company logo saved successfully!" })
        setLogoFile(null)
        await fetchProfile()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload logo" })
    } finally {
      setIsSavingLogo(false)
    }
  }

  const handleSave = async () => {
    try {
      // Prepare the update data
      const updateData = {
        company_name: formData.company_name,
        company_description: formData.company_description,
        website: formData.website,
        location: formData.location,
        company_size: formData.company_size,
        phone: formData.phone,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        headquarters: formData.headquarters,
        industry_id: formData.industry_id ? parseInt(formData.industry_id) : undefined,
        social_links: socialLinks
      }

      await api.put('/employer/profile', updateData)
      setEditing(false)
      await fetchProfile()
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      })
    }
  }

  const deleteCoverImage = async () => {
    try {
      await api.delete('/employer/cover')
      toast({ title: "Success", description: "Cover banner removed" })
      await fetchProfile()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove cover banner" })
    }
  }

  const companySizeOptions = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees"
  ]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading company profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Upper Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your corporate identity and branding assets</p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)} className="border-gray-300">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); fetchProfile(); }} className="border-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Edge-to-Edge Full Border Cover Banner Wrapper */}
      <div className="relative mb-24">
        <Card className="overflow-hidden border border-gray-200 shadow-sm relative h-48 bg-gray-100">
          {coverPreview ? (
            <div className="w-full h-full absolute inset-0">
              <img src={coverPreview} alt="Company Cover Banner" className="w-full h-full object-cover" />
              {!coverImage && (
                <button
                  type="button"
                  onClick={deleteCoverImage}
                  className="absolute top-3 right-3 z-10 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full flex-col bg-gradient-to-r from-blue-600 to-indigo-700">
              <Upload className="h-10 w-10 text-white/50 mb-2" />
              <p className="text-white/70 text-sm">Click camera icon to upload company banner</p>
            </div>
          )}

          {/* Action floating buttons layout mapped to hidden native input hooks */}
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
                {isSavingCover ? 'Saving Banner...' : 'Confirm Cover Save'}
              </Button>
            )}
            
            <input
              ref={coverInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleCoverChange}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition flex items-center justify-center border border-gray-200 cursor-pointer"
            >
              <Camera className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </Card>

        {/* Separated Overlapping Logo Badge Wrapper */}
        <div className="absolute -bottom-14 left-6 z-40 flex items-end gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white rounded-xl overflow-hidden">
              {logoPreview ? (
                <AvatarImage src={logoPreview} alt="Company Logo" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold rounded-none flex items-center justify-center w-full h-full">
                  {formData.company_name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Absolute Camera trigger floating directly over logo box dimensions */}
            <div className="absolute bottom-0 right-0 z-50">
              <input
                ref={logoInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 p-1.5 rounded-full shadow-md transition border border-white flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>

          {/* Floating Confirm Trigger Button for changes to Logo */}
          {logoFile && (
            <Button 
              type="button"
              size="sm" 
              onClick={saveCompanyLogo} 
              disabled={isSavingLogo}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md mb-1 h-8 text-xs font-medium flex items-center"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSavingLogo ? 'Uploading...' : 'Save Logo'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Corporate Information Form Cards */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Building2 className="h-5 w-5 text-gray-500" />
            Company Information
          </CardTitle>
          <CardDescription>Basic information about your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name" className="text-gray-700">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="mt-1 border-gray-300"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="industry_id" className="text-gray-700">Industry *</Label>
                <Select 
                  value={formData.industry_id} 
                  onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id.toString()}>
                        {industry.industry_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="company_description" className="text-gray-700">Company Description</Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                  rows={4}
                  className="mt-1 border-gray-300"
                  placeholder="Tell candidates about your core services and corporate vision..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website" className="text-gray-700">Website URL</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1 border-gray-300"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 border-gray-300"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-gray-700">City/Country</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 border-gray-300"
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div>
                  <Label htmlFor="headquarters" className="text-gray-700">Headquarters Address</Label>
                  <Input
                    id="headquarters"
                    value={formData.headquarters}
                    onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                    className="mt-1 border-gray-300"
                    placeholder="123 Main Street, Suite 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_size" className="text-gray-700">Company Size</Label>
                  <Select 
                    value={formData.company_size} 
                    onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                  >
                    <SelectTrigger className="mt-1 border-gray-300">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizeOptions.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="founded_year" className="text-gray-700">Founded Year</Label>
                  <Input
                    id="founded_year"
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    className="mt-1 border-gray-300"
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              {/* Social Links Section */}
              <div className="pt-4">
                <Label className="text-gray-700 font-semibold mb-3 block">Social Media Links</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    <Input
                      placeholder="LinkedIn URL"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    <Input
                      placeholder="Twitter/X URL"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-700" />
                    <Input
                      placeholder="Facebook URL"
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <Input
                      placeholder="Instagram URL"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{profile?.company_name}</h2>
                  {profile?.industry && (
                    <p className="text-sm text-blue-600 font-medium mt-0.5">{profile.industry.industry_name}</p>
                  )}
                </div>
              </div>
              
              <Separator className="bg-gray-100" />

              <div className="space-y-4">
                {profile?.company_description && (
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">About Corporate Brand</h3>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{profile.company_description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {profile?.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium truncate">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium truncate">{profile.location}</span>
                    </div>
                  )}
                  {profile?.company_size && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="font-medium truncate">{profile.company_size}</span>
                    </div>
                  )}
                  {profile?.founded_year && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Founded {profile.founded_year}</span>
                    </div>
                  )}
                  {profile?.headquarters && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="font-medium truncate">{profile.headquarters}</span>
                    </div>
                  )}
                </div>

                {/* Social Links Display */}
                {(profile?.social_links?.linkedin || profile?.social_links?.twitter || 
                  profile?.social_links?.facebook || profile?.social_links?.instagram) && (
                  <div className="pt-2">
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Connect With Us</h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.social_links.linkedin && (
                        <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100">
                          <Linkedin className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700">LinkedIn</span>
                        </a>
                      )}
                      {profile.social_links.twitter && (
                        <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100">
                          <Twitter className="h-4 w-4 text-sky-500" />
                          <span className="text-sm text-gray-700">Twitter</span>
                        </a>
                      )}
                      {profile.social_links.facebook && (
                        <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100">
                          <Facebook className="h-4 w-4 text-blue-700" />
                          <span className="text-sm text-gray-700">Facebook</span>
                        </a>
                      )}
                      {profile.social_links.instagram && (
                        <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span className="text-sm text-gray-700">Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>  
      </Card>
    </div>
  )
}

export default CompanyProfile