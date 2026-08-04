const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Mentorship session management
 */

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Schedule a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               meetingLink:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting scheduled
 *   get:
 *     summary: Get user meetings
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meetings
 */

/**
 * @swagger
 * /api/meetings/{id}/status:
 *   patch:
 *     summary: Update meeting status
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Meeting status updated
 */

const {
    createMeeting,
    getAlumniMeetings,
    getStudentMeetings,
    updateMeetingStatus
} = require("../controllers/meetingController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// Alumni-only routes
router.post("/", authorize("alumni"), createMeeting);
router.get("/alumni", authorize("alumni"), getAlumniMeetings);
router.patch("/:id/status", authorize("alumni"), updateMeetingStatus);

// Student-only routes
router.get("/student", authorize("student"), getStudentMeetings);

module.exports = router;
