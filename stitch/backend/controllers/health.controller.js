const HealthData = require('../models/HealthData');
const User = require('../models/User');
const { calculateRisk, calculateBMI, getBMICategory } = require('../utils/riskCalculator');

// @desc    Add health data entry
// @route   POST /api/health/add
exports.addHealthData = async (req, res) => {
  try {
    const {
      sleepHours, exerciseMinutes, steps, dietType,
      waterIntake, stressLevel, smoking, alcohol, calorieIntake
    } = req.body;

    const healthEntry = await HealthData.create({
      userId: req.user._id,
      sleepHours,
      exerciseMinutes,
      steps,
      dietType,
      waterIntake,
      stressLevel,
      smoking: smoking || false,
      alcohol: alcohol || false,
      calorieIntake: calorieIntake || 0,
      date: new Date()
    });

    res.status(201).json({
      success: true,
      data: healthEntry,
      message: 'Health data logged successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get health history for user
// @route   GET /api/health/history
exports.getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const history = await HealthData.find({ userId: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HealthData.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest health entry
// @route   GET /api/health/latest
exports.getLatest = async (req, res) => {
  try {
    const latest = await HealthData.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    if (!latest) {
      return res.json({
        success: true,
        data: null,
        message: 'No health data found. Start logging your daily data!'
      });
    }

    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get risk assessment
// @route   GET /api/health/risk
exports.getRisk = async (req, res) => {
  try {
    const latest = await HealthData.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    if (!latest) {
      return res.json({
        success: true,
        data: {
          level: 'Unknown',
          score: 0,
          confidence: 0,
          factors: [],
          explanation: 'No health data available. Please log your daily health data first.'
        }
      });
    }

    const user = await User.findById(req.user._id);
    const riskResult = calculateRisk(latest, user);

    res.json({ success: true, data: riskResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get health summary / aggregated stats
// @route   GET /api/health/summary
exports.getSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await HealthData.find({
      userId: req.user._id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No health data found for this period'
      });
    }

    // Calculate averages
    const totals = entries.reduce((acc, entry) => ({
      sleepHours: acc.sleepHours + entry.sleepHours,
      exerciseMinutes: acc.exerciseMinutes + entry.exerciseMinutes,
      steps: acc.steps + entry.steps,
      waterIntake: acc.waterIntake + entry.waterIntake,
      stressLevel: acc.stressLevel + entry.stressLevel,
      calorieIntake: acc.calorieIntake + (entry.calorieIntake || 0)
    }), {
      sleepHours: 0, exerciseMinutes: 0, steps: 0,
      waterIntake: 0, stressLevel: 0, calorieIntake: 0
    });

    const count = entries.length;
    const user = await User.findById(req.user._id);
    const bmi = calculateBMI(user.weight, user.height);

    const summary = {
      period: `${days} days`,
      entriesCount: count,
      averages: {
        sleepHours: +(totals.sleepHours / count).toFixed(1),
        exerciseMinutes: +(totals.exerciseMinutes / count).toFixed(0),
        steps: +(totals.steps / count).toFixed(0),
        waterIntake: +(totals.waterIntake / count).toFixed(1),
        stressLevel: +(totals.stressLevel / count).toFixed(1),
        calorieIntake: +(totals.calorieIntake / count).toFixed(0)
      },
      bmi,
      bmiCategory: getBMICategory(bmi),
      trends: entries.map(e => ({
        date: e.date,
        sleepHours: e.sleepHours,
        exerciseMinutes: e.exerciseMinutes,
        steps: e.steps,
        stressLevel: e.stressLevel,
        waterIntake: e.waterIntake,
        calorieIntake: e.calorieIntake || 0
      })),
      activityScore: calculateActivityScore(totals, count)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: calculate a 0-100 activity score
function calculateActivityScore(totals, count) {
  const avgExercise = totals.exerciseMinutes / count;
  const avgSteps = totals.steps / count;
  const avgSleep = totals.sleepHours / count;

  let score = 0;
  score += Math.min((avgExercise / 60) * 30, 30);  // Exercise: max 30 pts
  score += Math.min((avgSteps / 10000) * 30, 30);   // Steps: max 30 pts
  score += Math.min((avgSleep / 8) * 20, 20);       // Sleep: max 20 pts
  score += 20 - Math.min((totals.stressLevel / count / 10) * 20, 20); // Low stress: max 20 pts

  return Math.round(Math.min(score, 100));
}
