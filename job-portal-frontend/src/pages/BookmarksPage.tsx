/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  MapPin,
  Trash2,
  Eye,
  Building2,
  Bookmark,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface BookmarkedJob {
  id: string
  job_id?: string
  job?: {
    id: string
    title: string
    location: string
    salary_range: string
    employment_type?: {
      type_name: string
    }
    employer?: {
      company_name: string
      company_logo?: string
    }
    industry?: {
      industry_name: string
    }
    is_remote?: boolean
    is_active?: boolean
    created_at: string
  }
  created_at: string
}

const BookmarksPage: React.FC = () => {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const fetchBookmarks = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bookmarks')
      console.log('Bookmarks response:', response.data)
      
      // Handle different response structures
      let bookmarksData = response.data.data || []
      
      // If bookmarksData is an array of job IDs, we need to fetch actual job data
      if (bookmarksData.length > 0 && typeof bookmarksData[0] === 'string') {
        // Fetch full job details for each bookmark ID
        const jobPromises = bookmarksData.map(async (jobId: string) => {
          try {
            const jobResponse = await api.get(`/jobs/${jobId}`)
            return {
              id: jobId,
              job: jobResponse.data.data,
              created_at: new Date().toISOString()
            }
          } catch (err) {
            console.error('Error fetching job:', jobId, err)
            return null
          }
        })
        
        const jobsWithBookmarks = await Promise.all(jobPromises)
        bookmarksData = jobsWithBookmarks.filter(b => b !== null)
      }
      
      setBookmarks(bookmarksData)
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved jobs",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      await api.delete(`/bookmarks/${bookmarkId}`)
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      toast({
        title: "Removed",
        description: "Job removed from saved list",
      })
    } catch (error) {
      console.error('Error removing bookmark:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove job",
      })
    }
  }

  const getJobId = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.id || bookmark.job_id || bookmark.id
  }

  const getJobTitle = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.title || 'Job Title'
  }

  const getCompanyName = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.employer?.company_name || 'Company'
  }

  const getJobLocation = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.location || 'Location not specified'
  }

  const getSalaryRange = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.salary_range || 'Competitive salary'
  }

  const getEmploymentType = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.employment_type?.type_name || 'Full-time'
  }

  const getIndustryName = (bookmark: BookmarkedJob): string => {
    return bookmark.job?.industry?.industry_name || ''
  }

  const getTimeAgo = (date: string) => {
    if (!date) return 'Recently'
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      const title = getJobTitle(bookmark).toLowerCase()
      const company = getCompanyName(bookmark).toLowerCase()
      const search = searchTerm.toLowerCase()
      return title.includes(search) || company.includes(search)
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.job?.created_at || 0).getTime()
      const dateB = new Date(b.created_at || b.job?.created_at || 0).getTime()
      if (sortBy === 'recent') return dateB - dateA
      if (sortBy === 'oldest') return dateA - dateB
      if (sortBy === 'title') return getJobTitle(a).localeCompare(getJobTitle(b))
      if (sortBy === 'company') return getCompanyName(a).localeCompare(getCompanyName(b))
      return 0
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="h-6 w-6" />
            Saved Jobs
          </h1>
          <p className="text-gray-500 mt-1">Jobs you've bookmarked for later</p>
        </div>
        
      </div>

      {/* Stats Card - With custom margin/padding */}
<Card className="border border-gray-200 shadow-sm">
  <CardContent className="pt-3 pb-3 px-4">  {/* Decreased padding */}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Total Saved Jobs</p>
        <p className="text-3xl font-bold text-gray-900">{bookmarks.length}</p>
      </div>
      <Bookmark className="h-10 w-10 text-blue-500" />  {/* Smaller icon */}
    </div>
  </CardContent>
</Card>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <p className="text-sm text-gray-500">Search and sort your saved jobs</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Job Title</option>
              <option value="company">Company Name</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="text-center py-12">
            <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved jobs found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? "No jobs match your search criteria" 
                : "Start saving jobs to see them here"}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/jobs')}>
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookmarks.map((bookmark) => {
            const jobId = getJobId(bookmark)
            const isJobActive = bookmark.job?.is_active !== false
            return (
              <Card key={bookmark.id} className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${jobId}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {getJobTitle(bookmark)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {getCompanyName(bookmark)}
                      </p>
                    </div>
                    {!isJobActive && (
                      <Badge variant="destructive">Closed</Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{getJobLocation(bookmark)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{getEmploymentType(bookmark)}</span>
                    </div>
                    {getSalaryRange(bookmark) && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="font-medium">{getSalaryRange(bookmark)}</span>
                      </div>
                    )}
                    {getIndustryName(bookmark) && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{getIndustryName(bookmark)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Saved {getTimeAgo(bookmark.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
  variant="outline" 
  size="sm"
  className="flex-1 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all rounded-lg text-sm"
  onClick={(e) => {
    e.stopPropagation()
    navigate(`/jobs/${jobId}`)
  }}
>
  <Eye className="h-4 w-4 mr-2" />
  View Job
  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveBookmark(bookmark.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BookmarksPage