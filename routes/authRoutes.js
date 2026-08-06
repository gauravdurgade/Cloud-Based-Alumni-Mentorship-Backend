const express = require("express");
const router = express.Router();

const validate = require("../middleware/validate");
const authValidation = require("../validations/auth.validation");

const {
    registerUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Authentication APIs
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", validate(authValidation.register), registerUser);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", validate(authValidation.login), loginUser);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get logged in user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/profile", protect, getProfile);

module.exports = router;