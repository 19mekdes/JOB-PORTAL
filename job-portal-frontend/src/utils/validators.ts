/* eslint-disable @typescript-eslint/no-explicit-any */
// ========== EMAIL VALIDATION ==========

/**
 * Validate email address
 * @param email - Email to validate
 * @returns True if valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate email with detailed check
 * @param email - Email to validate
 * @returns Validation result with message
 */
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email) {
    return { isValid: false, message: 'Email is required' }
  }
  if (!isValidEmail(email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }
  return { isValid: true }
}

// ========== PASSWORD VALIDATION ==========

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns True if strong enough
 */
export const isStrongPassword = (password: string): boolean => {
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
}

/**
 * Validate password with detailed checks
 * @param password - Password to validate
 * @returns Validation result with message
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string; strength?: number } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' }
  }
  
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length
  const strength = (passedChecks / 5) * 100
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters', strength }
  }
  if (!checks.hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter', strength }
  }
  if (!checks.hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter', strength }
  }
  if (!checks.hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number', strength }
  }
  if (!checks.hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character', strength }
  }
  
  return { isValid: true, strength }
}

/**
 * Check if passwords match
 * @param password - Password
 * @param confirmPassword - Confirm password
 * @returns True if match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword
}

/**
 * Validate password confirmation
 * @param password - Password
 * @param confirmPassword - Confirm password
 * @returns Validation result
 */
export const validatePasswordConfirmation = (password: string, confirmPassword: string): { isValid: boolean; message?: string } => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' }
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' }
  }
  return { isValid: true }
}

// ========== NAME VALIDATION ==========

/**
 * Validate full name
 * @param name - Name to validate
 * @returns Validation result
 */
export const validateFullName = (name: string): { isValid: boolean; message?: string } => {
  if (!name) {
    return { isValid: false, message: 'Full name is required' }
  }
  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' }
  }
  if (name.length > 100) {
    return { isValid: false, message: 'Name cannot exceed 100 characters' }
  }
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  }
  return { isValid: true }
}

/**
 * Validate company name
 * @param name - Company name to validate
 * @returns Validation result
 */
export const validateCompanyName = (name: string): { isValid: boolean; message?: string } => {
  if (!name) {
    return { isValid: false, message: 'Company name is required' }
  }
  if (name.length < 2) {
    return { isValid: false, message: 'Company name must be at least 2 characters' }
  }
  if (name.length > 100) {
    return { isValid: false, message: 'Company name cannot exceed 100 characters' }
  }
  return { isValid: true }
}

// ========== PHONE VALIDATION ==========

/**
 * Validate phone number
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone) {
    return { isValid: true } // Phone is optional
  }
  const phoneRegex = /^[0-9+\-\s()]{10,15}$/
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: 'Please enter a valid phone number' }
  }
  return { isValid: true }
}

// ========== LOCATION VALIDATION ==========

/**
 * Validate location
 * @param location - Location to validate
 * @returns Validation result
 */
export const validateLocation = (location: string): { isValid: boolean; message?: string } => {
  if (!location) {
    return { isValid: false, message: 'Location is required' }
  }
  if (location.length > 100) {
    return { isValid: false, message: 'Location cannot exceed 100 characters' }
  }
  return { isValid: true }
}

// ========== URL VALIDATION ==========

/**
 * Validate URL
 * @param url - URL to validate
 * @returns True if valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate website URL
 * @param url - URL to validate
 * @returns Validation result
 */
export const validateWebsite = (url: string): { isValid: boolean; message?: string } => {
  if (!url) {
    return { isValid: true } // Website is optional
  }
  if (!isValidUrl(url)) {
    return { isValid: false, message: 'Please enter a valid URL (e.g., https://example.com)' }
  }
  return { isValid: true }
}

/**
 * Validate social media URL
 * @param url - URL to validate
 * @param platform - Platform name
 * @returns Validation result
 */
export const validateSocialUrl = (url: string, platform: string): { isValid: boolean; message?: string } => {
  if (!url) {
    return { isValid: true } // Optional
  }
  if (!isValidUrl(url)) {
    return { isValid: false, message: `Please enter a valid ${platform} URL` }
  }
  return { isValid: true }
}

// ========== JOB VALIDATION ==========

/**
 * Validate job title
 * @param title - Job title to validate
 * @returns Validation result
 */
export const validateJobTitle = (title: string): { isValid: boolean; message?: string } => {
  if (!title) {
    return { isValid: false, message: 'Job title is required' }
  }
  if (title.length < 5) {
    return { isValid: false, message: 'Job title must be at least 5 characters' }
  }
  if (title.length > 100) {
    return { isValid: false, message: 'Job title cannot exceed 100 characters' }
  }
  return { isValid: true }
}

/**
 * Validate job description
 * @param description - Job description to validate
 * @returns Validation result
 */
export const validateJobDescription = (description: string): { isValid: boolean; message?: string } => {
  if (!description) {
    return { isValid: false, message: 'Job description is required' }
  }
  if (description.length < 50) {
    return { isValid: false, message: 'Job description must be at least 50 characters' }
  }
  if (description.length > 10000) {
    return { isValid: false, message: 'Job description cannot exceed 10,000 characters' }
  }
  return { isValid: true }
}

/**
 * Validate salary
 * @param min - Minimum salary
 * @param max - Maximum salary
 * @returns Validation result
 */
export const validateSalary = (min: number | null, max: number | null): { isValid: boolean; message?: string } => {
  if (min && max && min > max) {
    return { isValid: false, message: 'Minimum salary cannot be greater than maximum salary' }
  }
  if (min && min < 0) {
    return { isValid: false, message: 'Minimum salary cannot be negative' }
  }
  if (max && max < 0) {
    return { isValid: false, message: 'Maximum salary cannot be negative' }
  }
  return { isValid: true }
}

// ========== COVER LETTER VALIDATION ==========

/**
 * Validate cover letter
 * @param letter - Cover letter to validate
 * @returns Validation result
 */
export const validateCoverLetter = (letter: string): { isValid: boolean; message?: string } => {
  if (!letter) {
    return { isValid: false, message: 'Cover letter is required' }
  }
  if (letter.length < 50) {
    return { isValid: false, message: 'Cover letter must be at least 50 characters' }
  }
  if (letter.length > 5000) {
    return { isValid: false, message: 'Cover letter cannot exceed 5,000 characters' }
  }
  return { isValid: true }
}

// ========== FILE VALIDATION ==========

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns Validation result
 */
export const validateFileSize = (file: File, maxSizeMB: number = 5): { isValid: boolean; message?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { isValid: false, message: `File size must be less than ${maxSizeMB}MB` }
  }
  return { isValid: true }
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export const validateFileType = (file: File, allowedTypes: string[]): { isValid: boolean; message?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: `File type must be one of: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}` }
  }
  return { isValid: true }
}

/**
 * Validate image dimensions
 * @param file - Image file to validate
 * @param minWidth - Minimum width
 * @param maxWidth - Maximum width
 * @param minHeight - Minimum height
 * @param maxHeight - Maximum height
 * @returns Promise with validation result
 */
export const validateImageDimensions = async (
  file: File,
  minWidth?: number,
  maxWidth?: number,
  minHeight?: number,
  maxHeight?: number
): Promise<{ isValid: boolean; message?: string }> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      if (minWidth && img.width < minWidth) {
        resolve({ isValid: false, message: `Image width must be at least ${minWidth}px` })
        return
      }
      if (maxWidth && img.width > maxWidth) {
        resolve({ isValid: false, message: `Image width must be less than ${maxWidth}px` })
        return
      }
      if (minHeight && img.height < minHeight) {
        resolve({ isValid: false, message: `Image height must be at least ${minHeight}px` })
        return
      }
      if (maxHeight && img.height > maxHeight) {
        resolve({ isValid: false, message: `Image height must be less than ${maxHeight}px` })
        return
      }
      
      resolve({ isValid: true })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ isValid: false, message: 'Unable to validate image dimensions' })
    }
    
    img.src = url
  })
}

// ========== NUMBER VALIDATION ==========

/**
 * Validate number range
 * @param value - Number to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Validation result
 */
export const validateNumberRange = (value: number, min?: number, max?: number): { isValid: boolean; message?: string } => {
  if (min !== undefined && value < min) {
    return { isValid: false, message: `Value must be at least ${min}` }
  }
  if (max !== undefined && value > max) {
    return { isValid: false, message: `Value must be at most ${max}` }
  }
  return { isValid: true }
}

/**
 * Validate positive number
 * @param value - Number to validate
 * @returns Validation result
 */
export const validatePositiveNumber = (value: number): { isValid: boolean; message?: string } => {
  if (value < 0) {
    return { isValid: false, message: 'Value must be positive' }
  }
  return { isValid: true }
}

// ========== FORM VALIDATION ==========

/**
 * Create a validation object for form fields
 * @param validations - Object of validation functions
 * @returns Validation result object
 */
export const createValidator = <T extends Record<string, any>>(
  validations: Partial<Record<keyof T, (value: any) => { isValid: boolean; message?: string }>>
) => {
  return (data: T): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {}
    
    Object.entries(validations).forEach(([field, validator]) => {
      if (validator) {
        const result = validator(data[field as keyof T])
        if (!result.isValid && result.message) {
          errors[field as keyof T] = result.message
        }
      }
    })
    
    return errors
  }
}

/**
 * Check if form is valid (no errors)
 * @param errors - Errors object
 * @returns True if valid
 */
export const isFormValid = (errors: Record<string, string | undefined>): boolean => {
  return Object.values(errors).every(error => !error)
}

// ========== EXPORT ALL ==========
export default {
  // Email
  isValidEmail,
  validateEmail,
  
  // Password
  isStrongPassword,
  validatePassword,
  doPasswordsMatch,
  validatePasswordConfirmation,
  
  // Name
  validateFullName,
  validateCompanyName,
  
  // Contact
  validatePhone,
  validateLocation,
  
  // URL
  isValidUrl,
  validateWebsite,
  validateSocialUrl,
  
  // Job
  validateJobTitle,
  validateJobDescription,
  validateSalary,
  
  // Application
  validateCoverLetter,
  
  // File
  validateFileSize,
  validateFileType,
  validateImageDimensions,
  
  // Number
  validateNumberRange,
  validatePositiveNumber,
  
  // Form
  createValidator,
  isFormValid
}