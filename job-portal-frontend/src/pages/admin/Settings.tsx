// src/pages/admin/Settings.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  FileText} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AdminSettingsData {
  // General Settings
  siteName: string
  siteDescription: string
  siteLogo: string
  contactEmail: string
  supportEmail: string
  timezone: string
  dateFormat: string
  
  // User Settings
  enableRegistration: boolean
  emailVerification: boolean
  defaultUserRole: string
  maxUsers: number
  
  // Job Settings
  requireJobApproval: boolean
  maxJobsPerEmployer: number
  jobExpiryDays: number
  allowJobEditing: boolean
  featuredJobPrice: number
  
  // Application Settings
  maxApplicationsPerSeeker: number
  requireCoverLetter: boolean
  requireResumeUpload: boolean
  applicationCooldown: number
  
  // Security Settings
  passwordMinLength: number
  sessionTimeout: number
  maxLoginAttempts: number
  twoFactorAuth: boolean
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  notifyOnNewJob: boolean
  notifyOnApplication: boolean
  weeklyDigest: boolean
  
  // Email Settings
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpEncryption: string
}

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [settings, setSettings] = useState<AdminSettingsData>({
    // General Settings
    siteName: 'JobPortal',
    siteDescription: 'Connect job seekers with employers',
    siteLogo: '',
    contactEmail: 'admin@jobportal.com',
    supportEmail: 'support@jobportal.com',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    
    // User Settings
    enableRegistration: true,
    emailVerification: true,
    defaultUserRole: 'Job Seeker',
    maxUsers: 10000,
    
    // Job Settings
    requireJobApproval: true,
    maxJobsPerEmployer: 50,
    jobExpiryDays: 30,
    allowJobEditing: true,
    featuredJobPrice: 49.99,
    
    // Application Settings
    maxApplicationsPerSeeker: 100,
    requireCoverLetter: false,
    requireResumeUpload: true,
    applicationCooldown: 7,
    
    // Security Settings
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    notifyOnNewJob: true,
    notifyOnApplication: true,
    weeklyDigest: true,
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpEncryption: 'TLS'
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/settings')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to load settings" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      await api.put('/admin/settings', settings)
      setSaveSuccess(true)
      toast({ title: "Success", description: "Settings saved successfully" })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings" })
    } finally {
      setSaving(false)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure platform-wide settings and rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Settings saved successfully!
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Site Name</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                    <SelectTrigger className="mt-1.5 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => setSettings({...settings, dateFormat: value})}>
                    <SelectTrigger className="mt-1.5 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Site Description</Label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  rows={3}
                  className="w-full mt-1.5 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="users">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Allow Registration</Label>
                    <p className="text-sm text-gray-500">Enable new user signups</p>
                  </div>
                  <Switch
                    checked={settings.enableRegistration}
                    onCheckedChange={(checked) => setSettings({...settings, enableRegistration: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Email Verification</Label>
                    <p className="text-sm text-gray-500">Require email verification</p>
                  </div>
                  <Switch
                    checked={settings.emailVerification}
                    onCheckedChange={(checked) => setSettings({...settings, emailVerification: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Default User Role</Label>
                  <Select value={settings.defaultUserRole} onValueChange={(value) => setSettings({...settings, defaultUserRole: value})}>
                    <SelectTrigger className="mt-1.5 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Job Seeker">Job Seeker</SelectItem>
                      <SelectItem value="Employer">Employer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Maximum Users</Label>
                  <Input
                    type="number"
                    value={settings.maxUsers}
                    onChange={(e) => setSettings({...settings, maxUsers: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Settings Tab */}
        <TabsContent value="jobs">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Job Posting Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Require Job Approval</Label>
                    <p className="text-sm text-gray-500">Admin must approve jobs</p>
                  </div>
                  <Switch
                    checked={settings.requireJobApproval}
                    onCheckedChange={(checked) => setSettings({...settings, requireJobApproval: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Allow Job Editing</Label>
                    <p className="text-sm text-gray-500">Employers can edit posted jobs</p>
                  </div>
                  <Switch
                    checked={settings.allowJobEditing}
                    onCheckedChange={(checked) => setSettings({...settings, allowJobEditing: checked})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Max Jobs Per Employer</Label>
                  <Input
                    type="number"
                    value={settings.maxJobsPerEmployer}
                    onChange={(e) => setSettings({...settings, maxJobsPerEmployer: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Job Expiry (days)</Label>
                  <Input
                    type="number"
                    value={settings.jobExpiryDays}
                    onChange={(e) => setSettings({...settings, jobExpiryDays: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Featured Job Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.featuredJobPrice}
                    onChange={(e) => setSettings({...settings, featuredJobPrice: parseFloat(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Settings Tab */}
        <TabsContent value="applications">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Application Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Max Apps Per Job Seeker</Label>
                  <Input
                    type="number"
                    value={settings.maxApplicationsPerSeeker}
                    onChange={(e) => setSettings({...settings, maxApplicationsPerSeeker: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Application Cooldown (days)</Label>
                  <Input
                    type="number"
                    value={settings.applicationCooldown}
                    onChange={(e) => setSettings({...settings, applicationCooldown: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Require Cover Letter</Label>
                    <p className="text-sm text-gray-500">Make cover letter mandatory</p>
                  </div>
                  <Switch
                    checked={settings.requireCoverLetter}
                    onCheckedChange={(checked) => setSettings({...settings, requireCoverLetter: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Require Resume Upload</Label>
                    <p className="text-sm text-gray-500">Resume required for applications</p>
                  </div>
                  <Switch
                    checked={settings.requireResumeUpload}
                    onCheckedChange={(checked) => setSettings({...settings, requireResumeUpload: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Min Password Length</Label>
                  <Input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email notifications</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Notify on New Job</Label>
                    <p className="text-sm text-gray-500">Alert job seekers of new jobs</p>
                  </div>
                  <Switch
                    checked={settings.notifyOnNewJob}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnNewJob: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Notify on Application</Label>
                    <p className="text-sm text-gray-500">Alert employers of applications</p>
                  </div>
                  <Switch
                    checked={settings.notifyOnApplication}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnApplication: checked})}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-gray-500">Send weekly summary emails</p>
                </div>
                <Switch
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => setSettings({...settings, weeklyDigest: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Host</Label>
                  <Input
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>SMTP User</Label>
                  <Input
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <Label>SMTP Password</Label>
                  <Input
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                    className="mt-1.5 rounded-lg"
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label>Encryption</Label>
                  <Select value={settings.smtpEncryption} onValueChange={(value) => setSettings({...settings, smtpEncryption: value})}>
                    <SelectTrigger className="mt-1.5 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
      </Tabs>

      {/* Save Button Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-32">
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