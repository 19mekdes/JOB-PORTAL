/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './api'
export interface UploadOptions {
  onProgress?: (progress: number) => void
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  mime_type: string
  public_id?: string
}

export interface MultipleUploadResponse {
  files: UploadResponse[]
  total: number
  successful: number
  failed: number
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface FileValidationRules {
  maxSizeMB?: number
  allowedTypes?: string[]
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

// ========== FILE VALIDATION ==========

export const validateFileSize = (file: File, maxSizeMB: number = 5): FileValidationResult => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    }
  }
  return { isValid: true }
}
export const validateFileType = (file: File, allowedTypes: string[]): FileValidationResult => {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`
    }
  }
  return { isValid: true }
}
export const validateImageDimensions = (
  file: File,
  minWidth?: number,
  maxWidth?: number,
  minHeight?: number,
  maxHeight?: number
): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      if (minWidth && img.width < minWidth) {
        resolve({ isValid: false, error: `Image width must be at least ${minWidth}px` })
        return
      }
      if (maxWidth && img.width > maxWidth) {
        resolve({ isValid: false, error: `Image width must be less than ${maxWidth}px` })
        return
      }
      if (minHeight && img.height < minHeight) {
        resolve({ isValid: false, error: `Image height must be at least ${minHeight}px` })
        return
      }
      if (maxHeight && img.height > maxHeight) {
        resolve({ isValid: false, error: `Image height must be less than ${maxHeight}px` })
        return
      }
      
      resolve({ isValid: true })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ isValid: false, error: 'Unable to validate image dimensions' })
    }
    
    img.src = url
  })
}
export const validateFile = async (
  file: File,
  rules: FileValidationRules
): Promise<FileValidationResult> => {
  if (rules.maxSizeMB) {
    const sizeValidation = validateFileSize(file, rules.maxSizeMB)
    if (!sizeValidation.isValid) return sizeValidation
  }
  
  if (rules.allowedTypes && rules.allowedTypes.length > 0) {
    const typeValidation = validateFileType(file, rules.allowedTypes)
    if (!typeValidation.isValid) return typeValidation
  }
  
  if (file.type.startsWith('image/') && (rules.minWidth || rules.maxWidth || rules.minHeight || rules.maxHeight)) {
    const dimensionValidation = await validateImageDimensions(
      file,
      rules.minWidth,
      rules.maxWidth,
      rules.minHeight,
      rules.maxHeight
    )
    if (!dimensionValidation.isValid) return dimensionValidation
  }
  
  return { isValid: true }
}

// ========== SINGLE FILE UPLOAD ==========
export const uploadResume = async (
  file: File,
  options?: UploadOptions
): Promise<UploadResponse> => {
  const validation = await validateFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  })
  
  if (!validation.isValid) {
    throw new Error(validation.error)
  }
  
  const formData = new FormData()
  formData.append('resume', file)
  
  const response = await api.post('/upload/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

export const uploadCompanyLogo = async (
  file: File,
  options?: UploadOptions
): Promise<UploadResponse> => {
  const validation = await validateFile(file, {
    maxSizeMB: 2,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    minWidth: 100,
    maxWidth: 500,
    minHeight: 100,
    maxHeight: 500
  })
  
  if (!validation.isValid) {
    throw new Error(validation.error)
  }
  
  const formData = new FormData()
  formData.append('logo', file)
  
  const response = await api.post('/upload/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

export const uploadProfilePicture = async (
  file: File,
  options?: UploadOptions
): Promise<UploadResponse> => {

  const validation = await validateFile(file, {
    maxSizeMB: 2,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 200,
    maxWidth: 1000,
    minHeight: 200,
    maxHeight: 1000
  })
  
  if (!validation.isValid) {
    throw new Error(validation.error)
  }
  
  const formData = new FormData()
  formData.append('avatar', file)
  
  const response = await api.post('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

export const uploadCoverImage = async (
  file: File,
  options?: UploadOptions
): Promise<UploadResponse> => {
  const validation = await validateFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 1200,
    maxWidth: 3000,
    minHeight: 300,
    maxHeight: 1000
  })
  
  if (!validation.isValid) {
    throw new Error(validation.error)
  }
  
  const formData = new FormData()
  formData.append('cover', file)
  
  const response = await api.post('/upload/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

export const uploadJobAttachment = async (
  file: File,
  jobId: string,
  options?: UploadOptions
): Promise<UploadResponse> => {
  const validation = await validateFile(file, {
    maxSizeMB: 10,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
  })
  
  if (!validation.isValid) {
    throw new Error(validation.error)
  }
  
  const formData = new FormData()
  formData.append('attachment', file)
  formData.append('job_id', jobId)
  
  const response = await api.post('/upload/job-attachment', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

// ========== MULTIPLE FILE UPLOAD ==========

export const uploadMultipleFiles = async (
  files: File[],
  endpoint: string,
  options?: UploadOptions
): Promise<MultipleUploadResponse> => {
  const formData = new FormData()
  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file)
  })
  
  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

export const uploadMultipleJobAttachments = async (
  files: File[],
  jobId: string,
  options?: UploadOptions
): Promise<MultipleUploadResponse> => {
  const formData = new FormData()
  files.forEach((file, index) => {
    formData.append(`attachments[${index}]`, file)
  })
  formData.append('job_id', jobId)
  
  const response = await api.post('/upload/job-attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && options?.onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
  })
  
  options?.onSuccess?.(response.data)
  return response.data.data
}

// ========== FILE MANAGEMENT ==========
export const deleteFile = async (fileUrl: string): Promise<void> => {
  await api.delete('/upload/file', { data: { url: fileUrl } })
}

export const getFileInfo = async (fileUrl: string): Promise<UploadResponse> => {
  const response = await api.get('/upload/info', { params: { url: fileUrl } })
  return response.data.data
}

// ========== HELPER FUNCTIONS ==========
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return 'FileText'
  if (fileType.includes('word') || fileType.includes('document')) return 'FileText'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'FileSpreadsheet'
  if (fileType.includes('image')) return 'Image'
  if (fileType.includes('video')) return 'Video'
  if (fileType.includes('audio')) return 'Music'
  return 'File'
}
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf'
}
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
  return documentTypes.includes(file.type)
}
export const getFilePreviewUrl = (file: File): string => {
  return URL.createObjectURL(file)
}
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url)
}

const fileUploadService = {
  uploadResume,
  uploadCompanyLogo,
  uploadProfilePicture,
  uploadCoverImage,
  uploadJobAttachment,
  uploadMultipleFiles,
  uploadMultipleJobAttachments,
  
  deleteFile,
  getFileInfo,

  validateFile,
  validateFileSize,
  validateFileType,
  validateImageDimensions,
  
  formatFileSize,
  getFileExtension,
  getFileIcon,
  isImageFile,
  isPDFFile,
  isDocumentFile,
  getFilePreviewUrl,
  revokePreviewUrl
}

export default fileUploadService