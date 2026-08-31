import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/responseFormatter.js';

/**
 * Centralized Global Exception Handling Middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'ERR_INVALID_ID');
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {}).join(', ');
    error = new AppError(`Duplicate value entered for field(s): ${keys}`, 409, 'ERR_DUPLICATE_KEY');
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(el => el.message);
    error = new AppError('Validation failure', 400, 'ERR_VALIDATION', details);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Authentication failed.', 401, 'ERR_INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401, 'ERR_EXPIRED_TOKEN');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'ERR_INTERNAL';
  const message = error.message || 'An unexpected error occurred';
  const details = error.details || null;

  if (statusCode >= 500) {
    console.error(`💥 [Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return sendError(res, message, statusCode, errorCode, details);
};
