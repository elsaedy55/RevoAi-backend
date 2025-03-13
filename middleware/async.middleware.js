/**
 * Async middleware wrapper to catch errors in async operations
 * @module middleware/async
 */

/**
 * Wraps an async middleware to properly catch and forward errors
 * @param {Function} fn - Async middleware function to wrap
 * @returns {Function} Express middleware
 */
export const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
