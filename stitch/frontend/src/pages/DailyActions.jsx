import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { predictAPI } from '../services/api';
import { generateDailyActions } from '../utils/actionGenerator';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { 
  FiCheckCircle, FiRefreshCw, FiCheck, FiSquare, FiCheckSquare, 
  FiClock, FiAlertTriangle, FiZap, FiSmile, FiInfo, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Color map for categories
const categoryStyles = {
  Food: { bg: '#e8f5f0', color: '#0d6e5b', border: '#c6e8dd' },
  Sleep: { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
  Activity: { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
  Stress: { bg: '#fff5f5', color: '#9b2c2c', border: '#fed7d7' },
  'Screen Balance': { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  Hydration: { bg: '#eff6ff', color: '#1d4ed8', border: '#dbeafe' }
};

const categoryHabitMap = {
  'Hydration': { id: 'water', name: 'Water Intake' },
  'Sleep': { id: 'sleep', name: 'Sleep Consistency' },
  'Activity': { id: 'walk', name: 'Movement & Walk' },
  'Food': { id: 'mealPlan', name: 'Meal Plan' },
  'Screen Balance': { id: 'screenBreak', name: 'Eye & Screen Breaks' },
  'Stress': { id: 'stressReset', name: 'Mindful Stress Reset' }
};

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

const DailyActions = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState([]);
  const [habitsState, setHabitsState] = useState({});

  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});
  const onboardingCompleted = prefs.onboardingCompleted;

  const dateKey = getTodayKey();
  const habitDateKey = getHabitDateKey();

  useEffect(() => {
    const initActions = async () => {
      setLoading(true);
      try {
        // Load today's habits
        const todayHabits = JSON.parse(localStorage.getItem(`vitaliq_habits_${habitDateKey}`) || '{}');
        setHabitsState(todayHabits);

        // Load latest wellness check for personalization
        let latestCheck = null;
        try {
          const checksRes = await predictAPI.getHistory();
          const history = checksRes.data?.data || [];
          setChecks(history);
          if (history.length > 0) {
            latestCheck = history[0];
          }
        } catch (err) {
          console.warn('Failed to load checks history in actions page:', err);
        }

        const cached = localStorage.getItem(dateKey);
        if (cached) {
          setActions(JSON.parse(cached));
        } else {
          // Generate actions and save
          const generated = generateDailyActions(prefs, latestCheck);
          localStorage.setItem(dateKey, JSON.stringify(generated));
          setActions(generated);
        }
      } catch (error) {
        console.error('Failed to initialize daily actions:', error);
        toast.error('Failed to generate daily actions.');
      } finally {
        setLoading(false);
      }
    };

    initActions();
  }, [dateKey, onboardingCompleted]);

  // Toggle Action Completion
  const handleToggleAction = (actionId) => {
    let syncedHabitId = null;
    let markCompleted = false;

    const updated = actions.map(act => {
      if (act.id === actionId) {
        const nextState = !act.completed;
        markCompleted = nextState;
        if (nextState) {
          toast.success('Action completed! Keep it up. 🎉', { id: `toast-done-${actionId}` });
        } else {
          toast.success('Action marked as incomplete.', { id: `toast-undo-${actionId}` });
        }

        const categoryToHabitId = {
          'Hydration': 'water',
          'Sleep': 'sleep',
          'Activity': 'walk',
          'Food': 'mealPlan',
          'Screen Balance': 'screenBreak',
          'Stress': 'stressReset'
        };
        syncedHabitId = categoryToHabitId[act.category];

        return { ...act, completed: nextState };
      }
      return act;
    });

    localStorage.setItem(dateKey, JSON.stringify(updated));
    setActions(updated);

    // Sync habit progress if daily action is completed (Auto check-in)
    if (syncedHabitId && markCompleted) {
      const todayHabits = JSON.parse(localStorage.getItem(`vitaliq_habits_${habitDateKey}`) || '{}');
      const defaultTodayHabits = { water: false, sleep: false, walk: false, mealPlan: false, screenBreak: false, stressReset: false };
      const mergedTodayHabits = { ...defaultTodayHabits, ...todayHabits };
      
      if (!mergedTodayHabits[syncedHabitId]) {
        mergedTodayHabits[syncedHabitId] = true;
        localStorage.setItem(`vitaliq_habits_${habitDateKey}`, JSON.stringify(mergedTodayHabits));
        
        const history = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
        history[habitDateKey] = mergedTodayHabits;
        localStorage.setItem('vitaliq_habit_history', JSON.stringify(history));
        
        setHabitsState(mergedTodayHabits);
        toast.success(`Category habit marked done! 🚀`);
      }
    }
  };

  // Sync related habit directly
  const handleMarkHabitDone = (habitId) => {
    const todayHabits = JSON.parse(localStorage.getItem(`vitaliq_habits_${habitDateKey}`) || '{}');
    const defaultTodayHabits = { water: false, sleep: false, walk: false, mealPlan: false, screenBreak: false, stressReset: false };
    const mergedTodayHabits = { ...defaultTodayHabits, ...todayHabits };
    
    if (!mergedTodayHabits[habitId]) {
      mergedTodayHabits[habitId] = true;
      localStorage.setItem(`vitaliq_habits_${habitDateKey}`, JSON.stringify(mergedTodayHabits));
      
      const history = JSON.parse(localStorage.getItem('vitaliq_habit_history') || '{}');
      history[habitDateKey] = mergedTodayHabits;
      localStorage.setItem('vitaliq_habit_history', JSON.stringify(history));
      
      setHabitsState(mergedTodayHabits);
      toast.success(`Habit marked done! 🚀`);
    }
  };

  // Refresh Actions (Regenerate)
  const handleRefreshActions = () => {
    const completedCount = actions.filter(a => a.completed).length;

    if (completedCount > 0) {
      const confirmRefresh = window.confirm('Refreshing will replace today’s actions. Continue?');
      if (!confirmRefresh) return;
    }

    const latestCheck = checks.length > 0 ? checks[0] : null;
    const regenerated = generateDailyActions(prefs, latestCheck);
    localStorage.setItem(dateKey, JSON.stringify(regenerated));
    setActions(regenerated);
    toast.success('Daily actions refreshed! 🔄');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Preparing your daily actions...
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Refreshed daily based on your goals, habits, and recent check-ins.
        </p>
      </div>
    );
  }

  const completedCount = actions.filter(a => a.completed).length;
  const totalCount = actions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group actions by category
  const categories = ['Food', 'Activity', 'Sleep', 'Stress', 'Screen Balance', 'Hydration'];
  const groupedActions = {};
  actions.forEach(act => {
    if (!groupedActions[act.category]) {
      groupedActions[act.category] = [];
    }
    groupedActions[act.category].push(act);
  });

  return (
    <div className="page-enter daily-actions-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#b45309',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <FiAlertTriangle size={16} />
          <span>Guest progress is saved on this device only.</span>
        </div>
      )}

      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="gradient-text">Today’s Wellness Actions</span> <FiZap color="var(--primary)" />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Complete a few small actions today to improve your food, sleep, stress, and routine.
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
            These actions are refreshed daily based on your goals, habits, and recent check-ins.
          </div>
        </div>

        <button 
          onClick={handleRefreshActions}
          className="btn-ghost"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            padding: '10px 16px',
            borderColor: 'var(--border-light)'
          }}
        >
          <FiRefreshCw /> Refresh Today’s Actions
        </button>
      </div>

      {/* Empty States / Main Content */}
      {!onboardingCompleted ? (
        <EmptyState
          title="Personalize your wellness plan"
          description="Answer a few simple questions so VitalIQ can tailor your meals, habits, and daily actions."
          primaryActionLabel="Personalize Now"
          primaryActionTo="/onboarding"
          icon="🎯"
        />
      ) : totalCount === 0 ? (
        <EmptyState
          title="Your action list is empty"
          description="Complete a wellness check or update your profile to generate today's wellness tasks."
          primaryActionLabel="Start Wellness Check"
          primaryActionTo="/health-check"
          icon="⚡"
        />
      ) : (
        <>
          {/* Progress & Consistency Card */}
          <div className="medical-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {completedCount} of {totalCount} completed today
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Nice — small steps build consistency.
            </p>
          </div>
          
          {completedCount > 0 && (
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#e6fffa', 
              color: '#0d9488', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.85rem', 
              fontWeight: 700 
            }}>
              <FiSmile /> Great job! Every action helps.
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            background: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)', 
            borderRadius: '5px', 
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }} />
        </div>
      </div>

      {/* Grouped Actions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {categories.map(category => {
          const catActions = groupedActions[category];
          if (!catActions || catActions.length === 0) return null;
          
          const catStyle = categoryStyles[category] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };

          return (
            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="category-group">
              <h2 style={{ 
                fontSize: '1rem', 
                fontWeight: 800, 
                color: catStyle.color, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                borderBottom: `2.5px solid ${catStyle.border}`,
                paddingBottom: '6px',
                marginTop: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {category} Actions
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {catActions.map((act) => {
                  const isEasy = act.difficulty === 'Easy';
                  const habitInfo = categoryHabitMap[act.category];
                  const habitCompleted = habitInfo ? habitsState[habitInfo.id] === true : false;

                  return (
                    <div 
                      key={act.id} 
                      className={`medical-card action-card ${act.completed ? 'completed-card' : ''}`}
                      style={{ 
                        padding: '20px 24px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '12px',
                        background: act.completed ? '#f0fdf4' : 'white',
                        border: act.completed ? '1px solid #bbf7d0' : '1.5px solid var(--border-light)',
                        transition: 'all 0.2s ease-in-out',
                        opacity: act.completed ? 0.85 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                          {/* Checkbox Trigger */}
                          <button 
                            onClick={() => handleToggleAction(act.id)}
                            style={{
                              background: 'none', 
                              border: 'none', 
                              padding: 0, 
                              cursor: 'pointer', 
                              color: act.completed ? 'var(--primary)' : '#cbd5e1',
                              marginTop: '4px', 
                              display: 'flex', 
                              alignItems: 'center',
                              flexShrink: 0
                            }}
                          >
                            {act.completed ? <FiCheckSquare size={22} /> : <FiSquare size={22} />}
                          </button>

                          {/* Action content */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              {/* Category Badge */}
                              <span style={{ 
                                padding: '2px 10px', 
                                borderRadius: 'var(--radius-full)', 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                background: catStyle.bg, 
                                color: catStyle.color, 
                                border: `1px solid ${catStyle.border}` 
                              }}>
                                {act.category}
                              </span>

                              {/* Difficulty Badge */}
                              <span style={{ 
                                padding: '2px 10px', 
                                borderRadius: 'var(--radius-full)', 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                background: isEasy ? '#e6fdf0' : '#fffbeb', 
                                color: isEasy ? '#15803d' : '#b45309', 
                                border: `1px solid ${isEasy ? '#bbf7d0' : '#fde68a'}` 
                              }}>
                                {act.difficulty}
                              </span>

                              {/* Estimated Time Badge */}
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                fontWeight: 600
                              }}>
                                <FiClock size={12} /> {act.estimatedTime || '10 min'}
                              </span>
                            </div>

                            <h3 style={{ 
                              fontSize: '1.05rem', 
                              fontWeight: 800, 
                              color: act.completed ? '#475569' : '#0f172a',
                              textDecoration: act.completed ? 'line-through' : 'none',
                              transition: 'color 0.2s',
                              margin: 0
                            }}>
                              {act.title}
                            </h3>
                            
                            <p style={{ 
                              fontSize: '0.85rem', 
                              color: 'var(--text-secondary)', 
                              marginTop: '6px', 
                              lineHeight: 1.45, 
                              margin: '6px 0 0 0' 
                            }}>
                              <strong>Why this helps:</strong> {act.reason}
                            </p>
                          </div>
                        </div>

                        {/* Action Button: Mark Done / Undo */}
                        <button
                          onClick={() => handleToggleAction(act.id)}
                          className={act.completed ? 'btn-ghost' : 'btn-primary'}
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderRadius: '10px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {act.completed ? (
                            <>Undo</>
                          ) : (
                            <><FiCheck /> Mark Done</>
                          )}
                        </button>
                      </div>

                      {/* Connection Suggestion Banner when Action is Done */}
                      {act.completed && habitInfo && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.75)',
                          border: '1px dashed #bbf7d0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
                            <span style={{ fontSize: '1.1rem' }}>💡</span>
                            {habitCompleted ? (
                              <span>Synced: Related <strong>{habitInfo.name}</strong> habit is also marked completed today!</span>
                            ) : (
                              <span>Completed the action! Want to mark your <strong>{habitInfo.name}</strong> habit done too?</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {!habitCompleted && (
                              <button 
                                onClick={() => handleMarkHabitDone(habitInfo.id)}
                                className="btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px' }}
                              >
                                Mark Habit Done
                              </button>
                            )}
                            <Link 
                              to="/habits" 
                              style={{ 
                                color: 'var(--primary)', 
                                fontWeight: 700, 
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Track in Habits <FiArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

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
            <strong>Wellness Routine Support:</strong> VitalIQ Health provides wellness suggestions and small actions for routine consistency only. It does not provide medical treatment, diagnosis, cure, or guaranteed disease prevention. Always seek the advice of a qualified physician with any medical questions.
          </span>
        </div>
      </div>

      <style>{`
        .daily-actions-container {
          padding: 20px 16px 40px 16px;
        }
        .action-card {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }
        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
        }
        .completed-card {
          box-shadow: none !important;
          transform: none !important;
        }
        @media (max-width: 640px) {
          .action-card > div:first-child {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .action-card button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyActions;
