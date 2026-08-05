const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cloud Alumni Mentorship Platform API",
      version: "1.0.0",
      description: "Interactive API documentation for the Mentorship Platform.",
      contact: {
        name: "API Support",
      },
    },

    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://cloud-based-alumni-mentorship-backend.onrender.com"
            : "http://localhost:5000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message details" },
            errorCode: {
              type: "string",
              example: "INTERNAL_ERROR",
            },
            requestId: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: {
              type: "string",
              enum: ["student", "alumni", "admin"],
            },
            accountStatus: { type: "string" },
            alumniApprovalStatus: { type: "string" },
          },
        },
        MentorshipRequest: {
          type: "object",
          properties: {
            _id: { type: "string" },
            student: { type: "string" },
            alumni: { type: "string" },
            status: {
              type: "string",
              enum: [
                "Pending",
                "Accepted",
                "Rejected",
                "Completed",
                "Cancelled",
              ],
            },
            message: { type: "string" },
          },
        },
        Meeting: {
          type: "object",
          properties: {
            _id: { type: "string" },
            request: { type: "string" },
            student: { type: "string" },
            alumni: { type: "string" },
            scheduledAt: {
              type: "string",
              format: "date-time",
            },
            meetingLink: { type: "string" },
            status: {
              type: "string",
              enum: ["Scheduled", "Completed", "Cancelled"],
            },
          },
        },
        Feedback: {
          type: "object",
          properties: {
            _id: { type: "string" },
            meeting: { type: "string" },
            rating: {
              type: "number",
              example: 5,
            },
            comments: { type: "string" },
            wouldRecommend: {
              type: "boolean",
              example: true,
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            type: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            isRead: {
              type: "boolean",
              example: false,
            },
          },
        },
        Dashboard: {
          type: "object",
          properties: {
            summary: { type: "object" },
            analytics: { type: "object" },
            recentActivity: {
              type: "array",
              items: { type: "object" },
            },
            recommendations: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./routes/*.js", "./server.js"],
};

module.exports = swaggerJsdoc(options);