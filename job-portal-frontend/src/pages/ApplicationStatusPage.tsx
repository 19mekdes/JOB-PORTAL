/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Download,
  MessageSquare,
  FileText,
  ExternalLink,
  Eye,
  Clock,
  Star,
  Users} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Application {
  id: string
  job_id: string
  seeker_id: string
  cover_letter: string
  resume_url: string
  status: {
    id: number
    status_name: string
  }
  applied_at: string
  updated_at: string
  employer_notes: string
  job: {
    id: string
    title: string
    description: string
    location: string
    salary_range: string
    employment_type: {
      type_name: string
    }
    employer: {
      company_name: string
      location: string
      website: string
      logo_url: string
      user: {
        email: string
      }
    }
  }
  seeker: {
    full_name: string
    phone: string
    email: string
    skills: string[]
    experience: string
    education: string
    resume_url?: string
  }
  notes: Array<{
    id: number
    note_text: string
    created_at: string
    employer: {
      company_name: string
    }
  }>
}

const ApplicationStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewingResume, setViewingResume] = useState(false)

  useEffect(() => {
    if (id) {
      fetchApplicationDetails()
    }
  }, [id])

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/applications/${id}`)
      setApplication(response.data.data)
    } catch (error: any) {
      console.error('Error fetching application:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load application details",
      })
      if (error.response?.status === 404) {
        navigate('/applications')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (statusId: number, statusName: string) => {
    try {
      await api.put(`/applications/${id}/status`, { statusId })
      toast({
        title: "Success",
        description: `Application status updated to ${statusName}`,
      })
      fetchApplicationDetails()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
      })
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    
    setSubmitting(true)
    try {
      await api.post(`/applications/${id}/notes`, { note_text: newNote })
      toast({
        title: "Success",
        description: "Note added successfully",
      })
      setNewNote('')
      fetchApplicationDetails()
    } catch (error: any) {
      console.error('Error adding note:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add note",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewResume = () => {
    const resumeUrl = application?.resume_url || application?.seeker?.resume_url
    
    if (!resumeUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No resume found for this applicant",
      })
      return
    }
    
    setViewingResume(true)
    
    let fullUrl = resumeUrl
    if (resumeUrl.startsWith('/uploads/')) {
      fullUrl = `http://localhost:5000${resumeUrl}`
    } else if (!resumeUrl.startsWith('http')) {
      fullUrl = `http://localhost:5000/uploads/resumes/${resumeUrl}`
    }
    
    window.open(fullUrl, '_blank')
    setViewingResume(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0 rounded-full px-3 py-1">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full px-3 py-1">Reviewed</Badge>
      case 'shortlisted':
        return <Badge className="bg-purple-100 text-purple-700 border-0 rounded-full px-3 py-1">Shortlisted</Badge>
      case 'interview':
        return <Badge className="bg-indigo-100 text-indigo-700 border-0 rounded-full px-3 py-1">Interview</Badge>
      case 'accepted':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full px-3 py-1">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-700 border-0 rounded-full px-3 py-1">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'border-amber-200 bg-amber-50/30'
      case 'reviewed': return 'border-blue-200 bg-blue-50/30'
      case 'shortlisted': return 'border-purple-200 bg-purple-50/30'
      case 'interview': return 'border-indigo-200 bg-indigo-50/30'
      case 'accepted': return 'border-emerald-200 bg-emerald-50/30'
      case 'rejected': return 'border-rose-200 bg-rose-50/30'
      default: return 'border-gray-200 bg-gray-50/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-5 w-5 text-amber-600" />
      case 'reviewed': return <Eye className="h-5 w-5 text-blue-600" />
      case 'shortlisted': return <Star className="h-5 w-5 text-purple-600" />
      case 'interview': return <Users className="h-5 w-5 text-indigo-600" />
      case 'accepted': return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case 'rejected': return <XCircle className="h-5 w-5 text-rose-600" />
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'U'
  }

  const getResumeUrl = () => {
    return application?.resume_url || application?.seeker?.resume_url
  }

  const hasResume = !!getResumeUrl()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
            <p className="text-gray-500 mb-4">The application you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/applications')}>Back to Applications</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isEmployer = user?.user_type === 'Employer'
  const isJobSeeker = user?.user_type === 'Job Seeker'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Application Status</h1>
          <p className="text-gray-500 mt-1">Track your job application progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Banner */}
            <div className={`rounded-xl border p-5 ${getStatusColor(application.status.status_name)}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white shadow-sm">
                  {getStatusIcon(application.status.status_name)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {application.status.status_name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {formatDate(application.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Job Information Card */}
            <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Job Information</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{application.job.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{application.job.employer.company_name}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {application.job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {application.job.salary_range || 'Competitive'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {application.job.employment_type.type_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Applied on {new Date(application.applied_at).toLocaleDateString()}
                  </span>
                </div>

                <Separator className="bg-gray-100" />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {application.cover_letter || 'No cover letter provided'}
                    </p>
                  </div>
                </div>

                {hasResume && (
                  <Button 
                    variant="outline" 
                    onClick={handleViewResume}
                    disabled={viewingResume}
                    className="border-gray-200 rounded-lg"
                  >
                    {viewingResume ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    View Resume
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notes Section (for employer) */}
            {isEmployer && (
              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add a private note about this candidate..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="rounded-lg border-gray-200"
                    />
                    <Button onClick={addNote} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  {application.notes && application.notes.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-medium text-gray-700">Previous Notes</h4>
                      {application.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-500">{note.employer.company_name}</span>
                            <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700">{note.note_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            
            {/* Quick Actions Card (for employer) */}
            {isEmployer && (
              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden sticky top-6">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-gray-200 rounded-lg hover:bg-blue-50"
                    onClick={() => updateStatus(2, 'Reviewed')}
                  >
                    Reviewed
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-gray-200 rounded-lg hover:bg-purple-50"
                    onClick={() => updateStatus(3, 'Shortlisted')}
                  >
                    Shortlisted
                    <Star className="h-4 w-4 text-purple-600" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-gray-200 rounded-lg hover:bg-indigo-50"
                    onClick={() => updateStatus(4, 'Interview')}
                  >
                    Interview
                    <Users className="h-4 w-4 text-indigo-600" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-gray-200 rounded-lg hover:bg-emerald-50 text-emerald-600"
                    onClick={() => updateStatus(5, 'Accepted')}
                  >
                    Accept
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-gray-200 rounded-lg hover:bg-rose-50 text-rose-600"
                    onClick={() => updateStatus(6, 'Rejected')}
                  >
                    Reject
                    <XCircle className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Applicant Information Card (for employer) */}
            {isEmployer && (
              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Applicant Information</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                        {getInitials(application.seeker.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900">{application.seeker.full_name}</h4>
                      <p className="text-sm text-gray-500">Candidate</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{application.seeker.email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{application.seeker.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <Separator className="bg-gray-100" />

                  {application.seeker.skills && application.seeker.skills.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 text-sm mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {application.seeker.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700 rounded-full text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasResume && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-gray-200 rounded-lg"
                      onClick={handleViewResume}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline Card */}
            <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="w-0.5 h-12 bg-gray-200 mt-1"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(application.applied_at)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      application.status.status_name !== 'Pending' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {application.status.status_name !== 'Pending' ? (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Status Updated</p>
                    <p className="text-sm text-gray-500">{formatDate(application.updated_at)}</p>
                    {getStatusBadge(application.status.status_name)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Notes (for job seeker) */}
            {isJobSeeker && application.employer_notes && (
              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Employer Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-gray-700 text-sm">{application.employer_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationStatusPage