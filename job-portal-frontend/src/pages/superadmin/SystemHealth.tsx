/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Users,
  Briefcase,
  TrendingUp,
  Zap
} from 'lucide-react'

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  database_size: string
  active_sessions: number
  pending_jobs: number
  cache_hit_rate: number
  api_response_time: number
  error_rate: number
  daily_active_users: number
  weekly_job_posts: number
}

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchSystemHealth()
    
    let interval: number
    if (autoRefresh) {
      interval = setInterval(fetchSystemHealth, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchSystemHealth = async () => {
    try {
      // In a real app, fetch from API
      // const response = await api.get('/super-admin/system-health')
      // setHealth(response.data.data)
      
      // Mock data for demonstration
      setTimeout(() => {
        setHealth({
          status: 'healthy',
          uptime: 864000 + Math.random() * 100000,
          cpu_usage: 35 + Math.random() * 20,
          memory_usage: 45 + Math.random() * 15,
          disk_usage: 62 + Math.random() * 10,
          database_size: '2.4 GB',
          active_sessions: 234 + Math.floor(Math.random() * 100),
          pending_jobs: 12 + Math.floor(Math.random() * 20),
          cache_hit_rate: 85 + Math.random() * 10,
          api_response_time: 120 + Math.random() * 80,
          error_rate: 0.5 + Math.random() * 1,
          daily_active_users: 1250 + Math.floor(Math.random() * 500),
          weekly_job_posts: 450 + Math.floor(Math.random() * 150)
        })
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error fetching system health:', error)
      setLoading(false)
    }
  }



  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500'
    if (value < 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.join(' ') || '< 1m'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading system health data...</p>
        </div>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load system health data</p>
        <Button onClick={fetchSystemHealth} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor system performance and health metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" onClick={fetchSystemHealth}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-linear-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-100 text-sm">System Status</p>
                <p className="text-2xl font-bold mt-1 capitalize">{health.status}</p>
              </div>
              {health.status === 'healthy' && <CheckCircle className="h-10 w-10 text-green-200" />}
              {health.status === 'degraded' && <AlertCircle className="h-10 w-10 text-yellow-200" />}
              {health.status === 'unhealthy' && <XCircle className="h-10 w-10 text-red-200" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-xl font-bold">{formatUptime(health.uptime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Database Size</p>
                <p className="text-xl font-bold">{health.database_size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">API Response</p>
                <p className="text-xl font-bold">{Math.round(health.api_response_time)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium">{Math.round(health.cpu_usage)}%</span>
              </div>
              <Progress value={health.cpu_usage} className={`h-2 ${getProgressColor(health.cpu_usage)}`} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium">{Math.round(health.memory_usage)}%</span>
              </div>
              <Progress value={health.memory_usage} className={`h-2 ${getProgressColor(health.memory_usage)}`} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Disk Usage</span>
                <span className="font-medium">{Math.round(health.disk_usage)}%</span>
              </div>
              <Progress value={health.disk_usage} className={`h-2 ${getProgressColor(health.disk_usage)}`} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Cache Hit Rate</span>
                <span className="font-medium">{Math.round(health.cache_hit_rate)}%</span>
              </div>
              <Progress value={health.cache_hit_rate} className="h-2 bg-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Active Sessions</p>
                <p className="text-2xl font-bold">{health.active_sessions}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Pending Jobs</p>
                <p className="text-2xl font-bold">{health.pending_jobs}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Error Rate</p>
                <p className="text-2xl font-bold">{health.error_rate.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{Math.round(health.cache_hit_rate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-500">Daily Active Users</p>
                <p className="text-2xl font-bold text-blue-600">{health.daily_active_users}</p>
                <TrendingUp className="h-4 w-4 text-green-500 mx-auto mt-2" />
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-500">Weekly Job Posts</p>
                <p className="text-2xl font-bold text-green-600">{health.weekly_job_posts}</p>
                <Briefcase className="h-4 w-4 text-gray-400 mx-auto mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.cpu_usage > 80 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">High CPU Usage</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Consider scaling up resources</p>
                  </div>
                </div>
              )}
              {health.memory_usage > 80 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">High Memory Usage</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Optimize memory usage or increase RAM</p>
                  </div>
                </div>
              )}
              {health.error_rate > 2 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">High Error Rate</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Check application logs for errors</p>
                  </div>
                </div>
              )}
              {health.cache_hit_rate < 70 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Low Cache Hit Rate</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Review caching strategy</p>
                  </div>
                </div>
              )}
              {health.cpu_usage < 70 && health.memory_usage < 70 && health.error_rate < 2 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">System Running Smoothly</p>
                    <p className="text-sm text-green-700 dark:text-green-300">All metrics are within normal range</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
              { name: 'Database', status: 'operational', uptime: '99.95%' },
              { name: 'Cache Service', status: 'operational', uptime: '100%' },
              { name: 'File Storage', status: 'operational', uptime: '99.9%' },
            ].map((service, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{service.name}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemHealth