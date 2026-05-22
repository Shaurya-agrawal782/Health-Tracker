// Daily Wellness Actions Generator for VitalIQ Health

const ACTION_TEMPLATES = {
  // Starter actions
  water_starter: {
    id: 'water_starter',
    title: 'Drink 2 extra glasses of water today',
    category: 'Hydration',
    reason: 'Proper hydration supports daily energy, metabolism, and focus.',
    estimatedTime: '2 mins',
    difficulty: 'Easy'
  },
  walk_meal_starter: {
    id: 'walk_meal_starter',
    title: 'Take a 10-minute walk after a meal',
    category: 'Activity',
    reason: 'A short walk post-meal helps clear blood glucose and supports smooth digestion.',
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  },
  screen_break_starter: {
    id: 'screen_break_starter',
    title: 'Take a 5-minute screen break',
    category: 'Screen Balance',
    reason: 'Resting your eyes from digital displays reduces eye fatigue and mental strain.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  protein_starter: {
    id: 'protein_starter',
    title: 'Add one affordable protein source to a meal',
    category: 'Food',
    reason: 'Budget-friendly protein helps keep you full and maintains muscle wellness.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  sleep_target_starter: {
    id: 'sleep_target_starter',
    title: 'Set a realistic sleep target for tonight',
    category: 'Sleep',
    reason: 'A fixed target helps set your body clock and improves nighttime rest.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },

  // Sleep Goals
  sleep_avoid_screens: {
    id: 'sleep_avoid_screens',
    title: 'Avoid screens 30 minutes before sleep',
    category: 'Sleep',
    reason: 'Reducing blue light exposure before bedtime helps support natural melatonin levels.',
    estimatedTime: '30 mins',
    difficulty: 'Medium'
  },
  sleep_bedtime_reminder: {
    id: 'sleep_bedtime_reminder',
    title: 'Set a bedtime reminder',
    category: 'Sleep',
    reason: 'A daily alert helps you build a consistent wind-down routine.',
    estimatedTime: '2 mins',
    difficulty: 'Easy'
  },
  sleep_caffeine_cutoff: {
    id: 'sleep_caffeine_cutoff',
    title: 'Keep caffeine earlier in the day',
    category: 'Sleep',
    reason: 'Avoiding caffeine in the afternoon helps protect your deep sleep cycles.',
    estimatedTime: '1 min',
    difficulty: 'Easy'
  },

  // Stress Goals
  stress_breathing: {
    id: 'stress_breathing',
    title: 'Do a 5-minute breathing reset',
    category: 'Stress',
    reason: 'Simple breathing cycles help lower heart rate and reduce active stress.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  stress_walk_unplugged: {
    id: 'stress_walk_unplugged',
    title: 'Take one short walk without phone',
    category: 'Stress',
    reason: 'Walking unplugged allows your mind to rest and reduces mental noise.',
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  },
  stress_write_tasks: {
    id: 'stress_write_tasks',
    title: 'Write down one task for tomorrow',
    category: 'Stress',
    reason: 'Planning ahead clears your mind and minimizes bedtime worry.',
    estimatedTime: '3 mins',
    difficulty: 'Easy'
  },

  // Budget Healthy
  budget_protein_veg: {
    id: 'budget_protein_veg',
    title: 'Add sprouts, dal, curd, or roasted chana to a meal',
    category: 'Food',
    reason: 'Affordable vegetarian options provide high-yield daily protein support.',
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  },
  budget_protein_vegan: {
    id: 'budget_protein_vegan',
    title: 'Add roasted chana, sprouts, or peanuts to a meal',
    category: 'Food',
    reason: 'Plant-based, low-cost proteins keep your nutrition optimal.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  budget_protein_nonveg: {
    id: 'budget_protein_nonveg',
    title: 'Add boiled eggs, sprouts, or curd to a meal',
    category: 'Food',
    reason: 'Egg and dairy sources provide complete proteins on a modest budget.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  budget_follow_meal: {
    id: 'budget_follow_meal',
    title: 'Follow one budget meal from your meal plan',
    category: 'Food',
    reason: 'Eating planned meals keeps your food budget on track.',
    estimatedTime: '20 mins',
    difficulty: 'Medium'
  },
  budget_swap_snack: {
    id: 'budget_swap_snack',
    title: 'Replace one packaged snack with fruit, chana, or peanuts',
    category: 'Food',
    reason: 'Whole foods are cheaper, more filling, and better for energy consistency.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },

  // Student
  student_water: {
    id: 'student_water',
    title: 'Take a water bottle to class',
    category: 'Hydration',
    reason: 'Staying hydrated keeps your brain focused during lectures.',
    estimatedTime: '2 mins',
    difficulty: 'Easy'
  },
  student_walk: {
    id: 'student_walk',
    title: 'Walk 10 minutes after study session',
    category: 'Activity',
    reason: 'Short active breaks refresh cognitive performance and relieve desk fatigue.',
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  },
  student_breakfast: {
    id: 'student_breakfast',
    title: 'Avoid skipping breakfast before college',
    category: 'Food',
    reason: 'A proper morning meal fuels attention span and daily energy levels.',
    estimatedTime: '15 mins',
    difficulty: 'Medium'
  },

  // Working Professional
  pro_stretch: {
    id: 'pro_stretch',
    title: 'Take a 2-minute stretch break every 2–3 hours',
    category: 'Activity',
    reason: 'Stretching regularly releases muscle tension from sitting.',
    estimatedTime: '2 mins',
    difficulty: 'Easy'
  },
  pro_lunch_walk: {
    id: 'pro_lunch_walk',
    title: 'Walk after lunch',
    category: 'Activity',
    reason: 'A brief post-lunch stroll helps ward off afternoon drowsiness.',
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  },
  pro_no_heavy_late: {
    id: 'pro_no_heavy_late',
    title: 'Avoid late-night heavy snacks',
    category: 'Food',
    reason: 'Avoiding heavy foods before bed supports deep sleep and metabolism.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },

  // Sedentary activity
  sedentary_hourly: {
    id: 'sedentary_hourly',
    title: 'Stand or walk for 5 minutes every hour',
    category: 'Activity',
    reason: 'Breaking up sitting time improves vascular health and calorie burn.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  sedentary_dinner_walk: {
    id: 'sedentary_dinner_walk',
    title: 'Take a 10-minute walk after dinner',
    category: 'Activity',
    reason: 'An evening walk helps digest your dinner and supports blood sugar wellness.',
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  },

  // High Screen Time
  screen_20_20_20: {
    id: 'screen_20_20_20',
    title: 'Follow 20-20-20 eye break once today',
    category: 'Screen Balance',
    reason: 'Every 20 minutes, look at an object 20 feet away for 20 seconds.',
    estimatedTime: '1 min',
    difficulty: 'Easy'
  },
  screen_phone_away: {
    id: 'screen_phone_away',
    title: 'Keep phone away 30 minutes before sleep',
    category: 'Screen Balance',
    reason: 'Keeping screens out of reach helps clear the mind for rest.',
    estimatedTime: '30 mins',
    difficulty: 'Medium'
  },

  // Hostel/PG living
  hostel_boost_meal: {
    id: 'hostel_boost_meal',
    title: 'Add curd, banana, chana, or peanuts to your regular meal',
    category: 'Food',
    reason: 'Nutritional additions improve the quality of mess or hostel food.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  hostel_healthy_snack: {
    id: 'hostel_healthy_snack',
    title: 'Keep one healthy snack in your room',
    category: 'Food',
    reason: 'Having high-quality snacks on hand helps avoid late-night junk food orders.',
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  },
  hostel_water_pre_snack: {
    id: 'hostel_water_pre_snack',
    title: 'Drink water before evening snacks',
    category: 'Hydration',
    reason: 'Hydrating first helps distinguish hunger from thirst, avoiding empty calories.',
    estimatedTime: '1 min',
    difficulty: 'Easy'
  }
};

/**
 * Generates a list of 3-5 daily actions based on onboarding preferences and wellness check results.
 * If data is missing or incomplete, falls back to starter actions.
 * Ensures exactly 5 actions are returned for a robust layout.
 *
 * @param {Object} prefs Onboarding preferences
 * @param {Object} latestCheck Latest wellness screening check (from predictAPI)
 * @returns {Array} List of daily actions
 */
export function generateDailyActions(prefs = {}, latestCheck = null) {
  const candidates = [];
  const foodPref = prefs.foodPreference || latestCheck?.input?.foodPreference || 'Vegetarian';

  // 1. Goal-Based Rules
  if (prefs.goals?.includes('Sleep better') || latestCheck?.input?.sleepHours < 7) {
    candidates.push(ACTION_TEMPLATES.sleep_avoid_screens);
    candidates.push(ACTION_TEMPLATES.sleep_bedtime_reminder);
    candidates.push(ACTION_TEMPLATES.sleep_caffeine_cutoff);
  }

  if (prefs.goals?.includes('Reduce stress') || latestCheck?.input?.stressLevel === 'High' || latestCheck?.input?.stressLevel === 'Very high') {
    candidates.push(ACTION_TEMPLATES.stress_breathing);
    candidates.push(ACTION_TEMPLATES.stress_walk_unplugged);
    candidates.push(ACTION_TEMPLATES.stress_write_tasks);
  }

  if (prefs.goals?.includes('Eat healthy within budget') || prefs.budgetAmount || prefs.budgetLevel) {
    if (foodPref === 'Vegan') {
      candidates.push(ACTION_TEMPLATES.budget_protein_vegan);
    } else if (foodPref === 'Non-vegetarian' || foodPref === 'Eggetarian') {
      candidates.push(ACTION_TEMPLATES.budget_protein_nonveg);
    } else {
      candidates.push(ACTION_TEMPLATES.budget_protein_veg);
    }
    candidates.push(ACTION_TEMPLATES.budget_follow_meal);
    candidates.push(ACTION_TEMPLATES.budget_swap_snack);
  }

  // 2. User Type Rules
  if (prefs.userType === 'Student') {
    candidates.push(ACTION_TEMPLATES.student_water);
    candidates.push(ACTION_TEMPLATES.student_walk);
    candidates.push(ACTION_TEMPLATES.student_breakfast);
  } else if (prefs.userType === 'Working Professional') {
    candidates.push(ACTION_TEMPLATES.pro_stretch);
    candidates.push(ACTION_TEMPLATES.pro_lunch_walk);
    candidates.push(ACTION_TEMPLATES.pro_no_heavy_late);
  }

  // 3. Activity Level Rules
  const actLevel = prefs.activityLevel || latestCheck?.input?.activity_level;
  if (actLevel && (actLevel.includes('Sedentary') || actLevel === 'Mostly sitting')) {
    candidates.push(ACTION_TEMPLATES.sedentary_hourly);
    candidates.push(ACTION_TEMPLATES.sedentary_dinner_walk);
  }

  // 4. Screen Time Rules
  const screenVal = latestCheck?.input?.screenHours || latestCheck?.input?.screen || prefs.screenHours;
  if (screenVal >= 6) {
    candidates.push(ACTION_TEMPLATES.screen_20_20_20);
    candidates.push(ACTION_TEMPLATES.screen_phone_away);
  }

  // 5. Living Type Rules
  const living = prefs.livingType;
  if (living === 'Hostel' || living === 'PG' || living?.includes('Hostel') || living?.includes('PG')) {
    candidates.push(ACTION_TEMPLATES.hostel_boost_meal);
    candidates.push(ACTION_TEMPLATES.hostel_healthy_snack);
    candidates.push(ACTION_TEMPLATES.hostel_water_pre_snack);
  }

  // Deduplicate candidates
  const uniqueCandidatesMap = new Map();
  candidates.forEach(c => uniqueCandidatesMap.set(c.id, c));
  let uniqueCandidates = Array.from(uniqueCandidatesMap.values());

  // Diversity selection: Group candidates by category
  const categoriesMap = {};
  uniqueCandidates.forEach(c => {
    if (!categoriesMap[c.category]) {
      categoriesMap[c.category] = [];
    }
    categoriesMap[c.category].push(c);
  });

  const selectedActions = [];
  const categoryNames = Object.keys(categoriesMap);

  // Round-robin selection across categories to ensure maximum category diversity
  let added = true;
  while (selectedActions.length < 5 && added) {
    added = false;
    for (const cat of categoryNames) {
      if (selectedActions.length >= 5) break;
      if (categoriesMap[cat].length > 0) {
        selectedActions.push(categoriesMap[cat].shift());
        added = true;
      }
    }
  }

  // Backfill with starter actions if we have fewer than 5 actions
  const starters = [
    ACTION_TEMPLATES.water_starter,
    ACTION_TEMPLATES.walk_meal_starter,
    ACTION_TEMPLATES.screen_break_starter,
    ACTION_TEMPLATES.protein_starter,
    ACTION_TEMPLATES.sleep_target_starter
  ];

  for (const starter of starters) {
    if (selectedActions.length >= 5) break;
    // Don't add if already exists (match by id or similar title)
    if (!selectedActions.some(a => a.id === starter.id || a.title === starter.title)) {
      selectedActions.push(starter);
    }
  }

  // Add metadata fields required by card structure
  const todayStr = new Date().toISOString().split('T')[0];
  return selectedActions.map(action => ({
    ...action,
    completed: false,
    createdDate: todayStr
  }));
}
