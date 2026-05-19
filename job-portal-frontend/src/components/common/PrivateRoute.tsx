import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import LoadingSpinner from './LoadingSpinner'

interface PrivateRouteProps {
  allowedRoles?: string[]
  redirectTo?: string
  children?: React.ReactNode
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  allowedRoles,
  redirectTo = '/login',
  children
}) => {
  const location = useLocation()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // ❌ Role check
  if (allowedRoles && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />
  }

  // ✅ Allow access
  return children ? <>{children}</> : <Outlet />
}

export default PrivateRoute

// ✅ ROLE ROUTES (FIXED)
export const JobSeekerRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['Job Seeker']}>{children}</PrivateRoute>
)

export const EmployerRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['Employer']}>{children}</PrivateRoute>
)

export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['Admin', 'Super Admin']}>{children}</PrivateRoute>
)

export const SuperAdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <PrivateRoute allowedRoles={['Super Admin']}>{children}</PrivateRoute>
)