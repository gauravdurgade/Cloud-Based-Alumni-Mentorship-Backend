const Meeting = require("../models/Meeting");
const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const { sendMeetingScheduledEmail } = require("../services/emailService");

const safeUserSelect = "name email profileImage branch company designation";

// @desc    Create a meeting
// @route   POST /api/meetings
// @access  Private (Alumni only)
const createMeeting = async (req, res) => {
    try {
        const { requestId, title, scheduledDate, durationMinutes, meetingPlatform, meetingLink } = req.body;

        if (!requestId || !title || !scheduledDate) {
            return res.status(400).json({ success: false, message: "Missing required fields", data: null });
        }

        const request = await MentorshipRequest.findById(requestId);
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
        });

        if (existingMeeting) {
            return res.status(400).json({ success: false, message: "An active meeting is already scheduled for this request", data: null });
        }

        const meeting = await Meeting.create({
            request: requestId,
            student: request.student,
            alumni: req.user.id,
            title,
            scheduledDate,
            durationMinutes: durationMinutes || 30,
            meetingPlatform,
            meetingLink
        });

        // Trigger Notification to Student
        await createNotification({
            recipient: request.student,
            sender: req.user.id,
            type: "MEETING_SCHEDULED",
            title: "New Meeting Scheduled",
            message: `Your mentor has scheduled a meeting: ${title}`,
            referenceId: meeting._id,
            referenceModel: "Meeting"
        });

        // Trigger Email Notification
        const student = await User.findById(request.student).select("email name");
        if (student) {
            sendMeetingScheduledEmail(student.email, student.name, {
                title,
                date: scheduledDate,
                link: meetingLink || "Link to be provided"
            });
        }

        res.status(201).json({ success: true, message: "Meeting created", data: meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get Alumni meetings
// @route   GET /api/meetings/alumni
// @access  Private (Alumni only)
const getAlumniMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({ alumni: req.user.id })
            .populate("student", safeUserSelect)
            .sort({ scheduledDate: 1 });

        res.status(200).json({ success: true, message: "Meetings fetched", data: meetings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get Student meetings
// @route   GET /api/meetings/student
// @access  Private (Student only)
const getStudentMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({ student: req.user.id })
            .populate("alumni", safeUserSelect)
            .sort({ scheduledDate: 1 });

        res.status(200).json({ success: true, message: "Meetings fetched", data: meetings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Update meeting status
// @route   PATCH /api/meetings/:id/status
// @access  Private (Alumni only)
const updateMeetingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status", data: null });
        }

        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found", data: null });
        }

        if (meeting.alumni.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized", data: null });
        }

        meeting.status = status;
        await meeting.save();

        if (status === "Completed") {
            await createNotification({
                recipient: meeting.student,
                sender: req.user.id,
                type: "MEETING_COMPLETED",
                title: "Meeting Completed",
                message: "A meeting has been marked as completed. Please leave feedback.",
                referenceId: meeting._id,
                referenceModel: "Meeting"
            });
        } else if (status === "Cancelled") {
            await createNotification({
                recipient: meeting.student,
                sender: req.user.id,
                type: "MEETING_CANCELLED",
                title: "Meeting Cancelled",
                message: "A scheduled meeting was cancelled by your mentor.",
                referenceId: meeting._id,
                referenceModel: "Meeting"
            });
        }

        res.status(200).json({ success: true, message: "Meeting status updated", data: meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    createMeeting,
    getAlumniMeetings,
    getStudentMeetings,
    updateMeetingStatus
};
