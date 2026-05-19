import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  DollarSign,
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  Users,
  AlertCircle,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/common/LoadingSpinner";
import { RootState } from "@/redux/store";
import { useApplications } from "@/hooks/useApplications";

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode] = useState<"grid" | "list">("grid");

  const { applications, stats, isLoading } = useApplications();

  const isJobSeeker = user?.user_type === "Job Seeker";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Reviewed":
        return "bg-blue-100 text-blue-800";
      case "Shortlisted":
        return "bg-green-100 text-green-800";
      case "Interview":
        return "bg-purple-100 text-purple-800";
      case "Accepted":
        return "bg-emerald-100 text-emerald-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Reviewed":
        return <Eye className="h-4 w-4" />;
      case "Shortlisted":
        return <Star className="h-4 w-4" />;
      case "Interview":
        return <Users className="h-4 w-4" />;
      case "Accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "Rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchTerm === "" ||
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.employer.company_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || app.status.status_name === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">
            {isJobSeeker
              ? "Track and manage your job applications"
              : "Review and manage candidate applications"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setStatusFilter("Pending")}
          >
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.byStatus.find((s) => s.status === "Pending")?.count || 0}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </CardContent>
          </Card>
          <Card
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setStatusFilter("Reviewed")}
          >
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.byStatus.find((s) => s.status === "Reviewed")?.count ||
                  0}
              </p>
              <p className="text-xs text-gray-500">Reviewed</p>
            </CardContent>
          </Card>
          <Card
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setStatusFilter("Shortlisted")}
          >
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.byStatus.find((s) => s.status === "Shortlisted")
                  ?.count || 0}
              </p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </CardContent>
          </Card>
          <Card
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setStatusFilter("Interview")}
          >
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.byStatus.find((s) => s.status === "Interview")?.count ||
                  0}
              </p>
              <p className="text-xs text-gray-500">Interview</p>
            </CardContent>
          </Card>
          <Card
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setStatusFilter("Accepted")}
          >
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.byStatus.find((s) => s.status === "Accepted")?.count ||
                  0}
              </p>
              <p className="text-xs text-gray-500">Accepted</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={
                  isJobSeeker
                    ? "Search by job title or company..."
                    : "Search by candidate name or job..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-45 border-gray-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending Review</SelectItem>
                <SelectItem value="Reviewed">Reviewed</SelectItem>
                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Not Selected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Display */}
      {filteredApplications.length === 0 ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No applications found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : isJobSeeker
                ? "You haven't applied to any jobs yet"
                : "No applications received yet"}
            </p>
            {isJobSeeker && !searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => navigate("/jobs")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        // GRID LAYOUT
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate(`/applications/${application.id}`)}
            >
              {/* Status Banner */}
              <div
                className={`px-4 py-2 ${getStatusColor(
                  application.status.status_name
                )} flex items-center gap-2`}
              >
                {getStatusIcon(application.status.status_name)}
                <span className="text-sm font-medium">
                  {application.status.status_name}
                </span>
              </div>

              <CardContent className="p-5">
                {/* Company Info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {application.job.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {application.job.employer.company_name}
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">
                      {application.job.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span>
                      {application.job.employment_type?.type_name ||
                        "Full-time"}
                    </span>
                  </div>
                  {application.job.salary_range && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <DollarSign className="h-4 w-4 shrink-0" />
                      <span>{application.job.salary_range}</span>
                    </div>
                  )}
                </div>

                {/* Application Info */}
                <div className="border-t border-gray-100 pt-3 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Applied on</span>
                    <span className="text-gray-700">
                      {formatDate(application.applied_at)}
                    </span>
                  </div>
                </div>

                {/* View Details Button - BLUE */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/applications/${application.id}`);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // LIST LAYOUT
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/applications/${application.id}`)}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Briefcase className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                          {application.job.title}
                        </h3>
                        <p className="text-gray-600">
                          {application.job.employer.company_name}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {application.job.employment_type?.type_name ||
                              "Full-time"}
                          </span>
                          {application.job.salary_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {application.job.salary_range}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col items-end gap-3">
                    <Badge
                      className={getStatusColor(application.status.status_name)}
                    >
                      {application.status.status_name}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      Applied {formatDate(application.applied_at)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 border-black hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/applications/${application.id}`);
                      }}
                    >
                      View Details
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredApplications.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredApplications.length} of {applications.length}{" "}
          applications
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
