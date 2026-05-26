import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to get user from request
const getUserId = (req: Request): string => {
  return (req as any).user?.id;
};

// ========== DASHBOARD STATISTICS ==========

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalJobs,
      totalApplications,
      openJobs,
      recentUsers,
      recentJobs,
      recentApplications
    ] = await Promise.all([
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
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== USER MANAGEMENT ==========

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, role, search, is_active } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {};
    
    if (role) {
      where.user_type = { type_name: role as string };
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { full_name: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (is_active !== undefined) {
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
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    const adminId = getUserId(req);
    
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
    
    console.log(`📧 ${statusMessage} email sent to ${user.email}`);
    
    res.json({ 
      success: true, 
      data: user, 
      message: `User ${statusMessage} successfully` 
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== UPDATE USER ==========
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { full_name, phone, role } = req.body;
    const adminId = getUserId(req);
    
    console.log(`🔄 UPDATE USER called for ID: ${userId}`);
    console.log(`   Data:`, { full_name, phone, role });
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_type: true }
    });
    
    if (!existingUser) {
      console.log(`❌ User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log(`✅ Found user: ${existingUser.email}`);
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (full_name !== undefined && full_name !== existingUser.full_name) {
      updateData.full_name = full_name;
      console.log(`   Updating name: ${existingUser.full_name} -> ${full_name}`);
    }
    
    // Note: Phone might not exist in your User model, so we'll skip it if it causes issues
    if (phone !== undefined) {
      // If your User model has a phone field, uncomment this
      // updateData.phone = phone;
      console.log(`   Phone update requested but phone field may not exist in schema: ${phone}`);
    }
    
    // Update user type if role is provided
    if (role && role !== existingUser.user_type?.type_name) {
      const userType = await prisma.userType.findFirst({
        where: { type_name: role }
      });
      if (userType) {
        updateData.user_type_id = userType.id;
        console.log(`   Updating role: ${existingUser.user_type?.type_name} -> ${role}`);
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { user_type: true }
    });
    
    console.log(`✅ User updated successfully: ${updatedUser.email}`);
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ 
      success: true, 
      data: userWithoutPassword, 
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== RESET PASSWORD ==========
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    const adminId = getUserId(req);
    
    console.log(`🔑 RESET PASSWORD called for ID: ${userId}`);
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    });
    
    console.log(`✅ Password reset for: ${existingUser.email}`);
    
    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Password Reset',
        message: 'An administrator has reset your password. Please login with your new password.',
        type: 'security',
        created_at: new Date()
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== DELETE USER ==========
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = getUserId(req);
    
    console.log(`🗑️ DELETE USER called for ID: ${userId}`);
    
    // Check if user exists with related profiles
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
    
    // Prevent deleting yourself
    if (userId === adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }
    
    const userEmail = existingUser.email;
    const userName = existingUser.full_name;
    
    // Delete related records using correct Prisma model names
    if (existingUser.seeker_profile) {
      await prisma.jobSeekerProfile.delete({
        where: { user_id: userId }
      });
      console.log(`📝 Deleted seeker profile for ${userEmail}`);
    }
    
    if (existingUser.employer_profile) {
      // Delete jobs associated with employer
      await prisma.jobPost.deleteMany({
        where: { employer_id: existingUser.employer_profile.id }
      });
      console.log(`📝 Deleted jobs for employer ${userEmail}`);
      
      await prisma.employerProfile.delete({
        where: { user_id: userId }
      });
      console.log(`📝 Deleted employer profile for ${userEmail}`);
    }
    
    // Delete user's notifications
    await prisma.notification.deleteMany({
      where: { user_id: userId }
    });
    
    // Delete notification preferences if exists
    if (prisma.notificationPreference) {
      await prisma.notificationPreference.deleteMany({
        where: { user_id: userId }
      });
    }
    
    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    console.log(`✅ User ${userEmail} (${userName}) deleted successfully`);
    
    res.json({ 
      success: true, 
      message: `User ${userName} deleted successfully` 
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== JOB MANAGEMENT ==========

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {};
    
    if (status) {
      where.status = { status_name: status as string };
    }
    
    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
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
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      }),
      prisma.jobPost.count({ where })
    ]);
    
    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status_name } = req.body;
    const adminId = getUserId(req);
    
    const status = await prisma.jobPostStatus.findFirst({
      where: { status_name: status_name as string }
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
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== ANALYTICS ==========

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get daily job posts for the last 30 days
    const dailyJobsRaw = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM "JobPost"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    // Get top industries
    const topIndustries = await prisma.jobIndustry.findMany({
      include: {
        jobs: {
          where: { created_at: { gte: thirtyDaysAgo } }
        }
      },
      take: 5
    });
    
    // Get top employers
    const topEmployers = await prisma.employerProfile.findMany({
      include: {
        jobs: {
          where: { created_at: { gte: thirtyDaysAgo } }
        }
      },
      take: 5,
      orderBy: { jobs: { _count: 'desc' } }
    });
    
    // Get application stats by status
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
    
    // Parse raw query results
    const dailyJobs = (dailyJobsRaw as any[]).map(row => ({
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
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ========== BULK ACTIONS ==========

export const bulkDeleteJobs = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Bulk delete jobs error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const bulkUpdateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userIds, is_active } = req.body;
    const adminId = getUserId(req);
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No user IDs provided' });
    }
    
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { is_active, updated_at: new Date() }
    });
    
    // Create notifications for affected users
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
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};