/**
 * Rule-Based Risk Calculator
 * 
 * Produces output in ML-compatible format:
 * { level, score, confidence, factors[], explanation }
 * 
 * Can be seamlessly replaced with ML API call later.
 */

const calculateBMI = (weight, height) => {
  // height in cm, weight in kg
  const heightM = height / 100;
  return +(weight / (heightM * heightM)).toFixed(1);
};

const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const calculateRisk = (healthData, user) => {
  let score = 0;
  const factors = [];

  const bmi = calculateBMI(user.weight, user.height);

  // Sleep analysis (0-25 points)
  if (healthData.sleepHours < 5) {
    score += 25;
    factors.push({
      factor: 'Critical Sleep Deficit',
      impact: '+25%',
      detail: `Only ${healthData.sleepHours}hrs sleep — severely increases health risks`,
      severity: 'critical'
    });
  } else if (healthData.sleepHours < 6) {
    score += 20;
    factors.push({
      factor: 'Low Sleep Duration',
      impact: '+20%',
      detail: `${healthData.sleepHours}hrs sleep — below recommended 7-9 hours`,
      severity: 'high'
    });
  } else if (healthData.sleepHours < 7) {
    score += 10;
    factors.push({
      factor: 'Slightly Low Sleep',
      impact: '+10%',
      detail: `${healthData.sleepHours}hrs sleep — close to minimum recommended`,
      severity: 'medium'
    });
  }

  // Stress analysis (0-25 points)
  if (healthData.stressLevel >= 9) {
    score += 25;
    factors.push({
      factor: 'Extreme Stress',
      impact: '+25%',
      detail: `Stress level ${healthData.stressLevel}/10 — seek immediate stress management`,
      severity: 'critical'
    });
  } else if (healthData.stressLevel >= 7) {
    score += 20;
    factors.push({
      factor: 'High Stress',
      impact: '+20%',
      detail: `Stress level ${healthData.stressLevel}/10 — significantly elevates health risk`,
      severity: 'high'
    });
  } else if (healthData.stressLevel >= 5) {
    score += 10;
    factors.push({
      factor: 'Moderate Stress',
      impact: '+10%',
      detail: `Stress level ${healthData.stressLevel}/10 — consider relaxation techniques`,
      severity: 'medium'
    });
  }

  // Exercise analysis (0-20 points)
  if (healthData.exerciseMinutes < 10) {
    score += 20;
    factors.push({
      factor: 'Sedentary Lifestyle',
      impact: '+20%',
      detail: `Only ${healthData.exerciseMinutes}min exercise — far below 30min recommended`,
      severity: 'high'
    });
  } else if (healthData.exerciseMinutes < 20) {
    score += 15;
    factors.push({
      factor: 'Low Physical Activity',
      impact: '+15%',
      detail: `${healthData.exerciseMinutes}min exercise — below 30min daily recommended`,
      severity: 'medium'
    });
  } else if (healthData.exerciseMinutes < 30) {
    score += 5;
    factors.push({
      factor: 'Below Target Activity',
      impact: '+5%',
      detail: `${healthData.exerciseMinutes}min exercise — almost at recommended level`,
      severity: 'low'
    });
  }

  // BMI analysis (0-15 points)
  if (bmi >= 35) {
    score += 15;
    factors.push({
      factor: 'Severely High BMI',
      impact: '+15%',
      detail: `BMI ${bmi} (${getBMICategory(bmi)}) — significant health risk factor`,
      severity: 'critical'
    });
  } else if (bmi >= 30) {
    score += 12;
    factors.push({
      factor: 'High BMI',
      impact: '+12%',
      detail: `BMI ${bmi} (${getBMICategory(bmi)}) — elevated risk for chronic diseases`,
      severity: 'high'
    });
  } else if (bmi >= 25) {
    score += 5;
    factors.push({
      factor: 'Elevated BMI',
      impact: '+5%',
      detail: `BMI ${bmi} (${getBMICategory(bmi)}) — slight risk increase`,
      severity: 'medium'
    });
  } else if (bmi < 18.5) {
    score += 8;
    factors.push({
      factor: 'Underweight BMI',
      impact: '+8%',
      detail: `BMI ${bmi} (${getBMICategory(bmi)}) — may indicate nutritional deficiency`,
      severity: 'medium'
    });
  }

  // Smoking (0-15 points)
  if (healthData.smoking) {
    score += 15;
    factors.push({
      factor: 'Smoking',
      impact: '+15%',
      detail: 'Active smoker — major risk factor for heart & lung disease',
      severity: 'critical'
    });
  }

  // Alcohol (0-10 points)
  if (healthData.alcohol) {
    score += 10;
    factors.push({
      factor: 'Alcohol Consumption',
      impact: '+10%',
      detail: 'Regular alcohol use — increases liver and cardiovascular risk',
      severity: 'high'
    });
  }

  // Diet analysis (0-10 points)
  if (healthData.dietType === 'junk') {
    score += 10;
    factors.push({
      factor: 'Poor Diet Quality',
      impact: '+10%',
      detail: 'Junk food diet — increases risk for obesity, diabetes, heart disease',
      severity: 'high'
    });
  }

  // Water intake (0-5 points)
  if (healthData.waterIntake < 4) {
    score += 5;
    factors.push({
      factor: 'Low Water Intake',
      impact: '+5%',
      detail: `Only ${healthData.waterIntake}L water — below recommended 2-3L daily`,
      severity: 'medium'
    });
  }

  // Steps analysis (0-10 points)
  if (healthData.steps < 3000) {
    score += 10;
    factors.push({
      factor: 'Very Low Step Count',
      impact: '+10%',
      detail: `Only ${healthData.steps} steps — far below 8,000-10,000 recommended`,
      severity: 'high'
    });
  } else if (healthData.steps < 5000) {
    score += 5;
    factors.push({
      factor: 'Low Step Count',
      impact: '+5%',
      detail: `${healthData.steps} steps — below recommended daily target`,
      severity: 'medium'
    });
  }

  // Normalize score to max 100
  score = Math.min(score, 100);

  // Determine risk level
  let level;
  if (score >= 60) level = 'High';
  else if (score >= 30) level = 'Medium';
  else level = 'Low';

  // Calculate pseudo-confidence (higher with more data points showing risk)
  const confidence = +(0.65 + (factors.length * 0.04)).toFixed(2);

  // Generate explanation string
  const topFactors = factors
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 3)
    .map(f => f.factor)
    .join(' + ');

  return {
    level,
    score,
    confidence: Math.min(confidence, 0.95),
    factors,
    explanation: topFactors ? `Key risk drivers: ${topFactors}` : 'No significant risk factors detected',
    bmi,
    bmiCategory: getBMICategory(bmi),
    assessedAt: new Date().toISOString()
  };
};

module.exports = { calculateRisk, calculateBMI, getBMICategory };
