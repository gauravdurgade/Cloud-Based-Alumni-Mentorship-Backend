const mongoose = require("mongoose");
const Meeting = require("../models/Meeting");
const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const { sendMeetingScheduledEmail } = require("../services/emailService");
const asyncHandler = require("../middleware/asyncHandler");
const logger = require("../config/logger");

const safeUserSelect = "name email profileImage branch company designation";

// @desc    Create a meeting
// @route   POST /api/v1/meetings
// @access  Private (Alumni only)
const createMeeting = asyncHandler(async (req, res) => {
    const { requestId, title, scheduledDate, durationMinutes, meetingPlatform, meetingLink } = req.body;

    const request = await MentorshipRequest.findById(requestId).lean();
    if (!request) {
        return res.status(404).json({ success: false, message: "Mentorship request not found", data: null });
    }

    if (request.alumni.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized to create meeting for this request", data: null });
    }

    // Prevent duplicate active meetings for the same request
    const existingMeeting = await Meeting.findOne({
        request: requestId,
        status: "Scheduled"
    }).lean();

    if (existingMeeting) {
        return res.status(400).json({ success: false, message: "An active meeting is already scheduled for this request", data: null });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [meeting] = await Meeting.create([{
            request: requestId,
            student: request.student,
            alumni: req.user.id,
            title,
            scheduledDate,
            durationMinutes: durationMinutes || 30,
            meetingPlatform,
            meetingLink
        }], { session });

        await createNotification({
            recipient: request.student,
            sender: req.user.id,
            type: "MEETING_SCHEDULED",
            title: "New Meeting Scheduled",
            message: `Your mentor has scheduled a meeting: ${title}`,
            referenceId: meeting._id,
            referenceModel: "Meeting"
        }, session);

        await session.commitTransaction();
        session.endSession();

        logger.info(`Meeting ${meeting._id} created by ${req.user.id}`);

        // Trigger Email Notification (non-blocking)
        const student = await User.findById(request.student).select("email name").lean();
        if (student) {
            sendMeetingScheduledEmail(student.email, student.name, {
                title,
                date: scheduledDate,
                link: meetingLink || "Link to be provided"
            });
        }

        res.status(201).json({ success: true, message: "Meeting created", data: meeting });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// @desc    Get Alumni meetings
// @route   GET /api/v1/meetings/alumni
// @access  Private (Alumni only)
const getAlumniMeetings = asyncHandler(async (req, res) => {
    const meetings = await Meeting.find({ alumni: req.user.id })
        .populate("student", safeUserSelect)
        .sort({ scheduledDate: 1 })
        .lean();

    res.status(200).json({ success: true, message: "Meetings fetched", data: meetings });
});

// @desc    Get Student meetings
// @route   GET /api/v1/meetings/student
// @access  Private (Student only)
const getStudentMeetings = asyncHandler(async (req, res) => {
    const meetings = await Meeting.find({ student: req.user.id })
        .populate("alumni", safeUserSelect)
        .sort({ scheduledDate: 1 })
        .lean();

    res.status(200).json({ success: true, message: "Meetings fetched", data: meetings });
});

// @desc    Update meeting status
// @route   PATCH /api/v1/meetings/:id/status
// @access  Private (Alumni only)
const updateMeetingStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
        return res.status(404).json({ success: false, message: "Meeting not found", data: null });
    }

    if (meeting.alumni.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized", data: null });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        meeting.status = status;
        await meeting.save({ session });

        if (status === "Completed") {
            await createNotification({
                recipient: meeting.student,
                sender: req.user.id,
                type: "MEETING_COMPLETED",
                title: "Meeting Completed",
                message: "A meeting has been marked as completed. Please leave feedback.",
                referenceId: meeting._id,
                referenceModel: "Meeting"
            }, session);
        } else if (status === "Cancelled") {
            await createNotification({
                recipient: meeting.student,
                sender: req.user.id,
                type: "MEETING_CANCELLED",
                title: "Meeting Cancelled",
                message: "A scheduled meeting was cancelled by your mentor.",
                referenceId: meeting._id,
                referenceModel: "Meeting"
            }, session);
        }

        await session.commitTransaction();
        session.endSession();

        logger.info(`Meeting ${meeting._id} status updated to ${status} by ${req.user.id}`);
        res.status(200).json({ success: true, message: "Meeting status updated", data: meeting });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

module.exports = {
    createMeeting,
    getAlumniMeetings,
    getStudentMeetings,
    updateMeetingStatus
};
