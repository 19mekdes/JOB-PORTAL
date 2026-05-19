
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Send, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
  Clock,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'
import { AxiosProgressEvent } from 'axios'

interface JobDetails {
  id: string
  title: string
  description: string
  location: string
  salary_range: string
  created_at: string
  employer: {
    company_name: string
    logo_url: string | null
  }
  employment_type: {
    type_name: string
  }
  industry: {
    industry_name: string
  }
  is_remote: boolean
}

const applicationSchema = z.object({
  full_name: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Valid email address is required" }),
  phone: z.string().optional(),
  cover_letter: z.string().min(50, { message: "Cover letter must be at least 50 characters" }),
  resume_url: z.string().url({ message: "Please provide a valid URL for your resume" }),
  portfolio_url: z.string().url({ message: "Please provide a valid URL" }).optional().or(z.literal('')),
  linkedin_url: z.string().url({ message: "Please provide a valid URL" }).optional().or(z.literal('')),
  github_url: z.string().url({ message: "Please provide a valid URL" }).optional().or(z.literal('')),
  availability: z.string().optional(),
  expected_salary: z.string().optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

const ApplicationForm: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      cover_letter: '',
      resume_url: '',
      portfolio_url: '',
      linkedin_url: '',
      github_url: '',
      availability: 'immediate',
      expected_salary: '',
    }
  })

  useEffect(() => {
    fetchJobDetails()
    loadUserProfile()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`)
      setJob(response.data.data)
    } catch (error) {
      console.error('Error fetching job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load job details",
      })
      navigate('/jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setValue('full_name', user.full_name || '')
        setValue('email', user.email || '')
        
        // Load profile data
        const profileResponse = await api.get('/profile/me')
        const profile = profileResponse.data.data.profile
        if (profile) {
          setValue('phone', profile.phone || '')
          setValue('resume_url', profile.resume_url || '')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Resume file must be less than 5MB",
      })
      return
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload PDF, DOC, DOCX, or TXT files only",
      })
      return
    }

    setResumeFile(file)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    // Upload to server (implement actual upload logic)
    const formData = new FormData()
    formData.append('resume', file)
    
    try {
      const response = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        }
      })
      setValue('resume_url', response.data.url)
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 1000)
      toast({
        variant: "success",
        title: "Upload Complete",
        description: "Resume uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload resume. Please try again.",
      })
      setUploadProgress(0)
    } finally {
      clearInterval(interval)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    try {
      const applicationData = {
        job_id: jobId,
        cover_letter: data.cover_letter,
        resume_url: data.resume_url,
        additional_info: {
          phone: data.phone,
          portfolio_url: data.portfolio_url,
          linkedin_url: data.linkedin_url,
          github_url: data.github_url,
          availability: data.availability,
          expected_salary: data.expected_salary
        }
      }
      
      await api.post('/applications', applicationData)
      setIsSuccess(true)
      toast({
        variant: "success",
        title: "Application Submitted!",
        description: "Your application has been sent successfully",
      })
      setTimeout(() => {
        navigate('/jobseeker/applications')
      }, 3000)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.response?.data?.message || "Failed to submit application. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your application for <strong>{job?.title}</strong> at <strong>{job?.employer.company_name}</strong> has been successfully submitted.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will receive notifications about your application status via email.
            </p>
            <Button onClick={() => navigate('/jobseeker/applications')}>
              View My Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Job
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{job?.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {job?.employer.company_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{job?.location}</span>
                {job?.is_remote && <Badge variant="secondary">Remote</Badge>}
              </div>
              {job?.salary_range && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{job?.salary_range}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span>{job?.employment_type.type_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Posted {new Date(job?.created_at || '').toLocaleDateString()}</span>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Industry</h4>
                <Badge variant="outline">{job?.industry.industry_name}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Job Application</CardTitle>
              <CardDescription>
                Please fill out the form below to apply for this position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        {...register('full_name')}
                        className={errors.full_name ? 'border-red-500' : ''}
                      />
                      {errors.full_name && (
                        <p className="text-red-500 text-xs">{errors.full_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_salary">Expected Salary</Label>
                      <Input
                        id="expected_salary"
                        {...register('expected_salary')}
                        placeholder="e.g., $80,000 - $100,000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Resume Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Resume / CV</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {resumeFile ? (
                      <div className="space-y-3">
                        <FileText className="h-12 w-12 mx-auto text-blue-500" />
                        <p className="font-medium">{resumeFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setResumeFile(null)
                            setValue('resume_url', '')
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">
                          Drag and drop your resume here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Supports PDF, DOC, DOCX, TXT (Max 5MB)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('resume')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Resume
                        </Button>
                      </>
                    )}
                  </div>
                  {errors.resume_url && (
                    <p className="text-red-500 text-xs">{errors.resume_url.message}</p>
                  )}
                </div>

                <Separator />

                {/* Cover Letter */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cover Letter *</h3>
                  <Textarea
                    {...register('cover_letter')}
                    placeholder="Tell us why you're the perfect fit for this position..."
                    rows={8}
                    className={errors.cover_letter ? 'border-red-500' : ''}
                  />
                  {errors.cover_letter && (
                    <p className="text-red-500 text-xs">{errors.cover_letter.message}</p>
                  )}
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="portfolio_url">Portfolio Website</Label>
                      <Input
                        id="portfolio_url"
                        {...register('portfolio_url')}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                      <Input
                        id="linkedin_url"
                        {...register('linkedin_url')}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github_url">GitHub Profile</Label>
                      <Input
                        id="github_url"
                        {...register('github_url')}
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability</Label>
                      <select
                        id="availability"
                        {...register('availability')}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="2-weeks">2 Weeks Notice</option>
                        <option value="1-month">1 Month Notice</option>
                        <option value="negotiable">Negotiable</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    By submitting this application, you confirm that the information provided is accurate and complete.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ApplicationForm