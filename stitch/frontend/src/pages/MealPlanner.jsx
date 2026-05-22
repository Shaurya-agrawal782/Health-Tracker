import React, { useState } from 'react';
import { FiCoffee, FiSun, FiMoon, FiZap, FiCheckCircle, FiLoader, FiDownload, FiEdit2, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { recommendationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BUDGET_LEVELS = ['Low budget', 'Medium budget', 'High budget', 'Custom budget'];
const BUDGET_PERIODS = ['Per day', 'Per week', 'Per month'];
const USER_TYPES = ['Student', 'Working professional', 'Fitness focused', 'General wellness'];
const FOOD_PREFERENCES = ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'];
const WELLNESS_GOALS = [
  'Balanced diet', 'Weight management', 'High protein', 
  'Energy & focus', 'Diabetes-friendly general wellness', 'Heart-friendly general wellness'
];

const MealPlanner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);

  const isGuest = user?.isGuest || user?.role === 'guest';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});

  const defaultUserType = USER_TYPES.includes(prefs.userType) ? prefs.userType : USER_TYPES[0];
  const defaultFoodPref = FOOD_PREFERENCES.includes(prefs.foodPreference) ? prefs.foodPreference : FOOD_PREFERENCES[0];
  const defaultGoal = prefs.goals?.length > 0 && WELLNESS_GOALS.includes(prefs.goals[0]) ? prefs.goals[0] : WELLNESS_GOALS[0];
  const defaultBudgetAmt = prefs.budgetAmount || '';
  const defaultBudgetPeriod = BUDGET_PERIODS.includes(prefs.budgetPeriod) ? prefs.budgetPeriod : BUDGET_PERIODS[0];
  const defaultBudgetLevel = defaultBudgetAmt ? 'Custom budget' : BUDGET_LEVELS[0];
  
  // Form State
  const [budgetLevel, setBudgetLevel] = useState(defaultBudgetLevel);
  const [budgetAmount, setBudgetAmount] = useState(defaultBudgetAmt);
  const [budgetPeriod, setBudgetPeriod] = useState(defaultBudgetPeriod);
  const [userType, setUserType] = useState(defaultUserType);
  const [foodPreference, setFoodPreference] = useState(defaultFoodPref);
  const [wellnessGoal, setWellnessGoal] = useState(defaultGoal);

  const generatePlan = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const payload = {
        budgetLevel,
        budgetAmount: budgetLevel === 'Custom budget' ? budgetAmount : undefined,
        budgetPeriod,
        userType,
        foodPreference,
        wellnessGoal
      };

      const res = await recommendationAPI.getMealPlan(payload);
      if (res.data.success) {
        setMealPlan(res.data.data);
      } else {
        toast.error('Failed to generate meal plan.');
      }
    } catch (err) {
      console.error('Failed to generate meal plan:', err);
      toast.error('An error occurred while generating your meal plan.');
    } finally {
      setLoading(false);
    }
  };

  if (mealPlan) {
    return (
      <div className="page-enter">
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
              <span className="gradient-text">{mealPlan.title || 'AI Nutrition Planner'}</span> 🥗
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: 'var(--primary-50)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                {foodPreference} • {budgetLevel}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Est. Cost: {mealPlan.approxDailyCost}
              </span>
            </div>
          </div>
          <button onClick={() => setMealPlan(null)} className="btn-ghost">
            <FiEdit2 /> Edit Budget
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Main Plan Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="medical-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                Your Daily Plan
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { type: 'Breakfast', icon: <FiCoffee />, text: mealPlan.breakfast },
                  { type: 'Lunch', icon: <FiSun />, text: mealPlan.lunch },
                  { type: 'Evening Snack', icon: <FiZap />, text: mealPlan.eveningSnack },
                  { type: 'Dinner', icon: <FiMoon />, text: mealPlan.dinner }
                ].map((meal, midx) => (
                  <div key={midx} style={{ 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                      {meal.icon}
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>{meal.type}</span>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#0f172a', lineHeight: 1.5 }}>{meal.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="medical-card" style={{ padding: '20px', background: '#0f172a', color: 'white' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Budget Note</h4>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <FiDollarSign color="var(--accent-teal)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                  {mealPlan.budgetNote}
                </p>
              </div>
            </div>

            {mealPlan.affordableSwaps && mealPlan.affordableSwaps.length > 0 && (
              <div className="medical-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Affordable Swaps</h4>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mealPlan.affordableSwaps.map((swap, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                      <span>{swap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="disclaimer-box" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Safety Note: </strong>
                  {mealPlan.safetyNote || 'VitalIQ Health provides general wellness meal ideas. This is not medical treatment. Consult a nutritionist or doctor for medical diet plans.'}
                </span>
              </div>
            </div>

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <FiDownload /> Download Plan PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup View
  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
          <span className="gradient-text">Budget-Based Meal Planner</span> 🥗
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          VitalIQ Health will suggest affordable meal ideas based on your budget and preferences. Prices are approximate and may vary by location.
        </p>
      </div>

      <div className="medical-card" style={{ padding: '32px' }}>
        <form onSubmit={generatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Budget Selection */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px' }}>What is your food budget?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {BUDGET_LEVELS.map(level => (
                <button
                  key={level} type="button"
                  onClick={() => setBudgetLevel(level)}
                  style={{
                    padding: '12px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${budgetLevel === level ? 'var(--primary)' : 'var(--border-light)'}`,
                    background: budgetLevel === level ? 'var(--primary-50)' : 'white',
                    color: budgetLevel === level ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Budget Amount (Conditionally Rendered) */}
          {budgetLevel === 'Custom budget' && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Budget Amount (₹)</label>
                <input
                  type="number" className="input-field" placeholder="e.g. 500"
                  value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Period</label>
                <select className="select-field" value={budgetPeriod} onChange={(e) => setBudgetPeriod(e.target.value)}>
                  {BUDGET_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Preferences Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Food Preference</label>
              <select className="select-field" value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)}>
                {FOOD_PREFERENCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>User Type</label>
              <select className="select-field" value={userType} onChange={(e) => setUserType(e.target.value)}>
                {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Wellness Goal</label>
              <select className="select-field" value={wellnessGoal} onChange={(e) => setWellnessGoal(e.target.value)}>
                {WELLNESS_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} disabled={loading}>
              {loading ? (
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                <>Generate Meal Plan <FiZap style={{ marginLeft: '8px' }} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealPlanner;
