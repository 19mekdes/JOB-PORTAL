import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  alternateLink?: {
    text: string
    linkText: string
    to: string
  }
  showBackButton?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  alternateLink,
  showBackButton = true,
  maxWidth = 'md'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button - Top Left */}
      {showBackButton && (
        <div className="fixed top-6 left-6 z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      )}

      <div className={`${maxWidthClasses[maxWidth]} w-full mx-auto`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>

        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10 border border-gray-100">
          {children}
        </div>

        {alternateLink && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {alternateLink.text}{' '}
              <Link to={alternateLink.to} className="font-medium text-blue-600 hover:text-blue-500">
                {alternateLink.linkText}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthLayout