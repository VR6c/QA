import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true,
    index: true
  },
  period: {
    type: String, // e.g. '2026-W35' or '2026-08'
    required: true,
    index: true
  },
  startDate: {
    type: String,
    default: null
  },
  endDate: {
    type: String,
    default: null
  },
  owner: {
    type: String,
    default: 'All'
  },
  status: {
    type: String,
    enum: ['draft', 'finalized'],
    default: 'finalized',
    index: true
  },
  gcin: {
    good: [{ type: String }],
    challenge: [{ type: String }],
    improvement: [{ type: String }],
    nextAction: [{ type: String }]
  },
  task_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  metrics: {
    quick_test: { type: Number, default: 0 },
    finding_error: { type: Number, default: 0 },
    conduct_testing: { type: Number, default: 0 },
    new_idea: { type: Number, default: 0 },
    research_doc: { type: Number, default: 0 },
    timeliness: {
      on_time: { type: Number, default: 0 },
      over_deadline: { type: Number, default: 0 }
    }
  },
  kpi_targets: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  performance_tier: {
    quick_test: { type: String, default: 'Needs Improvement' },
    finding_error: { type: String, default: 'Needs Improvement' },
    conduct_testing: { type: String, default: 'Needs Improvement' },
    new_idea: { type: String, default: 'Needs Improvement' },
    research_doc: { type: String, default: 'Needs Improvement' },
    overall: { type: String, default: 'Good' }
  },
  challenges_success_stories: {
    challenges: { type: String, default: '' },
    successStories: { type: String, default: '' }
  },
  created_by: {
    type: String,
    default: 'System'
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

const Report = mongoose.model('Report', reportSchema);
export default Report;
