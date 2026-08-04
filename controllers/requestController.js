const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

// Helper for safe population
const populateOptions = "name email branch profileImage";

// @desc    Create a mentorship request
// @route   POST /api/requests
// @access  Private (Student only)
const createRequest = async (req, res) => {
    try {
        const { alumniId, message } = req.body;
        const studentId = req.user.id;

        if (!alumniId || !message) {
            return res.status(400).json({ success: false, message: "Alumni ID and message are required", data: null });
        }

        // Check if alumni exists and is actually an alumni
        const alumni = await User.findById(alumniId);
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(404).json({ success: false, message: "Alumni not found", data: null });
        }

        // Prevent duplicate pending requests
        const existingPending = await MentorshipRequest.findOne({
            student: studentId,
            alumni: alumniId,
            status: "Pending"
        });

        if (existingPending) {
            return res.status(400).json({ success: false, message: "You already have a pending request with this alumni", data: null });
        }

        const request = await MentorshipRequest.create({
            student: studentId,
            alumni: alumniId,
            message
        });

        // Trigger Notification to Alumni
        await createNotification({
            recipient: alumniId,
            sender: studentId,
            type: "MENTORSHIP_REQUEST_CREATED",
            title: "New Mentorship Request",
            message: "You have received a new mentorship request.",
            referenceId: request._id,
            referenceModel: "MentorshipRequest"
        });

        res.status(201).json({ success: true, message: "Mentorship request sent", data: request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get my requests (Student)
// @route   GET /api/requests/my
// @access  Private (Student only)
const getMyRequests = async (req, res) => {
    try {
        const requests = await MentorshipRequest.find({ student: req.user.id })
            .populate("alumni", populateOptions)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: "Requests fetched", data: requests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get received requests (Alumni)
// @route   GET /api/requests/received
// @access  Private (Alumni only)
const getReceivedRequests = async (req, res) => {
    try {
        const requests = await MentorshipRequest.find({ alumni: req.user.id })
            .populate("student", populateOptions)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: "Requests fetched", data: requests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Accept request
// @route   PATCH /api/requests/:id/accept
// @access  Private (Alumni only)
const acceptRequest = async (req, res) => {
    try {
        const { scheduledDate, meetingLink, meetingPlatform } = req.body;
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found", data: null });
        }

        if (request.alumni.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized", data: null });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ success: false, message: "Can only accept pending requests", data: null });
        }

        request.status = "Accepted";
        request.acceptedDate = Date.now();
        if (scheduledDate) request.scheduledDate = scheduledDate;
        if (meetingLink) request.meetingLink = meetingLink;
        if (meetingPlatform) request.meetingPlatform = meetingPlatform;

        await request.save();

        // Trigger Notification to Student
        await createNotification({
            recipient: request.student,
            sender: req.user.id,
            type: "MENTORSHIP_REQUEST_ACCEPTED",
            title: "Mentorship Request Accepted",
            message: "Your mentorship request has been accepted.",
            referenceId: request._id,
            referenceModel: "MentorshipRequest"
        });

        res.status(200).json({ success: true, message: "Request accepted", data: request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Reject request
// @route   PATCH /api/requests/:id/reject
// @access  Private (Alumni only)
const rejectRequest = async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found", data: null });
        }

        if (request.alumni.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized", data: null });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ success: false, message: "Can only reject pending requests", data: null });
        }

        request.status = "Rejected";
        await request.save();

        // Trigger Notification to Student
        await createNotification({
            recipient: request.student,
            sender: req.user.id,
            type: "MENTORSHIP_REQUEST_REJECTED",
            title: "Mentorship Request Rejected",
            message: "Your mentorship request has been rejected.",
            referenceId: request._id,
            referenceModel: "MentorshipRequest"
        });

        res.status(200).json({ success: true, message: "Request rejected", data: request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Complete request
// @route   PATCH /api/requests/:id/complete
// @access  Private (Alumni only)
const completeRequest = async (req, res) => {
    try {
        const { completionNotes } = req.body;
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found", data: null });
        }

        if (request.alumni.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized", data: null });
        }

        if (request.status !== "Accepted") {
            return res.status(400).json({ success: false, message: "Can only complete accepted requests", data: null });
        }

        request.status = "Completed";
        if (completionNotes) request.completionNotes = completionNotes;
        
        await request.save();

        res.status(200).json({ success: true, message: "Request completed", data: request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    completeRequest
};
