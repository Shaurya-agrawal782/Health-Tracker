const HealthData = require('../models/HealthData');
const User = require('../models/User');
const { calculateRisk } = require('../utils/riskCalculator');
const { generateRecommendations } = require('../utils/recommendationEngine');

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const latest = await HealthData.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    if (!latest) {
      return res.json({
        success: true,
        data: [{
          title: 'Start Tracking Your Health',
          category: 'general',
          priority: 'high',
          reason: 'No health data logged yet.',
          actions: [
            'Log your first daily health entry',
            'Track sleep, exercise, diet, and stress',
            'Get personalized recommendations based on your data'
          ],
          icon: '📊'
        }]
      });
    }

    const user = await User.findById(req.user._id);
    const riskResult = calculateRisk(latest, user);
    const recommendations = generateRecommendations(latest, riskResult, user);

    res.json({
      success: true,
      data: recommendations,
      riskLevel: riskResult.level,
      totalRecommendations: recommendations.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
