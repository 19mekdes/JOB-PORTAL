/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/superadmin/SystemHealth.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, Database, Server, HardDrive, AlertTriangle, 
  CheckCircle, XCircle, Clock, RefreshCw, Cpu, MemoryStick,
  Globe, Mail, Cloud, Users, Briefcase, FileText
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import api from '@/services/api'

interface SystemHealthData {
  status: string
  timestamp: string
  components: {
    database: { status: string; latency_ms: number; error: string | null }
    api: { status: string; latency_ms: number; error: string | null }
    storage: { 
      status: string; 
      used_bytes: number; 
      used_formatted: string;
      total_bytes: number;
      total_formatted: string;
      usage_percent: number;
      error: string | null 
    }
  }
  server: {
    uptime_seconds: number
    uptime_formatted: string
    memory_usage_mb: number
    memory_heap_used_mb: number
    memory_heap_total_mb: number
    cpu_usage_percent: number
    node_version: string
    platform: string
  }
  statistics: {
    total_users: number
    active_users: number
    total_jobs: number
    active_jobs: number
    total_applications: number
    recent_users_7d: number
    recent_jobs_7d: number
    recent_applications_7d: number
  }
  performance: {
    average_response_time_ms: number
    error_rate_percent: number
    dependencies: Array<{ name: string; status: string; latency: number; error: string | null }>
  }
  alerts: Array<{ level: string; message: string; timestamp: string }>
  services: {
    database: boolean
    api: boolean
    storage: boolean
    email: boolean
    cdn: boolean
  }
}

const SystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/system-health')
      console.log('Health data:', response.data)
      
      if (response.data?.success && response.data?.data) {
        setHealthData(response.data.data)
        setError(null)
      } else {
        setError('Failed to load health data')
      }
    } catch (err: any) {
      console.error('Failed to fetch health data:', err)
      setError(err.message || 'Failed to load system health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealthData()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchHealthData, autoRefresh])

  const getStatusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle className="h-5 w-5 text-green-500" />
    if (status === 'degraded') return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    if (status === 'critical') return <XCircle className="h-5 w-5 text-red-500" />
    return <Activity className="h-5 w-5 text-gray-500" />
  }

  const getStatusBadge = (status: string) => {
    if (status === 'healthy') return <Badge className="bg-green-100 text-green-700">Healthy</Badge>
    if (status === 'degraded') return <Badge className="bg-yellow-100 text-yellow-700">Degraded</Badge>
    if (status === 'critical') return <Badge className="bg-red-100 text-red-700">Critical</Badge>
    return <Badge className="bg-gray-100 text-gray-700">Unknown</Badge>
  }

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system health data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 mt-1">Monitor system performance and health metrics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-blue-600" : ""}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" onClick={fetchHealthData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {healthData && (
        <Card className={`border-2 ${
          healthData.status === 'healthy' ? 'border-green-200 bg-green-50' :
          healthData.status === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.status)}
                <div>
                  <h2 className="text-xl font-bold capitalize">{healthData.status}</h2>
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(healthData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="font-mono font-semibold">{healthData.server.uptime_formatted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Alerts */}
      {healthData?.alerts && healthData.alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({healthData.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-100">
                  {alert.level === 'critical' ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Components Health */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                {getStatusBadge(healthData.components.database.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Latency</span>
                <span className="font-mono">{healthData.components.database.latency_ms}ms</span>
              </div>
              {healthData.components.database.error && (
                <div className="text-red-600 text-sm">{healthData.components.database.error}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-purple-500" />
                API Server
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                {getStatusBadge(healthData.components.api.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="font-mono">{healthData.performance.average_response_time_ms}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-mono">{healthData.performance.error_rate_percent}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-500" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                {getStatusBadge(healthData.components.storage.status)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span>{healthData.components.storage.used_formatted} / {healthData.components.storage.total_formatted}</span>
                </div>
                <Progress value={healthData.components.storage.usage_percent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Server Resources */}
      {healthData && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Server Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm">CPU Usage</span>
                </div>
                <p className="text-2xl font-bold">{healthData.server.cpu_usage_percent}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MemoryStick className="h-4 w-4" />
                  <span className="text-sm">Memory Usage</span>
                </div>
                <p className="text-2xl font-bold">{healthData.server.memory_usage_mb} MB</p>
                <p className="text-xs text-gray-500">Heap: {healthData.server.memory_heap_used_mb} / {healthData.server.memory_heap_total_mb} MB</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Server className="h-4 w-4" />
                  <span className="text-sm">Platform</span>
                </div>
                <p className="font-mono text-sm">{healthData.server.platform}</p>
                <p className="text-xs text-gray-500">Node: {healthData.server.node_version}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Uptime</span>
                </div>
                <p className="font-mono text-sm">{healthData.server.uptime_formatted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Statistics */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold">{healthData.statistics.total_users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-green-600">{healthData.statistics.active_users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New (7d)</span>
                <span className="font-semibold text-blue-600">{healthData.statistics.recent_users_7d}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-500" />
                Job Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Jobs</span>
                <span className="font-semibold">{healthData.statistics.total_jobs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Jobs</span>
                <span className="font-semibold text-green-600">{healthData.statistics.active_jobs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New (7d)</span>
                <span className="font-semibold text-blue-600">{healthData.statistics.recent_jobs_7d}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Application Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Applications</span>
                <span className="font-semibold">{healthData.statistics.total_applications.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New (7d)</span>
                <span className="font-semibold text-blue-600">{healthData.statistics.recent_applications_7d}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dependencies */}
      {healthData && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              Service Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.performance.dependencies.map((dep, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {dep.name === 'Database' && <Database className="h-5 w-5 text-blue-500" />}
                    {dep.name === 'Email Service' && <Mail className="h-5 w-5 text-green-500" />}
                    {dep.name === 'Cloudinary (CDN)' && <Cloud className="h-5 w-5 text-purple-500" />}
                    {!dep.name.includes('Database') && !dep.name.includes('Email') && !dep.name.includes('Cloudinary') && <Server className="h-5 w-5 text-gray-500" />}
                    <span className="font-medium">{dep.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {dep.latency > 0 && (
                      <span className="text-sm text-gray-500">{dep.latency}ms</span>
                    )}
                    {getStatusBadge(dep.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SystemHealth