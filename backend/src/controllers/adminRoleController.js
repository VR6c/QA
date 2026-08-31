import Role from '../models/Role.js';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import { recordActivity } from '../services/auditLogger.js';
import { cacheService } from '../services/cacheService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

/**
 * Get All System Roles with User Counts
 * GET /api/admin/roles
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 }).lean();

    // High performance aggregated user counts per role in single query
    const userCounts = await User.aggregate([
      { $match: { deleted_at: null } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(userCounts.map(item => [item._id, item.count]));

    const rolesWithCounts = roles.map((roleDoc) => {
      const idStr = roleDoc._id.toString();
      const userCount = countsMap.get(roleDoc.name) || 0;
      return {
        ...roleDoc,
        id: idStr,
        user_count: userCount
      };
    });

    return sendSuccess(res, rolesWithCounts, { total: rolesWithCounts.length });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return sendError(res, 'Failed to fetch roles', 500, 'ERR_INTERNAL');
  }
};

/**
 * Get Single Role by ID
 * GET /api/admin/roles/:id
 */
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).lean();
    if (!role) {
      return sendError(res, 'Role not found', 404, 'ERR_NOT_FOUND');
    }

    const userCount = await User.countDocuments({
      $or: [{ role_id: role._id }, { role: role.name }],
      deleted_at: null
    });

    const roleObj = { ...role, id: role._id.toString(), user_count: userCount };
    return sendSuccess(res, roleObj);
  } catch (error) {
    console.error('Error fetching role by id:', error);
    return sendError(res, 'Failed to fetch role detail', 500, 'ERR_INTERNAL');
  }
};

/**
 * Create New Role
 * POST /api/admin/roles
 */
export const createRole = async (req, res) => {
  try {
    const { name, code, description = '', permissions = [], status = 'Active' } = req.body;

    if (!name) {
      return sendError(res, 'Role Name is required', 400, 'ERR_VALIDATION');
    }

    const roleCode = (code || name).toLowerCase().replace(/\s+/g, '_');

    const existingName = await Role.findOne({ name }).lean();
    if (existingName) {
      return sendError(res, 'Role Name already exists', 409, 'ERR_CONFLICT');
    }

    const existingCode = await Role.findOne({ code: roleCode }).lean();
    if (existingCode) {
      return sendError(res, 'Role Code already exists', 409, 'ERR_CONFLICT');
    }

    const newRole = new Role({
      name,
      code: roleCode,
      description,
      status,
      permissions,
      created_by: req.user ? req.user.name : 'Super Admin'
    });

    await newRole.save();

    recordActivity({
      req,
      module: 'Role Management',
      action: 'ROLE_CREATED',
      targetType: 'Role',
      targetId: newRole._id.toString(),
      targetName: newRole.name,
      description: `Created new role '${newRole.name}' with ${permissions.length} permissions`,
      newValue: { name: newRole.name, permissions, status }
    });

    return sendSuccess(res, newRole, null, 'Role created successfully', 201);
  } catch (error) {
    console.error('Error creating role:', error);
    return sendError(res, 'Failed to create role', 500, 'ERR_INTERNAL');
  }
};

/**
 * Update Role & Permissions Matrix
 * PUT /api/admin/roles/:id
 */
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, status } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return sendError(res, 'Role not found', 404, 'ERR_NOT_FOUND');
    }

    const oldSnapshot = {
      name: role.name,
      permissions: [...role.permissions],
      status: role.status
    };

    if (name && name !== role.name) {
      if (role.is_system_role && role.name === 'Super Admin') {
        return sendError(res, 'Cannot rename system Super Admin role', 400, 'ERR_FORBIDDEN');
      }
      const existing = await Role.findOne({ name }).lean();
      if (existing) {
        return sendError(res, 'Role name already exists', 409, 'ERR_CONFLICT');
      }
      role.name = name;
    }

    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (status !== undefined) role.status = status;

    role.updated_by = req.user ? req.user.name : 'Super Admin';
    await role.save();
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'Role Management',
      action: 'PERMISSION_CHANGED',
      targetType: 'Role',
      targetId: role._id.toString(),
      targetName: role.name,
      description: `Updated permissions/details for role '${role.name}'`,
      oldValue: oldSnapshot,
      newValue: {
        name: role.name,
        permissions: [...role.permissions],
        status: role.status
      }
    });

    return sendSuccess(res, role, null, 'Role updated successfully');
  } catch (error) {
    console.error('Error updating role:', error);
    return sendError(res, 'Failed to update role', 500, 'ERR_INTERNAL');
  }
};

/**
 * Patch Role Status (Activate / Deactivate)
 * PATCH /api/admin/roles/:id/status
 */
export const patchRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return sendError(res, 'Invalid role status', 400, 'ERR_VALIDATION');
    }

    const role = await Role.findById(id);
    if (!role) {
      return sendError(res, 'Role not found', 404, 'ERR_NOT_FOUND');
    }

    if (role.is_system_role && role.name === 'Super Admin' && status === 'Inactive') {
      return sendError(res, 'Cannot deactivate Super Admin role', 400, 'ERR_FORBIDDEN');
    }

    const oldStatus = role.status;
    role.status = status;
    role.updated_by = req.user ? req.user.name : 'Super Admin';
    await role.save();
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'Role Management',
      action: status === 'Active' ? 'ROLE_ACTIVATED' : 'ROLE_DEACTIVATED',
      targetType: 'Role',
      targetId: role._id.toString(),
      targetName: role.name,
      description: `Changed role '${role.name}' status to ${status}`,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    return sendSuccess(res, role, null, `Role status changed to ${status}`);
  } catch (error) {
    console.error('Error patching role status:', error);
    return sendError(res, 'Failed to patch role status', 500, 'ERR_INTERNAL');
  }
};

/**
 * Delete Role
 * DELETE /api/admin/roles/:id
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return sendError(res, 'Role not found', 404, 'ERR_NOT_FOUND');
    }

    if (role.is_system_role) {
      return sendError(res, 'System roles cannot be deleted', 400, 'ERR_FORBIDDEN');
    }

    const userCount = await User.countDocuments({
      $or: [{ role_id: role._id }, { role: role.name }],
      deleted_at: null
    });

    if (userCount > 0) {
      return sendError(res, `Cannot delete role '${role.name}'. It is currently assigned to ${userCount} user(s). Reassign them first.`, 400, 'ERR_FORBIDDEN');
    }

    await Role.findByIdAndDelete(id);
    cacheService.delPattern('user_access:*');

    recordActivity({
      req,
      module: 'Role Management',
      action: 'ROLE_DELETED',
      targetType: 'Role',
      targetId: id,
      targetName: role.name,
      description: `Deleted role '${role.name}'`
    });

    return sendSuccess(res, null, null, 'Role deleted successfully');
  } catch (error) {
    console.error('Error deleting role:', error);
    return sendError(res, 'Failed to delete role', 500, 'ERR_INTERNAL');
  }
};

/**
 * Get Available Permissions List
 * GET /api/admin/permissions
 */
export const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, action: 1 }).lean();
    return sendSuccess(res, permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return sendError(res, 'Failed to fetch permissions', 500, 'ERR_INTERNAL');
  }
};
