/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/employer/Preferences.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sun, Moon, Monitor, Palette, Globe } from 'lucide-react'

const Preferences: React.FC = () => {
  const [preferences, setPreferences] = useState({
    theme: 'light',      // light, dark, system
    language: 'en',      // en, es, fr, de
    compact_mode: false,
    animations: true,
    sidebar_collapsed: false,
    notifications_sound: true,
    email_digest: 'daily'
  })

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('user_preferences')
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
    
    // Apply theme
    applyTheme(preferences.theme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('user_preferences', JSON.stringify(preferences))
    
    // Apply theme immediately
    applyTheme(preferences.theme)
    
    alert('Preferences saved successfully!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
        <p className="text-gray-500 mt-1">Customize your dashboard experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setPreferences({...preferences, theme: 'light'})}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    preferences.theme === 'light' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">Light</span>
                </button>
                
                <button
                  onClick={() => setPreferences({...preferences, theme: 'dark'})}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    preferences.theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">Dark</span>
                </button>
                
                <button
                  onClick={() => setPreferences({...preferences, theme: 'system'})}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    preferences.theme === 'system' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Monitor className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">System</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-sm text-gray-500">Reduce spacing and padding</p>
              </div>
              <Switch
                checked={preferences.compact_mode}
                onCheckedChange={(checked) => setPreferences({...preferences, compact_mode: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Animations</Label>
                <p className="text-sm text-gray-500">Enable UI animations</p>
              </div>
              <Switch
                checked={preferences.animations}
                onCheckedChange={(checked) => setPreferences({...preferences, animations: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Language</Label>
              <Select 
                value={preferences.language} 
                onValueChange={(value) => setPreferences({...preferences, language: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Notification Sounds</Label>
                <p className="text-sm text-gray-500">Play sound for new notifications</p>
              </div>
              <Switch
                checked={preferences.notifications_sound}
                onCheckedChange={(checked) => setPreferences({...preferences, notifications_sound: checked})}
              />
            </div>
            
            <div>
              <Label>Email Digest</Label>
              <Select 
                value={preferences.email_digest} 
                onValueChange={(value) => setPreferences({...preferences, email_digest: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

export default Preferences