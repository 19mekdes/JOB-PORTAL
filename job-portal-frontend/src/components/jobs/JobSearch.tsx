/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  MapPin,
  X,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SearchFilters {
  keyword: string;
  location: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
  remoteOnly: boolean;
  datePosted: string;
}

interface JobSearchProps {
  onSearch?: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  className?: string;
  variant?: "hero" | "default" | "compact";
  placeholder?: string;
}

const jobTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const experienceOptions = [
  { value: "all", label: "Any Experience" },
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior Level (6-9 years)" },
  { value: "lead", label: "Lead (10+ years)" },
  { value: "executive", label: "Executive" },
];

const dateOptions = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "quarter", label: "Last 90 days" },
];




const categories = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Marketing",
  "Sales",
  "Design",
  "Customer Service",
];

const defaultFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: "all",
  jobType: "all",
  experienceLevel: "all",
  salaryMin: 0,
  salaryMax: 200000,
  remoteOnly: false,
  datePosted: "all",
};

const JobSearch: React.FC<JobSearchProps> = ({
  onSearch,
  initialFilters = {},
  className = "",
  variant = "default",
  placeholder = "Job title, keywords, or company",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("recentJobSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
    const params = new URLSearchParams(location.search);
    const keyword = params.get("q") || "";
    const locationParam = params.get("location") || "";
    if (keyword || locationParam) {
      setFilters((prev) => ({ ...prev, keyword, location: locationParam }));
      if (onSearch) onSearch({ ...filters, keyword, location: locationParam });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem("recentJobSearches", JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (filters.keyword.trim()) saveRecentSearch(filters.keyword);
    const params = new URLSearchParams();
    if (filters.keyword) params.set("q", filters.keyword);
    if (filters.location) params.set("location", filters.location);
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.jobType !== "all") params.set("type", filters.jobType);
    if (filters.experienceLevel !== "all")
      params.set("exp", filters.experienceLevel);
    if (filters.remoteOnly) params.set("remote", "true");
    if (filters.datePosted !== "all") params.set("date", filters.datePosted);
    if (filters.salaryMin > 0)
      params.set("min_salary", filters.salaryMin.toString());
    if (filters.salaryMax < 200000)
      params.set("max_salary", filters.salaryMax.toString());
    navigate(`/jobs?${params.toString()}`);
    if (onSearch) onSearch(filters);
    setShowSuggestions(false);
    setShowFilters(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const updateFilter = (key: keyof SearchFilters, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () => {
    setFilters(defaultFilters);
    if (onSearch) onSearch(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category !== "all") count++;
    if (filters.jobType !== "all") count++;
    if (filters.experienceLevel !== "all") count++;
    if (filters.remoteOnly) count++;
    if (filters.datePosted !== "all") count++;
    if (filters.salaryMin > 0 || filters.salaryMax < 200000) count++;
    if (filters.location) count++;
    return count;
  };

  const HeroSearch = () => (
    <div className="relative">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-12 h-14 text-lg"
          />
          {filters.keyword && (
            <button
              onClick={() => updateFilter("keyword", "")}
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
            onChange={(e) => updateFilter("location", e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 h-14 text-lg"
          />
        </div>
        <Button size="lg" onClick={handleSearch} className="h-14 px-8">
          <Search className="h-5 w-5 mr-2" />
          Search Jobs
        </Button>
      </div>
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-2">Recent Searches</p>
            {recentSearches.map((term, idx) => (
              <button
                key={idx}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                onClick={() => {
                  updateFilter("keyword", term);
                  handleSearch();
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
  );

  const DefaultSearch = () => (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
          />
        </div>
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[90vw] sm:w-100 overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
              <SheetDescription>Refine your job search</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <AdvancedFilters />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category !== "all" && (
            <FilterBadge
              label={`Category: ${filters.category}`}
              onRemove={() => updateFilter("category", "all")}
            />
          )}
          {filters.jobType !== "all" && (
            <FilterBadge
              label={`Job Type: ${
                jobTypeOptions.find((j) => j.value === filters.jobType)?.label
              }`}
              onRemove={() => updateFilter("jobType", "all")}
            />
          )}
          {filters.experienceLevel !== "all" && (
            <FilterBadge
              label={`Experience: ${
                experienceOptions.find(
                  (e) => e.value === filters.experienceLevel
                )?.label
              }`}
              onRemove={() => updateFilter("experienceLevel", "all")}
            />
          )}
          {filters.remoteOnly && (
            <FilterBadge
              label="Remote Only"
              onRemove={() => updateFilter("remoteOnly", false)}
            />
          )}
          {filters.datePosted !== "all" && (
            <FilterBadge
              label={`Posted: ${
                dateOptions.find((d) => d.value === filters.datePosted)?.label
              }`}
              onRemove={() => updateFilter("datePosted", "all")}
            />
          )}
          {(filters.salaryMin > 0 || filters.salaryMax < 200000) && (
            <FilterBadge
              label={`Salary: $${filters.salaryMin.toLocaleString()} - $${filters.salaryMax.toLocaleString()}`}
              onRemove={() => {
                updateFilter("salaryMin", 0);
                updateFilter("salaryMax", 200000);
              }}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );

  const CompactSearch = () => (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search jobs..."
          value={filters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9"
        />
      </div>
      <Button size="sm" onClick={handleSearch}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );

  const AdvancedFilters = () => (
    <div className="space-y-6">
      <div>
        <Label>Category</Label>
        <Select
          value={filters.category}
          onValueChange={(v) => updateFilter("category", v)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat.toLowerCase()}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Job Type</Label>
        <Select
          value={filters.jobType}
          onValueChange={(v) => updateFilter("jobType", v)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jobTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Experience Level</Label>
        <Select
          value={filters.experienceLevel}
          onValueChange={(v) => updateFilter("experienceLevel", v)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {experienceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Salary Range</Label>
        <div className="mt-4 px-2">
          <Slider
            min={0}
            max={200000}
            step={10000}
            value={[filters.salaryMin, filters.salaryMax]}
            onValueChange={([min, max]) => {
              updateFilter("salaryMin", min);
              updateFilter("salaryMax", max);
            }}
            className="mb-4"
          />
          <div className="flex justify-between text-sm">
            <span>${filters.salaryMin.toLocaleString()}</span>
            <span>${filters.salaryMax.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div>
        <Label>Date Posted</Label>
        <Select
          value={filters.datePosted}
          onValueChange={(v) => updateFilter("datePosted", v)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="remote-only"
          checked={filters.remoteOnly}
          onCheckedChange={(checked) => updateFilter("remoteOnly", checked)}
        />
        <Label htmlFor="remote-only" className="cursor-pointer">
          Remote Only
        </Label>
      </div>
      <Separator />
      <Button onClick={clearFilters} variant="outline" className="w-full">
        Reset All Filters
      </Button>
    </div>
  );

  const FilterBadge = ({
    label,
    onRemove,
  }: {
    label: string;
    onRemove: () => void;
  }) => (
    <Badge variant="secondary" className="gap-1">
      {label}
      <X className="h-3 w-3 cursor-pointer" onClick={onRemove} />
    </Badge>
  );

  return (
    <div className={className}>
      {variant === "hero" && <HeroSearch />}
      {variant === "default" && <DefaultSearch />}
      {variant === "compact" && <CompactSearch />}
    </div>
  );
};

export default JobSearch;
