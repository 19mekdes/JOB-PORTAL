/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Download,
  RefreshCw,
  Activity,
  Award,
  Building2,
  UserCheck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AnalyticsData {
  // User Statistics
  totalUsers: number
  totalJobSeekers: number
  totalEmployers: number
  totalAdmins: number
  newUsersThisMonth: number
  userGrowth: number
  activeUsers: number
  
  // Job Statistics
  totalJobs: number
  activeJobs: number
  closedJobs: number
  newJobsThisMonth: number
  jobGrowth: number
  jobsByIndustry: Array<{ industry: string; count: number }>
  jobsByType: Array<{ type: string; count: number }>
  
  // Application Statistics
  totalApplications: number
  pendingApplications: number
  reviewedApplications: number
  shortlistedApplications: number
  interviewApplications: number
  acceptedApplications: number
  rejectedApplications: number
  applicationsByStatus: Array<{ status: string; count: number }>
  
  // Engagement Metrics
  totalViews: number
  averageViewsPerJob: number
  averageApplicationsPerJob: number
  conversionRate: number
  
  // Monthly Trends
  monthlyData: Array<{
    month: string
    users: number
    jobs: number
    applications: number
  }>
  
  // Top Performers
  topIndustries: Array<{ name: string; count: number }>
  topEmployers: Array<{ name: string; jobCount: number; views: number }>
  topSkills: Array<{ skill: string; count: number }>
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/analytics?period=${period}`)
      setData(response.data.data)
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

  const handleExport = async (format: string) => {
    try {
      const response = await api.get(`/admin/analytics/export?format=${format}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics_report_${new Date().toISOString()}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: "Success",
        description: `Report exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('Error exporting analytics:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export report",
      })
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      change: `+${data.newUsersThisMonth} this month`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: `${data.userGrowth > 0 ? '+' : ''}${data.userGrowth}%`
    },
    {
      title: 'Total Jobs',
      value: data.totalJobs.toLocaleString(),
      icon: Briefcase,
      change: `${data.activeJobs} active / ${data.closedJobs} closed`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: `${data.jobGrowth > 0 ? '+' : ''}${data.jobGrowth}%`
    },
    {
      title: 'Applications',
      value: data.totalApplications.toLocaleString(),
      icon: FileText,
      change: `${data.pendingApplications} pending review`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: `${data.acceptedApplications} accepted`
    },
    {
      title: 'Engagement',
      value: `${data.conversionRate}%`,
      icon: Activity,
      change: `${data.averageApplicationsPerJob} avg per job`,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: `${data.totalViews.toLocaleString()} total views`
    }
  ]

  const applicationStats = [
    { label: 'Pending', count: data.pendingApplications, color: 'bg-yellow-500', percentage: (data.pendingApplications / data.totalApplications) * 100 },
    { label: 'Reviewed', count: data.reviewedApplications, color: 'bg-blue-500', percentage: (data.reviewedApplications / data.totalApplications) * 100 },
    { label: 'Shortlisted', count: data.shortlistedApplications, color: 'bg-purple-500', percentage: (data.shortlistedApplications / data.totalApplications) * 100 },
    { label: 'Interview', count: data.interviewApplications, color: 'bg-indigo-500', percentage: (data.interviewApplications / data.totalApplications) * 100 },
    { label: 'Accepted', count: data.acceptedApplications, color: 'bg-green-500', percentage: (data.acceptedApplications / data.totalApplications) * 100 },
    { label: 'Rejected', count: data.rejectedApplications, color: 'bg-red-500', percentage: (data.rejectedApplications / data.totalApplications) * 100 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Platform performance metrics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                    <Badge variant={stat.trend.startsWith('+') ? 'success' : 'default'} className="mt-1">
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs Analytics</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="users">User Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Application Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{stat.label}</span>
                      <span className="font-medium">{stat.count} ({Math.round(stat.percentage)}%)</span>
                    </div>
                    <Progress value={stat.percentage} className={`h-2 ${stat.color}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Jobs by Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Jobs by Industry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.jobsByIndustry.slice(0, 5).map((industry, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">{industry.industry}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(industry.count / data.totalJobs) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{industry.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Jobs by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Jobs by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.jobsByType.map((type, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">{type.type}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(type.count / data.totalJobs) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{type.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Employers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Employers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topEmployers.slice(0, 5).map((employer, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{employer.name}</p>
                      <p className="text-sm text-gray-500">{employer.jobCount} jobs • {employer.views.toLocaleString()} views</p>
                    </div>
                    <Badge variant="secondary">#{i + 1}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                In-Demand Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.topSkills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1.5">
                    {skill.skill} ({skill.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Analytics Tab */}
        <TabsContent value="jobs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Views to Applications</span>
                    <span>{data.conversionRate}%</span>
                  </div>
                  <Progress value={data.conversionRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Applications per Job</span>
                    <span>{data.averageApplicationsPerJob}</span>
                  </div>
                  <Progress value={(data.averageApplicationsPerJob / 50) * 100} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{data.totalViews.toLocaleString()}</p>
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
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{data.totalApplications.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Applications</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.acceptedApplications}</p>
                <p className="text-xs text-gray-500">Accepted</p>
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-red-600">{data.rejectedApplications}</p>
                <p className="text-xs text-gray-500">Rejected</p>
                <XCircle className="h-4 w-4 text-red-500 mx-auto mt-1" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationStats.map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stat.color}`} />
                        {stat.label}
                      </span>
                      <span className="font-medium">{stat.count}</span>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Insights Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.totalJobSeekers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Job Seekers</p>
                <UserCheck className="h-4 w-4 text-blue-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{data.totalEmployers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Employers</p>
                <Building2 className="h-4 w-4 text-purple-500 mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{data.totalAdmins}</p>
                <p className="text-xs text-gray-500">Admins</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.userGrowth}%</p>
                <p className="text-xs text-gray-500">User Growth</p>
                <TrendingUp className="h-4 w-4 text-green-500 mx-auto mt-1" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Active Users</span>
                    <span>{((data.activeUsers / data.totalUsers) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(data.activeUsers / data.totalUsers) * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{data.activeUsers.toLocaleString()} out of {data.totalUsers.toLocaleString()} users active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics