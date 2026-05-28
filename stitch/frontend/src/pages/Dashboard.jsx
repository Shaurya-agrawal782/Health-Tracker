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
  
  // Guest status
  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});
  const onboardingCompleted = prefs.onboardingCompleted;

  const firstName = isGuest ? 'Guest' : (user?.name?.split(' ')[0] || 'User');

  // Local state for guest banner dismissal
  const [showGuestBanner, setShowGuestBanner] = useState(() => {
    return sessionStorage.getItem('vitaliq_dismiss_guest_banner') !== 'true';
  });

  const handleDismissGuestBanner = () => {
    sessionStorage.setItem('vitaliq_dismiss_guest_banner', 'true');
    setShowGuestBanner(false);
  };

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

  // Generate Focus Tagline
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

  // Primary Action Card Logic
  const primaryAction = useMemo(() => {
    if (!onboardingCompleted) {
      return {
        title: "Complete Onboarding",
        description: "Answer a few simple questions so VitalIQ can tailor your meals, habits, and daily actions.",
        btnText: "Personalize Now",
        to: "/onboarding",
        icon: "🎯"
      };
    }
    if (checks.length === 0) {
      return {
        title: "Start your first wellness check",
        description: "Take a 2-minute lifestyle assessment to establish your health baseline and unlock tailored insights.",
        btnText: "Start Wellness Check",
        to: "/health-check",
        icon: "🏃"
      };
    }
    if (!prefs.budgetAmount) {
      return {
        title: "Create your first budget meal plan",
        description: "Set up a daily budget and get healthy, affordable meal recommendations tailored to your goals.",
        btnText: "Generate Meal Plan",
        to: "/meal-planner",
        icon: "🥗"
      };
    }

    const completedActionsCount = dashboardActions.filter(act => act.completed).length;
    if (completedActionsCount === 0 && dashboardActions.length > 0) {
      return {
        title: "Complete Today's Actions",
        description: "Take small daily steps toward your focus goals by completing your wellness actions.",
        btnText: "View Today's Actions",
        to: "/daily-actions",
        icon: "⚡"
      };
    }

    return {
      title: "Continue Habit Progress",
      description: "Keep up the excellent momentum! Track your daily hydration, sleep, and activity to build consistency.",
      btnText: "Open Habits",
      to: "/habits",
      icon: "💧"
    };
  }, [onboardingCompleted, checks, prefs.budgetAmount, dashboardActions]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const completedCount = dashboardActions.filter(act => act.completed).length;
  const totalCount = dashboardActions.length;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Guest Mode Alert Banner */}
      {isGuest && showGuestBanner && (
        <div className="animate-fade-in card-guest" style={{
          background: '#f0fdfa',
          border: '1px solid #ccfbf1',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f766e' }}>
            <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              You're using guest mode. Sign in to save your progress across devices.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ background: '#0d9488', color: 'white', fontWeight: 700, padding: '8px 16px', fontSize: '0.8rem' }}>
              Create Account
            </Link>
            <button onClick={handleDismissGuestBanner} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #cbd5e1' }}>
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      {/* Top Hero / Status Card */}
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
        {!onboardingCompleted ? (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Personalize your plan 🎯
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.95, maxWidth: '600px', lineHeight: 1.6, marginBottom: '20px' }}>
              Answer a few simple questions so VitalIQ can tailor your meals, habits, and daily actions.
            </p>
            <Link to="/onboarding" className="btn-primary" style={{ background: 'white', color: '#0d9488', fontWeight: 800, padding: '12px 24px', fontSize: '0.9rem' }}>
              Personalize Now
            </Link>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Welcome back, {firstName}! 👋
            </h1>
            <p style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              background: 'rgba(255,255,255,0.18)', 
              padding: '8px 16px', 
              borderRadius: '12px', 
              display: 'inline-block', 
              marginBottom: '16px', 
              backdropFilter: 'blur(4px)'
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
          </div>
        )}
        
        {onboardingCompleted && (
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
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <FiTarget size={36} style={{ marginBottom: '2px' }} />
                <span style={{ fontSize: '0.65rem', display: 'block', fontWeight: 700, opacity: 0.8 }}>No Score</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Next Action Card */}
      <div className="medical-card primary-action-card pulse-line animate-fade-in-up" style={{
        padding: '24px 32px',
        background: 'linear-gradient(145deg, #ffffff 0%, #f0faf6 100%)',
        border: '1px solid #a0d9c9',
        borderRadius: '20px',
        boxShadow: '0 8px 24px rgba(13, 148, 136, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'var(--primary-50)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.1)',
            flexShrink: 0
          }}>
            {primaryAction.icon === "🎯" && <FiTarget size={26} />}
            {primaryAction.icon === "🏃" && <FiActivity size={26} />}
            {primaryAction.icon === "🥗" && <FiCoffee size={26} />}
            {primaryAction.icon === "⚡" && <FiZap size={26} />}
            {primaryAction.icon === "💧" && <FiList size={26} />}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Recommended Next Step
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 4px 0' }}>
              {primaryAction.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {primaryAction.description}
            </p>
          </div>
        </div>
        <Link to={primaryAction.to} className="btn-primary" style={{ 
          padding: '12px 24px', 
          fontSize: '0.9rem', 
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          {primaryAction.btnText} <FiArrowRight />
        </Link>
      </div>

      {/* Two-Column Dashboard Grid */}
      <div className="dashboard-layout-grid">
        
        {/* LEFT COLUMN: Actions, Meal Plan, Habits */}
        <div className="dashboard-column-left">
          
          {/* Today's Wellness Actions */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Today's Wellness Actions</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {totalCount > 0 ? `${completedCount} of ${totalCount} completed today` : 'Small daily focus goals'}
                </p>
              </div>
              <FiCheckCircle color="var(--primary)" size={20} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dashboardActions.slice(0, 3).map((action) => {
                const isCompleted = action.completed;
                return (
                  <div key={action.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 14px',
                    background: isCompleted ? 'var(--primary-50)' : '#f8fafc',
                    border: `1px solid ${isCompleted ? 'var(--primary-100)' : '#f1f5f9'}`,
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}>
                    <button 
                      onClick={() => handleToggleAction(action.id)}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isCompleted ? 'var(--primary)' : '#94a3b8',
                        display: 'flex', alignItems: 'center'
                      }}
                    >
                      {isCompleted ? <FiCheckSquare size={18} /> : <FiSquare size={18} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '0.85rem', 
                        color: isCompleted ? '#475569' : '#0f172a',
                        textDecoration: isCompleted ? 'line-through' : 'none'
                      }}>
                        {action.title}
                      </span>
                      <span style={{ 
                        marginLeft: '8px',
                        background: isCompleted ? '#ccfbf1' : '#e2e8f0',
                        color: isCompleted ? '#0f766e' : '#475569',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.65rem',
                        fontWeight: 700
                      }}>
                        {action.category}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {dashboardActions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No actions generated yet. Complete onboarding or a checkup to generate focus targets.
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link to="/daily-actions" className="btn-ghost" style={{ width: '100%', fontSize: '0.8rem', padding: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                View All Actions <FiArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Budget Meal Plan Preview */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Budget Meal Plan Preview</h3>
              <FiDollarSign color="var(--primary)" size={20} />
            </div>

            {prefs.budgetAmount ? (
              <div>
                <div style={{ 
                  background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px',
                  display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '1.4rem' }}>🍱</div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Daily Budget Target</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>
                      ₹{prefs.budgetAmount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ {prefs.budgetPeriod?.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
                  Plan Status: Active! Healthy meals structured under ₹{prefs.budgetAmount}.
                </p>
                <Link to="/meal-planner" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
                  View Meal Plan
                </Link>
              </div>
            ) : (
              <div>
                <EmptyState
                  plain={true}
                  title="Create your first budget meal plan"
                  description="Get affordable meal suggestions based on your personal budget and preferences."
                  icon="🥗"
                />
                <Link to="/meal-planner" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 700, marginTop: '12px' }}>
                  Generate Meal Plan
                </Link>
              </div>
            )}
          </div>

          {/* Habit Progress Preview */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Habit Progress Preview</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Daily consistency check</p>
              </div>
              <FiList color="var(--primary)" size={20} />
            </div>

            {weeklyHabitCompletions === 0 && Object.values(habits).filter(Boolean).length === 0 ? (
              <div>
                <EmptyState
                  plain={true}
                  title="Track one small habit today"
                  description="Build baseline streaks in hydration, step goals, or screens break routines."
                  icon="💧"
                />
                <Link to="/habits" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 700, marginTop: '12px' }}>
                  Open Habits
                </Link>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  <span>Today's Top Habits</span>
                  <span style={{ color: 'var(--primary)' }}>{weeklyHabitCompletions} logged this week</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ 
                    width: `${(Object.values(habits).filter(Boolean).length / 6) * 100}%`, 
                    height: '100%', 
                    background: 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'water', label: 'Hydration (Water)', icon: '💧', target: '6 glasses' },
                    { key: 'sleep', label: 'Sleep Target', icon: '🌙', target: prefs.sleepTarget || '7-9 hours' },
                    { key: 'walk', label: 'Movement (Walk)', icon: '🏃', target: '20 mins' }
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
                          padding: '10px 12px',
                          background: done ? '#f0fdf4' : '#f8fafc',
                          border: `1px solid ${done ? '#dcfce7' : '#f1f5f9'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{h.icon}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{h.label}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({h.target})</span>
                        </div>
                        {done ? <FiCheckCircle color="#10b981" size={16} /> : <FiSquare color="#94a3b8" size={16} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <Link to="/habits" className="btn-ghost" style={{ width: '100%', fontSize: '0.8rem', padding: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Open Habits <FiArrowRight size={12} />
                  </Link>
                </div>
              </>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Progress, Recommendations */}
        <div className="dashboard-column-right">
          
          {/* Progress Preview */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Progress Preview</h3>
              <FiTrendingUp color="var(--primary)" size={20} />
            </div>

            {!compositeStats.hasData ? (
              <div>
                <EmptyState
                  plain={true}
                  title="Start your first wellness check"
                  description="Complete a lifestyle screening checkup to see your progress metrics and trends."
                  icon="📈"
                />
                <Link to="/health-check" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 700, marginTop: '12px' }}>
                  Start Wellness Check
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    fontSize: '2rem', fontWeight: 900, color: 'var(--primary)',
                    background: 'var(--primary-50)', width: '60px', height: '60px',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {compositeStats.compositeScore}
                  </div>
                  <div>
                    <span style={{ 
                      background: compositeStats.statusBg, color: compositeStats.statusColor,
                      padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700,
                      display: 'inline-block', marginBottom: '2px'
                    }}>
                      {compositeStats.statusLabel}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Latest Composite Score</p>
                  </div>
                </div>
                
                {latestWeeklyCheckin && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      <span>Weekly Reflection:</span>
                      <span style={{ color: 'var(--primary)' }}>{latestWeeklyCheckin.weeklyScore}/100</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                      Status classified as "{latestWeeklyCheckin.status}". Checked {new Date(latestWeeklyCheckin.createdAt || latestWeeklyCheckin.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.
                    </p>
                  </div>
                )}

                <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4, margin: 0 }}>
                  {compositeStats.explanationText}
                </p>
                
                <Link to="/progress" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
                  View Progress
                </Link>
              </div>
            )}
          </div>

          {/* Smart Recommendations Preview */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Smart Recommendations</h3>
                <span style={{ 
                  background: 'var(--primary-50)', color: 'var(--primary)',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700,
                  display: 'inline-block', marginTop: '4px'
                }}>
                  Focus: {smartRecsResult.focusArea}
                </span>
              </div>
              <FiTarget color="var(--primary)" size={20} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {smartRecsResult.recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1rem', marginTop: '-1px' }}>•</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{rec.title}</div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '1px 0 0 0', lineHeight: 1.3 }}>{rec.action}</p>
                  </div>
                </div>
              ))}
              
              {smartRecsResult.recommendations.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  No recommendations generated yet. Log data to receive suggestions.
                </p>
              )}
            </div>

            <Link to="/recommendations" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', display: 'block' }}>
              View Recommendations
            </Link>
          </div>

        </div>

      </div>

      {/* Safety Wording Disclaimer */}
      <div className="card-safety" style={{ 
        textAlign: 'center', 
        padding: '12px 20px', 
        background: '#f8fafc', 
        border: '1px solid #f1f5f9', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        color: '#64748b',
        marginTop: '12px'
      }}>
        <FiShield size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4 }}>
          <strong>Safety Disclaimer: </strong>
          VitalIQ Health provides wellness insights, lifestyle risk estimates, and general wellness suggestions only. This platform does not provide medical diagnosis, disease prediction, treatment, or cure. Consult a qualified professional for medical advice.
        </span>
      </div>

      <style>{`
        .dashboard-layout-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .dashboard-column-left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dashboard-column-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-layout-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .dashboard-column-left {
            gap: 16px;
          }
          .dashboard-column-right {
            gap: 16px;
          }
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
