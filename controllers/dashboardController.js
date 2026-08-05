const { getStudentMetrics, getAlumniMetrics, getAdminMetrics } = require("../services/dashboardService");
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Get student dashboard
// @route   GET /api/v1/dashboard/student
// @access  Private (Student only)
const getStudentDashboard = asyncHandler(async (req, res) => {
    const metrics = await getStudentMetrics(req.user.id);
    res.status(200).json({ success: true, message: "Dashboard metrics fetched", data: metrics });
});

// @desc    Get alumni dashboard
// @route   GET /api/v1/dashboard/alumni
// @access  Private (Alumni only)
const getAlumniDashboard = asyncHandler(async (req, res) => {
    const metrics = await getAlumniMetrics(req.user.id);
    res.status(200).json({ success: true, message: "Dashboard metrics fetched", data: metrics });
});

// @desc    Get admin dashboard
// @route   GET /api/v1/dashboard/admin
// @access  Private (Admin only)
const getAdminDashboard = asyncHandler(async (req, res) => {
    const metrics = await getAdminMetrics();
    res.status(200).json({ success: true, message: "Dashboard metrics fetched", data: metrics });
});

module.exports = {
    getStudentDashboard,
    getAlumniDashboard,
    getAdminDashboard
};
