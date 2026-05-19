const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(protect);

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Mark all as read
router.put('/mark-all-read', markAllAsRead);

// Mark single as read
router.put('/:notificationId/read', markAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;