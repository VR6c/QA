import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  patchUserStatus,
  deleteUser,
  resetPassword
} from '../controllers/adminUserController.js';

import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  patchRoleStatus,
  deleteRole,
  getPermissions
} from '../controllers/adminRoleController.js';

import {
  getSettings,
  getSettingByKey,
  updateSetting,
  patchSettingStatus
} from '../controllers/adminSettingController.js';

import {
  getActivities,
  getActivityById,
  getDashboardStats
} from '../controllers/adminActivityController.js';

const router = express.Router();

// Apply Authentication Middleware to all Super Admin routes
router.use(authenticateToken);

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// User Management Routes
router.get('/users', requirePermission('user.view'), getUsers);
router.get('/users/:id', requirePermission('user.view'), getUserById);
router.post('/users', requirePermission('user.create'), createUser);
router.put('/users/:id', requirePermission('user.edit'), updateUser);
router.patch('/users/:id/status', requirePermission('user.status'), patchUserStatus);
router.delete('/users/:id', requirePermission('user.delete'), deleteUser);
router.post('/users/:id/reset-password', requirePermission('user.reset_password'), resetPassword);

// Role & Permission Routes
router.get('/roles', requirePermission('role.view'), getRoles);
router.get('/roles/:id', requirePermission('role.view'), getRoleById);
router.post('/roles', requirePermission('role.create'), createRole);
router.put('/roles/:id', requirePermission('role.edit'), updateRole);
router.patch('/roles/:id/status', requirePermission('role.status'), patchRoleStatus);
router.delete('/roles/:id', requirePermission('role.delete'), deleteRole);
router.get('/permissions', requirePermission('role.permission'), getPermissions);

// System Settings Routes
router.get('/settings', requirePermission('setting.view'), getSettings);
router.get('/settings/:key', requirePermission('setting.view'), getSettingByKey);
router.put('/settings/:key', requirePermission('setting.edit'), updateSetting);
router.patch('/settings/:key/status', requirePermission('setting.toggle'), patchSettingStatus);

// Activity / Audit Log Routes (Read-Only)
router.get('/activities', requirePermission('activity.view'), getActivities);
router.get('/activities/:id', requirePermission('activity.view'), getActivityById);

export default router;
