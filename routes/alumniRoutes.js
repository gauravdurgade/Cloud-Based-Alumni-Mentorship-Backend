const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const alumniValidation = require("../validations/alumni.validation");

/**
 * @swagger
 * tags:
 *   name: Alumni
 *   description: Alumni profile and directory management
 */

/**
 * @swagger
 * /api/v1/alumni:
 *   get:
 *     summary: Discover and list approved alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alumni
 */

/**
 * @swagger
 * /api/v1/alumni/profile:
 *   get:
 *     summary: Get logged in alumni profile
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *   put:
 *     summary: Update alumni profile
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /api/v1/alumni/profile-image:
 *   patch:
 *     summary: Upload profile image
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 */

const {
    getAlumniProfile,
    updateAlumniProfile,
    updateAlumniProfileImage,
    getAllAlumni,
    getAlumniById
} = require("../controllers/alumniController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");

// All alumni routes require authentication
router.use(protect);

// Public discovery endpoints (for all authenticated users, e.g., students & alumni)
router.get("/", validate(alumniValidation.getAll), getAllAlumni);
router.get("/search", validate(alumniValidation.getAll), getAllAlumni);

// Private CRUD endpoints (Alumni only)
// Note: "/profile" must be defined before "/:id" so it doesn't match as an ID
router.get("/profile", authorize("alumni"), getAlumniProfile);
router.put("/profile", authorize("alumni"), validate(alumniValidation.updateProfile), updateAlumniProfile);
router.patch("/profile-image", authorize("alumni"), updateAlumniProfileImage);

// Public discovery endpoint for specific ID
router.get("/:id", validate(alumniValidation.getById), getAlumniById);

module.exports = router;
