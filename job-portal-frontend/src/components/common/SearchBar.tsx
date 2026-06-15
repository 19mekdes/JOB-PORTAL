/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  X,
  MapPin,
  Filter,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SearchFilters {
  keyword: string
  location: string
  jobType: string
  experienceLevel: string
  salaryMin: number
  salaryMax: number
  remoteOnly: boolean
  datePosted: string
  industry: string[]
}

interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
  className?: string
  variant?: 'default' | 'hero' | 'compact'
}

const defaultFilters: SearchFilters = {
  keyword: '',
  location: '',
  jobType: 'all',
  experienceLevel: 'all',
  salaryMin: 0,
  salaryMax: 200000,
  remoteOnly: false,
  datePosted: 'all',
  industry: []
}

const jobTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'internship', label: 'Internship' }
]

const experienceLevels = [
  { value: 'all', label: 'Any Experience' },
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-9 years)' },
  { value: 'lead', label: 'Lead (10+ years)' },
  { value: 'executive', label: 'Executive' }
]

const dateOptions = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' }
]

const popularIndustries = [
  'Technology', 'Healthcare', 'Finance', 'Education',
  'Retail', 'Manufacturing', 'Construction', 'Real Estate',
  'Transportation', 'Hospitality', 'Media', 'Consulting'
]


const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  initialFilters = {},
  className = '',
  variant = 'default'
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [filters, setFilters] = useState<SearchFilters>({ ...defaultFilters, ...initialFilters })
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }

    // Parse URL params on mount
    const params = new URLSearchParams(location.search)
    const keyword = params.get('q') || ''
    const locationParam = params.get('location') || ''
    if (keyword || locationParam) {
      setFilters(prev => ({ ...prev, keyword, location: locationParam }))
      if (onSearch) {
        onSearch({ ...filters, keyword, location: locationParam })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSearch = () => {
    if (filters.keyword.trim()) {
      saveRecentSearch(filters.keyword)
    }

    // Update URL params
    const params = new URLSearchParams()
    if (filters.keyword) params.set('q', filters.keyword)
    if (filters.location) params.set('location', filters.location)
    if (filters.jobType !== 'all') params.set('type', filters.jobType)
    if (filters.experienceLevel !== 'all') params.set('exp', filters.experienceLevel)
    if (filters.remoteOnly) params.set('remote', 'true')
    if (filters.datePosted !== 'all') params.set('date', filters.datePosted)

    navigate(`/jobs?${params.toString()}`)

    if (onSearch) {
      onSearch(filters)
    }

    setShowSuggestions(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    if (onSearch) {
      onSearch(defaultFilters)
    }
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const HeroSearch = () => (
    <div className="relative">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Job title, keywords, or company"
            value={filters.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-12 h-14 text-lg"
          />
          {filters.keyword && (
            <button
              onClick={() => updateFilter('keyword', '')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex-1 relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="City, state, or remote"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 h-14 text-lg"
          />
        </div>
        <Button size="lg" onClick={handleSearch} className="h-14 px-8">
          <Search className="h-5 w-5 mr-2" />
          Search Jobs
        </Button>
      </div>

      {/* Recent Searches */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-2">Recent Searches</p>
            {recentSearches.map((term, idx) => (
              <button
                key={idx}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                onClick={() => {
                  updateFilter('keyword', term)
                  handleSearch()
                }}
              >
                <Clock className="inline h-3 w-3 mr-2 text-gray-400" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const DefaultSearch = () => (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search jobs..."
          value={filters.keyword}
          onChange={(e) => updateFilter('keyword', e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9"
        />
      </div>
      <Button onClick={handleSearch}>
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <FilterContent />
        </DialogContent>
      </Dialog>
    </div>
  )

  const CompactSearch = () => (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search..."
          value={filters.keyword}
          onChange={(e) => updateFilter('keyword', e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9"
        />
      </div>
      <Button size="sm" onClick={handleSearch}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  )

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Job Type */}
      <div>
        <Label className="text-sm font-semibold">Job Type</Label>
        <Select value={filters.jobType} onValueChange={(v) => updateFilter('jobType', v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jobTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Experience Level */}
      <div>
        <Label className="text-sm font-semibold">Experience Level</Label>
        <Select value={filters.experienceLevel} onValueChange={(v) => updateFilter('experienceLevel', v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {experienceLevels.map(level => (
              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Salary Range */}
      <div>
        <Label className="text-sm font-semibold">Salary Range</Label>
        <div className="mt-4 px-2">
          <Slider
            min={0}
            max={200000}
            step={10000}
            value={[filters.salaryMin, filters.salaryMax]}
            onValueChange={([min, max]) => {
              updateFilter('salaryMin', min)
              updateFilter('salaryMax', max)
            }}
            className="my-4"
          />
          <div className="flex justify-between text-sm">
            <span>${filters.salaryMin.toLocaleString()}</span>
            <span>${filters.salaryMax.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Date Posted */}
      <div>
        <Label className="text-sm font-semibold">Date Posted</Label>
        <Select value={filters.datePosted} onValueChange={(v) => updateFilter('datePosted', v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Remote Only */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Remote Only</Label>
        <Checkbox
          checked={filters.remoteOnly}
          onCheckedChange={(checked) => updateFilter('remoteOnly', checked)}
        />
      </div>

      {/* Industries */}
      <div>
        <Label className="text-sm font-semibold">Industries</Label>
        <ScrollArea className="h-48 mt-2 border rounded-md p-2">
          {popularIndustries.map(industry => (
            <div key={industry} className="flex items-center space-x-2 py-1">
              <Checkbox
                id={`industry-${industry}`}
                checked={filters.industry.includes(industry)}
                onCheckedChange={(checked: any) => {
                  if (checked) {
                    updateFilter('industry', [...filters.industry, industry])
                  } else {
                    updateFilter('industry', filters.industry.filter(i => i !== industry))
                  }
                }}
              />
              <Label htmlFor={`industry-${industry}`} className="text-sm font-normal">
                {industry}
              </Label>
            </div>
          ))}
        </ScrollArea>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button variant="outline" onClick={clearFilters} className="flex-1">
          Clear All
        </Button>
        <Button onClick={() => setShowFilters(false)} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div className={className}>
      {variant === 'hero' && <HeroSearch />}
      {variant === 'default' && <DefaultSearch />}
      {variant === 'compact' && <CompactSearch />}

      {/* Active Filters Display */}
      {(filters.jobType !== 'all' || filters.experienceLevel !== 'all' || filters.remoteOnly || filters.industry.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.jobType !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {jobTypes.find(t => t.value === filters.jobType)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('jobType', 'all')} />
            </Badge>
          )}
          {filters.experienceLevel !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {experienceLevels.find(l => l.value === filters.experienceLevel)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('experienceLevel', 'all')} />
            </Badge>
          )}
          {filters.remoteOnly && (
            <Badge variant="secondary" className="gap-1">
              Remote Only
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('remoteOnly', false)} />
            </Badge>
          )}
          {filters.industry.slice(0, 3).map(industry => (
            <Badge key={industry} variant="secondary" className="gap-1">
              {industry}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('industry', filters.industry.filter(i => i !== industry))} />
            </Badge>
          ))}
          {filters.industry.length > 3 && (
            <Badge variant="secondary">+{filters.industry.length - 3} more</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

export default SearchBar