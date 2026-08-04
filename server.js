const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const hpp = require("hpp");
const mongoose = require("mongoose");
const packageJson = require("./package.json");
require("dotenv").config();

const connectDB = require("./config/db");

// Middleware Imports
const requestId = require("./middleware/requestId");
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const alumniRoutes = require("./routes/alumniRoutes");
const adminRoutes = require("./routes/adminRoutes");
const requestRoutes = require("./routes/requestRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Swagger UI
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();
connectDB();

// Trust reverse proxy (for Docker/Nginx/Heroku rate limiting)
app.set("trust proxy", 1);

// 1. Request ID Generation
app.use(requestId);

// 2. Logging
// Skip logging for health checks to prevent log bloat
const skipHealth = (req) => req.originalUrl === "/health";
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", { skip: skipHealth }));

// 3. Security Headers
app.use(helmet());
app.disable("x-powered-by");

// 4. CORS
const corsOptions = {
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : "*",
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 5. Body Parsers & Security
app.use(express.json());
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Gzip compression

// Swagger Endpoints (Must be mounted before rate limiting if we want heavy dev usage, but we'll mount after compression)
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Platform API Docs" }));

// 6. Global Rate Limiter
app.use(generalLimiter);

// 7. Mount Routes
// Apply stricter rate limit exclusively to auth routes
app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/student", studentRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health checks
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 */
// Health Check Route (Docker / Kubernetes ready)
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
  res.status(200).json({
    status: "ok",
    database: dbStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: packageJson.version || "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Cloud Alumni Mentorship Backend is Running 🚀",
  });
});

// 8. 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});