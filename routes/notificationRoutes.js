const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const notificationValidation = require("../validations/notification.validation");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
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
 *     responses:
 *       200:
 *         description: Notification marked as read
 */

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/", validate(notificationValidation.getNotifications), getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead); // Must be before /:id/read
router.patch("/:id/read", validate(notificationValidation.byId), markAsRead);
router.delete("/:id", validate(notificationValidation.byId), deleteNotification);

module.exports = router;
