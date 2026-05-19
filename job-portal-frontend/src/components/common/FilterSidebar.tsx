/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from 'react'
import {
  Filter,
  X,
  MapPin,
  RefreshCw} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export interface FilterOptions {
  keyword: string
  location: string
  jobTypes: string[]
  experienceLevels: string[]
  salaryRange: [number, number]
  industries: string[]
  datePosted: string
  remoteOnly: boolean
  featuredOnly: boolean
  companyTypes: string[]
}

interface FilterSidebarProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onApply: (filters: FilterOptions) => void
  onReset?: () => void
  initialFilters?: Partial<FilterOptions>
  className?: string
  variant?: 'sidebar' | 'drawer' | 'inline'
}

const defaultFilters: FilterOptions = {
  keyword: '',
  location: '',
  jobTypes: [],
  experienceLevels: [],
  salaryRange: [0, 200000],
  industries: [],
  datePosted: 'all',
  remoteOnly: false,
  featuredOnly: false,
  companyTypes: []
}

const jobTypeOptions = [
  { id: 'full-time', label: 'Full Time' },
  { id: 'part-time', label: 'Part Time' },
  { id: 'contract', label: 'Contract' },
  { id: 'internship', label: 'Internship' },
  { id: 'temporary', label: 'Temporary' },
  { id: 'volunteer', label: 'Volunteer' }
]

const experienceOptions = [
  { id: 'entry', label: 'Entry Level (0-2 years)' },
  { id: 'mid', label: 'Mid Level (3-5 years)' },
  { id: 'senior', label: 'Senior Level (6-9 years)' },
  { id: 'lead', label: 'Lead (10+ years)' },
  { id: 'executive', label: 'Executive' }
]

const dateOptions = [
  { id: 'all', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'Last 30 days' },
  { id: 'quarter', label: 'Last 90 days' }
]

const industryOptions = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
  'Manufacturing', 'Construction', 'Real Estate', 'Transportation',
  'Hospitality', 'Media', 'Consulting', 'Non-profit', 'Government',
  'Energy', 'Telecommunications', 'Agriculture', 'Aerospace'
]

const companyTypeOptions = [
  { id: 'startup', label: 'Startup' },
  { id: 'smb', label: 'Small/Medium Business' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'agency', label: 'Agency' },
  { id: 'nonprofit', label: 'Non-Profit' }
]

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  open,
  onOpenChange,
  onApply,
  onReset,
  initialFilters = {},
  className = '',
  variant = 'sidebar'
}) => {
  const [filters, setFilters] = useState<FilterOptions>({ ...defaultFilters, ...initialFilters })
  const [activeSections, setActiveSections] = useState<string[]>(['job-type', 'experience', 'salary'])

  useEffect(() => {
    setFilters({ ...defaultFilters, ...initialFilters })
  }, [initialFilters])

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: keyof FilterOptions, value: string) => {
    const current = filters[key] as string[]
    if (current.includes(value)) {
      updateFilter(key, current.filter(v => v !== value))
    } else {
      updateFilter(key, [...current, value])
    }
  }

  const handleApply = () => {
    onApply(filters)
    if (variant !== 'inline' && onOpenChange) {
      onOpenChange(false)
    }
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    if (onReset) {
      onReset()
    } else {
      onApply(defaultFilters)
    }
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.jobTypes.length > 0) count += filters.jobTypes.length
    if (filters.experienceLevels.length > 0) count += filters.experienceLevels.length
    if (filters.industries.length > 0) count += filters.industries.length
    if (filters.companyTypes.length > 0) count += filters.companyTypes.length
    if (filters.remoteOnly) count++
    if (filters.featuredOnly) count++
    if (filters.datePosted !== 'all') count++
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200000) count++
    if (filters.location) count++
    return count
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <Label className="text-sm font-semibold">Search</Label>
        <Input
          placeholder="Job title, keywords..."
          value={filters.keyword}
          onChange={(e) => updateFilter('keyword', e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Location */}
      <div>
        <Label className="text-sm font-semibold">Location</Label>
        <div className="relative mt-2">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="City, state, or remote"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Job Type */}
      <Accordion type="multiple" value={activeSections} onValueChange={setActiveSections} className="space-y-4">
        <AccordionItem value="job-type" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-0">
            Job Type
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {jobTypeOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-type-${option.id}`}
                    checked={filters.jobTypes.includes(option.id)}
                    onCheckedChange={() => toggleArrayFilter('jobTypes', option.id)}
                  />
                  <Label htmlFor={`job-type-${option.id}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Experience Level */}
        <AccordionItem value="experience" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-0">
            Experience Level
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {experienceOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exp-${option.id}`}
                    checked={filters.experienceLevels.includes(option.id)}
                    onCheckedChange={() => toggleArrayFilter('experienceLevels', option.id)}
                  />
                  <Label htmlFor={`exp-${option.id}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Salary Range */}
        <AccordionItem value="salary" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-0">
            Salary Range
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <div className="px-2">
              <Slider
                min={0}
                max={200000}
                step={10000}
                value={[filters.salaryRange[0], filters.salaryRange[1]]}
                onValueChange={(value) => updateFilter('salaryRange', value as [number, number])}
                className="mb-4"
              />
              <div className="flex justify-between text-sm">
                <span>${filters.salaryRange[0].toLocaleString()}</span>
                <span>${filters.salaryRange[1].toLocaleString()}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Date Posted */}
        <AccordionItem value="date" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-0">
            Date Posted
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {dateOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`date-${option.id}`}
                    name="datePosted"
                    checked={filters.datePosted === option.id}
                    onChange={() => updateFilter('datePosted', option.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <Label htmlFor={`date-${option.id}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Industries */}
        <AccordionItem value="industries" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-0">
            Industries
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-4">
                {industryOptions.map(industry => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={filters.industries.includes(industry)}
                      onCheckedChange={() => toggleArrayFilter('industries', industry)}
                    />
                    <Label htmlFor={`industry-${industry}`} className="text-sm font-normal cursor-pointer">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        {/* Company Type */}
        <AccordionItem value="company-type" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-0">
            Company Type
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {companyTypeOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${option.id}`}
                    checked={filters.companyTypes.includes(option.id)}
                    onCheckedChange={() => toggleArrayFilter('companyTypes', option.id)}
                  />
                  <Label htmlFor={`company-${option.id}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Additional Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote-only"
              checked={filters.remoteOnly}
              onCheckedChange={(checked) => updateFilter('remoteOnly', checked as boolean)}
            />
            <Label htmlFor="remote-only" className="text-sm font-normal cursor-pointer">
              Remote Only
            </Label>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured-only"
              checked={filters.featuredOnly}
              onCheckedChange={(checked) => updateFilter('featuredOnly', checked as boolean)}
            />
            <Label htmlFor="featured-only" className="text-sm font-normal cursor-pointer">
              Featured Jobs Only
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={handleReset} className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleApply} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  )

  // Sidebar variant (desktop)
  if (variant === 'sidebar') {
    return (
      <aside className={`w-80 border-r bg-white p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="gap-1">
              {getActiveFilterCount()} active
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={handleReset}
              />
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <FilterContent />
        </ScrollArea>
      </aside>
    )
  }

  // Drawer variant (mobile)
  if (variant === 'drawer') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[90vw] sm:w-100 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your job search results
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] p-4">
            <FilterContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  // Inline variant
  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset all
        </Button>
      </div>
      <FilterContent />
    </div>
  )
}

export default FilterSidebar