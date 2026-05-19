import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/common/LoadingSpinner";
import { RootState } from "../../redux/store";
import api from "../../services/api";

interface RecommendedJob {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string | null;
  created_at: string;
  is_remote: boolean;
  match_score: number;
  match_reasons: string[];
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
}

interface RecommendedJobsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  onJobClick?: (jobId: string) => void;
  variant?: "grid" | "list" | "carousel";
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({
  limit = 6,
  showHeader = true,
  className = "",
  onJobClick,
  variant = "grid",
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedJobs, setDismissedJobs] = useState<string[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "like" | "dislike">
  >({});

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/immutability
      fetchRecommendedJobs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, limit]);

  const fetchRecommendedJobs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/jobs/recommended?limit=${limit}`);
      setJobs(response.data.data);
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (jobId: string) => {
    setDismissedJobs([...dismissedJobs, jobId]);
    try {
      await api.post(`/jobs/${jobId}/dismiss-recommendation`);
    } catch (error) {
      console.error("Error dismissing job:", error);
    }
  };

  const handleFeedback = async (
    jobId: string,
    feedback: "like" | "dislike"
  ) => {
    setFeedbackGiven({ ...feedbackGiven, [jobId]: feedback });
    try {
      await api.post(`/jobs/${jobId}/recommendation-feedback`, { feedback });
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };


  const visibleJobs = jobs
    .filter((job) => !dismissedJobs.includes(job.id))
    .slice(0, limit);

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Recommended for You
          </CardTitle>
          <CardDescription>
            Login to see personalized job recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/login")} className="w-full">
            Login to View Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="mb-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        )}
        <div
          className={
            variant === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {Array.from({ length: limit }).map((_, i) => (
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

  if (visibleJobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Recommended for You
          </CardTitle>
          <CardDescription>
            Complete your profile to get personalized job recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="w-full"
          >
            Complete Your Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  const JobCardComponent = ({ job }: { job: RecommendedJob }) => (
    <Card
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
      onClick={() => {
        onJobClick?.(job.id);
        navigate(`/jobs/${job.id}`);
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500 to-pink-500"
        style={{ width: `${job.match_score}%` }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {job.employer.company_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base hover:text-purple-600 transition-colors line-clamp-1">
                {job.title}
              </h4>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {job.employer.company_name}
              </p>
            </div>
          </div>
          <div
            className={`text-xs font-semibold px-2 py-1 rounded-full ${getMatchScoreColor(
              job.match_score
            )}`}
          >
            {job.match_score}% Match
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location}
            {job.is_remote && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Remote
              </Badge>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {job.employment_type.type_name}
          </span>
          {job.salary_range && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {job.salary_range}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {job.match_reasons.slice(0, 2).map((reason, idx) => (
            <Badge key={idx} variant="outline" className="text-xs bg-purple-50">
              {reason}
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback(job.id, "like");
              }}
              disabled={!!feedbackGiven[job.id]}
              className="h-7 px-2"
            >
              <ThumbsUp
                className={`h-3 w-3 ${
                  feedbackGiven[job.id] === "like"
                    ? "fill-green-500 text-green-500"
                    : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback(job.id, "dislike");
              }}
              disabled={!!feedbackGiven[job.id]}
              className="h-7 px-2"
            >
              <ThumbsDown
                className={`h-3 w-3 ${
                  feedbackGiven[job.id] === "dislike"
                    ? "fill-red-500 text-red-500"
                    : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(job.id);
              }}
              className="h-7 px-2 text-gray-400"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/jobs/${job.id}`);
            }}
            className="h-7"
          >
            View <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (variant === "list") {
    return (
      <div className={className}>
        {showHeader && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Recommended for You
            </h2>
            <p className="text-sm text-gray-500">
              Based on your profile and activity
            </p>
          </div>
        )}
        <div className="space-y-3">
          {visibleJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                onJobClick?.(job.id);
                navigate(`/jobs/${job.id}`);
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{job.title}</h4>
                  <Badge className={getMatchScoreColor(job.match_score)}>
                    {job.match_score}% Match
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {job.employer.company_name} • {job.location}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "carousel") {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Recommended for You
              </h2>
              <p className="text-sm text-gray-500">Personalized matches</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/jobs?recommended=true")}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
        <div className="overflow-x-auto pb-4 -mx-1 px-1">
          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
            {visibleJobs.map((job) => (
              <div key={job.id} className="w-[320px] shrink-0">
                <JobCardComponent job={job} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Recommended for You
          </h2>
          <p className="text-sm text-gray-500">
            Based on your skills and preferences
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleJobs.map((job) => (
          <JobCardComponent key={job.id} job={job} />
        ))}
      </div>
      {jobs.length > limit && (
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => navigate("/jobs?recommended=true")}
          >
            View more recommendations{" "}
            <ChevronRight className="h-4 w-4 inline" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecommendedJobs;
