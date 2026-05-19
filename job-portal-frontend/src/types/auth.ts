/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserType } from './index'

// ========== AUTH STATE ==========
export interface AuthState {
  user: User | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  message: string
}

// ========== USER TYPES ==========
export interface User {
  id: string
  email: string
  user_type: UserType
  full_name?: string
  company_name?: string
  token?: string
  email_verified?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
  last_login?: string
  profile?: any
}

export interface UserProfile {
  id: string
  email: string
  user_type: UserType
  full_name?: string
  phone?: string
  location?: string
  avatar?: string
  title?: string
  bio?: string
  skills?: string[]
  company_name?: string
  company_description?: string
  website?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

// ========== AUTH REQUEST TYPES ==========
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword?: string
  full_name: string
  user_type: 'Job Seeker' | 'Employer'
  phone?: string
  location?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
  confirm_password?: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

// ========== AUTH RESPONSE TYPES ==========
export interface AuthResponse {
  success: boolean
  token: string
  refreshToken?: string
  user: {
    id: string
    email: string
    user_type: UserType
    full_name?: string
    company_name?: string
    email_verified?: boolean
    profile_completed?: boolean
  }
  message?: string
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
}

export interface ResendVerificationResponse {
  success: boolean
  message: string
}

export interface RefreshTokenResponse {
  success: boolean
  token: string
}

// ========== PROFILE UPDATE TYPES ==========
export interface UpdateProfileRequest {
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
}

export interface UpdateProfileResponse {
  success: boolean
  data: UserProfile
  message: string
}

// ========== AUTH VALIDATION TYPES ==========
export interface ValidationError {
  field: string
  message: string
}

export interface AuthValidationErrors {
  email?: string
  password?: string
  confirmPassword?: string
  full_name?: string
  user_type?: string
  phone?: string
  location?: string
  current_password?: string
  new_password?: string
}

// ========== TOKEN TYPES ==========
export interface JwtPayload {
  id: string
  email: string
  user_type: string
  iat: number
  exp: number
}

export interface TokenData {
  token: string
  refreshToken: string
  expiresAt: number
}

// ========== SESSION TYPES ==========
export interface SessionData {
  user: User
  token: string
  refreshToken: string
  expiresAt: number
  rememberMe: boolean
}

// ========== PERMISSION TYPES ==========
export interface Permission {
  resource: string
  actions: string[]
}

export interface RolePermissions {
  'Job Seeker': Permission[]
  Employer: Permission[]
  Admin: Permission[]
  'Super Admin': Permission[]
}

// ========== AUTH CONSTANTS ==========
export const USER_ROLES = {
  JOB_SEEKER: 'Job Seeker',
  EMPLOYER: 'Employer',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.JOB_SEEKER]: 1,
  [USER_ROLES.EMPLOYER]: 2,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.SUPER_ADMIN]: 4
}

// ========== PERMISSIONS MATRIX ==========
export const ROLE_PERMISSIONS: RolePermissions = {
  'Job Seeker': [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'jobs', actions: ['read', 'search', 'apply'] },
    { resource: 'applications', actions: ['create', 'read', 'withdraw'] },
    { resource: 'bookmarks', actions: ['create', 'read', 'delete'] },
    { resource: 'notifications', actions: ['read', 'update'] }
  ],
  Employer: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'jobs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'applications', actions: ['read', 'update', 'create_note'] },
    { resource: 'notifications', actions: ['read', 'update'] }
  ],
  Admin: [
    { resource: 'users', actions: ['read', 'update', 'suspend', 'activate'] },
    { resource: 'jobs', actions: ['read', 'moderate', 'delete'] },
    { resource: 'applications', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'industries', actions: ['read', 'create', 'update'] }
  ],
  'Super Admin': [
    { resource: '*', actions: ['*'] }
  ]
}

// ========== HELPER FUNCTIONS ==========
export const hasPermission = (userRole: UserRole, resource: string, action: string): boolean => {
  if (userRole === USER_ROLES.SUPER_ADMIN) return true
  
  const permissions = ROLE_PERMISSIONS[userRole]
  if (!permissions) return false
  
  return permissions.some(permission => 
    (permission.resource === resource || permission.resource === '*') &&
    (permission.actions.includes(action) || permission.actions.includes('*'))
  )
}

export const isRoleAtLeast = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export const getRoleLevel = (userRole: UserRole): number => {
  return ROLE_HIERARCHY[userRole] || 0
}

export const isValidUserType = (type: string): type is UserRole => {
  return Object.values(USER_ROLES).includes(type as UserRole)
}

// ========== AUTH STORAGE KEYS ==========
export const AUTH_STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  REMEMBER_ME: 'rememberMe'
} as const