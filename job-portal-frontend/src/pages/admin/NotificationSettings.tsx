/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
// src/pages/admin/NotificationSettings.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  BellRing, 
  Save,
  RefreshCw,
  CheckCircle,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface NotificationSettingsData {
  // Email Notifications
  emailNewJob: boolean
  emailApplicationReceived: boolean
  emailApplicationStatusUpdate: boolean
  emailJobExpiring: boolean
  emailPasswordChange: boolean
  emailLoginAlert: boolean
  emailWeeklyDigest: boolean
  emailMonthlyReport: boolean
  
  // Push Notifications
  pushEnabled: boolean
  pushNewJob: boolean
  pushApplicationReceived: boolean
  pushApplicationStatusUpdate: boolean
  
  // In-App Notifications
  inAppEnabled: boolean
  inAppNewJob: boolean
  inAppApplicationReceived: boolean
  inAppApplicationStatusUpdate: boolean
  
  // Digest Settings
  weeklyDigestDay: string
  weeklyDigestTime: string
  monthlyReportDay: number
  dailyDigest: boolean
  
  // Alert Settings
  alertOnNewUser: boolean
  alertOnNewEmployer: boolean
  alertOnFlaggedContent: boolean
  alertOnSystemError: boolean
  
  // Admin Notifications
  adminEmailAlerts: boolean
  adminSlackWebhook: string
  adminDailySummary: boolean
}

const NotificationSettings: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [settings, setSettings] = useState<NotificationSettingsData>({
    emailNewJob: true,
    emailApplicationReceived: true,
    emailApplicationStatusUpdate: true,
    emailJobExpiring: true,
    emailPasswordChange: true,
    emailLoginAlert: false,
    emailWeeklyDigest: true,
    emailMonthlyReport: false,
    
    pushEnabled: true,
    pushNewJob: true,
    pushApplicationReceived: true,
    pushApplicationStatusUpdate: true,
    
    inAppEnabled: true,
    inAppNewJob: true,
    inAppApplicationReceived: true,
    inAppApplicationStatusUpdate: true,
    
    weeklyDigestDay: 'Monday',
    weeklyDigestTime: '09:00',
    monthlyReportDay: 1,
    dailyDigest: false,
    
    alertOnNewUser: true,
    alertOnNewEmployer: true,
    alertOnFlaggedContent: true,
    alertOnSystemError: true,
    
    adminEmailAlerts: true,
    adminSlackWebhook: '',
    adminDailySummary: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/notification-settings')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      await api.put('/admin/notification-settings', settings)
      setSaveSuccess(true)
      toast({ title: "Success", description: "Notification settings saved successfully" })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings" })
    } finally {
      setSaving(false)
    }
  }

  const getSummaryStats = () => {
    const enabledCount = [
      settings.emailNewJob, settings.emailApplicationReceived, settings.emailApplicationStatusUpdate,
      settings.pushNewJob, settings.pushApplicationReceived,
      settings.inAppNewJob, settings.inAppApplicationReceived
    ].filter(Boolean).length
    const totalCount = 7
    return { enabledCount, totalCount }
  }

  const { enabledCount, totalCount } = getSummaryStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-500 mt-1">Configure how users receive notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Hide Preview' : 'Preview Email'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Notification settings saved successfully!
        </div>
      )}

      {/* Summary Card */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-linear-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notification Channels Status</p>
              <p className="text-2xl font-bold text-gray-900">{enabledCount}/{totalCount} Active</p>
              <p className="text-xs text-gray-500 mt-1">
                {enabledCount === totalCount ? 'All notifications are enabled' : `${totalCount - enabledCount} notifications are disabled`}
              </p>
            </div>
            <Bell className="h-12 w-12 text-blue-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Email Notifications */}
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Notifications
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Control email notifications sent to users</p>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">New Job Alerts</Label>
                <p className="text-sm text-gray-500">Notify job seekers about new matching jobs</p>
              </div>
              <Switch
                checked={settings.emailNewJob}
                onCheckedChange={(checked) => setSettings({...settings, emailNewJob: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Application Received</Label>
                <p className="text-sm text-gray-500">Notify employers when someone applies</p>
              </div>
              <Switch
                checked={settings.emailApplicationReceived}
                onCheckedChange={(checked) => setSettings({...settings, emailApplicationReceived: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Application Status Update</Label>
                <p className="text-sm text-gray-500">Notify job seekers when status changes</p>
              </div>
              <Switch
                checked={settings.emailApplicationStatusUpdate}
                onCheckedChange={(checked) => setSettings({...settings, emailApplicationStatusUpdate: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Job Expiring Soon</Label>
                <p className="text-sm text-gray-500">Remind employers about expiring jobs</p>
              </div>
              <Switch
                checked={settings.emailJobExpiring}
                onCheckedChange={(checked) => setSettings({...settings, emailJobExpiring: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Password Change Alert</Label>
                <p className="text-sm text-gray-500">Notify on password changes</p>
              </div>
              <Switch
                checked={settings.emailPasswordChange}
                onCheckedChange={(checked) => setSettings({...settings, emailPasswordChange: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Login Alert</Label>
                <p className="text-sm text-gray-500">Notify on new device login</p>
              </div>
              <Switch
                checked={settings.emailLoginAlert}
                onCheckedChange={(checked) => setSettings({...settings, emailLoginAlert: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Push Notifications
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Browser and mobile push notifications</p>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Enable Push Notifications</Label>
                <p className="text-sm text-gray-500">Allow push notifications globally</p>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={(checked) => setSettings({...settings, pushEnabled: checked})}
              />
            </div>
            {settings.pushEnabled && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">New Job Alerts</Label>
                    <p className="text-sm text-gray-500">Push for new matching jobs</p>
                  </div>
                  <Switch
                    checked={settings.pushNewJob}
                    onCheckedChange={(checked) => setSettings({...settings, pushNewJob: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Application Received</Label>
                    <p className="text-sm text-gray-500">Push for new applications</p>
                  </div>
                  <Switch
                    checked={settings.pushApplicationReceived}
                    onCheckedChange={(checked) => setSettings({...settings, pushApplicationReceived: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Status Update</Label>
                    <p className="text-sm text-gray-500">Push for application status changes</p>
                  </div>
                  <Switch
                    checked={settings.pushApplicationStatusUpdate}
                    onCheckedChange={(checked) => setSettings({...settings, pushApplicationStatusUpdate: checked})}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Digest Settings */}
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Digest & Summary Settings
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Configure periodic summary emails</p>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Weekly Digest</Label>
                <p className="text-sm text-gray-500">Send weekly summary of activity</p>
              </div>
              <Switch
                checked={settings.emailWeeklyDigest}
                onCheckedChange={(checked) => setSettings({...settings, emailWeeklyDigest: checked})}
              />
            </div>
            {settings.emailWeeklyDigest && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div>
                  <Label>Day of Week</Label>
                  <Select value={settings.weeklyDigestDay} onValueChange={(value) => setSettings({...settings, weeklyDigestDay: value})}>
                    <SelectTrigger className="mt-1.5 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={settings.weeklyDigestTime}
                    onChange={(e) => setSettings({...settings, weeklyDigestTime: e.target.value})}
                    className="mt-1.5 rounded-lg"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Daily Digest</Label>
                <p className="text-sm text-gray-500">Send daily activity summary</p>
              </div>
              <Switch
                checked={settings.dailyDigest}
                onCheckedChange={(checked) => setSettings({...settings, dailyDigest: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Monthly Report</Label>
                <p className="text-sm text-gray-500">Send monthly performance report</p>
              </div>
              <Switch
                checked={settings.emailMonthlyReport}
                onCheckedChange={(checked) => setSettings({...settings, emailMonthlyReport: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Alerts */}
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-red-600" />
              Admin Alerts
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">System alerts for administrators</p>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Alert on New User</Label>
                <p className="text-sm text-gray-500">Notify when new user registers</p>
              </div>
              <Switch
                checked={settings.alertOnNewUser}
                onCheckedChange={(checked) => setSettings({...settings, alertOnNewUser: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Alert on New Employer</Label>
                <p className="text-sm text-gray-500">Notify when employer registers</p>
              </div>
              <Switch
                checked={settings.alertOnNewEmployer}
                onCheckedChange={(checked) => setSettings({...settings, alertOnNewEmployer: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Flagged Content Alert</Label>
                <p className="text-sm text-gray-500">Notify when content is flagged</p>
              </div>
              <Switch
                checked={settings.alertOnFlaggedContent}
                onCheckedChange={(checked) => setSettings({...settings, alertOnFlaggedContent: checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">System Error Alert</Label>
                <p className="text-sm text-gray-500">Notify on system errors</p>
              </div>
              <Switch
                checked={settings.alertOnSystemError}
                onCheckedChange={(checked) => setSettings({...settings, alertOnSystemError: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Admin Email Alerts</Label>
                <p className="text-sm text-gray-500">Send alerts to admin email</p>
              </div>
              <Switch
                checked={settings.adminEmailAlerts}
                onCheckedChange={(checked) => setSettings({...settings, adminEmailAlerts: checked})}
              />
            </div>
            <div>
              <Label>Slack Webhook (Optional)</Label>
              <Input
                value={settings.adminSlackWebhook}
                onChange={(e) => setSettings({...settings, adminSlackWebhook: e.target.value})}
                placeholder="https://hooks.slack.com/services/..."
                className="mt-1.5 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Send alerts to Slack channel</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Email Preview</h3>
              <button onClick={() => setPreviewMode(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2">New Job Alert</h4>
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm">A new job matching your skills has been posted!</p>
                  <p className="text-xs text-gray-500 mt-1">Senior Developer at Tech Corp</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2">Application Received</h4>
                <div className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm">New application received for your job posting</p>
                  <p className="text-xs text-gray-500 mt-1">John Doe applied for Software Engineer</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Weekly Digest</h4>
                <div className="border-l-4 border-purple-500 pl-3">
                  <p className="text-sm">Your weekly activity summary</p>
                  <p className="text-xs text-gray-500 mt-1">12 new jobs, 34 applications, 567 views</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-32">
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings