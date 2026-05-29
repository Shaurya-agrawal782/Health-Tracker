import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const USER_TYPES = ['Student', 'Working Professional', 'Homemaker', 'Fitness Beginner', 'General User'];
const AGE_GROUPS = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
const GOALS = ['Eat healthy within budget', 'Improve energy', 'Sleep better', 'Reduce stress', 'Build consistency', 'Weight management', 'General wellness'];
const FOOD_PREFERENCES = ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'];
const BUDGET_PERIODS = ['Per day', 'Per week', 'Per month'];
const LIVING_TYPES = ['Home with family', 'Hostel', 'Shared apartment', 'Living alone'];
const COOKING_ACCESS = ['Full kitchen', 'Basic cooking (e.g. induction, kettle)', 'No cooking (dependent on mess/outside food)'];
const SLEEP_TARGETS = ['Before 10 PM', '10 PM–11 PM', '11 PM–12 AM', 'After 12 AM', 'Irregular'];
const ACTIVITY_LEVELS = ['Sedentary (mostly sitting)', 'Light activity', 'Moderate activity', 'Very active'];
const REMINDER_PREFS = ['Meals', 'Water & Movement', 'Both', 'None'];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updatePreferencesState } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    userType: '',
    ageGroup: '',
    goals: [],
    foodPreference: '',
    budgetAmount: '',
    budgetPeriod: 'Per day',
    mealsPerDay: 3,
    livingType: '',
    cookingAccess: '',
    cityOrRegion: '',
    sleepTarget: '',
    activityLevel: '',
    reminderPreference: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal) => {
    setFormData(prev => {
      if (prev.goals.includes(goal)) {
        return { ...prev, goals: prev.goals.filter(g => g !== goal) };
      } else {
        return { ...prev, goals: [...prev.goals, goal] };
      }
    });
  };

  const isStepValid = () => {
    if (step === 1) return formData.userType && formData.ageGroup;
    if (step === 2) return formData.goals.length > 0;
    if (step === 3) {
      if (formData.budgetAmount !== '' && Number(formData.budgetAmount) <= 0) return false;
      return formData.foodPreference; // budget is optional
    }
    if (step === 4) return formData.livingType && formData.cookingAccess;
    if (step === 5) return formData.sleepTarget && formData.activityLevel && formData.reminderPreference;
    return true;
  };

  const submitPreferences = async (skip = false) => {
    setLoading(true);
    try {
      const cleanedFormData = { ...formData };
      if (cleanedFormData.budgetAmount === '') {
        delete cleanedFormData.budgetAmount;
      }

      const payload = skip ? {
        onboardingCompleted: false,
        onboardingSkipped: true
      } : {
        ...cleanedFormData,
        onboardingCompleted: true,
        onboardingSkipped: false
      };

      const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
      
      if (isGuest) {
        localStorage.setItem('vitaliq_onboarding', JSON.stringify(payload));
        // Also update local state
        if (updatePreferencesState) updatePreferencesState(payload);
      } else {
        await authAPI.updatePreferences(payload);
        if (updatePreferencesState) updatePreferencesState(payload);
      }
      
      if (skip) {
        toast.success('You can personalize your plan later from the dashboard.');
      } else {
        toast.success('Your wellness plan has been personalized!');
      }
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else submitPreferences();
  };

  return (
    <div className="onboarding-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div className="onboarding-card animate-fade-in-scale" style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        padding: '40px',
        width: '100%',
        maxWidth: '560px',
        position: 'relative'
      }}>
        {/* Skip Link */}
        <button 
          onClick={() => submitPreferences(true)}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          Skip for now
        </button>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} style={{
              width: s === step ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: s === step ? 'var(--primary)' : (s < step ? '#99f6e4' : '#e2e8f0'),
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Personalize Your Wellness Plan
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Answer a few simple questions so VitalIQ can tailor your meals, habits, and daily actions.
          </p>
        </div>

        {/* Step 1: About You */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Step 1: About You</h2>
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Which best describes you?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {USER_TYPES.map(type => (
                  <button
                    key={type} type="button"
                    onClick={() => handleChange('userType', type)}
                    className="onboarding-select-btn"
                    style={{
                      flex: '1 1 calc(50% - 10px)',
                      minWidth: '130px',
                      padding: '12px 16px', borderRadius: '12px',
                      border: `2px solid ${formData.userType === type ? 'var(--primary)' : '#e2e8f0'}`,
                      background: formData.userType === type ? 'var(--primary-50)' : 'white',
                      color: formData.userType === type ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >{type}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Your age group?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {AGE_GROUPS.map(age => (
                  <button
                    key={age} type="button"
                    onClick={() => handleChange('ageGroup', age)}
                    className="onboarding-select-btn"
                    style={{
                      flex: '1 1 calc(33.33% - 10px)',
                      minWidth: '90px',
                      padding: '12px 10px', borderRadius: '12px',
                      border: `2px solid ${formData.ageGroup === age ? 'var(--primary)' : '#e2e8f0'}`,
                      background: formData.ageGroup === age ? 'var(--primary-50)' : 'white',
                      color: formData.ageGroup === age ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >{age}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Main Goal */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Step 2: Main Goals</h2>
            <label className="input-label" style={{ display: 'block', marginBottom: '12px', fontWeight: 700 }}>What do you want to achieve? (Select multiple)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {GOALS.map(goal => (
                <div 
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  style={{
                    padding: '14px 16px', borderRadius: '12px',
                    border: `2px solid ${formData.goals.includes(goal) ? 'var(--primary)' : '#e2e8f0'}`,
                    background: formData.goals.includes(goal) ? 'var(--primary-50)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontWeight: 600, color: formData.goals.includes(goal) ? 'var(--primary)' : 'var(--text-primary)' }}>{goal}</span>
                  {formData.goals.includes(goal) && <FiCheckCircle color="var(--primary)" size={20} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Food & Budget */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Step 3: Food & Budget</h2>
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Food Preference</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {FOOD_PREFERENCES.map(pref => (
                  <button
                    key={pref} type="button"
                    onClick={() => handleChange('foodPreference', pref)}
                    className="onboarding-select-btn"
                    style={{
                      flex: '1 1 calc(50% - 10px)',
                      minWidth: '130px',
                      padding: '12px 16px', borderRadius: '12px',
                      border: `2px solid ${formData.foodPreference === pref ? 'var(--primary)' : '#e2e8f0'}`,
                      background: formData.foodPreference === pref ? 'var(--primary-50)' : 'white',
                      color: formData.foodPreference === pref ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >{pref}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Food Budget (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600 }}>₹</span>
                  <input
                    type="number" className="input-field" placeholder="e.g. 500"
                    value={formData.budgetAmount} onChange={(e) => handleChange('budgetAmount', e.target.value)}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
                {formData.budgetAmount !== '' && Number(formData.budgetAmount) <= 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-coral)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                    Please enter a valid budget amount.
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Example: ₹150 per day or ₹4500 per month.
                </span>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Period</label>
                <select className="select-field" value={formData.budgetPeriod} onChange={(e) => handleChange('budgetPeriod', e.target.value)}>
                  {BUDGET_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Meals Per Day</label>
              <select className="select-field" value={formData.mealsPerDay} onChange={(e) => handleChange('mealsPerDay', parseInt(e.target.value))}>
                <option value={2}>2 Meals</option>
                <option value={3}>3 Meals</option>
                <option value={4}>4 Meals</option>
                <option value={5}>5 Meals</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Living & Cooking */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Step 4: Living & Cooking</h2>
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Living Arrangement</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {LIVING_TYPES.map(type => (
                  <label 
                    key={type} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '14px 16px', 
                      background: formData.livingType === type ? 'var(--primary-50)' : '#f8fafc', 
                      border: `2px solid ${formData.livingType === type ? 'var(--primary)' : 'transparent'}`,
                      borderRadius: '12px', 
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="livingType" 
                      checked={formData.livingType === type} 
                      onChange={() => handleChange('livingType', type)}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Cooking Access</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {COOKING_ACCESS.map(access => (
                  <label 
                    key={access} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '14px 16px', 
                      background: formData.cookingAccess === access ? 'var(--primary-50)' : '#f8fafc', 
                      border: `2px solid ${formData.cookingAccess === access ? 'var(--primary)' : 'transparent'}`,
                      borderRadius: '12px', 
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="cookingAccess" 
                      checked={formData.cookingAccess === access} 
                      onChange={() => handleChange('cookingAccess', access)}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{access}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Routine */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Step 5: Your Routine</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Target Bedtime</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SLEEP_TARGETS.map(item => (
                  <button
                    key={item} type="button"
                    onClick={() => handleChange('sleepTarget', item)}
                    style={{
                      width: '100%',
                      padding: '14px 16px', borderRadius: '12px',
                      border: `2px solid ${formData.sleepTarget === item ? 'var(--primary)' : '#e2e8f0'}`,
                      background: formData.sleepTarget === item ? 'var(--primary-50)' : 'white',
                      color: formData.sleepTarget === item ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                    }}
                  >{item}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Activity Level</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ACTIVITY_LEVELS.map(item => (
                  <button
                    key={item} type="button"
                    onClick={() => handleChange('activityLevel', item)}
                    style={{
                      width: '100%',
                      padding: '14px 16px', borderRadius: '12px',
                      border: `2px solid ${formData.activityLevel === item ? 'var(--primary)' : '#e2e8f0'}`,
                      background: formData.activityLevel === item ? 'var(--primary-50)' : 'white',
                      color: formData.activityLevel === item ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                    }}
                  >{item}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>What reminders do you want?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REMINDER_PREFS.map(item => (
                  <button
                    key={item} type="button"
                    onClick={() => handleChange('reminderPreference', item)}
                    style={{
                      width: '100%',
                      padding: '14px 16px', borderRadius: '12px',
                      border: `2px solid ${formData.reminderPreference === item ? 'var(--primary)' : '#e2e8f0'}`,
                      background: formData.reminderPreference === item ? 'var(--primary-50)' : 'white',
                      color: formData.reminderPreference === item ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                    }}
                  >{item}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <button 
            type="button" 
            onClick={() => setStep(step - 1)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              visibility: step === 1 ? 'hidden' : 'visible'
            }}
          >
            <FiArrowLeft /> Back
          </button>
          
          <button 
            type="button" 
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="btn-primary"
            style={{
              padding: '12px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            ) : step === 5 ? (
              'Create My Wellness Plan'
            ) : (
              <>Next <FiArrowRight /></>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @media (max-width: 600px) {
          .onboarding-card {
            padding: 24px 16px 40px 16px !important;
            border-radius: 0px !important;
            min-height: 100vh;
            width: 100% !important;
            max-width: 100% !important;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            box-shadow: none !important;
          }
          .onboarding-wrapper {
            padding: 0 !important;
            background: white !important;
          }
          .onboarding-select-btn {
            font-size: 0.85rem !important;
            padding: 10px 12px !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;

