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
  Award,
  Heart,
  LogIn,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  FileText,
  GraduationCap,
  Target,
  Shield,
  ThumbsUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  is_premium?: boolean
  employer: {
    id: string
    company_name: string
    company_description: string | null
    website: string | null
    logo_url: string | null
    location: string | null
    founded_year: number | null
    company_size: string | null
    user: {
      email: string
    }
  }
  industry: {
    id: number
    industry_name: string
  }
  employment_type: {
    id: number
    type_name: string
  }
  status: {
    id: number
    status_name: string
  }
  has_applied?: boolean
  is_saved?: boolean
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
      toast({
        title: "Login Required",
        description: "Please login to save jobs",
        variant: "destructive",
      })
      navigate('/login')
      return
    }
    try {
      if (isSaved) {
        await api.delete(`/bookmarks/${id}`)
        setIsSaved(false)
        toast({
          title: "Removed",
          description: "Job removed from saved",
        })
      } else {
        await api.post(`/bookmarks/${id}`)
        setIsSaved(true)
        toast({
          title: "Saved",
          description: "Job saved successfully",
        })
      }
    } catch (error) {
      console.error('Error saving job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save job",
      })
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
      toast({
        title: "Link Copied",
        description: "Job link copied to clipboard",
      })
    }
  }

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to apply for this job",
        variant: "destructive",
      })
      navigate('/login')
      return
    }
    if (user.user_type !== 'Job Seeker') {
      toast({
        title: "Not Allowed",
        description: "Only job seekers can apply for jobs",
        variant: "destructive",
      })
      return
    }
    if (job?.has_applied) {
      toast({
        title: "Already Applied",
        description: "You have already applied for this position",
      })
      return
    }
    navigate(`/apply/${id}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/jobs')} 
          className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Jobs</span>
        </button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Job Header Card - Afriwork Style */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
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
                            <Zap className="h-3 w-3" />
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{job.employer.company_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveJob}
                      className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Bookmark className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <Share2 className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Job Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-full">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                    {job.is_remote && <span className="text-blue-600"> (Remote)</span>}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-full">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.employment_type.type_name}
                  </span>
                  {job.salary_range && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-full">
                      <DollarSign className="h-3.5 w-3.5" />
                      {job.salary_range}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    Posted {getTimeAgo(job.created_at)}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span>{job.views_count} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{job.applications_count} applicants</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Posted on {formatDate(job.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description Tabs - Afriwork Style */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100">
                <div className="flex gap-1 p-2">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      activeTab === 'description'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('requirements')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      activeTab === 'requirements'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Requirements
                  </button>
                  <button
                    onClick={() => setActiveTab('benefits')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      activeTab === 'benefits'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Benefits
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </div>
                  </div>
                )}
                {activeTab === 'requirements' && (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {job.requirements || 'No specific requirements listed.'}
                    </div>
                  </div>
                )}
                {activeTab === 'benefits' && (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {job.benefits || 'No benefits information provided.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Jobs */}
            {job.related_jobs && job.related_jobs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Similar Jobs</h3>
                  <p className="text-sm text-gray-500 mt-1">You might also be interested in</p>
                </div>
                <div className="p-4 space-y-3">
                  {job.related_jobs.slice(0, 3).map((relatedJob) => (
                    <div
                      key={relatedJob.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-gray-100"
                      onClick={() => navigate(`/jobs/${relatedJob.id}`)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{relatedJob.title}</p>
                        <p className="text-sm text-gray-500">{relatedJob.employer.company_name}</p>
                      </div>
                      <button className="text-blue-600 text-sm font-medium hover:underline">
                        View Details →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-5">
            
            {/* Apply Card - Afriwork Style */}
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
                      <p className="text-amber-600 text-sm mt-1">Create an account or sign in</p>
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Login to Apply
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      New user? <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline">Register here</button>
                    </p>
                  </div>
                ) : !isJobSeeker ? (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Not a Job Seeker</p>
                    <p className="text-red-600 text-sm">Only job seekers can apply</p>
                  </div>
                ) : job.has_applied ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Application Submitted!</p>
                    <p className="text-green-600 text-sm">You have already applied</p>
                  </div>
                ) : job.status.status_name !== 'Open' ? (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Position Closed</p>
                    <p className="text-red-600 text-sm">No longer accepting applications</p>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                    Apply Now
                  </button>
                )}

                {/* Quick Stats */}
                <div className="pt-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500">Applications Received</span>
                    <span className="font-semibold text-gray-900">{job.applications_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-500">Posted Date</span>
                    <span className="text-gray-700">{formatDate(job.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-700">{formatDate(job.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info Card - Afriwork Style */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">About the Company</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">
                      {job.employer.company_name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{job.employer.company_name}</h4>
                    {job.employer.company_size && (
                      <p className="text-xs text-gray-500">{job.employer.company_size}</p>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {job.employer.company_description || 'No company description available.'}
                </p>
                
                <div className="space-y-2 text-sm">
                  {job.employer.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{job.employer.location}</span>
                    </div>
                  )}
                  {job.employer.founded_year && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Founded {job.employer.founded_year}</span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex gap-2">
                  {job.employer.website && (
                    <button
                      onClick={() => window.open(job.employer.website!, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </button>
                  )}
                  <button
                    onClick={() => window.location.href = `mailto:${job.employer.user.email}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    <Mail className="h-4 w-4" />
                    Contact
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