/**
 * Create a custom error with status code
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} - Custom error object
 */
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Async error wrapper to catch async errors in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Common error messages
 */
const ErrorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_TOKEN: 'Invalid or expired token',
  ACCESS_DENIED: 'Access denied',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  
  // Generic errors
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request data'
};

module.exports = {
  createError,
  asyncHandler,
  ErrorMessages
}; 