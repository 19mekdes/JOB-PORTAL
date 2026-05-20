/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, JSX } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft, Save, Eye, EyeOff, Clock, Archive } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/services/api'
import { toast } from '@/hooks/use-toast'

interface JobFormData {
  title: string
  description: string
  requirements: string
  benefits: string
  location: string
  employment_type_id: string
  industry_id: string
  salary_min: string
  salary_max: string
  is_remote: boolean
  status_id: string
}

interface JobStatus {
  id: number
  status_name: string
}

const EditJob: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([])
  const [industries, setIndustries] = useState<any[]>([])
  const [, setJobStatuses] = useState<JobStatus[]>([])
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    location: '',
    employment_type_id: '',
    industry_id: '',
    salary_min: '',
    salary_max: '',
    is_remote: false,
    status_id: ''
  })

  // Status configuration for UI display
  const getStatusBadge = (statusId: string) => {
    const statusMap: Record<string, { label: string; color: string; bgLight: string; icon: JSX.Element }> = {
      '1': { label: 'Open', color: 'text-green-700', bgLight: 'bg-green-50', icon: <Eye className="h-3 w-3 text-green-600" /> },
      '2': { label: 'Closed', color: 'text-red-700', bgLight: 'bg-red-50', icon: <EyeOff className="h-3 w-3 text-red-600" /> },
      '3': { label: 'Draft', color: 'text-gray-700', bgLight: 'bg-gray-100', icon: <Clock className="h-3 w-3 text-gray-600" /> },
      '4': { label: 'Archived', color: 'text-yellow-700', bgLight: 'bg-yellow-50', icon: <Archive className="h-3 w-3 text-yellow-600" /> },
    }
    return statusMap[statusId] || { label: 'Unknown', color: 'text-gray-700', bgLight: 'bg-gray-100', icon: <AlertCircle className="h-3 w-3 text-gray-600" /> }
  }

  useEffect(() => {
    fetchJobData()
    fetchEmploymentTypes()
    fetchIndustries()
    fetchJobStatuses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

const fetchJobData = async () => {
  try {
    const response = await api.get(`/jobs/${id}`)
    const job = response.data.data
    setFormData({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      location: job.location || '',
      // Convert numbers to strings for select inputs
      employment_type_id: job.employment_type_id ? String(job.employment_type_id) : '',
      industry_id: job.industry_id ? String(job.industry_id) : '',
      salary_min: job.salary_min ? String(job.salary_min) : '',
      salary_max: job.salary_max ? String(job.salary_max) : '',
      is_remote: job.is_remote || false,
      status_id: job.status_id ? String(job.status_id) : '1'
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    toast({ variant: "destructive", title: "Error", description: "Failed to load job data" })
  } finally {
    setLoading(false)
  }
}
  const fetchEmploymentTypes = async () => {
    try {
      const response = await api.get('/employment-types')
      setEmploymentTypes(response.data.data)
    } catch (error) {
      console.error('Error fetching employment types:', error)
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

  const fetchJobStatuses = async () => {
    try {
      const response = await api.get('/job-statuses')
      setJobStatuses(response.data.data)
    } catch (error) {
      setJobStatuses([
        { id: 1, status_name: 'Open' },
        { id: 2, status_name: 'Closed' },
        { id: 3, status_name: 'Draft' },
        { id: 4, status_name: 'Archived' }
      ])
    }
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitting(true)
  try {
    // Force convert all values to proper types
    const submitData = {
      title: formData.title || '',
      description: formData.description || '',
      requirements: formData.requirements || '',
      benefits: formData.benefits || '',
      location: formData.location || '',
      // Force convert to number - this is the critical fix
      employment_type_id: formData.employment_type_id ? Number(formData.employment_type_id) : null,
      industry_id: formData.industry_id ? Number(formData.industry_id) : null,
      salary_min: formData.salary_min ? Number(formData.salary_min) : null,
      salary_max: formData.salary_max ? Number(formData.salary_max) : null,
      is_remote: formData.is_remote || false,
      status_id: formData.status_id ? Number(formData.status_id) : 1
    }
    
    console.log('Sending to backend:', submitData)
    
    const response = await api.put(`/jobs/${id}`, submitData)
    
    if (response.data.success) {
      const statusInfo = getStatusBadge(formData.status_id)
      toast({ 
        title: "Success", 
        description: `Job updated successfully. Status: ${statusInfo.label}` 
      })
      navigate('/employer/jobs')
    }
  } catch (error: any) {
    console.error('Error updating job:', error)
    console.error('Error response:', error.response?.data)
    toast({ 
      variant: "destructive", 
      title: "Error", 
      description: error.response?.data?.message || "Failed to update job" 
    })
  } finally {
    setSubmitting(false)
  }
}

  const currentStatus = getStatusBadge(formData.status_id)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading job data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/employer/jobs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Button>

      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Edit Job</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Update your job posting details</p>
            </div>
            <Badge className={`${currentStatus.bgLight} ${currentStatus.color} flex items-center gap-1 px-3 py-1 border-0`}>
              {currentStatus.icon}
              Current: {currentStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STATUS SECTION */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <Label className="text-base font-semibold text-gray-900 mb-3 block">Job Status</Label>
              <p className="text-sm text-gray-600 mb-3">
                Control whether this job is visible to job seekers
              </p>
              <Select 
                value={formData.status_id} 
                onValueChange={(value) => setFormData({...formData, status_id: value})}
              >
                <SelectTrigger className="w-full md:w-64 bg-white border-gray-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="1" className="hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">Open</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2" className="hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-red-600" />
                      <span className="text-gray-700">Closed </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3" className="hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">Draft </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="4" className="hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-yellow-600" />
                      <span className="text-gray-700">Archived </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {formData.status_id === '2' && (
                <Alert className="mt-3 bg-amber-50 border border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    Closed jobs will not be visible to job seekers. You can reopen it anytime.
                  </AlertDescription>
                </Alert>
              )}
              {formData.status_id === '3' && (
                <Alert className="mt-3 bg-blue-50 border border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    Draft jobs are only visible to you. Set status to "Open" when ready.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Job Title */}
            <div>
              <Label className="text-gray-700 font-medium">Job Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Senior Software Engineer"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            {/* Location */}
            <div>
              <Label className="text-gray-700 font-medium">Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., New York, NY or Remote"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            {/* Remote Option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_remote"
                checked={formData.is_remote}
                onChange={(e) => setFormData({...formData, is_remote: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="is_remote" className="text-sm font-normal text-gray-700 cursor-pointer">
                This is a remote position
              </Label>
            </div>

            {/* Employment Type and Industry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Employment Type *</Label>
                <Select 
                  value={formData.employment_type_id} 
                  onValueChange={(value) => setFormData({...formData, employment_type_id: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {employmentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()} className="hover:bg-gray-50">
                        {type.type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Industry *</Label>
                <Select 
                  value={formData.industry_id} 
                  onValueChange={(value) => setFormData({...formData, industry_id: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id.toString()} className="hover:bg-gray-50">
                        {industry.industry_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Minimum Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                  placeholder="e.g., 50000"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Maximum Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                  placeholder="e.g., 80000"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-gray-700 font-medium">Job Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                rows={6}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.description.length} characters
              </p>
            </div>

            {/* Requirements */}
            <div>
              <Label className="text-gray-700 font-medium">Requirements</Label>
              <Textarea
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                placeholder="List the skills, experience, and qualifications needed..."
                rows={4}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Benefits */}
            <div>
              <Label className="text-gray-700 font-medium">Benefits</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                placeholder="What benefits do you offer? (Health insurance, remote work, etc.)"
                rows={4}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/employer/jobs')} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditJob