import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../redux/slices/authSlice'
import { AppDispatch, RootState } from '../../redux/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, LogIn, Briefcase } from 'lucide-react'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, isError, message, user } = useSelector((state: RootState) => state.auth)

  // Redirect when user is in Redux state
  React.useEffect(() => {
    console.log('🔍 Login page - user in Redux:', user)
    console.log('🔍 User type:', user?.user_type)
    
    if (user) {
      console.log('✅ User found in Redux, redirecting smoothly...')
      
      // Fixed: Using client-side routing instead of window.location.href to preserve state
      if (user.user_type === 'Super Admin') {
        navigate('/super-admin/dashboard', { replace: true })
      } else if (user.user_type === 'Admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.user_type === 'Employer') {
        navigate('/employer/dashboard', { replace: true })
      } else if (user.user_type === 'Job Seeker') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      return
    }
    
    console.log('🚀 Dispatching login for:', email)
    
    try {
      const result = await dispatch(login({ email, password, rememberMe })).unwrap()
      console.log('✅ Login successful:', result)
      console.log('👤 User:', result.user)
      console.log('📋 User type:', result.user?.user_type)
      
      // The useEffect will handle redirect smoothly when user state updates
    } catch (error) {
      console.error('❌ Login error:', error)
    }
  }

  // Quick fill for testing
  const fillDemoCredentials = (type: string) => {
    switch(type) {
      case 'jobseeker':
        setEmail('seeker@example.com')
        setPassword('password123')
        break
      case 'employer':
        setEmail('employer@example.com')
        setPassword('password123')
        break
      case 'admin':
        setEmail('admin@jobportal.com')
        setPassword('Admin@123')
        break
      case 'superadmin':
        setEmail('superadmin@jobportal.com')
        setPassword('Admin@123')
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {message || 'Invalid email or password'}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="mt-1.5 h-11 rounded-lg"
            />
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-400 mb-2">Quick Test Login</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => fillDemoCredentials('jobseeker')}
              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              👤 Job Seeker
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('employer')}
              className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
            >
              🏢 Employer
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="text-xs px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('superadmin')}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              👑 Super Admin
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login