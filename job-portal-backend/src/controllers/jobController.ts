import { Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()
interface JobInput {
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

interface JobQueryParams {
  search?: string
  location?: string
  industry?: string
  employment_type?: string
  min_salary?: string
  max_salary?: string
  is_remote?: string
  page?: string
  limit?: string
  sort?: string
  status?: string
  q?: string
}

// ========== CREATE JOB ==========
export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
    }: JobInput = req.body

    const normalizedTitle = title?.trim() ?? ''
    const normalizedLocation = location?.trim() ?? ''

    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(403).json({
        success: false,
        message: 'Employer profile not found. Please complete your company profile first.'
      })
      return
    }

    // Get open status
    const openStatus = await prisma.jobPostStatus.findFirst({
      where: { status_name: 'Open' }
    })

    // Check for duplicate job posting by this employer
    const duplicateJob = await prisma.jobPost.findFirst({
      where: {
        employer_id: employerProfile.id,
        title: { equals: normalizedTitle, mode: 'insensitive' as const },
        location: { equals: normalizedLocation, mode: 'insensitive' as const },
        employment_type_id,
        industry_id
      }
    })

    if (duplicateJob) {
      res.status(409).json({
        success: false,
        message: 'Duplicate job detected. A similar job has already been posted.',
        existingJobId: duplicateJob.id,
        code: 'DUPLICATE_JOB'
      })
      return
    }

    // Generate salary range string
    let salaryRange = null
    if (salary_min && salary_max) {
      salaryRange = `$${salary_min.toLocaleString()} - $${salary_max.toLocaleString()}`
    } else if (salary_min) {
      salaryRange = `From $${salary_min.toLocaleString()}`
    } else if (salary_max) {
      salaryRange = `Up to $${salary_max.toLocaleString()}`
    }

    // Create job
    const job = await prisma.jobPost.create({
      data: {
        title: normalizedTitle,
        description,
        requirements: requirements || null,
        benefits: benefits || null,
        location: normalizedLocation,
        is_remote: is_remote || false,
        salary_min: salary_min || null,
        salary_max: salary_max || null,
        salary_range: salaryRange,
        employment_type_id,
        industry_id,
        employer_id: employerProfile.id,
        status_id: openStatus!.id
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

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job posted successfully'
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Duplicate job detected. A similar job has already been posted.',
        code: 'DUPLICATE_FIELD'
      })
      return
    }

    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET ALL JOBS (with filters) ==========
export const getAllJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query as JobQueryParams
    const {
      search,
      location,
      industry,
      employment_type,
      min_salary,
      max_salary,
      is_remote,
      page = '1',
      limit = '10',
      sort = 'recent'
    } = query

    const where: any = {
      status: { status_name: 'Open' }
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { requirements: { contains: search, mode: 'insensitive' as const } },
        { benefits: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' as const }
    }

    // Industry filter
    if (industry) {
      where.industry_id = parseInt(industry)
    }

    // Employment type filter
    if (employment_type) {
      where.employment_type_id = parseInt(employment_type)
    }

    // Remote filter
    if (is_remote === 'true') {
      where.is_remote = true
    }

    // Salary filters
    if (min_salary || max_salary) {
      where.AND = []
      if (min_salary) {
        where.AND.push({
          OR: [
            { salary_max: { gte: parseFloat(min_salary) } },
            { salary_min: { gte: parseFloat(min_salary) } }
          ]
        })
      }
      if (max_salary) {
        where.AND.push({
          OR: [
            { salary_min: { lte: parseFloat(max_salary) } },
            { salary_max: { lte: parseFloat(max_salary) } }
          ]
        })
      }
    }

    // Sorting
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

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
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
        take: parseInt(limit)
      }),
      prisma.jobPost.count({ where })
    ])

    // Add applied status if user is logged in and is job seeker
    let jobsWithStatus = jobs
    if (req.user && req.user.user_type.type_name === 'Job Seeker') {
      const seekerProfile = await prisma.jobSeekerProfile.findUnique({
        where: { user_id: req.user.id }
      })

      if (seekerProfile) {
        const appliedJobs = await prisma.jobApplication.findMany({
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

    res.json({
      success: true,
      data: jobsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOB BY ID ==========
export const getJobById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await prisma.jobPost.findUnique({
      where: { id: req.params.id },
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
          take: 5
        },
        _count: {
          select: { applications: true, bookmarks: true }
        }
      }
    })

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      })
      return
    }

    // Increment view count
    await prisma.jobPost.update({
      where: { id: req.params.id },
      data: { views_count: { increment: 1 } }
    })

    // Check if user has applied (if logged in as job seeker)
    let hasApplied = false
    if (req.user && req.user.user_type.type_name === 'Job Seeker') {
      const seekerProfile = await prisma.jobSeekerProfile.findUnique({
        where: { user_id: req.user.id }
      })

      if (seekerProfile) {
        const application = await prisma.jobApplication.findFirst({
          where: {
            job_id: job.id,
            seeker_id: seekerProfile.id
          }
        })
        hasApplied = !!application
      }
    }

    res.json({
      success: true,
      data: {
        ...job,
        has_applied: hasApplied
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPDATE JOB ==========
export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
    } = req.body

    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(403).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    // Check if job exists and belongs to employer
    const existingJob = await prisma.jobPost.findFirst({
      where: {
        id: req.params.id,
        employer_id: employerProfile.id
      }
    })

    if (!existingJob) {
      res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to update it'
      })
      return
    }

    const normalizedTitle = title !== undefined ? title.trim() : existingJob.title
    const normalizedLocation = location !== undefined ? location.trim() : existingJob.location
    const normalizedEmploymentTypeId = employment_type_id !== undefined ? employment_type_id : existingJob.employment_type_id
    const normalizedIndustryId = industry_id !== undefined ? industry_id : existingJob.industry_id

    // Prevent updating to a duplicate job title/location/industry/employment combination
    const duplicateJob = await prisma.jobPost.findFirst({
      where: {
        employer_id: employerProfile.id,
        title: { equals: normalizedTitle, mode: 'insensitive' as const },
        location: { equals: normalizedLocation, mode: 'insensitive' as const },
        employment_type_id: normalizedEmploymentTypeId,
        industry_id: normalizedIndustryId,
        NOT: {
          id: req.params.id
        }
      }
    })

    if (duplicateJob) {
      res.status(409).json({
        success: false,
        message: 'Duplicate job detected. Another job with these details already exists.',
        existingJobId: duplicateJob.id,
        code: 'DUPLICATE_JOB'
      })
      return
    }

    // Generate salary range string
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
      }
    }

    // Update job
    const updatedJob = await prisma.jobPost.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? normalizedTitle : undefined,
        description: description !== undefined ? description : undefined,
        requirements: requirements !== undefined ? requirements : undefined,
        benefits: benefits !== undefined ? benefits : undefined,
        location: location !== undefined ? normalizedLocation : undefined,
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

    res.json({
      success: true,
      data: updatedJob,
      message: 'Job updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== DELETE JOB ==========
export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(403).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    // Check if job exists and belongs to employer
    const job = await prisma.jobPost.findFirst({
      where: {
        id: req.params.id,
        employer_id: employerProfile.id
      },
      include: {
        applications: true
      }
    })

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to delete it'
      })
      return
    }

    // Delete job (cascade will delete applications, bookmarks, notes)
    await prisma.jobPost.delete({
      where: { id: req.params.id }
    })

    res.json({
      success: true,
      message: 'Job deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET EMPLOYER JOBS ==========
export const getEmployerJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query as JobQueryParams
    const { status, page = '1', limit = '10' } = query

    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    const where: any = {
      employer_id: employerProfile.id
    }

    if (status) {
      where.status = { status_name: status }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
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
        take: parseInt(limit)
      }),
      prisma.jobPost.count({ where })
    ])

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOB STATS ==========
export const getJobStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    const stats = await prisma.jobPost.groupBy({
      by: ['status_id'],
      where: { employer_id: employerProfile.id },
      _count: true,
      _sum: {
        views_count: true,
        applications_count: true
      }
    })

    const statuses = await prisma.jobPostStatus.findMany()
    
    const formattedStats = statuses.map(s => {
      const stat = stats.find(st => st.status_id === s.id)
      return {
        status: s.status_name,
        count: stat?._count || 0,
        total_views: stat?._sum.views_count || 0,
        total_applications: stat?._sum.applications_count || 0
      }
    })

    const totalJobs = formattedStats.reduce((sum, s) => sum + s.count, 0)
    const totalViews = formattedStats.reduce((sum, s) => sum + s.total_views, 0)
    const totalApplications = formattedStats.reduce((sum, s) => sum + s.total_applications, 0)

    res.json({
      success: true,
      data: {
        total_jobs: totalJobs,
        total_views: totalViews,
        total_applications: totalApplications,
        breakdown: formattedStats
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOB APPLICATIONS ==========
export const getJobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params
    const query = req.query as JobQueryParams
    const { status, page = '1', limit = '10' } = query

    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    // Verify job belongs to employer
    const job = await prisma.jobPost.findFirst({
      where: {
        id: jobId,
        employer_id: employerProfile.id
      }
    })

    if (!job) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      })
      return
    }

    const where: any = { job_id: jobId }
    if (status) {
      where.status = { status_name: status }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          seeker: {
            include: {
              user: true
            }
          },
          status: true,
          notes: {
            include: {
              employer: {
                include: {
                  user: true
                }
              }
            },
            orderBy: { created_at: 'desc' }
          }
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.jobApplication.count({ where })
    ])

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== SEARCH JOBS ==========
export const searchJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query as JobQueryParams
    const { q, page = '1', limit = '10' } = query

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      })
      return
    }

    const where = {
      status: { status_name: 'Open' },
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { requirements: { contains: q, mode: 'insensitive' as const } },
        { location: { contains: q, mode: 'insensitive' as const } },
        { employer: { company_name: { contains: q, mode: 'insensitive' as const } } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
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
        take: parseInt(limit)
      }),
      prisma.jobPost.count({ where })
    ])

    res.json({
      success: true,
      data: jobs,
      search_query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOBS BY INDUSTRY ==========
export const getJobsByIndustry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { industryId } = req.params
    const query = req.query as JobQueryParams
    const { page = '1', limit = '10' } = query

    const where = {
      industry_id: parseInt(industryId),
      status: { status_name: 'Open' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
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
        take: parseInt(limit)
      }),
      prisma.jobPost.count({ where })
    ])

    const industry = await prisma.jobIndustry.findUnique({
      where: { id: parseInt(industryId) }
    })

    res.json({
      success: true,
      data: jobs,
      industry,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOBS BY LOCATION ==========
export const getJobsByLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city } = req.params
    const query = req.query as JobQueryParams
    const { page = '1', limit = '10' } = query

    const where = {
      location: { contains: city, mode: 'insensitive' as const },
      status: { status_name: 'Open' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
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
        take: parseInt(limit)
      }),
      prisma.jobPost.count({ where })
    ])

    res.json({
      success: true,
      data: jobs,
      location: city,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET RECOMMENDED JOBS ==========
export const getRecommendedJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query as JobQueryParams
    const { limit = '10' } = query

    // Get job seeker profile and their skills
    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile || !seekerProfile.skills || seekerProfile.skills.length === 0) {
      // Return recent jobs if no skills
      const recentJobs = await prisma.jobPost.findMany({
        where: { status: { status_name: 'Open' } },
        include: {
          employer: {
            include: {
              user: true
            }
          },
          industry: true,
          employment_type: true
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit)
      })

      res.json({
        success: true,
        data: recentJobs,
        message: 'Recommended based on recent jobs'
      })
      return
    }

    // Search jobs matching skills
    const skillsArray = seekerProfile.skills
    const skillConditions = skillsArray.slice(0, 5).map(skill => ({
      OR: [
        { title: { contains: skill, mode: 'insensitive' as const } },
        { description: { contains: skill, mode: 'insensitive' as const } },
        { requirements: { contains: skill, mode: 'insensitive' as const } }
      ]
    }))

    const recommendedJobs = await prisma.jobPost.findMany({
      where: {
        status: { status_name: 'Open' },
        OR: skillConditions
      },
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
      take: parseInt(limit)
    })

    res.json({
      success: true,
      data: recommendedJobs,
      message: 'Recommended based on your skills'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== TOGGLE JOB STATUS ==========
export const toggleJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!employerProfile) {
      res.status(403).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    // Check if job exists and belongs to employer
    const job = await prisma.jobPost.findFirst({
      where: {
        id: req.params.id,
        employer_id: employerProfile.id
      },
      include: {
        status: true
      }
    })

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission'
      })
      return
    }

    // Toggle status
    const newStatusName = job.status.status_name === 'Open' ? 'Closed' : 'Open'
    const newStatus = await prisma.jobPostStatus.findFirst({
      where: { status_name: newStatusName }
    })

    const updatedJob = await prisma.jobPost.update({
      where: { id: req.params.id },
      data: { status_id: newStatus!.id },
      include: {
        status: true
      }
    })

    res.json({
      success: true,
      data: updatedJob,
      message: `Job ${newStatusName.toLowerCase()} successfully`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOB FILTERS ==========
export const getJobFilters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [industries, employmentTypes, locations] = await Promise.all([
      prisma.jobIndustry.findMany({
        orderBy: { industry_name: 'asc' }
      }),
      prisma.employmentType.findMany({
        orderBy: { type_name: 'asc' }
      }),
      prisma.jobPost.findMany({
        where: { status: { status_name: 'Open' } },
        select: { location: true },
        distinct: ['location']
      })
    ])

    const uniqueLocations = [...new Set(locations.map(l => l.location))].filter(Boolean)

    res.json({
      success: true,
      data: {
        industries,
        employment_types: employmentTypes,
        locations: uniqueLocations
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}