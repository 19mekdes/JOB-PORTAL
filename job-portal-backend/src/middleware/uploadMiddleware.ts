// src/middleware/uploadMiddleware.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'

// Create uploads directories if they don't exist
const createUploadFolders = () => {
  const folders = [
    'uploads',
    'uploads/avatars',
    'uploads/covers',
    'uploads/resumes',
    'uploads/images'
  ]

  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }
  })
}

createUploadFolders()

// Storage configuration
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb
  ) => {
    let uploadPath = 'uploads/'

    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars/'
    } else if (file.fieldname === 'cover_image') {
      uploadPath = 'uploads/covers/'
    } else if (file.fieldname === 'resume') {
      uploadPath = 'uploads/resumes/'
    }

    cb(null, uploadPath)
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    cb
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  }
})

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Image uploads (avatar and cover)
  if (file.fieldname === 'avatar' || file.fieldname === 'cover_image') {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'))
    }
  }
  // Resume uploads
  else if (file.fieldname === 'resume') {
    const allowedResumeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (allowedResumeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'))
    }
  }
  else {
    cb(new Error('Invalid file type'))
  }
}

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

export const uploadAvatar = upload.single('avatar')
export const uploadCover = upload.single('cover_image')
export const uploadResume = upload.single('resume')

export default upload