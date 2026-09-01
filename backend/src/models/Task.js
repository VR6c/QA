import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [5000, 'Title cannot exceed 5000 characters']
  },
  status: {
    type: String,
    enum: ['feedback', 'progress', 'testing', 'success', 'done', 'done_production', 'backlog'],
    default: 'backlog',
    index: true
  },
  pushTo: {
    type: String,
    enum: ['Development', 'Production', 'TestFlight', 'UAT'],
    default: 'Development',
    index: true
  },
  reason: {
    type: String,
    default: '',
    maxlength: [5000, 'Reason cannot exceed 5000 characters']
  },
  timeline: {
    type: String,
    default: '',
    maxlength: [2000, 'Timeline cannot exceed 2000 characters']
  },
  remark: {
    type: String,
    default: '',
    maxlength: [5000, 'Remark cannot exceed 5000 characters']
  },
  date: {
    type: String,
    default: '2026-08-01',
    index: true
  },
  flowType: {
    type: String,
    enum: ['none', 'monthly', 'weekly', 'yearly'],
    default: 'none',
    index: true
  },
  flowValue: {
    type: String,
    default: '',
    index: true
  },
  kpiCategory: {
    type: String,
    default: 'none',
    index: true
  },
  user: {
    type: String,
    default: 'Unassigned',
    index: true
  },
  owner: {
    type: String,
    default: 'Unassigned',
    index: true
  },
  completed_at: {
    type: Date,
    default: null,
    index: true
  },
  kpi_claimed_month: {
    type: String,
    default: null,
    index: true
  },
  kpi_claimed_report_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null,
    index: true
  },
  due_date: {
    type: String,
    default: null
  },
  datelineDeveloper: {
    type: String,
    default: ''
  },
  datelineTesting: {
    type: String,
    default: ''
  },
  delay_reason: {
    type: String,
    default: ''
  },
  testing_started_at: {
    type: Date,
    default: null,
    index: true
  },
  testing_started_by: {
    type: String,
    default: null,
    index: true
  },
  testing_duration_seconds: {
    type: Number,
    default: 0
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

// Compound indexes for status, date, user, and owner queries
taskSchema.index({ status: 1, date: 1 });
taskSchema.index({ user: 1, owner: 1 });
taskSchema.index({ owner: 1, status: 1, completed_at: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
