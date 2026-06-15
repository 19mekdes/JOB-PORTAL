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

  console.log('=== PrivateRoute Debug ===')
  console.log('isLoading:', isLoading)
  console.log('user from Redux:', user)
  console.log('user?.user_type:', user?.user_type)
  console.log('allowedRoles:', allowedRoles)
  console.log('location:', location.pathname)
  console.log('localStorage user:', localStorage.getItem('user'))

  if (isLoading) {
    console.log('Still loading, showing spinner')
    return <LoadingSpinner fullScreen text="Checking authentication..." />
  }

  // ❌ Not logged in
  if (!user) {
    console.log('❌ No user found, redirecting to login')
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // ❌ Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.includes(user.user_type)
    console.log(`Role check: user_type=${user.user_type}, allowed=${allowedRoles}, hasAccess=${hasAccess}`)

    if (!hasAccess) {
      console.log(`❌ Role ${user.user_type} not allowed, redirecting to unauthorized`)
      return <Navigate to="/unauthorized" replace />
    }
  }

  console.log('✅ Access granted!')
  //  Allow access
  return children ? <>{children}</> : <Outlet />
}

export default PrivateRoute

//  ROLE ROUTES
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