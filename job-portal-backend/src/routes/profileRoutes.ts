import express from 'express'
import {
  getProfile,
  updateSeekerProfile,
  updateEmployerProfile,
  uploadResume,
  deleteResume,
  getSeekerProfileById,
  getEmployerProfileById,
  updateSkills,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  getProfileCompletion,
  uploadCompanyLogo,
  deleteCompanyLogo,
  getPublicProfile
} from '../controllers/profileController'
import { protect } from '../middleware/authMiddleware'
import { authorize } from '../middleware/roleMiddleware'

// Import Cloudinary upload configurations straight from your config file
import { uploadCover, uploadAvatar } from '../config/cloudinary'

const router = express.Router()

// All profile routes require authentication
router.use(protect)

// ========== BASIC PROFILE ROUTES ==========
// Get current user's profile
router.get('/me', getProfile)

// Get profile completion percentage
router.get('/me/completion', getProfileCompletion)

// ========== CLOUDINARY MEDIA UPLOAD ROUTES ==========
// Upload Cover Image (Job Seeker specific)
router.post('/cover', authorize('Job Seeker'), uploadCover.single('cover_image'), async (req, res, next) => {
  // If you move the logic code out of app.ts into controllers/profileController later,
  // you can easily replace this inline function with a single named controller execution.
  try {
    const userId = req.user!.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No cover image file uploaded' });
    }

    // @ts-ignore - tracking profile update via Prisma client context global bindings
    const profile = await global.prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile record not found' });

    // @ts-ignore
    const updated = await global.prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { cover_image: req.file.path }
    });

    return res.json({
      success: true,
      data: { cover_image: updated.cover_image },
      message: 'Cover image updated successfully'
    });
  } catch (error: any) {
    next(error);
  }
});

// Upload Avatar / Profile Picture (Job Seeker specific)
router.post('/avatar', authorize('Job Seeker'), uploadAvatar.single('avatar'), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar file uploaded' });
    }

    // @ts-ignore
    const profile = await global.prisma.jobSeekerProfile.findFirst({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile record not found' });

    // @ts-ignore
    const updated = await global.prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: { avatar: req.file.path }
    });

    return res.json({
      success: true,
      data: { avatar: updated.avatar },
      message: 'Profile picture updated successfully'
    });
  } catch (error: any) {
    next(error);
  }
});

// ========== JOB SEEKER PROFILE ROUTES ==========
// Update job seeker profile
router.put('/seeker', authorize('Job Seeker'), updateSeekerProfile)

// Upload resume (Job Seeker)
router.post('/seeker/resume', authorize('Job Seeker'), uploadResume)

// Delete resume (Job Seeker)
router.delete('/seeker/resume', authorize('Job Seeker'), deleteResume)

// Update skills (Job Seeker)
router.put('/seeker/skills', authorize('Job Seeker'), updateSkills)

// Add experience (Job Seeker)
router.post('/seeker/experience', authorize('Job Seeker'), addExperience)

// Update experience (Job Seeker)
router.put('/seeker/experience/:expId', authorize('Job Seeker'), updateExperience)

// Delete experience (Job Seeker)
router.delete('/seeker/experience/:expId', authorize('Job Seeker'), deleteExperience)

// Add education (Job Seeker)
router.post('/seeker/education', authorize('Job Seeker'), addEducation)

// Update education (Job Seeker)
router.put('/seeker/education/:eduId', authorize('Job Seeker'), updateEducation)

// Delete education (Job Seeker)
router.delete('/seeker/education/:eduId', authorize('Job Seeker'), deleteEducation)

// ========== EMPLOYER PROFILE ROUTES ==========
// Update employer profile
router.put('/employer', authorize('Employer'), updateEmployerProfile)

// Upload company logo (Employer)
router.post('/employer/logo', authorize('Employer'), uploadCompanyLogo)

// Delete company logo (Employer)
router.delete('/employer/logo', authorize('Employer'), deleteCompanyLogo)

// ========== PUBLIC PROFILE ROUTES ==========
// Get public profile by user ID (no authentication required)
router.get('/public/:userId', getPublicProfile)

// Get job seeker profile by ID (for employers)
router.get('/seeker/:seekerId', authorize('Employer'), getSeekerProfileById)

// Get employer profile by ID (for job seekers)
router.get('/employer/:employerId', getEmployerProfileById)

export default router