import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission Name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Permission Code is required'],
    unique: true,
    lowercase: true,
    trim: true // Format: module.action (e.g. 'user.view', 'user.create')
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    trim: true // e.g. 'User Management', 'Role Management', 'System Settings', 'Activity Log'
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true // e.g. 'view', 'create', 'edit', 'delete', 'status', 'toggle'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

permissionSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;
