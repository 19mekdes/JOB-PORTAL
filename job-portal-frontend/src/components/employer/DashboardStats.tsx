/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  RefreshCw,
  ArrowUpRight,
  Download} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface DashboardData {
  stats: {
    totalJobs: number
    activeJobs: number
    totalApplications: number
    totalViews: number
    newApplications: number
    newViews: number
    interviewRate: number
    acceptanceRate: number
  }
  trends: {
    daily: Array<{ date: string; applications: number; views: number }>
    weekly: Array<{ week: string; applications: number; views: number }>
    monthly: Array<{ month: string; applications: number; views: number }>
  }
  recentApplications: Array<{
    id: string
    job_title: string
    applicant_name: string
    applied_at: string
    status: string
    avatar?: string
  }>
  topJobs: Array<{
    id: string
    title: string
    applications: number
    views: number
    status: string
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const DashboardStats: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/employer/dashboard/stats?range=${timeRange}`)
      setData(response.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard statistics",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/employer/dashboard/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dashboard_export_${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        variant: "success",
        title: "Export Complete",
        description: "Dashboard data exported successfully",
      })
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export dashboard data",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500'
      case 'Reviewed': return 'bg-blue-500'
      case 'Shortlisted': return 'bg-green-500'
      case 'Interview': return 'bg-purple-500'
      case 'Accepted': return 'bg-green-600'
      case 'Rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Reviewed: 'bg-blue-100 text-blue-800',
      Shortlisted: 'bg-green-100 text-green-800',
      Interview: 'bg-purple-100 text-purple-800',
      Accepted: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const renderTrendChart = () => {
    const trendData = data?.trends[timeRange === 'week' ? 'daily' : timeRange === 'month' ? 'weekly' : 'monthly'] || []
    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : AreaChart
    const DataComponent = chartType === 'line' ? Line : chartType === 'bar' ? Bar : Area

    return (
      <ResponsiveContainer width="100%" height={350}>
        <ChartComponent data={trendData as Array<{ date: string; applications: number; views: number }>}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={timeRange === 'week' ? 'date' : timeRange === 'month' ? 'week' : 'month'} />
          <YAxis />
          <Tooltip />
          <Legend />
          <DataComponent 
            type="monotone" 
            dataKey="applications" 
            stroke="#8884d8" 
            fill="#8884d8" 
            name="Applications"
          />
          <DataComponent 
            type="monotone" 
            dataKey="views" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
            name="Views"
          />
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-gray-500">Start posting jobs to see your dashboard statistics</p>
        <Button className="mt-4" onClick={() => navigate('/employer/post-job')}>
          Post a Job
        </Button>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Active Jobs',
      value: data.stats.activeJobs,
      total: data.stats.totalJobs,
      icon: Briefcase,
      trend: '+12%',
      trendUp: true,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Applications',
      value: data.stats.totalApplications,
      newValue: data.stats.newApplications,
      icon: Users,
      trend: '+8%',
      trendUp: true,
      color: 'bg-green-500'
    },
    {
      title: 'Total Views',
      value: data.stats.totalViews,
      newValue: data.stats.newViews,
      icon: Eye,
      trend: '+15%',
      trendUp: true,
      color: 'bg-purple-500'
    },
    {
      title: 'Interview Rate',
      value: `${data.stats.interviewRate}%`,
      icon: Calendar,
      trend: '+5%',
      trendUp: true,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your recruitment performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32.5">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    {stat.total !== undefined && (
                      <p className="text-xs text-gray-500">out of {stat.total} total</p>
                    )}
                    {stat.newValue !== undefined && (
                      <p className="text-xs text-green-600 mt-1">+{stat.newValue} new</p>
                    )}
                    {stat.trend && (
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trendUp ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.trend}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Applications and views over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 px-3 text-sm ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 px-3 text-sm ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`p-2 px-3 text-sm ${chartType === 'area' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  Area
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderTrendChart()}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Distribution of application statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.statusDistribution.map((status, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{status.status}</span>
                  <div className="flex items-center gap-4">
                    <Progress value={status.percentage} className="w-24 h-2" />
                    <span className="font-medium">{status.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Jobs</CardTitle>
            <CardDescription>Jobs with most applications and views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topJobs.map((job, idx) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                      <p className="font-medium">{job.title}</p>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>📊 {job.views} views</span>
                      <span>📝 {job.applications} applications</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              ))}
              {data.topJobs.length === 0 && (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No jobs posted yet</p>
                  <Button variant="link" onClick={() => navigate('/employer/post-job')}>
                    Post your first job
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest applicants for your jobs</CardDescription>
            </div>
            <Button variant="link" onClick={() => navigate('/employer/applications')}>
              View all
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No applications received yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/employer/applications/${application.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {application.applicant_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{application.applicant_name}</p>
                      <p className="text-sm text-gray-500">{application.job_title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadge(application.status)}>
                      {application.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(application.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-linear-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-semibold text-lg">Ready to hire?</h3>
              <p className="text-sm text-gray-600">Post a new job and start receiving applications</p>
            </div>
            <Button onClick={() => navigate('/employer/post-job')}>
              <Briefcase className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardStats