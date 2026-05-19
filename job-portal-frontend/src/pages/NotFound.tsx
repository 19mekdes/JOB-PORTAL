import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Briefcase,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  const suggestedPages = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/profile', label: 'My Profile', icon: Home },
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Graphic */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[180px] font-bold leading-none">
            <span className="text-gray-200">4</span>
            <span className="text-blue-500 animate-bounce inline-block">0</span>
            <span className="text-gray-200">4</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for jobs or companies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const searchTerm = (e.target as HTMLInputElement).value
                  if (searchTerm.trim()) {
                    navigate(`/jobs?q=${encodeURIComponent(searchTerm)}`)
                  }
                }
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Press Enter to search for jobs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          <Button onClick={() => navigate('/jobs')} variant="outline">
            Browse Jobs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Suggested Pages */}
        <div className="border-t pt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            You might be looking for
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestedPages.map((page) => {
              const Icon = page.icon
              return (
                <button
                  key={page.path}
                  onClick={() => navigate(page.path)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <Icon className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-700">{page.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Need help? <button onClick={() => navigate('/contact')} className="text-blue-600 hover:underline">Contact Support</button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound