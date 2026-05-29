import React, { useState, useEffect, useCallback } from 'react';
import { FiCoffee, FiSun, FiMoon, FiZap, FiCheckCircle, FiEdit2, FiAlertTriangle, FiDollarSign, FiArrowLeft, FiArrowRight, FiRefreshCw, FiShoppingCart, FiHome, FiInfo } from 'react-icons/fi';
import { recommendationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Fallback Meal Engine ───────────────────────────────────────────────────────
const FALLBACK_MEALS = {
  Vegetarian: {
    breakfast: [
      { name: 'Poha with peanuts & lemon', cost: 15, tip: 'Make at home with flattened rice' },
      { name: 'Upma with vegetables', cost: 12, tip: 'Use leftover veggies' },
      { name: 'Paratha with curd', cost: 20, tip: 'Whole wheat for extra fiber' },
      { name: 'Idli with chutney', cost: 15, tip: 'Soak batter overnight' },
      { name: 'Bread toast with banana', cost: 10, tip: 'Quick no-cook option' },
    ],
    lunch: [
      { name: 'Dal rice with seasonal sabzi', cost: 30, tip: 'Cheapest balanced meal' },
      { name: 'Rajma chawal', cost: 35, tip: 'Soak rajma overnight to save gas' },
      { name: 'Chole with 2 rotis', cost: 30, tip: 'Great protein source' },
      { name: 'Mixed veg pulao', cost: 25, tip: 'Use whatever veggies are cheap' },
      { name: 'Khichdi with papad', cost: 20, tip: 'Easy to digest, very affordable' },
    ],
    snack: [
      { name: 'Roasted chana with tea', cost: 10, tip: 'High protein, low cost' },
      { name: 'Seasonal fruit', cost: 15, tip: 'Banana or guava are cheapest' },
      { name: 'Murmura (puffed rice) mix', cost: 8, tip: 'Add onion, lemon, peanuts' },
      { name: 'Biscuits with milk', cost: 12, tip: 'Quick energy boost' },
    ],
    dinner: [
      { name: 'Roti with dal & sabzi', cost: 30, tip: 'Classic balanced dinner' },
      { name: 'Vegetable daliya', cost: 20, tip: 'Light and nutritious' },
      { name: 'Paneer bhurji with roti', cost: 40, tip: 'Good protein if budget allows' },
      { name: 'Masoor dal with rice', cost: 25, tip: 'Quick to cook, very affordable' },
    ],
  },
  'Non-vegetarian': {
    breakfast: [
      { name: 'Egg bhurji with bread', cost: 20, tip: 'High protein start' },
      { name: 'Boiled eggs with toast', cost: 15, tip: 'Simplest protein breakfast' },
      { name: 'Omelette with paratha', cost: 25, tip: 'Filling and affordable' },
    ],
    lunch: [
      { name: 'Chicken curry with rice', cost: 50, tip: 'Buy chicken on discount days' },
      { name: 'Egg curry with 2 rotis', cost: 30, tip: 'Budget-friendly protein' },
      { name: 'Dal rice with egg fry', cost: 35, tip: 'Add boiled egg to any dal' },
    ],
    snack: [
      { name: 'Boiled egg with salt & pepper', cost: 10, tip: 'Best protein snack' },
      { name: 'Peanut chaat', cost: 12, tip: 'Mix peanuts, onion, lemon' },
    ],
    dinner: [
      { name: 'Egg fried rice', cost: 30, tip: 'Use day-old rice for best result' },
      { name: 'Fish curry with rice', cost: 45, tip: 'River fish is cheaper' },
      { name: 'Keema with roti', cost: 50, tip: 'Buy mince on sale days' },
    ],
  },
  Eggetarian: {
    breakfast: [
      { name: 'Omelette with toast', cost: 18, tip: 'Add onion and tomato' },
      { name: 'Boiled eggs with paratha', cost: 22, tip: 'High protein start' },
    ],
    lunch: [
      { name: 'Egg curry with rice', cost: 30, tip: 'Affordable and filling' },
      { name: 'Dal rice with boiled egg', cost: 28, tip: 'Complete nutrition' },
    ],
    snack: [
      { name: 'Egg sandwich', cost: 15, tip: 'Quick and filling' },
      { name: 'Fruit with peanuts', cost: 12, tip: 'Energy boost' },
    ],
    dinner: [
      { name: 'Egg bhurji with roti', cost: 25, tip: 'Quick to make' },
      { name: 'Veg pulao with egg fry', cost: 30, tip: 'Balanced meal' },
    ],
  },
  Vegan: {
    breakfast: [
      { name: 'Poha with vegetables', cost: 15, tip: 'No dairy needed' },
      { name: 'Upma with chutney', cost: 12, tip: 'Pure vegan breakfast' },
    ],
    lunch: [
      { name: 'Dal rice with sabzi', cost: 28, tip: 'Complete plant protein' },
      { name: 'Rajma chawal', cost: 32, tip: 'Great legume protein' },
    ],
    snack: [
      { name: 'Roasted peanuts & chana', cost: 10, tip: 'Protein-rich snack' },
      { name: 'Seasonal fruit', cost: 12, tip: 'Go for local, seasonal' },
    ],
    dinner: [
      { name: 'Chole with roti', cost: 30, tip: 'Iron-rich dinner' },
      { name: 'Mixed dal with rice', cost: 25, tip: 'Combine 2 dals for nutrition' },
    ],
  },
};

const generateLocalFallback = (foodPref, budget, mealsPerDay, livingType, cookingAccess) => {
  const db = FALLBACK_MEALS[foodPref] || FALLBACK_MEALS['Vegetarian'];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const bf = pick(db.breakfast);
  const lu = pick(db.lunch);
  const sn = pick(db.snack);
  const dn = pick(db.dinner);
  const dailyCost = bf.cost + lu.cost + sn.cost + dn.cost;

  const mealPlanData = {
    breakfast: `${bf.name} — ~₹${bf.cost}. Tip: ${bf.tip}`,
    lunch: `${lu.name} — ~₹${lu.cost}. Tip: ${lu.tip}`,
    snack: `${sn.name} — ~₹${sn.cost}. Tip: ${sn.tip}`,
    dinner: `${dn.name} — ~₹${dn.cost}. Tip: ${dn.tip}`,
  };

  if (mealsPerDay === 5) {
    const extra = pick(db.snack);
    mealPlanData.extraMeal = `${extra.name} — ~₹${extra.cost}. Tip: ${extra.tip}`;
  }

  const result = {
    mealPlan: mealPlanData,
    approximateDailyCost: `₹${dailyCost}–₹${dailyCost + 20}`,
    budgetSummary: {
      budgetLevel: budget ? 'Custom' : 'Low budget',
      budgetAmount: budget || dailyCost,
      budgetPeriod: 'Per day',
    },
    budgetNote: `This is an offline meal plan generated from VitalIQ's local database. Costs are approximate for Indian cities. Your daily food cost is estimated at ₹${dailyCost}.`,
    affordableSwaps: [
      'Use seasonal vegetables — they are cheaper and fresher.',
      'Buy pulses in bulk from wholesale markets.',
      'Replace packaged snacks with roasted chana or peanuts.',
      'Cook in batches to save time and gas.',
    ],
    groceryList: cookingAccess !== 'No kitchen' && cookingAccess !== 'Mess/tiffin dependent' ? [
      'Rice (1 kg) — ~₹45',
      'Toor/Masoor dal (500g) — ~₹55',
      'Onion, tomato, potato (1 kg each) — ~₹80',
      'Seasonal green vegetable — ~₹30',
      'Cooking oil (500ml) — ~₹65',
      'Bread (1 packet) — ~₹35',
      'Curd (500g) — ~₹30',
    ] : [],
    hostelTips: livingType === 'Hostel' || livingType === 'PG' ? [
      'Negotiate a weekly tiffin plan with your mess for savings.',
      'Keep instant oats, peanut butter, and bananas for backup meals.',
      'Carry a small electric kettle for quick breakfast options.',
      'Split grocery costs with roommates for bulk buying.',
    ] : [],
    safetyNote: 'VitalIQ Health provides general wellness meal ideas only. This is not a medical diet plan. For specific dietary needs or medical conditions, please consult a qualified nutritionist or healthcare professional.',
    isOfflinePlan: true,
  };

  return result;
};


// ─── Step-based Wizard Component ────────────────────────────────────────────────
const MealPlanner = () => {
  const { user } = useAuth();

  // ─ State ─
  const [wizardStep, setWizardStep] = useState(0); // 0=welcome, 1=budget, 2=food, 3=living, 4=goals
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Helper to load onboarding preferences
  const getMappedPreferences = useCallback(() => {
    const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
    const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
    const prefs = isGuest ? guestOnboarding : (user?.preferences || {});

    let userTypeMapped = 'General user';
    if (prefs.userType === 'Student') userTypeMapped = 'Student';
    else if (prefs.userType === 'Working Professional' || prefs.userType === 'Working professional') userTypeMapped = 'Working professional';

    const foodPrefMapped = ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'].includes(prefs.foodPreference)
      ? prefs.foodPreference
      : '';

    let livingTypeMapped = '';
    if (prefs.livingType === 'Hostel') livingTypeMapped = 'Hostel';
    else if (prefs.livingType === 'Shared apartment' || prefs.livingType === 'Living alone') livingTypeMapped = 'Flat';
    else if (prefs.livingType === 'Home with family') livingTypeMapped = 'Home';

    let cookingAccessMapped = '';
    if (prefs.cookingAccess === 'Full kitchen') cookingAccessMapped = 'Full kitchen';
    else if (prefs.cookingAccess?.includes('Basic cooking')) cookingAccessMapped = 'Basic cooking';
    else if (prefs.cookingAccess?.includes('No cooking') || prefs.cookingAccess?.includes('Mess')) cookingAccessMapped = 'Mess/tiffin dependent';

    let wellnessGoalMapped = '';
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
    const cityOrRegionMapped = prefs.cityOrRegion || '';

    return {
      userType: userTypeMapped,
      foodPreference: foodPrefMapped,
      livingType: livingTypeMapped,
      cookingAccess: cookingAccessMapped,
      wellnessGoal: wellnessGoalMapped,
      budgetPeriod: budgetPeriodMapped,
      mealsPerDay: mealsPerDayMapped,
      budgetAmount: budgetAmountMapped,
      cityOrRegion: cityOrRegionMapped,
    };
  }, [user]);

  const initialPrefs = getMappedPreferences();
  const hasOnboarding = !!(initialPrefs.budgetAmount || initialPrefs.foodPreference || initialPrefs.livingType);

  // Form States
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

  // Loading messages rotation
  useEffect(() => {
    if (!loading) return;
    const messages = [
      'Building your budget meal plan...',
      'Checking your budget, food preference, and cooking access.',
      'Finding affordable local ingredients...',
      'Almost there, optimizing for your budget...',
    ];
    let idx = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingMessage(messages[idx]);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // ─── Generate Plan ─────────────────────────────────────────────────────────────
  const generatePlan = async () => {
    setLoading(true);
    try {
      const budgetLevel = budgetAmount ? 'Custom' : 'Low budget';
      const payload = {
        budgetLevel,
        budgetAmount: budgetAmount || undefined,
        budgetPeriod,
        foodPreference: foodPreference || 'Vegetarian',
        userType,
        livingType: livingType || 'Home',
        cookingAccess: cookingAccess || 'Basic cooking',
        wellnessGoal: wellnessGoal || 'Balanced diet',
        mealsPerDay,
        cityOrRegion,
        allergies,
      };

      const res = await recommendationAPI.getMealPlan(payload);
      if (res.data.success) {
        setMealPlan(res.data.data);
      } else {
        // API returned failure — use local fallback
        toast.error("We couldn’t generate an AI meal plan right now, so we created a simple fallback plan.");
        const fallback = generateLocalFallback(
          foodPreference || 'Vegetarian',
          budgetAmount,
          mealsPerDay,
          livingType,
          cookingAccess
        );
        setMealPlan(fallback);
      }
    } catch (err) {
      console.error('Meal plan API failed:', err);
      toast.error("We couldn’t generate an AI meal plan right now, so we created a simple fallback plan.");
      const fallback = generateLocalFallback(
        foodPreference || 'Vegetarian',
        budgetAmount,
        mealsPerDay,
        livingType,
        cookingAccess
      );
      setMealPlan(fallback);
    } finally {
      setLoading(false);
    }
  };

  // Budget chip presets
  const budgetChips = [
    { label: '₹80/day', value: '80', period: 'Per day', desc: 'Tight budget' },
    { label: '₹150/day', value: '150', period: 'Per day', desc: 'Average' },
    { label: '₹250/day', value: '250', period: 'Per day', desc: 'Comfortable' },
    { label: '₹500/day', value: '500', period: 'Per day', desc: 'Flexible' },
  ];

  const foodOptions = [
    { value: 'Vegetarian', icon: '🥦', label: 'Vegetarian' },
    { value: 'Non-vegetarian', icon: '🍗', label: 'Non-Veg' },
    { value: 'Eggetarian', icon: '🥚', label: 'Eggetarian' },
    { value: 'Vegan', icon: '🌱', label: 'Vegan' },
  ];

  const livingOptions = [
    { value: 'Home', icon: '🏡', label: 'Home' },
    { value: 'Hostel', icon: '🏢', label: 'Hostel' },
    { value: 'PG', icon: '🏠', label: 'PG' },
    { value: 'Flat', icon: '🏬', label: 'Flat/Alone' },
  ];

  const cookingOptions = [
    { value: 'Full kitchen', icon: '👩‍🍳', label: 'Full kitchen' },
    { value: 'Basic cooking', icon: '🍳', label: 'Basic cooking' },
    { value: 'No kitchen', icon: '🚫', label: 'No kitchen' },
    { value: 'Mess/tiffin dependent', icon: '🍱', label: 'Mess / Tiffin' },
  ];

  const goalOptions = [
    { value: 'Balanced diet', label: 'Balanced diet' },
    { value: 'Energy & focus', label: 'Energy & focus' },
    { value: 'High protein', label: 'High protein' },
    { value: 'Weight management', label: 'Weight management' },
    { value: 'Budget wellness', label: 'Budget wellness' },
    { value: 'General wellness', label: 'General wellness' },
  ];

  // ─── Styles ───────────────────────────────────────────────────────────────────
  const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    padding: '32px',
    transition: 'all 0.3s ease',
  };

  const chipStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '16px 12px',
    borderRadius: '16px',
    border: `2px solid ${isActive ? 'var(--primary)' : '#e2e8f0'}`,
    background: isActive ? 'var(--primary-50, #eff6ff)' : '#fafbfc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: isActive ? 'var(--primary)' : 'var(--text-primary, #334155)',
    textAlign: 'center',
    minWidth: '90px',
    position: 'relative',
    overflow: 'hidden',
  });

  const bigChipStyle = (isActive) => ({
    ...chipStyle(isActive),
    padding: '20px 16px',
    fontSize: '0.9rem',
    minWidth: '110px',
    gap: '8px',
  });

  const stepLabelStyle = {
    display: 'block',
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: '16px',
    color: 'var(--text-primary, #0f172a)',
  };

  const stickyFooterStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
  };

  const prefillBadge = (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#ecfdf5',
      color: '#059669',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.72rem',
      fontWeight: 600,
      marginLeft: '8px',
    }}>
      <FiCheckCircle size={11} /> Prefilled
    </span>
  );

  // ─── Step progress bar ─────────────────────────────────────────────────────────
  const totalSteps = 4;
  const progressPercent = wizardStep === 0 ? 0 : (wizardStep / totalSteps) * 100;

  const renderProgress = () => (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
          Step {wizardStep} of {totalSteps}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary, #6366f1)' }}>
          {Math.round(progressPercent)}%
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          borderRadius: '8px',
          background: 'linear-gradient(90deg, var(--primary, #6366f1), var(--accent-teal, #14b8a6))',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );

  // ─── Loading Overlay ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-enter" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-50, #eff6ff), var(--accent-teal, #14b8a6)20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease infinite',
        }}>
          <span style={{ fontSize: '2.2rem' }}>🥗</span>
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary, #0f172a)' }}>
            Preparing Your Meal Plan
          </h2>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.95rem', maxWidth: '340px', lineHeight: 1.6 }}>
            {loadingMessage}
          </p>
        </div>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  // ─── RESULTS VIEW ─────────────────────────────────────────────────────────────
  if (mealPlan) {
    const summary = mealPlan.budgetSummary || {};
    const showGroceryList = cookingAccess === 'Basic cooking' || cookingAccess === 'Full kitchen';
    const showHostelTips = livingType === 'Hostel' || livingType === 'PG';

    const mealIcons = {
      Breakfast: <FiCoffee />,
      Lunch: <FiSun />,
      'Evening Snack': <FiZap />,
      Dinner: <FiMoon />,
      'Extra Meal': <FiCoffee />,
    };

    const mealColors = {
      Breakfast: '#f59e0b',
      Lunch: '#ef4444',
      'Evening Snack': '#8b5cf6',
      Dinner: '#3b82f6',
      'Extra Meal': '#10b981',
    };

    const mealsList = [
      { type: 'Breakfast', text: mealPlan.mealPlan?.breakfast },
      { type: 'Lunch', text: mealPlan.mealPlan?.lunch },
      { type: 'Evening Snack', text: mealPlan.mealPlan?.snack },
      { type: 'Dinner', text: mealPlan.mealPlan?.dinner },
    ];
    if (mealsPerDay === 5 && mealPlan.mealPlan?.extraMeal) {
      mealsList.push({ type: 'Extra Meal', text: mealPlan.mealPlan?.extraMeal });
    }

    return (
      <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>
                Your <span className="gradient-text">Budget Meal Plan</span> 🥗
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'var(--primary-50, #eff6ff)',
                  color: 'var(--primary, #6366f1)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  {foodPreference || 'Vegetarian'}
                </span>
                {summary.budgetAmount && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}>
                    ₹{summary.budgetAmount} / {summary.budgetPeriod?.toLowerCase() || 'day'}
                  </span>
                )}
                <span style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  ~{mealPlan.approximateDailyCost || mealPlan.approxDailyCost || 'N/A'} / day
                </span>
                {mealPlan.isOfflinePlan && (
                  <span style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}>
                    Offline Plan
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="meal-result-actions">
              <button
                onClick={() => { setMealPlan(null); setWizardStep(1); }}
                className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px' }}
              >
                <FiEdit2 size={14} /> Edit & Regenerate
              </button>
              <button
                onClick={generatePlan}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px' }}
              >
                <FiRefreshCw size={14} /> New Plan
              </button>
            </div>
          </div>
        </div>

        {/* Meal Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {mealsList.map((meal, idx) => (
            <div key={idx} className="meal-result-card" style={{
              ...cardStyle,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              borderLeft: `4px solid ${mealColors[meal.type] || '#6366f1'}`,
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `${mealColors[meal.type]}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mealColors[meal.type],
                fontSize: '1.1rem',
                flexShrink: 0,
              }}>
                {mealIcons[meal.type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: mealColors[meal.type],
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}>
                  {meal.type}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.6 }}>
                  {meal.text || 'Meal suggestion not available.'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Budget Note */}
          {mealPlan.budgetNote && (
            <div style={{
              ...cardStyle,
              padding: '20px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: 'white',
              border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FiDollarSign size={16} color="#14b8a6" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Budget Note</h4>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                {mealPlan.budgetNote}
              </p>
            </div>
          )}

          {/* Affordable Swaps */}
          {mealPlan.affordableSwaps && mealPlan.affordableSwaps.length > 0 && (
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FiRefreshCw size={15} color="var(--primary, #6366f1)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Affordable Swaps</h4>
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mealPlan.affordableSwaps.map((swap, idx) => (
                  <li key={idx} style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary, #6366f1)', marginTop: '2px', flexShrink: 0 }}>•</span>
                    <span>{swap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Grocery List */}
          {showGroceryList && mealPlan.groceryList && mealPlan.groceryList.length > 0 && (
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FiShoppingCart size={15} color="#f59e0b" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Grocery List</h4>
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mealPlan.groceryList.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hostel/PG Tips */}
          {showHostelTips && mealPlan.hostelTips && mealPlan.hostelTips.length > 0 && (
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FiHome size={15} color="#8b5cf6" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Hostel & PG Tips</h4>
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mealPlan.hostelTips.map((tip, idx) => (
                  <li key={idx} style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#8b5cf6', marginTop: '2px', flexShrink: 0 }}>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Safety Disclaimer */}
        <div className="disclaimer-box" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.83rem', lineHeight: 1.6 }}>
              <strong>Safety Note: </strong>
              {mealPlan.safetyNote || 'VitalIQ Health provides general wellness meal ideas only. This is not a medical diet plan. For specific dietary needs, please consult a qualified nutritionist or healthcare professional.'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── WELCOME SCREEN (Step 0) ──────────────────────────────────────────────────
  if (wizardStep === 0) {
    return (
      <div className="page-enter" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-50, #eff6ff), #ecfdf5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '2rem',
          }}>
            🥗
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-primary, #0f172a)' }}>
            Create Your <span className="gradient-text">Budget Meal Plan</span>
          </h1>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto' }}>
            Get practical meal ideas based on your budget, food preference, and routine. No medical reports needed.
          </p>
        </div>

        <div style={{ ...cardStyle, padding: '28px', marginBottom: '24px' }} className="meal-welcome-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '💰', text: 'Works even on a low budget (₹80/day)' },
              { icon: '🏠', text: 'Hostel, PG, and home-friendly options' },
              { icon: '📊', text: 'Approximate costs included with every meal' },
              { icon: '🔒', text: 'General wellness ideas only — not a medical diet' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {hasOnboarding && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            background: '#ecfdf5',
            borderRadius: '14px',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: '#047857',
            fontWeight: 500,
          }}>
            <FiCheckCircle size={16} />
            <span>
              We've prefilled some details from your onboarding. You can edit them anytime.
            </span>
          </div>
        )}

        <button
          onClick={() => setWizardStep(1)}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '14px',
          }}
        >
          Start Meal Plan <FiArrowRight />
        </button>
      </div>
    );
  }

  // ─── WIZARD STEPS ─────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '4px' }}>
          <span className="gradient-text">Budget Meal Planner</span> 🥗
        </h1>
      </div>

      {renderProgress()}

      <div style={cardStyle} className="meal-wizard-card">
        {/* ─── Step 1: Budget ───────────────────────────────────────────────── */}
        {wizardStep === 1 && (
          <div className="animate-fade-in">
            <label style={stepLabelStyle}>
              What is your food budget?
              {initialPrefs.budgetAmount && prefillBadge}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }} className="meal-budget-grid">
              {budgetChips.map(chip => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => { setBudgetAmount(chip.value); setBudgetPeriod(chip.period); }}
                  style={bigChipStyle(budgetAmount === chip.value && budgetPeriod === chip.period)}
                  className="meal-chip"
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{chip.label}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.7, fontWeight: 500 }}>{chip.desc}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Custom amount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 120"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  style={{ width: '100%' }}
                />
                {budgetAmount !== '' && Number(budgetAmount) <= 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-coral)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                    Please enter a valid budget amount.
                  </span>
                )}
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Period</label>
                <select className="select-field" value={budgetPeriod} onChange={(e) => setBudgetPeriod(e.target.value)} style={{ width: '100%' }}>
                  <option value="Per day">Per day</option>
                  <option value="Per week">Per week</option>
                  <option value="Per month">Per month</option>
                </select>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.5 }}>
              <FiInfo size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Budget is optional. If skipped, we'll suggest low-budget meals.
            </p>

            <div style={stickyFooterStyle}>
              <button onClick={() => setWizardStep(0)} className="btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiArrowLeft size={14} /> Back
              </button>
              <button 
                onClick={() => setWizardStep(2)} 
                className="btn-primary" 
                disabled={budgetAmount !== '' && Number(budgetAmount) <= 0}
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px', opacity: (budgetAmount !== '' && Number(budgetAmount) <= 0) ? 0.5 : 1, cursor: (budgetAmount !== '' && Number(budgetAmount) <= 0) ? 'not-allowed' : 'pointer' }}
              >
                Next <FiArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Food Preference ───────────────────────────────────── */}
        {wizardStep === 2 && (
          <div className="animate-fade-in">
            <label style={stepLabelStyle}>
              What do you eat?
              {initialPrefs.foodPreference && prefillBadge}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }} className="meal-food-grid">
              {foodOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFoodPreference(opt.value)}
                  style={bigChipStyle(foodPreference === opt.value)}
                  className="meal-chip"
                >
                  <span style={{ fontSize: '1.6rem' }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <label style={{ ...stepLabelStyle, marginBottom: '12px' }}>
              Any allergies?
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. peanuts, milk, gluten (optional)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              style={{ width: '100%' }}
            />

            <div style={stickyFooterStyle}>
              <button onClick={() => setWizardStep(1)} className="btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setWizardStep(3)}
                className="btn-primary"
                disabled={!foodPreference}
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px', opacity: foodPreference ? 1 : 0.5 }}
              >
                Next <FiArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Living & Cooking Setup ────────────────────────────── */}
        {wizardStep === 3 && (
          <div className="animate-fade-in">
            <label style={stepLabelStyle}>
              Where do you live?
              {initialPrefs.livingType && prefillBadge}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }} className="meal-living-grid">
              {livingOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLivingType(opt.value)}
                  style={chipStyle(livingType === opt.value)}
                  className="meal-chip"
                >
                  <span style={{ fontSize: '1.3rem' }}>{opt.icon}</span>
                  <span style={{ fontSize: '0.78rem' }}>{opt.label}</span>
                </button>
              ))}
            </div>

            <label style={{ ...stepLabelStyle, marginTop: '8px' }}>
              Do you have cooking access?
              {initialPrefs.cookingAccess && prefillBadge}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }} className="meal-cooking-grid">
              {cookingOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCookingAccess(opt.value)}
                  style={chipStyle(cookingAccess === opt.value)}
                  className="meal-chip"
                >
                  <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                  <span style={{ fontSize: '0.78rem' }}>{opt.label}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  You are a...
                </label>
                <select className="select-field" value={userType} onChange={(e) => setUserType(e.target.value)} style={{ width: '100%' }}>
                  <option value="Student">Student</option>
                  <option value="Working professional">Working professional</option>
                  <option value="General user">General user</option>
                </select>
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  City / Region (optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Bhopal"
                  value={cityOrRegion}
                  onChange={(e) => setCityOrRegion(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={stickyFooterStyle}>
              <button onClick={() => setWizardStep(2)} className="btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setWizardStep(4)}
                className="btn-primary"
                disabled={!livingType || !cookingAccess}
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px', opacity: (livingType && cookingAccess) ? 1 : 0.5 }}
              >
                Next <FiArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Goal, Meals, Review ───────────────────────────────── */}
        {wizardStep === 4 && (
          <div className="animate-fade-in">
            <label style={stepLabelStyle}>What's your food goal?</label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }} className="meal-goal-grid">
              {goalOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWellnessGoal(opt.value)}
                  style={chipStyle(wellnessGoal === opt.value)}
                  className="meal-chip"
                >
                  <span style={{ fontSize: '0.78rem' }}>{opt.label}</span>
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
              Meals per day
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }} className="meal-count-grid">
              {[3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMealsPerDay(n)}
                  style={{
                    ...chipStyle(mealsPerDay === n),
                    flex: 1,
                    padding: '12px 8px',
                  }}
                  className="meal-chip"
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{n}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>meals</span>
                </button>
              ))}
            </div>

            {/* Review Summary */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '14px',
              padding: '18px 20px',
              marginBottom: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Review Your Choices
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.83rem' }} className="meal-review-grid">
                <div><span style={{ color: '#94a3b8' }}>Budget:</span> <strong>{budgetAmount ? `₹${budgetAmount} ${budgetPeriod?.toLowerCase()}` : 'Auto (low budget)'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Food:</span> <strong>{foodPreference || 'Vegetarian'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Living:</span> <strong>{livingType || 'Home'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Cooking:</span> <strong>{cookingAccess || 'Basic'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Goal:</span> <strong>{wellnessGoal || 'Balanced'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Meals:</span> <strong>{mealsPerDay} / day</strong></div>
                {cityOrRegion && <div><span style={{ color: '#94a3b8' }}>City:</span> <strong>{cityOrRegion}</strong></div>}
                {allergies && <div><span style={{ color: '#94a3b8' }}>Allergies:</span> <strong>{allergies}</strong></div>}
              </div>
            </div>

            <div style={stickyFooterStyle}>
              <button onClick={() => setWizardStep(3)} className="btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiArrowLeft size={14} /> Back
              </button>
              <button
                onClick={generatePlan}
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              >
                Generate Meal Plan <FiZap size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;
