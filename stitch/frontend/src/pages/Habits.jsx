import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiCheckCircle, FiCheck, FiSquare, FiCheckSquare, 
  FiAlertTriangle, FiZap, FiSmile, FiTrendingUp, FiAward, FiInfo, FiTrendingDown, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';

// Default habits template
const DEFAULT_HABITS = [
  {
    id: 'water',
    name: 'Water Intake',
    category: 'Hydration',
    description: 'Drink water consistently throughout the day to support energy levels and focus.',
    target: '6 glasses',
    unit: 'glasses',
    icon: '💧',
    color: '#0284c7',
    bg: '#e6f4fe'
  },
  {
    id: 'sleep',
    name: 'Sleep Consistency',
    category: 'Sleep',
    description: 'Aim for a consistent bedtime and rest duration to optimize overnight recovery.',
    target: '7-9 hours',
    unit: 'bedtime/rest',
    icon: '🌙',
    color: '#7c3aed',
    bg: '#f3e8ff'
  },
  {
    id: 'walk',
    name: 'Movement & Walk',
    category: 'Activity',
    description: 'Take a short walk to keep active, lower blood sugar spikes, and clear your mind.',
    target: '20 minutes',
    unit: 'minutes',
    icon: '🏃',
    color: '#059669',
    bg: '#ecfdf5'
  },
  {
    id: 'mealPlan',
    name: 'Meal Plan Consistency',
    category: 'Food',
    description: 'Follow one planned budget-friendly, healthy meal to maintain nutritional balance.',
    target: '1 planned meal',
    unit: 'meal',
    icon: '🥗',
    color: '#0ea5e9',
    bg: '#f0f9ff'
  },
  {
    id: 'screenBreak',
    name: 'Eye & Screen Breaks',
    category: 'Screen Balance',
    description: 'Practice screen breaks like the 20-20-20 rule to lower fatigue.',
    target: '3 breaks',
    unit: 'breaks',
    icon: '💻',
    color: '#475569',
    bg: '#f1f5f9'
  },
  {
    id: 'stressReset',
    name: 'Mindful Stress Reset',
    category: 'Stress',
    description: 'Perform a brief breathing reset or unplugged stretch to calm your nervous system.',
    target: '5 minutes',
    unit: 'minutes',
    icon: '🧘',
    color: '#d97706',
    bg: '#fef3c7'
  }
];

const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLast7DaysKeys = () => {
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${year}-${month}-${day}`);
  }
  return keys;
};

const Habits = () => {
  const { user } = useAuth();
  const [todayCompletions, setTodayCompletions] = useState({});
  const [habitHistory, setHabitHistory] = useState({});
  const [loading, setLoading] = useState(true);

  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});
  const onboardingCompleted = prefs.onboardingCompleted;

  const todayKey = getTodayKey();

  useEffect(() => {
    // Load local storage states
    const todayData = JSON.parse(localStorage.getItem(`vitaliq_habits_${todayKey}`) || '{}');
    const historyData = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
    
    // Fallback sync: if todayData has entries not in history, write it to history
    if (Object.keys(todayData).length > 0 && !historyData[todayKey]) {
      historyData[todayKey] = todayData;
      localStorage.setItem('vitaliq_habit_history', JSON.stringify(historyData));
    }

    setTodayCompletions(todayData);
    setHabitHistory(historyData);
    setLoading(false);
  }, [todayKey]);

  // Toggle habit check-in status
  const handleToggleHabit = (habitId) => {
    const nextState = !todayCompletions[habitId];
    const updatedToday = { ...todayCompletions, [habitId]: nextState };
    
    // Save to daily key
    localStorage.setItem(`vitaliq_habits_${todayKey}`, JSON.stringify(updatedToday));
    
    // Save to history key
    const updatedHistory = { ...habitHistory, [todayKey]: updatedToday };
    localStorage.setItem('vitaliq_habit_history', JSON.stringify(updatedHistory));
    
    setTodayCompletions(updatedToday);
    setHabitHistory(updatedHistory);

    if (nextState) {
      toast.success('Habit check-in logged! Keep going! 🚀');
    } else {
      toast.success('Check-in undone.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Loading your habits dashboard...
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Calculating your streaks and completions.
        </p>
      </div>
    );
  }

  // Personalization settings
  const highlightSleep = prefs.goals?.includes('Sleep better');
  const highlightMealPlan = prefs.goals?.includes('Eat healthy within budget');
  const highlightStress = prefs.goals?.includes('Reduce stress');
  const highlightWalk = prefs.activityLevel?.includes('Mostly sitting') || prefs.activityLevel?.includes('Sedentary');

  // Streak calculations
  const calculateStreak = (habitId) => {
    let streak = 0;
    let d = new Date();
    
    const formatDateStr = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let checkStr = formatDateStr(d);
    // If completed today
    if (habitHistory[checkStr]?.[habitId] === true) {
      streak = 1;
      while (true) {
        d.setDate(d.getDate() - 1);
        checkStr = formatDateStr(d);
        if (habitHistory[checkStr]?.[habitId] === true) {
          streak++;
        } else {
          break;
        }
      }
    } else {
      // Check if completed yesterday
      d.setDate(d.getDate() - 1);
      checkStr = formatDateStr(d);
      if (habitHistory[checkStr]?.[habitId] === true) {
        streak = 1;
        while (true) {
          d.setDate(d.getDate() - 1);
          checkStr = formatDateStr(d);
          if (habitHistory[checkStr]?.[habitId] === true) {
            streak++;
          } else {
            break;
          }
        }
      } else {
        streak = 0;
      }
    }
    return streak;
  };

  // Weekly completion counts per habit
  const last7Days = getLast7DaysKeys();
  const getWeeklyCount = (habitId) => {
    let count = 0;
    last7Days.forEach(dateKey => {
      if (habitHistory[dateKey]?.[habitId] === true) {
        count++;
      }
    });
    return count;
  };

  // Weekly stats calculations
  let totalCompletionsThisWeek = 0;
  const completionsPerHabit = {
    water: 0,
    sleep: 0,
    walk: 0,
    mealPlan: 0,
    screenBreak: 0,
    stressReset: 0
  };

  last7Days.forEach(dateKey => {
    const dayData = habitHistory[dateKey] || {};
    Object.keys(dayData).forEach(hid => {
      if (dayData[hid] === true && completionsPerHabit[hid] !== undefined) {
        totalCompletionsThisWeek++;
        completionsPerHabit[hid]++;
      }
    });
  });

  const totalPossibleThisWeek = 6 * 7;
  const hasAnyHistory = Object.keys(habitHistory).some(dateKey => {
    const dayData = habitHistory[dateKey] || {};
    return Object.values(dayData).some(Boolean);
  });

  // Calculate best habit
  let bestHabitId = 'water';
  let maxCompletions = -1;
  Object.keys(completionsPerHabit).forEach(hid => {
    if (completionsPerHabit[hid] > maxCompletions) {
      maxCompletions = completionsPerHabit[hid];
      bestHabitId = hid;
    }
  });

  // Calculate needs attention
  let needsAttentionId = 'sleep';
  let minCompletions = 999;
  Object.keys(completionsPerHabit).forEach(hid => {
    if (completionsPerHabit[hid] < minCompletions) {
      minCompletions = completionsPerHabit[hid];
      needsAttentionId = hid;
    }
  });

  const habitLabelMap = {
    water: 'Water Intake',
    sleep: 'Sleep Consistency',
    walk: 'Movement & Walk',
    mealPlan: 'Meal Plan Consistency',
    screenBreak: 'Screen Breaks',
    stressReset: 'Stress Reset'
  };

  const bestHabitName = maxCompletions > 0 ? habitLabelMap[bestHabitId] : 'None yet';
  const needsAttentionName = minCompletions < 7 ? habitLabelMap[needsAttentionId] : 'None! Perfect week!';

  // Render habits list
  const personalizedHabits = DEFAULT_HABITS.map(h => {
    let highlighted = false;
    let customTarget = h.target;

    if (h.id === 'sleep') {
      highlighted = highlightSleep;
      if (prefs.sleepTarget) {
        customTarget = prefs.sleepTarget;
      }
    } else if (h.id === 'mealPlan') {
      highlighted = highlightMealPlan;
    } else if (h.id === 'stressReset') {
      highlighted = highlightStress;
    } else if (h.id === 'walk') {
      highlighted = highlightWalk;
    }

    const completed = todayCompletions[h.id] === true;
    const streak = calculateStreak(h.id);
    const weeklyCount = getWeeklyCount(h.id);

    return {
      ...h,
      target: customTarget,
      highlighted,
      completed,
      streak,
      weeklyCount
    };
  });

  // Today completed count
  const todayCompletedCount = Object.values(todayCompletions).filter(Boolean).length;

  // Suggested Habits Partitioning Logic (Highlight top 3 recommended habits, put rest under 'More habits')
  const suggested = [];
  const selectedSuggestedIds = new Set();

  // 1. Add onboarding focused highlighted goals first
  personalizedHabits.forEach(h => {
    if (h.highlighted && suggested.length < 3) {
      suggested.push(h);
      selectedSuggestedIds.add(h.id);
    }
  });

  // 2. Pad up to 3 with general default habits (water, walk, sleep)
  const padOrder = ['water', 'walk', 'sleep', 'mealPlan', 'screenBreak', 'stressReset'];
  for (const id of padOrder) {
    if (suggested.length >= 3) break;
    if (!selectedSuggestedIds.has(id)) {
      const found = personalizedHabits.find(h => h.id === id);
      if (found) {
        suggested.push(found);
        selectedSuggestedIds.add(id);
      }
    }
  }

  // 3. Remaining habits go under "More habits you can track"
  const moreHabits = personalizedHabits.filter(h => !selectedSuggestedIds.has(h.id));

  return (
    <div className="page-enter habits-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Guest Progress Notice */}
      {isGuest && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '14px 18px',
          color: '#b45309', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <FiInfo size={16} /> Guest progress is saved on this device only. Consider creating an account to protect your streak history.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="gradient-text">Habit Tracker</span> <FiCheckCircle color="var(--primary)" />
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
          Track simple routines that build consistency over time.
        </p>
        <div style={{ 
          marginTop: '8px', 
          background: 'var(--primary-50)', 
          border: '1px solid rgba(13, 148, 136, 0.15)', 
          borderRadius: '10px', 
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: 'var(--primary)',
          fontWeight: 600,
          display: 'inline-block'
        }}>
          Habits are repeated daily. Start with 2–3 habits instead of trying everything at once.
        </div>
      </div>

      {!onboardingCompleted ? (
        <EmptyState
          title="Personalize your habits tracker"
          description="Answer a few simple questions so VitalIQ can tailor your habits and daily routines."
          primaryActionLabel="Personalize Now"
          primaryActionTo="/onboarding"
          icon="🎯"
        />
      ) : (
        <>
          {/* Differentiate Actions vs Habits Info Card */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        color: '#1e3a8a',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
      }}>
        <FiInfo size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#3b82f6' }} />
        <div>
          <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>Actions vs. Habits</strong>
          <span style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
            Daily Actions are suggested tasks for today. Habits are routines you track repeatedly.
          </span>
        </div>
      </div>

      {/* Role-based Helper Banner */}
      {onboardingCompleted && (
        <>
          {prefs.userType === 'Student' && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '12px 18px',
              color: '#15803d', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FiZap /> Small habits work best when they fit your class and study routine.
            </div>
          )}
          {prefs.userType === 'Working Professional' && (
            <div style={{
              background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '12px 18px',
              color: '#0369a1', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FiZap /> Use short breaks to stay consistent during work hours.
            </div>
          )}
        </>
      )}

      {/* 11. Weekly Summary Dashboard Section */}
      <div className="medical-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Weekly Overview
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }} className="stats-grid">
          {/* Progress Stat */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Progress status</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0' }}>
              {todayCompletedCount} today / {totalCompletionsThisWeek} this week
            </div>
            {/* Progress bar */}
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${totalCompletionsThisWeek > 0 ? (totalCompletionsThisWeek / totalPossibleThisWeek) * 100 : 0}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Best Habit Stat */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', flexShrink: 0 }}>
              <FiTrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Habit</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.3 }}>
                Your best habit this week: {bestHabitName}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                {maxCompletions > 0 ? `${maxCompletions} logs completed` : 'Start checking in today'}
              </span>
            </div>
          </div>

          {/* Attention Habit Stat */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
              <FiTrendingDown size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus Area</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.3 }}>
                {maxCompletions > 0 && minCompletions < 7 ? `Try focusing on ${needsAttentionName} next.` : 'Keep up consistent habits.'}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                Small repeated routines build baseline health.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Habits Section */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Suggested Habits 🌟
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Recommended routines based on your onboarding goals. We suggest focusing on these first.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="habits-grid">
          {suggested.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggle={handleToggleHabit} />
          ))}
        </div>
      </div>

      {/* More Habits Section */}
      <div style={{ marginTop: '16px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
          More habits you can track 📁
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Optional routines to extend your daily consistency schedule.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="habits-grid">
          {moreHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggle={handleToggleHabit} />
          ))}
        </div>
      </div>

      {/* Safety Disclaimer */}
      <div style={{
        marginTop: '20px', 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-lg)', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)', 
        lineHeight: 1.6
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <FiAlertTriangle size={16} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Wellness Routine Support:</strong> VitalIQ Health provides lifestyle habit tracking to assist with general consistency and routine support. This system does not deliver diagnoses, treatments, cures, or guaranteed disease prevention. Always seek the advice of a qualified healthcare provider for any medical concerns.
          </span>
        </div>
      </div>
        </>
      )}

      <style>{`
        .habits-page-container {
          padding: 20px 16px 40px 16px;
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .habits-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

// Habit Card Sub-Component
const HabitCard = ({ habit, onToggle }) => {
  return (
    <div 
      className="medical-card animate-fade-in-up"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: habit.highlighted ? `2px solid ${habit.color}` : '1.5px solid var(--border-light)',
        background: habit.completed ? '#f0fdf4' : 'white',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)'
      }}
    >
      {/* Highlight Badge */}
      {habit.highlighted && (
        <span style={{
          position: 'absolute', top: '12px', right: '12px',
          background: habit.color, color: 'white', fontSize: '0.65rem',
          fontWeight: 800, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 'var(--radius-full)'
        }}>
          Focused Goal
        </span>
      )}

      <div>
        {/* Header Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: habit.bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.3rem'
          }}>
            {habit.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {habit.name}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {habit.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0', minHeight: '44px' }}>
          {habit.description}
        </p>

        {/* Target */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '12px' }}>
          <span>Target: {habit.target}</span>
          <span style={{ color: habit.color, background: habit.bg, padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
            {habit.unit}
          </span>
        </div>
      </div>

      {/* Progress & Interaction Footer */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '10px' }}>
        
        {/* Streak and Weekly indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FiAward size={14} color="#d97706" /> Streak: {habit.streak} days
          </span>
          <span>
            This week: {habit.weeklyCount}/7 days
          </span>
        </div>

        {/* Completion Checkbox/Button */}
        <button
          onClick={() => onToggle(habit.id)}
          className={habit.completed ? 'btn-ghost' : 'btn-primary'}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '0.8rem',
            fontWeight: 700,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderColor: habit.completed ? 'var(--border-light)' : 'transparent',
            background: habit.completed ? 'transparent' : `linear-gradient(135deg, ${habit.color} 0%, #0d9488 100%)`,
            color: habit.completed ? 'var(--text-secondary)' : 'white',
            cursor: 'pointer'
          }}
        >
          {habit.completed ? (
            <>
              <FiCheckSquare size={16} /> Undo Check-in
            </>
          ) : (
            <>
              <FiCheck size={16} /> Mark Completed
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default Habits;
