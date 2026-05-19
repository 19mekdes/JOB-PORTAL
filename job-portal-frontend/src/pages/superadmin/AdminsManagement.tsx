// src/pages/superadmin/AdminsManagement.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Plus, Edit, Trash2, MoreVertical, Shield,
  CheckCircle, XCircle, RefreshCw, AlertCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('admin_token')

const api = {
  get: async (url: string, options?: any) => {
    const token = getToken()
    const queryParams = options?.params 
      ? '?' + new URLSearchParams(options.params).toString() 
      : ''
    
    const response = await fetch(`${API_BASE_URL}${url}${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'API Error')
    return { data }
  },
  
  post: async (url: string, body: any) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'API Error')
    return { data }
  },
  
  put: async (url: string, body: any) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'API Error')
    return { data }
  },
  
  delete: async (url: string) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.message || 'API Error')
    return { data }
  },
}

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  role: 'super_admin' | 'admin' | 'moderator' | 'support'
  status: 'active' | 'inactive' | 'suspended'
  region: string
  last_active: string
  joined: string
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
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin',
    region: ''
  })

  // Fetch admins from backend
  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (filterRole !== 'all') params.role = filterRole
      if (filterStatus !== 'all') params.status = filterStatus
      
      const response = await api.get('/super-admin/admins-list', { params })
      setAdmins(response.data.admins || [])
    } catch (err: any) {
      console.error('Failed to fetch admins:', err)
      setError(err.message || 'Failed to fetch admins. Please make sure the backend server is running.')
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterRole, filterStatus])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  // Create new admin
  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields')
      return
    }
    
    setSubmitting(true)
    try {
      await api.post('/super-admin/admins', formData)
      alert('Admin created successfully!')
      setIsAddDialogOpen(false)
      resetForm()
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to create admin:', err)
      alert(err.message || 'Failed to create admin')
    } finally {
      setSubmitting(false)
    }
  }

  // Update admin
  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return
    
    setSubmitting(true)
    try {
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      
      await api.put(`/super-admin/admins/${selectedAdmin.id}`, updateData)
      alert('Admin updated successfully!')
      setIsEditDialogOpen(false)
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to update admin:', err)
      alert(err.message || 'Failed to update admin')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete admin
  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete ${adminName}? This action cannot be undone.`)) return
    
    try {
      await api.delete(`/super-admin/admins/${adminId}`)
      alert('Admin deleted successfully!')
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to delete admin:', err)
      alert(err.message || 'Failed to delete admin')
    }
  }

  // Toggle admin status
  const handleToggleStatus = async (admin: Admin) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? 'activate' : 'deactivate'
    
    if (!confirm(`Are you sure you want to ${action} ${admin.name}?`)) return
    
    try {
      await api.put(`/super-admin/admins/${admin.id}`, { status: newStatus })
      alert(`Admin ${action}d successfully!`)
      fetchAdmins()
    } catch (err: any) {
      console.error('Failed to update status:', err)
      alert(err.message || 'Failed to update admin status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'admin',
      region: ''
    })
  }

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      role: admin.role,
      region: admin.region || ''
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      moderator: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      support: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleDisplay = (role: string) => {
    switch(role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'moderator': return 'Moderator'
      case 'support': return 'Support'
      default: return role
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system administrators and their permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  placeholder="Secure password"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  placeholder="e.g., North America, Europe, Asia"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAdmin} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Admin'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>All Administrators ({admins.length})</CardTitle>
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
              <Button variant="outline" onClick={fetchAdmins}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading admins from database...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No administrators found in database</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first admin
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Admin</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Region</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Active</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                          {admin.phone && <p className="text-xs text-gray-400">{admin.phone}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleBadge(admin.role)}>
                          {getRoleDisplay(admin.role)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(admin.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{admin.region || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(admin.last_active)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(admin.joined)}</td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openEditDialog(admin)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                              {admin.status === 'active' ? (
                                <><XCircle className="h-4 w-4 mr-2" /> Deactivate</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                            {admin.role !== 'super_admin' && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label>New Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter new password"
              />
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
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region</Label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                placeholder="Region"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateAdmin} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminsManagement