import api from './api'

// ========== TYPES ==========
export interface BookmarkedJob {
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

export interface BookmarkFilters {
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'title' | 'company'
}

export interface BookmarkResponse {
  data: BookmarkedJob[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ========== BOOKMARK SERVICES ==========

// Get all bookmarks for current user
export const getBookmarks = async (filters: BookmarkFilters = {}): Promise<BookmarkResponse> => {
  const params = new URLSearchParams()
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sort) params.append('sort', filters.sort)
  
  const response = await api.get(`/bookmarks${params.toString() ? `?${params}` : ''}`)
  return response.data
}

// Get bookmark by ID
export const getBookmarkById = async (bookmarkId: number): Promise<BookmarkedJob> => {
  const response = await api.get(`/bookmarks/${bookmarkId}`)
  return response.data.data
}

// Add a job to bookmarks
export const addBookmark = async (jobId: string): Promise<BookmarkedJob> => {
  const response = await api.post(`/bookmarks/${jobId}`)
  return response.data.data
}

// Remove a job from bookmarks
export const removeBookmark = async (jobId: string): Promise<void> => {
  await api.delete(`/bookmarks/${jobId}`)
}

// Check if a job is bookmarked
export const checkBookmarkStatus = async (jobId: string): Promise<boolean> => {
  const response = await api.get(`/bookmarks/check/${jobId}`)
  return response.data.data.isBookmarked
}

// Get total bookmark count
export const getBookmarkCount = async (): Promise<number> => {
  const response = await api.get('/bookmarks/count')
  return response.data.data.count
}

// Get bookmarked job details
export const getBookmarkedJobDetails = async (bookmarkId: number): Promise<BookmarkedJob> => {
  const response = await api.get(`/bookmarks/details/${bookmarkId}`)
  return response.data.data
}

// Bulk add bookmarks
export const bulkAddBookmarks = async (jobIds: string[]): Promise<{ successful: number; failed: number }> => {
  const response = await api.post('/bookmarks/bulk', { jobIds })
  return response.data.data
}

// Bulk remove bookmarks
export const bulkRemoveBookmarks = async (jobIds: string[]): Promise<{ deleted_count: number }> => {
  const response = await api.delete('/bookmarks/bulk', { data: { jobIds } })
  return response.data.data
}

// ========== HELPER FUNCTIONS ==========

// Check if job is in bookmarks list
export const isJobBookmarked = (bookmarks: BookmarkedJob[], jobId: string): boolean => {
  return bookmarks.some(bookmark => bookmark.job.id === jobId)
}

// Get bookmark by job ID
export const getBookmarkByJobId = (bookmarks: BookmarkedJob[], jobId: string): BookmarkedJob | undefined => {
  return bookmarks.find(bookmark => bookmark.job.id === jobId)
}

// Filter bookmarks by job status (active/closed)
export const filterBookmarksByStatus = (bookmarks: BookmarkedJob[], activeOnly: boolean = true): BookmarkedJob[] => {
  if (activeOnly) {
    return bookmarks.filter(bookmark => bookmark.job.is_active)
  }
  return bookmarks
}

// Filter bookmarks by search term
export const filterBookmarksBySearch = (bookmarks: BookmarkedJob[], searchTerm: string): BookmarkedJob[] => {
  if (!searchTerm.trim()) return bookmarks
  
  const term = searchTerm.toLowerCase()
  return bookmarks.filter(bookmark => 
    bookmark.job.title.toLowerCase().includes(term) ||
    bookmark.job.employer.company_name.toLowerCase().includes(term) ||
    bookmark.job.location.toLowerCase().includes(term)
  )
}

// Sort bookmarks
export const sortBookmarks = (bookmarks: BookmarkedJob[], sortBy: 'recent' | 'oldest' | 'title' | 'company'): BookmarkedJob[] => {
  const sorted = [...bookmarks]
  
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    case 'title':
      return sorted.sort((a, b) => a.job.title.localeCompare(b.job.title))
    case 'company':
      return sorted.sort((a, b) => a.job.employer.company_name.localeCompare(b.job.employer.company_name))
    default:
      return sorted
  }
}

// Group bookmarks by date
export const groupBookmarksByDate = (bookmarks: BookmarkedJob[]): Record<string, BookmarkedJob[]> => {
  const grouped: Record<string, BookmarkedJob[]> = {}
  
  bookmarks.forEach(bookmark => {
    const date = new Date(bookmark.created_at).toLocaleDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(bookmark)
  })
  
  return grouped
}

// Get recently added bookmarks (last N days)
export const getRecentBookmarks = (bookmarks: BookmarkedJob[], days: number = 7): BookmarkedJob[] => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return bookmarks.filter(bookmark => new Date(bookmark.created_at) >= cutoffDate)
}

// Get expired bookmarks (jobs that are no longer active)
export const getExpiredBookmarks = (bookmarks: BookmarkedJob[]): BookmarkedJob[] => {
  return bookmarks.filter(bookmark => !bookmark.job.is_active)
}

// Get active bookmarks
export const getActiveBookmarks = (bookmarks: BookmarkedJob[]): BookmarkedJob[] => {
  return bookmarks.filter(bookmark => bookmark.job.is_active)
}

// Get bookmark statistics
export const getBookmarkStats = (bookmarks: BookmarkedJob[]) => {
  const total = bookmarks.length
  const active = getActiveBookmarks(bookmarks).length
  const expired = getExpiredBookmarks(bookmarks).length
  const recent = getRecentBookmarks(bookmarks, 7).length
  
  return {
    total,
    active,
    expired,
    recent,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
  }
}

// Get top industries from bookmarks
export const getTopIndustriesFromBookmarks = (bookmarks: BookmarkedJob[], limit: number = 5): Array<{ industry: string; count: number }> => {
  const industryCount: Record<string, number> = {}
  
  bookmarks.forEach(bookmark => {
    const industry = bookmark.job.industry.industry_name
    industryCount[industry] = (industryCount[industry] || 0) + 1
  })
  
  return Object.entries(industryCount)
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get top companies from bookmarks
export const getTopCompaniesFromBookmarks = (bookmarks: BookmarkedJob[], limit: number = 5): Array<{ company: string; count: number }> => {
  const companyCount: Record<string, number> = {}
  
  bookmarks.forEach(bookmark => {
    const company = bookmark.job.employer.company_name
    companyCount[company] = (companyCount[company] || 0) + 1
  })
  
  return Object.entries(companyCount)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

const bookmarkService = {
  // API methods
  getBookmarks,
  getBookmarkById,
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getBookmarkCount,
  getBookmarkedJobDetails,
  bulkAddBookmarks,
  bulkRemoveBookmarks,
  
  // Helper methods
  isJobBookmarked,
  getBookmarkByJobId,
  filterBookmarksByStatus,
  filterBookmarksBySearch,
  sortBookmarks,
  groupBookmarksByDate,
  getRecentBookmarks,
  getExpiredBookmarks,
  getActiveBookmarks,
  getBookmarkStats,
  getTopIndustriesFromBookmarks,
  getTopCompaniesFromBookmarks
}

export default bookmarkService