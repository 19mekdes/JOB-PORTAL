/* eslint-disable react-hooks/immutability */
import React, { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Image,
  FileArchive
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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

interface Resume {
  id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  is_primary: boolean
  uploaded_at: string
}

interface ResumeUploadProps {
  onUploadComplete?: () => void
  maxSize?: number // in MB
  allowedTypes?: string[]
}

const MAX_FILE_SIZE = 5 // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />
  if (fileType.includes('text')) return <FileText className="h-5 w-5 text-gray-500" />
  if (fileType.includes('image')) return <Image className="h-5 w-5 text-green-500" />
  return <FileArchive className="h-5 w-5 text-gray-500" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onUploadComplete,
  maxSize = MAX_FILE_SIZE,
  allowedTypes = ALLOWED_TYPES
}) => {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/profile/seeker/resumes')
      setResumes(response.data.data)
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load resumes",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: `Please upload ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} files only`,
      })
      return false
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: `File size must be less than ${maxSize}MB`,
      })
      return false
    }
    return true
  }

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return

    setIsUploading(true)
    setUploadProgress(0)
    
    const formData = new FormData()
    formData.append('resume', file)

    try {
      
      toast({
        title: "Success",
        description: "Resume uploaded successfully",
      })
      await fetchResumes()
      onUploadComplete?.()
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload resume. Please try again.",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteResume = async () => {
    if (!selectedResume) return

    try {
      await api.delete(`/profile/seeker/resume/${selectedResume.id}`)
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      })
      await fetchResumes()
      onUploadComplete?.()
      setIsDeleteDialogOpen(false)
      setSelectedResume(null)
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete resume",
      })
    }
  }

  const handleSetPrimary = async (resumeId: string) => {
    try {
      await api.put(`/profile/seeker/resume/${resumeId}/primary`)
      toast({
        title: "Success",
        description: "Primary resume updated",
      })
      await fetchResumes()
    } catch (error) {
      console.error('Error setting primary resume:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update primary resume",
      })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            Upload your resume in PDF, DOC, DOCX, or TXT format (Max {maxSize}MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={allowedTypes.join(',')}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0])
                }
              }}
            />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your resume here, or click to browse
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Supports PDF, DOC, DOCX, TXT (Max {maxSize}MB)
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumes List */}
      {resumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Resumes</CardTitle>
            <CardDescription>Manage your uploaded resumes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    resume.is_primary ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(resume.file_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{resume.filename}</p>
                        {resume.is_primary && (
                          <Badge variant="default" className="bg-blue-500">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(resume.file_size)} • Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(resume.file_url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = resume.file_url
                        link.download = resume.filename
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!resume.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimary(resume.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResume(resume)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Resume Tips:</strong> Keep your resume updated with your latest experience and skills.
          A well-written resume increases your chances of getting hired by 40%!
        </AlertDescription>
      </Alert>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedResume?.filename}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteResume} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ResumeUpload