import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthAPI, predictAPI, weeklyCheckinAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  FiPlusCircle, FiEye, FiCalendar, FiClock, FiCheckCircle, 
  FiAlertCircle, FiActivity, FiZap, FiTarget, FiArrowRight,
  FiCoffee, FiSun, FiMoon, FiDollarSign, FiList, FiTrendingUp,
  FiAlertTriangle, FiSquare, FiCheckSquare, FiAward, FiShield
} from 'react-icons/fi';
import HealthChart from '../components/dashboard/HealthChart';
import { generateDailyActions } from '../utils/actionGenerator';
import { gatherRecommendationData, generateSmartRecommendations } from '../utils/recommendations';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `vitaliq_daily_actions_${year}-${month}-${day}`;
};

const getHabitDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const goalMap = {
  'Eat healthy within budget': 'eat healthy within budget',
  'Improve energy': 'boost daily energy',
  'Sleep better': 'improve sleep quality',
  'Reduce stress': 'manage stress levels',
  'Build consistency': 'build daily consistency',
  'Weight management': 'focus on weight management',
  'General wellness': 'support general wellness'
};

const Dashboard = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('sleep-stress');

  // Preferences mapping
  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});
  const onboardingCompleted = prefs.onboardingCompleted;

  const firstName = isGuest ? 'Guest' : (user?.name?.split(' ')[0] || 'User');

  // Today's actions & weekly habits tracking
  const [dashboardActions, setDashboardActions] = useState([]);
  const [habits, setHabits] = useState({ water: false, sleep: false, walk: false, mealPlan: false, screenBreak: false, stressReset: false });
  const [weeklyHabitCompletions, setWeeklyHabitCompletions] = useState(0);
  const [latestWeeklyCheckin, setLatestWeeklyCheckin] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [checksRes, summaryRes, weeklyCheckinRes] = await Promise.allSettled([
          isGuest
            ? Promise.resolve({ data: { success: true, data: JSON.parse(localStorage.getItem('vitaliq_wellness_checks') || '[]') } })
            : predictAPI.getHistory(),
          isGuest
            ? Promise.resolve({ data: { success: true, data: null } })
            : healthAPI.getSummary(7),
          isGuest 
            ? Promise.resolve({ data: { success: true, data: JSON.parse(localStorage.getItem('vitaliq_weekly_checkins') || '[]') } })
            : weeklyCheckinAPI.getAll()
        ]);

        let latestCheck = null;
        if (checksRes.status === 'fulfilled') {
          const checkList = checksRes.value.data?.data || [];
          setChecks(checkList);
          latestCheck = checkList[0];
        } else {
          console.warn('Failed to load checks history:', checksRes.reason);
          setChecks([]);
        }

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value.data?.data || null);
        } else {
          console.warn('Failed to load summary:', summaryRes.reason);
          setSummary(null);
        }

        if (weeklyCheckinRes.status === 'fulfilled') {
          const checkinList = weeklyCheckinRes.value.data?.data || [];
          if (checkinList.length > 0) {
            setLatestWeeklyCheckin(checkinList[0]);
          }
        } else {
          console.warn('Failed to load weekly check-ins:', weeklyCheckinRes.reason);
          // Try local storage fallback
          try {
            const localList = JSON.parse(localStorage.getItem('vitaliq_weekly_checkins') || '[]');
            if (localList.length > 0) {
              setLatestWeeklyCheckin(localList[0]);
            }
          } catch (e) {}
        }

        // Initialize daily actions from shared key
        const actionsKey = getTodayKey();
        const cachedActions = localStorage.getItem(actionsKey);
        if (cachedActions) {
          setDashboardActions(JSON.parse(cachedActions));
        } else {
          const generated = generateDailyActions(prefs, latestCheck);
          localStorage.setItem(actionsKey, JSON.stringify(generated));
          setDashboardActions(generated);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    const habitDateKey = getHabitDateKey();
    const todayHabits = JSON.parse(localStorage.getItem(`vitaliq_habits_${habitDateKey}`) || '{}');
    const defaultTodayHabits = { water: false, sleep: false, walk: false, mealPlan: false, screenBreak: false, stressReset: false };
    const mergedTodayHabits = { ...defaultTodayHabits, ...todayHabits };
    setHabits(mergedTodayHabits);

    // Calculate weekly completions from vitaliq_habit_history
    const history = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;
      
      const dayHabits = history[dayKey] || {};
      Object.values(dayHabits).forEach(val => {
        if (val === true) count++;
      });
    }
    setWeeklyHabitCompletions(count);
  }, []);

  // Handle checking off actions
  const handleToggleAction = (actionId) => {
    const actionsKey = getTodayKey();
    let syncedHabitId = null;
    let markCompleted = false;

    const updated = dashboardActions.map(act => {
      if (act.id === actionId) {
        const nextCompletedState = !act.completed;
        markCompleted = nextCompletedState;
        
        // Map category to habit id
        const categoryToHabitId = {
          'Hydration': 'water',
          'Sleep': 'sleep',
          'Activity': 'walk',
          'Food': 'mealPlan',
          'Screen Balance': 'screenBreak',
          'Stress': 'stressReset'
        };
        syncedHabitId = categoryToHabitId[act.category];

        return { ...act, completed: nextCompletedState };
      }
      return act;
    });

    localStorage.setItem(actionsKey, JSON.stringify(updated));
    setDashboardActions(updated);

    // Sync habit progress if daily action is completed
    if (syncedHabitId && markCompleted) {
      const habitDateKey = getHabitDateKey();
      const todayHabits = JSON.parse(localStorage.getItem(`vitaliq_habits_${habitDateKey}`) || '{}');
      const defaultTodayHabits = { water: false, sleep: false, walk: false, mealPlan: false, screenBreak: false, stressReset: false };
      const mergedTodayHabits = { ...defaultTodayHabits, ...todayHabits };
      
      if (!mergedTodayHabits[syncedHabitId]) {
        mergedTodayHabits[syncedHabitId] = true;
        localStorage.setItem(`vitaliq_habits_${habitDateKey}`, JSON.stringify(mergedTodayHabits));
        
        const history = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
        history[habitDateKey] = mergedTodayHabits;
        localStorage.setItem('vitaliq_habit_history', JSON.stringify(history));
        
        setHabits(mergedTodayHabits);

        // Recompute weekly completions
        let count = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dayKey = `${year}-${month}-${day}`;
          
          const dayHabits = history[dayKey] || {};
          Object.values(dayHabits).forEach(val => {
            if (val === true) count++;
          });
        }
        setWeeklyHabitCompletions(count);
        toast.success(`Category habit completed! 🚀`);
      }
    }
  };

  // Handle checking off habits
  const handleToggleHabit = (habitKey) => {
    const habitDateKey = getHabitDateKey();
    const todayHabits = JSON.parse(localStorage.getItem(`vitaliq_habits_${habitDateKey}`) || '{}');
    const defaultTodayHabits = { water: false, sleep: false, walk: false, mealPlan: false, screenBreak: false, stressReset: false };
    const mergedTodayHabits = { ...defaultTodayHabits, ...todayHabits };
    
    mergedTodayHabits[habitKey] = !mergedTodayHabits[habitKey];
    
    localStorage.setItem(`vitaliq_habits_${habitDateKey}`, JSON.stringify(mergedTodayHabits));
    
    const history = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
    history[habitDateKey] = mergedTodayHabits;
    localStorage.setItem('vitaliq_habit_history', JSON.stringify(history));
    
    setHabits(mergedTodayHabits);

    // Recompute weekly completions
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;
      
      const dayHabits = history[dayKey] || {};
      Object.values(dayHabits).forEach(val => {
        if (val === true) count++;
      });
    }
    setWeeklyHabitCompletions(count);
  };

  // Generate Personalized Focus Tagline
  const getFocusTagline = (prefs) => {
    if (!prefs || !prefs.onboardingCompleted) return 'Try a quick wellness check and budget meal plan.';
    const goalPhrases = (prefs.goals || []).map(g => goalMap[g] || g.toLowerCase());
    let tagline = goalPhrases.join(' & ');
    if (!tagline) tagline = 'support general wellness';
    if (prefs.budgetAmount) {
      tagline += ` within ₹${prefs.budgetAmount}/${prefs.budgetPeriod === 'Per day' ? 'day' : prefs.budgetPeriod === 'Per week' ? 'week' : 'month'}`;
    }
    return `Today's focus: ${tagline}.`;
  };



  // Composite Wellness Score logic
  const compositeStats = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }

    // A. Habit Rate
    const habitRate = (weeklyHabitCompletions / 42) * 100;

    // B. Action Rate
    let generatedActions = 0;
    let completedActions = 0;
    dates.forEach(dateStr => {
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (dateStr === todayKey) {
        generatedActions += dashboardActions.length;
        completedActions += dashboardActions.filter(a => a.completed).length;
      } else {
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
      }
    });
    const actionRate = generatedActions > 0 ? (completedActions / generatedActions) * 100 : null;

    // C. Latest Weekly Check-in Score
    const checkinScore = latestWeeklyCheckin ? (latestWeeklyCheckin.weeklyScore ?? null) : null;

    // D. Latest Wellness Screening Score
    const latestCheck = checks[0] || null;
    const screeningScore = latestCheck?.overallRisk?.score ? (100 - latestCheck.overallRisk.score) : null;

    // E. Composite Wellness Score
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

    return {
      compositeScore,
      statusLabel,
      statusColor,
      statusBg,
      explanationText,
      hasData: checks.length > 0 || latestWeeklyCheckin !== null
    };
  }, [checks, latestWeeklyCheckin, weeklyHabitCompletions, dashboardActions]);

  const smartRecsResult = useMemo(() => {
    const inputData = gatherRecommendationData(user);
    inputData.latestWellnessCheck = checks[0] || null;
    inputData.latestWeeklyCheckin = latestWeeklyCheckin;
    return generateSmartRecommendations(inputData);
  }, [user, checks, latestWeeklyCheckin, dashboardActions]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Map checks history for Recharts HealthChart
  const mappedChartData = checks.map(check => {
    let stressVal = 0;
    const stressRaw = check.input?.stressLevel;
    if (typeof stressRaw === 'number') {
      stressVal = stressRaw;
    } else if (stressRaw === 'High' || stressRaw === 'high') {
      stressVal = 8;
    } else if (stressRaw === 'Medium' || stressRaw === 'medium') {
      stressVal = 5;
    } else if (stressRaw === 'Low' || stressRaw === 'low') {
      stressVal = 2;
    }

    return {
      date: check.date,
      sleepHours: check.input?.sleepHours || check.input?.sleep || 0,
      stressLevel: stressVal,
      steps: check.input?.steps || 0
    };
  }).reverse();

  const completedCount = dashboardActions.filter(act => act.completed).length;
  const totalCount = dashboardActions.length;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="dashboard-grid">
        {/* Guest Mode Alert Banner */}
        {isGuest && (
          <div className="animate-fade-in card-guest" style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b' }}>
              <FiAlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                You're using VitalIQ as a guest. Your results may not be saved permanently.
              </span>
            </div>
            <Link to="/register" className="btn-primary" style={{ background: '#dc2626', color: 'white', fontWeight: 700, padding: '8px 16px', fontSize: '0.8rem' }}>
              Create Account to Save Progress
            </Link>
          </div>
        )}

        {/* Hero Section */}
        <div className="card-hero" style={{ 
          background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
          padding: '36px 40px',
          borderRadius: '24px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 10px 30px rgba(13, 148, 136, 0.15)'
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              {onboardingCompleted 
                ? `Welcome back, ${firstName}! 👋`
                : `Hello, ${firstName}! 👋`
              }
            </h1>
            <p style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              background: 'rgba(255,255,255,0.18)', 
              padding: '8px 16px', 
              borderRadius: '12px', 
              display: 'inline-block', 
              marginBottom: '16px', 
              backdropFilter: 'blur(4px)',
              marginRight: '8px'
            }}>
              {getFocusTagline(prefs)}
            </p>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6, margin: 0 }}>
              {compositeStats.hasData ? (
                <>Your current wellness score is <strong>{compositeStats.compositeScore}/100</strong>. Keep up your habits to maintain consistency!</>
              ) : (
                "Complete your first wellness checkup to calculate your wellness score and get personalized insights."
              )}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
              <Link to="/health-check" className="btn-primary" style={{ background: 'white', color: '#0d9488', fontWeight: 800, padding: '12px 24px', fontSize: '0.9rem' }}>
                <FiPlusCircle /> New Wellness Check
              </Link>
              <Link to="/progress" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                View Trends <FiArrowRight />
              </Link>
            </div>
          </div>
          
          <div style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            {compositeStats.hasData ? (
              <>
                <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{compositeStats.compositeScore}</div>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="65" cy="65" r="58" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle cx="65" cy="65" r="58" fill="none" stroke="white" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 - (364 * compositeStats.compositeScore / 100)} strokeLinecap="round" />
                </svg>
              </>
            ) : (
              <FiTarget size={44} />
            )}
          </div>
        </div>

        {/* Onboarding CTA Card */}
        {!onboardingCompleted && (
          <div className="card-onboarding" style={{ gridColumn: 'span 2' }}>
            <EmptyState
              title="Personalize your wellness plan"
              description="Answer a few simple questions so VitalIQ can tailor your meals, habits, and daily actions."
              primaryActionLabel="Complete Onboarding"
              primaryActionTo="/onboarding"
              icon="🎯"
            />
          </div>
        )}

        {/* Today's Wellness Actions */}
        <div className="medical-card card-actions" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Today's Wellness Actions</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                {totalCount > 0 ? `${completedCount} of ${totalCount} actions completed today` : 'Personalized daily focus goals'}
              </p>
            </div>
            <FiCheckCircle color="var(--primary)" size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {dashboardActions.slice(0, 3).map((action) => {
              const isCompleted = action.completed;
              return (
                <div key={action.id} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  padding: '12px 16px',
                  background: isCompleted ? 'var(--primary-50)' : '#f8fafc',
                  border: `1.5px solid ${isCompleted ? 'var(--primary-100)' : '#f1f5f9'}`,
                  borderRadius: '14px',
                  transition: 'all 0.2s'
                }}>
                  <button 
                    onClick={() => handleToggleAction(action.id)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isCompleted ? 'var(--primary)' : '#94a3b8',
                      marginTop: '2px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    {isCompleted ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem', 
                      color: isCompleted ? '#475569' : '#0f172a',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {action.title}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{action.reason}</p>
                  </div>
                </div>
              );
            })}
            {dashboardActions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No actions generated yet.
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/daily-actions" className="btn-ghost" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              View All Actions <FiArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Wellness Score Summary Card */}
        <div className="medical-card card-score" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Wellness Score Summary</h3>
            <FiAward color="var(--primary)" size={22} />
          </div>
          {checks.length === 0 ? (
            <EmptyState
              plain={true}
              title="Start your first wellness check"
              description="Get a simple lifestyle-based wellness estimate without needing medical reports."
              icon="🏃"
              primaryActionLabel="Start Wellness Check"
              primaryActionTo="/health-check"
            />
          ) : !compositeStats.hasData ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <FiTarget size={24} color="#64748b" />
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
                Complete a check-in or screening to unlock your composite score.
              </p>
              <Link to="/weekly-checkin" className="btn-primary" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center', padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
                Complete Weekly Check-in
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary)',
                  background: 'var(--primary-50)', width: '70px', height: '70px',
                  borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {compositeStats.compositeScore}
                </div>
                <div>
                  <span style={{ 
                    background: compositeStats.statusBg, color: compositeStats.statusColor,
                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                    display: 'inline-block', marginBottom: '4px'
                  }}>
                    {compositeStats.statusLabel}
                  </span>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Composite Wellness Index</p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: 0, background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                {compositeStats.explanationText}
              </p>
              <Link to="/progress" className="btn-secondary" style={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>
                View Progress Timeline
              </Link>
            </div>
          )}
        </div>

        {/* Budget Meal Plan Card */}
        <div className="medical-card card-meals" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Budget Meal Plan</h3>
            <FiDollarSign color="var(--primary)" size={22} />
          </div>
          {prefs.budgetAmount ? (
            <div>
              <div style={{ 
                background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'
              }}>
                <div style={{ fontSize: '1.6rem' }}>🍱</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>Daily Budget Target</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e' }}>
                    ₹{prefs.budgetAmount} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ {prefs.budgetPeriod?.toLowerCase()}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.4 }}>
                Generates realistic meal ideas based on your budget, food preference, and living type.
              </p>
              <Link to="/meal-planner" className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                Generate Meal Plan
              </Link>
            </div>
          ) : (
            <EmptyState
              plain={true}
              title="Create your first budget meal plan"
              description="Get affordable meal ideas based on your budget, food preference, and routine."
              icon="🥗"
              primaryActionLabel="Generate Meal Plan"
              primaryActionTo="/meal-planner"
            />
          )}
        </div>

        {/* Weekly Habits Card */}
        <div className="medical-card card-habits" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Weekly Habits</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Build consistency step by step</p>
            </div>
            <FiList color="var(--primary)" size={22} />
          </div>

          {weeklyHabitCompletions === 0 ? (
            <EmptyState
              plain={true}
              title="Start with one small habit"
              description="Track simple habits like water, sleep, walking, and screen breaks."
              icon="💧"
              primaryActionLabel="Start Habits"
              primaryActionTo="/habits"
            />
          ) : (
            <>
              {/* Progress indicators */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <span>Today: {Object.values(habits).filter(Boolean).length}/6</span>
                <span style={{ color: 'var(--primary)' }}>{weeklyHabitCompletions} logged this week</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ 
                  width: `${(Object.values(habits).filter(Boolean).length / 6) * 100}%`, 
                  height: '100%', 
                  background: 'var(--primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* List of habits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {[
                  { key: 'water', label: 'Hydration (Water)', icon: '💧', target: '6 glasses' },
                  { key: 'sleep', label: 'Sleep Target', icon: '🌙', target: prefs.sleepTarget || '7-9 hours' },
                  { key: 'walk', label: 'Movement (Walk)', icon: '🏃', target: '20 mins activity' },
                  { key: 'mealPlan', label: 'Meal Consistency', icon: '🥗', target: 'Follow meals' },
                  { key: 'screenBreak', label: 'Screen Breaks', icon: '💻', target: '3 breaks' },
                  { key: 'stressReset', label: 'Stress Reset', icon: '🧘', target: '5 mins reset' }
                ].map((h) => {
                  const done = habits[h.key];
                  return (
                    <div 
                      key={h.key}
                      onClick={() => handleToggleHabit(h.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: done ? '#f0fdf4' : '#f8fafc',
                        border: `1.5px solid ${done ? '#dcfce7' : '#f1f5f9'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{h.icon}</span>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{h.label}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>({h.target})</span>
                        </div>
                      </div>
                      {done ? <FiCheckCircle color="#10b981" size={18} /> : <FiSquare color="#94a3b8" size={18} />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/habits" className="btn-ghost" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Open Habit Tracker <FiArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Progress Timeline Card */}
        <div className="medical-card card-progress" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Your Progress</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Wellness trend timeline</p>
            </div>
            {checks.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                <button 
                  onClick={() => setChartType('sleep-stress')}
                  style={{
                    background: chartType === 'sleep-stress' ? 'white' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: chartType === 'sleep-stress' ? 'var(--primary)' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Sleep & Stress
                </button>
                <button 
                  onClick={() => setChartType('activity')}
                  style={{
                    background: chartType === 'activity' ? 'white' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: chartType === 'activity' ? 'var(--primary)' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Steps Activity
                </button>
              </div>
            )}
          </div>

          {checks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '40px 0', border: '2px dashed #f1f5f9', borderRadius: '16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1
            }}>
              <FiTrendingUp size={36} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, maxWidth: '260px', lineHeight: 1.4 }}>
                Your progress timeline will appear after your first wellness check.
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '260px' }}>
              <HealthChart 
                data={mappedChartData} 
                type={chartType} 
                title={chartType === 'sleep-stress' ? 'Daily Sleep vs Stress' : 'Daily Steps Activity'} 
              />
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="medical-card card-quick">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '12px' 
          }}>
            {[
              { to: '/health-check', label: 'Wellness Check', icon: <FiPlusCircle />, bg: 'linear-gradient(135deg, #0d9488, #0f766e)' },
              { to: '/meal-planner', label: 'Budget Meal Plan', icon: <FiCoffee />, bg: 'linear-gradient(135deg, #0284c7, #0369a1)' },
              { to: '/habits', label: 'Track Habits', icon: <FiList />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
              { to: '/weekly-checkin', label: 'Weekly Check-in', icon: <FiCalendar />, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
              { to: '/progress', label: 'View Progress', icon: <FiTrendingUp />, bg: 'linear-gradient(135deg, #10b981, #059669)' }
            ].map((action, idx) => (
              <Link 
                key={idx} 
                to={action.to} 
                style={{ 
                  background: action.bg, 
                  color: 'white', 
                  textDecoration: 'none', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '1.4rem' }}>{action.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Weekly Check-in Widget Card */}
        <div className="medical-card card-reflection" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Weekly Reflection</h3>
            <FiCalendar color="var(--primary)" size={22} />
          </div>

          {latestWeeklyCheckin ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{latestWeeklyCheckin.weeklyScore}</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>/ 100</span>
                </div>
                <div>
                  <span style={{
                    background: latestWeeklyCheckin.status === 'Consistent' ? '#ecfdf5' : latestWeeklyCheckin.status === 'Improving' ? '#f0fdfa' : latestWeeklyCheckin.status === 'Getting started' ? '#fef3c7' : '#fef2f2',
                    color: latestWeeklyCheckin.status === 'Consistent' ? '#059669' : latestWeeklyCheckin.status === 'Improving' ? '#0d9488' : latestWeeklyCheckin.status === 'Getting started' ? '#d97706' : '#dc2626',
                    border: `1px solid ${latestWeeklyCheckin.status === 'Consistent' ? '#a7f3d0' : latestWeeklyCheckin.status === 'Improving' ? '#99f6e4' : latestWeeklyCheckin.status === 'Getting started' ? '#fde68a' : '#fecaca'}`,
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-block',
                    marginBottom: '2px'
                  }}>
                    {latestWeeklyCheckin.status}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Logged {new Date(latestWeeklyCheckin.createdAt || latestWeeklyCheckin.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {latestWeeklyCheckin && (new Date() - new Date(latestWeeklyCheckin.createdAt || latestWeeklyCheckin.weekStartDate)) < 7 * 24 * 60 * 60 * 1000 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    You're up to date! Your next lifestyle reflection check-in is due in a few days.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/progress" className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                      View Weekly Progress
                    </Link>
                    <Link to="/weekly-checkin" className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--border-light)' }}>
                      Retake
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px', fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                    ⚡ It has been over 7 days since your last reflection check-in.
                  </div>
                  <Link to="/weekly-checkin" className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                    Complete Weekly Check-in
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              plain={true}
              title="Complete your first weekly check-in"
              description="Reflect on sleep, stress, food, activity, and energy to track your progress."
              icon="📅"
              primaryActionLabel="Start Weekly Check-in"
              primaryActionTo="/weekly-checkin"
            />
          )}
        </div>

        {/* Smart Recommendations Card */}
        <div className="medical-card card-recs" style={{ border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Smart Recommendations</h3>
              <span style={{ 
                background: 'var(--primary-50)', color: 'var(--primary)',
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                display: 'inline-block', marginTop: '6px'
              }}>
                Focus: {smartRecsResult.focusArea}
              </span>
            </div>
            <FiTarget color="var(--primary)" size={22} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {smartRecsResult.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: '1rem', marginTop: '-2px' }}>•</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{rec.title}</div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>{rec.action}</p>
                </div>
              </div>
            ))}
            {smartRecsResult.recommendations.length === 0 && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                No recommendations generated yet. Log data to receive suggestions.
              </p>
            )}
          </div>

          <Link to="/recommendations" className="btn-secondary" style={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>
            View All Recommendations
          </Link>
        </div>

        {/* History Preview Card */}
        <div className="medical-card card-history">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Recent Wellness History</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Latest checked risk reports</p>
            </div>
            <Link to="/history" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              See All
            </Link>
          </div>
          {checks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', border: '2px dashed #f1f5f9', borderRadius: '16px' }}>
              <FiActivity size={32} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No screenings performed yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {checks.slice(0, 3).map((check, i) => (
                <div key={i} style={{ 
                  padding: '14px', 
                  background: '#f8fafc', 
                  borderRadius: '14px', 
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      {check.checkType || 'Screening'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {new Date(check.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      background: check.overallRisk?.level === 'High' ? '#fee2e2' : check.overallRisk?.level === 'Medium' ? '#fef3c7' : '#dcfce7',
                      color: check.overallRisk?.level === 'High' ? '#b91c1c' : check.overallRisk?.level === 'Medium' ? '#b45309' : '#15803d',
                      padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700
                    }}>
                      {check.overallRisk?.level || 'Low'}
                    </span>
                    <Link to={`/results/${check._id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      <FiEye /> View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety Wording Disclaimer */}
        <div className="card-safety" style={{ 
          textAlign: 'center', 
          padding: '12px 20px', 
          background: '#f8fafc', 
          border: '1.5px solid #f1f5f9', 
          borderRadius: '14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          color: '#64748b'
        }}>
          <FiShield size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4 }}>
            <strong>Safety Disclaimer: </strong>
            VitalIQ Health provides wellness insights, lifestyle risk estimates, and general wellness suggestions only. This platform does not provide medical diagnosis, disease prediction, treatment, or cure. Consult a qualified professional for medical advice.
          </span>
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .card-guest { grid-column: span 2; }
        .card-hero { grid-column: span 2; }
        .card-onboarding { grid-column: span 2; }
        .card-actions { grid-column: 1; }
        .card-habits { grid-column: 1; }
        .card-score { grid-column: 2; }
        .card-meals { grid-column: 2; }
        .card-progress { grid-column: 1; }
        .card-quick { grid-column: span 2; }
        .card-reflection { grid-column: 2; }
        .card-recs { grid-column: 2; }
        .card-history { grid-column: 2; }
        .card-safety { grid-column: span 2; }

        @media (max-width: 900px) {
          .dashboard-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .card-guest { order: 0; }
          .card-hero { order: 1; }
          .card-actions { order: 2; }
          .card-score { order: 3; }
          .card-meals { order: 4; }
          .card-habits { order: 5; }
          .card-progress { order: 6; }
          .card-quick { order: 7; }
          .card-reflection { order: 8; }
          .card-recs { order: 9; }
          .card-history { order: 10; }
          .card-safety { order: 11; }
        }
        @media (max-width: 600px) {
          .card-hero {
            padding: 24px 20px !important;
            border-radius: 16px !important;
          }
          .card-hero h1 {
            font-size: 1.45rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

