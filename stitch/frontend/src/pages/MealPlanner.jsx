import React, { useState, useEffect } from 'react';
import { FiCoffee, FiSun, FiMoon, FiZap, FiCheckCircle, FiLoader, FiDownload } from 'react-icons/fi';
import { healthAPI } from '../services/api';

const MealPlanner = () => {
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Initial load: Fetch existing or generate new based on latest data
    const init = async () => {
      setLoading(true);
      try {
        // For hackthon: Simulating a direct AI call for the user's current status
        const res = await healthAPI.getRisk();
        const userRisk = res.data.data;
        
        // Mocking AI meal plan generation based on risk
        generatePlan(userRisk);
      } catch (err) {
        console.error('Failed to init meal planner:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const generatePlan = (risk) => {
    setGenerating(true);
    // In a real app, this would be an API call to Gemini
    setTimeout(() => {
      const plan = {
        title: risk.level === 'High' ? 'Intensive Health Recovery Plan' : 'Vitality Maintenance Plan',
        focus: risk.explanation.includes('Diabetes') ? 'Low Glycemic Index' : 'Heart-Healthy / DASH',
        days: [
          {
            day: 'Monday',
            meals: [
              { type: 'Breakfast', name: 'Steel-cut Oats with Berries', cal: 320, notes: 'Rich in fiber to stabilize blood sugar' },
              { type: 'Lunch', name: 'Grilled Salmon with Quinoa', cal: 550, notes: 'Omega-3 for heart health' },
              { type: 'Dinner', name: 'Tofu Stir-fry with Broccoli', cal: 420, notes: 'High protein, low sodium' }
            ]
          },
          {
            day: 'Tuesday',
            meals: [
              { type: 'Breakfast', name: 'Greek Yogurt with Walnuts', cal: 280, notes: 'Probiotics and healthy fats' },
              { type: 'Lunch', name: 'Lentil Soup & Kale Salad', cal: 480, notes: 'Plant-based iron and antioxidants' },
              { type: 'Dinner', name: 'Baked Chicken with Asparagus', cal: 450, notes: 'Lean protein, low calorie' }
            ]
          }
        ]
      };
      setMealPlan(plan);
      setGenerating(false);
    }, 1500);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
            <span className="gradient-text">AI Nutrition Planner</span> 🥗
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Personalized meal plans generated with VitalIQ Health AI assistance based on your latest screenings.
          </p>
        </div>
        <button onClick={() => generatePlan({ level: 'Medium', explanation: '' })} className="btn-primary" disabled={generating}>
          {generating ? <><FiLoader className="animate-spin" /> Regenerating...</> : <><FiZap /> Refresh Plan</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Main Plan Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mealPlan?.days.map((day, idx) => (
            <div key={idx} className="medical-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                {day.day}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {day.meals.map((meal, midx) => (
                  <div key={midx} style={{ 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '12px' }}>
                      {meal.type === 'Breakfast' ? <FiCoffee /> : meal.type === 'Lunch' ? <FiSun /> : <FiMoon />}
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{meal.type}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px', color: '#0f172a' }}>{meal.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{meal.notes}</div>
                    <div style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{meal.cal} kcal</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="medical-card" style={{ padding: '20px', background: '#0f172a', color: 'white' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Plan Strategy</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <FiCheckCircle color="var(--accent-teal)" />
              <span style={{ fontSize: '0.85rem' }}>{mealPlan?.focus}</span>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.6 }}>
              This plan is optimized to manage your current risks while providing maximum energy.
            </p>
          </div>

          <div className="medical-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Nutrition Tips</h4>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px' }}>
                • Drink 2L of water daily
              </li>
              <li style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px' }}>
                • Avoid processed sugars
              </li>
              <li style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px' }}>
                • High fiber in every meal
              </li>
            </ul>
          </div>

          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <FiDownload /> Download Plan PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;
