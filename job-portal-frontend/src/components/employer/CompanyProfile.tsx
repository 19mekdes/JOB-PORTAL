/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  MapPin,
  Camera,
  Save,
  RefreshCw,
  ExternalLink} from 'lucide-react'
import { FaFacebook, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface CompanyProfile {
  id: string
  company_name: string
  company_description: string | null
  website: string | null
  logo_url: string | null
  industry_id: number
  company_size: string | null
  location: string | null
  phone: string | null
  founded_year: number | null
  headquarters: string | null
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

interface Industry {
  id: number
  industry_name: string
}

const companySizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1000+', label: '1,000+ employees' }
]

const CompanyProfile: React.FC = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [industries, setIndustries] = useState<Industry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showLogoDialog, setShowLogoDialog] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    website: '',
    industry_id: '',
    company_size: '',
    location: '',
    phone: '',
    founded_year: '',
    headquarters: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchIndustries()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/profile/employer')
      const data = response.data.data
      setProfile(data)
      
      // Populate form
      setFormData({
        company_name: data.company_name || '',
        company_description: data.company_description || '',
        website: data.website || '',
        industry_id: data.industry_id?.toString() || '',
        company_size: data.company_size || '',
        location: data.location || '',
        phone: data.phone || '',
        founded_year: data.founded_year?.toString() || '',
        headquarters: data.headquarters || '',
        linkedin: data.social_links?.linkedin || '',
        twitter: data.social_links?.twitter || '',
        facebook: data.social_links?.facebook || '',
        instagram: data.social_links?.instagram || ''
      })
      
      calculateCompletion(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load company profile",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIndustries = async () => {
    try {
      const response = await api.get('/industries')
      setIndustries(response.data.data)
    } catch (error) {
      console.error('Error fetching industries:', error)
    }
  }

  const calculateCompletion = (data: CompanyProfile) => {
    let completed = 0
    const total = 8
    
    if (data.company_name) completed++
    if (data.company_description) completed++
    if (data.website) completed++
    if (data.industry_id) completed++
    if (data.company_size) completed++
    if (data.location) completed++
    if (data.logo_url) completed++
    if (data.phone) completed++
    
    setCompletionPercentage(Math.round((completed / total) * 100))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const submitData = {
        company_name: formData.company_name,
        company_description: formData.company_description,
        website: formData.website,
        industry_id: parseInt(formData.industry_id),
        company_size: formData.company_size,
        location: formData.location,
        phone: formData.phone,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        headquarters: formData.headquarters,
        social_links: {
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          facebook: formData.facebook,
          instagram: formData.instagram
        }
      }
      
      await api.put('/profile/employer', submitData)
      toast({
        variant: "success",
        title: "Success",
        description: "Company profile updated successfully",
      })
      fetchProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update company profile",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append('logo', logoFile)
    
    try {
      const response = await api.post('/profile/employer/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setProfile(prev => prev ? { ...prev, logo_url: response.data.data.logo_url } : null)
      toast({
        variant: "success",
        title: "Success",
        description: "Company logo updated successfully",
      })
      setShowLogoDialog(false)
      setLogoFile(null)
      setLogoPreview(null)
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload logo",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogoDelete = async () => {
    try {
      await api.delete('/profile/employer/logo')
      setProfile(prev => prev ? { ...prev, logo_url: null } : null)
      toast({
        variant: "success",
        title: "Success",
        description: "Company logo removed",
      })
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove logo",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Logo must be less than 2MB",
        })
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please upload an image file",
        })
        return
      }
      
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading company profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-500 mt-1">Manage your company information and branding</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Profile Completion</div>
          <div className="w-32">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">{completionPercentage}% complete</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Company Logo */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <Avatar className="h-32 w-32 mx-auto">
                  {profile?.logo_url ? (
                    <AvatarImage src={profile.logo_url} alt={profile.company_name} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-4xl">
                      {profile?.company_name?.charAt(0).toUpperCase() || 'C'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  onClick={() => setShowLogoDialog(true)}
                  className="absolute bottom-0 right-0 p-1 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold mt-4">{profile?.company_name}</h2>
              <p className="text-sm text-gray-500">{profile?.industry?.industry_name}</p>
              
              <div className="mt-4 space-y-2 text-sm">
                {profile?.location && (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-blue-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Company Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Jobs</span>
                <Badge variant="secondary">--</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Applicants</span>
                <Badge variant="secondary">--</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Profile Views</span>
                <Badge variant="secondary">--</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="social">Social Links</TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Essential company details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Enter company name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_description">Company Description</Label>
                      <Textarea
                        id="company_description"
                        value={formData.company_description}
                        onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                        placeholder="Tell candidates about your company, mission, and culture..."
                        rows={5}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select
                          value={formData.industry_id}
                          onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
                        >
                          <SelectTrigger>
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Company Details */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Additional company information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_size">Company Size</Label>
                        <Select
                          value={formData.company_size}
                          onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="founded_year">Founded Year</Label>
                        <Input
                          id="founded_year"
                          type="number"
                          value={formData.founded_year}
                          onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                          placeholder="e.g., 2020"
                          min="1800"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headquarters">Headquarters</Label>
                      <Input
                        id="headquarters"
                        value={formData.headquarters}
                        onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                        placeholder="City, State, Country"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Main office location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Links */}
              <TabsContent value="social" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Connect your company's social profiles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">
                        <FaLinkedin className="inline h-4 w-4 mr-2" />
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter">
                        <FaTwitter className="inline h-4 w-4 mr-2" />
                        Twitter
                      </Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="https://twitter.com/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook">
                        <FaFacebook className="inline h-4 w-4 mr-2" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">
                        <FaInstagram className="inline h-4 w-4 mr-2" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Logo Upload Dialog */}
      <Dialog open={showLogoDialog} onOpenChange={setShowLogoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Company Logo</DialogTitle>
            <DialogDescription>
              Upload a new logo for your company profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {logoPreview ? (
              <div className="text-center">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-32 w-32 object-contain mx-auto rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoFile(null)
                    setLogoPreview(null)
                  }}
                  className="mt-2"
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload</span>
                  <span className="text-xs text-gray-400">PNG, JPG up to 2MB</span>
                </label>
              </div>
            )}
            
            {profile?.logo_url && !logoFile && (
              <div className="text-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogoDelete}
                >
                  Remove Current Logo
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogoUpload} disabled={!logoFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Save Logo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CompanyProfile