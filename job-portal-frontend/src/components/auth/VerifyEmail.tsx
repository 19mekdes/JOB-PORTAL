/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react'
import api from '../../services/api'

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    if (token) {
      verifyEmail()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    let interval: number
    if (isSuccess && redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            navigate('/login')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isSuccess, navigate, redirectCountdown])

  const verifyEmail = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await api.get(`/auth/verify-email/${token}`)
      setIsSuccess(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email verification failed. The link may be invalid or expired.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      setError('Please enter a valid email address')
      return
    }
    
    setIsResending(true)
    setError(null)
    setResendSuccess(false)
    
    try {
      await api.post('/auth/resend-verification', { email: resendEmail })
      setResendSuccess(true)
      
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  // Success State with Progress Bar
  if (isSuccess) {
    const progressPercentage = ((5 - redirectCountdown) / 5) * 100
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Thank you for verifying your email address. You can now access all features of your account.
            </p>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Redirecting to login</span>
                <span>{redirectCountdown} seconds</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-2 transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login">
              <Button>Go to Login Now</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Loading State
  if (isLoading && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Verification Failed</CardTitle>
          <CardDescription>
            Unable to verify your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'The verification link is invalid or has expired.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Need a new verification link?
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Enter your email address and we'll send you a new verification link.
              </p>
            </div>

            {resendSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Verification email sent! Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleResendVerification} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={isResending || resendCooldown > 0}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isResending || resendCooldown > 0}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </form>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-700 font-semibold mb-2">📧 Having trouble?</p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>Add noreply@jobportal.com to your contacts</li>
                <li>Make sure you entered the correct email address</li>
                <li>The verification link expires after 24 hours</li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
          <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500">
            Don't have an account? Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default VerifyEmail