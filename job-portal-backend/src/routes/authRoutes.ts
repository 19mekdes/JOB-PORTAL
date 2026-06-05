// src/routes/authRoutes.ts
import express from 'express'
import {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  updateProfile,
  verifyResetToken
} from '../controllers/authController'
import { authMiddleware, isAdmin, isSuperAdmin, isEmployer, isJobSeeker } from '../middleware/authMiddleware'  // ✅ Use correct names
import { registerValidation, loginValidation } from '../middleware/validationMiddleware'

const router = express.Router()

// ========== PUBLIC ROUTES (No authentication required) ==========
router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/verify-reset-token', verifyResetToken)
router.get('/verify-email/:token', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)
router.post('/refresh-token', refreshToken)

// ========== PROTECTED ROUTES (Authentication required) ==========
router.get('/me', authMiddleware, getMe)  // ✅ Use authMiddleware
router.post('/logout', authMiddleware, logout)
router.post('/change-password', authMiddleware, changePassword)
router.put('/profile', authMiddleware, updateProfile)

export default router