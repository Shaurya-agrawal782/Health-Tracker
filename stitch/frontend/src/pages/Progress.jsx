import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { predictAPI, weeklyCheckinAPI } from '../services/api';
import {
  FiTrendingUp, FiAward, FiZap, FiMoon, FiActivity, FiHeart,
  FiList, FiClock, FiAlertTriangle, FiCheckCircle, FiPlusCircle,
  FiArrowRight, FiInfo, FiSliders, FiShield, FiTrendingDown, FiLock
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// Check-in option scores (0-100)
const SCORE_MAPS = {
  sleepQuality: { Poor: 25, Okay: 50, Good: 75, Great: 95 },
  energyLevel: { Low: 30, Medium: 55, Good: 75, High: 90 },
  stressLevel: { Low: 95, Medium: 70, High: 45, 'Very high': 20 },
  mood: { Low: 30, Okay: 55, Good: 75, Great: 90 },
  mealConsistency: { Rarely: 25, '2–3 days': 50, '4–5 days': 75, 'Most days': 95 },
  activityLevel: { 'Mostly inactive': 25, 'Lightly active': 50, 'Moderately active': 75, 'Very active': 95 },
  screenBalance: { Poor: 25, Okay: 50, Good: 75, Great: 95 }
};

// Target date helpers
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPastDates = (anchorDate, days = 7) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(anchorDate);
    d.setDate(anchorDate.getDate() - i);
    dates.push(formatDateKey(d));
  }
  return dates;
};

// Baseline calculation helpers from Screening Checks inputs (if check-ins are missing)
const getBaselineSleepScore = (input) => {
  if (!input) return null;
  const v = parseFloat(input.sleepHours ?? input.sleep);
  if (isNaN(v)) return null;
  if (v < 5) return 30;
  if (v <= 6) return 55;
  if (v <= 8) return 85;
  return 95;
};

const getBaselineActivityScore = (input) => {
  if (!input) return null;
  const v = parseFloat(input.dailyActivityMinutes ?? input.daily_activity);
  if (isNaN(v)) return null;
  if (v < 30) return 40;
  if (v < 60) return 65;
  return 90;
};

const getBaselineNutritionScore = (input) => {
  if (!input) return null;
  return input.budgetAmount ? 75 : 50;
};

const getBaselineStressScore = (input) => {
  if (!input) return null;
  const v = input.stressLevel ?? input.stress_level;
  if (!v) return null;
  if (v === 'Low') return 90;
  if (v === 'Medium') return 65;
  if (v === 'High') return 40;
  if (v === 'Very high') return 20;
  return 60;
};

const getBaselineScreenScore = (input) => {
  if (!input) return null;
  const v = parseFloat(input.screenHours ?? input.screen);
  if (isNaN(v)) return null;
  if (v < 3) return 90;
  if (v <= 6) return 75;
  if (v <= 9) return 45;
  return 25;
};

const isScoreValid = (val) => val !== null && val !== undefined && !isNaN(val) && val >= 0;

const formatScoreChange = (delta) => {
  if (delta === null || delta === undefined) return "No change yet";
  if (delta > 0) return `+${delta} this week`;
  if (delta < 0) return `${delta} this week`;
  return "No change yet";
};

const getProgressExplanation = (compositeScore) => {
  if (compositeScore >= 80) {
    return "Your routine is consistent. Excellent habits and sleep patterns are keeping your score high.";
  }
  if (compositeScore >= 60) {
    return "Your routine is improving. Sleep and meal consistency are helping your score.";
  }
  if (compositeScore >= 40) {
    return "Your routine is developing. Small daily check-ins and screen breaks will lift your score.";
  }
  return "Your routine needs attention. Restoring sleep and hydration can help boost your overall score.";
};

const Progress = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [habitHistory, setHabitHistory] = useState({});
  const [loading, setLoading] = useState(true);

  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // 1. Load screening checks history
        let screeningHistory = [];
        if (isGuest) {
          try {
            screeningHistory = JSON.parse(localStorage.getItem('vitaliq_wellness_checks') || '[]');
          } catch (e) {
            screeningHistory = [];
          }
        } else {
          try {
            const checksRes = await predictAPI.getHistory();
            screeningHistory = checksRes.data?.data || [];
          } catch (err) {
            console.warn('Failed to load screening history:', err);
          }
        }
        setChecks(screeningHistory);

        // 2. Load weekly check-ins history
        let checkinHistory = [];
        if (isGuest) {
          try {
            checkinHistory = JSON.parse(localStorage.getItem('vitaliq_weekly_checkins') || '[]');
          } catch (e) {
            checkinHistory = [];
          }
        } else {
          try {
            const checkinsRes = await weeklyCheckinAPI.getAll();
            checkinHistory = checkinsRes.data?.data || [];
          } catch (err) {
            console.warn('Failed to load weekly check-ins:', err);
          }
        }
        // Ensure sorted reverse-chronologically
        checkinHistory.sort((a, b) => new Date(b.createdAt || b.weekStartDate) - new Date(a.createdAt || a.weekStartDate));
        setCheckins(checkinHistory);

        // 3. Load habit history
        const habitsData = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
        setHabitHistory(habitsData);

      } catch (err) {
        console.error('Error loading progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [isGuest]);

  // Calculations for current period (last 7 days from today)
  const stats = useMemo(() => {
    const today = new Date();
    const last7Days = getPastDates(today, 7);

    // --- A. Habit Completion Rate ---
    let completedHabits = 0;
    let habitBreakdown = { water: 0, sleep: 0, walk: 0, mealPlan: 0, screenBreak: 0, stressReset: 0 };

    last7Days.forEach(dateStr => {
      const dayHabits = habitHistory[dateStr] || {};
      Object.keys(habitBreakdown).forEach(habitId => {
        if (dayHabits[habitId] === true) {
          completedHabits++;
          habitBreakdown[habitId]++;
        }
      });
    });
    const habitRate = (completedHabits / 42) * 100;

    // --- B. Daily Actions Rate ---
    let generatedActions = 0;
    let completedActions = 0;
    last7Days.forEach(dateStr => {
      const key = `vitaliq_daily_actions_${dateStr}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            generatedActions += list.length;
            completedActions += list.filter(a => a.completed).length;
          }
        } catch (e) {}
      }
    });
    const actionRate = generatedActions > 0 ? (completedActions / generatedActions) * 100 : null;

    // --- C. Latest Weekly Check-in Score ---
    const latestCheckin = checkins[0] || null;
    const checkinScore = latestCheckin ? (latestCheckin.weeklyScore ?? null) : null;

    // --- D. Latest Wellness Screening Score ---
    const latestCheck = checks[0] || null;
    const screeningScore = latestCheck?.overallRisk?.score ? (100 - latestCheck.overallRisk.score) : null;

    // --- E. Composite Wellness Score with Re-normalization ---
    let totalWeight = 0;
    let weightedSum = 0;

    // Habits: always active (25%)
    totalWeight += 25;
    weightedSum += habitRate * 0.25;

    // Daily Actions (20%)
    if (actionRate !== null) {
      totalWeight += 20;
      weightedSum += actionRate * 0.20;
    }

    // Weekly Check-in (40%)
    if (checkinScore !== null) {
      totalWeight += 40;
      weightedSum += checkinScore * 0.40;
    }

    // Screening Score (15%)
    if (screeningScore !== null) {
      totalWeight += 15;
      weightedSum += screeningScore * 0.15;
    }

    const compositeScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

    // Classify score
    let statusLabel = 'Getting Started';
    let statusColor = '#475569';
    let statusBg = '#f1f5f9';

    if (checkinScore !== null || screeningScore !== null) {
      if (compositeScore >= 80) {
        statusLabel = 'Consistent';
        statusColor = '#0f766e';
        statusBg = '#ccfbf1';
      } else if (compositeScore >= 60) {
        statusLabel = 'Improving';
        statusColor = '#0369a1';
        statusBg = '#e0f2fe';
      } else if (compositeScore >= 40) {
        statusLabel = 'Getting Started';
        statusColor = '#d97706';
        statusBg = '#fef3c7';
      } else {
        statusLabel = 'Needs attention';
        statusColor = '#b91c1c';
        statusBg = '#fee2e2';
      }
    }

    // --- F. Category Scores (0-100) with screening fallbacks ---
    // 1. Sleep: Weekly check-in or Sleep habit rate
    const checkinSleepVal = latestCheckin ? SCORE_MAPS.sleepQuality[latestCheckin.sleepQuality] : null;
    const habitSleepVal = (habitBreakdown.sleep / 7) * 100;
    const baselineSleepVal = getBaselineSleepScore(latestCheck?.input);
    let sleepScore = null;
    if (checkinSleepVal !== null) {
      sleepScore = Math.round(checkinSleepVal * 0.7 + habitSleepVal * 0.3);
    } else if (completedHabits > 0 || baselineSleepVal !== null) {
      sleepScore = Math.round(baselineSleepVal !== null ? (baselineSleepVal * 0.8 + habitSleepVal * 0.2) : habitSleepVal);
    }

    // 2. Activity: Average of walk habit rate and weekly activity level
    const checkinActivityVal = latestCheckin ? SCORE_MAPS.activityLevel[latestCheckin.activityLevel] : null;
    const habitWalkVal = (habitBreakdown.walk / 7) * 100;
    const baselineActivityVal = getBaselineActivityScore(latestCheck?.input);
    let activityScore = null;
    if (checkinActivityVal !== null) {
      activityScore = Math.round(checkinActivityVal * 0.6 + habitWalkVal * 0.4);
    } else if (completedHabits > 0 || baselineActivityVal !== null) {
      activityScore = Math.round(baselineActivityVal !== null ? (baselineActivityVal * 0.8 + habitWalkVal * 0.2) : habitWalkVal);
    }

    // 3. Nutrition: Average of meal plan habit and weekly check-in consistency
    const checkinMealsVal = latestCheckin ? SCORE_MAPS.mealConsistency[latestCheckin.mealConsistency] : null;
    const habitMealsVal = (habitBreakdown.mealPlan / 7) * 100;
    const baselineNutritionVal = getBaselineNutritionScore(latestCheck?.input);
    let nutritionScore = null;
    if (checkinMealsVal !== null) {
      nutritionScore = Math.round(checkinMealsVal * 0.6 + habitMealsVal * 0.4);
    } else if (completedHabits > 0 || baselineNutritionVal !== null) {
      nutritionScore = Math.round(baselineNutritionVal !== null ? (baselineNutritionVal * 0.8 + habitMealsVal * 0.2) : habitMealsVal);
    }

    // 4. Stress: Average of stress reset habit and check-in stress score
    const checkinStressVal = latestCheckin ? SCORE_MAPS.stressLevel[latestCheckin.stressLevel] : null;
    const habitStressVal = (habitBreakdown.stressReset / 7) * 100;
    const baselineStressVal = getBaselineStressScore(latestCheck?.input);
    let stressScore = null;
    if (checkinStressVal !== null) {
      stressScore = Math.round(checkinStressVal * 0.6 + habitStressVal * 0.4);
    } else if (completedHabits > 0 || baselineStressVal !== null) {
      stressScore = Math.round(baselineStressVal !== null ? (baselineStressVal * 0.8 + habitStressVal * 0.2) : habitStressVal);
    }

    // 5. Screen Balance: Average of screen breaks and check-in score
    const checkinScreenVal = latestCheckin ? SCORE_MAPS.screenBalance[latestCheckin.screenBalance] : null;
    const habitScreenVal = (habitBreakdown.screenBreak / 7) * 100;
    const baselineScreenVal = getBaselineScreenScore(latestCheck?.input);
    let screenScore = null;
    if (checkinScreenVal !== null) {
      screenScore = Math.round(checkinScreenVal * 0.6 + habitScreenVal * 0.4);
    } else if (completedHabits > 0 || baselineScreenVal !== null) {
      screenScore = Math.round(baselineScreenVal !== null ? (baselineScreenVal * 0.8 + habitScreenVal * 0.2) : habitScreenVal);
    }

    // 6. Consistency: Combined Habits + Actions Rate
    const actualActionRate = actionRate !== null ? actionRate : 0;
    const consistencyScore = Math.round(habitRate * 0.5 + actualActionRate * 0.5);

    // --- G. Historical Trend Points Calculation ---
    const trendData = [...checkins]
      .reverse()
      .map((chk) => {
        const chkDate = new Date(chk.createdAt || chk.weekStartDate);
        const pastChecks = checks.filter(c => new Date(c.date) <= chkDate);
        const matchCheck = pastChecks[0] || null;
        const pastScreeningScore = matchCheck?.overallRisk?.score ? (100 - matchCheck.overallRisk.score) : null;

        const weekDates = getPastDates(chkDate, 7);
        let weekCompletedHabits = 0;
        weekDates.forEach(dateStr => {
          const dayHabits = habitHistory[dateStr] || {};
          Object.keys(habitBreakdown).forEach(h => {
            if (dayHabits[h] === true) weekCompletedHabits++;
          });
        });
        const weekHabitRate = (weekCompletedHabits / 42) * 100;

        let weekGeneratedActions = 0;
        let weekCompletedActions = 0;
        weekDates.forEach(dateStr => {
          const key = `vitaliq_daily_actions_${dateStr}`;
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const list = JSON.parse(cached);
              if (Array.isArray(list)) {
                weekGeneratedActions += list.length;
                weekCompletedActions += list.filter(a => a.completed).length;
              }
            } catch (e) {}
          }
        });
        const weekActionRate = weekGeneratedActions > 0 ? (weekCompletedActions / weekGeneratedActions) * 100 : null;

        let hWeight = 0;
        let hSum = 0;

        hWeight += 25;
        hSum += weekHabitRate * 0.25;

        if (weekActionRate !== null) {
          hWeight += 20;
          hSum += weekActionRate * 0.20;
        }
        if (chk.weeklyScore !== undefined) {
          hWeight += 40;
          hSum += chk.weeklyScore * 0.40;
        }
        if (pastScreeningScore !== null) {
          hWeight += 15;
          hSum += pastScreeningScore * 0.15;
        }

        const scoreVal = hWeight > 0 ? Math.round((hSum / hWeight) * 100) : chk.weeklyScore;

        return {
          dateLabel: chkDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: scoreVal
        };
      });

    // Fallback if no weekly check-ins exist, but screening checks do
    if (trendData.length === 0 && checks.length > 0) {
      [...checks].reverse().forEach(c => {
        trendData.push({
          dateLabel: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: c.overallRisk?.score ? (100 - c.overallRisk.score) : 50
        });
      });
    }

    // --- H. Weekly Comparison ---
    let weeklyDelta = null;
    if (checkins.length >= 2) {
      const thisWeekScore = checkins[0].weeklyScore || 0;
      const prevWeekScore = checkins[1].weeklyScore || 0;
      weeklyDelta = thisWeekScore - prevWeekScore;
    }

    return {
      completedHabits,
      completedActions,
      habitRate,
      actionRate,
      checkinScore,
      screeningScore,
      compositeScore,
      statusLabel,
      statusColor,
      statusBg,
      categories: {
        sleep: sleepScore,
        activity: activityScore,
        nutrition: nutritionScore,
        stress: stressScore,
        screen: screenScore,
        consistency: consistencyScore
      },
      trendData,
      weeklyDelta,
      latestCheckin
    };
  }, [checks, checkins, habitHistory]);

  const hasData = checks.length > 0 || checkins.length > 0;

  // Best and focus categories calculation
  const { bestText, focusText } = useMemo(() => {
    const categoryList = [
      { id: 'sleep', name: 'Sleep', score: stats.categories.sleep, strongDesc: 'you are getting consistent hours of restful sleep.', focusDesc: 'try a screens-off wind-down alarm 30 mins before bedtime.' },
      { id: 'activity', name: 'Activity', score: stats.categories.activity, strongDesc: 'you are meeting your daily routine movement goals.', focusDesc: 'take a 10-minute walk after your main meal.' },
      { id: 'nutrition', name: 'Nutrition', score: stats.categories.nutrition, strongDesc: 'you followed your meal plan most days.', focusDesc: 'plan 3 budget-friendly meals in advance.' },
      { id: 'stress', name: 'Stress', score: stats.categories.stress, strongDesc: 'your relaxation and mindful resets are working.', focusDesc: 'try a 5-minute reset before sleep.' },
      { id: 'screen', name: 'Screen Balance', score: stats.categories.screen, strongDesc: 'you are avoiding screen fatigue patterns.', focusDesc: 'practice the 20-20-20 screen break rule.' },
      { id: 'consistency', name: 'Consistency', score: stats.categories.consistency, strongDesc: 'you log your habits and daily actions regularly.', focusDesc: 'focus on completing one simple habit or action daily.' }
    ];

    const validCategories = categoryList.filter(cat => isScoreValid(cat.score));
    
    let bestCategory = null;
    let focusCategory = null;
    
    if (validCategories.length > 0) {
      const sortedDesc = [...validCategories].sort((a, b) => b.score - a.score);
      bestCategory = sortedDesc[0];
      
      const sortedAsc = [...validCategories].sort((a, b) => a.score - b.score);
      focusCategory = sortedAsc[0];
      if (focusCategory.id === bestCategory.id && sortedAsc.length > 1) {
        focusCategory = sortedAsc[1];
      }
    }

    const defaultBest = { name: 'Consistency', strongDesc: 'you log your habits and daily actions regularly.' };
    const defaultFocus = { name: 'Sleep', focusDesc: 'try a screens-off wind-down alarm 30 mins before bedtime.' };
    
    const bText = bestCategory 
      ? `${bestCategory.name} — ${bestCategory.strongDesc}`
      : `${defaultBest.name} — ${defaultBest.strongDesc}`;
      
    const fText = focusCategory 
      ? `${focusCategory.name} — ${focusCategory.focusDesc}`
      : `${defaultFocus.name} — ${defaultFocus.focusDesc}`;

    return { bestText: bText, focusText: fText };
  }, [stats.categories]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Retrieving your progress data...
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Analyzing your daily activity and wellness check trends.
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter progress-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. Page intro */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Your Wellness Progress
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Track small improvements in your food, sleep, stress, habits, and routine.
        </p>
      </div>

      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a' }}>
            <FiLock size={18} style={{ flexShrink: 0, color: '#3b82f6' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Guest progress is saved on this device only. Create an account to save progress across devices.
            </span>
          </div>
          <Link to="/register" className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            Create Account
          </Link>
        </div>
      )}

      {!hasData ? (
        <EmptyState
          title="Your progress timeline is waiting"
          description="Complete a wellness check or weekly check-in to unlock your wellness score trend."
          icon="🌱"
          primaryActionLabel="Start Wellness Check"
          primaryActionTo="/health-check"
          secondaryActionLabel="Weekly Check-in"
          secondaryActionTo="/weekly-checkin"
        />
      ) : (
        <>
          {/* 2. Main Progress Summary Card */}
          <div className="medical-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                  Overall Wellness Score
                </span>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {stats.compositeScore}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>/100</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{
                    background: stats.statusBg,
                    color: stats.statusColor,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'capitalize'
                  }}>
                    {stats.statusLabel}
                  </span>
                  
                  <span style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: stats.weeklyDelta !== null && stats.weeklyDelta > 0 ? '#059669' : stats.weeklyDelta !== null && stats.weeklyDelta < 0 ? '#b91c1c' : '#475569',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {formatScoreChange(stats.weeklyDelta)}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {getProgressExplanation(stats.compositeScore)}
                </p>
              </div>

              {/* Graphical mini gauge */}
              <div style={{ width: '100px', height: '100px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ position: 'absolute', width: '100px', height: '100px', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="42" fill="none" 
                    stroke="var(--primary)" strokeWidth="8" 
                    strokeDasharray="264" 
                    strokeDashoffset={264 - (264 * stats.compositeScore) / 100} 
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                  />
                </svg>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stats.compositeScore}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. Trend chart */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Wellness Score Trend
            </h3>
            
            <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stats.trendData.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="progressScoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="dateLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      name="Wellness Index"
                      stroke="var(--primary)" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#progressScoreColor)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
                  <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📈</span>
                  Your chart will appear after a few check-ins.
                </div>
              )}
            </div>
          </div>

          {/* 5. Best + Focus section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="best-focus-grid">
            {/* Strongest Area Card */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiAward size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Your strongest area
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#14532d', lineHeight: 1.4, display: 'block' }}>
                  {bestText}
                </span>
              </div>
            </div>

            {/* Focus Area Card */}
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiZap size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Focus next
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#78350f', lineHeight: 1.4, display: 'block' }}>
                  {focusText}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Category breakdown */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Category Balance Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="category-cards-grid">
              {[
                {
                  id: 'sleep',
                  name: 'Sleep',
                  score: stats.categories.sleep,
                  icon: '🌙',
                  color: '#7c3aed',
                  bg: '#f3e8ff',
                  status: stats.categories.sleep >= 80 ? 'Excellent' : stats.categories.sleep >= 60 ? 'Consistent' : stats.categories.sleep >= 40 ? 'Moderate' : 'Needs attention',
                  insight: stats.categories.sleep < 60 ? 'Your sleep is improving, but consistency needs work.' : 'Your rest window is stable. Excellent bedtime routine!',
                  action: 'Set a realistic bedtime target.'
                },
                {
                  id: 'activity',
                  name: 'Activity',
                  score: stats.categories.activity,
                  icon: '🏃',
                  color: '#059669',
                  bg: '#ecfdf5',
                  status: stats.categories.activity >= 80 ? 'Active' : stats.categories.activity >= 60 ? 'Consistent' : stats.categories.activity >= 40 ? 'Light' : 'Needs attention',
                  insight: stats.categories.activity < 60 ? 'Daily active movement levels could be more consistent.' : 'Awesome activity rates! Meeting your healthy movement goals.',
                  action: 'Take a 10-minute walk after meals.'
                },
                {
                  id: 'nutrition',
                  name: 'Nutrition',
                  score: stats.categories.nutrition,
                  icon: '🥗',
                  color: '#0ea5e9',
                  bg: '#f0f9ff',
                  status: stats.categories.nutrition >= 80 ? 'Healthy' : stats.categories.nutrition >= 60 ? 'Consistent' : stats.categories.nutrition >= 40 ? 'Irregular' : 'Needs attention',
                  insight: stats.categories.nutrition < 60 ? 'Meal consistency is developing. Routine planning helps.' : 'Outstanding nutrition discipline! Regular meals support recovery.',
                  action: 'Plan 3 budget-friendly meals in advance.'
                },
                {
                  id: 'stress',
                  name: 'Stress',
                  score: stats.categories.stress,
                  icon: '🧘',
                  color: '#d97706',
                  bg: '#fef3c7',
                  status: stats.categories.stress >= 80 ? 'Balanced' : stats.categories.stress >= 60 ? 'Manageable' : stats.categories.stress >= 40 ? 'Elevated' : 'Needs attention',
                  insight: stats.categories.stress < 60 ? 'Stress load is elevated. Regular reset blocks will help.' : 'Excellent stress management! Your reset routines are working.',
                  action: 'Try a 5-minute reset before sleep.'
                },
                {
                  id: 'screen',
                  name: 'Screen Balance',
                  score: stats.categories.screen,
                  icon: '💻',
                  color: '#475569',
                  bg: '#f1f5f9',
                  status: stats.categories.screen >= 80 ? 'Optimal' : stats.categories.screen >= 60 ? 'Moderate' : stats.categories.screen >= 40 ? 'Heavy Use' : 'Needs attention',
                  insight: stats.categories.screen < 60 ? 'Extended screen times raise fatigue. Breaks are recommended.' : 'Excellent eye breaks! You are avoiding extended screen fatigue.',
                  action: 'Practice the 20-20-20 screen break rule.'
                },
                {
                  id: 'consistency',
                  name: 'Consistency',
                  score: stats.categories.consistency,
                  icon: '⚡',
                  color: '#0f766e',
                  bg: '#e6f4fe',
                  status: stats.categories.consistency >= 80 ? 'Strong' : stats.categories.consistency >= 60 ? 'Steady' : stats.categories.consistency >= 40 ? 'Developing' : 'Needs attention',
                  insight: stats.categories.consistency < 60 ? 'Logging habits is developing. Small repeated wins build routine.' : 'Amazing consistency! Keep taking small actions daily.',
                  action: 'Mark at least one habit completed today.'
                }
              ].map(cat => {
                const hasScore = isScoreValid(cat.score);
                return (
                  <div key={cat.name} className="medical-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '1.25rem', width: '36px', height: '36px', 
                          background: cat.bg, color: cat.color, borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{cat.icon}</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{cat.name}</strong>
                      </div>
                      
                      {hasScore && (
                        <span style={{ 
                          fontSize: '0.72rem', fontWeight: 800, color: cat.score >= 60 ? 'var(--primary)' : '#b45309',
                          background: cat.score >= 60 ? '#f0fdf4' : '#fef3c7', padding: '2px 8px', borderRadius: '8px', textTransform: 'capitalize'
                        }}>
                          {cat.status}
                        </span>
                      )}
                    </div>

                    {hasScore ? (
                      <>
                        <div style={{ marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            <span>Wellness Score</span>
                            <span>{cat.score}%</span>
                          </div>
                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${cat.score}%`, height: '100%', background: cat.color, transition: 'width 0.3s ease' }} />
                          </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {cat.insight}
                        </p>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                          💡 <strong>Suggested action:</strong> "{cat.action}"
                        </p>
                      </>
                    ) : (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                        Not enough data yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Weekly summary card */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Weekly Consistency Summary
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px'
            }} className="stats-grid">
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>This week's score</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.checkinScore !== null ? `${stats.checkinScore}/100` : "No check-in"}
                </span>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Last week's score</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {checkins.length >= 2 ? `${checkins[1].weeklyScore}/100` : "No log yet"}
                </span>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Completed habits</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.completedHabits} logged
                </span>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Daily actions done</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.completedActions} completed
                </span>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Check-in status</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stats.latestCheckin ? stats.latestCheckin.status : "No check-in yet"}
                </span>
              </div>
            </div>
          </div>

          {/* 7. Next action CTA */}
          <div className="medical-card" style={{ padding: '28px', border: '1.5px solid var(--primary-100)', background: 'linear-gradient(145deg, #ffffff 0%, #f0faf6 100%)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)', margin: '0 0 4px 0' }}>
              Improve your score this week
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '480px', margin: '4px auto 20px auto', lineHeight: 1.45 }}>
              Take simple steps in your wellness routine to stay consistent and lock in healthy habit gains.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }} className="buttons-grid">
              <Link to="/weekly-checkin" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 800 }}>
                Complete Weekly Check-in
              </Link>
              <Link to="/daily-actions" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 700 }}>
                Open Daily Actions
              </Link>
              <Link to="/habits" className="btn-ghost" style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 700, borderColor: '#cbd5e1' }}>
                Track Habits
              </Link>
              <Link to="/meal-planner" className="btn-ghost" style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 700, borderColor: '#cbd5e1' }}>
                Generate Meal Plan
              </Link>
            </div>
          </div>

          {/* Safety Wording Disclaimer */}
          <div style={{
            padding: '12px 20px',
            background: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#64748b'
          }}>
            <FiShield size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4 }}>
              <strong>Safety Disclaimer: </strong>
              VitalIQ Health provides wellness insights, lifestyle wellness estimates, and general wellness suggestions only. This platform does not provide medical diagnosis, disease prediction, treatment, or cure. Consult a qualified professional for medical advice.
            </span>
          </div>
        </>
      )}

      <style>{`
        .progress-page-container {
          padding: 20px 16px 40px 16px;
        }
        @media (max-width: 640px) {
          .best-focus-grid {
            grid-template-columns: 1fr !important;
          }
          .category-cards-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .buttons-grid {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .buttons-grid a {
            width: 100% !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Progress;
