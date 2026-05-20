"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResume = exports.uploadCover = exports.uploadAvatar = void 0;
// src/middleware/uploadMiddleware.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create uploads directories if they don't exist
const createUploadFolders = () => {
    const folders = [
        'uploads',
        'uploads/avatars',
        'uploads/covers',
        'uploads/resumes',
        'uploads/images'
    ];
    folders.forEach((folder) => {
        if (!fs_1.default.existsSync(folder)) {
            fs_1.default.mkdirSync(folder, { recursive: true });
        }
    });
};
createUploadFolders();
// Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'avatar') {
            uploadPath = 'uploads/avatars/';
        }
        else if (file.fieldname === 'cover_image') {
            uploadPath = 'uploads/covers/';
        }
        else if (file.fieldname === 'resume') {
            uploadPath = 'uploads/resumes/';
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});
// File filter
const fileFilter = (req, file, cb) => {
    // Image uploads (avatar and cover)
    if (file.fieldname === 'avatar' || file.fieldname === 'cover_image') {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'));
        }
    }
    // Resume uploads
    else if (file.fieldname === 'resume') {
        const allowedResumeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedResumeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF and DOC/DOCX files are allowed'));
        }
    }
    else {
        cb(new Error('Invalid file type'));
    }
};
// Create multer instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
exports.uploadAvatar = upload.single('avatar');
exports.uploadCover = upload.single('cover_image');
exports.uploadResume = upload.single('resume');
exports.default = upload;
