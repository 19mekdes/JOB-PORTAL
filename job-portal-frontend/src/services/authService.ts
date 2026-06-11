/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './api'

// ========== TYPES ==========
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

// Register a new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data)
  return response.data
}

// Login user
export const login = async (email: string, password: string, rememberMe?: boolean): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password, rememberMe })
  
  // Store tokens if remember me is enabled
  if (rememberMe && response.data.refreshToken) {
    localStorage.setItem('refreshToken', response.data.refreshToken)
  }
  
  return response.data
}

// Logout user
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Clear local storage regardless of API response
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
  }
}

// Get current user profile
export const getMe = async (): Promise<UserProfile> => {
  const response = await api.get('/auth/me')
  return response.data.data
}

// Update user profile
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

// Change password
export const changePassword = async (current_password: string, new_password: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/change-password', { current_password, new_password })
  return response.data
}

// Forgot password - request reset link
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data
}

// Reset password with token
export const resetPassword = async (token: string, new_password: string): Promise<{ message: string }> => {
  const response = await api.post(`/auth/reset-password/${token}`, { new_password })
  return response.data
}

// Verify email with token
export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await api.get(`/auth/verify-email/${token}`)
  return response.data
}

// Resend verification email
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

// Store user data in localStorage
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

// Get stored user data
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

// Get stored token
export const getStoredToken = (): string | null => {
  const user = getStoredUser()
  return user?.token || null
}

// Get stored refresh token
export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken')
}

// Clear all auth data
export const clearAuthData = (): void => {
  localStorage.removeItem('user')
  localStorage.removeItem('refreshToken')
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getStoredToken()
  if (!token) return false
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}

// Get user role
export const getUserRole = (): string | null => {
  const user = getStoredUser()
  return user?.user_type || null
}

// Check if user has specific role
export const hasRole = (role: string | string[]): boolean => {
  const userRole = getUserRole()
  if (!userRole) return false
  
  if (Array.isArray(role)) {
    return role.includes(userRole)
  }
  return userRole === role
}

// Check if user is job seeker
export const isJobSeeker = (): boolean => {
  return hasRole('Job Seeker')
}

// Check if user is employer
export const isEmployer = (): boolean => {
  return hasRole('Employer')
}

// Check if user is admin
export const isAdmin = (): boolean => {
  return hasRole(['Admin', 'Super Admin'])
}

// Check if user is super admin
export const isSuperAdmin = (): boolean => {
  return hasRole('Super Admin')
}

// Get user initials for avatar
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

// Get user display name
export const getUserDisplayName = (): string => {
  const user = getStoredUser()
  if (!user) return 'Guest'
  return user.full_name || user.email?.split('@')[0] || 'User'
}

// Get user email
export const getUserEmail = (): string | null => {
  const user = getStoredUser()
  return user?.email || null
}

// Get user ID
export const getUserId = (): string | null => {
  const user = getStoredUser()
  return user?.id || null
}

// Update stored user data
export const updateStoredUser = (updates: Partial<any>): void => {
  const user = getStoredUser()
  if (user) {
    const updatedUser = { ...user, ...updates }
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }
}

const authService = {
  // API methods
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