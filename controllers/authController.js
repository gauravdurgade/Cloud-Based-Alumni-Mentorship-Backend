const User = require("../models/User");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailService");
const logger = require("../config/logger");
const env = require("../config/env");
const { ACCOUNT_STATUS, ALUMNI_STATUS } = require("../utils/constants");
const asyncHandler = require("../middleware/asyncHandler");

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

// ==========================
// Register User
// ==========================
const registerUser = asyncHandler(async (req, res) => {
    // Validation is handled by Joi middleware, so body is safe
    const { name, email, password, role } = req.body;

    // Check if user already exists (using lean() for speed)
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists",
            data: null
        });
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    logger.info(`New user registered: ${user.email} as ${user.role}`);

    // Trigger welcome email asynchronously (does not block response)
    emailService.sendWelcomeEmail(user.email, user.name, user.role);

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
        success: true,
        message: "User Registered Successfully",
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
});

// ==========================
// Login User
// ==========================
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists and include fields for validation
    const user = await User.findOne({ email }).select("+password +accountStatus +alumniApprovalStatus +isDeleted");

    if (!user || user.isDeleted) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
            data: null
        });
    }

    // Block suspended users
    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        logger.warn(`Suspended user attempted login: ${user.email}`);
        return res.status(403).json({
            success: false,
            message: "Account suspended. Please contact support.",
            data: null
        });
    }

    // Block unapproved alumni
    if (user.role === 'alumni' && user.alumniApprovalStatus !== ALUMNI_STATUS.APPROVED) {
        logger.warn(`Unapproved alumni attempted login: ${user.email}`);
        return res.status(403).json({
            success: false,
            message: "Alumni account pending approval.",
            data: null
        });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
            data: null
        });
    }

    // Generate token
    const token = generateToken(user._id, user.role);
    
    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
        success: true,
        message: "Login Successful",
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
});

// ==========================
// Get User Profile
// ==========================
const getProfile = asyncHandler(async (req, res) => {
    // req.user is populated by the protect middleware
    res.status(200).json({
        success: true,
        message: "Profile retrieved",
        data: {
            user: req.user
        }
    });
});

module.exports = {
    registerUser,
    loginUser,
    getProfile
};