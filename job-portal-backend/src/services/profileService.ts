import { PrismaClient, Prisma } from '@prisma/client'
import { AppError, NotFoundError, ValidationError } from '../middleware/errorMiddleware.js'
import { safeJsonParse } from '../utils/safeJson'

const prisma = new PrismaClient()

// ========== TYPES ==========
export interface SeekerProfileData {
  full_name?: string
  phone?: string
  location?: string
  skills?: string[]
  experience?: string
  education?: string
  resume_url?: string
}

export interface EmployerProfileData {
  company_name?: string
  company_description?: string
  website?: string
  industry_id?: number
  company_size?: string
  location?: string
  logo_url?: string
}

export interface Experience {
  id: string
  title: string
  company: string
  location?: string
  start_date: string
  end_date?: string | null
  current: boolean
  description?: string
}

export interface Education {
  id: string
  degree: string
  institution: string
  field_of_study?: string
  start_date: string
  end_date?: string | null
  current: boolean
  grade?: string
}

export interface ProfileCompletion {
  percentage: number
  completed_fields: string[]
  missing_fields: string[]
  sections: {
    section: string
    completed: number
    total: number
    percentage: number
  }[]
}

// ========== PROFILE SERVICE ==========
export class ProfileService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  // ========== GET PROFILE ==========
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: {
          include: {
            industry: true
          }
        }
      }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    const profile = user.seeker_profile || user.employer_profile
    const profileType = user.user_type.type_name

    // Parse JSON fields if they exist for job seeker
    let parsedProfile: any = { ...profile }
    if (profileType === 'Job Seeker' && user.seeker_profile) {
      if (user.seeker_profile.experience) {
        try {
          parsedProfile.experience = safeJsonParse(user.seeker_profile.experience)
        } catch {
          parsedProfile.experience = []
        }
      }
      if (user.seeker_profile.education) {
        try {
          parsedProfile.education = safeJsonParse(user.seeker_profile.education)
        } catch {
          parsedProfile.education = []
        }
      }
    }

    const completion = await this.getProfileCompletionPercentage(userId, profileType)

    return {
      user: {
        id: user.id,
        email: user.email,
        user_type: profileType,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      profile: parsedProfile,
      completion
    }
  }

  // ========== UPDATE JOB SEEKER PROFILE ==========
  async updateSeekerProfile(userId: string, profileData: SeekerProfileData) {
    const {
      full_name,
      phone,
      location,
      skills,
      experience,
      education,
      resume_url
    } = profileData

    // Check if profile exists
    const existingProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!existingProfile) {
      throw new NotFoundError('Job seeker profile')
    }

    // Update profile
    const updatedProfile = await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: {
        full_name: full_name !== undefined ? full_name : undefined,
        phone: phone !== undefined ? phone : undefined,
        location: location !== undefined ? location : undefined,
        skills: skills !== undefined ? skills : undefined,
        experience: experience !== undefined ? JSON.stringify(experience) : undefined,
        education: education !== undefined ? JSON.stringify(education) : undefined,
        resume_url: resume_url !== undefined ? resume_url : undefined
      }
    })

    return updatedProfile
  }

  // ========== UPDATE EMPLOYER PROFILE ==========
  async updateEmployerProfile(userId: string, profileData: EmployerProfileData) {
    const {
      company_name,
      company_description,
      website,
      industry_id,
      company_size,
      location,
      logo_url
    } = profileData

    // Check if profile exists
    const existingProfile = await this.prisma.employerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!existingProfile) {
      throw new NotFoundError('Employer profile')
    }

    // Validate website URL
    if (website && !this.isValidUrl(website)) {
      throw new ValidationError('Invalid website URL format')
    }

    // Validate industry
    if (industry_id) {
      const industry = await this.prisma.jobIndustry.findUnique({
        where: { id: industry_id }
      })
      if (!industry) {
        throw new ValidationError('Invalid industry')
      }
    }

    // Update profile
    const updatedProfile = await this.prisma.employerProfile.update({
      where: { user_id: userId },
      data: {
        company_name: company_name !== undefined ? company_name : undefined,
        company_description: company_description !== undefined ? company_description : undefined,
        website: website !== undefined ? website : undefined,
        industry_id: industry_id !== undefined ? industry_id : undefined,
        company_size: company_size !== undefined ? company_size : undefined,
        location: location !== undefined ? location : undefined,
        logo_url: logo_url !== undefined ? logo_url : undefined
      },
      include: {
        industry: true
      }
    })

    return updatedProfile
  }

  // ========== UPLOAD RESUME ==========
  async uploadResume(userId: string, resumeUrl: string) {
    if (!resumeUrl || !this.isValidUrl(resumeUrl)) {
      throw new ValidationError('Valid resume URL is required')
    }

    const updatedProfile = await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { resume_url: resumeUrl }
    })

    return updatedProfile
  }

  // ========== DELETE RESUME ==========
  async deleteResume(userId: string) {
    const updatedProfile = await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { resume_url: null }
    })

    return updatedProfile
  }

  // ========== UPLOAD COMPANY LOGO ==========
  async uploadCompanyLogo(userId: string, logoUrl: string) {
    if (!logoUrl || !this.isValidUrl(logoUrl)) {
      throw new ValidationError('Valid logo URL is required')
    }

    const updatedProfile = await this.prisma.employerProfile.update({
      where: { user_id: userId },
      data: { logo_url: logoUrl }
    })

    return updatedProfile
  }

  // ========== DELETE COMPANY LOGO ==========
  async deleteCompanyLogo(userId: string) {
    const updatedProfile = await this.prisma.employerProfile.update({
      where: { user_id: userId },
      data: { logo_url: null }
    })

    return updatedProfile
  }

  // ========== UPDATE SKILLS ==========
  async updateSkills(userId: string, skills: string[]) {
    if (!Array.isArray(skills)) {
      throw new ValidationError('Skills must be an array')
    }

    // Clean and validate skills
    const cleanedSkills = skills
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 30) // Max 30 skills

    const updatedProfile = await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { skills: cleanedSkills }
    })

    return updatedProfile
  }

  // ========== ADD SKILL ==========
  async addSkill(userId: string, skill: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const currentSkills = profile.skills || []
    if (currentSkills.includes(skill)) {
      throw new ValidationError('Skill already exists')
    }

    if (currentSkills.length >= 30) {
      throw new ValidationError('Maximum 30 skills allowed')
    }

    const updatedProfile = await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { skills: [...currentSkills, skill] }
    })

    return updatedProfile
  }

  // ========== REMOVE SKILL ==========
  async removeSkill(userId: string, skill: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const currentSkills = profile.skills || []
    const updatedSkills = currentSkills.filter(s => s !== skill)

    const updatedProfile = await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { skills: updatedSkills }
    })

    return updatedProfile
  }

  // ========== ADD EXPERIENCE ==========
  async addExperience(userId: string, experience: Omit<Experience, 'id'>) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    // Validate dates
    if (experience.start_date && experience.end_date && !experience.current) {
      if (new Date(experience.end_date) <= new Date(experience.start_date)) {
        throw new ValidationError('End date must be after start date')
      }
    }

    const currentExperiences = safeJsonParse(profile.experience)
    
    const newExperience = {
      id: Date.now().toString(),
      ...experience,
      end_date: experience.current ? null : experience.end_date
    }

    currentExperiences.push(newExperience)
    currentExperiences.sort((a: Experience, b: Experience) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    )

    await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { experience: JSON.stringify(currentExperiences) }
    })

    return newExperience
  }

  // ========== UPDATE EXPERIENCE ==========
  async updateExperience(userId: string, experienceId: string, experienceData: Partial<Experience>) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const experiences = safeJsonParse(profile.experience)
    const experienceIndex = experiences.findIndex((exp: Experience) => exp.id === experienceId)

    if (experienceIndex === -1) {
      throw new NotFoundError('Experience')
    }

    experiences[experienceIndex] = {
      ...experiences[experienceIndex],
      ...experienceData,
      end_date: experienceData.current ? null : (experienceData.end_date || experiences[experienceIndex].end_date)
    }

    await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { experience: JSON.stringify(experiences) }
    })

    return experiences[experienceIndex]
  }

  // ========== DELETE EXPERIENCE ==========
  async deleteExperience(userId: string, experienceId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const experiences = safeJsonParse(profile.experience)
    const filteredExperiences = experiences.filter((exp: Experience) => exp.id !== experienceId)

    await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { experience: JSON.stringify(filteredExperiences) }
    })

    return { message: 'Experience deleted successfully' }
  }

  // ========== ADD EDUCATION ==========
  async addEducation(userId: string, education: Omit<Education, 'id'>) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const currentEducations = safeJsonParse(profile.education)
    
    const newEducation = {
      id: Date.now().toString(),
      ...education,
      end_date: education.current ? null : education.end_date
    }

    currentEducations.push(newEducation)
    currentEducations.sort((a: Education, b: Education) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    )

    await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { education: JSON.stringify(currentEducations) }
    })

    return newEducation
  }

  // ========== UPDATE EDUCATION ==========
  async updateEducation(userId: string, educationId: string, educationData: Partial<Education>) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const educations = safeJsonParse(profile.education)
    const educationIndex = educations.findIndex((edu: Education) => edu.id === educationId)

    if (educationIndex === -1) {
      throw new NotFoundError('Education')
    }

    educations[educationIndex] = {
      ...educations[educationIndex],
      ...educationData,
      end_date: educationData.current ? null : (educationData.end_date || educations[educationIndex].end_date)
    }

    await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { education: JSON.stringify(educations) }
    })

    return educations[educationIndex]
  }

  // ========== DELETE EDUCATION ==========
  async deleteEducation(userId: string, educationId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    })

    if (!profile) {
      throw new NotFoundError('Job seeker profile')
    }

    const educations = safeJsonParse(profile.education)
    const filteredEducations = educations.filter((edu: Education) => edu.id !== educationId)

    await this.prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { education: JSON.stringify(filteredEducations) }
    })

    return { message: 'Education deleted successfully' }
  }

  // ========== GET PUBLIC PROFILE ==========
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: {
          include: {
            industry: true
          }
        }
      }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    const profileType = user.user_type.type_name
    let profileData: any = {}

    if (profileType === 'Job Seeker' && user.seeker_profile) {
      profileData = { ...user.seeker_profile }
      if (user.seeker_profile.experience) {
        try {
          profileData.experience = safeJsonParse(user.seeker_profile.experience)
        } catch {
          profileData.experience = []
        }
      }
      if (user.seeker_profile.education) {
        try {
          profileData.education = safeJsonParse(user.seeker_profile.education)
        } catch {
          profileData.education = []
        }
      }
      // Remove sensitive info for public view
      delete profileData.phone
      delete profileData.resume_url
    } else if (profileType === 'Employer' && user.employer_profile) {
      profileData = { ...user.employer_profile }
    }

    return {
      id: user.id,
      user_type: profileType,
      profile: profileData,
      created_at: user.created_at
    }
  }

  // ========== GET PROFILE COMPLETION ==========
  async getProfileCompletion(userId: string): Promise<ProfileCompletion> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    const profileType = user.user_type.type_name
    const completion = await this.getProfileCompletionPercentage(userId, profileType)

    return completion
  }

  private async getProfileCompletionPercentage(userId: string, profileType: string): Promise<ProfileCompletion> {
    if (profileType === 'Job Seeker') {
      const profile = await this.prisma.jobSeekerProfile.findUnique({
        where: { user_id: userId }
      })

      if (!profile) {
        return {
          percentage: 0,
          completed_fields: [],
          missing_fields: ['full_name', 'phone', 'location', 'skills', 'resume_url'],
          sections: []
        }
      }

      const fields = {
        full_name: !!profile.full_name,
        phone: !!profile.phone,
        location: !!profile.location,
        skills: profile.skills && profile.skills.length > 0,
        resume_url: !!profile.resume_url
      }

      const completedFields = Object.keys(fields).filter(key => fields[key as keyof typeof fields])
      const missingFields = Object.keys(fields).filter(key => !fields[key as keyof typeof fields])
      const percentage = Math.round((completedFields.length / Object.keys(fields).length) * 100)

      const sections = [
        {
          section: 'Basic Information',
          completed: [fields.full_name].filter(Boolean).length,
          total: 1,
          percentage: fields.full_name ? 100 : 0
        },
        {
          section: 'Contact Details',
          completed: [fields.phone, fields.location].filter(Boolean).length,
          total: 2,
          percentage: Math.round(([fields.phone, fields.location].filter(Boolean).length / 2) * 100)
        },
        {
          section: 'Professional Details',
          completed: [fields.skills].filter(Boolean).length,
          total: 1,
          percentage: fields.skills ? 100 : 0
        },
        {
          section: 'Documents',
          completed: [fields.resume_url].filter(Boolean).length,
          total: 1,
          percentage: fields.resume_url ? 100 : 0
        }
      ]

      return {
        percentage,
        completed_fields: completedFields,
        missing_fields: missingFields,
        sections
      }
    } else {
      const profile = await this.prisma.employerProfile.findUnique({
        where: { user_id: userId }
      })

      if (!profile) {
        return {
          percentage: 0,
          completed_fields: [],
          missing_fields: ['company_name', 'company_description', 'industry_id', 'location'],
          sections: []
        }
      }

      const fields = {
        company_name: !!profile.company_name,
        company_description: !!profile.company_description,
        industry_id: !!profile.industry_id,
        location: !!profile.location,
        website: !!profile.website,
        logo_url: !!profile.logo_url,
        company_size: !!profile.company_size
      }

      const completedFields = Object.keys(fields).filter(key => fields[key as keyof typeof fields])
      const missingFields = Object.keys(fields).filter(key => !fields[key as keyof typeof fields])
      const percentage = Math.round((completedFields.length / Object.keys(fields).length) * 100)

      const sections = [
        {
          section: 'Company Information',
          completed: [fields.company_name, fields.company_description, fields.industry_id].filter(Boolean).length,
          total: 3,
          percentage: Math.round(([fields.company_name, fields.company_description, fields.industry_id].filter(Boolean).length / 3) * 100)
        },
        {
          section: 'Location',
          completed: [fields.location].filter(Boolean).length,
          total: 1,
          percentage: fields.location ? 100 : 0
        },
        {
          section: 'Branding & Details',
          completed: [fields.website, fields.logo_url, fields.company_size].filter(Boolean).length,
          total: 3,
          percentage: Math.round(([fields.website, fields.logo_url, fields.company_size].filter(Boolean).length / 3) * 100)
        }
      ]

      return {
        percentage,
        completed_fields: completedFields,
        missing_fields: missingFields,
        sections
      }
    }
  }

  // ========== HELPER METHODS ==========
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

// ========== DEFAULT EXPORT ==========
export default new ProfileService()