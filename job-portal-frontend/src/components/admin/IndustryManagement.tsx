/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  Check,
  Building2,
  Briefcase,
  TrendingUp,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Industry {
  id: number
  industry_name: string
  _count?: {
    jobs: number
    employers: number
  }
  created_at?: string
}

const IndustryManagement: React.FC = () => {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null)
  const [formData, setFormData] = useState({
    industry_name: ''
  })
  const [formErrors, setFormErrors] = useState({
    industry_name: ''
  })

  useEffect(() => {
    fetchIndustries()
  }, [])

  const fetchIndustries = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/admin/industries')
      setIndustries(response.data.data)
    } catch (error) {
      console.error('Error fetching industries:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load industries. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {
      industry_name: ''
    }
    let isValid = true

    if (!formData.industry_name.trim()) {
      errors.industry_name = 'Industry name is required'
      isValid = false
    } else if (formData.industry_name.length < 2) {
      errors.industry_name = 'Industry name must be at least 2 characters'
      isValid = false
    } else if (formData.industry_name.length > 50) {
      errors.industry_name = 'Industry name cannot exceed 50 characters'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingIndustry) {
        // Update existing industry
        await api.put(`/admin/industries/${editingIndustry.id}`, formData)
        toast({
          variant: "success",
          title: "Success",
          description: "Industry updated successfully",
        })
      } else {
        // Create new industry
        await api.post('/admin/industries', formData)
        toast({
          variant: "success",
          title: "Success",
          description: "Industry created successfully",
        })
      }
      await fetchIndustries()
      handleCloseDialog()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving industry:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save industry. Please try again.",
      })
    }
  }

  const handleDelete = async () => {
    if (!editingIndustry) return

    try {
      await api.delete(`/admin/industries/${editingIndustry.id}`)
      toast({
        variant: "success",
        title: "Success",
        description: "Industry deleted successfully",
      })
      await fetchIndustries()
      setIsDeleteDialogOpen(false)
      setEditingIndustry(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error deleting industry:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete industry. Please try again.",
      })
    }
  }

  const handleOpenCreateDialog = () => {
    setEditingIndustry(null)
    setFormData({ industry_name: '' })
    setFormErrors({ industry_name: '' })
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (industry: Industry) => {
    setEditingIndustry(industry)
    setFormData({ industry_name: industry.industry_name })
    setFormErrors({ industry_name: '' })
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (industry: Industry) => {
    setEditingIndustry(industry)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingIndustry(null)
    setFormData({ industry_name: '' })
    setFormErrors({ industry_name: '' })
  }

  const filteredIndustries = industries.filter(industry =>
    industry.industry_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: industries.length,
    totalJobs: industries.reduce((sum, ind) => sum + (ind._count?.jobs || 0), 0),
    totalEmployers: industries.reduce((sum, ind) => sum + (ind._count?.employers || 0), 0),
    topIndustry: industries.length > 0 
      ? [...industries].sort((a, b) => (b._count?.jobs || 0) - (a._count?.jobs || 0))[0]
      : null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading industries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Industry Management</h1>
          <p className="text-gray-500 mt-1">Manage job categories and industries</p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Industry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Industries</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jobs Posted</p>
                <p className="text-2xl font-bold">{stats.totalJobs.toLocaleString()}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Companies</p>
                <p className="text-2xl font-bold">{stats.totalEmployers.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Industry Highlight */}
      {stats.topIndustry && (
        <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Top Industry</p>
                <p className="text-xl font-bold text-gray-900">{stats.topIndustry.industry_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.topIndustry._count?.jobs || 0} jobs • {stats.topIndustry._count?.employers || 0} companies
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industries Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Industries</CardTitle>
              <CardDescription>Manage job categories and their associations</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIndustries.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">No industries found</p>
              <Button variant="link" onClick={handleOpenCreateDialog} className="mt-2">
                Add your first industry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Industry Name</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndustries.map((industry) => (
                  <TableRow key={industry.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {industry.industry_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{industry._count?.jobs || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{industry._count?.employers || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {industry.created_at ? new Date(industry.created_at).toLocaleDateString() : 'N/A'}
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
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(industry)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(industry)}
                            className="text-red-600"
                            disabled={(industry._count?.jobs || 0) > 0 || (industry._count?.employers || 0) > 0}
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingIndustry ? 'Edit Industry' : 'Add New Industry'}
              </DialogTitle>
              <DialogDescription>
                {editingIndustry 
                  ? 'Update the industry name below.' 
                  : 'Enter the name of the new industry below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="industry_name">
                  Industry Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="industry_name"
                  value={formData.industry_name}
                  onChange={(e) => setFormData({ ...formData, industry_name: e.target.value })}
                  placeholder="e.g., Technology, Healthcare, Finance"
                  className={formErrors.industry_name ? 'border-red-500' : ''}
                />
                {formErrors.industry_name && (
                  <p className="text-red-500 text-xs">{formErrors.industry_name}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingIndustry ? 'Save Changes' : 'Create Industry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the industry
              "{editingIndustry?.industry_name}".
              {(editingIndustry?._count?.jobs || 0) > 0 && (
                <span className="block mt-2 text-red-600">
                  Warning: This industry has {editingIndustry?._count?.jobs} jobs associated with it.
                  Deleting it may affect these job postings.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default IndustryManagement