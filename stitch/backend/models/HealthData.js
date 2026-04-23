const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sleepHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  exerciseMinutes: {
    type: Number,
    required: true,
    min: 0,
    max: 1440
  },
  steps: {
    type: Number,
    required: true,
    min: 0,
    max: 100000
  },
  dietType: {
    type: String,
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'junk', 'balanced'],
    required: true
  },
  waterIntake: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },
  stressLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  smoking: {
    type: Boolean,
    default: false
  },
  alcohol: {
    type: Boolean,
    default: false
  },
  calorieIntake: {
    type: Number,
    default: 0,
    min: 0,
    max: 10000
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient user+date queries
healthDataSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('HealthData', healthDataSchema);
