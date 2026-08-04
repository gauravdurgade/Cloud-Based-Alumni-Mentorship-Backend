const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: [
            "MENTORSHIP_REQUEST_CREATED",
            "MENTORSHIP_REQUEST_ACCEPTED",
            "MENTORSHIP_REQUEST_REJECTED",
            "MEETING_SCHEDULED",
            "MEETING_CANCELLED",
            "MEETING_COMPLETED",
            "FEEDBACK_SUBMITTED",
            "SYSTEM"
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    referenceModel: {
        type: String,
        enum: ["MentorshipRequest", "Meeting", "Feedback", "User"]
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    actionUrl: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);
