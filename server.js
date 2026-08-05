const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const hpp = require("hpp");
const mongoose = require("mongoose");
const packageJson = require("./package.json");

// Environment & Logger Validation
const env = require("./config/env");
const logger = require("./config/logger");

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

// 2. Logging via Winston
const skipHealth = (req) => req.originalUrl === "/health";
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev", { 
    skip: skipHealth,
    stream: { write: message => logger.http(message.trim()) }
}));

// 3. Security Headers
app.use(helmet());
app.disable("x-powered-by");

// 4. CORS
const corsOptions = {
    origin: env.CLIENT_URL ? env.CLIENT_URL.split(",") : "*",
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 5. Body Parsers & Security
app.use(express.json());
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Gzip compression

// Swagger Endpoints
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Platform API Docs" }));

// 6. Global Rate Limiter
app.use(generalLimiter);

// 7. Mount API Routes
const mountRoutes = (prefix) => {
    // Apply stricter rate limit exclusively to auth routes
    app.use(`${prefix}/auth`, authLimiter, authRoutes);
    
    app.use(`${prefix}/student`, studentRoutes);
    app.use(`${prefix}/alumni`, alumniRoutes);
    app.use(`${prefix}/admin`, adminRoutes);
    app.use(`${prefix}/requests`, requestRoutes);
    app.use(`${prefix}/meetings`, meetingRoutes);
    app.use(`${prefix}/feedback`, feedbackRoutes);
    app.use(`${prefix}/notifications`, notificationRoutes);
    app.use(`${prefix}/dashboard`, dashboardRoutes);
};

// Mount new v1 version
mountRoutes("/api/v1");

// Mount legacy version for strict backward compatibility
mountRoutes("/api");

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
    environment: env.NODE_ENV,
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
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown Handler
const shutdown = () => {
  logger.info("SIGTERM/SIGINT signal received: closing HTTP server");
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await mongoose.connection.close(false);
      logger.info("MongoDB connection closed gracefully");
      process.exit(0);
    } catch (err) {
      logger.error(`Error during MongoDB graceful shutdown: ${err.message}`);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);