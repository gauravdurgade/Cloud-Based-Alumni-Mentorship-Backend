const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
const Meeting = require("../models/Meeting");
const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");

// Helpers
const getStartOfDay = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const getEndOfDay = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };
const getStartOfWeek = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; };
const getStartOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; };

const calculateProfileCompletion = (user) => {
    if (!user) return 0;
    let score = 0;
    if (user.bio) score += 20;
    if (user.skills && user.skills.length > 0) score += 30;
    if (user.profileImage) score += 10;
    if (user.linkedin || user.github || user.portfolio) score += 10;
    if (user.branch || user.company) score += 15;
    if (user.year || user.designation) score += 15;
    return score;
};

const getRecentNotifications = async (userId) => {
    try {
        return await Notification.find({ recipient: userId, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(5);
    } catch (e) { return []; }
};

const getStudentMetrics = async (studentId) => {
    const data = {
        summary: {},
        analytics: {},
        recentActivity: [],
        recommendations: []
    };

    // 1. Profile Completion
    try {
        const user = await User.findById(studentId);
        data.summary.profileCompletion = calculateProfileCompletion(user);
    } catch (e) {}

    // 2. Request Stats
    try {
        const requests = await MentorshipRequest.aggregate([
            { $match: { student: studentId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        data.analytics.requests = requests.reduce((acc, curr) => {
            acc[curr._id.toLowerCase()] = curr.count;
            return acc;
        }, { pending: 0, accepted: 0, rejected: 0, completed: 0, cancelled: 0 });
    } catch (e) {}

    // 3. Meeting Stats & Upcoming
    try {
        const now = new Date();
        const meetings = await Meeting.find({ student: studentId });
        data.analytics.meetings = {
            total: meetings.length,
            completed: meetings.filter(m => m.status === 'Completed').length,
            scheduled: meetings.filter(m => m.status === 'Scheduled').length,
            cancelled: meetings.filter(m => m.status === 'Cancelled').length
        };
        
        const upcoming = await Meeting.findOne({
            student: studentId,
            status: "Scheduled",
            scheduledDate: { $gte: now }
        }).sort({ scheduledDate: 1 }).populate("alumni", "name profileImage designation company");
        
        data.summary.nextUpcomingMeeting = upcoming || null;
    } catch (e) {}

    // 4. Notifications
    try {
        const unreadCount = await Notification.countDocuments({ recipient: studentId, isRead: false, isDeleted: false });
        data.summary.unreadNotifications = unreadCount;
        data.recentActivity = await getRecentNotifications(studentId);
    } catch (e) {}

    // 5. Recommended Alumni (Prioritize Available, High Rating, Matched Skills/Domains)
    try {
        const student = await User.findById(studentId);
        let matchQuery = { role: "alumni", isAvailable: true };
        if (student && student.skills && student.skills.length > 0) {
            matchQuery.skills = { $in: student.skills.map(s => new RegExp(s, 'i')) };
        }
        
        let recommended = await User.find(matchQuery)
            .sort({ averageRating: -1, completedMentorships: -1 })
            .limit(3)
            .select("name profileImage company designation averageRating skills mentorshipDomains");
        
        // Fallback if strict match yields nothing
        if (recommended.length === 0) {
            recommended = await User.find({ role: "alumni", isAvailable: true })
                .sort({ averageRating: -1, experience: -1 })
                .limit(3)
                .select("name profileImage company designation averageRating skills mentorshipDomains");
        }
        data.recommendations = recommended;
    } catch (e) {}

    return data;
};

const getAlumniMetrics = async (alumniId) => {
    const data = {
        summary: {},
        analytics: {},
        recentActivity: [],
        recommendations: [] // Blank for alumni unless needed
    };

    // 1. Stats and Availability
    try {
        const user = await User.findById(alumniId);
        data.summary.averageRating = user.averageRating;
        data.summary.completedMentorships = user.completedMentorships;
        data.summary.recommendationPercentage = user.recommendationPercentage;
        data.summary.availabilityStatus = user.availabilityStatus;
        data.summary.isAvailable = user.isAvailable;
    } catch (e) {}

    // 2. Students Mentored & Request Stats
    try {
        const requests = await MentorshipRequest.find({ alumni: alumniId });
        const uniqueStudents = new Set(requests.map(r => r.student.toString()));
        data.analytics.uniqueStudentsMentored = uniqueStudents.size;
        
        data.analytics.requests = {
            total: requests.length,
            pending: requests.filter(r => r.status === 'Pending').length,
            accepted: requests.filter(r => r.status === 'Accepted').length
        };
    } catch (e) {}

    // 3. Meeting Stats & Upcoming
    try {
        const now = new Date();
        const startOfDay = getStartOfDay();
        const endOfDay = getEndOfDay();
        const startOfWeek = getStartOfWeek();
        const startOfMonth = getStartOfMonth();

        const meetings = await Meeting.find({ alumni: alumniId });
        
        data.analytics.meetings = {
            total: meetings.length,
            completed: meetings.filter(m => m.status === 'Completed').length,
            scheduled: meetings.filter(m => m.status === 'Scheduled').length,
            today: meetings.filter(m => m.scheduledDate >= startOfDay && m.scheduledDate <= endOfDay).length,
            thisWeek: meetings.filter(m => m.scheduledDate >= startOfWeek).length,
            thisMonth: meetings.filter(m => m.scheduledDate >= startOfMonth).length,
        };

        const upcoming = await Meeting.findOne({
            alumni: alumniId,
            status: "Scheduled",
            scheduledDate: { $gte: now }
        }).sort({ scheduledDate: 1 }).populate("student", "name profileImage branch");
        
        data.summary.nextUpcomingMeeting = upcoming || null;
    } catch (e) {}

    // 4. Notifications
    try {
        const unreadCount = await Notification.countDocuments({ recipient: alumniId, isRead: false, isDeleted: false });
        data.summary.unreadNotifications = unreadCount;
        data.recentActivity = await getRecentNotifications(alumniId);
    } catch (e) {}

    return data;
};

const getAdminMetrics = async () => {
    const data = {
        summary: {},
        analytics: {},
        recentActivity: [],
        recommendations: []
    };

    // 1. Platform Users
    try {
        const users = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        const total = await User.countDocuments();
        data.analytics.users = users.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { total });
        
        const startOfMonth = getStartOfMonth();
        data.analytics.users.monthlyRegistrations = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
    } catch (e) {}

    // 2. Requests & Meetings
    try {
        const startOfMonth = getStartOfMonth();
        data.analytics.requests = {
            total: await MentorshipRequest.countDocuments(),
            thisMonth: await MentorshipRequest.countDocuments({ createdAt: { $gte: startOfMonth } })
        };
        data.analytics.meetings = {
            total: await Meeting.countDocuments(),
            thisMonth: await Meeting.countDocuments({ createdAt: { $gte: startOfMonth } })
        };
    } catch (e) {}

    // 3. Feedback Stats
    try {
        const startOfMonth = getStartOfMonth();
        const feedback = await Feedback.aggregate([
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);
        data.analytics.feedback = {
            total: feedback.length > 0 ? feedback[0].count : 0,
            platformAverage: feedback.length > 0 ? parseFloat(feedback[0].avgRating.toFixed(1)) : 0,
            thisMonth: await Feedback.countDocuments({ createdAt: { $gte: startOfMonth } })
        };
    } catch (e) {}

    // 4. Recent Registrations & Notifications (Activity)
    try {
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("name role createdAt");
        data.summary.recentRegistrations = recentUsers;
        
        // For admin activity, maybe show system level notifications if they exist, or just recent global activity.
        data.recentActivity = await Notification.find({ type: "SYSTEM", isDeleted: false }).sort({ createdAt: -1 }).limit(5);
    } catch (e) {}

    return data;
};

module.exports = {
    getStudentMetrics,
    getAlumniMetrics,
    getAdminMetrics
};
