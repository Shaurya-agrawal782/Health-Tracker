const WeeklyCheckin = require('../models/WeeklyCheckin');

// @desc    Create a weekly check-in
// @route   POST /api/checkins/weekly
// @access  Private
exports.createCheckin = async (req, res) => {
  try {
    const {
      weekStartDate,
      sleepQuality,
      energyLevel,
      stressLevel,
      mood,
      mealConsistency,
      activityLevel,
      screenBalance,
      reflection,
      weeklyScore,
      status,
      insights,
      focusActions
    } = req.body;

    // Validate required fields
    if (
      !weekStartDate ||
      !sleepQuality ||
      !energyLevel ||
      !stressLevel ||
      !mood ||
      !mealConsistency ||
      !activityLevel ||
      !screenBalance ||
      weeklyScore === undefined ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const checkin = await WeeklyCheckin.create({
      userId: req.user._id,
      weekStartDate: new Date(weekStartDate),
      sleepQuality,
      energyLevel,
      stressLevel,
      mood,
      mealConsistency,
      activityLevel,
      screenBalance,
      reflection: reflection || '',
      weeklyScore,
      status,
      insights: insights || [],
      focusActions: focusActions || []
    });

    res.status(201).json({
      success: true,
      data: checkin,
      message: 'Weekly check-in saved successfully'
    });
  } catch (error) {
    console.error('Error creating weekly check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// @desc    Get all weekly check-ins for the user
// @route   GET /api/checkins/weekly
// @access  Private
exports.getCheckins = async (req, res) => {
  try {
    const checkins = await WeeklyCheckin.find({ userId: req.user._id })
      .sort({ weekStartDate: -1 });

    res.json({
      success: true,
      data: checkins
    });
  } catch (error) {
    console.error('Error getting weekly check-ins:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
