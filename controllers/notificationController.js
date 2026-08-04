const Notification = require("../models/Notification");

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;
        const skip = (page - 1) * limit;

        const query = { recipient: req.user.id, isDeleted: false };

        const total = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
            .populate("sender", "name profileImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false,
            isDeleted: false
        });

        res.status(200).json({ success: true, message: "Unread count fetched", data: { count } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
        
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found", data: null });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ success: true, message: "Notification marked as read", data: notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false, isDeleted: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, message: "All notifications marked as read", data: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Soft delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
        
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found", data: null });
        }

        notification.isDeleted = true;
        await notification.save();

        res.status(200).json({ success: true, message: "Notification deleted", data: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
