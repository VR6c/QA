import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Role from '../models/Role.js';
import ActivityLog from '../models/ActivityLog.js';
import { recordActivity } from '../services/auditLogger.js';
import { cacheService } from '../services/cacheService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

/**
 * Get Paginated & Filtered List of Users
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sort = '-createdAt'
    } = req.query;

    const query = { deleted_at: null };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .populate('role_id', 'name code permissions status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return sendSuccess(res, users, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return sendError(res, 'Failed to fetch users', 500, 'ERR_INTERNAL');
  }
};

/**
 * Get User Detail by ID with Activity History
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, deleted_at: null })
      .populate('role_id')
      .lean();

    if (!user) {
      return sendError(res, 'User not found', 404, 'ERR_NOT_FOUND');
    }

    const activityHistory = await ActivityLog.find({ user_id: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    let permissions = [];
    if (user.role_id) {
      permissions = user.role_id.permissions || [];
    } else {
      const roleDoc = await Role.findOne({ name: user.role }).lean();
      if (roleDoc) permissions = roleDoc.permissions || [];
    }

    return sendSuccess(res, {
      user,
      inherited_permissions: permissions,
      activity_history: activityHistory
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return sendError(res, 'Failed to fetch user details', 500, 'ERR_INTERNAL');
  }
};

/**
 * Create New User
 * POST /api/admin/users
 */
export const createUser = async (req, res) => {
  try {
    const { name, username, email, password, role = 'Employee', status = 'Active', role_id } = req.body;

    if (!name || !username || !email || !password) {
      return sendError(res, 'Name, username, email, and password are required', 400, 'ERR_VALIDATION');
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() }).lean();
    if (existingUsername) {
      return sendError(res, 'Username is already taken', 409, 'ERR_CONFLICT');
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existingEmail) {
      return sendError(res, 'Email address is already in use', 409, 'ERR_CONFLICT');
    }

    let assignedRoleId = role_id;
    let assignedRoleName = role;

    if (assignedRoleId) {
      const roleDoc = await Role.findById(assignedRoleId).lean();
      if (roleDoc) assignedRoleName = roleDoc.name;
    } else {
      const roleDoc = await Role.findOne({ name: role }).lean();
      if (roleDoc) assignedRoleId = roleDoc._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRoleName,
      role_id: assignedRoleId,
      status,
      created_by: req.user ? req.user.name : 'Super Admin'
    });

    await newUser.save();
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'User Management',
      action: 'USER_CREATED',
      targetType: 'User',
      targetId: newUser._id.toString(),
      targetName: newUser.name,
      description: `Created user ${newUser.name} (${newUser.username}) with role ${assignedRoleName}`,
      newValue: { name, username, email, role: assignedRoleName, status }
    });

    return sendSuccess(res, newUser, null, 'User created successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return sendError(res, 'Failed to create user', 500, 'ERR_INTERNAL');
  }
};

/**
 * Update User Details
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, role, status, role_id, avatar } = req.body;

    const user = await User.findOne({ _id: id, deleted_at: null });
    if (!user) {
      return sendError(res, 'User not found', 404, 'ERR_NOT_FOUND');
    }

    const oldValueSnapshot = {
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };

    if (username && username.toLowerCase() !== user.username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase() }).lean();
      if (existingUsername) {
        return sendError(res, 'Username is already taken', 409, 'ERR_CONFLICT');
      }
      user.username = username.toLowerCase();
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() }).lean();
      if (existingEmail) {
        return sendError(res, 'Email address is already in use', 409, 'ERR_CONFLICT');
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;


    if (role || role_id) {
      let newRoleName = role || user.role;
      let newRoleId = role_id || user.role_id;

      if (role_id) {
        const rDoc = await Role.findById(role_id).lean();
        if (rDoc) newRoleName = rDoc.name;
      } else if (role) {
        const rDoc = await Role.findOne({ name: role }).lean();
        if (rDoc) newRoleId = rDoc._id;
      }

      user.role = newRoleName;
      user.role_id = newRoleId;
    }

    if (status) {
      if (user.role === 'Super Admin' && status !== 'Active') {
        const activeSuperAdminCount = await User.countDocuments({
          role: 'Super Admin',
          status: 'Active',
          deleted_at: null,
          _id: { $ne: user._id }
        });

        if (activeSuperAdminCount === 0) {
          return sendError(res, 'Cannot deactivate the last active Super Admin account', 400, 'ERR_FORBIDDEN');
        }
      }
      user.status = status;
    }

    user.updated_by = req.user ? req.user.name : 'Super Admin';
    await user.save();
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'User Management',
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: user.name,
      description: `Updated user profile for ${user.name}`,
      oldValue: oldValueSnapshot,
      newValue: {
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

    return sendSuccess(res, user, null, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return sendError(res, 'Failed to update user', 500, 'ERR_INTERNAL');
  }
};

/**
 * Patch User Account Status (Activate/Deactivate/Lock)
 * PATCH /api/admin/users/:id/status
 */
export const patchUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive', 'Locked'].includes(status)) {
      return sendError(res, 'Invalid status value', 400, 'ERR_VALIDATION');
    }

    const user = await User.findOne({ _id: id, deleted_at: null });
    if (!user) {
      return sendError(res, 'User not found', 404, 'ERR_NOT_FOUND');
    }

    if (user.role === 'Super Admin' && status !== 'Active') {
      const activeSuperAdminCount = await User.countDocuments({
        role: 'Super Admin',
        status: 'Active',
        deleted_at: null,
        _id: { $ne: user._id }
      });

      if (activeSuperAdminCount === 0) {
        return sendError(res, 'Cannot deactivate or lock the last active Super Admin account', 400, 'ERR_FORBIDDEN');
      }
    }

    const oldStatus = user.status;
    user.status = status;
    user.updated_by = req.user ? req.user.name : 'Super Admin';
    await user.save();
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'User Management',
      action: status === 'Active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: user.name,
      description: `Changed user status for ${user.name} from ${oldStatus} to ${status}`,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    return sendSuccess(res, user, null, `User status changed to ${status}`);
  } catch (error) {
    console.error('Error patching user status:', error);
    return sendError(res, 'Failed to update user status', 500, 'ERR_INTERNAL');
  }
};

/**
 * Delete User (Soft Delete)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, deleted_at: null });
    if (!user) {
      return sendError(res, 'User not found', 404, 'ERR_NOT_FOUND');
    }

    if (user.role === 'Super Admin') {
      const activeSuperAdminCount = await User.countDocuments({
        role: 'Super Admin',
        status: 'Active',
        deleted_at: null,
        _id: { $ne: user._id }
      });

      if (activeSuperAdminCount === 0) {
        return sendError(res, 'Cannot delete the last active Super Admin account', 400, 'ERR_FORBIDDEN');
      }
    }

    user.deleted_at = new Date();
    user.status = 'Inactive';
    await user.save();
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'User Management',
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: user.name,
      description: `Soft deleted user account ${user.name} (${user.email})`,
      oldValue: { deleted_at: null, status: 'Active' },
      newValue: { deleted_at: user.deleted_at, status: 'Inactive' }
    });

    return sendSuccess(res, null, null, 'User soft-deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return sendError(res, 'Failed to delete user', 500, 'ERR_INTERNAL');
  }
};

/**
 * Admin Initiate Password Reset
 * POST /api/admin/users/:id/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ _id: id, deleted_at: null });
    if (!user) {
      return sendError(res, 'User not found', 404, 'ERR_NOT_FOUND');
    }

    const tempPassword = newPassword || Math.random().toString(36).slice(-8) + 'A1!';
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    recordActivity({
      req,
      module: 'User Management',
      action: 'PASSWORD_RESET',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: user.name,
      description: `Initiated password reset for user ${user.username}`
    });

    return sendSuccess(res, { temporary_password: tempPassword }, null, 'Password reset initiated successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    return sendError(res, 'Failed to reset password', 500, 'ERR_INTERNAL');
  }
};
