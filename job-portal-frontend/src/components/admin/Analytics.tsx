/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  FileText, 
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  PieChart,
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
import api from '../../services/api'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalEmployers: number
    totalJobSeekers: number
    totalJobs: number
    totalApplications: number
    totalViews: number
    growthRate: {
      users: number
      jobs: number
      applications: number
    }
  }
  trends: {
    daily: Array<{ date: string; users: number; jobs: number; applications: number; views: number }>
    weekly: Array<{ week: string; users: number; jobs: number; applications: number }>
    monthly: Array<{ month: string; users: number; jobs: number; applications: number }>
  }
  topCategories: {
    industries: Array<{ name: string; count: number; percentage: number }>
    jobTypes: Array<{ name: string; count: number; percentage: number }>
    locations: Array<{ name: string; count: number; percentage: number }>
  }
  engagement: {
    averageApplicationsPerJob: number
    averageViewsPerJob: number
    applicationConversionRate: number
    activeUsersPercentage: number
    retentionRate: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4']

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')
  const [selectedMetric, setSelectedMetric] = useState('applications')

  useEffect(() => {
    fetchAnalyticsData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/admin/analytics?range=${timeRange}`)
      setData(response.data.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await api.get(`/admin/analytics/export?format=${format}&range=${timeRange}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics_${timeRange}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting analytics:', error)
    }
  }

  const overviewCards = [
    {
      title: 'Total Users',
      value: data?.overview.totalUsers?.toLocaleString() || '0',
      icon: Users,
      trend: data?.overview.growthRate.users || 0,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Jobs',
      value: data?.overview.totalJobs?.toLocaleString() || '0',
      icon: Briefcase,
      trend: data?.overview.growthRate.jobs || 0,
      color: 'bg-green-500'
    },
    {
      title: 'Applications',
      value: data?.overview.totalApplications?.toLocaleString() || '0',
      icon: FileText,
      trend: data?.overview.growthRate.applications || 0,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Views',
      value: data?.overview.totalViews?.toLocaleString() || '0',
      icon: Eye,
      trend: 0,
      color: 'bg-orange-500'
    }
  ]

  const engagementMetrics = [
    {
      label: 'Avg Applications/Job',
      value: data?.engagement.averageApplicationsPerJob?.toFixed(1) || '0',
      suffix: ' per job',
      icon: FileText
    },
    {
      label: 'Avg Views/Job',
      value: data?.engagement.averageViewsPerJob?.toFixed(0) || '0',
      suffix: ' views',
      icon: Eye
    },
    {
      label: 'Conversion Rate',
      value: data?.engagement.applicationConversionRate?.toFixed(1) || '0',
      suffix: '%',
      icon: TrendingUp
    },
    {
      label: 'Active Users',
      value: data?.engagement.activeUsersPercentage?.toFixed(1) || '0',
      suffix: '%',
      icon: Activity
    }
  ]

  const renderTrendChart = () => {
    const trendData = data?.trends.daily || []
    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : AreaChart
    const DataComponent = chartType === 'line' ? Line : chartType === 'bar' ? Bar : Area

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedMetric === 'applications' && (
            <DataComponent type="monotone" dataKey="applications" stroke="#8884d8" fill="#8884d8" />
          )}
          {selectedMetric === 'jobs' && (
            <DataComponent type="monotone" dataKey="jobs" stroke="#82ca9d" fill="#82ca9d" />
          )}
          {selectedMetric === 'users' && (
            <DataComponent type="monotone" dataKey="users" stroke="#ffc658" fill="#ffc658" />
          )}
          {selectedMetric === 'views' && (
            <DataComponent type="monotone" dataKey="views" stroke="#ff8042" fill="#ff8042" />
          )}
          {selectedMetric === 'all' && (
            <>
              <DataComponent type="monotone" dataKey="applications" stroke="#8884d8" fill="#8884d8" />
              <DataComponent type="monotone" dataKey="jobs" stroke="#82ca9d" fill="#82ca9d" />
              <DataComponent type="monotone" dataKey="users" stroke="#ffc658" fill="#ffc658" />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Track platform performance and user engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Select range" />
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
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.trend !== 0 && (
                  <div className={`flex items-center text-xs mt-1 ${card.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(card.trend)}% from last period
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {engagementMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{metric.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {metric.value}
                      <span className="text-sm font-normal text-gray-500">{metric.suffix}</span>
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Charts */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Platform Trends</CardTitle>
              <CardDescription>Daily activity and growth metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 px-3 text-sm ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <LineChartIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 px-3 text-sm ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`p-2 px-3 text-sm ${chartType === 'area' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Activity className="h-4 w-4" />
                </button>
              </div>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="all">All Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderTrendChart()}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Industries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Most popular job industries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.topCategories.industries || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(data?.topCategories.industries || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {(data?.topCategories.industries || []).slice(0, 5).map((industry, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span>{industry.name}</span>
                  <span className="font-medium">{industry.count} jobs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Types */}
        <Card>
          <CardHeader>
            <CardTitle>Job Types</CardTitle>
            <CardDescription>Distribution by employment type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.topCategories.jobTypes || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(data?.topCategories.jobTypes || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {(data?.topCategories.jobTypes || []).map((type, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span>{type.name}</span>
                  <span className="font-medium">{type.count} jobs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Most popular job locations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.topCategories.locations || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {(data?.topCategories.locations || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Retention Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>User Retention</CardTitle>
          <CardDescription>User retention and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {data?.engagement.activeUsersPercentage?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-2">Active Users</p>
              <p className="text-xs text-gray-400">Users active in last 30 days</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data?.engagement.retentionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-2">Retention Rate</p>
              <p className="text-xs text-gray-400">Users returning after 30 days</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {data?.engagement.applicationConversionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-2">Conversion Rate</p>
              <p className="text-xs text-gray-400">Views to applications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics