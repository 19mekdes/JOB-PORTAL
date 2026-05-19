import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

// ========== GET PROFILE ==========
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    const profile = user.seeker_profile || user.employer_profile
    const profileType = user.user_type.type_name

    // Parse JSON fields if they exist for job seeker
    let parsedProfile: any = { ...profile }
    if (profileType === 'Job Seeker' && user.seeker_profile) {
      if (user.seeker_profile.experience) {
        try {
          parsedProfile.experience = JSON.parse(user.seeker_profile.experience)
        } catch {
          parsedProfile.experience = []
        }
      }
      if (user.seeker_profile.education) {
        try {
          parsedProfile.education = JSON.parse(user.seeker_profile.education)
        } catch {
          parsedProfile.education = []
        }
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          user_type: profileType,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        profile: parsedProfile
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPDATE JOB SEEKER PROFILE ==========
export const updateSeekerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      full_name,
      phone,
      location,
      skills,
      experience,
      education,
      resume_url
    } = req.body

    // Check if profile exists
    const existingProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!existingProfile) {
      res.status(404).json({
        success: false,
        message: 'Job seeker profile not found'
      })
      return
    }

    // Update profile
    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
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

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPDATE EMPLOYER PROFILE ==========
export const updateEmployerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      company_name,
      company_description,
      website,
      industry_id,
      company_size,
      location,
      logo_url
    } = req.body

    // Check if profile exists
    const existingProfile = await prisma.employerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!existingProfile) {
      res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    // Update profile
    const updatedProfile = await prisma.employerProfile.update({
      where: { user_id: req.user!.id },
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

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Company profile updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPLOAD RESUME ==========
export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resume_url } = req.body

    if (!resume_url) {
      res.status(400).json({
        success: false,
        message: 'Resume URL is required'
      })
      return
    }

    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { resume_url }
    })

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Resume uploaded successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== DELETE RESUME ==========
export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { resume_url: null }
    })

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Resume deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPDATE SKILLS ==========
export const updateSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skills } = req.body

    if (!skills || !Array.isArray(skills)) {
      res.status(400).json({
        success: false,
        message: 'Skills must be an array'
      })
      return
    }

    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { skills }
    })

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Skills updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== ADD EXPERIENCE ==========
export const addExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, company, location, start_date, end_date, current, description } = req.body

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    const currentExperiences = seekerProfile.experience ? JSON.parse(seekerProfile.experience) : []
    
    const newExperience = {
      id: Date.now().toString(),
      title,
      company,
      location,
      start_date,
      end_date: current ? null : end_date,
      current: current || false,
      description
    }

    currentExperiences.push(newExperience)

    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { experience: JSON.stringify(currentExperiences) }
    })

    res.status(201).json({
      success: true,
      data: { experience: newExperience },
      message: 'Experience added successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPDATE EXPERIENCE ==========
export const updateExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { expId } = req.params
    const { title, company, location, start_date, end_date, current, description } = req.body

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    const currentExperiences = seekerProfile.experience ? JSON.parse(seekerProfile.experience) : []
    const experienceIndex = currentExperiences.findIndex((exp: any) => exp.id === expId)

    if (experienceIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Experience not found'
      })
      return
    }

    currentExperiences[experienceIndex] = {
      ...currentExperiences[experienceIndex],
      title: title || currentExperiences[experienceIndex].title,
      company: company || currentExperiences[experienceIndex].company,
      location: location || currentExperiences[experienceIndex].location,
      start_date: start_date || currentExperiences[experienceIndex].start_date,
      end_date: current ? null : (end_date || currentExperiences[experienceIndex].end_date),
      current: current !== undefined ? current : currentExperiences[experienceIndex].current,
      description: description || currentExperiences[experienceIndex].description
    }

    await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { experience: JSON.stringify(currentExperiences) }
    })

    res.json({
      success: true,
      message: 'Experience updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== DELETE EXPERIENCE ==========
export const deleteExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { expId } = req.params

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    const currentExperiences = seekerProfile.experience ? JSON.parse(seekerProfile.experience) : []
    const filteredExperiences = currentExperiences.filter((exp: any) => exp.id !== expId)

    await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { experience: JSON.stringify(filteredExperiences) }
    })

    res.json({
      success: true,
      message: 'Experience deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== ADD EDUCATION ==========
export const addEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { degree, institution, field_of_study, start_date, end_date, current, grade } = req.body

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    const currentEducations = seekerProfile.education ? JSON.parse(seekerProfile.education) : []
    
    const newEducation = {
      id: Date.now().toString(),
      degree,
      institution,
      field_of_study,
      start_date,
      end_date: current ? null : end_date,
      current: current || false,
      grade
    }

    currentEducations.push(newEducation)

    await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { education: JSON.stringify(currentEducations) }
    })

    res.status(201).json({
      success: true,
      data: { education: newEducation },
      message: 'Education added successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPDATE EDUCATION ==========
export const updateEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eduId } = req.params
    const { degree, institution, field_of_study, start_date, end_date, current, grade } = req.body

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    const currentEducations = seekerProfile.education ? JSON.parse(seekerProfile.education) : []
    const educationIndex = currentEducations.findIndex((edu: any) => edu.id === eduId)

    if (educationIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Education not found'
      })
      return
    }

    currentEducations[educationIndex] = {
      ...currentEducations[educationIndex],
      degree: degree || currentEducations[educationIndex].degree,
      institution: institution || currentEducations[educationIndex].institution,
      field_of_study: field_of_study || currentEducations[educationIndex].field_of_study,
      start_date: start_date || currentEducations[educationIndex].start_date,
      end_date: current ? null : (end_date || currentEducations[educationIndex].end_date),
      current: current !== undefined ? current : currentEducations[educationIndex].current,
      grade: grade || currentEducations[educationIndex].grade
    }

    await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { education: JSON.stringify(currentEducations) }
    })

    res.json({
      success: true,
      message: 'Education updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== DELETE EDUCATION ==========
export const deleteEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eduId } = req.params

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: req.user!.id }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    const currentEducations = seekerProfile.education ? JSON.parse(seekerProfile.education) : []
    const filteredEducations = currentEducations.filter((edu: any) => edu.id !== eduId)

    await prisma.jobSeekerProfile.update({
      where: { user_id: req.user!.id },
      data: { education: JSON.stringify(filteredEducations) }
    })

    res.json({
      success: true,
      message: 'Education deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== UPLOAD COMPANY LOGO ==========
export const uploadCompanyLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { logo_url } = req.body

    if (!logo_url) {
      res.status(400).json({
        success: false,
        message: 'Logo URL is required'
      })
      return
    }

    const updatedProfile = await prisma.employerProfile.update({
      where: { user_id: req.user!.id },
      data: { logo_url }
    })

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Company logo uploaded successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== DELETE COMPANY LOGO ==========
export const deleteCompanyLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updatedProfile = await prisma.employerProfile.update({
      where: { user_id: req.user!.id },
      data: { logo_url: null }
    })

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Company logo deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET PROFILE COMPLETION ==========
export const getProfileCompletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    const profileType = user.user_type.type_name
    let completionPercentage = 0

    if (profileType === 'Job Seeker' && user.seeker_profile) {
      const profile = user.seeker_profile
      let completedFields = 0
      const totalFields = 5

      if (profile.full_name) completedFields++
      if (profile.phone) completedFields++
      if (profile.location) completedFields++
      if (profile.skills && profile.skills.length > 0) completedFields++
      if (profile.resume_url) completedFields++

      completionPercentage = Math.round((completedFields / totalFields) * 100)
    } else if (profileType === 'Employer' && user.employer_profile) {
      const profile = user.employer_profile
      let completedFields = 0
      const totalFields = 6

      if (profile.company_name) completedFields++
      if (profile.company_description) completedFields++
      if (profile.website) completedFields++
      if (profile.logo_url) completedFields++
      if (profile.location) completedFields++
      if (profile.industry_id) completedFields++

      completionPercentage = Math.round((completedFields / totalFields) * 100)
    }

    res.json({
      success: true,
      data: {
        percentage: completionPercentage,
        completed: completionPercentage === 100,
        profile_type: profileType
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET PUBLIC PROFILE ==========
export const getPublicProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
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
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    const profileType = user.user_type.type_name
    let profileData: any = {}

    if (profileType === 'Job Seeker' && user.seeker_profile) {
      profileData = { ...user.seeker_profile }
      if (user.seeker_profile.experience) {
        try {
          profileData.experience = JSON.parse(user.seeker_profile.experience)
        } catch {
          profileData.experience = []
        }
      }
      if (user.seeker_profile.education) {
        try {
          profileData.education = JSON.parse(user.seeker_profile.education)
        } catch {
          profileData.education = []
        }
      }
      // Remove sensitive info
      delete profileData.phone
      delete profileData.resume_url
    } else if (profileType === 'Employer' && user.employer_profile) {
      profileData = { ...user.employer_profile }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        user_type: profileType,
        profile: profileData,
        created_at: user.created_at
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET JOB SEEKER PROFILE BY ID ==========
export const getSeekerProfileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { seekerId } = req.params

    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { id: seekerId },
      include: {
        user: {
          include: {
            user_type: true
          }
        }
      }
    })

    if (!seekerProfile) {
      res.status(404).json({
        success: false,
        message: 'Job seeker profile not found'
      })
      return
    }

    // Parse JSON fields safely
    let parsedExperience = []
    let parsedEducation = []
    
    try {
      if (seekerProfile.experience) {
        parsedExperience = JSON.parse(seekerProfile.experience)
      }
    } catch (e) {
      parsedExperience = []
    }
    
    try {
      if (seekerProfile.education) {
        parsedEducation = JSON.parse(seekerProfile.education)
      }
    } catch (e) {
      parsedEducation = []
    }

    const result = {
      ...seekerProfile,
      experience: parsedExperience,
      education: parsedEducation
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET EMPLOYER PROFILE BY ID ==========
export const getEmployerProfileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employerId } = req.params

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { id: employerId },
      include: {
        user: {
          include: {
            user_type: true
          }
        },
        industry: true,
        jobs: {
          where: { status: { status_name: 'Open' } },
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            employment_type: true,
            _count: {
              select: { applications: true }
            }
          }
        }
      }
    })

    if (!employerProfile) {
      res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      })
      return
    }

    res.json({
      success: true,
      data: employerProfile
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}