/**
 * Simple higher-order function that catches async errors in Express route handlers
 * and forwards them to the central error handling middleware.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express route handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
