/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  MessageSquare,
  Star,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Users,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface Application {
  id: string
  cover_letter: string
  resume_url: string
  applied_at: string
  updated_at: string
  status: {
    id: number
    status_name: string
  }
  job: {
    title: string
  }
  seeker: {
    id: string
    full_name: string
    phone: string | null
    location: string | null
    skills: string[]
    experience: any // Can be array or JSON string
    education: any // Can be array or JSON string
    email?: string
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

// ========== HELPER FUNCTION TO PARSE JSON FIELDS ==========
const parseJSONArray = (data: any): any[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Error parsing JSON:', e)
      return []
    }
  }
  return []
}

const statusOptions = [
  { value: 'Pending', label: 'Pending Review', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  { value: 'Reviewed', label: 'Reviewed', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200', icon: Eye },
  { value: 'Shortlisted', label: 'Shortlisted', color: 'bg-purple-500', textColor: 'text-purple-700', bgLight: 'bg-purple-50', border: 'border-purple-200', icon: Star },
  { value: 'Interview', label: 'Interview', color: 'bg-indigo-500', textColor: 'text-indigo-700', bgLight: 'bg-indigo-50', border: 'border-indigo-200', icon: Users },
  { value: 'Accepted', label: 'Accepted', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200', icon: ThumbsUp },
  { value: 'Rejected', label: 'Rejected', color: 'bg-rose-500', textColor: 'text-rose-700', bgLight: 'bg-rose-50', border: 'border-rose-200', icon: ThumbsDown }
]

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [feedback, setFeedback] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isAddingNote, setIsAddingNote] = useState(false)

  useEffect(() => {
    fetchApplicationDetails()
  }, [id])

  const fetchApplicationDetails = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/applications/${id}`)
      const data = response.data.data
      setApplication(data)
      setSelectedStatus(data.status.status_name)
    } catch (error) {
      console.error('Error fetching application:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load application details",
      })
      navigate('/employer/applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return
    try {
      const statusMap: { [key: string]: number } = {
        'Pending': 1,
        'Reviewed': 2,
        'Shortlisted': 3,
        'Interview': 4,
        'Accepted': 5,
        'Rejected': 6
      }
      
      await api.put(`/applications/${id}/status`, { statusId: statusMap[selectedStatus] })
      toast({ title: "Success", description: `Status updated to ${selectedStatus}` })
      setShowStatusDialog(false)
      setFeedback('')
      fetchApplicationDetails()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" })
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a note",
      })
      return
    }
    
    setIsAddingNote(true)
    try {
      const response = await api.post(`/applications/${id}/notes`, { 
        note_text: newNote 
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Note added successfully",
        })
        setNewNote('')
        fetchApplicationDetails()
      } else {
        throw new Error(response.data.message || "Failed to add note")
      }
    } catch (error: any) {
      console.error('Error adding note:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add note",
      })
    } finally {
      setIsAddingNote(false)
    }
  }

  const formatFullDate = (dateString: string) => {
    if (!dateString) return 'Present'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'C'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCandidateEmail = () => {
    return application?.seeker?.email || ''
  }

  // ========== PARSE EXPERIENCE AND EDUCATION ==========
  const experienceList = parseJSONArray(application?.seeker?.experience)
  const educationList = parseJSONArray(application?.seeker?.education)
  const skillsList = application?.seeker?.skills || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (!application) return null

  const currentStatus = statusOptions.find(s => s.value === application.status.status_name)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/employer/applications')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Button>
          <div className="flex gap-3">
            {application.resume_url && (
              <Button
                variant="outline"
                onClick={() => window.open(`http://localhost:5000${application.resume_url}`, '_blank')}
                className="border-gray-300 rounded-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
            )}
            <Button
              onClick={() => setShowStatusDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Update Status
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-lg p-4 mb-6 border ${currentStatus?.border} ${currentStatus?.bgLight}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              {currentStatus && <currentStatus.icon className={`h-5 w-5 ${currentStatus?.textColor}`} />}
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Status</p>
              <p className={`font-semibold ${currentStatus?.textColor}`}>{currentStatus?.label}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Last updated</p>
              <p className="text-sm text-gray-600">{formatDate(application.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Candidate Profile */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                      {getInitials(application.seeker.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{application.seeker.full_name}</h1>
                    <p className="text-gray-500 mt-1">Applied for: {application.job.title}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 rounded-full">
                        Applied: {formatDate(application.applied_at)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-5" />

                {/* Contact Information */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{getCandidateEmail()}</span>
                  </div>
                  {application.seeker.phone && (
                    <div className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{application.seeker.phone}</span>
                    </div>
                  )}
                  {application.seeker.location && (
                    <div className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{application.seeker.location}</span>
                    </div>
                  )}
                </div>

                {/* Tabs for Skills, Experience, Education */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                  </TabsList>

                  {/* Skills Tab */}
                  <TabsContent value="skills">
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillsList.map((skill, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No skills listed</p>
                    )}
                  </TabsContent>

                  {/* Experience Tab - FIXED: using parsed experienceList */}
                  <TabsContent value="experience">
                    {experienceList.length > 0 ? (
                      <div className="space-y-4">
                        {experienceList.map((exp: Experience, idx: number) => (
                          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {exp.company}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {formatFullDate(exp.start_date)} - {exp.current ? 'Present' : formatFullDate(exp.end_date)}
                              </Badge>
                            </div>
                            {exp.location && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {exp.location}
                              </p>
                            )}
                            {exp.description && (
                              <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No work experience listed</p>
                    )}
                  </TabsContent>

                  {/* Education Tab - FIXED: using parsed educationList */}
                  <TabsContent value="education">
                    {educationList.length > 0 ? (
                      <div className="space-y-4">
                        {educationList.map((edu: Education, idx: number) => (
                          <div key={idx} className="border-l-4 border-emerald-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                <p className="text-sm text-gray-600">{edu.institution}</p>
                                {edu.field_of_study && (
                                  <p className="text-xs text-gray-500">{edu.field_of_study}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {formatFullDate(edu.start_date)} - {edu.current ? 'Present' : formatFullDate(edu.end_date)}
                              </Badge>
                            </div>
                            {edu.description && (
                              <p className="text-sm text-gray-600 mt-2">{edu.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No education listed</p>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Cover Letter */}
                <Separator className="my-4" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Cover Letter
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {application.cover_letter || "No cover letter provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notes & Actions */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-100 py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5 text-blue-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 hover:bg-blue-50"
                  onClick={() => window.location.href = `mailto:${getCandidateEmail()}`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 hover:bg-purple-50"
                  onClick={() => {
                    setSelectedStatus('Shortlisted')
                    setShowStatusDialog(true)
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Shortlist Candidate
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-100 py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(application.applied_at)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    application.status.status_name !== 'Pending' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {application.status.status_name !== 'Pending' ? (
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Status Updated</p>
                    <p className="text-sm text-gray-500">{formatDate(application.updated_at)}</p>
                    <Badge className={`mt-1 ${currentStatus?.bgLight} ${currentStatus?.textColor} border-0`}>
                      {currentStatus?.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add a private note about this candidate..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={!newNote.trim() || isAddingNote} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isAddingNote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Note'
                    )}
                  </Button>
                </div>
                {application.notes && application.notes.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-gray-700 mb-3">Previous Notes</h4>
                    {application.notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-800">{note.employer.company_name}</span>
                          <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* UPDATE STATUS DIALOG */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-white rounded-xl shadow-2xl border border-gray-200 p-0 max-w-md">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">Update Application Status</DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                Change the status of this application
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5">
              {/* Status Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Select Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2">
                    <SelectValue placeholder="Choose a status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${option.bgLight}`}>
                            <option.icon className={`h-3.5 w-3.5 ${option.textColor}`} />
                          </div>
                          <span className="text-gray-700">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Feedback <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  placeholder="Add feedback or notes for the candidate..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400">This feedback will be shared with the candidate</p>
              </div>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-400">Application Information</span>
                </div>
              </div>

              {/* Applied Date */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-400">Applied Date</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{formatDate(application.applied_at)}</p>
              </div>
            </div>

            {/* Buttons */}
            <DialogFooter className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                className="flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
              >
                Update Status
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApplicationDetails