/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, Shield, TrendingUp, 
  Briefcase, FileCheck, AlertCircle,
  RefreshCw, Building, Eye, CheckCircle} from 'lucide-react'
import {
  BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface DashboardStats {
  totalUsers: number
  totalJobSeekers: number
  totalEmployers: number
  totalAdmins: number
  totalJobs: number
  activeJobs: number
  closedJobs: number
  pendingJobs: number
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  interviewApplications: number
  totalViews: number
  averageViewsPerJob: number
  averageApplicationsPerJob: number
  conversionRate: number
  jobsByIndustry: Array<{ name: string; count: number }>
  jobsByMonth: Array<{ month: string; jobs: number; applications: number }>
  applicationsByMonth: Array<{ month: string; applications: number }>
  applicationsByStatus: Array<{ status: string; count: number }>
  topSkills: Array<{ skill: string; count: number }>
  topEmployers: Array<{ name: string; jobCount: number; views: number }>
}

const SuperAdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [selectedPeriod] = useState('30d')
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedPeriod])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Use the correct endpoint that matches your backend
      const response = await api.get(`/super-admin/analytics`)
      
      console.log('Dashboard API Response:', response.data)
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data
        
        setStats({
          // User Stats
          totalUsers: data.totalUsers || 0,
          totalJobSeekers: data.totalJobSeekers || 0,
          totalEmployers: data.totalEmployers || 0,
          totalAdmins: data.totalAdmins || 0,
          
          // Job Stats
          totalJobs: data.totalJobs || 0,
          activeJobs: data.activeJobs || 0,
          closedJobs: data.closedJobs || 0,
          pendingJobs: data.pendingJobs || 0,
          
          // Application Stats
          totalApplications: data.totalApplications || 0,
          pendingApplications: data.pendingApplications || 0,
          acceptedApplications: data.acceptedApplications || 0,
          rejectedApplications: data.rejectedApplications || 0,
          interviewApplications: data.interviewApplications || 0,
          
          // Views & Metrics
          totalViews: data.totalViews || 0,
          averageViewsPerJob: data.averageViewsPerJob || 0,
          averageApplicationsPerJob: data.averageApplicationsPerJob || 0,
          conversionRate: data.conversionRate || 0,
          
          // Chart Data
          jobsByIndustry: data.jobsByIndustry || [],
          jobsByMonth: data.jobsByMonth || [],
          applicationsByMonth: data.applicationsByMonth || [],
          applicationsByStatus: data.applicationsByStatus || [],
          
          // Top Lists
          topSkills: data.topSkills || [],
          topEmployers: data.topEmployers || []
        })
      } else {
        console.warn('Unexpected API response structure:', response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard data" })
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | undefined) => {
    if (!num || num === undefined) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const applicationStatusData = stats?.applicationsByStatus || []

  const maxSkillCount = stats?.topSkills && stats.topSkills.length > 0 
    ? Math.max(...stats.topSkills.map(s => s.count)) 
    : 1

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} className="border-gray-300">
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards Row 1 - Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalUsers)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-500">{stats.totalJobSeekers} Job Seekers</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalJobs)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-500">{stats.activeJobs} Active</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Applications</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalApplications)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-gray-500">{stats.acceptedApplications} Accepted</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <FileCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Views</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalViews)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Eye className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-gray-500">{stats.averageViewsPerJob} avg/job</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Row 2 - User Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Job Seekers</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalJobSeekers)}</p>
              </div>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Employers</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalEmployers)}</p>
              </div>
              <Building className="h-4 w-4 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Admins</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalAdmins)}</p>
              </div>
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Conversion Rate</p>
                <p className="text-xl font-bold text-green-600">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg Apps/Job</p>
                <p className="text-xl font-bold text-gray-900">{stats.averageApplicationsPerJob}</p>
              </div>
              <FileCheck className="h-4 w-4 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Status & Jobs by Industry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Application Status Pie Chart */}
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {applicationStatusData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No application data available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((entry, index) => {
                        const colors = ['#f59e0b', '#06b6d4', '#10b981', '#ef4444']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {applicationStatusData.map((status, index) => {
                    const colors = ['#f59e0b', '#06b6d4', '#10b981', '#ef4444']
                    return (
                      <div key={status.status} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index] }} />
                        <span className="text-xs text-gray-600">{status.status}</span>
                        <span className="text-xs font-semibold text-gray-900">{status.count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Jobs by Industry Bar Chart */}
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">Jobs by Industry</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!stats.jobsByIndustry || stats.jobsByIndustry.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No industry data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.jobsByIndustry} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Number of Jobs" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Skills & Top Employers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Skills */}
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">Top Skills in Demand</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!stats.topSkills || stats.topSkills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No skill data available</div>
            ) : (
              <div className="space-y-3">
                {stats.topSkills.slice(0, 5).map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{skill.skill}</span>
                      <span className="text-gray-500">{skill.count} jobs</span>
                    </div>
                    <Progress value={(skill.count / maxSkillCount) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Employers */}
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">Top Performing Employers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!stats.topEmployers || stats.topEmployers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No employer data available</div>
            ) : (
              <div className="space-y-3">
                {stats.topEmployers.slice(0, 5).map((employer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{employer.name}</p>
                      <p className="text-xs text-gray-500">{employer.jobCount} jobs • {(employer.views || 0).toLocaleString()} views</p>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Summary */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 pb-3">
          <CardTitle className="text-base sm:text-lg text-gray-900">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</p>
              <p className="text-xs text-gray-600">Application to Hire Rate</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.averageApplicationsPerJob}</p>
              <p className="text-xs text-gray-600">Avg Applications per Job</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.averageViewsPerJob}</p>
              <p className="text-xs text-gray-600">Avg Views per Job</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.totalEmployers}</p>
              <p className="text-xs text-gray-600">Active Employers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminDashboard