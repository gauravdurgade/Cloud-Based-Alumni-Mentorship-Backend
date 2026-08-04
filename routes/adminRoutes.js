const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative management
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Update user status or approve alumni
 *     tags: [Admin]
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
 *               accountStatus:
 *                 type: string
 *                 enum: [Active, Suspended]
 *               alumniApprovalStatus:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *     responses:
 *       200:
 *         description: Status updated
 */

const {
    getAdminDashboard,
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    getSystemReports
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All admin routes are strictly protected
router.use(protect);
router.use(authorize("admin"));

// Dashboard & Reports
router.get("/dashboard", getAdminDashboard);
router.get("/reports", getSystemReports);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
