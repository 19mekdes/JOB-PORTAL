import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  alternateLink?: {
    text: string
    linkText: string
    to: string
  }
  showLogo?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  alternateLink,
  showLogo = true,
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
      <div className={`${maxWidthClasses[maxWidth]} w-full mx-auto`}>
        {showLogo && (
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <Briefcase className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-gray-900">JobPortal</span>
            </Link>
          </div>
        )}

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