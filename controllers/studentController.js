const User = require("../models/User");

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student only)
const getStudentProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "Student not found", data: null });
        }
        res.status(200).json({ success: true, message: "Profile fetched successfully", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student only)
const updateStudentProfile = async (req, res) => {
    try {
        const { bio, branch, year, skills, linkedin, github, portfolio } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Student not found", data: null });
        }

        if (bio !== undefined) user.bio = bio;
        if (branch !== undefined) user.branch = branch;
        if (year !== undefined) user.year = year;
        if (skills !== undefined && Array.isArray(skills)) user.skills = skills;
        if (linkedin !== undefined) user.linkedin = linkedin;
        if (github !== undefined) user.github = github;
        if (portfolio !== undefined) user.portfolio = portfolio;

        await user.save();

        // Return updated user without password
        const updatedUser = await User.findById(req.user.id).select("-password");

        res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

const { uploadImageToCloudinary, uploadPdfToCloudinary, deleteFromCloudinary } = require("../services/uploadService");

// @desc    Update student profile image
// @route   PATCH /api/student/profile-image
// @access  Private (Student only)
const updateStudentProfileImage = async (req, res) => {
    try {
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

        res.status(200).json({ success: true, message: "Profile image updated successfully", data: { profileImage: user.profileImage } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error during image upload", data: null });
    }
};

// @desc    Update student resume
// @route   PATCH /api/student/resume
// @access  Private (Student only)
const updateStudentResume = async (req, res) => {
    try {
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

        res.status(200).json({ success: true, message: "Resume updated successfully", data: { resume: user.resume } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error during resume upload", data: null });
    }
};

module.exports = {
    getStudentProfile,
    updateStudentProfile,
    updateStudentProfileImage,
    updateStudentResume
};
