import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'

// ========== SUPER ADMIN AUTHENTICATION ==========

// Check if user is Super Admin
export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    })
    return
  }

  if (req.user.user_type.type_name !== 'Super Admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.',
      required_role: 'Super Admin',
      your_role: req.user.user_type.type_name
    })
    return
  }

  next()
}

// Check if user is Super Admin or Admin (with restrictions)
export const isSuperAdminOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    })
    return
  }

  const role = req.user.user_type.type_name
  if (role !== 'Super Admin' && role !== 'Admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Super Admin privileges required.',
      required_role: 'Admin or Super Admin',
      your_role: role
    })
    return
  }

  next()
}

// Check if Super Admin is trying to modify their own account
export const preventSelfModification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const targetId = req.params.id
  const currentUserId = req.user?.id

  if (targetId === currentUserId) {
    res.status(400).json({
      success: false,
      message: 'You cannot modify your own Super Admin account through this operation'
    })
    return
  }

  next()
}

// Check if there's at least one Super Admin remaining
export const ensureLastSuperAdmin = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const targetId = req.params.id
    
    // Get target user's role
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      include: { user_type: true }
    })
    
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }
    
    // If not deleting a Super Admin, allow
    if (targetUser.user_type.type_name !== 'Super Admin') {
      next()
      return
    }
    
    // Count remaining Super Admins
    const superAdminCount = await prisma.user.count({
      where: {
        user_type: { type_name: 'Super Admin' },
        is_active: true
      }
    })
    
    if (superAdminCount <= 1) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete the last Super Admin account. Please create another Super Admin first.'
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

// Rate limiting for sensitive operations
const operationCounts = new Map<string, { count: number; resetTime: number }>()

export const sensitiveOperationRateLimit = (maxRequests: number = 5, windowMs: number = 60 * 1000) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id || req.ip || 'unknown'
    const now = Date.now()
    
    const record = operationCounts.get(userId)
    
    if (record) {
      if (now > record.resetTime) {
        operationCounts.set(userId, { count: 1, resetTime: now + windowMs })
        next()
      } else if (record.count < maxRequests) {
        record.count++
        operationCounts.set(userId, record)
        next()
      } else {
        res.status(429).json({
          success: false,
          message: `Too many sensitive operations. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`
        })
      }
    } else {
      operationCounts.set(userId, { count: 1, resetTime: now + windowMs })
      next()
    }
  }
}

// Log super admin actions
export const logSuperAdminAction = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now()
    
    const originalJson = res.json
    let responseBody: any = null
    
    res.json = function(body: any) {
      responseBody = body
      return originalJson.call(this, body)
    }
    
    res.on('finish', () => {
      const duration = Date.now() - startTime
      
      console.log(`[SUPER_ADMIN_ACTION]`, {
        action,
        admin_id: req.user?.id,
        admin_email: req.user?.email,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        user_agent: req.get('user-agent')
      })
    })
    
    next()
  }
}

// Validate system settings update
export const validateSystemSettings = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const settings = req.body
  
  const validSettings = [
    'site_name', 'site_description', 'contact_email', 'enable_registration',
    'require_email_verification', 'max_job_posts_per_employer', 'max_applications_per_seeker',
    'job_expiry_days', 'maintenance_mode', 'allowed_file_types', 'max_file_size_mb'
  ]
  
  const invalidKeys = Object.keys(settings).filter(key => !validSettings.includes(key))
  
  if (invalidKeys.length > 0) {
    res.status(400).json({
      success: false,
      message: `Invalid settings: ${invalidKeys.join(', ')}`,
      valid_settings: validSettings
    })
    return
  }
  
  // Validate numeric values
  if (settings.max_job_posts_per_employer && settings.max_job_posts_per_employer < 1) {
    res.status(400).json({
      success: false,
      message: 'max_job_posts_per_employer must be at least 1'
    })
    return
  }
  
  if (settings.max_applications_per_seeker && settings.max_applications_per_seeker < 1) {
    res.status(400).json({
      success: false,
      message: 'max_applications_per_seeker must be at least 1'
    })
    return
  }
  
  if (settings.job_expiry_days && settings.job_expiry_days < 1) {
    res.status(400).json({
      success: false,
      message: 'job_expiry_days must be at least 1'
    })
    return
  }
  
  if (settings.max_file_size_mb && (settings.max_file_size_mb < 1 || settings.max_file_size_mb > 100)) {
    res.status(400).json({
      success: false,
      message: 'max_file_size_mb must be between 1 and 100'
    })
    return
  }
  
  next()
}

// Check maintenance mode (for all routes)
export const checkMaintenanceMode = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Skip for Super Admin
    if (req.user?.user_type.type_name === 'Super Admin') {
      next()
      return
    }
    
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Use type assertion to bypass TypeScript check
    const prismaAny = prisma as any
    const settings = await prismaAny.systemSetting?.findFirst()
    
    if (settings?.maintenance_mode) {
      res.status(503).json({
        success: false,
        message: 'System is under maintenance. Please try again later.',
        maintenance_mode: true
      })
      return
    }
    
    next()
  } catch (error) {
    // If no settings table, continue
    next()
  }
}

// ========== EXPORT ALL ==========
export default {
  isSuperAdmin,
  isSuperAdminOrAdmin,
  preventSelfModification,
  ensureLastSuperAdmin,
  sensitiveOperationRateLimit,
  logSuperAdminAction,
  validateSystemSettings,
  checkMaintenanceMode
}