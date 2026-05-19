import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { AuthRequest } from '../types'

// ========== ERROR CLASSES ==========
export class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean
  code?: string

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    this.code = code

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT')
  }
}

// ========== DATABASE ERROR HANDLER ==========
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      const fields = (error.meta?.target as string[]) || []
      return new AppError(
        `Duplicate field value: ${fields.join(', ')}. Please use another value.`,
        409,
        'DUPLICATE_FIELD'
      )
    
    case 'P2014':
      return new AppError('Invalid ID: This record references another record that does not exist.', 400, 'INVALID_ID')
    
    case 'P2003':
      return new AppError('Foreign key constraint failed. The referenced record does not exist.', 400, 'FOREIGN_KEY_FAILED')
    
    case 'P2000':
      return new AppError('Input value is too long for the field.', 400, 'INPUT_TOO_LONG')
    
    case 'P2001':
      return new AppError('Record does not exist.', 404, 'RECORD_NOT_FOUND')
    
    case 'P2025':
      return new AppError('Record not found.', 404, 'RECORD_NOT_FOUND')
    
    case 'P2016':
      return new AppError('Query error. Invalid data provided.', 400, 'QUERY_ERROR')
    
    case 'P2017':
      return new AppError('Relation record not found.', 404, 'RELATION_NOT_FOUND')
    
    default:
      return new AppError(`Database error: ${error.message}`, 500, 'DATABASE_ERROR')
  }
}

// ========== JWT ERROR HANDLER ==========
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token. Please log in again.')
  }
  if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired. Please log in again.')
  }
  return new UnauthorizedError('Authentication error. Please log in again.')
}

// ========== VALIDATION ERROR HANDLER ==========
const handleValidationError = (error: any): AppError => {
  const messages = Object.values(error.errors).map((err: any) => err.message).join(', ')
  return new AppError(`Validation error: ${messages}`, 400, 'VALIDATION_ERROR')
}

// ========== MAIN ERROR HANDLER ==========
export const errorHandler = (
  err: Error | AppError | any,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let error = err

  // Set default values
  let statusCode = 500
  let status = 'error'
  let message = 'Something went wrong!'
  let code = 'INTERNAL_SERVER_ERROR'

  // Log error for debugging (but not in production for operational errors)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    })
  } else {
    // In production, only log unexpected errors
    if (!(err instanceof AppError) || !err.isOperational) {
      console.error('Unexpected error:', err)
    }
  }

  // Handle specific error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    status = error.status
    message = error.message
    code = error.code || status === 'fail' ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR'
  }

  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const handledError = handlePrismaError(error)
    statusCode = handledError.statusCode
    status = handledError.status
    message = handledError.message
    code = handledError.code || 'DATABASE_ERROR'
  }

  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    status = 'fail'
    message = 'Invalid data provided. Please check your input.'
    code = 'VALIDATION_ERROR'
  }

  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const handledError = handleJWTError(error)
    statusCode = handledError.statusCode
    status = handledError.status
    message = handledError.message
    code = handledError.code || 'AUTH_ERROR'
  }

  // Handle multer errors (file upload)
  else if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 400
      status = 'fail'
      message = 'File too large. Maximum size is 5MB.'
      code = 'FILE_TOO_LARGE'
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      statusCode = 400
      status = 'fail'
      message = 'Too many files uploaded.'
      code = 'TOO_MANY_FILES'
    } else {
      statusCode = 400
      status = 'fail'
      message = error.message
      code = 'UPLOAD_ERROR'
    }
  }

  // Handle express-validator errors
  else if (error.array && typeof error.array === 'function') {
    const errors = error.array()
    statusCode = 400
    status = 'fail'
    message = errors.map((e: any) => e.msg).join(', ')
    code = 'VALIDATION_ERROR'
  }

  // Handle duplicate key errors (MongoDB style, but for completeness)
  else if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0]
    statusCode = 409
    status = 'fail'
    message = `${field} already exists. Please use another value.`
    code = 'DUPLICATE_FIELD'
  }

  // Handle cast errors (invalid ObjectId)
  else if (error.name === 'CastError') {
    statusCode = 400
    status = 'fail'
    message = `Invalid ${error.path}: ${error.value}`
    code = 'INVALID_ID'
  }

  // Send response
  const response: any = {
    success: false,
    status,
    message,
    code
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack
    response.details = error.details || undefined
  }

  // Add validation details if available
  if (error.details || error.errors) {
    response.errors = error.details || error.errors
  }

  res.status(statusCode).json(response)
}

// ========== 404 NOT FOUND HANDLER ==========
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404, 'ROUTE_NOT_FOUND')
  next(error)
}

// ========== ASYNC WRAPPER ==========
// Wraps async route handlers to avoid try-catch blocks
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// ========== UNHANDLED REJECTION HANDLER ==========
export const handleUnhandledRejection = (error: Error) => {
  console.error('UNHANDLED REJECTION:', error)
  
  // Graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    console.log('💥 Shutting down due to unhandled rejection...')
    process.exit(1)
  }
}

// ========== UNCAUGHT EXCEPTION HANDLER ==========
export const handleUncaughtException = (error: Error) => {
  console.error('UNCAUGHT EXCEPTION:', error)
  
  // Graceful shutdown
  console.log('💥 Shutting down due to uncaught exception...')
  process.exit(1)
}

// ========== RATE LIMIT ERROR HANDLER ==========
export const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    status: 'fail',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60 // seconds
  })
}

// ========== DATABASE CONNECTION ERROR ==========
export const handleDatabaseError = (error: Error): void => {
  console.error('Database connection error:', error)
  
  if (process.env.NODE_ENV === 'production') {
    console.log('💥 Shutting down due to database connection error...')
    process.exit(1)
  }
}

// ========== LOGGING MIDDLEWARE ==========
export const logErrors = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
  
  next(err)
}

// ========== SENSITIVE DATA FILTER ==========
export const filterSensitiveData = (err: any): any => {
  if (err && err.response) {
    delete err.response.config?.headers?.Authorization
    delete err.response.config?.headers?.Cookie
  }
  return err
}

// ========== EXPORT ALL ==========
export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFound,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
  rateLimitHandler,
  handleDatabaseError,
  logErrors,
  filterSensitiveData
}