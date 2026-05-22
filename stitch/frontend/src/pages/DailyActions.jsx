import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { predictAPI } from '../services/api';
import { generateDailyActions } from '../utils/actionGenerator';
import { Link } from 'react-router-dom';
import { 
  FiCheckCircle, FiRefreshCw, FiCheck, FiSquare, FiCheckSquare, 
  FiClock, FiAlertTriangle, FiArrowRight, FiZap, FiSmile
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

  const isGuest = user?.isGuest || user?.role === 'guest';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});
  const onboardingCompleted = prefs.onboardingCompleted;

  const dateKey = getTodayKey();

  useEffect(() => {
    const initActions = async () => {
      setLoading(true);
      try {
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

        return { ...act, completed: nextState };
      }
      return act;
    });

    localStorage.setItem(dateKey, JSON.stringify(updated));
    setActions(updated);

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
        
        toast.success(`Category habit completed! 🚀`);
      }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const completedCount = actions.filter(a => a.completed).length;
  const totalCount = actions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="gradient-text">Daily Wellness Actions</span> <FiZap color="var(--primary)" />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Small steps for better food, sleep, stress, and energy.
          </p>
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
          <FiRefreshCw /> Refresh Today's Actions
        </button>
      </div>

      {/* Onboarding CTA Card (Empty state context) */}
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
              Personalize your plan to get smarter daily actions.
            </h3>
            <p style={{ color: '#0c4a6e', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              Complete onboarding to get custom suggestions tailored to your diet, budget, role, and wellness goals.
            </p>
          </div>
          <Link to="/onboarding" className="btn-primary" style={{ background: '#0284c7', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Complete Onboarding <FiArrowRight />
          </Link>
        </div>
      )}

      {/* Progress & Consistency Card */}
      <div className="medical-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {completedCount} of {totalCount} actions completed today
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Every action is a seed planted for your wellness routine.
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
              <FiSmile /> Great job — small steps build consistency.
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            background: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)', 
            borderRadius: '5px', 
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }} />
        </div>
      </div>

      {/* Actions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {actions.map((act) => {
          const catStyle = categoryStyles[act.category] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
          const isEasy = act.difficulty === 'Easy';

          return (
            <div 
              key={act.id} 
              className="medical-card animate-fade-in-up"
              style={{ 
                padding: '20px 24px', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '16px',
                background: act.completed ? 'var(--primary-50)' : 'white',
                border: act.completed ? '1px solid var(--primary-100)' : '1px solid var(--border-light)',
                transition: 'all 0.2s ease-in-out'
              }}
            >
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
                    background: isEasy ? '#f0fdf4' : '#fffbeb', 
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
                    <FiClock size={12} /> {act.estimatedTime}
                  </span>
                </div>

                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
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
                  lineHeight: 1.4, 
                  margin: '6px 0 0 0' 
                }}>
                  {act.reason}
                </p>
              </div>

              {/* Action Button: Mark Done / Undo */}
              <button
                onClick={() => handleToggleAction(act.id)}
                className={act.completed ? 'btn-ghost' : 'btn-primary'}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {act.completed ? (
                  <>Undo</>
                ) : (
                  <><FiCheck /> Done</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Safety Wording Disclaimer */}
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
            <strong>General Wellness Support:</strong> VitalIQ Health provides daily actions and lifestyle habits to assist with general wellness goals. This system does not deliver diagnoses, treatments, cures, or medical prevention guarantees. Always seek the advice of a qualified physician or healthcare provider with any medical questions.
          </span>
        </div>
      </div>

    </div>
  );
};

export default DailyActions;
