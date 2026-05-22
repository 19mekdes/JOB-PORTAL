/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Clock,
  Eye,
  Users,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  Globe,
  ExternalLink,
  Zap,
  Calendar,
  Send,
  Gift,
  ListChecks,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { RootState } from '@/redux/store'
import api from '@/services/api'

interface JobDetails {
  id: string
  title: string
  description: string
  requirements: string | null
  benefits: string | null
  location: string
  salary_range: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
  updated_at: string
  views_count: number
  applications_count: number
  is_remote: boolean
  is_featured?: boolean
  employer: {
    id: string
    company_name: string
    company_description: string | null
    website: string | null
    logo_url: string | null
    location: string | null
    founded_year: number | null
    company_size: string | null
    user: { email: string }
  }
  industry: { id: number; industry_name: string }
  employment_type: { id: number; type_name: string }
  status: { id: number; status_name: string }
  has_applied?: boolean
  related_jobs?: JobDetails[]
}

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [job, setJob] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    fetchJobDetails()
    checkIfSaved()
    window.scrollTo(0, 0)
  }, [id])

  const fetchJobDetails = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/jobs/${id}`)
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

  const checkIfSaved = async () => {
    if (!user) return
    try {
      const response = await api.get(`/bookmarks/check/${id}`)
      setIsSaved(response.data.data.isBookmarked)
    } catch (error) {
      console.error('Error checking bookmark:', error)
    }
  }

  const handleSaveJob = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to save jobs", variant: "destructive" })
      navigate('/login')
      return
    }
    try {
      if (isSaved) {
        await api.delete(`/bookmarks/${id}`)
        setIsSaved(false)
        toast({ title: "Removed", description: "Job removed from saved" })
      } else {
        await api.post(`/bookmarks/${id}`)
        setIsSaved(true)
        toast({ title: "Saved", description: "Job saved successfully" })
      }
    } catch (error) {
      console.error('Error saving job:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to save job" })
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.employer.company_name}`,
        url: window.location.href
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      toast({ title: "Link Copied", description: "Job link copied to clipboard" })
    }
  }

  const handleApply = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to apply", variant: "destructive" })
      navigate('/login')
    } else if (user.user_type !== 'Job Seeker') {
      toast({ title: "Not Allowed", description: "Only job seekers can apply", variant: "destructive" })
    } else if (job?.has_applied) {
      toast({ title: "Already Applied", description: "You have already applied for this position" })
    } else {
      navigate(`/apply/${id}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  // ✅ CRITICAL: Convert stored text to bullet points
  const formatTextToBulletPoints = (text: string | null): string[] => {
    if (!text) return []
    if (text.trim() === '') return []
    
    // Split by new lines (how data is stored from PostJobPage)
    if (text.includes('\n')) {
      return text.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
    }
    // Split by commas (fallback)
    if (text.includes(',')) {
      return text.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
    }
    // Single item
    return [text.trim()]
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  const isLoggedIn = !!user
  const isJobSeeker = user?.user_type === 'Job Seeker'
  // ✅ Convert requirements and benefits to arrays
  const requirementsList = formatTextToBulletPoints(job.requirements)
  const benefitsList = formatTextToBulletPoints(job.benefits)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button onClick={() => navigate('/jobs')} className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Jobs</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Job Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <span className="text-white text-2xl font-bold">
                        {job.employer.company_name?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                        {job.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                            <Zap className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{job.employer.company_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveJob} className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      {isSaved ? <BookmarkCheck className="h-5 w-5 text-blue-600" /> : <Bookmark className="h-5 w-5 text-gray-500" />}
                    </button>
                    <button onClick={handleShare} className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <Share2 className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Job Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-full">
                    <MapPin className="h-3.5 w-3.5" /> {job.location} {job.is_remote && <span className="text-blue-600 ml-1">(Remote)</span>}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-full">
                    <Briefcase className="h-3.5 w-3.5" /> {job.employment_type.type_name}
                  </span>
                  {job.salary_range && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-full">
                      <DollarSign className="h-3.5 w-3.5" /> {job.salary_range}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-full">
                    <Clock className="h-3.5 w-3.5" /> Posted {getTimeAgo(job.created_at)}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Eye className="h-4 w-4" /> <span>{job.views_count} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" /> <span>{job.applications_count} applicants</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" /> <span>Posted on {formatDate(job.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100">
                <div className="flex gap-1 p-2">
                  <button onClick={() => setActiveTab('description')} className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'description' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Description</button>
                  <button onClick={() => setActiveTab('requirements')} className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'requirements' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Requirements</button>
                  <button onClick={() => setActiveTab('benefits')} className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'benefits' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Benefits</button>
                </div>
              </div>
              <div className="p-6">
                {/* Description Tab */}
                {activeTab === 'description' && (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</div>
                  </div>
                )}
                
                {/* Requirements Tab - ✅ Displays as bullet points */}
                {activeTab === 'requirements' && (
                  <div>
                    {requirementsList.length === 0 ? (
                      <div className="text-center py-8">
                        <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No specific requirements listed.</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {requirementsList.map((req, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {/* Benefits Tab - ✅ Displays as bullet points */}
                {activeTab === 'benefits' && (
                  <div>
                    {benefitsList.length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No benefits information provided.</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {benefitsList.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Gift className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-5">
            
            {/* Apply Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">Apply for this job</h3>
              </div>
              <div className="p-5 space-y-4">
                {!isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
                      <LogIn className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-amber-800 font-medium">Login to Apply</p>
                    </div>
                    <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl">Login to Apply</button>
                  </div>
                ) : !isJobSeeker ? (
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Only job seekers can apply</p>
                  </div>
                ) : job.has_applied ? (
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Already Applied!</p>
                  </div>
                ) : job.status.status_name !== 'Open' ? (
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Position Closed</p>
                  </div>
                ) : (
                  <button onClick={handleApply} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Apply Now
                  </button>
                )}
              </div>
            </div>

            {/* Company Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">About the Company</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">{job.employer.company_name?.charAt(0) || 'C'}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{job.employer.company_name}</h4>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{job.employer.company_description || 'No company description available.'}</p>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  {job.employer.website && (
                    <button onClick={() => window.open(job.employer.website!, '_blank')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
                      <Globe className="h-4 w-4" /> Website
                    </button>
                  )}
                  <button onClick={() => window.location.href = `mailto:${job.employer.user.email}`} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
                    <Mail className="h-4 w-4" /> Contact
                  </button>
                </div>
              </div>
            </div>

            {/* Industry Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Industry</p>
                    <p className="font-medium text-gray-900">{job.industry.industry_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobDetailsPage