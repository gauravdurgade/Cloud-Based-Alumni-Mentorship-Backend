const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const emailService = require("../services/emailService");
const asyncHandler = require("../middleware/asyncHandler");
const logger = require("../config/logger");

// @desc    Submit feedback
// @route   POST /api/v1/feedback
// @access  Private (Student only)
const submitFeedback = asyncHandler(async (req, res) => {
    const { meetingId, rating, review, recommended } = req.body;

    const meeting = await Meeting.findById(meetingId).lean();
    if (!meeting) {
        return res.status(404).json({ success: false, message: "Meeting not found", data: null });
    }

    if (meeting.student.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized", data: null });
    }

    if (meeting.status !== "Completed") {
        return res.status(400).json({ success: false, message: "Feedback can only be submitted for completed meetings", data: null });
    }

    const existingFeedback = await Feedback.findOne({ meeting: meetingId }).lean();
    if (existingFeedback) {
        return res.status(400).json({ success: false, message: "Feedback already submitted for this meeting", data: null });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [feedback] = await Feedback.create([{
            meeting: meetingId,
            request: meeting.request,
            student: req.user.id,
            alumni: meeting.alumni,
            rating,
            review,
            recommended: recommended || false
        }], { session });

        await createNotification({
            recipient: meeting.alumni,
            sender: req.user.id,
            type: "FEEDBACK_SUBMITTED",
            title: "New Feedback Received",
            message: `You received a ${rating}-star rating for a recent meeting.`,
            referenceId: feedback._id,
            referenceModel: "Feedback"
        }, session);

        // Update Alumni Stats
        const allFeedback = await Feedback.find({ alumni: meeting.alumni }).session(session).lean();
        const totalRatings = allFeedback.length;
        const averageRating = allFeedback.reduce((acc, item) => acc + item.rating, 0) / totalRatings;
        const recommendedCount = allFeedback.filter(item => item.recommended).length;
        const recommendationPercentage = (recommendedCount / totalRatings) * 100;
        const completedMentorships = totalRatings; 

        await User.findByIdAndUpdate(meeting.alumni, {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalRatings,
            recommendationPercentage: Math.round(recommendationPercentage),
            completedMentorships
        }, { session });

        await session.commitTransaction();
        session.endSession();

        logger.info(`Feedback submitted for meeting ${meetingId} by student ${req.user.id}`);

        // Email is external, non-blocking
        const alumniUser = await User.findById(meeting.alumni).select("email name").lean();
        if (alumniUser) {
            emailService.sendFeedbackReceivedEmail(alumniUser.email, alumniUser.name, rating, review);
        }

        res.status(201).json({ success: true, message: "Feedback submitted", data: feedback });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// @desc    Get feedback for alumni
// @route   GET /api/v1/feedback/alumni/:alumniId
// @access  Private
const getAlumniFeedback = asyncHandler(async (req, res) => {
    const feedback = await Feedback.find({ alumni: req.params.alumniId })
        .populate("student", "name profileImage branch")
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({ success: true, message: "Feedback fetched", data: feedback });
});

module.exports = {
    submitFeedback,
    getAlumniFeedback
};
