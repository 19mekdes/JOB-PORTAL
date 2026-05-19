/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Briefcase,
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  Mail
} from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface ApplicationStats {
  total: number
  byStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  byMonth: Array<{
    month: string
    count: number
    applications: number
    interviews: number
    offers: number
  }>
  byIndustry: Array<{
    industry: string
    count: number
  }>
  byJobType: Array<{
    type: string
    count: number
  }>
  responseRate: number
  interviewRate: number
  offerRate: number
  averageResponseTime: number
  recentActivity: Array<{
    id: string
    job_title: string
    company: string
    status: string
    date: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4']

const ApplicationTracker: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6m')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')

  useEffect(() => {
    fetchApplicationStats()
  }, [timeRange])

  const fetchApplicationStats = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/applications/my-stats?range=${timeRange}`)
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching application stats:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load application statistics",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/applications/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `applications_export_${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        variant: "success",
        title: "Export Complete",
        description: "Your applications have been exported successfully",
      })
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export your applications",
      })
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600'
    if (rate >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderTrendChart = () => {
    const data = stats?.byMonth || []
    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : AreaChart
    const DataComponent = chartType === 'line' ? Line : chartType === 'bar' ? Bar : Area

    return (
      <ResponsiveContainer width="100%" height={350}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
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
            dataKey="interviews" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
            name="Interviews"
          />
          <DataComponent 
            type="monotone" 
            dataKey="offers" 
            stroke="#ffc658" 
            fill="#ffc658" 
            name="Offers"
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
          <p className="mt-2 text-gray-500">Loading your application stats...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-gray-500">Start applying to jobs to see your statistics</p>
        <Button className="mt-4" onClick={() => navigate('/jobs')}>
          Browse Jobs
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
          <p className="text-gray-500 mt-1">Monitor your job search performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchApplicationStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Response Rate</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(stats.responseRate)}`}>
                  {stats.responseRate}%
                </p>
              </div>
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={stats.responseRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interview Rate</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(stats.interviewRate)}`}>
                  {stats.interviewRate}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={stats.interviewRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offer Rate</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(stats.offerRate)}`}>
                  {stats.offerRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={stats.offerRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.byStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.byStatus.map((status, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{status.status}</span>
                  <span className="font-medium">{status.count} ({status.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Industries you're targeting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byIndustry.slice(0, 5).map((industry, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{industry.industry}</span>
                    <span>{industry.count} applications</span>
                  </div>
                  <Progress value={(industry.count / stats.total) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Monthly application activity</CardDescription>
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

      {/* Job Type Distribution & Response Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Types</CardTitle>
            <CardDescription>Applications by job type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byJobType.map((type, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{type.type}</span>
                    <span>{type.count} applications</span>
                  </div>
                  <Progress value={(type.count / stats.total) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key metrics analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700">Success Rate</span>
              </div>
              <p className="text-sm text-green-700">
                Your application-to-interview rate is {stats.interviewRate}%. 
                {stats.interviewRate > 20 
                  ? " Great job! Keep up the momentum."
                  : " Consider tailoring your applications more to increase response rates."}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-700">Average Response Time</span>
              </div>
              <p className="text-sm text-blue-700">
                Average response time: {stats.averageResponseTime} days
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {stats.interviewRate < 15 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>Try customizing your resume for each application</span>
                  </li>
                )}
                {stats.offerRate < 10 && stats.interviewRate > 0 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>Practice interview skills to convert more interviews to offers</span>
                  </li>
                )}
                {stats.byIndustry.length > 0 && stats.byIndustry[0].count > stats.total / 2 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Consider diversifying industries to increase opportunities</span>
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest application updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{activity.job_title}</p>
                  <p className="text-sm text-gray-500">{activity.company}</p>
                </div>
                <div className="text-right">
                  <Badge variant={
                    activity.status === 'Accepted' ? 'success' :
                    activity.status === 'Rejected' ? 'destructive' :
                    activity.status === 'Interview' ? 'default' : 'secondary'
                  }>
                    {activity.status}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {stats.recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ApplicationTracker