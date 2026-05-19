import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  location: string
  user_type: {
    id: number
    type_name: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
  seeker_profile?: {
    skills: string[]
    experience: string
    education: string
    resume_url: string
  }
  employer_profile?: {
    company_name: string
    company_description: string
    website: string
    location: string
    jobs_count?: number
  }
}

const UserManagement: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: isActive })
      toast({
        title: "Success",
        description: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      })
      fetchUsers()
      setIsDetailOpen(false)
      setIsSuspendOpen(false)
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status",
      })
    }
  }

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`)
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers()
        setIsDetailOpen(false)
      } catch (error) {
        console.error('Error deleting user:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete user",
        })
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateUserRole = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      toast({
        title: "Success",
        description: `User role updated to ${role}`,
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      })
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Super Admin</Badge>
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>
      case 'employer':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Employer</Badge>
      case 'job seeker':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Job Seeker</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Suspended</Badge>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStats = () => {
    const total = users.length
    const active = users.filter(u => u.is_active).length
    const suspended = users.filter(u => !u.is_active).length
    const jobSeekers = users.filter(u => u.user_type?.type_name === 'Job Seeker').length
    const employers = users.filter(u => u.user_type?.type_name === 'Employer').length
    const admins = users.filter(u => u.user_type?.type_name === 'Admin').length
    const superAdmins = users.filter(u => u.user_type?.type_name === 'Super Admin').length

    return { total, active, suspended, jobSeekers, employers, admins, superAdmins }
  }

  const stats = getStats()

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesRole = roleFilter === 'all' || user.user_type?.type_name === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'suspended' && !user.is_active)
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'job_seekers' && user.user_type?.type_name === 'Job Seeker') ||
      (activeTab === 'employers' && user.user_type?.type_name === 'Employer') ||
      (activeTab === 'admins' && (user.user_type?.type_name === 'Admin' || user.user_type?.type_name === 'Super Admin'))
    return matchesSearch && matchesRole && matchesStatus && matchesTab
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor platform users</p>
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => { setActiveTab('all'); setRoleFilter('all') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-green-200" onClick={() => setStatusFilter('active')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-red-200" onClick={() => setStatusFilter('suspended')}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
            <p className="text-xs text-gray-500">Suspended</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-blue-200" onClick={() => { setActiveTab('job_seekers'); setRoleFilter('Job Seeker') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.jobSeekers}</p>
            <p className="text-xs text-gray-500">Job Seekers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-purple-200" onClick={() => { setActiveTab('employers'); setRoleFilter('Employer') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.employers}</p>
            <p className="text-xs text-gray-500">Employers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-orange-200" onClick={() => { setActiveTab('admins'); setRoleFilter('Admin') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.admins}</p>
            <p className="text-xs text-gray-500">Admins</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition border-red-200" onClick={() => { setActiveTab('admins'); setRoleFilter('Super Admin') }}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.superAdmins}</p>
            <p className="text-xs text-gray-500">Super Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="job_seekers">Job Seekers</TabsTrigger>
          <TabsTrigger value="employers">Employers</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {activeTab === 'all' ? 'All Users' : 
                   activeTab === 'job_seekers' ? 'Job Seekers' :
                   activeTab === 'employers' ? 'Employers' : 'Admins'}
                  <span className="text-sm text-gray-500 ml-2">({filteredUsers.length})</span>
                </CardTitle>
                <div className="flex gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Job Seeker">Job Seeker</SelectItem>
                      <SelectItem value="Employer">Employer</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{user.full_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.user_type?.type_name)}</TableCell>
                          <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              {user.user_type?.type_name === 'Employer' && user.employer_profile?.jobs_count !== undefined && (
                                <span className="text-blue-600">{user.employer_profile.jobs_count} jobs</span>
                              )}
                              {user.user_type?.type_name === 'Job Seeker' && user.seeker_profile?.skills?.length && (
                                <span className="text-green-600">{user.seeker_profile.skills.length} skills</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsDetailOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user.is_active ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-yellow-600"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsSuspendOpen(true)
                                  }}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600"
                                  onClick={() => updateUserStatus(user.id, true)}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600"
                                onClick={() => deleteUser(user.id)}
                              >
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* User Header */}
                <div className="bg-blue-50 p-5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-blue-200 text-blue-700 text-xl">
                        {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedUser.full_name || 'N/A'}</h2>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-2">
                        {getRoleBadge(selectedUser.user_type?.type_name)}
                        {getStatusBadge(selectedUser.is_active)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {selectedUser.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedUser.phone}</span>
                      </div>
                    )}
                    {selectedUser.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedUser.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Joined: {formatDate(selectedUser.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Role-specific Information */}
                {selectedUser.user_type?.type_name === 'Employer' && selectedUser.employer_profile && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Company Information</h3>
                    <p className="font-medium">{selectedUser.employer_profile.company_name}</p>
                    {selectedUser.employer_profile.company_description && (
                      <p className="text-sm text-gray-600 mt-2">{selectedUser.employer_profile.company_description}</p>
                    )}
                    {selectedUser.employer_profile.website && (
                      <a href={selectedUser.employer_profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                        Visit Website
                      </a>
                    )}
                  </div>
                )}

                {selectedUser.user_type?.type_name === 'Job Seeker' && selectedUser.seeker_profile && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Skills & Experience</h3>
                    {selectedUser.seeker_profile.skills && selectedUser.seeker_profile.skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.seeker_profile.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedUser.seeker_profile.experience && (
                      <div className="mb-2">
                        <p className="text-sm font-medium mb-1">Experience</p>
                        <p className="text-sm text-gray-600">{selectedUser.seeker_profile.experience}</p>
                      </div>
                    )}
                    {selectedUser.seeker_profile.education && (
                      <div>
                        <p className="text-sm font-medium mb-1">Education</p>
                        <p className="text-sm text-gray-600">{selectedUser.seeker_profile.education}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Moderation Actions */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Moderation Actions</h3>
                  <div className="flex gap-3">
                    {selectedUser.is_active ? (
                      <Button 
                        variant="outline" 
                        className="text-yellow-600 border-yellow-600"
                        onClick={() => {
                          setIsDetailOpen(false)
                          setIsSuspendOpen(true)
                        }}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                    ) : (
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateUserStatus(selectedUser.id, true)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate User
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => deleteUser(selectedUser.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for suspending this user..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the user via email.
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Suspending a user will prevent them from logging in and accessing the platform.
                They will not be able to post jobs or apply for positions.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedUser && updateUserStatus(selectedUser.id, false)}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement