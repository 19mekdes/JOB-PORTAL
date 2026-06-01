/* eslint-disable prefer-const */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Award,
  Building2,
  UserCheck,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AnalyticsData {
  totalUsers: number
  totalJobSeekers: number
  totalEmployers: number
  totalAdmins: number
  newUsersThisMonth: number
  userGrowth: number
  activeUsers: number
  totalJobs: number
  activeJobs: number
  closedJobs: number
  newJobsThisMonth: number
  jobGrowth: number
  jobsByIndustry: Array<{ industry: string; count: number }>
  jobsByType: Array<{ type: string; count: number }>
  totalApplications: number
  pendingApplications: number
  reviewedApplications: number
  shortlistedApplications: number
  interviewApplications: number
  acceptedApplications: number
  rejectedApplications: number
  totalViews: number
  averageViewsPerJob: number
  averageApplicationsPerJob: number
  conversionRate: number
  jobsByMonth: Array<{ month: string; count: number }>
  applicationsByMonth: Array<{ month: string; count: number }>
  viewsByMonth: Array<{ month: string; count: number }>
  topIndustries: Array<{ name: string; count: number }>
  topEmployers: Array<{ name: string; jobCount: number; views: number }>
  topSkills: Array<{ skill: string; count: number }>
}

const defaultData: AnalyticsData = {
  totalUsers: 0,
  totalJobSeekers: 0,
  totalEmployers: 0,
  totalAdmins: 0,
  newUsersThisMonth: 0,
  userGrowth: 0,
  activeUsers: 0,
  totalJobs: 0,
  activeJobs: 0,
  closedJobs: 0,
  newJobsThisMonth: 0,
  jobGrowth: 0,
  jobsByIndustry: [],
  jobsByType: [],
  totalApplications: 0,
  pendingApplications: 0,
  reviewedApplications: 0,
  shortlistedApplications: 0,
  interviewApplications: 0,
  acceptedApplications: 0,
  rejectedApplications: 0,
  totalViews: 0,
  averageViewsPerJob: 0,
  averageApplicationsPerJob: 0,
  conversionRate: 0,
  jobsByMonth: [],
  applicationsByMonth: [],
  viewsByMonth: [],
  topIndustries: [],
  topEmployers: [],
  topSkills: []
}

const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [period] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/analytics?period=${period}`)
      
      console.log('Analytics API Response:', response.data)
      
      // Safely extract data with fallbacks
      const responseData = response.data?.data || response.data || {}
      
      // Safely extract arrays
      const jobsByIndustry = Array.isArray(responseData.jobsByIndustry) ? responseData.jobsByIndustry : []
      const jobsByType = Array.isArray(responseData.jobsByType) ? responseData.jobsByType : []
      const jobsByMonth = Array.isArray(responseData.jobsByMonth) ? responseData.jobsByMonth : []
      const applicationsByMonth = Array.isArray(responseData.applicationsByMonth) ? responseData.applicationsByMonth : []
      const viewsByMonth = Array.isArray(responseData.viewsByMonth) ? responseData.viewsByMonth : []
      const topIndustries = Array.isArray(responseData.topIndustries) ? responseData.topIndustries : []
      const topEmployers = Array.isArray(responseData.topEmployers) ? responseData.topEmployers : []
      const topSkills = Array.isArray(responseData.topSkills) ? responseData.topSkills : []
      
      setData({
        totalUsers: responseData.totalUsers ?? 0,
        totalJobSeekers: responseData.totalJobSeekers ?? 0,
        totalEmployers: responseData.totalEmployers ?? 0,
        totalAdmins: responseData.totalAdmins ?? 0,
        newUsersThisMonth: responseData.newUsersThisMonth ?? 0,
        userGrowth: responseData.userGrowth ?? 0,
        activeUsers: responseData.activeUsers ?? 0,
        totalJobs: responseData.totalJobs ?? 0,
        activeJobs: responseData.activeJobs ?? 0,
        closedJobs: responseData.closedJobs ?? 0,
        newJobsThisMonth: responseData.newJobsThisMonth ?? 0,
        jobGrowth: responseData.jobGrowth ?? 0,
        jobsByIndustry,
        jobsByType,
        totalApplications: responseData.totalApplications ?? 0,
        pendingApplications: responseData.pendingApplications ?? 0,
        reviewedApplications: responseData.reviewedApplications ?? 0,
        shortlistedApplications: responseData.shortlistedApplications ?? 0,
        interviewApplications: responseData.interviewApplications ?? 0,
        acceptedApplications: responseData.acceptedApplications ?? 0,
        rejectedApplications: responseData.rejectedApplications ?? 0,
        totalViews: responseData.totalViews ?? 0,
        averageViewsPerJob: responseData.averageViewsPerJob ?? 0,
        averageApplicationsPerJob: responseData.averageApplicationsPerJob ?? 0,
        conversionRate: responseData.conversionRate ?? 0,
        jobsByMonth,
        applicationsByMonth,
        viewsByMonth,
        topIndustries,
        topEmployers,
        topSkills
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analytics data",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 bg-white min-h-screen p-6 rounded-xl">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: (data.totalUsers || 0).toLocaleString(),
      icon: Users,
      change: `${data.newUsersThisMonth || 0} new this month`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: `${(data.userGrowth || 0) > 0 ? '+' : ''}${data.userGrowth || 0}%`
    },
    {
      title: 'Total Jobs',
      value: (data.totalJobs || 0).toLocaleString(),
      icon: Briefcase,
      change: `${data.activeJobs || 0} active / ${data.closedJobs || 0} closed`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: `${(data.jobGrowth || 0) > 0 ? '+' : ''}${data.jobGrowth || 0}%`
    },
    {
      title: 'Applications',
      value: (data.totalApplications || 0).toLocaleString(),
      icon: FileText,
      change: `${data.pendingApplications || 0} pending`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: `${data.acceptedApplications || 0} accepted`
    },
    {
      title: 'Views',
      value: (data.totalViews || 0).toLocaleString(),
      icon: Eye,
      change: `${data.averageViewsPerJob || 0} avg per job`,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: `${data.conversionRate || 0}% conversion`
    }
  ]

  const applicationStats = [
    { label: 'Pending', count: data.pendingApplications || 0, color: 'bg-yellow-500', percentage: data.totalApplications > 0 ? ((data.pendingApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Reviewed', count: data.reviewedApplications || 0, color: 'bg-blue-500', percentage: data.totalApplications > 0 ? ((data.reviewedApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Shortlisted', count: data.shortlistedApplications || 0, color: 'bg-purple-500', percentage: data.totalApplications > 0 ? ((data.shortlistedApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Interview', count: data.interviewApplications || 0, color: 'bg-indigo-500', percentage: data.totalApplications > 0 ? ((data.interviewApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Accepted', count: data.acceptedApplications || 0, color: 'bg-green-500', percentage: data.totalApplications > 0 ? ((data.acceptedApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Rejected', count: data.rejectedApplications || 0, color: 'bg-red-500', percentage: data.totalApplications > 0 ? ((data.rejectedApplications || 0) / data.totalApplications) * 100 : 0 }
  ]

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Platform performance metrics and insights</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition bg-white border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                    <Badge variant="secondary" className="mt-1 text-xs bg-gray-100">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="overview" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="jobs" className="bg-white data-[state=active]:bg-green-600 data-[state=active]:text-white">Jobs Analytics</TabsTrigger>
          <TabsTrigger value="applications" className="bg-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Applications</TabsTrigger>
          <TabsTrigger value="users" className="bg-white data-[state=active]:bg-orange-600 data-[state=active]:text-white">User Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Application Status Distribution */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Application Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{stat.label}</span>
                      <span className="font-medium">{stat.count.toLocaleString()} ({Math.round(stat.percentage)}%)</span>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Jobs by Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Building2 className="h-5 w-5" />
                  Jobs by Industry
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.jobsByIndustry.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No industry data available</div>
                ) : (
                  <div className="space-y-3">
                    {data.jobsByIndustry.slice(0, 5).map((industry, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{industry.industry}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${data.totalJobs > 0 ? (industry.count / data.totalJobs) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{industry.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Jobs by Type */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Briefcase className="h-5 w-5" />
                  Jobs by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.jobsByType.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No employment type data available</div>
                ) : (
                  <div className="space-y-3">
                    {data.jobsByType.map((type, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{type.type}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${data.totalJobs > 0 ? (type.count / data.totalJobs) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{type.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Employers */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Award className="h-5 w-5" />
                Top Employers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topEmployers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No employer data available</div>
              ) : (
                <div className="space-y-4">
                  {data.topEmployers.slice(0, 5).map((employer, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{employer.name}</p>
                        <p className="text-sm text-gray-500">{employer.jobCount} jobs • {(employer.views || 0).toLocaleString()} views</p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-200">#{i + 1}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Skills */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5" />
                In-Demand Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topSkills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No skill data available</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.topSkills.slice(0, 10).map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-sm py-1.5 bg-gray-100 text-gray-700">
                      {skill.skill} ({skill.count})
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Analytics Tab */}
        <TabsContent value="jobs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{data.activeJobs}</p>
                    <p className="text-xs text-gray-500">Active Jobs</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{data.closedJobs}</p>
                    <p className="text-xs text-gray-500">Closed Jobs</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{data.newJobsThisMonth}</p>
                    <p className="text-xs text-gray-500">New This Month</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{data.averageViewsPerJob}</p>
                    <p className="text-xs text-gray-500">Avg Views/Job</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Views to Applications</span>
                    <span className="text-gray-900">{data.conversionRate}%</span>
                  </div>
                  <Progress value={data.conversionRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Applications per Job</span>
                    <span className="text-gray-900">{data.averageApplicationsPerJob}</span>
                  </div>
                  <Progress value={Math.min((data.averageApplicationsPerJob / 50) * 100, 100)} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{(data.totalViews || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Job Views</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{data.jobGrowth}%</p>
                    <p className="text-xs text-gray-500">Job Growth</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{(data.totalApplications || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Applications</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.acceptedApplications}</p>
                <p className="text-xs text-gray-500">Accepted</p>
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-red-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-red-600">{data.rejectedApplications}</p>
                <p className="text-xs text-gray-500">Rejected</p>
                <XCircle className="h-4 w-4 text-red-500 mx-auto mt-1" />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Application Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationStats.map((stat, i) => {
                  let bgColor = ''
                  if (stat.label === 'Pending') bgColor = 'bg-yellow-500'
                  else if (stat.label === 'Reviewed') bgColor = 'bg-blue-500'
                  else if (stat.label === 'Shortlisted') bgColor = 'bg-purple-500'
                  else if (stat.label === 'Interview') bgColor = 'bg-indigo-500'
                  else if (stat.label === 'Accepted') bgColor = 'bg-green-500'
                  else bgColor = 'bg-red-500'
                  
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${bgColor}`} />
                          <span className="text-gray-700">{stat.label}</span>
                        </span>
                        <span className="font-medium text-gray-900">{stat.count.toLocaleString()}</span>
                      </div>
                      <Progress value={stat.percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Insights Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{(data.totalJobSeekers || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Job Seekers</p>
                <UserCheck className="h-4 w-4 text-blue-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{(data.totalEmployers || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Employers</p>
                <Building2 className="h-4 w-4 text-purple-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{data.totalAdmins}</p>
                <p className="text-xs text-gray-500">Administrators</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.userGrowth}%</p>
                <p className="text-xs text-gray-500">User Growth</p>
                <TrendingUp className="h-4 w-4 text-green-500 mx-auto mt-1" />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Active Users</span>
                    <span className="text-gray-900">{data.totalUsers > 0 ? ((data.activeUsers / data.totalUsers) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <Progress value={data.totalUsers > 0 ? (data.activeUsers / data.totalUsers) * 100 : 0} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{(data.activeUsers || 0).toLocaleString()} out of {(data.totalUsers || 0).toLocaleString()} users active</p>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">New Users (This Month)</span>
                    <span className="text-gray-900">{(data.newUsersThisMonth || 0).toLocaleString()}</span>
                  </div>
                  <Progress value={data.totalUsers > 0 ? (data.newUsersThisMonth / data.totalUsers) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminAnalytics