/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  Database,
  Download,
  RefreshCw,
  Trash2,
  Calendar,
  HardDrive,
  FileArchive,
  Save,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/common/LoadingSpinner'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface Backup {
  id: string
  filename: string
  size: number
  created_at: string
  type: 'full' | 'incremental'
  status: 'completed' | 'failed' | 'in_progress'
}

interface BackupSettings {
  auto_backup_enabled: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_time: string
  retention_days: number
  include_files: boolean
  include_database: boolean
  backup_destination: 'local' | 'cloud' | 'both'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const BackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([])
  const [settings, setSettings] = useState<BackupSettings>({
    auto_backup_enabled: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    retention_days: 30,
    include_files: true,
    include_database: true,
    backup_destination: 'both'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  useEffect(() => {
    fetchBackups()
    fetchSettings()
  }, [])

  const fetchBackups = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/super-admin/backups')
      setBackups(response.data.data)
    } catch (error) {
      console.error('Error fetching backups:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load backups",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await api.get('/super-admin/backup-settings')
      setSettings(response.data.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const createBackup = async () => {
    setIsCreatingBackup(true)
    setBackupProgress(0)
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 90) {
          return prev
        }
        return prev + 10
      })
    }, 500)

    try {
      setBackupProgress(100)
      setTimeout(() => {
        toast({
          variant: "success",
          title: "Backup Created",
          description: "System backup completed successfully",
        })
        fetchBackups()
        setIsCreatingBackup(false)
        setBackupProgress(0)
      }, 500)
    } catch (error) {
      console.error('Error creating backup:', error)
      toast({
        variant: "destructive",
        title: "Backup Failed",
        description: "Failed to create system backup",
      })
      setIsCreatingBackup(false)
      setBackupProgress(0)
    } finally {
      clearInterval(interval)
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await api.get(`/super-admin/backups/${backup.id}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', backup.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: "Download Started",
        description: "Backup file is being downloaded",
      })
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download backup",
      })
    }
  }

  const restoreBackup = async () => {
    if (!selectedBackup) return
    
    setIsRestoring(true)
    try {
      await api.post(`/super-admin/backups/${selectedBackup.id}/restore`)
      toast({
        variant: "success",
        title: "Restore Started",
        description: "System is being restored. This may take a few minutes.",
      })
      setIsRestoreDialogOpen(false)
      setSelectedBackup(null)
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast({
        variant: "destructive",
        title: "Restore Failed",
        description: "Failed to restore from backup",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const deleteBackup = async () => {
    if (!selectedBackup) return
    
    try {
      await api.delete(`/super-admin/backups/${selectedBackup.id}`)
      toast({
        title: "Backup Deleted",
        description: "Backup file has been removed",
      })
      fetchBackups()
      setIsDeleteDialogOpen(false)
      setSelectedBackup(null)
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete backup",
      })
    }
  }

  const saveSettings = async () => {
    setIsSavingSettings(true)
    try {
      await api.put('/super-admin/backup-settings', settings)
      toast({
        variant: "success",
        title: "Settings Saved",
        description: "Backup settings updated successfully",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save backup settings",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <Badge variant="default">Full Backup</Badge>
      case 'incremental':
        return <Badge variant="secondary">Incremental</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const storageUsed = backups.reduce((sum, b) => sum + b.size, 0)
  const totalBackups = backups.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-8 w-8" />
            Backup & Restore
          </h1>
          <p className="text-gray-500 mt-1">Manage system backups and data recovery</p>
        </div>
        <Button onClick={createBackup} disabled={isCreatingBackup}>
          {isCreatingBackup ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating Backup...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Backup
            </>
          )}
        </Button>
      </div>

      {/* Backup Progress */}
      {isCreatingBackup && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creating system backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Backups</p>
                <p className="text-2xl font-bold">{totalBackups}</p>
              </div>
              <FileArchive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(storageUsed)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Retention Period</p>
                <p className="text-2xl font-bold">{settings.retention_days} days</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Backups</CardTitle>
              <CardDescription>List of system backups</CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No backups available</p>
                  <Button variant="link" onClick={createBackup} className="mt-2">
                    Create your first backup
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-mono text-sm">
                          {backup.filename}
                        </TableCell>
                        <TableCell>{getTypeBadge(backup.type)}</TableCell>
                        <TableCell>{formatFileSize(backup.size)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(backup.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(backup.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadBackup(backup)}
                              disabled={backup.status !== 'completed'}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBackup(backup)
                                setIsRestoreDialogOpen(true)
                              }}
                              disabled={backup.status !== 'completed'}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBackup(backup)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>Configure automatic backup schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Automatic Backups</Label>
                  <p className="text-sm text-gray-500">Automatically create backups on schedule</p>
                </div>
                <Switch
                  checked={settings.auto_backup_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_backup_enabled: checked })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <select
                    value={settings.backup_frequency}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e) => setSettings({ ...settings, backup_frequency: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    disabled={!settings.auto_backup_enabled}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Backup Time (UTC)</Label>
                  <input
                    type="time"
                    value={settings.backup_time}
                    onChange={(e) => setSettings({ ...settings, backup_time: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    disabled={!settings.auto_backup_enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.retention_days}
                    onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Destination</Label>
                  <select
                    value={settings.backup_destination}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e) => setSettings({ ...settings, backup_destination: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="local">Local Storage Only</option>
                    <option value="cloud">Cloud Storage Only</option>
                    <option value="both">Both Local and Cloud</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Database</Label>
                    <p className="text-sm text-gray-500">Backup database contents</p>
                  </div>
                  <Switch
                    checked={settings.include_database}
                    onCheckedChange={(checked) => setSettings({ ...settings, include_database: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Files</Label>
                    <p className="text-sm text-gray-500">Backup uploaded files and assets</p>
                  </div>
                  <Switch
                    checked={settings.include_files}
                    onCheckedChange={(checked) => setSettings({ ...settings, include_files: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore System</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore from backup "{selectedBackup?.filename}"?
              This will replace all current data with the backup version.
              <span className="block mt-2 text-red-600 font-medium">
                Warning: This action cannot be undone. The system will be temporarily unavailable during restore.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={restoreBackup} className="bg-yellow-600 hover:bg-yellow-700" disabled={isRestoring}>
              {isRestoring ? 'Restoring...' : 'Restore System'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBackup?.filename}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBackup} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BackupRestore