const User = require("../models/User");

// @desc    Get alumni profile
// @route   GET /api/alumni/profile
// @access  Private (Alumni only)
const getAlumniProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "Alumni not found", data: null });
        }
        res.status(200).json({ success: true, message: "Profile fetched successfully", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Update alumni profile
// @route   PUT /api/alumni/profile
// @access  Private (Alumni only)
const updateAlumniProfile = async (req, res) => {
    try {
        const {
            bio, skills, linkedin, github, portfolio,
            company, designation, experience, mentorshipDomains,
            isAvailable, availabilityStatus
        } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Alumni not found", data: null });
        }

        // Validate and apply fields
        if (bio !== undefined) user.bio = bio;
        if (skills !== undefined && Array.isArray(skills)) user.skills = skills;
        if (linkedin !== undefined) user.linkedin = linkedin;
        if (github !== undefined) user.github = github;
        if (portfolio !== undefined) user.portfolio = portfolio;

        if (company !== undefined) user.company = company;
        if (designation !== undefined) user.designation = designation;
        if (experience !== undefined && typeof experience === 'number') user.experience = experience;
        if (mentorshipDomains !== undefined && Array.isArray(mentorshipDomains)) user.mentorshipDomains = mentorshipDomains;
        if (isAvailable !== undefined && typeof isAvailable === 'boolean') user.isAvailable = isAvailable;
        
        if (availabilityStatus !== undefined) {
            if (["Available", "Busy", "On Leave"].includes(availabilityStatus)) {
                user.availabilityStatus = availabilityStatus;
            } else {
                return res.status(400).json({ success: false, message: "Invalid availabilityStatus", data: null });
            }
        }

        await user.save();

        const updatedUser = await User.findById(req.user.id).select("-password");

        res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

const { uploadImageToCloudinary, deleteFromCloudinary } = require("../services/uploadService");

// @desc    Update alumni profile image
// @route   PATCH /api/alumni/profile-image
// @access  Private (Alumni only)
const updateAlumniProfileImage = async (req, res) => {
    try {
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

        res.status(200).json({ success: true, message: "Profile image updated successfully", data: { profileImage: user.profileImage } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error during image upload", data: null });
    }
};

// @desc    Get all alumni / search alumni
// @route   GET /api/alumni
// @route   GET /api/alumni/search
// @access  Private (All users)
const getAllAlumni = async (req, res) => {
    try {
        let { page, limit, keyword, company, designation, mentorshipDomains, skills, experience, isAvailable, sort } = req.query;

        // Pagination setup
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        if (limit > 20) limit = 20;

        const skip = (page - 1) * limit;

        // Dynamic query builder
        let query = { role: "alumni" };

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
            // Handle comma separated or array
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
            query.isAvailable = isAvailable === 'true';
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

        // Execution
        const total = await User.countDocuments(query);
        const alumni = await User.find(query)
            .select("name profileImage company designation experience mentorshipDomains skills bio availabilityStatus isAvailable linkedin github portfolio averageRating totalRatings completedMentorships recommendationPercentage")
            .sort(sortObj)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: alumni.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: alumni
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get alumni by ID
// @route   GET /api/alumni/:id
// @access  Private (All users)
const getAlumniById = async (req, res) => {
    try {
        const alumni = await User.findById(req.params.id)
            .select("name profileImage company designation experience mentorshipDomains skills bio availabilityStatus isAvailable linkedin github portfolio role averageRating totalRatings completedMentorships recommendationPercentage");
        
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(404).json({ success: false, message: "Alumni not found", data: null });
        }

        const alumniObj = alumni.toObject();
        // Rename totalRatings to totalMentorships for frontend compatibility if needed
        alumniObj.totalMentorships = alumniObj.totalRatings;
        
        // Ensure role is excluded from output since we just queried it for logic
        delete alumniObj.role;

        res.status(200).json({ success: true, message: "Alumni fetched", data: alumniObj });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ success: false, message: "Alumni not found", data: null });
        }
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    getAlumniProfile,
    updateAlumniProfile,
    updateAlumniProfileImage,
    getAllAlumni,
    getAlumniById
};
