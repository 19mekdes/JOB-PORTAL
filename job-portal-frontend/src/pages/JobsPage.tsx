/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  MapPin, DollarSign, Briefcase, Clock, Eye, Building2, Search, X, 
  Bookmark, BookmarkCheck, Filter, ChevronDown, Users, 
  GraduationCap, Loader2, SlidersHorizontal
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { Job, BookmarkedJob } from '@/types'

// Filter options
const jobTypesList = [
  'Full-time', 'Part-time', 'Freelance', 'Contractual', 
  'Volunteer', 'Intern (Paid)', 'Intern (Unpaid)'
]

const jobSitesList = ['On-site', 'Remote', 'Hybrid']

const experienceLevels = [
  'Entry level', 'Junior', 'Intermediate', 'Senior', 'Expert'
]

const educationLevels = [
  'Tvet', 'Secondary School', 'Certificate', 'Diploma', 
  'Bachelors Degree', 'Masters Degree', 'Phd', 'Not Required'
]

const sectors = [
  'Technology', 'Healthcare', 'Finance', 'Education', 
  'Retail', 'Manufacturing', 'Construction', 'Marketing',
  'Design', 'Sales', 'Customer Service', 'Administrative'
]

interface FilterState {
  sector: string
  jobTypes: string[]
  jobSites: string[]
  experienceLevels: string[]
  educationLevels: string[]
}

const JOBS_PER_PAGE = 4

const JobsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams()
  
  const initialSearch = searchParams.get('search') || ''
  const initialLocation = searchParams.get('location') || ''
  
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [locationFilter, setLocationFilter] = useState(initialLocation)
  const [typeFilter, setTypeFilter] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    sector: '',
    jobTypes: [],
    jobSites: [],
    experienceLevels: [],
    educationLevels: []
  })

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE)
  }, [filters, searchTerm, locationFilter, typeFilter])

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
      
      const openJobs = jobsData.filter((job: Job) => job.status?.status_name === 'Open')
      setJobs(openJobs)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedJobs = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setSavedJobIds(new Set())
      return
    }

    try {
      const response = await api.get('/bookmarks')
      let savedIds: string[] = []
      const data = response.data
      
      if (data?.data && Array.isArray(data.data)) {
        savedIds = data.data.map((item: BookmarkedJob) => String(item.job?.id))
      } else if (Array.isArray(data)) {
        savedIds = data.map((item: BookmarkedJob) => String(item.job?.id))
      }
      
      setSavedJobIds(new Set(savedIds))
    } catch (error) {
      console.error('Error loading saved jobs:', error)
      setSavedJobIds(new Set())
    }
  }

  const handleSaveJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const token = localStorage.getItem('token')
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
        const bookmarksResponse = await api.get('/bookmarks')
        let bookmarkId = null
        const bookmarksData = bookmarksResponse.data?.data || bookmarksResponse.data || []
        
        if (Array.isArray(bookmarksData)) {
          const bookmark = bookmarksData.find((b: BookmarkedJob) => String(b.job?.id) === String(jobId))
          if (bookmark) bookmarkId = bookmark.id
        }
        
        if (bookmarkId) {
          await api.delete(`/bookmarks/${bookmarkId}`)
        }
        
        const newSaved = new Set(savedJobIds)
        newSaved.delete(jobId)
        setSavedJobIds(newSaved)
        toast({ title: "Removed", description: "Job removed from saved" })
      } else {
        await api.post('/bookmarks', { job_id: jobId })
        const newSaved = new Set(savedJobIds)
        newSaved.add(jobId)
        setSavedJobIds(newSaved)
        toast({ title: "Saved", description: "Job saved successfully" })
      }
      
      await loadSavedJobs()
    } catch (error: any) {
      console.error('Error saving job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save job",
      })
    } finally {
      setSavingId(null)
    }
  }

  const handleSectorChange = (value: string) => {
    setFilters(prev => ({ ...prev, sector: value }))
  }

  const handleJobTypeChange = (type: string) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }))
  }

  const handleJobSiteChange = (site: string) => {
    setFilters(prev => ({
      ...prev,
      jobSites: prev.jobSites.includes(site)
        ? prev.jobSites.filter(s => s !== site)
        : [...prev.jobSites, site]
    }))
  }

  const handleExperienceChange = (level: string) => {
    setFilters(prev => ({
      ...prev,
      experienceLevels: prev.experienceLevels.includes(level)
        ? prev.experienceLevels.filter(l => l !== level)
        : [...prev.experienceLevels, level]
    }))
  }

  const handleEducationChange = (level: string) => {
    setFilters(prev => ({
      ...prev,
      educationLevels: prev.educationLevels.includes(level)
        ? prev.educationLevels.filter(l => l !== level)
        : [...prev.educationLevels, level]
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      sector: '',
      jobTypes: [],
      jobSites: [],
      experienceLevels: [],
      educationLevels: []
    })
    setSearchTerm('')
    setLocationFilter('')
    setTypeFilter('')
  }

  const handleLoadMore = () => {
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCount(prev => prev + JOBS_PER_PAGE)
      setLoadingMore(false)
    }, 500)
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    if (max) return `Up to $${max.toLocaleString()}`
    return null
  }

  // Apply all filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = locationFilter === '' || 
      job.location?.toLowerCase().includes(locationFilter.toLowerCase())
    
    const matchesType = typeFilter === '' || 
      job.employment_type?.type_name?.toLowerCase().includes(typeFilter.toLowerCase())
    
    const matchesSector = filters.sector === '' || 
      job.industry?.industry_name === filters.sector
    
    const matchesJobTypes = filters.jobTypes.length === 0 || 
      (job.employment_type?.type_name && filters.jobTypes.includes(job.employment_type.type_name))
    
    const matchesJobSites = filters.jobSites.length === 0 || 
      (filters.jobSites.includes('Remote') && job.is_remote) ||
      (filters.jobSites.includes('On-site') && !job.is_remote) ||
      (filters.jobSites.includes('Hybrid') && job.is_hybrid)
    
    const matchesExperience = filters.experienceLevels.length === 0 || true
    const matchesEducation = filters.educationLevels.length === 0 || true
    
    return matchesSearch && matchesLocation && matchesType && matchesSector && 
           matchesJobTypes && matchesJobSites && matchesExperience && matchesEducation
  })

  const visibleJobs = filteredJobs.slice(0, visibleCount)
  const hasMoreJobs = visibleCount < filteredJobs.length
  const remainingJobs = filteredJobs.length - visibleCount

  const activeFilterCount = 
    (filters.sector ? 1 : 0) +
    filters.jobTypes.length +
    filters.jobSites.length +
    filters.experienceLevels.length +
    filters.educationLevels.length

  // ✅ COMPLETE FILTER SIDEBAR - Sticky Header + Scrollable Content
const FilterSidebar = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    
    {/* ========== STICKY HEADER (Does NOT scroll) ========== */}
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Jobs</h2>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>
      {activeFilterCount > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
        </p>
      )}
    </div>

    {/* ========== SCROLLABLE CONTENT (Scrolls) ========== */}
    <div className="h-[calc(100vh-280px)] overflow-y-auto p-4 space-y-5">
      
      {/* Sector Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-500" />
          Sector
        </h3>
        <select
          value={filters.sector}
          onChange={(e) => handleSectorChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Sectors</option>
          {sectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
      </div>

      {/* Job Types */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Job Types</h3>
        <div className="space-y-2">
          {jobTypesList.map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.jobTypes.includes(type)}
                onChange={() => handleJobTypeChange(type)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Sites */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Job Sites</h3>
        <div className="space-y-2">
          {jobSitesList.map(site => (
            <label key={site} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.jobSites.includes(site)}
                onChange={() => handleJobSiteChange(site)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{site}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          Experience Level
        </h3>
        <div className="space-y-2">
          {experienceLevels.map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.experienceLevels.includes(level)}
                onChange={() => handleExperienceChange(level)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Education Level */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-blue-500" />
          Education Level
        </h3>
        <div className="space-y-2">
          {educationLevels.map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.educationLevels.includes(level)}
                onChange={() => handleEducationChange(level)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      <Button 
        variant="outline" 
        onClick={clearAllFilters}
        className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Clear All Filters
      </Button>
    </div>
  </div>
)

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
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Dream Job</h1>
          <p className="text-gray-500 mt-2">
            {filteredJobs.length > 0 
              ? `Found ${filteredJobs.length} opportunities matching your criteria`
              : 'Explore opportunities from top employers'}
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Job title, skills, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-gray-200 bg-white"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="City, region, or Remote..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-9 rounded-lg border-gray-200 bg-white"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Job Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="remote">Remote</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 shrink-0">
            <FilterSidebar />
          </div>

          {/* Mobile Filters Drawer */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilters(false)}>
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                  <h2 className="font-semibold">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4">
                  <FilterSidebar />
                </div>
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className="flex-1">
            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.sector && (
                  <Badge className="bg-blue-100 text-blue-700">
                    Sector: {filters.sector}
                    <button onClick={() => handleSectorChange('')} className="ml-2">×</button>
                  </Badge>
                )}
                {filters.jobTypes.map(type => (
                  <Badge key={type} className="bg-blue-100 text-blue-700">
                    {type}
                    <button onClick={() => handleJobTypeChange(type)} className="ml-2">×</button>
                  </Badge>
                ))}
                {filters.jobSites.map(site => (
                  <Badge key={site} className="bg-blue-100 text-blue-700">
                    {site}
                    <button onClick={() => handleJobSiteChange(site)} className="ml-2">×</button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Results Count */}
            <div className="flex justify-between items-center mb-5">
              <p className="text-gray-600 text-sm">
                Showing <span className="font-semibold text-gray-900">{visibleJobs.length}</span> of <span className="font-semibold text-gray-900">{filteredJobs.length}</span> jobs
              </p>
            </div>

            {/* Job Listings */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No jobs found matching your criteria.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleJobs.map((job) => {
                    const isSaved = savedJobIds.has(job.id)
                    const salaryRange = formatSalary(job.salary_min, job.salary_max)
                    
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
                                    {job.employer?.company_name || 'Company'}
                                  </p>
                                </div>
                              </div>
                              
                              <button
                                onClick={(e) => handleSaveJob(e, job.id)}
                                disabled={savingId === job.id}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
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
                                <span className="truncate">{job.location || 'Location not specified'}</span>
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
                              
                              {salaryRange && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                  <span className="font-medium text-emerald-600">{salaryRange}</span>
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
                              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>

                {/* Load More Button */}
                {hasMoreJobs && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg min-w-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Load More Jobs ({Math.min(remainingJobs, JOBS_PER_PAGE)} of {remainingJobs} remaining)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* All jobs loaded message */}
                {!hasMoreJobs && visibleJobs.length > 0 && (
                  <div className="text-center mt-8 text-gray-400 text-sm">
                    ✓ All {filteredJobs.length} jobs loaded
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobsPage