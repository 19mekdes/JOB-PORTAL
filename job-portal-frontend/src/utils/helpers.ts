/* eslint-disable @typescript-eslint/no-explicit-any */
// ========== STRING HELPERS ==========

/**
 * Generate a random string ID
 * @param length - Length of the ID (default: 8)
 * @returns Random string ID
 */
export const generateId = (length: number = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Check if string is empty or only whitespace
 * @param str - String to check
 * @returns Boolean
 */
export const isEmptyString = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0
}

/**
 * Truncate string to specified length
 * @param str - String to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length).trim() + suffix
}

/**
 * Convert string to camelCase
 * @param str - String to convert
 * @returns camelCase string
 */
export const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
}

/**
 * Convert string to kebab-case
 * @param str - String to convert
 * @returns kebab-case string
 */
export const toKebabCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Convert string to snake_case
 * @param str - String to convert
 * @returns snake_case string
 */
export const toSnakeCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// ========== ARRAY HELPERS ==========

/**
 * Chunk array into smaller arrays
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Chunked array
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Remove duplicates from array
 * @param array - Array to deduplicate
 * @returns Deduplicated array
 */
export const uniqueArray = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

/**
 * Shuffle array (Fisher-Yates)
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Group array by key
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    groups[groupKey] = groups[groupKey] || []
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by key
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array
 */
export const sortByKey = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  const sorted = [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

// ========== OBJECT HELPERS ==========

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Pick specific keys from object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with picked keys
 */
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Omit specific keys from object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without omitted keys
 */
export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

/**
 * Check if object is empty
 * @param obj - Object to check
 * @returns Boolean
 */
export const isEmptyObject = (obj: object | null | undefined): boolean => {
  if (!obj) return true
  return Object.keys(obj).length === 0
}

// ========== STORAGE HELPERS ==========

/**
 * Save data to localStorage
 * @param key - Storage key
 * @param value - Value to store
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

/**
 * Get data from localStorage
 * @param key - Storage key
 * @param defaultValue - Default value if not found
 * @returns Retrieved value or default
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

/**
 * Remove item from localStorage
 * @param key - Storage key
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

/**
 * Clear all localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// ========== URL HELPERS ==========

/**
 * Get query parameter from URL
 * @param name - Parameter name
 * @param url - URL string (default: window.location.href)
 * @returns Parameter value or null
 */
export const getQueryParam = (name: string, url?: string): string | null => {
  const params = new URLSearchParams(url || window.location.search)
  return params.get(name)
}

/**
 * Set query parameter in URL
 * @param params - Parameters to set
 * @param replace - Whether to replace history (default: false)
 */
export const setQueryParams = (params: Record<string, string>, replace: boolean = false): void => {
  const url = new URL(window.location.href)
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
  })
  if (replace) {
    window.history.replaceState({}, '', url.toString())
  } else {
    window.history.pushState({}, '', url.toString())
  }
}

/**
 * Build URL with query parameters
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns URL string with parameters
 */
export const buildUrl = (baseUrl: string, params: Record<string, any>): string => {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value.toString())
    }
  })
  return url.toString()
}

// ========== BROWSER HELPERS ==========

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Download file from blob
 * @param blob - Blob data
 * @param filename - File name
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download file from URL
 * @param url - File URL
 * @param filename - File name
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    downloadBlob(blob, filename)
  } catch (error) {
    console.error('Failed to download file:', error)
  }
}

/**
 * Open URL in new tab
 * @param url - URL to open
 * @param target - Target attribute (default: '_blank')
 */
export const openInNewTab = (url: string, target: string = '_blank'): void => {
  window.open(url, target)
}

// ========== DEVICE HELPERS ==========

/**
 * Check if device is mobile
 * @returns Boolean
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if device is touch-enabled
 * @returns Boolean
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Get device type
 * @returns Device type string
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// ========== PERFORMANCE HELPERS ==========

/**
 * Debounce function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ========== EXPORT ALL ==========
export default {
  // String
  generateId,
  generateUUID,
  isEmptyString,
  truncate,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  
  // Array
  chunkArray,
  uniqueArray,
  shuffleArray,
  groupBy,
  sortByKey,
  
  // Object
  deepClone,
  pick,
  omit,
  isEmptyObject,
  
  // Storage
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorage,
  
  // URL
  getQueryParam,
  setQueryParams,
  buildUrl,
  
  // Browser
  copyToClipboard,
  downloadBlob,
  downloadFile,
  openInNewTab,
  
  // Device
  isMobile,
  isTouchDevice,
  getDeviceType,
  
  // Performance
  debounce,
  throttle
}