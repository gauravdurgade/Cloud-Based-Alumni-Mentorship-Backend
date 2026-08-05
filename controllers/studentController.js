const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { uploadImageToCloudinary, uploadPdfToCloudinary, deleteFromCloudinary } = require("../services/uploadService");
const logger = require("../config/logger");

// @desc    Get student profile
// @route   GET /api/v1/student/profile
// @access  Private (Student only)
const getStudentProfile = asyncHandler(async (req, res) => {
    // req.user is securely populated by authMiddleware
    res.status(200).json({ 
        success: true, 
        message: "Profile fetched successfully", 
        data: { user: req.user } 
    });
});

// @desc    Update student profile
// @route   PUT /api/v1/student/profile
// @access  Private (Student only)
const updateStudentProfile = asyncHandler(async (req, res) => {
    // Payload validated by Joi
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: req.body },
        { new: true, runValidators: true }
    ).select("-password").lean();

    if (!updatedUser) {
        return res.status(404).json({ success: false, message: "Student not found", data: null });
    }

    res.status(200).json({ 
        success: true, 
        message: "Profile updated successfully", 
        data: { user: updatedUser } 
    });
});

// @desc    Update student profile image
// @route   PATCH /api/v1/student/profile-image
// @access  Private (Student only)
const updateStudentProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Please provide a valid profile image", data: null });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "Student not found", data: null });
    }

    const result = await uploadImageToCloudinary(req.file.buffer, "cloud-alumni-platform/students/profile-images");

    if (user.profileImagePublicId) {
        await deleteFromCloudinary(user.profileImagePublicId);
    }

    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;
    await user.save();

    logger.info(`Student profile image updated: ${user.email}`);

    res.status(200).json({ 
        success: true, 
        message: "Profile image updated successfully", 
        data: { profileImage: user.profileImage } 
    });
});

// @desc    Update student resume
// @route   PATCH /api/v1/student/resume
// @access  Private (Student only)
const updateStudentResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Please provide a valid resume PDF", data: null });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "Student not found", data: null });
    }

    const result = await uploadPdfToCloudinary(req.file.buffer, "cloud-alumni-platform/students/resumes");

    if (user.resumePublicId) {
        await deleteFromCloudinary(user.resumePublicId);
    }

    user.resume = result.secure_url;
    user.resumePublicId = result.public_id;
    await user.save();
    
    logger.info(`Student resume updated: ${user.email}`);

    res.status(200).json({ 
        success: true, 
        message: "Resume updated successfully", 
        data: { resume: user.resume } 
    });
});

module.exports = {
    getStudentProfile,
    updateStudentProfile,
    updateStudentProfileImage,
    updateStudentResume
};
