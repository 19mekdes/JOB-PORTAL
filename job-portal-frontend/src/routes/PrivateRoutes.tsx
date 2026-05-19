/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface PrivateRoutesProps {
  allowedRoles?: string[]
  redirectTo?: string
  requireEmailVerification?: boolean
}

const PrivateRoutes: React.FC<PrivateRoutesProps> = ({
  allowedRoles,
  redirectTo = '/login',
  requireEmailVerification = false
}) => {
  const location = useLocation()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />
  }

  // Not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check email verification if required
  if (requireEmailVerification && !user.email_verified) {
    return <Navigate to="/verify-email-pending" state={{ from: location }} replace />
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.user_type)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Authenticated and authorized
  return <Outlet />
}

// Role-specific private route components
export const JobSeekerRoutes: React.FC = () => (
  <PrivateRoutes allowedRoles={['Job Seeker']} />
)

export const EmployerRoutes: React.FC = () => (
  <PrivateRoutes allowedRoles={['Employer']} />
)

export const AdminRoutes: React.FC = () => (
  <PrivateRoutes allowedRoles={['Admin', 'Super Admin']} />
)

export const SuperAdminRoutes: React.FC = () => (
  <PrivateRoutes allowedRoles={['Super Admin']} />
)

// Route guard for authenticated users only (any role)
export const AuthenticatedRoutes: React.FC = () => (
  <PrivateRoutes />
)

// Route guard for non-authenticated users (redirects to dashboard if logged in)
export const PublicRoutes: React.FC = () => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (user) {
    // Redirect to dashboard or intended destination
    const from = (location.state as any)?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

// Conditional route based on user type
interface ConditionalRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export const ConditionalRoute: React.FC<ConditionalRouteProps> = ({
  children,
  allowedRoles,
  fallback = <Navigate to="/unauthorized" replace />
}) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.user_type)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Feature flag route guard
interface FeatureGuardProps {
  children: React.ReactNode
  feature: string
  fallback?: React.ReactNode
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  children,
  feature,
  fallback = <Navigate to="/unauthorized" replace />
}) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Define feature access by role
  const featureAccess: Record<string, string[]> = {
    'post-job': ['Employer', 'Admin', 'Super Admin'],
    'manage-applications': ['Employer', 'Admin', 'Super Admin'],
    'view-analytics': ['Employer', 'Admin', 'Super Admin'],
    'manage-users': ['Admin', 'Super Admin'],
    'system-settings': ['Super Admin'],
    'apply-job': ['Job Seeker', 'Admin', 'Super Admin'],
    'save-job': ['Job Seeker', 'Admin', 'Super Admin'],
    'view-reports': ['Admin', 'Super Admin'],
    'manage-industries': ['Admin', 'Super Admin'],
    'view-audit-logs': ['Super Admin'],
    'manage-backups': ['Super Admin'],
    'view-system-health': ['Super Admin']
  }

  const allowedRoles = featureAccess[feature]
  if (!allowedRoles) {
    return <>{children}</>
  }

  if (!allowedRoles.includes(user.user_type)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Route wrapper for lazy loading
interface LazyRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const LazyRoute: React.FC<LazyRouteProps> = ({ 
  children, 
  fallback = <LoadingSpinner fullScreen /> 
}) => {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  )
}

export default PrivateRoutes