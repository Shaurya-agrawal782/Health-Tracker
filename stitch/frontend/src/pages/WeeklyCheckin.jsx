import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { weeklyCheckinAPI } from '../services/api';
import { 
  FiCalendar, FiCheckCircle, FiChevronRight, FiChevronLeft, FiSmile, 
  FiAlertTriangle, FiInfo, FiActivity, FiArrowRight, FiShield, FiHeart, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const SCORE_MAPS = {
  sleepQuality: { Poor: 25, Okay: 50, Good: 75, Great: 90 },
  energyLevel: { Low: 30, Medium: 55, Good: 75, High: 90 },
  stressLevel: { Low: 90, Medium: 70, High: 45, 'Very high': 25 },
  mood: { Low: 30, Okay: 55, Good: 75, Great: 90 },
  mealConsistency: { Rarely: 25, '2–3 days': 50, '4–5 days': 75, 'Most days': 90 },
  activityLevel: { 'Mostly inactive': 25, 'Lightly active': 50, 'Moderately active': 75, 'Very active': 90 },
  screenBalance: { Poor: 25, Okay: 50, Good: 75, Great: 90 }
};

const STEPS = [
  { id: 'sleep_energy', title: 'Sleep & Energy', icon: <FiClock size={18} /> },
  { id: 'stress_mood', title: 'Stress & Mood', icon: <FiSmile size={18} /> },
  { id: 'food_activity', title: 'Food & Activity', icon: <FiActivity size={18} /> },
  { id: 'screen_reflection', title: 'Screen & Reflection', icon: <FiHeart size={18} /> }
];

const WeeklyCheckin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = user?.isGuest || user?.role === 'guest';

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    sleepQuality: '',
    energyLevel: '',
    stressLevel: '',
    mood: '',
    mealConsistency: '',
    activityLevel: '',
    screenBalance: '',
    reflection: ''
  });

  const [submittedCheckin, setSubmittedCheckin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = () => {
    if (currentStep === 0) {
      return formData.sleepQuality && formData.energyLevel;
    }
    if (currentStep === 1) {
      return formData.stressLevel && formData.mood;
    }
    if (currentStep === 2) {
      return formData.mealConsistency && formData.activityLevel;
    }
    if (currentStep === 3) {
      return formData.screenBalance;
    }
    return true;
  };

  const calculateScore = () => {
    const sleep = SCORE_MAPS.sleepQuality[formData.sleepQuality] || 0;
    const energy = SCORE_MAPS.energyLevel[formData.energyLevel] || 0;
    const stress = SCORE_MAPS.stressLevel[formData.stressLevel] || 0;
    const mood = SCORE_MAPS.mood[formData.mood] || 0;
    const meals = SCORE_MAPS.mealConsistency[formData.mealConsistency] || 0;
    const activity = SCORE_MAPS.activityLevel[formData.activityLevel] || 0;
    const screen = SCORE_MAPS.screenBalance[formData.screenBalance] || 0;

    const total = sleep + energy + stress + mood + meals + activity + screen;
    return Math.round(total / 7);
  };

  const getStatus = (score) => {
    if (score < 40) return 'Needs attention';
    if (score < 60) return 'Getting started';
    if (score < 80) return 'Improving';
    return 'Consistent';
  };

  const generateInsightsAndActions = () => {
    const insights = [];
    const focusActions = [];

    // Sleep
    if (formData.sleepQuality === 'Poor' || formData.sleepQuality === 'Okay') {
      insights.push('Your sleep quality could be more restorative. Consider a screens-off wind-down routine.');
      focusActions.push('Set a screen-free wind-down alarm 30 mins before bed.');
    } else {
      insights.push('Great sleep habits! Your rest is supporting physical and mental recovery.');
    }

    // Stress
    if (formData.stressLevel === 'High' || formData.stressLevel === 'Very high') {
      insights.push('High stress levels detected. Prioritize daily micro-breaks and brief breathing sessions.');
      focusActions.push('Complete a 3-minute deep breathing reset mid-day.');
    } else {
      insights.push('Your stress levels are well balanced. Keep maintaining these routine boundary spaces.');
    }

    // Screen Balance
    if (formData.screenBalance === 'Poor' || formData.screenBalance === 'Okay') {
      insights.push('High screen usage might be causing mental fatigue. Try setting screen-free boundaries.');
      focusActions.push('Use the 20-20-20 rule (look 20 ft away for 20 seconds every 20 mins) during work.');
    } else {
      insights.push('Excellent screen time balance! You are taking necessary off-screen recovery periods.');
    }

    // Meal consistency
    if (formData.mealConsistency === 'Rarely' || formData.mealConsistency === '2–3 days') {
      insights.push('Consistent nutrition fuels stable energy. Pre-planning quick budget meals can help.');
      focusActions.push('Plan and note down your meals for the next 3 days to build consistency.');
    } else {
      insights.push('Outstanding meal consistency! You are fueling your body regularly and healthily.');
    }

    // Activity
    if (formData.activityLevel === 'Mostly inactive' || formData.activityLevel === 'Lightly active') {
      insights.push('Adding short walks post-meals will boost blood flow and support natural activity.');
      focusActions.push('Take a 10-minute active walk after your largest meal of the day.');
    } else {
      insights.push('Active lifestyle confirmed! You are keeping up a healthy baseline of movement.');
    }

    // Mood & General Fallbacks
    if (formData.mood === 'Low' || formData.mood === 'Okay') {
      focusActions.push('Spend 5 minutes reflecting on one win or positive event each day.');
    }

    while (insights.length < 3) {
      insights.push('Keep tracking your daily habits to build self-awareness and stay consistent.');
    }
    while (focusActions.length < 3) {
      focusActions.push('Drink at least 6 glasses of water daily to support hydration.');
    }

    return {
      insights: insights.slice(0, 3),
      focusActions: focusActions.slice(0, 3)
    };
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please answer all questions before proceeding.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const getWeekStartDate = () => {
    const d = new Date();
    // Set to previous Monday
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) {
      toast.error('Please answer the screen time question.');
      return;
    }

    setIsSubmitting(true);

    const score = calculateScore();
    const status = getStatus(score);
    const { insights, focusActions } = generateInsightsAndActions();
    const weekStartDate = getWeekStartDate();

    const checkinPayload = {
      weekStartDate: weekStartDate.toISOString(),
      sleepQuality: formData.sleepQuality,
      energyLevel: formData.energyLevel,
      stressLevel: formData.stressLevel,
      mood: formData.mood,
      mealConsistency: formData.mealConsistency,
      activityLevel: formData.activityLevel,
      screenBalance: formData.screenBalance,
      reflection: formData.reflection,
      weeklyScore: score,
      status,
      insights,
      focusActions
    };

    try {
      if (isGuest) {
        // Save to localStorage
        const existingString = localStorage.getItem('vitaliq_weekly_checkins');
        const existing = existingString ? JSON.parse(existingString) : [];
        
        const newRecord = {
          _id: `guest_${Date.now()}`,
          userId: 'guest',
          createdAt: new Date().toISOString(),
          ...checkinPayload
        };
        
        // Save to local checkins history
        localStorage.setItem('vitaliq_weekly_checkins', JSON.stringify([newRecord, ...existing]));
        
        // Also tag local storage to update dashboard widgets immediately
        localStorage.setItem('vitaliq_latest_checkin', JSON.stringify(newRecord));

        setSubmittedCheckin(newRecord);
        toast.success('Reflection logged! Wellness score generated! 🚀');
      } else {
        // Send to backend API
        const res = await weeklyCheckinAPI.create(checkinPayload);
        if (res.data?.success) {
          setSubmittedCheckin(res.data.data);
          // Update latest checkin in local storage as a quick cache
          localStorage.setItem('vitaliq_latest_checkin', JSON.stringify(res.data.data));
          toast.success('Weekly check-in saved successfully! 🏥');
        } else {
          throw new Error('Response unsuccessful');
        }
      }
    } catch (err) {
      console.error('Weekly Check-in Save Error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for option rendering styling
  const renderOptionButton = (field, option, label) => {
    const isSelected = formData[field] === option;
    return (
      <button
        key={option}
        type="button"
        onClick={() => handleOptionSelect(field, option)}
        style={{
          flex: 1,
          padding: '14px 10px',
          borderRadius: '12px',
          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
          background: isSelected ? 'var(--primary-50)' : '#f8fafc',
          color: isSelected ? 'var(--primary-dark)' : 'var(--text-primary)',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.12)' : 'none'
        }}
        onMouseEnter={e => {
          if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
        }}
        onMouseLeave={e => {
          if (!isSelected) e.currentTarget.style.background = '#f8fafc';
        }}
      >
        {label}
      </button>
    );
  };

  // Render score color matching standard rules
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Consistent':
        return { color: '#059669', bg: '#ecfdf5', border: '1px solid #a7f3d0' };
      case 'Improving':
        return { color: '#0d9488', bg: '#f0fdfa', border: '1px solid #99f6e4' };
      case 'Getting started':
        return { color: '#d97706', bg: '#fef3c7', border: '1px solid #fde68a' };
      default:
        return { color: '#dc2626', bg: '#fef2f2', border: '1px solid #fecaca' };
    }
  };

  // Render Submission Result Card
  if (submittedCheckin) {
    const statusStyle = getStatusStyles(submittedCheckin.status);
    return (
      <div className="page-enter" style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>
        <div className="medical-card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a'
          }}>
            <FiCheckCircle size={32} />
          </div>

          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Weekly Reflection Complete!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
              Your lifestyle check-in has been analyzed. Here is your wellness overview.
            </p>
          </div>

          {/* Score Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{submittedCheckin.weeklyScore}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>out of 100</span>
            </div>
            
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
              fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase',
              color: statusStyle.color, background: statusStyle.bg, border: statusStyle.border,
              marginTop: '8px'
            }}>
              Status: {submittedCheckin.status}
            </span>
          </div>

          {/* Insights Cards */}
          <div style={{ width: '100%', textAlign: 'left', marginTop: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiInfo color="var(--primary)" /> Personalized Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {submittedCheckin.insights.map((insight, idx) => (
                <div key={idx} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Actions Checklist */}
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiActivity color="var(--primary)" /> Next-Week Focus Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {submittedCheckin.focusActions.map((action, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f0fdfa', borderRadius: '12px', border: '1px solid #ccfbf1', fontSize: '0.85rem', color: '#0f766e', fontWeight: 600 }}>
                  <FiCheckCircle size={16} color="#0d9488" style={{ flexShrink: 0 }} />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guest message disclaimer */}
          {isGuest && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '16px',
              color: '#b45309', fontSize: '0.82rem', textAlign: 'left', lineHeight: 1.5, width: '100%'
            }}>
              <span style={{ display: 'flex', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <FiAlertTriangle size={16} /> Guest Reflection Session
              </span>
              These check-ins are saved on this device only. Please register to sync your weekly trend scores and unlock long-term predictive models!
            </div>
          )}

          {/* Buttons Footer */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '0.9rem',
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              Go to Dashboard <FiArrowRight />
            </button>

            {isGuest && (
              <button
                onClick={() => navigate('/register')}
                className="btn-ghost"
                style={{
                  padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem',
                  fontWeight: 700, border: '1px solid var(--border-light)'
                }}
              >
                Sign Up
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="gradient-text">Weekly Check-in</span> <FiCalendar color="var(--primary)" />
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
          Review your week, track consistency, and unlock new wellness insights.
        </p>
      </div>

      {/* Steps Indicator / Progress Bar */}
      <div className="medical-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Reflection Progress
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            Step {currentStep + 1} of 4: {STEPS[currentStep].title}
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: `${((currentStep + 1) / 4) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-emerald) 100%)',
            transition: 'width 0.3s ease-in-out'
          }} />
        </div>

        {/* Steps Nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isActive || isCompleted ? 1 : 0.5 }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary-50)' : '#f1f5f9',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  color: isCompleted ? 'white' : isActive ? 'var(--primary-dark)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 800
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }} className="dash-welcome-text">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflection Step Form Card */}
      <form onSubmit={handleSubmit} className="medical-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Step 1: Sleep & Energy */}
        {currentStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Sleep & Daily Vitality
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                Reflect on your sleep consistency and physical energy during this past week.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How was your sleep quality this week?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('sleepQuality', 'Poor', 'Poor 🥱')}
                {renderOptionButton('sleepQuality', 'Okay', 'Okay 😐')}
                {renderOptionButton('sleepQuality', 'Good', 'Good 😊')}
                {renderOptionButton('sleepQuality', 'Great', 'Great 😴')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How was your average energy level?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('energyLevel', 'Low', 'Low 🔋')}
                {renderOptionButton('energyLevel', 'Medium', 'Medium ⚡')}
                {renderOptionButton('energyLevel', 'Good', 'Good 🔥')}
                {renderOptionButton('energyLevel', 'High', 'High 🚀')}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stress & Mood */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Stress & Mental Wellness
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                Evaluate your baseline stress and general emotional state.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How stressed did you feel this week?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('stressLevel', 'Low', 'Low 😌')}
                {renderOptionButton('stressLevel', 'Medium', 'Medium 😐')}
                {renderOptionButton('stressLevel', 'High', 'High 😰')}
                {renderOptionButton('stressLevel', 'Very high', 'Very high 💥')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How was your mood overall?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('mood', 'Low', 'Low 😔')}
                {renderOptionButton('mood', 'Okay', 'Okay 😐')}
                {renderOptionButton('mood', 'Good', 'Good 🙂')}
                {renderOptionButton('mood', 'Great', 'Great 😄')}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Food & Activity */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Food & Movement Routine
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                Review how consistently you hit your nutrition budget goals and movement habits.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How often did you follow your meal plan?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('mealConsistency', 'Rarely', 'Rarely 🚫')}
                {renderOptionButton('mealConsistency', '2–3 days', '2–3 days 🥗')}
                {renderOptionButton('mealConsistency', '4–5 days', '4–5 days 🍲')}
                {renderOptionButton('mealConsistency', 'Most days', 'Most days 🌟')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How active were you this week?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('activityLevel', 'Mostly inactive', 'Sitting 🪑')}
                {renderOptionButton('activityLevel', 'Lightly active', 'Light 🚶')}
                {renderOptionButton('activityLevel', 'Moderately active', 'Moderate 🏃')}
                {renderOptionButton('activityLevel', 'Very active', 'Active 💪')}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Screen & Reflection */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Screen Balance & Reflection
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                Final step. Reflect on screen fatigue and add any details for VitalIQ Health AI.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How was your screen time balance?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {renderOptionButton('screenBalance', 'Poor', 'Poor 📱')}
                {renderOptionButton('screenBalance', 'Okay', 'Okay 😐')}
                {renderOptionButton('screenBalance', 'Good', 'Good 👓')}
                {renderOptionButton('screenBalance', 'Great', 'Great 🌳')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="reflection-text" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Anything you want VitalIQ to consider? <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <textarea
                id="reflection-text"
                name="reflection"
                placeholder="Example: Had exams this week, which led to higher screen time and less sleep. Hoping to bounce back next week..."
                value={formData.reflection}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: '#f8fafc',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border 0.2s ease'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
              />
            </div>
          </div>
        )}

        {/* Form Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '8px' }}>
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="btn-ghost"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700
              }}
            >
              <FiChevronLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700
              }}
            >
              Next <FiChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
                borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
              }}
            >
              {isSubmitting ? 'Generating score...' : 'Submit Reflection'}
            </button>
          )}
        </div>
      </form>

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
          <FiShield size={16} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>General Wellness Scope:</strong> Weekly check-ins represent personal habit and wellness reflections designed for lifestyle awareness. They do not constitute clinical screening, medical diagnosis, or preventative treatments. Consult a licensed clinician for healthcare guidance.
          </span>
        </div>
      </div>

    </div>
  );
};

export default WeeklyCheckin;
