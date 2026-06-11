/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, Download, Upload, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, HardDrive, Trash2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Backup {
  id: string
  name: string
  type: 'full' | 'partial' | 'database'
  size: string
  size_bytes: number
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  created_by: string
  location: string
}

interface StorageStats {
  used: number
  total: number
  percentage: number
  available: number
  backup_count: number
}

const BackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats>({
    used: 0,
    total: 50 * 1024 * 1024 * 1024,
    percentage: 0,
    available: 50 * 1024 * 1024 * 1024,
    backup_count: 0
  })

  // Use the same token check as the API service
  // The token is automatically handled by the api service
  // So we don't need to manually check for token

  // Fetch backups from backend
  const fetchBackups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching backups from /admin/backups...')
      const response = await api.get('/admin/backups')
      console.log('Backups response:', response.data)
      
      let backupList: Backup[] = []
      if (response.data?.data && Array.isArray(response.data.data)) {
        backupList = response.data.data
      }
      
      setBackups(backupList)
      
    } catch (err: any) {
      console.error('Failed to fetch backups:', err)
      // Don't show error for missing table, just use empty list
      setBackups([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch storage stats
  const fetchStorageStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/backups/stats')
      console.log('Storage stats:', response.data)
      
      if (response.data?.data) {
        setStorageStats(response.data.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch storage stats:', err)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
    fetchStorageStats()
  }, [fetchBackups, fetchStorageStats])

  // Create new backup
  const startBackup = async () => {
    setIsBackingUp(true)
    setBackupProgress(0)
    setError(null)
    
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 500)
      
      const response = await api.post('/admin/backups/create', { 
        backupType: 'full' 
      })
      
      clearInterval(interval)
      setBackupProgress(100)
      
      if (response.data?.success) {
        toast({ 
          title: "Success", 
          description: "Backup created successfully!" 
        })
        await fetchBackups()
        await fetchStorageStats()
      } else {
        throw new Error(response.data?.message || 'Backup failed')
      }
      
    } catch (err: any) {
      console.error('Backup error:', err)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: err.message || "Failed to create backup" 
      })
    } finally {
      setIsBackingUp(false)
      setTimeout(() => setBackupProgress(0), 1000)
    }
  }

  // Download backup
  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await api.get(`/admin/backups/${backup.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${backup.name.toLowerCase().replace(/\s/g, '_')}.sql.gz`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ 
        title: "Success", 
        description: "Download started!" 
      })
      
    } catch (err: any) {
      console.error('Download error:', err)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to download backup" 
      })
    }
  }

  // Delete backup
  const deleteBackup = async (backupId: string, backupName: string) => {
    if (!confirm(`Are you sure you want to delete ${backupName}? This action cannot be undone.`)) return
    
    try {
      await api.delete(`/admin/backups/${backupId}`)
      
      toast({ 
        title: "Success", 
        description: "Backup deleted successfully" 
      })
      await fetchBackups()
      await fetchStorageStats()
      
    } catch (err: any) {
      console.error('Delete error:', err)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to delete backup" 
      })
    }
  }

  // Restore backup
  const restoreBackup = async (backupId: string, backupName: string) => {
    if (!confirm(`WARNING: Restoring ${backupName} will overwrite current data. This action cannot be undone. Continue?`)) return
    
    try {
      const response = await api.post(`/admin/backups/${backupId}/restore`)
      
      if (response.data?.success) {
        toast({ 
          title: "Success", 
          description: "Restore initiated successfully! The system will restart." 
        })
      } else {
        throw new Error(response.data?.message || 'Restore failed')
      }
      
  
    } catch (err: any) {
      console.error('Restore error:', err)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: err.message || "Failed to restore backup" 
      })
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      full: 'bg-purple-100 text-purple-800',
      partial: 'bg-blue-100 text-blue-800',
      database: 'bg-green-100 text-green-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': 
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': 
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case 'failed': 
        return <XCircle className="h-4 w-4 text-red-600" />
      default: 
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': 
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending': 
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed': 
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
          <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="text-gray-500 mt-1">Manage system backups and data recovery</p>
          <p className="text-sm text-gray-400 mt-1">
            Total backups: <span className="font-semibold">{backups.length}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchBackups(); fetchStorageStats(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Backup Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a new backup of your system data including users, jobs, and settings.
            </p>
            {isBackingUp ? (
              <div className="space-y-2">
                <Progress value={backupProgress} />
                <p className="text-sm text-gray-500 text-center">
                  Backing up... {backupProgress}%
                </p>
              </div>
            ) : (
              <Button onClick={startBackup} className="w-full bg-purple-600 hover:bg-purple-700">
                <Database className="h-4 w-4 mr-2" />
                Start New Backup
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-600" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used Space</span>
              <span className="font-semibold text-gray-900">
                {formatBytes(storageStats.used)} / {formatBytes(storageStats.total)}
              </span>
            </div>
            <Progress value={storageStats.percentage} />
            <p className="text-xs text-gray-500 mt-2">
              {storageStats.percentage.toFixed(1)}% of total storage used
            </p>
            <p className="text-xs text-gray-500">
              {storageStats.backup_count} backup files stored
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Restore System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Restore system from a previous backup. This will overwrite current data.
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={backups.filter(b => b.status === 'completed').length === 0}
              onClick={() => {
                const latestBackup = backups.find(b => b.status === 'completed')
                if (latestBackup) {
                  restoreBackup(latestBackup.id, latestBackup.name)
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Restore from Latest Backup
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900">Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No backups found</p>
              <Button onClick={startBackup} className="mt-4" variant="outline">
                Create your first backup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start sm:items-center gap-4 mb-3 sm:mb-0">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{backup.name}</p>
                        <Badge className={getTypeBadge(backup.type)}>
                          {backup.type.toUpperCase()}
                        </Badge>
                        {getStatusBadge(backup.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                      className="text-red-600 hover:text-red-700"
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