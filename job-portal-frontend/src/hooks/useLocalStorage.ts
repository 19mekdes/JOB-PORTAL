/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'

/**
 * Generic localStorage hook with type safety
 * @param key - localStorage key
 * @param initialValue - Initial value if not found
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get stored value from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [initialValue, key])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  useEffect(() => {
    setStoredValue(readValue())
  }, [readValue])

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        setStoredValue(JSON.parse(event.newValue))
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook for storing user preferences
 */
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: boolean
  emailUpdates: boolean
  itemsPerPage: number
}

export const useUserPreferences = () => {
  const [preferences, setPreferences, resetPreferences] = useLocalStorage<UserPreferences>(
    'user_preferences',
    {
      theme: 'system',
      language: 'en',
      notifications: true,
      emailUpdates: true,
      itemsPerPage: 10
    }
  )

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [setPreferences])

  return {
    preferences,
    updatePreference,
    resetPreferences
  }
}

/**
 * Hook for storing job search filters
 */
interface SearchFilters {
  keyword: string
  location: string
  jobType: string
  experienceLevel: string
  salaryMin: number
  salaryMax: number
  remoteOnly: boolean
  datePosted: string
}

export const useSavedSearchFilters = () => {
  const [filters, setFilters, clearFilters] = useLocalStorage<SearchFilters>(
    'saved_search_filters',
    {
      keyword: '',
      location: '',
      jobType: 'all',
      experienceLevel: 'all',
      salaryMin: 0,
      salaryMax: 200000,
      remoteOnly: false,
      datePosted: 'all'
    }
  )

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [setFilters])

  return {
    filters,
    updateFilter,
    clearFilters
  }
}

/**
 * Hook for storing recent searches
 */
export const useRecentSearches = (maxItems: number = 5) => {
  const [searches, setSearches] = useLocalStorage<string[]>('recent_searches', [])

  const addSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    setSearches(prev => {
      const filtered = prev.filter(s => s !== searchTerm)
      return [searchTerm, ...filtered].slice(0, maxItems)
    })
  }, [setSearches, maxItems])

  const removeSearch = useCallback((searchTerm: string) => {
    setSearches(prev => prev.filter(s => s !== searchTerm))
  }, [setSearches])

  const clearSearches = useCallback(() => {
    setSearches([])
  }, [setSearches])

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches
  }
}

/**
 * Hook for storing recently viewed jobs
 */
interface RecentlyViewedJob {
  id: string
  title: string
  company: string
  viewedAt: string
}

export const useRecentlyViewedJobs = (maxItems: number = 10) => {
  const [jobs, setJobs] = useLocalStorage<RecentlyViewedJob[]>('recently_viewed_jobs', [])

  const addJob = useCallback((job: { id: string; title: string; company: string }) => {
    setJobs(prev => {
      const filtered = prev.filter(j => j.id !== job.id)
      const newJob = { ...job, viewedAt: new Date().toISOString() }
      return [newJob, ...filtered].slice(0, maxItems)
    })
  }, [setJobs, maxItems])

  const clearJobs = useCallback(() => {
    setJobs([])
  }, [setJobs])

  return {
    jobs,
    addJob,
    clearJobs
  }
}

/**
 * Hook for storing authentication token
 */
export const useAuthToken = () => {
  const [token, setToken, removeToken] = useLocalStorage<string | null>('auth_token', null)

  return {
    token,
    setToken,
    removeToken,
    isAuthenticated: !!token
  }
}

/**
 * Hook for storing user data
 */
interface UserData {
  id: string
  email: string
  full_name: string
  user_type: string
  avatar?: string
}

export const useUserData = () => {
  const [user, setUser, removeUser] = useLocalStorage<UserData | null>('user_data', null)

  const updateUser = useCallback((updates: Partial<UserData>) => {
    setUser(prev => prev ? { ...prev, ...updates } : updates as UserData)
  }, [setUser])

  return {
    user,
    setUser,
    updateUser,
    removeUser,
    isLoggedIn: !!user
  }
}

/**
 * Hook for storing draft job posts (for employers)
 */
interface DraftJob {
  id: string
  title: string
  description: string
  location: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  updatedAt: string
}

export const useDraftJobs = () => {
  const [drafts, setDrafts] = useLocalStorage<DraftJob[]>('draft_jobs', [])

  const saveDraft = useCallback((draft: Omit<DraftJob, 'id' | 'updatedAt'>) => {
    const newDraft: DraftJob = {
      ...draft,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString()
    }
    setDrafts(prev => [...prev, newDraft])
    return newDraft.id
  }, [setDrafts])

  const updateDraft = useCallback((id: string, updates: Partial<DraftJob>) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === id 
        ? { ...draft, ...updates, updatedAt: new Date().toISOString() }
        : draft
    ))
  }, [setDrafts])

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== id))
  }, [setDrafts])

  const getDraft = useCallback((id: string) => {
    return drafts.find(draft => draft.id === id)
  }, [drafts])

  const clearAllDrafts = useCallback(() => {
    setDrafts([])
  }, [setDrafts])

  return {
    drafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    getDraft,
    clearAllDrafts
  }
}

/**
 * Hook for storing application form data
 */
export const useApplicationFormDraft = (jobId: string) => {
  const key = `application_draft_${jobId}`
  const [draft, setDraft, removeDraft] = useLocalStorage<any>(key, null)

  const saveDraft = useCallback((data: any) => {
    setDraft({ ...data, updatedAt: new Date().toISOString() })
  }, [setDraft])

  const clearDraft = useCallback(() => {
    removeDraft()
  }, [removeDraft])

  const hasDraft = useCallback(() => {
    return draft !== null
  }, [draft])

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft
  }
}

/**
 * Hook for storing notification preferences
 */
interface NotificationPrefs {
  email_enabled: boolean
  push_enabled: boolean
  application_updates: boolean
  new_job_alerts: boolean
  marketing_emails: boolean
}

export const useNotificationPreferences = () => {
  const [prefs, setPrefs, resetPrefs] = useLocalStorage<NotificationPrefs>(
    'notification_preferences',
    {
      email_enabled: true,
      push_enabled: true,
      application_updates: true,
      new_job_alerts: true,
      marketing_emails: false
    }
  )

  const togglePreference = useCallback(<K extends keyof NotificationPrefs>(key: K) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }, [setPrefs])

  return {
    preferences: prefs,
    togglePreference,
    resetPreferences: resetPrefs
  }
}

export default useLocalStorage