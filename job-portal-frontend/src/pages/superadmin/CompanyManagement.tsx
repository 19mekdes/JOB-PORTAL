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
  Building, Briefcase, Eye, Mail, Phone, MapPin, Globe, Calendar
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

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
        throw new Error('Please login first. No authentication token found.')
      }

      console.log('Fetching companies from /super-admin/companies...')
      
      // Try the super admin endpoint first
      let response
      try {
        response = await apiRequest('GET', '/super-admin/companies')
      } catch (err: any) {
        console.log('Super admin endpoint failed, trying admin endpoint...')
        response = await apiRequest('GET', '/admin/companies')
      }
      
      console.log('API Response:', response)
      
      let allCompanies: any[] = []
      if (response.data && Array.isArray(response.data)) {
        allCompanies = response.data
      } else if (response.companies && Array.isArray(response.companies)) {
        allCompanies = response.companies
      } else if (Array.isArray(response)) {
        allCompanies = response
      }
      
      console.log(`Total companies found: ${allCompanies.length}`)
      
      // Map to Company interface
      const mappedCompanies: Company[] = allCompanies.map((company: any) => ({
        id: company.id || company.user_id,
        user_id: company.user_id || company.id,
        company_name: company.company_name || company.name || 'Unnamed Company',
        company_description: company.company_description || company.description || null,
        website: company.website || null,
        location: company.location || null,
        company_size: company.company_size || company.size || null,
        logo_url: company.logo_url || null,
        is_verified: company.is_verified || false,
        is_active: company.is_active !== undefined ? company.is_active : true,
        created_at: company.created_at || new Date().toISOString(),
        industry_name: company.industry_name || company.industry || null,
        email: company.email,
        phone: company.phone || null,
        jobs_count: company.jobs_count || company.jobCount || 0
      }))
      
      setCompanies(mappedCompanies)
      
    } catch (err: any) {
      console.error('Failed to fetch companies:', err)
      setError(err.message || 'Failed to fetch companies')
      // Set demo data for testing if no data
      setCompanies(getDemoCompanies())
    } finally {
      setLoading(false)
    }
  }, [])

  // Demo data for testing
  const getDemoCompanies = (): Company[] => {
    return [
      {
        id: '1',
        user_id: '1',
        company_name: 'Mekdi Software Developer PLC',
        company_description: 'Software development company',
        website: 'https://mekdi.com',
        location: 'Addis Ababa, Ethiopia',
        company_size: '50-100',
        logo_url: null,
        is_verified: false,
        is_active: true,
        created_at: '2025-05-25T00:00:00Z',
        industry_name: 'Technology',
        email: 'mekdiwale59@gmail.com',
        phone: '+251911234567',
        jobs_count: 0
      },
      {
        id: '2',
        user_id: '2',
        company_name: 'Alpha Line Engineering PLC',
        company_description: 'Engineering and construction',
        website: 'https://alphaline.com',
        location: 'Addis Ababa, Ethiopia',
        company_size: '100-250',
        logo_url: null,
        is_verified: false,
        is_active: true,
        created_at: '2025-05-22T00:00:00Z',
        industry_name: 'Engineering',
        email: 'info@alphaline.com',
        phone: '+251911123456',
        jobs_count: 0
      },
      {
        id: '3',
        user_id: '3',
        company_name: 'TechCorp Solutions',
        company_description: 'Tech solutions provider',
        website: 'https://techcorp.com',
        location: 'San Francisco, CA',
        company_size: '10-50',
        logo_url: null,
        is_verified: false,
        is_active: true,
        created_at: '2025-04-24T00:00:00Z',
        industry_name: 'Technology',
        email: 'employer@techcorp.com',
        phone: '+1234567890',
        jobs_count: 0
      }
    ]
  }

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Verify company
  const handleVerifyCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/super-admin/companies/${selectedCompany.id}/verify`, {})
      toast({ 
        title: "Success", 
        description: `${selectedCompany.company_name} has been verified!` 
      })
      setIsVerifyDialogOpen(false)
      setDropdownOpen(null)
      fetchCompanies()
    } catch (err: any) {
      // If super admin endpoint fails, try admin endpoint
      try {
        await apiRequest('PUT', `/admin/companies/${selectedCompany.id}/verify`, {})
        toast({ 
          title: "Success", 
          description: `${selectedCompany.company_name} has been verified!` 
        })
        setIsVerifyDialogOpen(false)
        setDropdownOpen(null)
        fetchCompanies()
      } catch (err2: any) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: err.message || 'Failed to verify company' 
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Suspend company
  const handleSuspendCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/super-admin/companies/${selectedCompany.id}/status`, { 
        status: 'suspended'
      })
      toast({ 
        title: "Success", 
        description: `${selectedCompany.company_name} has been suspended` 
      })
      setIsSuspendDialogOpen(false)
      setDropdownOpen(null)
      fetchCompanies()
    } catch (err: any) {
      // Try alternative endpoint
      try {
        await apiRequest('PUT', `/admin/companies/${selectedCompany.id}/suspend`, {})
        toast({ 
          title: "Success", 
          description: `${selectedCompany.company_name} has been suspended` 
        })
        setIsSuspendDialogOpen(false)
        setDropdownOpen(null)
        fetchCompanies()
      } catch (err2: any) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: err.message || 'Failed to suspend company' 
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Activate company
  const handleActivateCompany = async (company: Company) => {
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/super-admin/companies/${company.id}/status`, { 
        status: 'active'
      })
      toast({ 
        title: "Success", 
        description: `${company.company_name} has been activated` 
      })
      setDropdownOpen(null)
      fetchCompanies()
    } catch (err: any) {
      try {
        await apiRequest('PUT', `/admin/companies/${company.id}/activate`, {})
        toast({ 
          title: "Success", 
          description: `${company.company_name} has been activated` 
        })
        setDropdownOpen(null)
        fetchCompanies()
      } catch (err2: any) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: err.message || 'Failed to activate company' 
        })
      }
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
      toast({ 
        title: "Success", 
        description: `${selectedCompany.company_name} has been deleted` 
      })
      setIsDeleteDialogOpen(false)
      setDropdownOpen(null)
      fetchCompanies()
    } catch (err: any) {
      try {
        await apiRequest('DELETE', `/admin/companies/${selectedCompany.id}`)
        toast({ 
          title: "Success", 
          description: `${selectedCompany.company_name} has been deleted` 
        })
        setIsDeleteDialogOpen(false)
        setDropdownOpen(null)
        fetchCompanies()
      } catch (err2: any) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: err.message || 'Failed to delete company' 
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openViewDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsViewDialogOpen(true)
    setDropdownOpen(null)
  }

  const openSuspendDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsSuspendDialogOpen(true)
    setDropdownOpen(null)
  }

  const openVerifyDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsVerifyDialogOpen(true)
    setDropdownOpen(null)
  }

  const openDeleteDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsDeleteDialogOpen(true)
    setDropdownOpen(null)
  }

  const getInitials = (name: string) => {
    if (!name || name === 'Unnamed Company') return 'CO'
    return name.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (is_active: boolean) => {
    if (is_active) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
    }
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" /> Suspended</Badge>
  }

  const getVerificationBadge = (is_verified: boolean) => {
    if (is_verified) {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Shield className="h-3 w-3 mr-1" /> Verified</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>
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
        <Button onClick={() => fetchCompanies()} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Companies</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-2xl font-bold text-purple-600">{stats.verified}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalJobs}</p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>All Companies ({filteredCompanies.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {error} - Showing demo data
              </AlertDescription>
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
              <Button onClick={fetchCompanies} variant="outline" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Industry</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Jobs</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Verification</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </td>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-blue-100">
                            {company.logo_url ? (
                              <AvatarImage src={company.logo_url} />
                            ) : (
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(company.company_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{company.company_name}</p>
                            <p className="text-sm text-gray-500">{company.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{company.industry_name || '-'}</td>
                      <td className="py-3 px-4 text-sm">{company.location || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium">{company.jobs_count}</td>
                      <td className="py-3 px-4">{getStatusBadge(company.is_active)}</td>
                      <td className="py-3 px-4">{getVerificationBadge(company.is_verified)}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(company.created_at)}</td>
                      <td className="py-3 px-4">
                        <DropdownMenu open={dropdownOpen === company.id} onOpenChange={(open) => setDropdownOpen(open ? company.id : null)}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openViewDialog(company)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {!company.is_verified && (
                              <DropdownMenuItem onClick={() => openVerifyDialog(company)}>
                                <Shield className="h-4 w-4 mr-2" /> Verify Company
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {company.is_active ? (
                              <DropdownMenuItem onClick={() => openSuspendDialog(company)} className="text-yellow-600">
                                <XCircle className="h-4 w-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivateCompany(company)} className="text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" /> Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openDeleteDialog(company)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>
              Detailed information about the company
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                    {getInitials(selectedCompany.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedCompany.company_name}</h2>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {selectedCompany.email}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Industry</Label>
                  <p className="mt-1">{selectedCompany.industry_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Location</Label>
                  <p className="mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedCompany.location || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Company Size</Label>
                  <p className="mt-1">{selectedCompany.company_size || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedCompany.phone || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Website</Label>
                  <p className="mt-1">
                    {selectedCompany.website ? (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {selectedCompany.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Total Jobs</Label>
                  <p className="mt-1 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {selectedCompany.jobs_count}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Joined Date</Label>
                  <p className="mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(selectedCompany.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCompany.is_active)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Verification</Label>
                  <div className="mt-1">{getVerificationBadge(selectedCompany.is_verified)}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedCompany.company_description || 'No description provided'}
                </p>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify <span className="font-semibold">{selectedCompany?.company_name}</span>?
              <br />Verified companies receive a trust badge on their profile.
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend <span className="font-semibold">{selectedCompany?.company_name}</span>?
              <br />Suspended companies cannot post jobs and their listings will be hidden.
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold">{selectedCompany?.company_name}</span>
              and remove all associated data including jobs and applications.
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