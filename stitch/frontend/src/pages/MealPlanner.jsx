import React, { useState } from 'react';
import { FiCoffee, FiSun, FiMoon, FiZap, FiCheckCircle, FiEdit2, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { recommendationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MealPlanner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);

  // Helper to load and map onboarding preferences if they exist
  const getMappedPreferences = () => {
    const isGuest = user?.isGuest || user?.role === 'guest';
    const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
    const prefs = isGuest ? guestOnboarding : (user?.preferences || {});

    // Mappings
    let userTypeMapped = 'General user';
    if (prefs.userType === 'Student') userTypeMapped = 'Student';
    else if (prefs.userType === 'Working Professional' || prefs.userType === 'Working professional') userTypeMapped = 'Working professional';

    const foodPrefMapped = ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'].includes(prefs.foodPreference) 
      ? prefs.foodPreference 
      : 'Vegetarian';

    let livingTypeMapped = 'Home';
    if (prefs.livingType === 'Hostel') livingTypeMapped = 'Hostel';
    else if (prefs.livingType === 'Shared apartment' || prefs.livingType === 'Living alone') livingTypeMapped = 'Flat';
    else if (prefs.livingType === 'Home with family') livingTypeMapped = 'Home';

    let cookingAccessMapped = 'Basic cooking';
    if (prefs.cookingAccess === 'Full kitchen') cookingAccessMapped = 'Full kitchen';
    else if (prefs.cookingAccess?.includes('Basic cooking')) cookingAccessMapped = 'Basic cooking';
    else if (prefs.cookingAccess?.includes('No cooking') || prefs.cookingAccess?.includes('Mess')) cookingAccessMapped = 'Mess/tiffin dependent';

    let wellnessGoalMapped = 'Balanced diet';
    if (Array.isArray(prefs.goals)) {
      if (prefs.goals.includes('Eat healthy within budget')) wellnessGoalMapped = 'Budget wellness';
      else if (prefs.goals.includes('Improve energy')) wellnessGoalMapped = 'Energy & focus';
      else if (prefs.goals.includes('Weight management')) wellnessGoalMapped = 'Weight management';
      else if (prefs.goals.includes('General wellness')) wellnessGoalMapped = 'General wellness';
    }

    const budgetPeriodMapped = ['Per day', 'Per week', 'Per month'].includes(prefs.budgetPeriod)
      ? prefs.budgetPeriod
      : 'Per day';

    const mealsPerDayMapped = [3, 4, 5].includes(Number(prefs.mealsPerDay))
      ? Number(prefs.mealsPerDay)
      : 4;

    const budgetAmountMapped = prefs.budgetAmount || '';
    const budgetLevelMapped = budgetAmountMapped ? 'Custom' : 'Low budget';

    return {
      userType: userTypeMapped,
      foodPreference: foodPrefMapped,
      livingType: livingTypeMapped,
      cookingAccess: cookingAccessMapped,
      wellnessGoal: wellnessGoalMapped,
      budgetPeriod: budgetPeriodMapped,
      mealsPerDay: mealsPerDayMapped,
      budgetAmount: budgetAmountMapped,
      budgetLevel: budgetLevelMapped,
      cityOrRegion: prefs.cityOrRegion || ''
    };
  };

  const initialPrefs = getMappedPreferences();

  // Form States
  const [budgetLevel, setBudgetLevel] = useState(initialPrefs.budgetLevel);
  const [budgetAmount, setBudgetAmount] = useState(initialPrefs.budgetAmount);
  const [budgetPeriod, setBudgetPeriod] = useState(initialPrefs.budgetPeriod);
  const [foodPreference, setFoodPreference] = useState(initialPrefs.foodPreference);
  const [userType, setUserType] = useState(initialPrefs.userType);
  const [livingType, setLivingType] = useState(initialPrefs.livingType);
  const [cookingAccess, setCookingAccess] = useState(initialPrefs.cookingAccess);
  const [wellnessGoal, setWellnessGoal] = useState(initialPrefs.wellnessGoal);
  const [mealsPerDay, setMealsPerDay] = useState(initialPrefs.mealsPerDay);
  const [cityOrRegion, setCityOrRegion] = useState(initialPrefs.cityOrRegion);
  const [allergies, setAllergies] = useState('');

  const generatePlan = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const payload = {
        budgetLevel,
        budgetAmount: budgetLevel === 'Custom' ? budgetAmount : undefined,
        budgetPeriod,
        foodPreference,
        userType,
        livingType,
        cookingAccess,
        wellnessGoal,
        mealsPerDay,
        cityOrRegion,
        allergies
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
    const summary = mealPlan.budgetSummary || {};
    const showGroceryList = cookingAccess === 'Basic cooking' || cookingAccess === 'Full kitchen';
    const showHostelTips = livingType === 'Hostel' || livingType === 'PG';

    const mealsList = [
      { type: 'Breakfast', icon: <FiCoffee />, text: mealPlan.mealPlan?.breakfast },
      { type: 'Lunch', icon: <FiSun />, text: mealPlan.mealPlan?.lunch },
      { type: 'Evening Snack', icon: <FiZap />, text: mealPlan.mealPlan?.snack },
      { type: 'Dinner', icon: <FiMoon />, text: mealPlan.mealPlan?.dinner }
    ];

    if (mealsPerDay === 5 && mealPlan.mealPlan?.extraMeal) {
      mealsList.push({ type: 'Extra Meal', icon: <FiCoffee />, text: mealPlan.mealPlan?.extraMeal });
    }

    return (
      <div className="page-enter">
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
              Your <span className="gradient-text">Budget Meal Plan</span> 🥗
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: 'var(--primary-50)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                {foodPreference} • {summary.budgetLevel || budgetLevel}
              </span>
              {summary.budgetAmount && (
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Budget: ₹{summary.budgetAmount} / {summary.budgetPeriod?.toLowerCase()}
                </span>
              )}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Estimated Cost: {mealPlan.approximateDailyCost || mealPlan.approxDailyCost || 'N/A'}
              </span>
            </div>
          </div>
          <button onClick={() => setMealPlan(null)} className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FiEdit2 /> Edit Budget & Regenerate
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Main Plan Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="medical-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                Your Daily Plan ({mealsPerDay} Meals)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mealsList.map((meal, midx) => (
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
                    <div style={{ fontSize: '1rem', color: '#0f172a', lineHeight: 1.5 }}>{meal.text || 'Meal suggestion omitted.'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mealPlan.budgetNote && (
              <div className="medical-card" style={{ padding: '20px', background: '#0f172a', color: 'white' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Budget Note 💰</h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <FiDollarSign color="var(--accent-teal)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                    {mealPlan.budgetNote}
                  </p>
                </div>
              </div>
            )}

            {/* Affordable Swaps */}
            {mealPlan.affordableSwaps && mealPlan.affordableSwaps.length > 0 && (
              <div className="medical-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Affordable Swaps 🔄</h4>
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

            {/* Grocery List (Only shown for Full kitchen or Basic cooking) */}
            {showGroceryList && mealPlan.groceryList && mealPlan.groceryList.length > 0 && (
              <div className="medical-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Grocery List 🛒</h4>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mealPlan.groceryList.map((item, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hostel/PG Tips (Only shown for PG or Hostel living) */}
            {showHostelTips && mealPlan.hostelTips && mealPlan.hostelTips.length > 0 && (
              <div className="medical-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Hostel & PG Tips 🏠</h4>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mealPlan.hostelTips.map((tip, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Safety Disclaimer */}
            <div className="disclaimer-box" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Safety Note: </strong>
                  {mealPlan.safetyNote || 'VitalIQ Health provides general wellness meal ideas. This is not medical treatment. Consult a nutritionist or doctor for medical diet plans.'}
                </span>
              </div>
            </div>
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
          VitalIQ suggests affordable meal ideas based on your budget and preferences. Prices are approximate and may vary by location.
        </p>
      </div>

      <div className="medical-card" style={{ padding: '32px' }}>
        <form onSubmit={generatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Budget Level */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px' }}>What is your food budget level?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {['Low budget', 'Medium budget', 'High budget', 'Custom'].map(level => (
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
          {budgetLevel === 'Custom' && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>What is your food budget? (₹)</label>
                <input
                  type="number" className="input-field" placeholder="Example: 150"
                  value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Period</label>
                <select className="select-field" value={budgetPeriod} onChange={(e) => setBudgetPeriod(e.target.value)}>
                  <option value="Per day">Per day</option>
                  <option value="Per week">Per week</option>
                  <option value="Per month">Per month</option>
                </select>
              </div>
            </div>
          )}

          {/* Preferences Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Food Preference</label>
              <select className="select-field" value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)}>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-vegetarian">Non-vegetarian</option>
                <option value="Eggetarian">Eggetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>User Type</label>
              <select className="select-field" value={userType} onChange={(e) => setUserType(e.target.value)}>
                <option value="Student">Student</option>
                <option value="Working professional">Working professional</option>
                <option value="General user">General user</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Living Type</label>
              <select className="select-field" value={livingType} onChange={(e) => setLivingType(e.target.value)}>
                <option value="Home">Home</option>
                <option value="Hostel">Hostel</option>
                <option value="PG">PG</option>
                <option value="Flat">Flat</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Cooking Access</label>
              <select className="select-field" value={cookingAccess} onChange={(e) => setCookingAccess(e.target.value)}>
                <option value="No kitchen">No kitchen</option>
                <option value="Basic cooking">Basic cooking</option>
                <option value="Full kitchen">Full kitchen</option>
                <option value="Mess/tiffin dependent">Mess/tiffin dependent</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Wellness Goal</label>
              <select className="select-field" value={wellnessGoal} onChange={(e) => setWellnessGoal(e.target.value)}>
                <option value="Balanced diet">Balanced diet</option>
                <option value="Energy & focus">Energy & focus</option>
                <option value="High protein">High protein</option>
                <option value="Weight management">Weight management</option>
                <option value="Budget wellness">Budget wellness</option>
                <option value="General wellness">General wellness</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Meals Per Day</label>
              <select className="select-field" value={mealsPerDay} onChange={(e) => setMealsPerDay(Number(e.target.value))}>
                <option value={3}>3 Meals</option>
                <option value={4}>4 Meals</option>
                <option value={5}>5 Meals</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>City or Region (Optional)</label>
              <input
                type="text" className="input-field" placeholder="Example: Bhopal"
                value={cityOrRegion} onChange={(e) => setCityOrRegion(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>Allergies (Optional)</label>
              <input
                type="text" className="input-field" placeholder="Example: peanuts, milk, gluten"
                value={allergies} onChange={(e) => setAllergies(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={loading}>
              {loading ? (
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                <>Generate Budget Meal Plan <FiZap /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealPlanner;
