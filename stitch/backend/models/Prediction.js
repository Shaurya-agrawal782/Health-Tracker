const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  input: {
    age: Number,
    bmi: Number,
    glucose: Number,
    activity: Number,
    family: String,
    weight: Number,
    salt: Number,
    activity_level: String,
    stress_level: String,
    sleep: Number,
    screen: Number,
    work: Number,
    daily_activity: Number
  },
  results: {
    diabetes: { type: Number, default: 0 },
    bp: { type: Number, default: 0 },
    stress: { type: Number, default: 0 }
  },
  explanations: {
    diabetes: {
      prediction: Number,
      base_value: Number,
      feature_importance: mongoose.Schema.Types.Mixed,
      shap_visualization: String
    },
    bp: {
      prediction: Number,
      base_value: Number,
      feature_importance: mongoose.Schema.Types.Mixed,
      shap_visualization: String
    },
    stress: {
      prediction: Number,
      base_value: Number,
      feature_importance: mongoose.Schema.Types.Mixed,
      shap_visualization: String
    }
  },
  overallRisk: {
    level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 }
  },
  symptoms: [String],
  recommendations: [String],
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'pending'
  },
  checkType: {
    type: String,
    enum: ['Routine Check', 'Lab Result', 'Consultation', 'Follow-up', 'Screening'],
    default: 'Screening'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

predictionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
