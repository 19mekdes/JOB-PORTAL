/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
// src/pages/jobseeker/Preferences.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Mail, 
  Eye, 
  Save, 
  Loader2,
  Briefcase,
  BellRing,
  MailCheck,
  BellOff,
  MailX,
  MonitorSmartphone
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface JobSeekerPreferences {
  id?: number
  user_id: string
  job_alerts_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  profile_visibility: 'public' | 'private' | 'employers_only'
  preferred_job_types: string[]
  preferred_locations: string[]
  preferred_industries: number[]
  min_salary: number | null
  max_salary: number | null
  experience_level: string
  notification_frequency: 'instant' | 'daily' | 'weekly'
  resume_visibility: boolean
  allow_employer_contact: boolean
  created_at?: string
  updated_at?: string
}

interface Industry {
  id: number
  industry_name: string
}

const JobSeekerPreferences: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingPush, setTestingPush] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [industries, setIndustries] = useState<Industry[]>([])
  
  const [preferences, setPreferences] = useState<JobSeekerPreferences>({
    user_id: '',
    job_alerts_enabled: true,
    email_notifications: true,
    push_notifications: false,
    profile_visibility: 'public',
    preferred_job_types: [],
    preferred_locations: [],
    preferred_industries: [],
    min_salary: null,
    max_salary: null,
    experience_level: 'entry',
    notification_frequency: 'instant',
    resume_visibility: true,
    allow_employer_contact: true
  })

  useEffect(() => {
    
    fetchPreferences()
    fetchIndustries()
    checkNotificationPermission()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await api.get('/jobseeker/preferences')
      if (response.data.success && response.data.data) {
        setPreferences(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIndustries = async () => {
    try {
      const response = await api.get('/industries')
      setIndustries(response.data.data || [])
    } catch (error) {
      console.error('Error fetching industries:', error)
    }
  }

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Your browser does not support notifications",
      })
      return false
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    
    if (permission === 'granted') {
      toast({
        title: "Permission Granted",
        description: "You will now receive push notifications",
      })
      return true
    } else {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings",
      })
      return false
    }
  }

  const testEmailNotification = async () => {
    setTestingEmail(true)
    try {
      const response = await api.post('/notifications/test-email')
      if (response.data.success) {
        toast({
          title: "Test Email Sent",
          description: "Please check your inbox (and spam folder)",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: response.data.message || "Could not send test email",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to send test email",
      })
    } finally {
      setTestingEmail(false)
    }
  }

  const testPushNotification = async () => {
    setTestingPush(true)
    try {
      // Request permission if not granted
      if (notificationPermission !== 'granted') {
        const granted = await requestNotificationPermission()
        if (!granted) {
          setTestingPush(false)
          return
        }
      }

      // Show test notification
      const notification = new Notification('🔔 Test Notification', {
        body: 'Your push notification settings are working correctly!',
        icon: '/logo192.png',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        silent: false
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      setTimeout(() => notification.close(), 5000)

      toast({
        title: "Test Sent",
        description: "Check your browser for the notification popup",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to show test notification",
      })
    } finally {
      setTestingPush(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/jobseeker/preferences', preferences)
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Preferences saved successfully",
        })
        
        // If push notifications were enabled, request permission
        if (preferences.push_notifications && notificationPermission !== 'granted') {
          await requestNotificationPermission()
        }
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save preferences",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleArrayItem = (array: any[], item: any, setter: (newArray: any[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item))
    } else {
      setter([...array, item])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Preferences</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your job search and notification settings</p>
      </div>

      {/* Job Alerts Card */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            Job Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Receive Job Alerts</p>
              <p className="text-xs text-gray-500">Get notified when new jobs matching your skills are posted</p>
            </div>
            <Switch
              checked={preferences.job_alerts_enabled}
              onCheckedChange={(checked) => setPreferences({...preferences, job_alerts_enabled: checked})}
            />
          </div>
          
          {preferences.job_alerts_enabled && (
            <div>
              <Label className="text-xs font-medium text-gray-700">Notification Frequency</Label>
              <Select 
                value={preferences.notification_frequency} 
                onValueChange={(value: any) => setPreferences({...preferences, notification_frequency: value})}
              >
                <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="instant" className="text-sm bg-white hover:bg-gray-50">Instant</SelectItem>
                  <SelectItem value="daily" className="text-sm bg-white hover:bg-gray-50">Daily Digest</SelectItem>
                  <SelectItem value="weekly" className="text-sm bg-white hover:bg-gray-50">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences Card - WITH TEST BUTTONS */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {preferences.email_notifications ? (
                  <MailCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <MailX className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive email updates about your applications</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => setPreferences({...preferences, email_notifications: checked})}
              />
              {preferences.email_notifications && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testEmailNotification}
                  disabled={testingEmail}
                  className="h-7 px-2 text-xs border-gray-300"
                >
                  {testingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                </Button>
              )}
            </div>
          </div>
          
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {preferences.push_notifications ? (
                  <BellRing className="h-4 w-4 text-blue-500" />
                ) : (
                  <BellOff className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive browser notifications</p>
                  {notificationPermission !== 'granted' && preferences.push_notifications && (
                    <p className="text-xs text-amber-600 mt-1">
                      <MonitorSmartphone className="h-3 w-3 inline mr-1" />
                      Permission required. Click "Test" to enable.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={async (checked) => {
                  setPreferences({...preferences, push_notifications: checked})
                  if (checked && notificationPermission !== 'granted') {
                    await requestNotificationPermission()
                    checkNotificationPermission()
                  }
                }}
              />
              {preferences.push_notifications && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testPushNotification}
                  disabled={testingPush}
                  className="h-7 px-2 text-xs border-gray-300"
                >
                  {testingPush ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility Card */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-600" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={preferences.profile_visibility === 'public'}
                onChange={(e) => setPreferences({...preferences, profile_visibility: e.target.value as any})}
                className="h-3.5 w-3.5 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Public</p>
                <p className="text-xs text-gray-500">Your profile is visible to all employers</p>
              </div>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="employers_only"
                checked={preferences.profile_visibility === 'employers_only'}
                onChange={(e) => setPreferences({...preferences, profile_visibility: e.target.value as any})}
                className="h-3.5 w-3.5 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Employers Only</p>
                <p className="text-xs text-gray-500">Only registered employers can view your profile</p>
              </div>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={preferences.profile_visibility === 'private'}
                onChange={(e) => setPreferences({...preferences, profile_visibility: e.target.value as any})}
                className="h-3.5 w-3.5 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Private</p>
                <p className="text-xs text-gray-500">Only employers you apply to can see your profile</p>
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Show Resume to Employers</p>
              <p className="text-xs text-gray-500">Allow employers to view your resume</p>
            </div>
            <Switch
              checked={preferences.resume_visibility}
              onCheckedChange={(checked) => setPreferences({...preferences, resume_visibility: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Allow Employer Contact</p>
              <p className="text-xs text-gray-500">Allow employers to reach out to you directly</p>
            </div>
            <Switch
              checked={preferences.allow_employer_contact}
              onCheckedChange={(checked) => setPreferences({...preferences, allow_employer_contact: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Preferences Card */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-orange-600" />
            Job Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Job Types */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Preferred Job Types</Label>
            <div className="grid grid-cols-3 gap-2">
              {['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.preferred_job_types.includes(type)}
                    onChange={() => toggleArrayItem(
                      preferences.preferred_job_types, 
                      type, 
                      (newArray) => setPreferences({...preferences, preferred_job_types: newArray})
                    )}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Industries */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Preferred Industries</Label>
            <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-2">
              {industries.map((industry) => (
                <label key={industry.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.preferred_industries.includes(industry.id)}
                    onChange={() => toggleArrayItem(
                      preferences.preferred_industries, 
                      industry.id, 
                      (newArray) => setPreferences({...preferences, preferred_industries: newArray})
                    )}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 truncate">{industry.industry_name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700">Min Salary</Label>
              <Input
                type="number"
                placeholder="Min"
                value={preferences.min_salary || ''}
                onChange={(e) => setPreferences({...preferences, min_salary: e.target.value ? Number(e.target.value) : null})}
                className="mt-1 h-9 text-sm bg-white border-gray-300"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Max Salary</Label>
              <Input
                type="number"
                placeholder="Max"
                value={preferences.max_salary || ''}
                onChange={(e) => setPreferences({...preferences, max_salary: e.target.value ? Number(e.target.value) : null})}
                className="mt-1 h-9 text-sm bg-white border-gray-300"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Experience Level</Label>
            <Select 
              value={preferences.experience_level} 
              onValueChange={(value) => setPreferences({...preferences, experience_level: value})}
            >
              <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-300">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                <SelectItem value="entry" className="text-sm bg-white hover:bg-gray-50 cursor-pointer">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="mid" className="text-sm bg-white hover:bg-gray-50 cursor-pointer">Mid Level (3-5 years)</SelectItem>
                <SelectItem value="senior" className="text-sm bg-white hover:bg-gray-50 cursor-pointer">Senior Level (6-9 years)</SelectItem>
                <SelectItem value="executive" className="text-sm bg-white hover:bg-gray-50 cursor-pointer">Executive (10+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

export default JobSeekerPreferences