// src/pages/superadmin/SuperAdminSettings.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Save, RefreshCw, Globe, Users, Briefcase, FileText, 
  Shield, Server, AlertTriangle, CheckCircle, Loader2, 
  Mail, Lock, Database, Bell, DollarSign,
  Key, Send, Settings, Layout
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface SystemSettings {
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
  smtpEncryption: string
  fromEmail: string
  fromName: string
  emailConfigured: boolean
  
  // API Settings
  recaptchaSiteKey: string
  recaptchaConfigured: boolean
  googleLoginConfigured: boolean
  linkedinLoginConfigured: boolean
  
  // Backup Settings
  autoBackup: boolean
  backupFrequency: string
  backupRetention: number
  logRetentionDays: number
  
  // File Settings
  allowedFileTypes: string[]
  maxFileSizeMb: number
}

const SuperAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [googleSecret, setGoogleSecret] = useState('')
  const [linkedinSecret, setLinkedinSecret] = useState('')
  const [recaptchaSecret, setRecaptchaSecret] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/super-admin/settings')
      if (response.data?.success && response.data?.data) {
        setSettings(response.data.data)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to load settings", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const saveData: any = { ...settings }
      if (smtpPassword) saveData.smtpPassword = smtpPassword
      if (googleSecret) saveData.googleClientSecret = googleSecret
      if (linkedinSecret) saveData.linkedinClientSecret = linkedinSecret
      if (recaptchaSecret) saveData.recaptchaSecretKey = recaptchaSecret
      
      const response = await api.put('/super-admin/settings', saveData)
      if (response.data?.success) {
        toast({ title: "Success", description: "Settings saved successfully!" })
        setSmtpPassword('')
        setGoogleSecret('')
        setLinkedinSecret('')
        setRecaptchaSecret('')
        fetchSettings()
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const testEmailConfig = async () => {
    setTestingEmail(true)
    try {
      const response = await api.post('/super-admin/settings/test-email', { testEmail: testEmailAddress || undefined })
      if (response.data?.success) {
        toast({ title: "Success", description: response.data.message })
        setTestEmailAddress('')
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to send test email", variant: "destructive" })
    } finally {
      setTestingEmail(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Configure global system settings (Super Admin only)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Maintenance Alert */}
      {settings.maintenanceMode && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            ⚠️ Maintenance mode is ENABLED - The site is inaccessible to regular users
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto bg-white border border-gray-200 rounded-lg p-1 gap-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">General</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Users</TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Jobs</TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Applications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Notifications</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Email</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">API</TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Backup</TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Files</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Globe className="h-5 w-5 text-blue-500" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-gray-700">Site Name</Label><Input value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Site Description</Label><Input value={settings.siteDescription} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Site Logo URL</Label><Input value={settings.siteLogo} onChange={(e) => setSettings({...settings, siteLogo: e.target.value})} placeholder="https://..." className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Site Favicon URL</Label><Input value={settings.siteFavicon} onChange={(e) => setSettings({...settings, siteFavicon: e.target.value})} placeholder="https://..." className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Contact Email</Label><Input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Support Email</Label><Input type="email" value={settings.supportEmail} onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Timezone</Label><Input value={settings.timezone} onChange={(e) => setSettings({...settings, timezone: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Date Format</Label><Input value={settings.dateFormat} onChange={(e) => setSettings({...settings, dateFormat: e.target.value})} className="mt-1 border-gray-300" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="users" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="h-5 w-5 text-green-500" />
                User Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Enable Registration</Label><Switch checked={settings.enableRegistration} onCheckedChange={(c) => setSettings({...settings, enableRegistration: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Email Verification</Label><Switch checked={settings.emailVerification} onCheckedChange={(c) => setSettings({...settings, emailVerification: c})} /></div>
                <div><Label className="text-gray-700">Default User Role</Label><Input value={settings.defaultUserRole} onChange={(e) => setSettings({...settings, defaultUserRole: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Max Users</Label><Input type="number" value={settings.maxUsers} onChange={(e) => setSettings({...settings, maxUsers: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Auto Approve Employers</Label><Switch checked={settings.autoApproveEmployers} onCheckedChange={(c) => setSettings({...settings, autoApproveEmployers: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Allow Social Login</Label><Switch checked={settings.allowSocialLogin} onCheckedChange={(c) => setSettings({...settings, allowSocialLogin: c})} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Settings Tab */}
        <TabsContent value="jobs" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Briefcase className="h-5 w-5 text-purple-500" />
                Job Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Job Approval</Label><Switch checked={settings.requireJobApproval} onCheckedChange={(c) => setSettings({...settings, requireJobApproval: c})} /></div>
                <div><Label className="text-gray-700">Max Jobs Per Employer</Label><Input type="number" value={settings.maxJobsPerEmployer} onChange={(e) => setSettings({...settings, maxJobsPerEmployer: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Job Expiry Days</Label><Input type="number" value={settings.jobExpiryDays} onChange={(e) => setSettings({...settings, jobExpiryDays: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Allow Job Editing</Label><Switch checked={settings.allowJobEditing} onCheckedChange={(c) => setSettings({...settings, allowJobEditing: c})} /></div>
                <div><Label className="text-gray-700">Featured Job Price ($)</Label><Input type="number" step="0.01" value={settings.featuredJobPrice} onChange={(e) => setSettings({...settings, featuredJobPrice: parseFloat(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Allow Free Jobs</Label><Switch checked={settings.allowFreeJobs} onCheckedChange={(c) => setSettings({...settings, allowFreeJobs: c})} /></div>
                <div><Label className="text-gray-700">Max Job Tags</Label><Input type="number" value={settings.maxJobTags} onChange={(e) => setSettings({...settings, maxJobTags: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Settings Tab */}
        <TabsContent value="applications" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5 text-orange-500" />
                Application Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-gray-700">Max Applications Per Seeker</Label><Input type="number" value={settings.maxApplicationsPerSeeker} onChange={(e) => setSettings({...settings, maxApplicationsPerSeeker: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Cover Letter</Label><Switch checked={settings.requireCoverLetter} onCheckedChange={(c) => setSettings({...settings, requireCoverLetter: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Resume Upload</Label><Switch checked={settings.requireResumeUpload} onCheckedChange={(c) => setSettings({...settings, requireResumeUpload: c})} /></div>
                <div><Label className="text-gray-700">Application Cooldown (days)</Label><Input type="number" value={settings.applicationCooldown} onChange={(e) => setSettings({...settings, applicationCooldown: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Allow Withdraw Application</Label><Switch checked={settings.allowWithdrawApplication} onCheckedChange={(c) => setSettings({...settings, allowWithdrawApplication: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Notify Employer on Application</Label><Switch checked={settings.notifyEmployerOnApplication} onCheckedChange={(c) => setSettings({...settings, notifyEmployerOnApplication: c})} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Lock className="h-5 w-5 text-red-500" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-gray-700">Password Min Length</Label><Input type="number" value={settings.passwordMinLength} onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Uppercase</Label><Switch checked={settings.requireUppercase} onCheckedChange={(c) => setSettings({...settings, requireUppercase: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Numbers</Label><Switch checked={settings.requireNumbers} onCheckedChange={(c) => setSettings({...settings, requireNumbers: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Require Special Characters</Label><Switch checked={settings.requireSpecialChars} onCheckedChange={(c) => setSettings({...settings, requireSpecialChars: c})} /></div>
                <div><Label className="text-gray-700">Session Timeout (minutes)</Label><Input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Max Login Attempts</Label><Input type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Two Factor Authentication</Label><Switch checked={settings.twoFactorAuth} onCheckedChange={(c) => setSettings({...settings, twoFactorAuth: c})} /></div>
                <div><Label className="text-gray-700">Lockout Duration (minutes)</Label><Input type="number" value={settings.lockoutDuration} onChange={(e) => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Bell className="h-5 w-5 text-indigo-500" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Email Notifications</Label><Switch checked={settings.emailNotifications} onCheckedChange={(c) => setSettings({...settings, emailNotifications: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Push Notifications</Label><Switch checked={settings.pushNotifications} onCheckedChange={(c) => setSettings({...settings, pushNotifications: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Notify on New Job</Label><Switch checked={settings.notifyOnNewJob} onCheckedChange={(c) => setSettings({...settings, notifyOnNewJob: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Notify on Application</Label><Switch checked={settings.notifyOnApplication} onCheckedChange={(c) => setSettings({...settings, notifyOnApplication: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Notify on Status Change</Label><Switch checked={settings.notifyOnStatusChange} onCheckedChange={(c) => setSettings({...settings, notifyOnStatusChange: c})} /></div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Weekly Digest</Label><Switch checked={settings.weeklyDigest} onCheckedChange={(c) => setSettings({...settings, weeklyDigest: c})} /></div>
                <div className="col-span-2"><Label className="text-gray-700">Admin Alert Emails (comma separated)</Label><Input value={settings.adminAlertEmails} onChange={(e) => setSettings({...settings, adminAlertEmails: e.target.value})} placeholder="admin1@example.com, admin2@example.com" className="mt-1 border-gray-300" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Mail className="h-5 w-5 text-cyan-500" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-gray-700">SMTP Host</Label><Input value={settings.smtpHost} onChange={(e) => setSettings({...settings, smtpHost: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">SMTP Port</Label><Input type="number" value={settings.smtpPort} onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">SMTP Username</Label><Input value={settings.smtpUser} onChange={(e) => setSettings({...settings, smtpUser: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">SMTP Password</Label><Input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="Leave blank to keep current" className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">SMTP Encryption</Label><Input value={settings.smtpEncryption} onChange={(e) => setSettings({...settings, smtpEncryption: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">From Email</Label><Input value={settings.fromEmail} onChange={(e) => setSettings({...settings, fromEmail: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">From Name</Label><Input value={settings.fromName} onChange={(e) => setSettings({...settings, fromName: e.target.value})} className="mt-1 border-gray-300" /></div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-gray-700">Test Email Configuration</Label>
                    <p className="text-sm text-gray-500">Send a test email to verify your SMTP settings</p>
                  </div>
                  <Badge className={settings.emailConfigured ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {settings.emailConfigured ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Email address (optional)" 
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="flex-1 border-gray-300"
                  />
                  <Button onClick={testEmailConfig} disabled={testingEmail} variant="outline" className="border-gray-300">
                    {testingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings Tab */}
        <TabsContent value="api" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Key className="h-5 w-5 text-pink-500" />
                API & Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-gray-700">Google Client ID</Label><Input value={settings.recaptchaSiteKey} onChange={(e) => setSettings({...settings, recaptchaSiteKey: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Google Client Secret</Label><Input type="password" value={googleSecret} onChange={(e) => setGoogleSecret(e.target.value)} placeholder="Leave blank to keep current" className="mt-1 border-gray-300" /></div>
                <div className="col-span-2"><Badge className={settings.googleLoginConfigured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{settings.googleLoginConfigured ? "Google Login Configured" : "Google Login Not Configured"}</Badge></div>
                
                <div><Label className="text-gray-700">LinkedIn Client ID</Label><Input value={settings.linkedinLoginConfigured ? "configured" : ""} onChange={(e) => setSettings({...settings, linkedinLoginConfigured: !!e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">LinkedIn Client Secret</Label><Input type="password" value={linkedinSecret} onChange={(e) => setLinkedinSecret(e.target.value)} placeholder="Leave blank to keep current" className="mt-1 border-gray-300" /></div>
                
                <div><Label className="text-gray-700">reCAPTCHA Site Key</Label><Input value={settings.recaptchaSiteKey} onChange={(e) => setSettings({...settings, recaptchaSiteKey: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">reCAPTCHA Secret Key</Label><Input type="password" value={recaptchaSecret} onChange={(e) => setRecaptchaSecret(e.target.value)} placeholder="Leave blank to keep current" className="mt-1 border-gray-300" /></div>
                <div className="col-span-2"><Badge className={settings.recaptchaConfigured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{settings.recaptchaConfigured ? "reCAPTCHA Configured" : "reCAPTCHA Not Configured"}</Badge></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings Tab */}
        <TabsContent value="backup" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Database className="h-5 w-5 text-emerald-500" />
                Backup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label className="text-gray-700">Auto Backup</Label><Switch checked={settings.autoBackup} onCheckedChange={(c) => setSettings({...settings, autoBackup: c})} /></div>
                <div><Label className="text-gray-700">Backup Frequency</Label><Input value={settings.backupFrequency} onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Backup Retention (days)</Label><Input type="number" value={settings.backupRetention} onChange={(e) => setSettings({...settings, backupRetention: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Log Retention Days</Label><Input type="number" value={settings.logRetentionDays} onChange={(e) => setSettings({...settings, logRetentionDays: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Settings Tab */}
        <TabsContent value="files" className="mt-6">
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-5 w-5 text-teal-500" />
                File Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div><Label className="text-gray-700">Allowed File Types (comma separated)</Label><Input value={settings.allowedFileTypes.join(', ')} onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value.split(',').map(s => s.trim())})} placeholder="pdf, doc, docx, txt" className="mt-1 border-gray-300" /></div>
                <div><Label className="text-gray-700">Max File Size (MB)</Label><Input type="number" value={settings.maxFileSizeMb} onChange={(e) => setSettings({...settings, maxFileSizeMb: parseInt(e.target.value)})} className="mt-1 border-gray-300" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SuperAdminSettings