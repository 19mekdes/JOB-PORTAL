import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, RefreshCw, UserCheck, UserX, Trash2, Eye, Mail, Phone,
  MapPin, Calendar, Briefcase, GraduationCap, AlertCircle, CheckCircle, XCircle, Key
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<UserStats>({
    total: 0, active: 0, suspended: 0, jobSeekers: 0, employers: 0, admins: 0, superAdmins: 0
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      let apiRole = 'all'
      if (activeTab === 'job_seekers') apiRole = 'Job Seeker'
      else if (activeTab === 'employers') apiRole = 'Employer'
      else if (activeTab === 'all') apiRole = roleFilter
      
      const params: any = { page, limit: 20, status: statusFilter }
      if (searchTerm) params.search = searchTerm
      if (apiRole !== 'all') params.role = apiRole
      
      console.log('Fetching users with params:', params)
      
      const response = await api.get('/admin/users', { params })
      
      console.log('API Response:', response.data)
      
      let usersData = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data
      }
      
      setUsers(usersData)
      
      // TRY to get stats from API first
      let statsData = response.data?.stats
      if (!statsData && response.data?.data?.stats) statsData = response.data.data.stats
      if (!statsData && response.data?.stats) statsData = response.data.stats
      
      // If statsData is missing or has zeros, calculate from usersData
      if (!statsData || statsData.total === 0) {
        console.log('Calculating stats from users array...')
        
        let jobSeekersCount = 0
        let employersCount = 0
        let adminsCount = 0
        let superAdminsCount = 0
        let activeCount = 0
        let suspendedCount = 0
        
        for (const user of usersData) {
          if (user.is_active) {
            activeCount++
          } else {
            suspendedCount++
          }
          
          const typeName = user.user_type?.type_name?.toLowerCase() || ''
          if (typeName === 'job seeker') {
            jobSeekersCount++
          } else if (typeName === 'employer') {
            employersCount++
          } else if (typeName === 'admin') {
            adminsCount++
          } else if (typeName === 'super admin') {
            superAdminsCount++
          }
        }
        
        statsData = {
          total: usersData.length,
          active: activeCount,
          suspended: suspendedCount,
          jobSeekers: jobSeekersCount,
          employers: employersCount,
          admins: adminsCount,
          superAdmins: superAdminsCount
        }
        
        console.log('Calculated stats:', statsData)
      }
      
      // Set stats with fallback values
      setStats({
        total: statsData?.total || usersData.length || 0,
        active: statsData?.active || 0,
        suspended: statsData?.suspended || 0,
        jobSeekers: statsData?.jobSeekers || 0,
        employers: statsData?.employers || 0,
        admins: statsData?.admins || 0,
        superAdmins: statsData?.superAdmins || 0
      })
      
      const pages = response.data?.pagination?.pages || Math.ceil((statsData?.total || usersData.length) / 20) || 1
      setTotalPages(pages)
      
    } catch (error: any) {
      console.error('Error:', error)
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to load users" })
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, roleFilter, statusFilter, activeTab])

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

  const updateUserStatus = async (userId: string, isActive: boolean, reason?: string) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: isActive, reason })
      toast({ title: "Success", description: `User ${isActive ? 'activated' : 'suspended'} successfully` })
      fetchUsers()
      setIsDetailOpen(false)
      setIsSuspendOpen(false)
      setSuspendReason('')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed" })
    }
  }

  const deleteUser = async (userId: string) => {
    if (confirm('Delete this user? This cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`)
        toast({ title: "Success", description: "User deleted successfully" })
        fetchUsers()
        setIsDetailOpen(false)
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed" })
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
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed" })
    }
  }

  const getRoleBadge = (role: string | undefined) => {
    if (!role) return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Unknown</Badge>
    switch (role.toLowerCase()) {
      case 'super admin': return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Super Admin</Badge>
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

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-96 bg-white">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white">
        <div className="bg-white">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor platform users</p>
        </div>
        <Button variant="outline" onClick={() => fetchUsers()} className="bg-white border-gray-300 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-white">
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-gray-200" onClick={() => handleTabChange('all')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-green-200" onClick={() => setStatusFilter('active')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-red-200" onClick={() => setStatusFilter('suspended')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
            <p className="text-xs text-gray-500">Suspended</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-blue-200" onClick={() => handleTabChange('job_seekers')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-blue-600">{stats.jobSeekers}</p>
            <p className="text-xs text-gray-500">Job Seekers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-purple-200" onClick={() => handleTabChange('employers')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-purple-600">{stats.employers}</p>
            <p className="text-xs text-gray-500">Employers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-orange-200" onClick={() => handleTabChange('admins')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-orange-600">{stats.admins + stats.superAdmins}</p>
            <p className="text-xs text-gray-500">Admins</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition bg-white border border-red-200" onClick={() => handleTabChange('admins')}>
          <CardContent className="pt-4 text-center bg-white">
            <p className="text-2xl font-bold text-red-600">{stats.superAdmins}</p>
            <p className="text-xs text-gray-500">Super Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 bg-white">
          <div className="flex justify-between items-center flex-wrap gap-4 bg-white">
            <CardTitle className="bg-white text-gray-900">
              {activeTab === 'all' ? 'All Users' : activeTab === 'job_seekers' ? 'Job Seekers' : activeTab === 'employers' ? 'Employers' : 'Admins'} 
              <span className="text-sm text-gray-500 ml-2">({users.length})</span>
            </CardTitle>
            <div className="flex gap-3 flex-wrap bg-white">
              <div className="relative w-64 bg-white">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search..." 
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
        <CardContent className="bg-white">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-white">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="text-gray-700 bg-gray-50">User</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Role</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Status</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Joined</TableHead>
                    <TableHead className="text-gray-700 bg-gray-50">Activity</TableHead>
                    <TableHead className="text-right text-gray-700 bg-gray-50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 border-b border-gray-100 bg-white">
                      <TableCell className="bg-white">
                        <div className="flex items-center gap-3 bg-white">
                          <Avatar className="h-9 w-9 bg-blue-100">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getUserDisplayName(user).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-white">
                            <p className="font-medium text-gray-900">{getUserDisplayName(user)}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="bg-white">{getRoleBadge(user.user_type?.type_name)}</TableCell>
                      <TableCell className="bg-white">{getStatusBadge(user.is_active)}</TableCell>
                      <TableCell className="text-gray-500 text-sm bg-white">{formatDate(user.created_at)}</TableCell>
                      <TableCell className="bg-white">
                        {user.user_type?.type_name === 'Employer' ? `${user.stats?.jobs_count || 0} jobs` : 
                         user.user_type?.type_name === 'Job Seeker' ? `${user.stats?.applications_count || 0} apps` : '-'}
                      </TableCell>
                      <TableCell className="text-right bg-white">
                        <div className="flex justify-end gap-2 bg-white">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setIsDetailOpen(true) }} className="hover:bg-gray-100">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setIsResetPasswordOpen(true) }} className="hover:bg-gray-100">
                            <Key className="h-4 w-4 text-gray-600" />
                          </Button>
                          {user.is_active ? (
                            <Button variant="ghost" size="sm" className="text-yellow-600 hover:bg-yellow-50" onClick={() => { setSelectedUser(user); setIsSuspendOpen(true) }}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => updateUserStatus(user.id, true)}>
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 bg-white">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border-gray-300">
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700 bg-white">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border-gray-300">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
          {selectedUser && (
            <>
              <DialogHeader className="bg-white">
                <DialogTitle className="text-xl flex items-center gap-2 text-gray-900 bg-white">
                  <Users className="h-5 w-5" />
                  User Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 bg-white">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
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
                <div className="border-t pt-4 border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Moderation Actions</h3>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="outline" onClick={() => { setIsResetPasswordOpen(true); setIsDetailOpen(false) }} className="bg-white border-gray-300">
                      <Key className="h-4 w-4 mr-2 text-gray-600" />
                      Reset Password
                    </Button>
                    {selectedUser.is_active ? (
                      <Button variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-white" onClick={() => { setIsSuspendOpen(true); setIsDetailOpen(false) }}>
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    ) : (
                      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateUserStatus(selectedUser.id, true)}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 bg-white" onClick={() => deleteUser(selectedUser.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="bg-white">
          <DialogHeader className="bg-white">
            <DialogTitle className="text-gray-900">Reset Password</DialogTitle>
            <DialogDescription className="text-gray-500">New password for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 bg-white">
            <div className="bg-white">
              <Label className="text-gray-700">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-white border-gray-300" />
            </div>
            <div className="bg-white">
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
          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)} className="bg-white border-gray-300">Cancel</Button>
            <Button onClick={() => selectedUser && resetUserPassword(selectedUser.id)} className="bg-blue-600 hover:bg-blue-700 text-white">Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
        <DialogContent className="bg-white">
          <DialogHeader className="bg-white">
            <DialogTitle className="text-gray-900">Suspend User</DialogTitle>
            <DialogDescription className="text-gray-500">Suspending {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 bg-white">
            <div className="bg-white">
              <Label className="text-gray-700">Reason (Optional)</Label>
              <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3} placeholder="Reason for suspension..." className="bg-white border-gray-300" />
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Suspended users cannot log in or access the platform.
              </p>
            </div>
          </div>
          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsSuspendOpen(false)} className="bg-white border-gray-300">Cancel</Button>
            <Button variant="destructive" onClick={() => selectedUser && updateUserStatus(selectedUser.id, false, suspendReason)}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement