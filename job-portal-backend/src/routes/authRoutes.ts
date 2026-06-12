import express from 'express'
import {
  register,
  login,
  getMe,
  logout,
  changePassword,
  refreshToken,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyResetToken
} from '../controllers/authController'
import { authMiddleware, isAdmin, isEmployer, isJobSeeker } from '../middleware/authMiddleware'

const router = express.Router()

// ========== PUBLIC ROUTES (No authentication required) ==========
router.post('/register', register)
router.post('/login', login)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/verify-reset-token', verifyResetToken)

// ========== PROTECTED ROUTES (Authentication required) ==========
router.get('/me', authMiddleware, getMe)
router.post('/logout', authMiddleware, logout)
router.post('/change-password', authMiddleware, changePassword)
router.put('/profile', authMiddleware, updateProfile)

// ========== ROLE-BASED ROUTES ==========
router.get('/admin/dashboard', authMiddleware, isAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' })
})

router.get('/employer/dashboard', authMiddleware, isEmployer, (req, res) => {
  res.json({ message: 'Employer access granted' })
})

router.get('/jobseeker/dashboard', authMiddleware, isJobSeeker, (req, res) => {
  res.json({ message: 'Job Seeker access granted' })
})

export default router