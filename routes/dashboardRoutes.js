const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and summaries
 */

/**
 * @swagger
 * /api/v1/dashboard/student:
 *   get:
 *     summary: Get student dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard metrics
 */

/**
 * @swagger
 * /api/v1/dashboard/alumni:
 *   get:
 *     summary: Get alumni dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alumni dashboard metrics
 */

/**
 * @swagger
 * /api/v1/dashboard/admin:
 *   get:
 *     summary: Get admin platform statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 */

const {
    getStudentDashboard,
    getAlumniDashboard,
    getAdminDashboard
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/student", authorize("student"), getStudentDashboard);
router.get("/alumni", authorize("alumni"), getAlumniDashboard);
router.get("/admin", authorize("admin"), getAdminDashboard);

module.exports = router;
