/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  Briefcase,
  DollarSign,
  Clock,
  Building2,
  ArrowLeft,
  Save,
  Send,
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Industry {
  id: number
  industry_name: string
}

interface EmploymentType {
  id: number
  type_name: string
}

interface JobStatus {
  id: number
  status_name: string
}

interface ManagedCompany {
  id: string
  company_name: string
  logo_url: string | null
  is_primary: boolean
  is_verified: boolean
}

// Fallback data
const FALLBACK_INDUSTRIES: Industry[] = [
  { id: 1, industry_name: 'Technology / IT' },
  { id: 2, industry_name: 'Healthcare / Medical' },
  { id: 3, industry_name: 'Finance / Banking' },
  { id: 4, industry_name: 'Education / Training' },
  { id: 5, industry_name: 'Retail / E-commerce' },
  { id: 6, industry_name: 'Manufacturing' },
  { id: 7, industry_name: 'Construction' },
  { id: 8, industry_name: 'Real Estate' },
]

const FALLBACK_EMPLOYMENT_TYPES: EmploymentType[] = [
  { id: 1, type_name: 'Full-time' },
  { id: 2, type_name: 'Part-time' },
  { id: 3, type_name: 'Contract' },
  { id: 4, type_name: 'Remote' },
  { id: 5, type_name: 'Hybrid' },
  { id: 6, type_name: 'Internship' },
]

// Job Status Options
const JOB_STATUSES: JobStatus[] = [
  { id: 1, status_name: 'Open' },
  { id: 2, status_name: 'Closed' },
  { id: 3, status_name: 'Draft' },
]

const PostJobPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [industries, setIndustries] = useState<Industry[]>(FALLBACK_INDUSTRIES)
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>(FALLBACK_EMPLOYMENT_TYPES)
  const [requirementsList, setRequirementsList] = useState<string[]>([])
  const [benefitsList, setBenefitsList] = useState<string[]>([])
  const [requirementInput, setRequirementInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  
  // Company selection states
  const [managedCompanies, setManagedCompanies] = useState<ManagedCompany[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [useCustomCompany, setUseCustomCompany] = useState(false)
  const [customCompanyName, setCustomCompanyName] = useState('')
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    employment_type_id: '',
    industry_id: '',
    status_id: '1', // Default to 'Open'
    salary_min: '',
    salary_max: '',
    is_remote: false,
  })

  useEffect(() => {
    fetchFormData()
    fetchManagedCompanies()
  }, [])

  const fetchFormData = async () => {
    try {
      const [industriesRes, employmentTypesRes] = await Promise.all([
        api.get('/industries'),
        api.get('/employment-types')
      ])
      if (industriesRes.data.data?.length) setIndustries(industriesRes.data.data)
      if (employmentTypesRes.data.data?.length) setEmploymentTypes(employmentTypesRes.data.data)
    } catch (error) {
      console.error('Error fetching form data:', error)
      // Using fallback data already set
    }
  }

  const fetchManagedCompanies = async () => {
    setIsLoadingCompanies(true)
    try {
      const response = await api.get('/employer/managed-companies')
      console.log('Managed companies:', response.data)
      if (response.data.success && response.data.data) {
        setManagedCompanies(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching managed companies:', error)
      // If error, user can still post for their own company
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setRequirementsList([...requirementsList, requirementInput.trim()])
      setRequirementInput('')
    }
  }

  const removeRequirement = (index: number) => {
    setRequirementsList(requirementsList.filter((_, i) => i !== index))
  }

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setBenefitsList([...benefitsList, benefitInput.trim()])
      setBenefitInput('')
    }
  }

  const removeBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Job title is required" })
      return false
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      toast({ variant: "destructive", title: "Error", description: "Description must be at least 50 characters" })
      return false
    }
    if (!formData.location.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Location is required" })
      return false
    }
    if (!formData.employment_type_id) {
      toast({ variant: "destructive", title: "Error", description: "Employment type is required" })
      return false
    }
    if (!formData.industry_id) {
      toast({ variant: "destructive", title: "Error", description: "Industry is required" })
      return false
    }
    return true
  }

  const getStatusColor = (statusId: string) => {
    switch (statusId) {
      case '1': return 'text-green-700 bg-green-50 border-green-200'
      case '2': return 'text-red-700 bg-red-50 border-red-200'
      case '3': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (statusId: string) => {
    switch (statusId) {
      case '1': return <CheckCircle className="h-4 w-4 text-green-600" />
      case '2': return <XCircle className="h-4 w-4 text-red-600" />
      case '3': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleSubmit = async (publishStatus: 'draft' | 'published') => {
    if (!validateForm()) return

    setIsLoading(true)
    
    const finalStatusId = publishStatus === 'draft' ? '3' : formData.status_id
    
    // Build submit data
    const submitData: any = {
      title: formData.title,
      description: formData.description,
      requirements: requirementsList.join('\n'),
      benefits: benefitsList.join('\n'),
      location: formData.location,
      employment_type_id: parseInt(formData.employment_type_id),
      industry_id: parseInt(formData.industry_id),
      status_id: parseInt(finalStatusId),
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      is_remote: formData.is_remote
    }
    
    // Add company selection
    if (useCustomCompany && customCompanyName.trim()) {
      submitData.custom_company_name = customCompanyName.trim()
    } else if (selectedCompanyId) {
      submitData.company_id = selectedCompanyId
    }

    console.log('Submitting job data:', submitData)

    try {
      // ✅ FIXED: Use the correct endpoint '/employer/jobs'
      const response = await api.post('/employer/jobs', submitData)
      
      console.log('Response:', response.data)
      
      toast({
        title: "Success!",
        description: publishStatus === 'published' 
          ? `Job posted successfully for ${response.data.data?.company_name || 'your company'}!` 
          : "Job saved as draft",
      })
      
      // Navigate back to jobs list after short delay
      setTimeout(() => {
        navigate('/employer/jobs')
      }, 1500)
      
    } catch (error: any) {
      console.error('Error posting job:', error)
      
      // Better error handling
      let errorMessage = "Failed to post job"
      
      if (error.response) {
        console.error('Error response:', error.response.data)
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage
        
        // Specific error messages
        if (error.response.status === 401) {
          errorMessage = "Please login again to post a job"
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to post jobs. Please complete your employer profile."
        } else if (error.response.status === 404) {
          errorMessage = "Employer profile not found. Please complete your company profile first."
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Please check all required fields"
        }
      } else if (error.request) {
        errorMessage = "Cannot connect to server. Please check if backend is running."
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is employer
  if (user?.user_type !== 'Employer') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-500">Only employers can post jobs</p>
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/employer/jobs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
            <p className="text-gray-500 mt-1">Fill in the details below to post a job</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-lg">
            <TabsTrigger value="basic" className="rounded-md">Basic Info</TabsTrigger>
            <TabsTrigger value="details" className="rounded-md">Job Details</TabsTrigger>
            <TabsTrigger value="requirements" className="rounded-md">Requirements & Benefits</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Job Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    className="mt-1.5 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Job Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={6}
                    className="mt-1.5 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length} / 50+ characters
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State or Remote"
                    className="mt-1.5 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Remote Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_remote"
                    checked={formData.is_remote}
                    onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="is_remote" className="text-sm font-medium text-gray-700 cursor-pointer">
                    This is a remote position
                  </Label>
                </div>

                {/* Company Selection Section */}
<div className="pt-4 border-t border-gray-100">
  <Label className="text-sm font-medium text-gray-700 mb-2 block">Post Job For</Label>
  
  {!useCustomCompany ? (
    <div className="space-y-2">
      <Select
        value={selectedCompanyId}
        onValueChange={setSelectedCompanyId}
      >
        <SelectTrigger className="rounded-lg border-gray-300 bg-white">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
          <SelectItem value="primary" className="cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-2 py-1">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-gray-700 font-medium">My Company (Primary)</span>
            </div>
          </SelectItem>
          
          {managedCompanies.filter(c => !c.is_primary).map((company) => (
            <SelectItem 
              key={company.id} 
              value={company.id}
              className="cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-2 py-1">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{company.company_name}</span>
                {company.is_verified && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <button
        type="button"
        onClick={() => setUseCustomCompany(true)}
        className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-2"
      >
        <Plus className="h-3 w-3" />
        Post for a different company (e.g., Afriwork)
      </button>
    </div>
  ) : (
    <div className="space-y-2">
      <Input
        value={customCompanyName}
        onChange={(e) => setCustomCompanyName(e.target.value)}
        placeholder="Enter company name (e.g., Afriwork, Ethio Jobs)"
        className="rounded-lg border-gray-300"
      />
      <button
        type="button"
        onClick={() => {
          setUseCustomCompany(false)
          setCustomCompanyName('')
          setSelectedCompanyId('primary')
        }}
        className="text-gray-600 text-sm hover:underline flex items-center gap-1 mt-2"
      >
        <ArrowLeft className="h-3 w-3" />
        Post for my company instead
      </button>
    </div>
  )}
</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {/* Job Status Dropdown */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Job Status *</Label>
                  <Select
                    value={formData.status_id}
                    onValueChange={(value) => setFormData({ ...formData, status_id: value })}
                  >
                    <SelectTrigger className="mt-1.5 rounded-lg border-gray-300 bg-white">
                      <SelectValue placeholder="Select job status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                      {JOB_STATUSES.map((status) => (
                        <SelectItem 
                          key={status.id} 
                          value={status.id.toString()}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2 py-1">
                            {getStatusIcon(status.id.toString())}
                            <span className="text-gray-700">{status.status_name}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              {status.status_name === 'Open' && '(Visible to job seekers)'}
                              {status.status_name === 'Closed' && '(Hidden from job seekers)'}
                              {status.status_name === 'Draft' && '(Not published yet)'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employment Type Dropdown */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Employment Type *</Label>
                  <Select
                    value={formData.employment_type_id}
                    onValueChange={(value) => setFormData({ ...formData, employment_type_id: value })}
                  >
                    <SelectTrigger className="mt-1.5 rounded-lg border-gray-300 bg-white">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                      {employmentTypes.map((type) => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id.toString()}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2 py-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{type.type_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry Dropdown */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Industry *</Label>
                  <Select
                    value={formData.industry_id}
                    onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
                  >
                    <SelectTrigger className="mt-1.5 rounded-lg border-gray-300 bg-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                      {industries.map((industry) => (
                        <SelectItem 
                          key={industry.id} 
                          value={industry.id.toString()}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2 py-1">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{industry.industry_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Minimum Salary</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                        placeholder="50000"
                        className="pl-9 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Maximum Salary</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                        placeholder="80000"
                        className="pl-9 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements & Benefits Tab */}
          <TabsContent value="requirements" className="space-y-4">
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold">Requirements & Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Requirements</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      placeholder="e.g., 5+ years of React experience"
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                      className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button type="button" onClick={addRequirement} variant="outline" className="border-gray-300">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {requirementsList.map((req, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3 bg-gray-100 text-gray-700">
                        {req}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500" 
                          onClick={() => removeRequirement(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-gray-100" />
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Benefits</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="e.g., Health insurance"
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                      className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button type="button" onClick={addBenefit} variant="outline" className="border-gray-300">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {benefitsList.map((ben, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3 bg-gray-100 text-gray-700">
                        {ben}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500" 
                          onClick={() => removeBenefit(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Preview Banner */}
        <div className={`mt-6 p-3 rounded-lg border flex items-center gap-2 ${getStatusColor(formData.status_id)}`}>
          {getStatusIcon(formData.status_id)}
          <span className="text-sm font-medium">
            Status: {JOB_STATUSES.find(s => s.id.toString() === formData.status_id)?.status_name}
          </span>
          <span className="text-xs ml-2 text-gray-600">
            {formData.status_id === '1' && '- This job will be visible to job seekers immediately'}
            {formData.status_id === '2' && '- This job will be hidden from job seekers'}
            {formData.status_id === '3' && '- This job will be saved as draft, not published yet'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate('/employer/jobs')} className="border-gray-300">
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')} 
            disabled={isLoading} 
            className="border-gray-300"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save as Draft
          </Button>
          <Button 
            onClick={() => handleSubmit('published')} 
            disabled={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Publish Job
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PostJobPage