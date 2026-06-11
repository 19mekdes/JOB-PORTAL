/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { 
  Search, Briefcase, Users, TrendingUp, Clock, Building2,
  Shield, Sparkles, ArrowRight, Star, CheckCircle, MapPin, DollarSign, Play, Pause
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'

interface Job {
  id: string
  title: string
  location: string
  salary_min: number | null
  salary_max: number | null
  is_remote: boolean
  company_name: string
  company_logo: string | null
  created_at: string
  job_type: string
}

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [, setPopularSearches] = useState<any[]>([])
  const [topCompanies, setTopCompanies] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCompanies: 0,
    totalUsers: 0,
    totalApplications: 0,
    successRate: 92
  })
  const [loading, setLoading] = useState(true)
  const [videoPlaying, setVideoPlaying] = useState(true)

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statsRes, jobsRes, searchesRes, companiesRes] = await Promise.all([
          api.get('/home/stats'),
          api.get('/home/recent-jobs?limit=6'),
          api.get('/popular-searches'),
          api.get('/companies/top?limit=6')
        ])
        
        if (statsRes.data?.success) setStats(statsRes.data.data)
        if (jobsRes.data?.success) setRecentJobs(jobsRes.data.data)
        if (searchesRes.data?.success) setPopularSearches(searchesRes.data.data)
        if (companiesRes.data?.success) setTopCompanies(companiesRes.data.data)
        
      } catch (error) {
        console.error('Failed to fetch home data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllData()
  }, [])

  // ✅ NEW: Function to get correct dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return '/register'
    
    const userType = user.user_type || user.role
    
    switch (userType) {
      case 'Super Admin':
        return '/super-admin/dashboard'
      case 'Admin':
        return '/admin/dashboard'
      case 'Employer':
        return '/employer/dashboard'
      case 'Job Seeker':
        return '/jobseeker/dashboard'
      default:
        return '/dashboard'
    }
  }

  // ✅ NEW: Handle Go to Dashboard click
  const handleGoToDashboard = () => {
    const route = getDashboardRoute()
    navigate(route)
  }

  const handleCompanyClick = (companyName: string) => {
    navigate(`/jobs?search=${encodeURIComponent(companyName)}`)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate('/jobs')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Competitive'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Competitive'
  }

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return 'Recently'
    }
  }

  const getCompanyInitial = (name: string) => {
    if (!name || name === 'Company') return 'C'
    return name.charAt(0).toUpperCase()
  }

  const statsData = [
    { value: stats.totalJobs.toLocaleString(), label: 'Active Jobs', icon: Briefcase, color: 'blue' },
    { value: stats.totalCompanies.toLocaleString(), label: 'Companies', icon: Building2, color: 'green' },
    { value: stats.totalUsers.toLocaleString(), label: 'Job Seekers', icon: Users, color: 'purple' },
    { value: `${stats.successRate}%`, label: 'Success Rate', icon: TrendingUp, color: 'orange' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="relative min-h-[80vh] bg-linear-to-r from-gray-900 to-gray-800">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="text-center">
              <div className="h-8 w-32 sm:w-48 bg-gray-700 rounded-full mx-auto mb-6 animate-pulse"></div>
              <div className="h-12 sm:h-16 w-11/12 sm:w-3/4 bg-gray-700 rounded-lg mx-auto mb-4 animate-pulse"></div>
              <div className="h-8 sm:h-12 w-3/4 sm:w-1/2 bg-gray-700 rounded-lg mx-auto mb-8 animate-pulse"></div>
              <div className="h-14 w-full max-w-3xl mx-auto bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section with Video Background */}
      <section className="relative min-h-[80vh] sm:min-h-[90vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{ opacity: videoPlaying ? 1 : 0.8 }}
          >
            <source src="https://www.pexels.com/download/video/6325851/" type="video/mp4" />
            <img 
              src="https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
              alt="Office background"
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </video>
          
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          {/* Optional: Video control button */}
          <button
            onClick={() => setVideoPlaying(!videoPlaying)}
            className="absolute bottom-6 right-6 z-20 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-all duration-300"
            aria-label={videoPlaying ? "Pause video" : "Play video"}
          >
            {videoPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </button>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 sm:mb-6 bg-white/20 text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline" />
              #1 Job Portal Platform 2026
            </Badge>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-white leading-tight animate-slide-up">
              Find Your
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-white">
                Dream Job Today
              </span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-10 text-gray-200 max-w-2xl mx-auto px-2 animate-slide-up animation-delay-100">
              Connect with {stats.totalCompanies.toLocaleString()}+ top employers and discover opportunities that match your skills
            </p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0 animate-slide-up animation-delay-200">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <input
                    type="text"
                    placeholder="Job title, skills, or company"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm sm:text-base"
                  />
                </div>
                
                <Button 
                  onClick={handleSearch}
                  className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-8 py-3 sm:py-8 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold w-full sm:w-auto transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Find Jobs
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-white text-xs sm:text-sm px-2 animate-slide-up animation-delay-400">
              <div className="flex items-center gap-1 sm:gap-2"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /><span>Verified Companies</span></div>
              <div className="flex items-center gap-1 sm:gap-2"><Shield className="h-3 w-3 sm:h-4 sm:w-4" /><span>Secure Platform</span></div>
              <div className="flex items-center gap-1 sm:gap-2"><Star className="h-3 w-3 sm:h-4 sm:w-4" /><span>4.9/5 Rating</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {statsData.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center group cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="inline-flex p-2 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
                  </div>
                  <p className="text-xl sm:text-4xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 gap-4">
            <div className="text-center sm:text-left">
              <Badge className="mb-3 sm:mb-4 bg-green-100 text-green-700 border-0 px-3 sm:px-4 py-1 text-xs sm:text-sm">Recent Jobs</Badge>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">Latest Opportunities</h2>
              <p className="text-base sm:text-xl text-gray-600 mt-2">Recently posted positions from top companies</p>
            </div>
            <Link to="/jobs" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 text-sm sm:text-base">
              View All Jobs <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500">No jobs available at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentJobs.map((job, idx) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg">
                          {getCompanyInitial(job.company_name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm sm:text-base">{job.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{job.company_name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        {job.is_remote ? 'Remote' : 'Onsite'}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="line-clamp-1">{job.is_remote ? 'Remote' : job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{getTimeAgo(job.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                      <Badge className="bg-gray-100 text-gray-700 text-xs sm:text-sm">{job.job_type}</Badge>
                      <span className="text-blue-600 text-xs sm:text-sm font-medium group-hover:underline">Apply Now →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Companies Section */}
      {topCompanies.length > 0 && (
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <Badge className="mb-3 sm:mb-4 bg-purple-100 text-purple-700 border-0 px-3 sm:px-4 py-1 text-xs sm:text-sm">Top Employers</Badge>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">Top Companies Hiring</h2>
              <p className="text-base sm:text-xl text-gray-600 mt-2">Click on any company to see their jobs</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {topCompanies.map((company, idx) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanyClick(company.name)}
                  className="cursor-pointer text-left w-full group animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-blue-50">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto bg-linear-to-br from-blue-100 to-blue-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">{getCompanyInitial(company.name)}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-1">{company.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{company.job_count} open positions</p>
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-1 sm:mt-2">
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{company.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ✅ FIXED CTA Section */}
      <section className="py-12 sm:py-20 bg-linear-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Ready to Start Your Journey?</h2>
          <p className="text-base sm:text-xl text-blue-100 mb-6 sm:mb-8">Join {stats.totalUsers.toLocaleString()}+ successful job seekers</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            {!user ? (
              // ✅ User not logged in - Show Register button
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg px-6 sm:px-8 py-3 sm:py-6 text-base sm:text-lg w-full sm:w-auto hover:scale-105 transition-all duration-300">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            ) : (
              // ✅ User logged in - Go to correct dashboard based on role
              <Button 
                size="lg" 
                onClick={handleGoToDashboard}
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg px-6 sm:px-8 py-3 sm:py-6 text-base sm:text-lg w-full sm:w-auto hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-6 text-base sm:text-lg w-full sm:w-auto hover:scale-105 transition-all duration-300">
                Browse Jobs
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-6 text-white/80 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> Free to apply</div>
            <div className="flex items-center gap-1 sm:gap-2"><Shield className="h-3 w-3 sm:h-4 sm:w-4" /> No spam</div>
            <div className="flex items-center gap-1 sm:gap-2"><Star className="h-3 w-3 sm:h-4 sm:w-4" /> Trusted platform</div>
          </div>
        </div>
      </section>

      {/* Animation styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  )
}

export default Home