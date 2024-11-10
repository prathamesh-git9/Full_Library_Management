const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
  sendDueDateReminders,
  sendOverdueNotices
} = require('../controllers/notificationController');
const { authenticate, requireAdmin, requireAdminOrLibrarian } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - user
 *         - type
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the notification
 *         user:
 *           type: string
 *           description: User ID who will receive the notification
 *         type:
 *           type: string
 *           enum: [due_date, overdue, fine, reservation, general]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         relatedEntity:
 *           type: string
 *           description: ID of related entity (book, borrow, etc.)
 *         emailSent:
 *           type: boolean
 *           description: Whether email notification was sent
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Notification creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of notifications per page
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [due_date, overdue, fine, reservation, general]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getNotifications);
router.get('/stats', authenticate, requireAdminOrLibrarian, getNotificationStats);
router.post('/send-due-reminders', authenticate, requireAdminOrLibrarian, sendDueDateReminders);
router.post('/send-overdue-notices', authenticate, requireAdminOrLibrarian, sendOverdueNotices);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.get('/:id', authenticate, getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', authenticate, markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch('/read-all', authenticate, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', authenticate, deleteNotification);
router.post('/', authenticate, requireAdminOrLibrarian, createNotification);

module.exports = router;
