const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const { getPagination } = require("../utils/pagination");
const logger = require("../config/logger");

// @desc    Get all notifications for user
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    let { page, limit } = req.query;

    const query = { recipient: req.user.id }; // isDeleted: false is handled by softDeletePlugin

    const total = await Notification.countDocuments(query);
    const { skip, limit: limitNum, paginationMeta } = getPagination(page, limit, total);

    const notifications = await Notification.find(query)
        .populate("sender", "name profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    res.status(200).json({
        success: true,
        message: "Notifications fetched",
        count: notifications.length,
        total: paginationMeta.total,
        page: paginationMeta.page,
        pages: paginationMeta.pages,
        data: notifications
    });
});

// @desc    Get unread notification count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user.id,
        isRead: false
    });

    res.status(200).json({ success: true, message: "Unread count fetched", data: { count } });
});

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user.id },
        { $set: { isRead: true } },
        { new: true }
    ).lean();
    
    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found", data: null });
    }

    res.status(200).json({ success: true, message: "Notification marked as read", data: notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read", data: null });
});

// @desc    Soft delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
    
    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found", data: null });
    }

    notification.isDeleted = true;
    notification.deletedAt = new Date();
    await notification.save();

    res.status(200).json({ success: true, message: "Notification deleted", data: null });
});

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
