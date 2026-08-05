const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
const Meeting = require("../models/Meeting");
const { getAdminMetrics } = require("../services/dashboardService");
const { createNotification } = require("../services/notificationService");
const emailService = require("../services/emailService");
const asyncHandler = require("../middleware/asyncHandler");
const { getPagination } = require("../utils/pagination");
const logger = require("../config/logger");

// @desc    Get admin dashboard
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin only)
const getAdminDashboard = asyncHandler(async (req, res) => {
    const metrics = await getAdminMetrics();
    const mappedData = {
        summary: metrics.summary,
        users: metrics.analytics.users,
        analytics: {
            requests: metrics.analytics.requests,
            meetings: metrics.analytics.meetings,
            feedback: metrics.analytics.feedback
        },
        activity: metrics.recentActivity
    };
    res.status(200).json({ success: true, message: "Dashboard metrics fetched", data: mappedData });
});

// @desc    Get all users (with filters)
// @route   GET /api/v1/admin/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
    let { page, limit, keyword, role, accountStatus, branch, company, designation, availability, isAlumniApproved } = req.query;

    let query = {}; // isDeleted: false is handled globally by softDeletePlugin

    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: "i" } },
            { email: { $regex: keyword, $options: "i" } }
        ];
    }

    if (role) query.role = role;
    if (accountStatus) query.accountStatus = accountStatus;
    if (branch) query.branch = { $regex: branch, $options: "i" };
    if (company) query.company = { $regex: company, $options: "i" };
    if (designation) query.designation = { $regex: designation, $options: "i" };
    
    if (availability !== undefined) {
        query.isAvailable = availability === true || availability === 'true';
    }
    if (isAlumniApproved !== undefined) {
        query.alumniApprovalStatus = isAlumniApproved;
    }

    const total = await User.countDocuments(query);
    const { skip, limit: limitNum, paginationMeta } = getPagination(page, limit, total);

    const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    res.status(200).json({
        success: true,
        message: "Users fetched",
        count: users.length,
        total: paginationMeta.total,
        page: paginationMeta.page,
        pages: paginationMeta.pages,
        data: users
    });
});

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Private (Admin only)
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found", data: null });
    }
    res.status(200).json({ success: true, message: "User fetched", data: user });
});

// @desc    Update user status (Suspend, Activate, Approve Alumni)
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
    const { accountStatus, alumniApprovalStatus } = req.body;
    
    // We cannot use lean() here because we need to .save() it (or we could use findByIdAndUpdate)
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found", data: null });
    }

    if (targetUser.id === req.user.id) {
        return res.status(403).json({ success: false, message: "You cannot perform this action on yourself", data: null });
    }
    if (targetUser.role === 'admin') {
        return res.status(403).json({ success: false, message: "You cannot perform this action on another admin", data: null });
    }

    if (accountStatus) {
        targetUser.accountStatus = accountStatus;
        await createNotification({
            recipient: targetUser._id,
            type: "SYSTEM",
            title: accountStatus === "Suspended" ? "Account Suspended" : "Account Activated",
            message: accountStatus === "Suspended" ? "Your account has been suspended by an administrator." : "Your account has been successfully activated.",
            priority: "High"
        });
        logger.info(`User ${targetUser.email} account status updated to ${accountStatus} by admin`);
    }

    if (alumniApprovalStatus && targetUser.role === 'alumni') {
        targetUser.alumniApprovalStatus = alumniApprovalStatus;
        if (alumniApprovalStatus === "Approved") {
            await createNotification({
                recipient: targetUser._id,
                type: "SYSTEM",
                title: "Alumni Profile Approved",
                message: "Congratulations! Your alumni profile has been approved and is now visible to students.",
                priority: "High"
            });
            emailService.sendAlumniApprovedEmail(targetUser.email, targetUser.name);
        }
        logger.info(`Alumni ${targetUser.email} approval status updated to ${alumniApprovalStatus} by admin`);
    }

    await targetUser.save();
    
    // Hide password before returning
    targetUser.password = undefined;

    res.status(200).json({ success: true, message: "User status updated", data: targetUser });
});

// @desc    Update user details manually
// @route   PATCH /api/v1/admin/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
    const updates = req.body;
    delete updates.role;
    delete updates.password;
    delete updates.accountStatus;
    delete updates.alumniApprovalStatus;
    delete updates.isDeleted;

    const user = await User.findOneAndUpdate(
        { _id: req.params.id, role: { $ne: 'admin' } }, 
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-password").lean();

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found or cannot be modified", data: null });
    }

    res.status(200).json({ success: true, message: "User updated", data: user });
});

// @desc    Delete user (Soft delete)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found", data: null });
    }

    if (targetUser.id === req.user.id) {
        return res.status(403).json({ success: false, message: "You cannot delete yourself", data: null });
    }
    if (targetUser.role === 'admin') {
        return res.status(403).json({ success: false, message: "You cannot delete another admin", data: null });
    }

    targetUser.isDeleted = true;
    targetUser.deletedAt = new Date();
    await targetUser.save();
    
    logger.info(`Admin deleted user: ${targetUser.email}`);

    res.status(200).json({ success: true, message: "User successfully deleted (soft delete)", data: null });
});

// @desc    Get system reports
// @route   GET /api/v1/admin/reports
// @access  Private (Admin only)
const getSystemReports = asyncHandler(async (req, res) => {
    const data = {
        mostActiveAlumni: [],
        topRatedAlumni: [],
        mostActiveStudents: [],
        monthlyGrowth: 0,
        platformStatistics: {}
    };

    data.topRatedAlumni = await User.find({ role: 'alumni' })
        .sort({ averageRating: -1, totalRatings: -1 })
        .limit(5)
        .select("name email averageRating totalRatings completedMentorships")
        .lean();

    data.mostActiveAlumni = await User.find({ role: 'alumni' })
        .sort({ completedMentorships: -1 })
        .limit(5)
        .select("name email averageRating totalRatings completedMentorships")
        .lean();

    const studentStats = await MentorshipRequest.aggregate([
        { $match: { status: "Completed" } },
        { $group: { _id: "$student", completedRequests: { $sum: 1 } } },
        { $sort: { completedRequests: -1 } },
        { $limit: 5 }
    ]);

    data.mostActiveStudents = await User.populate(studentStats, { path: "_id", select: "name email branch" });

    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
    data.monthlyGrowth = await User.countDocuments({ createdAt: { $gte: d } });

    data.platformStatistics = {
        totalUsers: await User.countDocuments(),
        totalRequests: await MentorshipRequest.countDocuments(),
        totalMeetings: await Meeting.countDocuments()
    };

    res.status(200).json({ success: true, message: "Reports generated", data });
});

module.exports = {
    getAdminDashboard,
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    getSystemReports
};
