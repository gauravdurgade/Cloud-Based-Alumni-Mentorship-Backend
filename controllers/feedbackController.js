const Feedback = require("../models/Feedback");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
const { createNotification } = require("../services/notificationService");
const emailService = require("../services/emailService");

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private (Student only)
const submitFeedback = async (req, res) => {
    try {
        const { meetingId, rating, review, recommended } = req.body;

        if (!meetingId || !rating) {
            return res.status(400).json({ success: false, message: "Meeting ID and rating are required", data: null });
        }

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found", data: null });
        }

        if (meeting.student.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized", data: null });
        }

        if (meeting.status !== "Completed") {
            return res.status(400).json({ success: false, message: "Feedback can only be submitted for completed meetings", data: null });
        }

        // Prevent duplicate feedback
        const existingFeedback = await Feedback.findOne({ meeting: meetingId });
        if (existingFeedback) {
            return res.status(400).json({ success: false, message: "Feedback already submitted for this meeting", data: null });
        }

        const feedback = await Feedback.create({
            meeting: meetingId,
            request: meeting.request,
            student: req.user.id,
            alumni: meeting.alumni,
            rating,
            review,
            recommended: recommended || false
        });

        // Trigger Notification to Alumni
        await createNotification({
            recipient: meeting.alumni,
            sender: req.user.id,
            type: "FEEDBACK_SUBMITTED",
            title: "New Feedback Received",
            message: `You received a ${rating}-star rating for a recent meeting.`,
            referenceId: feedback._id,
            referenceModel: "Feedback"
        });

        // Trigger Email Notification
        const alumniUser = await User.findById(meeting.alumni).select("email name");
        if (alumniUser) {
            emailService.sendFeedbackReceivedEmail(alumniUser.email, alumniUser.name, rating, review);
        }

        // Update Alumni Stats
        const allFeedback = await Feedback.find({ alumni: meeting.alumni });
        const totalRatings = allFeedback.length;
        const averageRating = allFeedback.reduce((acc, item) => acc + item.rating, 0) / totalRatings;
        const recommendedCount = allFeedback.filter(item => item.recommended).length;
        const recommendationPercentage = (recommendedCount / totalRatings) * 100;
        const completedMentorships = totalRatings; // Assuming 1 meeting feedback = 1 completed session

        await User.findByIdAndUpdate(meeting.alumni, {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalRatings,
            recommendationPercentage: Math.round(recommendationPercentage),
            completedMentorships
        });

        res.status(201).json({ success: true, message: "Feedback submitted", data: feedback });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get feedback for alumni
// @route   GET /api/feedback/alumni/:alumniId
// @access  Private
const getAlumniFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ alumni: req.params.alumniId })
            .populate("student", "name profileImage branch")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: "Feedback fetched", data: feedback });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    submitFeedback,
    getAlumniFeedback
};
