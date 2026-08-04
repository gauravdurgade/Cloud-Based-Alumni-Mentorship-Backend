# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies if needed for builds)
RUN npm ci

# Copy application code
COPY . .

# Stage 2: Runner (Production optimized)
FROM node:20-alpine

# Set environment
ENV NODE_ENV=production

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy necessary files from builder
COPY --from=builder /usr/src/app/config ./config
COPY --from=builder /usr/src/app/controllers ./controllers
COPY --from=builder /usr/src/app/middleware ./middleware
COPY --from=builder /usr/src/app/models ./models
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/services ./services
COPY --from=builder /usr/src/app/server.js ./server.js

# Change ownership to node user for security
RUN chown -R node:node /usr/src/app
USER node

# Expose port
EXPOSE 5000

# Docker Healthcheck targeting the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
