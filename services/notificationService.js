const Notification = require("../models/Notification");

/**
 * Service to handle creating notifications system-wide.
 */
const createNotification = async ({
    recipient,
    sender,
    type,
    title,
    message,
    referenceId,
    referenceModel,
    priority = "Medium",
    actionUrl
}) => {
    try {
        if (!recipient) {
            console.error("Notification Service: recipient is required");
            return null;
        }

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            referenceId,
            referenceModel,
            priority,
            actionUrl
        });

        return notification;
    } catch (error) {
        console.error("Notification Service Error:", error);
        return null; // Return null on failure to not block main thread
    }
};

module.exports = {
    createNotification
};
