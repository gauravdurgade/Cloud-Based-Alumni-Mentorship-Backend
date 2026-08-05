const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { uploadImageToCloudinary, deleteFromCloudinary } = require("../services/uploadService");
const { getPagination } = require("../utils/pagination");
const logger = require("../config/logger");
const { ROLES } = require("../utils/constants");

// @desc    Get alumni profile
// @route   GET /api/v1/alumni/profile
// @access  Private (Alumni only)
const getAlumniProfile = asyncHandler(async (req, res) => {
    // req.user is securely populated by authMiddleware
    res.status(200).json({ 
        success: true, 
        message: "Profile fetched successfully", 
        data: { user: req.user } 
    });
});

// @desc    Update alumni profile
// @route   PUT /api/v1/alumni/profile
// @access  Private (Alumni only)
const updateAlumniProfile = asyncHandler(async (req, res) => {
    // Payload validated by Joi
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: req.body },
        { new: true, runValidators: true }
    ).select("-password").lean();

    if (!updatedUser) {
        return res.status(404).json({ success: false, message: "Alumni not found", data: null });
    }

    res.status(200).json({ 
        success: true, 
        message: "Profile updated successfully", 
        data: { user: updatedUser } 
    });
});

// @desc    Update alumni profile image
// @route   PATCH /api/v1/alumni/profile-image
// @access  Private (Alumni only)
const updateAlumniProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Please provide a valid profile image", data: null });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "Alumni not found", data: null });
    }

    const result = await uploadImageToCloudinary(req.file.buffer, "cloud-alumni-platform/alumni/profile-images");

    if (user.profileImagePublicId) {
        await deleteFromCloudinary(user.profileImagePublicId);
    }

    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;
    await user.save();

    logger.info(`Alumni profile image updated: ${user.email}`);

    res.status(200).json({ 
        success: true, 
        message: "Profile image updated successfully", 
        data: { profileImage: user.profileImage } 
    });
});

// @desc    Get all alumni / search alumni
// @route   GET /api/v1/alumni
// @access  Private (All users)
const getAllAlumni = asyncHandler(async (req, res) => {
    let { page, limit, keyword, company, designation, mentorshipDomains, skills, experience, isAvailable, sort } = req.query;

    const query = { role: ROLES.ALUMNI, accountStatus: 'Active' };

    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: "i" } },
            { company: { $regex: keyword, $options: "i" } },
            { designation: { $regex: keyword, $options: "i" } },
            { skills: { $regex: keyword, $options: "i" } },
            { bio: { $regex: keyword, $options: "i" } },
            { mentorshipDomains: { $regex: keyword, $options: "i" } }
        ];
    }

    if (company) query.company = { $regex: company, $options: "i" };
    if (designation) query.designation = { $regex: designation, $options: "i" };
    if (mentorshipDomains) {
        const domainsArr = typeof mentorshipDomains === 'string' ? mentorshipDomains.split(',') : mentorshipDomains;
        query.mentorshipDomains = { $in: domainsArr.map(d => new RegExp(d.trim(), 'i')) };
    }
    if (skills) {
        const skillsArr = typeof skills === 'string' ? skills.split(',') : skills;
        query.skills = { $in: skillsArr.map(s => new RegExp(s.trim(), 'i')) };
    }
    if (experience) {
        const expNum = parseInt(experience, 10);
        if (!isNaN(expNum) && expNum >= 0) {
            query.experience = { $gte: expNum };
        }
    }
    if (isAvailable !== undefined) {
        query.isAvailable = isAvailable === true || isAvailable === 'true';
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // newest by default
    if (sort) {
        switch(sort) {
            case 'oldest': sortObj = { createdAt: 1 }; break;
            case 'experienceAsc': sortObj = { experience: 1 }; break;
            case 'experienceDesc': sortObj = { experience: -1 }; break;
            case 'nameAsc': sortObj = { name: 1 }; break;
            case 'nameDesc': sortObj = { name: -1 }; break;
            case 'newest':
            default: sortObj = { createdAt: -1 }; break;
        }
    }

    const total = await User.countDocuments(query);
    const { skip, limit: limitNum, paginationMeta } = getPagination(page, limit, total);

    const alumni = await User.find(query)
        .select("name profileImage company designation experience mentorshipDomains skills bio availabilityStatus isAvailable linkedin github portfolio averageRating totalRatings completedMentorships recommendationPercentage")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean();

    res.status(200).json({
        success: true,
        message: "Alumni list fetched",
        count: alumni.length,
        total: paginationMeta.total,
        page: paginationMeta.page,
        pages: paginationMeta.pages,
        data: alumni
    });
});

// @desc    Get alumni by ID
// @route   GET /api/v1/alumni/:id
// @access  Private (All users)
const getAlumniById = asyncHandler(async (req, res) => {
    const alumni = await User.findById(req.params.id)
        .select("name profileImage company designation experience mentorshipDomains skills bio availabilityStatus isAvailable linkedin github portfolio role averageRating totalRatings completedMentorships recommendationPercentage")
        .lean();
    
    if (!alumni || alumni.role !== ROLES.ALUMNI) {
        return res.status(404).json({ success: false, message: "Alumni not found", data: null });
    }

    // Rename totalRatings to totalMentorships for frontend compatibility if needed
    alumni.totalMentorships = alumni.totalRatings;
    delete alumni.role;

    res.status(200).json({ success: true, message: "Alumni fetched", data: alumni });
});

module.exports = {
    getAlumniProfile,
    updateAlumniProfile,
    updateAlumniProfileImage,
    getAllAlumni,
    getAlumniById
};
