/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Save,
  Send,
  Eye,
  ArrowLeft,
  RefreshCw,
  Plus,
  X,
  DollarSign,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { toast } from "@/hooks/use-toast";
import api from "../../services/api";

interface Industry {
  id: number;
  industry_name: string;
}

interface EmploymentType {
  id: number;
  type_name: string;
}

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  location: string;
  employment_type_id: string;
  industry_id: string;
  salary_min: string;
  salary_max: string;
  is_remote: boolean;
}

const PostJobForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [requirementsList, setRequirementsList] = useState<string[]>([]);
  const [benefitsList, setBenefitsList] = useState<string[]>([]);
  const [requirementInput, setRequirementInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [previewMode, setPreviewMode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const [duplicateAlert, setDuplicateAlert] = useState<{
    show: boolean;
    message: string;
    existingJobId?: string;
  }>({ show: false, message: "" });

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    location: "",
    employment_type_id: "",
    industry_id: "",
    salary_min: "",
    salary_max: "",
    is_remote: false,
  });

  useEffect(() => {
    fetchFormData();
    if (id) {
      fetchJobForEdit();
    }
    checkVerificationStatus();
  }, [id]);

  const checkVerificationStatus = async () => {
    try {
      const response = await api.get("/employer/profile");
      if (response.data?.data) {
        const profile = response.data.data;
        if (!profile.is_verified) {
          setVerificationError(
            "Your company is not verified yet. You need to complete verification before posting jobs."
          );
        } else if (profile.is_active === false) {
          setVerificationError(
            "Your account has been suspended. Please contact support."
          );
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  const fetchFormData = async () => {
    try {
      const [industriesRes, employmentTypesRes] = await Promise.all([
        api.get("/industries"),
        api.get("/employment-types"),
      ]);
      setIndustries(industriesRes.data.data);
      setEmploymentTypes(employmentTypesRes.data.data);
    } catch (error) {
      console.error("Error fetching form data:", error);
    }
  };

  const fetchJobForEdit = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      const job = response.data.data;
      setFormData({
        title: job.title,
        description: job.description,
        requirements: job.requirements || "",
        benefits: job.benefits || "",
        location: job.location,
        employment_type_id: job.employment_type_id?.toString() || "",
        industry_id: job.industry_id?.toString() || "",
        salary_min: job.salary_min?.toString() || "",
        salary_max: job.salary_max?.toString() || "",
        is_remote: job.is_remote,
      });

      if (job.requirements) {
        setRequirementsList(
          job.requirements.split("\n").filter((r: string) => r.trim())
        );
      }
      if (job.benefits) {
        setBenefitsList(
          job.benefits.split("\n").filter((b: string) => b.trim())
        );
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load job details",
      });
      navigate("/employer/jobs");
    } finally {
      setIsFetching(false);
    }
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setRequirementsList([...requirementsList, requirementInput.trim()]);
      setRequirementInput("");
    }
  };

  const removeRequirement = (index: number) => {
    setRequirementsList(requirementsList.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setBenefitsList([...benefitsList, benefitInput.trim()]);
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Job title is required",
      });
      return false;
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Description must be at least 50 characters",
      });
      return false;
    }
    if (!formData.location.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Location is required",
      });
      return false;
    }
    if (!formData.employment_type_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Employment type is required",
      });
      return false;
    }
    if (!formData.industry_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Industry is required",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "published") => {
    e.preventDefault();
    
    if (verificationError) {
      toast({
        variant: "destructive",
        title: "Cannot Post Job",
        description: verificationError,
      });
      return;
    }
    
    if (!validateForm()) return;

    setIsLoading(true);
    setDuplicateAlert({ show: false, message: "" });
    
    const submitData = {
      ...formData,
      requirements: requirementsList.join("\n"),
      benefits: benefitsList.join("\n"),
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      employment_type_id: parseInt(formData.employment_type_id),
      industry_id: parseInt(formData.industry_id),
    };

    try {
      if (id) {
        await api.put(`/jobs/${id}`, submitData);
        toast({
          title: "Success",
          description: "Job updated successfully",
        });
        navigate("/employer/jobs");
      } else {
        await api.post("/jobs", submitData);
        toast({
          title: "Success",
          description: status === "published" 
            ? "Job posted successfully! Pending admin approval." 
            : "Job saved as draft",
        });
        navigate("/employer/jobs");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error saving job:", error);
      
      if (error.response?.status === 409) {
        setDuplicateAlert({
          show: true,
          message: error.response?.data?.message || "A job with this title already exists.",
          existingJobId: error.response?.data?.existingJobId
        });
      } 
      else if (error.response?.data?.code === 'COMPANY_NOT_VERIFIED') {
        toast({
          variant: "destructive",
          title: "Company Not Verified",
          description: error.response?.data?.message || "Your company must be verified before posting jobs.",
        });
        setVerificationError(error.response?.data?.message);
      } 
      else if (error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
        toast({
          variant: "destructive",
          title: "Account Suspended",
          description: error.response?.data?.message || "Your account has been suspended.",
        });
        setVerificationError(error.response?.data?.message);
      } 
      else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.response?.data?.message || "Failed to save job",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const previewData = {
    ...formData,
    requirements: requirementsList.join("\n"),
    benefits: benefitsList.join("\n"),
    employment_type: employmentTypes.find(
      (et) => et.id.toString() === formData.employment_type_id
    )?.type_name,
    industry: industries.find((i) => i.id.toString() === formData.industry_id)?.industry_name,
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <button
            onClick={() => navigate('/employer/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Jobs</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? "Edit Job" : "Post a New Job"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {id ? "Update your job posting" : "Fill in the details to post a job"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="border-gray-200 rounded-lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Edit" : "Preview"}
              </Button>
            </div>
          </div>
        </div>

        {verificationError && !id && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {verificationError}
            </AlertDescription>
          </Alert>
        )}

        {previewMode ? (
          <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-2xl text-gray-900">
                {previewData.title || "Job Title"}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-3 text-gray-500">
                {previewData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {previewData.location}
                  </span>
                )}
                {previewData.employment_type && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {previewData.employment_type}
                  </span>
                )}
                {previewData.is_remote && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    Remote
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {previewData.description || "No description provided"}
                </p>
              </div>
              {requirementsList.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {requirementsList.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              {benefitsList.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {benefitsList.map((ben, i) => (
                      <li key={i}>{ben}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setPreviewMode(false)} className="border-gray-200 rounded-lg">
                  Back to Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="basic" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Job Details
                </TabsTrigger>
                <TabsTrigger value="requirements" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Requirements & Benefits
                </TabsTrigger>
              </TabsList>

              {/* Your existing form content remains the same */}
              <TabsContent value="basic" className="space-y-4">
                <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
                    <CardDescription className="text-gray-500">Essential job details</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-700">Job Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Senior Software Engineer"
                        className="mt-1.5 rounded-lg border-gray-200"
                        disabled={!!verificationError && !id}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Job Description *</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                        rows={6}
                        className="mt-1.5 rounded-lg border-gray-200"
                        disabled={!!verificationError && !id}
                      />
                      <p className="text-xs text-gray-400 mt-1">Minimum 50 characters</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700">Location *</Label>
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="City, State or Remote"
                          className="mt-1.5 rounded-lg border-gray-200"
                          disabled={!!verificationError && !id}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Switch
                          id="remote"
                          checked={formData.is_remote}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked })}
                          disabled={!!verificationError && !id}
                        />
                        <Label htmlFor="remote">Remote Position</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Job Details</CardTitle>
                    <CardDescription className="text-gray-500">Additional job specifications</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700">Employment Type *</Label>
                        <Select
                          value={formData.employment_type_id}
                          onValueChange={(value) => setFormData({ ...formData, employment_type_id: value })}
                          disabled={!!verificationError && !id}
                        >
                          <SelectTrigger className="mt-1.5 rounded-lg border-gray-200">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {employmentTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.type_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-700">Industry *</Label>
                        <Select
                          value={formData.industry_id}
                          onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
                          disabled={!!verificationError && !id}
                        >
                          <SelectTrigger className="mt-1.5 rounded-lg border-gray-200">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry.id} value={industry.id.toString()}>
                                {industry.industry_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700">Minimum Salary</Label>
                        <div className="relative mt-1.5">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            value={formData.salary_min}
                            onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                            placeholder="50000"
                            className="pl-9 rounded-lg border-gray-200"
                            disabled={!!verificationError && !id}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-700">Maximum Salary</Label>
                        <div className="relative mt-1.5">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            value={formData.salary_max}
                            onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                            placeholder="80000"
                            className="pl-9 rounded-lg border-gray-200"
                            disabled={!!verificationError && !id}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Requirements & Benefits</CardTitle>
                    <CardDescription className="text-gray-500">What candidates need and what they'll get</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="text-gray-700">Requirements</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={requirementInput}
                          onChange={(e) => setRequirementInput(e.target.value)}
                          placeholder="e.g., 5+ years of React experience"
                          onKeyPress={(e) => e.key === "Enter" && addRequirement()}
                          className="rounded-lg border-gray-200"
                          disabled={!!verificationError && !id}
                        />
                        <Button 
                          type="button" 
                          onClick={addRequirement} 
                          variant="outline" 
                          className="border-gray-200 rounded-lg"
                          disabled={!!verificationError && !id}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {requirementsList.map((req, i) => (
                          <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700 gap-1 rounded-full px-3 py-1">
                            {req}
                            <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeRequirement(i)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator className="bg-gray-100" />
                    <div>
                      <Label className="text-gray-700">Benefits</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={benefitInput}
                          onChange={(e) => setBenefitInput(e.target.value)}
                          placeholder="e.g., Health insurance"
                          onKeyPress={(e) => e.key === "Enter" && addBenefit()}
                          className="rounded-lg border-gray-200"
                          disabled={!!verificationError && !id}
                        />
                        <Button 
                          type="button" 
                          onClick={addBenefit} 
                          variant="outline" 
                          className="border-gray-200 rounded-lg"
                          disabled={!!verificationError && !id}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {benefitsList.map((ben, i) => (
                          <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700 gap-1 rounded-full px-3 py-1">
                            {ben}
                            <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeBenefit(i)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/employer/jobs")}
                className="border-gray-200 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={isLoading || (!!verificationError && !id)}
                className="border-gray-200 rounded-lg"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, "published")}
                disabled={isLoading || (!!verificationError && !id)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {id ? "Update Job" : "Publish Job"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Duplicate Job Alert Dialog */}
      <AlertDialog open={duplicateAlert.show} onOpenChange={() => setDuplicateAlert({ show: false, message: "" })}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Duplicate Job Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {duplicateAlert.message}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Duplicate job postings are not allowed. 
                  Please review your existing jobs or update the existing job instead of creating a new one.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {duplicateAlert.existingJobId && (
              <AlertDialogAction 
                onClick={() => {
                  setDuplicateAlert({ show: false, message: "" });
                  navigate(`/employer/jobs/edit/${duplicateAlert.existingJobId}`);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View Existing Job
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostJobForm;