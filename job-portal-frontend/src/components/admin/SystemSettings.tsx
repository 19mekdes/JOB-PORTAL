/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { 
  Save, 
  RefreshCw, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface SystemSettingsData {
  site_name: string
  site_description: string
  contact_email: string
  enable_registration: boolean
  require_email_verification: boolean
  max_job_posts_per_employer: number
  max_applications_per_seeker: number
  job_expiry_days: number
  maintenance_mode: boolean
  allowed_file_types: string[]
  max_file_size_mb: number
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsData>({
    site_name: 'Job Portal',
    site_description: 'Connect job seekers with employers',
    contact_email: 'admin@jobportal.com',
    enable_registration: true,
    require_email_verification: true,
    max_job_posts_per_employer: 50,
    max_applications_per_seeker: 100,
    job_expiry_days: 30,
    maintenance_mode: false,
    allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
    max_file_size_mb: 5
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/admin/settings')
      setSettings(response.data.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load system settings",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.put('/admin/settings', settings)
      toast({
        variant: "success",
        title: "Success",
        description: "System settings updated successfully",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save system settings",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleMaintenance = async () => {
    try {
      await api.post('/admin/settings/maintenance', { enabled: !settings.maintenance_mode })
      setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })
      toast({
        variant: settings.maintenance_mode ? "default" : "warning",
        title: settings.maintenance_mode ? "Maintenance Mode Disabled" : "Maintenance Mode Enabled",
        description: settings.maintenance_mode 
          ? "The site is now accessible to all users"
          : "The site is now in maintenance mode. Only admins can access it.",
      })
    } catch (error) {
      console.error('Error toggling maintenance mode:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to toggle maintenance mode",
      })
    }
  }

  const handleFileTypeToggle = (fileType: string) => {
    if (settings.allowed_file_types.includes(fileType)) {
      setSettings({
        ...settings,
        allowed_file_types: settings.allowed_file_types.filter(t => t !== fileType)
      })
    } else {
      setSettings({
        ...settings,
        allowed_file_types: [...settings.allowed_file_types, fileType]
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Configure global system preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Maintenance Alert */}
      {settings.maintenance_mode && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Maintenance mode is currently enabled. Only administrators can access the site.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="files">File Uploads</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <textarea
                  id="site_description"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable User Registration</p>
                    <p className="text-sm text-gray-500">Allow new users to create accounts</p>
                  </div>
                  <Switch
                    checked={settings.enable_registration}
                    onCheckedChange={(checked: any) => setSettings({ ...settings, enable_registration: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Email Verification</p>
                    <p className="text-sm text-gray-500">Users must verify their email before accessing the platform</p>
                  </div>
                  <Switch
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked: any) => setSettings({ ...settings, require_email_verification: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input type="number" defaultValue="5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>JWT Secret Key</Label>
                <div className="flex gap-2">
                  <Input 
                    type={showApiKey ? "text" : "password"} 
                    value="••••••••••••••••••••••••••••••••"
                    readOnly
                  />
                  <Button variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline">Regenerate</Button>
                </div>
                <p className="text-xs text-gray-500">Warning: Changing this will invalidate all active sessions</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">IP Whitelisting</p>
                    <p className="text-sm text-gray-500">Restrict admin access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Settings */}
        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Limits</CardTitle>
              <CardDescription>Configure usage limits and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Jobs per Employer</Label>
                  <Input
                    type="number"
                    value={settings.max_job_posts_per_employer}
                    onChange={(e) => setSettings({ ...settings, max_job_posts_per_employer: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Applications per Job Seeker</Label>
                  <Input
                    type="number"
                    value={settings.max_applications_per_seeker}
                    onChange={(e) => setSettings({ ...settings, max_applications_per_seeker: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Expiry Days</Label>
                <Input
                  type="number"
                  value={settings.job_expiry_days}
                  onChange={(e) => setSettings({ ...settings, job_expiry_days: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Jobs will be automatically closed after this many days</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload Settings */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Upload Settings</CardTitle>
              <CardDescription>Configure allowed file types and size limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Max File Size (MB)</Label>
                <Input
                  type="number"
                  value={settings.max_file_size_mb}
                  onChange={(e) => setSettings({ ...settings, max_file_size_mb: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'xls', 'xlsx'].map((type) => (
                    <Badge
                      key={type}
                      variant={settings.allowed_file_types.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleFileTypeToggle(type)}
                    >
                      .{type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Configure third-party services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input placeholder="smtp.gmail.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP User</Label>
                  <Input placeholder="your-email@gmail.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Cloudinary Cloud Name</Label>
                <Input placeholder="your-cloud-name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cloudinary API Key</Label>
                  <Input placeholder="your-api-key" />
                </div>
                <div className="space-y-2">
                  <Label>Cloudinary API Secret</Label>
                  <Input type="password" placeholder="your-api-secret" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Settings */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>System maintenance and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">
                    {settings.maintenance_mode 
                      ? "Site is currently in maintenance mode" 
                      : "Site is accessible to all users"}
                  </p>
                </div>
                <Button 
                  variant={settings.maintenance_mode ? "outline" : "default"}
                  onClick={handleToggleMaintenance}
                >
                  {settings.maintenance_mode ? "Disable" : "Enable"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Automatic Backups</p>
                    <p className="text-sm text-gray-500">Schedule regular database backups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Backup Frequency</p>
                    <p className="text-sm text-gray-500">How often to run automatic backups</p>
                  </div>
                  <Select defaultValue="daily">
                    <SelectTrigger className="w-45">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="font-medium">Danger Zone</p>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-red-700">Clear All Cache</p>
                    <p className="text-sm text-red-600">Remove all cached data from the system</p>
                  </div>
                  <Button variant="destructive">Clear Cache</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-red-700">Reset System Settings</p>
                    <p className="text-sm text-red-600">Restore all settings to default values</p>
                  </div>
                  <Button variant="destructive">Reset</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SystemSettings