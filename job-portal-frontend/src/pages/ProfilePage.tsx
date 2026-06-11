import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">This page is a placeholder for the profile view.</p>
          <div className="mt-4">
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
