"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplications = exports.bulkUpdateUserStatus = exports.bulkDeleteJobs = exports.getAnalytics = exports.deleteJob = exports.updateJobStatus = exports.getJobById = exports.getAllJobs = exports.deleteUser = exports.resetPassword = exports.updateUser = exports.updateUserStatus = exports.getUserById = exports.getAllUsers = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// Helper to get user from request
const getUserId = (req) => {
    return req.user?.id;
};
// ========== DASHBOARD STATISTICS ==========
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalJobSeekers, totalEmployers, totalJobs, totalApplications, openJobs, recentUsers, recentJobs, recentApplications] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { user_type: { type_name: 'Job Seeker' } } }),
            prisma.user.count({ where: { user_type: { type_name: 'Employer' } } }),
            prisma.jobPost.count(),
            prisma.jobApplication.count(),
            prisma.jobPost.count({ where: { status: { status_name: 'Open' } } }),
            prisma.user.findMany({
                take: 5,
                orderBy: { created_at: 'desc' },
                include: { user_type: true }
            }),
            prisma.jobPost.findMany({
                take: 5,
                orderBy: { created_at: 'desc' },
                include: { employer: true, status: true }
            }),
            prisma.jobApplication.findMany({
                take: 5,
                orderBy: { applied_at: 'desc' },
                include: { job: true, seeker: true, status: true }
            })
        ]);
        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalJobSeekers,
                    totalEmployers,
                    totalJobs,
                    totalApplications,
                    openJobs
                },
                recentUsers,
                recentJobs,
                recentApplications
            }
        });
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
// ========== USER MANAGEMENT ==========
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search, is_active } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (role && role !== 'all') {
            where.user_type = { type_name: role };
        }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { full_name: { contains: search, mode: 'insensitive' } },
                { employer_profile: { company_name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (is_active !== undefined && is_active !== 'all') {
            where.is_active = is_active === 'true';
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    user_type: true,
                    seeker_profile: true,
                    employer_profile: true
                },
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        // Add job and application counts to each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            let jobsCount = 0;
            let appsCount = 0;
            // Count jobs for employers
            if (user.employer_profile) {
                jobsCount = await prisma.jobPost.count({
                    where: { employer_id: user.employer_profile.id }
                });
            }
            // Count applications for job seekers
            if (user.seeker_profile) {
                appsCount = await prisma.jobApplication.count({
                    where: { seeker_id: user.seeker_profile.id }
                });
            }
            // Remove password from response
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                stats: {
                    jobs_count: jobsCount,
                    applications_count: appsCount
                }
            };
        }));
        // Calculate summary stats for the frontend cards
        const summaryStats = {
            total: usersWithStats.length,
            active: usersWithStats.filter(u => u.is_active === true).length,
            suspended: usersWithStats.filter(u => u.is_active === false).length,
            jobSeekers: usersWithStats.filter(u => u.user_type?.type_name === 'Job Seeker').length,
            employers: usersWithStats.filter(u => u.user_type?.type_name === 'Employer').length,
            admins: usersWithStats.filter(u => u.user_type?.type_name === 'Admin').length,
            superAdmins: usersWithStats.filter(u => u.user_type?.type_name === 'Super Admin').length
        };
        res.json({
            success: true,
            data: usersWithStats,
            stats: summaryStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: true,
                notification_preference: true
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json({ success: true, data: userWithoutPassword });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserById = getUserById;
// ========== UPDATE USER STATUS (WITH PROTECTION AGAINST SUSPENDING SUPER ADMIN) ==========
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;
        const adminId = getUserId(req);
        // Get the target user with their role
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { user_type: true }
        });
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Get the admin user making the request
        const adminUser = await prisma.user.findUnique({
            where: { id: adminId },
            include: { user_type: true }
        });
        const adminRole = adminUser?.user_type?.type_name;
        const targetRole = targetUser.user_type?.type_name;
        // ❌ Prevent Admin from suspending or activating a Super Admin
        if (adminRole === 'Admin' && targetRole === 'Super Admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot suspend or activate a Super Admin account.'
            });
        }
        // ❌ Prevent anyone from suspending themselves
        if (userId === adminId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot suspend or activate your own account.'
            });
        }
        // Update user status
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                is_active: is_active,
                updated_at: new Date()
            },
            include: { user_type: true }
        });
        const statusMessage = is_active ? 'activated' : 'suspended';
        await prisma.notification.create({
            data: {
                user_id: userId,
                title: `Account ${statusMessage}`,
                message: `Your account has been ${statusMessage} by an administrator.`,
                type: 'account_update',
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            data: user,
            message: `User ${statusMessage} successfully`
        });
    }
    catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUserStatus = updateUserStatus;
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { full_name, phone, role } = req.body;
        const adminId = getUserId(req);
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { user_type: true }
        });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Get admin role
        const adminUser = await prisma.user.findUnique({
            where: { id: adminId },
            include: { user_type: true }
        });
        const adminRole = adminUser?.user_type?.type_name;
        const targetRole = existingUser.user_type?.type_name;
        // ❌ Prevent Admin from editing Super Admin
        if (adminRole === 'Admin' && targetRole === 'Super Admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot edit a Super Admin account.'
            });
        }
        const updateData = {
            updated_at: new Date()
        };
        if (full_name !== undefined && full_name !== existingUser.full_name) {
            updateData.full_name = full_name;
        }
        if (role && role !== existingUser.user_type?.type_name) {
            const userType = await prisma.userType.findFirst({
                where: { type_name: role }
            });
            if (userType) {
                updateData.user_type_id = userType.id;
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { user_type: true }
        });
        const { password, ...userWithoutPassword } = updatedUser;
        res.json({
            success: true,
            data: userWithoutPassword,
            message: 'User updated successfully'
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUser = updateUser;
const resetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        const adminId = getUserId(req);
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { user_type: true }
        });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Get admin role
        const adminUser = await prisma.user.findUnique({
            where: { id: adminId },
            include: { user_type: true }
        });
        const adminRole = adminUser?.user_type?.type_name;
        const targetRole = existingUser.user_type?.type_name;
        // ❌ Prevent Admin from resetting Super Admin password
        if (adminRole === 'Admin' && targetRole === 'Super Admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot reset password for a Super Admin account.'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                updated_at: new Date()
            }
        });
        await prisma.notification.create({
            data: {
                user_id: userId,
                title: 'Password Reset',
                message: 'An administrator has reset your password.',
                type: 'security',
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.resetPassword = resetPassword;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = getUserId(req);
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_type: true,
                seeker_profile: true,
                employer_profile: {
                    include: {
                        jobs: true
                    }
                }
            }
        });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userId === adminId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        // Get admin role
        const adminUser = await prisma.user.findUnique({
            where: { id: adminId },
            include: { user_type: true }
        });
        const adminRole = adminUser?.user_type?.type_name;
        const targetRole = existingUser.user_type?.type_name;
        // ❌ Prevent Admin from deleting Super Admin
        if (adminRole === 'Admin' && targetRole === 'Super Admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot delete a Super Admin account.'
            });
        }
        const userEmail = existingUser.email;
        const userName = existingUser.full_name;
        if (existingUser.seeker_profile) {
            await prisma.jobSeekerProfile.delete({
                where: { user_id: userId }
            });
        }
        if (existingUser.employer_profile) {
            await prisma.jobPost.deleteMany({
                where: { employer_id: existingUser.employer_profile.id }
            });
            await prisma.employerProfile.delete({
                where: { user_id: userId }
            });
        }
        await prisma.notification.deleteMany({
            where: { user_id: userId }
        });
        if (prisma.notificationPreference) {
            await prisma.notificationPreference.deleteMany({
                where: { user_id: userId }
            });
        }
        await prisma.user.delete({
            where: { id: userId }
        });
        res.json({
            success: true,
            message: `User ${userName} deleted successfully`
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteUser = deleteUser;
// ========== JOB MANAGEMENT ==========
const getAllJobs = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status && status !== 'all') {
            where.status = { status_name: status };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { employer: { company_name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const [jobs, total] = await Promise.all([
            prisma.jobPost.findMany({
                where,
                include: {
                    employer: true,
                    industry: true,
                    status: true,
                    employment_type: true
                },
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.jobPost.count({ where })
        ]);
        // Calculate job stats
        const allJobs = await prisma.jobPost.findMany({
            include: { status: true }
        });
        const jobStats = {
            total: allJobs.length,
            pending: allJobs.filter(j => j.status?.status_name === 'Pending').length,
            approved: allJobs.filter(j => j.status?.status_name === 'Open').length,
            rejected: allJobs.filter(j => j.status?.status_name === 'Rejected').length,
            closed: allJobs.filter(j => j.status?.status_name === 'Closed').length,
            draft: allJobs.filter(j => j.status?.status_name === 'Draft').length,
            archived: allJobs.filter(j => j.status?.status_name === 'Archived').length
        };
        res.json({
            success: true,
            data: jobs,
            stats: jobStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all jobs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllJobs = getAllJobs;
const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await prisma.jobPost.findUnique({
            where: { id: jobId },
            include: {
                employer: true,
                industry: true,
                employment_type: true,
                status: true,
                applications: {
                    include: {
                        seeker: true,
                        status: true
                    },
                    take: 10
                }
            }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.json({ success: true, data: job });
    }
    catch (error) {
        console.error('Get job by ID error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getJobById = getJobById;
const updateJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status_name } = req.body;
        const adminId = getUserId(req);
        const status = await prisma.jobPostStatus.findFirst({
            where: { status_name: status_name }
        });
        if (!status) {
            return res.status(404).json({ success: false, message: 'Status not found' });
        }
        const job = await prisma.jobPost.update({
            where: { id: jobId },
            data: {
                status_id: status.id,
                updated_at: new Date()
            },
            include: { employer: true, status: true }
        });
        await prisma.notification.create({
            data: {
                user_id: job.employer.user_id,
                title: `Job ${status_name}`,
                message: `Your job "${job.title}" has been ${status_name?.toLowerCase()} by admin.`,
                type: 'job_update',
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            data: job,
            message: `Job ${status_name?.toLowerCase()} successfully`
        });
    }
    catch (error) {
        console.error('Update job status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateJobStatus = updateJobStatus;
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const adminId = getUserId(req);
        const job = await prisma.jobPost.findUnique({
            where: { id: jobId },
            include: { employer: true }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        await prisma.jobPost.delete({
            where: { id: jobId }
        });
        res.json({ success: true, message: 'Job deleted successfully' });
    }
    catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteJob = deleteJob;
// ========== ANALYTICS ==========
const getAnalytics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dailyJobsRaw = await prisma.$queryRaw `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM "JobPost"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
        const topIndustries = await prisma.jobIndustry.findMany({
            include: {
                jobs: {
                    where: { created_at: { gte: thirtyDaysAgo } }
                }
            },
            take: 5
        });
        const topEmployers = await prisma.employerProfile.findMany({
            include: {
                jobs: {
                    where: { created_at: { gte: thirtyDaysAgo } }
                }
            },
            take: 5,
            orderBy: { jobs: { _count: 'desc' } }
        });
        const applicationStatuses = await prisma.jobApplicationStatus.findMany({
            include: {
                _count: {
                    select: { applications: true }
                }
            }
        });
        const formattedAppStats = applicationStatuses.map(status => ({
            status: status.status_name,
            count: status._count.applications
        }));
        const dailyJobs = dailyJobsRaw.map(row => ({
            date: row.date,
            count: Number(row.count)
        }));
        res.json({
            success: true,
            data: {
                period: '30 days',
                dailyJobs,
                topIndustries: topIndustries.map(i => ({
                    name: i.industry_name,
                    jobCount: i.jobs.length
                })),
                topEmployers: topEmployers.map(e => ({
                    name: e.company_name,
                    jobCount: e.jobs.length
                })),
                applicationStats: formattedAppStats
            }
        });
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAnalytics = getAnalytics;
// ========== BULK ACTIONS ==========
const bulkDeleteJobs = async (req, res) => {
    try {
        const { jobIds } = req.body;
        const adminId = getUserId(req);
        if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No job IDs provided' });
        }
        const result = await prisma.jobPost.deleteMany({
            where: { id: { in: jobIds } }
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.count} jobs`
        });
    }
    catch (error) {
        console.error('Bulk delete jobs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.bulkDeleteJobs = bulkDeleteJobs;
const bulkUpdateUserStatus = async (req, res) => {
    try {
        const { userIds, is_active } = req.body;
        const adminId = getUserId(req);
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No user IDs provided' });
        }
        // Get admin role
        const adminUser = await prisma.user.findUnique({
            where: { id: adminId },
            include: { user_type: true }
        });
        const adminRole = adminUser?.user_type?.type_name;
        // Check if any of the target users are Super Admins
        const targetUsers = await prisma.user.findMany({
            where: { id: { in: userIds } },
            include: { user_type: true }
        });
        const hasSuperAdmin = targetUsers.some(u => u.user_type?.type_name === 'Super Admin');
        // ❌ Prevent Admin from bulk updating Super Admins
        if (adminRole === 'Admin' && hasSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot perform bulk actions on Super Admin accounts.'
            });
        }
        const result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { is_active, updated_at: new Date() }
        });
        for (const userId of userIds) {
            await prisma.notification.create({
                data: {
                    user_id: userId,
                    title: `Account ${is_active ? 'Activated' : 'Suspended'}`,
                    message: `Your account has been ${is_active ? 'activated' : 'suspended'} by an administrator.`,
                    type: 'account_update',
                    created_at: new Date()
                }
            });
        }
        res.json({
            success: true,
            message: `Successfully updated ${result.count} users`
        });
    }
    catch (error) {
        console.error('Bulk update users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.bulkUpdateUserStatus = bulkUpdateUserStatus;
// ========== APPLICATION MANAGEMENT ==========
const getApplications = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, company, date_range } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * pageSize;
        const where = {};
        // Search by applicant name, email, or job title
        if (search) {
            where.OR = [
                { seeker: { full_name: { contains: search, mode: 'insensitive' } } },
                { seeker: { user: { email: { contains: search, mode: 'insensitive' } } } },
                { job: { title: { contains: search, mode: 'insensitive' } } }
            ];
        }
        // Filter by status
        if (status && status !== 'all') {
            where.status = { status_name: status };
        }
        // Filter by company
        if (company && company !== 'all') {
            where.job = { employer: { company_name: company } };
        }
        // Filter by date range
        if (date_range && date_range !== 'all') {
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            switch (date_range) {
                case 'today':
                    where.applied_at = { gte: startOfDay };
                    break;
                case 'week':
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    where.applied_at = { gte: weekAgo };
                    break;
                case 'month':
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    where.applied_at = { gte: monthAgo };
                    break;
            }
        }
        // Fetch paginated applications
        const [applications, total] = await Promise.all([
            prisma.jobApplication.findMany({
                where,
                include: {
                    job: {
                        include: {
                            employer: {
                                include: {
                                    user: {
                                        select: { email: true, full_name: true }
                                    }
                                }
                            },
                            status: true
                        }
                    },
                    seeker: {
                        include: {
                            user: {
                                select: { email: true, full_name: true }
                            }
                        }
                    },
                    status: true
                },
                orderBy: { applied_at: 'desc' },
                skip,
                take: pageSize
            }),
            prisma.jobApplication.count({ where })
        ]);
        // Get statistics
        const stats = await prisma.jobApplicationStatus.findMany({
            include: {
                _count: {
                    select: { applications: true }
                }
            }
        });
        const statsFormatted = {
            total: total,
            pending: stats.find(s => s.status_name === 'Pending')?._count.applications || 0,
            reviewed: stats.find(s => s.status_name === 'Reviewed')?._count.applications || 0,
            shortlisted: stats.find(s => s.status_name === 'Shortlisted')?._count.applications || 0,
            interview: stats.find(s => s.status_name === 'Interview')?._count.applications || 0,
            accepted: stats.find(s => s.status_name === 'Accepted')?._count.applications || 0,
            rejected: stats.find(s => s.status_name === 'Rejected')?._count.applications || 0
        };
        const totalPages = Math.ceil(total / pageSize);
        res.json({
            success: true,
            data: applications,
            pagination: {
                current_page: pageNum,
                pages: totalPages,
                total: total,
                limit: pageSize
            },
            stats: statsFormatted
        });
    }
    catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getApplications = getApplications;
// Update application status (admin version)
const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, note } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        // Find the status by name
        const statusRecord = await prisma.jobApplicationStatus.findFirst({
            where: { status_name: status }
        });
        if (!statusRecord) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const application = await prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: { job: true, seeker: true, status: true }
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        const updatedApplication = await prisma.jobApplication.update({
            where: { id: applicationId },
            data: {
                status_id: statusRecord.id,
                employer_notes: note || null,
                updated_at: new Date()
            },
            include: {
                job: {
                    include: {
                        employer: {
                            include: {
                                user: {
                                    select: { email: true, full_name: true }
                                }
                            }
                        }
                    }
                },
                seeker: {
                    include: {
                        user: {
                            select: { email: true, full_name: true }
                        }
                    }
                },
                status: true
            }
        });
        // Send notification to applicant
        await prisma.notification.create({
            data: {
                user_id: application.seeker.user_id,
                title: 'Application Status Updated',
                message: `Your application for ${application.job.title} has been updated to ${status}`,
                type: 'status_change',
                created_at: new Date()
            }
        });
        res.json({
            success: true,
            data: updatedApplication,
            message: `Application status updated to ${status}`
        });
    }
    catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
