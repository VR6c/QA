import Setting from '../models/Setting.js';
import { recordActivity } from '../services/auditLogger.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

/**
 * Get All System Settings
 * GET /api/admin/settings
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ category: 1, name: 1 }).lean();

    const grouped = settings.reduce((acc, setting) => {
      const cat = setting.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(setting);
      return acc;
    }, {});

    return sendSuccess(res, settings, { categories: grouped });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return sendError(res, 'Failed to fetch system settings', 500, 'ERR_INTERNAL');
  }
};

/**
 * Get Single Setting by Key
 * GET /api/admin/settings/:key
 */
export const getSettingByKey = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key }).lean();
    if (!setting) {
      return sendError(res, 'Setting not found', 404, 'ERR_NOT_FOUND');
    }
    return sendSuccess(res, setting);
  } catch (error) {
    console.error('Error fetching setting by key:', error);
    return sendError(res, 'Failed to fetch setting', 500, 'ERR_INTERNAL');
  }
};

/**
 * Update Setting Value
 * PUT /api/admin/settings/:key
 */
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, status } = req.body;

    const setting = await Setting.findOne({ key });
    if (!setting) {
      return sendError(res, 'Setting not found', 404, 'ERR_NOT_FOUND');
    }

    const oldSnapshot = {
      value: setting.value,
      status: setting.status
    };

    if (value !== undefined) setting.value = value;
    if (status !== undefined) setting.status = status;

    setting.updated_by = req.user ? req.user.name : 'Super Admin';
    await setting.save();

    recordActivity({
      req,
      module: 'System Settings',
      action: 'SETTING_UPDATED',
      targetType: 'Setting',
      targetId: setting.key,
      targetName: setting.name,
      description: `Updated setting '${setting.name}' (${setting.key})`,
      oldValue: oldSnapshot,
      newValue: {
        value: setting.value,
        status: setting.status
      }
    });

    return sendSuccess(res, setting, null, 'Setting updated successfully');
  } catch (error) {
    console.error('Error updating setting:', error);
    return sendError(res, 'Failed to update setting', 500, 'ERR_INTERNAL');
  }
};

/**
 * Patch Setting Status (Enable / Disable Feature Toggle)
 * PATCH /api/admin/settings/:key/status
 */
export const patchSettingStatus = async (req, res) => {
  try {
    const { key } = req.params;
    const { status } = req.body;

    if (!['Enabled', 'Disabled'].includes(status)) {
      return sendError(res, 'Invalid setting status', 400, 'ERR_VALIDATION');
    }

    const setting = await Setting.findOne({ key });
    if (!setting) {
      return sendError(res, 'Setting not found', 404, 'ERR_NOT_FOUND');
    }

    const oldStatus = setting.status;
    setting.status = status;
    setting.updated_by = req.user ? req.user.name : 'Super Admin';
    await setting.save();

    recordActivity({
      req,
      module: 'System Settings',
      action: status === 'Enabled' ? 'SETTING_ENABLED' : 'SETTING_DISABLED',
      targetType: 'Setting',
      targetId: setting.key,
      targetName: setting.name,
      description: `${status === 'Enabled' ? 'Enabled' : 'Disabled'} setting '${setting.name}'`,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    return sendSuccess(res, setting, null, `Setting '${setting.name}' is now ${status}`);
  } catch (error) {
    console.error('Error patching setting status:', error);
    return sendError(res, 'Failed to patch setting status', 500, 'ERR_INTERNAL');
  }
};
