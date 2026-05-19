// src/pages/superadmin/AuditLogs.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Filter, Download, Eye, 
  UserPlus, UserMinus, Edit, Trash2,
  Clock, Shield, Activity, Database, Settings,
  RefreshCw
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AuditLog {
  id: string
  action: string
  adminName: string
  adminEmail: string
  entityType: string
  entityId: string
  timestamp: string
  ipAddress: string
  details: string
}

const API_BASE_URL = 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('admin_token')

// Mock data for when backend is not available
const getMockAuditLogs = (): AuditLog[] => [
  {
    id: '1',
    action: 'CREATE_ADMIN',
    adminName: 'Super Admin',
    adminEmail: 'superadmin@jobportal.com',
    entityType: 'admin',
    entityId: 'admin_123',
    timestamp: new Date().toLocaleString(),
    ipAddress: '192.168.1.1',
    details: 'Created new admin account for John Doe'
  },
  {
    id: '2',
    action: 'UPDATE_SETTINGS',
    adminName: 'Super Admin',
    adminEmail: 'superadmin@jobportal.com',
    entityType: 'system',
    entityId: 'settings_1',
    timestamp: new Date().toLocaleString(),
    ipAddress: '192.168.1.1',
    details: 'Updated system notification settings'
  },
  {
    id: '3',
    action: 'LOGIN',
    adminName: 'Super Admin',
    adminEmail: 'superadmin@jobportal.com',
    entityType: 'auth',
    entityId: 'session_789',
    timestamp: new Date().toLocaleString(),
    ipAddress: '192.168.1.1',
    details: 'Successful login'
  }
]

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase()
  if (actionLower.includes('create') || actionLower === 'create_admin') 
    return <UserPlus className="h-4 w-4 text-green-600" />
  if (actionLower.includes('delete')) 
    return <UserMinus className="h-4 w-4 text-red-600" />
  if (actionLower.includes('update')) 
    return <Edit className="h-4 w-4 text-blue-600" />
  if (actionLower.includes('setting')) 
    return <Settings className="h-4 w-4 text-purple-600" />
  if (actionLower.includes('login')) 
    return <Activity className="h-4 w-4 text-indigo-600" />
  return <Activity className="h-4 w-4 text-gray-600" />
}

const getActionBadge = (action: string) => {
  const actionLower = action.toLowerCase()
  if (actionLower.includes('create')) return 'bg-green-100 text-green-800'
  if (actionLower.includes('delete')) return 'bg-red-100 text-red-800'
  if (actionLower.includes('update')) return 'bg-blue-100 text-blue-800'
  if (actionLower.includes('setting')) return 'bg-purple-100 text-purple-800'
  if (actionLower.includes('login')) return 'bg-indigo-100 text-indigo-800'
  return 'bg-gray-100 text-gray-800'
}

const getActionDisplay = (action: string) => {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/audit-logs`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setLogs(data.data)
        } else {
          setLogs(getMockAuditLogs())
        }
      } else {
        setLogs(getMockAuditLogs())
      }
    } catch (err) {
      console.error('Error:', err)
      setLogs(getMockAuditLogs())
      setError('Backend not available - showing mock data')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = filterAction === 'all' || log.action === filterAction
    return matchesSearch && matchesAction
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all system activities and admin actions</p>
        </div>
        <Button variant="outline" onClick={fetchAuditLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
          ⚠️ {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE_ADMIN">Create Admin</SelectItem>
                  <SelectItem value="UPDATE_ADMIN">Update Admin</SelectItem>
                  <SelectItem value="DELETE_ADMIN">Delete Admin</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionBadge(log.action)}>
                            {getActionDisplay(log.action)}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-sm">{log.details}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>By: {log.adminName}</span>
                          <span>IP: {log.ipAddress}</span>
                          <span>Type: {log.entityType}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogs