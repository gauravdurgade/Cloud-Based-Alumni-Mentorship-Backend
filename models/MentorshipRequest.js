const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema(
{
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    alumni: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"],
        default: "Pending"
    },
    acceptedDate: {
        type: Date
    },
    scheduledDate: {
        type: Date
    },
    meetingLink: {
        type: String
    },
    meetingPlatform: {
        type: String
    },
    completionNotes: {
        type: String
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedbackGiven: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
