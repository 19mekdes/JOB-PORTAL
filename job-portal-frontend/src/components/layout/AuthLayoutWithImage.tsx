import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'

interface AuthLayoutWithImageProps {
  children: ReactNode
  title: string
  subtitle?: string
  image?: string
  alternateLink?: {
    text: string
    linkText: string
    to: string
  }
}

const AuthLayoutWithImage: React.FC<AuthLayoutWithImageProps> = ({
  children,
  title,
  subtitle,
  image = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  alternateLink
}) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-blue-800 opacity-90"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={image}
          alt="Career illustration"
        />
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 text-center">
          <Briefcase className="h-16 w-16 mb-6" />
          <h2 className="text-3xl font-bold mb-4">Find Your Dream Job Today</h2>
          <p className="text-lg">
            Join thousands of professionals who found their perfect career match through JobPortal.
          </p>
          <div className="mt-8 flex space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">10k+</div>
              <div className="text-sm">Job Seekers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5k+</div>
              <div className="text-sm">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">50k+</div>
              <div className="text-sm">Jobs Posted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Logo (mobile only) */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">JobPortal</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card Container */}
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            {children}
          </div>

          {/* Alternate Link */}
          {alternateLink && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {alternateLink.text}{' '}
                <Link
                  to={alternateLink.to}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {alternateLink.linkText}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthLayoutWithImage