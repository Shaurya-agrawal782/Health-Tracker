import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { recommendationAPI } from '../services/api';
import { gatherRecommendationData, generateSmartRecommendations } from '../utils/recommendations';
import { Link } from 'react-router-dom';
import {
  FiTarget, FiFilter, FiAlertTriangle, FiPlusCircle,
  FiZap, FiCoffee, FiMoon, FiShield, FiClock, FiCheckCircle
} from 'react-icons/fi';

const priorityConfig = {
  high: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  medium: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  low: { bg: '#e6fffa', color: '#0d9488', border: '#a7f3d0' },
};

const categoryIcons = {
  Food: '🥗',
  Sleep: '🌙',
  Activity: '🏃',
  Stress: '🧘',
  'Screen Balance': '💻',
  Hydration: '💧',
  Consistency: '🎯',
  Budget: '💰',
  System: '⚙️',
  General: '💡'
};

const starterRecommendations = [
  {
    id: 'starter-onboarding',
    title: 'Complete Onboarding',
    category: 'Consistency',
    reason: 'Personalizing your goals, budget, and routine helps VitalIQ generate tailored recommendations.',
    action: 'Go to your Profile & Preferences page or run the setup to complete onboarding.',
    priority: 'high',
    difficulty: 'Easy',
    estimatedTime: '3 mins',
    source: 'VitalIQ Setup',
    icon: '🎯'
  },
  {
    id: 'starter-wellness-check',
    title: 'Take Wellness Check',
    category: 'Consistency',
    reason: 'Get a simple lifestyle-based wellness estimate without needing medical reports.',
    action: 'Answer a few lifestyle questions to generate your first wellness score.',
    priority: 'high',
    difficulty: 'Medium',
    estimatedTime: '5 mins',
    source: 'Wellness screening',
    icon: '🏃'
  },
  {
    id: 'starter-meal-plan',
    title: 'Generate Meal Plan',
    category: 'Budget',
    reason: 'Get practical, budget-friendly meal ideas tailored to your cooking access and living type.',
    action: 'Select your budget level and food preferences to build your meal board.',
    priority: 'medium',
    difficulty: 'Easy',
    estimatedTime: '2 mins',
    source: 'Meal Planner',
    icon: '🥗'
  },
  {
    id: 'starter-water-walk',
    title: 'Start Water + Walk habits',
    category: 'Hydration',
    reason: 'Small daily wins build long-term consistency. Hydration and daily movement are the perfect combo.',
    action: 'Set a target for 6 glasses of water and a 10-minute walk today.',
    priority: 'medium',
    difficulty: 'Easy',
    estimatedTime: '10 mins',
    source: 'Habit Builder',
    icon: '💧'
  }
];

const Recommendations = () => {
  const { user } = useAuth();
  const [backendRecs, setBackendRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const isGuest = !user || user.isGuest || user.role === 'guest' || user.isMockGoogle || user.role === 'demo';

  // Load backend recommendations if logged in
  useEffect(() => {
    const loadBackendData = async () => {
      if (isGuest) {
        setLoading(false);
        return;
      }
      try {
        const res = await recommendationAPI.getAll();
        setBackendRecs(res.data.data || []);
      } catch (err) {
        console.warn('Failed to load backend recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBackendData();
  }, [user, isGuest]);

  // Gather frontend rule-based recommendations
  const smartRecs = useMemo(() => {
    const data = gatherRecommendationData(user);
    return generateSmartRecommendations(data);
  }, [user]);

  // Merge backend and frontend recommendations
  const allRecommendations = useMemo(() => {
    const isStarter = smartRecs.recommendations.length === 0 && backendRecs.length === 0;
    if (isStarter) {
      return starterRecommendations;
    }

    const merged = [];
    const titlesSeen = new Set();

    // 1. Add frontend rules recommendations
    smartRecs.recommendations.forEach(rec => {
      merged.push({
        id: rec.id,
        title: rec.title,
        category: rec.category,
        reason: rec.reason,
        action: rec.action,
        priority: rec.priority.toLowerCase(),
        difficulty: rec.difficulty,
        estimatedTime: rec.estimatedTime,
        source: rec.source,
        icon: categoryIcons[rec.category] || '💡'
      });
      titlesSeen.add(rec.title.toLowerCase());
    });

    // 2. Add backend recommendations, mapping fields to unified structure
    backendRecs.forEach((rec, idx) => {
      if (!titlesSeen.has(rec.title.toLowerCase())) {
        let mappedCategory = 'General';
        const rawCat = rec.category?.toLowerCase() || '';
        
        if (rawCat.includes('sleep')) mappedCategory = 'Sleep';
        else if (rawCat.includes('exercise') || rawCat.includes('activity')) mappedCategory = 'Activity';
        else if (rawCat.includes('diet') || rawCat.includes('food')) mappedCategory = 'Food';
        else if (rawCat.includes('stress')) mappedCategory = 'Stress';
        else if (rawCat.includes('water') || rawCat.includes('hydration')) mappedCategory = 'Hydration';
        else if (rawCat.includes('lifestyle')) mappedCategory = 'Consistency';
        else if (rawCat.includes('screening')) mappedCategory = 'Consistency';

        merged.push({
          id: `backend-${idx}`,
          title: rec.title,
          category: mappedCategory,
          reason: rec.reason || 'Based on your latest AI-assisted screening parameters.',
          action: Array.isArray(rec.actions) && rec.actions.length > 0
            ? rec.actions.join(' ')
            : 'Review this health indicator with your routine manager.',
          priority: (rec.priority || 'medium').toLowerCase(),
          difficulty: 'Medium',
          estimatedTime: '15 mins',
          source: 'AI Wellness Screening',
          icon: categoryIcons[mappedCategory] || '🔬'
        });
      }
    });

    return merged;
  }, [smartRecs, backendRecs]);

  // List of unique categories for filtering
  const categories = useMemo(() => {
    const cats = new Set(allRecommendations.map(r => r.category));
    return ['All', ...Array.from(cats)];
  }, [allRecommendations]);

  // Filtered recommendations
  const filteredRecs = useMemo(() => {
    if (selectedCategory === 'All') return allRecommendations;
    return allRecommendations.filter(r => r.category === selectedCategory);
  }, [allRecommendations, selectedCategory]);

  const prefs = useMemo(() => {
    const data = gatherRecommendationData(user);
    return data.preferences || {};
  }, [user]);
  const onboardingCompleted = prefs.onboardingCompleted;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Preparing smart recommendations...
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Using your goals, habits, and recent check-ins.
        </p>
      </div>
    );
  }

  const isStarter = smartRecs.recommendations.length === 0 && backendRecs.length === 0;
  const focusArea = isStarter ? 'Getting Started' : smartRecs.focusArea;
  const focusSummary = isStarter ? 'VitalIQ gets smarter as you add routine data.' : smartRecs.summary;

  return (
    <div className="page-enter" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Guest Mode Alert Banner */}
      {isGuest && (
        <div className="animate-fade-in" style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.05)'
        }}>
          <FiAlertTriangle size={18} color="#1d4ed8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>
            Guest recommendations are based on wellness data and preferences saved on this device only.
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px' }}>
          Smart <span className="gradient-text">Wellness Recommendations</span> 💡
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Personalized lifestyle suggestions based on your preferences, habits, and daily wellness checks.
        </p>
      </div>

      {/* Recommendations Content Panel */}
      {!onboardingCompleted ? (
        <EmptyState
          title="VitalIQ gets smarter as you add routine data"
          description="Complete onboarding, a wellness check, or a weekly check-in to get more personalized suggestions."
          icon="💡"
          primaryActionLabel="Personalize My Plan"
          primaryActionTo="/onboarding"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Focus Area Panel */}
          <div className="medical-card" style={{
            padding: '28px',
            background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
            color: 'white',
            boxShadow: '0 8px 30px rgba(13, 148, 136, 0.15)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-block',
                marginBottom: '10px',
                backdropFilter: 'blur(4px)'
              }}>
                Current Focus Area: {focusArea}
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>
                Your Personalized Action Focus
              </h2>
              <p style={{ fontSize: '0.95rem', opacity: 0.95, lineHeight: 1.5, maxWidth: '750px', margin: 0 }}>
                {focusSummary}
              </p>
            </div>
            
            {/* Background glowing circle decorator */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '180px',
              height: '180px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              zIndex: 1
            }} />
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiFilter size={16} /> Filter by Area:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1.5px solid ${selectedCategory === cat ? 'var(--primary)' : '#e2e8f0'}`,
                    background: selectedCategory === cat ? 'var(--primary)' : 'white',
                    color: selectedCategory === cat ? 'white' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat === 'All' ? 'All Suggestions' : `${categoryIcons[cat] || '💡'} ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout of Recommendations */}
          {filteredRecs.length === 0 ? (
            <EmptyState
              title="No recommendations match this filter"
              description="Try selecting a different filter category above to view lifestyle recommendations."
              icon="💡"
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }} className="stagger-children">
              {filteredRecs.map((rec) => {
                const p = priorityConfig[rec.priority] || priorityConfig.low;
                return (
                  <div key={rec.id} className="medical-card animate-fade-in-up" style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'white'
                  }}>
                    <div>
                      {/* Header line */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{rec.icon}</span>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: p.bg,
                          color: p.color,
                          border: `1px solid ${p.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em'
                        }}>
                          {rec.priority}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                        {rec.title}
                      </h3>
                      
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                        <strong>Reason: </strong>{rec.reason}
                      </p>

                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        border: '1px solid #f1f5f9',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                          Suggested Action Steps
                        </span>
                        <p style={{ fontSize: '0.82rem', color: '#0f172a', lineHeight: 1.5, margin: 0 }}>
                          {rec.action}
                        </p>
                      </div>
                    </div>

                    {/* Badges footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                      marginTop: '8px'
                    }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{
                          background: 'var(--primary-50)',
                          color: 'var(--primary)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {rec.category}
                        </span>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <FiClock size={10} /> {rec.estimatedTime}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        via {rec.source}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Safety Disclaimer Wording Box */}
      <div style={{
        marginTop: '40px',
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        lineHeight: 1.6
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <FiShield size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>General Wellness Wording:</strong> VitalIQ Health provides lifestyle recommendations, daily wellness suggestions, and personalized routine support to help you achieve your goals. This platform does not provide medical diagnoses, treatments, cures, disease predictions, or clinical advice. Always seek the advice of a qualified physician or healthcare provider with any medical questions.
          </span>
        </div>
      </div>

    </div>
  );
};

export default Recommendations;
