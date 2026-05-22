import React, { useEffect, useState } from 'react';
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
  const isGuest = user?.isGuest || user?.role === 'guest';
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
          predictAPI.getHistory(),
          healthAPI.getSummary(7),
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

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



  // Wellness Score logic
  const latestCheck = checks[0];
  const hasScore = checks.length > 0;
  const userHealthScore = latestCheck?.overallRisk?.score || 0;
  
  let scoreStatus = "Getting Started";
  let scoreStatusColor = "#64748b";
  let scoreStatusBg = "#f1f5f9";
  let scoreExplanation = "Complete a wellness check to calculate your lifestyle wellness score.";

  if (hasScore) {
    scoreExplanation = latestCheck?.overallRisk?.explanation || "Based on your latest wellness screening.";
    if (userHealthScore >= 80) {
      scoreStatus = "Consistent";
      scoreStatusColor = "#0f766e";
      scoreStatusBg = "#ccfbf1";
    } else if (userHealthScore >= 60) {
      scoreStatus = "Improving";
      scoreStatusColor = "#0369a1";
      scoreStatusBg = "#e0f2fe";
    } else if (userHealthScore >= 40) {
      scoreStatus = "Needs Attention";
      scoreStatusColor = "#b45309";
      scoreStatusBg = "#fef3c7";
    } else {
      scoreStatus = "Getting Started";
      scoreStatusColor = "#475569";
      scoreStatusBg = "#f1f5f9";
    }
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
      
      {/* Guest Mode Alert Banner */}
      {isGuest && (
        <div className="animate-fade-in" style={{
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
      <div style={{ 
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
            {hasScore ? (
              <>Your current wellness score is <strong>{userHealthScore}/100</strong>. Keep up your habits to maintain consistency!</>
            ) : (
              "Complete your first wellness checkup to calculate your wellness score and get personalized insights."
            )}
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link to="/health-check" className="btn-primary" style={{ background: 'white', color: '#0d9488', fontWeight: 800, padding: '12px 24px', fontSize: '0.9rem' }}>
              <FiPlusCircle /> New Wellness Check
            </Link>
            <Link to="/insights" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              View Trends <FiArrowRight />
            </Link>
          </div>
        </div>
        
        <div style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
          {hasScore ? (
            <>
              <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{userHealthScore}</div>
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r="58" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="65" cy="65" r="58" fill="none" stroke="white" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 - (364 * userHealthScore / 100)} strokeLinecap="round" />
              </svg>
            </>
          ) : (
            <FiTarget size={44} />
          )}
        </div>
      </div>

      {/* Onboarding CTA Card */}
      {!onboardingCompleted && (
        <div className="animate-fade-in" style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          border: '1px solid #7dd3fc',
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1', marginBottom: '6px' }}>
              Personalize Your Wellness Plan
            </h3>
            <p style={{ color: '#0c4a6e', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              Answer a few simple questions so VitalIQ can tailor your meals, habits, and daily actions.
            </p>
          </div>
          <Link to="/onboarding" className="btn-primary" style={{ background: '#0284c7', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Complete Onboarding <FiArrowRight />
          </Link>
        </div>
      )}

      {/* Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Column - Actions and Habits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Today's Wellness Actions */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
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

          {/* Weekly Habits Card */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Weekly Habits</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Build consistency step by step</p>
              </div>
              <FiList color="var(--primary)" size={22} />
            </div>

            {/* Progress indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              <span>Today's Habits: {Object.values(habits).filter(Boolean).length}/6</span>
              <span style={{ color: 'var(--primary)' }}>{weeklyHabitCompletions} completions this week</span>
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
                { key: 'mealPlan', label: 'Meal Plan Consistency', icon: '🥗', target: 'Follow budget meals' },
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
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link to="/habits" className="btn-ghost" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Open Habit Tracker <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Score Summary and Budget Shortcut */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Wellness Score Card */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Wellness Score Summary</h3>
              <FiAward color="var(--primary)" size={22} />
            </div>
            {hasScore ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary)',
                    background: 'var(--primary-50)', width: '70px', height: '70px',
                    borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {userHealthScore}
                  </div>
                  <div>
                    <span style={{ 
                      background: scoreStatusBg, color: scoreStatusColor,
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                      display: 'inline-block', marginBottom: '4px'
                    }}>
                      {scoreStatus}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Screening Health Index</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: 0, background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <strong>Explanation:</strong> {scoreExplanation}
                </p>
                <Link to="/health-check" className="btn-secondary" style={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                  Retake Wellness Screening
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <FiTarget size={24} color="#64748b" />
                </div>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
                  Complete a wellness check to unlock your score.
                </p>
                <Link to="/health-check" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  Start Wellness Check
                </Link>
              </div>
            )}
          </div>

          {/* Weekly Check-in Widget Card */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
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
                      <Link to="/history" className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
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
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                  Reflect on sleep, stress, activity, meals, and screen balance to calculate your weekly score.
                </p>
                <Link to="/weekly-checkin" className="btn-primary" style={{ width: '100%', display: 'inline-block', textAlign: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                  Complete Weekly Check-in
                </Link>
              </div>
            )}
          </div>

          {/* Budget Meal Plan Card */}
          <div className="medical-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Budget Meal Plan Shortcut</h3>
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
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: '56px', height: '56px', background: '#fffbeb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <FiDollarSign size={24} color="#d97706" />
                </div>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
                  Set your budget to get affordable meal ideas.
                </p>
                <Link to="/meal-planner" className="btn-secondary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  Set Budget
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Timeline and History Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Progress Timeline Card */}
        <div className="medical-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
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
            <div style={{ flex: 1, minHeight: '300px' }}>
              <HealthChart 
                data={mappedChartData} 
                type={chartType} 
                title={chartType === 'sleep-stress' ? 'Daily Sleep vs Stress' : 'Daily Steps Activity'} 
              />
            </div>
          )}
        </div>

        {/* History Preview Card */}
        <div className="medical-card" style={{ padding: '24px' }}>
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
      </div>

      {/* Quick Actions Grid */}
      <div className="medical-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '12px' 
        }}>
          {[
            { to: '/health-check', label: 'Wellness Check', icon: <FiPlusCircle />, bg: 'linear-gradient(135deg, #0d9488, #0f766e)' },
            { to: '/meal-planner', label: 'Budget Meal Plan', icon: <FiCoffee />, bg: 'linear-gradient(135deg, #0284c7, #0369a1)' },
            { to: '/habits', label: 'Track Habits', icon: <FiList />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
            { to: '/weekly-checkin', label: 'Weekly Check-in', icon: <FiCalendar />, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            { to: '/insights', label: 'View Progress', icon: <FiTrendingUp />, bg: 'linear-gradient(135deg, #10b981, #059669)' }
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

      {/* Safety Wording Disclaimer */}
      <div style={{ 
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
  );
};

export default Dashboard;
