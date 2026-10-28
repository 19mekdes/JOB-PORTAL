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

const PublicRoutes: React.FC<PublicRoutesProps> = ({
  redirectTo = '/dashboard',
  restricted = true
}) => {
  const location = useLocation()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }


  if (restricted && user) {

    const from = (location.state as any)?.from?.pathname || redirectTo
    return <Navigate to={from} replace />
  }

  return <Outlet />
}


export const OpenRoutes: React.FC = () => {
  const { isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return <LoadingSpinner />
  }

  return <Outlet />
}

export const AuthRoutes: React.FC = () => {
  return <PublicRoutes restricted={true} redirectTo="/dashboard" />
}


export const HomeRoutes: React.FC = () => {
  return <OpenRoutes />
}


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