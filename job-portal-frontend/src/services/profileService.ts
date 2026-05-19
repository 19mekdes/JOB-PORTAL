/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './api'

// ========== TYPES ==========
export interface SeekerProfile {
  id: string
  full_name: string
  phone: string | null
  location: string | null
  skills: string[]
  experience: any[] | string | null
  education: any[] | string | null
  bio: string | null
  title: string | null
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  availability: string | null
  created_at: string
  updated_at: string
}

export interface EmployerProfile {
  id: string
  company_name: string
  company_description: string | null
  website: string | null
  logo_url: string | null
  industry_id: number
  industry?: {
    id: number
    industry_name: string
  }
  company_size: string | null
  location: string | null
  phone: string | null
  founded_year: number | null
  headquarters: string | null
  social_links?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
  }
  created_at: string
  updated_at: string
}

export interface ProfileResponse {
  user: {
    id: string
    email: string
    user_type: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  profile: SeekerProfile | EmployerProfile
  completion?: {
    percentage: number
    completed_fields: string[]
    missing_fields: string[]
  }
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

// ========== PROFILE SERVICES ==========

// Get current user's profile
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get('/profile/me')
  return response.data.data
}

// Update job seeker profile
export const updateSeekerProfile = async (data: Partial<SeekerProfile>): Promise<SeekerProfile> => {
  const response = await api.put('/profile/seeker', data)
  return response.data.data
}

// Update employer profile
export const updateEmployerProfile = async (data: Partial<EmployerProfile>): Promise<EmployerProfile> => {
  const response = await api.put('/profile/employer', data)
  return response.data.data
}

// Upload resume
export const uploadResume = async (resumeUrl: string): Promise<SeekerProfile> => {
  const response = await api.post('/profile/seeker/resume', { resume_url: resumeUrl })
  return response.data.data
}

// Delete resume
export const deleteResume = async (): Promise<SeekerProfile> => {
  const response = await api.delete('/profile/seeker/resume')
  return response.data.data
}

// Upload company logo
export const uploadCompanyLogo = async (logoUrl: string): Promise<EmployerProfile> => {
  const response = await api.post('/profile/employer/logo', { logo_url: logoUrl })
  return response.data.data
}

// Delete company logo
export const deleteCompanyLogo = async (): Promise<EmployerProfile> => {
  const response = await api.delete('/profile/employer/logo')
  return response.data.data
}

// Update skills
export const updateSkills = async (skills: string[]): Promise<SeekerProfile> => {
  const response = await api.put('/profile/seeker/skills', { skills })
  return response.data.data
}

// Add a skill
export const addSkill = async (skill: string): Promise<SeekerProfile> => {
  const response = await api.post('/profile/seeker/skills', { skill })
  return response.data.data
}

// Remove a skill
export const removeSkill = async (skill: string): Promise<SeekerProfile> => {
  const response = await api.delete(`/profile/seeker/skills/${encodeURIComponent(skill)}`)
  return response.data.data
}

// Add experience
export const addExperience = async (experience: Omit<Experience, 'id'>): Promise<Experience> => {
  const response = await api.post('/profile/seeker/experience', experience)
  return response.data.data.experience
}

// Update experience
export const updateExperience = async (id: string, experience: Partial<Experience>): Promise<Experience> => {
  const response = await api.put(`/profile/seeker/experience/${id}`, experience)
  return response.data.data
}

// Delete experience
export const deleteExperience = async (id: string): Promise<void> => {
  await api.delete(`/profile/seeker/experience/${id}`)
}

// Add education
export const addEducation = async (education: Omit<Education, 'id'>): Promise<Education> => {
  const response = await api.post('/profile/seeker/education', education)
  return response.data.data.education
}

// Update education
export const updateEducation = async (id: string, education: Partial<Education>): Promise<Education> => {
  const response = await api.put(`/profile/seeker/education/${id}`, education)
  return response.data.data
}

// Delete education
export const deleteEducation = async (id: string): Promise<void> => {
  await api.delete(`/profile/seeker/education/${id}`)
}

// Get public profile by user ID
export const getPublicProfile = async (userId: string): Promise<ProfileResponse> => {
  const response = await api.get(`/profile/public/${userId}`)
  return response.data.data
}

// Get job seeker profile by ID (for employers)
export const getSeekerProfileById = async (seekerId: string): Promise<SeekerProfile> => {
  const response = await api.get(`/profile/seeker/${seekerId}`)
  return response.data.data
}

// Get employer profile by ID (for job seekers)
export const getEmployerProfileById = async (employerId: string): Promise<EmployerProfile> => {
  const response = await api.get(`/profile/employer/${employerId}`)
  return response.data.data
}

// Get profile completion percentage
export const getProfileCompletion = async (): Promise<{
  percentage: number
  completed_fields: string[]
  missing_fields: string[]
  sections: Array<{
    section: string
    completed: number
    total: number
    percentage: number
  }>
}> => {
  const response = await api.get('/profile/me/completion')
  return response.data.data
}

// ========== HELPER FUNCTIONS ==========

// Calculate profile completion percentage
export const calculateCompletionPercentage = (profile: SeekerProfile | EmployerProfile, userType: string): number => {
  if (userType === 'Job Seeker') {
    const seekerProfile = profile as SeekerProfile
    let completed = 0
    const total = 9
    
    if (seekerProfile.full_name) completed++
    if (seekerProfile.title) completed++
    if (seekerProfile.bio) completed++
    if (seekerProfile.skills && seekerProfile.skills.length > 0) completed++
    if (seekerProfile.experience && (seekerProfile.experience as any[]).length > 0) completed++
    if (seekerProfile.education && (seekerProfile.education as any[]).length > 0) completed++
    if (seekerProfile.resume_url) completed++
    if (seekerProfile.phone) completed++
    if (seekerProfile.location) completed++
    
    return Math.round((completed / total) * 100)
  } else {
    const employerProfile = profile as EmployerProfile
    let completed = 0
    const total = 7
    
    if (employerProfile.company_name) completed++
    if (employerProfile.company_description) completed++
    if (employerProfile.website) completed++
    if (employerProfile.logo_url) completed++
    if (employerProfile.location) completed++
    if (employerProfile.industry_id) completed++
    if (employerProfile.company_size) completed++
    
    return Math.round((completed / total) * 100)
  }
}

// Parse experience JSON to array
export const parseExperience = (experience: string | null): Experience[] => {
  if (!experience) return []
  try {
    return JSON.parse(experience)
  } catch {
    return []
  }
}

// Parse education JSON to array
export const parseEducation = (education: string | null): Education[] => {
  if (!education) return []
  try {
    return JSON.parse(education)
  } catch {
    return []
  }
}

// Stringify experience array to JSON
export const stringifyExperience = (experience: Experience[]): string => {
  return JSON.stringify(experience)
}

// Stringify education array to JSON
export const stringifyEducation = (education: Education[]): string => {
  return JSON.stringify(education)
}

// Get experience duration in years/months
export const getExperienceDuration = (experience: Experience): string => {
  const start = new Date(experience.start_date)
  const end = experience.current ? new Date() : (experience.end_date ? new Date(experience.end_date) : null)
  
  if (!end) return ''
  
  const years = end.getFullYear() - start.getFullYear()
  const months = end.getMonth() - start.getMonth()
  
  let duration = ''
  if (years > 0) duration += `${years} year${years > 1 ? 's' : ''} `
  if (months > 0) duration += `${months} month${months > 1 ? 's' : ''}`
  
  return duration.trim() || 'Less than a month'
}

// Get education date range
export const getEducationDateRange = (education: Education): string => {
  const start = new Date(education.start_date).getFullYear()
  const end = education.current ? 'Present' : (education.end_date ? new Date(education.end_date).getFullYear() : '')
  return `${start} - ${end}`
}

// Check if profile is complete enough for job applications
export const isProfileReadyForApplications = (profile: SeekerProfile): boolean => {
  return !!(
    profile.full_name &&
    profile.resume_url &&
    profile.skills &&
    profile.skills.length > 0
  )
}

// Get missing profile fields
export const getMissingProfileFields = (profile: SeekerProfile): string[] => {
  const missing: string[] = []
  if (!profile.full_name) missing.push('Full Name')
  if (!profile.title) missing.push('Professional Title')
  if (!profile.bio) missing.push('Bio')
  if (!profile.skills || profile.skills.length === 0) missing.push('Skills')
  if (!profile.resume_url) missing.push('Resume')
  if (!profile.phone) missing.push('Phone Number')
  if (!profile.location) missing.push('Location')
  return missing
}

// Get profile summary for display
export const getProfileSummary = (profile: SeekerProfile | EmployerProfile, userType: string): string => {
  if (userType === 'Job Seeker') {
    const seekerProfile = profile as SeekerProfile
    const experienceCount = (seekerProfile.experience as any[])?.length || 0
    const educationCount = (seekerProfile.education as any[])?.length || 0
    const skillCount = seekerProfile.skills?.length || 0
    
    return `${experienceCount} years experience • ${educationCount} degrees • ${skillCount} skills`
  } else {
    const employerProfile = profile as EmployerProfile
    return `${employerProfile.company_size || 'Company'} • ${employerProfile.location || 'Location not specified'}`
  }
}

const profileService = {
  // Profile CRUD
  getProfile,
  updateSeekerProfile,
  updateEmployerProfile,
  getPublicProfile,
  getSeekerProfileById,
  getEmployerProfileById,
  getProfileCompletion,
  
  // Resume
  uploadResume,
  deleteResume,
  
  // Company Logo
  uploadCompanyLogo,
  deleteCompanyLogo,
  
  // Skills
  updateSkills,
  addSkill,
  removeSkill,
  
  // Experience
  addExperience,
  updateExperience,
  deleteExperience,
  
  // Education
  addEducation,
  updateEducation,
  deleteEducation,
  
  // Helpers
  calculateCompletionPercentage,
  parseExperience,
  parseEducation,
  stringifyExperience,
  stringifyEducation,
  getExperienceDuration,
  getEducationDateRange,
  isProfileReadyForApplications,
  getMissingProfileFields,
  getProfileSummary
}

export default profileService