/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, Building2, MapPin, Briefcase, Calendar, CheckCircle, 
  Users, Globe, Mail, Star, Award, Clock, DollarSign 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/services/api'

interface Company {
  id: string
  user_id?: string
  company_name: string
  company_description?: string
  website?: string
  location?: string
  company_size?: string
  logo_url?: string
  cover_image?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  email?: string
  phone?: string
  industry?: { industry_name: string } | null
}

interface Job {
  id: string
  title: string
  location: string
  salary_min: number | null
  salary_max: number | null
  is_remote: boolean
  created_at: string
  employment_type: { type_name: string } | null
}

const CompanyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCompanyData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching company with ID:', id)
      
      // Try multiple endpoints
      let response
      
      // Try 1: Direct companies endpoint
      try {
        response = await api.get(`/companies/${id}`)
        console.log('Response from /companies/:id:', response.data)
      } catch (err) {
        console.log('First endpoint failed, trying /employer/company/:id')
        
        // Try 2: Employer company endpoint
        try {
          response = await api.get(`/employer/company/${id}`)
          console.log('Response from /employer/company/:id:', response.data)
        } catch (err2) {
          console.log('Second endpoint failed, trying /super-admin/companies filter')
          
          // Try 3: Get all companies and filter
          const allCompaniesRes = await api.get('/super-admin/companies')
          const companies = allCompaniesRes.data?.data || []
          const foundCompany = companies.find((c: any) => c.id === id || c.user_id === id)
          
          if (foundCompany) {
            console.log('Found company in list:', foundCompany)
            setCompany(foundCompany)
            setJobs([])
            setLoading(false)
            return
          }
          
          throw new Error('Company not found')
        }
      }
      
      if (response?.data?.success && response.data.data) {
        setCompany(response.data.data)
        setJobs(response.data.data.jobs || [])
      } else {
        setError('Company not found')
      }
      
    } catch (error) {
      console.error('Error fetching company:', error)
      setError('Unable to load company details')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Competitive'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Competitive'
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return `${Math.floor(diff / 7)} weeks ago`
  }

  const getInitials = (name: string) => {
    if (!name) return 'C'
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h2>
          <p className="text-gray-500 mb-6">The company you're looking for doesn't exist or has been removed.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/jobs')} className="bg-blue-600 hover:bg-blue-700">
              Browse Jobs
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>

        {/* Company Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {company.cover_image && (
            <div 
              className="h-48 bg-cover bg-center" 
              style={{ backgroundImage: `url(${company.cover_image})` }}
            />
          )}
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo */}
              <div className="w-24 h-24 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.company_name} 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  getInitials(company.company_name)
                )}
              </div>
              
              {/* Company Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.company_name}</h1>
                  {company.is_verified && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  {company.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  {company.industry?.industry_name && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{company.industry.industry_name}</span>
                    </div>
                  )}
                  {company.company_size && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{company.company_size} employees</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(company.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {company.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {company.email && (
                    <a 
                      href={`mailto:${company.email}`} 
                      className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Description */}
        {company.company_description && (
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About {company.company_name}</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{company.company_description}</p>
            </CardContent>
          </Card>
        )}

        {/* Open Positions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Open Positions ({jobs.length})</h2>
            <Link to="/jobs">
              <Button variant="outline" size="sm">View All Jobs</Button>
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No open positions at the moment.</p>
              <p className="text-sm text-gray-400">Check back later for new opportunities!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`}>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all hover:border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.is_remote ? 'Remote' : job.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{getTimeAgo(job.created_at)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyDetailsPage