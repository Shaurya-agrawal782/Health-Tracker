const HealthData = require('../models/HealthData');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const { calculateRisk } = require('../utils/riskCalculator');
const { generateRecommendations } = require('../utils/recommendationEngine');
const geminiService = require('../services/geminiService');

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

// @desc    Get budget-based meal plan
// @route   POST /api/recommendations/meal-plan
exports.getMealPlan = async (req, res) => {
  try {
    const {
      budgetAmount: rawBudgetAmount,
      budgetPeriod = 'Per day',
      budgetLevel = 'Custom',
      foodPreference = 'Vegetarian',
      userType = 'General user',
      livingType = 'General',
      cookingAccess = 'Basic cooking',
      wellnessGoal = 'Balanced diet',
      mealsPerDay: rawMealsPerDay,
      cityOrRegion = '',
      allergies = ''
    } = req.body;

    const mealsPerDay = parseInt(rawMealsPerDay) || 4;

    // Infer budgetAmount if missing
    let budgetAmount = rawBudgetAmount != null && rawBudgetAmount !== '' ? parseFloat(rawBudgetAmount) : null;
    if (budgetAmount === null || isNaN(budgetAmount)) {
      if (budgetLevel === 'Low budget' || budgetLevel === 'Low') {
        budgetAmount = 140;
      } else if (budgetLevel === 'Medium budget' || budgetLevel === 'Medium') {
        budgetAmount = 240;
      } else if (budgetLevel === 'High budget' || budgetLevel === 'High') {
        budgetAmount = 350;
      } else {
        budgetAmount = 200;
      }
    }

    // Convert weekly/monthly budget to daily budget
    let approximateDailyBudget = budgetAmount;
    if (budgetPeriod === 'Per week') {
      approximateDailyBudget = +(budgetAmount / 7).toFixed(1);
    } else if (budgetPeriod === 'Per month') {
      approximateDailyBudget = +(budgetAmount / 30).toFixed(1);
    }

    const options = {
      budgetAmount,
      budgetPeriod,
      budgetLevel,
      approximateDailyBudget,
      foodPreference,
      userType,
      livingType,
      cookingAccess,
      wellnessGoal,
      mealsPerDay,
      cityOrRegion,
      allergies
    };

    // Attempt AI Generation
    const mealPlan = await geminiService.generateMealPlan(options);

    if (mealPlan) {
      return res.json({ success: true, data: mealPlan });
    }

    // Fallback if Gemini fails or is disabled
    const fallbackPlan = getFallbackMealPlan(budgetLevel, foodPreference, options);
    res.json({ success: true, data: fallbackPlan });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Fallback meal plan generator based on budget and preference
 */
function getFallbackMealPlan(budgetLevel, foodPreference, options = {}) {
  const isVegan = foodPreference === 'Vegan';
  const isNonVeg = foodPreference === 'Non-vegetarian';
  const isEgg = foodPreference === 'Eggetarian';

  let breakfast, lunch, snack, dinner, cost, extraMeal = null;

  const dailyBudget = options.approximateDailyBudget || 200;

  if (budgetLevel === 'Low budget' || budgetLevel === 'Low' || dailyBudget <= 180) {
    cost = '₹120–₹180/day';
    breakfast = isVegan ? 'Poha/upma with peanuts and banana' : 
                (isNonVeg || isEgg) ? 'Poha/upma with a boiled egg and banana' : 
                'Poha/upma and a banana';
    lunch = 'Dal + rice + seasonal sabzi (local vegetables)';
    snack = 'Roasted chana (chickpeas) or peanuts';
    dinner = isVegan ? 'Roti + dal + mixed vegetable sabzi' : 
             (isNonVeg) ? 'Roti + dal + egg bhurji' :
             'Roti + dal + curd';
    if (options.mealsPerDay === 5) {
      extraMeal = 'A glass of warm lemon water or green tea with a handful of roasted chana.';
    }
  } else if (budgetLevel === 'High budget' || budgetLevel === 'High' || dailyBudget >= 300) {
    cost = '₹300+/day';
    breakfast = isVegan ? 'Oats with almond/soy milk, chia seeds, fruits and nuts' : 
                (isNonVeg || isEgg) ? 'Oats with milk, fruits, nuts + boiled eggs' : 
                'Oats with milk, fruits and nuts';
    lunch = isVegan ? 'Tofu bowl with quinoa/brown rice and fresh salad' :
            (isNonVeg) ? 'Grilled chicken/fish with quinoa/rice and salad' :
            'Paneer bowl with roti/rice and salad';
    snack = isVegan ? 'Fruit smoothie (water/plant milk) and dry fruits' : 
            'Greek yogurt/smoothie with fresh fruit';
    dinner = isVegan ? 'Dal + tofu stir-fry + sautéed vegetables' :
             (isNonVeg) ? 'Dal + chicken stir-fry + sautéed vegetables' :
             'Dal + paneer/tofu + vegetables';
    if (options.mealsPerDay === 5) {
      extraMeal = 'A small bowl of mixed berries, pumpkin seeds, and a cup of green tea.';
    }
  } else {
    // Medium budget fallback
    cost = '₹180–₹300/day';
    breakfast = isVegan ? 'Oats with water/plant milk + fresh fruit' : 
                (isNonVeg || isEgg) ? 'Oats with milk + fruit + boiled egg' :
                'Oats with milk or poha with fresh fruit';
    lunch = isVegan ? 'Roti + dal + tofu/soybean sabzi' : 
            (isNonVeg) ? 'Roti + dal + chicken curry or boiled eggs + sabzi' :
            'Roti + dal + paneer or curd + sabzi';
    snack = 'Sprouts salad or seasonal fruit';
    dinner = 'Rice/roti + dal + mixed vegetables';
    if (options.mealsPerDay === 5) {
      extraMeal = 'A cup of green tea or coconut water and roasted foxnuts (makhana).';
    }
  }

  // Grocery List only when cooking access allows (Full kitchen or Basic cooking)
  let groceryList = [];
  if (options.cookingAccess === 'Full kitchen' || options.cookingAccess === 'Basic cooking') {
    groceryList = [
      'Rice / Whole wheat flour (Atta)',
      'Oats / Poha / Upma Rava',
      'Lentils (Moong Dal, Masoor Dal)',
      'Seasonal local vegetables (onion, tomato, potato, spinach)',
      isVegan ? 'Tofu / Soybean chunks' : (isNonVeg ? 'Chicken / Eggs / Paneer' : (isEgg ? 'Eggs / Paneer / Curd' : 'Paneer / Curd')),
      'Roasted chana or peanuts'
    ];
  }

  // Hostel tips if PG or Hostel
  let hostelTips = [];
  if (options.livingType === 'Hostel' || options.livingType === 'PG' || options.cookingAccess === 'Mess/tiffin dependent') {
    hostelTips = [
      'Use an electric kettle to boil eggs or prepare instant oats easily in your room.',
      'Keep healthy snacks like roasted chana, peanuts, and seasonal fruits in stock to avoid outside junk food.',
      'Ask your mess operator to reduce excess oil in your dal and vegetables.',
      'Substitute mess dinner with curd/egg bhurji from local stalls if mess options are unhealthy.'
    ];
  }

  return {
    budgetSummary: {
      budgetAmount: options.budgetAmount,
      budgetPeriod: options.budgetPeriod,
      approximateDailyBudget: options.approximateDailyBudget,
      budgetLevel: options.budgetLevel
    },
    mealPlan: {
      breakfast,
      lunch,
      snack,
      dinner,
      extraMeal
    },
    approximateDailyCost: cost,
    affordableSwaps: [
      'Swap expensive fruits for seasonal local fruits (e.g., bananas, papaya).',
      'Use roasted chana or peanuts instead of expensive dry fruits for snacking.',
      isVegan ? 'Use soybean chunks (nutrela) as a cheap high-protein alternative to tofu.' : 'Use eggs or soybean chunks as a cheap high-protein alternative to paneer/chicken.'
    ],
    groceryList: groceryList.length > 0 ? groceryList : null,
    hostelTips: hostelTips.length > 0 ? hostelTips : null,
    budgetNote: 'This fallback plan is structured using easily accessible local ingredients to match your selected budget.',
    safetyNote: 'VitalIQ Health provides general wellness meal ideas. This is not medical treatment. Consult a nutritionist or doctor for medical diet plans.'
  };
}
