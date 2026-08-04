/**
 * Centralized Error Handler
 * Hides stack traces in production, formats mongoose errors.
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
    let errorCode = "INTERNAL_ERROR";

    // Mongoose bad ObjectId
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 404;
        message = "Resource not found (Invalid ID)";
        errorCode = "INVALID_ID";
    }

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(", ");
        errorCode = "VALIDATION_ERROR";
    }

    res.status(statusCode).json({
        success: false,
        message,
        errorCode,
        requestId: req.id,
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
};

module.exports = errorHandler;
