/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, DollarSign, Briefcase, Clock, Eye, Building2, Search, X, Bookmark, BookmarkCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { Job, BookmarkedJob } from '@/types'

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)

  // Load jobs
  useEffect(() => {
    loadJobs()
  }, [])

  // Load saved jobs when component mounts
  useEffect(() => {
    loadSavedJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/jobs')
      let jobsData = response.data?.data || response.data || []
      if (!Array.isArray(jobsData)) {
        jobsData = []
      }
      
      // ✅ FILTER: Only show jobs with status_name === 'Open'
      const openJobs = jobsData.filter((job: Job) => job.status?.status_name === 'Open')
      
      setJobs(openJobs)
      console.log(`✅ Loaded ${openJobs.length} open jobs out of ${jobsData.length} total`)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedJobs = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
    if (!token) {
      console.log('No token found, skipping saved jobs load')
      setSavedJobIds(new Set())
      return
    }

    try {
      const response = await api.get('/bookmarks')
      console.log('Bookmarks response:', response.data)
      
      let savedIds: string[] = []
      const data = response.data
      
      if (data?.data && Array.isArray(data.data)) {
        savedIds = data.data.map((item: BookmarkedJob) => String(item.job?.id || item.job?._id))
      } 
      else if (Array.isArray(data)) {
        savedIds = data.map((item: BookmarkedJob) => String(item.job?.id || item.job?._id))
      }
      else if (data?.bookmarks && Array.isArray(data.bookmarks)) {
        savedIds = data.bookmarks.map((item: BookmarkedJob) => String(item.job?.id || item.job?._id))
      }
      
      setSavedJobIds(new Set(savedIds))
      console.log('Saved job IDs loaded:', savedIds)
    } catch (error: any) {
      console.error('Error loading saved jobs:', error.response?.data || error.message)
      setSavedJobIds(new Set())
    }
  }

  const handleSaveJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('handleSaveJob called with jobId:', jobId)
    
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please login to save jobs",
        variant: "destructive",
      })
      return
    }

    const isSaved = savedJobIds.has(jobId)
    setSavingId(jobId)
    
    try {
      if (isSaved) {
        console.log(`Removing bookmark for job: ${jobId}`)
        
        const bookmarksResponse = await api.get('/bookmarks')
        let bookmarkId = null
        
        const bookmarksData = bookmarksResponse.data?.data || bookmarksResponse.data || []
        if (Array.isArray(bookmarksData)) {
          const bookmark = bookmarksData.find((b: BookmarkedJob) => 
            String(b.job?.id) === String(jobId) || String(b.job?._id) === String(jobId)
          )
          if (bookmark) {
            bookmarkId = bookmark.id
          }
        }
        
        if (bookmarkId) {
          await api.delete(`/bookmarks/${bookmarkId}`)
        } else {
          await api.delete(`/bookmarks/job/${jobId}`)
        }
        
        const newSaved = new Set(savedJobIds)
        newSaved.delete(jobId)
        setSavedJobIds(newSaved)
        
        toast({ 
          title: "Removed", 
          description: "Job removed from saved",
        })
      } else {
        console.log(`Adding bookmark for job: ${jobId}`)
        await api.post('/bookmarks', { job_id: jobId })
        
        const newSaved = new Set(savedJobIds)
        newSaved.add(jobId)
        setSavedJobIds(newSaved)
        
        toast({ 
          title: "Saved", 
          description: "Job saved successfully",
        })
      }
      
      await loadSavedJobs()
      
    } catch (error: any) {
      console.error('Error saving job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || error.response?.data?.error || "Failed to save job",
      })
    } finally {
      setSavingId(null)
    }
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = locationFilter === '' || 
                           job.location?.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesType = typeFilter === '' || 
                       job.employment_type?.type_name?.toLowerCase().includes(typeFilter.toLowerCase())
    return matchesSearch && matchesLocation && matchesType
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Dream Job</h1>
          <p className="text-gray-500 mt-2">Explore {filteredJobs.length} opportunities from top employers</p>
        </div>
        
        {/* Search Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-gray-200"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-9 rounded-lg border-gray-200"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700"
            >
              <option value="">All Job Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="remote">Remote</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          
          {(searchTerm || locationFilter || typeFilter) && (
            <div className="mt-4 text-right">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setLocationFilter('')
                  setTypeFilter('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto"
              >
                <X className="h-3 w-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-5">
          <p className="text-gray-600 text-sm">
            Found <span className="font-semibold text-gray-900">{filteredJobs.length}</span> jobs
          </p>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No open positions available at the moment.</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new opportunities!</p>
            <button
              onClick={() => { setSearchTerm(''); setLocationFilter(''); setTypeFilter('') }}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isSaved = savedJobIds.has(job.id)
              // Check if job is Open (should be already filtered, but double-check)
              const isOpen = job.status?.status_name === 'Open'
              
              // Don't render if not Open (safety check)
              if (!isOpen) return null
              
              return (
                <Link key={job.id} to={`/jobs/${job.id}`}>
                  <Card className="h-full border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 cursor-pointer rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-5 flex flex-col h-full">
                      
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            <p className="text-sm text-gray-500 truncate">
                              {job.employer?.company_name}
                            </p>
                          </div>
                        </div>
                        
                        {/* Save Button */}
                        <button
                          onClick={(e) => handleSaveJob(e, job.id)}
                          disabled={savingId === job.id}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 z-10 relative"
                          title={isSaved ? "Remove from saved" : "Save job"}
                        >
                          {savingId === job.id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                          ) : isSaved ? (
                            <BookmarkCheck className="h-5 w-5 text-blue-600 fill-blue-600" />
                          ) : (
                            <Bookmark className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                          )}
                        </button>
                      </div>

                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{job.location || 'Remote'}</span>
                          {job.is_remote && (
                            <Badge className="bg-blue-50 text-blue-700 border-0 text-xs rounded-full px-2 py-0.5">
                              Remote
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Briefcase className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span>{job.employment_type?.type_name || 'Full-time'}</span>
                          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs rounded-full px-2 py-0.5">
                            Open
                          </Badge>
                        </div>
                        
                        {job.salary_range && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="font-medium text-emerald-600">{job.salary_range}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400 pt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(job.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {job.views_count || 0} views
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full mt-3 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all rounded-lg text-sm"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default JobsPage