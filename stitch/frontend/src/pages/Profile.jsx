import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { getVitaliqPreferences, saveVitaliqPreferences, isGuestSession } from '../utils/preferences';
import toast from 'react-hot-toast';
import {
  FiUser, FiTarget, FiShoppingBag, FiHome, FiClock,
  FiSave, FiAlertTriangle, FiCheck, FiArrowRight
} from 'react-icons/fi';

const USER_TYPES = ['Student', 'Working Professional', 'Homemaker', 'Fitness Beginner', 'General User'];
const AGE_GROUPS = ['Under 18', '18–24', '25–34', '35–44', '45+'];
const GOALS = [
  'Eat healthy within budget',
  'Improve energy',
  'Sleep better',
  'Reduce stress',
  'Build consistency',
  'Weight management',
  'General wellness'
];
const FOOD_PREFERENCES = ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'];
const BUDGET_PERIODS = ['Per day', 'Per week', 'Per month'];
const MEALS_PER_DAY = [3, 4, 5];
const LIVING_TYPES = ['Hostel', 'PG', 'Home', 'Flat', 'Other'];
const COOKING_ACCESS = ['No kitchen', 'Basic cooking', 'Full kitchen', 'Mess/tiffin dependent'];
const SLEEP_TARGETS = ['Before 11 PM', '11 PM–12 AM', '12 AM–1 AM', 'After 1 AM'];
const ACTIVITY_LEVELS = ['Mostly sitting', 'Light movement', 'Moderate activity', 'Very active'];
const REMINDER_PREFS = ['No reminders', 'Morning', 'Evening', 'Both'];

const Profile = () => {
  const { user, updatePreferencesState } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  
  // State for check preferences existence
  const [hasPrefs, setHasPrefs] = useState(false);
  const [isGuest, setIsGuest] = useState(true);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [goals, setGoals] = useState([]);
  const [foodPreference, setFoodPreference] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('Per day');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [livingType, setLivingType] = useState('');
  const [cookingAccess, setCookingAccess] = useState('');
  const [cityOrRegion, setCityOrRegion] = useState('');
  const [sleepTarget, setSleepTarget] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [reminderPreference, setReminderPreference] = useState('');

  // Load preferences on mount
  useEffect(() => {
    const isGuestUser = isGuestSession();
    setIsGuest(isGuestUser);

    const prefs = getVitaliqPreferences();
    const completed = prefs && (prefs.onboardingCompleted || prefs.onboardingSkipped);

    if (completed) {
      setHasPrefs(true);
      // Prefill fields
      setDisplayName(isGuestUser ? (prefs.displayName || 'Guest User') : (user?.name || ''));
      setUserType(prefs.userType || '');
      setAgeGroup(prefs.ageGroup || '');
      setGoals(prefs.goals || []);
      setFoodPreference(prefs.foodPreference || '');
      setBudgetAmount(prefs.budgetAmount || '');
      setBudgetPeriod(prefs.budgetPeriod || 'Per day');
      setMealsPerDay(Number(prefs.mealsPerDay) || 3);
      setLivingType(prefs.livingType || '');
      setCookingAccess(prefs.cookingAccess || '');
      setCityOrRegion(prefs.cityOrRegion || '');
      setSleepTarget(prefs.sleepTarget || '');
      setActivityLevel(prefs.activityLevel || '');
      setReminderPreference(prefs.reminderPreference || '');
    } else {
      setHasPrefs(false);
    }
  }, [user]);

  const toggleGoal = (goal) => {
    setGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      } else {
        return [...prev, goal];
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updatedPrefs = {
      onboardingCompleted: true,
      onboardingSkipped: false,
      displayName: displayName.trim(),
      userType,
      ageGroup,
      goals,
      foodPreference,
      budgetAmount: budgetAmount === '' ? null : Number(budgetAmount),
      budgetPeriod,
      mealsPerDay: Number(mealsPerDay),
      livingType,
      cookingAccess,
      cityOrRegion: cityOrRegion.trim(),
      sleepTarget,
      activityLevel,
      reminderPreference,
      updatedAt: new Date()
    };

    try {
      if (isGuest) {
        // Save to localStorage via helper
        saveVitaliqPreferences(updatedPrefs);
        
        // Update global React auth state context
        if (updatePreferencesState) {
          updatePreferencesState(updatedPrefs, displayName.trim());
        }
        
        toast.success(
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>Preferences updated.</p>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
              Your dashboard, meal plans, and daily actions will use these changes.
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Note: Guest preferences are saved on this device only.
            </p>
          </div>,
          { duration: 5000 }
        );
      } else {
        // Logged-in user: Put to database
        const res = await authAPI.updatePreferences(updatedPrefs);
        
        if (res.data.success) {
          // Update global React context
          if (updatePreferencesState) {
            updatePreferencesState(res.data.preferences, displayName.trim());
          }
          
          toast.success(
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>Preferences updated.</p>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                Your dashboard, meal plans, and daily actions will use these changes.
              </p>
            </div>
          );
        } else {
          toast.error('Failed to update preferences.');
        }
      }
      setHasPrefs(true);
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error('An error occurred while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If no preferences have been created yet, show the friendly empty state
  if (!hasPrefs) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
        <EmptyState
          title="Personalize VitalIQ"
          description="Set your goals, budget, food preference, and routine."
          icon="🎯"
          primaryActionLabel="Start Onboarding"
          primaryActionTo="/onboarding"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Profile', icon: <FiUser /> },
    { id: 'goals', label: 'Wellness Goals', icon: <FiTarget /> },
    { id: 'food', label: 'Food & Budget', icon: <FiShoppingBag /> },
    { id: 'living', label: 'Living & Cooking', icon: <FiHome /> },
    { id: 'routine', label: 'Routine Preferences', icon: <FiClock /> }
  ];

  return (
    <div className="page-enter" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px' }}>
          My <span className="gradient-text">Profile & Preferences</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Update your goals, routine, budget, and wellness preferences anytime.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Main Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }} className="profile-grid">
          {/* Left: Tabs Navigation */}
          <div className="medical-card" style={{ padding: '12px', background: 'white' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className="profile-tabs-container">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: '0.88rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Active Tab Forms */}
          <div className="medical-card" style={{ padding: '32px', background: 'white', minHeight: '400px' }}>
            
            {/* Section 1: Basic Profile */}
            {activeTab === 'basic' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '8px' }}>
                  Basic Profile
                </h3>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    maxLength={40}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Which best describes you?
                  </label>
                  <select
                    className="select-field"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select user type</option>
                    {USER_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Your age group?
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {AGE_GROUPS.map(age => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setAgeGroup(age)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${ageGroup === age ? 'var(--primary)' : '#e2e8f0'}`,
                          background: ageGroup === age ? 'var(--primary-50)' : 'white',
                          color: ageGroup === age ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Wellness Goals */}
            {activeTab === 'goals' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '8px' }}>
                  Wellness Goals
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
                  Select multiple areas you would like VitalIQ Health to help you focus on.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {GOALS.map(goal => {
                    const isSelected = goals.includes(goal);
                    return (
                      <div
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? 'var(--primary)' : '#e2e8f0'}`,
                          background: isSelected ? 'var(--primary-50)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {goal}
                        </span>
                        {isSelected && <FiCheck color="var(--primary)" size={18} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Food & Budget */}
            {activeTab === 'food' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '8px' }}>
                  Food & Budget
                </h3>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Food Preference
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {FOOD_PREFERENCES.map(pref => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setFoodPreference(pref)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${foodPreference === pref ? 'var(--primary)' : '#e2e8f0'}`,
                          background: foodPreference === pref ? 'var(--primary-50)' : 'white',
                          color: foodPreference === pref ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Food Budget (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600 }}>₹</span>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="e.g. 500"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Budget Period
                    </label>
                    <select
                      className="select-field"
                      value={budgetPeriod}
                      onChange={(e) => setBudgetPeriod(e.target.value)}
                    >
                      {BUDGET_PERIODS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Meals Per Day
                  </label>
                  <select
                    className="select-field"
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(Number(e.target.value))}
                  >
                    {MEALS_PER_DAY.map(num => (
                      <option key={num} value={num}>{num} Meals</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Section 4: Living & Cooking */}
            {activeTab === 'living' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '8px' }}>
                  Living & Cooking
                </h3>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Living Arrangement
                  </label>
                  <select
                    className="select-field"
                    value={livingType}
                    onChange={(e) => setLivingType(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select living arrangement</option>
                    {LIVING_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Cooking Access
                  </label>
                  <select
                    className="select-field"
                    value={cookingAccess}
                    onChange={(e) => setCookingAccess(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select cooking access</option>
                    {COOKING_ACCESS.map(access => (
                      <option key={access} value={access}>{access}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    City or Region (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Bhopal"
                    value={cityOrRegion}
                    onChange={(e) => setCityOrRegion(e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>
            )}

            {/* Section 5: Routine Preferences */}
            {activeTab === 'routine' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '8px' }}>
                  Routine Preferences
                </h3>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Target Bedtime
                  </label>
                  <select
                    className="select-field"
                    value={sleepTarget}
                    onChange={(e) => setSleepTarget(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select bedtime</option>
                    {SLEEP_TARGETS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Activity Level
                  </label>
                  <select
                    className="select-field"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select activity level</option>
                    {ACTIVITY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '8px', background: 'transparent', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Reminder Preference
                  </label>
                  <select
                    className="select-field"
                    value={reminderPreference}
                    onChange={(e) => setReminderPreference(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select reminders</option>
                    {REMINDER_PREFS.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Bottom Actions inside Form Card */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                {isGuest && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FiAlertTriangle size={14} color="var(--accent-amber)" /> Guest preferences are saved on this device only.
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ minWidth: '140px', padding: '12px 24px', fontWeight: 700 }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                ) : (
                  <>
                    <FiSave /> Save Changes
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </form>

      {/* Safety Disclaimer Wording Box */}
      <div style={{
        marginTop: '32px',
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        lineHeight: 1.6
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <FiAlertTriangle size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>General Wellness Support:</strong> VitalIQ Health provides lifestyle recommendations, budget meal ideas, and routine habits to assist with general wellness goals. This platform does not provide medical diagnoses, treatments, cures, or clinical-grade precision. Always consult a qualified physician or healthcare provider with any medical questions.
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
