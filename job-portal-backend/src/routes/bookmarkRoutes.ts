const express = require('express');
const {
  bookmarkJob,
  removeBookmark,
  getBookmarks,
  checkBookmarkStatus,
  getBookmarkCount
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();


router.use(protect);
router.use(authorize('Job Seeker'));


router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Bookmark routes are working!' });
});

// Get all bookmarks for current user
router.get('/', getBookmarks);

// Get bookmark count for current user
router.get('/count', getBookmarkCount);

// Check if a specific job is bookmarked
router.get('/check/:jobId', checkBookmarkStatus);

// Bookmark a job
router.post('/:jobId', bookmarkJob);

// Remove a bookmark
router.delete('/:jobId', removeBookmark);

module.exports = router;