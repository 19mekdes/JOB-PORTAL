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

router.get('/', getBookmarks);


router.get('/count', getBookmarkCount);


router.get('/check/:jobId', checkBookmarkStatus);


router.post('/:jobId', bookmarkJob);


router.delete('/:jobId', removeBookmark);

module.exports = router;