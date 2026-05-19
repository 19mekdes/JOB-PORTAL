// src/routes/uploadRoutes.ts
import express, { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { protect } from '../middleware/authMiddleware'  // ← Use 'protect' instead of 'authMiddleware'
import upload, { uploadAvatar, uploadCover, uploadResume } from '../middleware/uploadMiddleware'

const router = express.Router()
const prisma = new PrismaClient()

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: any
}

// ========== UPLOAD COVER IMAGE ==========
router.post('/cover', protect, uploadCover, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!profile) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    // Delete old cover image if exists
    if (profile.cover_image) {
      const oldPath = path.join(process.cwd(), profile.cover_image)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }
    
    const coverUrl = `/uploads/covers/${req.file.filename}`
    
    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { cover_image: coverUrl }
    })
    
    res.json({
      success: true,
      data: { cover_image: updatedProfile.cover_image },
      message: 'Cover image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading cover image:', error)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== UPLOAD PROFILE PICTURE (AVATAR) ==========
router.post('/avatar', protect, uploadAvatar, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!profile) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    // Delete old avatar if exists
    if (profile.avatar) {
      const oldPath = path.join(process.cwd(), profile.avatar)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    
    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { avatar: avatarUrl }
    })
    
    res.json({
      success: true,
      data: { avatar: updatedProfile.avatar },
      message: 'Profile picture uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== UPLOAD RESUME ==========
router.post('/resume', protect, uploadResume, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!profile) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    // Delete old resume if exists
    if (profile.resume_url) {
      const oldPath = path.join(process.cwd(), profile.resume_url)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }
    
    const resumeUrl = `/uploads/resumes/${req.file.filename}`
    
    const updatedProfile = await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { resume_url: resumeUrl }
    })
    
    res.json({
      success: true,
      data: { resume_url: updatedProfile.resume_url },
      message: 'Resume uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading resume:', error)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== DELETE COVER IMAGE ==========
router.delete('/cover', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    if (profile.cover_image) {
      const imagePath = path.join(process.cwd(), profile.cover_image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }
    
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { cover_image: null }
    })
    
    res.json({ success: true, message: 'Cover image removed successfully' })
  } catch (error) {
    console.error('Error removing cover image:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== DELETE PROFILE PICTURE ==========
router.delete('/avatar', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    if (profile.avatar) {
      const imagePath = path.join(process.cwd(), profile.avatar)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }
    
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { avatar: null }
    })
    
    res.json({ success: true, message: 'Profile picture removed successfully' })
  } catch (error) {
    console.error('Error removing profile picture:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== DELETE RESUME ==========
router.delete('/resume', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { user_id: userId }
    })
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    if (profile.resume_url) {
      const filePath = path.join(process.cwd(), profile.resume_url)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    
    await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { resume_url: null }
    })
    
    res.json({ success: true, message: 'Resume removed successfully' })
  } catch (error) {
    console.error('Error removing resume:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router