import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthAPI } from '../services/api';
import { FiMoon, FiActivity, FiCoffee, FiDroplet, FiAlertTriangle, FiCheck, FiSend } from 'react-icons/fi';

const HealthInput = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    sleepHours: 7,
    exerciseMinutes: 30,
    steps: 5000,
    dietType: 'balanced',
    waterIntake: 3,
    stressLevel: 5,
    smoking: false,
    alcohol: false,
    calorieIntake: 2000
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await healthAPI.addData(formData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save health data');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh'
      }}>
        <div className="medical-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#d1fae5', border: '2px solid var(--accent-emerald)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', animation: 'pulse-glow 2s infinite'
          }}>
            <FiCheck size={28} color="var(--accent-emerald)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Data Logged! ✅</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
          <span className="gradient-text">Log Daily Health Data</span> 📋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Record your daily lifestyle data. This powers your risk predictions and recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {/* Sleep */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#ede9fe', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <FiMoon color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Sleep</h3>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Sleep Duration</label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                  {formData.sleepHours} hrs
                </span>
              </div>
              <input type="range" min="0" max="12" step="0.5"
                value={formData.sleepHours}
                onChange={(e) => handleChange('sleepHours', parseFloat(e.target.value))}
                style={{
                  width: '100%', height: '6px', appearance: 'none',
                  background: `linear-gradient(to right, var(--accent-purple) ${(formData.sleepHours / 12) * 100}%, #e2e8f0 ${(formData.sleepHours / 12) * 100}%)`,
                  borderRadius: '3px', outline: 'none', cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Activity */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary-50)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <FiActivity color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Activity</h3>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Exercise</label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                  {formData.exerciseMinutes} min
                </span>
              </div>
              <input type="range" min="0" max="120" step="5"
                value={formData.exerciseMinutes}
                onChange={(e) => handleChange('exerciseMinutes', parseInt(e.target.value))}
                style={{
                  width: '100%', height: '6px', appearance: 'none',
                  background: `linear-gradient(to right, var(--primary) ${(formData.exerciseMinutes / 120) * 100}%, #e2e8f0 ${(formData.exerciseMinutes / 120) * 100}%)`,
                  borderRadius: '3px', outline: 'none', cursor: 'pointer'
                }}
              />
            </div>
            <div>
              <label className="input-label">Steps</label>
              <input type="number" value={formData.steps}
                onChange={(e) => handleChange('steps', parseInt(e.target.value) || 0)}
                className="input-field" placeholder="10000" min="0" max="100000" />
            </div>
          </div>

          {/* Diet */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#fef3c7', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <FiCoffee color="var(--accent-amber)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Diet & Hydration</h3>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Diet Type</label>
              <select value={formData.dietType}
                onChange={(e) => handleChange('dietType', e.target.value)}
                className="select-field">
                <option value="vegetarian">🥗 Vegetarian</option>
                <option value="non-vegetarian">🥩 Non-Vegetarian</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="balanced">⚖️ Balanced</option>
                <option value="junk">🍔 Junk Food</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Water Intake</label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                  {formData.waterIntake} L
                </span>
              </div>
              <input type="range" min="0" max="10" step="0.5"
                value={formData.waterIntake}
                onChange={(e) => handleChange('waterIntake', parseFloat(e.target.value))}
                style={{
                  width: '100%', height: '6px', appearance: 'none',
                  background: `linear-gradient(to right, var(--accent-blue) ${(formData.waterIntake / 10) * 100}%, #e2e8f0 ${(formData.waterIntake / 10) * 100}%)`,
                  borderRadius: '3px', outline: 'none', cursor: 'pointer'
                }}
              />
            </div>
            <div>
              <label className="input-label">Calorie Intake (kcal)</label>
              <input type="number" value={formData.calorieIntake}
                onChange={(e) => handleChange('calorieIntake', parseInt(e.target.value) || 0)}
                className="input-field" placeholder="2000" min="0" max="10000" />
            </div>
          </div>

          {/* Lifestyle */}
          <div className="medical-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#fee2e2', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <FiAlertTriangle color="var(--accent-coral)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Lifestyle & Stress</h3>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Stress Level</label>
                <span style={{
                  fontSize: '0.9rem', fontWeight: 600,
                  color: formData.stressLevel >= 7 ? 'var(--accent-coral)' : formData.stressLevel >= 4 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                }}>
                  {formData.stressLevel}/10
                </span>
              </div>
              <input type="range" min="1" max="10" step="1"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                style={{
                  width: '100%', height: '6px', appearance: 'none',
                  background: 'linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)',
                  borderRadius: '3px', outline: 'none', cursor: 'pointer'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'smoking', label: 'Smoking Today?', icon: '🚬' },
                { name: 'alcohol', label: 'Alcohol Today?', icon: '🍷' }
              ].map(({ name, label, icon }) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: formData[name] ? '#fee2e2' : 'var(--bg-input)',
                  border: `1px solid ${formData[name] ? '#fca5a5' : 'var(--border-light)'}`,
                  transition: 'all var(--transition-base)', cursor: 'pointer'
                }}
                  onClick={() => handleChange(name, !formData[name])}
                >
                  <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon} {label}
                  </span>
                  <div style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: formData[name] ? 'var(--accent-coral)' : '#cbd5e1',
                    position: 'relative', transition: 'background var(--transition-base)'
                  }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px',
                      left: formData[name] ? '23px' : '3px',
                      transition: 'left var(--transition-base)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ padding: '14px 40px', fontSize: '1rem' }}>
            {loading ? (
              <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : (
              <>Submit Health Data <FiSend /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthInput;
