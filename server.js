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

console.log(">>>>>>>> THIS IS MY SERVER <<<<<<<<");
connectDB();

// Trust reverse proxy
app.set("trust proxy", 1);

// Request ID
app.use(requestId);

// Logger
const skipHealth = (req) => req.originalUrl === "/health";

app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
        skip: skipHealth,
        stream: {
            write: (message) => logger.http(message.trim()),
        },
    })
);

// Security
app.use(helmet());
app.disable("x-powered-by");

// CORS
const corsOptions = {
    origin: env.CLIENT_URL ? env.CLIENT_URL.split(",") : "*",
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Parsers
app.use(express.json());
app.use(hpp());
app.use(compression());

// Swagger
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "Platform API Docs",
    })
);

// Global Rate Limiter
app.use(generalLimiter);

// Routes
const mountRoutes = (prefix) => {
    app.use(`${prefix}/auth`, authLimiter, authRoutes);

    app.use(`${prefix}/student`, studentRoutes);
    app.use(`${prefix}/alumni`, alumniRoutes);
    app.use(`${prefix}/admin`, adminRoutes);

    app.use(
        `${prefix}/requests`,
        (req, res, next) => {
            console.log("🔥 REQUEST ROUTE HIT:", req.method, req.originalUrl);
            next();
        },
        requestRoutes
    );

    app.use(`${prefix}/meetings`, meetingRoutes);
    app.use(`${prefix}/feedback`, feedbackRoutes);
    app.use(`${prefix}/notifications`, notificationRoutes);
    app.use(`${prefix}/dashboard`, dashboardRoutes);
};

mountRoutes("/api/v1");
mountRoutes("/api");

// Health
app.get("/health", (req, res) => {
    const dbStatus =
        mongoose.connection.readyState === 1
            ? "connected"
            : "disconnected";

    res.status(200).json({
        status: "ok",
        database: dbStatus,
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: packageJson.version || "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// Root
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Cloud Alumni Mentorship Backend is Running 🚀",
    });
});

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = env.PORT;

const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
    logger.info("SIGTERM/SIGINT signal received: closing HTTP server");

    server.close(async () => {
        logger.info("HTTP server closed");

        try {
            await mongoose.connection.close(false);
            logger.info("MongoDB connection closed gracefully");
            process.exit(0);
        } catch (err) {
            logger.error(
                `Error during MongoDB graceful shutdown: ${err.message}`
            );
            process.exit(1);
        }
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);