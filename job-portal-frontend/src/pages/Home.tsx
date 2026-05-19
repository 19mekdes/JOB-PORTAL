import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { 
  Search, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Clock,
  Building2,
  Shield,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [searchTerm, setSearchTerm] = useState('')
  const [, setImageLoaded] = useState(false)

  useEffect(() => {
    // Preload background image
    const img = new Image()
    img.src = 'https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2'
    img.onload = () => setImageLoaded(true)
  }, [])

  const features = [
    { icon: <Search className="h-6 w-6" />, title: 'Smart Job Search', description: 'AI-powered job matching with personalized recommendations' },
    { icon: <Clock className="h-6 w-6" />, title: 'Quick Apply', description: 'Apply to multiple jobs with just one click' },
    { icon: <TrendingUp className="h-6 w-6" />, title: 'Career Growth', description: 'Track your applications and career progress' },
    { icon: <Shield className="h-6 w-6" />, title: 'Verified Jobs', description: 'All jobs and companies are vetted for authenticity' }
  ]

  const stats = [
    { value: '10K+', label: 'Active Jobs', icon: Briefcase, trend: '+20%' },
    { value: '5K+', label: 'Companies', icon: Building2, trend: '+15%' },
    { value: '50K+', label: 'Job Seekers', icon: Users, trend: '+35%' },
    { value: '95%', label: 'Success Rate', icon: TrendingUp, trend: '+5%' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2")`,
            backgroundColor: '#1e40af', // Fallback color while image loads
          }}
        >
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-0 px-4 py-2 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              #1 Job Portal Platform 2026
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Find Your
              <span className="block text-blue-200">
                Dream Job Today
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-2xl mx-auto">
              Connect with 5,000+ top employers and discover opportunities that match your skills
            </p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Job title, skills, or company"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                </div>
                <Link to={`/jobs?search=${searchTerm}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-8 rounded-xl text-lg font-semibold w-full sm:w-auto">
                    Search Jobs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-white text-sm">
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /><span>Verified Companies</span></div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>Secure Platform</span></div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4" /><span>4.9/5 Rating</span></div>
              <div className="flex items-center gap-2"><Award className="h-4 w-4" /><span>Best Platform 2024</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center group">
                  <div className="inline-flex p-4 bg-blue-50 rounded-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0 px-4 py-1.5">Why Choose Us</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Smart Features for Your Career</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to accelerate your career growth in one place</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:bg-blue-700 transition-colors text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-0 px-4 py-1.5">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Trusted by thousands of successful job seekers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Senior Software Engineer', company: 'Google', text: 'Found my dream job within 2 weeks! The platform is amazing.', rating: 5 },
              { name: 'Michael Chen', role: 'Product Manager', company: 'Microsoft', text: 'The job matching algorithm is spot on. Highly recommended!', rating: 5 },
              { name: 'Emily Rodriguez', role: 'UX Designer', company: 'Apple', text: 'Best job portal I\'ve ever used. Simple and effective.', rating: 5 }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of successful job seekers and find your dream career</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={!user ? "/register" : "/dashboard"}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg px-8 text-lg">
                {!user ? "Create Free Account" : "Go to Dashboard"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 text-lg">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home