import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FiCheck, FiChevronRight, FiChevronLeft, FiUser, FiActivity,
  FiMoon, FiHeart, FiEye, FiSend, FiAlertTriangle, FiPlus, FiMinus, FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Steps list (Welcome is rendered dynamically before steps 1 to 5)
const STEPS = [
  { label: 'Basic Details',     icon: <FiUser     size={14} /> },
  { label: 'Daily Routine',     icon: <FiActivity size={14} /> },
  { label: 'Sleep & Stress',    icon: <FiMoon     size={14} /> },
  { label: 'Optional Metrics',  icon: <FiHeart    size={14} /> },
  { label: 'Symptoms & Review', icon: <FiEye      size={14} /> },
];

const ACTIVITY_OPTIONS = [
  { label: 'Mostly sitting',    sub: 'Desk job, very little movement',          activity_level: 'Sedentary', daily_activity: 10  },
  { label: 'Light movement',    sub: 'Short walks, occasional light tasks',     activity_level: 'Light',     daily_activity: 30  },
  { label: 'Moderate activity', sub: 'Regular walks, gym 2–3×/week',           activity_level: 'Moderate',  daily_activity: 60  },
  { label: 'Very active',       sub: 'Daily exercise or physically active job', activity_level: 'Active',    daily_activity: 90  },
];

const SCREEN_OPTIONS = [
  { label: 'Under 3 hours',    sub: 'Minimal screen use',         screen: 2  },
  { label: '3–6 hours',        sub: 'Average screen use',         screen: 5  },
  { label: '6–9 hours',        sub: 'Above-average screen use',   screen: 8  },
  { label: 'More than 9 hrs',  sub: 'Heavy screen use',           screen: 10 },
];

const WORK_OPTIONS = [
  { label: 'Under 4 hours',    sub: 'Part-time or student',       work: 3 },
  { label: '4–6 hours',        sub: 'Standard part-time',         work: 5 },
  { label: '6–8 hours',        sub: 'Standard full-time',         work: 7 },
  { label: 'More than 8 hrs',  sub: 'Long hours or shift work',   work: 9 },
];

const SLEEP_OPTIONS = [
  { label: 'Under 5 hours',    sub: 'Very short sleep',           sleep: 4   },
  { label: '5–6 hours',        sub: 'Below recommended',          sleep: 5.5 },
  { label: '7–8 hours',        sub: 'Recommended range ✅',       sleep: 7.5 },
  { label: 'More than 8 hrs',  sub: 'Extended sleep',             sleep: 9   },
];

const STRESS_OPTIONS = [
  { label: 'Low',       sub: 'Calm and relaxed most of the time', stress_level: 'Low',    stress_num: 2 },
  { label: 'Medium',    sub: 'Some stress, mostly manageable',    stress_level: 'Medium', stress_num: 5 },
  { label: 'High',      sub: 'Often stressed or anxious',         stress_level: 'High',   stress_num: 7 },
  { label: 'Very high', sub: 'Overwhelmed, hard to relax',        stress_level: 'High',   stress_num: 9 },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const BP_OPTIONS = [
  { label: 'Normal',      sub: 'Typically fine, no symptoms',           value: 'Normal'   },
  { label: 'Elevated',    sub: 'Slightly high, occasional symptoms',    value: 'Elevated' },
  { label: 'High',        sub: 'Often high or on BP medication',        value: 'High'     },
  { label: 'I know exact values', sub: 'Enter systolic/diastolic below', value: 'Exact'  },
  { label: "I don't know",sub: "Skip — I'm not sure",                   value: null       },
];

const GLUCOSE_OPTIONS = [
  { label: 'Normal',              sub: 'Fasting blood sugar usually fine', value: 'Normal',     num: null },
  { label: 'Pre-diabetic range',  sub: 'Slightly above normal',            value: 'PreDiabetic',num: null },
  { label: 'Diabetic range',      sub: 'High or on diabetes management',   value: 'Diabetic',   num: null },
  { label: 'I know exact value',  sub: 'Enter the number in mg/dL',        value: 'Exact',      num: null },
  { label: "I don't know",        sub: "Skip — I'm not sure",              value: null,         num: null },
];

const GLUCOSE_CATEGORY_MAP = {
  Normal: 90,
  PreDiabetic: 112,
  Diabetic: 145,
};

const FAMILY_HISTORY_OPTIONS = [
  { label: 'No known history',                                             value: 'No'  },
  { label: 'Yes — close family member has / had diabetes or heart disease', value: 'Yes' },
  { label: 'Not sure',                                                     value: 'No'  },
];

const SYMPTOM_OPTIONS = [
  { id: 'fatigue',     label: 'Frequent tiredness',                       serious: false },
  { id: 'headache',    label: 'Headache',                                 serious: false },
  { id: 'poor_sleep',  label: 'Poor sleep',                               serious: false },
  { id: 'high_stress', label: 'High stress',                              serious: false },
  { id: 'thirst',      label: 'Increased thirst',                         serious: false },
  { id: 'chest',       label: 'Chest discomfort',                         serious: true  },
  { id: 'dizziness',   label: 'Dizziness',                                 serious: true  },
  { id: 'none',        label: 'None of these',                            serious: false },
];

const calcBmi = (weight, height) => {
  if (!weight || !height || height <= 0) return null;
  return +(parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1);
};

const bmiCategory = (bmi) => {
  if (!bmi) return '';
  if (bmi < 18.5) return '(Underweight)';
  if (bmi < 25)   return '(Healthy weight)';
  if (bmi < 30)   return '(Overweight)';
  return '(Obese)';
};

const OptionCard = ({ option, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(option)}
    style={{
      width: '100%', textAlign: 'left', padding: '16px',
      borderRadius: 'var(--radius-md)',
      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-light)'}`,
      background: selected ? 'var(--primary-50)' : 'white',
      cursor: 'pointer', transition: 'all var(--transition-base)',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: selected ? '0 4px 12px rgba(13, 148, 136, 0.05)' : 'none'
    }}
  >
    <div style={{
      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-medium)'}`,
      background: selected ? 'var(--primary)' : 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <FiCheck size={11} color="white" />}
    </div>
    <div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selected ? 'var(--primary)' : 'var(--text-primary)' }}>
        {option.label}
      </div>
      {option.sub && (
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {option.sub}
        </div>
      )}
    </div>
  </button>
);

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '24px' }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
      {icon} {title}
    </h2>
    {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', lineHeight: 1.4 }}>{subtitle}</p>}
  </div>
);

const ReviewRow = ({ label, value }) => (
  <div style={{
    padding: '10px 14px', background: 'var(--primary-50)',
    borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</span>
  </div>
);

const HealthCheckForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Welcome screen toggle state
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Demographics
  const [age, setAge]       = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Daily Routine
  const [activityOption, setActivityOption] = useState(null);
  const [screenOption,   setScreenOption]   = useState(null);
  const [workOption,     setWorkOption]     = useState(null);

  // Sleep & Stress
  const [sleepOption,  setSleepOption]  = useState(null);
  const [stressOption, setStressOption] = useState(null);

  // Optional Health Metrics
  const [showAdvanced,    setShowAdvanced]    = useState(false);
  const [bpOption,        setBpOption]        = useState(null);
  const [systolic,        setSystolic]        = useState('');
  const [diastolic,       setDiastolic]       = useState('');
  const [glucoseOption,   setGlucoseOption]   = useState(null);
  const [glucoseValue,    setGlucoseValue]    = useState('');
  const [familyOption,    setFamilyOption]    = useState(null);
  const [smoking,         setSmoking]         = useState(null);
  const [alcohol,         setAlcohol]         = useState(null);
  const [existingConditions, setExistingConditions] = useState('');

  // Symptoms
  const [symptoms, setSymptoms] = useState([]);

  // Fetch Onboarding Smart Defaults
  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  const prefs = isGuest ? guestOnboarding : (user?.preferences || {});

  useEffect(() => {
    if (prefs.activityLevel) {
      const act = prefs.activityLevel.toLowerCase();
      let matchedOpt = null;
      if (act.includes('sedentary')) matchedOpt = ACTIVITY_OPTIONS[0];
      else if (act.includes('light')) matchedOpt = ACTIVITY_OPTIONS[1];
      else if (act.includes('moderate')) matchedOpt = ACTIVITY_OPTIONS[2];
      else if (act.includes('active')) matchedOpt = ACTIVITY_OPTIONS[3];
      if (matchedOpt) setActivityOption(matchedOpt);
    }
  }, [prefs.activityLevel]);

  const bmi = useMemo(() => calcBmi(weight, height), [weight, height]);
  const hasSerious = symptoms.some(s => SYMPTOM_OPTIONS.find(o => o.id === s)?.serious);

  const toggleSymptom = (id) => {
    if (id === 'none') {
      setSymptoms(prev => prev.includes('none') ? [] : ['none']);
      return;
    }
    setSymptoms(prev => {
      const filtered = prev.filter(s => s !== 'none');
      return filtered.includes(id) ? filtered.filter(s => s !== id) : [...filtered, id];
    });
  };

  // Inline Validation States
  const getValidationError = (field) => {
    if (field === 'age') {
      if (age !== '' && (parseFloat(age) <= 0 || parseFloat(age) > 120)) {
        return "Age must be between 1 and 120";
      }
    }
    if (field === 'height') {
      if (height !== '' && (parseFloat(height) < 50 || parseFloat(height) > 300)) {
        return "Height must be between 50 and 300 cm";
      }
    }
    if (field === 'weight') {
      if (weight !== '' && (parseFloat(weight) < 10 || parseFloat(weight) > 300)) {
        return "Weight must be between 10 and 300 kg";
      }
    }
    return null;
  };

  // Step Validation Check
  const canProceed = () => {
    if (currentStep === 0) {
      return age && gender && height && weight &&
             !getValidationError('age') &&
             !getValidationError('height') &&
             !getValidationError('weight');
    }
    if (currentStep === 1) return activityOption && screenOption && workOption;
    if (currentStep === 2) return sleepOption && stressOption;
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) return;
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Submit wellness screening inputs
  const handleSubmit = async () => {
    setLoading(true);
    try {
      let resolvedGlucose = null;
      if (showAdvanced && glucoseOption) {
        if (glucoseOption.value === 'Exact' && glucoseValue) {
          resolvedGlucose = parseFloat(glucoseValue);
        } else if (glucoseOption.value && glucoseOption.value !== 'Exact') {
          resolvedGlucose = GLUCOSE_CATEGORY_MAP[glucoseOption.value] || null;
        }
      }

      let resolvedBP = null;
      let resolvedSystolic = null;
      let resolvedDiastolic = null;
      if (showAdvanced && bpOption && bpOption.value) {
        if (bpOption.value === 'Exact' && systolic && diastolic) {
          resolvedSystolic = parseFloat(systolic);
          resolvedDiastolic = parseFloat(diastolic);
          resolvedBP = null; 
        } else if (bpOption.value !== 'Exact') {
          resolvedBP = bpOption.value;
        }
      }

      const payload = {
        age:    parseFloat(age),
        gender: gender.toLowerCase(),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bmi:    bmi,
        activity_level:       activityOption.activity_level,
        dailyActivityMinutes: activityOption.daily_activity,
        daily_activity:       activityOption.daily_activity,
        activity:             activityOption.daily_activity * 7, 
        screenHours:          screenOption.screen,
        screen:               screenOption.screen,
        workHours:            workOption.work,
        work:                 workOption.work,
        sleepHours:   sleepOption.sleep,
        sleep:        sleepOption.sleep,
        stressLevel:  stressOption.stress_level,
        stress_level: stressOption.stress_level,
        advancedMetricsProvided: showAdvanced,
        glucose:               resolvedGlucose,
        bloodPressure:         resolvedBP,
        systolic:              resolvedSystolic,
        diastolic:             resolvedDiastolic,
        familyHistory:         showAdvanced && familyOption ? familyOption.value : null,
        family:                showAdvanced && familyOption ? familyOption.value : 'No',
        smoking:               showAdvanced && smoking !== null ? smoking : null,
        alcohol:               showAdvanced && alcohol !== null ? alcohol : null,
        existingConditions:    showAdvanced && existingConditions.trim() ? existingConditions.trim() : null,
        salt: 8,
        symptoms: symptoms.includes('none')
          ? []
          : symptoms.map(id => SYMPTOM_OPTIONS.find(o => o.id === id)?.label).filter(Boolean),
        checkType: 'Screening',
      };

      const res = await predictAPI.predict(payload);
      const predictionData = res.data.data;
      const predictionId   = predictionData.id;

      if (predictionData.isSaved === false) {
        sessionStorage.setItem(`guest_prediction_${predictionId}`, JSON.stringify(predictionData));
        localStorage.setItem('vitaliq_latest_wellness_check', JSON.stringify(predictionData));
        try {
          const existing = localStorage.getItem('vitaliq_wellness_checks');
          const list = existing ? JSON.parse(existing) : [];
          if (Array.isArray(list)) {
            const filtered = list.filter(item => item.id !== predictionId);
            filtered.unshift(predictionData);
            localStorage.setItem('vitaliq_wellness_checks', JSON.stringify(filtered.slice(0, 50)));
          } else {
            localStorage.setItem('vitaliq_wellness_checks', JSON.stringify([predictionData]));
          }
        } catch (e) {
          console.error('Error saving guest predictions to localStorage:', e);
        }
      }

      navigate('/analyzing', { state: { predictionId, formData: payload } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'We couldn’t create your estimate right now. Please review your inputs and try again.');
      setLoading(false);
    }
  };

  // Welcome Screen (Step 0)
  if (!started) {
    return (
      <div className="page-enter" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
        <div className="medical-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--primary-50)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', fontSize: '2.5rem' }}>
            🌱
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
            Start Your Wellness Check
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px auto' }}>
            Answer a few simple lifestyle questions. You don’t need medical reports to begin.
          </p>
          
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>⏱️</span>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>Takes around 2–3 minutes</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick and straightforward lifestyle reflection.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>🩺</span>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>Advanced health metrics are optional</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Skip questions about blood pressure or glucose if you don't know them.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>🌿</span>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>Get wellness insights and next steps</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unlock daily actions and general wellness guidance tailored for you.</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setStarted(true)} 
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            Start Check <FiChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Submit Loading Overlay (Supportive and clinician-free microcopy)
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        textAlign: 'center',
        gap: '20px'
      }} className="page-enter">
        <div className="spinner" style={{ width: '60px', height: '60px', borderWidth: '5px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '12px 0 4px 0' }}>
          Creating your wellness estimate...
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '360px', lineHeight: 1.5, margin: 0 }}>
          Checking your routine, habits, and optional metrics.
        </p>
      </div>
    );
  }

  // ── Step Renderers ──────────────────────────────────────────────────────────

  // Step 1: Basic Details
  const renderStep0 = () => {
    return (
      <div className="animate-fade-in">
        <SectionTitle
          icon={<FiUser size={18} color="var(--primary)" />}
          title="Basic Details"
          subtitle="These metrics let us personalise your wellness estimate."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {/* Age */}
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Age *</label>
            <input
              id="hcf-age" type="number" className="input-field" placeholder="e.g. 28"
              value={age} min="1" max="120"
              onChange={e => setAge(e.target.value)}
            />
            {!age ? (
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Please enter your age to continue
              </span>
            ) : getValidationError('age') ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-coral)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                ⚠️ {getValidationError('age')}
              </span>
            ) : null}
          </div>
          
          {/* Gender */}
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Gender *</label>
            <select id="hcf-gender" className="select-field" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {!gender && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Please select your gender
              </span>
            )}
          </div>

          {/* Height */}
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Height (cm) *</label>
            <input
              id="hcf-height" type="number" className="input-field" placeholder="e.g. 165"
              value={height} min="50" max="300"
              onChange={e => setHeight(e.target.value)}
            />
            {!height ? (
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Please enter your height in cm
              </span>
            ) : getValidationError('height') ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-coral)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                ⚠️ {getValidationError('height')}
              </span>
            ) : null}
          </div>

          {/* Weight */}
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Weight (kg) *</label>
            <input
              id="hcf-weight" type="number" className="input-field" placeholder="e.g. 65"
              value={weight} min="10" max="300"
              onChange={e => setWeight(e.target.value)}
            />
            {!weight ? (
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Please enter your weight in kg
              </span>
            ) : getValidationError('weight') ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-coral)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                ⚠️ {getValidationError('weight')}
              </span>
            ) : null}
          </div>
        </div>

        {/* BMI Helper Display */}
        <div style={{
          marginTop: '24px', padding: '16px 20px', borderRadius: 'var(--radius-md)',
          background: bmi ? 'var(--primary-50)' : '#f8fafc',
          border: `1px solid ${bmi ? 'rgba(13,110,91,0.2)' : 'var(--border-light)'}`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>📐</span>
          <div>
            {bmi ? (
              <>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>Your BMI: {bmi} </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{bmiCategory(bmi)}</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                Height and weight are needed to calculate BMI. We calculate BMI automatically, so you don’t need to know it.
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Daily Routine
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiActivity size={18} color="var(--primary)" />}
        title="Your Daily Routine"
        subtitle="Help us understand your day. Choose options that best fit your lifestyle."
      />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
          How active are you on a typical day? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ACTIVITY_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={activityOption?.label === opt.label} onSelect={setActivityOption} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
          How much screen time do you usually have? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SCREEN_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={screenOption?.label === opt.label} onSelect={setScreenOption} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
          How many hours do you usually work or study? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {WORK_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={workOption?.label === opt.label} onSelect={setWorkOption} />
          ))}
        </div>
      </div>
    </div>
  );

  // Step 3: Sleep & Stress
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiMoon size={18} color="var(--primary)" />}
        title="Sleep & Stress"
        subtitle="Hydration, stress levels, and restorative sleep play a massive role in routine energy."
      />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
          How many hours do you usually sleep? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SLEEP_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={sleepOption?.label === opt.label} onSelect={setSleepOption} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
          How stressed do you usually feel? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STRESS_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={stressOption?.label === opt.label} onSelect={setStressOption} />
          ))}
        </div>
      </div>
    </div>
  );

  // Step 4: Optional Health Metrics
  const renderStep3 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiHeart size={18} color="var(--primary)" />}
        title="Optional Health Metrics"
        subtitle="Provide advanced metrics if you know them. If you don't know these values, you can skip them."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <button 
          type="button"
          onClick={() => {
            setShowAdvanced(false);
            setCurrentStep(4); // Advance immediately to Step 5: Symptoms & Review
            toast.success("Moving to symptoms & review! 🌿");
          }}
          style={{
            padding: '24px 20px',
            borderRadius: 'var(--radius-lg)',
            border: `2.5px solid ${!showAdvanced ? '#e2e8f0' : '#e2e8f0'}`,
            background: 'white',
            cursor: 'pointer',
            transition: 'all 0.25s',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌿</div>
          <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>Skip this step</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
            Generate lifestyle wellness estimate only.
          </span>
        </button>

        <button 
          type="button"
          onClick={() => {
            setShowAdvanced(true);
          }}
          style={{
            padding: '24px 20px',
            borderRadius: 'var(--radius-lg)',
            border: `2.5px solid ${showAdvanced ? 'var(--primary)' : '#e2e8f0'}`,
            background: showAdvanced ? 'var(--primary-50)' : 'white',
            cursor: 'pointer',
            transition: 'all 0.25s',
            textAlign: 'center',
            boxShadow: showAdvanced ? 'var(--shadow-md)' : 'var(--shadow-sm)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <strong style={{ fontSize: '1rem', color: showAdvanced ? 'var(--primary)' : '#0f172a', display: 'block', marginBottom: '6px' }}>I know some health metrics</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
            Provide BP, blood glucose, family history, etc.
          </span>
        </button>
      </div>

      {showAdvanced && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginTop: '20px' }}>

          {/* Blood Pressure */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
              Blood pressure — which best describes you?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BP_OPTIONS.map(opt => (
                <OptionCard key={opt.label} option={opt} selected={bpOption?.label === opt.label} onSelect={setBpOption} />
              ))}
            </div>
            {bpOption?.value === 'Exact' && (
              <div className="bp-inputs-grid" style={{ marginTop: '12px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Systolic (top number)</label>
                  <input
                    id="hcf-systolic" type="number" className="input-field"
                    placeholder="e.g. 120" value={systolic} min="60" max="250"
                    onChange={e => setSystolic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Diastolic (bottom number)</label>
                  <input
                    id="hcf-diastolic" type="number" className="input-field"
                    placeholder="e.g. 80" value={diastolic} min="40" max="150"
                    onChange={e => setDiastolic(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', gridColumn: '1/-1', margin: 0 }}>
                  Normal: 120/80 mmHg · High: 140+/90+
                </p>
              </div>
            )}
          </div>

          {/* Glucose */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
              Blood glucose / blood sugar level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GLUCOSE_OPTIONS.map(opt => (
                <OptionCard key={opt.label} option={opt} selected={glucoseOption?.label === opt.label} onSelect={setGlucoseOption} />
              ))}
            </div>
            {glucoseOption?.value === 'Exact' && (
              <div style={{ marginTop: '12px' }}>
                <input
                  id="hcf-glucose" type="number" className="input-field"
                  placeholder="e.g. 95 (normal fasting: 70–100 mg/dL)"
                  value={glucoseValue} min="40" max="600"
                  onChange={e => setGlucoseValue(e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Normal fasting: 70–100 mg/dL · Diabetic: 126+
                </p>
              </div>
            )}
          </div>

          {/* Family History */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
              Family history of diabetes or heart disease?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FAMILY_HISTORY_OPTIONS.map(opt => (
                <OptionCard key={opt.label} option={opt} selected={familyOption?.label === opt.label} onSelect={setFamilyOption} />
              ))}
            </div>
          </div>

          {/* Smoking & Alcohol */}
          <div className="smoking-alcohol-grid">
            {[
              { label: 'Do you smoke?',        value: smoking, setter: setSmoking },
              { label: 'Do you drink alcohol?',value: alcohol, setter: setAlcohol },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>{label}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ text: 'Yes', v: true }, { text: 'No', v: false }].map(({ text, v }) => (
                    <button key={text} type="button" onClick={() => setter(v)} style={{
                      flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${value === v ? 'var(--primary)' : 'var(--border-light)'}`,
                      background: value === v ? 'var(--primary-50)' : 'white',
                      fontWeight: 700, fontSize: '0.88rem',
                      color: value === v ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Existing Conditions */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              Any existing health conditions? <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            <input
              id="hcf-conditions"
              type="text"
              className="input-field"
              placeholder="e.g. Asthma, PCOS, Thyroid — or leave blank"
              value={existingConditions}
              onChange={e => setExistingConditions(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Skip indicator notice */}
      {!showAdvanced && (
        <div style={{
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px',
          marginTop: '20px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🌿</span>
          <span style={{ lineHeight: 1.4 }}>
            Wellness estimate will be based on your lifestyle inputs from previous steps. Safe, quick, and no medical data required.
          </span>
        </div>
      )}
    </div>
  );

  // Step 5: Symptoms & Review
  const renderStep4 = () => {
    const reviewItems = [
      { label: 'Age',            value: `${age} years` },
      { label: 'Gender',         value: gender },
      { label: 'Height',         value: `${height} cm` },
      { label: 'Weight',         value: `${weight} kg` },
      { label: 'BMI (auto)',     value: bmi ? `${bmi} ${bmiCategory(bmi)}` : '—' },
      { label: 'Activity level', value: activityOption?.label || '—' },
      { label: 'Screen time',    value: screenOption?.label  || '—' },
      { label: 'Work/study hrs', value: workOption?.label    || '—' },
      { label: 'Sleep hours',    value: sleepOption?.label   || '—' },
      { label: 'Stress level',   value: stressOption?.label  || '—' },
      ...(showAdvanced ? [
        { label: 'Blood pressure',  value: bpOption?.value === 'Exact' ? `${systolic || '—'}/${diastolic || '—'} mmHg` : (bpOption?.label || 'Not provided') },
        { label: 'Blood glucose',   value: glucoseOption?.value === 'Exact' ? `${glucoseValue || '—'} mg/dL` : (glucoseOption?.label || 'Not provided') },
        { label: 'Family history',  value: familyOption?.label  || 'Not provided' },
        { label: 'Smoking',         value: smoking === true ? 'Yes' : smoking === false ? 'No' : 'Not provided' },
        { label: 'Alcohol',         value: alcohol  === true ? 'Yes' : alcohol  === false ? 'No' : 'Not provided' },
        ...(existingConditions.trim() ? [{ label: 'Existing conditions', value: existingConditions.trim() }] : []),
      ] : [
        { label: 'Advanced Metrics', value: 'Skipped — Lifestyle-only estimate' },
      ]),
      { label: 'Symptoms noted', value: symptoms.includes('none') || symptoms.length === 0 ? 'None' : `${symptoms.length} selected` },
    ];

    return (
      <div className="animate-fade-in">
        <SectionTitle
          icon={<FiEye size={18} color="var(--primary)" />}
          title="Symptoms & Review"
          subtitle="Select any recent symptoms, and verify your answers before calculating your wellness estimate."
        />

        {/* Symptoms Checklist */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
            Anything you noticed recently? <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>(Select all that apply)</span>
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {SYMPTOM_OPTIONS.map(opt => {
              const checked = symptoms.includes(opt.id);
              return (
                <button key={opt.id} id={`hcf-symptom-${opt.id}`} type="button" onClick={() => toggleSymptom(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${checked ? (opt.serious ? '#f97316' : 'var(--primary)') : 'var(--border-light)'}`,
                  background: checked ? (opt.serious ? '#fff7ed' : 'var(--primary-50)') : 'white',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${checked ? (opt.serious ? '#f97316' : 'var(--primary)') : 'var(--border-medium)'}`,
                    background: checked ? (opt.serious ? '#f97316' : 'var(--primary)') : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <FiCheck size={10} color="white" />}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                    {opt.label}
                  </span>
                  {opt.serious && <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700 }}>⚠ Urgent notice</span>}
                </button>
              );
            })}
          </div>

          {/* Urgent Symptom Warning Block */}
          {hasSerious && (
            <div style={{
              marginTop: '16px', padding: '14px 18px', borderRadius: 'var(--radius-md)',
              background: '#fff7ed', border: '1px solid #fdba74',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <FiAlertTriangle size={18} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.82rem', color: '#9a3412', lineHeight: 1.5, margin: 0 }}>
                <strong>Safety recommendation:</strong> If symptoms are severe or urgent (such as sudden chest discomfort or recurring dizziness), please contact a qualified healthcare professional promptly. VitalIQ is not a substitute for clinical attention.
              </p>
            </div>
          )}
        </div>

        {/* Review Summary */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            Review Your Answers
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {reviewItems.map(item => <ReviewRow key={item.label} label={item.label} value={item.value} />)}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-box" style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
            <FiShield size={18} style={{ flexShrink: 0, color: 'var(--primary)', marginTop: '2px' }} />
            <span style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
              <strong>Wellness disclaimer: </strong>
              VitalIQ Health provides wellness insights and general lifestyle estimates only. It does not provide medical diagnosis, disease prediction, treatment, or cure. Consult a qualified professional for medical concerns.
            </span>
          </div>
        </div>
      </div>
    );
  };

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px', color: '#0f172a' }}>
          Wellness Screening Check
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Guided lifestyle wellness check — complete in 2–3 minutes
        </p>
      </div>

      {/* Progress Indicator (Responsive) */}
      <div className="step-indicator-wrapper" style={{ marginBottom: '32px' }}>
        {/* Desktop Step Labels */}
        <div className="desktop-indicator" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '760px', margin: '0 auto' }}>
          {STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div className={`step-circle ${isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}`} style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCompleted || isActive ? 'var(--primary)' : '#e2e8f0',
                    color: isCompleted || isActive ? 'white' : '#64748b',
                    fontWeight: 700, fontSize: '0.85rem', boxShadow: isActive ? '0 0 0 4px rgba(13, 148, 136, 0.2)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {isCompleted ? <FiCheck size={14} /> : (i + 1)}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: isActive || isCompleted ? 700 : 500, color: isActive ? 'var(--primary)' : '#64748b' }}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: isCompleted ? 'var(--primary)' : '#cbd5e1', margin: '0 12px', marginBottom: '18px', transition: 'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Compact Progress Bar */}
        <div className="mobile-indicator" style={{ display: 'none', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <span>Step {currentStep + 1} of 5</span>
            <span style={{ color: 'var(--primary)' }}>{STEPS[currentStep]?.label}</span>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentStep + 1) / 5) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* Step Form Box */}
      <div className="medical-card hcf-card animate-fade-in" style={{ padding: '36px', maxWidth: '760px', margin: '0 auto', boxShadow: 'var(--shadow-md)' }}>
        {stepRenderers[currentStep]?.()}
      </div>

      {/* Navigation Buttons (Back & Next) */}
      <div className="hcf-btn-container" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '760px', margin: '24px auto 0', gap: '16px' }}>
        <button
          className="btn-ghost" 
          onClick={prevStep} 
          disabled={currentStep === 0}
          style={{ opacity: currentStep === 0 ? 0.3 : 1, padding: '12px 24px', fontWeight: 700, cursor: currentStep === 0 ? 'not-allowed' : 'pointer' }}
        >
          <FiChevronLeft size={18} /> Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button 
            id="hcf-next" 
            className="btn-primary" 
            onClick={nextStep} 
            disabled={!canProceed()}
            style={{ 
              padding: '12px 28px', 
              fontWeight: 700, 
              opacity: !canProceed() ? 0.5 : 1, 
              cursor: !canProceed() ? 'not-allowed' : 'pointer' 
            }}
          >
            Continue <FiChevronRight size={18} />
          </button>
        ) : (
          <button 
            id="hcf-submit" 
            className="btn-primary" 
            onClick={handleSubmit} 
            disabled={loading} 
            style={{ padding: '12px 28px', fontWeight: 800 }}
          >
            Get My Wellness Estimate <FiSend size={16} />
          </button>
        )}
      </div>

      <style>{`
        .desktop-indicator {
          display: flex;
        }
        .mobile-indicator {
          display: none;
        }
        .smoking-alcohol-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .bp-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 600px) {
          .desktop-indicator {
            display: none !important;
          }
          .mobile-indicator {
            display: flex !important;
          }
          .hcf-card {
            padding: 24px 16px !important;
            border-radius: 16px !important;
          }
          .hcf-btn-container {
            margin-top: 16px !important;
            padding: 0 4px !important;
          }
          .smoking-alcohol-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .bp-inputs-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthCheckForm;
