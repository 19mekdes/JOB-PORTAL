/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, RefreshCw, UserCheck, UserX, Trash2, Eye, Mail, Phone,
  MapPin, Calendar, AlertCircle, CheckCircle, XCircle, Key
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  location: string | null
  user_type: { id: number; type_name: string }
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  seeker_profile?: { skills: string[]; experience: string; education: string; resume_url: string; title?: string; bio?: string; phone?: string; location?: string }
  employer_profile?: { company_name: string; company_description: string; website: string; location: string; jobs_count?: number; logo_url?: string }
  stats?: { jobs_count?: number; applications_count?: number; views_count?: number }
}

interface UserStats {
  total: number
  active: number
  suspended: number
  jobSeekers: number
  employers: number
  admins: number
  superAdmins: number
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<UserStats>({
    total: 0, active: 0, suspended: 0, jobSeekers: 0, employers: 0, admins: 0, superAdmins: 0
  })

  // Get current user role for permission checks
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isSuperAdmin = currentUser.user_type?.type_name === 'Super Admin'

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      let apiRole = 'all'
      if (activeTab === 'job_seekers') apiRole = 'Job Seeker'
      else if (activeTab === 'employers') apiRole = 'Employer'
      else if (activeTab === 'all') apiRole = roleFilter
      
      const params: any = { page, limit: 20 }
      if (searchTerm) params.search = searchTerm
      if (apiRole !== 'all') params.role = apiRole
      if (statusFilter !== 'all') params.status = statusFilter
      
      const response = await api.get('/admin/users', { params })
      
      let usersData = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data
      }
      
      setUsers(usersData)
      
      // Calculate stats from usersData
      let jobSeekersCount = 0, employersCount = 0, adminsCount = 0, superAdminsCount = 0, activeCount = 0, suspendedCount = 0
      
      for (const user of usersData) {
        if (user.is_active) activeCount++
        else suspendedCount++
        
        const typeName = user.user_type?.type_name?.toLowerCase() || ''
        if (typeName === 'job seeker') jobSeekersCount++
        else if (typeName === 'employer') employersCount++
        else if (typeName === 'admin') adminsCount++
        else if (typeName === 'super admin') superAdminsCount++
      }
      
      setStats({
        total: usersData.length,
        active: activeCount,
        suspended: suspendedCount,
        jobSeekers: jobSeekersCount,
        employers: employersCount,
        admins: adminsCount,
        superAdmins: superAdminsCount
      })
      
      const pages = response.data?.pagination?.pages || Math.ceil(usersData.length / 20) || 1
      setTotalPages(pages)
      
    } catch (error: any) {
      console.error('Error:', error)
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to load users" })
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, roleFilter, statusFilter, activeTab])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    setSearchTerm('')
    if (tab === 'all') setRoleFilter('all')
    else if (tab === 'job_seekers') setRoleFilter('Job Seeker')
    else if (tab === 'employers') setRoleFilter('Employer')
    else if (tab === 'admins') setRoleFilter('all')
  }

  // Update user status (suspend/activate) - Used only in View Dialog
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: isActive })
      toast({ 
        title: "Success", 
        description: `User ${isActive ? 'activated' : 'suspended'} successfully` 
      })
      fetchUsers()
      setIsDetailOpen(false)
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to update user status" 
      })
    }
  }

  const deleteUser = async (userId: string) => {
    if (confirm('⚠️ Delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`)
        toast({ title: "Success", description: "User deleted successfully" })
        fetchUsers()
        setIsDetailOpen(false)
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to delete user" })
      }
    }
  }

  const resetUserPassword = async (userId: string) => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" })
      return
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" })
      return
    }
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { newPassword })
      toast({ title: "Success", description: "Password reset successfully" })
      setIsResetPasswordOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to reset password" })
    }
  }

  const getRoleBadge = (role: string | undefined) => {
    if (!role) return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Unknown</Badge>
    switch (role.toLowerCase()) {
      case 'super admin': return <Badge className="bg-linear-to-r from-red-500 to-red-600 text-white border-0">Super Admin</Badge>
      case 'admin': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>
      case 'employer': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Employer</Badge>
      case 'job seeker': return <Badge className="bg-green-100 text-green-800 border-green-200">Job Seeker</Badge>
      default: return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"><XCircle className="h-3 w-3" />Suspended</Badge>
  )

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A'
  const getUserDisplayName = (user: User) => user.full_name || user.employer_profile?.company_name || user.seeker_profile?.full_name || user.email.split('@')[0]
  const getUserPhone = (user: User) => user.phone || user.seeker_profile?.phone || null
  const getUserLocation = (user: User) => user.location || user.seeker_profile?.location || user.employer_profile?.location || null

  // Apply all filters
  const filteredUsers = users.filter(user => {
    const userTypeName = user.user_type?.type_name || ''
    
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || userTypeName === roleFilter
    
    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = user.is_active === true
    } else if (statusFilter === 'suspended') {
      matchesStatus = user.is_active === false
    }
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'job_seekers' && userTypeName === 'Job Seeker') ||
      (activeTab === 'employers' && userTypeName === 'Employer') ||
      (activeTab === 'admins' && (userTypeName === 'Admin' || userTypeName === 'Super Admin'))
    
    return matchesSearch && matchesRole && matchesStatus && matchesTab
  })

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-96 bg-white rounded-xl">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor platform users</p>
        </div>
        <Button variant="outline" onClick={() => fetchUsers()} className="bg-white border-gray-300 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => handleTabChange('all')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-green-200" onClick={() => { setStatusFilter('active'); setPage(1); }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-red-200" onClick={() => { setStatusFilter('suspended'); setPage(1); }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
            <p className="text-xs text-gray-500">Suspended</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-blue-200" onClick={() => handleTabChange('job_seekers')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.jobSeekers}</p>
            <p className="text-xs text-gray-500">Job Seekers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-purple-200" onClick={() => handleTabChange('employers')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.employers}</p>
            <p className="text-xs text-gray-500">Employers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-orange-200" onClick={() => handleTabChange('admins')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.admins + stats.superAdmins}</p>
            <p className="text-xs text-gray-500">Admins</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-red-200" onClick={() => handleTabChange('admins')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.superAdmins}</p>
            <p className="text-xs text-gray-500">Super Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="text-gray-900">
              {activeTab === 'all' ? 'All Users' : activeTab === 'job_seekers' ? 'Job Seekers' : activeTab === 'employers' ? 'Employers' : 'Admins'} 
              <span className="text-sm text-gray-500 ml-2">({filteredUsers.length})</span>
            </CardTitle>
            <div className="flex gap-3 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by email, name or company..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-9 bg-white border-gray-300"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Job Seeker">Job Seeker</SelectItem>
                  <SelectItem value="Employer">Employer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-gray-700">User</TableHead>
                    <TableHead className="text-gray-700">Role</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-gray-700">Joined</TableHead>
                    <TableHead className="text-gray-700">Activity</TableHead>
                    <TableHead className="text-right text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-blue-100">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getUserDisplayName(user).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{getUserDisplayName(user)}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.user_type?.type_name)}</TableCell>
                      <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.user_type?.type_name === 'Employer' ? (
                          <span className="text-blue-600 font-medium">{user.stats?.jobs_count || 0} jobs</span>
                        ) : user.user_type?.type_name === 'Job Seeker' ? (
                          <span className="text-green-600 font-medium">{user.stats?.applications_count || 0} apps</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* View Button - Only this remains */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedUser(user); setIsDetailOpen(true) }} 
                            className="hover:bg-gray-100" 
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          
                          {/* Reset Password Button */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedUser(user); setIsResetPasswordOpen(true) }} 
                            className="hover:bg-gray-100" 
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4 text-gray-600" />
                          </Button>
                          
                          {/* ❌ SUSPEND/ACTIVATE BUTTON REMOVED - Now only in View Dialog */}
                          
                          {/* Delete Button (Super Admin only) */}
                          {isSuperAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:bg-red-50" 
                              onClick={() => deleteUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border-gray-300">
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border-gray-300">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog - NOW CONTAINS THE SUSPEND/ACTIVATE BUTTON */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white border border-gray-200">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 text-gray-900">
                  <Users className="h-5 w-5" />
                  User Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* User Header */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 bg-blue-200">
                      <AvatarFallback className="bg-blue-200 text-blue-700 text-xl">
                        {getUserDisplayName(selectedUser).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{getUserDisplayName(selectedUser)}</h2>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-2">
                        {getRoleBadge(selectedUser.user_type?.type_name)}
                        {getStatusBadge(selectedUser.is_active)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {getUserPhone(selectedUser) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{getUserPhone(selectedUser)}</span>
                      </div>
                    )}
                    {getUserLocation(selectedUser) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{getUserLocation(selectedUser)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">Joined: {formatDate(selectedUser.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions - Suspend/Activate moved HERE (only in View Dialog) */}
                <div className="border-t pt-4 border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Moderation Actions</h3>
                  <div className="flex gap-3 flex-wrap">
                    <Button 
                      variant="outline" 
                      onClick={() => { setIsResetPasswordOpen(true); setIsDetailOpen(false) }} 
                      className="bg-white border-gray-300"
                    >
                      <Key className="h-4 w-4 mr-2 text-gray-600" />
                      Reset Password
                    </Button>
                    
                    {/* ✅ SUSPEND/ACTIVATE BUTTON - NOW ONLY HERE */}
                    {selectedUser.is_active ? (
                      <Button 
                        variant="outline" 
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-white" 
                        onClick={() => updateUserStatus(selectedUser.id, false)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                    ) : (
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => updateUserStatus(selectedUser.id, true)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate User
                      </Button>
                    )}
                    
                    {/* Delete Button (Super Admin only) */}
                    {isSuperAdmin && (
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-600 hover:bg-red-50 bg-white" 
                        onClick={() => deleteUser(selectedUser.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reset Password</DialogTitle>
            <DialogDescription className="text-gray-500">Set new password for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-white border-gray-300" />
            </div>
            <div>
              <Label className="text-gray-700">Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-white border-gray-300" />
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                User will be able to log in with this new password.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)} className="bg-white border-gray-300">Cancel</Button>
            <Button onClick={() => selectedUser && resetUserPassword(selectedUser.id)} className="bg-blue-600 hover:bg-blue-700 text-white">Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement