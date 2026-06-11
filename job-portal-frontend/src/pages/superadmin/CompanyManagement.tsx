/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/superadmin/CompanyManagement.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, Trash2, MoreVertical, Shield,
  CheckCircle, XCircle, RefreshCw, AlertCircle,
  Building, Briefcase, Eye, MapPin, Phone, Globe, Calendar, Users
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'

interface Company {
  id: string
  user_id: string
  company_name: string
  company_description: string | null
  website: string | null
  location: string | null
  company_size: string | null
  logo_url: string | null
  is_verified: boolean
  is_active: boolean
  created_at: string
  industry_name: string | null
  email: string
  phone: string | null
  jobs_count: number
}

const getDemoCompanies = (): Company[] => [
  {
    id: 'demo-1',
    user_id: 'user-1',
    company_name: 'Demo Company One',
    company_description: 'Leading demo technology provider.',
    website: 'https://demo-one.example.com',
    location: 'Remote',
    company_size: '50-100',
    logo_url: null,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    industry_name: 'Technology',
    email: 'contact@demoone.example.com',
    phone: '123-456-7890',
    jobs_count: 12
  },
  {
    id: 'demo-2',
    user_id: 'user-2',
    company_name: 'Demo Company Two',
    company_description: 'Global demo staffing solutions.',
    website: 'https://demo-two.example.com',
    location: 'New York, NY',
    company_size: '100-500',
    logo_url: null,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    industry_name: 'Recruitment',
    email: 'hello@demotwo.example.com',
    phone: '987-654-3210',
    jobs_count: 8
  }
]

// Helper function to get token
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('token') || 
                localStorage.getItem('admin_token') || 
                localStorage.getItem('accessToken') ||
                sessionStorage.getItem('token')
  
  if (!token) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return user.token || user.accessToken || null
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }
  }
  
  return token
}

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVerification, setFilterVerification] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // API helper function
  const apiRequest = async (method: string, url: string, data?: any) => {
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.')
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data)
    }
    
    console.log(`Making ${method} request to: ${url}`)
    const response = await fetch(`${API_BASE_URL}${url}`, options)
    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.message || result.error || 'API Error')
    }
    return result
  }



  // Fetch companies from backend
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Please login first.')
      }

      console.log('Fetching companies from /super-admin/companies...')
      
      const response = await apiRequest('GET', '/super-admin/companies')
      console.log('API Response:', response)
      
      let allCompanies: any[] = []
      if (response.data && Array.isArray(response.data)) {
        allCompanies = response.data
      } else if (response.companies && Array.isArray(response.companies)) {
        allCompanies = response.companies
      } else if (Array.isArray(response)) {
        allCompanies = response
      }
      
      if (allCompanies.length > 0) {
        setCompanies(allCompanies)
      } else {
        setCompanies(getDemoCompanies())
        setError('Using demo data - Backend not fully configured')
      }
      
    } catch (err: any) {
      console.error('Failed to fetch companies:', err)
      setCompanies(getDemoCompanies())
      setError('Using demo data - ' + (err.message || 'Backend not available'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Toggle menu
  const toggleMenu = (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === companyId ? null : companyId)
  }

  // Verify company
  const handleVerifyCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/super-admin/companies/${selectedCompany.id}/verify`, {})
      toast({ title: "Success", description: `${selectedCompany.company_name} has been verified!` })
      setIsVerifyDialogOpen(false)
      setOpenMenuId(null)
      fetchCompanies()
    } catch (err: any) {
      setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, is_verified: true } : c))
      toast({ title: "Success (Demo)", description: `${selectedCompany.company_name} has been verified!` })
      setIsVerifyDialogOpen(false)
      setOpenMenuId(null)
    } finally {
      setSubmitting(false)
    }
  }

  // Suspend company
  const handleSuspendCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/super-admin/companies/${selectedCompany.id}/status`, { status: 'suspended' })
      toast({ title: "Success", description: `${selectedCompany.company_name} has been suspended` })
      setIsSuspendDialogOpen(false)
      setOpenMenuId(null)
      fetchCompanies()
    } catch (err: any) {
      setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, is_active: false } : c))
      toast({ title: "Success (Demo)", description: `${selectedCompany.company_name} has been suspended` })
      setIsSuspendDialogOpen(false)
      setOpenMenuId(null)
    } finally {
      setSubmitting(false)
    }
  }

  // Activate company
  const handleActivateCompany = async (company: Company) => {
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/super-admin/companies/${company.id}/status`, { status: 'active' })
      toast({ title: "Success", description: `${company.company_name} has been activated` })
      setOpenMenuId(null)
      fetchCompanies()
    } catch (err: any) {
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_active: true } : c))
      toast({ title: "Success (Demo)", description: `${company.company_name} has been activated` })
      setOpenMenuId(null)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete company
  const handleDeleteCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('DELETE', `/super-admin/companies/${selectedCompany.id}`)
      toast({ title: "Success", description: `${selectedCompany.company_name} has been deleted` })
      setIsDeleteDialogOpen(false)
      setOpenMenuId(null)
      fetchCompanies()
    } catch (err: any) {
      setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id))
      toast({ title: "Success (Demo)", description: `${selectedCompany.company_name} has been deleted` })
      setIsDeleteDialogOpen(false)
      setOpenMenuId(null)
    } finally {
      setSubmitting(false)
    }
  }

  const openViewDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsViewDialogOpen(true)
    setOpenMenuId(null)
  }

  const openSuspendDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsSuspendDialogOpen(true)
    setOpenMenuId(null)
  }

  const openVerifyDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsVerifyDialogOpen(true)
    setOpenMenuId(null)
  }

  const openDeleteDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsDeleteDialogOpen(true)
    setOpenMenuId(null)
  }

  const getInitials = (name: string) => {
    if (!name || name === 'Unnamed Company') return 'CO'
    return name.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (is_active: boolean) => {
    if (is_active) {
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
    }
    return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Suspended</Badge>
  }

  const getVerificationBadge = (is_verified: boolean) => {
    if (is_verified) {
      return <Badge className="bg-blue-100 text-blue-700"><Shield className="h-3 w-3 mr-1" /> Verified</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && company.is_active) ||
                         (filterStatus === 'inactive' && !company.is_active)
    const matchesVerification = filterVerification === 'all' ||
                               (filterVerification === 'verified' && company.is_verified) ||
                               (filterVerification === 'unverified' && !company.is_verified)
    return matchesSearch && matchesStatus && matchesVerification
  })

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.is_active).length,
    suspended: companies.filter(c => !c.is_active).length,
    verified: companies.filter(c => c.is_verified).length,
    unverified: companies.filter(c => !c.is_verified).length,
    totalJobs: companies.reduce((sum, c) => sum + (c.jobs_count || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-500 mt-1">Manage employer companies and verification status</p>
        </div>
        <Button variant="outline" onClick={fetchCompanies} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Companies</p><p className="text-2xl font-bold">{stats.total}</p></div>
              <Building className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Suspended</p><p className="text-2xl font-bold text-red-600">{stats.suspended}</p></div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Verified</p><p className="text-2xl font-bold text-purple-600">{stats.verified}</p></div>
              <Shield className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold text-orange-600">{stats.totalJobs}</p></div>
              <Briefcase className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 pb-3">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>All Companies ({filteredCompanies.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search companies..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-9 w-64 border-gray-300" 
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 border-gray-300 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger className="w-36 border-gray-300 bg-white">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert className="m-4 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Industry</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Jobs</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Verification</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-blue-100">
                            {company.logo_url ? <AvatarImage src={company.logo_url} /> : <AvatarFallback className="bg-blue-100 text-blue-600">{getInitials(company.company_name)}</AvatarFallback>}
                          </Avatar>
                          <div>
                            <p className="font-medium">{company.company_name}</p>
                            <p className="text-sm text-gray-500">{company.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{company.industry_name || '-'}</td>
                      <td className="py-3 px-4 text-sm">{company.location || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline" className="bg-blue-50">{company.jobs_count} Jobs</Badge>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(company.is_active)}</td>
                      <td className="py-3 px-4">{getVerificationBadge(company.is_verified)}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(company.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <button
                            onClick={(e) => toggleMenu(company.id, e)}
                            className="inline-flex items-center justify-center rounded-md hover:bg-gray-100 h-8 w-8 p-0 transition-colors"
                            type="button"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          {openMenuId === company.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                              <button
                                onClick={() => openViewDialog(company)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" /> View Details
                              </button>
                              
                              {!company.is_verified && (
                                <button
                                  onClick={() => openVerifyDialog(company)}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                >
                                  <Shield className="h-4 w-4" /> Verify Company
                                </button>
                              )}
                              
                              <div className="border-t border-gray-100 my-1"></div>
                              
                              {company.is_active ? (
                                <button
                                  onClick={() => openSuspendDialog(company)}
                                  className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
                                >
                                  <XCircle className="h-4 w-4" /> Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateCompany(company)}
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" /> Activate
                                </button>
                              )}
                              
                              <div className="border-t border-gray-100 my-1"></div>
                              
                              <button
                                onClick={() => openDeleteDialog(company)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== VIEW COMPANY DETAILS DIALOG ========== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Company Details</DialogTitle>
            <DialogDescription>Detailed information about the company</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              {/* Company Header */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16 bg-blue-100">
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">{getInitials(selectedCompany.company_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCompany.company_name}</h2>
                  <p className="text-gray-600">{selectedCompany.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getVerificationBadge(selectedCompany.is_verified)}
                    {getStatusBadge(selectedCompany.is_active)}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Industry</p><p className="text-sm font-medium">{selectedCompany.industry_name || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium">{selectedCompany.location || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Company Size</p><p className="text-sm font-medium">{selectedCompany.company_size || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium">{selectedCompany.phone || 'Not specified'}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    {selectedCompany.website ? (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{selectedCompany.website}</a>
                    ) : (
                      <p className="text-sm font-medium">Not specified</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Total Jobs</p><p className="text-sm font-medium">{selectedCompany.jobs_count || 0}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div><p className="text-xs text-gray-500">Joined Date</p><p className="text-sm font-medium">{formatDate(selectedCompany.created_at)}</p></div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Company Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedCompany.company_description || 'No description provided'}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <AlertDialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify <span className="font-semibold">{selectedCompany?.company_name}</span>?
              <br />Verified companies receive a trust badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerifyCompany} className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify Company'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend <span className="font-semibold">{selectedCompany?.company_name}</span>?
              <br />Suspended companies cannot post jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendCompany} className="bg-yellow-600 hover:bg-yellow-700" disabled={submitting}>
              {submitting ? 'Suspending...' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold">{selectedCompany?.company_name}</span>
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-red-600 hover:bg-red-700" disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CompanyManagement