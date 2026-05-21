const HealthData = require('../models/HealthData');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const { calculateRisk } = require('../utils/riskCalculator');
const { generateRecommendations } = require('../utils/recommendationEngine');

const getInputValue = (input, standardField, legacyField, fallback = '?') => {
  return input?.[standardField] ?? input?.[legacyField] ?? fallback;
};

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user && req.user) {
      user = req.user;
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Try latest health log first
    const latest = await HealthData.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    // Also try latest prediction (screening)
    const latestPrediction = await Prediction.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    // If we have prediction-based recommendations, merge them in
    let recommendations = [];

    if (latest) {
      const riskResult = calculateRisk(latest, user);
      recommendations = generateRecommendations(latest, riskResult, user);
    }

    // Add prediction-specific recommendations
    if (latestPrediction && latestPrediction.results) {
      const r = latestPrediction.results;
      const input = latestPrediction.input || {};

      if (r.diabetes === 1 && !recommendations.find(rec => rec.category === 'diabetes')) {
        recommendations.push({
          title: 'Support Glucose Wellness',
          category: 'diabetes',
          priority: 'high',
          reason: `Your latest screening flagged an elevated glucose-related wellness signal (glucose: ${input.glucose || 'elevated'} mg/dL).`,
          actions: [
            'Track blood glucose trends if you already monitor them',
            'Reduce refined sugar and white carbs',
            'Eat more fiber: oats, lentils, vegetables',
            'Walk for 30 minutes after meals to support glucose regulation',
            'Discuss follow-up testing with a qualified healthcare professional if you are concerned'
          ],
          icon: '🩸'
        });
      }

      if (r.bp === 1 && !recommendations.find(rec => rec.category === 'bp')) {
        recommendations.push({
          title: 'Support Blood Pressure Wellness',
          category: 'bp',
          priority: 'high',
          reason: 'Your screening indicates an elevated blood-pressure-related wellness signal.',
          actions: [
            'Reduce salt intake to under 5g/day',
            'Eat potassium-rich foods: bananas, spinach, sweet potatoes',
            'Practice deep breathing for 5 minutes, twice daily',
            'Limit caffeine to 2 cups/day',
            'Track blood pressure trends if you already monitor them'
          ],
          icon: '❤️'
        });
      }

      if (r.stress === 1 && !recommendations.find(rec => rec.title === 'Manage Your Stress')) {
        const sleepHours = getInputValue(input, 'sleepHours', 'sleep');
        const workHours = getInputValue(input, 'workHours', 'work');
        recommendations.push({
          title: 'Support Stress Recovery',
          category: 'stress',
          priority: 'high',
          reason: `Sleep ${sleepHours}hrs and work ${workHours}hrs/day suggest an elevated stress-related lifestyle signal.`,
          actions: [
            'Set a hard stop for work — no screens after 9 PM',
            'Try box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold',
            'Take a 15-minute nature walk during lunch',
            'Journal 3 things you are grateful for each night',
            'Consider talking to a qualified professional if stress persists'
          ],
          icon: '🧘'
        });
      }

      // Add inline recommendations from prediction if present
      if (latestPrediction.recommendations) {
        latestPrediction.recommendations.forEach((rec, i) => {
          if (!recommendations.find(r => r.title === rec)) {
            recommendations.push({
              title: rec,
              category: 'screening',
              priority: i < 2 ? 'high' : 'medium',
              reason: 'Based on your latest AI-assisted wellness screening.',
              actions: [],
              icon: '🔬'
            });
          }
        });
      }
    }

    if (recommendations.length === 0) {
      return res.json({
        success: true,
        data: [{
          title: 'Start Tracking Your Health',
          category: 'general',
          priority: 'high',
          reason: 'No health data logged yet.',
          actions: [
            'Log your first daily health entry',
            'Complete an AI-assisted wellness screening',
            'Get personalized recommendations based on your data'
          ],
          icon: '📊'
        }]
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

    res.json({
      success: true,
      data: recommendations,
      totalRecommendations: recommendations.length,
      sources: {
        healthLog: !!latest,
        screening: !!latestPrediction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
