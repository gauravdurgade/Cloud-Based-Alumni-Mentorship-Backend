const express = require("express");

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Mentorship feedback and ratings
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback for a meeting
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meetingId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comments:
 *                 type: string
 *               wouldRecommend:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Feedback submitted
 *   get:
 *     summary: Get feedback for the logged in user
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feedback
 */
const router = express.Router();
const {
    submitFeedback,
    getAlumniFeedback
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// Student only: Submit feedback
router.post("/", authorize("student"), submitFeedback);

// Public (all authenticated users)
router.get("/alumni/:alumniId", getAlumniFeedback);

module.exports = router;
