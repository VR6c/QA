import Role from '../models/Role.js';
import User from '../models/User.js';
import { recordActivity } from '../services/auditLogger.js';
import { cacheService } from '../services/cacheService.js';
import { sendError } from '../utils/responseFormatter.js';

/**
 * Middleware factory enforcing RBAC permission checks with Redis / In-Memory Caching
 * @param {string} permissionCode - Code formatted as module.action (e.g. 'user.view', 'role.edit')
 */
export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401, 'ERR_UNAUTHORIZED');
      }

      // 1. Fast Cache Lookup for User Access Context
      const cacheKey = `user_access:${req.user.id}`;
      let accessContext = cacheService.get(cacheKey);

      if (!accessContext) {
        const currentUser = await User.findById(req.user.id).lean();
        if (!currentUser || currentUser.status !== 'Active' || currentUser.deleted_at) {
          return sendError(res, 'User account is inactive, locked, or deleted', 403, 'ERR_FORBIDDEN');
        }

        let roleDoc = null;
        if (currentUser.role_id) {
          roleDoc = await Role.findById(currentUser.role_id).lean();
        } else {
          roleDoc = await Role.findOne({ name: currentUser.role }).lean();
        }

        if (!roleDoc) {
          return sendError(res, 'Assigned user role does not exist', 403, 'ERR_FORBIDDEN');
        }

        accessContext = {
          user: {
            id: currentUser._id.toString(),
            username: currentUser.username,
            role: currentUser.role,
            status: currentUser.status
          },
          role: {
            name: roleDoc.name,
            status: roleDoc.status,
            permissions: roleDoc.permissions || []
          }
        };

        // Cache user authorization context for 60 seconds
        cacheService.set(cacheKey, accessContext, 60);
      }

      const { user, role } = accessContext;

      // Super Admin bypass
      if (user.role === 'Super Admin') {
        return next();
      }

      if (role.status !== 'Active') {
        recordActivity({
          req,
          module: 'Access Control',
          action: 'ACCESS_DENIED',
          description: `Access denied to ${permissionCode}: Role ${role.name} is inactive`,
          status: 'Denied'
        });

        return sendError(res, 'Your assigned role is currently inactive. Contact Super Admin.', 403, 'ERR_FORBIDDEN');
      }

      const hasPermission = role.permissions.includes(permissionCode) || role.permissions.includes('*');

      if (!hasPermission) {
        recordActivity({
          req,
          module: 'Access Control',
          action: 'ACCESS_DENIED',
          description: `Access denied to ${permissionCode} for user ${user.username}`,
          status: 'Denied'
        });

        return sendError(res, `Insufficient permission: requires '${permissionCode}'`, 403, 'ERR_FORBIDDEN');
      }

      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return sendError(res, 'Server error during authorization check', 500, 'ERR_INTERNAL');
    }
  };
};
