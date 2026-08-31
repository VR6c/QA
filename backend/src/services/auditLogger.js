import ActivityLog from '../models/ActivityLog.js';

/**
 * Record an administrative activity log entry efficiently
 */
export const recordActivity = async ({
  req = null,
  userId = 'System',
  userName = 'System User',
  userEmail = '',
  roleName = 'Super Admin',
  module,
  action,
  targetType = '',
  targetId = '',
  targetName = '',
  description,
  oldValue = null,
  newValue = null,
  status = 'Success'
}) => {
  try {
    // Generate high-performance unique activity ID without heavy countDocuments() O(N) scan
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const activity_id = `ACT-${timestamp}-${randomSuffix}`;

    let ip_address = '127.0.0.1';
    let user_agent = 'Internal Service';

    if (req) {
      ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      user_agent = req.headers['user-agent'] || 'Browser Client';
      if (req.user) {
        userId = req.user.id || req.user._id || userId;
        userName = req.user.name || userName;
        userEmail = req.user.email || userEmail;
        roleName = req.user.role || roleName;
      }
    }

    const logEntry = new ActivityLog({
      activity_id,
      user_id: String(userId),
      user_name: userName,
      user_email: userEmail,
      role_name: roleName,
      module,
      action,
      target_type: targetType,
      target_id: String(targetId),
      target_name: targetName,
      description,
      old_value: oldValue,
      new_value: newValue,
      ip_address,
      user_agent,
      status
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('⚠️ Failed to record activity log:', error.message);
    return null;
  }
};
