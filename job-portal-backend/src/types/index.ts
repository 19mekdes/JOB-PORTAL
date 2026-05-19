import { Request } from 'express'
import { User, UserType, JobSeekerProfile, EmployerProfile } from '@prisma/client'

export interface AuthRequest extends Request {
  user?: User & {
    user_type: UserType
    seeker_profile?: JobSeekerProfile | null
    employer_profile?: EmployerProfile | null
  }
}

export interface RegisterInput {
  email: string
  password: string
  full_name: string
  user_type: string
  phone?: string
  location?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface JobInput {
  title: string
  description: string
  location: string
  employment_type_id: number
  industry_id: number
  salary_min?: number
  salary_max?: number
  requirements?: string
  benefits?: string
  is_remote?: boolean
}

export interface ApplicationInput {
  job_id: string
  cover_letter?: string
  resume_url?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}