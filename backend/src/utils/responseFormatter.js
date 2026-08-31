/**
 * Unified API Response Contract Formatter
 */

export const sendSuccess = (res, data = null, meta = null, message = 'Success', statusCode = 200) => {
  const payload = {
    success: true,
    message,
    data
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, message = 'Internal Server Error', statusCode = 500, errorCode = 'ERR_INTERNAL', details = null) => {
  const payload = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details })
    }
  };

  return res.status(statusCode).json(payload);
};

export const responseMiddleware = (req, res, next) => {
  res.success = (data, meta, message, statusCode) => sendSuccess(res, data, meta, message, statusCode);
  res.error = (message, statusCode, errorCode, details) => sendError(res, message, statusCode, errorCode, details);
  next();
};
