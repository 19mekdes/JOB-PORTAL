/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from 'react'

// ========== ROUTE TYPES ==========
export interface RouteConfig {
  path: string
  element: ReactNode
  layout?: React.ComponentType<{ children: ReactNode }>
  protected?: boolean
  roles?: Array<'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'>
  children?: RouteConfig[]
  index?: boolean
  redirect?: string
}

export interface BreadcrumbItem {
  label: string
  path: string
  icon?: ReactNode
  active?: boolean
}

// ========== ROUTE PARAMS ==========
export interface JobRouteParams {
  id: string
}

export interface ApplicationRouteParams {
  id: string
}

export interface AdminRouteParams {
  userId?: string
  jobId?: string
  applicationId?: string
}

export interface SuperAdminRouteParams {
  adminId?: string
  backupId?: string
}

// ========== ROUTE QUERY PARAMS ==========
export interface JobsQueryParams {
  q?: string
  location?: string
  type?: string
  industry?: string
  remote?: string
  featured?: string
  date?: string
  sort?: string
  page?: string
  limit?: string
  min_salary?: string
  max_salary?: string
}

export interface ApplicationsQueryParams {
  status?: string
  job_id?: string
  page?: string
  limit?: string
  sort?: string
}

export interface AdminUsersQueryParams {
  search?: string
  user_type?: string
  is_active?: string
  page?: string
  limit?: string
}

export interface AdminJobsQueryParams {
  search?: string
  status?: string
  employer?: string
  page?: string
  limit?: string
}

export interface AuditLogsQueryParams {
  admin_id?: string
  action?: string
  target_type?: string
  start_date?: string
  end_date?: string
  page?: string
  limit?: string
}

// ========== NAVIGATION TYPES ==========
export interface NavItem {
  label: string
  path: string
  icon?: ReactNode
  roles?: Array<'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'>
  children?: NavItem[]
  badge?: number
  exact?: boolean
}

export interface NavGroup {
  label: string
  icon?: ReactNode
  items: NavItem[]
  roles?: Array<'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'>
}

// ========== ROUTE CONSTANTS ==========
export const ROUTES = {
  // Public Routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  JOBS: '/jobs',
  JOB_DETAILS: (id: string) => `/jobs/${id}`,
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: (token: string) => `/reset-password/${token}`,
  VERIFY_EMAIL: (token: string) => `/verify-email/${token}`,
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
  
  // Protected Routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_SETTINGS: '/notifications/settings',
  
  // Job Seeker Routes
  MY_APPLICATIONS: '/jobseeker/applications',
  APPLICATION_STATUS: (id: string) => `/applications/${id}/status`,
  MY_BOOKMARKS: '/jobseeker/bookmarks',
  APPLY_JOB: (jobId: string) => `/apply/${jobId}`,
  
  // Employer Routes
  EMPLOYER_DASHBOARD: '/employer/dashboard',
  EMPLOYER_JOBS: '/employer/jobs',
  EMPLOYER_POST_JOB: '/employer/post-job',
  EMPLOYER_EDIT_JOB: (id: string) => `/employer/jobs/${id}/edit`,
  EMPLOYER_JOB_APPLICATIONS: (jobId: string) => `/employer/jobs/${jobId}/applications`,
  EMPLOYER_APPLICATION_DETAILS: (id: string) => `/employer/applications/${id}`,
  EMPLOYER_PROFILE: '/employer/profile',
  
  // Admin Routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_INDUSTRIES: '/admin/industries',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Super Admin Routes
  SUPER_ADMIN: '/super-admin',
  SUPER_ADMIN_DASHBOARD: '/super-admin/dashboard',
  SUPER_ADMIN_ADMINS: '/super-admin/admins',
  SUPER_ADMIN_AUDIT_LOGS: '/super-admin/audit-logs',
  SUPER_ADMIN_BACKUP: '/super-admin/backup',
  SUPER_ADMIN_HEALTH: '/super-admin/health',
  SUPER_ADMIN_SETTINGS: '/super-admin/settings',
} as const

// ========== NAVIGATION ITEMS ==========
export const NAV_ITEMS: NavItem[] = [
  // Public
  { label: 'Home', path: ROUTES.HOME, exact: true },
  { label: 'Find Jobs', path: ROUTES.JOBS },
  { label: 'About', path: ROUTES.ABOUT },
  { label: 'Contact', path: ROUTES.CONTACT },
  
  // Dashboard (common)
  { label: 'Dashboard', path: ROUTES.DASHBOARD, roles: ['Job Seeker', 'Employer', 'Admin', 'Super Admin'] },
  { label: 'Profile', path: ROUTES.PROFILE, roles: ['Job Seeker', 'Employer', 'Admin', 'Super Admin'] },
  { label: 'Notifications', path: ROUTES.NOTIFICATIONS, roles: ['Job Seeker', 'Employer', 'Admin', 'Super Admin'] },
  
  // Job Seeker
  { label: 'My Applications', path: ROUTES.MY_APPLICATIONS, roles: ['Job Seeker'] },
  { label: 'Saved Jobs', path: ROUTES.MY_BOOKMARKS, roles: ['Job Seeker'] },
  
  // Employer
  { label: 'My Jobs', path: ROUTES.EMPLOYER_JOBS, roles: ['Employer'] },
  { label: 'Post a Job', path: ROUTES.EMPLOYER_POST_JOB, roles: ['Employer'] },
  { label: 'Company Profile', path: ROUTES.EMPLOYER_PROFILE, roles: ['Employer'] },
  
  // Admin
  { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, roles: ['Admin', 'Super Admin'] },
  { label: 'User Management', path: ROUTES.ADMIN_USERS, roles: ['Admin', 'Super Admin'] },
  { label: 'Job Moderation', path: ROUTES.ADMIN_JOBS, roles: ['Admin', 'Super Admin'] },
  { label: 'Industries', path: ROUTES.ADMIN_INDUSTRIES, roles: ['Admin', 'Super Admin'] },
  { label: 'Reports', path: ROUTES.ADMIN_REPORTS, roles: ['Admin', 'Super Admin'] },
  { label: 'Settings', path: ROUTES.ADMIN_SETTINGS, roles: ['Admin', 'Super Admin'] },
  
  // Super Admin
  { label: 'Admin Management', path: ROUTES.SUPER_ADMIN_ADMINS, roles: ['Super Admin'] },
  { label: 'Audit Logs', path: ROUTES.SUPER_ADMIN_AUDIT_LOGS, roles: ['Super Admin'] },
  { label: 'Backup & Restore', path: ROUTES.SUPER_ADMIN_BACKUP, roles: ['Super Admin'] },
  { label: 'System Health', path: ROUTES.SUPER_ADMIN_HEALTH, roles: ['Super Admin'] },
]

// ========== BREADCRUMB MAPPINGS ==========
export const BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  [ROUTES.DASHBOARD]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }],
  [ROUTES.PROFILE]: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Profile', path: ROUTES.PROFILE }
  ],
  [ROUTES.MY_APPLICATIONS]: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'My Applications', path: ROUTES.MY_APPLICATIONS }
  ],
  [ROUTES.EMPLOYER_JOBS]: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'My Jobs', path: ROUTES.EMPLOYER_JOBS }
  ],
  [ROUTES.EMPLOYER_POST_JOB]: [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'My Jobs', path: ROUTES.EMPLOYER_JOBS },
    { label: 'Post a Job', path: ROUTES.EMPLOYER_POST_JOB }
  ],
  [ROUTES.ADMIN_USERS]: [
    { label: 'Admin', path: ROUTES.ADMIN_DASHBOARD },
    { label: 'User Management', path: ROUTES.ADMIN_USERS }
  ],
  [ROUTES.ADMIN_JOBS]: [
    { label: 'Admin', path: ROUTES.ADMIN_DASHBOARD },
    { label: 'Job Moderation', path: ROUTES.ADMIN_JOBS }
  ]
}

// ========== HELPER FUNCTIONS ==========
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getRouteByPath = (_path: string): RouteConfig | undefined => {
  // Find route by path (implementation depends on your route configuration)
  return undefined
}

export const isActiveRoute = (currentPath: string, targetPath: string, exact: boolean = false): boolean => {
  if (exact) {
    return currentPath === targetPath
  }
  return currentPath.startsWith(targetPath)
}

export const getDynamicPath = (path: string, params: Record<string, string>): string => {
  let result = path
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value)
  })
  return result
}

export const getQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const buildUrl = (path: string, params?: Record<string, any>, query?: Record<string, any>): string => {
  let url = path
  if (params) {
    url = getDynamicPath(url, params)
  }
  if (query) {
    url += getQueryString(query)
  }
  return url
}

// ========== ROUTE GUARD TYPES ==========
export interface RouteGuardProps {
  children: ReactNode
  requiredRoles?: Array<'Job Seeker' | 'Employer' | 'Admin' | 'Super Admin'>
  redirectTo?: string
  requireAuth?: boolean
}

export interface RouteGuardState {
  isAuthorized: boolean
  isLoading: boolean
}