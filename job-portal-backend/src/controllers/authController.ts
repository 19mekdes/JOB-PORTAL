import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { AuthRequest, RegisterInput, LoginInput } from '../types'

const prisma = new PrismaClient()

// ========== HELPER FUNCTIONS ==========

// Helper function to generate JWT token
const generateToken = (userId: string, email: string): string => {
  const payload = { id: userId, email: email }
  const secret = process.env.JWT_SECRET as string
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file.')
  }
  const token = jwt.sign(payload, secret, { expiresIn: '7d' } as jwt.SignOptions)
  return token
}

// Helper function to generate refresh token
const generateRefreshToken = (userId: string): string => {
  const payload = { id: userId }
  const secret = process.env.JWT_REFRESH_SECRET as string
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured. Please set it in your .env file.')
  }
  const token = jwt.sign(payload, secret, { expiresIn: '30d' } as jwt.SignOptions)
  return token
}

// Helper function to send email (optional - for password reset only)
const sendEmail = async (to: string, subject: string, html: string) => {
  console.log('📧 sendEmail called with:', { to, subject });
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials missing!');
    throw new Error('Email configuration missing');
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  await transporter.verify();
  const info = await transporter.sendMail({
    from: `"JobPortal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
  
  console.log('✅ Email sent! Message ID:', info.messageId);
  return info;
}

// ========== SIMPLE REGISTRATION (NO OTP) ==========
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, user_type, phone, location }: RegisterInput = req.body

    // Validate required fields
    if (!email || !password || !full_name || !user_type) {
      res.status(400).json({
        success: false,
        message: 'Email, password, full name, and user type are required'
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
      return
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      })
      return
    }

    // Get user type
    const userType = await prisma.userType.findFirst({
      where: { type_name: user_type }
    })

    if (!userType) {
      res.status(400).json({
        success: false,
        message: 'Invalid user type. Use "Job Seeker" or "Employer"'
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        user_type_id: userType.id,
        is_active: true,
        email_verified: true // Auto-verified, no OTP needed
      }
    })

    // Create profile based on user type
    if (user_type === 'Job Seeker') {
      await prisma.jobSeekerProfile.create({
        data: {
          user_id: user.id,
          full_name: full_name,
          phone: phone || null,
          location: location || null,
          skills: []
        }
      })
    } else if (user_type === 'Employer') {
      await prisma.employerProfile.create({
        data: {
          user_id: user.id,
          company_name: full_name,
          location: location || null,
          industry_id: 1
        }
      })
    }

    // Generate tokens
    const token = generateToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        user_type: user_type,
        full_name: full_name
      },
      message: 'Registration successful'
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== LOGIN ==========
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
      return
    }

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      })
      return
    }

    // Check if email is verified (should be true from registration)
    if (!user.email_verified) {
      res.status(401).json({
        success: false,
        message: 'Please verify your email first.'
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
      return
    }

    const token = generateToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    const profile = user.seeker_profile || user.employer_profile
    const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type.type_name,
        full_name: fullName,
        profile_completed: !!profile
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== GET CURRENT USER ==========
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: {
          include: {
            industry: true
          }
        },
        notifications: {
          where: { is_read: false },
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    const profile = user.seeker_profile || user.employer_profile

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        user_type: user.user_type.type_name,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile: profile,
        unread_notifications: user.notifications.length,
        notifications: user.notifications
      }
    })
  } catch (error) {
    console.error('GetMe error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== LOGOUT ==========
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== CHANGE PASSWORD ==========
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
      return
    }

    if (new_password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(current_password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
      return
    }

    const hashedPassword = await bcrypt.hash(new_password, 10)

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== REFRESH TOKEN ==========
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required'
      })
      return
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET as string) as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
      return
    }

    const newToken = generateToken(user.id, user.email)

    res.json({
      success: true,
      token: newToken
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    })
  }
}

// ========== UPDATE PROFILE ==========
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, phone, location, skills, company_name, website } = req.body

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    let updatedProfile

    if (user.user_type.type_name === 'Job Seeker' && user.seeker_profile) {
      updatedProfile = await prisma.jobSeekerProfile.update({
        where: { user_id: user.id },
        data: {
          full_name: full_name || undefined,
          phone: phone || undefined,
          location: location || undefined,
          skills: skills || undefined
        }
      })
    } else if (user.user_type.type_name === 'Employer' && user.employer_profile) {
      updatedProfile = await prisma.employerProfile.update({
        where: { user_id: user.id },
        data: {
          company_name: company_name || undefined,
          website: website || undefined,
          location: location || undefined
        }
      })
    } else {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
      return
    }

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== FORGOT PASSWORD (Optional - with email) ==========
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { seeker_profile: true, employer_profile: true }
    })

    if (!user) {
      res.json({
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link'
      })
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date()
    resetExpiry.setHours(resetExpiry.getHours() + 1)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetToken,
        reset_password_expires: resetExpiry
      }
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

    const userName = user.seeker_profile?.full_name || 
                     user.employer_profile?.company_name || 
                     user.email.split('@')[0]

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h2>Password Reset Request</h2></div>
          <div class="content">
            <h3>Hello ${userName},</h3>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail(user.email, 'Reset Your Password', emailHtml)
    
    res.json({
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== RESET PASSWORD ==========
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const { new_password } = req.body

    if (!token || !new_password) {
      res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      })
      return
    }

    if (new_password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
      return
    }

    const hashedPassword = await bcrypt.hash(new_password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        updated_at: new Date()
      }
    })

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== VERIFY RESET TOKEN ==========
export const verifyResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      })
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
      return
    }

    res.json({
      success: true,
      message: 'Token is valid'
    })
  } catch (error) {
    console.error('Verify token error:', error)
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}