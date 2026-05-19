/* eslint-disable react-hooks/immutability */
// src/pages/superadmin/BackupRestore.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, Download, Upload, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, HardDrive, Trash2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const API_BASE_URL = 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('admin_token')

interface Backup {
  id: string
  name: string
  type: 'full' | 'partial' | 'database'
  size: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  created_by: string
}

const BackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [storageStats, setStorageStats] = useState({
    used: 3.4,
    total: 50,
    percentage: 6.8
  })

  // Fetch backups from backend
  useEffect(() => {
    fetchBackups()
    fetchStorageStats()
  }, [])

  const fetchBackups = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/backups`, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setBackups(data.data)
        } else {
          // If no data from backend, use mock data
          setBackups(getMockBackups())
        }
      } else {
        // If endpoint doesn't exist, use mock data
        setBackups(getMockBackups())
      }
    } catch (err) {
      console.error('Error fetching backups:', err)
      setBackups(getMockBackups())
    } finally {
      setLoading(false)
    }
  }

  const fetchStorageStats = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/storage-stats`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStorageStats(data.data)
        }
      }
    } catch (err) {
      console.error('Error fetching storage stats:', err)
    }
  }

  const getMockBackups = (): Backup[] => {
    return [
      {
        id: '1',
        name: 'Full System Backup',
        type: 'full',
        size: '2.4 GB',
        status: 'completed',
        created_at: new Date().toISOString(),
        created_by: 'System'
      },
      {
        id: '2',
        name: 'Database Backup',
        type: 'database',
        size: '856 MB',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        created_by: 'System'
      },
      {
        id: '3',
        name: 'User Data Backup',
        type: 'partial',
        size: '124 MB',
        status: 'failed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        created_by: 'System'
      }
    ]
  }

  const startBackup = async () => {
    setIsBackingUp(true)
    setBackupProgress(0)
    setError(null)
    setSuccess(null)
    
    try {
      const token = getToken()
      
      // Start the backup process
      const response = await fetch(`${API_BASE_URL}/super-admin/backups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ backupType: 'full' })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Simulate progress for better UX
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 300))
          setBackupProgress(i)
        }
        
        setSuccess('Backup completed successfully!')
        await fetchBackups() // Refresh the list
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error('Backup failed')
      }
    } catch (err) {
      console.error('Backup error:', err)
      setError('Failed to create backup. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsBackingUp(false)
      setBackupProgress(0)
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/backups/${backup.id}/download`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${backup.name.toLowerCase().replace(/\s/g, '_')}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setSuccess('Download started!')
        setTimeout(() => setSuccess(null), 2000)
      } else {
        throw new Error('Download failed')
      }
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download backup')
      setTimeout(() => setError(null), 3000)
    }
  }

  const deleteBackup = async (backupId: string, backupName: string) => {
    if (!confirm(`Are you sure you want to delete ${backupName}? This action cannot be undone.`)) return
    
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/backups/${backupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
      
      if (response.ok) {
        setSuccess('Backup deleted successfully')
        await fetchBackups()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error('Delete failed')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete backup')
      setTimeout(() => setError(null), 3000)
    }
  }

  const restoreBackup = async (backupId: string, backupName: string) => {
    if (!confirm(`WARNING: Restoring ${backupName} will overwrite current data. This action cannot be undone. Continue?`)) return
    
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/backups/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (response.ok) {
        setSuccess('Restore initiated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error('Restore failed')
      }
    } catch (err) {
      console.error('Restore error:', err)
      setError('Failed to restore backup')
      setTimeout(() => setError(null), 3000)
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      full: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      database: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': 
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'pending': 
        return <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
      case 'failed': 
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      default: 
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': 
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>
      case 'pending': 
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>
      case 'failed': 
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Failed</Badge>
      default: 
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-500">Loading backups...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backup & Restore</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system backups and data recovery</p>
        </div>
        <Button variant="outline" onClick={fetchBackups}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">{success}</AlertDescription>
        </Alert>
      )}

      {/* Backup Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a new backup of your system data including users, jobs, and settings.
            </p>
            {isBackingUp ? (
              <div className="space-y-2">
                <Progress value={backupProgress} />
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Backing up... {backupProgress}%
                </p>
              </div>
            ) : (
              <Button onClick={startBackup} className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Start New Backup
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Restore System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Restore system from a previous backup. This will overwrite current data.
            </p>
            <Button variant="outline" className="w-full" disabled={backups.filter(b => b.status === 'completed').length === 0}>
              <Upload className="h-4 w-4 mr-2" />
              Restore from Backup
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-600 dark:text-green-400" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Used Space</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {storageStats.used} GB / {storageStats.total} GB
              </span>
            </div>
            <Progress value={storageStats.percentage} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {storageStats.percentage}% of total storage used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No backups found</p>
              <Button onClick={startBackup} className="mt-4" variant="outline">
                Create your first backup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start sm:items-center gap-4 mb-3 sm:mb-0">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">{backup.name}</p>
                        <Badge className={getTypeBadge(backup.type)}>
                          {backup.type.toUpperCase()}
                        </Badge>
                        {getStatusBadge(backup.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Size: {backup.size}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(backup.created_at)}
                        </span>
                        <span>By: {backup.created_by}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-11 sm:ml-0">
                    {backup.status === 'completed' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadBackup(backup)}
                          title="Download backup"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => restoreBackup(backup.id, backup.name)}
                          title="Restore from backup"
                          className="text-blue-600"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={() => deleteBackup(backup.id, backup.name)}
                      title="Delete backup"
                    >
                      <Trash2 className="h-4 w-4" />
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

export default BackupRestore