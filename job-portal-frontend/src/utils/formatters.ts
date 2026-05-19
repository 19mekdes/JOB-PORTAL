import { format, formatDistance, isValid, parseISO } from 'date-fns'

// ========== DATE FORMATTERS ==========

/**
 * Format date to display string
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Invalid date'
  return format(dateObj, formatStr)
}

/**
 * Format date with time
 * @param date - Date string or Date object
 * @returns Formatted date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy h:mm a')
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Invalid date'
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

/**
 * Format time ago (simplified version)
 * @param date - Date string or Date object
 * @returns Time ago string
 */
export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
}

/**
 * Format month year (e.g., "January 2024")
 * @param date - Date string or Date object
 * @returns Month year string
 */
export const formatMonthYear = (date: string | Date): string => {
  return formatDate(date, 'MMMM yyyy')
}

/**
 * Format year only
 * @param date - Date string or Date object
 * @returns Year string
 */
export const formatYear = (date: string | Date): string => {
  return formatDate(date, 'yyyy')
}

// ========== CURRENCY FORMATTERS ==========

/**
 * Format salary range
 * @param min - Minimum salary
 * @param max - Maximum salary
 * @returns Formatted salary range string
 */
export const formatSalary = (min: number | null, max: number | null): string => {
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }
  if (min) {
    return `From $${min.toLocaleString()}`
  }
  if (max) {
    return `Up to $${max.toLocaleString()}`
  }
  return 'Not specified'
}

/**
 * Format salary range from string or object
 * @param salary - Salary range string or object with min/max
 * @returns Formatted salary string
 */
export const formatSalaryRange = (salary: string | { min?: number; max?: number } | null): string => {
  if (!salary) return 'Not specified'
  if (typeof salary === 'string') return salary
  return formatSalary(salary.min || null, salary.max || null)
}

/**
 * Format currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// ========== NUMBER FORMATTERS ==========

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

/**
 * Format percentage
 * @param value - Value to format (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format compact number (e.g., 1.2K, 1.5M)
 * @param num - Number to format
 * @returns Compact number string
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  return `${(num / 1000000).toFixed(1)}M`
}

/**
 * Format file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ========== TEXT FORMATTERS ==========

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param length - Maximum length (default: 100)
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export const truncateText = (text: string, length: number = 100, suffix: string = '...'): string => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length).trim() + suffix
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return ''
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Capitalize first letter only
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeFirst = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Convert to slug (URL-friendly string)
 * @param text - Text to convert
 * @returns Slug string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Extract initials from name
 * @param name - Full name
 * @param maxLength - Maximum number of initials (default: 2)
 * @returns Initials string
 */
export const getInitials = (name: string, maxLength: number = 2): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength)
}

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/)
  if (match) {
    return [match[1], match[2], match[3]].filter(Boolean).join('-')
  }
  return phone
}

/**
 * Mask email address
 * @param email - Email address
 * @returns Masked email
 */
export const maskEmail = (email: string): string => {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
  return `${maskedLocal}@${domain}`
}

// ========== HTML FORMATTERS ==========

/**
 * Strip HTML tags from string
 * @param html - HTML string
 * @returns Plain text
 */
export const stripHtml = (html: string): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Convert newlines to HTML breaks
 * @param text - Text with newlines
 * @returns HTML with <br> tags
 */
export const nl2br = (text: string): string => {
  if (!text) return ''
  return text.replace(/\n/g, '<br />')
}

// ========== JOB SPECIFIC FORMATTERS ==========

/**
 * Format job location with remote indicator
 * @param location - Job location
 * @param isRemote - Whether job is remote
 * @returns Formatted location string
 */
export const formatJobLocation = (location: string, isRemote: boolean): string => {
  if (isRemote) return 'Remote'
  return location
}

/**
 * Format employment type for display
 * @param type - Employment type
 * @returns Formatted type
 */
export const formatEmploymentType = (type: string): string => {
  const types: Record<string, string> = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
    hybrid: 'Hybrid',
    internship: 'Internship'
  }
  return types[type.toLowerCase()] || type
}

/**
 * Format experience level
 * @param years - Years of experience
 * @returns Experience level string
 */
export const formatExperienceLevel = (years: number): string => {
  if (years <= 2) return 'Entry Level'
  if (years <= 5) return 'Mid Level'
  if (years <= 9) return 'Senior Level'
  if (years <= 14) return 'Lead'
  return 'Executive'
}

// ========== APPLICATION SPECIFIC FORMATTERS ==========

/**
 * Format application status for display
 * @param status - Application status
 * @returns Formatted status
 */
export const formatApplicationStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pending: 'Pending Review',
    reviewed: 'Reviewed',
    shortlisted: 'Shortlisted',
    interview: 'Interview Scheduled',
    accepted: 'Accepted',
    rejected: 'Not Selected'
  }
  return statuses[status.toLowerCase()] || status
}

/**
 * Get status color class
 * @param status - Application status
 * @returns CSS color class
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-green-100 text-green-800',
    interview: 'bg-purple-100 text-purple-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  }
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

// ========== COMPANY SPECIFIC FORMATTERS ==========

/**
 * Format company size
 * @param size - Company size range
 * @returns Formatted company size
 */
export const formatCompanySize = (size: string | null): string => {
  if (!size) return 'Not specified'
  const sizes: Record<string, string> = {
    '1-10': '1-10 employees',
    '11-50': '11-50 employees',
    '51-200': '51-200 employees',
    '201-500': '201-500 employees',
    '500+': '500+ employees'
  }
  return sizes[size] || size
}

// ========== URL FORMATTERS ==========

/**
 * Format URL for display (remove protocol)
 * @param url - URL string
 * @returns Formatted URL
 */
export const formatUrl = (url: string): string => {
  if (!url) return ''
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/**
 * Check if URL is valid
 * @param url - URL string
 * @returns Boolean
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ========== EXPORT ALL ==========
export default {
  // Date
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTimeAgo,
  formatMonthYear,
  formatYear,
  
  // Currency
  formatSalary,
  formatSalaryRange,
  formatCurrency,
  
  // Number
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  formatFileSize,
  
  // Text
  truncateText,
  capitalizeWords,
  capitalizeFirst,
  slugify,
  getInitials,
  formatPhone,
  maskEmail,
  
  // HTML
  stripHtml,
  nl2br,
  
  // Job
  formatJobLocation,
  formatEmploymentType,
  formatExperienceLevel,
  
  // Application
  formatApplicationStatus,
  getStatusColor,
  
  // Company
  formatCompanySize,
  
  // URL
  formatUrl,
  isValidUrl
}