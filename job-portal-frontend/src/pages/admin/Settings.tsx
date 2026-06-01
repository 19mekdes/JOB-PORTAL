/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/admin/Settings.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Mail, 
  Shield, 
  Bell, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Database,
  Server,
  Key,
  Eye,
  EyeOff,
  HelpCircle,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AdminSettingsData {
  // General Settings
  siteName: string
  siteDescription: string
  siteLogo: string
  siteFavicon: string
  contactEmail: string
  supportEmail: string
  timezone: string
  dateFormat: string
  maintenanceMode: boolean
  maintenanceMessage: string
  
  // User Settings
  enableRegistration: boolean
  emailVerification: boolean
  defaultUserRole: string
  maxUsers: number
  autoApproveEmployers: boolean
  allowSocialLogin: boolean
  
  // Job Settings
  requireJobApproval: boolean
  maxJobsPerEmployer: number
  jobExpiryDays: number
  allowJobEditing: boolean
  featuredJobPrice: number
  allowFreeJobs: boolean
  maxJobTags: number
  
  // Application Settings
  maxApplicationsPerSeeker: number
  requireCoverLetter: boolean
  requireResumeUpload: boolean
  applicationCooldown: number
  allowWithdrawApplication: boolean
  notifyEmployerOnApplication: boolean
  
  // Security Settings
  passwordMinLength: number
  requireUppercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  twoFactorAuth: boolean
  lockoutDuration: number
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  notifyOnNewJob: boolean
  notifyOnApplication: boolean
  notifyOnStatusChange: boolean
  weeklyDigest: boolean
  adminAlertEmails: string
  
  // Email Settings
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpEncryption: string
  fromEmail: string
  fromName: string
  
  // API & Integration Settings
  googleClientId: string
  googleClientSecret: string
  linkedinClientId: string
  linkedinClientSecret: string
  recaptchaSiteKey: string
  recaptchaSecretKey: string
  
  // Backup & Maintenance
  autoBackup: boolean
  backupFrequency: string
  backupRetention: number
  logRetentionDays: number
}

const defaultSettings: AdminSettingsData = {
  // General Settings
  siteName: 'JobPortal',
  siteDescription: 'Connect job seekers with employers',
  siteLogo: '',
  siteFavicon: '',
  contactEmail: 'admin@jobportal.com',
  supportEmail: 'support@jobportal.com',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
  
  // User Settings
  enableRegistration: true,
  emailVerification: true,
  defaultUserRole: 'Job Seeker',
  maxUsers: 10000,
  autoApproveEmployers: false,
  allowSocialLogin: false,
  
  // Job Settings
  requireJobApproval: true,
  maxJobsPerEmployer: 50,
  jobExpiryDays: 30,
  allowJobEditing: true,
  featuredJobPrice: 49.99,
  allowFreeJobs: true,
  maxJobTags: 10,
  
  // Application Settings
  maxApplicationsPerSeeker: 100,
  requireCoverLetter: false,
  requireResumeUpload: true,
  applicationCooldown: 7,
  allowWithdrawApplication: true,
  notifyEmployerOnApplication: true,
  
  // Security Settings
  passwordMinLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  twoFactorAuth: false,
  lockoutDuration: 30,
  
  // Notification Settings
  emailNotifications: true,
  pushNotifications: true,
  notifyOnNewJob: true,
  notifyOnApplication: true,
  notifyOnStatusChange: true,
  weeklyDigest: true,
  adminAlertEmails: '',
  
  // Email Settings
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpEncryption: 'TLS',
  fromEmail: '',
  fromName: '',
  
  // API & Integration Settings
  googleClientId: '',
  googleClientSecret: '',
  linkedinClientId: '',
  linkedinClientSecret: '',
  recaptchaSiteKey: '',
  recaptchaSecretKey: '',
  
  // Backup & Maintenance
  autoBackup: false,
  backupFrequency: 'weekly',
  backupRetention: 30,
  logRetentionDays: 90
}

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [settings, setSettings] = useState<AdminSettingsData>(defaultSettings)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/settings')
      console.log('Settings API Response:', response.data)
      
      if (response.data.success && response.data.data) {
        // Merge fetched settings with defaults
        setSettings({ ...defaultSettings, ...response.data.data })
      } else {
        // If no settings in DB, use defaults
        setSettings(defaultSettings)
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error)
      // If endpoint doesn't exist yet, use defaults
      setSettings(defaultSettings)
      toast({ 
        variant: "destructive", 
        title: "Info", 
        description: "Using default settings. Configure and save to create settings." 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const response = await api.put('/admin/settings', settings)
      if (response.data.success) {
        setSaveSuccess(true)
        toast({ title: "Success", description: "Settings saved successfully" })
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to save settings" 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setSettings(defaultSettings)
      toast({ title: "Reset", description: "Settings reset to default. Click Save to apply changes." })
    }
  }

  const testEmailConfig = async () => {
    setTestingEmail(true)
    try {
      await api.post('/admin/settings/test-email', {
        to: settings.contactEmail,
        settings: {
          host: settings.smtpHost,
          port: settings.smtpPort,
          user: settings.smtpUser,
          password: settings.smtpPassword,
          encryption: settings.smtpEncryption
        }
      })
      toast({ title: "Success", description: "Test email sent successfully!" })
    } catch (error: any) {
      console.error('Error testing email:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to send test email" 
      })
    } finally {
      setTestingEmail(false)
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export", description: "Settings exported successfully" })
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          setSettings({ ...settings, ...imported })
          toast({ title: "Import", description: "Settings imported successfully. Click Save to apply." })
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Invalid settings file" })
        }
      }
      reader.readAsText(file)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Configure platform-wide settings and rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings} className="bg-white border-gray-300">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={importSettings} className="hidden" />
            <Button variant="outline" onClick={() => document.querySelector('input[type="file"]')?.click()} className="bg-white border-gray-300">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </label>
          <Button variant="outline" onClick={handleReset} className="bg-white border-gray-300">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Maintenance Mode Banner */}
      {settings.maintenanceMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Maintenance mode is ON. Only admins can access the site.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettings({...settings, maintenanceMode: false})} className="bg-white">
            Turn Off
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">General</TabsTrigger>
          <TabsTrigger value="users" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Users</TabsTrigger>
          <TabsTrigger value="jobs" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Jobs</TabsTrigger>
          <TabsTrigger value="applications" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Applications</TabsTrigger>
          <TabsTrigger value="security" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="email" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Email</TabsTrigger>
          <TabsTrigger value="integrations" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Integrations</TabsTrigger>
          <TabsTrigger value="maintenance" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Maintenance</TabsTrigger>
        </TabsList>

        {/* General Settings Tab - Same as before but with bg-white */}
        <TabsContent value="general">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Globe className="h-5 w-5 text-blue-600" />
                General Settings
              </CardTitle>
              <CardDescription className="text-gray-500">Basic platform information and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Site Name *</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Contact Email *</Label>
                  <Input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Support Email</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                    <SelectTrigger className="mt-1.5 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Addis_Ababa">Africa/Addis Ababa</SelectItem>
                      <SelectItem value="America/New_York">America/New York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-700">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => setSettings({...settings, dateFormat: value})}>
                    <SelectTrigger className="mt-1.5 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-700">Site Description</Label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  rows={3}
                  className="w-full mt-1.5 rounded-lg border border-gray-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="users">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="h-5 w-5 text-blue-600" />
                User Management
              </CardTitle>
              <CardDescription className="text-gray-500">Configure user registration and account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Allow Registration</Label>
                    <p className="text-sm text-gray-500">Enable new user signups</p>
                  </div>
                  <Switch
                    checked={settings.enableRegistration}
                    onCheckedChange={(checked) => setSettings({...settings, enableRegistration: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Email Verification</Label>
                    <p className="text-sm text-gray-500">Require email verification</p>
                  </div>
                  <Switch
                    checked={settings.emailVerification}
                    onCheckedChange={(checked) => setSettings({...settings, emailVerification: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Auto Approve Employers</Label>
                    <p className="text-sm text-gray-500">Auto-approve employer accounts</p>
                  </div>
                  <Switch
                    checked={settings.autoApproveEmployers}
                    onCheckedChange={(checked) => setSettings({...settings, autoApproveEmployers: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Social Login</Label>
                    <p className="text-sm text-gray-500">Allow login with Google/LinkedIn</p>
                  </div>
                  <Switch
                    checked={settings.allowSocialLogin}
                    onCheckedChange={(checked) => setSettings({...settings, allowSocialLogin: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Default User Role</Label>
                  <Select value={settings.defaultUserRole} onValueChange={(value) => setSettings({...settings, defaultUserRole: value})}>
                    <SelectTrigger className="mt-1.5 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="Job Seeker">Job Seeker</SelectItem>
                      <SelectItem value="Employer">Employer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-700">Maximum Users</Label>
                  <Input
                    type="number"
                    value={settings.maxUsers}
                    onChange={(e) => setSettings({...settings, maxUsers: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-500">Configure email and push notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Enable email notifications</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Push Notifications</Label>
                    <p className="text-sm text-gray-500">Enable browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Notify on New Job</Label>
                    <p className="text-sm text-gray-500">Send notification when new job posted</p>
                  </div>
                  <Switch
                    checked={settings.notifyOnNewJob}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnNewJob: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Notify on Application</Label>
                    <p className="text-sm text-gray-500">Send notification on new application</p>
                  </div>
                  <Switch
                    checked={settings.notifyOnApplication}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnApplication: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Notify on Status Change</Label>
                    <p className="text-sm text-gray-500">Send notification when status changes</p>
                  </div>
                  <Switch
                    checked={settings.notifyOnStatusChange}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnStatusChange: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Weekly Digest</Label>
                    <p className="text-sm text-gray-500">Send weekly summary email</p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(checked) => setSettings({...settings, weeklyDigest: checked})}
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700">Admin Alert Emails</Label>
                <Input
                  value={settings.adminAlertEmails}
                  onChange={(e) => setSettings({...settings, adminAlertEmails: e.target.value})}
                  placeholder="admin1@example.com, admin2@example.com"
                  className="mt-1.5 bg-white border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list of email addresses to receive admin alerts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs (Jobs, Applications, Security, Email, Integrations, Maintenance) remain similar structure */}
        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Job Posting Rules
              </CardTitle>
              <CardDescription className="text-gray-500">Configure job posting limits and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Require Job Approval</Label>
                    <p className="text-sm text-gray-500">Admin must approve jobs</p>
                  </div>
                  <Switch
                    checked={settings.requireJobApproval}
                    onCheckedChange={(checked) => setSettings({...settings, requireJobApproval: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Allow Job Editing</Label>
                    <p className="text-sm text-gray-500">Employers can edit posted jobs</p>
                  </div>
                  <Switch
                    checked={settings.allowJobEditing}
                    onCheckedChange={(checked) => setSettings({...settings, allowJobEditing: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-700">Max Jobs Per Employer</Label>
                  <Input
                    type="number"
                    value={settings.maxJobsPerEmployer}
                    onChange={(e) => setSettings({...settings, maxJobsPerEmployer: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Job Expiry (days)</Label>
                  <Input
                    type="number"
                    value={settings.jobExpiryDays}
                    onChange={(e) => setSettings({...settings, jobExpiryDays: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Max Job Tags</Label>
                  <Input
                    type="number"
                    value={settings.maxJobTags}
                    onChange={(e) => setSettings({...settings, maxJobTags: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Featured Job Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.featuredJobPrice}
                    onChange={(e) => setSettings({...settings, featuredJobPrice: parseFloat(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5 text-blue-600" />
                Application Rules
              </CardTitle>
              <CardDescription className="text-gray-500">Configure application submission rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Require Cover Letter</Label>
                    <p className="text-sm text-gray-500">Make cover letter mandatory</p>
                  </div>
                  <Switch
                    checked={settings.requireCoverLetter}
                    onCheckedChange={(checked) => setSettings({...settings, requireCoverLetter: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Require Resume Upload</Label>
                    <p className="text-sm text-gray-500">Resume required for applications</p>
                  </div>
                  <Switch
                    checked={settings.requireResumeUpload}
                    onCheckedChange={(checked) => setSettings({...settings, requireResumeUpload: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Allow Withdraw Application</Label>
                    <p className="text-sm text-gray-500">Users can withdraw applications</p>
                  </div>
                  <Switch
                    checked={settings.allowWithdrawApplication}
                    onCheckedChange={(checked) => setSettings({...settings, allowWithdrawApplication: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Notify Employer</Label>
                    <p className="text-sm text-gray-500">Email employer on application</p>
                  </div>
                  <Switch
                    checked={settings.notifyEmployerOnApplication}
                    onCheckedChange={(checked) => setSettings({...settings, notifyEmployerOnApplication: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Max Apps Per Job Seeker</Label>
                  <Input
                    type="number"
                    value={settings.maxApplicationsPerSeeker}
                    onChange={(e) => setSettings({...settings, maxApplicationsPerSeeker: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Application Cooldown (days)</Label>
                  <Input
                    type="number"
                    value={settings.applicationCooldown}
                    onChange={(e) => setSettings({...settings, applicationCooldown: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Shield className="h-5 w-5 text-blue-600" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-gray-500">Configure security and password requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-700">Min Password Length</Label>
                  <Input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Lockout Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Password requirements help protect user accounts from brute force attacks.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Configuration
              </CardTitle>
              <CardDescription className="text-gray-500">Configure SMTP settings for sending emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">SMTP Host</Label>
                  <Input
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">SMTP User</Label>
                  <Input
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">SMTP Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={settings.smtpPassword}
                      onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                      className="pr-10 bg-white border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-700">From Email</Label>
                  <Input
                    type="email"
                    value={settings.fromEmail}
                    onChange={(e) => setSettings({...settings, fromEmail: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                    placeholder="noreply@jobportal.com"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">From Name</Label>
                  <Input
                    value={settings.fromName}
                    onChange={(e) => setSettings({...settings, fromName: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                    placeholder="Job Portal"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Encryption</Label>
                  <Select value={settings.smtpEncryption} onValueChange={(value) => setSettings({...settings, smtpEncryption: value})}>
                    <SelectTrigger className="mt-1.5 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={testEmailConfig} disabled={testingEmail} className="bg-white border-gray-300">
                  {testingEmail ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Test Email
                </Button>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  SMTP settings are used to send emails for notifications, password reset, and application updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Server className="h-5 w-5 text-blue-600" />
                API & Integrations
              </CardTitle>
              <CardDescription className="text-gray-500">Configure third-party API integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Google Client ID</Label>
                  <Input
                    value={settings.googleClientId}
                    onChange={(e) => setSettings({...settings, googleClientId: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Google Client Secret</Label>
                  <Input
                    type="password"
                    value={settings.googleClientSecret}
                    onChange={(e) => setSettings({...settings, googleClientSecret: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">LinkedIn Client ID</Label>
                  <Input
                    value={settings.linkedinClientId}
                    onChange={(e) => setSettings({...settings, linkedinClientId: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">LinkedIn Client Secret</Label>
                  <Input
                    type="password"
                    value={settings.linkedinClientSecret}
                    onChange={(e) => setSettings({...settings, linkedinClientSecret: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">reCAPTCHA Site Key</Label>
                  <Input
                    value={settings.recaptchaSiteKey}
                    onChange={(e) => setSettings({...settings, recaptchaSiteKey: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">reCAPTCHA Secret Key</Label>
                  <Input
                    type="password"
                    value={settings.recaptchaSecretKey}
                    onChange={(e) => setSettings({...settings, recaptchaSecretKey: e.target.value})}
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Database className="h-5 w-5 text-blue-600" />
                Maintenance & Backup
              </CardTitle>
              <CardDescription className="text-gray-500">Configure system maintenance and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-700">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Put the site into maintenance mode</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>
              {settings.maintenanceMode && (
                <div>
                  <Label className="text-gray-700">Maintenance Message</Label>
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                    rows={3}
                    className="w-full mt-1.5 rounded-lg border border-gray-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-700">Auto Backup</Label>
                  <p className="text-sm text-gray-500">Automatically backup database</p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                />
              </div>
              {settings.autoBackup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700">Backup Frequency</Label>
                    <Select value={settings.backupFrequency} onValueChange={(value) => setSettings({...settings, backupFrequency: value})}>
                      <SelectTrigger className="mt-1.5 bg-white border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Backup Retention (days)</Label>
                    <Input
                      type="number"
                      value={settings.backupRetention}
                      onChange={(e) => setSettings({...settings, backupRetention: parseInt(e.target.value)})}
                      className="mt-1.5 bg-white border-gray-300"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-gray-700">Log Retention (days)</Label>
                <Input
                  type="number"
                  value={settings.logRetentionDays}
                  onChange={(e) => setSettings({...settings, logRetentionDays: parseInt(e.target.value)})}
                  className="mt-1.5 bg-white border-gray-300"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-32">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings