import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictAPI } from '../services/api';
import { FiCheck, FiChevronRight, FiChevronLeft, FiUser, FiHeart, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const steps = [
  { label: 'General Info', icon: <FiUser size={14} /> },
  { label: 'Health Details', icon: <FiHeart size={14} /> },
  { label: 'Review', icon: <FiCheck size={14} /> },
];

const HealthCheckForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    glucose: 100,
    activity: 150,
    family: 'No',
    salt: 8,
    activity_level: 'Moderate',
    stress_level: 'Medium',
    sleep: 7,
    screen: 5,
    work: 8,
    daily_activity: 60,
    checkType: 'Screening'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await predictAPI.predict(formData);
      const predictionId = res.data.data.id;
      navigate('/analyzing', { state: { predictionId, formData } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Prediction failed');
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
          Health Check Form
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Enter your health parameters for AI-powered risk prediction
        </p>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator" style={{ marginBottom: '40px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className={`step-circle ${i < currentStep ? 'completed' : i === currentStep ? 'active' : 'inactive'}`}>
                {i < currentStep ? <FiCheck size={16} /> : (i + 1)}
              </div>
              <p style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: i <= currentStep ? 'var(--primary)' : 'var(--text-muted)',
                marginTop: '6px',
                whiteSpace: 'nowrap'
              }}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-line ${i < currentStep ? 'active' : ''}`} style={{ margin: '0 8px', marginBottom: '20px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="medical-card animate-fade-in" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        {currentStep === 0 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>
              Step 1: General Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="input-label">Blood Glucose (mg/dL)</label>
                <input type="number" className="input-field" value={formData.glucose}
                  onChange={e => handleChange('glucose', parseFloat(e.target.value) || 0)}
                  min="50" max="400" placeholder="100" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Normal: 70-100 mg/dL
                </span>
              </div>

              <div>
                <label className="input-label">Physical Activity (min/week)</label>
                <input type="number" className="input-field" value={formData.activity}
                  onChange={e => handleChange('activity', parseFloat(e.target.value) || 0)}
                  min="0" max="600" placeholder="150" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Recommended: 150+ min/week
                </span>
              </div>

              <div>
                <label className="input-label">Family History of Diabetes</label>
                <select className="select-field" value={formData.family}
                  onChange={e => handleChange('family', e.target.value)}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="input-label">Salt Intake (g/day)</label>
                <input type="number" className="input-field" value={formData.salt}
                  onChange={e => handleChange('salt', parseFloat(e.target.value) || 0)}
                  min="0" max="30" step="0.5" placeholder="8" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Recommended: &lt;6g/day
                </span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>
              Step 2: Health & Lifestyle Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="input-label">Activity Level</label>
                <select className="select-field" value={formData.activity_level}
                  onChange={e => handleChange('activity_level', e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="input-label">Stress Level</label>
                <select className="select-field" value={formData.stress_level}
                  onChange={e => handleChange('stress_level', e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="input-label">Sleep Hours (per night)</label>
                <input type="number" className="input-field" value={formData.sleep}
                  onChange={e => handleChange('sleep', parseFloat(e.target.value) || 0)}
                  min="0" max="16" step="0.5" placeholder="7" />
              </div>

              <div>
                <label className="input-label">Screen Time (hrs/day)</label>
                <input type="number" className="input-field" value={formData.screen}
                  onChange={e => handleChange('screen', parseFloat(e.target.value) || 0)}
                  min="0" max="20" step="0.5" placeholder="5" />
              </div>

              <div>
                <label className="input-label">Work Hours (per day)</label>
                <input type="number" className="input-field" value={formData.work}
                  onChange={e => handleChange('work', parseFloat(e.target.value) || 0)}
                  min="0" max="20" step="0.5" placeholder="8" />
              </div>

              <div>
                <label className="input-label">Daily Activity (min)</label>
                <input type="number" className="input-field" value={formData.daily_activity}
                  onChange={e => handleChange('daily_activity', parseFloat(e.target.value) || 0)}
                  min="0" max="600" placeholder="60" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>
              Step 3: Review & Submit
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              {[
                { label: 'Glucose', value: `${formData.glucose} mg/dL` },
                { label: 'Physical Activity', value: `${formData.activity} min/week` },
                { label: 'Family Diabetes History', value: formData.family },
                { label: 'Salt Intake', value: `${formData.salt} g/day` },
                { label: 'Activity Level', value: formData.activity_level },
                { label: 'Stress Level', value: formData.stress_level },
                { label: 'Sleep', value: `${formData.sleep} hrs` },
                { label: 'Screen Time', value: `${formData.screen} hrs/day` },
                { label: 'Work Hours', value: `${formData.work} hrs/day` },
                { label: 'Daily Activity', value: `${formData.daily_activity} min` },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  background: 'var(--primary-50)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="disclaimer-box" style={{ marginTop: '20px' }}>
              ⚠️ This analysis is generated by an AI model and is NOT a medical diagnosis. Always consult with a qualified healthcare provider.
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: '700px',
        margin: '24px auto 0',
        gap: '16px'
      }}>
        <button
          className="btn-ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
          style={{
            opacity: currentStep === 0 ? 0.4 : 1,
            padding: '12px 28px'
          }}
        >
          <FiChevronLeft size={18} /> Back
        </button>

        {currentStep < 2 ? (
          <button className="btn-primary" onClick={nextStep} style={{ padding: '12px 28px' }}>
            Next <FiChevronRight size={18} />
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px' }}>
            {loading ? (
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            ) : (
              <>Analyze Now <FiSend size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default HealthCheckForm;
