// src/pages/superadmin/AdminsManagement.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Search, Plus, Edit, Trash2, MoreVertical, Shield,
  CheckCircle, XCircle, RefreshCw, AlertCircle,
  UserPlus, Key, Ban, Eye, Crown
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
import api from '@/services/api'

interface Admin {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar: string | null
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

const AdminsManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Admin'
  })

  // Get current user role from token
  const getCurrentUserInfo = useCallback(() => {
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
        setCurrentUserId(decoded.id || decoded.userId)
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
      setCurrentUserRole('Admin')
    }
  }, [])

  // Fetch admins from backend - FIXED: Use correct endpoint
  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching admins from /admin/users...')
      const response = await api.get('/admin/users')
      console.log('API Response:', response.data)
      
      // Handle different response structures
      let allUsers: any[] = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        allUsers = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        allUsers = response.data
      } else if (response.data?.users && Array.isArray(response.data.users)) {
        allUsers = response.data.users
      }
      
      console.log(`Found ${allUsers.length} total users`)
      
      // Filter only Admin and Super Admin users
      const adminUsers = allUsers.filter(
        (user: any) => {
          const userType = user.user_type?.type_name || user.role
          return userType === 'Admin' || userType === 'Super Admin'
        }
      )
      
      console.log(`Found ${adminUsers.length} admin users`)
      
      // Map to Admin interface
      const mappedAdmins: Admin[] = adminUsers.map((user: any) => ({
        id: user.id,
        full_name: user.full_name || user.seeker_profile?.full_name || user.email?.split('@')[0] || 'Admin',
        email: user.email,
        phone: user.phone || user.seeker_profile?.phone || null,
        avatar: user.avatar || null,
        role: user.user_type?.type_name || user.role || 'Admin',
        is_active: user.is_active !== undefined ? user.is_active : true,
        last_login: user.last_login || null,
        created_at: user.created_at
      }))
      
      setAdmins(mappedAdmins)
    } catch (err: any) {
      console.error('Failed to fetch admins:', err)
      setError(err.message || 'Failed to fetch admins')
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
    getCurrentUserInfo()
  }, [fetchAdmins, getCurrentUserInfo])

  // Create new admin
  const handleCreateAdmin = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields" })
      return
    }
    
    if (formData.password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" })
      return
    }
    
    setSubmitting(true)
    try {
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        user_type: formData.role,
        phone: formData.phone
      })
      
      toast({ title: "Success", description: "Admin created successfully!" })
      setIsAddDialogOpen(false)
      resetForm()
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to create admin:', err)
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to create admin" })
    } finally {
      setSubmitting(false)
    }
  }

  // Update admin
  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return
    
    setSubmitting(true)
    try {
      await api.put(`/admin/users/${selectedAdmin.id}`, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role
      })
      
      toast({ title: "Success", description: "Admin updated successfully!" })
      setIsEditDialogOpen(false)
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to update admin:', err)
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to update admin" })
    } finally {
      setSubmitting(false)
    }
  }

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedAdmin || !newPassword) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a new password" })
      return
    }
    
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" })
      return
    }
    
    setSubmitting(true)
    try {
      await api.post(`/admin/users/${selectedAdmin.id}/reset-password`, { 
        password: newPassword 
      })
      toast({ title: "Success", description: "Password reset successfully!" })
      setIsResetPasswordOpen(false)
      setNewPassword('')
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to reset password" })
    } finally {
      setSubmitting(false)
    }
  }

  // Suspend admin
  const handleSuspendAdmin = async () => {
    if (!selectedAdmin) return
    
    setSubmitting(true)
    try {
      await api.put(`/admin/users/${selectedAdmin.id}/status`, { is_active: false })
      toast({ title: "Success", description: "Admin suspended successfully!" })
      setIsSuspendDialogOpen(false)
      fetchAdmins()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to suspend admin" })
    } finally {
      setSubmitting(false)
    }
  }

  // Activate admin
  const handleActivateAdmin = async (adminId: string) => {
    try {
      await api.put(`/admin/users/${adminId}/status`, { is_active: true })
      toast({ title: "Success", description: "Admin activated successfully!" })
      fetchAdmins()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to activate admin" })
    }
  }

  // Delete admin
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return
    
    setSubmitting(true)
    try {
      await api.delete(`/admin/users/${selectedAdmin.id}`)
      toast({ title: "Success", description: "Admin deleted successfully!" })
      setIsDeleteDialogOpen(false)
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to delete admin:', err)
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to delete admin" })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      role: 'Admin'
    })
  }

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      role: admin.role
    })
    setIsEditDialogOpen(true)
  }

  const openResetPasswordDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setNewPassword('')
    setIsResetPasswordOpen(true)
  }

  const openSuspendDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsSuspendDialogOpen(true)
  }

  const openDeleteDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsDeleteDialogOpen(true)
  }

  const getInitials = (name: string) => {
    if (!name) return 'AD'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'Super Admin') {
      return <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1"><Crown className="h-3 w-3" /> Super Admin</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid'
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    } catch {
      return dateString
    }
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'super_admin' && admin.role === 'Super Admin') ||
                       (filterRole === 'admin' && admin.role === 'Admin')
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && admin.is_active) ||
                         (filterStatus === 'inactive' && !admin.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: admins.length,
    active: admins.filter(a => a.is_active).length,
    inactive: admins.filter(a => !a.is_active).length,
    superAdmins: admins.filter(a => a.role === 'Super Admin').length
  }

  const isSuperAdmin = currentUserRole === 'Super Admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-500 mt-1">Manage system administrators and their permissions</p>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as: <span className="font-semibold">{currentUserRole || 'Loading...'}</span>
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Admin
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500 opacity-50" />
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
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Super Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.superAdmins}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>Administrators List</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search admins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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
              <Button variant="outline" onClick={fetchAdmins} disabled={loading}>
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
              <p className="mt-2 text-gray-500">Loading admins...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No administrators found</p>
              {isSuperAdmin && (
                <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add your first admin
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Admin</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Active</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-blue-100">
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                              {getInitials(admin.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{admin.full_name}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                            {admin.phone && <p className="text-xs text-gray-400">{admin.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(admin.role)}</td>
                      <td className="py-3 px-4">
                        {admin.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Suspended</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatDate(admin.last_login)}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(admin.created_at)}</td>
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
                            
                            {/* View Details - Everyone */}
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            
                            {/* Super Admin only actions */}
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(admin)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResetPasswordDialog(admin)}>
                                  <Key className="h-4 w-4 mr-2" /> Reset Password
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Suspend/Activate - Super Admin only */}
                            {isSuperAdmin && (
                              admin.is_active ? (
                                <DropdownMenuItem onClick={() => openSuspendDialog(admin)} className="text-yellow-600">
                                  <Ban className="h-4 w-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleActivateAdmin(admin.id)} className="text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )
                            )}
                            
                            {/* Delete - Super Admin only, cannot delete self */}
                            {isSuperAdmin && admin.id !== currentUserId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDeleteDialog(admin)} className="text-red-600">
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

      {/* Add Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Secure password (min 6 characters)"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+251 912 345 678"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="Super Admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAdmin} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="Super Admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAdmin} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Reset password for <span className="font-semibold">{selectedAdmin?.full_name}</span>
            </p>
          </DialogHeader>
          <div>
            <Label>New Password *</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend <span className="font-semibold">{selectedAdmin?.full_name}</span>?
              The admin will not be able to access the dashboard until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendAdmin} className="bg-yellow-600">
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold">{selectedAdmin?.full_name}</span>'s account
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminsManagement