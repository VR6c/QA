import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting Key is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Setting Name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['General', 'User', 'Security', 'Notification', 'Feature'],
    default: 'General'
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  value_type: {
    type: String,
    enum: ['boolean', 'string', 'number', 'json'],
    default: 'string'
  },
  scope: {
    type: String,
    enum: ['Global', 'Role', 'User'],
    default: 'Global'
  },
  status: {
    type: String,
    enum: ['Enabled', 'Disabled'],
    default: 'Enabled'
  },
  description: {
    type: String,
    default: ''
  },
  updated_by: {
    type: String,
    default: 'Super Admin'
  }
}, {
  timestamps: true
});

settingSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
