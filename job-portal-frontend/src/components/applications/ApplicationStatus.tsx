/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Users, 
  Calendar,
  FileText,
  Mail,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Globe,
  Award} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Application {
  id: string
  job_id: string
  cover_letter: string
  resume_url: string
  applied_at: string
  updated_at: string
  status: {
    id: number
    status_name: string
  }
  job: {
    id: string
    title: string
    description: string
    location: string
    salary_range: string
    is_remote: boolean
    created_at: string
    employer: {
      id: string
      company_name: string
      company_description: string
      logo_url: string | null
      website: string
      location: string
      user: {
        email: string
      }
    }
    employment_type: {
      type_name: string
    }
    industry: {
      industry_name: string
    }
  }
  notes?: Array<{
    id: number
    note_text: string
    created_at: string
    employer: {
      company_name: string
      user: {
        email: string
      }
    }
  }>
}

const ApplicationStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchApplicationDetails()
  }, [id])

  const fetchApplicationDetails = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/applications/my-applications/${id}`)
      setApplication(response.data.data)
    } catch (error) {
      console.error('Error fetching application:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load application details",
      })
      navigate('/applications')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return { 
          icon: Clock, 
          color: 'text-amber-600', 
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          label: 'Pending Review'
        }
      case 'Reviewed':
        return { 
          icon: Eye, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Under Review'
        }
      case 'Shortlisted':
        return { 
          icon: Users, 
          color: 'text-purple-600', 
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          label: 'Shortlisted'
        }
      case 'Interview':
        return { 
          icon: Calendar, 
          color: 'text-indigo-600', 
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          label: 'Interview Stage'
        }
      case 'Accepted':
        return { 
          icon: CheckCircle, 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          label: 'Accepted'
        }
      case 'Rejected':
        return { 
          icon: XCircle, 
          color: 'text-rose-600', 
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          label: 'Not Selected'
        }
      default:
        return { 
          icon: FileText, 
          color: 'text-gray-600', 
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: status
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'C'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (!application) return null

  const statusConfig = getStatusConfig(application.status.status_name)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Applications</span>
        </button>

        {/* Header Card */}
        <div className={`rounded-2xl border-2 ${statusConfig.border} ${statusConfig.bg} p-6 mb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}>
                <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{application.job.title}</h1>
                <p className="text-gray-600 mt-1">{application.job.employer.company_name}</p>
              </div>
            </div>
            <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 px-4 py-2 text-sm font-semibold`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Application Timeline</h3>
                <p className="text-sm text-gray-500 mt-1">Track your application journey</p>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-200"></div>
                  
                  {/* Applied Step */}
                  <div className="relative flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center z-10">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="font-semibold text-gray-900">Application Submitted</h4>
                      <p className="text-sm text-gray-500">{formatDate(application.applied_at)}</p>
                      <p className="text-sm text-gray-600 mt-1">Your application was successfully submitted</p>
                    </div>
                  </div>

                  {/* Current Status Step */}
                  <div className="relative flex gap-4">
                    <div className={`w-10 h-10 rounded-full ${statusConfig.bg} flex items-center justify-center z-10 border-2 ${statusConfig.border}`}>
                      <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{statusConfig.label}</h4>
                      <p className="text-sm text-gray-500">{formatDate(application.updated_at)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {application.status.status_name === 'Pending' && "The employer will review your application and get back to you."}
                        {application.status.status_name === 'Reviewed' && "Your application has been reviewed. You're still in consideration."}
                        {application.status.status_name === 'Shortlisted' && "Congratulations! You've been shortlisted for this position."}
                        {application.status.status_name === 'Interview' && "The employer wants to schedule an interview with you."}
                        {application.status.status_name === 'Accepted' && "Congratulations! You've been offered the position!"}
                        {application.status.status_name === 'Rejected' && "We appreciate your interest. Keep applying!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                {['overview', 'cover-letter', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-medium transition-all ${
                      activeTab === tab 
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'overview' && 'Job Overview'}
                    {tab === 'cover-letter' && 'Cover Letter'}
                    {tab === 'notes' && `Notes (${application.notes?.length || 0})`}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {application.job.description || "No description provided."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3">
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm text-gray-700">{application.job.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Job Type</p>
                        <p className="text-sm text-gray-700">{application.job.employment_type.type_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Salary Range</p>
                        <p className="text-sm text-gray-700">{application.job.salary_range || 'Competitive'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Industry</p>
                        <p className="text-sm text-gray-700">{application.job.industry.industry_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'cover-letter' && (
                  <div>
                    {application.cover_letter ? (
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {application.cover_letter}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No cover letter provided</p>
                    )}
                    {application.resume_url && (
                      <Button
                        className="mt-5 bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open(application.resume_url, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Resume
                      </Button>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    {application.notes && application.notes.length > 0 ? (
                      <div className="space-y-4">
                        {application.notes.map((note) => (
                          <div key={note.id} className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                              <span className="text-xs font-medium text-blue-600">{note.employer.company_name}</span>
                              <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700">{note.note_text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No employer notes yet</p>
                        <p className="text-sm text-gray-400">Check back later for updates</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Company Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-gray-100">
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-lg">
                      {getInitials(application.job.employer.company_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{application.job.employer.company_name}</h3>
                    <p className="text-xs text-gray-500">{application.job.employer.location}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {application.job.employer.company_description || "No company description available."}
                </p>
                <div className="flex gap-2">
                  {application.job.employer.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200 rounded-xl"
                      onClick={() => window.open(application.job.employer.website, '_blank')}
                    >
                      <Globe className="h-3.5 w-3.5 mr-1" />
                      Website
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 rounded-xl"
                    onClick={() => window.location.href = `mailto:${application.job.employer.user.email}`}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Application ID</span>
                  <span className="text-xs font-mono text-gray-600">{application.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Applied on</span>
                  <span className="text-sm text-gray-700">{formatDate(application.applied_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Last updated</span>
                  <span className="text-sm text-gray-700">{formatDate(application.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Pro Tip</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    While waiting for a response, continue exploring other opportunities. The more you apply, the better your chances!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationStatus