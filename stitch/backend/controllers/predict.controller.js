const axios = require('axios');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// @desc    Run ML prediction (diabetes + bp c
// @route   POST /api/predict
exports.predict = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      glucose, activity, family, salt,
      activity_level, stress_level, sleep, screen, work, daily_activity
    } = req.body;

    // Build the ML input using user profile + form data
    const mlInput = {
      age: user.age,
      bmi: +(user.weight / ((user.height / 100) ** 2)).toFixed(1),
      glucose: parseFloat(glucose) || 100,
      activity: parseFloat(activity) || 150,
      family: family || 'No',
      weight: user.weight,
      salt: parseFloat(salt) || 8,
      activity_level: activity_level || 'Moderate',
      stress_level: stress_level || 'Medium',
      sleep: parseFloat(sleep) || 7,
      screen: parseFloat(screen) || 5,
      work: parseFloat(work) || 8,
      daily_activity: parseFloat(daily_activity) || 60
    };

    // Create pending prediction record
    const prediction = await Prediction.create({
      userId: req.user._id,
      input: mlInput,
      status: 'pending',
      checkType: req.body.checkType || 'Screening',
      symptoms: req.body.symptoms || [],
      date: new Date()
    });

    try {
      // Call FastAPI prediction endpoint
      const predictRes = await axios.post(`${ML_API_URL}/predict`, mlInput, {
        timeout: 30000
      });

      const results = {
        diabetes: predictRes.data.diabetes,
        bp: predictRes.data.bp,
        stress: predictRes.data.stress
      };

      // Calculate overall risk
      const riskCount = results.diabetes + results.bp + results.stress;
      let overallRisk;
      if (riskCount >= 2) {
        overallRisk = { level: 'High', score: 75 + (riskCount * 8), confidence: 0.88 };
      } else if (riskCount === 1) {
        overallRisk = { level: 'Medium', score: 45, confidence: 0.82 };
      } else {
        overallRisk = { level: 'Low', score: 15, confidence: 0.90 };
      }

      // Fetch SHAP explanations for all 3 models in parallel
      const [diabetesExplain, bpExplain, stressExplain] = await Promise.allSettled([
        axios.post(`${ML_API_URL}/explain/diabetes`, mlInput, { timeout: 30000 }),
        axios.post(`${ML_API_URL}/explain/bp`, mlInput, { timeout: 30000 }),
        axios.post(`${ML_API_URL}/explain/stress`, mlInput, { timeout: 30000 })
      ]);

      const explanations = {
        diabetes: diabetesExplain.status === 'fulfilled' ? diabetesExplain.value.data : null,
        bp: bpExplain.status === 'fulfilled' ? bpExplain.value.data : null,
        stress: stressExplain.status === 'fulfilled' ? stressExplain.value.data : null
      };

      // Generate recommendations based on predictions
      const recommendations = generateMLRecommendations(results, mlInput);

      // Update prediction record
      prediction.results = results;
      prediction.explanations = explanations;
      prediction.overallRisk = overallRisk;
      prediction.recommendations = recommendations;
      prediction.status = 'completed';
      await prediction.save();

      res.json({
        success: true,
        data: {
          id: prediction._id,
          results,
          explanations,
          overallRisk,
          recommendations,
          input: mlInput,
          timestamp: predictRes.data.timestamp
        }
      });

    } catch (mlError) {
      // ML service unavailable — use fallback rule-based scoring
      console.error('ML service error:', mlError.message);

      const fallbackResults = {
        diabetes: mlInput.glucose > 140 || mlInput.bmi > 30 ? 1 : 0,
        bp: mlInput.salt > 12 || mlInput.stress_level === 'High' ? 1 : 0,
        stress: mlInput.sleep < 5 || mlInput.work > 10 ? 1 : 0
      };

      const riskCount = fallbackResults.diabetes + fallbackResults.bp + fallbackResults.stress;
      const overallRisk = {
        level: riskCount >= 2 ? 'High' : riskCount === 1 ? 'Medium' : 'Low',
        score: riskCount * 30 + 10,
        confidence: 0.65
      };

      prediction.results = fallbackResults;
      prediction.overallRisk = overallRisk;
      prediction.recommendations = generateMLRecommendations(fallbackResults, mlInput);
      prediction.status = 'completed';
      await prediction.save();

      res.json({
        success: true,
        data: {
          id: prediction._id,
          results: fallbackResults,
          explanations: null,
          overallRisk,
          recommendations: prediction.recommendations,
          input: mlInput,
          fallback: true,
          message: 'ML service unavailable — used rule-based fallback'
        }
      });
    }

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single prediction by ID
// @route   GET /api/predict/:id
exports.getPrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prediction history
// @route   GET /api/predict/history
exports.getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type; // filter by checkType

    const filter = { userId: req.user._id };
    if (type && type !== 'All') {
      filter.checkType = type;
    }

    const predictions = await Prediction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-explanations.diabetes.shap_visualization -explanations.bp.shap_visualization -explanations.stress.shap_visualization');

    const total = await Prediction.countDocuments(filter);

    res.json({
      success: true,
      data: predictions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: generate recommendations from ML predictions
function generateMLRecommendations(results, input) {
  const recs = [];

  if (results.diabetes === 1) {
    recs.push('Monitor blood glucose levels regularly — consider HbA1c testing');
    recs.push('Reduce sugar and refined carb intake; prefer whole grains');
    if (input.activity < 100) recs.push('Increase physical activity to 150+ min/week');
    if (input.family === 'Yes') recs.push('Family history detected — schedule annual diabetes screening');
  }

  if (results.bp === 1) {
    recs.push('Reduce daily salt intake below 6g/day');
    recs.push('Practice stress management: meditation, deep breathing, or yoga');
    if (input.weight > 80) recs.push('Consider a weight management plan to lower blood pressure');
    recs.push('Monitor blood pressure at home weekly');
  }

  if (results.stress === 1) {
    recs.push('Aim for 7-9 hours of quality sleep each night');
    if (input.screen > 6) recs.push('Reduce screen time — take breaks every 30 minutes');
    if (input.work > 9) recs.push('Consider work-life balance adjustments');
    recs.push('Incorporate daily physical activity (walks, stretching, exercise)');
  }

  if (recs.length === 0) {
    recs.push('Great job! Your health indicators look positive');
    recs.push('Continue maintaining your current healthy lifestyle');
    recs.push('Schedule an annual check-up for preventive care');
  }

  return recs;
}
