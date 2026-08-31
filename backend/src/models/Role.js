import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role Name is required'],
    unique: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: [true, 'Role Code is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  is_system_role: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String, // e.g., 'user.view', 'user.create', 'role.edit'
    trim: true
  }],
  created_by: {
    type: String,
    default: 'System'
  },
  updated_by: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

roleSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Role = mongoose.model('Role', roleSchema);
export default Role;
