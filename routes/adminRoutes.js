const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const adminValidation = require("../validations/admin.validation");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative management
 */

/**
 * @swagger
 * /api/v1/admin/users:
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
 * /api/v1/admin/users/{id}/status:
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
router.get("/users", validate(adminValidation.getAllUsers), getAllUsers);
router.get("/users/:id", validate(adminValidation.getById), getUserById);
router.patch("/users/:id", validate(adminValidation.updateUser), updateUser);
router.patch("/users/:id/status", validate(adminValidation.updateStatus), updateUserStatus);
router.delete("/users/:id", validate(adminValidation.deleteUser), deleteUser);

module.exports = router;
