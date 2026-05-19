import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'

// ========== USER TYPE CONSTANTS ==========
export const UserRoles = {
  JOB_SEEKER: 'Job Seeker',
  EMPLOYER: 'Employer',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin'
} as const

export type UserRole = typeof UserRoles[keyof typeof UserRoles]

// ========== ROLE HIERARCHY ==========
const roleHierarchy: Record<UserRole, number> = {
  [UserRoles.JOB_SEEKER]: 1,
  [UserRoles.EMPLOYER]: 2,
  [UserRoles.ADMIN]: 3,
  [UserRoles.SUPER_ADMIN]: 4
}

// ========== PERMISSIONS MATRIX ==========
interface Permission {
  resource: string
  actions: string[]
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRoles.JOB_SEEKER]: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'jobs', actions: ['read', 'search', 'apply'] },
    { resource: 'applications', actions: ['create', 'read', 'withdraw'] },
    { resource: 'bookmarks', actions: ['create', 'read', 'delete'] },
    { resource: 'notifications', actions: ['read', 'update'] }
  ],
  [UserRoles.EMPLOYER]: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'jobs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'applications', actions: ['read', 'update', 'create_note'] },
    { resource: 'notifications', actions: ['read', 'update'] }
  ],
  [UserRoles.ADMIN]: [
    { resource: 'users', actions: ['read', 'update', 'suspend', 'activate'] },
    { resource: 'jobs', actions: ['read', 'moderate', 'delete'] },
    { resource: 'applications', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'industries', actions: ['read', 'create', 'update'] }
  ],
  [UserRoles.SUPER_ADMIN]: [
    { resource: '*', actions: ['*'] } // Full access
  ]
}

// ========== CHECK IF USER HAS PERMISSION ==========
const hasPermission = (userRole: UserRole, resource: string, action: string): boolean => {
  if (userRole === UserRoles.SUPER_ADMIN) return true
  
  const permissions = rolePermissions[userRole]
  if (!permissions) return false
  
  return permissions.some(permission => 
    (permission.resource === resource || permission.resource === '*') &&
    (permission.actions.includes(action) || permission.actions.includes('*'))
  )
}

// ========== BASIC ROLE AUTHORIZATION ==========
// Authorize specific roles
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
      return
    }

    const userRole = req.user.user_type.type_name as UserRole
    
    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}`,
        required_roles: roles,
        your_role: userRole
      })
      return
    }

    next()
  }
}

// ========== PERMISSION-BASED AUTHORIZATION ==========
// Check specific permission
export const checkPermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
      return
    }

    const userRole = req.user.user_type.type_name as UserRole
    
    if (!hasPermission(userRole, resource, action)) {
      res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to ${action} ${resource}`,
        required: { resource, action },
        your_role: userRole
      })
      return
    }

    next()
  }
}

// ========== ROLE HIERARCHY CHECK ==========
// Check if user role is at least minimum role
export const requireRoleLevel = (minimumRole: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
      return
    }

    const userRole = req.user.user_type.type_name as UserRole
    const userLevel = roleHierarchy[userRole]
    const requiredLevel = roleHierarchy[minimumRole]

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        message: `Access denied. This resource requires ${minimumRole} or higher role`,
        required_role: minimumRole,
        your_role: userRole
      })
      return
    }

    next()
  }
}

// ========== SPECIFIC ROLE MIDDLEWARES ==========
// Check if user is Job Seeker
export const isJobSeeker = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    })
    return
  }

  if (req.user.user_type.type_name !== UserRoles.JOB_SEEKER) {
    res.status(403).json({
      success: false,
      message: 'This resource is only available for job seekers',
      required_role: UserRoles.JOB_SEEKER,
      your_role: req.user.user_type.type_name
    })
    return
  }

  next()
}

// Check if user is Employer
export const isEmployer = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    })
    return
  }

  if (req.user.user_type.type_name !== UserRoles.EMPLOYER) {
    res.status(403).json({
      success: false,
      message: 'This resource is only available for employers',
      required_role: UserRoles.EMPLOYER,
      your_role: req.user.user_type.type_name
    })
    return
  }

  next()
}

// Check if user is Admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    })
    return
  }

  const userRole = req.user.user_type.type_name
  if (userRole !== UserRoles.ADMIN && userRole !== UserRoles.SUPER_ADMIN) {
    res.status(403).json({
      success: false,
      message: 'This resource is only available for administrators',
      required_role: 'Admin or Super Admin',
      your_role: userRole
    })
    return
  }

  next()
}

// Check if user is Super Admin
export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    })
    return
  }

  if (req.user.user_type.type_name !== UserRoles.SUPER_ADMIN) {
    res.status(403).json({
      success: false,
      message: 'This resource is only available for super administrators',
      required_role: UserRoles.SUPER_ADMIN,
      your_role: req.user.user_type.type_name
    })
    return
  }

  next()
}

// ========== RESOURCE OWNERSHIP CHECK ==========
// Check if user owns the resource (for job seekers)
export const isOwnSeekerProfile = (getSeekerIdFromRequest: (req: AuthRequest) => Promise<string | null>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        })
        return
      }

      // Super Admin bypass
      if (req.user.user_type.type_name === UserRoles.SUPER_ADMIN) {
        next()
        return
      }

      const targetSeekerId = await getSeekerIdFromRequest(req)
      const userSeekerId = req.user.seeker_profile?.id

      if (!targetSeekerId || targetSeekerId !== userSeekerId) {
        res.status(403).json({
          success: false,
          message: 'You can only access your own profile'
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
}

// Check if user owns the resource (for employers)
export const isOwnEmployerProfile = (getEmployerIdFromRequest: (req: AuthRequest) => Promise<string | null>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        })
        return
      }

      // Super Admin bypass
      if (req.user.user_type.type_name === UserRoles.SUPER_ADMIN) {
        next()
        return
      }

      const targetEmployerId = await getEmployerIdFromRequest(req)
      const userEmployerId = req.user.employer_profile?.id

      if (!targetEmployerId || targetEmployerId !== userEmployerId) {
        res.status(403).json({
          success: false,
          message: 'You can only access your own company profile'
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
}

// Check if user owns a specific job
export const isOwnJob = (getJobIdFromRequest: (req: AuthRequest) => Promise<string | null>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        })
        return
      }

      // Super Admin bypass
      if (req.user.user_type.type_name === UserRoles.SUPER_ADMIN) {
        next()
        return
      }

      const jobId = await getJobIdFromRequest(req)
      const userEmployerId = req.user.employer_profile?.id

      if (!jobId || !userEmployerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        })
        return
      }

      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      const job = await prisma.jobPost.findFirst({
        where: {
          id: jobId,
          employer_id: userEmployerId
        }
      })

      if (!job) {
        res.status(403).json({
          success: false,
          message: 'You can only access your own jobs'
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
}

// ========== COMBINED AUTHORIZATION ==========
// Authorize multiple conditions
export const authorizeAny = (...middlewares: Array<(req: AuthRequest, res: Response, next: NextFunction) => void>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let passed = false
    let lastError: any = null

    for (const middleware of middlewares) {
      try {
        await new Promise((resolve, reject) => {
          middleware(req, res, (err?: any) => {
            if (err) reject(err)
            else resolve(true)
          })
        })
        passed = true
        break
      } catch (error) {
        lastError = error
      }
    }

    if (passed) {
      next()
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. None of the required conditions were met.',
        error: lastError?.message || 'Authorization failed'
      })
    }
  }
}

// ========== GET USER ROLE ==========
export const getUserRole = (req: AuthRequest): UserRole | null => {
  if (!req.user) return null
  return req.user.user_type.type_name as UserRole
}

// ========== CHECK IF USER IS ADMIN ==========
export const isUserAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false
  const role = req.user.user_type.type_name
  return role === UserRoles.ADMIN || role === UserRoles.SUPER_ADMIN
}

// ========== CHECK IF USER IS SUPER ADMIN ==========
export const isUserSuperAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false
  return req.user.user_type.type_name === UserRoles.SUPER_ADMIN
}

// ========== GET USER PERMISSIONS ==========
export const getUserPermissions = (req: AuthRequest): Permission[] => {
  if (!req.user) return []
  const userRole = req.user.user_type.type_name as UserRole
  return rolePermissions[userRole] || []
}

// ========== EXPORT ALL ==========
export default {
  UserRoles,
  authorize,
  checkPermission,
  requireRoleLevel,
  isJobSeeker,
  isEmployer,
  isAdmin,
  isSuperAdmin,
  isOwnSeekerProfile,
  isOwnEmployerProfile,
  isOwnJob,
  authorizeAny,
  getUserRole,
  isUserAdmin,
  isUserSuperAdmin,
  getUserPermissions
}