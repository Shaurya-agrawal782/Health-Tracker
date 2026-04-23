/**
 * Logic-Driven Recommendation Engine
 * 
 * Generates personalized health recommendations based on
 * user's health data and calculated risk factors.
 */

const generateRecommendations = (healthData, riskResult, user) => {
  const recommendations = [];

  // ===== SLEEP RECOMMENDATIONS =====
  if (healthData.sleepHours < 6) {
    recommendations.push({
      title: 'Improve Sleep Duration',
      category: 'sleep',
      priority: 'high',
      reason: `You're getting only ${healthData.sleepHours} hours of sleep. Adults need 7-9 hours for optimal health.`,
      actions: [
        'Set a consistent bedtime alarm 8 hours before your wake time',
        'Avoid screens (phone, laptop) 1 hour before bed',
        'Keep your bedroom dark and cool (18-20°C)',
        'Avoid caffeine after 2 PM',
        'Try a relaxing bedtime routine: reading, stretching, or meditation'
      ],
      icon: '🌙'
    });
  } else if (healthData.sleepHours < 7) {
    recommendations.push({
      title: 'Optimize Sleep Quality',
      category: 'sleep',
      priority: 'medium',
      reason: `You're sleeping ${healthData.sleepHours} hours — close to minimum. Aim for 7-9 hours.`,
      actions: [
        'Try going to bed 30 minutes earlier',
        'Maintain consistent sleep/wake times on weekends',
        'Consider magnesium-rich foods in the evening'
      ],
      icon: '🌙'
    });
  }

  // ===== EXERCISE RECOMMENDATIONS =====
  if (healthData.exerciseMinutes < 15) {
    recommendations.push({
      title: 'Start Moving More',
      category: 'exercise',
      priority: 'high',
      reason: `Only ${healthData.exerciseMinutes} minutes of exercise today. WHO recommends at least 30 minutes daily.`,
      actions: [
        'Start with a 15-minute walk after lunch or dinner',
        'Take stairs instead of elevators',
        'Do 5-minute stretching breaks every 2 hours',
        'Try a beginner YouTube workout (yoga, HIIT, or dance)',
        'Set hourly movement reminders on your phone'
      ],
      icon: '🏃'
    });
  } else if (healthData.exerciseMinutes < 30) {
    recommendations.push({
      title: 'Increase Exercise Duration',
      category: 'exercise',
      priority: 'medium',
      reason: `${healthData.exerciseMinutes} minutes of exercise — good start! Aim for 30+ minutes.`,
      actions: [
        'Add 10 more minutes to your current routine',
        'Try interval training for higher calorie burn',
        'Include strength exercises 2-3 times per week'
      ],
      icon: '🏃'
    });
  }

  // ===== STEP COUNT RECOMMENDATIONS =====
  if (healthData.steps < 5000) {
    recommendations.push({
      title: 'Increase Daily Steps',
      category: 'exercise',
      priority: healthData.steps < 3000 ? 'high' : 'medium',
      reason: `${healthData.steps} steps today — target is 8,000-10,000 steps daily.`,
      actions: [
        'Take a 10-minute walk after each meal',
        'Walk while taking phone calls',
        'Park farther from entrances',
        'Use a step tracker app for motivation'
      ],
      icon: '👟'
    });
  }

  // ===== STRESS MANAGEMENT =====
  if (healthData.stressLevel >= 7) {
    recommendations.push({
      title: 'Manage Your Stress',
      category: 'stress',
      priority: 'high',
      reason: `Stress level ${healthData.stressLevel}/10 is dangerously high. Chronic stress weakens immunity and increases heart disease risk.`,
      actions: [
        'Practice deep breathing exercises (4-7-8 technique)',
        'Try 10 minutes of guided meditation (Headspace, Calm)',
        'Spend time in nature — even a short park walk helps',
        'Talk to a friend, family member, or counselor',
        'Limit news and social media consumption',
        'Journal your thoughts for 5 minutes before bed'
      ],
      icon: '🧘'
    });
  } else if (healthData.stressLevel >= 5) {
    recommendations.push({
      title: 'Keep Stress in Check',
      category: 'stress',
      priority: 'medium',
      reason: `Stress level ${healthData.stressLevel}/10 — moderate but worth addressing.`,
      actions: [
        'Take short mindfulness breaks during work',
        'Practice progressive muscle relaxation',
        'Ensure you have a hobby or relaxation activity'
      ],
      icon: '🧘'
    });
  }

  // ===== DIET RECOMMENDATIONS =====
  if (healthData.dietType === 'junk') {
    recommendations.push({
      title: 'Improve Your Diet',
      category: 'diet',
      priority: 'high',
      reason: 'Junk food diets are linked to obesity, diabetes, and heart disease.',
      actions: [
        'Replace one junk meal with a home-cooked meal daily',
        'Add fruits and vegetables to every meal',
        'Reduce sugar-sweetened beverages',
        'Prep healthy snacks: nuts, fruits, yogurt',
        'Follow the plate method: ½ veggies, ¼ protein, ¼ grains'
      ],
      icon: '🥗'
    });
  }

  if (healthData.dietType === 'non-vegetarian') {
    recommendations.push({
      title: 'Balance Your Non-Veg Diet',
      category: 'diet',
      priority: 'low',
      reason: 'Non-vegetarian diets are fine but need balance for heart health.',
      actions: [
        'Include fish (omega-3 rich) at least twice a week',
        'Limit red and processed meat',
        'Add leafy greens with every non-veg meal'
      ],
      icon: '🥩'
    });
  }

  // ===== HYDRATION =====
  if (healthData.waterIntake < 4) {
    recommendations.push({
      title: 'Drink More Water',
      category: 'diet',
      priority: healthData.waterIntake < 2 ? 'high' : 'medium',
      reason: `Only ${healthData.waterIntake}L water today. Dehydration affects energy, focus, and organ function.`,
      actions: [
        'Keep a water bottle at your desk and refill it',
        'Drink a glass of water before every meal',
        'Set hourly water reminders on your phone',
        'Add lemon or cucumber for flavor if plain water bores you'
      ],
      icon: '💧'
    });
  }

  // ===== SMOKING =====
  if (healthData.smoking) {
    recommendations.push({
      title: 'Quit Smoking',
      category: 'lifestyle',
      priority: 'critical',
      reason: 'Smoking is the #1 preventable cause of death. It damages every organ in your body.',
      actions: [
        'Consult a doctor about nicotine replacement therapy',
        'Identify your triggers and plan alternatives',
        'Try the "delay and distract" technique for cravings',
        'Join a quit-smoking support group',
        'Download a quit-smoking tracker app'
      ],
      icon: '🚭'
    });
  }

  // ===== ALCOHOL =====
  if (healthData.alcohol) {
    recommendations.push({
      title: 'Reduce Alcohol Intake',
      category: 'lifestyle',
      priority: 'high',
      reason: 'Regular alcohol consumption increases liver disease and cardiovascular risks.',
      actions: [
        'Set alcohol-free days (aim for 4+ per week)',
        'Switch to low-alcohol or non-alcoholic alternatives',
        'Don\'t drink on an empty stomach',
        'Track your intake to build awareness'
      ],
      icon: '🍷'
    });
  }

  // ===== BMI-BASED =====
  const bmi = user.weight / ((user.height / 100) ** 2);
  if (bmi >= 30) {
    recommendations.push({
      title: 'Address Your Weight',
      category: 'diet',
      priority: 'high',
      reason: `Your BMI is ${bmi.toFixed(1)} (Obese). This increases risk for diabetes, heart disease, and joint problems.`,
      actions: [
        'Consult a nutritionist for a personalized meal plan',
        'Aim for gradual weight loss: 0.5-1 kg per week',
        'Combine cardio and strength training',
        'Track your calorie intake with an app',
        'Focus on whole foods over processed foods'
      ],
      icon: '⚖️'
    });
  } else if (bmi >= 25) {
    recommendations.push({
      title: 'Maintain Healthy Weight',
      category: 'diet',
      priority: 'medium',
      reason: `Your BMI is ${bmi.toFixed(1)} (Overweight). Small changes can bring it to a healthy range.`,
      actions: [
        'Reduce portion sizes by 10-15%',
        'Choose water or tea over sugary drinks',
        'Add 20 minutes of walking to your daily routine'
      ],
      icon: '⚖️'
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
};

module.exports = { generateRecommendations };
