const mongoose = require('mongoose');

const weeklyCheckinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  sleepQuality: {
    type: String,
    enum: ['Poor', 'Okay', 'Good', 'Great'],
    required: true
  },
  energyLevel: {
    type: String,
    enum: ['Low', 'Medium', 'Good', 'High'],
    required: true
  },
  stressLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Very high'],
    required: true
  },
  mood: {
    type: String,
    enum: ['Low', 'Okay', 'Good', 'Great'],
    required: true
  },
  mealConsistency: {
    type: String,
    enum: ['Rarely', '2–3 days', '4–5 days', 'Most days'],
    required: true
  },
  activityLevel: {
    type: String,
    enum: ['Mostly inactive', 'Lightly active', 'Moderately active', 'Very active'],
    required: true
  },
  screenBalance: {
    type: String,
    enum: ['Poor', 'Okay', 'Good', 'Great'],
    required: true
  },
  reflection: {
    type: String,
    default: ''
  },
  weeklyScore: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  insights: {
    type: [String],
    default: []
  },
  focusActions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for efficient sorting
weeklyCheckinSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.model('WeeklyCheckin', weeklyCheckinSchema);
