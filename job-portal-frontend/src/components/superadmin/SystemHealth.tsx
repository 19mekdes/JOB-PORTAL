/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react'
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  RefreshCw} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/common/LoadingSpinner'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer} from 'recharts'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    model: string
    history: Array<{ time: string; value: number }>
  }
  memory: {
    total: number
    used: number
    free: number
    usage: number
    history: Array<{ time: string; value: number }>
  }
  disk: {
    total: number
    used: number
    free: number
    usage: number
    history: Array<{ time: string; value: number }>
  }
  network: {
    requests_per_second: number
    active_connections: number
    history: Array<{ time: string; requests: number; connections: number }>
  }
  database: {
    connections: number
    query_per_second: number
    size: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    history: Array<{ time: string; value: number }>
  }
  services: Array<{
    name: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
    version: string
  }>
  uptime: number
  last_check: string
}

const SystemHealth: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('cpu')

  useEffect(() => {
    fetchSystemHealth()
    let interval: number
    if (autoRefresh) {
      interval = setInterval(fetchSystemHealth, 30000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchSystemHealth = async () => {
    try {
      const response = await api.get('/super-admin/system-health')
      setMetrics(response.data.data)
    } catch (error) {
      console.error('Error fetching system health:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load system health metrics",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Healthy</Badge>
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage < 70) return 'text-green-600'
    if (usage < 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const renderMetricChart = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = []
    let dataKey = ''
    let color = ''
    let unit = ''

    switch (selectedMetric) {
      case 'cpu':
        data = metrics.cpu.history
        dataKey = 'value'
        color = '#8884d8'
        unit = '%'
        break
      case 'memory':
        data = metrics.memory.history
        dataKey = 'value'
        color = '#82ca9d'
        unit = '%'
        break
      case 'disk':
        data = metrics.disk.history
        dataKey = 'value'
        color = '#ffc658'
        unit = '%'
        break
      case 'database':
        data = metrics.database.history
        dataKey = 'value'
        color = '#ff8042'
        unit = ' QPS'
        break
      default:
        return null
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis unit={unit} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8" />
            System Health
          </h1>
          <p className="text-gray-500 mt-1">Monitor system performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Auto-refresh</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-md text-sm ${
                autoRefresh ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
          <Button variant="outline" onClick={fetchSystemHealth}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">System Status</p>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor('healthy')} bg-current`} />
                  <span className="text-lg font-semibold">Operational</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="text-lg font-semibold">{formatUptime(metrics.uptime)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Check</p>
              <p className="text-sm">{new Date(metrics.last_check).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              <span className={`text-sm font-semibold ${getUsageColor(metrics.cpu.usage)}`}>
                {metrics.cpu.usage}%
              </span>
            </div>
            <p className="text-sm font-medium">CPU Usage</p>
            <Progress value={metrics.cpu.usage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">{metrics.cpu.cores} cores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="h-5 w-5 text-green-500" />
              <span className={`text-sm font-semibold ${getUsageColor(metrics.memory.usage)}`}>
                {metrics.memory.usage}%
              </span>
            </div>
            <p className="text-sm font-medium">Memory Usage</p>
            <Progress value={metrics.memory.usage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="h-5 w-5 text-yellow-500" />
              <span className={`text-sm font-semibold ${getUsageColor(metrics.disk.usage)}`}>
                {metrics.disk.usage}%
              </span>
            </div>
            <p className="text-sm font-medium">Disk Usage</p>
            <Progress value={metrics.disk.usage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              {formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Wifi className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-semibold">
                {metrics.network.requests_per_second} req/s
              </span>
            </div>
            <p className="text-sm font-medium">Network Activity</p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.network.active_connections} active connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Resource Metrics</CardTitle>
              <CardDescription>Historical usage trends</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedMetric === 'cpu' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('cpu')}
              >
                CPU
              </Button>
              <Button
                size="sm"
                variant={selectedMetric === 'memory' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('memory')}
              >
                Memory
              </Button>
              <Button
                size="sm"
                variant={selectedMetric === 'disk' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('disk')}
              >
                Disk
              </Button>
              <Button
                size="sm"
                variant={selectedMetric === 'database' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('database')}
              >
                Database
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderMetricChart()}
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Services Status</CardTitle>
          <CardDescription>Health status of core services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-gray-500">v{service.version}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(service.status)}
                  <p className="text-xs text-gray-500 mt-1">{formatUptime(service.uptime)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Database performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Database className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Connections</p>
              <p className="text-xl font-bold">{metrics.database.connections}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Activity className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500">Queries/sec</p>
              <p className="text-xl font-bold">{metrics.database.query_per_second}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <HardDrive className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <p className="text-sm text-gray-500">Database Size</p>
              <p className="text-xl font-bold">{metrics.database.size}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {(metrics.cpu.usage > 85 || metrics.memory.usage > 85 || metrics.disk.usage > 85) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Resource Warning</p>
                <p className="text-sm text-yellow-700">
                  {metrics.cpu.usage > 85 && `CPU usage is at ${metrics.cpu.usage}%. `}
                  {metrics.memory.usage > 85 && `Memory usage is at ${metrics.memory.usage}%. `}
                  {metrics.disk.usage > 85 && `Disk usage is at ${metrics.disk.usage}%. `}
                  Consider scaling up resources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SystemHealth