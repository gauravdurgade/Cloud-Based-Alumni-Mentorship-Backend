# Cloud Alumni Mentorship Platform - Backend

This is the Node.js / Express / MongoDB backend for the Cloud Alumni Mentorship Platform. It serves as a secure, scalable REST API supporting Student and Alumni workflows, Mentorship Requests, Meeting Scheduling, Analytics Dashboards, and Admin Governance.

## Features
- **Role-Based Access Control (RBAC):** Native JWT-based separation for Students, Alumni, and Admins.
- **Production Hardened:** Fortified via Helmet (Security Headers), Express Rate Limiters, HPP, and Gzip compression.
- **Cloudinary File Processing:** Natively streams profile images (auto-resized and optimized) and PDF resumes directly to Cloudinary via memory buffers.
- **Centralized Email Engine:** Resilient, async HTML email dispatch pipeline via Nodemailer supporting auto-generated alerts for registrations, meetings, approvals, and feedback.
- **Mentorship Lifecycle:** Request, Accept, Reject, Complete, and Cancel mentorship pairings.
- **Session Booking:** Schedule and track independent meetings.
- **Feedback & Rating Engine:** Native scoring calculation and aggregation logic.
- **Notification Backbone:** Robust, unified internal messaging for system alerts.
- **Analytics Dashboards:** Isolated heavy aggregation engines for multi-tiered metrics.
- **Admin Governance Layer:** Deep user search, filtering, platform suspension, soft-deletion, and reporting.

## Folder Structure
```
backend/
├── config/           # Database and core configuration (db.js)
├── controllers/      # Route handlers and HTTP logic
├── middleware/       # Custom Express middleware (authMiddleware.js)
├── models/           # Mongoose schemas (User, MentorshipRequest, Meeting, etc.)
├── routes/           # API Endpoints
├── services/         # Isolated heavy business logic (Notification, Dashboard)
├── server.js         # Core entrypoint
└── docker-compose.yml# Container orchestration
```

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or Local)
- Docker (optional, for containerization)

### Local Development Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in your secrets.
   ```bash
   cp .env.example .env
   ```

3. **Start the Server**
   ```bash
   npm run dev
   ```
   *The server will start on port 5000 with nodemon enabled.*

## Docker Usage

The application is fully containerized using a multi-stage Alpine build for optimized production deployment and hot-reloading for local development.

### Running with Docker Compose
```bash
# Build and run in detached mode
docker compose up --build -d

# View logs
docker compose logs -f backend

# Stop containers
docker compose down
```

## API Documentation
*(To be generated: Connect to Postman / Swagger UI)*

## Health Check
You can verify the runtime, database connection, and current environment context via the Docker-ready health endpoint:
```bash
curl http://https://cloud-based-alumni-mentorship-backend.onrender.com/health
```

## API Documentation

This project features a fully interactive OpenAPI/Swagger playground.
Once the server is running, you can explore, authenticate, and test all API endpoints natively in your browser:

- **Swagger UI:** `https://cloud-based-alumni-mentorship-backend.onrender.com/api/docs`
- **Raw JSON Spec:** `https://cloud-based-alumni-mentorship-backend.onrender.com/api/docs.json`

You can authenticate directly within the Swagger UI by clicking the "Authorize" button and pasting a valid JWT Bearer token obtained from the `/api/auth/login` endpoint.

## Deployment
For production deployment, ensure the `.env` configuration sets `NODE_ENV=production`. The provided multi-stage `Dockerfile` will automatically strip all `devDependencies` and enforce security standards natively.
