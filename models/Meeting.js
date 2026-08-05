const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
{
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MentorshipRequest",
        required: true
    },
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
    title: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    durationMinutes: {
        type: Number,
        default: 30
    },
    meetingPlatform: {
        type: String,
        default: ""
    },
    meetingLink: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Scheduled", "Completed", "Cancelled"],
        default: "Scheduled"
    }
},
{
    timestamps: true
});

const softDeletePlugin = require("../utils/softDeletePlugin");
meetingSchema.plugin(softDeletePlugin);

// Indexes for performance
meetingSchema.index({ student: 1 });
meetingSchema.index({ alumni: 1, status: 1 });
meetingSchema.index({ request: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
