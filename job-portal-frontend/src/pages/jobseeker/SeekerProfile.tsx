/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  RefreshCw,
  Edit2,
  Plus,
  GraduationCap,
  Camera,
  X,
  Upload,
  Trash2,
  Calendar,
  Building2,
  School,
  User,
  Link as LinkIcon,
} from "lucide-react";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import api from "../../services/api";

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

interface SeekerProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  title: string | null;
  bio: string | null;
  skills: string[];
  experience: Experience[];
  education: Education[];
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  availability: string | null;
  cover_image: string | null;
  avatar: string | null;
}

const availabilityOptions = [
  { value: "immediate", label: "Immediate" },
  { value: "two_weeks", label: "2 Weeks Notice" },
  { value: "one_month", label: "1 Month Notice" },
  { value: "negotiable", label: "Negotiable" },
];

const SeekerProfile: React.FC = () => {
  const [profile, setProfile] = useState<SeekerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [activeTab, setActiveTab] = useState("basic");

  // Cover Image state
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSavingCover, setIsSavingCover] = useState(false);

  // Profile Picture (Avatar) state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // Skills state
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Experience states
  const [showExpDialog, setShowExpDialog] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [expFormData, setExpFormData] = useState<Experience>({
    id: "",
    title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    current: false,
    description: "",
  });

  // Education states
  const [showEduDialog, setShowEduDialog] = useState(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [eduFormData, setEduFormData] = useState<Education>({
    id: "",
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    current: false,
    description: "",
  });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    availability: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/profile/me");
      const data = response.data.data;
      const profileData = data.profile;

      console.log("Raw profile data:", profileData);
      console.log("Title from API:", profileData?.title);
      console.log("LinkedIn from API:", profileData?.linkedin_url);
      console.log("GitHub from API:", profileData?.github_url);
      console.log("Experience from API:", profileData?.experience);
      console.log("Education from API:", profileData?.education);

      // Parse experience - handle both string and array
      let experienceData: Experience[] = [];
      const expField = profileData?.experience;
      if (expField) {
        if (Array.isArray(expField)) {
          experienceData = expField;
        } else if (typeof expField === "string") {
          try {
            experienceData = JSON.parse(expField);
          } catch (e) {
            console.error("Error parsing experience:", e);
            experienceData = [];
          }
        }
      }

      // Parse education - handle both string and array
      let educationData: Education[] = [];
      const eduField = profileData?.education;
      if (eduField) {
        if (Array.isArray(eduField)) {
          educationData = eduField;
        } else if (typeof eduField === "string") {
          try {
            educationData = JSON.parse(eduField);
          } catch (e) {
            console.error("Error parsing education:", e);
            educationData = [];
          }
        }
      }

      const updatedProfile = {
        ...profileData,
        experience: experienceData,
        education: educationData,
        skills: profileData?.skills || [],
      };

      setProfile(updatedProfile);
      setSkills(profileData?.skills || []);

      setFormData({
        full_name: profileData?.full_name || "",
        phone: profileData?.phone || "",
        location: profileData?.location || "",
        title: profileData?.title || "",
        bio: profileData?.bio || "",
        linkedin_url: profileData?.linkedin_url || "",
        github_url: profileData?.github_url || "",
        portfolio_url: profileData?.portfolio_url || "",
        availability: profileData?.availability || "",
      });

      if (profileData?.cover_image) {
        setCoverPreview(profileData.cover_image);
      }

      if (profileData?.avatar) {
        setProfilePicturePreview(profileData.avatar);
      }

      calculateCompletion(updatedProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompletion = (profileData: SeekerProfileData) => {
    if (!profileData) return;
    let completed = 0;
    const total = 11;

    if (profileData.full_name) completed++;
    if (profileData.title) completed++;
    if (profileData.bio) completed++;
    if (profileData.skills && profileData.skills.length > 0) completed++;
    if (profileData.experience && profileData.experience.length > 0) completed++;
    if (profileData.education && profileData.education.length > 0) completed++;
    if (profileData.resume_url) completed++;
    if (profileData.phone) completed++;
    if (profileData.location) completed++;
    if (profileData.cover_image) completed++;
    if (profileData.avatar) completed++;

    setCompletionPercentage(Math.round((completed / total) * 100));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please upload an image file",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Image must be less than 5MB",
        });
        return;
      }
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please upload an image file",
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Image must be less than 2MB",
        });
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const saveCoverImage = async () => {
    if (!coverImage) return;
    setIsSavingCover(true);
    try {
      const data = new FormData();
      data.append("cover_image", coverImage);
      const response = await api.post("/profile/cover", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        toast({ title: "Success", description: "Cover image updated!" });
        setCoverImage(null);
        await fetchProfile();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update cover image",
      });
    } finally {
      setIsSavingCover(false);
    }
  };

  const saveProfilePicture = async () => {
    if (!profilePicture) return;
    setIsSavingAvatar(true);
    try {
      const data = new FormData();
      data.append("avatar", profilePicture);
      const response = await api.post("/profile/avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        toast({ title: "Success", description: "Profile picture updated!" });
        setProfilePicture(null);
        await fetchProfile();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile picture",
      });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // FIXED: handleSubmit - sends all data including title, linkedin, github, etc.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        title: formData.title,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        portfolio_url: formData.portfolio_url,
        availability: formData.availability,
      };
      
      console.log("Saving profile payload:", payload);
      
      await api.put("/auth/profile", payload);
      toast({ title: "Success", description: "Profile updated successfully" });
      await fetchProfile();
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
        title: profile.title || "",
        bio: profile.bio || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        portfolio_url: profile.portfolio_url || "",
        availability: profile.availability || "",
      });
    }
  };

  // FIXED: addSkill - sends skills correctly
  const addSkill = async () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Skill already exists",
      });
      return;
    }
    const updatedSkills = [...skills, newSkill.trim()];
    setSkills(updatedSkills);
    setNewSkill("");
    try {
      await api.put("/auth/profile", { skills: updatedSkills });
      toast({ title: "Success", description: "Skill added" });
      await fetchProfile();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add skill",
      });
    }
  };

  // FIXED: removeSkill - sends skills correctly
  const removeSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(updatedSkills);
    try {
      await api.put("/auth/profile", { skills: updatedSkills });
      toast({ title: "Success", description: "Skill removed" });
      await fetchProfile();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove skill",
      });
    }
  };

  const openExpDialog = (exp?: Experience) => {
    if (exp) {
      setEditingExp(exp);
      setExpFormData(exp);
    } else {
      setEditingExp(null);
      setExpFormData({
        id: "",
        title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        current: false,
        description: "",
      });
    }
    setShowExpDialog(true);
  };

  // FIXED: saveExperience - properly sends experience as JSON string
  const saveExperience = async () => {
    if (!expFormData.title || !expFormData.company) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title and company are required",
      });
      return;
    }

    const updatedExperience = [...(profile?.experience || [])];
    if (editingExp) {
      const index = updatedExperience.findIndex((e) => e.id === editingExp.id);
      if (index !== -1) {
        updatedExperience[index] = { ...expFormData, id: editingExp.id };
      }
    } else {
      updatedExperience.push({ ...expFormData, id: Date.now().toString() });
    }

    try {
      await api.put("/auth/profile", {
        experience: JSON.stringify(updatedExperience),
      });
      toast({
        title: "Success",
        description: editingExp ? "Experience updated" : "Experience added",
      });
      setShowExpDialog(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error saving experience:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save experience",
      });
    }
  };

  const deleteExperience = async (index: number) => {
    const updatedExperience = [...(profile?.experience || [])];
    updatedExperience.splice(index, 1);
    try {
      await api.put("/auth/profile", {
        experience: JSON.stringify(updatedExperience),
      });
      toast({ title: "Success", description: "Experience removed" });
      await fetchProfile();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove experience",
      });
    }
  };

  const openEduDialog = (edu?: Education) => {
    if (edu) {
      setEditingEdu(edu);
      setEduFormData(edu);
    } else {
      setEditingEdu(null);
      setEduFormData({
        id: "",
        institution: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        current: false,
        description: "",
      });
    }
    setShowEduDialog(true);
  };

  // FIXED: saveEducation - properly sends education as JSON string
  const saveEducation = async () => {
    if (!eduFormData.institution || !eduFormData.degree) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Institution and degree are required",
      });
      return;
    }

    const updatedEducation = [...(profile?.education || [])];
    if (editingEdu) {
      const index = updatedEducation.findIndex((e) => e.id === editingEdu.id);
      if (index !== -1) {
        updatedEducation[index] = { ...eduFormData, id: editingEdu.id };
      }
    } else {
      updatedEducation.push({ ...eduFormData, id: Date.now().toString() });
    }

    try {
      await api.put("/auth/profile", {
        education: JSON.stringify(updatedEducation),
      });
      toast({
        title: "Success",
        description: editingEdu ? "Education updated" : "Education added",
      });
      setShowEduDialog(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error saving education:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save education",
      });
    }
  };

  const deleteEducation = async (index: number) => {
    const updatedEducation = [...(profile?.education || [])];
    updatedEducation.splice(index, 1);
    try {
      await api.put("/auth/profile", {
        education: JSON.stringify(updatedEducation),
      });
      toast({ title: "Success", description: "Education removed" });
      await fetchProfile();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove education",
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your professional profile</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Profile Completion</div>
          <div className="w-32">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {completionPercentage}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative mb-20">
        <Card className="overflow-hidden border border-gray-200 shadow-sm relative h-48 bg-gray-100">
          {coverPreview ? (
            <div className="w-full h-full absolute inset-0">
              <img
                src={coverPreview}
                alt="Cover Banner"
                className="w-full h-full object-cover"
              />
              {!coverImage && (
                <button
                  onClick={async () => {
                    try {
                      await api.delete("/profile/cover");
                      toast({
                        title: "Success",
                        description: "Cover image removed",
                      });
                      await fetchProfile();
                    } catch (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to remove cover image",
                      });
                    }
                  }}
                  className="absolute top-3 right-3 z-10 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full flex-col bg-gradient-to-r from-blue-500 to-purple-600">
              <Upload className="h-10 w-10 text-white/50 mb-2" />
              <p className="text-white/70 text-sm">
                Click camera icon to upload cover image
              </p>
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex gap-2 items-center z-30">
            {coverImage && (
              <Button
                size="sm"
                onClick={saveCoverImage}
                disabled={isSavingCover}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSavingCover ? "Saving..." : "Save Cover"}
              </Button>
            )}
            <input
              type="file"
              id="cover-file"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleCoverImageChange}
            />
            <button
              onClick={() => document.getElementById("cover-file")?.click()}
              className="bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg border border-gray-200"
            >
              <Camera className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </Card>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6 z-40 flex items-end gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                  {getInitials(formData.full_name || "U")}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute bottom-0 right-0 z-50">
              <input
                type="file"
                id="avatar-file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleProfilePictureChange}
              />
              <button
                onClick={() => document.getElementById("avatar-file")?.click()}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full shadow-md border border-white"
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
          {profilePicture && (
            <Button
              size="sm"
              onClick={saveProfilePicture}
              disabled={isSavingAvatar}
              className="bg-blue-600 hover:bg-blue-700 shadow-md h-8 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSavingAvatar ? "Uploading..." : "Save Photo"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="pt-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-blue-500 text-white text-xl">
                    {getInitials(formData.full_name || "U")}
                  </AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-xl font-semibold mt-2 text-gray-900">
                {formData.full_name || "Add your name"}
              </h2>
              <p className="text-sm text-gray-500">
                {formData.title || "Add your title"}
              </p>
              {formData.location && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-3">
                  <MapPin className="h-4 w-4" />
                  {formData.location}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <a
                    href={`tel:${formData.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {formData.phone}
                  </a>
                </div>
              )}
              {formData.linkedin_url && (
                <div className="flex items-center gap-2 text-sm">
                  <FaLinkedin className="h-4 w-4 text-[#0077b5] shrink-0" />
                  <a
                    href={formData.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
              {formData.github_url && (
                <div className="flex items-center gap-2 text-sm">
                  <FaGithub className="h-4 w-4 text-gray-700 shrink-0" />
                  <a
                    href={formData.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    GitHub
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger value="basic" className="data-[state=active]:bg-white">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-white">
                Skills
              </TabsTrigger>
              <TabsTrigger value="experience" className="data-[state=active]:bg-white">
                Experience
              </TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-white">
                Education
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-gray-900">
                        Basic Information
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Update your personal and professional details
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="border-gray-300"
                      >
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="border-gray-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmit}
                          disabled={isSaving}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />{" "}
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Full Name</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Professional Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        disabled={!isEditing}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Phone Number</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        disabled={!isEditing}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Availability</Label>
                      <select
                        value={formData.availability || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            availability: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Select availability</option>
                        {availabilityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-700">LinkedIn URL</Label>
                      <Input
                        value={formData.linkedin_url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            linkedin_url: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/in/yourusername"
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">GitHub URL</Label>
                      <Input
                        value={formData.github_url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            github_url: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        placeholder="https://github.com/yourusername"
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">Portfolio URL</Label>
                      <Input
                        value={formData.portfolio_url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            portfolio_url: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        placeholder="https://yourportfolio.com"
                        className="bg-white border-gray-300"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700">Bio / Summary</Label>
                    <Textarea
                      value={formData.bio || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      rows={4}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                  <CardDescription>
                    Add your technical and professional skills
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Add New Skill</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                        placeholder="e.g., JavaScript, React"
                        className="bg-white border-gray-300"
                      />
                      <Button onClick={addSkill} className="bg-blue-600">
                        Add
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700">Your Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No skills added yet
                        </p>
                      ) : (
                        skills.map((skill, index) => (
                          <Badge
                            key={index}
                            className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>
                      Add your professional work history
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => openExpDialog()}
                    size="sm"
                    className="bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Experience
                  </Button>
                </CardHeader>
                <CardContent>
                  {!profile.experience || profile.experience.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No work experience added yet. Click "Add Experience" to start.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div
                          key={exp.id || index}
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {exp.title}
                              </h3>
                              <p className="text-gray-600">{exp.company}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openExpDialog(exp)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteExperience(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          {exp.location && (
                            <p className="text-sm text-gray-500 mt-1">
                              {exp.location}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            {exp.start_date} -{" "}
                            {exp.current ? "Present" : exp.end_date || ""}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>
                      Add your educational background
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => openEduDialog()}
                    size="sm"
                    className="bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Education
                  </Button>
                </CardHeader>
                <CardContent>
                  {!profile.education || profile.education.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No education added yet. Click "Add Education" to start.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div
                          key={edu.id || index}
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {edu.degree} in {edu.field_of_study}
                              </h3>
                              <p className="text-gray-600">{edu.institution}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEduDialog(edu)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEducation(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {edu.start_date} -{" "}
                            {edu.current ? "Present" : edu.end_date || ""}
                          </p>
                          {edu.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Experience Dialog */}
      <Dialog open={showExpDialog} onOpenChange={setShowExpDialog}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingExp ? "Edit Experience" : "Add Experience"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Job Title *</Label>
              <Input
                value={expFormData.title}
                onChange={(e) =>
                  setExpFormData({ ...expFormData, title: e.target.value })
                }
                placeholder="e.g., Senior Software Engineer"
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-700">Company *</Label>
              <Input
                value={expFormData.company}
                onChange={(e) =>
                  setExpFormData({ ...expFormData, company: e.target.value })
                }
                placeholder="e.g., Google"
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-700">Location</Label>
              <Input
                value={expFormData.location}
                onChange={(e) =>
                  setExpFormData({ ...expFormData, location: e.target.value })
                }
                placeholder="City, Country"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Start Date</Label>
                <Input
                  type="month"
                  value={expFormData.start_date}
                  onChange={(e) =>
                    setExpFormData({ ...expFormData, start_date: e.target.value })
                  }
                  className="bg-white border-gray-300"
                />
              </div>
              {!expFormData.current && (
                <div>
                  <Label className="text-gray-700">End Date</Label>
                  <Input
                    type="month"
                    value={expFormData.end_date}
                    onChange={(e) =>
                      setExpFormData({ ...expFormData, end_date: e.target.value })
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={expFormData.current}
                onCheckedChange={(checked) =>
                  setExpFormData({ ...expFormData, current: checked })
                }
              />
              <Label className="text-gray-700">I currently work here</Label>
            </div>
            <div>
              <Label className="text-gray-700">Description</Label>
              <Textarea
                value={expFormData.description}
                onChange={(e) =>
                  setExpFormData({ ...expFormData, description: e.target.value })
                }
                rows={4}
                placeholder="Describe your responsibilities and achievements..."
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpDialog(false)}
              className="border-gray-300 bg-white text-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={saveExperience} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={showEduDialog} onOpenChange={setShowEduDialog}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingEdu ? "Edit Education" : "Add Education"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Institution *</Label>
              <Input
                value={eduFormData.institution}
                onChange={(e) =>
                  setEduFormData({ ...eduFormData, institution: e.target.value })
                }
                placeholder="e.g., Addis Ababa University"
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-700">Degree *</Label>
              <Input
                value={eduFormData.degree}
                onChange={(e) =>
                  setEduFormData({ ...eduFormData, degree: e.target.value })
                }
                placeholder="e.g., Bachelor of Science"
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-700">Field of Study</Label>
              <Input
                value={eduFormData.field_of_study}
                onChange={(e) =>
                  setEduFormData({ ...eduFormData, field_of_study: e.target.value })
                }
                placeholder="e.g., Computer Science"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Start Date</Label>
                <Input
                  type="month"
                  value={eduFormData.start_date}
                  onChange={(e) =>
                    setEduFormData({ ...eduFormData, start_date: e.target.value })
                  }
                  className="bg-white border-gray-300"
                />
              </div>
              {!eduFormData.current && (
                <div>
                  <Label className="text-gray-700">End Date</Label>
                  <Input
                    type="month"
                    value={eduFormData.end_date}
                    onChange={(e) =>
                      setEduFormData({ ...eduFormData, end_date: e.target.value })
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={eduFormData.current}
                onCheckedChange={(checked) =>
                  setEduFormData({ ...eduFormData, current: checked })
                }
              />
              <Label className="text-gray-700">I currently study here</Label>
            </div>
            <div>
              <Label className="text-gray-700">Description</Label>
              <Textarea
                value={eduFormData.description}
                onChange={(e) =>
                  setEduFormData({ ...eduFormData, description: e.target.value })
                }
                rows={3}
                placeholder="Additional details about your education..."
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEduDialog(false)}
              className="border-gray-300 bg-white text-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={saveEducation} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeekerProfile;