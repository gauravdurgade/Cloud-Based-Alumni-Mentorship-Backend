const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
const Meeting = require("../models/Meeting");
const { getAdminMetrics } = require("../services/dashboardService");
const { createNotification } = require("../services/notificationService");

// @desc    Get admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
    try {
        const metrics = await getAdminMetrics();
        // The service already provides a rich object, we remap it to match the requested Admin structure
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
        res.status(200).json({ success: true, data: mappedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get all users (with filters)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
    try {
        let { page, limit, keyword, role, accountStatus, branch, company, designation, availability, isAlumniApproved } = req.query;

        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;
        const skip = (page - 1) * limit;

        let query = { isDeleted: false };

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
            query.isAvailable = availability === 'true';
        }

        if (isAlumniApproved !== undefined) {
            query.alumniApprovalStatus = isAlumniApproved;
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found", data: null });
        }
        res.status(200).json({ success: true, message: "User fetched", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Update user status (Suspend, Activate, Approve Alumni)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
    try {
        const { accountStatus, alumniApprovalStatus } = req.body;
        const targetUser = await User.findOne({ _id: req.params.id, isDeleted: false });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found", data: null });
        }

        // Security check: Prevent admins from targeting themselves or other admins
        if (targetUser.id === req.user.id) {
            return res.status(403).json({ success: false, message: "You cannot perform this action on yourself", data: null });
        }
        if (targetUser.role === 'admin') {
            return res.status(403).json({ success: false, message: "You cannot perform this action on another admin", data: null });
        }

        // Apply Status Changes
        if (accountStatus) {
            if (!["Active", "Suspended"].includes(accountStatus)) {
                return res.status(400).json({ success: false, message: "Invalid accountStatus", data: null });
            }
            targetUser.accountStatus = accountStatus;
            
            // Notify User
            await createNotification({
                recipient: targetUser._id,
                type: "SYSTEM",
                title: accountStatus === "Suspended" ? "Account Suspended" : "Account Activated",
                message: accountStatus === "Suspended" ? "Your account has been suspended by an administrator." : "Your account has been successfully activated.",
                priority: "High"
            });
        }

        if (alumniApprovalStatus && targetUser.role === 'alumni') {
            if (!["Pending", "Approved", "Rejected"].includes(alumniApprovalStatus)) {
                return res.status(400).json({ success: false, message: "Invalid alumniApprovalStatus", data: null });
            }
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
        }

        await targetUser.save();

        res.status(200).json({ success: true, message: "User status updated", data: targetUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Update user details manually
// @route   PATCH /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
    try {
        // Exclude role, status, and sensitive fields from general update
        const updates = req.body;
        delete updates.role;
        delete updates.password;
        delete updates.accountStatus;
        delete updates.alumniApprovalStatus;
        delete updates.isDeleted;

        const user = await User.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false, role: { $ne: 'admin' } }, 
            { $set: updates },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found or cannot be modified", data: null });
        }

        res.status(200).json({ success: true, message: "User updated", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Delete user (Soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
    try {
        const targetUser = await User.findOne({ _id: req.params.id, isDeleted: false });

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

        res.status(200).json({ success: true, message: "User successfully deleted (soft delete)", data: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getSystemReports = async (req, res) => {
    try {
        const data = {
            mostActiveAlumni: [],
            topRatedAlumni: [],
            mostActiveStudents: [],
            monthlyGrowth: 0,
            platformStatistics: {}
        };

        // Top Rated Alumni
        data.topRatedAlumni = await User.find({ role: 'alumni', isDeleted: false })
            .sort({ averageRating: -1, totalRatings: -1 })
            .limit(5)
            .select("name email averageRating totalRatings completedMentorships");

        // Most Active Alumni
        data.mostActiveAlumni = await User.find({ role: 'alumni', isDeleted: false })
            .sort({ completedMentorships: -1 })
            .limit(5)
            .select("name email averageRating totalRatings completedMentorships");

        // Most Active Students (via MentorshipRequests)
        const studentStats = await MentorshipRequest.aggregate([
            { $match: { status: "Completed" } },
            { $group: { _id: "$student", completedRequests: { $sum: 1 } } },
            { $sort: { completedRequests: -1 } },
            { $limit: 5 }
        ]);

        data.mostActiveStudents = await User.populate(studentStats, { path: "_id", select: "name email branch" });

        // Monthly Growth
        const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
        data.monthlyGrowth = await User.countDocuments({ createdAt: { $gte: d }, isDeleted: false });

        // Platform Statistics
        data.platformStatistics = {
            totalUsers: await User.countDocuments({ isDeleted: false }),
            totalRequests: await MentorshipRequest.countDocuments(),
            totalMeetings: await Meeting.countDocuments()
        };

        res.status(200).json({ success: true, message: "Reports generated", data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    getAdminDashboard,
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    getSystemReports
};
