const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    meeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
        required: true
    },
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        default: ""
    },
    recommended: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const softDeletePlugin = require("../utils/softDeletePlugin");
feedbackSchema.plugin(softDeletePlugin);

// Indexes
feedbackSchema.index({ alumni: 1 });
feedbackSchema.index({ student: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
