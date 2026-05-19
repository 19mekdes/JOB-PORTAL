import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dwpnbbcd7',
  api_key: '854783363296519',
  api_secret: 'Vr5E5CCbtQ2Er63sOn6-Cg9pFQY',
  secure: true,
});

// Create storage for cover images
const coverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'jobportal/covers',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 1200, height: 400, crop: 'fill' }],
      public_id: `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// Create storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'jobportal/avatars',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      public_id: `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// Create storage for resumes (optional)
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'jobportal/resumes',
      resource_type: 'raw',
      public_id: `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

export const uploadCover = multer({ storage: coverStorage });
export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadResume = multer({ storage: resumeStorage });
export { cloudinary };