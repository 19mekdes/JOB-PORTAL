"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompanyProfile = exports.getCompanyProfile = exports.deleteJob = exports.updateJob = exports.getMyJobs = exports.postJob = exports.addManagedCompany = exports.getManagedCompanies = void 0;
const client_1 = require("@prisma/client");
const safeJson_1 = require("../utils/safeJson");
const prisma = new client_1.PrismaClient();
// Get employer's managed companies
const getManagedCompanies = async (req, res) => {
    try {
        const userId = req.user.id;
        const employerProfile = await prisma.employerProfile.findFirst({
            where: { user_id: userId },
            include: {
                managed_companies: true
            }
        });
        if (!employerProfile) {
            res.status(404).json({
                success: false,
                message: 'Employer profile not found'
            });
            return;
        }
        const companies = [
            {
                id: employerProfile.id,
                company_name: employerProfile.company_name,
                logo_url: employerProfile.logo_url,
                is_primary: true,
                is_verified: true
            },
            ...(employerProfile.managed_companies || []).map(company => ({
                id: company.id,
                company_name: company.company_name,
                logo_url: company.logo_url,
                is_primary: false,
                is_verified: company.is_verified
            }))
        ];
        res.json({
            success: true,
            data: companies
        });
    }
    catch (error) {
        console.error('Error in getManagedCompanies:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getManagedCompanies = getManagedCompanies;
// Add a managed company
const addManagedCompany = async (req, res) => {
    try {
        const { company_name, logo_url, website, location, description } = req.body;
        const userId = req.user.id;
        if (!company_name) {
            res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
            return;
        }
        const employerProfile = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employerProfile) {
            res.status(404).json({
                success: false,
                message: 'Employer profile not found'
            });
            return;
        }
        const managedCompany = await prisma.managedCompany.create({
            data: {
                employer_id: employerProfile.id,
                company_name,
                logo_url: logo_url || null,
                website: website || null,
                location: location || null,
                description: description || null
            }
        });
        res.status(201).json({
            success: true,
            data: managedCompany,
            message: 'Company added successfully'
        });
    }
    catch (error) {
        console.error('Error in addManagedCompany:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.addManagedCompany = addManagedCompany;
// Post a job
const postJob = async (req, res) => {
    try {
        const { title, description, requirements, benefits, location, salary_min, salary_max, employment_type_id, industry_id, is_remote, company_id, custom_company_name } = req.body;
        const userId = req.user.id;
        const employerProfile = await prisma.employerProfile.findFirst({
            where: { user_id: userId },
            include: {
                managed_companies: true
            }
        });
        if (!employerProfile) {
            res.status(404).json({
                success: false,
                message: 'Employer profile not found'
            });
            return;
        }
        let finalCompanyName = employerProfile.company_name;
        let managedCompanyId = null;
        if (company_id && company_id !== employerProfile.id) {
            const managedCompany = employerProfile.managed_companies?.find((mc) => mc.id === company_id);
            if (managedCompany) {
                finalCompanyName = managedCompany.company_name;
                managedCompanyId = managedCompany.id;
            }
        }
        if (custom_company_name) {
            finalCompanyName = custom_company_name;
        }
        const openStatus = await prisma.jobPostStatus.findFirst({
            where: { status_name: 'Open' }
        });
        if (!openStatus) {
            res.status(500).json({
                success: false,
                message: 'Job status configuration missing'
            });
            return;
        }
        let salaryRange = null;
        if (salary_min && salary_max) {
            salaryRange = `$${salary_min} - $${salary_max}`;
        }
        else if (salary_min) {
            salaryRange = `From $${salary_min}`;
        }
        else if (salary_max) {
            salaryRange = `Up to $${salary_max}`;
        }
        const normalizedTitle = title?.trim() ?? '';
        const normalizedLocation = location?.trim() ?? '';
        // Prevent duplicate jobs (same employer, title, location, employment_type, industry)
        const duplicateJob = await prisma.jobPost.findFirst({
            where: {
                employer_id: employerProfile.id,
                title: { equals: normalizedTitle, mode: 'insensitive' },
                location: { equals: normalizedLocation, mode: 'insensitive' },
                employment_type_id: Number(employment_type_id),
                industry_id: Number(industry_id)
            }
        });
        if (duplicateJob) {
            res.status(409).json({
                success: false,
                message: 'Duplicate job detected. A similar job already exists for your company.',
                existingJobId: duplicateJob.id,
                code: 'DUPLICATE_JOB'
            });
            return;
        }
        const job = await prisma.jobPost.create({
            data: {
                title: normalizedTitle,
                description,
                requirements: requirements || null,
                benefits: benefits || null,
                location: normalizedLocation,
                is_remote: is_remote || false,
                employer_id: employerProfile.id,
                industry_id: Number(industry_id),
                employment_type_id: Number(employment_type_id),
                status_id: openStatus.id,
                salary_min: salary_min ? parseFloat(salary_min) : null,
                salary_max: salary_max ? parseFloat(salary_max) : null,
                salary_range: salaryRange,
                company_name: finalCompanyName,
                managed_company_id: managedCompanyId
            },
            include: {
                status: true,
                employment_type: true,
                industry: true
            }
        });
        res.status(201).json({
            success: true,
            data: job,
            message: `Job posted successfully for ${finalCompanyName}`
        });
    }
    catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.postJob = postJob;
// Get all jobs
const getMyJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const employerProfile = await prisma.employerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!employerProfile) {
            res.status(404).json({
                success: false,
                message: 'Employer profile not found'
            });
            return;
        }
        const jobs = await prisma.jobPost.findMany({
            where: { employer_id: employerProfile.id },
            orderBy: { created_at: 'desc' },
            include: {
                status: true,
                employment_type: true,
                industry: true,
                _count: {
                    select: { applications: true }
                }
            }
        });
        res.json({
            success: true,
            data: jobs
        });
    }
    catch (error) {
        console.error('Error in getMyJobs:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getMyJobs = getMyJobs;
// Update job
const updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const updateData = req.body;
        const job = await prisma.jobPost.update({
            where: { id: jobId },
            data: updateData
        });
        res.json({
            success: true,
            data: job,
            message: 'Job updated successfully'
        });
    }
    catch (error) {
        console.error('Error in updateJob:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateJob = updateJob;
// Delete job
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        await prisma.jobPost.delete({
            where: { id: jobId }
        });
        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    }
    catch (error) {
        console.error('Error in deleteJob:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.deleteJob = deleteJob;
// Get company profile
const getCompanyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const employerProfile = await prisma.employerProfile.findFirst({
            where: { user_id: userId },
            include: {
                industry: true,
                managed_companies: true
            }
        });
        if (!employerProfile) {
            res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                ...employerProfile,
                social_links: employerProfile.social_links || {},
                founded_year: employerProfile.founded_year || null,
                headquarters: employerProfile.headquarters || null
            }
        });
    }
    catch (error) {
        console.error('Error in getCompanyProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getCompanyProfile = getCompanyProfile;
// Update company profile
const updateCompanyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;
        // Parse social_links if it's a string
        let socialLinks = updateData.social_links;
        if (socialLinks !== undefined) {
            socialLinks = (0, safeJson_1.safeJsonParse)(socialLinks, null);
        }
        // Prepare data for update
        const dataToUpdate = {};
        if (updateData.company_name !== undefined)
            dataToUpdate.company_name = updateData.company_name;
        if (updateData.company_description !== undefined)
            dataToUpdate.company_description = updateData.company_description;
        if (updateData.website !== undefined)
            dataToUpdate.website = updateData.website;
        if (updateData.location !== undefined)
            dataToUpdate.location = updateData.location;
        if (updateData.company_size !== undefined)
            dataToUpdate.company_size = updateData.company_size;
        if (updateData.phone !== undefined)
            dataToUpdate.phone = updateData.phone;
        if (updateData.industry_id !== undefined)
            dataToUpdate.industry_id = updateData.industry_id;
        if (updateData.founded_year !== undefined)
            dataToUpdate.founded_year = updateData.founded_year;
        if (updateData.headquarters !== undefined)
            dataToUpdate.headquarters = updateData.headquarters;
        if (socialLinks !== undefined)
            dataToUpdate.social_links = socialLinks;
        dataToUpdate.updated_at = new Date();
        const employerProfile = await prisma.employerProfile.updateMany({
            where: { user_id: userId },
            data: dataToUpdate
        });
        if (employerProfile.count === 0) {
            res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
            return;
        }
        const updatedProfile = await prisma.employerProfile.findFirst({
            where: { user_id: userId },
            include: {
                industry: true
            }
        });
        res.json({
            success: true,
            data: updatedProfile,
            message: 'Company profile updated successfully'
        });
    }
    catch (error) {
        console.error('Error in updateCompanyProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateCompanyProfile = updateCompanyProfile;
