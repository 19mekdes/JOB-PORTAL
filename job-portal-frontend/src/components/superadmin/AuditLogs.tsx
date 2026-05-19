import React, { useState, useEffect } from 'react'
import {
  ClipboardList,
  RefreshCw,
  Download,
  Activity,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserX,
  Settings,
  Briefcase,
  FileText,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/common/LoadingSpinner'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface AuditLog {
  id: number
  admin_id: string
  action: string
  target_type: string
  target_id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any
  ip_address: string
  created_at: string
  admin?: {
    email: string
    user_type?: {
      type_name: string
    }
  }
}

interface AuditLogFilters {
  admin_id?: string
  action?: string
  target_type?: string
  start_date?: string
  end_date?: string
  page: number
  limit: number
}

const actionColors: Record<string, string> = {
  CREATE_ADMIN: 'bg-green-100 text-green-800',
  UPDATE_ADMIN: 'bg-blue-100 text-blue-800',
  DELETE_ADMIN: 'bg-red-100 text-red-800',
  SUSPEND_USER: 'bg-yellow-100 text-yellow-800',
  ACTIVATE_USER: 'bg-green-100 text-green-800',
  DELETE_USER: 'bg-red-100 text-red-800',
  UPDATE_SYSTEM_SETTINGS: 'bg-purple-100 text-purple-800',
  MODERATE_JOB: 'bg-orange-100 text-orange-800',
  CREATE_INDUSTRY: 'bg-teal-100 text-teal-800',
  UPDATE_INDUSTRY: 'bg-blue-100 text-blue-800',
  DELETE_INDUSTRY: 'bg-red-100 text-red-800'
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE_ADMIN: <UserPlus className="h-4 w-4" />,
  UPDATE_ADMIN: <Edit className="h-4 w-4" />,
  DELETE_ADMIN: <Trash2 className="h-4 w-4" />,
  SUSPEND_USER: <UserX className="h-4 w-4" />,
  ACTIVATE_USER: <UserCheck className="h-4 w-4" />,
  DELETE_USER: <Trash2 className="h-4 w-4" />,
  UPDATE_SYSTEM_SETTINGS: <Settings className="h-4 w-4" />,
  MODERATE_JOB: <Briefcase className="h-4 w-4" />,
  CREATE_INDUSTRY: <FileText className="h-4 w-4" />,
  UPDATE_INDUSTRY: <Edit className="h-4 w-4" />,
  DELETE_INDUSTRY: <Trash2 className="h-4 w-4" />
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>
  (null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchAuditLogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.admin_id) params.append('admin_id', filters.admin_id)
      if (filters.action) params.append('action', filters.action)
      if (filters.target_type) params.append('target_type', filters.target_type)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())

      const response = await api.get(`/super-admin/audit-logs?${params.toString()}`)
      setLogs(response.data.data)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load audit logs",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/super-admin/audit-logs/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: "Export Complete",
        description: "Audit logs exported successfully",
      })
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export audit logs",
      })
    }
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const getActionBadge = (action: string) => {
    return (
      <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
        <span className="flex items-center gap-1">
          {actionIcons[action]}
          {action.replace(/_/g, ' ')}
        </span>
      </Badge>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-gray-500 mt-1">Track all system activities and changes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchAuditLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Admin User</Label>
              <Input
                placeholder="Admin email..."
                value={filters.admin_id || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, admin_id: e.target.value, page: 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value, page: 1 }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE_ADMIN">Create Admin</SelectItem>
                  <SelectItem value="UPDATE_ADMIN">Update Admin</SelectItem>
                  <SelectItem value="DELETE_ADMIN">Delete Admin</SelectItem>
                  <SelectItem value="SUSPEND_USER">Suspend User</SelectItem>
                  <SelectItem value="ACTIVATE_USER">Activate User</SelectItem>
                  <SelectItem value="DELETE_USER">Delete User</SelectItem>
                  <SelectItem value="UPDATE_SYSTEM_SETTINGS">System Settings</SelectItem>
                  <SelectItem value="MODERATE_JOB">Moderate Job</SelectItem>
                  <SelectItem value="CREATE_INDUSTRY">Create Industry</SelectItem>
                  <SelectItem value="UPDATE_INDUSTRY">Update Industry</SelectItem>
                  <SelectItem value="DELETE_INDUSTRY">Delete Industry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Type</Label>
              <Input
                placeholder="User, Job, Industry..."
                value={filters.target_type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, target_type: e.target.value, page: 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value, page: 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setFilters({ page: 1, limit: 20 })}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>{logs.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                {(log.admin?.email || 'A').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{log.admin?.email || 'System'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.target_type}</p>
                            <p className="text-xs text-gray-500">ID: {log.target_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {log.ip_address}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {filters.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Timestamp</p>
                  <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">IP Address</p>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Admin</p>
                  <p className="text-sm">{selectedLog.admin?.email || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Admin Role</p>
                  <p className="text-sm">{selectedLog.admin?.user_type?.type_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Action</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Target</p>
                  <p className="text-sm">
                    {selectedLog.target_type} (ID: {selectedLog.target_id})
                  </p>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Details</h4>
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto max-h-60">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditLogs