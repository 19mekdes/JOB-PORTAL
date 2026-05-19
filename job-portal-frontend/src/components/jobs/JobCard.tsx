import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Clock,
  Eye,
  Share2,
  Heart,
  Zap,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { RootState } from "../../redux/store";
import api from "../../services/api";

interface JobCardProps {
  job: {
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
  };
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  onSave?: () => void;
  onApply?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  variant = "default",
  showActions = true,
  onSave,
  onApply,
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSaved, setIsSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getTimeAgo = (date: string) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  const handleSaveJob = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save jobs",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/bookmarks/${job.id}`);
        toast({ title: "Removed", description: "Job removed from saved" });
      } else {
        await api.post(`/bookmarks/${job.id}`);
        toast({ title: "Saved", description: "Job saved successfully" });
      }
      setIsSaved(!isSaved);
      onSave?.();
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title} at ${job.employer.company_name}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Job link copied to clipboard",
      });
    }
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to apply",
        variant: "destructive",
      });
      navigate("/login");
    } else if (user.user_type !== "Job Seeker")
      toast({
        title: "Not Allowed",
        description: "Only job seekers can apply",
        variant: "destructive",
      });
    else if (job.has_applied)
      toast({
        title: "Already Applied",
        description: "You have already applied for this position",
      });
    else {
      onApply?.();
      navigate(`/apply/${job.id}`);
    }
  };

  if (variant === "compact") {
    return (
      <div
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => navigate(`/jobs/${job.id}`)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{job.title}</p>
          <p className="text-sm text-gray-500 truncate">
            {job.employer.company_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{job.employment_type.type_name}</Badge>
          <Button variant="ghost" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <Card
        className={`relative overflow-hidden border-2 border-blue-200 shadow-lg transition-all duration-300 ${
          isHovered ? "shadow-xl -translate-y-1" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute top-0 right-0">
          <div className="bg-linear-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Featured
          </div>
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={job.employer.logo_url || undefined} />
              <AvatarFallback>
                {job.employer.company_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3
                className="text-xl font-semibold hover:text-blue-600 cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                {job.title}
              </h3>
              <p className="text-gray-600 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {job.employer.company_name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
              {job.is_remote && (
                <Badge variant="secondary" className="ml-1">
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
          <p className="text-gray-600 line-clamp-2">{job.description}</p>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between items-center">
          <div className="flex gap-2">
            {job.industry && (
              <Badge variant="outline">{job.industry.industry_name}</Badge>
            )}
            {job._count && job._count.applications > 0 && (
              <Badge variant="secondary">
                {job._count.applications} applicants
              </Badge>
            )}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleApply}
          >
            Apply Now
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isHovered ? "shadow-md" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {job.employer.company_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-gray-500">
                {job.employer.company_name}
              </p>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handleSaveJob}>
                <Heart
                  className={`h-4 w-4 ${
                    isSaved ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location}
            {job.is_remote && (
              <Badge variant="secondary" className="ml-1">
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
        <p className="text-gray-600 line-clamp-2 text-sm">{job.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {job.industry.industry_name}
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            {getTimeAgo(job.created_at)}
          </Badge>
          {job._count && job._count.applications > 0 && (
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              {job._count.applications} applicants
            </Badge>
          )}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-3 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          Posted {getTimeAgo(job.created_at)}
        </div>
        <div className="flex gap-2">
          {!job.has_applied ? (
            <Button size="sm" onClick={handleApply}>
              Apply Now
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Applied
            </Button>
          )}
          {job._count && job._count.applications > 0 && (
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
