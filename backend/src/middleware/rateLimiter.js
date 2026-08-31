import { sendError } from '../utils/responseFormatter.js';

/**
 * Lightweight Sliding-Window Rate Limiter Middleware
 * @param {Object} options Config options { windowMs, maxRequests, message }
 */
export const createRateLimiter = ({ windowMs = 60000, maxRequests = 100, message = 'Too many requests, please try again later.' } = {}) => {
  const requests = new Map();

  // Periodic cleanup of expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requests.entries()) {
      if (now > record.resetTime) {
        requests.delete(ip);
      }
    }
  }, 60000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = requests.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    requests.set(ip, record);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      return sendError(res, message, 429, 'ERR_TOO_MANY_REQUESTS');
    }

    next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,  // 10 auth attempts per minute per IP
  message: 'Too many authentication attempts. Please try again after 1 minute.'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 300,
  message: 'API rate limit exceeded. Please slow down.'
});
