/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Briefcase,
  FileText,
  Award,
  Building2,
  CheckCircle,
  Clock
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
      
      const backendData = response.data?.data || response.data || {}
      
      // Calculate totals from backend data
      const dailyJobs = backendData.dailyJobs || []
      const totalJobs = dailyJobs.reduce((sum: number, job: any) => sum + (job.count || 0), 0)
      
      const applicationStats = backendData.applicationStats || []
      const pendingApps = applicationStats.find((s: any) => s.status === 'Pending')?.count || 0
      const interviewApps = applicationStats.find((s: any) => s.status === 'Interview')?.count || 0
      const acceptedApps = applicationStats.find((s: any) => s.status === 'Accepted')?.count || 0
      const totalApplications = pendingApps + interviewApps + acceptedApps
      
      const topEmployersRaw = backendData.topEmployers || []
      const topEmployers = topEmployersRaw.map((emp: any) => ({
        name: emp.name,
        jobCount: emp.jobCount || 0,
        views: 0
      }))
      
      const topIndustriesRaw = backendData.topIndustries || []
      const topIndustries = topIndustriesRaw.map((ind: any) => ({
        name: ind.name,
        count: ind.jobCount || 0
      })).filter((ind: any) => ind.count > 0)
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      const jobsByMonth = months.map((month, index) => ({
        month,
        count: index === 5 ? totalJobs : 0
      }))
      
      const applicationsByMonth = months.map((month, index) => ({
        month,
        count: index === 5 ? totalApplications : 0
      }))
      
      setData({
        totalUsers: 0,
        totalJobSeekers: 0,
        totalEmployers: 0,
        totalAdmins: 0,
        newUsersThisMonth: 0,
        userGrowth: 0,
        activeUsers: 0,
        totalJobs: totalJobs,
        activeJobs: totalJobs,
        closedJobs: 0,
        newJobsThisMonth: totalJobs,
        jobGrowth: 0,
        jobsByIndustry: topIndustries,
        jobsByType: [],
        totalApplications: totalApplications,
        pendingApplications: pendingApps,
        reviewedApplications: 0,
        shortlistedApplications: 0,
        interviewApplications: interviewApps,
        acceptedApplications: acceptedApps,
        rejectedApplications: 0,
        totalViews: 0,
        averageViewsPerJob: 0,
        averageApplicationsPerJob: totalJobs > 0 ? parseFloat((totalApplications / totalJobs).toFixed(1)) : 0,
        conversionRate: totalApplications > 0 ? Math.round((acceptedApps / totalApplications) * 100) : 0,
        jobsByMonth,
        applicationsByMonth,
        viewsByMonth: jobsByMonth.map(m => ({ month: m.month, count: 0 })),
        topIndustries,
        topEmployers,
        topSkills: []
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
      title: 'Total Jobs',
      value: (data.totalJobs || 0).toLocaleString(),
      icon: Briefcase,
      change: `${data.newJobsThisMonth || 0} new this month`,
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
      title: 'Pending Review',
      value: (data.pendingApplications || 0).toLocaleString(),
      icon: Clock,
      change: 'Needs attention',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      trend: 'Awaiting review'
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversionRate || 0}%`,
      icon: TrendingUp,
      change: `${data.acceptedApplications || 0} accepted out of ${data.totalApplications || 0}`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: 'Success rate'
    }
  ]

  const applicationStats = [
    { label: 'Pending', count: data.pendingApplications || 0, color: 'bg-yellow-500', percentage: data.totalApplications > 0 ? ((data.pendingApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Interview', count: data.interviewApplications || 0, color: 'bg-indigo-500', percentage: data.totalApplications > 0 ? ((data.interviewApplications || 0) / data.totalApplications) * 100 : 0 },
    { label: 'Accepted', count: data.acceptedApplications || 0, color: 'bg-green-500', percentage: data.totalApplications > 0 ? ((data.acceptedApplications || 0) / data.totalApplications) * 100 : 0 }
  ]

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Platform performance metrics and insights</p>
        </div>
      </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="overview" className="bg-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="jobs" className="bg-white data-[state=active]:bg-green-600 data-[state=active]:text-white">Jobs Analytics</TabsTrigger>
          <TabsTrigger value="applications" className="bg-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Applications</TabsTrigger>
          <TabsTrigger value="users" className="bg-white data-[state=active]:bg-orange-600 data-[state=active]:text-white">User Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Briefcase className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{data.totalJobs}</p>
                    <p className="text-sm text-gray-600">Total Jobs Posted</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{data.totalApplications}</p>
                    <p className="text-sm text-gray-600">Total Applications</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{data.conversionRate}%</p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                        <p className="text-sm text-gray-500">{employer.jobCount} jobs</p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-200">#{i + 1}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{data.totalJobs}</p>
                    <p className="text-xs text-gray-500">Total Jobs</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{data.newJobsThisMonth}</p>
                    <p className="text-xs text-gray-500">New This Month</p>
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
                    <span className="text-gray-700">Applications per Job</span>
                    <span className="text-gray-900">{data.averageApplicationsPerJob}</span>
                  </div>
                  <Progress value={Math.min((data.averageApplicationsPerJob / 50) * 100, 100)} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{data.conversionRate}%</p>
                    <p className="text-xs text-gray-500">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
            <Card className="bg-white border border-yellow-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{data.pendingApplications}</p>
                <p className="text-xs text-gray-500">Pending</p>
                <Clock className="h-4 w-4 text-yellow-500 mx-auto mt-1" />
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
                  else if (stat.label === 'Interview') bgColor = 'bg-indigo-500'
                  else bgColor = 'bg-green-500'
                  
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

        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{data.topEmployers.length}</p>
                <p className="text-xs text-gray-500">Active Employers</p>
                <Building2 className="h-4 w-4 text-gray-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-blue-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.totalJobs}</p>
                <p className="text-xs text-gray-500">Total Jobs</p>
                <Briefcase className="h-4 w-4 text-blue-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-purple-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{data.totalApplications}</p>
                <p className="text-xs text-gray-500">Total Applications</p>
                <FileText className="h-4 w-4 text-purple-500 mx-auto mt-1" />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Jobs Posted</span>
                    <span className="text-gray-900">{data.totalJobs}</span>
                  </div>
                  <Progress value={Math.min((data.totalJobs / 100) * 100, 100)} className="h-2" />
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Applications Received</span>
                    <span className="text-gray-900">{data.totalApplications}</span>
                  </div>
                  <Progress value={Math.min((data.totalApplications / 100) * 100, 100)} className="h-2" />
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Conversion Rate</span>
                    <span className="text-gray-900">{data.conversionRate}%</span>
                  </div>
                  <Progress value={data.conversionRate} className="h-2" />
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