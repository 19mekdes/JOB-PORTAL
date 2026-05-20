"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.uploadResume = exports.uploadAvatar = exports.uploadCover = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
// Configure Cloudinary with your credentials
cloudinary_1.v2.config({
    cloud_name: 'dwpnbbcd7',
    api_key: '854783363296519',
    api_secret: 'Vr5E5CCbtQ2Er63sOn6-Cg9pFQY',
    secure: true,
});
// Create storage for cover images
const coverStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
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
const avatarStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
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
const resumeStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        return {
            folder: 'jobportal/resumes',
            resource_type: 'raw',
            public_id: `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        };
    },
});
exports.uploadCover = (0, multer_1.default)({ storage: coverStorage });
exports.uploadAvatar = (0, multer_1.default)({ storage: avatarStorage });
exports.uploadResume = (0, multer_1.default)({ storage: resumeStorage });
