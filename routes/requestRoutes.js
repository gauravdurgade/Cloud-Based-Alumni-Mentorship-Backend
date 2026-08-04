const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Mentorship Requests
 *   description: Manage mentorship pairing requests
 */

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a mentorship request
 *     tags: [Mentorship Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alumniId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created
 *   get:
 *     summary: Get all mentorship requests for the logged in user
 *     tags: [Mentorship Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests
 */

/**
 * @swagger
 * /api/requests/{id}/status:
 *   patch:
 *     summary: Update request status
 *     tags: [Mentorship Requests]
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
 *                 enum: [Accepted, Rejected, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */

const {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    completeRequest
} = require("../controllers/requestController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// Student routes
router.post("/", authorize("student"), createRequest);
router.get("/my", authorize("student"), getMyRequests);

// Alumni routes
router.get("/received", authorize("alumni"), getReceivedRequests);
router.patch("/:id/accept", authorize("alumni"), acceptRequest);
router.patch("/:id/reject", authorize("alumni"), rejectRequest);
router.patch("/:id/complete", authorize("alumni"), completeRequest);

module.exports = router;
