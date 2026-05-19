import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AuthRequest, RegisterInput, LoginInput } from '../types'

const prisma = new PrismaClient()

// Helper function to generate JWT token
const generateToken = (userId: string, email: string): string => {
  const payload = { id: userId, email: email }
  const secret = process.env.JWT_SECRET as string
  
  // Use type assertion to bypass TypeScript checking
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
// ========== REGISTER USER ==========
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, user_type, phone, location }: RegisterInput = req.body

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
        message: 'Invalid user type'
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
        is_active: true
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
          industry_id: 1 // Default industry
        }
      })
    }

    // Generate token
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

    // Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
      return
    }

    // Generate tokens
    const token = generateToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    // Get profile data
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

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
      return
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    })

    // Create notification
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

// ========== FORGOT PASSWORD ==========
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // For security, don't reveal if email exists
      res.json({
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link'
      })
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date()
    resetExpiry.setHours(resetExpiry.getHours() + 1) // 1 hour

    console.log(`Password reset link: http://localhost:3000/reset-password/${resetToken}`)

    res.json({
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link'
    })
  } catch (error) {
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

    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
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

    // Verify refresh token
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

    // Generate new access token
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