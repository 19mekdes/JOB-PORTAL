/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface JobFiltersState {
  keyword: string;
  location: string;
  jobTypes: string[];
  experienceLevels: string[];
  salaryRange: [number, number];
  industries: string[];
  datePosted: string;
  remoteOnly: boolean;
  featuredOnly: boolean;
  sortBy: string;
}

interface JobFiltersProps {
  filters: JobFiltersState;
  onFilterChange: (filters: JobFiltersState) => void;
  onReset: () => void;
  className?: string;
  variant?: "sidebar" | "drawer" | "inline";
  totalResults?: number;
}

const jobTypeOptions = [
  { id: "full-time", label: "Full Time" },
  { id: "part-time", label: "Part Time" },
  { id: "contract", label: "Contract" },
  { id: "internship", label: "Internship" },
  { id: "temporary", label: "Temporary" },
  { id: "volunteer", label: "Volunteer" },
];

const experienceOptions = [
  { id: "entry", label: "Entry Level (0-2 years)" },
  { id: "mid", label: "Mid Level (3-5 years)" },
  { id: "senior", label: "Senior Level (6-9 years)" },
  { id: "lead", label: "Lead (10+ years)" },
  { id: "executive", label: "Executive" },
];

const dateOptions = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "Last 30 days" },
  { id: "quarter", label: "Last 90 days" },
];

const sortOptions = [
  { id: "recent", label: "Most Recent" },
  { id: "oldest", label: "Oldest First" },
  { id: "salary_high", label: "Highest Salary" },
  { id: "salary_low", label: "Lowest Salary" },
  { id: "relevance", label: "Most Relevant" },
];

const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Construction",
  "Real Estate",
  "Transportation",
  "Hospitality",
  "Media",
  "Consulting",
  "Non-profit",
  "Government",
  "Energy",
  "Telecommunications",
  "Agriculture",
  "Aerospace",
];


const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  className = "",
  variant = "sidebar",
  totalResults = 0,
}) => {
  const [localFilters, setLocalFilters] = useState<JobFiltersState>(filters);
  const [activeSections, setActiveSections] = useState<string[]>([
    "job-type",
    "experience",
    "salary",
    "location",
  ]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = <K extends keyof JobFiltersState>(
    key: K,
    value: JobFiltersState[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof JobFiltersState, value: string) => {
    const current = localFilters[key] as string[];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newValue as JobFiltersState[typeof key]);
  };

  const handleSalaryChange = (value: number[]) => {
    updateFilter("salaryRange", [value[0], value[1]] as [number, number]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.jobTypes.length > 0) count += localFilters.jobTypes.length;
    if (localFilters.experienceLevels.length > 0)
      count += localFilters.experienceLevels.length;
    if (localFilters.industries.length > 0)
      count += localFilters.industries.length;
    if (localFilters.remoteOnly) count++;
    if (localFilters.featuredOnly) count++;
    if (localFilters.datePosted !== "all") count++;
    if (localFilters.salaryRange[0] > 0 || localFilters.salaryRange[1] < 200000)
      count++;
    if (localFilters.location) count++;
    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <Label className="text-sm font-semibold">Sort By</Label>
        <Select
          value={localFilters.sortBy}
          onValueChange={(value) => updateFilter("sortBy", value)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Keyword Search */}
      <div>
        <Label className="text-sm font-semibold">Search</Label>
        <Input
          placeholder="Job title, keywords..."
          value={localFilters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
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
            value={localFilters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      <Accordion
        type="multiple"
        value={activeSections}
        onValueChange={setActiveSections}
        className="space-y-4"
      >
        <AccordionItem value="job-type" className="border-none">
          <AccordionTrigger className="text-sm font-semibold py-0">
            Job Type
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {jobTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-type-${option.id}`}
                    checked={localFilters.jobTypes.includes(option.id)}
                    onCheckedChange={() =>
                      toggleArrayFilter("jobTypes", option.id)
                    }
                  />
                  <Label
                    htmlFor={`job-type-${option.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience" className="border-none">
          <AccordionTrigger className="text-sm font-semibold py-0">
            Experience Level
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {experienceOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exp-${option.id}`}
                    checked={localFilters.experienceLevels.includes(option.id)}
                    onCheckedChange={() =>
                      toggleArrayFilter("experienceLevels", option.id)
                    }
                  />
                  <Label
                    htmlFor={`exp-${option.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="salary" className="border-none">
          <AccordionTrigger className="text-sm font-semibold py-0">
            Salary Range
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <div className="px-2">
              <Slider
                min={0}
                max={200000}
                step={10000}
                value={[
                  localFilters.salaryRange[0],
                  localFilters.salaryRange[1],
                ]}
                onValueChange={handleSalaryChange}
                className="mb-4"
              />
              <div className="flex justify-between text-sm">
                <span>${localFilters.salaryRange[0].toLocaleString()}</span>
                <span>${localFilters.salaryRange[1].toLocaleString()}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="date" className="border-none">
          <AccordionTrigger className="text-sm font-semibold py-0">
            Date Posted
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <div className="space-y-2">
              {dateOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`date-${option.id}`}
                    name="datePosted"
                    checked={localFilters.datePosted === option.id}
                    onChange={() => updateFilter("datePosted", option.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <Label
                    htmlFor={`date-${option.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="industries" className="border-none">
          <AccordionTrigger className="text-sm font-semibold py-0">
            Industries
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0">
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-4">
                {industryOptions.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={localFilters.industries.includes(industry)}
                      onCheckedChange={() =>
                        toggleArrayFilter("industries", industry)
                      }
                    />
                    <Label
                      htmlFor={`industry-${industry}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote-only"
              checked={localFilters.remoteOnly}
              onCheckedChange={(checked) =>
                updateFilter("remoteOnly", checked as boolean)
              }
            />
            <Label
              htmlFor="remote-only"
              className="text-sm font-normal cursor-pointer"
            >
              Remote Only
            </Label>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured-only"
              checked={localFilters.featuredOnly}
              onCheckedChange={(checked) =>
                updateFilter("featuredOnly", checked as boolean)
              }
            />
            <Label
              htmlFor="featured-only"
              className="text-sm font-normal cursor-pointer"
            >
              Featured Jobs Only
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onReset} className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );

  if (variant === "sidebar") {
    return (
      <aside className={`w-80 border-r bg-white p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="gap-1">
              {getActiveFilterCount()} active
              <X className="h-3 w-3 cursor-pointer" onClick={onReset} />
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <FilterContent />
        </ScrollArea>
        {totalResults > 0 && (
          <div className="mt-4 pt-3 border-t text-center text-sm text-gray-500">
            {totalResults} jobs found
          </div>
        )}
      </aside>
    );
  }

  if (variant === "drawer") {
    return (
      <Sheet>
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
            <SheetDescription>Refine your job search results</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] p-4">
            <FilterContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset all
        </Button>
      </div>
      <FilterContent />
    </div>
  );
};

export default JobFilters;
