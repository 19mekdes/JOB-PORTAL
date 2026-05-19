import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

interface JwtPayload {
  id: string
  email: string
  iat?: number
  exp?: number
}

// ========== PROTECT MIDDLEWARE ==========
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource. Please log in.'
      })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.'
      })
      return
    }

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      })
      return
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      })
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      })
    } else {
      res.status(401).json({
        success: false,
        message: 'Not authorized',
        error: (error as Error).message
      })
    }
  }
}

// ========== OPTIONAL AUTH MIDDLEWARE ==========
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          user_type: true,
          seeker_profile: true,
          employer_profile: true
        }
      })
      
      if (user && user.is_active) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    next()
  }
}

// ========== RESTRICT TO OWN USER OR ADMIN ==========
export const restrictToOwnUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
      return
    }

    const isAdmin = req.user.user_type.type_name === 'Admin' || 
                    req.user.user_type.type_name === 'Super Admin'
    const isOwnUser = req.user.id === userId

    if (!isOwnUser && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to access this resource'
      })
      return
    }

    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== RATE LIMITING MIDDLEWARE ==========
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const identifier = req.user?.id || req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    
    const record = requestCounts.get(identifier)
    
    if (record) {
      if (now > record.resetTime) {
        requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
        next()
      } else if (record.count < maxRequests) {
        record.count++
        requestCounts.set(identifier, record)
        next()
      } else {
        res.status(429).json({
          success: false,
          message: `Too many requests. Please try again later.`
        })
      }
    } else {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
      next()
    }
  }
}

// ========== LOG REQUEST MIDDLEWARE ==========
export const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`)
  })
  
  next()
}

// ========== REMOVED - requireEmailVerification (email_verified doesn't exist) ==========
// ========== REMOVED - validateCsrf (session doesn't exist) ==========

// ========== EXPORT ALL ==========
export default {
  protect,
  optionalAuth,
  restrictToOwnUser,
  rateLimit,
  logRequest
}