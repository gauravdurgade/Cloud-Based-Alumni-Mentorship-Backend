const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const feedbackValidation = require("../validations/feedback.validation");

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Mentorship feedback and ratings
 */

/**
 * @swagger
 * /api/v1/feedback:
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
const {
    submitFeedback,
    getAlumniFeedback
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// Student submits feedback
router.post("/", authorize("student"), validate(feedbackValidation.submitFeedback), submitFeedback);

// Get feedback for an alumni
router.get("/alumni/:alumniId", validate(feedbackValidation.getAlumniFeedback), getAlumniFeedback);

module.exports = router;
