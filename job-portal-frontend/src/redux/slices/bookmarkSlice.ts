import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

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

interface BookmarkState {
  bookmarks: BookmarkedJob[]
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  totalItems: number
  filters: BookmarkFilters
}

// ========== INITIAL STATE ==========
const initialState: BookmarkState = {
  bookmarks: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  totalItems: 0,
  filters: {
    page: 1,
    limit: 10,
    sort: 'recent'
  }
}

// ========== ASYNC THUNKS ==========

// Fetch all bookmarks
export const fetchBookmarks = createAsyncThunk(
  'bookmarks/fetchBookmarks',
  async (filters: BookmarkFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sort) params.append('sort', filters.sort)
    
    const response = await api.get(`/bookmarks${params.toString() ? `?${params}` : ''}`)
    return response.data
  }
)

// Add a bookmark
export const addBookmark = createAsyncThunk(
  'bookmarks/addBookmark',
  async (jobId: string) => {
    const response = await api.post(`/bookmarks/${jobId}`)
    return response.data.data
  }
)

// Remove a bookmark
export const removeBookmark = createAsyncThunk(
  'bookmarks/removeBookmark',
  async (jobId: string) => {
    await api.delete(`/bookmarks/${jobId}`)
    return jobId
  }
)

// Check if a job is bookmarked
export const checkBookmarkStatus = createAsyncThunk(
  'bookmarks/checkBookmarkStatus',
  async (jobId: string) => {
    const response = await api.get(`/bookmarks/check/${jobId}`)
    return { jobId, isBookmarked: response.data.data.isBookmarked }
  }
)

// Get bookmark count
export const getBookmarkCount = createAsyncThunk(
  'bookmarks/getBookmarkCount',
  async () => {
    const response = await api.get('/bookmarks/count')
    return response.data.data.count
  }
)

// Bulk add bookmarks
export const bulkAddBookmarks = createAsyncThunk(
  'bookmarks/bulkAddBookmarks',
  async (jobIds: string[]) => {
    const response = await api.post('/bookmarks/bulk', { jobIds })
    return response.data.data
  }
)

// Bulk remove bookmarks
export const bulkRemoveBookmarks = createAsyncThunk(
  'bookmarks/bulkRemoveBookmarks',
  async (jobIds: string[]) => {
    await api.delete('/bookmarks/bulk', { data: { jobIds } })
    return jobIds
  }
)

// ========== SLICE ==========
const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<BookmarkFilters>>) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 }
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        sort: 'recent'
      }
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetState: () => initialState,
    // Optimistic update: add bookmark to list
    optimisticAddBookmark: (state, action: PayloadAction<BookmarkedJob>) => {
      state.bookmarks.unshift(action.payload)
      state.totalItems += 1
    },
    // Optimistic update: remove bookmark from list
    optimisticRemoveBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(b => b.job.id !== action.payload)
      state.totalItems -= 1
    },
    updateBookmarkInList: (state, action: PayloadAction<BookmarkedJob>) => {
      const index = state.bookmarks.findIndex(b => b.id === action.payload.id)
      if (index !== -1) {
        state.bookmarks[index] = action.payload
      }
    },
    removeBookmarkFromList: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(b => b.job.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookmarks
      .addCase(fetchBookmarks.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.isLoading = false
        state.bookmarks = action.payload.data
        state.totalPages = action.payload.pagination?.pages || 1
        state.currentPage = action.payload.pagination?.page || 1
        state.totalItems = action.payload.pagination?.total || 0
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch bookmarks'
      })
      
      // Add Bookmark
      .addCase(addBookmark.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        state.isLoading = false
        state.bookmarks.unshift(action.payload)
        state.totalItems += 1
      })
      .addCase(addBookmark.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to save bookmark'
      })
      
      // Remove Bookmark
      .addCase(removeBookmark.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.isLoading = false
        state.bookmarks = state.bookmarks.filter(b => b.job.id !== action.payload)
        state.totalItems -= 1
      })
      .addCase(removeBookmark.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to remove bookmark'
      })
      
      // Check Bookmark Status
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .addCase(checkBookmarkStatus.fulfilled, (_state, _action) => {
        // This doesn't modify the state directly, but can be used for UI updates
        // The result is handled in the component
      })
      
      // Get Bookmark Count
      .addCase(getBookmarkCount.fulfilled, (state, action) => {
        // Count is handled in component, but we could store it
        state.totalItems = action.payload
      })
      
      // Bulk Add Bookmarks
      .addCase(bulkAddBookmarks.fulfilled, (state, action) => {
        state.bookmarks = [...action.payload, ...state.bookmarks]
        state.totalItems += action.payload.length
      })
      
      // Bulk Remove Bookmarks
      .addCase(bulkRemoveBookmarks.fulfilled, (state, action) => {
        state.bookmarks = state.bookmarks.filter(b => !action.payload.includes(b.job.id))
        state.totalItems -= action.payload.length
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setCurrentPage,
  clearError,
  resetState,
  optimisticAddBookmark,
  optimisticRemoveBookmark,
  updateBookmarkInList,
  removeBookmarkFromList
} = bookmarkSlice.actions

export default bookmarkSlice.reducer