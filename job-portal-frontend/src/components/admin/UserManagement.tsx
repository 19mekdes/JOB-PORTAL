/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Trash2,
  Shield,
  Building2,
  Briefcase,
  RefreshCw,
  Download,
  Users,
  Eye,
  Edit,
  Ban,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'
import { Switch } from '../ui/switch'
import { Separator } from '@radix-ui/react-dropdown-menu'

interface User {
  id: string
  email: string
  user_type: {
    id: number
    type_name: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
  seeker_profile?: {
    id: string
    full_name: string
    phone: string | null
    location: string | null
    skills: string[]
    resume_url: string | null
  }
  employer_profile?: {
    id: string
    company_name: string
    company_description: string | null
    website: string | null
    logo_url: string | null
    location: string | null
    company_size: string | null
    industry: {
      industry_name: string
    }
  }
  _count?: {
    notifications: number
    search_logs: number
  }
}

interface UserFilters {
  search: string
  user_type: string
  is_active: string
  page: number
  limit: number
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    user_type: 'all',
    is_active: 'all',
    page: 1,
    limit: 10
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    email: '',
    user_type: '',
    is_active: true
  })
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.user_type !== 'all') params.append('user_type', filters.user_type)
      if (filters.is_active !== 'all') params.append('is_active', filters.is_active)
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())

      const response = await api.get(`/admin/users?${params.toString()}`)
      setUsers(response.data.data)
      setTotalPages(response.data.pagination.pages)
      setTotalUsers(response.data.pagination.total)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!selectedUser) return

    try {
      await api.put(`/admin/users/${selectedUser.id}/suspend`)
      toast({
        variant: "success",
        title: "User Suspended",
        description: `${selectedUser.email} has been suspended`,
      })
      await fetchUsers()
      setIsSuspendDialogOpen(false)
      setSelectedUser(null)
      setSuspendReason('')
    } catch (error) {
      console.error('Error suspending user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suspend user",
      })
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/activate`)
      toast({
        variant: "success",
        title: "User Activated",
        description: "User has been activated",
      })
      await fetchUsers()
    } catch (error) {
      console.error('Error activating user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate user",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      await api.delete(`/admin/users/${selectedUser.id}`)
      toast({
        variant: "success",
        title: "User Deleted",
        description: `${selectedUser.email} has been deleted`,
      })
      await fetchUsers()
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return

    try {
      await api.put(`/admin/users/${selectedUser.id}`, editFormData)
      toast({
        variant: "success",
        title: "User Updated",
        description: "User information has been updated",
      })
      await fetchUsers()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      email: user.email,
      user_type: user.user_type.type_name,
      is_active: user.is_active
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return <Badge variant="destructive" className="bg-purple-600">Super Admin</Badge>
      case 'Admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'Employer':
        return <Badge variant="default" className="bg-blue-600">Employer</Badge>
      case 'Job Seeker':
        return <Badge variant="secondary">Job Seeker</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const stats = {
    total: totalUsers,
    active: users.filter(u => u.is_active).length,
    suspended: users.filter(u => !u.is_active).length,
    employers: users.filter(u => u.user_type.type_name === 'Employer').length,
    jobSeekers: users.filter(u => u.user_type.type_name === 'Job Seeker').length,
    admins: users.filter(u => ['Admin', 'Super Admin'].includes(u.user_type.type_name)).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage and moderate platform users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-5 w-5 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCheck className="h-5 w-5 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserX className="h-5 w-5 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              <p className="text-xs text-gray-500">Suspended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-5 w-5 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{stats.employers}</p>
              <p className="text-xs text-gray-500">Employers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="h-5 w-5 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{stats.jobSeekers}</p>
              <p className="text-xs text-gray-500">Job Seekers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-5 w-5 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-xs text-gray-500">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.user_type}
              onValueChange={(value) => setFilters({ ...filters, user_type: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Job Seeker">Job Seekers</SelectItem>
                <SelectItem value="Employer">Employers</SelectItem>
                <SelectItem value="Admin">Admins</SelectItem>
                <SelectItem value="Super Admin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.is_active}
              onValueChange={(value) => setFilters({ ...filters, is_active: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({
              search: '', user_type: 'all', is_active: 'all', page: 1, limit: 10
            })}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>List of all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.seeker_profile?.full_name || user.employer_profile?.company_name || user.email}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.user_type.type_name)}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span>🔔 {user._count?.notifications || 0}</span>
                          <span>🔍 {user._count?.search_logs || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user)
                              setIsViewDialogOpen(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            {user.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsSuspendDialogOpen(true)
                                }}
                                className="text-yellow-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleActivate(user.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {filters.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Detailed information about the user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                      {selectedUser.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedUser.seeker_profile?.full_name || selectedUser.employer_profile?.company_name || selectedUser.email}
                    </h3>
                    <p className="text-gray-500">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      {getRoleBadge(selectedUser.user_type.type_name)}
                      {selectedUser.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                    <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p>{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedUser.seeker_profile && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Job Seeker Profile</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p>{selectedUser.seeker_profile.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p>{selectedUser.seeker_profile.location || 'Not provided'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Skills</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedUser.seeker_profile.skills.length > 0 ? (
                              selectedUser.seeker_profile.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary">{skill}</Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">No skills listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.employer_profile && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Employer Profile</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Company</p>
                          <p>{selectedUser.employer_profile.company_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Industry</p>
                          <p>{selectedUser.employer_profile.industry.industry_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Company Size</p>
                          <p>{selectedUser.employer_profile.company_size || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p>{selectedUser.employer_profile.location || 'Not specified'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Website</p>
                          <p>{selectedUser.employer_profile.website || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">User Role</Label>
              <Select
                value={editFormData.user_type}
                onValueChange={(value) => setEditFormData({ ...editFormData, user_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Job Seeker">Job Seeker</SelectItem>
                  <SelectItem value="Employer">Employer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-status">Account Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Suspended</span>
                <Switch
                  checked={editFormData.is_active}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
                />
                <span className="text-sm">Active</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {selectedUser?.email}?
              The user will not be able to access their account until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="suspend-reason">Reason (Optional)</Label>
            <Textarea
              id="suspend-reason"
              placeholder="Provide a reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} className="bg-yellow-600 hover:bg-yellow-700">
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and all associated data including jobs, applications, and profile information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default UserManagement