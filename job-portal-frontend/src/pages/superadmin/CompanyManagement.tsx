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
  Building, Briefcase, Eye
  } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

// Helper function to get token from multiple possible locations
const getAuthToken = (): string | null => {
  // Try multiple possible token locations
  const token = localStorage.getItem('token') || 
                localStorage.getItem('admin_token') || 
                localStorage.getItem('accessToken') ||
                sessionStorage.getItem('token')
  
  // Also check if token is stored inside user object
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
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // eslint-disable-next-line no-empty-pattern
  const [] = useState({
    company_name: '',
    company_description: '',
    website: '',
    location: '',
    company_size: ''
  })
  const [, setTokenDebug] = useState<string>('Checking...')

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
    if (data && (method === 'POST' || method === 'PUT')) {
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

  // Check token status
  const checkToken = () => {
    const token = getAuthToken()
    if (token) {
      setTokenDebug(`✅ Token found (length: ${token.length})`)
      return true
    } else {
      setTokenDebug('❌ No token found in localStorage')
      return false
    }
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

      console.log('Fetching companies from /admin/users...')
      console.log('Using token:', token.substring(0, 50) + '...')
      
      const response = await apiRequest('GET', '/admin/users')
      console.log('API Response:', response)
      
      let allUsers: any[] = []
      if (response.data && Array.isArray(response.data)) {
        allUsers = response.data
      } else if (response.users && Array.isArray(response.users)) {
        allUsers = response.users
      } else if (Array.isArray(response)) {
        allUsers = response
      }
      
      console.log(`Total users found: ${allUsers.length}`)
      
      // Filter only Employer users
      const employerUsers = allUsers.filter(user => {
        const userType = user.user_type?.type_name || user.role
        return userType === 'Employer'
      })
      
      console.log(`Employers found: ${employerUsers.length}`)
      
      // Map to Company interface
      const mappedCompanies: Company[] = employerUsers.map((user: any) => ({
        id: user.id,
        user_id: user.id,
        company_name: user.employer_profile?.company_name || user.full_name || 'Unnamed Company',
        company_description: user.employer_profile?.company_description || null,
        website: user.employer_profile?.website || null,
        location: user.employer_profile?.location || null,
        company_size: user.employer_profile?.company_size || null,
        logo_url: user.employer_profile?.logo_url || null,
        is_verified: user.employer_profile?.is_verified || false,
        is_active: user.is_active !== undefined ? user.is_active : true,
        created_at: user.created_at,
        industry_name: user.employer_profile?.industry?.industry_name || null,
        email: user.email,
        phone: user.employer_profile?.phone || null,
        jobs_count: user.employer_profile?.jobs_count || 0
      }))
      
      setCompanies(mappedCompanies)
      
    } catch (err: any) {
      console.error('Failed to fetch companies:', err)
      setError(err.message || 'Failed to fetch companies')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkToken()
    const token = getAuthToken()
    if (!token) {
      setError('No authentication token found. Please login first.')
      setLoading(false)
      return
    }
    fetchCompanies()
  }, [fetchCompanies])

  // Verify company
  const handleVerifyCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/admin/users/${selectedCompany.user_id}/status`, { 
        is_verified: true 
      })
      toast({ title: "Success", description: `${selectedCompany.company_name} has been verified!` })
      setIsVerifyDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Suspend company
  const handleSuspendCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/admin/users/${selectedCompany.user_id}/status`, { is_active: false })
      toast({ title: "Success", description: `${selectedCompany.company_name} has been suspended` })
      setIsSuspendDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Activate company
  const handleActivateCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return
    setSubmitting(true)
    try {
      await apiRequest('PUT', `/admin/users/${company.user_id}/status`, { is_active: true })
      toast({ title: "Success", description: `${company.company_name} has been activated` })
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete company
  const handleDeleteCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      await apiRequest('DELETE', `/admin/users/${selectedCompany.user_id}`)
      toast({ title: "Success", description: `${selectedCompany.company_name} has been deleted` })
      setIsDeleteDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const openViewDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsViewDialogOpen(true)
  }

  const openSuspendDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsSuspendDialogOpen(true)
  }

  const openVerifyDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsVerifyDialogOpen(true)
  }

  const openDeleteDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsDeleteDialogOpen(true)
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
              <Button variant="outline" onClick={fetchCompanies} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
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
              {!getAuthToken() && (
                <p className="text-sm text-red-500 mt-2">Click "Force Login & Save Token" button above</p>
              )}
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
                  </tr>
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
                        <DropdownMenu>
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
                              <DropdownMenuItem onClick={() => handleActivateCompany(company.id)} className="text-green-600">
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
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{getInitials(selectedCompany.company_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedCompany.company_name}</h2>
                  <p className="text-gray-500">{selectedCompany.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-gray-500">Industry</Label><p>{selectedCompany.industry_name || '-'}</p></div>
                <div><Label className="text-gray-500">Location</Label><p>{selectedCompany.location || '-'}</p></div>
                <div><Label className="text-gray-500">Company Size</Label><p>{selectedCompany.company_size || '-'}</p></div>
                <div><Label className="text-gray-500">Website</Label><p>{selectedCompany.website || '-'}</p></div>
                <div><Label className="text-gray-500">Total Jobs</Label><p>{selectedCompany.jobs_count}</p></div>
                <div><Label className="text-gray-500">Joined Date</Label><p>{formatDate(selectedCompany.created_at)}</p></div>
              </div>
              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="mt-1">{selectedCompany.company_description || 'No description provided'}</p>
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
              <br />Verified companies receive a trust badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerifyCompany} className="bg-blue-600">
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
              <br />Suspended companies cannot post jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendCompany} className="bg-yellow-600">
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
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-red-600">
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CompanyManagement