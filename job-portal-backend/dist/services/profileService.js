"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const client_1 = require("@prisma/client");
const errorMiddleware_js_1 = require("../middleware/errorMiddleware.js");
const prisma = new client_1.PrismaClient();
// ========== PROFILE SERVICE ==========
class ProfileService {
    constructor() {
        this.prisma = prisma;
    }
    // ========== GET PROFILE ==========
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: {
                        industry: true
                    }
                }
            }
        });
        if (!user) {
            throw new errorMiddleware_js_1.NotFoundError('User');
        }
        const profile = user.seeker_profile || user.employer_profile;
        const profileType = user.user_type.type_name;
        // Parse JSON fields if they exist for job seeker
        let parsedProfile = { ...profile };
        if (profileType === 'Job Seeker' && user.seeker_profile) {
            if (user.seeker_profile.experience) {
                try {
                    parsedProfile.experience = JSON.parse(user.seeker_profile.experience);
                }
                catch {
                    parsedProfile.experience = [];
                }
            }
            if (user.seeker_profile.education) {
                try {
                    parsedProfile.education = JSON.parse(user.seeker_profile.education);
                }
                catch {
                    parsedProfile.education = [];
                }
            }
        }
        const completion = await this.getProfileCompletionPercentage(userId, profileType);
        return {
            user: {
                id: user.id,
                email: user.email,
                user_type: profileType,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            profile: parsedProfile,
            completion
        };
    }
    // ========== UPDATE JOB SEEKER PROFILE ==========
    async updateSeekerProfile(userId, profileData) {
        const { full_name, phone, location, skills, experience, education, resume_url } = profileData;
        // Check if profile exists
        const existingProfile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!existingProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        // Update profile
        const updatedProfile = await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: {
                full_name: full_name !== undefined ? full_name : undefined,
                phone: phone !== undefined ? phone : undefined,
                location: location !== undefined ? location : undefined,
                skills: skills !== undefined ? skills : undefined,
                experience: experience !== undefined ? JSON.stringify(experience) : undefined,
                education: education !== undefined ? JSON.stringify(education) : undefined,
                resume_url: resume_url !== undefined ? resume_url : undefined
            }
        });
        return updatedProfile;
    }
    // ========== UPDATE EMPLOYER PROFILE ==========
    async updateEmployerProfile(userId, profileData) {
        const { company_name, company_description, website, industry_id, company_size, location, logo_url } = profileData;
        // Check if profile exists
        const existingProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!existingProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile');
        }
        // Validate website URL
        if (website && !this.isValidUrl(website)) {
            throw new errorMiddleware_js_1.ValidationError('Invalid website URL format');
        }
        // Validate industry
        if (industry_id) {
            const industry = await this.prisma.jobIndustry.findUnique({
                where: { id: industry_id }
            });
            if (!industry) {
                throw new errorMiddleware_js_1.ValidationError('Invalid industry');
            }
        }
        // Update profile
        const updatedProfile = await this.prisma.employerProfile.update({
            where: { user_id: userId },
            data: {
                company_name: company_name !== undefined ? company_name : undefined,
                company_description: company_description !== undefined ? company_description : undefined,
                website: website !== undefined ? website : undefined,
                industry_id: industry_id !== undefined ? industry_id : undefined,
                company_size: company_size !== undefined ? company_size : undefined,
                location: location !== undefined ? location : undefined,
                logo_url: logo_url !== undefined ? logo_url : undefined
            },
            include: {
                industry: true
            }
        });
        return updatedProfile;
    }
    // ========== UPLOAD RESUME ==========
    async uploadResume(userId, resumeUrl) {
        if (!resumeUrl || !this.isValidUrl(resumeUrl)) {
            throw new errorMiddleware_js_1.ValidationError('Valid resume URL is required');
        }
        const updatedProfile = await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { resume_url: resumeUrl }
        });
        return updatedProfile;
    }
    // ========== DELETE RESUME ==========
    async deleteResume(userId) {
        const updatedProfile = await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { resume_url: null }
        });
        return updatedProfile;
    }
    // ========== UPLOAD COMPANY LOGO ==========
    async uploadCompanyLogo(userId, logoUrl) {
        if (!logoUrl || !this.isValidUrl(logoUrl)) {
            throw new errorMiddleware_js_1.ValidationError('Valid logo URL is required');
        }
        const updatedProfile = await this.prisma.employerProfile.update({
            where: { user_id: userId },
            data: { logo_url: logoUrl }
        });
        return updatedProfile;
    }
    // ========== DELETE COMPANY LOGO ==========
    async deleteCompanyLogo(userId) {
        const updatedProfile = await this.prisma.employerProfile.update({
            where: { user_id: userId },
            data: { logo_url: null }
        });
        return updatedProfile;
    }
    // ========== UPDATE SKILLS ==========
    async updateSkills(userId, skills) {
        if (!Array.isArray(skills)) {
            throw new errorMiddleware_js_1.ValidationError('Skills must be an array');
        }
        // Clean and validate skills
        const cleanedSkills = skills
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .slice(0, 30); // Max 30 skills
        const updatedProfile = await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { skills: cleanedSkills }
        });
        return updatedProfile;
    }
    // ========== ADD SKILL ==========
    async addSkill(userId, skill) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const currentSkills = profile.skills || [];
        if (currentSkills.includes(skill)) {
            throw new errorMiddleware_js_1.ValidationError('Skill already exists');
        }
        if (currentSkills.length >= 30) {
            throw new errorMiddleware_js_1.ValidationError('Maximum 30 skills allowed');
        }
        const updatedProfile = await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { skills: [...currentSkills, skill] }
        });
        return updatedProfile;
    }
    // ========== REMOVE SKILL ==========
    async removeSkill(userId, skill) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const currentSkills = profile.skills || [];
        const updatedSkills = currentSkills.filter(s => s !== skill);
        const updatedProfile = await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { skills: updatedSkills }
        });
        return updatedProfile;
    }
    // ========== ADD EXPERIENCE ==========
    async addExperience(userId, experience) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        // Validate dates
        if (experience.start_date && experience.end_date && !experience.current) {
            if (new Date(experience.end_date) <= new Date(experience.start_date)) {
                throw new errorMiddleware_js_1.ValidationError('End date must be after start date');
            }
        }
        const currentExperiences = profile.experience ? JSON.parse(profile.experience) : [];
        const newExperience = {
            id: Date.now().toString(),
            ...experience,
            end_date: experience.current ? null : experience.end_date
        };
        currentExperiences.push(newExperience);
        currentExperiences.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { experience: JSON.stringify(currentExperiences) }
        });
        return newExperience;
    }
    // ========== UPDATE EXPERIENCE ==========
    async updateExperience(userId, experienceId, experienceData) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const experiences = profile.experience ? JSON.parse(profile.experience) : [];
        const experienceIndex = experiences.findIndex((exp) => exp.id === experienceId);
        if (experienceIndex === -1) {
            throw new errorMiddleware_js_1.NotFoundError('Experience');
        }
        experiences[experienceIndex] = {
            ...experiences[experienceIndex],
            ...experienceData,
            end_date: experienceData.current ? null : (experienceData.end_date || experiences[experienceIndex].end_date)
        };
        await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { experience: JSON.stringify(experiences) }
        });
        return experiences[experienceIndex];
    }
    // ========== DELETE EXPERIENCE ==========
    async deleteExperience(userId, experienceId) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const experiences = profile.experience ? JSON.parse(profile.experience) : [];
        const filteredExperiences = experiences.filter((exp) => exp.id !== experienceId);
        await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { experience: JSON.stringify(filteredExperiences) }
        });
        return { message: 'Experience deleted successfully' };
    }
    // ========== ADD EDUCATION ==========
    async addEducation(userId, education) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const currentEducations = profile.education ? JSON.parse(profile.education) : [];
        const newEducation = {
            id: Date.now().toString(),
            ...education,
            end_date: education.current ? null : education.end_date
        };
        currentEducations.push(newEducation);
        currentEducations.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { education: JSON.stringify(currentEducations) }
        });
        return newEducation;
    }
    // ========== UPDATE EDUCATION ==========
    async updateEducation(userId, educationId, educationData) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const educations = profile.education ? JSON.parse(profile.education) : [];
        const educationIndex = educations.findIndex((edu) => edu.id === educationId);
        if (educationIndex === -1) {
            throw new errorMiddleware_js_1.NotFoundError('Education');
        }
        educations[educationIndex] = {
            ...educations[educationIndex],
            ...educationData,
            end_date: educationData.current ? null : (educationData.end_date || educations[educationIndex].end_date)
        };
        await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { education: JSON.stringify(educations) }
        });
        return educations[educationIndex];
    }
    // ========== DELETE EDUCATION ==========
    async deleteEducation(userId, educationId) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: userId }
        });
        if (!profile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile');
        }
        const educations = profile.education ? JSON.parse(profile.education) : [];
        const filteredEducations = educations.filter((edu) => edu.id !== educationId);
        await this.prisma.jobSeekerProfile.update({
            where: { user_id: userId },
            data: { education: JSON.stringify(filteredEducations) }
        });
        return { message: 'Education deleted successfully' };
    }
    // ========== GET PUBLIC PROFILE ==========
    async getPublicProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: {
                        industry: true
                    }
                }
            }
        });
        if (!user) {
            throw new errorMiddleware_js_1.NotFoundError('User');
        }
        const profileType = user.user_type.type_name;
        let profileData = {};
        if (profileType === 'Job Seeker' && user.seeker_profile) {
            profileData = { ...user.seeker_profile };
            if (user.seeker_profile.experience) {
                try {
                    profileData.experience = JSON.parse(user.seeker_profile.experience);
                }
                catch {
                    profileData.experience = [];
                }
            }
            if (user.seeker_profile.education) {
                try {
                    profileData.education = JSON.parse(user.seeker_profile.education);
                }
                catch {
                    profileData.education = [];
                }
            }
            // Remove sensitive info for public view
            delete profileData.phone;
            delete profileData.resume_url;
        }
        else if (profileType === 'Employer' && user.employer_profile) {
            profileData = { ...user.employer_profile };
        }
        return {
            id: user.id,
            user_type: profileType,
            profile: profileData,
            created_at: user.created_at
        };
    }
    // ========== GET PROFILE COMPLETION ==========
    async getProfileCompletion(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true
            }
        });
        if (!user) {
            throw new errorMiddleware_js_1.NotFoundError('User');
        }
        const profileType = user.user_type.type_name;
        const completion = await this.getProfileCompletionPercentage(userId, profileType);
        return completion;
    }
    async getProfileCompletionPercentage(userId, profileType) {
        if (profileType === 'Job Seeker') {
            const profile = await this.prisma.jobSeekerProfile.findUnique({
                where: { user_id: userId }
            });
            if (!profile) {
                return {
                    percentage: 0,
                    completed_fields: [],
                    missing_fields: ['full_name', 'phone', 'location', 'skills', 'resume_url'],
                    sections: []
                };
            }
            const fields = {
                full_name: !!profile.full_name,
                phone: !!profile.phone,
                location: !!profile.location,
                skills: profile.skills && profile.skills.length > 0,
                resume_url: !!profile.resume_url
            };
            const completedFields = Object.keys(fields).filter(key => fields[key]);
            const missingFields = Object.keys(fields).filter(key => !fields[key]);
            const percentage = Math.round((completedFields.length / Object.keys(fields).length) * 100);
            const sections = [
                {
                    section: 'Basic Information',
                    completed: [fields.full_name].filter(Boolean).length,
                    total: 1,
                    percentage: fields.full_name ? 100 : 0
                },
                {
                    section: 'Contact Details',
                    completed: [fields.phone, fields.location].filter(Boolean).length,
                    total: 2,
                    percentage: Math.round(([fields.phone, fields.location].filter(Boolean).length / 2) * 100)
                },
                {
                    section: 'Professional Details',
                    completed: [fields.skills].filter(Boolean).length,
                    total: 1,
                    percentage: fields.skills ? 100 : 0
                },
                {
                    section: 'Documents',
                    completed: [fields.resume_url].filter(Boolean).length,
                    total: 1,
                    percentage: fields.resume_url ? 100 : 0
                }
            ];
            return {
                percentage,
                completed_fields: completedFields,
                missing_fields: missingFields,
                sections
            };
        }
        else {
            const profile = await this.prisma.employerProfile.findUnique({
                where: { user_id: userId }
            });
            if (!profile) {
                return {
                    percentage: 0,
                    completed_fields: [],
                    missing_fields: ['company_name', 'company_description', 'industry_id', 'location'],
                    sections: []
                };
            }
            const fields = {
                company_name: !!profile.company_name,
                company_description: !!profile.company_description,
                industry_id: !!profile.industry_id,
                location: !!profile.location,
                website: !!profile.website,
                logo_url: !!profile.logo_url,
                company_size: !!profile.company_size
            };
            const completedFields = Object.keys(fields).filter(key => fields[key]);
            const missingFields = Object.keys(fields).filter(key => !fields[key]);
            const percentage = Math.round((completedFields.length / Object.keys(fields).length) * 100);
            const sections = [
                {
                    section: 'Company Information',
                    completed: [fields.company_name, fields.company_description, fields.industry_id].filter(Boolean).length,
                    total: 3,
                    percentage: Math.round(([fields.company_name, fields.company_description, fields.industry_id].filter(Boolean).length / 3) * 100)
                },
                {
                    section: 'Location',
                    completed: [fields.location].filter(Boolean).length,
                    total: 1,
                    percentage: fields.location ? 100 : 0
                },
                {
                    section: 'Branding & Details',
                    completed: [fields.website, fields.logo_url, fields.company_size].filter(Boolean).length,
                    total: 3,
                    percentage: Math.round(([fields.website, fields.logo_url, fields.company_size].filter(Boolean).length / 3) * 100)
                }
            ];
            return {
                percentage,
                completed_fields: completedFields,
                missing_fields: missingFields,
                sections
            };
        }
    }
    // ========== HELPER METHODS ==========
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.ProfileService = ProfileService;
// ========== DEFAULT EXPORT ==========
exports.default = new ProfileService();
