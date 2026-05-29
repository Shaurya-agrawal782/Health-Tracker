/**
 * Smart Recommendation Engine for VitalIQ Health
 * 
 * Generates personalized, safe, and actionable lifestyle recommendations.
 */

import { getVitaliqPreferences } from './preferences';

/**
 * Calculates habit stats from localStorage history over the last 7 days.
 * 
 * @returns {Object} habitStats
 */
export const getHabitStats = () => {
  try {
    const history = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
    const today = new Date();
    
    let totalHabitsChecked = 0;
    let totalCompleted = 0;
    let walkCompleted = 0;
    let waterCompleted = 0;
    let loggedDaysCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayHabits = history[dateStr];
      if (dayHabits) {
        loggedDaysCount++;
        Object.keys(dayHabits).forEach(habitKey => {
          totalHabitsChecked++;
          if (dayHabits[habitKey] === true) {
            totalCompleted++;
            if (habitKey === 'walk') walkCompleted++;
            if (habitKey === 'water') waterCompleted++;
          }
        });
      }
    }

    return {
      overallCompletionRate: totalHabitsChecked > 0 ? (totalCompleted / totalHabitsChecked) * 100 : 0,
      walkCompletionDays: walkCompleted,
      waterCompletionDays: waterCompleted,
      loggedDaysCount
    };
  } catch (error) {
    console.error('Error calculating habit stats:', error);
    return { overallCompletionRate: 0, walkCompletionDays: 0, waterCompletionDays: 0, loggedDaysCount: 0 };
  }
};

/**
 * Calculates daily action completion stats for today.
 * 
 * @returns {Object} dailyActionStats
 */
export const getDailyActionStats = () => {
  try {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `vitaliq_daily_actions_${year}-${month}-${day}`;
    
    const cached = localStorage.getItem(key);
    if (!cached) return { total: 0, completed: 0, rate: 0 };
    
    const list = JSON.parse(cached);
    if (!Array.isArray(list) || list.length === 0) return { total: 0, completed: 0, rate: 0 };
    
    const completed = list.filter(a => a.completed).length;
    return {
      total: list.length,
      completed,
      rate: (completed / list.length) * 100
    };
  } catch (error) {
    return { total: 0, completed: 0, rate: 0 };
  }
};

/**
 * Gathers the standard inputs needed for the recommendation engine
 * from local storage and fallback states.
 * 
 * @param {Object} user Current logged-in user object from context
 * @returns {Object} engineInput
 */
export const gatherRecommendationData = (user) => {
  const preferences = getVitaliqPreferences();
  const isGuest = !user || user.isGuest || user.role === 'guest' || user.isMockGoogle || user.role === 'demo';

  // Load latest wellness check
  let latestWellnessCheck = null;
  try {
    const localChecks = JSON.parse(localStorage.getItem('vitaliq_wellness_checks') || '[]');
    if (localChecks.length > 0) {
      latestWellnessCheck = localChecks[0];
    }
  } catch (e) {}

  // Load latest weekly check-in
  let latestWeeklyCheckin = null;
  try {
    const localReflections = JSON.parse(localStorage.getItem('vitaliq_weekly_checkins') || '[]');
    if (localReflections.length > 0) {
      latestWeeklyCheckin = localReflections[0];
    }
  } catch (e) {}

  // Calculate habit stats
  const habitStats = getHabitStats();
  
  // Calculate daily action stats
  const dailyActionStats = getDailyActionStats();

  return {
    preferences,
    latestWellnessCheck,
    latestMealPlan: null, // Fetched dynamically if needed, fallback to null
    habitStats,
    dailyActionStats,
    latestWeeklyCheckin,
    userType: preferences.userType || 'General User',
    isGuest
  };
};

/**
 * Core Smart Recommendation Engine (Rule-based)
 * 
 * @param {Object} input 
 * @returns {Object} RecommendationsResult
 */
export const generateSmartRecommendations = (input) => {
  const {
    preferences = {},
    latestWellnessCheck,
    habitStats = { overallCompletionRate: 0, walkCompletionDays: 0, waterCompletionDays: 0 },
    latestWeeklyCheckin,
  } = input;

  const hasPreferences = preferences && (preferences.onboardingCompleted || preferences.onboardingSkipped);

  // If no onboarding/preferences exist, return starter suggestions
  if (!hasPreferences) {
    return {
      focusArea: 'Getting Started',
      summary: 'Complete onboarding and initial assessments to personalize your wellness path.',
      recommendations: [
        {
          id: 'starter-onboarding',
          title: 'Complete your onboarding setup',
          category: 'Consistency',
          reason: 'No preferences set up yet.',
          action: 'Complete your profile and preferences setup so VitalIQ Health can tailor its suggestions.',
          priority: 'High',
          difficulty: 'Easy',
          estimatedTime: '5 mins',
          source: 'System'
        },
        {
          id: 'starter-check',
          title: 'Take your first wellness check',
          category: 'Consistency',
          reason: 'No baseline physical data is logged.',
          action: 'Log your baseline vitals to evaluate cardiovascular and lifestyle wellness signals.',
          priority: 'High',
          difficulty: 'Easy',
          estimatedTime: '10 mins',
          source: 'System'
        },
        {
          id: 'starter-meals',
          title: 'Generate your budget meal plan',
          category: 'Food',
          reason: 'Nutritional preferences are not set.',
          action: 'Try generating a custom daily meal plan using your dietary and budget preferences.',
          priority: 'Medium',
          difficulty: 'Easy',
          estimatedTime: '5 mins',
          source: 'System'
        },
        {
          id: 'starter-habits',
          title: 'Start with Water + Walk habits',
          category: 'Consistency',
          reason: 'Build momentum with simple, high-impact habits.',
          action: 'Set your focus on logging just two habits: drinking water and a 10-minute walk.',
          priority: 'Medium',
          difficulty: 'Easy',
          estimatedTime: '10 mins',
          source: 'System'
        }
      ]
    };
  }

  const recommendations = [];

  // 1. Food/Budget Rules
  const goalsList = preferences.goals || [];
  const foodPref = preferences.foodPreference || 'Vegetarian';
  const hasBudgetGoal = goalsList.includes('Eat healthy within budget');

  if (hasBudgetGoal) {
    let proteinSource = '';
    if (foodPref === 'Vegetarian') {
      proteinSource = 'dal, chana, sprouts, curd, or peanuts';
    } else if (foodPref === 'Eggetarian') {
      proteinSource = 'eggs, chana, sprouts, or curd';
    } else if (foodPref === 'Vegan') {
      proteinSource = 'dal, chana, sprouts, peanuts, or soy/tofu';
    } else {
      proteinSource = 'eggs, chicken (when budget allows), or lentils/chana';
    }

    recommendations.push({
      id: 'food-budget-protein',
      title: 'Add one budget protein source today',
      category: 'Food',
      reason: `Your goal is eating healthy within budget (${foodPref} diet).`,
      action: `Include ${proteinSource} in your main meals to meet your protein target affordably.`,
      priority: 'High',
      difficulty: 'Easy',
      estimatedTime: '10 mins',
      source: 'Preferences'
    });
  }

  // Low budget rules
  const budgetVal = preferences.budgetAmount ? Number(preferences.budgetAmount) : null;
  const isBudgetLow = hasBudgetGoal && (budgetVal <= 200 || !budgetVal);

  if (isBudgetLow) {
    recommendations.push({
      id: 'food-budget-cheap',
      title: 'Focus on affordable local ingredients',
      category: 'Budget',
      reason: `You are optimizing meals for a lower budget (approx. ₹${budgetVal || 150} target).`,
      action: 'Build meals around whole local foods like poha, dal-rice, roti-sabzi, roasted chana, peanuts, bananas, and seasonal vegetables rather than processed protein items.',
      priority: 'High',
      difficulty: 'Easy',
      estimatedTime: '15 mins',
      source: 'Preferences'
    });
  }

  // Hostel/PG rules
  const living = preferences.livingType || '';
  const cooking = preferences.cookingAccess || '';
  const isHostel = living === 'Hostel' || living === 'PG' || cooking === 'No kitchen' || cooking === 'Mess/tiffin dependent';

  if (isHostel) {
    recommendations.push({
      id: 'food-living-hostel',
      title: 'Optimize hostel snack habits',
      category: 'Food',
      reason: 'Hostel/PG living or lack of kitchen access limits fresh cooking opportunities.',
      action: 'Keep portable non-perishable budget items like roasted chana, peanuts, bananas, or curd in your room to supplement mess meals.',
      priority: 'Medium',
      difficulty: 'Easy',
      estimatedTime: '5 mins',
      source: 'Preferences'
    });
  }

  // 2. Sleep Rules
  const sleepGoal = goalsList.includes('Sleep better');
  const weeklySleepQuality = latestWeeklyCheckin?.sleepQuality || 'Good';
  const isSleepPoor = sleepGoal || weeklySleepQuality === 'Poor' || weeklySleepQuality === 'Okay';

  if (isSleepPoor) {
    recommendations.push({
      id: 'sleep-bedtime',
      title: 'Maintain a bedtime routine',
      category: 'Sleep',
      reason: 'Sleep quality reports suggest room for recovery, or sleep improvement is a target goal.',
      action: `Aim for a bedtime target ${preferences.sleepTarget ? `(${preferences.sleepTarget})` : 'before 11 PM'}, shut off screens 1 hour before sleep, and avoid caffeine after 2 PM.`,
      priority: 'High',
      difficulty: 'Medium',
      estimatedTime: '1 hour',
      source: 'Routine'
    });
  }

  // 3. Stress Rules
  const stressGoal = goalsList.includes('Reduce stress');
  const stressVal = latestWellnessCheck?.input?.stressLevel || 0;
  const isStressHigh = stressGoal || stressVal >= 7 || latestWeeklyCheckin?.stressLevel === 'High' || latestWeeklyCheckin?.stressLevel === 'Very high';

  if (isStressHigh) {
    recommendations.push({
      id: 'stress-reset',
      title: 'Try a 5-minute stress reset',
      category: 'Stress',
      reason: 'Elevated stress levels are reported or stress reduction is one of your focus goals.',
      action: 'Perform a 5-minute box breathing routine (inhale 4s, hold 4s, exhale 4s, hold 4s) or go for a phone-free walk outside.',
      priority: 'High',
      difficulty: 'Easy',
      estimatedTime: '5 mins',
      source: 'Wellness Check'
    });
  }

  // 4. Activity Rules
  const activity = preferences.activityLevel || '';
  const walkCount = habitStats?.walkCompletionDays || 0;
  const isSedentary = activity === 'Mostly sitting' || activity.includes('sedentary') || (habitStats.loggedDaysCount > 0 && walkCount < 3);

  if (isSedentary) {
    recommendations.push({
      id: 'activity-movement',
      title: 'Incorporate post-meal movement',
      category: 'Activity',
      reason: 'Your daily routine involves mostly sitting or physical activity habits are under-logged.',
      action: 'Take a 10-minute walk after lunch or dinner and stand up to stretch for 1 minute every hour.',
      priority: 'High',
      difficulty: 'Easy',
      estimatedTime: '10 mins',
      source: 'Routine'
    });
  }

  // 5. Screen Balance Rules
  const screenTime = latestWeeklyCheckin?.screenTime || 'Normal';
  const screenHoursVal = latestWellnessCheck?.input?.screenHours || 0;
  const isScreenHigh = screenHoursVal >= 8 || screenTime === 'High' || screenTime === 'Very high';

  if (isScreenHigh) {
    recommendations.push({
      id: 'screen-rest',
      title: 'Practice eye rest intervals',
      category: 'Screen Balance',
      reason: 'Log updates show high daily screen exposure.',
      action: 'Try the 20-20-20 rule (look at something 20 feet away for 20 seconds every 20 minutes) and keep devices out of bed 30 minutes before sleep.',
      priority: 'Medium',
      difficulty: 'Easy',
      estimatedTime: '5 mins',
      source: 'Wellness Check'
    });
  }

  // 6. Consistency Rules
  const habitsLogged = habitStats?.loggedDaysCount || 0;
  const habitsRate = habitStats?.overallCompletionRate || 0;
  const isConsistencyLow = habitsLogged > 0 && habitsRate < 50;

  if (isConsistencyLow) {
    recommendations.push({
      id: 'consistency-habits',
      title: 'Focus on baseline habits first',
      category: 'Consistency',
      reason: 'Habit compliance check shows a completion rate below 50%.',
      action: 'Pick only one or two simple habits (like the Water + Walk combination) and build a daily streak before logging more.',
      priority: 'High',
      difficulty: 'Easy',
      estimatedTime: '15 mins',
      source: 'Habits'
    });
  }

  // 7. Hydration Rules
  const waterCount = habitStats?.waterCompletionDays || 0;
  const waterLiters = latestWellnessCheck?.input?.waterIntake || 3;
  const isHydrationLow = waterLiters < 2.5 || (habitsLogged > 0 && waterCount < 3);

  if (isHydrationLow) {
    recommendations.push({
      id: 'hydration-water',
      title: 'Establish structured hydration',
      category: 'Hydration',
      reason: 'Daily water intake levels are lower than recommended, or hydration habits are under-logged.',
      action: 'Keep a reusable water bottle at your desk, drink a glass immediately after waking, and before each meal.',
      priority: 'High',
      difficulty: 'Easy',
      estimatedTime: '2 mins',
      source: 'Habits'
    });
  }

  // Calculate focus area based on strongest need
  let focusArea = 'General Wellness';
  let summary = 'Keep tracking your daily routine and meals to unlock further personalized wellness insights.';

  if (isStressHigh) {
    focusArea = 'Stress Reset';
    summary = 'Your logs indicate elevated stress. Prioritize breathing resets, phone-free breaks, and sleep hygiene.';
  } else if (isBudgetLow) {
    focusArea = 'Budget Nutrition';
    summary = 'Your budget is a primary factor. Focus on low-cost high-protein ingredients like lentils, sprouts, and peanuts.';
  } else if (isSleepPoor) {
    focusArea = 'Sleep Consistency';
    summary = 'Your sleep quality is irregular. Aim for a fixed bedtime and phone-free wind-down routine.';
  } else if (isSedentary) {
    focusArea = 'Daily Movement';
    summary = 'Activity level is sedentary. Incorporate simple habits like post-meal walks and desk stretching.';
  } else if (isConsistencyLow) {
    focusArea = 'Habit Consistency';
    summary = 'Focus on locking in one or two starter habits like hydration and stepping rather than completing everything.';
  } else if (isScreenHigh) {
    focusArea = 'Screen Balance';
    summary = 'Elevated screen time detected. Safeguard your eyes with 20-20-20 intervals and device-free bedtimes.';
  }

  return {
    focusArea,
    summary,
    recommendations
  };
};
