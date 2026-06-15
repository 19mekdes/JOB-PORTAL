/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Clock,
  Eye,
  Users,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  Globe,
  ExternalLink,
  Zap,
  Gift,
  ListChecks,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { RootState } from "../../redux/store";
import api from "../../services/api";

// Helper function to format requirements/benefits as bullet points
const formatTextToBulletPoints = (text: string | null): string[] => {
  if (!text) return [];
  if (text.trim() === "") return [];
  
  let items: string[] = [];
  
  // Split by new lines (how employers add requirements)
  if (text.includes("\n")) {
    items = text.split("\n");
  }
  // Split by bullet points
  else if (text.includes("•") || text.includes("-") || text.includes("*")) {
    const bulletChar = text.includes("•") ? "•" : (text.includes("-") ? "-" : "*");
    items = text.split(bulletChar);
  }
  // Split by commas
  else if (text.includes(",")) {
    items = text.split(",");
  }
  // Single item
  else {
    items = [text];
  }
  
  
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => item.replace(/^[•\-*\d+.]\s*/, ""));
};

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string;
  salary_range: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  applications_count: number;
  is_remote: boolean;
  is_featured?: boolean;
  is_premium?: boolean;
  employer: {
    id: string;
    company_name: string;
    company_description: string | null;
    website: string | null;
    logo_url: string | null;
    location: string | null;
    founded_year: number | null;
    company_size: string | null;
    user: {
      email: string;
    };
  };
  industry: {
    id: number;
    industry_name: string;
  };
  employment_type: {
    id: number;
    type_name: string;
  };
  status: {
    id: number;
    status_name: string;
  };
  has_applied?: boolean;
  related_jobs?: JobDetails[];
}

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    fetchJobDetails();
    checkIfSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data.data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load job details",
      });
      navigate("/jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/bookmarks/check/${id}`);
      setIsSaved(response.data.data.isBookmarked);
    } catch (error) {
      console.error("Error checking bookmark:", error);
    }
  };

  const handleSaveJob = async () => {
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
        await api.delete(`/bookmarks/${id}`);
        toast({ title: "Removed", description: "Job removed from saved" });
      } else {
        await api.post(`/bookmarks/${id}`);
        toast({ title: "Saved", description: "Job saved successfully" });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.employer.company_name}`,
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

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to apply",
        variant: "destructive",
      });
      navigate("/login");
    } else if (user.user_type !== "Job Seeker") {
      toast({
        title: "Not Allowed",
        description: "Only job seekers can apply",
        variant: "destructive",
      });
    } else if (job?.has_applied) {
      toast({
        title: "Already Applied",
        description: "You have already applied for this position",
      });
    } else {
      navigate(`/apply/${id}`);
    }
  };

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const requirementsList = formatTextToBulletPoints(job.requirements);
  const benefitsList = formatTextToBulletPoints(job.benefits);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={job.employer.logo_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                      {job.employer.company_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold">{job.title}</h1>
                      {job.is_featured && (
                        <Badge className="bg-linear-to-r from-yellow-400 to-yellow-500">
                          <Zap className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <Building2 className="h-4 w-4" />
                      {job.employer.company_name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleSaveJob}>
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                  {job.is_remote && (
                    <Badge variant="secondary" className="ml-2">
                      Remote
                    </Badge>
                  )}
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  {job.employment_type.type_name}
                </span>
                {job.salary_range && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    {job.salary_range}
                  </span>
                )}
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  Posted {getTimeAgo(job.created_at)}
                </span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline">{job.industry.industry_name}</Badge>
                <Badge variant="secondary">
                  <Eye className="h-3 w-3 mr-1" />
                  {job.views_count} views
                </Badge>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {job.applications_count} applications
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Job Details Tabs - UPDATED with bullet points */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="benefits">Benefits</TabsTrigger>
                </TabsList>
                
                {/* Description Tab */}
                <TabsContent value="description" className="mt-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{job.description}</p>
                  </div>
                </TabsContent>
                
                {/* Requirements Tab - FIXED: Bullet points */}
                <TabsContent value="requirements" className="mt-4">
                  {requirementsList.length === 0 ? (
                    <div className="text-center py-8">
                      <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No specific requirements listed.</p>
                      <p className="text-sm text-gray-400">The employer hasn't added requirements yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {requirementsList.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-gray-700 leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
                
                {/* Benefits Tab - FIXED: Bullet points */}
                <TabsContent value="benefits" className="mt-4">
                  {benefitsList.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No benefits information provided.</p>
                      <p className="text-sm text-gray-400">The employer hasn't added benefits yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {benefitsList.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Gift className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-gray-700 leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Related Jobs */}
          {job.related_jobs && job.related_jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
                <CardDescription>
                  You might also be interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.related_jobs.slice(0, 3).map((relatedJob) => (
                    <div
                      key={relatedJob.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/jobs/${relatedJob.id}`)}
                    >
                      <div>
                        <p className="font-medium">{relatedJob.title}</p>
                        <p className="text-sm text-gray-500">
                          {relatedJob.employer.company_name}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Apply Card */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Apply for this job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-semibold">
                    {job.applications_count} candidates
                  </span>
                </div>
              </div>
              {job.has_applied ? (
                <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">
                    You have already applied for this position
                  </span>
                </div>
              ) : job.status.status_name === "Open" ? (
                <Button className="w-full" size="lg" onClick={handleApply}>
                  Apply Now
                </Button>
              ) : (
                <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">
                    This position is no longer accepting applications
                  </span>
                </div>
              )}
              {!user && (
                <p className="text-xs text-gray-500 text-center">
                  Please login to apply for this position
                </p>
              )}
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card>
            <CardHeader>
              <CardTitle>About the Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {job.employer.company_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{job.employer.company_name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {job.employer.company_description ||
                  "No company description available."}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>
                    {job.employer.location || "Location not specified"}
                  </span>
                </div>
                {job.employer.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a
                      href={job.employer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Company Website{" "}
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </div>
                )}
              </div>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  (window.location.href = `mailto:${job.employer.user.email}`)
                }
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Employer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;