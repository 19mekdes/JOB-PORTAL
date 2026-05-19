// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Briefcase, FileText, Clock, TrendingUp, Eye, CheckCircle, XCircle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface DashboardStats {
  totalUsers: number
  totalJobs: number
  totalApplications: number
  pendingReviews: number
  activeJobs: number
  newUsersThisMonth: number
  newJobsThisMonth: number
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    pendingReviews: 0,
    activeJobs: 0,
    newUsersThisMonth: 0,
    newJobsThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [userGrowthData, setUserGrowthData] = useState([])
  const [jobTrendData, setJobTrendData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/analytics')
      const data = response.data.data
      
      setStats({
        totalUsers: data.totalUsers || 0,
        totalJobs: data.totalJobs || 0,
        totalApplications: data.totalApplications || 0,
        pendingReviews: data.pendingApplications || 0,
        activeJobs: data.activeJobs || 0,
        newUsersThisMonth: data.newUsersThisMonth || 0,
        newJobsThisMonth: data.newJobsThisMonth || 0
      })
      
      // Mock chart data
      setUserGrowthData([
        { month: 'Jan', users: 1200, jobs: 450 },
        { month: 'Feb', users: 1350, jobs: 520 },
        { month: 'Mar', users: 1480, jobs: 580 },
        { month: 'Apr', users: 1620, jobs: 610 },
        { month: 'May', users: 1750, jobs: 680 },
        { month: 'Jun', users: 1890, jobs: 720 }
      ])
      
      setJobTrendData([
        { name: 'Pending', value: 45, color: '#f59e0b' },
        { name: 'Reviewed', value: 68, color: '#3b82f6' },
        { name: 'Shortlisted', value: 32, color: '#8b5cf6' },
        { name: 'Interview', value: 28, color: '#06b6d4' },
        { name: 'Accepted', value: 15, color: '#10b981' },
        { name: 'Rejected', value: 42, color: '#ef4444' }
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard data" })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { title: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, change: `+${stats.newUsersThisMonth} this month`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Jobs', value: stats.totalJobs.toLocaleString(), icon: Briefcase, change: `+${stats.newJobsThisMonth} this month`, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Applications', value: stats.totalApplications.toLocaleString(), icon: FileText, change: 'Total received', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Pending Review', value: stats.pendingReviews.toLocaleString(), icon: Clock, change: 'Need attention', color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of platform activity and metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-gray-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users" />
                <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} name="Jobs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition text-sm font-medium">
              Review Pending Jobs
            </button>
            <button className="p-3 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition text-sm font-medium">
              Manage Users
            </button>
            <button className="p-3 bg-purple-50 rounded-lg text-purple-700 hover:bg-purple-100 transition text-sm font-medium">
              View Reports
            </button>
            <button className="p-3 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 transition text-sm font-medium">
              System Settings
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard