import jwt from 'jsonwebtoken';
import { sendError } from '../utils/responseFormatter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'qa_control_center_jwt_secret_key_2026';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No authorization token provided.', 401, 'ERR_UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired authorization token.', 401, 'ERR_INVALID_TOKEN');
  }
}

export function superAdminMiddleware(req, res, next) {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401, 'ERR_UNAUTHORIZED');
  }

  const allowedRoles = ['Super Admin', 'Admin', 'QA Lead'];
  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 'Permission denied. Super Admin or QA Lead privileges required.', 403, 'ERR_FORBIDDEN');
  }

  next();
}

export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Continue as guest
    }
  }
  next();
}

export const authenticateToken = authMiddleware;
export { JWT_SECRET };
