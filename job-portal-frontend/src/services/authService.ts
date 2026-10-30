/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './api'
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}
export interface RegisterData {
  email: string
  password: string
  full_name: string
  user_type: 'Job Seeker' | 'Employer'
  phone?: string
  location?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  new_password: string
}

export interface VerifyEmailData {
  token: string
}

export interface ResendVerificationData {
  email: string
}

export interface RefreshTokenData {
  refresh_token: string
}

export interface AuthResponse {
  success: boolean
  token: string
  refreshToken?: string
  user: {
    id: string
    email: string
    user_type: string
    full_name?: string
    email_verified?: boolean
    profile_completed?: boolean
    [key: string]: any
  }
  message?: string
}

export interface UserProfile {
  id: string
  email: string
  user_type: string
  is_active: boolean
  created_at: string
  updated_at: string
  profile: {
    full_name?: string
    phone?: string
    location?: string
    skills?: string[]
    title?: string
    bio?: string
    company_name?: string
    company_description?: string
    website?: string
    logo_url?: string
  }
}

// ========== AUTH SERVICE ==========
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data)
  return response.data
}
export const login = async (email: string, password: string, rememberMe?: boolean): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password, rememberMe })

  if (rememberMe && response.data.refreshToken) {
    localStorage.setItem('refreshToken', response.data.refreshToken)
  }

  return response.data
}

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
  }
}
export const getMe = async (): Promise<UserProfile> => {
  const response = await api.get('/auth/me')
  return response.data.data
}

export const updateProfile = async (profileData: {
  full_name?: string
  phone?: string
  location?: string
  title?: string
  bio?: string
  skills?: string[]
  company_name?: string
  company_description?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  availability?: string
}): Promise<UserProfile> => {
  const response = await api.put('/auth/profile', profileData)
  return response.data.data
}

export const changePassword = async (current_password: string, new_password: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/change-password', { current_password, new_password })
  return response.data
}
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data
}
export const resetPassword = async (token: string, new_password: string): Promise<{ message: string }> => {
  const response = await api.post(`/auth/reset-password/${token}`, { new_password })
  return response.data
}

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await api.get(`/auth/verify-email/${token}`)
  return response.data
}
export const resendVerification = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/resend-verification', { email })
  return response.data
}

// Refresh access token
export const refreshToken = async (refreshToken: string): Promise<{ token: string }> => {
  const response = await api.post('/auth/refresh-token', { refresh_token: refreshToken })
  return response.data
}

// ========== HELPER FUNCTIONS ==========
export const storeUserData = (user: any, token: string, refreshToken?: string): void => {
  const userData = {
    ...user,
    token
  }
  localStorage.setItem('user', JSON.stringify(userData))
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
}
export const getStoredUser = (): any => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

export const getStoredToken = (): string | null => {
  const user = getStoredUser()
  return user?.token || null
}

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken')
}

export const clearAuthData = (): void => {
  localStorage.removeItem('user')
  localStorage.removeItem('refreshToken')
}

export const isAuthenticated = (): boolean => {
  const token = getStoredToken()
  if (!token) return false


  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}
export const getUserRole = (): string | null => {
  const user = getStoredUser()
  return user?.user_type || null
}

export const hasRole = (role: string | string[]): boolean => {
  const userRole = getUserRole()
  if (!userRole) return false

  if (Array.isArray(role)) {
    return role.includes(userRole)
  }
  return userRole === role
}

export const isJobSeeker = (): boolean => {
  return hasRole('Job Seeker')
}

export const isEmployer = (): boolean => {
  return hasRole('Employer')
}
export const isAdmin = (): boolean => {
  return hasRole(['Admin', 'Super Admin'])
}

export const isSuperAdmin = (): boolean => {
  return hasRole('Super Admin')
}
export const getUserInitials = (): string => {
  const user = getStoredUser()
  if (!user) return 'U'

  if (user.full_name) {
    return user.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return user.email?.charAt(0).toUpperCase() || 'U'
}
export const getUserDisplayName = (): string => {
  const user = getStoredUser()
  if (!user) return 'Guest'
  return user.full_name || user.email?.split('@')[0] || 'User'
}

export const getUserEmail = (): string | null => {
  const user = getStoredUser()
  return user?.email || null
}

export const getUserId = (): string | null => {
  const user = getStoredUser()
  return user?.id || null
}

export const updateStoredUser = (updates: Partial<any>): void => {
  const user = getStoredUser()
  if (user) {
    const updatedUser = { ...user, ...updates }
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }
}

const authService = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshToken,

  // Helper methods
  storeUserData,
  getStoredUser,
  getStoredToken,
  getStoredRefreshToken,
  clearAuthData,
  isAuthenticated,
  getUserRole,
  hasRole,
  isJobSeeker,
  isEmployer,
  isAdmin,
  isSuperAdmin,
  getUserInitials,
  getUserDisplayName,
  getUserEmail,
  getUserId,
  updateStoredUser
}

export default authService