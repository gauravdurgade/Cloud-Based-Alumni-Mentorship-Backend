const mongoose = require("mongoose");
const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const asyncHandler = require("../middleware/asyncHandler");
const logger = require("../config/logger");
const { ROLES } = require("../utils/constants");

// Helper for safe population
const populateOptions = "name email branch profileImage company designation";

// @desc    Create a mentorship request
// @route   POST /api/v1/requests
// @access  Private (Student only)
const createRequest = asyncHandler(async (req, res) => {
    const { alumniId, message } = req.body;
    const studentId = req.user.id;

    const alumni = await User.findById(alumniId).lean();
    if (!alumni || alumni.role !== ROLES.ALUMNI) {
        return res.status(404).json({ success: false, message: "Alumni not found", data: null });
    }

    const existingPending = await MentorshipRequest.findOne({
        student: studentId,
        alumni: alumniId,
        status: "Pending"
    }).lean();

    if (existingPending) {
        return res.status(400).json({ success: false, message: "You already have a pending request with this alumni", data: null });
    }

    // Start Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [request] = await MentorshipRequest.create([{
            student: studentId,
            alumni: alumniId,
            message
        }], { session });

        await createNotification({
            recipient: alumniId,
            sender: studentId,
            type: "MENTORSHIP_REQUEST_CREATED",
            title: "New Mentorship Request",
            message: "You have received a new mentorship request.",
            referenceId: request._id,
            referenceModel: "MentorshipRequest"
        }, session);

        await session.commitTransaction();
        session.endSession();

        logger.info(`Mentorship request created by ${studentId} for ${alumniId}`);
        res.status(201).json({ success: true, message: "Mentorship request sent", data: request });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// @desc    Get my requests (Student)
// @route   GET /api/v1/requests/my
// @access  Private (Student only)
const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await MentorshipRequest.find({ student: req.user.id })
        .populate("alumni", populateOptions)
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({ success: true, message: "Requests fetched", data: requests });
});

// @desc    Get received requests (Alumni)
// @route   GET /api/v1/requests/received
// @access  Private (Alumni only)
const getReceivedRequests = asyncHandler(async (req, res) => {
    const requests = await MentorshipRequest.find({ alumni: req.user.id })
        .populate("student", populateOptions)
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({ success: true, message: "Requests fetched", data: requests });
});

// @desc    Accept request
// @route   PATCH /api/v1/requests/:id/accept
// @access  Private (Alumni only)
const acceptRequest = asyncHandler(async (req, res) => {
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        request.status = "Accepted";
        request.acceptedDate = Date.now();
        if (scheduledDate) request.scheduledDate = scheduledDate;
        if (meetingLink) request.meetingLink = meetingLink;
        if (meetingPlatform) request.meetingPlatform = meetingPlatform;

        await request.save({ session });

        await createNotification({
            recipient: request.student,
            sender: req.user.id,
            type: "MENTORSHIP_REQUEST_ACCEPTED",
            title: "Mentorship Request Accepted",
            message: "Your mentorship request has been accepted.",
            referenceId: request._id,
            referenceModel: "MentorshipRequest"
        }, session);

        await session.commitTransaction();
        session.endSession();

        logger.info(`Mentorship request ${request._id} accepted by ${req.user.id}`);
        res.status(200).json({ success: true, message: "Request accepted", data: request });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// @desc    Reject request
// @route   PATCH /api/v1/requests/:id/reject
// @access  Private (Alumni only)
const rejectRequest = asyncHandler(async (req, res) => {
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        request.status = "Rejected";
        await request.save({ session });

        await createNotification({
            recipient: request.student,
            sender: req.user.id,
            type: "MENTORSHIP_REQUEST_REJECTED",
            title: "Mentorship Request Rejected",
            message: "Your mentorship request has been rejected.",
            referenceId: request._id,
            referenceModel: "MentorshipRequest"
        }, session);

        await session.commitTransaction();
        session.endSession();

        logger.info(`Mentorship request ${request._id} rejected by ${req.user.id}`);
        res.status(200).json({ success: true, message: "Request rejected", data: request });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// @desc    Complete request
// @route   PATCH /api/v1/requests/:id/complete
// @access  Private (Alumni only)
const completeRequest = asyncHandler(async (req, res) => {
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

    logger.info(`Mentorship request ${request._id} completed by ${req.user.id}`);
    res.status(200).json({ success: true, message: "Request completed", data: request });
});

module.exports = {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    completeRequest
};
