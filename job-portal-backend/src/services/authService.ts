import { PrismaClient, User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const prisma = new PrismaClient()

// ========== TYPES ==========
export interface RegisterData {
  email: string
  password: string
  full_name: string
  user_type: string
  phone?: string
  location?: string
}

export interface LoginData {
  email: string
  password: string
}

// ========== AUTH SERVICE ==========
export class AuthService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  // Helper function to generate JWT token
  private generateToken(userId: string, email: string): string {
    const payload = { id: userId, email: email }
    const secret = process.env.JWT_SECRET || 'default_secret'
    const options: jwt.SignOptions = {
      expiresIn: '7d' as jwt.SignOptions['expiresIn']
    }
    return jwt.sign(payload, secret, options)
  }

  // Helper function to generate refresh token
  private generateRefreshToken(userId: string): string {
    const payload = { id: userId }
    const secret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'
    const options: jwt.SignOptions = {
      expiresIn: '30d' as jwt.SignOptions['expiresIn']
    }
    return jwt.sign(payload, secret, options)
  }

  // ========== REGISTER ==========
  async register(userData: RegisterData) {
    const { email, password, full_name, user_type, phone, location } = userData

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Get user type
    const userType = await this.prisma.userType.findFirst({
      where: { type_name: user_type }
    })

    if (!userType) {
      throw new Error('Invalid user type')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        user_type_id: userType.id,
        is_active: true
      }
    })

    // Create profile based on user type
    if (user_type === 'Job Seeker') {
      await this.prisma.jobSeekerProfile.create({
        data: {
          user_id: user.id,
          full_name: full_name,
          phone: phone || null,
          location: location || null,
          skills: []
        }
      })
    } else if (user_type === 'Employer') {
      await this.prisma.employerProfile.create({
        data: {
          user_id: user.id,
          company_name: full_name,
          location: location || null,
          industry_id: 1
        }
      })
    }

    // Generate token
    const token = this.generateToken(user.id, user.email)
    const refreshToken = this.generateRefreshToken(user.id)

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        user_type: user_type,
        full_name: full_name
      }
    }
  }

  // ========== LOGIN ==========
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    if (!user.is_active) {
      throw new Error('Your account has been suspended. Please contact support.')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const token = this.generateToken(user.id, user.email)
    const refreshToken = this.generateRefreshToken(user.id)

    const profile = user.seeker_profile || user.employer_profile
    const fullName = user.seeker_profile?.full_name || user.employer_profile?.company_name

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type.type_name,
        full_name: fullName,
        profile_completed: !!profile
      }
    }
  }

  // ========== GET CURRENT USER ==========
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new Error('User not found')
    }

    const profile = user.seeker_profile || user.employer_profile

    return {
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
  }

  // ========== CHANGE PASSWORD ==========
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    await this.prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Password Changed',
        message: 'Your password was successfully changed.',
        type: 'security'
      }
    })

    return { message: 'Password changed successfully' }
  }

  // ========== FORGOT PASSWORD ==========
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // For security, don't reveal if email exists
      return { message: 'If an account exists, a password reset link will be sent' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date()
    resetExpiry.setHours(resetExpiry.getHours() + 1)

    console.log(`Password reset link: http://localhost:3000/reset-password/${resetToken}`)

    return { message: 'If an account exists, a password reset link will be sent' }
  }

  // ========== RESET PASSWORD ==========
  async resetPassword(token: string, newPassword: string) {
    // For now, just return success
    // In production, verify token and update password
    return { message: 'Password reset successfully' }
  }

  // ========== REFRESH TOKEN ==========
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'
      ) as { id: string }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id }
      })

      if (!user) {
        throw new Error('Invalid refresh token')
      }

      const newToken = this.generateToken(user.id, user.email)

      return { token: newToken }
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }
  }

  // ========== UPDATE PROFILE ==========
  async updateProfile(userId: string, profileData: {
    full_name?: string
    phone?: string
    location?: string
    skills?: string[]
    company_name?: string
    website?: string
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_type: true,
        seeker_profile: true,
        employer_profile: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    let updatedProfile

    if (user.user_type.type_name === 'Job Seeker' && user.seeker_profile) {
      updatedProfile = await this.prisma.jobSeekerProfile.update({
        where: { user_id: userId },
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
          location: profileData.location,
          skills: profileData.skills
        }
      })
    } else if (user.user_type.type_name === 'Employer' && user.employer_profile) {
      updatedProfile = await this.prisma.employerProfile.update({
        where: { user_id: userId },
        data: {
          company_name: profileData.company_name,
          website: profileData.website,
          location: profileData.location
        }
      })
    }

    return updatedProfile
  }
}

// ========== DEFAULT EXPORT ==========
export default new AuthService()