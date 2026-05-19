/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError } from 'axios'
import { toast } from '@/hooks/use-toast'

// ========== TYPES ==========
export interface AppError {
  message: string
  status: number
  code?: string
  details?: Record<string, string[]>
  originalError?: Error | AxiosError
}

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

// ========== ERROR CODES ==========
export const ERROR_CODES = {
  // Auth Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource Errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // File Upload Errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// ========== ERROR MESSAGES ==========
const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.UNAUTHORIZED]: 'Please login to continue',
  [ERROR_CODES.FORBIDDEN]: 'You don\'t have permission to perform this action',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please login again',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.ACCOUNT_SUSPENDED]: 'Your account has been suspended. Please contact support',
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: 'Please verify your email address to continue',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'This record already exists',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'There was a conflict with the current state',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds the maximum limit',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'File type is not supported',
  [ERROR_CODES.UPLOAD_FAILED]: 'Failed to upload file. Please try again',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred'
}

// ========== ERROR SEVERITY ==========
const ERROR_SEVERITY: Record<ErrorCode, ErrorSeverity> = {
  [ERROR_CODES.UNAUTHORIZED]: 'warning',
  [ERROR_CODES.FORBIDDEN]: 'warning',
  [ERROR_CODES.TOKEN_EXPIRED]: 'warning',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'error',
  [ERROR_CODES.ACCOUNT_SUSPENDED]: 'critical',
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: 'warning',
  [ERROR_CODES.VALIDATION_ERROR]: 'info',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'warning',
  [ERROR_CODES.INVALID_INPUT]: 'info',
  [ERROR_CODES.NOT_FOUND]: 'warning',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'warning',
  [ERROR_CODES.FILE_TOO_LARGE]: 'error',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'error',
  [ERROR_CODES.UPLOAD_FAILED]: 'error',
  [ERROR_CODES.NETWORK_ERROR]: 'critical',
  [ERROR_CODES.TIMEOUT_ERROR]: 'warning',
  [ERROR_CODES.SERVER_ERROR]: 'critical',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'warning',
  [ERROR_CODES.UNKNOWN_ERROR]: 'error'
}

// ========== HELPER FUNCTIONS ==========
export const getErrorMessage = (error: any, defaultMessage?: string): string => {
  if (typeof error === 'string') return error
  
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  
  if (error?.message) {
    return error.message
  }
  
  return defaultMessage || DEFAULT_ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
}

export const getErrorCode = (error: any): ErrorCode => {
  if (error?.response?.data?.code) {
    const code = error.response.data.code
    if (Object.values(ERROR_CODES).includes(code)) {
      return code as ErrorCode
    }
  }
  
  if (error?.response?.status) {
    const status = error.response.status
    switch (status) {
      case 401: return ERROR_CODES.UNAUTHORIZED
      case 403: return ERROR_CODES.FORBIDDEN
      case 404: return ERROR_CODES.NOT_FOUND
      case 409: return ERROR_CODES.RESOURCE_CONFLICT
      case 422: return ERROR_CODES.VALIDATION_ERROR
      case 429: return ERROR_CODES.RATE_LIMIT_EXCEEDED
      case 500: return ERROR_CODES.SERVER_ERROR
      default: return ERROR_CODES.UNKNOWN_ERROR
    }
  }
  
  if (error?.code === 'ECONNABORTED') return ERROR_CODES.TIMEOUT_ERROR
  if (error?.message === 'Network Error') return ERROR_CODES.NETWORK_ERROR
  
  return ERROR_CODES.UNKNOWN_ERROR
}

export const getErrorSeverity = (error: any): ErrorSeverity => {
  const code = getErrorCode(error)
  return ERROR_SEVERITY[code] || 'error'
}

export const getValidationErrors = (error: any): Record<string, string[]> => {
  if (error?.response?.data?.errors) {
    return error.response.data.errors
  }
  return {}
}

export const hasValidationErrors = (error: any): boolean => {
  return getErrorCode(error) === ERROR_CODES.VALIDATION_ERROR
}

// ========== TOAST NOTIFICATION ==========
export const showErrorToast = (error: any, customMessage?: string): void => {
  const message = customMessage || getErrorMessage(error)
  const severity = getErrorSeverity(error)
  
  toast({
    variant: severity === 'critical' ? 'destructive' : 'default',
    title: 'Error',
    description: message,
  })
}

export const showSuccessToast = (message: string): void => {
  toast({
    variant: 'success',
    title: 'Success',
    description: message,
  })
}

export const showWarningToast = (message: string): void => {
  toast({
    variant: 'warning',
    title: 'Warning',
    description: message,
  })
}

export const showInfoToast = (message: string): void => {
  toast({
    variant: 'info',
    title: 'Info',
    description: message,
  })
}

// ========== ERROR LOGGING ==========
export const logError = (error: any, context?: string): void => {
  const errorCode = getErrorCode(error)
  const errorMessage = getErrorMessage(error)
  const severity = getErrorSeverity(error)
  
  console.error(`[${severity.toUpperCase()}] ${context ? `${context} - ` : ''}${errorCode}: ${errorMessage}`, error)
  
  // Send to logging service in production
  if (import.meta.env.PROD) {
    // sendToLoggingService({
    //   code: errorCode,
    //   message: errorMessage,
    //   context,
    //   stack: error?.stack,
    //   severity
    // })
  }
}

// ========== ERROR HANDLER CLASS ==========
export class ErrorHandler {
  private error: any
  private code: ErrorCode
  private message: string
  private severity: ErrorSeverity
  private details: Record<string, string[]>

  constructor(error: any) {
    this.error = error
    this.code = getErrorCode(error)
    this.message = getErrorMessage(error)
    this.severity = getErrorSeverity(error)
    this.details = getValidationErrors(error)
  }

  getCode(): ErrorCode {
    return this.code
  }

  getMessage(): string {
    return this.message
  }

  getSeverity(): ErrorSeverity {
    return this.severity
  }

  getDetails(): Record<string, string[]> {
    return this.details
  }

  isValidationError(): boolean {
    return this.code === ERROR_CODES.VALIDATION_ERROR
  }

  isUnauthorized(): boolean {
    return this.code === ERROR_CODES.UNAUTHORIZED
  }

  isForbidden(): boolean {
    return this.code === ERROR_CODES.FORBIDDEN
  }

  isNotFound(): boolean {
    return this.code === ERROR_CODES.NOT_FOUND
  }

  isNetworkError(): boolean {
    return this.code === ERROR_CODES.NETWORK_ERROR
  }

  isServerError(): boolean {
    return this.code === ERROR_CODES.SERVER_ERROR
  }

  showToast(): void {
    showErrorToast(this.error)
  }

  log(context?: string): void {
    logError(this.error, context)
  }
}

// ========== ASYNC ERROR WRAPPER ==========
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await promise
  } catch (error) {
    const handler = new ErrorHandler(error)
    handler.log(context)
    handler.showToast()
    return null
  }
}

export const withErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): ((...args: Parameters<T>) => Promise<ReturnType<T> | null>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      const handler = new ErrorHandler(error)
      handler.log(context)
      handler.showToast()
      return null
    }
  }
}

// ========== FORM ERROR HANDLER ==========
export const getFieldError = (error: any, fieldName: string): string | undefined => {
  const details = getValidationErrors(error)
  const fieldErrors = details[fieldName]
  return fieldErrors?.[0]
}

export const getFormErrors = (error: any): Record<string, string> => {
  const details = getValidationErrors(error)
  const errors: Record<string, string> = {}
  
  Object.entries(details).forEach(([field, messages]) => {
    if (messages.length > 0) {
      errors[field] = messages[0]
    }
  })
  
  return errors
}

// ========== API ERROR HANDLER ==========
export const handleApiError = (error: any): AppError => {
  const handler = new ErrorHandler(error)
  
  return {
    message: handler.getMessage(),
    status: error?.response?.status || 500,
    code: handler.getCode(),
    details: handler.getDetails(),
    originalError: error
  }
}

// ========== EXPORT DEFAULT ==========
export default {
  ERROR_CODES,
  getErrorMessage,
  getErrorCode,
  getErrorSeverity,
  getValidationErrors,
  hasValidationErrors,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  logError,
  ErrorHandler,
  handleAsyncError,
  withErrorHandler,
  getFieldError,
  getFormErrors,
  handleApiError
}