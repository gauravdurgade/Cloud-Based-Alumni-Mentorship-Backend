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

// Routes
router.post("/register", validate(authValidation.register), registerUser);
router.post("/login", validate(authValidation.login), loginUser);
router.get("/profile", protect, getProfile);

module.exports = router;