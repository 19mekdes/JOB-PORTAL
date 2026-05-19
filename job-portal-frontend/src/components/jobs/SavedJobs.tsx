/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Bookmark,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/common/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { RootState } from "../../redux/store";
import api from "../../services/api";

interface SavedJob {
  id: number;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salary_range: string | null;
    created_at: string;
    is_remote: boolean;
    employer: {
      company_name: string;
      logo_url: string | null;
    };
    industry: {
      industry_name: string;
    };
    employment_type: {
      type_name: string;
    };
    is_active: boolean;
  };
  created_at: string;
}

interface SavedJobsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  onRemove?: (jobId: string) => void;
}

const SavedJobs: React.FC<SavedJobsProps> = ({
  limit,
  showHeader = true,
  className = "",
  onRemove,
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [jobToRemove, setJobToRemove] = useState<SavedJob | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/bookmarks");
      setSavedJobs(response.data.data);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved jobs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async () => {
    if (!jobToRemove) return;
    try {
      await api.delete(`/bookmarks/${jobToRemove.job.id}`);
      setSavedJobs(savedJobs.filter((job) => job.id !== jobToRemove.id));
      toast({
        title: "Removed",
        description: "Job removed from saved list",
      });
      onRemove?.(jobToRemove.job.id);
      setIsRemoveDialogOpen(false);
      setJobToRemove(null);
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove job",
      });
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return `${Math.floor(diff / 7)} weeks ago`;
  };

  const filteredJobs = savedJobs
    .filter(
      (job) =>
        job.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job.employer.company_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "recent")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (sortBy === "title") return a.job.title.localeCompare(b.job.title);
      if (sortBy === "company")
        return a.job.employer.company_name.localeCompare(
          b.job.employer.company_name
        );
      return 0;
    });

  const displayJobs = limit ? filteredJobs.slice(0, limit) : filteredJobs;

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Saved Jobs
          </CardTitle>
          <CardDescription>
            Login to view and manage your saved jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/login")} className="w-full">
            Login to View Saved Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        {showHeader && <Skeleton className="h-7 w-32 mb-4" />}
        <div className="space-y-3">
          {Array.from({ length: limit || 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Saved Jobs
          </CardTitle>
          <CardDescription>Jobs you save will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 mb-4">No saved jobs yet</p>
          <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Jobs ({savedJobs.length})
            </h2>
            <p className="text-sm text-gray-500">
              Jobs you've bookmarked for later
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search saved jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32.5">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Job Title</SelectItem>
                <SelectItem value="company">Company Name</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSavedJobs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {searchTerm && filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No saved jobs match your search</p>
            <Button variant="link" onClick={() => setSearchTerm("")}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayJobs.map((savedJob) => (
            <Card
              key={savedJob.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div
                    className="flex items-start gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/jobs/${savedJob.job.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {savedJob.job.employer.company_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                        {savedJob.job.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {savedJob.job.employer.company_name}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {savedJob.job.location}
                          {savedJob.job.is_remote && (
                            <Badge variant="secondary" className="ml-1">
                              Remote
                            </Badge>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {savedJob.job.employment_type.type_name}
                        </span>
                        {savedJob.job.salary_range && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {savedJob.job.salary_range}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {savedJob.job.industry.industry_name}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          Saved {getTimeAgo(savedJob.created_at)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!savedJob.job.is_active && (
                      <Badge variant="destructive" className="mr-2">
                        Closed
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/jobs/${savedJob.job.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setJobToRemove(savedJob);
                        setIsRemoveDialogOpen(true);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {limit && savedJobs.length > limit && (
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => navigate("/jobseeker/bookmarks")}
          >
            View all saved jobs ({savedJobs.length - limit} more)
          </Button>
        </div>
      )}

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Saved Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{jobToRemove?.job.title}" from
              your saved list? You can always save it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveBookmark}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedJobs;
