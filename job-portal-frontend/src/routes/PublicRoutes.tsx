/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface PublicRoutesProps {
  redirectTo?: string
  restricted?: boolean
}

/**
 * PublicRoutes - Redirects authenticated users away from public pages
 * Use this for pages like login, register, forgot-password
 */
const PublicRoutes: React.FC<PublicRoutesProps> = ({ 
  redirectTo = '/dashboard',
  restricted = true 
}) => {
  const location = useLocation()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  // If user is authenticated and route is restricted, redirect to dashboard
  if (restricted && user) {
    // Get the intended destination or redirect to dashboard
    const from = (location.state as any)?.from?.pathname || redirectTo
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

/**
 * OpenRoutes - Accessible by both authenticated and unauthenticated users
 * Use this for pages like home, jobs, job details, about, contact
 */
export const OpenRoutes: React.FC = () => {
  const { isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  return <Outlet />
}

/**
 * AuthRoutes - Specifically for authentication pages with redirect
 * Use this for login, register, forgot-password
 */
export const AuthRoutes: React.FC = () => {
  return <PublicRoutes restricted={true} redirectTo="/dashboard" />
}

/**
 * HomeRoutes - For landing page and public content
 */
export const HomeRoutes: React.FC = () => {
  return <OpenRoutes />
}

// Component to conditionally show content based on auth status
interface AuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AuthGate: React.FC<AuthGateProps> = ({ children, fallback = null }) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Component to show content only for unauthenticated users
interface UnauthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const UnauthGate: React.FC<UnauthGateProps> = ({ children, fallback = null }) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Component to conditionally show content based on user type
interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export const RoleGate: React.FC<RoleGateProps> = ({ 
  children, 
  allowedRoles, 
  fallback = null 
}) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <>{fallback}</>
  }

  if (!allowedRoles.includes(user.user_type)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Component to show content only for job seekers
interface JobSeekerGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const JobSeekerGate: React.FC<JobSeekerGateProps> = ({ children, fallback = null }) => {
  return (
    <RoleGate allowedRoles={['Job Seeker']} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

// Component to show content only for employers
interface EmployerGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const EmployerGate: React.FC<EmployerGateProps> = ({ children, fallback = null }) => {
  return (
    <RoleGate allowedRoles={['Employer']} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

// Component to show content only for admins
interface AdminGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AdminGate: React.FC<AdminGateProps> = ({ children, fallback = null }) => {
  return (
    <RoleGate allowedRoles={['Admin', 'Super Admin']} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

// Component to show content only for super admins
interface SuperAdminGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const SuperAdminGate: React.FC<SuperAdminGateProps> = ({ children, fallback = null }) => {
  return (
    <RoleGate allowedRoles={['Super Admin']} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

export default PublicRoutes