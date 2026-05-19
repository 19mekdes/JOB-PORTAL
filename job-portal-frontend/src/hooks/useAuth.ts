/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '../redux/store'
import {
  login as loginAction,
  logout as logoutAction,
  getMe as getMeAction,
  updateProfile as updateProfileAction,
  changePassword as changePasswordAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  verifyEmail as verifyEmailAction,
  resendVerification as resendVerificationAction,
  reset as resetAuthState
} from '../redux/slices/authSlice'
import { toast } from '@/hooks/use-toast'

interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  user_type: 'Job Seeker' | 'Employer'
  phone?: string
  location?: string
}

interface UpdateProfileData {
  full_name?: string
  phone?: string
  location?: string
  skills?: string[]
  title?: string
  bio?: string
  company_name?: string
  website?: string
}

interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

interface UseAuthReturn {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  message: string
  userType: string | null
  login: (data: LoginData) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  getMe: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<boolean>
  changePassword: (data: ChangePasswordData) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, newPassword: string) => Promise<boolean>
  verifyEmail: (token: string) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  resetError: () => void
  hasRole: (roles: string | string[]) => boolean
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user, isLoading, isError, isSuccess, message } = useSelector((state: RootState) => state.auth)

  const isAuthenticated = !!user
  const userType = user?.user_type || null

  const login = useCallback(async (data: LoginData): Promise<boolean> => {
    try {
      const result = await dispatch(loginAction({ email: data.email, password: data.password })).unwrap()
      
      if (result.user && data.rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else if (!data.rememberMe) {
        localStorage.removeItem('rememberMe')
      }
      
      toast({
        variant: "success",
        title: "Welcome Back!",
        description: `Successfully logged in as ${result.user.full_name || result.user.email}`,
      })
      
      // Redirect based on user type
      if (result.user.user_type === 'Employer') {
        navigate('/employer/dashboard')
      } else if (result.user.user_type === 'Admin' || result.user.user_type === 'Super Admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
      
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password",
      })
      return false
    }
  }, [dispatch, navigate])

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    if (data.password !== data.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Passwords do not match",
      })
      return false
    }

    try {
      
      
      toast({
        variant: "success",
        title: "Registration Successful!",
        description: "Please check your email to verify your account",
      })
      
      navigate('/login')
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Unable to create account",
      })
      return false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, navigate])

  const logout = useCallback(async (): Promise<void> => {
    await dispatch(logoutAction())
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
    navigate('/login')
  }, [dispatch, navigate])

  const getMe = useCallback(async (): Promise<void> => {
    if (user) {
      await dispatch(getMeAction())
    }
  }, [dispatch, user])

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
    try {
      await dispatch(updateProfileAction(data)).unwrap()
      toast({
        variant: "success",
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile",
      })
      return false
    }
  }, [dispatch])

  const changePassword = useCallback(async (data: ChangePasswordData): Promise<boolean> => {
    if (data.new_password !== data.confirm_password) {
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: "New passwords do not match",
      })
      return false
    }

    try {
      await dispatch(changePasswordAction({
        current_password: data.current_password,
        new_password: data.new_password
      })).unwrap()
      
      toast({
        variant: "success",
        title: "Password Changed",
        description: "Your password has been updated successfully",
      })
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: error.message || "Current password is incorrect",
      })
      return false
    }
  }, [dispatch])

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      await dispatch(forgotPasswordAction(email)).unwrap()
      toast({
        variant: "success",
        title: "Email Sent",
        description: "Check your email for password reset instructions",
      })
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message || "Unable to send reset email",
      })
      return false
    }
  }, [dispatch])

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    try {
      await dispatch(resetPasswordAction({ token, new_password: newPassword })).unwrap()
      toast({
        variant: "success",
        title: "Password Reset",
        description: "Your password has been reset. Please login with your new password.",
      })
      navigate('/login')
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Unable to reset password",
      })
      return false
    }
  }, [dispatch, navigate])

  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    try {
      await dispatch(verifyEmailAction(token)).unwrap()
      toast({
        variant: "success",
        title: "Email Verified",
        description: "Your email has been verified successfully",
      })
      navigate('/login')
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification link",
      })
      return false
    }
  }, [dispatch, navigate])

  const resendVerification = useCallback(async (email: string): Promise<boolean> => {
    try {
      await dispatch(resendVerificationAction(email)).unwrap()
      toast({
        variant: "success",
        title: "Email Sent",
        description: "Verification email has been resent",
      })
      return true
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message || "Unable to send verification email",
      })
      return false
    }
  }, [dispatch])

  const resetError = useCallback(() => {
    dispatch(resetAuthState())
  }, [dispatch])

  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!user) return false
    
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(user.user_type)
  }, [user])

  // Check for remembered user on mount
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe')
    if (remembered && user) {
      getMe()
    }
  }, [user, getMe])

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    isSuccess,
    message,
    userType,
    login,
    register,
    logout,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    resetError,
    hasRole
  }
}

// Hook for protected routes
interface UseProtectedRouteReturn {
  isAuthorized: boolean
  isLoading: boolean
  requiredRole?: string | string[]
}

export const useProtectedRoute = (requiredRoles?: string | string[]): UseProtectedRouteReturn => {
  const { isLoading, isAuthenticated, hasRole } = useAuth()
  
  let isAuthorized = false
  
  if (!isLoading) {
    if (!isAuthenticated) {
      isAuthorized = false
    } else if (requiredRoles) {
      isAuthorized = hasRole(requiredRoles)
    } else {
      isAuthorized = true
    }
  }
  
  return {
    isAuthorized,
    isLoading,
    requiredRole: requiredRoles
  }
}

// Hook for checking if user is logged in (simpler version)
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated, isLoading } = useAuth()
  return !isLoading && isAuthenticated
}

// Hook for getting current user type
export const useUserType = (): string | null => {
  const { userType, isLoading } = useAuth()
  return !isLoading ? userType : null
}

// Hook for checking specific user type
export const useIsUserType = (type: string | string[]): boolean => {
  const { hasRole, isLoading } = useAuth()
  return !isLoading && hasRole(type)
}

export default useAuth