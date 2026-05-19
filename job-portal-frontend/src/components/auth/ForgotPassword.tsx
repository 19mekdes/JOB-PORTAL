import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Briefcase, Mail, CheckCircle, ArrowLeft, Shield } from 'lucide-react'
import api from '../../services/api'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [touched, setTouched] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEmailValid) {
      setTouched(true)
      return
    }
    
    setIsLoading(true)
    setError(null)
    setRateLimitError(false)
    
    try {
      await api.post('/auth/forgot-password', { email })
      setIsSubmitted(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const status = err.response?.status
      if (status === 429) {
        setRateLimitError(true)
        setError('Too many requests. Please wait 5 minutes before trying again.')
      } else {
        setError(err.response?.data?.message || 'Failed to send reset link. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
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
    
    try {
      await api.post('/auth/forgot-password', { email })
      // Show success message
    } catch (err) {
      console.error('Resend failed:', err)
    }
  }

  // Success State
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to
            </CardDescription>
            <p className="text-sm font-medium text-gray-900 mt-2 bg-gray-50 p-2 rounded">
              {email.replace(/(.{2})(.*)(?=@)/, (_match, p1, p2) => {
                return p1 + '*'.repeat(p2.length)
              })}
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-700">
                <strong>📧 Link expires in:</strong> 1 hour
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <strong>📁 Check spam folder:</strong> If you don't see the email in your inbox
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-700 flex items-start">
                <Shield className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                For security, this link can only be used once and will expire after 1 hour.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : 'Resend Email'
              }
            </Button>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Form State
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Briefcase className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant={rateLimitError ? "default" : "destructive"} className="mb-4">
              <AlertDescription className={rateLimitError ? "text-yellow-700" : ""}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: { target: { value: React.SetStateAction<string> } }) => {
                    setEmail(e.target.value)
                    setTouched(true)
                    setError(null)
                    setRateLimitError(false)
                  }}
                  onBlur={() => setTouched(true)}
                  required
                  disabled={isLoading}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
              {touched && !isEmailValid && email && (
                <p className="text-red-500 text-xs mt-1">
                  Please enter a valid email address (e.g., name@example.com)
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs text-gray-600">
                <strong>💡 Tip:</strong> Use the email address you used to create your account.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isEmailValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500 flex items-center">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Login
          </Link>
          <Link to="/register" className="text-xs text-gray-500 hover:text-gray-700">
            Don't have an account? Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ForgotPassword