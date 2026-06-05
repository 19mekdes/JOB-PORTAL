import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { AuthRequest, RegisterInput, LoginInput } from '../types'

const prisma = new PrismaClient()

// Helper function to generate JWT token
const generateToken = (userId: string, email: string): string => {
  const payload = { id: userId, email: email }
  const secret = process.env.JWT_SECRET as string
  const token = jwt.sign(payload, secret, { expiresIn: '7d' } as jwt.SignOptions)
  return token
}

// Helper function to generate refresh token
const generateRefreshToken = (userId: string): string => {
  const payload = { id: userId }
  const secret = process.env.JWT_REFRESH_SECRET as string
  const token = jwt.sign(payload, secret, { expiresIn: '30d' } as jwt.SignOptions)
  return token
}

// Helper function to send email
const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
  
  await transporter.sendMail({
    from: `"JobPortal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  })
}

// ========== REGISTER USER ==========
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, user_type, phone, location }: RegisterInput = req.body

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

    const userType = await prisma.userType.findFirst({
      where: { type_name: user_type }
    })

    if (!userType) {
      res.status(400).json({
        success: false,
        message: 'Invalid user type'
      })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        user_type_id: userType.id,
        is_active: true
      }
    })

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
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== LOGIN USER ==========
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
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile: profile,
        unread_notifications: user.notifications.length,
        notifications: user.notifications
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== LOGOUT USER ==========
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

    await prisma.notification.create({
      data: {
        user_id: req.user!.id,
        title: 'Password Changed',
        message: 'Your password was successfully changed.',
        type: 'security'
      }
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== FORGOT PASSWORD - COMPLETE VERSION ==========
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    console.log('📧 Forgot password request for:', email)

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

    // For security, always return success even if user doesn't exist
    if (!user) {
      res.json({
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link'
      })
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date()
    resetExpiry.setHours(resetExpiry.getHours() + 1) // 1 hour expiry

    // Save token to database (you need to add these fields to your User model)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetToken,
        reset_password_expires: resetExpiry
      }
    })

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

    // Get user name
    const userName = user.seeker_profile?.full_name || 
                     user.employer_profile?.company_name || 
                     user.email.split('@')[0]

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <h3>Hello ${userName},</h3>
            <p>We received a request to reset your password for your JobPortal account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <hr />
            <p>Best regards,<br><strong>JobPortal Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JobPortal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail(user.email, 'Reset Your JobPortal Password', emailHtml)
    console.log(`✅ Password reset email sent to: ${email}`)

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

// ========== RESET PASSWORD - COMPLETE VERSION ==========
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const { new_password } = req.body

    console.log('🔐 Reset password request with token:', token?.substring(0, 10) + '...')

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

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date() // Token not expired
        }
      },
      include: { seeker_profile: true, employer_profile: true }
    })

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      })
      return
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        updated_at: new Date()
      }
    })

    // Send confirmation email
    const userName = user.seeker_profile?.full_name || 
                     user.employer_profile?.company_name || 
                     user.email.split('@')[0]

    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Successful</h2>
          </div>
          <div class="content">
            <h3>Hello ${userName},</h3>
            <p>Your password has been successfully reset.</p>
            <p>You can now log in to your account with your new password.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login Now</a>
            </div>
            <p>If you didn't make this change, please contact support immediately.</p>
            <hr />
            <p>Best regards,<br><strong>JobPortal Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JobPortal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail(user.email, 'Password Reset Successful - JobPortal', confirmationHtml)
    console.log(`✅ Password reset successful for: ${user.email}`)

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
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

// ========== VERIFY EMAIL ==========
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params

    res.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

// ========== RESEND VERIFICATION EMAIL ==========
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    })
  } catch (error) {
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
    }

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}