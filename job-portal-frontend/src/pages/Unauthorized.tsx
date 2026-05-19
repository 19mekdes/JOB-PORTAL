/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Shield,
  ShieldAlert,
  Home,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertTriangle,
  Lock} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RootState } from '@/redux/store'

const Unauthorized: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)

  const suggestedActions = [
    {
      title: 'Go to Dashboard',
      description: 'Return to your dashboard',
      action: () => navigate('/dashboard'),
      icon: Home,
      variant: 'default'
    },
    {
      title: 'Go Back',
      description: 'Return to previous page',
      action: () => navigate(-1),
      icon: ArrowLeft,
      variant: 'outline'
    }
  ]

  const authActions = !user ? [
    {
      title: 'Login to Your Account',
      description: 'Sign in to access restricted content',
      action: () => navigate('/login'),
      icon: LogIn,
      variant: 'default'
    },
    {
      title: 'Create an Account',
      description: 'Register for full access',
      action: () => navigate('/register'),
      icon: UserPlus,
      variant: 'outline'
    }
  ] : []

  const allActions = [...suggestedActions, ...authActions]

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Graphic */}
        <div className="relative mb-8">
          <div className="flex justify-center">
            <div className="relative">
              <ShieldAlert className="h-32 w-32 text-red-500 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Lock className="h-8 w-8 text-red-600 animate-bounce" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-red-300 opacity-50" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-2 max-w-md mx-auto">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          {user 
            ? `Your role (${user.user_type}) does not have the required permissions.`
            : 'Please login with an account that has the necessary permissions.'}
        </p>

        {/* Required Permissions Info */}
        <Card className="max-w-md mx-auto mb-8 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Required Access Level
                </p>
                <p className="text-xs text-red-700">
                  This area requires higher privileges than your current account provides.
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {allActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                onClick={action.action}
                variant={action.variant as any}
                className="min-w-[160px]"
              >
                <Icon className="h-4 w-4 mr-2" />
                {action.title}
              </Button>
            )
          })}
        </div>

        {/* Help Section */}
        <div className="border-t pt-6">
          <p className="text-sm text-gray-500">
            Need access?{' '}
            <button 
              onClick={() => navigate('/contact')} 
              className="text-blue-600 hover:underline font-medium"
            >
              Contact Administrator
            </button>
          </p>
          {user && (
            <p className="text-xs text-gray-400 mt-2">
              Logged in as: <span className="font-mono">{user.email}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Unauthorized