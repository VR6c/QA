import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  activity_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    default: 'System',
    index: true
  },
  user_name: {
    type: String,
    default: 'System User'
  },
  user_email: {
    type: String,
    default: ''
  },
  role_name: {
    type: String,
    default: 'Super Admin',
    index: true
  },
  module: {
    type: String,
    required: true,
    index: true // e.g., 'User Management', 'Role Management', 'System Settings', 'Authentication'
  },
  action: {
    type: String,
    required: true,
    index: true // e.g., 'USER_CREATED', 'USER_UPDATED', 'ROLE_PERMISSIONS_CHANGED', 'SETTING_DISABLED'
  },
  target_type: {
    type: String,
    default: ''
  },
  target_id: {
    type: String,
    default: ''
  },
  target_name: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  old_value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  new_value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ip_address: {
    type: String,
    default: '127.0.0.1'
  },
  user_agent: {
    type: String,
    default: 'Browser/Client'
  },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Denied'],
    default: 'Success',
    index: true
  }
}, {
  timestamps: true
});

// Composite index for fast combined filtering
activityLogSchema.index({ module: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ user_id: 1, createdAt: -1 });

activityLogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
