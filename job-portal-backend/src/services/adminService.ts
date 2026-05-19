import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { AppError, NotFoundError, ValidationError } from '../middleware/errorMiddleware.js'

const prisma = new PrismaClient()

// ========== TYPES ==========
export interface UserFilters {
  search?: string
  user_type?: string
  is_active?: boolean
  page?: number
  limit?: number
}

export interface JobFilters {
  search?: string
  status?: string
  employer?: string
  page?: number
  limit?: number
}

export interface DashboardStats {
  users: {
    total: number
    employers: number
    jobSeekers: number
    admins: number
    active: number
    suspended: number
  }
  jobs: {
    total: number
    open: number
    closed: number
    draft: number
    archived: number
  }
  applications: {
    total: number
    pending: number
    reviewed: number
    shortlisted: number
    interview: number
    accepted: number
    rejected: number
  }
  analytics: {
    totalViews: number
    averageApplicationsPerJob: number
    jobsLast30Days: number
    usersLast30Days: number
  }
}

// ========== USER MANAGEMENT ==========
export class AdminService {
  // Get all users with filters
  async getAllUsers(filters: UserFilters) {
    const { search, user_type, is_active, page = 1, limit = 20 } = filters

    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { seeker_profile: { full_name: { contains: search, mode: 'insensitive' } } },
        { employer_profile: { company_name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (user_type) {
      where.user_type = { type_name: user_type }
    }

    if (is_active !== undefined) {
      where.is_active = is_active
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          user_type: true,
          seeker_profile: true,
          employer_profile: {
            include: { industry: true }
          },
          _count: {
            select: {
              notifications: true,
              search_logs: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: {
          include: { industry: true }
        },
        notifications: {
          orderBy: { created_at: 'desc' },
          take: 20
        },
        search_logs: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  // Create user (admin)
  async createUser(userData: {
    email: string
    password: string
    user_type: string
    full_name?: string
    company_name?: string
    phone?: string
    location?: string
  }) {
    const { email, password, user_type, full_name, company_name, phone, location } = userData

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new ValidationError('User with this email already exists')
    }

    // Get user type
    const userType = await prisma.userType.findFirst({
      where: { type_name: user_type }
    })

    if (!userType) {
      throw new ValidationError('Invalid user type')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        user_type_id: userType.id,
        is_active: true
      }
    })

    // Create profile based on user type
    if (user_type === 'Job Seeker') {
      await prisma.jobSeekerProfile.create({
        data: {
          user_id: user.id,
          full_name: full_name || '',
          phone: phone || null,
          location: location || null,
          skills: []
        }
      })
    } else if (user_type === 'Employer') {
      await prisma.employerProfile.create({
        data: {
          user_id: user.id,
          company_name: company_name || '',
          location: location || null,
          industry_id: 1
        }
      })
    }

    return user
  }

  // Update user
  async updateUser(userId: string, updateData: {
    email?: string
    is_active?: boolean
    user_type?: string
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_type: true }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Update user type if changed
    if (updateData.user_type && updateData.user_type !== user.user_type.type_name) {
      const newUserType = await prisma.userType.findFirst({
        where: { type_name: updateData.user_type }
      })

      if (!newUserType) {
        throw new ValidationError('Invalid user type')
      }

      updateData.user_type = undefined
      await prisma.user.update({
        where: { id: userId },
        data: { user_type_id: newUserType.id }
      })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: updateData.email,
        is_active: updateData.is_active
      },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    return updatedUser
  }

  // Suspend user
  async suspendUser(userId: string, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seeker_profile: true, employer_profile: true }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    if (!user.is_active) {
      throw new ValidationError('User is already suspended')
    }

    const suspendedUser = await prisma.user.update({
      where: { id: userId },
      data: { is_active: false }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Account Suspended',
        message: reason 
          ? `Your account has been suspended. Reason: ${reason}` 
          : 'Your account has been suspended by an administrator. Please contact support for more information.',
        type: 'account_suspended'
      }
    })

    return suspendedUser
  }

  // Activate user
  async activateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    if (user.is_active) {
      throw new ValidationError('User is already active')
    }

    const activatedUser = await prisma.user.update({
      where: { id: userId },
      data: { is_active: true }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Account Activated',
        message: 'Your account has been reactivated. You can now log in and use the platform.',
        type: 'account_activated'
      }
    })

    return activatedUser
  }

  // Delete user
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return { message: 'User deleted successfully' }
  }

  // ========== JOB MANAGEMENT ==========
  async getAllJobs(filters: JobFilters) {
    const { search, status, employer, page = 1, limit = 20 } = filters

    const where: Prisma.JobPostWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = { status_name: status }
    }

    if (employer) {
      where.employer = { company_name: { contains: employer, mode: 'insensitive' } }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        include: {
          employer: {
            include: { user: true, industry: true }
          },
          industry: true,
          employment_type: true,
          status: true,
          _count: {
            select: { applications: true, bookmarks: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.jobPost.count({ where })
    ])

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get job by ID (admin view)
  async getJobById(jobId: string) {
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          include: { user: true, industry: true }
        },
        industry: true,
        employment_type: true,
        status: true,
        applications: {
          include: {
            seeker: { include: { user: true } },
            status: true,
            notes: {
              include: { employer: { include: { user: true } } }
            }
          }
        },
        bookmarks: true
      }
    })

    if (!job) {
      throw new NotFoundError('Job')
    }

    return job
  }

  // Moderate job (change status)
  async moderateJob(jobId: string, status: string, moderationNote?: string) {
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        employer: { include: { user: true } }
      }
    })

    if (!job) {
      throw new NotFoundError('Job')
    }

    const statusObj = await prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    })

    if (!statusObj) {
      throw new ValidationError('Invalid status')
    }

    const moderatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: { status_id: statusObj.id },
      include: {
        status: true,
        employer: true
      }
    })

    // Notify employer
    await prisma.notification.create({
      data: {
        user_id: job.employer.user.id,
        title: `Job Post ${status}`,
        message: `Your job "${job.title}" has been ${status.toLowerCase()} by an administrator.${moderationNote ? ` Reason: ${moderationNote}` : ''}`,
        type: 'job_moderated'
      }
    })

    return moderatedJob
  }

  // Delete job (admin)
  async deleteJob(jobId: string) {
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { employer: { include: { user: true } } }
    })

    if (!job) {
      throw new NotFoundError('Job')
    }

    await prisma.jobPost.delete({
      where: { id: jobId }
    })

    // Notify employer
    await prisma.notification.create({
      data: {
        user_id: job.employer.user.id,
        title: 'Job Post Deleted',
        message: `Your job "${job.title}" has been deleted by an administrator.`,
        type: 'job_deleted'
      }
    })

    return { message: 'Job deleted successfully' }
  }

  // ========== APPLICATION MANAGEMENT ==========
  async getAllApplications(filters: {
    status?: string
    job_id?: string
    page?: number
    limit?: number
  }) {
    const { status, job_id, page = 1, limit = 20 } = filters

    const where: Prisma.JobApplicationWhereInput = {}

    if (status) {
      where.status = { status_name: status }
    }

    if (job_id) {
      where.job_id = job_id
    }

    const skip = (page - 1) * limit

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          job: {
            include: {
              employer: { include: { user: true } }
            }
          },
          seeker: { include: { user: true } },
          status: true,
          notes: {
            include: { employer: { include: { user: true } } }
          }
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.jobApplication.count({ where })
    ])

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // ========== DASHBOARD STATISTICS ==========
  async getDashboardStats(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // User stats
    const [
      totalUsers,
      totalEmployers,
      totalJobSeekers,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      newUsersLast30Days
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { user_type: { type_name: 'Employer' } } }),
      prisma.user.count({ where: { user_type: { type_name: 'Job Seeker' } } }),
      prisma.user.count({ 
        where: { 
          user_type: { 
            type_name: { in: ['Admin', 'Super Admin'] } 
          } 
        } 
      }),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_active: false } }),
      prisma.user.count({ 
        where: { 
          created_at: { gte: thirtyDaysAgo } 
        } 
      })
    ])

    // Job stats
    const [
      totalJobs,
      openJobs,
      closedJobs,
      draftJobs,
      archivedJobs,
      jobsLast30Days,
      totalViews
    ] = await Promise.all([
      prisma.jobPost.count(),
      prisma.jobPost.count({ where: { status: { status_name: 'Open' } } }),
      prisma.jobPost.count({ where: { status: { status_name: 'Closed' } } }),
      prisma.jobPost.count({ where: { status: { status_name: 'Draft' } } }),
      prisma.jobPost.count({ where: { status: { status_name: 'Archived' } } }),
      prisma.jobPost.count({ 
        where: { 
          created_at: { gte: thirtyDaysAgo } 
        } 
      }),
      prisma.jobPost.aggregate({
        _sum: { views_count: true }
      })
    ])

    // Application stats
    const [
      totalApplications,
      pendingApps,
      reviewedApps,
      shortlistedApps,
      interviewApps,
      acceptedApps,
      rejectedApps
    ] = await Promise.all([
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { status: { status_name: 'Pending' } } }),
      prisma.jobApplication.count({ where: { status: { status_name: 'Reviewed' } } }),
      prisma.jobApplication.count({ where: { status: { status_name: 'Shortlisted' } } }),
      prisma.jobApplication.count({ where: { status: { status_name: 'Interview' } } }),
      prisma.jobApplication.count({ where: { status: { status_name: 'Accepted' } } }),
      prisma.jobApplication.count({ where: { status: { status_name: 'Rejected' } } })
    ])

    const averageApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0

    return {
      users: {
        total: totalUsers,
        employers: totalEmployers,
        jobSeekers: totalJobSeekers,
        admins: totalAdmins,
        active: activeUsers,
        suspended: suspendedUsers
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        closed: closedJobs,
        draft: draftJobs,
        archived: archivedJobs
      },
      applications: {
        total: totalApplications,
        pending: pendingApps,
        reviewed: reviewedApps,
        shortlisted: shortlistedApps,
        interview: interviewApps,
        accepted: acceptedApps,
        rejected: rejectedApps
      },
      analytics: {
        totalViews: totalViews._sum.views_count || 0,
        averageApplicationsPerJob: parseFloat(averageApplicationsPerJob.toFixed(2)),
        jobsLast30Days: jobsLast30Days,
        usersLast30Days: newUsersLast30Days
      }
    }
  }

  // ========== INDUSTRY MANAGEMENT ==========
  async getAllIndustries() {
    const industries = await prisma.jobIndustry.findMany({
      include: {
        _count: {
          select: { jobs: true, employers: true }
        }
      },
      orderBy: { industry_name: 'asc' }
    })

    return industries
  }

  async createIndustry(industryName: string) {
    const existingIndustry = await prisma.jobIndustry.findUnique({
      where: { industry_name: industryName }
    })

    if (existingIndustry) {
      throw new ValidationError('Industry already exists')
    }

    const industry = await prisma.jobIndustry.create({
      data: { industry_name: industryName }
    })

    return industry
  }

  async updateIndustry(industryId: number, industryName: string) {
    const industry = await prisma.jobIndustry.findUnique({
      where: { id: industryId }
    })

    if (!industry) {
      throw new NotFoundError('Industry')
    }

    const updatedIndustry = await prisma.jobIndustry.update({
      where: { id: industryId },
      data: { industry_name: industryName }
    })

    return updatedIndustry
  }

  async deleteIndustry(industryId: number) {
    const industry = await prisma.jobIndustry.findUnique({
      where: { id: industryId },
      include: {
        _count: {
          select: { jobs: true, employers: true }
        }
      }
    })

    if (!industry) {
      throw new NotFoundError('Industry')
    }

    if (industry._count.jobs > 0 || industry._count.employers > 0) {
      throw new ValidationError('Cannot delete industry with associated jobs or employers')
    }

    await prisma.jobIndustry.delete({
      where: { id: industryId }
    })

    return { message: 'Industry deleted successfully' }
  }

  // ========== SYSTEM STATISTICS ==========
  async getSystemStats() {
    const [
      totalNotifications,
      totalBookmarks,
      totalSearchLogs,
      recentActivity
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.jobBookmark.count(),
      prisma.searchLog.count(),
      prisma.searchLog.findMany({
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

export default new AdminService()