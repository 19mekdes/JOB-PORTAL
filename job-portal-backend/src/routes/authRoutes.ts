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
  updateProfile
} from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'
import { registerValidation, loginValidation } from '../middleware/validationMiddleware'

const router = express.Router()

// ========== PUBLIC ROUTES (No authentication required) ==========
router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.get('/verify-email/:token', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)
router.post('/refresh-token', refreshToken)

// ========== PROTECTED ROUTES (Authentication required) ==========
router.get('/me', protect, getMe)
router.post('/logout', protect, logout)
router.post('/change-password', protect, changePassword)
router.put('/profile', protect, updateProfile)

export default router