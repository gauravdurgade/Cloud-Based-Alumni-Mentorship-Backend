const express = require("express");
const router = express.Router();

const validate = require("../middleware/validate");
const requestValidation = require("../validations/request.validation");

const {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    completeRequest
} = require("../controllers/requestController");

const { protect, authorize } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Mentorship Requests
 *   description: Manage mentorship pairing requests
 */

// Protect all routes
router.use(protect);

/**
 * @swagger
 * /api/v1/requests:
 *   get:
 *     summary: Get mentorship requests for logged in user
 *     tags: [Mentorship Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests fetched successfully
 *       403:
 *         description: Not authorized
 */
router.get("/", (req, res, next) => {
    switch (req.user.role) {
        case "student":
            return getMyRequests(req, res, next);

        case "alumni":
            return getReceivedRequests(req, res, next);

        case "admin":
            return getReceivedRequests(req, res, next);

        default:
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
    }
});

/**
 * @swagger
 * /api/v1/requests:
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
 *             required:
 *               - alumniId
 *               - message
 *             properties:
 *               alumniId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created successfully
 */
router.post(
    "/",
    authorize("student"),
    validate(requestValidation.createRequest),
    createRequest
);

/**
 * @swagger
 * /api/v1/requests/my:
 *   get:
 *     summary: Get my mentorship requests
 *     tags: [Mentorship Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student requests fetched successfully
 */
router.get(
    "/my",
    authorize("student"),
    getMyRequests
);

/**
 * @swagger
 * /api/v1/requests/received:
 *   get:
 *     summary: Get received mentorship requests
 *     tags: [Mentorship Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alumni received requests
 */
router.get(
    "/received",
    authorize("alumni"),
    getReceivedRequests
);

/**
 * @swagger
 * /api/v1/requests/{id}/accept:
 *   patch:
 *     summary: Accept mentorship request
 *     tags: [Mentorship Requests]
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
 *         description: Request accepted
 */
router.patch(
    "/:id/accept",
    authorize("alumni"),
    validate(requestValidation.acceptRequest),
    acceptRequest
);

/**
 * @swagger
 * /api/v1/requests/{id}/reject:
 *   patch:
 *     summary: Reject mentorship request
 *     tags: [Mentorship Requests]
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
 *         description: Request rejected
 */
router.patch(
    "/:id/reject",
    authorize("alumni"),
    validate(requestValidation.rejectRequest),
    rejectRequest
);

/**
 * @swagger
 * /api/v1/requests/{id}/complete:
 *   patch:
 *     summary: Complete mentorship request
 *     tags: [Mentorship Requests]
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
 *         description: Request completed
 */
router.patch(
    "/:id/complete",
    authorize("alumni"),
    validate(requestValidation.completeRequest),
    completeRequest
);

module.exports = router;