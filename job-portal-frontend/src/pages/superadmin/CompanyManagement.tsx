// src/pages/superadmin/CompanyManagement.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, Plus, Edit, Trash2, MoreVertical, Shield,
  CheckCircle, XCircle, RefreshCw, AlertCircle,
  Building, Users, Briefcase, Eye, Crown,
  Mail, Phone, MapPin, Globe, Calendar, Check, X, Clock
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Company {
  id: string
  user_id: string
  company_name: string
  company_description: string | null
  website: string | null
  location: string | null
  company_size: string | null
  founded_year: number | null
  logo_url: string | null
  cover_image: string | null
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  industry: {
    id: number
    industry_name: string
  } | null
  user: {
    email: string
    full_name: string
  }
  _count?: {
    jobs: number
  }
  stats?: {
    total_jobs: number
    active_jobs: number
    total_applications: number
    total_views: number
  }
}

interface CompanyStats {
  total_companies: number
  active_companies: number
  pending_companies: number
  verified_companies: number
  suspended_companies: number
  total_jobs: number
  total_applications: number
}

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVerification, setFilterVerification] = useState('all')
  const [filterIndustry, setFilterIndustry] = useState('all')
  const [industries, setIndustries] = useState<{ id: number; industry_name: string }[]>([])
  const [stats, setStats] = useState<CompanyStats>({
    total_companies: 0,
    active_companies: 0,
    pending_companies: 0,
    verified_companies: 0,
    suspended_companies: 0,
    total_jobs: 0,
    total_applications: 0
  })
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    website: '',
    location: '',
    company_size: '',
    founded_year: '',
    industry_id: ''
  })

  // Get current user role from token
  const getCurrentUserRole = useCallback(() => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        const decoded = JSON.parse(jsonPayload)
        const role = decoded.role || decoded.user_type
        setCurrentUserRole(role === 'Super Admin' || role === 'super_admin' ? 'Super Admin' : 'Admin')
      }
    } catch (error) {
      console.error('Failed to get user role:', error)
      setCurrentUserRole('Admin')
    }
  }, [])

  // Fetch industries for filter
  const fetchIndustries = useCallback(async () => {
    try {
      const response = await api.get('/industries')
      if (response.data?.data) {
        setIndustries(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch industries:', err)
    }
  }, [])

  // Fetch companies from backend
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('Fetching companies from /admin/users?role=Employer...')
      const response = await api.get('/admin/users', {
        params: { role: 'Employer', limit: 100 }
      })
      
      console.log('Companies response:', response.data)
      
      let allUsers: any[] = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        allUsers = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        allUsers = response.data
      }
      
      // Filter only Employer users and map to company format
      const employerUsers = allUsers.filter(user => {
        const userType = user.user_type?.type_name || user.role
        return userType === 'Employer'
      })
      
      console.log(`Found ${employerUsers.length} employers`)
      
      // Map to Company interface
      const mappedCompanies: Company[] = employerUsers.map((user: any) => ({
        id: user.id,
        user_id: user.id,
        company_name: user.employer_profile?.company_name || user.full_name || 'N/A',
        company_description: user.employer_profile?.company_description || null,
        website: user.employer_profile?.website || null,
        location: user.employer_profile?.location || null,
        company_size: user.employer_profile?.company_size || null,
        founded_year: user.employer_profile?.founded_year || null,
        logo_url: user.employer_profile?.logo_url || null,
        cover_image: user.employer_profile?.cover_image || null,
        is_verified: user.employer_profile?.is_verified || false,
        is_active: user.is_active !== undefined ? user.is_active : true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        industry: user.employer_profile?.industry || null,
        user: {
          email: user.email,
          full_name: user.full_name || ''
        },
        _count: {
          jobs: user.employer_profile?.jobs_count || 0
        },
        stats: {
          total_jobs: user.employer_profile?.jobs_count || 0,
          active_jobs: 0,
          total_applications: 0,
          total_views: 0
        }
      }))
      
      setCompanies(mappedCompanies)
      
      // Calculate stats
      const activeCompanies = mappedCompanies.filter(c => c.is_active).length
      const verifiedCompanies = mappedCompanies.filter(c => c.is_verified).length
      const suspendedCompanies = mappedCompanies.filter(c => !c.is_active).length
      const totalJobs = mappedCompanies.reduce((sum, c) => sum + (c._count?.jobs || 0), 0)
      
      setStats({
        total_companies: mappedCompanies.length,
        active_companies: activeCompanies,
        pending_companies: 0,
        verified_companies: verifiedCompanies,
        suspended_companies: suspendedCompanies,
        total_jobs: totalJobs,
        total_applications: 0
      })
      
    } catch (err: any) {
      console.error('Failed to fetch companies:', err)
      setError(err.message || 'Failed to fetch companies')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
    fetchIndustries()
    getCurrentUserRole()
  }, [fetchCompanies, fetchIndustries, getCurrentUserRole])

  // Update company
  const handleUpdateCompany = async () => {
    if (!selectedCompany) return
    
    setSubmitting(true)
    try {
      // Update employer profile
      await api.put(`/employer/profile`, {
        company_name: formData.company_name,
        company_description: formData.company_description,
        website: formData.website,
        location: formData.location,
        company_size: formData.company_size,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        industry_id: formData.industry_id ? parseInt(formData.industry_id) : null
      })
      
      toast({ title: "Success", description: "Company updated successfully!" })
      setIsEditDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      console.error('Failed to update company:', err)
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to update company" })
    } finally {
      setSubmitting(false)
    }
  }

  // Verify company
  const handleVerifyCompany = async () => {
    if (!selectedCompany) return
    
    setSubmitting(true)
    try {
      await api.put(`/admin/users/${selectedCompany.user_id}/status`, { 
        is_verified: true 
      })
      
      toast({ title: "Success", description: `${selectedCompany.company_name} has been verified!` })
      setIsVerifyDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to verify company" })
    } finally {
      setSubmitting(false)
    }
  }

  // Suspend company
  const handleSuspendCompany = async () => {
    if (!selectedCompany) return
    
    setSubmitting(true)
    try {
      await api.put(`/admin/users/${selectedCompany.user_id}/status`, { is_active: false })
      
      toast({ title: "Success", description: `${selectedCompany.company_name} has been suspended` })
      setIsSuspendDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to suspend company" })
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
      await api.put(`/admin/users/${company.user_id}/status`, { is_active: true })
      
      toast({ title: "Success", description: `${company.company_name} has been activated` })
      fetchCompanies()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to activate company" })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete company
  const handleDeleteCompany = async () => {
    if (!selectedCompany) return
    
    setSubmitting(true)
    try {
      await api.delete(`/admin/users/${selectedCompany.user_id}`)
      
      toast({ title: "Success", description: `${selectedCompany.company_name} has been deleted permanently` })
      setIsDeleteDialogOpen(false)
      fetchCompanies()
    } catch (err: any) {
      console.error('Failed to delete company:', err)
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to delete company" })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      company_name: company.company_name,
      company_description: company.company_description || '',
      website: company.website || '',
      location: company.location || '',
      company_size: company.company_size || '',
      founded_year: company.founded_year?.toString() || '',
      industry_id: company.industry?.id?.toString() || ''
    })
    setIsEditDialogOpen(true)
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
    if (!name) return 'CO'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusBadge = (is_active: boolean) => {
    if (is_active) {
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
    }
    return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Suspended</Badge>
  }

  const getVerificationBadge = (is_verified: boolean) => {
    if (is_verified) {
      return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid'
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && company.is_active) ||
                         (filterStatus === 'inactive' && !company.is_active)
    const matchesVerification = filterVerification === 'all' ||
                               (filterVerification === 'verified' && company.is_verified) ||
                               (filterVerification === 'unverified' && !company.is_verified)
    const matchesIndustry = filterIndustry === 'all' || 
                           (company.industry?.id.toString() === filterIndustry)
    return matchesSearch && matchesStatus && matchesVerification && matchesIndustry
  })

  const isSuperAdmin = currentUserRole === 'Super Admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-500 mt-1">Manage employer companies and their verification status</p>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as: <span className="font-semibold">{currentUserRole || 'Loading...'}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Companies</p>
                <p className="text-2xl font-bold">{stats.total_companies}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active_companies}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verified_companies}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_jobs}</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-500 opacity-50" />
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
              <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry.id} value={industry.id.toString()}>
                      {industry.industry_name}
                    </SelectItem>
                  ))}
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
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                {getInitials(company.company_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{company.company_name}</p>
                            <p className="text-sm text-gray-500">{company.user.email}</p>
                          </div>
                        </div>
                       </td>
                      <td className="py-3 px-4 text-sm">
                        {company.industry?.industry_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">{company.location || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {company._count?.jobs || 0}
                      </td>
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
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(company)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                {!company.is_verified && (
                                  <DropdownMenuItem onClick={() => openVerifyDialog(company)}>
                                    <Shield className="h-4 w-4 mr-2" /> Verify Company
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {company.is_active ? (
                                  <DropdownMenuItem 
                                    onClick={() => openSuspendDialog(company)}
                                    className="text-yellow-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Suspend
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleActivateCompany(company.id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(company)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* View Company Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-blue-100">
                  {selectedCompany.logo_url ? (
                    <AvatarImage src={selectedCompany.logo_url} />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedCompany.company_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedCompany.company_name}</h2>
                  <p className="text-gray-500">{selectedCompany.user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Industry</Label>
                  <p>{selectedCompany.industry?.industry_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Location</Label>
                  <p>{selectedCompany.location || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Company Size</Label>
                  <p>{selectedCompany.company_size || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Founded Year</Label>
                  <p>{selectedCompany.founded_year || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Website</Label>
                  <p>{selectedCompany.website || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Total Jobs</Label>
                  <p>{selectedCompany._count?.jobs || 0}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="mt-1 text-gray-700">{selectedCompany.company_description || 'No description provided'}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                value={formData.company_description}
                onChange={(e) => setFormData({...formData, company_description: e.target.value})}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <Label>Company Size</Label>
              <Select value={formData.company_size} onValueChange={(value) => setFormData({...formData, company_size: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={formData.industry_id} onValueChange={(value) => setFormData({...formData, industry_id: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry.id} value={industry.id.toString()}>
                      {industry.industry_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCompany} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <AlertDialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify <span className="font-semibold">{selectedCompany?.company_name}</span>?
              <br />
              Verified companies receive a trust badge and appear higher in search results.
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
              <br />
              Suspended companies cannot post jobs or access the platform.
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
              and remove all associated jobs and data.
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