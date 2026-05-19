import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/common/LoadingSpinner'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface BookmarkedJob {
  id: number
  job: {
    id: string
    title: string
    description: string
    location: string
    salary_range: string | null
    created_at: string
    is_remote: boolean
    employer: {
      company_name: string
      logo_url: string | null
    }
    industry: {
      industry_name: string
    }
    employment_type: {
      type_name: string
    }
    is_active: boolean
  }
  created_at: string
}

const MyBookmarks: React.FC = () => {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [jobToRemove, setJobToRemove] = useState<BookmarkedJob | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchBookmarks()
  }, [])

  const fetchBookmarks = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/bookmarks')
      setBookmarks(response.data.data)
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved jobs",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveBookmark = async () => {
    if (!jobToRemove) return
    try {
      await api.delete(`/bookmarks/${jobToRemove.job.id}`)
      setBookmarks(bookmarks.filter(b => b.id !== jobToRemove.id))
      toast({
        title: "Removed",
        description: "Job removed from saved list",
      })
      setIsRemoveDialogOpen(false)
      setJobToRemove(null)
    } catch (error) {
      console.error('Error removing bookmark:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove job",
      })
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

  const filteredBookmarks = bookmarks
    .filter(bookmark => 
      bookmark.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.job.employer.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'title') return a.job.title.localeCompare(b.job.title)
      if (sortBy === 'company') return a.job.employer.company_name.localeCompare(b.job.employer.company_name)
      return 0
    })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="h-8 w-8" />
            Saved Jobs
          </h1>
          <p className="text-gray-500 mt-1">Jobs you've bookmarked for later</p>
        </div>
        <Button variant="outline" onClick={fetchBookmarks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Saved Jobs</p>
              <p className="text-3xl font-bold">{bookmarks.length}</p>
            </div>
            <BookmarkCheck className="h-12 w-12 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and sort your saved jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Job Title</SelectItem>
                <SelectItem value="company">Company Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <Card>
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
        <div className="space-y-3">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Section - Job Info */}
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/jobs/${bookmark.job.id}`)}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {bookmark.job.employer.company_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                            {bookmark.job.title}
                          </h3>
                          {!bookmark.job.is_active && (
                            <Badge variant="destructive">Closed</Badge>
                          )}
                        </div>
                        <p className="text-gray-600">{bookmark.job.employer.company_name}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {bookmark.job.location}
                            {bookmark.job.is_remote && <Badge variant="secondary" className="ml-1">Remote</Badge>}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {bookmark.job.employment_type.type_name}
                          </span>
                          {bookmark.job.salary_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {bookmark.job.salary_range}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {bookmark.job.industry.industry_name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Saved {getTimeAgo(bookmark.created_at)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/jobs/${bookmark.job.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Job
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setJobToRemove(bookmark);
                        setIsRemoveDialogOpen(true);
                      }} 
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Saved Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{jobToRemove?.job.title}" from your saved list?
              You can always save it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveBookmark} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MyBookmarks