/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { 
  Download, 
  Calendar, 
  FileText, 
  Users, 
  Briefcase, 
  TrendingUp,
  Printer,
  Mail,
  Eye} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import api from '../../services/api'

interface ReportFilter {
  type: 'users' | 'jobs' | 'applications' | 'analytics'
  format: 'pdf' | 'csv' | 'excel'
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  includeCharts: boolean
  includeTables: boolean
}

const Reports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [filters, setFilters] = useState<ReportFilter>({
    type: 'analytics',
    format: 'pdf',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    includeCharts: true,
    includeTables: true
  })

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      const response = await api.post('/admin/reports/generate', filters, {
        responseType: 'blob'
      })
      
      setGenerationProgress(100)
      setTimeout(() => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `report_${filters.type}_${Date.now()}.${filters.format}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        
        toast({
          variant: "success",
          title: "Success",
          description: "Report generated and downloaded successfully",
        })
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 500)
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate report. Please try again.",
      })
      setIsGenerating(false)
      setGenerationProgress(0)
    } finally {
      clearInterval(interval)
    }
  }

  const handleEmailReport = async () => {
    toast({
      title: "Report Sent",
      description: "The report has been sent to your email address",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const reportTypes = [
    { id: 'users', label: 'User Report', icon: Users, description: 'User registration trends and demographics' },
    { id: 'jobs', label: 'Jobs Report', icon: Briefcase, description: 'Job posting analytics and performance' },
    { id: 'applications', label: 'Applications Report', icon: FileText, description: 'Application trends and status distribution' },
    { id: 'analytics', label: 'Full Analytics', icon: TrendingUp, description: 'Comprehensive platform analytics' }
  ]

  const quickReports = [
    { label: 'Weekly Summary', days: 7 },
    { label: 'Monthly Report', days: 30 },
    { label: 'Quarterly Report', days: 90 },
    { label: 'Yearly Report', days: 365 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download custom reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating report...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => {
          const Icon = type.icon
          const isSelected = filters.type === type.id
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setFilters({ ...filters, type: type.id as any })}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500' : 'bg-gray-100'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Generate common reports with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickReports.map((report) => (
              <Button
                key={report.label}
                variant="outline"
                onClick={() => {
                  const to = new Date()
                  const from = new Date()
                  from.setDate(from.getDate() - report.days)
                  setFilters({
                    ...filters,
                    dateRange: { from, to }
                  })
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {report.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Customize your report settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">From</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, from: new Date(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">To</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, to: new Date(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Select value={filters.format} onValueChange={(value: any) => setFilters({ ...filters, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Options */}
            <div className="space-y-2">
              <Label>Include in Report</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.includeCharts}
                    onChange={(e) => setFilters({ ...filters, includeCharts: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include Charts & Visualizations</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.includeTables}
                    onChange={(e) => setFilters({ ...filters, includeTables: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include Data Tables</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEmailReport}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Set up automatic report generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Weekly Analytics Report</p>
                <p className="text-sm text-gray-500">Every Monday at 9:00 AM</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Monthly User Report</p>
                <p className="text-sm text-gray-500">1st of every month at 8:00 AM</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <Button variant="outline" className="w-full">
              + Add Scheduled Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              Preview of the report based on current settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold">Job Portal Analytics Report</h2>
              <p className="text-gray-500">
                Generated on {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-500">
                Period: {filters.dateRange.from?.toLocaleDateString()} - {filters.dateRange.to?.toLocaleDateString()}
              </p>
            </div>

            {/* Executive Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">2,847</p>
                  <p className="text-xs text-gray-600">Total Users</p>
                  <p className="text-xs text-green-600 mt-1">↑ 12.5%</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Briefcase className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-xs text-gray-600">Total Jobs</p>
                  <p className="text-xs text-green-600 mt-1">↑ 8.3%</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">5,678</p>
                  <p className="text-xs text-gray-600">Applications</p>
                  <p className="text-xs text-green-600 mt-1">↑ 15.7%</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Eye className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold">45.2K</p>
                  <p className="text-xs text-gray-600">Total Views</p>
                  <p className="text-xs text-green-600 mt-1">↑ 22.1%</p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Key Metrics</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>User Growth</span>
                    <span>+12.5%</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Job Postings Growth</span>
                    <span>+8.3%</span>
                  </div>
                  <Progress value={60} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Application Rate</span>
                    <span>+15.7%</span>
                  </div>
                  <Progress value={85} />
                </div>
              </div>
            </div>

            {/* Top Performing Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Top Performing Categories</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Technology</span>
                  <span className="font-semibold">342 jobs</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Healthcare</span>
                  <span className="font-semibold">218 jobs</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Finance</span>
                  <span className="font-semibold">187 jobs</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowPreview(false)
              handleGenerateReport()
            }}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Reports