import { PrismaClient, Prisma } from '@prisma/client'
import { AppError, NotFoundError, ValidationError } from '../middleware/errorMiddleware.js'

const prisma = new PrismaClient()

// ========== TYPES ==========
export interface JobFilters {
  search?: string
  location?: string
  industry?: number
  employment_type?: number
  min_salary?: number
  max_salary?: number
  is_remote?: boolean
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'salary_high' | 'salary_low'
}

export interface JobStats {
  total: number
  byStatus: {
    status: string
    count: number
    total_views: number
    total_applications: number
  }[]
  byIndustry: {
    industry: string
    count: number
  }[]
  byEmploymentType: {
    type: string
    count: number
  }[]
  byLocation: {
    location: string
    count: number
  }[]
  recentActivity: {
    date: string
    count: number
  }[]
}

export interface JobInput {
  title: string
  description: string
  requirements?: string
  benefits?: string
  location: string
  employment_type_id: number
  industry_id: number
  salary_min?: number
  salary_max?: number
  is_remote?: boolean
}

// ========== JOB SERVICE ==========
export class JobService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  // ========== CREATE JOB ==========
  async createJob(employerUserId: string, jobData: JobInput) {
    const {
      title,
      description,
      requirements,
      benefits,
      location,
      employment_type_id,
      industry_id,
      salary_min,
      salary_max,
      is_remote
    } = jobData

    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: employerUserId }
    })

    if (!employerProfile) {
      throw new ValidationError('Employer profile not found. Please complete your company profile first.')
    }

    const jobCount = await this.prisma.jobPost.count({
      where: { employer_id: employerProfile.id }
    })

    const maxJobs = 100
    if (jobCount >= maxJobs) {
      throw new ValidationError(`You have reached the maximum limit of ${maxJobs} job posts.`)
    }

    const openStatus = await this.prisma.jobPostStatus.findFirst({
      where: { status_name: 'Open' }
    })

    if (!openStatus) {
      throw new ValidationError('Job status configuration error')
    }

    const duplicateJob = await this.prisma.jobPost.findFirst({
      where: {
        employer_id: employerProfile.id,
        title: { equals: title, mode: 'insensitive' as const },
        location: { equals: location, mode: 'insensitive' as const },
        employment_type_id,
        industry_id
      }
    })

    if (duplicateJob) {
      throw new ValidationError('Duplicate job detected. A similar job has already been posted.')
    }

    let salaryRange = null
    if (salary_min && salary_max) {
      salaryRange = `$${salary_min.toLocaleString()} - $${salary_max.toLocaleString()}`
    } else if (salary_min) {
      salaryRange = `From $${salary_min.toLocaleString()}`
    } else if (salary_max) {
      salaryRange = `Up to $${salary_max.toLocaleString()}`
    }

    const job = await this.prisma.jobPost.create({
      data: {
        title,
        description,
        requirements: requirements || null,
        benefits: benefits || null,
        location,
        is_remote: is_remote || false,
        salary_min: salary_min || null,
        salary_max: salary_max || null,
        salary_range: salaryRange,
        employment_type_id,
        industry_id,
        employer_id: employerProfile.id,
        status_id: openStatus.id
      },
      include: {
        industry: true,
        employment_type: true,
        status: true,
        employer: {
          include: {
            user: true
          }
        }
      }
    })

    return job
  }

  // ========== GET ALL JOBS (with filters) ==========
  async getAllJobs(filters: JobFilters = {}, userId?: string, userRole?: string) {
    const {
      search,
      location,
      industry,
      employment_type,
      min_salary,
      max_salary,
      is_remote,
      page = 1,
      limit = 10,
      sort = 'recent'
    } = filters

    const where: any = {}

    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      where.status = { status_name: 'Open' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { requirements: { contains: search, mode: 'insensitive' as const } },
        { benefits: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' as const }
    }

    if (industry) {
      where.industry_id = industry
    }

    if (employment_type) {
      where.employment_type_id = employment_type
    }

    if (is_remote !== undefined) {
      where.is_remote = is_remote
    }

    if (min_salary !== undefined || max_salary !== undefined) {
      where.AND = []
      if (min_salary !== undefined) {
        where.AND.push({
          OR: [
            { salary_max: { gte: min_salary } },
            { salary_min: { gte: min_salary } }
          ]
        })
      }
      if (max_salary !== undefined) {
        where.AND.push({
          OR: [
            { salary_min: { lte: max_salary } },
            { salary_max: { lte: max_salary } }
          ]
        })
      }
    }

    let orderBy: any = {}
    switch (sort) {
      case 'recent':
        orderBy = { created_at: 'desc' }
        break
      case 'oldest':
        orderBy = { created_at: 'asc' }
        break
      case 'salary_high':
        orderBy = { salary_max: 'desc' }
        break
      case 'salary_low':
        orderBy = { salary_min: 'asc' }
        break
      default:
        orderBy = { created_at: 'desc' }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: {
          employer: {
            include: {
              user: true
            }
          },
          industry: true,
          employment_type: true,
          status: true,
          _count: {
            select: { applications: true, bookmarks: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.jobPost.count({ where })
    ])

    let jobsWithStatus = jobs
    if (userId && userRole === 'Job Seeker') {
      const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
        where: { user_id: userId }
      })

      if (seekerProfile) {
        const appliedJobs = await this.prisma.jobApplication.findMany({
          where: { seeker_id: seekerProfile.id },
          select: { job_id: true }
        })

        const appliedJobIds = new Set(appliedJobs.map(a => a.job_id))

        jobsWithStatus = jobs.map(job => ({
          ...job,
          has_applied: appliedJobIds.has(job.id)
        }))
      }
    }

    return {
      jobs: jobsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters
    }
  }

  // ========== GET JOB BY ID ==========
  async getJobById(jobId: string, userId?: string, userRole?: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          include: {
            user: true,
            industry: true
          }
        },
        industry: true,
        employment_type: true,
        status: true,
        applications: {
          include: {
            seeker: {
              include: {
                user: true
              }
            },
            status: true
          },
          take: 5,
          orderBy: { applied_at: 'desc' }
        },
        _count: {
          select: { applications: true, bookmarks: true }
        }
      }
    })

    if (!job) {
      throw new NotFoundError('Job')
    }

    const isOwner = job.employer.user_id === userId
    const isAdmin = userRole === 'Admin' || userRole === 'Super Admin'
    const isOpen = job.status.status_name === 'Open'

    if (!isOpen && !isOwner && !isAdmin) {
      throw new AppError('This job is no longer available', 403)
    }

    if (!isOwner) {
      await this.prisma.jobPost.update({
        where: { id: jobId },
        data: { views_count: { increment: 1 } }
      })
    }

    let hasApplied = false
    if (userId && userRole === 'Job Seeker') {
      const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
        where: { user_id: userId }
      })

      if (seekerProfile) {
        const application = await this.prisma.jobApplication.findFirst({
          where: {
            job_id: job.id,
            seeker_id: seekerProfile.id
          }
        })
        hasApplied = !!application
      }
    }

    const relatedJobs = await this.prisma.jobPost.findMany({
      where: {
        industry_id: job.industry_id,
        id: { not: jobId },
        status: { status_name: 'Open' }
      },
      include: {
        employer: true,
        industry: true,
        employment_type: true
      },
      take: 5,
      orderBy: { created_at: 'desc' }
    })

    return {
      ...job,
      has_applied: hasApplied,
      related_jobs: relatedJobs
    }
  }

  // ========== UPDATE JOB ==========
  async updateJob(employerUserId: string, jobId: string, jobData: Partial<JobInput>) {
    const {
      title,
      description,
      requirements,
      benefits,
      location,
      employment_type_id,
      industry_id,
      salary_min,
      salary_max,
      is_remote
    } = jobData

    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: employerUserId }
    })

    if (!employerProfile) {
      throw new NotFoundError('Employer profile not found')
    }

    const existingJob = await this.prisma.jobPost.findFirst({
      where: {
        id: jobId,
        employer_id: employerProfile.id
      }
    })

    if (!existingJob) {
      throw new AppError('Job not found or you do not have permission to update it', 403)
    }

    const duplicateJob = await this.prisma.jobPost.findFirst({
      where: {
        employer_id: employerProfile.id,
        title: title !== undefined ? { equals: title, mode: 'insensitive' as const } : existingJob.title,
        location: location !== undefined ? { equals: location, mode: 'insensitive' as const } : existingJob.location,
        employment_type_id: employment_type_id !== undefined ? employment_type_id : existingJob.employment_type_id,
        industry_id: industry_id !== undefined ? industry_id : existingJob.industry_id,
        NOT: {
          id: jobId
        }
      }
    })

    if (duplicateJob) {
      throw new AppError('Duplicate job detected. Another job with these details already exists.', 409, 'CONFLICT')
    }

    let salaryRange = existingJob.salary_range
    if (salary_min !== undefined || salary_max !== undefined) {
      const min = salary_min !== undefined ? salary_min : existingJob.salary_min
      const max = salary_max !== undefined ? salary_max : existingJob.salary_max
      if (min && max) {
        salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()}`
      } else if (min) {
        salaryRange = `From $${min.toLocaleString()}`
      } else if (max) {
        salaryRange = `Up to $${max.toLocaleString()}`
      } else {
        salaryRange = null
      }
    }

    const updatedJob = await this.prisma.jobPost.update({
      where: { id: jobId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        requirements: requirements !== undefined ? requirements : undefined,
        benefits: benefits !== undefined ? benefits : undefined,
        location: location !== undefined ? location : undefined,
        is_remote: is_remote !== undefined ? is_remote : undefined,
        salary_min: salary_min !== undefined ? salary_min : undefined,
        salary_max: salary_max !== undefined ? salary_max : undefined,
        salary_range: salaryRange,
        employment_type_id: employment_type_id !== undefined ? employment_type_id : undefined,
        industry_id: industry_id !== undefined ? industry_id : undefined
      },
      include: {
        industry: true,
        employment_type: true,
        status: true
      }
    })

    return updatedJob
  }

  // ========== DELETE JOB ==========
  async deleteJob(employerUserId: string, jobId: string) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: employerUserId }
    })

    if (!employerProfile) {
      throw new NotFoundError('Employer profile not found')
    }

    const job = await this.prisma.jobPost.findFirst({
      where: {
        id: jobId,
        employer_id: employerProfile.id
      },
      include: {
        applications: {
          include: {
            seeker: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!job) {
      throw new AppError('Job not found or you do not have permission to delete it', 403)
    }

    for (const application of job.applications) {
      await this.prisma.notification.create({
        data: {
          user_id: application.seeker.user.id,
          title: 'Job Posting Removed',
          message: `The job "${job.title}" you applied for has been removed by the employer.`,
          type: 'job_removed'
        }
      })
    }

    await this.prisma.jobPost.delete({
      where: { id: jobId }
    })

    return { message: 'Job deleted successfully', affected_applicants: job.applications.length }
  }

  // ========== GET EMPLOYER JOBS ==========
  async getEmployerJobs(employerUserId: string, status?: string, page: number = 1, limit: number = 10) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: employerUserId }
    })

    if (!employerProfile) {
      throw new NotFoundError('Employer profile not found')
    }

    const where: any = {
      employer_id: employerProfile.id
    }

    if (status) {
      where.status = { status_name: status }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: {
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
      this.prisma.jobPost.count({ where })
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

  // ========== GET JOB STATISTICS ==========
  async getJobStats(employerUserId: string): Promise<JobStats> {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: employerUserId }
    })

    if (!employerProfile) {
      throw new NotFoundError('Employer profile not found')
    }

    const statusStats = await this.prisma.jobPost.groupBy({
      by: ['status_id'],
      where: { employer_id: employerProfile.id },
      _count: true,
      _sum: {
        views_count: true,
        applications_count: true
      }
    })

    const statuses = await this.prisma.jobPostStatus.findMany()
    
    const byStatus = statuses.map(s => {
      const stat = statusStats.find(st => st.status_id === s.id)
      return {
        status: s.status_name,
        count: stat?._count || 0,
        total_views: stat?._sum.views_count || 0,
        total_applications: stat?._sum.applications_count || 0
      }
    })

    const industryStats = await this.prisma.jobPost.groupBy({
      by: ['industry_id'],
      where: { employer_id: employerProfile.id },
      _count: true
    })

    const industries = await this.prisma.jobIndustry.findMany()
    
    const byIndustry = industries.map(i => ({
      industry: i.industry_name,
      count: industryStats.find(stat => stat.industry_id === i.id)?._count || 0
    })).filter(i => i.count > 0)

    const employmentStats = await this.prisma.jobPost.groupBy({
      by: ['employment_type_id'],
      where: { employer_id: employerProfile.id },
      _count: true
    })

    const employmentTypes = await this.prisma.employmentType.findMany()
    
    const byEmploymentType = employmentTypes.map(e => ({
      type: e.type_name,
      count: employmentStats.find(stat => stat.employment_type_id === e.id)?._count || 0
    })).filter(e => e.count > 0)

    const locationStats = await this.prisma.jobPost.groupBy({
      by: ['location'],
      where: { employer_id: employerProfile.id },
      _count: true
    })

    const byLocation = locationStats.map(stat => ({
      location: stat.location,
      count: stat._count
    }))

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await this.prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM "JobPost"
      WHERE employer_id = ${employerProfile.id}
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    const total = byStatus.reduce((sum, s) => sum + s.count, 0)

    return {
      total,
      byStatus: byStatus.filter(s => s.count > 0),
      byIndustry,
      byEmploymentType,
      byLocation,
      recentActivity: recentActivity.map(activity => ({
        date: new Date(activity.date).toLocaleDateString(),
        count: Number(activity.count)
      }))
    }
  }

  // ========== SEARCH JOBS ==========
  async searchJobs(query: string, page: number = 1, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query is required')
    }

    const where = {
      status: { status_name: 'Open' },
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
        { requirements: { contains: query, mode: 'insensitive' as const } },
        { location: { contains: query, mode: 'insensitive' as const } },
        { employer: { company_name: { contains: query, mode: 'insensitive' as const } } }
      ]
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: {
          employer: {
            include: {
              user: true
            }
          },
          industry: true,
          employment_type: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.jobPost.count({ where })
    ])

    return {
      jobs,
      search_query: query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // ========== GET JOBS BY INDUSTRY ==========
  async getJobsByIndustry(industryId: number, page: number = 1, limit: number = 10) {
    const industry = await this.prisma.jobIndustry.findUnique({
      where: { id: industryId }
    })

    if (!industry) {
      throw new NotFoundError('Industry')
    }

    const where = {
      industry_id: industryId,
      status: { status_name: 'Open' }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: {
          employer: {
            include: {
              user: true
            }
          },
          industry: true,
          employment_type: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.jobPost.count({ where })
    ])

    return {
      jobs,
      industry,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // ========== GET JOBS BY LOCATION ==========
  async getJobsByLocation(city: string, page: number = 1, limit: number = 10) {
    const where = {
      location: { contains: city, mode: 'insensitive' as const },
      status: { status_name: 'Open' }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: {
          employer: {
            include: {
              user: true
            }
          },
          industry: true,
          employment_type: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.jobPost.count({ where })
    ])

    return {
      jobs,
      location: city,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // ========== GET RECOMMENDED JOBS ==========
  async getRecommendedJobs(seekerUserId: string, limit: number = 10) {
    const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: seekerUserId }
    })

    if (!seekerProfile) {
      return this.getAllJobs({ page: 1, limit })
    }

    const skills = seekerProfile.skills || []
    const location = seekerProfile.location

    const where: any = {
      status: { status_name: 'Open' }
    }

    if (skills.length > 0) {
      const skillConditions = skills.slice(0, 3).map(skill => ({
        OR: [
          { title: { contains: skill, mode: 'insensitive' as const } },
          { description: { contains: skill, mode: 'insensitive' as const } },
          { requirements: { contains: skill, mode: 'insensitive' as const } }
        ]
      }))
      where.AND = skillConditions
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' as const }
    }

    const jobs = await this.prisma.jobPost.findMany({
      where,
      include: {
        employer: {
          include: {
            user: true
          }
        },
        industry: true,
        employment_type: true,
        _count: {
          select: { applications: true }
        }
      },
      orderBy: [
        { created_at: 'desc' },
        { views_count: 'desc' }
      ],
      take: limit
    })

    return jobs
  }

  // ========== TOGGLE JOB STATUS ==========
  async toggleJobStatus(employerUserId: string, jobId: string) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: employerUserId }
    })

    if (!employerProfile) {
      throw new NotFoundError('Employer profile not found')
    }

    const job = await this.prisma.jobPost.findFirst({
      where: {
        id: jobId,
        employer_id: employerProfile.id
      },
      include: {
        status: true
      }
    })

    if (!job) {
      throw new AppError('Job not found or you do not have permission', 403)
    }

    const newStatusName = job.status.status_name === 'Open' ? 'Closed' : 'Open'
    const newStatus = await this.prisma.jobPostStatus.findFirst({
      where: { status_name: newStatusName }
    })

    const updatedJob = await this.prisma.jobPost.update({
      where: { id: jobId },
      data: { status_id: newStatus!.id },
      include: {
        status: true
      }
    })

    return updatedJob
  }

  // ========== GET JOB FILTERS ==========
  async getJobFilters() {
    const [industries, employmentTypes, locations] = await Promise.all([
      this.prisma.jobIndustry.findMany({
        orderBy: { industry_name: 'asc' }
      }),
      this.prisma.employmentType.findMany({
        orderBy: { type_name: 'asc' }
      }),
      this.prisma.jobPost.findMany({
        where: { status: { status_name: 'Open' } },
        select: { location: true },
        distinct: ['location']
      })
    ])

    const uniqueLocations = [...new Set(locations.map(l => l.location))].filter(Boolean)

    const salaryStats = await this.prisma.jobPost.aggregate({
      where: { status: { status_name: 'Open' } },
      _min: { salary_min: true },
      _max: { salary_max: true }
    })

    return {
      industries,
      employment_types: employmentTypes,
      locations: uniqueLocations,
      salary_range: {
        min: salaryStats._min.salary_min || 0,
        max: salaryStats._max.salary_max || 200000
      }
    }
  }

  // ========== ADMIN: GET ALL JOBS ==========
  async getAllJobsForAdmin(filters: {
    search?: string
    status?: string
    employer?: string
    page?: number
    limit?: number
  }) {
    const { search, status, employer, page = 1, limit = 20 } = filters

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    if (status) {
      where.status = { status_name: status }
    }

    if (employer) {
      where.employer = { company_name: { contains: employer, mode: 'insensitive' as const } }
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      this.prisma.jobPost.findMany({
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
      this.prisma.jobPost.count({ where })
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

  // ========== ADMIN: MODERATE JOB ==========
  async moderateJob(adminUserId: string, jobId: string, status: string, moderationNote?: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        employer: { include: { user: true } }
      }
    })

    if (!job) {
      throw new NotFoundError('Job')
    }

    const statusObj = await this.prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    })

    if (!statusObj) {
      throw new ValidationError('Invalid status')
    }

    const moderatedJob = await this.prisma.jobPost.update({
      where: { id: jobId },
      data: { status_id: statusObj.id },
      include: {
        status: true,
        employer: true
      }
    })

    await this.prisma.notification.create({
      data: {
        user_id: job.employer.user.id,
        title: `Job Post ${status}`,
        message: `Your job "${job.title}" has been ${status.toLowerCase()} by an administrator.${moderationNote ? ` Reason: ${moderationNote}` : ''}`,
        type: 'job_moderated'
      }
    })

    return moderatedJob
  }
}

// ========== DEFAULT EXPORT ==========
export default new JobService()