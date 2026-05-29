// src/pages/superadmin/AuditLogs.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, RefreshCw, Download, Eye, 
  UserPlus, UserMinus, Edit, Trash2, Settings,
  Clock, Shield, Activity, AlertCircle, LogIn,
  Building, Briefcase, FileText, CheckCircle, XCircle
} from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'

const API_BASE_URL = 'http://localhost:5000/api'

interface AuditLog {
  id: string
  action: string
  performed_by: string
  performed_by_email: string
  performed_by_role: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
  created_at: string
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  const getToken = () => localStorage.getItem('token')

  const getCurrentUserRole = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUserRole(user.user_type === 'Super Admin' ? 'Super Admin' : 'Admin')
      } else {
        setCurrentUserRole('Admin')
      }
    } catch (error) {
      setCurrentUserRole('Admin')
    }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) {
        setError('No authentication token found. Please login.')
        setLoading(false)
        return
      }

      console.log('Fetching audit logs with token:', token.substring(0, 50) + '...')
      
      const response = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      console.log('Response:', data)
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch')
      }
      
      let auditLogs: AuditLog[] = []
      if (data.data && Array.isArray(data.data)) {
        auditLogs = data.data
      } else if (Array.isArray(data)) {
        auditLogs = data
      }
      
      console.log(`✅ Found ${auditLogs.length} audit logs`)
      setLogs(auditLogs)
      setFilteredLogs(auditLogs)
      
    } catch (err: any) {
      console.error('Failed to fetch:', err)
      setError(err.message || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...logs]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(term) ||
        log.performed_by.toLowerCase().includes(term) ||
        log.target_type.toLowerCase().includes(term)
      )
    }
    
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction)
    }
    
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.created_at) >= new Date(startDate))
    }
    
    if (endDate) {
      filtered = filtered.filter(log => new Date(log.created_at) <= new Date(endDate + 'T23:59:59'))
    }
    
    setFilteredLogs(filtered)
  }, [logs, searchTerm, filterAction, startDate, endDate])

  useEffect(() => {
    getCurrentUserRole()
    fetchAuditLogs()
  }, [fetchAuditLogs, getCurrentUserRole])

  const handleExport = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/admin/audit-logs/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: "Success", description: "Audit logs exported" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Export failed" })
    }
  }

  const openDetailsDialog = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailsOpen(true)
  }

  const getActionIcon = (action: string) => {
    const a = action?.toLowerCase() || ''
    if (a.includes('create')) return <UserPlus className="h-4 w-4 text-green-600" />
    if (a.includes('delete')) return <Trash2 className="h-4 w-4 text-red-600" />
    if (a.includes('update')) return <Edit className="h-4 w-4 text-blue-600" />
    if (a.includes('login')) return <LogIn className="h-4 w-4 text-indigo-600" />
    if (a.includes('verify')) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (a.includes('job')) return <Briefcase className="h-4 w-4 text-blue-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getActionBadgeClass = (action: string) => {
    const a = action?.toLowerCase() || ''
    if (a.includes('create')) return 'bg-green-100 text-green-800'
    if (a.includes('delete')) return 'bg-red-100 text-red-800'
    if (a.includes('update')) return 'bg-blue-100 text-blue-800'
    if (a.includes('login')) return 'bg-indigo-100 text-indigo-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getActionDisplay = (action: string) => {
    return action?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || action
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const isSuperAdmin = currentUserRole === 'Super Admin'

  // Show login prompt if no token
  if (!getToken()) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Not Authenticated</h2>
        <p className="text-gray-500 mb-4">Please login to view audit logs</p>
        <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <><div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all system activities and admin actions</p>
          <p className="text-sm text-gray-400 mt-1">Logged in as: {currentUserRole || 'Admin'}</p>
          {logs.length > 0 && (
            <p className="text-xs text-green-600 mt-1">✅ {logs.length} audit logs loaded from database</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          {isSuperAdmin && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64 border-gray-300" />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="CREATE_ADMIN">Create Admin</SelectItem>
                  <SelectItem value="UPDATE_ADMIN">Update Admin</SelectItem>
                  <SelectItem value="DELETE_ADMIN">Delete Admin</SelectItem>
                  <SelectItem value="VERIFY_COMPANY">Verify Company</SelectItem>
                  <SelectItem value="APPROVE_JOB">Approve Job</SelectItem>
                  <SelectItem value="SUSPEND_USER">Suspend User</SelectItem>
                  <SelectItem value="RESET_PASSWORD">Reset Password</SelectItem>
                  <SelectItem value="BULK_DELETE_JOBS">Bulk Delete Jobs</SelectItem>
                  <SelectItem value="EXPORT_DATA">Export Data</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No audit logs found</p>
              {logs.length === 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={async () => {
                    const token = getToken()
                    const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                    const data = await res.json()
                    console.log('API Response:', data)
                    alert(`Response: ${JSON.stringify(data, null, 2)}`)
                  } }
                >
                  Debug API
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Performed By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Target</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>

                  </table>
               
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge className={getActionBadgeClass(log.action)}>
                          {getActionDisplay(log.action)}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{log.performed_by}</p>
                      <p className="text-xs text-gray-500">{log.performed_by_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{log.target_type}</p>
                      <p className="text-xs text-gray-500">ID: {log.target_id}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(log.created_at)}</td>
                    <td className="py-3 px-4 text-sm">{log.ip_address}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openDetailsDialog(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>)}
        </div>
        )}
      </CardContent>
    </Card><Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Audit Log Details</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Action</Label><p className="mt-1">{getActionDisplay(selectedLog.action)}</p></div>
                <div><Label>Timestamp</Label><p className="mt-1">{formatDate(selectedLog.created_at)}</p></div>
                <div><Label>Performed By</Label><p className="mt-1">{selectedLog.performed_by}</p></div>
                <div><Label>Role</Label><p className="mt-1">{selectedLog.performed_by_role}</p></div>
                <div><Label>Target Type</Label><p className="mt-1">{selectedLog.target_type}</p></div>
                <div><Label>Target ID</Label><p className="mt-1">{selectedLog.target_id}</p></div>
                <div><Label>IP Address</Label><p className="mt-1">{selectedLog.ip_address}</p></div>
              </div>
              {selectedLog.details && (
                <div><Label>Details</Label><pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-auto">{JSON.stringify(selectedLog.details, null, 2)}</pre></div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditLogs