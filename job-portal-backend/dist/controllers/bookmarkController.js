"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Get all bookmarks for current user
const getBookmarks = async (req, res) => {
    try {
        const userId = req.user.id;
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            return res.status(404).json({
                success: false,
                message: 'Job seeker profile not found'
            });
        }
        const bookmarks = await prisma.jobBookmark.findMany({
            where: { seeker_id: seeker.id },
            include: {
                job: {
                    include: {
                        employer: true,
                        industry: true,
                        employment_type: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: bookmarks });
    }
    catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get bookmark count
const getBookmarkCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            return res.json({ success: true, data: { count: 0 } });
        }
        const count = await prisma.jobBookmark.count({
            where: { seeker_id: seeker.id }
        });
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        console.error('Get bookmark count error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Check if job is bookmarked
const checkBookmarkStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            return res.json({ success: true, data: { isBookmarked: false } });
        }
        const bookmark = await prisma.jobBookmark.findFirst({
            where: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        res.json({ success: true, data: { isBookmarked: !!bookmark } });
    }
    catch (error) {
        console.error('Check bookmark status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Bookmark a job
const bookmarkJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        // Check if job exists
        const job = await prisma.jobPost.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        // Get or create seeker profile
        let seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            seeker = await prisma.jobSeekerProfile.create({
                data: {
                    user_id: userId,
                    full_name: 'User',
                    skills: []
                }
            });
        }
        // Check if already bookmarked
        const existingBookmark = await prisma.jobBookmark.findFirst({
            where: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        if (existingBookmark) {
            return res.status(400).json({ success: false, message: 'Job already bookmarked' });
        }
        // Create bookmark
        const bookmark = await prisma.jobBookmark.create({
            data: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        res.status(201).json({
            success: true,
            data: bookmark,
            message: 'Job saved successfully'
        });
    }
    catch (error) {
        console.error('Bookmark job error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Remove bookmark
const removeBookmark = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        const seeker = await prisma.jobSeekerProfile.findFirst({
            where: { user_id: userId }
        });
        if (!seeker) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        const deleted = await prisma.jobBookmark.deleteMany({
            where: {
                job_id: jobId,
                seeker_id: seeker.id
            }
        });
        if (deleted.count === 0) {
            return res.status(404).json({ success: false, message: 'Bookmark not found' });
        }
        res.json({ success: true, message: 'Job removed from bookmarks' });
    }
    catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {
    bookmarkJob,
    removeBookmark,
    getBookmarks,
    checkBookmarkStatus,
    getBookmarkCount
};
