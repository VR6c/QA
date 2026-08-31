import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Owner name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Owner name cannot exceed 100 characters']
  },
  role: {
    type: String,
    default: 'Team Member',
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters']
  },
  color: {
    type: String,
    default: 'blue',
    enum: ['blue', 'purple', 'emerald', 'amber', 'rose', 'indigo', 'cyan', 'teal', 'slate']
  },
  avatar: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Owner = mongoose.model('Owner', ownerSchema);
export default Owner;
