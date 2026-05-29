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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
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

  // Get current user info
  const getCurrentUserInfo = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUserRole(user.user_type === 'Super Admin' ? 'Super Admin' : 'Admin')
        setCurrentUserId(user.id)
        return
      }
      
      const token = localStorage.getItem('token')
      if (token) {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        const decoded = JSON.parse(jsonPayload)
        setCurrentUserRole(decoded.role === 'Super Admin' ? 'Super Admin' : 'Admin')
        setCurrentUserId(decoded.id)
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
      setCurrentUserRole('Admin')
    }
  }, [])

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/users')
      
      let allUsers: any[] = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        allUsers = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        allUsers = response.data
      }
      
      const adminUsers = allUsers.filter((user: any) => {
        const userType = user.user_type?.type_name || user.role
        return userType === 'Admin' || userType === 'Super Admin'
      })
      
      const mappedAdmins: Admin[] = adminUsers.map((user: any) => ({
        id: user.id,
        full_name: user.full_name || 'Admin',
        email: user.email,
        phone: user.phone || null,
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
      await api.post(`/admin/users/${selectedAdmin.id}/reset-password`, { password: newPassword })
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

  const openViewDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsViewDialogOpen(true)
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
      return <Badge className="bg-purple-100 text-purple-700"><Crown className="h-3 w-3 mr-1" /> Super Admin</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
          el.classList.add('hidden');
        });
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-500 mt-1">Manage system administrators and their permissions</p>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as: <span className="font-semibold">{currentUserRole || 'Admin'}</span>
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
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Admins</p><p className="text-2xl font-bold">{stats.total}</p></div><Shield className="h-8 w-8 text-blue-500 opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div><CheckCircle className="h-8 w-8 text-green-500 opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Inactive</p><p className="text-2xl font-bold text-red-600">{stats.inactive}</p></div><XCircle className="h-8 w-8 text-red-500 opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Super Admins</p><p className="text-2xl font-bold text-purple-600">{stats.superAdmins}</p></div><Crown className="h-8 w-8 text-purple-500 opacity-50" /></div></CardContent></Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>Administrators List ({filteredAdmins.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search admins..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" /></div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32 bg-white"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50"><SelectItem value="all">All Roles</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50"><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchAdmins} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Alert className="mb-4 bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /><AlertDescription>{error}</AlertDescription></Alert>}
          
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-500">Loading admins...</p></div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-12"><Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No administrators found</p>{isSuperAdmin && <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add your first admin</Button>}</div>
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
                          <Avatar className="h-10 w-10 bg-blue-100"><AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">{getInitials(admin.full_name)}</AvatarFallback></Avatar>
                          <div><p className="font-medium text-gray-900">{admin.full_name}</p><p className="text-sm text-gray-500">{admin.email}</p>{admin.phone && <p className="text-xs text-gray-400">{admin.phone}</p>}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(admin.role)}</td>
                      <td className="py-3 px-4">{admin.is_active ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge className="bg-red-100 text-red-700">Suspended</Badge>}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(admin.last_login)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(admin.created_at)}</td>
                      <td className="py-3 px-4 relative dropdown-container">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
                                if (el.id !== `dropdown-${admin.id}`) el.classList.add('hidden');
                              });
                              const dropdown = document.getElementById(`dropdown-${admin.id}`);
                              if (dropdown) dropdown.classList.toggle('hidden');
                            }}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-gray-100 h-8 w-8 p-0 transition-colors"
                            type="button"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          {/* Dropdown menu - FIXED SOLID WHITE UTILITIES */}
                          <div 
                            id={`dropdown-${admin.id}`}
                            className="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
                            style={{ top: '100%' }}
                          >
                            <div className="py-1 bg-white">
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50">
                                Actions
                              </div>
                              
                              <button
                                onClick={() => {
                                  document.getElementById(`dropdown-${admin.id}`)?.classList.add('hidden');
                                  openViewDialog(admin);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors bg-white"
                              >
                                <Eye className="h-4 w-4 text-gray-500" /> View Details
                              </button>
                              
                              {isSuperAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      document.getElementById(`dropdown-${admin.id}`)?.classList.add('hidden');
                                      openEditDialog(admin);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors bg-white"
                                  >
                                    <Edit className="h-4 w-4 text-gray-500" /> Edit
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      document.getElementById(`dropdown-${admin.id}`)?.classList.add('hidden');
                                      openResetPasswordDialog(admin);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors bg-white"
                                  >
                                    <Key className="h-4 w-4 text-gray-500" /> Reset Password
                                  </button>
                                </>
                              )}
                              
                              {isSuperAdmin && (
                                <>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  {admin.is_active ? (
                                    <button
                                      onClick={() => {
                                        document.getElementById(`dropdown-${admin.id}`)?.classList.add('hidden');
                                        openSuspendDialog(admin);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-3 transition-colors bg-white"
                                    >
                                      <Ban className="h-4 w-4 text-yellow-500" /> Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        document.getElementById(`dropdown-${admin.id}`)?.classList.add('hidden');
                                        handleActivateAdmin(admin.id);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 flex items-center gap-3 transition-colors bg-white"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-500" /> Activate
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {isSuperAdmin && admin.id !== currentUserId && (
                                <>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button
                                    onClick={() => {
                                      document.getElementById(`dropdown-${admin.id}`)?.classList.add('hidden');
                                      openDeleteDialog(admin);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3 transition-colors bg-white"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
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

      {/* Create New Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md bg-white border shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Create New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-gray-700 font-medium">Full Name *</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="John Doe" className="bg-white mt-1" /></div>
            <div><Label className="text-gray-700 font-medium">Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="admin@example.com" className="bg-white mt-1" /></div>
            <div><Label className="text-gray-700 font-medium">Password *</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" className="bg-white mt-1" /></div>
            <div><Label className="text-gray-700 font-medium">Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1234567890" className="bg-white mt-1" /></div>
            <div>
              <Label className="text-gray-700 font-medium">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger className="bg-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50"><SelectItem value="Admin">Admin</SelectItem>{isSuperAdmin && <SelectItem value="Super Admin">Super Admin</SelectItem>}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAdmin} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting ? 'Creating...' : 'Create Admin'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md bg-white border shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Admin Details</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-5 py-3">
              <div className="flex items-center gap-4 border-b pb-4">
                <Avatar className="h-14 w-14 bg-blue-100"><AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">{getInitials(selectedAdmin.full_name)}</AvatarFallback></Avatar>
                <div><p className="text-lg font-bold text-gray-900">{selectedAdmin.full_name}</p><p className="text-sm text-gray-500">{selectedAdmin.email}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</p><p className="text-sm font-medium text-gray-900 mt-0.5">{selectedAdmin.role}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p><p className="text-sm font-medium mt-0.5">{selectedAdmin.is_active ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-red-600 font-semibold">Suspended</span>}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</p><p className="text-sm text-gray-900 mt-0.5">{selectedAdmin.phone || 'Not provided'}</p></div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined Date</p><p className="text-sm text-gray-900 mt-0.5">{formatDate(selectedAdmin.created_at)}</p></div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-3">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white border shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-gray-700 font-medium">Full Name</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-white mt-1" /></div>
            <div><Label className="text-gray-700 font-medium">Email</Label><Input type="email" value={formData.email} disabled className="bg-gray-100 text-gray-500 mt-1" /></div>
            <div><Label className="text-gray-700 font-medium">Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-white mt-1" /></div>
            <div>
              <Label className="text-gray-700 font-medium">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger className="bg-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50"><SelectItem value="Admin">Admin</SelectItem>{isSuperAdmin && <SelectItem value="Super Admin">Super Admin</SelectItem>}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAdmin} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md bg-white border shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-gray-700 font-medium">New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="bg-white mt-1" />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting ? 'Resetting...' : 'Reset Password'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Alert Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent className="bg-white border shadow-2xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900">Suspend Administrator</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">Are you sure you want to suspend {selectedAdmin?.full_name}? They will lose complete system dashboard clearance immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendAdmin} className="bg-yellow-600 hover:bg-yellow-700 text-white">Suspend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border shadow-2xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900 text-red-600">Delete Administrator</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">This action cannot be undone. This will permanently delete the admin account for {selectedAdmin?.full_name} from the database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminsManagement