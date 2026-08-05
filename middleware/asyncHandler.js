/**
 * Wrapper for async controller functions to eliminate repetitive try/catch blocks
 * and pass errors directly to the global error handler middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
