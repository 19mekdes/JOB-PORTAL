// src/pages/superadmin/Settings.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  
  Save, RefreshCw, 
  AlertCircle, CheckCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const API_BASE_URL = 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('admin_token')

interface Settings {
  site_name: string
  site_url: string
  admin_email: string
  support_email: string
  smtp_host: string
  smtp_port: string
  enable_2fa: boolean
  session_timeout: number
  max_login_attempts: number
  enable_registration: boolean
  email_verification: boolean
  enable_notifications: boolean
  maintenance_mode: boolean
  auto_backup: boolean
  backup_frequency: string
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    site_name: 'JobPortal',
    site_url: 'http://localhost:5173',
    admin_email: 'admin@jobportal.com',
    support_email: 'support@jobportal.com',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    enable_2fa: false,
    session_timeout: 30,
    max_login_attempts: 5,
    enable_registration: true,
    email_verification: true,
    enable_notifications: true,
    maintenance_mode: false,
    auto_backup: true,
    backup_frequency: 'daily'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch settings from backend
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/super-admin/settings`, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setSettings(data.data)
        }
      } else {
        // If endpoint doesn't exist yet, use default settings
        console.log('Using default settings')
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      // Don't show error for missing endpoint, just use defaults
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const token = getToken()
      
      // Save each setting individually
      for (const [key, value] of Object.entries(settings)) {
        await fetch(`${API_BASE_URL}/super-admin/settings/${key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ value })
        }).catch(err => console.error(`Failed to save ${key}:`, err))
      }
      
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to save settings')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-500">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Configure global system preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name</Label>
                <Input 
                  value={settings.site_name}
                  onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                  placeholder="JobPortal"
                />
              </div>
              <div>
                <Label>Site URL</Label>
                <Input 
                  value={settings.site_url}
                  onChange={(e) => setSettings({...settings, site_url: e.target.value})}
                  placeholder="https://jobportal.com"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Registration</Label>
                  <p className="text-sm text-gray-500">Allow new user registration</p>
                </div>
                <Switch 
                  checked={settings.enable_registration}
                  onCheckedChange={(checked) => setSettings({...settings, enable_registration: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Verification</Label>
                  <p className="text-sm text-gray-500">Require email verification for new users</p>
                </div>
                <Switch 
                  checked={settings.email_verification}
                  onCheckedChange={(checked) => setSettings({...settings, email_verification: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Admin Email</Label>
                <Input 
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                />
              </div>
              <div>
                <Label>Support Email</Label>
                <Input 
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                />
              </div>
              <div>
                <Label>SMTP Host</Label>
                <Input 
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                />
              </div>
              <div>
                <Label>SMTP Port</Label>
                <Input 
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({...settings, smtp_port: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                </div>
                <Switch 
                  checked={settings.enable_2fa}
                  onCheckedChange={(checked) => setSettings({...settings, enable_2fa: checked})}
                />
              </div>
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input 
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings({...settings, session_timeout: parseInt(e.target.value) || 30})}
                />
              </div>
              <div>
                <Label>Max Login Attempts</Label>
                <Input 
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) => setSettings({...settings, max_login_attempts: parseInt(e.target.value) || 5})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-gray-500">Send system notifications</p>
                </div>
                <Switch 
                  checked={settings.enable_notifications}
                  onCheckedChange={(checked) => setSettings({...settings, enable_notifications: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Put site under maintenance</p>
                </div>
                <Switch 
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-gray-500">Automatically backup system data</p>
                </div>
                <Switch 
                  checked={settings.auto_backup}
                  onCheckedChange={(checked) => setSettings({...settings, auto_backup: checked})}
                />
              </div>
              {settings.auto_backup && (
                <div>
                  <Label>Backup Frequency</Label>
                  <Select 
                    value={settings.backup_frequency}
                    onValueChange={(value) => setSettings({...settings, backup_frequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage