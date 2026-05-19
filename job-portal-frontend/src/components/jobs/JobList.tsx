/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Grid3x3,
  List,
  Briefcase,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/common/LoadingSpinner";
import JobCard from "./JobCard";
import JobFilters, { JobFiltersState } from "./JobFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import api from "../../services/api";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  is_remote: boolean;
  is_featured?: boolean;
  is_premium?: boolean;
  employer: {
    id: string;
    company_name: string;
    logo_url: string | null;
  };
  industry: {
    id: number;
    industry_name: string;
  };
  employment_type: {
    id: number;
    type_name: string;
  };
  _count?: {
    applications: number;
  };
  has_applied?: boolean;
}

interface JobListProps {
  initialFilters?: Partial<JobFiltersState>;
  showFilters?: boolean;
  defaultView?: "grid" | "list";
  onJobClick?: (jobId: string) => void;
}

const defaultFilters: JobFiltersState = {
  keyword: "",
  location: "",
  jobTypes: [],
  experienceLevels: [],
  salaryRange: [0, 200000],
  industries: [],
  datePosted: "all",
  remoteOnly: false,
  featuredOnly: false,
  sortBy: "recent",
};

const ITEMS_PER_PAGE = 12;

const JobList: React.FC<JobListProps> = ({
  initialFilters = {},
  showFilters = true,
  defaultView = "grid",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultView);
  const [filters, setFilters] = useState<JobFiltersState>({
    ...defaultFilters,
    ...initialFilters,
    keyword: searchParams.get("q") || initialFilters.keyword || "",
    location: searchParams.get("location") || initialFilters.location || "",
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sort: filters.sortBy,
        search: filters.keyword,
        location: filters.location,
        remote_only: filters.remoteOnly,
        featured_only: filters.featuredOnly,
        date_posted: filters.datePosted,
        min_salary: filters.salaryRange[0],
        max_salary: filters.salaryRange[1],
      };
      if (filters.jobTypes.length > 0)
        params.job_types = filters.jobTypes.join(",");
      if (filters.experienceLevels.length > 0)
        params.experience_levels = filters.experienceLevels.join(",");
      if (filters.industries.length > 0)
        params.industries = filters.industries.join(",");

      const response = await api.get("/jobs", { params });
      setJobs(response.data.data);
      setTotalJobs(response.data.pagination.total);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {};
    if (filters.keyword) params.q = filters.keyword;
    if (filters.location) params.location = filters.location;
    if (filters.sortBy !== "recent") params.sort = filters.sortBy;
    if (filters.remoteOnly) params.remote = "true";
    if (filters.featuredOnly) params.featured = "true";
    if (filters.datePosted !== "all") params.date = filters.datePosted;
    if (filters.salaryRange[0] > 0) params.min_salary = filters.salaryRange[0];
    if (filters.salaryRange[1] < 200000)
      params.max_salary = filters.salaryRange[1];
    if (filters.jobTypes.length > 0) params.type = filters.jobTypes.join(",");
    if (filters.industries.length > 0)
      params.industry = filters.industries.join(",");
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalJobs / ITEMS_PER_PAGE);

  const JobSkeleton = () => (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );

  return (
    <div className="flex gap-6">
      {/* Desktop Filters Sidebar */}
      {showFilters && (
        <JobFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          variant="sidebar"
          totalResults={totalJobs}
          className="hidden lg:block"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{totalJobs} Jobs Found</h1>
            <p className="text-gray-500 text-sm">
              Showing {jobs.length} of {totalJobs} positions
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  handleFilterChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="salary_high">Highest Salary</SelectItem>
                  <SelectItem value="salary_low">Lowest Salary</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Results Count & Pagination Top */}
        {totalPages > 1 && (
          <div className="flex justify-center mb-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Job Listings */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
            <Button
              variant="link"
              onClick={handleResetFilters}
              className="mt-4"
            >
              Clear all filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} variant="compact" />
            ))}
          </div>
        )}

        {/* Pagination Bottom */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-130px)]">
              <JobFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                variant="inline"
                totalResults={totalJobs}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
              <Button
                className="w-full"
                onClick={() => setShowMobileFilters(false)}
              >
                Show {totalJobs} Jobs
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
