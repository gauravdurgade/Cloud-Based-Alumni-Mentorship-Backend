const { getStudentMetrics, getAlumniMetrics, getAdminMetrics } = require("../services/dashboardService");

// @desc    Get student dashboard
// @route   GET /api/dashboard/student
// @access  Private (Student only)
const getStudentDashboard = async (req, res) => {
    try {
        const metrics = await getStudentMetrics(req.user.id);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get alumni dashboard
// @route   GET /api/dashboard/alumni
// @access  Private (Alumni only)
const getAlumniDashboard = async (req, res) => {
    try {
        const metrics = await getAlumniMetrics(req.user.id);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

// @desc    Get admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
    try {
        const metrics = await getAdminMetrics();
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", data: null });
    }
};

module.exports = {
    getStudentDashboard,
    getAlumniDashboard,
    getAdminDashboard
};
