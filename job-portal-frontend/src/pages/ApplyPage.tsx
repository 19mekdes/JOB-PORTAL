/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import api from '@/services/api'

export default function ApplyPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  
  useEffect(() => {
    fetchJobDetails()
    checkIfAlreadyApplied()
  }, [jobId])
  
  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`)
      setJob(response.data.data)
    } catch (error) {
      console.error('Error fetching job:', error)
      setError('Job not found')
    } finally {
      setLoading(false)
    }
  }
  
  const checkIfAlreadyApplied = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
    if (!token) return
    
    try {
      const response = await api.get('/applications/my-applications')
      const applications = response.data.data || []
      const hasApplied = applications.some((app: any) => app.job_id === jobId)
      setAlreadyApplied(hasApplied)
      
      if (hasApplied) {
        console.log('User has already applied for this job')
      }
    } catch (error) {
      console.error('Error checking applications:', error)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    // Check if already applied - show alert immediately
    if (alreadyApplied) {
      alert('⚠️ You have already applied for this position!\n\nPlease check "My Applications" for status.')
      setSubmitting(false)
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('coverLetter', coverLetter)
      if (resume) {
        formData.append('resume', resume)
      }
      
      await api.post(`/applications/apply/${jobId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setSuccess(true)
      alert('✅ Application submitted successfully!')
      
      setTimeout(() => {
        navigate('/applications')
      }, 2000)
    } catch (error: any) {
      console.error('Error applying:', error)
      
      // Get the error message from backend
      const backendMessage = error.response?.data?.message || error.message
      console.log('Backend error message:', backendMessage)
      
      // Check if it's a duplicate application error
      if (backendMessage === 'You have already applied for this job' || 
          backendMessage.includes('already applied')) {
        setAlreadyApplied(true)
        alert('⚠️ You have already applied for this position!\n\nPlease check "My Applications" for status.')
      } else {
        // Other errors
        alert('❌ Failed to submit application: ' + backendMessage)
        setError(backendMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-500">Loading job details...</p>
      </div>
    )
  }
  
  // Show Already Applied page
  if (alreadyApplied) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-yellow-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-800 mb-2">Already Applied!</h1>
          <p className="text-yellow-600 mb-4">
            You have already submitted an application for <strong>{job?.title}</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You can track your application status in the "My Applications" section.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/applications')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              View My Applications
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
            >
              Browse Other Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Application Submitted!</h1>
          <p className="text-green-600 mb-4">
            Your application for {job?.title} has been submitted successfully.
          </p>
          <p className="text-gray-500 text-sm">Redirecting to My Applications...</p>
        </div>
      </div>
    )
  }
  
  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-red-500 mb-4">{error || 'Job not found'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(`/jobs/${jobId}`)}
        className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
      >
        ← Back to Job
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Apply for {job.title}</h1>
          <p className="text-blue-100 mt-1">{job.employer?.company_name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Job Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Job Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Location:</span>
                <p className="text-gray-900">{job.location}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Salary:</span>
                <p className="text-gray-900">{job.salary_range || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Job Type:</span>
                <p className="text-gray-900">{job.employment_type?.type_name || 'Full-time'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Industry:</span>
                <p className="text-gray-900">{job.industry?.industry_name || 'Technology'}</p>
              </div>
            </div>
          </div>
          
          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume/CV *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResume(e.target.files?.[0] || null)}
                      required
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX up to 5MB
                </p>
                {resume && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {resume.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Cover Letter */}
          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter
            </label>
            <textarea
              id="coverLetter"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us why you're a great fit for this position..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional but recommended
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/jobs/${jobId}`)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}