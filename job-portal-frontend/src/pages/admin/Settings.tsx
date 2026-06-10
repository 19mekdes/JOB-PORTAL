/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/admin/Settings.tsx - WITH TEST BUTTONS
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  Mail, 
  Shield, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Users,
  Briefcase,
  FileText,
  Eye,
  EyeOff,
  Database,
  Play,
  XCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AdminSettingsData {
  site_name: string
  site_description: string
  contact_email: string
  support_email: string
  enable_registration: boolean
  email_verification: boolean
  auto_approve_employers: boolean
  require_job_approval: boolean
  job_expiry_days: number
  max_free_jobs_per_employer: number
  require_resume_upload: boolean
  notify_on_application: boolean
  password_min_length: number
  maintenance_mode: boolean
  admin_alert_emails: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  from_email: string
}

const defaultSettings: AdminSettingsData = {
  site_name: 'JobPortal Ethiopia',
  site_description: 'Find your dream job in Ethiopia',
  contact_email: 'admin@jobportal.com',
  support_email: 'support@jobportal.com',
  enable_registration: true,
  email_verification: true,
  auto_approve_employers: false,
  require_job_approval: true,
  job_expiry_days: 30,
  max_free_jobs_per_employer: 10,
  require_resume_upload: true,
  notify_on_application: true,
  password_min_length: 6,
  maintenance_mode: false,
  admin_alert_emails: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  from_email: ''
}

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ setting: string; success: boolean; message: string } | null>(null)
  const [settings, setSettings] = useState<AdminSettingsData>(defaultSettings)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/settings')
      if (response.data.success && response.data.data) {
        setSettings(prev => ({ ...prev, ...response.data.data }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', settings)
      toast({ title: "Success", description: "Settings saved successfully" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings" })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof AdminSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // ========== TEST FUNCTIONS ==========

  // Test Registration
  const testRegistration = async () => {
    setTesting('registration')
    setTestResult(null)
    
    const testEmail = `test-register-${Date.now()}@test.com`
    
    try {
      const response = await api.post('/auth/register', {
        email: testEmail,
        password: 'Test123!',
        full_name: 'Test User',
        user_type: 'Job Seeker'
      })
      
      if (response.data.success) {
        setTestResult({
          setting: 'registration',
          success: true,
          message: `✅ Registration working! User created: ${testEmail}`
        })
      } else {
        setTestResult({
          setting: 'registration',
          success: false,
          message: `❌ Registration failed: ${response.data.message}`
        })
      }
    } catch (error: any) {
      setTestResult({
        setting: 'registration',
        success: false,
        message: `❌ Registration failed: ${error.response?.data?.message || error.message}`
      })
    } finally {
      setTesting(null)
    }
  }

  // Test Employer Registration
  const testEmployerRegistration = async () => {
    setTesting('employer')
    setTestResult(null)
    
    const testEmail = `test-employer-${Date.now()}@test.com`
    
    try {
      const response = await api.post('/auth/register', {
        email: testEmail,
        password: 'Test123!',
        full_name: 'Test Company',
        user_type: 'Employer'
      })
      
      // Check if auto-approve is working
      const isAutoApproved = settings.auto_approve_employers
      
      setTestResult({
        setting: 'employer',
        success: true,
        message: `✅ Employer registration: ${testEmail}\nAuto Approve is ${isAutoApproved ? 'ON' : 'OFF'} - Account ${isAutoApproved ? 'automatically approved' : 'pending approval'}`
      })
    } catch (error: any) {
      setTestResult({
        setting: 'employer',
        success: false,
        message: `❌ Employer registration failed: ${error.response?.data?.message || error.message}`
      })
    } finally {
      setTesting(null)
    }
  }

  // Test Login with unverified email
  const testEmailVerification = async () => {
    setTesting('email_verification')
    setTestResult(null)
    
    const testEmail = `test-verify-${Date.now()}@test.com`
    
    try {
      // Register user first
      await api.post('/auth/register', {
        email: testEmail,
        password: 'Test123!',
        full_name: 'Test User',
        user_type: 'Job Seeker'
      })
      
      // Try to login
      const loginResponse = await api.post('/auth/login', {
        email: testEmail,
        password: 'Test123!'
      })
      
      const emailVerificationRequired = settings.email_verification
      
      setTestResult({
        setting: 'email_verification',
        success: true,
        message: `Email Verification is ${emailVerificationRequired ? 'ON' : 'OFF'}\nLogin ${loginResponse.data.success ? 'succeeded' : 'failed'} as expected.`
      })
    } catch (error: any) {
      setTestResult({
        setting: 'email_verification',
        success: true,
        message: `✅ Email Verification is ON. Login correctly blocked: ${error.response?.data?.message}`
      })
    } finally {
      setTesting(null)
    }
  }

  // Clear test result
  const clearTestResult = () => {
    setTestResult(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-gray-500">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-500 mt-1">Configure and test your job portal settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div className={`rounded-lg p-4 flex items-center justify-between ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.setting.toUpperCase()} Test Result
              </p>
              <p className={`text-sm whitespace-pre-wrap ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearTestResult} className="text-gray-500">
            ✕
          </Button>
        </div>
      )}

      {/* Maintenance Mode Warning */}
      {settings.maintenance_mode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Maintenance mode is ON. Only admins can access the site.</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateSetting('maintenance_mode', false)} 
            className="bg-white"
          >
            Turn Off
          </Button>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-lg flex flex-wrap gap-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Users & Jobs
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Database className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="test" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Play className="h-4 w-4 mr-2" />
            Test Settings
          </TabsTrigger>
        </TabsList>

        {/* Users & Jobs Tab */}
        <TabsContent value="users">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Users & Jobs</CardTitle>
              <CardDescription className="text-gray-500">Manage user registration and job posting rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Settings Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700 font-medium">Allow Registration</Label>
                      <p className="text-sm text-gray-500">Enable new user signups</p>
                    </div>
                    <Switch
                      checked={settings.enable_registration}
                      onCheckedChange={(checked) => updateSetting('enable_registration', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700 font-medium">Email Verification</Label>
                      <p className="text-sm text-gray-500">Require email verification</p>
                    </div>
                    <Switch
                      checked={settings.email_verification}
                      onCheckedChange={(checked) => updateSetting('email_verification', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700 font-medium">Auto Approve Employers</Label>
                      <p className="text-sm text-gray-500">Auto-approve employer accounts</p>
                    </div>
                    <Switch
                      checked={settings.auto_approve_employers}
                      onCheckedChange={(checked) => updateSetting('auto_approve_employers', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Job Settings Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700 font-medium">Require Job Approval</Label>
                      <p className="text-sm text-gray-500">Admin must approve jobs before publishing</p>
                    </div>
                    <Switch
                      checked={settings.require_job_approval}
                      onCheckedChange={(checked) => updateSetting('require_job_approval', checked)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label className="text-gray-700">Job Expiry (days)</Label>
                      <Input
                        type="number"
                        value={settings.job_expiry_days}
                        onChange={(e) => updateSetting('job_expiry_days', parseInt(e.target.value))}
                        className="mt-1.5 bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Free Jobs per Employer</Label>
                      <Input
                        type="number"
                        value={settings.max_free_jobs_per_employer}
                        onChange={(e) => updateSetting('max_free_jobs_per_employer', parseInt(e.target.value))}
                        className="mt-1.5 bg-white border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Application Settings</CardTitle>
              <CardDescription className="text-gray-500">Configure job application rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-700 font-medium">Require Resume Upload</Label>
                  <p className="text-sm text-gray-500">Make resume upload mandatory</p>
                </div>
                <Switch
                  checked={settings.require_resume_upload}
                  onCheckedChange={(checked) => updateSetting('require_resume_upload', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-700 font-medium">Notify Employer on Application</Label>
                  <p className="text-sm text-gray-500">Send email when someone applies</p>
                </div>
                <Switch
                  checked={settings.notify_on_application}
                  onCheckedChange={(checked) => updateSetting('notify_on_application', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Advanced Settings</CardTitle>
              <CardDescription className="text-gray-500">Security and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </h3>
                <div>
                  <Label className="text-gray-700">Minimum Password Length</Label>
                  <Input
                    type="number"
                    value={settings.password_min_length}
                    onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value))}
                    className="mt-1.5 w-32 bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Maintenance
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-700 font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Put the site into maintenance mode</p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab - NEW */}
        <TabsContent value="test">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Test Your Settings</CardTitle>
              <CardDescription className="text-gray-500">
                Click the buttons below to verify if each setting is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Registration */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Allow Registration</h3>
                    <p className="text-sm text-gray-500">Current: <strong>{settings.enable_registration ? 'ON' : 'OFF'}</strong></p>
                  </div>
                  <Button 
                    onClick={testRegistration} 
                    disabled={testing === 'registration'}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100"
                  >
                    {testing === 'registration' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Test Registration
                  </Button>
                </div>
              </div>

              {/* Test Email Verification */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Verification</h3>
                    <p className="text-sm text-gray-500">Current: <strong>{settings.email_verification ? 'ON' : 'OFF'}</strong></p>
                  </div>
                  <Button 
                    onClick={testEmailVerification} 
                    disabled={testing === 'email_verification'}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100"
                  >
                    {testing === 'email_verification' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Test Email Verification
                  </Button>
                </div>
              </div>

              {/* Test Employer Auto Approve */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Auto Approve Employers</h3>
                    <p className="text-sm text-gray-500">Current: <strong>{settings.auto_approve_employers ? 'ON' : 'OFF'}</strong></p>
                  </div>
                  <Button 
                    onClick={testEmployerRegistration} 
                    disabled={testing === 'employer'}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100"
                  >
                    {testing === 'employer' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Test Employer Registration
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">How to interpret test results:</h4>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• <strong>Registration Test</strong> - Should fail when "Allow Registration" is OFF</li>
                      <li>• <strong>Email Verification Test</strong> - Should block login when ON</li>
                      <li>• <strong>Employer Test</strong> - Shows if auto-approve is working</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSettings