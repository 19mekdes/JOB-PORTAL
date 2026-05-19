"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const client_1 = require("@prisma/client");
const errorMiddleware_js_1 = require("../middleware/errorMiddleware.js");
const prisma = new client_1.PrismaClient();
// ========== APPLICATION SERVICE ==========
class ApplicationService {
    constructor() {
        this.prisma = prisma;
    }
    // ========== APPLY FOR JOB ==========
    async applyForJob(seekerUserId, jobId, coverLetter, resumeUrl) {
        // Get job seeker profile
        const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: seekerUserId }
        });
        if (!seekerProfile) {
            throw new errorMiddleware_js_1.ValidationError('Job seeker profile not found. Please complete your profile first.');
        }
        // Check if job exists and is open
        const job = await this.prisma.jobPost.findFirst({
            where: {
                id: jobId,
                status: { status_name: 'Open' }
            },
            include: {
                employer: {
                    include: { user: true }
                }
            }
        });
        if (!job) {
            throw new errorMiddleware_js_1.NotFoundError('Job not found or is no longer accepting applications');
        }
        // Check if already applied
        const existingApplication = await this.prisma.jobApplication.findFirst({
            where: {
                job_id: jobId,
                seeker_id: seekerProfile.id
            }
        });
        if (existingApplication) {
            throw new errorMiddleware_js_1.ValidationError('You have already applied for this job');
        }
        // Get pending status
        const pendingStatus = await this.prisma.jobApplicationStatus.findFirst({
            where: { status_name: 'Pending' }
        });
        if (!pendingStatus) {
            throw new errorMiddleware_js_1.ValidationError('Application status configuration error');
        }
        // Create application
        const application = await this.prisma.jobApplication.create({
            data: {
                job_id: jobId,
                seeker_id: seekerProfile.id,
                cover_letter: coverLetter || null,
                resume_url: resumeUrl || seekerProfile.resume_url,
                status_id: pendingStatus.id
            },
            include: {
                job: {
                    include: {
                        employer: true,
                        industry: true,
                        employment_type: true
                    }
                },
                status: true
            }
        });
        // Update job applications count
        await this.prisma.jobPost.update({
            where: { id: jobId },
            data: { applications_count: { increment: 1 } }
        });
        // Create notification for employer
        await this.prisma.notification.create({
            data: {
                user_id: job.employer.user.id,
                title: 'New Application Received',
                message: `${seekerProfile.full_name} applied for "${job.title}"`,
                type: 'application_received'
            }
        });
        // Create notification for job seeker (confirmation)
        await this.prisma.notification.create({
            data: {
                user_id: seekerUserId,
                title: 'Application Submitted',
                message: `Your application for "${job.title}" has been submitted successfully.`,
                type: 'application_submitted'
            }
        });
        return application;
    }
    // ========== GET APPLICATIONS BY JOB SEEKER ==========
    async getMyApplications(seekerUserId, filters = {}) {
        const { status, page = 1, limit = 10, sort = 'recent' } = filters;
        const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: seekerUserId }
        });
        if (!seekerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile not found');
        }
        const where = {
            seeker_id: seekerProfile.id
        };
        if (status) {
            where.status = { status_name: status };
        }
        const orderBy = sort === 'recent'
            ? { applied_at: 'desc' }
            : { applied_at: 'asc' };
        const skip = (page - 1) * limit;
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                include: {
                    job: {
                        include: {
                            employer: {
                                include: {
                                    user: true
                                }
                            },
                            industry: true,
                            employment_type: true
                        }
                    },
                    status: true,
                    notes: {
                        include: {
                            employer: {
                                include: {
                                    user: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' },
                        take: 3
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            this.prisma.jobApplication.count({ where })
        ]);
        // Get application statistics
        const stats = await this.getApplicationStatsForSeeker(seekerProfile.id);
        return {
            applications,
            statistics: stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    // ========== GET APPLICATION BY ID ==========
    async getApplicationById(applicationId, userId, userRole) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    include: {
                        employer: {
                            include: {
                                user: true,
                                industry: true
                            }
                        },
                        industry: true,
                        employment_type: true
                    }
                },
                seeker: {
                    include: {
                        user: true
                    }
                },
                status: true,
                notes: {
                    include: {
                        employer: {
                            include: {
                                user: true
                            }
                        }
                    },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        if (!application) {
            throw new errorMiddleware_js_1.NotFoundError('Application');
        }
        // Check authorization
        const isOwner = application.seeker.user_id === userId;
        const isEmployer = application.job.employer.user_id === userId;
        const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';
        if (!isOwner && !isEmployer && !isAdmin) {
            throw new errorMiddleware_js_1.AppError('Not authorized to view this application', 403);
        }
        return application;
    }
    // ========== GET JOB APPLICATIONS (EMPLOYER) ==========
    async getJobApplications(employerUserId, jobId, filters = {}) {
        const { status, page = 1, limit = 10, sort = 'recent' } = filters;
        // Verify employer owns this job
        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: employerUserId }
        });
        if (!employerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile not found');
        }
        const job = await this.prisma.jobPost.findFirst({
            where: {
                id: jobId,
                employer_id: employerProfile.id
            }
        });
        if (!job) {
            throw new errorMiddleware_js_1.AppError('Not authorized to view applications for this job', 403);
        }
        const where = {
            job_id: jobId
        };
        if (status) {
            where.status = { status_name: status };
        }
        const orderBy = sort === 'recent'
            ? { applied_at: 'desc' }
            : { applied_at: 'asc' };
        const skip = (page - 1) * limit;
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                include: {
                    seeker: {
                        include: {
                            user: true
                        }
                    },
                    status: true,
                    notes: {
                        include: {
                            employer: {
                                include: {
                                    user: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            this.prisma.jobApplication.count({ where })
        ]);
        // Get statistics for this job
        const stats = await this.getApplicationStatsForJob(jobId);
        return {
            applications,
            statistics: stats,
            job_title: job.title,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    // ========== UPDATE APPLICATION STATUS ==========
    async updateApplicationStatus(employerUserId, applicationId, status, feedback) {
        // Verify employer owns this application
        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: employerUserId }
        });
        if (!employerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile not found');
        }
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    include: {
                        employer: true
                    }
                },
                seeker: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!application || application.job.employer_id !== employerProfile.id) {
            throw new errorMiddleware_js_1.AppError('Not authorized to update this application', 403);
        }
        const statusObj = await this.prisma.jobApplicationStatus.findFirst({
            where: { status_name: status }
        });
        if (!statusObj) {
            throw new errorMiddleware_js_1.ValidationError('Invalid status');
        }
        // Don't allow updating if already in final state
        const finalStatuses = ['Accepted', 'Rejected'];
        const currentStatus = await this.prisma.jobApplicationStatus.findUnique({
            where: { id: application.status_id }
        });
        if (finalStatuses.includes(currentStatus.status_name)) {
            throw new errorMiddleware_js_1.ValidationError(`Cannot update an application that is already ${currentStatus.status_name.toLowerCase()}`);
        }
        const updatedApplication = await this.prisma.jobApplication.update({
            where: { id: applicationId },
            data: { status_id: statusObj.id },
            include: {
                status: true,
                job: true
            }
        });
        // Create notification for job seeker
        let notificationMessage = `Your application for "${application.job.title}" has been ${status.toLowerCase()}`;
        if (feedback) {
            notificationMessage += `. Feedback: ${feedback}`;
        }
        await this.prisma.notification.create({
            data: {
                user_id: application.seeker.user.id,
                title: `Application ${status}`,
                message: notificationMessage,
                type: 'status_change'
            }
        });
        // If feedback provided, add as note
        if (feedback) {
            await this.addApplicationNote(employerUserId, applicationId, `Status updated to ${status}: ${feedback}`);
        }
        return updatedApplication;
    }
    // ========== ADD APPLICATION NOTE ==========
    async addApplicationNote(employerUserId, applicationId, noteText) {
        if (!noteText || noteText.trim() === '') {
            throw new errorMiddleware_js_1.ValidationError('Note text is required');
        }
        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: employerUserId }
        });
        if (!employerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile not found');
        }
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: true
            }
        });
        if (!application || application.job.employer_id !== employerProfile.id) {
            throw new errorMiddleware_js_1.AppError('Not authorized to add notes to this application', 403);
        }
        const note = await this.prisma.jobApplicationNote.create({
            data: {
                application_id: applicationId,
                employer_id: employerProfile.id,
                note_text: noteText
            },
            include: {
                employer: {
                    include: {
                        user: true
                    }
                }
            }
        });
        return note;
    }
    // ========== GET APPLICATION NOTES ==========
    async getApplicationNotes(employerUserId, applicationId) {
        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: employerUserId }
        });
        if (!employerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile not found');
        }
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: true
            }
        });
        if (!application || application.job.employer_id !== employerProfile.id) {
            throw new errorMiddleware_js_1.AppError('Not authorized to view notes for this application', 403);
        }
        const notes = await this.prisma.jobApplicationNote.findMany({
            where: { application_id: applicationId },
            include: {
                employer: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        return notes;
    }
    // ========== WITHDRAW APPLICATION ==========
    async withdrawApplication(seekerUserId, applicationId) {
        const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
            where: { user_id: seekerUserId }
        });
        if (!seekerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Job seeker profile not found');
        }
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    include: {
                        employer: {
                            include: { user: true }
                        }
                    }
                }
            }
        });
        if (!application || application.seeker_id !== seekerProfile.id) {
            throw new errorMiddleware_js_1.AppError('Not authorized to withdraw this application', 403);
        }
        // Check if application is already in final state
        const finalStatuses = ['Accepted', 'Rejected'];
        const currentStatus = await this.prisma.jobApplicationStatus.findUnique({
            where: { id: application.status_id }
        });
        if (finalStatuses.includes(currentStatus.status_name)) {
            throw new errorMiddleware_js_1.ValidationError(`Cannot withdraw an application that is ${currentStatus.status_name.toLowerCase()}`);
        }
        // Delete the application
        await this.prisma.jobApplication.delete({
            where: { id: applicationId }
        });
        // Update job applications count
        await this.prisma.jobPost.update({
            where: { id: application.job_id },
            data: { applications_count: { decrement: 1 } }
        });
        // Notify employer
        await this.prisma.notification.create({
            data: {
                user_id: application.job.employer.user.id,
                title: 'Application Withdrawn',
                message: `A candidate has withdrawn their application for "${application.job.title}"`,
                type: 'application_withdrawn'
            }
        });
        return { message: 'Application withdrawn successfully' };
    }
    // ========== GET APPLICATION STATISTICS FOR SEEKER ==========
    async getApplicationStatsForSeeker(seekerId) {
        const stats = await this.prisma.jobApplication.groupBy({
            by: ['status_id'],
            where: { seeker_id: seekerId },
            _count: true
        });
        const statuses = await this.prisma.jobApplicationStatus.findMany();
        const byStatus = statuses.map(s => ({
            status: s.status_name,
            count: stats.find(stat => stat.status_id === s.id)?._count || 0
        }));
        const total = byStatus.reduce((sum, s) => sum + s.count, 0);
        // Get monthly statistics
        const monthlyStats = await this.prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('month', applied_at) as month,
        COUNT(*) as count
      FROM "JobApplication"
      WHERE seeker_id = ${seekerId}
      GROUP BY DATE_TRUNC('month', applied_at)
      ORDER BY month DESC
      LIMIT 6
    `;
        const byMonth = monthlyStats.map(stat => ({
            month: new Date(stat.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            count: Number(stat.count)
        }));
        return {
            total,
            byStatus,
            byMonth
        };
    }
    // ========== GET APPLICATION STATISTICS FOR JOB ==========
    async getApplicationStatsForJob(jobId) {
        const stats = await this.prisma.jobApplication.groupBy({
            by: ['status_id'],
            where: { job_id: jobId },
            _count: true
        });
        const statuses = await this.prisma.jobApplicationStatus.findMany();
        const byStatus = statuses.map(s => ({
            status: s.status_name,
            count: stats.find(stat => stat.status_id === s.id)?._count || 0
        }));
        const total = byStatus.reduce((sum, s) => sum + s.count, 0);
        return {
            total,
            byStatus,
            byMonth: []
        };
    }
    // ========== GET ALL APPLICATIONS (ADMIN) ==========
    async getAllApplications(filters = {}) {
        const { status, job_id, page = 1, limit = 20, sort = 'recent' } = filters;
        const where = {};
        if (status) {
            where.status = { status_name: status };
        }
        if (job_id) {
            where.job_id = job_id;
        }
        const orderBy = sort === 'recent'
            ? { applied_at: 'desc' }
            : { applied_at: 'asc' };
        const skip = (page - 1) * limit;
        const [applications, total] = await Promise.all([
            this.prisma.jobApplication.findMany({
                where,
                include: {
                    job: {
                        include: {
                            employer: { include: { user: true } }
                        }
                    },
                    seeker: { include: { user: true } },
                    status: true,
                    notes: {
                        include: { employer: { include: { user: true } } }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            this.prisma.jobApplication.count({ where })
        ]);
        return {
            applications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    // ========== BULK STATUS UPDATE ==========
    async bulkUpdateStatus(employerUserId, applicationIds, status) {
        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: employerUserId }
        });
        if (!employerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile not found');
        }
        const statusObj = await this.prisma.jobApplicationStatus.findFirst({
            where: { status_name: status }
        });
        if (!statusObj) {
            throw new errorMiddleware_js_1.ValidationError('Invalid status');
        }
        // Verify all applications belong to employer
        const applications = await this.prisma.jobApplication.findMany({
            where: {
                id: { in: applicationIds },
                job: { employer_id: employerProfile.id }
            },
            include: {
                job: true,
                seeker: { include: { user: true } }
            }
        });
        if (applications.length !== applicationIds.length) {
            throw new errorMiddleware_js_1.AppError('Some applications are not authorized for bulk update', 403);
        }
        // Update all applications
        const result = await this.prisma.jobApplication.updateMany({
            where: {
                id: { in: applicationIds }
            },
            data: { status_id: statusObj.id }
        });
        // Create notifications for all applicants
        for (const application of applications) {
            await this.prisma.notification.create({
                data: {
                    user_id: application.seeker.user.id,
                    title: `Application ${status}`,
                    message: `Your application for "${application.job.title}" has been ${status.toLowerCase()}`,
                    type: 'status_change'
                }
            });
        }
        return {
            updated_count: result.count,
            message: `${result.count} applications updated to ${status}`
        };
    }
    // ========== EXPORT APPLICATIONS TO CSV ==========
    async exportApplicationsToCSV(employerUserId, jobId) {
        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { user_id: employerUserId }
        });
        if (!employerProfile) {
            throw new errorMiddleware_js_1.NotFoundError('Employer profile not found');
        }
        const where = {
            job: { employer_id: employerProfile.id }
        };
        if (jobId) {
            where.job_id = jobId;
        }
        const applications = await this.prisma.jobApplication.findMany({
            where,
            include: {
                job: true,
                seeker: {
                    include: {
                        user: true
                    }
                },
                status: true
            },
            orderBy: { applied_at: 'desc' }
        });
        // Convert to CSV format
        const headers = [
            'Application ID',
            'Job Title',
            'Applicant Name',
            'Applicant Email',
            'Phone',
            'Location',
            'Skills',
            'Status',
            'Applied Date',
            'Resume URL'
        ];
        const rows = applications.map(app => [
            app.id,
            app.job.title,
            app.seeker.full_name,
            app.seeker.user.email,
            app.seeker.phone || '',
            app.seeker.location || '',
            (app.seeker.skills || []).join('; '),
            app.status.status_name,
            new Date(app.applied_at).toLocaleDateString(),
            app.resume_url || ''
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        return {
            csv: csvContent,
            filename: `applications_${new Date().toISOString()}.csv`,
            count: applications.length
        };
    }
}
exports.ApplicationService = ApplicationService;
// ========== DEFAULT EXPORT ==========
exports.default = new ApplicationService();
