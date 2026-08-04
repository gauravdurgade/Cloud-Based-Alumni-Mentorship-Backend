const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Student profile management
 */

/**
 * @swagger
 * /api/student/profile:
 *   get:
 *     summary: Get logged in student profile
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update student profile
 *     tags: [Student]
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
 *               branch:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /api/student/profile-image:
 *   patch:
 *     summary: Upload profile image
 *     tags: [Student]
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

/**
 * @swagger
 * /api/student/resume:
 *   patch:
 *     summary: Upload resume (PDF)
 *     tags: [Student]
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
 *         description: Resume uploaded
 */

const {
    getStudentProfile,
    updateStudentProfile,
    updateStudentProfileImage,
    updateStudentResume
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadImage, uploadResume: uploadPdf } = require("../middleware/uploadMiddleware");

// All routes are protected and strictly for students
router.use(protect);
router.use(authorize("student"));

router.get("/profile", getStudentProfile);
router.put("/profile", updateStudentProfile);

// File uploads using multer memory storage
router.patch("/profile-image", uploadImage.single("file"), updateStudentProfileImage);
router.patch("/resume", uploadPdf.single("file"), updateStudentResume);

module.exports = router;
