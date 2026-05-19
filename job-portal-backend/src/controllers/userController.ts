import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

// Helper to get user from request
const getUserId = (req: Request): string => {
  return (req as any).user?.id;
};

// ========== PROFILE MANAGEMENT ==========

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: {
          include: {
            industry: true
          }
        },
        notification_preference: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { full_name, phone, location, education, experience } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_type: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.user_type.type_name === 'Job Seeker') {
      await prisma.jobSeekerProfile.update({
        where: { user_id: userId },
        data: {
          full_name: full_name || undefined,
          phone: phone || undefined,
          location: location || undefined,
          education: education || undefined,
          experience: experience || undefined
        }
      });
    } else if (user.user_type.type_name === 'Employer') {
      await prisma.employerProfile.update({
        where: { user_id: userId },
        data: {
          company_name: full_name || undefined,
          location: location || undefined
        }
      });
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, updated_at: new Date() }
    });
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: false, updated_at: new Date() }
    });
    
    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== JOB SEEKER SPECIFIC ==========

export const getJobSeekerProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            email: true,
            created_at: true,
            is_active: true
          }
        },
        applications: {
          include: {
            job: {
              include: {
                employer: true,
                industry: true
              }
            },
            status: true
          },
          orderBy: { applied_at: 'desc' },
          take: 10
        },
        bookmarks: {
          include: {
            job: {
              include: {
                employer: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get job seeker profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateJobSeekerProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { full_name, phone, location, skills, experience, education, resume_url } = req.body;
    
    const profile = await prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: {
        full_name: full_name || undefined,
        phone: phone || undefined,
        location: location || undefined,
        skills: skills || undefined,
        experience: experience || undefined,
        education: education || undefined,
        resume_url: resume_url || undefined
      }
    });
    
    res.json({ success: true, data: profile, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update job seeker profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload resume - fix for file upload
export const uploadResume = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const resumeUrl = `/uploads/resumes/${file.filename}`;
    
    const profile = await prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { resume_url: resumeUrl }
    });
    
    res.json({ 
      success: true, 
      data: { resume_url: resumeUrl },
      message: 'Resume uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { user_id: userId }
    });
    
    if (profile?.resume_url) {
      const filePath = `.${profile.resume_url}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await prisma.jobSeekerProfile.update({
      where: { user_id: userId },
      data: { resume_url: null }
    });
    
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSavedJobs = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    });
    
    if (!seeker) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    const bookmarks = await prisma.jobBookmark.findMany({
      where: { seeker_id: seeker.id },
      include: {
        job: {
          include: {
            employer: true,
            industry: true,
            employment_type: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    res.json({ success: true, data: bookmarks });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationStats = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    });
    
    if (!seeker) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    const stats = await prisma.jobApplication.groupBy({
      by: ['status_id'],
      where: { seeker_id: seeker.id },
      _count: true
    });
    
    const statuses = await prisma.jobApplicationStatus.findMany();
    
    const formattedStats = stats.map(stat => {
      const status = statuses.find(s => s.id === stat.status_id);
      return {
        status: status?.status_name || 'Unknown',
        count: stat._count
      };
    });
    
    const total = formattedStats.reduce((sum, s) => sum + s.count, 0);
    
    res.json({ 
      success: true, 
      data: { 
        total_applications: total,
        breakdown: formattedStats 
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== EMPLOYER SPECIFIC ==========

export const getEmployerProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const profile = await prisma.employerProfile.findUnique({
      where: { user_id: userId },
      include: {
        industry: true,
        user: {
          select: {
            email: true,
            created_at: true,
            is_active: true
          }
        },
        jobs: {
          include: {
            status: true,
            applications: {
              include: {
                status: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get employer profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployerProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { company_name, company_description, website, industry_id, company_size, location } = req.body;
    
    const profile = await prisma.employerProfile.update({
      where: { user_id: userId },
      data: {
        company_name: company_name || undefined,
        company_description: company_description || undefined,
        website: website || undefined,
        industry_id: industry_id || undefined,
        company_size: company_size || undefined,
        location: location || undefined
      }
    });
    
    res.json({ success: true, data: profile, message: 'Company profile updated successfully' });
  } catch (error) {
    console.error('Update employer profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload company logo - fix for file upload
export const uploadCompanyLogo = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const logoUrl = `/uploads/logos/${file.filename}`;
    
    const profile = await prisma.employerProfile.update({
      where: { user_id: userId },
      data: { logo_url: logoUrl }
    });
    
    res.json({ 
      success: true, 
      data: { logo_url: logoUrl },
      message: 'Logo uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyJobs = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const employer = await prisma.employerProfile.findFirst({
      where: { user_id: userId }
    });
    
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer profile not found' });
    }
    
    const where: any = { employer_id: employer.id };
    if (status) {
      where.status = { status_name: status as string };
    }
    
    const [jobs, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        include: {
          industry: true,
          employment_type: true,
          status: true,
          _count: {
            select: { applications: true }
          }
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
    console.error('Get company jobs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyApplicants = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { jobId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const employer = await prisma.employerProfile.findFirst({
      where: { user_id: userId }
    });
    
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer profile not found' });
    }
    
    const where: any = {
      job: { employer_id: employer.id }
    };
    
    if (jobId) {
      where.job_id = jobId as string;
    }
    
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          seeker: true,
          job: true,
          status: true,
          notes: {
            where: { employer_id: employer.id }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { applied_at: 'desc' }
      }),
      prisma.jobApplication.count({ where })
    ]);
    
    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get company applicants error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const employer = await prisma.employerProfile.findFirst({
      where: { user_id: userId }
    });
    
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer profile not found' });
    }
    
    const jobs = await prisma.jobPost.findMany({
      where: { employer_id: employer.id },
      include: {
        status: true,
        applications: {
          include: {
            status: true
          }
        }
      }
    });
    
    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((sum, job) => sum + job.applications.length, 0);
    const activeJobs = jobs.filter(job => job.status?.status_name === 'Open').length;
    
    const applicationsByStatus: Record<string, number> = {};
    jobs.forEach(job => {
      job.applications.forEach(app => {
        const status = app.status?.status_name || 'Unknown';
        applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
      });
    });
    
    res.json({
      success: true,
      data: {
        total_jobs: totalJobs,
        active_jobs: activeJobs,
        total_applications: totalApplications,
        applications_by_status: applicationsByStatus,
        jobs: jobs.map(job => ({
          id: job.id,
          title: job.title,
          applications_count: job.applications.length,
          views_count: job.views_count
        }))
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SETTINGS & PREFERENCES ==========

export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    let preferences = await prisma.notificationPreference.findUnique({
      where: { user_id: userId }
    });
    
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          application_updates: true,
          new_job_alerts: true,
          status_changes: true,
          marketing_emails: false,
          weekly_digest: true
        }
      });
    }
    
    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const updates = req.body;
    
    const preferences = await prisma.notificationPreference.update({
      where: { user_id: userId },
      data: {
        ...updates,
        updated_at: new Date()
      }
    });
    
    res.json({ success: true, data: preferences, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== ACTIVITY LOGS ==========

export const getActivityLog = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    });
    
    let applications: any[] = [];
    let bookmarks: any[] = [];
    
    if (seeker) {
      applications = await prisma.jobApplication.findMany({
        where: { seeker_id: seeker.id },
        include: { job: true, status: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { applied_at: 'desc' }
      });
      
      bookmarks = await prisma.jobBookmark.findMany({
        where: { seeker_id: seeker.id },
        include: { job: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      });
    }
    
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      skip,
      take: parseInt(limit as string),
      orderBy: { created_at: 'desc' }
    });
    
    const activities = [
      ...applications.map((app: any) => ({
        type: 'application',
        title: `Applied to ${app.job.title}`,
        date: app.applied_at,
        details: app
      })),
      ...bookmarks.map((b: any) => ({
        type: 'bookmark',
        title: `Saved ${b.job.title}`,
        date: b.created_at,
        details: b
      })),
      ...notifications.map((n: any) => ({
        type: 'notification',
        title: n.title,
        date: n.created_at,
        details: n
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    res.json({
      success: true,
      data: activities.slice(0, parseInt(limit as string)),
      total: activities.length
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};