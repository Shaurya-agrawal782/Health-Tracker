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
    target: '7-9 hours', // Will be dynamic if prefs are available
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
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

  const totalPossibleThisWeek = 6 * 7; // 6 habits * 7 days
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
    mealPlan: 'Meal Plan',
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

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="gradient-text">Habit Tracker</span> <FiCheckCircle color="var(--primary)" />
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
          Track small daily habits that improve your routine over time.
        </p>
      </div>

      {/* Role-based Helper Banner */}
      {onboardingCompleted && (
        <>
          {prefs.userType === 'Student' && (
            <div style={{
              background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '16px', padding: '16px 20px',
              color: '#0f766e', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FiZap /> Small habits work best when they fit your class and study routine.
            </div>
          )}
          {prefs.userType === 'Working Professional' && (
            <div style={{
              background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '16px', padding: '16px 20px',
              color: '#1d4ed8', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FiZap /> Use short breaks to stay consistent during work hours.
            </div>
          )}
        </>
      )}

      {/* Guest Progress Notice */}
      {isGuest && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '14px 18px',
          color: '#b45309', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <FiInfo size={16} /> Guest habit progress is saved on this device only. Consider creating an account to protect your streak history.
        </div>
      )}

      {/* Weekly Overview Section / Empty State */}
      {!hasAnyHistory ? (
        <EmptyState
          title="Start your first habit today"
          description="Small daily wins build long-term consistency."
          icon="⚡"
          primaryActionLabel="Mark a Habit Done"
          primaryActionOnClick={() => handleToggleHabit('water')}
          note={isGuest ? "Guest habit progress is saved on this device only." : null}
        />
      ) : (
        <div className="medical-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Weekly Overview
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Progress Stat */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weekly completions</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0' }}>
                {totalCompletionsThisWeek} of {totalPossibleThisWeek} logs
              </div>
              {/* Progress bar */}
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${(totalCompletionsThisWeek / totalPossibleThisWeek) * 100}%`, 
                  height: '100%', 
                  background: 'var(--primary)',
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
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {bestHabitName}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                  {maxCompletions > 0 ? `${maxCompletions} completions` : 'No completions yet'}
                </span>
              </div>
            </div>

            {/* Attention Habit Stat */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', flexShrink: 0 }}>
                <FiTrendingDown size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Needs Attention</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {needsAttentionName}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>
                  {minCompletions < 7 && maxCompletions > 0 ? `${minCompletions} completions` : 'Start check-ins today'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Habits Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {personalizedHabits.map((habit) => {
          return (
            <div 
              key={habit.id} 
              className="medical-card animate-fade-in-up"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: habit.highlighted ? `2px solid ${habit.color}` : '1.5px solid var(--border-light)',
                background: habit.completed ? 'var(--primary-50)' : 'white',
                position: 'relative',
                transition: 'all 0.2s ease-in-out'
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: habit.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.4rem'
                  }}>
                    {habit.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {habit.name}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Category: {habit.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0', minHeight: '48px' }}>
                  {habit.description}
                </p>

                {/* Target & Units */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '12px' }}>
                  <span>Target: {habit.target}</span>
                  <span style={{ color: habit.color, background: habit.bg, padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                    {habit.unit}
                  </span>
                </div>
              </div>

              {/* Progress & Interaction Footer */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '12px' }}>
                
                {/* Streak and Weekly indicators */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiAward size={14} color="#d97706" /> {habit.streak}-day streak
                  </span>
                  <span>
                    Weekly: {habit.weeklyCount}/7 days
                  </span>
                </div>

                {/* Completion Checkbox/Button */}
                <button
                  onClick={() => handleToggleHabit(habit.id)}
                  className={habit.completed ? 'btn-ghost' : 'btn-primary'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderColor: habit.completed ? 'var(--border-light)' : 'transparent',
                    background: habit.completed ? 'transparent' : `linear-gradient(135deg, ${habit.color} 0%, #0d9488 100%)`,
                    color: habit.completed ? 'var(--text-secondary)' : 'white'
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
        })}
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
            <strong>Wellness Habits Support:</strong> VitalIQ Health provides lifestyle habit tracking to assist with general consistency and routine support. This system does not deliver diagnoses, treatments, cures, or guaranteed disease prevention. Always seek advice of a healthcare provider for any medical concerns.
          </span>
        </div>
      </div>

    </div>
  );
};

export default Habits;
