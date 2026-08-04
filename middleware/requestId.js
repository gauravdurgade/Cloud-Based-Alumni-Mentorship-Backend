const crypto = require("crypto");

/**
 * Middleware to generate a unique request ID for tracing
 */
const requestId = (req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
};

module.exports = requestId;
