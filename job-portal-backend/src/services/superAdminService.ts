import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { AppError, NotFoundError, ValidationError } from '../middleware/errorMiddleware'

const prisma = new PrismaClient()

// ========== TYPES ==========
export interface AdminUserData {
  email: string
  password: string
  full_name: string
  role: 'Admin' | 'Super Admin'
}

export interface SystemSettings {
  site_name: string
  site_description: string
  contact_email: string
  enable_registration: boolean
  require_email_verification: boolean
  max_job_posts_per_employer: number
  max_applications_per_seeker: number
  job_expiry_days: number
  maintenance_mode: boolean
  allowed_file_types: string[]
  max_file_size_mb: number
}

export interface AuditLogEntry {
  admin_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
}

// ========== SUPER ADMIN SERVICE ==========
export class SuperAdminService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  // ========== ADMIN USER MANAGEMENT ==========
  
  async createAdmin(adminData: AdminUserData, createdBy: string) {
    const { email, password, full_name, role } = adminData

    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new ValidationError('User with this email already exists')
    }

    const userType = await this.prisma.userType.findFirst({
      where: { type_name: role }
    })

    if (!userType) {
      throw new ValidationError('Invalid admin role')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        user_type_id: userType.id,
        is_active: true
      }
    })

    await this.prisma.employerProfile.create({
      data: {
        user_id: admin.id,
        company_name: full_name,
        company_description: `${role} Account`,
        industry_id: 1
      }
    })

    await this.createAuditLog({
      admin_id: createdBy,
      action: 'CREATE_ADMIN',
      target_type: 'User',
      target_id: admin.id,
      details: { email, role },
      ip_address: 'system'
    })

    return {
      id: admin.id,
      email: admin.email,
      role,
      created_at: admin.created_at
    }
  }

  async getAllAdmins() {
    const admins = await this.prisma.user.findMany({
      where: {
        user_type: {
          type_name: { in: ['Admin', 'Super Admin'] }
        }
      },
      include: {
        user_type: true,
        employer_profile: true,
        _count: {
          select: {
            notifications: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return admins
  }

  async getAdminById(adminId: string) {
    const admin = await this.prisma.user.findFirst({
      where: {
        id: adminId,
        user_type: {
          type_name: { in: ['Admin', 'Super Admin'] }
        }
      },
      include: {
        user_type: true,
        employer_profile: true,
        notifications: {
          orderBy: { created_at: 'desc' },
          take: 50
        }
      }
    })

    if (!admin) {
      throw new NotFoundError('Admin user')
    }

    return admin
  }

  async updateAdmin(adminId: string, updateData: {
    email?: string
    is_active?: boolean
    role?: 'Admin' | 'Super Admin'
  }, updatedBy: string) {
    const admin = await this.prisma.user.findFirst({
      where: {
        id: adminId,
        user_type: {
          type_name: { in: ['Admin', 'Super Admin'] }
        }
      },
      include: { user_type: true }
    })

    if (!admin) {
      throw new NotFoundError('Admin user')
    }

    if (adminId === updatedBy && updateData.role === 'Admin') {
      throw new ValidationError('You cannot demote your own Super Admin account')
    }

    if (updateData.role && updateData.role !== admin.user_type.type_name) {
      const newUserType = await this.prisma.userType.findFirst({
        where: { type_name: updateData.role }
      })

      if (!newUserType) {
        throw new ValidationError('Invalid role')
      }

      await this.prisma.user.update({
        where: { id: adminId },
        data: { user_type_id: newUserType.id }
      })
    }

    const updatedAdmin = await this.prisma.user.update({
      where: { id: adminId },
      data: {
        email: updateData.email,
        is_active: updateData.is_active
      },
      include: { user_type: true }
    })

    await this.createAuditLog({
      admin_id: updatedBy,
      action: 'UPDATE_ADMIN',
      target_type: 'User',
      target_id: adminId,
      details: updateData,
      ip_address: 'system'
    })

    return updatedAdmin
  }

  async deleteAdmin(adminId: string, deletedBy: string) {
    if (adminId === deletedBy) {
      throw new ValidationError('You cannot delete your own account')
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        id: adminId,
        user_type: {
          type_name: { in: ['Admin', 'Super Admin'] }
        }
      },
      include: { user_type: true }
    })

    if (!admin) {
      throw new NotFoundError('Admin user')
    }

    const superAdminCount = await this.prisma.user.count({
      where: {
        user_type: { type_name: 'Super Admin' },
        is_active: true
      }
    })

    const isSuperAdmin = admin.user_type?.type_name === 'Super Admin'
    
    if (isSuperAdmin && superAdminCount <= 1) {
      throw new ValidationError('Cannot delete the last Super Admin account')
    }

    await this.prisma.user.delete({
      where: { id: adminId }
    })

    await this.createAuditLog({
      admin_id: deletedBy,
      action: 'DELETE_ADMIN',
      target_type: 'User',
      target_id: adminId,
      details: { email: admin.email },
      ip_address: 'system'
    })

    return { message: 'Admin user deleted successfully' }
  }

  // ========== SYSTEM SETTINGS ==========
  
  async getSystemSettings(): Promise<SystemSettings> {
    const prismaAny = this.prisma as any
    const settings = await prismaAny.systemSetting?.findFirst()
    
    if (!settings) {
      return {
        site_name: 'Job Portal',
        site_description: 'Connect job seekers with employers',
        contact_email: 'admin@jobportal.com',
        enable_registration: true,
        require_email_verification: true,
        max_job_posts_per_employer: 50,
        max_applications_per_seeker: 100,
        job_expiry_days: 30,
        maintenance_mode: false,
        allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
        max_file_size_mb: 5
      }
    }

    return settings as SystemSettings
  }

  async updateSystemSettings(settings: Partial<SystemSettings>, updatedBy: string) {
    const prismaAny = this.prisma as any
    const existingSettings = await prismaAny.systemSetting?.findFirst()
    
    let updatedSettings
    if (existingSettings) {
      updatedSettings = await prismaAny.systemSetting.update({
        where: { id: existingSettings.id },
        data: settings
      })
    } else {
      updatedSettings = await prismaAny.systemSetting.create({
        data: settings
      })
    }

    await this.createAuditLog({
      admin_id: updatedBy,
      action: 'UPDATE_SYSTEM_SETTINGS',
      target_type: 'System',
      target_id: 'settings',
      details: settings,
      ip_address: 'system'
    })

    return updatedSettings
  }

  async toggleMaintenanceMode(enabled: boolean, updatedBy: string) {
    const settings = await this.getSystemSettings()
    const updated = await this.updateSystemSettings(
      { maintenance_mode: enabled },
      updatedBy
    )

    return {
      maintenance_mode: enabled,
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
    }
  }

  // ========== AUDIT LOGS ==========
  
  async createAuditLog(log: AuditLogEntry) {
    // Use auditLog (camelCase) - Prisma converts AuditLog to auditLog
    const prismaAny = this.prisma as any
    const auditLog = await prismaAny.auditLog.create({
      data: {
        admin_id: log.admin_id,
        action: log.action,
        target_type: log.target_type,
        target_id: log.target_id,
        details: log.details,
        ip_address: log.ip_address
      }
    })
    
    return auditLog
  }

  async getAuditLogs(filters: {
    admin_id?: string
    action?: string
    start_date?: Date
    end_date?: Date
    page?: number
    limit?: number
  }) {
    const { admin_id, action, start_date, end_date, page = 1, limit = 50 } = filters

    const where: any = {}

    if (admin_id) {
      where.admin_id = admin_id
    }

    if (action) {
      where.action = action
    }

    if (start_date || end_date) {
      where.created_at = {}
      if (start_date) where.created_at.gte = start_date
      if (end_date) where.created_at.lte = end_date
    }

    const skip = (page - 1) * limit

    const prismaAny = this.prisma as any
    const [logs, total] = await Promise.all([
      prismaAny.auditLog.findMany({
        where,
        include: {
          admin: {
            include: {
              user_type: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prismaAny.auditLog.count({ where })
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // ========== SYSTEM HEALTH CHECK ==========
  
  async getSystemHealth() {
    const checks = {
      database: await this.checkDatabaseHealth(),
      memory: await this.checkMemoryHealth(),
      uptime: process.uptime()
    }

    const isHealthy = checks.database.healthy && checks.memory.healthy

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    }
  }

  private async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { healthy: true, latency: 'normal' }
    } catch (error) {
      return { healthy: false, error: (error as Error).message }
    }
  }

  private async checkMemoryHealth() {
    const used = process.memoryUsage()
    const heapUsedMB = used.heapUsed / 1024 / 1024
    const heapTotalMB = used.heapTotal / 1024 / 1024
    
    return {
      healthy: heapUsedMB < heapTotalMB * 0.9,
      heapUsedMB: Math.round(heapUsedMB * 100) / 100,
      heapTotalMB: Math.round(heapTotalMB * 100) / 100
    }
  }

  // ========== DATA EXPORT ==========
  
  async exportAllUsers(format: 'json' | 'csv' = 'json') {
    const users = await this.prisma.user.findMany({
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true,
        _count: {
          select: {
            notifications: true,
            search_logs: true
          }
        }
      }
    })

    if (format === 'csv') {
      const csvData = this.convertToCSV(users)
      return { data: csvData, format: 'csv' }
    }

    return { data: users, format: 'json' }
  }

  async exportAllJobs(format: 'json' | 'csv' = 'json') {
    const jobs = await this.prisma.jobPost.findMany({
      include: {
        employer: true,
        industry: true,
        employment_type: true,
        status: true,
        _count: {
          select: {
            applications: true,
            bookmarks: true
          }
        }
      }
    })

    if (format === 'csv') {
      const csvData = this.convertToCSV(jobs)
      return { data: csvData, format: 'csv' }
    }

    return { data: jobs, format: 'json' }
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0])
    const rows = data.map(obj => 
      headers.map(header => JSON.stringify(obj[header] || '')).join(',')
    )
    
    return [headers.join(','), ...rows].join('\n')
  }

  // ========== DATA CLEANUP ==========
  
  async cleanupOldData(daysOld: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const results = {
      deletedNotifications: 0,
      deletedSearchLogs: 0,
      deletedExpiredJobs: 0
    }

    const deletedNotifications = await this.prisma.notification.deleteMany({
      where: {
        is_read: true,
        created_at: { lt: cutoffDate }
      }
    })
    results.deletedNotifications = deletedNotifications.count

    const deletedSearchLogs = await this.prisma.searchLog.deleteMany({
      where: {
        created_at: { lt: cutoffDate }
      }
    })
    results.deletedSearchLogs = deletedSearchLogs.count

    const closedStatus = await this.prisma.jobPostStatus.findFirst({
      where: { status_name: 'Closed' }
    })
    
    if (closedStatus) {
      const expiredJobs = await this.prisma.jobPost.updateMany({
        where: {
          status: { status_name: 'Open' },
          created_at: { lt: cutoffDate }
        },
        data: { status_id: closedStatus.id }
      })
      results.deletedExpiredJobs = expiredJobs.count
    }

    return results
  }

  // ========== SYSTEM BACKUP ==========
  
  async createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      users: await this.prisma.user.count(),
      jobs: await this.prisma.jobPost.count(),
      applications: await this.prisma.jobApplication.count(),
      notifications: await this.prisma.notification.count()
    }

    return backup
  }

  // ========== ROLE MANAGEMENT ==========
  
  async getAllUserTypes() {
    const userTypes = await this.prisma.userType.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    return userTypes
  }

  async createUserType(typeName: string, createdBy: string) {
    const existing = await this.prisma.userType.findUnique({
      where: { type_name: typeName }
    })

    if (existing) {
      throw new ValidationError('User type already exists')
    }

    const userType = await this.prisma.userType.create({
      data: { type_name: typeName }
    })

    await this.createAuditLog({
      admin_id: createdBy,
      action: 'CREATE_USER_TYPE',
      target_type: 'UserType',
      target_id: userType.id.toString(),
      details: { typeName },
      ip_address: 'system'
    })

    return userType
  }

  // ========== SYSTEM STATISTICS ==========
  
  async getSystemStats() {
    const [
      totalNotifications,
      totalBookmarks,
      totalSearchLogs,
      recentActivity
    ] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.jobBookmark.count(),
      this.prisma.searchLog.count(),
      this.prisma.searchLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { user: true }
      })
    ])

    return {
      notifications: totalNotifications,
      bookmarks: totalBookmarks,
      searchLogs: totalSearchLogs,
      recentActivity
    }
  }
}

// ========== DEFAULT EXPORT ==========
export default new SuperAdminService()