import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { predictAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiAlertTriangle, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiZap,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { generateDailyActions } from '../utils/actionGenerator';

const firstProvided = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

const hasAdvancedMetrics = (input) => {
  if (!input) return false;
  if (input.advancedMetricsProvided !== undefined) {
    return input.advancedMetricsProvided === true || input.advancedMetricsProvided === 'true';
  }
  const bpProvided = input.bloodPressure != null && input.bloodPressure !== '';
  const glucoseProvided = input.glucose != null && input.glucose !== 100; 
  return bpProvided || glucoseProvided;
};

const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `vitaliq_daily_actions_${year}-${month}-${day}`;
};

const getFriendlyExplanation = (input) => {
  if (!input) return "Your lifestyle routine is mostly balanced. Check out your personalized next steps below.";
  const issues = [];
  
  const sleepVal = input.sleepHours !== undefined ? input.sleepHours : input.sleep;
  if (sleepVal !== undefined && sleepVal !== null && sleepVal !== '') {
    if (parseFloat(sleepVal) < 7) {
      issues.push("sleep");
    }
  }
  
  const screenVal = input.screenHours !== undefined ? input.screenHours : input.screen;
  if (screenVal !== undefined && screenVal !== null && screenVal !== '') {
    if (parseFloat(screenVal) > 8) {
      issues.push("screen time");
    }
  }
  
  const workVal = input.workHours !== undefined ? input.workHours : input.work;
  if (workVal !== undefined && workVal !== null && workVal !== '') {
    if (parseFloat(workVal) > 9) {
      issues.push("work hours");
    }
  }
  
  const activityVal = input.dailyActivityMinutes !== undefined ? input.dailyActivityMinutes : input.daily_activity;
  if (activityVal !== undefined && activityVal !== null && activityVal !== '') {
    if (parseFloat(activityVal) < 30) {
      issues.push("activity level");
    }
  }
  
  const stressVal = input.stressLevel !== undefined ? input.stressLevel : input.stress_level;
  if (stressVal === 'High' || stressVal === 'Very high') {
    issues.push("stress levels");
  }
  
  if (issues.length === 0) {
    return "Your routine looks beautifully balanced! Explore minor habits below to optimize your daily wellness.";
  } else if (issues.length === 1) {
    return `Your routine looks mostly balanced, but ${issues[0]} may need attention.`;
  } else if (issues.length === 2) {
    return `Your routine looks mostly balanced, but ${issues[0]} and ${issues[1]} may need attention.`;
  } else {
    return `Your routine looks mostly balanced, but a few areas like ${issues.slice(0, -1).join(', ')}, and ${issues[issues.length - 1]} may need attention.`;
  }
};

const getWhyReasons = (input, results) => {
  const reasons = [];

  // 1. Sleep
  const sleepVal = input?.sleepHours !== undefined ? input.sleepHours : input?.sleep;
  if (sleepVal !== undefined && sleepVal !== null && sleepVal !== '') {
    const hours = parseFloat(sleepVal);
    if (hours < 6) {
      reasons.push({
        title: 'Sleep Routine',
        value: `${hours} hours`,
        explanation: 'Your sleep duration is lower than recommended, which may affect daytime alertness and physical recovery.',
        icon: '😴',
        status: 'warning'
      });
    } else if (hours < 7) {
      reasons.push({
        title: 'Sleep Routine',
        value: `${hours} hours`,
        explanation: 'Getting 6–7 hours is close to recommended levels, but aiming for 7–8 hours could improve restfulness.',
        icon: '😴',
        status: 'info'
      });
    } else {
      reasons.push({
        title: 'Sleep Routine',
        value: `${hours} hours`,
        explanation: 'Great sleep duration! Getting 7–9 hours supports metabolic health and daily recovery.',
        icon: '😴',
        status: 'success'
      });
    }
  }

  // 2. Stress
  const stressVal = input?.stressLevel !== undefined ? input.stressLevel : input?.stress_level;
  if (stressVal) {
    if (stressVal === 'High' || stressVal === 'Very high') {
      reasons.push({
        title: 'Stress Level',
        value: stressVal,
        explanation: 'High stress can raise cortisol levels, affecting sleep quality and blood pressure patterns.',
        icon: '🧠',
        status: 'warning'
      });
    } else if (stressVal === 'Medium') {
      reasons.push({
        title: 'Stress Level',
        value: stressVal,
        explanation: 'Moderate stress is manageable, but routine relaxation breaks will help keep it in balance.',
        icon: '🧠',
        status: 'info'
      });
    } else {
      reasons.push({
        title: 'Stress Level',
        value: stressVal,
        explanation: 'Low stress levels are excellent for mental clarity and emotional resilience.',
        icon: '🧠',
        status: 'success'
      });
    }
  }

  // 3. Screen Time
  const screenVal = input?.screenHours !== undefined ? input.screenHours : input?.screen;
  if (screenVal !== undefined && screenVal !== null && screenVal !== '') {
    const hours = parseFloat(screenVal);
    if (hours > 8) {
      reasons.push({
        title: 'Screen Time',
        value: `${hours} hrs/day`,
        explanation: 'More than 8 hours of screen time can affect eye comfort, posture, and natural sleep preparation.',
        icon: '📱',
        status: 'warning'
      });
    } else {
      reasons.push({
        title: 'Screen Time',
        value: `${hours} hrs/day`,
        explanation: 'Moderate screen time helps protect sleep cycles and reduces eye strain.',
        icon: '📱',
        status: 'success'
      });
    }
  }

  // 4. Activity
  const activityVal = input?.dailyActivityMinutes !== undefined ? input.dailyActivityMinutes : input?.daily_activity;
  if (activityVal !== undefined && activityVal !== null && activityVal !== '') {
    const mins = parseFloat(activityVal);
    if (mins < 30) {
      reasons.push({
        title: 'Daily Activity',
        value: `${mins} min/day`,
        explanation: 'Less than 30 minutes of activity can limit cardiovascular fitness and metabolism.',
        icon: '🏃',
        status: 'warning'
      });
    } else {
      reasons.push({
        title: 'Daily Activity',
        value: `${mins} min/day`,
        explanation: 'Active daily routine! Regular movement supports blood flow, heart health, and energy.',
        icon: '🏃',
        status: 'success'
      });
    }
  }

  // 5. Optional Metrics: Blood Pressure
  const systolic = input?.systolic;
  const diastolic = input?.diastolic;
  if (systolic && diastolic) {
    if (systolic >= 130 || diastolic >= 85) {
      reasons.push({
        title: 'Blood Pressure',
        value: `${systolic}/${diastolic} mmHg`,
        explanation: 'Your blood pressure metrics are slightly elevated. Gentle activity and lower sodium can help.',
        icon: '❤️',
        status: 'warning'
      });
    } else {
      reasons.push({
        title: 'Blood Pressure',
        value: `${systolic}/${diastolic} mmHg`,
        explanation: 'Your blood pressure metrics are in a healthy, balanced range.',
        icon: '❤️',
        status: 'success'
      });
    }
  }

  // 6. Optional Metrics: Glucose
  const glucose = input?.glucose;
  if (glucose !== undefined && glucose !== null && glucose !== '') {
    const gVal = parseFloat(glucose);
    if (gVal > 125) {
      reasons.push({
        title: 'Glucose Level',
        value: `${gVal} mg/dL`,
        explanation: 'Your fasting/random glucose level is elevated. Focus on complex fiber and active walks.',
        icon: '🩸',
        status: 'warning'
      });
    } else if (gVal >= 70 && gVal <= 125) {
      reasons.push({
        title: 'Glucose Level',
        value: `${gVal} mg/dL`,
        explanation: 'Your glucose levels are steady and in a stable range.',
        icon: '🩸',
        status: 'success'
      });
    }
  }

  return reasons;
};

const getNextSteps = (input, results) => {
  const steps = [];

  // Food
  let foodTitle = "Add one budget protein source like dal, chana, curd, egg, or sprouts";
  let foodReason = "Proteins support stable blood sugar levels, muscle wellness, and keep you full longer.";
  if (input?.foodPreference === 'Vegan') {
    foodTitle = "Add sprouts, peanuts, or roasted chana to your next meal";
    foodReason = "Plant-based budget proteins keep your daily nutrition optimal and support energy balance.";
  } else if (input?.foodPreference === 'Vegetarian') {
    foodTitle = "Add sprouts, dal, curd, or roasted chana to your meal";
    foodReason = "Affordable vegetarian proteins provide high-yield support for steady daily energy.";
  }
  steps.push({
    id: 'step_food_protein',
    title: foodTitle,
    category: 'Food',
    reason: foodReason,
    estimatedTime: '5 mins',
    difficulty: 'Easy'
  });

  // Activity
  let actTitle = "Take a 10-minute walk after dinner";
  let actReason = "A short post-meal walk is a powerful and easy habit to clear glucose and aid digestion.";
  const activityVal = input?.dailyActivityMinutes !== undefined ? input.dailyActivityMinutes : input?.daily_activity;
  if (activityVal !== undefined && parseFloat(activityVal) < 30) {
    actTitle = "Take a 10-minute walk after your main meal";
    actReason = "Starting with just 10 minutes helps build cardiovascular stamina and improves post-meal metabolism.";
  }
  steps.push({
    id: 'step_activity_walk',
    title: actTitle,
    category: 'Activity',
    reason: actReason,
    estimatedTime: '10 mins',
    difficulty: 'Easy'
  });

  // Sleep/Stress
  let sleepTitle = "Keep phone away 30 minutes before sleep";
  let sleepReason = "Reducing screen light and mental stimulation right before bed allows for deeper, restful sleep cycles.";
  const stressVal = input?.stressLevel !== undefined ? input.stressLevel : input?.stress_level;
  if (stressVal === 'High' || stressVal === 'Very high' || results?.stress === 1) {
    sleepTitle = "Do a 5-minute breathing reset in the evening";
    sleepReason = "Slowing down your breathing helps quiet your nervous system and lowers active physical stress.";
  }
  steps.push({
    id: 'step_sleep_phone',
    title: sleepTitle,
    category: 'Sleep',
    reason: sleepReason,
    estimatedTime: '30 mins',
    difficulty: 'Medium'
  });

  return steps;
};

const hasSeriousSymptoms = (symptomsList) => {
  if (!symptomsList || !Array.isArray(symptomsList)) return false;
  return symptomsList.some(symptom => 
    symptom.toLowerCase().includes('chest') || 
    symptom.toLowerCase().includes('dizziness')
  );
};

const HealthResults = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedActions, setAddedActions] = useState({});

  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});

  useEffect(() => {
    const load = async () => {
      try {
        const cached = sessionStorage.getItem(`guest_prediction_${id}`);
        if (cached) {
          setPrediction(JSON.parse(cached));
          setLoading(false);
          return;
        }
        const res = await predictAPI.getById(id);
        setPrediction(res.data.data);
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (prediction) {
      try {
        const dateKey = getTodayKey();
        const cached = localStorage.getItem(dateKey);
        if (cached) {
          const actions = JSON.parse(cached);
          const addedMap = {};
          const steps = getNextSteps(prediction.input, prediction.results);
          steps.forEach(step => {
            if (actions.some(act => act.id === step.id || act.title === step.title)) {
              addedMap[step.id] = true;
            }
          });
          setAddedActions(addedMap);
        }
      } catch (err) {
        console.warn('Failed to pre-check added actions:', err);
      }
    }
  }, [prediction]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }} className="page-enter">
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>😕</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          We couldn’t find your wellness result.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
          It looks like this screening record is missing or expired.
        </p>
        <Link to="/health-check" className="btn-primary" style={{ padding: '12px 28px', display: 'inline-flex', justifyContent: 'center', fontWeight: 700 }}>
          Start Wellness Check
        </Link>
      </div>
    );
  }

  const { results, overallRisk, input } = prediction;
  const riskLevel = overallRisk?.level || prediction.riskLevel || 'Low';
  const score = overallRisk?.score !== undefined ? overallRisk.score : (prediction.score !== undefined ? prediction.score : null);
  const estimateSource = overallRisk?.source || prediction.source || (prediction.aiGenerated ? 'ai_assisted' : null);
  const rawConfidence = Number.parseFloat(overallRisk?.confidence ?? prediction.confidence);

  const getFallbackCompleteness = (input) => {
    if (!input) return 60;
    const providedGlucose = (input.glucose !== undefined && input.glucose !== null && input.glucose !== '');
    const providedBP = (input.bloodPressure !== undefined && input.bloodPressure !== null && input.bloodPressure !== '') ||
                       (input.systolic !== undefined && input.systolic !== null && input.systolic !== '' &&
                        input.diastolic !== undefined && input.diastolic !== null && input.diastolic !== '');
    const providedFamily = (input.familyHistory !== undefined && input.familyHistory !== null && input.familyHistory !== '') ||
                           (input.family !== undefined && input.family !== null && input.family !== '');
    const providedSmoking = (input.smoking !== undefined && input.smoking !== null && input.smoking !== '');
    const providedAlcohol = (input.alcohol !== undefined && input.alcohol !== null && input.alcohol !== '');

    const providedCount = [
      providedGlucose,
      providedBP,
      providedFamily,
      providedSmoking,
      providedAlcohol
    ].filter(Boolean).length;

    return Math.round((providedCount / 5) * 100);
  };

  const resolvedCompleteness = typeof overallRisk?.inputCompleteness === 'number'
    ? overallRisk.inputCompleteness
    : (typeof prediction.inputCompleteness === 'number'
      ? prediction.inputCompleteness
      : getFallbackCompleteness(input));

  const hasModelConfidence = estimateSource === 'ml_model' && 
                             Number.isFinite(rawConfidence) && 
                             rawConfidence > 0;

  const confidencePercent = hasModelConfidence ? Math.round(Math.min(Math.max(rawConfidence, 0), 1) * 100) : null;

  const statusLabels = {
    Low: { text: 'Low attention needed', bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '#a7f3d0', color: '#065f46' },
    Medium: { text: 'Medium attention needed', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#fde68a', color: '#92400e' },
    High: { text: 'High attention needed', bg: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)', border: '#fca5a5', color: '#991b1b' }
  };
  const statusInfo = statusLabels[riskLevel] || statusLabels.Low;

  const handleAddAction = (action) => {
    try {
      const dateKey = getTodayKey();
      const cached = localStorage.getItem(dateKey);
      let actions = [];
      if (cached) {
        actions = JSON.parse(cached);
      } else {
        actions = generateDailyActions(prefs, prediction);
      }
      
      const exists = actions.some(act => act.id === action.id || act.title === action.title);
      if (!exists) {
        const todayStr = new Date().toISOString().split('T')[0];
        actions.push({
          ...action,
          completed: false,
          createdDate: todayStr
        });
        localStorage.setItem(dateKey, JSON.stringify(actions));
      }
      
      setAddedActions(prev => ({ ...prev, [action.id]: true }));
      toast.success('Action added to Daily Actions! 🎉');
    } catch (err) {
      console.error('Failed to add action:', err);
      toast.error('Could not add action.');
    }
  };

  return (
    <div className="page-enter results-container">
      {/* Back navigation */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/dashboard" className="back-nav" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem',
          transition: 'color var(--transition-fast)', fontWeight: 600
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* 1. Result Summary Hero */}
      <div className="hero-card animate-fade-in-up" style={{ background: statusInfo.bg, borderColor: statusInfo.border, color: statusInfo.color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, display: 'block', marginBottom: '4px' }}>
              Your Wellness Estimate
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 10px 0', color: 'inherit', lineHeight: 1.2 }}>
              {statusInfo.text}
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5, margin: 0, opacity: 0.9 }}>
              {getFriendlyExplanation(input)}
            </p>
          </div>
          {score !== null && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              border: '2px solid currentColor',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, marginTop: '2px' }}>Score</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Source / Reliability Card */}
      <div className="reliability-card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Input completeness
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
              {resolvedCompleteness}%
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${resolvedCompleteness}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)', borderRadius: '999px', transition: 'width 1s ease-out' }} />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.45, margin: '8px 0 0 0' }}>
            This estimate is based on the lifestyle information you provided. Add optional health metrics for a more comprehensive wellness estimate.
          </p>
        </div>
      </div>

      {/* 3. Why this result? */}
      <div className="animate-fade-in-up" style={{ marginBottom: '28px', animationDelay: '0.1s' }}>
        <h2 className="reasons-title">Why this estimate?</h2>
        <div className="reasons-grid">
          {getWhyReasons(input, results).map((reason, idx) => {
            const borderColors = {
              warning: '#fde68a',
              success: '#bbf7d0',
              info: '#cbd5e1'
            };
            const bgColors = {
              warning: '#fffbeb',
              success: '#f0fdf4',
              info: '#f8fafc'
            };
            const textColors = {
              warning: '#92400e',
              success: '#166534',
              info: '#475569'
            };
            
            const borderC = borderColors[reason.status] || '#cbd5e1';
            const bgC = bgColors[reason.status] || '#f8fafc';
            const textC = textColors[reason.status] || '#475569';
            
            return (
              <div key={idx} className="reason-card" style={{ background: bgC, borderColor: borderC }}>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{reason.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{reason.title}:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textC }}>{reason.value}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                    {reason.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Your Next 3 Steps */}
      <div className="animate-fade-in-up" style={{ marginBottom: '28px', animationDelay: '0.15s' }}>
        <h2 className="steps-title">Your Next 3 Steps</h2>
        <div className="steps-list">
          {getNextSteps(input, results).map((step) => {
            const isAdded = addedActions[step.id];
            return (
              <div key={step.id} className={`step-card ${isAdded ? 'added' : ''}`}>
                <div className="step-content">
                  <span className={`step-badge ${step.category.toLowerCase()}`}>
                    {step.category}
                  </span>
                  <h3 className="step-card-title">{step.title}</h3>
                  <p className="step-card-reason">{step.reason}</p>
                </div>
                <button
                  onClick={() => !isAdded && handleAddAction(step)}
                  className={isAdded ? "btn-ghost" : "btn-primary"}
                  disabled={isAdded}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isAdded ? 'default' : 'pointer'
                  }}
                >
                  {isAdded ? (
                    <>
                      <FiCheckCircle size={14} /> Added to Focus
                    </>
                  ) : (
                    <>
                      <FiZap size={14} /> Mark as Today's Focus
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Advanced Metrics Notice */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {hasAdvancedMetrics(input) ? (
          <div className="notice-banner advanced">
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>📊</span>
            <span>This estimate includes the optional health metrics you provided.</span>
          </div>
        ) : (
          <div className="notice-banner lifestyle">
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🌿</span>
            <span>This estimate is based mainly on lifestyle inputs because advanced health metrics were not provided.</span>
          </div>
        )}
      </div>

      {/* 6. Safety Disclaimer */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        {hasSeriousSymptoms(firstProvided(input?.symptoms, prediction.symptoms)) && (
          <div className="warning-card">
            <FiAlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.88rem' }}>Attention Suggested</strong>
              <span>You selected a symptom that may need attention. If symptoms are severe, urgent, or persistent, contact a qualified healthcare professional.</span>
            </div>
          </div>
        )}
        
        <div className="disclaimer-card">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <FiAlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Safety Disclaimer:</strong> VitalIQ Health provides wellness insights only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.
            </span>
          </div>
        </div>
      </div>

      {/* 7. Result Actions */}
      <div className="actions-section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {isGuest && (
          <div className="guest-box">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.8rem', marginBottom: '10px' }}>🔐</span>
              <h3 className="guest-box-title">Create an account to save your wellness history across devices.</h3>
              <p className="guest-box-desc">
                Sign up to preserve your scores, unlock streak tracking, and access personalized meal plans.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px' }} className="buttons-grid">
                <Link to="/register" className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}>
                  Create Account
                </Link>
                <Link to="/dashboard" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}>
                  Continue as Guest
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="buttons-grid">
          <Link to="/daily-actions" className="btn-primary" style={{ justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
            View Daily Actions
          </Link>
          <Link to="/meal-planner" className="btn-secondary" style={{ justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
            Generate Budget Meal Plan
          </Link>
          {!isGuest && (
            <Link to="/history" className="btn-ghost" style={{ justifyContent: 'center', gap: '8px', fontWeight: 700, borderColor: '#cbd5e1' }}>
              Save / View History
            </Link>
          )}
          <Link to="/health-check" className="btn-ghost" style={{ justifyContent: 'center', gap: '8px', fontWeight: 700, borderColor: '#cbd5e1' }}>
            Retake Wellness Check
          </Link>
          <button 
            onClick={() => window.print()}
            className="btn-ghost"
            style={{ justifyContent: 'center', gap: '8px', fontWeight: 700, borderColor: '#cbd5e1', color: 'var(--text-secondary)' }}
          >
            <FiDownload size={16} /> Export Summary
          </button>
        </div>
      </div>

      <style>{`
        .results-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px 16px 60px 16px;
        }
        .hero-card {
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease;
          border: 1px solid;
          position: relative;
          overflow: hidden;
        }
        .hero-card::before {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }
        .reliability-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .reasons-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .reasons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .reason-card {
          border-radius: 12px;
          padding: 16px;
          border: 1px solid;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .reason-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px -4px rgba(0,0,0,0.04);
        }
        .steps-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }
        .step-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          transition: all 0.3s ease;
        }
        .step-card.added {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .step-content {
          flex: 1;
        }
        .step-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .step-badge.food { background: #e8f5f0; color: #0d6e5b; }
        .step-badge.activity { background: #fff7ed; color: #c2410c; }
        .step-badge.sleep { background: #f3e8ff; color: #6b21a8; }
        
        .step-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .step-card-reason {
          font-size: 0.85rem;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }
        .notice-banner {
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .notice-banner.advanced {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          color: #0369a1;
        }
        .notice-banner.lifestyle {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .disclaimer-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .warning-card {
          background: #fff5f5;
          border: 1px solid #fca5a5;
          color: #991b1b;
          border-radius: 12px;
          padding: 16px;
          font-size: 0.82rem;
          line-height: 1.5;
          margin-bottom: 24px;
          display: flex;
          align-items: start;
          gap: 10px;
        }
        .actions-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .guest-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 20px;
        }
        .guest-box-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #854d0e;
          margin-bottom: 6px;
        }
        .guest-box-desc {
          font-size: 0.82rem;
          color: #a16207;
          margin: 0 0 16px 0;
        }
        .buttons-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        @media (max-width: 640px) {
          .reasons-grid {
            grid-template-columns: 1fr;
          }
          .step-card {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .buttons-grid {
            flex-direction: column;
          }
          .buttons-grid a, .buttons-grid button {
            width: 100%;
            text-align: center;
          }
        }

        @media print {
          nav, header, aside, .btn-primary, .btn-secondary, .btn-ghost, .back-nav, .actions-section {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .page-enter {
            animation: none !important;
          }
          .hero-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            background: #f8fafc !important;
            color: #334155 !important;
          }
          .reliability-card, .reason-card, .step-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthResults;
