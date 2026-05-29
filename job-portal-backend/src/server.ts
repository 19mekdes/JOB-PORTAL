// Add this at the top of server.ts right after imports
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

console.log('🚀 Starting server initialization...')


import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import adminRoutes from './routes/adminRoutes';
import nodemailer from 'nodemailer'
import employerRoutes from './routes/employerRoutes'
import { 
  testEmailConfig, 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewApplicationNotification
} from './services/emailService'
// ========== AFTER IMPORTS AND dotenv.config() ==========
dotenv.config()

// Create express app FIRST
const app = express()

// CORS configuration - IMMEDIATELY AFTER creating app
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  res.sendStatus(200)
})

// Then body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Then your routes
// ... rest of your code

// Express Request Interface Extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}


const prisma = new PrismaClient()

// ========== CLOUDINARY CONFIGURATION ==========
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})


// Helper to extract Cloudinary Public ID from an image URL for deletion
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Expected format: .../upload/v123456789/jobportal/images/img-name.jpg
    const parts = url.split('/upload/')
    if (parts.length < 2) return null
    
    // Remove the version segment (e.g., "v123456789/") and file extension
    const pathWithExtension = parts[1].replace(/^v\d+\//, '')
    return pathWithExtension.substring(0, pathWithExtension.lastIndexOf('.'))
  } catch (error) {
    console.error('Error parsing Cloudinary URL public ID:', error)
    return null
  }
}





// ========== MULTER CONFIGURATION ==========
// 1. Keep Local Engine for Resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/resumes'
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, DOC, and DOCX files are allowed'))
  }
})

// 2. NEW: Cloudinary Engine for Images
const cloudinaryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'jobportal/images',
      allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
      public_id: `img-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    }
  }
})

const uploadImage = multer({
  storage: cloudinaryImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

app.use('/api/admin', adminRoutes);

// Configure email transporter (use your email service)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Email template function
async function sendEmail(to: string, subject: string, html: string) {
  try {
    await emailTransporter.sendMail({
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log(`✅ Email sent to ${to}`)
  } catch (error) {
    console.error('Email sending failed:', error)
  }
}

// Send application status update email
async function sendApplicationStatusEmail(userEmail: string, userName: string, jobTitle: string, status: string, companyName: string) {
  const statusColors: Record<string, string> = {
    'Pending': '#f59e0b',
    'Reviewed': '#3b82f6',
    'Shortlisted': '#8b5cf6',
    'Interview': '#06b6d4',
    'Accepted': '#10b981',
    'Rejected': '#ef4444'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; background: ${statusColors[status] || '#6b7280'}; color: white; }
        .button { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Job Portal</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>Your application status for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
          <p style="text-align: center; margin: 30px 0;">
            <span class="status">${status}</span>
          </p>
          <p>Log in to your account to view more details and next steps.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/applications" class="button">View Applications</a>
          </p>
        </div>
        <div class="footer">
          <p>Job Portal - Connecting Talent with Opportunity</p>
          <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail(userEmail, `Application Status Update: ${status}`, html)

// Send new job alert email
async function sendNewJobAlertEmail(userEmail: string, userName: string, jobs: any[]) {
  const jobsList = jobs.map(job => `
    <div style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
      <h3 style="margin: 0 0 5px 0;">${job.title}</h3>
      <p style="color: #6b7280; margin: 0;">${job.employer?.company_name || 'Unknown Company'} • ${job.location}</p>
      <p style="color: #6b7280; font-size: 14px;">Salary: ${job.salary_range || 'Competitive'}</p>
      <a href="${process.env.FRONTEND_URL}/jobs/${job.id}" style="color: #2563eb; text-decoration: none;">View Details →</a>
    </div>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Jobs Matching Your Preferences</h2>
        </div>
        <div class="content">
          <h3>Hello ${userName},</h3>
          <p>We found ${jobs.length} new job${jobs.length > 1 ? 's' : ''} that match your profile:</p>
          ${jobsList}
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/jobs" class="button">Browse All Jobs</a>
          </p>
        </div>
        <div class="footer">
          <p>You received this email because you subscribed to job alerts.</p>
          <p><a href="${process.env.FRONTEND_URL}/jobseeker/preferences">Manage Preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `
 await sendEmail(userEmail, `🔔 New Job${jobs.length > 1 ? 's' : ''} Alert`, html)
 }

}
// ========== MIDDLEWARE ==========
app.use(cors({ origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.options('*', cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// ========== AUTH MIDDLEWARE ==========
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' })
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string }
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

// Check if user is Super Admin only
const superAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { user_type: true } })
    if (user?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' })
    }
    next()
  } catch (error) {
    res.status(403).json({ success: false, message: 'Access denied' })
  }
}

// ========== ADD THIS isAdmin MIDDLEWARE ==========
// Check if user is Admin (includes Super Admin)
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    const role = user?.user_type?.type_name
    if (role !== 'Admin' && role !== 'Super Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or Super Admin role required.' 
      })
    }
    next()
  } catch (error) {
    res.status(403).json({ success: false, message: 'Access denied' })
  }
}

// Check if user is Employer
const isEmployer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (user?.user_type?.type_name !== 'Employer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Employer role required.' 
      })
    }
    next()
  } catch (error) {
    res.status(403).json({ success: false, message: 'Access denied' })
  }
}

// Check if user is Job Seeker
const isJobSeeker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (user?.user_type?.type_name !== 'Job Seeker') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Job Seeker role required.' 
      })
    }
    next()
  } catch (error) {
    res.status(403).json({ success: false, message: 'Access denied' })
  }
}

async function createNotification(userId: string, title: string, message: string, type: string, metadata?: any) {
  try {
    return await prisma.notification.create({ 
      data: { user_id: userId, title, message, type, metadata: metadata || {}, created_at: new Date() } 
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}



// ========== MARK NOTIFICATION AS READ ==========
app.put('/api/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    const notification = await prisma.notification.updateMany({
      where: { 
        id: parseInt(id), 
        user_id: userId 
      },
      data: { is_read: true }
    })
    
    if (notification.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }
    
    res.json({ success: true, message: 'Notification marked as read' })
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== MARK ALL NOTIFICATIONS AS READ ==========
app.put('/api/notifications/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    
    await prisma.notification.updateMany({
      where: { 
        user_id: userId, 
        is_read: false 
      },
      data: { is_read: true }
    })
    
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})
// ========== GET NOTIFICATIONS ==========
app.get('/api/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { page = 1, limit = 20 } = req.query
    
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    })
    
    const unreadCount = await prisma.notification.count({
      where: { user_id: userId, is_read: false }
    })
    
    res.json({ 
      success: true, 
      data: notifications, 
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await prisma.notification.count({ where: { user_id: userId } })
      }
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== GET UNREAD NOTIFICATIONS FOR PUSH ==========
app.get('/api/notifications/unread', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    
    const notifications = await prisma.notification.findMany({
      where: { 
        user_id: userId, 
        is_read: false 
      },
      orderBy: { created_at: 'desc' },
      take: 50
    })
    
    res.json({ success: true, data: notifications })
  } catch (error: any) {
    console.error('Error fetching unread notifications:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== INITIALIZE DEFAULT DATA ==========
async function initializeDefaultData() {
  const userTypes = await prisma.userType.findMany()
  if (userTypes.length === 0) {
    await prisma.userType.createMany({ data: [{ type_name: 'Job Seeker' }, { type_name: 'Employer' }, { type_name: 'Admin' }, { type_name: 'Super Admin' }] })
  }
  const jobStatuses = await prisma.jobPostStatus.findMany()
  if (jobStatuses.length === 0) {
    await prisma.jobPostStatus.createMany({ data: [{ status_name: 'Open' }, { status_name: 'Closed' }, { status_name: 'Draft' }, { status_name: 'Archived' }] })
  }
  const appStatuses = await prisma.jobApplicationStatus.findMany()
  if (appStatuses.length === 0) {
    await prisma.jobApplicationStatus.createMany({ data: [{ status_name: 'Pending' }, { status_name: 'Reviewed' }, { status_name: 'Shortlisted' }, { status_name: 'Interview' }, { status_name: 'Accepted' }, { status_name: 'Rejected' }] })
  }
  const empTypes = await prisma.employmentType.findMany()
  if (empTypes.length === 0) {
    await prisma.employmentType.createMany({ data: [{ type_name: 'Full-time' }, { type_name: 'Part-time' }, { type_name: 'Contract' }, { type_name: 'Remote' }, { type_name: 'Hybrid' }, { type_name: 'Internship' }] })
  }
  const industries = await prisma.jobIndustry.findMany()
  if (industries.length === 0) {
    const industryList = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Construction']
    for (const industry of industryList) {
      await prisma.jobIndustry.create({ data: { industry_name: industry } })
    }
  }
}

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, user_type } = req.body
    await initializeDefaultData()
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' })
    const userType = await prisma.userType.findFirst({ where: { type_name: user_type } })
    if (!userType) return res.status(400).json({ success: false, message: 'Invalid user type' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, password: hashedPassword, user_type_id: userType.id, is_active: true, created_at: new Date(), updated_at: new Date() } })
    if (user_type === 'Job Seeker') {
      await prisma.jobSeekerProfile.create({ data: { user_id: user.id, full_name: full_name, skills: [] } })
    } else if (user_type === 'Employer') {
      const defaultIndustry = await prisma.jobIndustry.findFirst()
      await prisma.employerProfile.create({ data: { user_id: user.id, company_name: full_name, industry_id: defaultIndustry?.id || 1 } })
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, user_type, full_name } })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email }, include: { user_type: true, seeker_profile: true, employer_profile: true } })
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name
    res.json({ success: true, token, user: { id: user.id, email: user.email, user_type: user.user_type.type_name, full_name: fullName } })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== PROFILE ROUTES ==========
app.get('/api/profile/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true, seeker_profile: true, employer_profile: { include: { industry: true } } }
    })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    
    const profile = user.seeker_profile || user.employer_profile
    res.json({ 
      success: true, 
      data: { 
        user: { id: user.id, email: user.email, user_type: user.user_type?.type_name }, 
        profile
      } 
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.put('/api/auth/profile', authMiddleware, uploadImage.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { full_name, phone, location, title, bio, linkedin_url, github_url, portfolio_url, availability, skills, cover_image } = req.body
    
    let profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } })
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      profile = await prisma.jobSeekerProfile.create({ data: { user_id: userId, full_name: user?.full_name || 'Job Seeker', skills: [] } })
    }
    
    const updateData: any = {}
    
    if (req.file) {
      if (profile.avatar) {
        const oldPublicId = getPublicIdFromUrl(profile.avatar)
        if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)
      }
      updateData.avatar = req.file.path // Cloudinary URL
    }
    
    if (cover_image && cover_image !== 'undefined') updateData.cover_image = cover_image
    if (full_name && full_name !== 'undefined') updateData.full_name = full_name
    if (phone && phone !== 'undefined') updateData.phone = phone
    if (location && location !== 'undefined') updateData.location = location
    if (title && title !== 'undefined') updateData.title = title
    if (bio && bio !== 'undefined') updateData.bio = bio
    if (linkedin_url && linkedin_url !== 'undefined') updateData.linkedin_url = linkedin_url
    if (github_url && github_url !== 'undefined') updateData.github_url = github_url
    if (portfolio_url && portfolio_url !== 'undefined') updateData.portfolio_url = portfolio_url
    if (availability && availability !== 'undefined') updateData.availability = availability
    
    if (skills && skills !== 'undefined') {
      updateData.skills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(s => s) : skills
    }
    
    const updatedProfile = await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: updateData })
    
    if (full_name) {
      await prisma.user.update({ where: { id: userId }, data: { full_name } })
    }
    
    res.json({ success: true, data: { profile: updatedProfile }, message: 'Profile updated successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== JOB SEEKER PROFILE CLOUD UPLOADS ==========
app.post('/api/profile/cover', authMiddleware, uploadImage.single('cover_image'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    
    let profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } })
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      profile = await prisma.jobSeekerProfile.create({ data: { user_id: userId, full_name: user?.full_name || 'Job Seeker', skills: [] } })
    }
    
    if (profile.cover_image) {
      const oldPublicId = getPublicIdFromUrl(profile.cover_image)
      if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)
    }
    
    const updatedProfile = await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { cover_image: req.file.path } })
    res.json({ success: true, data: { cover_image: updatedProfile.cover_image }, message: 'Cover image uploaded successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.post('/api/profile/avatar', authMiddleware, uploadImage.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    
    let profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } })
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      profile = await prisma.jobSeekerProfile.create({ data: { user_id: userId, full_name: user?.full_name || 'Job Seeker', skills: [] } })
    }
    
    if (profile.avatar) {
      const oldPublicId = getPublicIdFromUrl(profile.avatar)
      if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)
    }
    
    const updatedProfile = await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { avatar: req.file.path } })
    res.json({ success: true, data: { avatar: updatedProfile.avatar }, message: 'Profile picture uploaded successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.delete('/api/profile/cover', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const profile = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } })
    if (!profile || !profile.cover_image) return res.status(404).json({ success: false, message: 'Cover image not found' })
    
    const oldPublicId = getPublicIdFromUrl(profile.cover_image)
    if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)
    
    await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { cover_image: null } })
    res.json({ success: true, message: 'Cover image removed successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== EMPLOYER PROFILE ROUTES ==========
app.get('/api/employer/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employer = await prisma.employerProfile.findFirst({ where: { user_id: req.user!.id }, include: { industry: true } })
    if (!employer) return res.status(404).json({ success: false, message: 'Employer profile not found' })
    res.json({ success: true, data: employer })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})
app.use('/api/employer', employerRoutes);

app.put('/api/employer/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { company_name, company_description, website, location, company_size, industry_id } = req.body
    
    const employer = await prisma.employerProfile.update({
      where: { user_id: userId },
      data: { company_name, company_description, website, location, company_size, industry_id: industry_id ? parseInt(industry_id) : undefined }
    })
    res.json({ success: true, data: employer, message: 'Profile updated successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== EMPLOYER PROFILE CLOUD UPLOADS ==========
app.post('/api/employer/cover', authMiddleware, uploadImage.single('cover_image'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    if (!req.file) return res.status(400).json({ success: false, message: 'No banner file uploaded' })

    const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } })
    if (!employer) return res.status(404).json({ success: false, message: 'Employer profile not found' })

    if (employer.cover_image) {
      const oldPublicId = getPublicIdFromUrl(employer.cover_image)
      if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)
    }

    const updated = await prisma.employerProfile.update({
      where: { id: employer.id },
      data: { cover_image: req.file.path } // Secure Cloudinary Link URL
    })

    res.json({ success: true, data: { cover_image: updated.cover_image }, message: 'Company banner uploaded successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.post('/api/employer/logo', authMiddleware, uploadImage.single('logo'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    if (!req.file) return res.status(400).json({ success: false, message: 'No logo file uploaded' })

    const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } })
    if (!employer) return res.status(404).json({ success: false, message: 'Employer profile not found' })

    if (employer.logo_url) {
      const oldPublicId = getPublicIdFromUrl(employer.logo_url)
      if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)
    }

    const updated = await prisma.employerProfile.update({
      where: { id: employer.id },
      data: { logo_url: req.file.path } // Secure Cloudinary Link URL
    })

    res.json({ success: true, data: { logo_url: updated.logo_url }, message: 'Company logo uploaded successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.delete('/api/employer/cover', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } })
    if (!employer || !employer.cover_image) return res.status(404).json({ success: false, message: 'Company banner not found' })

    const oldPublicId = getPublicIdFromUrl(employer.cover_image)
    if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId)

    await prisma.employerProfile.update({ where: { id: employer.id }, data: { cover_image: null } })
    res.json({ success: true, message: 'Company banner removed successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})





// ========== COMPANY VERIFICATION ENDPOINT ==========
// Verify company (Super Admin only)
app.put('/api/admin/verify-company/:userId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { is_verified } = req.body;
    
    console.log(`🔍 Verifying company for user: ${userId}`);
    
    // Find the user's employer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employer_profile: true }
    });
    
    if (!user || !user.employer_profile) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    // Update verification status
    const updatedEmployer = await prisma.employerProfile.update({
      where: { id: user.employer_profile.id },
      data: { 
        is_verified: is_verified,
        updated_at: new Date()
      }
    });
    
    // Send notification to company
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: is_verified ? '✅ Company Verified!' : 'Company Verification Removed',
        message: is_verified 
          ? 'Your company has been verified. You now have a trust badge on your profile!'
          : 'Your company verification has been removed. Please contact support for more information.',
        type: 'company_update',
        created_at: new Date()
      }
    });
    
    console.log(`✅ Company ${user.employer_profile.company_name} verification set to: ${is_verified}`);
    
    res.json({ 
      success: true, 
      message: is_verified ? 'Company verified successfully' : 'Company verification removed',
      data: updatedEmployer
    });
  } catch (error: any) {
    console.error('Error verifying company:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET COMPANY JOBS COUNT ==========
// Get jobs count for all companies
app.get('/api/admin/company-jobs-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employers = await prisma.employerProfile.findMany({
      include: {
        jobs: true
      }
    });
    
    const jobCounts = employers.map(employer => ({
      id: employer.id,
      company_name: employer.company_name,
      jobs_count: employer.jobs.length
    }));
    
    res.json({ 
      success: true, 
      data: jobCounts
    });
  } catch (error: any) {
    console.error('Error getting jobs count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ========== SUPER ADMIN - FULL ADMIN MANAGEMENT ENDPOINTS ==========
// Add these after your existing routes but BEFORE app.listen()

// 1. UPDATE ADMIN - Edit admin details
app.put('/api/admin/users/:userId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { full_name, phone, role } = req.body;
    
    console.log(`🔄 UPDATE ADMIN called for: ${userId}`);
    console.log(`   Data:`, { full_name, phone, role });
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_type: true, seeker_profile: true }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (full_name) {
      updateData.full_name = full_name;
      console.log(`   Updating name: ${existingUser.full_name} -> ${full_name}`);
    }
    
    // Update role if provided
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
    
    // Update phone in seeker profile if exists
    if (existingUser.seeker_profile && phone !== undefined) {
      await prisma.jobSeekerProfile.update({
        where: { id: existingUser.seeker_profile.id },
        data: { phone: phone || null }
      });
    }
    
    console.log(`✅ Admin updated: ${updatedUser.email}`);
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ 
      success: true, 
      data: userWithoutPassword, 
      message: 'Admin updated successfully' 
    });
  } catch (error: any) {
    console.error('❌ Update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. RESET PASSWORD - Reset admin password
app.post('/api/admin/users/:userId/reset-password', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    
    console.log(`🔑 RESET PASSWORD for: ${userId}`);
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    });
    
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
    
    console.log(`✅ Password reset for: ${existingUser.email}`);
    
    res.json({ 
      success: true, 
      message: `Password reset successfully for ${existingUser.email}` 
    });
  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. DELETE ADMIN - Permanently delete admin
app.delete('/api/admin/users/:userId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    console.log(`🗑️ DELETE ADMIN: ${userId}`);
    
    // Prevent self-deletion
    if (userId === req.user!.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userEmail = existingUser.email;
    const userName = existingUser.full_name || userEmail;
    
    // Delete related records
    if (existingUser.seeker_profile) {
      await prisma.jobApplication.deleteMany({
        where: { seeker_id: existingUser.seeker_profile.id }
      });
      await prisma.jobBookmark.deleteMany({
        where: { seeker_id: existingUser.seeker_profile.id }
      });
      await prisma.jobSeekerProfile.delete({
        where: { id: existingUser.seeker_profile.id }
      });
    }
    
    if (existingUser.employer_profile) {
      const jobs = await prisma.jobPost.findMany({
        where: { employer_id: existingUser.employer_profile.id }
      });
      for (const job of jobs) {
        await prisma.jobApplication.deleteMany({
          where: { job_id: job.id }
        });
      }
      await prisma.jobPost.deleteMany({
        where: { employer_id: existingUser.employer_profile.id }
      });
      await prisma.employerProfile.delete({
        where: { id: existingUser.employer_profile.id }
      });
    }
    
    // Delete notifications
    await prisma.notification.deleteMany({
      where: { user_id: userId }
    });
    
    await prisma.notificationPreference.deleteMany({
      where: { user_id: userId }
    });
    
    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    console.log(`✅ User deleted: ${userEmail}`);
    
    res.json({ 
      success: true, 
      message: `User ${userName} deleted successfully` 
    });
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. GET SINGLE USER - Get admin by ID
app.get('/api/admin/users/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SUPER ADMIN - FULL ADMIN MANAGEMENT ENDPOINTS ==========
// Add these BEFORE app.listen()

// 1. UPDATE ADMIN - Edit admin details
app.put('/api/admin/users/:userId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { full_name, phone, role } = req.body;
    
    console.log(`🔄 UPDATE ADMIN: ${userId}`);
    console.log(`   Data:`, { full_name, phone, role });
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_type: true, seeker_profile: true }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (full_name) {
      updateData.full_name = full_name;
    }
    
    // Update role if provided
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
    
    // Update phone in seeker profile if exists
    if (existingUser.seeker_profile && phone !== undefined) {
      await prisma.jobSeekerProfile.update({
        where: { id: existingUser.seeker_profile.id },
        data: { phone: phone || null }
      });
    }
    
    console.log(`✅ Admin updated: ${updatedUser.email}`);
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ 
      success: true, 
      data: userWithoutPassword, 
      message: 'Admin updated successfully' 
    });
  } catch (error: any) {
    console.error('❌ Update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. RESET PASSWORD - Reset admin password
app.post('/api/admin/users/:userId/reset-password', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    
    console.log(`🔑 RESET PASSWORD for: ${userId}`);
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    });
    
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
    
    console.log(`✅ Password reset for: ${existingUser.email}`);
    
    res.json({ 
      success: true, 
      message: `Password reset successfully for ${existingUser.email}` 
    });
  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. DELETE ADMIN - Permanently delete admin
app.delete('/api/admin/users/:userId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    console.log(`🗑️ DELETE ADMIN: ${userId}`);
    
    // Prevent self-deletion
    if (userId === req.user!.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userEmail = existingUser.email;
    const userName = existingUser.full_name || userEmail;
    
    // Delete related records
    if (existingUser.seeker_profile) {
      await prisma.jobApplication.deleteMany({
        where: { seeker_id: existingUser.seeker_profile.id }
      });
      await prisma.jobBookmark.deleteMany({
        where: { seeker_id: existingUser.seeker_profile.id }
      });
      await prisma.jobSeekerProfile.delete({
        where: { id: existingUser.seeker_profile.id }
      });
      console.log(`   Deleted seeker profile for ${userEmail}`);
    }
    
    if (existingUser.employer_profile) {
      const jobs = await prisma.jobPost.findMany({
        where: { employer_id: existingUser.employer_profile.id }
      });
      for (const job of jobs) {
        await prisma.jobApplication.deleteMany({
          where: { job_id: job.id }
        });
      }
      await prisma.jobPost.deleteMany({
        where: { employer_id: existingUser.employer_profile.id }
      });
      await prisma.employerProfile.delete({
        where: { id: existingUser.employer_profile.id }
      });
      console.log(`   Deleted employer profile and ${jobs.length} jobs for ${userEmail}`);
    }
    
    // Delete notifications
    await prisma.notification.deleteMany({
      where: { user_id: userId }
    });
    
    await prisma.notificationPreference.deleteMany({
      where: { user_id: userId }
    });
    
    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    console.log(`✅ User deleted: ${userEmail}`);
    
    res.json({ 
      success: true, 
      message: `User ${userName} deleted successfully` 
    });
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. GET SINGLE USER - Get admin by ID
app.get('/api/admin/users/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ========== LOOKUP TABLES ROUTES ==========
app.get('/api/industries', async (req: Request, res: Response) => {
  try {
    const industries = await prisma.jobIndustry.findMany({
      orderBy: { industry_name: 'asc' }
    });
    res.json({ success: true, data: industries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/employment-types', async (req: Request, res: Response) => {
  try {
    const employmentTypes = await prisma.employmentType.findMany({
      orderBy: { type_name: 'asc' }
    });
    res.json({ success: true, data: employmentTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ========== JOB ROUTES ==========
app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.jobPost.findMany({ 
      where: { status_id: 1 }, 
      include: { employer: { include: { user: true } }, industry: true, employment_type: true, status: true }, 
      orderBy: { created_at: 'desc' } 
    })
    res.json({ success: true, data: jobs })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.get('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await prisma.jobPost.findUnique({ 
      where: { id: req.params.id }, 
      include: { employer: { include: { user: true } }, industry: true, employment_type: true, status: true } 
    })
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' })
    
    if (job.status.status_name !== 'Open') {
      const authHeader = req.headers.authorization
      if (authHeader) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!) as { id: string }
          const employer = await prisma.employerProfile.findFirst({ where: { user_id: decoded.id } })
          if (employer && employer.id === job.employer_id) return res.json({ success: true, data: job })
        } catch (e) {}
      }
      return res.status(404).json({ success: false, message: 'Job not found' })
    }
    
    await prisma.jobPost.update({ where: { id: req.params.id }, data: { views_count: { increment: 1 } } })
    res.json({ success: true, data: job })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.post('/api/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { user_type: true, employer_profile: true } })
    
    if (user?.user_type?.type_name !== 'Employer') return res.status(403).json({ success: false, message: 'Only employers can post jobs' })
    if (!user.employer_profile) return res.status(403).json({ success: false, message: 'Please complete your employer profile first' })
    if (!title || !description || !location || !employment_type_id || !industry_id) return res.status(400).json({ success: false, message: 'Missing required fields' })
    
    const openStatus = await prisma.jobPostStatus.findFirst({ where: { status_name: 'Open' } })
    const job = await prisma.jobPost.create({ 
      data: { 
        title, description, requirements: requirements || '', benefits: benefits || '', location, 
        employer_id: user.employer_profile.id, employment_type_id: parseInt(employment_type_id), 
        industry_id: parseInt(industry_id), salary_min: salary_min ? parseFloat(salary_min) : null, 
        salary_max: salary_max ? parseFloat(salary_max) : null, is_remote: is_remote || false, 
        status_id: openStatus!.id, created_at: new Date(), views_count: 0, applications_count: 0 
      } 
    })
    res.status(201).json({ success: true, data: job, message: 'Job posted successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.put('/api/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, requirements, benefits, location, employment_type_id, industry_id, salary_min, salary_max, is_remote, status_id } = req.body
    
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { employer_profile: true } })
    if (!user?.employer_profile) return res.status(403).json({ success: false, message: 'Employer not found' })
    
    const existingJob = await prisma.jobPost.findFirst({ where: { id, employer_id: user.employer_profile.id } })
    if (!existingJob) return res.status(404).json({ success: false, message: 'Job not found' })
    
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        title: title || existingJob.title,
        description: description || existingJob.description,
        requirements: requirements !== undefined ? requirements : existingJob.requirements,
        benefits: benefits !== undefined ? benefits : existingJob.benefits,
        location: location || existingJob.location,
        employment_type_id: employment_type_id ? parseInt(employment_type_id) : existingJob.employment_type_id,
        industry_id: industry_id ? parseInt(industry_id) : existingJob.industry_id,
        salary_min: salary_min !== undefined ? parseFloat(salary_min) : existingJob.salary_min,
        salary_max: salary_max !== undefined ? parseFloat(salary_max) : existingJob.salary_max,
        is_remote: is_remote !== undefined ? is_remote : existingJob.is_remote,
        status_id: status_id || existingJob.status_id,
        updated_at: new Date()
      }
    })
    res.json({ success: true, data: updatedJob, message: 'Job updated successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.delete('/api/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { user_type: true, employer_profile: true } })
    const job = await prisma.jobPost.findUnique({ where: { id }, include: { employer: true } })
    
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' })
    
    const isOwner = job.employer.user_id === req.user!.id
    const isAdmin = user?.user_type?.type_name === 'Admin' || user?.user_type?.type_name === 'Super Admin'
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' })
    
    await prisma.jobPost.delete({ where: { id } })
    res.json({ success: true, message: 'Job deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})







// ========== EMPLOYER DASHBOARD ==========
app.get('/api/employer/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    
    const employer = await prisma.employerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer profile not found' })
    }
    
    // Get all jobs
    const jobs = await prisma.jobPost.findMany({
      where: { employer_id: employer.id },
      include: {
        status: true,
        employment_type: true,
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    
    // Get all applications with job and seeker info
    const allApplications = await prisma.jobApplication.findMany({
      where: {
        job: { employer_id: employer.id }
      },
      include: {
        status: true,
        job: {
          select: { id: true, title: true }
        },
        seeker: {
          include: {
            user: {
              select: { id: true, email: true, full_name: true }
            }
          }
        }
      },
      orderBy: { applied_at: 'desc' }
    })
    
    // Calculate stats
    const totalJobs = jobs.length
    const activeJobs = jobs.filter(job => job.status?.status_name === 'Open').length
    const closedJobs = jobs.filter(job => job.status?.status_name === 'Closed').length
    const draftJobs = jobs.filter(job => job.status?.status_name === 'Draft').length
    const totalApplications = allApplications.length
    const totalViews = jobs.reduce((sum, job) => sum + (job.views_count || 0), 0)
    
    // This month stats
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const thisMonthJobs = jobs.filter(job => {
      const jobDate = new Date(job.created_at)
      return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear
    }).length
    
    const thisMonthApplications = allApplications.filter(app => {
      const appDate = new Date(app.applied_at)
      return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear
    }).length
    
    const thisMonthViews = jobs.reduce((sum, job) => {
      const jobDate = new Date(job.created_at)
      if (jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear) {
        return sum + (job.views_count || 0)
      }
      return sum
    }, 0)
    
    // Status counts
    const pendingApplications = allApplications.filter(app => app.status?.status_name === 'Pending').length
    const reviewedApplications = allApplications.filter(app => app.status?.status_name === 'Reviewed').length
    const shortlistedApplications = allApplications.filter(app => app.status?.status_name === 'Shortlisted').length
    const interviewApplications = allApplications.filter(app => app.status?.status_name === 'Interview').length
    const acceptedApplications = allApplications.filter(app => app.status?.status_name === 'Accepted').length
    const rejectedApplications = allApplications.filter(app => app.status?.status_name === 'Rejected').length
    
    // FORMAT RECENT JOBS - Extract status_name as string
    const recentJobs = jobs.slice(0, 5).map(job => ({
      id: job.id,
      title: job.title || 'Untitled',
      location: job.location || 'Not specified',
      applications_count: job._count?.applications || 0,
      views_count: job.views_count || 0,
      status: job.status?.status_name || 'Unknown', // ← Convert to string!
      created_at: job.created_at
    }))
    
    // FORMAT RECENT APPLICATIONS - Extract status_name as string
    const recentApplications = allApplications.slice(0, 5).map(app => ({
      id: app.id,
      job_title: app.job?.title || 'Unknown Position',
      applicant_name: app.seeker?.full_name || app.seeker?.user?.full_name || 'Anonymous Applicant',
      status: app.status?.status_name || 'Pending', // ← Convert to string!
      applied_at: app.applied_at,
      applied_days_ago: Math.floor((Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24))
    }))
    
    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        closedJobs,
        draftJobs,
        totalApplications,
        totalViews,
        pendingApplications,
        reviewedApplications,
        shortlistedApplications,
        interviewApplications,
        acceptedApplications,
        rejectedApplications,
        thisMonthJobs,
        thisMonthApplications,
        thisMonthViews,
        recentJobs,
        recentApplications
      }
    })
  } catch (error: any) {
    console.error('Error fetching employer dashboard:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== EMPLOYER JOB ROUTES ==========
app.get('/api/employer/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employer = await prisma.employerProfile.findFirst({ where: { user_id: req.user!.id } })
    if (!employer) return res.status(404).json({ success: false, message: 'Employer profile not found' })
    
    const jobs = await prisma.jobPost.findMany({ where: { employer_id: employer.id }, include: { industry: true, employment_type: true, status: true }, orderBy: { created_at: 'desc' } })
    res.json({ success: true, data: jobs })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ========== UPDATE JOB STATUS (Open/Close job) ==========
app.put('/api/jobs/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body // 'Open' or 'Closed'
    
    console.log(`Updating job ${id} status to:`, status)
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }
    
    // Verify employer owns this job
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employer_profile: true }
    })
    
    if (!user?.employer_profile) {
      return res.status(403).json({ success: false, message: 'Employer not found' })
    }
    
    // Check if job exists and belongs to employer
    const job = await prisma.jobPost.findFirst({
      where: { 
        id: id,
        employer_id: user.employer_profile.id
      }
    })
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }
    
    // Get the status record
    const statusRecord = await prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    })
    
    if (!statusRecord) {
      return res.status(404).json({ success: false, message: `Status '${status}' not found` })
    }
    
    // Update job status
    const updatedJob = await prisma.jobPost.update({
      where: { id: id },
      data: {
        status_id: statusRecord.id,
        updated_at: new Date()
      },
      include: {
        status: true,
        industry: true,
        employment_type: true
      }
    })
    
    console.log(`✅ Job ${id} status updated to ${status}`)
    
    res.json({ 
      success: true, 
      data: updatedJob, 
      message: `Job ${status.toLowerCase()} successfully` 
    })
  } catch (error: any) {
    console.error('Error updating job status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== REOPEN JOB (Set status to Open) ==========
app.put('/api/jobs/:id/reopen', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    console.log(`Reopening job: ${id}`)
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employer_profile: true }
    })
    
    if (!user?.employer_profile) {
      return res.status(403).json({ success: false, message: 'Employer not found' })
    }
    
    const job = await prisma.jobPost.findFirst({
      where: { 
        id: id,
        employer_id: user.employer_profile.id
      }
    })
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }
    
    const openStatus = await prisma.jobPostStatus.findFirst({
      where: { status_name: 'Open' }
    })
    
    if (!openStatus) {
      return res.status(404).json({ success: false, message: 'Open status not found' })
    }
    
    const updatedJob = await prisma.jobPost.update({
      where: { id: id },
      data: {
        status_id: openStatus.id,
        updated_at: new Date()
      },
      include: {
        status: true,
        industry: true,
        employment_type: true
      }
    })
    
    console.log(`✅ Job ${id} reopened successfully`)
    
    res.json({ 
      success: true, 
      data: updatedJob, 
      message: 'Job reopened successfully' 
    })
  } catch (error: any) {
    console.error('Error reopening job:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== CLOSE JOB (Set status to Closed) ==========
app.put('/api/jobs/:id/close', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    console.log(`Closing job: ${id}`)
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employer_profile: true }
    })
    
    if (!user?.employer_profile) {
      return res.status(403).json({ success: false, message: 'Employer not found' })
    }
    
    const job = await prisma.jobPost.findFirst({
      where: { 
        id: id,
        employer_id: user.employer_profile.id
      }
    })
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }
    
    const closedStatus = await prisma.jobPostStatus.findFirst({
      where: { status_name: 'Closed' }
    })
    
    if (!closedStatus) {
      return res.status(404).json({ success: false, message: 'Closed status not found' })
    }
    
    const updatedJob = await prisma.jobPost.update({
      where: { id: id },
      data: {
        status_id: closedStatus.id,
        updated_at: new Date()
      },
      include: {
        status: true,
        industry: true,
        employment_type: true
      }
    })
    
    console.log(`✅ Job ${id} closed successfully`)
    
    res.json({ 
      success: true, 
      data: updatedJob, 
      message: 'Job closed successfully' 
    })
  } catch (error: any) {
    console.error('Error closing job:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== UPDATE JOB ==========
app.put('/api/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      requirements,
      benefits,
      location,
      employment_type_id,
      industry_id,
      salary_min,
      salary_max,
      is_remote,
      status_id
    } = req.body
    
    console.log('Updating job:', { id, employment_type_id, industry_id, status_id })
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employer_profile: true }
    })
    
    if (!user?.employer_profile) {
      return res.status(403).json({ success: false, message: 'Employer not found' })
    }
    
    const existingJob = await prisma.jobPost.findFirst({
      where: { id, employer_id: user.employer_profile.id }
    })
    
    if (!existingJob) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }
    
    // Build update data dynamically
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (requirements !== undefined) updateData.requirements = requirements
    if (benefits !== undefined) updateData.benefits = benefits
    if (location !== undefined) updateData.location = location
    if (is_remote !== undefined) updateData.is_remote = is_remote
    
    // Handle employment_type_id - ensure it's a number
    if (employment_type_id !== undefined && employment_type_id !== null && employment_type_id !== '') {
      updateData.employment_type_id = typeof employment_type_id === 'string' 
        ? parseInt(employment_type_id) 
        : employment_type_id
    }
    
    // Handle industry_id - ensure it's a number
    if (industry_id !== undefined && industry_id !== null && industry_id !== '') {
      updateData.industry_id = typeof industry_id === 'string' 
        ? parseInt(industry_id) 
        : industry_id
    }
    
    // Handle status_id - ensure it's a number
    if (status_id !== undefined && status_id !== null && status_id !== '') {
      updateData.status_id = typeof status_id === 'string' 
        ? parseInt(status_id) 
        : status_id
    }
    
    // Handle salary fields
    if (salary_min !== undefined && salary_min !== null && salary_min !== '') {
      updateData.salary_min = typeof salary_min === 'string' 
        ? parseFloat(salary_min) 
        : salary_min
    }
    if (salary_max !== undefined && salary_max !== null && salary_max !== '') {
      updateData.salary_max = typeof salary_max === 'string' 
        ? parseFloat(salary_max) 
        : salary_max
    }
    
    updateData.updated_at = new Date()
    
    console.log('Update data being sent to Prisma:', updateData)
    
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: updateData,
      include: {
        industry: true,
        employment_type: true,
        status: true
      }
    })
    
    console.log('Job updated successfully:', updatedJob.id)
    
    res.json({ 
      success: true, 
      data: updatedJob, 
      message: 'Job updated successfully' 
    })
  } catch (error: any) {
    console.error('Error updating job:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

app.put('/api/jobs/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employer_profile: true }
    });
    
    if (!user?.employer_profile) {
      return res.status(403).json({ success: false, message: 'Employer not found' });
    }
    
    const job = await prisma.jobPost.findFirst({
      where: { id, employer_id: user.employer_profile.id }
    });
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const statusRecord = await prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    });
    
    if (!statusRecord) {
      return res.status(404).json({ success: false, message: `Status '${status}' not found` });
    }
    
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status_id: statusRecord.id,
        updated_at: new Date()
      }
    });
    
    res.json({ success: true, data: updatedJob, message: `Job ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    console.error('Error updating job status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== UPDATE JOB STATUS ==========
app.put('/api/jobs/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('=== UPDATE JOB STATUS ===');
    console.log('Job ID:', id);
    console.log('Request body:', req.body);
    console.log('Status received:', status);
    
    // Validate status is provided
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    // Validate status value
    if (status !== 'Open' && status !== 'Closed') {
      return res.status(400).json({ success: false, message: 'Status must be either "Open" or "Closed"' });
    }
    
    // Get the employer profile
    const employer = await prisma.employerProfile.findFirst({
      where: { user_id: req.user!.id }
    });
    
    if (!employer) {
      return res.status(403).json({ success: false, message: 'Employer profile not found' });
    }
    
    // Check if job exists and belongs to this employer
    const job = await prisma.jobPost.findFirst({
      where: {
        id: id,
        employer_id: employer.id
      }
    });
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or you do not have permission' });
    }
    
    // Get the status record from database
    const statusRecord = await prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    });
    
    if (!statusRecord) {
      return res.status(404).json({ success: false, message: `Status '${status}' not found in database` });
    }
    
    // Update the job status
    const updatedJob = await prisma.jobPost.update({
      where: { id: id },
      data: {
        status_id: statusRecord.id,
        updated_at: new Date()
      },
      include: {
        status: true,
        industry: true,
        employment_type: true
      }
    });
    
    console.log(`✅ Job ${id} status updated to ${status}`);
    
    res.json({
      success: true,
      data: updatedJob,
      message: `Job ${status.toLowerCase()} successfully`
    });
  } catch (error: any) {
    console.error('Error updating job status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// SPECIFIC ROUTES FIRST - put this BEFORE any generic routes
app.put('/api/jobs/:id/status', authMiddleware, async (req: Request, res: Response) => {
  // ... status update logic
});

// Then generic routes
app.put('/api/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  // ... general update logic
});

app.delete('/api/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  // ... delete logic
});

// ========== LOGIN ENDPOINT ==========
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    
    console.log('🔐 Login attempt for email:', email)
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      })
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })
    
    if (!user) {
      console.log('❌ User not found:', email)
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }
    
    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Account deactivated:', email)
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      })
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email)
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type?.type_name }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '7d' }
    )
    
    // Get user type name
    const userTypeName = user.user_type?.type_name || 'Job Seeker'
    
    // Get full name from profile
    let fullName = user.full_name || null
    if (!fullName) {
      if (user.seeker_profile) {
        fullName = user.seeker_profile.full_name
      } else if (user.employer_profile) {
        fullName = user.employer_profile.company_name
      }
    }
    
    const responseUser = {
      id: user.id,
      email: user.email,
      user_type: userTypeName,
      full_name: fullName
    }
    
    console.log('✅ Login successful for:', email)
    console.log('👤 User type:', userTypeName)
    console.log('🔑 Token generated:', token ? 'Yes' : 'No')
    
    res.json({
      success: true,
      token,
      user: responseUser
    })
  } catch (error: any) {
    console.error('❌ Login error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
})




// ========== ADMIN ANALYTICS ENDPOINT ==========
app.get('/api/admin/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin or super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (currentUser?.user_type?.type_name !== 'Admin' && 
        currentUser?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const { period = '30d' } = req.query
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // User Statistics
    const totalUsers = await prisma.user.count()
    const totalJobSeekers = await prisma.user.count({ 
      where: { user_type: { type_name: 'Job Seeker' } } 
    })
    const totalEmployers = await prisma.user.count({ 
      where: { user_type: { type_name: 'Employer' } } 
    })
    const totalAdmins = await prisma.user.count({ 
      where: { user_type: { type_name: { in: ['Admin', 'Super Admin'] } } } 
    })
    
    const newUsersThisMonth = await prisma.user.count({
      where: { created_at: { gte: startDate } }
    })
    
    // Job Statistics
    const totalJobs = await prisma.jobPost.count()
    const activeJobs = await prisma.jobPost.count({ 
      where: { status: { status_name: 'Open' } } 
    })
    const closedJobs = await prisma.jobPost.count({ 
      where: { status: { status_name: 'Closed' } } 
    })
    const newJobsThisMonth = await prisma.jobPost.count({
      where: { created_at: { gte: startDate } }
    })
    
    // Application Statistics
    const totalApplications = await prisma.jobApplication.count()
    const newApplicationsThisMonth = await prisma.jobApplication.count({
      where: { applied_at: { gte: startDate } }
    })
    
    const pendingApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Pending' } } 
    })
    const reviewedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Reviewed' } } 
    })
    const shortlistedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Shortlisted' } } 
    })
    const interviewApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Interview' } } 
    })
    const acceptedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Accepted' } } 
    })
    const rejectedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Rejected' } } 
    })
    
    // Engagement Metrics
    const totalViewsResult = await prisma.jobPost.aggregate({
      _sum: { views_count: true }
    })
    const totalViews = totalViewsResult._sum.views_count || 0
    const averageViewsPerJob = totalJobs > 0 ? Math.round(totalViews / totalJobs) : 0
    const averageApplicationsPerJob = totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0
    const conversionRate = totalViews > 0 ? Math.round((totalApplications / totalViews) * 100) : 0
    
    // Monthly trend data (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthName = months[d.getMonth()]
      const year = d.getFullYear()
      
      const usersCount = await prisma.user.count({
        where: {
          created_at: {
            gte: new Date(year, d.getMonth(), 1),
            lt: new Date(year, d.getMonth() + 1, 1)
          }
        }
      })
      
      const jobsCount = await prisma.jobPost.count({
        where: {
          created_at: {
            gte: new Date(year, d.getMonth(), 1),
            lt: new Date(year, d.getMonth() + 1, 1)
          }
        }
      })
      
      const applicationsCount = await prisma.jobApplication.count({
        where: {
          applied_at: {
            gte: new Date(year, d.getMonth(), 1),
            lt: new Date(year, d.getMonth() + 1, 1)
          }
        }
      })
      
      monthlyData.push({
        month: monthName,
        users: usersCount,
        jobs: jobsCount,
        applications: applicationsCount
      })
    }
    
    // Applications by status
    const applicationsByStatus = [
      { status: 'Pending', count: pendingApplications },
      { status: 'Reviewed', count: reviewedApplications },
      { status: 'Shortlisted', count: shortlistedApplications },
      { status: 'Interview', count: interviewApplications },
      { status: 'Accepted', count: acceptedApplications },
      { status: 'Rejected', count: rejectedApplications }
    ].filter(s => s.count > 0)
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalJobSeekers,
        totalEmployers,
        totalAdmins,
        totalJobs,
        activeJobs,
        closedJobs,
        totalApplications,
        pendingApplications,
        reviewedApplications,
        shortlistedApplications,
        interviewApplications,
        acceptedApplications,
        rejectedApplications,
        newUsersThisMonth,
        newJobsThisMonth,
        newApplicationsThisMonth,
        totalViews,
        averageViewsPerJob,
        averageApplicationsPerJob,
        conversionRate,
        jobsByMonth: monthlyData,
        applicationsByStatus
      }
    })
  } catch (error: any) {
    console.error('Error fetching admin analytics:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== ADMIN GET ALL JOBS ==========
app.get('/api/admin/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (currentUser?.user_type?.type_name !== 'Admin' && 
        currentUser?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const { limit = 10, status, search } = req.query
    
    let where: any = {}
    if (status && status !== 'all') {
      where.status = { status_name: status }
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { employer: { company_name: { contains: search as string, mode: 'insensitive' } } }
      ]
    }
    
    const jobs = await prisma.jobPost.findMany({
      where,
      include: {
        employer: true,
        industry: true,
        employment_type: true,
        status: true
      },
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit as string) : undefined
    })
    
    res.json({ success: true, data: jobs })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})
// ========== ADMIN USER MANAGEMENT ==========
app.get('/api/admin/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Admin users endpoint called')
    
    // Check if user is admin or super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    console.log('Current user:', currentUser?.email, 'Role:', currentUser?.user_type?.type_name)
    
    if (!currentUser || (currentUser.user_type?.type_name !== 'Admin' && currentUser.user_type?.type_name !== 'Super Admin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' })
    }
    
    // Get query parameters
    const { page = 1, limit = 20, search = '', role = 'all', status = 'all' } = req.query
    
    // Build where clause
    let where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { full_name: { contains: search as string, mode: 'insensitive' } },
        { seeker_profile: { full_name: { contains: search as string, mode: 'insensitive' } } },
        { employer_profile: { company_name: { contains: search as string, mode: 'insensitive' } } }
      ]
    }
    
    if (role && role !== 'all') {
      where.user_type = { type_name: role as string }
    }
    
    if (status && status !== 'all') {
      where.is_active = status === 'active'
    }
    
    // Get users with user_type always included
    const users = await prisma.user.findMany({
      where,
      include: {
        user_type: true,  // Always include user_type
        seeker_profile: true,
        employer_profile: {
          include: {
            industry: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    })
    
    // Get total count
    const total = await prisma.user.count({ where })
    
    // Calculate stats
    const stats = {
      total: await prisma.user.count(),
      active: await prisma.user.count({ where: { is_active: true } }),
      suspended: await prisma.user.count({ where: { is_active: false } }),
      jobSeekers: await prisma.user.count({ where: { user_type: { type_name: 'Job Seeker' } } }),
      employers: await prisma.user.count({ where: { user_type: { type_name: 'Employer' } } }),
      admins: await prisma.user.count({ where: { user_type: { type_name: 'Admin' } } }),
      superAdmins: await prisma.user.count({ where: { user_type: { type_name: 'Super Admin' } } })
    }
    
    // Format users - ensure user_type is always present
    const formattedUsers = users.map(user => {
      // Ensure user_type exists with default if somehow missing
      const userType = user.user_type || { id: 0, type_name: 'Job Seeker' }
      
      // Get phone from seeker_profile only
      const phone = user.seeker_profile?.phone || null
      const location = user.seeker_profile?.location || user.employer_profile?.location || null
      const fullName = user.full_name || user.seeker_profile?.full_name || user.employer_profile?.company_name || 'N/A'
      
      return {
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone: phone,
        location: location,
        user_type: userType,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        seeker_profile: user.seeker_profile ? {
          ...user.seeker_profile,
          skills: user.seeker_profile.skills || []
        } : null,
        employer_profile: user.employer_profile ? {
          ...user.employer_profile,
          jobs_count: 0  // Will be calculated below
        } : null,
        stats: {
          jobs_count: 0,
          applications_count: 0
        }
      }
    })
    
    // ========== FIXED: Calculate jobs count and applications count correctly ==========
    for (const user of formattedUsers) {
      if (user.employer_profile) {
        // ✅ FIXED: Use employer_profile.id instead of user.id
        const jobsCount = await prisma.jobPost.count({ 
          where: { employer_id: user.employer_profile.id } 
        })
        user.employer_profile.jobs_count = jobsCount
        user.stats.jobs_count = jobsCount
        console.log(`📊 ${user.email} (Employer) has ${jobsCount} job(s)`)
      }
      if (user.seeker_profile) {
        // ✅ FIXED: Use seeker_profile.id instead of user.id
        const appsCount = await prisma.jobApplication.count({ 
          where: { seeker_id: user.seeker_profile.id } 
        })
        user.stats.applications_count = appsCount
        console.log(`📊 ${user.email} (Job Seeker) has ${appsCount} application(s)`)
      }
    }
    
    console.log(`✅ Found ${formattedUsers.length} users, Total: ${total}`)
    
    res.json({
      success: true,
      data: formattedUsers,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})


// ========== ADMIN JOB MANAGEMENT ==========
app.get('/api/admin/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('\n🔍 ========== ADMIN JOBS API ==========')
    
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    console.log('User:', currentUser?.email)
    console.log('Role:', currentUser?.user_type?.type_name)
    
    // Check if admin
    if (!currentUser || (currentUser.user_type?.type_name !== 'Admin' && 
        currentUser.user_type?.type_name !== 'Super Admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    // Get ALL jobs with their relations
    const jobs = await prisma.jobPost.findMany({
      include: {
        employer: {
          include: {
            user: {
              select: { email: true, full_name: true }
            }
          }
        },
        industry: true,
        employment_type: true,
        status: true
      },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`📊 Found ${jobs.length} total jobs in database`)
    
    // Log each job's status for debugging
    jobs.forEach(job => {
      console.log(`Job: ${job.title}, Status: ${job.status?.status_name || 'NO STATUS'}, Status ID: ${job.status_id}`)
    })
    
    // Calculate stats
    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status?.status_name === 'Pending').length,
      approved: jobs.filter(j => j.status?.status_name === 'Open').length,
      rejected: jobs.filter(j => j.status?.status_name === 'Rejected').length,
      closed: jobs.filter(j => j.status?.status_name === 'Closed').length,
      draft: jobs.filter(j => j.status?.status_name === 'Draft').length,
      archived: jobs.filter(j => j.status?.status_name === 'Archived').length
    }
    
    console.log('📈 Stats:', stats)
    
    res.json({
      success: true,
      data: jobs,
      stats,
      pagination: {
        page: 1,
        limit: jobs.length,
        total: jobs.length,
        pages: 1
      }
    })
  } catch (error: any) {
    console.error('❌ Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})


// ========== ADMIN APPLICATIONS MANAGEMENT ==========

// Get all applications for admin
app.get('/api/admin/applications', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('\n🔍 ========== ADMIN APPLICATIONS API ==========')
    
    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (!currentUser || (currentUser.user_type?.type_name !== 'Admin' && 
        currentUser.user_type?.type_name !== 'Super Admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const { search = '', status = 'all', page = 1, limit = 20 } = req.query
    
    // Build where clause
    let where: any = {}
    
    if (search) {
      where.OR = [
        { job: { title: { contains: search as string, mode: 'insensitive' } } },
        { seeker: { full_name: { contains: search as string, mode: 'insensitive' } } },
        { seeker: { user: { email: { contains: search as string, mode: 'insensitive' } } } },
        { job: { employer: { company_name: { contains: search as string, mode: 'insensitive' } } } }
      ]
    }
    
    if (status && status !== 'all') {
      where.status = { status_name: status as string }
    }
    
    // Get applications
    const applications = await prisma.jobApplication.findMany({
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
            industry: true,
            employment_type: true
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
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    })
    
    // Get total count
    const total = await prisma.jobApplication.count({ where })
    
    // Calculate stats
    const stats = {
      total: await prisma.jobApplication.count(),
      pending: await prisma.jobApplication.count({ where: { status: { status_name: 'Pending' } } }),
      reviewed: await prisma.jobApplication.count({ where: { status: { status_name: 'Reviewed' } } }),
      shortlisted: await prisma.jobApplication.count({ where: { status: { status_name: 'Shortlisted' } } }),
      interview: await prisma.jobApplication.count({ where: { status: { status_name: 'Interview' } } }),
      accepted: await prisma.jobApplication.count({ where: { status: { status_name: 'Accepted' } } }),
      rejected: await prisma.jobApplication.count({ where: { status: { status_name: 'Rejected' } } })
    }
    
    console.log(`Found ${applications.length} applications`)
    console.log('Stats:', stats)
    
    res.json({
      success: true,
      data: applications,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update application status (admin)
app.put('/api/admin/applications/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    console.log(`Updating application ${id} status to: ${status}`)
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (!currentUser || (currentUser.user_type?.type_name !== 'Admin' && 
        currentUser.user_type?.type_name !== 'Super Admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const statusRecord = await prisma.jobApplicationStatus.findFirst({
      where: { status_name: status }
    })
    
    if (!statusRecord) {
      return res.status(404).json({ success: false, message: `Status '${status}' not found` })
    }
    
    const application = await prisma.jobApplication.update({
      where: { id },
      data: {
        status_id: statusRecord.id,
        updated_at: new Date()
      },
      include: {
        job: true,
        seeker: {
          include: { user: true }
        }
      }
    })
    
    // Create notification for job seeker
    await prisma.notification.create({
      data: {
        user_id: application.seeker.user_id,
        title: 'Application Status Updated',
        message: `Your application for "${application.job.title}" has been ${status.toLowerCase()}`,
        type: 'application_update',
        metadata: { application_id: id, status },
        created_at: new Date()
      }
    })
    
    res.json({ success: true, message: `Application ${status.toLowerCase()} successfully` })
  } catch (error: any) {
    console.error('Error updating application status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update job status (approve/reject)
app.put('/api/admin/jobs/:jobId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const { status, reason } = req.body
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (currentUser?.user_type?.type_name !== 'Admin' && 
        currentUser?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const statusRecord = await prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    })
    
    if (!statusRecord) {
      return res.status(404).json({ success: false, message: 'Status not found' })
    }
    
    const job = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        status_id: statusRecord.id,
        updated_at: new Date()
      },
      include: {
        employer: {
          include: { user: true }
        }
      }
    })
    
    app.get('/api/admin/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    });
    
    if (currentUser?.user_type?.type_name !== 'Admin' && 
        currentUser?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // ========== BASIC STATS ==========
    const totalUsers = await prisma.user.count();
    const totalJobSeekers = await prisma.user.count({ 
      where: { user_type: { type_name: 'Job Seeker' } } 
    });
    const totalEmployers = await prisma.user.count({ 
      where: { user_type: { type_name: 'Employer' } } 
    });
    const totalAdmins = await prisma.user.count({ 
      where: { user_type: { type_name: { in: ['Admin', 'Super Admin'] } } } 
    });
    
    const totalJobs = await prisma.jobPost.count();
    const activeJobs = await prisma.jobPost.count({ 
      where: { status: { status_name: 'Open' } } 
    });
    const closedJobs = await prisma.jobPost.count({ 
      where: { status: { status_name: 'Closed' } } 
    });
    
    const totalApplications = await prisma.jobApplication.count();
    const pendingApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Pending' } } 
    });
    const acceptedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Accepted' } } 
    });
    const rejectedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Rejected' } } 
    });
    
    const totalViews = (await prisma.jobPost.aggregate({ _sum: { views_count: true } }))._sum.views_count || 0;
    const averageApplicationsPerJob = totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0;
    const conversionRate = totalViews > 0 ? Math.round((totalApplications / totalViews) * 100) : 0;
    
    // ========== JOBS BY INDUSTRY (DIRECT QUERY) ==========
    const jobsByIndustryRaw = await prisma.$queryRaw`
      SELECT i.industry_name, COUNT(j.id) as count
      FROM "JobIndustry" i
      INNER JOIN "JobPost" j ON j.industry_id = i.id
      GROUP BY i.id, i.industry_name
      ORDER BY count DESC
      LIMIT 5
    `;
    
    const jobsByIndustry = (jobsByIndustryRaw as any[]).map(item => ({
      industry: item.industry_name,
      count: Number(item.count)
    }));
    
    // ========== JOBS BY TYPE (DIRECT QUERY) ==========
    const jobsByTypeRaw = await prisma.$queryRaw`
      SELECT e.type_name, COUNT(j.id) as count
      FROM "EmploymentType" e
      INNER JOIN "JobPost" j ON j.employment_type_id = e.id
      GROUP BY e.id, e.type_name
      ORDER BY count DESC
    `;
    
    const jobsByType = (jobsByTypeRaw as any[]).map(item => ({
      type: item.type_name,
      count: Number(item.count)
    }));
    

    app.get('/api/debug/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { seeker_profile: true }
    });
    
    if (user?.seeker_profile) {
      // Parse the data
      let experience = [];
      let education = [];
      
      try {
        experience = JSON.parse(user.seeker_profile.experience || '[]');
      } catch(e) { experience = []; }
      
      try {
        education = JSON.parse(user.seeker_profile.education || '[]');
      } catch(e) { education = []; }
      
      res.json({
        raw_experience: user.seeker_profile.experience,
        raw_education: user.seeker_profile.education,
        parsed_experience: experience,
        parsed_education: education,
        experience_count: experience.length,
        education_count: education.length
      });
    }
  } catch (error) {
    res.json({ error: String(error) });
  }
});
    // ========== TOP EMPLOYERS (DIRECT QUERY) ==========
    const topEmployersRaw = await prisma.$queryRaw`
      SELECT ep.company_name, COUNT(j.id) as job_count, COALESCE(SUM(j.views_count), 0) as total_views
      FROM "EmployerProfile" ep
      INNER JOIN "JobPost" j ON j.employer_id = ep.id
      GROUP BY ep.id, ep.company_name
      ORDER BY job_count DESC
      LIMIT 5
    `;
    
    const topEmployers = (topEmployersRaw as any[]).map(item => ({
      name: item.company_name,
      jobCount: Number(item.job_count),
      views: Number(item.total_views)
    }));



    // ========== SUPER ADMIN - ADMIN MANAGEMENT ENDPOINTS ==========

// Get all admins (Super Admin only)
app.get('/api/super-admin/admins', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    // Get all users with Admin or Super Admin role
    const admins = await prisma.user.findMany({
      where: {
        user_type: {
          type_name: { in: ['Admin', 'Super Admin'] }
        }
      },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      },
      orderBy: { created_at: 'desc' }
    })
    
    // Format admin data
    const formattedAdmins = admins.map(admin => ({
      id: admin.id,
      full_name: admin.full_name || admin.email?.split('@')[0] || 'Admin',
      email: admin.email,
      phone: admin.seeker_profile?.phone || admin.employer_profile?.phone || null,
      avatar: admin.avatar || null,
      role: admin.user_type?.type_name,
      is_active: admin.is_active,
      last_login: admin.updated_at,
      created_at: admin.created_at
    }))
    
    res.json({
      success: true,
      data: formattedAdmins
    })
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create new admin (Super Admin only)
app.post('/api/super-admin/admins', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, phone, role } = req.body
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' })
    }
    
    // Get user type ID
    const userType = await prisma.userType.findFirst({
      where: { type_name: role || 'Admin' }
    })
    
    if (!userType) {
      return res.status(400).json({ success: false, message: 'Invalid user type' })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        full_name,
        user_type_id: userType.id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    
    // Create profile based on role (for admin, create seeker profile or employer profile?)
    // Admins typically don't need job seeker or employer profiles, but we'll create a basic one
    await prisma.jobSeekerProfile.create({
      data: {
        user_id: user.id,
        full_name: full_name,
        phone: phone || null,
        skills: []
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: userType.type_name
      }
    })
  } catch (error: any) {
    console.error('Error creating admin:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update admin (Super Admin only)
app.put('/api/super-admin/admins/:adminId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    const { full_name, phone, role, is_active } = req.body
    
    // Get user type ID if role is changing
    let userTypeId;
    if (role) {
      const userType = await prisma.userType.findFirst({
        where: { type_name: role }
      })
      if (!userType) {
        return res.status(400).json({ success: false, message: 'Invalid user type' })
      }
      userTypeId = userType.id
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: adminId },
      data: {
        full_name: full_name,
        user_type_id: userTypeId,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date()
      }
    })
    
    // Update seeker profile if exists
    const seekerProfile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: adminId }
    })
    
    if (seekerProfile && phone !== undefined) {
      await prisma.jobSeekerProfile.update({
        where: { id: seekerProfile.id },
        data: { phone, full_name }
      })
    }
    
    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        is_active: updatedUser.is_active
      }
    })
  } catch (error: any) {
    console.error('Error updating admin:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reset admin password (Super Admin only)
app.post('/api/super-admin/admins/:adminId/reset-password', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { id: adminId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    })
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Suspend admin (Super Admin only)
app.put('/api/super-admin/admins/:adminId/suspend', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    
    // Don't allow suspending yourself
    if (adminId === req.user!.id) {
      return res.status(400).json({ success: false, message: 'Cannot suspend your own account' })
    }
    
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    })
    
    res.json({
      success: true,
      message: 'Admin suspended successfully',
      data: { is_active: updatedAdmin.is_active }
    })
  } catch (error: any) {
    console.error('Error suspending admin:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Activate admin (Super Admin only)
app.put('/api/super-admin/admins/:adminId/activate', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        is_active: true,
        updated_at: new Date()
      }
    })
    
    res.json({
      success: true,
      message: 'Admin activated successfully',
      data: { is_active: updatedAdmin.is_active }
    })
  } catch (error: any) {
    console.error('Error activating admin:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete admin (Super Admin only)
app.delete('/api/super-admin/admins/:adminId', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    
    // Don't allow deleting yourself
    if (adminId === req.user!.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' })
    }
    
    // Get admin details before deletion
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { seeker_profile: true, employer_profile: true }
    })
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' })
    }
    
    // Delete related data
    if (admin.seeker_profile) {
      await prisma.jobApplication.deleteMany({
        where: { seeker_id: admin.seeker_profile.id }
      })
      await prisma.jobBookmark.deleteMany({
        where: { seeker_id: admin.seeker_profile.id }
      })
      await prisma.jobSeekerProfile.delete({
        where: { id: admin.seeker_profile.id }
      })
    }
    
    if (admin.employer_profile) {
      const jobs = await prisma.jobPost.findMany({
        where: { employer_id: admin.employer_profile.id }
      })
      for (const job of jobs) {
        await prisma.jobApplication.deleteMany({
          where: { job_id: job.id }
        })
      }
      await prisma.jobPost.deleteMany({
        where: { employer_id: admin.employer_profile.id }
      })
      await prisma.employerProfile.delete({
        where: { id: admin.employer_profile.id }
      })
    }
    
    await prisma.notification.deleteMany({
      where: { user_id: adminId }
    })
    
    // Delete the user
    await prisma.user.delete({
      where: { id: adminId }
    })
    
    res.json({
      success: true,
      message: 'Admin deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting admin:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})
    
    // ========== TOP SKILLS ==========
    const allSkills = await prisma.jobSeekerProfile.findMany({
      select: { skills: true }
    });
    const skillCount: Record<string, number> = {};
    allSkills.forEach(profile => {
      if (profile.skills && Array.isArray(profile.skills)) {
        profile.skills.forEach(skill => {
          if (skill && skill.trim()) {
            skillCount[skill] = (skillCount[skill] || 0) + 1;
          }
        });
      }
    });
    const topSkills = Object.entries(skillCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // ========== APPLICATION STATUS DISTRIBUTION ==========
    const reviewedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Reviewed' } } 
    });
    const shortlistedApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Shortlisted' } } 
    });
    const interviewApplications = await prisma.jobApplication.count({ 
      where: { status: { status_name: 'Interview' } } 
    });
    
    console.log('Jobs by Industry:', jobsByIndustry);
    console.log('Jobs by Type:', jobsByType);
    console.log('Top Employers:', topEmployers);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalJobSeekers,
        totalEmployers,
        totalAdmins,
        newUsersThisMonth: totalUsers,
        userGrowth: 0,
        activeUsers: totalUsers,
        totalJobs,
        activeJobs,
        closedJobs,
        newJobsThisMonth: totalJobs,
        jobGrowth: 0,
        jobsByIndustry,
        jobsByType,
        totalApplications,
        pendingApplications,
        reviewedApplications,
        shortlistedApplications,
        interviewApplications,
        acceptedApplications,
        rejectedApplications,
        totalViews,
        averageViewsPerJob: totalJobs > 0 ? Math.round(totalViews / totalJobs) : 0,
        averageApplicationsPerJob,
        conversionRate,
        jobsByMonth: [],
        applicationsByMonth: [],
        topSkills,
        topEmployers
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});




    // Create notification for employer
    if (reason) {
      await prisma.notification.create({
        data: {
          user_id: job.employer.user_id,
          title: `Job ${status}`,
          message: `Your job "${job.title}" has been ${status.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}`,
          type: 'job_update',
          metadata: { job_id: jobId, status, reason },
          created_at: new Date()
        }
      })
    }
    
    res.json({ success: true, message: `Job ${status.toLowerCase()} successfully` })
  } catch (error: any) {
    console.error('Error updating job status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk action on jobs
app.post('/api/admin/jobs/bulk-action', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { jobIds, action } = req.body
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (currentUser?.user_type?.type_name !== 'Admin' && 
        currentUser?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const status = action === 'approve' ? 'Open' : 'Rejected'
    const statusRecord = await prisma.jobPostStatus.findFirst({
      where: { status_name: status }
    })
    
    await prisma.jobPost.updateMany({
      where: { id: { in: jobIds } },
      data: {
        status_id: statusRecord!.id,
        updated_at: new Date()
      }
    })
    
    res.json({ success: true, message: `${jobIds.length} jobs ${action}d successfully` })
  } catch (error: any) {
    console.error('Error in bulk action:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete job (admin only)
app.delete('/api/admin/jobs/:jobId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (currentUser?.user_type?.type_name !== 'Admin' && 
        currentUser?.user_type?.type_name !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { employer: true }
    })
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }
    
    await prisma.jobPost.delete({ where: { id: jobId } })
    
    // Notify employer
    await prisma.notification.create({
      data: {
        user_id: job.employer.user_id,
        title: 'Job Deleted',
        message: `Your job "${job.title}" has been deleted by an administrator.`,
        type: 'job_update',
        metadata: { job_id: jobId },
        created_at: new Date()
      }
    })
    
    res.json({ success: true, message: 'Job deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting job:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== UPDATE USER STATUS (Suspend/Activate) ==========
app.put('/api/admin/users/:userId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { is_active, reason } = req.body
    
    // Get current user with their role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    
    const currentRole = currentUser.user_type?.type_name
    
    // Check if user has permission to modify status
    if (currentRole !== 'Admin' && currentRole !== 'Super Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admin or Super Admin can update user status.' 
      })
    }
    
    // Don't allow modifying own status
    if (userId === req.user!.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify your own account status' 
      })
    }
    
    // Get target user with their role
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_type: true, seeker_profile: true, employer_profile: true }
    })
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    const targetRole = targetUser.user_type?.type_name
    
    // ========== ROLE-BASED PERMISSION CHECKS ==========
    
    // Super Admin can suspend/activate anyone except themselves (already checked)
    if (currentRole === 'Super Admin') {
      // Super Admin can do anything, continue
    }
    // Admin can ONLY suspend/activate Job Seekers and Employers
    else if (currentRole === 'Admin') {
      if (targetRole !== 'Job Seeker' && targetRole !== 'Employer') {
        return res.status(403).json({ 
          success: false, 
          message: `Admin cannot ${is_active ? 'activate' : 'suspend'} ${targetRole} accounts. Only Job Seekers and Employers can be managed.`,
          allowed_roles: ['Job Seeker', 'Employer'],
          your_role: currentRole,
          target_role: targetRole
        })
      }
    }
    
    // Prevent suspending the last Super Admin
    if (targetRole === 'Super Admin' && !is_active) {
      const superAdminCount = await prisma.user.count({
        where: { 
          user_type: { type_name: 'Super Admin' }, 
          is_active: true 
        }
      })
      
      if (superAdminCount <= 1) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot suspend the last active Super Admin account. This would lock out all administrators.' 
        })
      }
    }
    
    // Check if trying to suspend already suspended user or activate already active user
    if (targetUser.is_active === is_active) {
      const statusText = is_active ? 'active' : 'suspended'
      return res.status(400).json({ 
        success: false, 
        message: `User is already ${statusText}. No changes made.` 
      })
    }
    
    // ========== UPDATE USER STATUS ==========
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        is_active: is_active,
        updated_at: new Date()
      }
    })
    
    // ========== SEND EMAIL NOTIFICATION ==========
    try {
      const userName = targetUser.full_name || 
                      targetUser.seeker_profile?.full_name || 
                      targetUser.employer_profile?.company_name || 
                      targetUser.email?.split('@')[0] || 
                      'User'
      
      const statusText = is_active ? 'activated' : 'suspended'
      const statusColor = is_active ? '#10b981' : '#ef4444'
      const statusBgColor = is_active ? '#059669' : '#dc2626'
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account ${is_active ? 'Activated' : 'Suspended'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${statusColor}, ${statusBgColor}); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .button { background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .button:hover { background: ${statusBgColor}; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${statusColor}20; color: ${statusColor}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Account ${is_active ? 'Activated' : 'Suspended'}</h1>
            </div>
            <div class="content">
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="status-badge">${statusText.toUpperCase()}</span>
              </div>
              <h3 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h3>
              <p>Your Job Portal account has been <strong>${statusText}</strong> by an administrator.</p>
              ${reason ? `
                <div class="reason-box">
                  <strong style="color: #92400e;">📝 Reason Provided:</strong>
                  <p style="margin: 8px 0 0 0; color: #78350f;">${reason}</p>
                </div>
              ` : ''}
              <p>${is_active 
                ? 'You can now log in and continue using the platform. Click the button below to access your account.' 
                : 'If you believe this is an error or would like to appeal this decision, please contact our support team.'}
              </p>
              ${is_active ? `
                <div style="text-align: center;">
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" class="button">Login to Your Account</a>
                </div>
              ` : `
                <div style="text-align: center; margin-top: 20px;">
                  <p style="color: #6b7280; font-size: 14px;">Contact us at: <a href="mailto:${process.env.EMAIL_USER}" style="color: ${statusColor};">${process.env.EMAIL_USER}</a></p>
                </div>
              `}
              <p style="margin-top: 30px;">Best regards,<br><strong>Job Portal Support Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
              <p style="margin-top: 10px;">
                <small>This is an automated message from Job Portal. Please do not reply to this email.</small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })
      
      await emailTransporter.sendMail({
        from: `"Job Portal Support" <${process.env.EMAIL_USER}>`,
        to: targetUser.email,
        subject: `🔔 Account ${is_active ? 'Activated' : 'Suspended'} - Job Portal`,
        html: emailHtml
      })
      
      console.log(`✅ ${is_active ? 'Activation' : 'Suspension'} email sent to ${targetUser.email}`)
    } catch (emailError) {
      console.error('Failed to send status email:', emailError)
      // Don't block the status update if email fails
    }
    
    // ========== CREATE IN-APP NOTIFICATION ==========
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: is_active ? '✅ Account Activated' : '⚠️ Account Suspended',
        message: is_active 
          ? 'Your account has been reactivated. You can now log in and access all features.'
          : `Your account has been suspended.${reason ? ` Reason: ${reason}` : ''} Please contact support for assistance.`,
        type: 'account_status',
        metadata: { 
          reason, 
          action_by: currentUser.email,
          action_by_role: currentRole,
          action_date: new Date().toISOString()
        },
        created_at: new Date()
      }
    })
    
    // ========== LOG ACTION FOR AUDIT ==========
    console.log(`📝 AUDIT: ${currentRole} (${currentUser.email}) ${is_active ? 'activated' : 'suspended'} user ${targetUser.email} (${targetRole})`)
    if (reason) {
      console.log(`📝 Reason: ${reason}`)
    }
    
    res.json({ 
      success: true, 
      message: `User ${is_active ? 'activated' : 'suspended'} successfully`,
      data: {
        user_id: userId,
        email: targetUser.email,
        role: targetRole,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      }
    })
    
  } catch (error: any) {
    console.error('Error updating user status:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while updating user status' 
    })
  }
})
// ========== DELETE USER (Permanent Hard Delete) ==========
app.delete('/api/admin/users/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true }
    })
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    
    const currentRole = currentUser.user_type?.type_name
    
    // Check if user has permission to delete
    if (currentRole !== 'Admin' && currentRole !== 'Super Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admin or Super Admin can delete users.',
        your_role: currentRole,
        required_roles: ['Admin', 'Super Admin']
      })
    }
    
    // Don't allow deleting own account
    if (userId === req.user!.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      })
    }
    
    // Check if target user exists with full details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }
    
    const targetRole = targetUser.user_type?.type_name
    const targetEmail = targetUser.email
    
    // ========== ROLE-BASED PERMISSION CHECKS ==========
    
    // Super Admin can delete anyone except themselves
    if (currentRole === 'Super Admin') {
      // Allow deletion, continue
    }
    // Admin can ONLY delete Job Seekers and Employers
    else if (currentRole === 'Admin') {
      if (targetRole !== 'Job Seeker' && targetRole !== 'Employer') {
        return res.status(403).json({ 
          success: false, 
          message: `Admin cannot delete ${targetRole} accounts. Only Job Seekers and Employers can be deleted.`,
          allowed_roles: ['Job Seeker', 'Employer'],
          your_role: currentRole,
          target_role: targetRole
        })
      }
    }
    
    // Prevent deleting the last Super Admin
    if (targetRole === 'Super Admin') {
      const superAdminCount = await prisma.user.count({
        where: { user_type: { type_name: 'Super Admin' } }
      })
      
      if (superAdminCount <= 1) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot delete the last Super Admin account. This would lock out all administrators.' 
        })
      }
    }
    
    console.log(`📝 AUDIT: ${currentRole} (${currentUser.email}) initiated deletion of user ${targetEmail} (${targetRole})`)
    
    // ========== PERMANENT DELETE - Remove all related data ==========
    
    const deletionSummary = {
      user_email: targetEmail,
      user_role: targetRole,
      deleted_at: new Date().toISOString(),
      deleted_by: currentUser.email,
      deleted_by_role: currentRole,
      details: {}
    }
    
    // 1. Delete job application notes (if job seeker)
    if (targetUser.seeker_profile) {
      const applications = await prisma.jobApplication.findMany({
        where: { seeker_id: targetUser.seeker_profile.id }
      })
      
      for (const app of applications) {
        await prisma.jobApplicationNote.deleteMany({
          where: { application_id: app.id }
        })
      }
      deletionSummary.details['application_notes_deleted'] = applications.length
      
      // 2. Delete job applications
      const deletedApps = await prisma.jobApplication.deleteMany({
        where: { seeker_id: targetUser.seeker_profile.id }
      })
      deletionSummary.details['applications_deleted'] = deletedApps.count
      
      // 3. Delete bookmarks
      const deletedBookmarks = await prisma.jobBookmark.deleteMany({
        where: { seeker_id: targetUser.seeker_profile.id }
      })
      deletionSummary.details['bookmarks_deleted'] = deletedBookmarks.count
      
      // 4. Delete seeker profile
      await prisma.jobSeekerProfile.delete({
        where: { id: targetUser.seeker_profile.id }
      })
      deletionSummary.details['seeker_profile_deleted'] = true
    }
    
    // 5. Delete employer related data (if employer)
    if (targetUser.employer_profile) {
      // Get all jobs by this employer
      const jobs = await prisma.jobPost.findMany({
        where: { employer_id: targetUser.employer_profile.id }
      })
      deletionSummary.details['total_jobs'] = jobs.length
      
      let totalApplicationsDeleted = 0
      let totalBookmarksDeleted = 0
      
      for (const job of jobs) {
        // Delete applications for each job
        const deletedJobApps = await prisma.jobApplication.deleteMany({
          where: { job_id: job.id }
        })
        totalApplicationsDeleted += deletedJobApps.count
        
        // Delete bookmarks for each job
        const deletedJobBookmarks = await prisma.jobBookmark.deleteMany({
          where: { job_id: job.id }
        })
        totalBookmarksDeleted += deletedJobBookmarks.count
      }
      
      deletionSummary.details['job_applications_deleted'] = totalApplicationsDeleted
      deletionSummary.details['job_bookmarks_deleted'] = totalBookmarksDeleted
      
      // Delete all jobs
      const deletedJobs = await prisma.jobPost.deleteMany({
        where: { employer_id: targetUser.employer_profile.id }
      })
      deletionSummary.details['jobs_deleted'] = deletedJobs.count
      
      // Delete managed companies
      const deletedCompanies = await prisma.managedCompany.deleteMany({
        where: { employer_id: targetUser.employer_profile.id }
      })
      deletionSummary.details['managed_companies_deleted'] = deletedCompanies.count
      
      // Delete employer profile
      await prisma.employerProfile.delete({
        where: { id: targetUser.employer_profile.id }
      })
      deletionSummary.details['employer_profile_deleted'] = true
    }
    
    // 6. Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { user_id: userId }
    })
    deletionSummary.details['notifications_deleted'] = deletedNotifications.count
    
    // 7. Delete notification preferences
    await prisma.notificationPreference.deleteMany({
      where: { user_id: userId }
    })
    deletionSummary.details['notification_preferences_deleted'] = true
    
    // 8. Delete search logs
    const deletedSearchLogs = await prisma.searchLog.deleteMany({
      where: { user_id: userId }
    })
    deletionSummary.details['search_logs_deleted'] = deletedSearchLogs.count
    
    // 9. Delete audit logs (if any)
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: { admin_id: userId }
    })
    if (deletedAuditLogs.count > 0) {
      deletionSummary.details['audit_logs_deleted'] = deletedAuditLogs.count
    }
    
    // 10. Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    })
    
    console.log(`✅ User ${targetEmail} (${targetRole}) permanently deleted by ${currentRole} (${currentUser.email})`)
    console.log(`📊 Deletion summary:`, deletionSummary.details)
    
    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          admin_id: currentUser.id,
          action: 'PERMANENT_USER_DELETION',
          target_type: 'USER',
          target_id: userId,
          details: deletionSummary,
          ip_address: req.ip || req.socket.remoteAddress,
          created_at: new Date()
        }
      })
      console.log(`📝 Audit log created for deletion`)
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    }
    
    res.json({ 
      success: true, 
      message: `User ${targetEmail} (${targetRole}) has been permanently deleted from the system`,
      data: deletionSummary
    })
    
  } catch (error: any) {
    console.error('Error permanently deleting user:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while deleting the user' 
    })
  }
})

// ========== RESET USER PASSWORD ==========
app.post('/api/admin/users/:userId/reset-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { newPassword } = req.body
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { user_type: true, seeker_profile: true, employer_profile: true }
    })
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    
    const currentRole = currentUser.user_type?.type_name
    
    // Check if user has permission to reset passwords
    if (currentRole !== 'Admin' && currentRole !== 'Super Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admin or Super Admin can reset passwords.' 
      })
    }
    
    // Get target user with full details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    const targetRole = targetUser.user_type?.type_name
    const targetName = targetUser.full_name || 
                      targetUser.seeker_profile?.full_name || 
                      targetUser.employer_profile?.company_name || 
                      targetUser.email?.split('@')[0] || 
                      'User'
    
    // ========== ROLE-BASED PERMISSION CHECKS ==========
    
    // Super Admin can reset anyone's password except themselves
    if (currentRole === 'Super Admin') {
      if (userId === req.user!.id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Use the "Change Password" feature in your profile to update your own password.' 
        })
      }
      // Allow, continue
    }
    // Admin can ONLY reset passwords for Job Seekers and Employers
    else if (currentRole === 'Admin') {
      if (targetRole !== 'Job Seeker' && targetRole !== 'Employer') {
        return res.status(403).json({ 
          success: false, 
          message: `Admin cannot reset password for ${targetRole} accounts. Only Job Seekers and Employers can be managed.`,
          allowed_roles: ['Job Seeker', 'Employer'],
          your_role: currentRole,
          target_role: targetRole
        })
      }
    }
    
    // Validate password strength
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      })
    }
    
    // Additional password strength checks (optional but recommended)
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    
    let strengthWarning = ''
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      strengthWarning = ' For better security, use uppercase, lowercase, and numbers.'
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updated_at: new Date()
      }
    })
    
    // ========== SEND EMAIL NOTIFICATION ==========
    let emailSent = false
    let emailError = null
    
    try {
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Job Portal</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 16px 16px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .password-box { background: #e0e7ff; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 20px; text-align: center; margin: 20px 0; letter-spacing: 1px; }
            .button { background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: 600; }
            .button:hover { background: #1e40af; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
            .badge { display: inline-block; padding: 4px 12px; background: #e5e7eb; border-radius: 20px; font-size: 12px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
            </div>
            <div class="content">
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge">Security Notification</span>
              </div>
              
              <h3 style="color: #1f2937; margin-top: 0;">Hello ${targetName},</h3>
              
              <p>An administrator has reset your Job Portal account password.</p>
              
              <div class="password-box">
                <strong>Your New Password:</strong><br>
                <span style="font-size: 24px; font-weight: bold;">${newPassword}</span>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Important Security Notice:</strong>
                <p style="margin: 8px 0 0 0;">For your security, please change this password immediately after logging in. Do not share this password with anyone.</p>
              </div>
              
              <div class="info-box">
                <strong>📋 Password Requirements:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                  <li>Minimum 6 characters</li>
                  <li>Use a mix of uppercase and lowercase letters</li>
                  <li>Include numbers for better security</li>
                  <li>Avoid using common words or personal information</li>
                </ul>
                ${strengthWarning ? `<p style="color: #f59e0b; margin-top: 8px;">⚠️ ${strengthWarning}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" class="button">🔑 Login to Your Account</a>
              </div>
              
              <p style="margin-top: 20px;">If you did not request this password reset, please contact our support team immediately at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a>.</p>
              
              <p>Best regards,<br><strong>Job Portal Security Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
              <p style="margin-top: 10px;">
                <small>This is an automated security notification. Please do not reply to this email.</small>
              </p>
              <p style="margin-top: 10px;">
                <small>This password reset was performed by: ${currentUser.email} (${currentRole})</small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      
      await emailTransporter.sendMail({
        from: `"Job Portal Security" <${process.env.EMAIL_USER}>`,
        to: targetUser.email,
        subject: '🔐 Your Password Has Been Reset - Job Portal',
        html: emailHtml
      })
      
      emailSent = true
      console.log(`✅ Password reset email sent to ${targetUser.email}`)
      
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError)
      emailError = emailError.message
      // Don't block the password reset if email fails
    }
    
    // ========== CREATE IN-APP NOTIFICATION ==========
    try {
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: '🔐 Password Reset',
          message: `Your password has been reset by an administrator (${currentUser.email}). Please log in with your new password and change it immediately for security.`,
          type: 'security',
          metadata: { 
            reset_by: currentUser.email,
            reset_by_role: currentRole,
            reset_at: new Date().toISOString(),
            email_sent: emailSent,
            password_reset: true
          },
          created_at: new Date()
        }
      })
      console.log(`✅ In-app notification created for ${targetUser.email}`)
    } catch (notifError) {
      console.error('Failed to create notification:', notifError)
    }
    
    // ========== AUDIT LOG ==========
    console.log(`📝 AUDIT: Password reset for user ${targetUser.email} (${targetRole})`)
    console.log(`   Performed by: ${currentRole} (${currentUser.email})`)
    console.log(`   Time: ${new Date().toISOString()}`)
    console.log(`   Email notification: ${emailSent ? 'Sent' : 'Failed'}`)
    
    res.json({ 
      success: true, 
      message: `Password reset successfully for ${targetUser.email}${emailSent ? '. An email notification has been sent to the user.' : '. Email notification could not be sent, but password has been reset.'}`,
      data: {
        user_id: userId,
        user_email: targetUser.email,
        user_role: targetRole,
        user_name: targetName,
        reset_by: currentUser.email,
        reset_by_role: currentRole,
        reset_at: new Date().toISOString(),
        email_sent: emailSent,
        email_error: emailError || null,
        password_strength_warning: strengthWarning || null
      }
    })
    
  } catch (error: any) {
    console.error('Error resetting password:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while resetting the password' 
    })
  }
})
// ========== JOB SEEKER PREFERENCES ==========

// Get job seeker preferences
app.get('/api/jobseeker/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    
    // Check if user is a job seeker
    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!seeker) {
      return res.status(403).json({ success: false, message: 'Only job seekers can access preferences' })
    }
    
    // Get or create preferences
    let preferences = await prisma.jobSeekerPreference.findUnique({
      where: { seeker_id: seeker.id }
    })
    
    if (!preferences) {
      preferences = await prisma.jobSeekerPreference.create({
        data: {
          seeker_id: seeker.id,
          job_alerts_enabled: true,
          email_notifications: true,
          push_notifications: false,
          profile_visibility: 'public',
          preferred_job_types: [],
          preferred_industries: [],
          notification_frequency: 'instant',
          resume_visibility: true,
          allow_employer_contact: true
        }
      })
    }
    
    res.json({ success: true, data: preferences })
  } catch (error: any) {
    console.error('Error fetching preferences:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update job seeker preferences
app.put('/api/jobseeker/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      job_alerts_enabled,
      email_notifications,
      push_notifications,
      profile_visibility,
      preferred_job_types,
      preferred_locations,
      preferred_industries,
      min_salary,
      max_salary,
      experience_level,
      notification_frequency,
      resume_visibility,
      allow_employer_contact
    } = req.body
    
    const seeker = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!seeker) {
      return res.status(403).json({ success: false, message: 'Only job seekers can update preferences' })
    }
    
    const preferences = await prisma.jobSeekerPreference.upsert({
      where: { seeker_id: seeker.id },
      update: {
        job_alerts_enabled,
        email_notifications,
        push_notifications,
        profile_visibility,
        preferred_job_types,
        preferred_locations,
        preferred_industries,
        min_salary,
        max_salary,
        experience_level,
        notification_frequency,
        resume_visibility,
        allow_employer_contact,
        updated_at: new Date()
      },
      create: {
        seeker_id: seeker.id,
        job_alerts_enabled: job_alerts_enabled ?? true,
        email_notifications: email_notifications ?? true,
        push_notifications: push_notifications ?? false,
        profile_visibility: profile_visibility ?? 'public',
        preferred_job_types: preferred_job_types ?? [],
        preferred_locations: preferred_locations ?? [],
        preferred_industries: preferred_industries ?? [],
        min_salary: min_salary ?? null,
        max_salary: max_salary ?? null,
        experience_level: experience_level ?? 'entry',
        notification_frequency: notification_frequency ?? 'instant',
        resume_visibility: resume_visibility ?? true,
        allow_employer_contact: allow_employer_contact ?? true
      }
    })
    
    res.json({ success: true, data: preferences, message: 'Preferences updated successfully' })
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})



// ========== GET USER PROFILE (for Settings page) ==========
app.get('/api/profile/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { 
        user_type: true, 
        seeker_profile: true, 
        employer_profile: { include: { industry: true } } 
      }
    })
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    // Handle both seeker and employer profiles
    let profile = null
    let fullName = user.full_name || null
    let phone = null
    let title = null
    let avatar = null
    let coverImage = null
    
    if (user.seeker_profile) {
      profile = user.seeker_profile
      fullName = fullName || profile.full_name
      phone = profile.phone
      title = profile.title
      avatar = profile.avatar
      coverImage = profile.cover_image
    } else if (user.employer_profile) {
      profile = user.employer_profile
      fullName = fullName || profile.company_name
      phone = profile.phone
      title = null
      avatar = profile.logo_url
      coverImage = profile.cover_image
    }
    
    res.json({ 
      success: true, 
      data: { 
        user: { 
          id: user.id, 
          email: user.email, 
          user_type: user.user_type?.type_name,
          full_name: fullName
        }, 
        profile: {
          ...profile,
          full_name: fullName,
          phone: phone,
          title: title,
          avatar: avatar,
          cover_image: coverImage
        }
      } 
    })
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== GET NOTIFICATION PREFERENCES ==========
app.get('/api/notifications/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    
    // Get or create notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { user_id: userId }
    })
    
    if (!preferences) {
      // Create default preferences with correct field names
      preferences = await prisma.notificationPreference.create({
        data: {
          user_id: userId,
          email_notifications: true,
          application_updates: true,  // Changed from application_alerts
          marketing_emails: false,
          push_notifications: true,
          status_changes: true,
          weekly_digest: false
        }
      })
    }
    
    // Map the response to match frontend expectations
    res.json({ 
      success: true, 
      data: {
        email_notifications: preferences.email_notifications,
        application_alerts: preferences.application_updates,  // Map to frontend field name
        marketing_emails: preferences.marketing_emails,
        push_notifications: preferences.push_notifications,
        status_changes: preferences.status_changes,
        weekly_digest: preferences.weekly_digest
      }
    })
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== UPDATE NOTIFICATION PREFERENCES ==========
app.put('/api/notifications/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      email_notifications,
      application_alerts,  // Frontend sends this
      marketing_emails,
      push_notifications,
      status_changes,
      weekly_digest
    } = req.body
    
    // Update with correct field names
    const preferences = await prisma.notificationPreference.upsert({
      where: { user_id: userId },
      update: {
        email_notifications: email_notifications !== undefined ? email_notifications : undefined,
        application_updates: application_alerts !== undefined ? application_alerts : undefined,  // Map to correct field
        marketing_emails: marketing_emails !== undefined ? marketing_emails : undefined,
        push_notifications: push_notifications !== undefined ? push_notifications : undefined,
        status_changes: status_changes !== undefined ? status_changes : undefined,
        weekly_digest: weekly_digest !== undefined ? weekly_digest : undefined,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        email_notifications: email_notifications ?? true,
        application_updates: application_alerts ?? true,  // Map to correct field
        marketing_emails: marketing_emails ?? false,
        push_notifications: push_notifications ?? true,
        status_changes: status_changes ?? true,
        weekly_digest: weekly_digest ?? false
      }
    })
    
    // Return mapped response
    res.json({ 
      success: true, 
      data: {
        email_notifications: preferences.email_notifications,
        application_alerts: preferences.application_updates,
        marketing_emails: preferences.marketing_emails,
        push_notifications: preferences.push_notifications,
        status_changes: preferences.status_changes,
        weekly_digest: preferences.weekly_digest
      },
      message: 'Notification preferences updated successfully' 
    })
  } catch (error: any) {
    console.error('Error updating notification preferences:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})


// ========== APPLICATION ROUTES ==========
app.post('/api/applications/apply/:jobId', authMiddleware, upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const { coverLetter } = req.body
    
    console.log(`📝 ========== NEW APPLICATION ==========`);
    console.log(`Job ID: ${jobId}`);
    console.log(`User Email: ${req.user!.email}`);
    
    const job = await prisma.jobPost.findUnique({ 
      where: { id: jobId }, 
      include: { status: true, employer: { include: { user: true } } } 
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status.status_name !== 'Open') return res.status(400).json({ success: false, message: 'Job is no longer accepting applications' });
    
    let seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user!.id } });
    if (!seeker) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      seeker = await prisma.jobSeekerProfile.create({ 
        data: { user_id: req.user!.id, full_name: user?.full_name || user?.email?.split('@')[0] || 'User', skills: [] } 
      });
    }
    
    const existing = await prisma.jobApplication.findFirst({ where: { job_id: jobId, seeker_id: seeker.id } });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    
    const pendingStatus = await prisma.jobApplicationStatus.findFirst({ where: { status_name: 'Pending' } });
    const application = await prisma.jobApplication.create({
      data: { 
        job_id: jobId, 
        seeker_id: seeker.id, 
        cover_letter: coverLetter || null, 
        resume_url: req.file ? `/uploads/resumes/${req.file.filename}` : null, 
        status_id: pendingStatus!.id, 
        applied_at: new Date() 
      }
    });
    
    console.log(`✅ Application created: ${application.id}`);
    
    await prisma.jobPost.update({ where: { id: jobId }, data: { applications_count: { increment: 1 } } });
    
    // ========== SEND EMAIL TO JOB SEEKER ==========
    try {
      console.log(`📧 Sending confirmation email to: ${req.user!.email}`);
      
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await emailTransporter.sendMail({
        from: `"Job Portal" <${process.env.EMAIL_USER}>`,
        to: req.user!.email,
        subject: `✅ Application Submitted: ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center;">
              <h2>✅ Application Received!</h2>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h3>Hello ${seeker.full_name},</h3>
              <p>Your application for <strong>${job.title}</strong> at <strong>${job.employer.company_name}</strong> has been submitted successfully.</p>
              <p>The employer will review your application and update you on the status.</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Track Your Application</a>
              <p>Best regards,<br><strong>Job Portal Team</strong></p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #6b7280;">
              <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            </div>
          </div>
        `
      });
      
      console.log(`✅ Application confirmation email sent to: ${req.user!.email}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send email to job seeker:', emailError);
    }
    
    // ========== SEND EMAIL TO EMPLOYER ==========
    try {
      console.log(`📧 Sending notification email to employer: ${job.employer.user.email}`);
      
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await emailTransporter.sendMail({
        from: `"Job Portal" <${process.env.EMAIL_USER}>`,
        to: job.employer.user.email,
        subject: `🎯 New Application: ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
              <h2>🎯 New Application Received!</h2>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h3>Hello ${job.employer.company_name} Team,</h3>
              <p>A new candidate has applied for <strong>${job.title}</strong>.</p>
              <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Applicant:</strong> ${seeker.full_name}</p>
                <p><strong>Email:</strong> ${req.user!.email}</p>
                ${coverLetter ? `<p><strong>Cover Letter:</strong> ${coverLetter.substring(0, 200)}${coverLetter.length > 200 ? '...' : ''}</p>` : ''}
              </div>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/employer/applications" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Application</a>
              <p>Best regards,<br><strong>Job Portal Team</strong></p>
            </div>
          </div>
        `
      });
      
      console.log(`✅ New application notification email sent to employer: ${job.employer.user.email}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send email to employer:', emailError);
    }
    
    // Create notifications
    await createNotification(job.employer.user_id, 'New Application Received', `${seeker.full_name} applied for ${job.title}`, 'application_update', { job_id: jobId, application_id: application.id });
    await createNotification(req.user!.id, 'Application Submitted', `Your application for ${job.title} has been submitted successfully`, 'application_update', { job_id: jobId, application_id: application.id });
    
    console.log(`✅ Application process completed successfully`);
    console.log(`=========================================\n`);
    
    res.status(201).json({ 
      success: true, 
      data: application, 
      message: 'Application submitted successfully! Check your email for confirmation.' 
    });
    
  } catch (error: any) {
    console.error('❌ Application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/applications/my-applications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user!.id } })
    if (!seeker) return res.json({ success: true, data: [] })
    
    const applications = await prisma.jobApplication.findMany({
      where: { seeker_id: seeker.id },
      include: { job: { include: { employer: true, industry: true, employment_type: true } }, status: true },
      orderBy: { applied_at: 'desc' }
    })
    res.json({ success: true, data: applications })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.get('/api/employer/applications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employer = await prisma.employerProfile.findFirst({ where: { user_id: req.user!.id } })
    if (!employer) return res.json({ success: true, data: [] })
    
    const jobs = await prisma.jobPost.findMany({ where: { employer_id: employer.id }, select: { id: true } })
    const jobIds = jobs.map(j => j.id)
    
    const applications = await prisma.jobApplication.findMany({
      where: { job_id: { in: jobIds } },
      include: { job: true, seeker: { include: { user: true } }, status: true },
      orderBy: { applied_at: 'desc' }
    })
    res.json({ success: true, data: applications })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.get('/api/applications/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } })
    const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } })
    
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: id,
        OR: [
          { job: { employer_id: employer?.id } },
          { seeker_id: seeker?.id }
        ]
      },
      include: {
        job: {
          include: {
            employer: { include: { user: true } },
            industry: true,
            employment_type: true,
            status: true
          }
        },
        seeker: { include: { user: true } },
        status: true,
        notes: { include: { employer: true }, orderBy: { created_at: 'desc' } }
      }
    })
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' })
    res.json({ success: true, data: application })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})


app.post('/api/applications/:id/notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { note_text } = req.body
    const userId = req.user!.id
    
    const employer = await prisma.employerProfile.findFirst({ where: { user_id: userId } })
    if (!employer) return res.status(404).json({ success: false, message: 'Employer not found' })
    
    const note = await prisma.jobApplicationNote.create({
      data: { application_id: id, employer_id: employer.id, note_text: note_text, created_at: new Date() }
    })
    
    res.json({ success: true, data: note, message: 'Note added successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ========== APPLICATION ROUTES WITH EMAIL ==========
app.post('/api/applications/apply/:jobId', authMiddleware, upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    
    console.log(`📝 ========== NEW APPLICATION ==========`);
    console.log(`Job ID: ${jobId}`);
    console.log(`User ID: ${req.user!.id}`);
    console.log(`User Email: ${req.user!.email}`);
    
    // Get job details
    const job = await prisma.jobPost.findUnique({ 
      where: { id: jobId }, 
      include: { 
        status: true, 
        employer: { 
          include: { user: true } 
        } 
      } 
    });
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    if (job.status.status_name !== 'Open') {
      return res.status(400).json({ success: false, message: 'Job is no longer accepting applications' });
    }
    
    // Get or create seeker profile
    let seeker = await prisma.jobSeekerProfile.findFirst({ 
      where: { user_id: req.user!.id } 
    });
    
    if (!seeker) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      seeker = await prisma.jobSeekerProfile.create({ 
        data: { 
          user_id: req.user!.id, 
          full_name: user?.full_name || user?.email?.split('@')[0] || 'User', 
          skills: [] 
        } 
      });
      console.log(`Created new seeker profile for: ${req.user!.email}`);
    }
    
    // Check for duplicate application
    const existing = await prisma.jobApplication.findFirst({ 
      where: { job_id: jobId, seeker_id: seeker.id } 
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }
    
    // Get pending status
    const pendingStatus = await prisma.jobApplicationStatus.findFirst({ 
      where: { status_name: 'Pending' } 
    });
    
    if (!pendingStatus) {
      return res.status(500).json({ success: false, message: 'Application status configuration missing' });
    }
    
    // Create application
    const application = await prisma.jobApplication.create({
      data: { 
        job_id: jobId, 
        seeker_id: seeker.id, 
        cover_letter: coverLetter || null, 
        resume_url: req.file ? `/uploads/resumes/${req.file.filename}` : null, 
        status_id: pendingStatus.id, 
        applied_at: new Date() 
      }
    });
    
    console.log(`✅ Application created: ${application.id}`);
    
    // Update job applications count
    await prisma.jobPost.update({ 
      where: { id: jobId }, 
      data: { applications_count: { increment: 1 } } 
    });
    
    // ========== SEND EMAIL TO JOB SEEKER ==========
    try {
      console.log(`📧 Sending confirmation email to job seeker: ${req.user!.email}`);
      
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const seekerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Application Received!</h2>
            </div>
            <div class="content">
              <div class="success-icon">📝</div>
              <h3>Hello ${seeker.full_name},</h3>
              <p>Your application for <strong>${job.title}</strong> at <strong>${job.employer.company_name}</strong> has been submitted successfully.</p>
              <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Job Details:</strong></p>
                <p style="margin: 5px 0;">📍 Location: ${job.location}</p>
                <p style="margin: 5px 0;">💼 Type: ${job.employment_type_id === 1 ? 'Full-time' : 'Part-time'}</p>
                ${job.salary_range ? `<p style="margin: 5px 0;">💰 Salary: ${job.salary_range}</p>` : ''}
              </div>
              <p>The employer will review your application and update you on the status.</p>
              <div style="text-align: center;">
               <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications/${application.id}" class="button">View This Application</a>
              </div>
              <p>Best regards,<br><strong>Job Portal Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
              <p>Connecting Talent with Opportunity</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await emailTransporter.sendMail({
        from: `"Job Portal" <${process.env.EMAIL_USER}>`,
        to: req.user!.email,
        subject: `✅ Application Submitted: ${job.title}`,
        html: seekerEmailHtml
      });
      
      console.log(`✅ Application confirmation email sent to job seeker: ${req.user!.email}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send email to job seeker:', emailError);
      // Don't block application if email fails
    }
    
    // ========== SEND EMAIL TO EMPLOYER ==========
    try {
      console.log(`📧 Sending notification email to employer: ${job.employer.user.email}`);
      
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const employerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎯 New Application Received!</h2>
            </div>
            <div class="content">
              <h3>Hello ${job.employer.company_name} Team,</h3>
              <p>A new candidate has applied for <strong>${job.title}</strong>.</p>
              <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Applicant Details:</strong></p>
                <p style="margin: 5px 0;">👤 Name: ${seeker.full_name}</p>
                <p style="margin: 5px 0;">📧 Email: ${req.user!.email}</p>
                ${coverLetter ? `<p style="margin: 5px 0;">📝 Cover Letter: ${coverLetter.substring(0, 200)}${coverLetter.length > 200 ? '...' : ''}</p>` : ''}
              </div>
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/employer/applications" class="button">👁️ View Application</a>
              </div>
              <p>Best regards,<br><strong>Job Portal Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await emailTransporter.sendMail({
        from: `"Job Portal" <${process.env.EMAIL_USER}>`,
        to: job.employer.user.email,
        subject: `🎯 New Application: ${job.title}`,
        html: employerEmailHtml
      });
      
      console.log(`✅ New application notification email sent to employer: ${job.employer.user.email}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send email to employer:', emailError);
      // Don't block application if email fails
    }
    
    // Create notifications
    await createNotification(
      job.employer.user_id, 
      'New Application Received', 
      `${seeker.full_name} applied for ${job.title}`, 
      'application_update', 
      { job_id: jobId, application_id: application.id }
    );
    
    await createNotification(
      req.user!.id, 
      'Application Submitted', 
      `Your application for ${job.title} has been submitted successfully`, 
      'application_update', 
      { job_id: jobId, application_id: application.id }
    );
    
    console.log(`✅ Application process completed successfully`);
    console.log(`=========================================\n`);
    
    res.status(201).json({ 
      success: true, 
      data: application, 
      message: 'Application submitted successfully! Check your email for confirmation.' 
    });
    
  } catch (error: any) {
    console.error('❌ Application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ========== UPDATE APPLICATION STATUS WITH EMAIL ==========
app.put('/api/applications/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { statusId, message } = req.body;
    
    console.log(`📝 Updating application ${id} status to: ${statusId}`);
    
    // Get the employer
    const employer = await prisma.employerProfile.findFirst({
      where: { user_id: req.user!.id }
    });
    
    if (!employer) {
      return res.status(403).json({ success: false, message: 'Employer not found' });
    }
    
    // Get application with details
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: true,
        seeker: { include: { user: true } },
        status: true
      }
    });
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if employer owns this job
    if (application.job.employer_id !== employer.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Get new status
    const newStatus = await prisma.jobApplicationStatus.findUnique({
      where: { id: parseInt(statusId) }
    });
    
    if (!newStatus) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }
    
    // Update application
    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: {
        status_id: parseInt(statusId),
        updated_at: new Date(),
        employer_notes: message || null
      },
      include: { status: true }
    });
    
    // SEND EMAIL TO JOB SEEKER ABOUT STATUS CHANGE
    try {
      console.log(`📧 Sending status update email to job seeker: ${application.seeker.user.email}`);
      
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const statusColors: Record<string, string> = {
        'Pending': '#f59e0b',
        'Reviewed': '#3b82f6',
        'Shortlisted': '#8b5cf6',
        'Interview': '#06b6d4',
        'Accepted': '#10b981',
        'Rejected': '#ef4444'
      };
      
      const statusMessages: Record<string, string> = {
        'Pending': 'Your application is under review',
        'Reviewed': 'Your application has been reviewed',
        'Shortlisted': 'Congratulations! You have been shortlisted',
        'Interview': 'You have been selected for an interview',
        'Accepted': 'Congratulations! Your application has been accepted',
        'Rejected': 'Thank you for your interest'
      };
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; background: ${statusColors[newStatus.status_name]}; color: white; }
            .button { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            .message-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Application Status Update</h2>
            </div>
            <div class="content">
              <h3>Hello ${application.seeker.full_name},</h3>
              <p>Your application status for <strong>${application.job.title}</strong> at <strong>${employer.company_name}</strong> has been updated.</p>
              <p style="text-align: center; margin: 30px 0;">
                <span class="status">${newStatus.status_name}</span>
              </p>
              <p><strong>${statusMessages[newStatus.status_name]}</strong></p>
              ${message ? `<div class="message-box"><strong>Message from employer:</strong><br>${message}</div>` : ''}
              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications" class="button">View Applications</a>
              </p>
            </div>
            <div class="footer">
              <p>Job Portal - Connecting Talent with Opportunity</p>
              <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await emailTransporter.sendMail({
        from: `"Job Portal" <${process.env.EMAIL_USER}>`,
        to: application.seeker.user.email,
        subject: `Application Status: ${newStatus.status_name} - ${application.job.title}`,
        html: emailHtml
      });
      
      console.log(`✅ Status update email sent to job seeker: ${application.seeker.user.email}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send status update email:', emailError);
    }
    
    // Create notification
    await createNotification(
      application.seeker.user_id,
      'Application Status Updated',
      `Your application for "${application.job.title}" has been ${newStatus.status_name.toLowerCase()}`,
      'application_update',
      { application_id: id, status: newStatus.status_name }
    );
    
    res.json({ success: true, data: updatedApplication, message: `Application ${newStatus.status_name.toLowerCase()} successfully` });
    
  } catch (error: any) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ========== TEST EMAIL ENDPOINT ==========
app.post('/api/notifications/test-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seeker_profile: true, employer_profile: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userName = user.full_name || user.seeker_profile?.full_name || user.employer_profile?.company_name || 'User';
    
    // Send test email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 Test Email Notification</h2>
          </div>
          <div class="content">
            <h3>Hello ${userName},</h3>
            <p>This is a test email from Job Portal to verify that your email notification settings are working correctly.</p>
            <p>If you received this email, it means:</p>
            <ul>
              <li>✅ Your email configuration is working properly</li>
              <li>✅ You will receive notifications for:</li>
              <ul>
                <li>Application status updates</li>
                <li>New job alerts</li>
                <li>Password reset requests</li>
                <li>And more...</li>
              </ul>
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/notifications" class="button">Manage Notifications</a>
            </div>
            <p>Best regards,<br><strong>Job Portal Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
            <p>You received this email because you requested a test notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Use your email transporter
    const emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await emailTransporter.sendMail({
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '✅ Test Email Notification - Job Portal',
      html: html
    });
    
    console.log(`✅ Test email sent to ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully! Please check your inbox.' 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send test email' 
    });
  }
});

// ========== BOOKMARK ROUTES ==========
app.get('/api/bookmarks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user!.id } })
    if (!seeker) return res.json({ success: true, data: [] })
    
    const bookmarks = await prisma.jobBookmark.findMany({
      where: { seeker_id: seeker.id },
      include: { job: true }
    })
    res.json({ success: true, data: bookmarks })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.post('/api/bookmarks/:jobId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    let seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user!.id } })
    
    if (!seeker) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
      seeker = await prisma.jobSeekerProfile.create({ data: { user_id: req.user!.id, full_name: user?.email?.split('@')[0] || 'User', skills: [] } })
    }
    
    const existing = await prisma.jobBookmark.findFirst({ where: { job_id: jobId, seeker_id: seeker.id } })
    if (existing) return res.status(400).json({ success: false, message: 'Job already saved' })
    
    const bookmark = await prisma.jobBookmark.create({ data: { job_id: jobId, seeker_id: seeker.id } })
    res.json({ success: true, data: bookmark, message: 'Job saved successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.delete('/api/bookmarks/:jobId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const seeker = await prisma.jobSeekerProfile.findFirst({ where: { user_id: req.user!.id } })
    if (!seeker) return res.status(404).json({ success: false, message: 'Profile not found' })
    
    await prisma.jobBookmark.deleteMany({ where: { job_id: jobId, seeker_id: seeker.id } })
    res.json({ success: true, message: 'Job removed from saved' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== NOTIFICATION ROUTES ==========
app.get('/api/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'desc' },
      take: 50
    })
    const unreadCount = notifications.filter(n => !n.is_read).length
    res.json({ success: true, data: notifications, unreadCount })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})



// ========== LOOKUP TABLES ==========
app.get('/api/job-statuses', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await prisma.jobPostStatus.findMany({ orderBy: { id: 'asc' } }) })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

app.get('/api/employment-types', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await prisma.employmentType.findMany({ orderBy: { type_name: 'asc' } }) })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== SERVER INITIALIZATION ==========
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Hardcoded IP for display (replace with your actual IP)
const NETWORK_IP = '172.20.30.232';

app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Job Portal Backend Server`);
  console.log(`========================================`);
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📍 Network: http://${NETWORK_IP}:${PORT}`);
  console.log(`📍 Health:  http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});