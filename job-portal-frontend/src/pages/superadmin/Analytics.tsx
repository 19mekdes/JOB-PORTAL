/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  Users, Briefcase, FileText, TrendingUp, Building,
  Download, RefreshCw, Eye, CheckCircle, Clock,
  UserPlus, Award, Activity, AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface AnalyticsData {
  // User Statistics
  totalUsers: number
  totalJobSeekers: number
  totalEmployers: number
  totalAdmins: number
  activeUsers: number
  newUsersThisMonth: number
  userGrowth: number
  
  // Job Statistics
  totalJobs: number
  activeJobs: number
  closedJobs: number
  pendingJobs: number
  newJobsThisMonth: number
  jobGrowth: number
  averageViewsPerJob: number
  averageApplicationsPerJob: number
  conversionRate: number
  
  // Application Statistics
  totalApplications: number
  pendingApplications: number
  reviewedApplications: number
  shortlistedApplications: number
  interviewApplications: number
  acceptedApplications: number
  rejectedApplications: number
  
  // Views
  totalViews: number
  
  // Monthly Trends
  jobsByMonth: Array<{ month: string; jobs: number }>
  applicationsByMonth: Array<{ month: string; applications: number }>
  
  // Distribution
  applicationsByStatus: Array<{ status: string; count: number }>
  jobsByIndustry: Array<{ name: string; count: number }>
  
  // Top Lists
  topSkills: Array<{ skill: string; count: number }>
  topEmployers: Array<{ name: string; jobCount: number; views: number }>
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<AnalyticsData | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fixed endpoint URL - matching your backend
      const response = await api.get('/super-admin/analytics')
      console.log('Analytics response:', response.data)
      
      if (response.data?.success && response.data?.data) {
        const apiData = response.data.data
        
        // Map the backend data to our frontend structure
        setData({
          // User Statistics
          totalUsers: apiData.totalUsers || 0,
          totalJobSeekers: apiData.totalJobSeekers || 0,
          totalEmployers: apiData.totalEmployers || 0,
          totalAdmins: apiData.totalAdmins || 0,
          activeUsers: apiData.activeUsers || apiData.totalUsers || 0,
          newUsersThisMonth: apiData.newUsersThisMonth || 0,
          userGrowth: apiData.userGrowth || 0,
          
          // Job Statistics
          totalJobs: apiData.totalJobs || 0,
          activeJobs: apiData.activeJobs || 0,
          closedJobs: apiData.closedJobs || 0,
          pendingJobs: apiData.pendingJobs || 0,
          newJobsThisMonth: apiData.newJobsThisMonth || 0,
          jobGrowth: apiData.jobGrowth || 0,
          averageViewsPerJob: apiData.averageViewsPerJob || 0,
          averageApplicationsPerJob: apiData.averageApplicationsPerJob || 0,
          conversionRate: apiData.conversionRate || 0,
          
          // Application Statistics
          totalApplications: apiData.totalApplications || 0,
          pendingApplications: apiData.pendingApplications || 0,
          reviewedApplications: apiData.reviewedApplications || 0,
          shortlistedApplications: apiData.shortlistedApplications || 0,
          interviewApplications: apiData.interviewApplications || 0,
          acceptedApplications: apiData.acceptedApplications || 0,
          rejectedApplications: apiData.rejectedApplications || 0,
          
          // Views
          totalViews: apiData.totalViews || 0,
          
          // Monthly Trends - backend has separate arrays
          jobsByMonth: apiData.jobsByMonth || [],
          applicationsByMonth: apiData.applicationsByMonth || [],
          
          // Distribution
          applicationsByStatus: (apiData.applicationsByStatus || []).map((status: any) => ({
            status: status.status,
            count: status.count || 0
          })),
          jobsByIndustry: (apiData.jobsByIndustry || []).map((item: any) => ({
            name: item.name,
            count: item.count || 0
          })),
          
          // Top Lists
          topSkills: (apiData.topSkills || []).map((skill: any) => ({
            skill: skill.skill,
            count: skill.count || 0
          })),
          topEmployers: (apiData.topEmployers || []).map((emp: any) => ({
            name: emp.name || 'Unknown',
            jobCount: emp.jobCount || 0,
            views: emp.views || 0
          }))
        })
      } else {
        setData(getDefaultData())
        if (response.data?.message) {
          setError(response.data.message)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err)
      setError(err.message || 'Failed to load analytics data')
      setData(getDefaultData())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const getDefaultData = (): AnalyticsData => ({
    totalUsers: 0,
    totalJobSeekers: 0,
    totalEmployers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    userGrowth: 0,
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    pendingJobs: 0,
    newJobsThisMonth: 0,
    jobGrowth: 0,
    averageViewsPerJob: 0,
    averageApplicationsPerJob: 0,
    totalApplications: 0,
    pendingApplications: 0,
    reviewedApplications: 0,
    shortlistedApplications: 0,
    interviewApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    conversionRate: 0,
    totalViews: 0,
    jobsByMonth: [],
    applicationsByMonth: [],
    applicationsByStatus: [],
    jobsByIndustry: [],
    topSkills: [],
    topEmployers: []
  })

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const handleExport = () => {
    if (!data) return
    const exportData = {
      generatedAt: new Date().toISOString(),
      ...data
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export Complete", description: "Analytics data has been exported" })
  }

  // Prepare combined monthly data for line chart
  const getMonthlyTrendData = () => {
    if (!data?.jobsByMonth) return []
    return data.jobsByMonth.map((item, index) => ({
      month: item.month,
      jobs: item.jobs,
      applications: data.applicationsByMonth[index]?.applications || 0
    }))
  }

  // Calculate max skill count safely
  const maxSkillCount = data?.topSkills && data.topSkills.length > 0 
    ? Math.max(...data.topSkills.map(s => s.count)) 
    : 1

  // Prepare application status data for pie chart
  const applicationStatusData = data?.applicationsByStatus || []

  const statusColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">No analytics data available</p>
          <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics} className="border-gray-300">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="border-gray-300">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold">{formatNumber(data.totalUsers)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className={`text-xs ${data.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.userGrowth >= 0 ? '+' : ''}{data.userGrowth}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100"><Users className="h-6 w-6 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Jobs</p>
                    <p className="text-2xl font-bold">{formatNumber(data.totalJobs)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className={`text-xs ${data.jobGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.jobGrowth >= 0 ? '+' : ''}{data.jobGrowth}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100"><Briefcase className="h-6 w-6 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Applications</p>
                    <p className="text-2xl font-bold">{formatNumber(data.totalApplications)}</p>
                    <p className="text-xs text-gray-500 mt-1">{data.averageApplicationsPerJob} per job</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100"><FileText className="h-6 w-6 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-green-600">{data.conversionRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">Applicants to hires</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100"><Award className="h-6 w-6 text-orange-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-gray-500">Job Seekers</p><p className="text-lg font-bold">{formatNumber(data.totalJobSeekers)}</p></div><Users className="h-4 w-4 text-gray-400" /></div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-gray-500">Employers</p><p className="text-lg font-bold">{formatNumber(data.totalEmployers)}</p></div><Building className="h-4 w-4 text-gray-400" /></div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-gray-500">Active Jobs</p><p className="text-lg font-bold text-green-600">{formatNumber(data.activeJobs)}</p></div><CheckCircle className="h-4 w-4 text-green-500" /></div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-gray-500">Total Views</p><p className="text-lg font-bold text-blue-600">{formatNumber(data.totalViews)}</p></div><Eye className="h-4 w-4 text-blue-500" /></div></CardContent></Card>
          </div>

          {/* Monthly Trends Line Chart */}
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader><CardTitle className="text-lg">Monthly Trends (Jobs vs Applications)</CardTitle></CardHeader>
            <CardContent>
              {getMonthlyTrendData().length === 0 ? (
                <div className="text-center py-8 text-gray-500">No monthly data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={getMonthlyTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="jobs" stroke="#3b82f6" name="Jobs" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="applications" stroke="#10b981" name="Applications" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jobs by Industry */}
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader><CardTitle className="text-lg">Jobs by Industry</CardTitle></CardHeader>
              <CardContent>
                {!data.jobsByIndustry || data.jobsByIndustry.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No industry data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.jobsByIndustry} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Jobs" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Application Status */}
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader><CardTitle className="text-lg">Application Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {applicationStatusData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No application data available</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
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
                          {applicationStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {applicationStatusData.map((status, index) => (
                        <div key={status.status} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[index % statusColors.length] }} />
                          <span className="text-xs text-gray-600">{status.status}</span>
                          <span className="text-xs font-semibold">{status.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Employers & Top Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader><CardTitle className="text-lg">Top Performing Employers</CardTitle></CardHeader>
              <CardContent>
                {!data.topEmployers || data.topEmployers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No employer data available</div>
                ) : (
                  <div className="space-y-3">
                    {data.topEmployers.slice(0, 5).map((employer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{employer.name}</p>
                          <p className="text-xs text-gray-500">{employer.jobCount} jobs • {(employer.views || 0).toLocaleString()} views</p>
                        </div>
                        <Badge variant="secondary">#{idx + 1}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader><CardTitle className="text-lg">Top Skills in Demand</CardTitle></CardHeader>
              <CardContent>
                {!data.topSkills || data.topSkills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No skill data available</div>
                ) : (
                  <div className="space-y-3">
                    {data.topSkills.slice(0, 10).map((skill, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{skill.skill}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(skill.count / maxSkillCount) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-12">{skill.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatNumber(data.totalUsers)}</p>
                  <p className="text-sm text-gray-500">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <UserPlus className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatNumber(data.newUsersThisMonth)}</p>
                  <p className="text-sm text-gray-500">New Users (This Month)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className={`text-2xl font-bold ${data.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.userGrowth >= 0 ? '+' : ''}{data.userGrowth}%
                  </p>
                  <p className="text-sm text-gray-500">Growth Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Job Seekers</p>
                  <p className="text-2xl font-bold">{formatNumber(data.totalJobSeekers)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employers</p>
                  <p className="text-2xl font-bold">{formatNumber(data.totalEmployers)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Admins</p>
                  <p className="text-2xl font-bold">{formatNumber(data.totalAdmins)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Briefcase className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatNumber(data.totalJobs)}</p>
                  <p className="text-sm text-gray-500">Total Jobs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{formatNumber(data.activeJobs)}</p>
                  <p className="text-sm text-gray-500">Active Jobs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{formatNumber(data.pendingJobs)}</p>
                  <p className="text-sm text-gray-500">Pending Jobs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatNumber(data.averageViewsPerJob)}</p>
                  <p className="text-sm text-gray-500">Avg Views/Job</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Jobs by Month Bar Chart */}
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader><CardTitle className="text-lg">Jobs Posted by Month</CardTitle></CardHeader>
            <CardContent>
              {!data.jobsByMonth || data.jobsByMonth.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No monthly job data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.jobsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="#3b82f6" name="Jobs Posted" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{formatNumber(data.totalApplications)}</p><p className="text-xs text-gray-500">Total</p></CardContent></Card>
            <Card className="border-yellow-200 bg-yellow-50"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-600">{formatNumber(data.pendingApplications)}</p><p className="text-xs text-gray-500">Pending</p></CardContent></Card>
            <Card className="border-blue-200 bg-blue-50"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{formatNumber(data.reviewedApplications)}</p><p className="text-xs text-gray-500">Reviewed</p></CardContent></Card>
            <Card className="border-purple-200 bg-purple-50"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-purple-600">{formatNumber(data.shortlistedApplications)}</p><p className="text-xs text-gray-500">Shortlisted</p></CardContent></Card>
            <Card className="border-cyan-200 bg-cyan-50"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-cyan-600">{formatNumber(data.interviewApplications)}</p><p className="text-xs text-gray-500">Interview</p></CardContent></Card>
            <Card className="border-green-200 bg-green-50"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{formatNumber(data.acceptedApplications)}</p><p className="text-xs text-gray-500">Accepted</p></CardContent></Card>
          </div>
          
          {/* Applications by Month */}
          <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
            <CardHeader><CardTitle className="text-lg">Applications by Month</CardTitle></CardHeader>
            <CardContent>
              {!data.applicationsByMonth || data.applicationsByMonth.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No monthly application data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.applicationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#10b981" name="Applications" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-600">Average <span className="font-semibold">{data.averageApplicationsPerJob}</span> applications per job</p>
                <p className="text-gray-600 mt-1"><span className="font-semibold text-green-600">{data.conversionRate}%</span> conversion rate (applications to accepted)</p>
                <p className="text-gray-500 text-sm mt-2">Total Views: {formatNumber(data.totalViews)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics