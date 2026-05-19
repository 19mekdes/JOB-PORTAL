/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  Briefcase,
  TrendingUp,
  Star,
  Calendar,
  MessageSquare,
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  MailOpen,
  Smartphone as SmartphoneIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/common/LoadingSpinner'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  application_updates: boolean
  new_job_alerts: boolean
  status_changes: boolean
  marketing_emails: boolean
  weekly_digest: boolean
  interview_reminders: boolean
  message_notifications: boolean
  job_recommendations: boolean
}

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    application_updates: true,
    new_job_alerts: true,
    status_changes: true,
    marketing_emails: false,
    weekly_digest: true,
    interview_reminders: true,
    message_notifications: true,
    job_recommendations: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/notifications/preferences')
      setPreferences(response.data.data)
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notification preferences",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.put('/notifications/preferences', preferences)
      toast({
        variant: "success",
        title: "Success",
        description: "Notification preferences updated",
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setPreferences({
      email_notifications: true,
      push_notifications: true,
      application_updates: true,
      new_job_alerts: true,
      status_changes: true,
      marketing_emails: false,
      weekly_digest: true,
      interview_reminders: true,
      message_notifications: true,
      job_recommendations: true
    })
    toast({
      title: "Reset",
      description: "Preferences reset to default",
    })
  }

  const sendTestNotification = async () => {
    try {
      await api.post('/notifications/test/send', {
        title: 'Test Notification',
        message: 'This is a test notification to verify your settings.'
      })
      setTestEmailSent(true)
      setTimeout(() => setTestEmailSent(false), 3000)
      toast({
        title: "Test Sent",
        description: "Test notification has been sent",
      })
    } catch (error) {
      console.error('Error sending test:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test notification",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Preferences
          </h1>
          <p className="text-gray-500 mt-1">Manage how you receive notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Test Notification Alert */}
      {testEmailSent && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Test notification sent! Check your inbox.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="events">Events & Updates</TabsTrigger>
          <TabsTrigger value="digest">Digest & Marketing</TabsTrigger>
        </TabsList>

        {/* Notification Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <SmartphoneIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                />
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Test your settings</p>
                    <p className="text-xs mt-1">Send a test notification to verify your preferences</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={sendTestNotification} className="ml-auto">
                    Send Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events & Updates Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Events & Updates</CardTitle>
              <CardDescription>Choose which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Application Updates</p>
                    <p className="text-sm text-gray-500">When your application status changes</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.application_updates}
                  onCheckedChange={(checked) => updatePreference('application_updates', checked)}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">New Job Alerts</p>
                    <p className="text-sm text-gray-500">When new jobs matching your profile are posted</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.new_job_alerts}
                  onCheckedChange={(checked) => updatePreference('new_job_alerts', checked)}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Status Changes</p>
                    <p className="text-sm text-gray-500">When there are updates to your applications</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.status_changes}
                  onCheckedChange={(checked) => updatePreference('status_changes', checked)}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Interview Reminders</p>
                    <p className="text-sm text-gray-500">Reminders for upcoming interviews</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.interview_reminders}
                  onCheckedChange={(checked) => updatePreference('interview_reminders', checked)}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="font-medium">Message Notifications</p>
                    <p className="text-sm text-gray-500">When you receive messages from employers</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.message_notifications}
                  onCheckedChange={(checked) => updatePreference('message_notifications', checked)}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Job Recommendations</p>
                    <p className="text-sm text-gray-500">Personalized job recommendations based on your profile</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.job_recommendations}
                  onCheckedChange={(checked) => updatePreference('job_recommendations', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digest & Marketing Tab */}
        <TabsContent value="digest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Digest & Marketing</CardTitle>
              <CardDescription>Manage newsletters and marketing communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <MailOpen className="h-5 w-5 text-teal-500" />
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-gray-500">Weekly summary of your activity and new opportunities</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.weekly_digest}
                  onCheckedChange={(checked) => updatePreference('weekly_digest', checked)}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-gray-500">Promotions, tips, and company updates</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.marketing_emails}
                  onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              We respect your privacy. You can change these preferences at any time.
              We will never share your email with third parties without your consent.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Your current notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-green-500" />
              <span>Email Notifications: {preferences.email_notifications ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <SmartphoneIcon className="h-4 w-4 text-blue-500" />
              <span>Push Notifications: {preferences.push_notifications ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-purple-500" />
              <span>Application Updates: {preferences.application_updates ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>New Job Alerts: {preferences.new_job_alerts ? 'On' : 'Off'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationPreferences