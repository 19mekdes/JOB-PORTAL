/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DashboardContent.tsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'  // ADDED useNavigate
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  FileText,
  Bookmark,
  UserCircle,
  Eye,
  Award,
  Calendar,
  CheckCircle,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/services/api'

interface DashboardStats {
  profileCompletion: number
  applicationsCount: number
  savedJobsCount: number
  profileViews: number
  applicationSuccessRate: number
}

const DashboardContent: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()  // ADDED navigate hook
  
  const [stats, setStats] = useState<DashboardStats>({
    profileCompletion: 0,
    applicationsCount: 0,
    savedJobsCount: 0,
    profileViews: 0,
    applicationSuccessRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [profileRes, bookmarksRes, applicationsRes] = await Promise.all([
        api.get('/profile/me'),
        api.get('/bookmarks'),
        api.get('/applications/my-applications')
      ])
      
      const profile = profileRes.data.data.profile
      const profileCompletion = calculateProfileCompletion(profile)
      const applications = applicationsRes.data.data || []
      
      setStats({
        profileCompletion,
        applicationsCount: applications.length,
        savedJobsCount: bookmarksRes.data.data?.length || 0,
        profileViews: profile?.views_count || 0,
        applicationSuccessRate: calculateSuccessRate(applications)
      })
      
      setRecentApplications(applications.slice(0, 3))
      try {
  const jobsRes = await api.get('/jobs?limit=3')
  const allJobs = jobsRes.data.data || []
  // Get first 3 jobs as recommendations
  setRecommendedJobs(allJobs.slice(0, 3))
} catch (error) {
  console.error('Error fetching recommended jobs:', error)
  setRecommendedJobs([])
}
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProfileCompletion = (profile: any) => {
    let completed = 0
    const total = 6
    if (profile?.full_name) completed++
    if (profile?.skills?.length > 0) completed++
    if (profile?.experience) completed++
    if (profile?.education) completed++
    if (profile?.resume_url) completed++
    if (profile?.phone) completed++
    return Math.round((completed / total) * 100)
  }

  const calculateSuccessRate = (apps: any[]) => {
    if (apps.length === 0) return 0
    const accepted = apps.filter((a: any) => a.status?.status_name === 'Accepted').length
    return Math.round((accepted / apps.length) * 100)
  }

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60))
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} minutes ago`
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
    return `${Math.floor(diff / 1440)} days ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Track your job search progress and discover new opportunities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Profile Completion</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.profileCompletion}%</p>
              </div>
              <UserCircle className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={stats.profileCompletion} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Applications Sent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.applicationsCount}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Saved Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.savedJobsCount}</p>
              </div>
              <Bookmark className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.profileViews}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="tips">Tips & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Applications</CardTitle>
                <Link to="/applications">
                  <Button variant="ghost" size="sm">View All →</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No applications yet</p>
                    <Link to="/jobs">
                      <Button variant="link" size="sm" className="mt-2">Browse Jobs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplications.map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{app.job?.title}</p>
                          <p className="text-sm text-gray-500">{app.job?.employer?.company_name}</p>
                          <p className="text-xs text-gray-400 mt-1">Applied {getTimeAgo(app.applied_at)}</p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {app.status?.status_name || 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <p className="text-sm text-gray-500">Things you can do next</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/jobs">
                  <Button variant="outline" className="w-full justify-start">
                    Browse Jobs
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    Complete Your Profile
                  </Button>
                </Link>
                <Link to="/bookmarks">
                  <Button variant="outline" className="w-full justify-start">
                    View Saved Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
              <p className="text-sm text-gray-500">Jobs that match your profile</p>
            </CardHeader>
            <CardContent>
              {recommendedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No recommendations yet</p>
                  <p className="text-sm text-gray-400">Complete your profile to get personalized job recommendations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.company}</p>
                        <p className="text-xs text-gray-400">{job.location}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/jobs/${job.id}`)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Profile Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Complete your profile to increase visibility by 3x</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Add relevant skills to match with better opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Upload a professional resume for better chances</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Application Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Apply within 48 hours of job posting for best results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Customize your resume for each application</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Follow up with employers after 5-7 days</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default DashboardContent