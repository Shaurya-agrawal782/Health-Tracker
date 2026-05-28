import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { predictAPI, weeklyCheckinAPI } from '../services/api';
import {
  FiTrendingUp, FiAward, FiZap, FiMoon, FiActivity, FiHeart,
  FiList, FiClock, FiAlertTriangle, FiCheckCircle, FiPlusCircle,
  FiArrowRight, FiInfo, FiSliders
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
    // Total completions of any of the 6 habits in past 7 days (max 42)
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
    // Note: overallRisk.score in DB is a risk index (higher is worse), so 100 - risk is wellness rating
    const screeningScore = latestCheck?.overallRisk?.score ? (100 - latestCheck.overallRisk.score) : null;

    // --- E. Composite Wellness Score with Re-normalization ---
    let totalWeight = 0;
    let weightedSum = 0;

    // Habits: always active as daily tracker (default 25%)
    totalWeight += 25;
    weightedSum += habitRate * 0.25;

    // Daily Actions (default 20%)
    if (actionRate !== null) {
      totalWeight += 20;
      weightedSum += actionRate * 0.20;
    }

    // Weekly Check-in (default 40%)
    if (checkinScore !== null) {
      totalWeight += 40;
      weightedSum += checkinScore * 0.40;
    }

    // Screening Score (default 15%)
    if (screeningScore !== null) {
      totalWeight += 15;
      weightedSum += screeningScore * 0.15;
    }

    const compositeScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

    // Classify score
    let statusLabel = 'Getting Started';
    let statusColor = '#475569';
    let statusBg = '#f1f5f9';
    let explanationText = 'Start logging your daily habits, screening checks, and weekly reflections to compute your score.';

    if (checkinScore !== null || screeningScore !== null) {
      if (compositeScore >= 80) {
        statusLabel = 'Consistent';
        statusColor = '#0f766e';
        statusBg = '#ccfbf1';
        explanationText = 'Fantastic routine balance! You are maintaining healthy lifestyle patterns across hydration, rest, and activity.';
      } else if (compositeScore >= 60) {
        statusLabel = 'Improving';
        statusColor = '#0369a1';
        statusBg = '#e0f2fe';
        explanationText = 'Steady improvement! Keep focusing on your weekly wellness suggestions to lock in consistency.';
      } else if (compositeScore >= 40) {
        statusLabel = 'Getting Started';
        statusColor = '#d97706';
        statusBg = '#fef3c7';
        explanationText = 'Great start! Log daily actions and track breaks to lift your overall routine consistency.';
      } else {
        statusLabel = 'Needs Attention';
        statusColor = '#b91c1c';
        statusBg = '#fee2e2';
        explanationText = 'Consider completing a stress reset or taking short screen breaks to build baseline routine energy.';
      }
    }

    // --- F. Category Scores (0-100) ---
    // 1. Sleep: Weekly check-in or Sleep habit rate
    const checkinSleepVal = latestCheckin ? SCORE_MAPS.sleepQuality[latestCheckin.sleepQuality] : null;
    const habitSleepVal = (habitBreakdown.sleep / 7) * 100;
    const sleepScore = Math.round(
      checkinSleepVal !== null ? (checkinSleepVal * 0.7 + habitSleepVal * 0.3) : habitSleepVal
    );

    // 2. Activity: Average of walk habit rate and weekly activity level
    const checkinActivityVal = latestCheckin ? SCORE_MAPS.activityLevel[latestCheckin.activityLevel] : null;
    const habitWalkVal = (habitBreakdown.walk / 7) * 100;
    const activityScore = Math.round(
      checkinActivityVal !== null ? (checkinActivityVal * 0.6 + habitWalkVal * 0.4) : habitWalkVal
    );

    // 3. Nutrition: Average of meal plan habit and weekly check-in consistency
    const checkinMealsVal = latestCheckin ? SCORE_MAPS.mealConsistency[latestCheckin.mealConsistency] : null;
    const habitMealsVal = (habitBreakdown.mealPlan / 7) * 100;
    const nutritionScore = Math.round(
      checkinMealsVal !== null ? (checkinMealsVal * 0.6 + habitMealsVal * 0.4) : habitMealsVal
    );

    // 4. Stress: Average of stress reset habit and check-in stress score
    const checkinStressVal = latestCheckin ? SCORE_MAPS.stressLevel[latestCheckin.stressLevel] : null;
    const habitStressVal = (habitBreakdown.stressReset / 7) * 100;
    const stressScore = Math.round(
      checkinStressVal !== null ? (checkinStressVal * 0.6 + habitStressVal * 0.4) : habitStressVal
    );

    // 5. Screen Balance: Average of screen breaks and check-in score
    const checkinScreenVal = latestCheckin ? SCORE_MAPS.screenBalance[latestCheckin.screenBalance] : null;
    const habitScreenVal = (habitBreakdown.screenBreak / 7) * 100;
    const screenScore = Math.round(
      checkinScreenVal !== null ? (checkinScreenVal * 0.6 + habitScreenVal * 0.4) : habitScreenVal
    );

    // 6. Consistency: Combined Habits + Actions Rate
    const actualActionRate = actionRate !== null ? actionRate : 0;
    const consistencyScore = Math.round(habitRate * 0.5 + actualActionRate * 0.5);

    // --- G. Historical Trend Points Calculation ---
    // Generate data points for weekly check-ins
    const trendData = [...checkins]
      .reverse()
      .map((chk, index) => {
        const chkDate = new Date(chk.createdAt || chk.weekStartDate);
        // Find screening active at that time
        const pastChecks = checks.filter(c => new Date(c.date) <= chkDate);
        const matchCheck = pastChecks[0] || null;
        const pastScreeningScore = matchCheck?.overallRisk?.score ? (100 - matchCheck.overallRisk.score) : null;

        // Try to scan habit rates for that week
        const weekDates = getPastDates(chkDate, 7);
        let weekCompletedHabits = 0;
        weekDates.forEach(dateStr => {
          const dayHabits = habitHistory[dateStr] || {};
          Object.keys(habitBreakdown).forEach(h => {
            if (dayHabits[h] === true) weekCompletedHabits++;
          });
        });
        const weekHabitRate = (weekCompletedHabits / 42) * 100;

        // Estimate action rate for that week
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

        // Compute historic composite score
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

        const score = hWeight > 0 ? Math.round((hSum / hWeight) * 100) : chk.weeklyScore;

        return {
          dateLabel: chkDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: score,
          checkinScore: chk.weeklyScore,
          habitRate: Math.round(weekHabitRate),
        };
      });

    // Fallback if no weekly check-ins exist, but screening checks do
    if (trendData.length === 0 && checks.length > 0) {
      // Just map screening history
      [...checks].reverse().forEach(c => {
        trendData.push({
          dateLabel: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: c.overallRisk?.score ? (100 - c.overallRisk.score) : 50,
          screeningOnly: true
        });
      });
    }

    // --- H. Weekly Comparison (This Week vs Previous Week) ---
    let weeklyDelta = null;
    if (checkins.length >= 2) {
      const thisWeekScore = checkins[0].weeklyScore || 0;
      const prevWeekScore = checkins[1].weeklyScore || 0;
      weeklyDelta = thisWeekScore - prevWeekScore;
    }

    return {
      habitRate,
      actionRate,
      checkinScore,
      screeningScore,
      compositeScore,
      statusLabel,
      statusColor,
      statusBg,
      explanationText,
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

  // Generate dynamic rules-based tips based on lowest categories
  const dynamicTips = useMemo(() => {
    const categoryTips = [
      { id: 'sleep', score: stats.categories.sleep, name: 'Sleep', icon: '🌙', tip: 'Establish a screen-free wind-down routine 30 mins before sleep to support deeper recovery.' },
      { id: 'activity', score: stats.categories.activity, name: 'Activity', icon: '🏃', tip: 'Take a short 10-minute active walk after meals to support baseline circulation.' },
      { id: 'nutrition', score: stats.categories.nutrition, name: 'Nutrition', icon: '🥗', tip: 'Try pre-planning simple, budget-friendly meals in advance to maintain consistency.' },
      { id: 'stress', score: stats.categories.stress, name: 'Stress Reset', icon: '🧘', tip: 'Perform a 5-minute deep breathing reset mid-day to lower cognitive load.' },
      { id: 'screen', score: stats.categories.screen, name: 'Screen Balance', icon: '💻', tip: 'Use the 20-20-20 rule during screen sessions to protect your eyes and reduce fatigue.' },
      { id: 'consistency', score: stats.categories.consistency, name: 'Routine consistency', icon: '⚡', tip: 'Focus on completing just one small habit or action daily to build routine momentum.' }
    ];

    // Sort ascending by score, pick top 3 lowest
    const sorted = [...categoryTips].sort((a, b) => a.score - b.score);
    return sorted.slice(0, 3);
  }, [stats.categories]);

  // Find best and focus categories
  const categoriesList = [
    { name: 'Sleep', score: stats.categories.sleep, icon: <FiMoon /> },
    { name: 'Activity', score: stats.categories.activity, icon: <FiActivity /> },
    { name: 'Nutrition', score: stats.categories.nutrition, icon: <FiSliders /> },
    { name: 'Stress', score: stats.categories.stress, icon: <FiHeart /> },
    { name: 'Screen Balance', score: stats.categories.screen, icon: <FiZap /> },
    { name: 'Consistency', score: stats.categories.consistency, icon: <FiList /> }
  ];

  const bestCategory = useMemo(() => {
    return [...categoriesList].sort((a, b) => b.score - a.score)[0];
  }, [stats.categories]);

  const focusCategory = useMemo(() => {
    return [...categoriesList].sort((a, b) => a.score - b.score)[0];
  }, [stats.categories]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Your Wellness Progress
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Reflect on your sleep, habits, activity, and lifestyle trends over time.
        </p>
      </div>

      {/* Guest Warning notices */}
      {isGuest && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle size={18} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#b45309', fontSize: '0.88rem' }}>Device-Only Storage</strong>
              <p style={{ color: '#d97706', fontSize: '0.8rem', margin: '2px 0 0 0' }}>
                Guest progress is saved on this device only. Create a free account to sync statistics permanently.
              </p>
            </div>
          </div>
          <Link to="/register" className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'var(--accent-orange)', border: 'none' }}>
            Register Account
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
        // Full Score Dashboards
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            
            {/* Left Card: Circular Wellness Score Gauge */}
            <div className="medical-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-light)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Composite Wellness Index</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Aggregated from screenings, habits, checks, and actions
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', position: 'relative' }}>
                <div style={{ width: '160px', height: '160px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Outer SVG circle */}
                  <svg style={{ position: 'absolute', width: '160px', height: '160px', transform: 'rotate(-90deg)' }}>
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle 
                      cx="80" cy="80" r="70" fill="none" 
                      stroke="var(--primary)" strokeWidth="10" 
                      strokeDasharray="440" 
                      strokeDashoffset={440 - (440 * stats.compositeScore) / 100} 
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-primary)', zIndex: 1 }}>
                    {stats.compositeScore}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, zIndex: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Wellness Index
                  </span>
                </div>
              </div>

              <div style={{ textHeading: 'center', textAlign: 'center' }}>
                <span style={{
                  background: stats.statusBg,
                  color: stats.statusColor,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>
                  {stats.statusLabel}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {stats.explanationText}
                </p>
              </div>

              {/* Show the weights breakdown info */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Source Score Weights:</span>
                  <span style={{ fontWeight: 700 }}><FiInfo size={10} style={{ display: 'inline', marginRight: '2px' }} /> Dynamic Norm</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.75rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Weekly Check-in:</span>
                    <span style={{ fontWeight: 700, color: stats.checkinScore !== null ? 'var(--primary)' : '#94a3b8' }}>
                      {stats.checkinScore !== null ? `${stats.checkinScore} (40%)` : 'Skipped'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Screening Check:</span>
                    <span style={{ fontWeight: 700, color: stats.screeningScore !== null ? 'var(--primary)' : '#94a3b8' }}>
                      {stats.screeningScore !== null ? `${stats.screeningScore} (15%)` : 'Skipped'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Habits Log:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{Math.round(stats.habitRate)}% (25%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Daily Actions:</span>
                    <span style={{ fontWeight: 700, color: stats.actionRate !== null ? 'var(--primary)' : '#94a3b8' }}>
                      {stats.actionRate !== null ? `${Math.round(stats.actionRate)}% (20%)` : 'Skipped'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Trend Chart */}
            <div className="medical-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Wellness Score Trend</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Historical trajectory across weekly assessments
                  </p>
                </div>
                <FiTrendingUp color="var(--primary)" size={20} />
              </div>

              <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
                {stats.trendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#colorScore)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Your chart will appear after a few check-ins.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <Link to="/weekly-checkin" className="btn-ghost" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: '0.82rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  Log Check-in
                </Link>
                <Link to="/health-check" className="btn-ghost" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: '0.82rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  Run screening check
                </Link>
              </div>
            </div>
          </div>

          {/* Section: Balance & Focus */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            
            {/* Card: Weekly Summary Compare */}
            <div className="medical-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Weekly Balance Summary</h3>
                <FiAward size={20} color="var(--primary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stats.weeklyDelta !== null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: stats.weeklyDelta >= 0 ? '#ecfdf5' : '#fef2f2',
                      color: stats.weeklyDelta >= 0 ? '#059669' : '#dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.1rem'
                    }}>
                      {stats.weeklyDelta >= 0 ? `+${stats.weeklyDelta}` : stats.weeklyDelta}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {stats.weeklyDelta >= 0 ? 'Wellness Index Increased' : 'Index Level Shifted'}
                      </strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        Your composite score compared to your previous weekly log.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    ✨ <strong>First week logged!</strong> Complete your next check-in next week to track your comparative balance trend.
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {bestCategory.icon} Best Pattern
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{bestCategory.score}%</span>
                    <p style={{ fontSize: '#0f172a', fontWeight: 700, margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bestCategory.name}</p>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {focusCategory.icon} Focus Space
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#92400e' }}>{focusCategory.score}%</span>
                    <p style={{ fontSize: '#0f172a', fontWeight: 700, margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{focusCategory.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Dynamic Insights List */}
            <div className="medical-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Daily Insights & Focus Actions</h3>
                <FiZap size={20} color="var(--primary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dynamicTips.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.82rem', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none', paddingBottom: i < 2 ? '10px' : '0' }}>
                    <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{item.icon}</span>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                        Focus on {item.name} <span style={{ color: 'var(--primary)', fontWeight: 800 }}>({item.score}%)</span>
                      </span>
                      <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                        {item.tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Category Cards Grid */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Category Balance Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { 
                  name: 'Sleep Quality & Pattern', 
                  score: stats.categories.sleep, 
                  icon: '🌙', 
                  color: '#7c3aed', 
                  bg: '#f3e8ff',
                  status: stats.categories.sleep >= 80 ? 'Excellent' : stats.categories.sleep >= 60 ? 'Consistent' : stats.categories.sleep >= 40 ? 'Moderate' : 'Action Needed',
                  desc: 'Sleep consistency is key for natural cognitive restoration and morning energy.',
                  tip: stats.categories.sleep < 60 ? 'Try a screens-off wind-down alarm 30 mins before bedtime.' : 'Your rest window is stable. Maintain your consistent bedtime!'
                },
                { 
                  name: 'Movement & Activity', 
                  score: stats.categories.activity, 
                  icon: '🏃', 
                  color: '#059669', 
                  bg: '#ecfdf5',
                  status: stats.categories.activity >= 80 ? 'Active' : stats.categories.activity >= 60 ? 'Consistent' : stats.categories.activity >= 40 ? 'Light' : 'Inactive',
                  desc: 'Daily active blocks support steady circulation and lower insulin spikes.',
                  tip: stats.categories.activity < 60 ? 'Walk for 10 minutes after lunches to get a quick energy lift.' : 'Awesome activity rates! You are meeting your healthy routine movement.'
                },
                { 
                  name: 'Nutrition & Meals', 
                  score: stats.categories.nutrition, 
                  icon: '🥗', 
                  color: '#0ea5e9', 
                  bg: '#f0f9ff',
                  status: stats.categories.nutrition >= 80 ? 'Healthy' : stats.categories.nutrition >= 60 ? 'Consistent' : stats.categories.nutrition >= 40 ? 'Irregular' : 'Unplanned',
                  desc: 'Regular healthy, budget-conscious meals maintain metabolic rhythm.',
                  tip: stats.categories.nutrition < 60 ? 'Plan and jot down 3 simple meals in advance to avoid shortcuts.' : 'Outstanding nutrition discipline! Regular plans are supporting your recovery.'
                },
                { 
                  name: 'Stress Resilience', 
                  score: stats.categories.stress, 
                  icon: '🧘', 
                  color: '#d97706', 
                  bg: '#fef3c7',
                  status: stats.categories.stress >= 80 ? 'Balanced' : stats.categories.stress >= 60 ? 'Manageable' : stats.categories.stress >= 40 ? 'Elevated' : 'High Tension',
                  desc: 'Scheduled micro-breaks buffer high study and work focus strain.',
                  tip: stats.categories.stress < 60 ? 'Complete a 5-minute breathing reset mid-day to lower anxiety.' : 'Excellent stress management! Your offline reset routine is working well.'
                },
                { 
                  name: 'Screen Time Balance', 
                  score: stats.categories.screen, 
                  icon: '💻', 
                  color: '#475569', 
                  bg: '#f1f5f9',
                  status: stats.categories.screen >= 80 ? 'Optimal' : stats.categories.screen >= 60 ? 'Moderate' : stats.categories.screen >= 40 ? 'Heavy Use' : 'Excessive',
                  desc: 'Eye and mental fatigue are heavily affected by uninterrupted screen hours.',
                  tip: stats.categories.screen < 60 ? 'Adopt screen boundaries and apply the 20-20-20 rule during study sessions.' : 'Excellent eye breaks! You are avoiding extended screen fatigue patterns.'
                },
                { 
                  name: 'Routine Consistency', 
                  score: stats.categories.consistency, 
                  icon: '⚡', 
                  color: '#0f766e', 
                  bg: '#e6f4fe',
                  status: stats.categories.consistency >= 80 ? 'Strong' : stats.categories.consistency >= 60 ? 'Steady' : stats.categories.consistency >= 40 ? 'Developing' : 'Intermittent',
                  desc: 'Habits and daily action logs show your commitment to consistent progression.',
                  tip: stats.categories.consistency < 60 ? 'Focus on logging just 1 simple habit check-in each day to build momentum.' : 'Amazing consistency! Keep taking small actions every day to stay ahead.'
                }
              ].map(cat => (
                <div key={cat.name} className="medical-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '1.25rem', width: '36px', height: '36px', 
                        background: cat.bg, color: cat.color, borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{cat.icon}</span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{cat.name}</strong>
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', fontWeight: 800, color: cat.score >= 60 ? 'var(--primary)' : '#b45309',
                      background: cat.score >= 60 ? '#f0fdfa' : '#fef3c7', padding: '2px 8px', borderRadius: '8px' 
                    }}>
                      {cat.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {cat.desc}
                  </p>

                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <span>Wellness Score</span>
                      <span>{cat.score}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${cat.score}%`, height: '100%', background: cat.color, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', margin: 0, lineHeight: 1.4 }}>
                    💡 {cat.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer detailed link */}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Link to="/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              View Detailed Screening History logs <FiArrowRight size={14} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;
