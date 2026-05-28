import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictAPI } from '../services/api';
import {
  FiCheck, FiChevronRight, FiChevronLeft, FiUser, FiActivity,
  FiMoon, FiHeart, FiEye, FiSend, FiAlertTriangle, FiPlus, FiMinus
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Basic Details',    icon: <FiUser     size={14} /> },
  { label: 'Daily Lifestyle',  icon: <FiActivity size={14} /> },
  { label: 'Sleep & Stress',   icon: <FiMoon     size={14} /> },
  { label: 'Health Metrics',   icon: <FiHeart    size={14} /> },
  { label: 'Symptoms & Review',icon: <FiEye      size={14} /> },
];

// ─── Option mappings (label → backend value(s)) ───────────────────────────────
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
  { id: 'fatigue',     label: 'Frequent fatigue or low energy',           serious: false },
  { id: 'headache',    label: 'Frequent headaches',                       serious: false },
  { id: 'poor_sleep',  label: 'Poor sleep quality',                       serious: false },
  { id: 'high_stress', label: 'High stress / anxiety recently',           serious: false },
  { id: 'thirst',      label: 'Unusual thirst or frequent urination',     serious: false },
  { id: 'blurry',      label: 'Occasional blurry vision',                 serious: false },
  { id: 'shortbreath', label: 'Shortness of breath with light activity',  serious: false },
  { id: 'chest',       label: 'Chest discomfort or pressure',             serious: true  },
  { id: 'dizziness',   label: 'Severe or recurring dizziness',            serious: true  },
  { id: 'numb',        label: 'Tingling or numbness in hands/feet',       serious: false },
  { id: 'none',        label: 'None of the above',                        serious: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Reusable Components ──────────────────────────────────────────────────────
const OptionCard = ({ option, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(option)}
    style={{
      width: '100%', textAlign: 'left', padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-light)'}`,
      background: selected ? 'var(--primary-50)' : 'white',
      cursor: 'pointer', transition: 'all var(--transition-base)',
      display: 'flex', alignItems: 'center', gap: '12px',
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
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: selected ? 'var(--primary)' : 'var(--text-primary)' }}>
        {option.label}
      </div>
      {option.sub && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {option.sub}
        </div>
      )}
    </div>
  </button>
);

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '24px' }}>
    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon} {title}
    </h2>
    {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{subtitle}</p>}
  </div>
);

const ReviewRow = ({ label, value }) => (
  <div style={{
    padding: '10px 14px', background: 'var(--primary-50)',
    borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{value}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const HealthCheckForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Step 1: Basic Details
  const [age, setAge]       = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // ── Step 2: Daily Lifestyle
  const [activityOption, setActivityOption] = useState(null);
  const [screenOption,   setScreenOption]   = useState(null);
  const [workOption,     setWorkOption]     = useState(null);

  // ── Step 3: Sleep & Stress
  const [sleepOption,  setSleepOption]  = useState(null);
  const [stressOption, setStressOption] = useState(null);

  // ── Step 4: Optional Health Metrics
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

  // ── Step 5: Symptoms
  const [symptoms, setSymptoms] = useState([]);

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

  // ── Step validation
  const canProceed = () => {
    if (currentStep === 0) return age && gender && height && weight && parseFloat(age) > 0 && parseFloat(height) > 0 && parseFloat(weight) > 0;
    if (currentStep === 1) return activityOption && screenOption && workOption;
    if (currentStep === 2) return sleepOption && stressOption;
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) {
      toast.error('Please complete all required fields before continuing.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // ── Build payload & submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Resolve glucose
      let resolvedGlucose = null;
      if (showAdvanced && glucoseOption) {
        if (glucoseOption.value === 'Exact' && glucoseValue) {
          resolvedGlucose = parseFloat(glucoseValue);
        } else if (glucoseOption.value && glucoseOption.value !== 'Exact') {
          resolvedGlucose = GLUCOSE_CATEGORY_MAP[glucoseOption.value] || null;
        }
      }

      // Resolve blood pressure
      let resolvedBP = null;
      let resolvedSystolic = null;
      let resolvedDiastolic = null;
      if (showAdvanced && bpOption && bpOption.value) {
        if (bpOption.value === 'Exact' && systolic && diastolic) {
          resolvedSystolic = parseFloat(systolic);
          resolvedDiastolic = parseFloat(diastolic);
          resolvedBP = null; // exact values stored in systolic/diastolic
        } else if (bpOption.value !== 'Exact') {
          resolvedBP = bpOption.value;
        }
      }

      const payload = {
        // Demographics
        age:    parseFloat(age),
        gender: gender.toLowerCase(),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bmi:    bmi,
        // Lifestyle (standard names)
        activity_level:       activityOption.activity_level,
        dailyActivityMinutes: activityOption.daily_activity,
        daily_activity:       activityOption.daily_activity,
        activity:             activityOption.daily_activity * 7, // approx weekly minutes
        screenHours:          screenOption.screen,
        screen:               screenOption.screen,
        workHours:            workOption.work,
        work:                 workOption.work,
        // Sleep & Stress
        sleepHours:   sleepOption.sleep,
        sleep:        sleepOption.sleep,
        stressLevel:  stressOption.stress_level,
        stress_level: stressOption.stress_level,
        // Optional advanced metrics — always explicitly null when not provided
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
        // Salt stays at default — not asked to avoid confusion
        salt: 8,
        // Symptoms & check type
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
            // Remove any duplicates with same id
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
      toast.error(err.response?.data?.message || 'Screening failed. Please try again.');
      setLoading(false);
    }
  };

  // ─── Step Renderers ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiUser size={18} color="var(--primary)" />}
        title="Basic Details"
        subtitle="These help us personalise your wellness estimate."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {/* Age */}
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Age *</label>
          <input
            id="hcf-age" type="number" className="input-field" placeholder="e.g. 28"
            value={age} min="1" max="120"
            onChange={e => setAge(e.target.value)}
          />
        </div>
        {/* Gender */}
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Gender *</label>
          <select id="hcf-gender" className="select-field" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {/* Height */}
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Height (cm) *</label>
          <input
            id="hcf-height" type="number" className="input-field" placeholder="e.g. 165"
            value={height} min="50" max="300"
            onChange={e => setHeight(e.target.value)}
          />
        </div>
        {/* Weight */}
        <div>
          <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Weight (kg) *</label>
          <input
            id="hcf-weight" type="number" className="input-field" placeholder="e.g. 65"
            value={weight} min="10" max="300"
            onChange={e => setWeight(e.target.value)}
          />
        </div>
      </div>

      {/* BMI Auto-calculation display */}
      <div style={{
        marginTop: '20px', padding: '14px 18px', borderRadius: 'var(--radius-md)',
        background: bmi ? 'var(--primary-50)' : '#f8fafc',
        border: `1px solid ${bmi ? 'rgba(13,110,91,0.2)' : 'var(--border-light)'}`,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '1.3rem' }}>📐</span>
        <div>
          {bmi ? (
            <>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>Your BMI: {bmi} </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{bmiCategory(bmi)}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Don't know your BMI? No problem — VitalIQ calculates it automatically from your height and weight.
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiActivity size={18} color="var(--primary)" />}
        title="Daily Lifestyle"
        subtitle="Choose the option that best describes a typical day for you. No exact numbers needed!"
      />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
          How active are you on a typical day? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ACTIVITY_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={activityOption?.label === opt.label} onSelect={setActivityOption} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
          How much screen time do you get per day (phone, TV, computer)? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SCREEN_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={screenOption?.label === opt.label} onSelect={setScreenOption} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
          How many hours do you typically work or study per day? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {WORK_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={workOption?.label === opt.label} onSelect={setWorkOption} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiMoon size={18} color="var(--primary)" />}
        title="Sleep & Stress"
        subtitle="Your sleep and stress patterns significantly affect your overall wellness."
      />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
          How much sleep do you typically get per night? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SLEEP_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={sleepOption?.label === opt.label} onSelect={setSleepOption} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
          How would you describe your usual stress level? *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STRESS_OPTIONS.map(opt => (
            <OptionCard key={opt.label} option={opt} selected={stressOption?.label === opt.label} onSelect={setStressOption} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in">
      <SectionTitle
        icon={<FiHeart size={18} color="var(--primary)" />}
        title="Optional Health Metrics"
        subtitle="You can skip this entire section — your basic wellness estimate doesn't need it."
      />

      {/* Advanced metrics toggle */}
      <div style={{
        padding: '16px 20px', marginBottom: '24px', borderRadius: 'var(--radius-md)',
        background: showAdvanced ? 'var(--primary-50)' : '#f8fafc',
        border: `1px solid ${showAdvanced ? 'rgba(13,110,91,0.25)' : 'var(--border-light)'}`,
        cursor: 'pointer', transition: 'all var(--transition-base)',
      }} onClick={() => setShowAdvanced(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: showAdvanced ? 'var(--primary)' : '#cbd5e1',
              position: 'relative', transition: 'background var(--transition-base)', flexShrink: 0,
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px',
                left: showAdvanced ? '23px' : '3px',
                transition: 'left var(--transition-base)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: showAdvanced ? 'var(--primary)' : 'var(--text-primary)' }}>
                I know some of my recent health numbers
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Blood pressure, blood glucose, smoking, family history
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, marginLeft: '16px' }}>
            {showAdvanced ? 'Hide' : 'Add metrics →'}
          </span>
        </div>
      </div>

      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Blood Pressure */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
              Blood pressure — which best describes you?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BP_OPTIONS.map(opt => (
                <OptionCard key={opt.label} option={opt} selected={bpOption?.label === opt.label} onSelect={setBpOption} />
              ))}
            </div>
            {bpOption?.value === 'Exact' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
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
                  Normal: 120/80 mmHg · Elevated: 130–139/80–89 · High: 140+/90+
                </p>
              </div>
            )}
          </div>

          {/* Glucose */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
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
                  Normal fasting: 70–100 mg/dL · Pre-diabetic: 100–125 · Diabetic: 126+
                </p>
              </div>
            )}
          </div>

          {/* Family History */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
              Family history of diabetes or heart disease?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FAMILY_HISTORY_OPTIONS.map(opt => (
                <OptionCard key={opt.label} option={opt} selected={familyOption?.label === opt.label} onSelect={setFamilyOption} />
              ))}
            </div>
          </div>

          {/* Smoking & Alcohol */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Do you smoke?',        value: smoking, setter: setSmoking },
              { label: 'Do you drink alcohol?',value: alcohol, setter: setAlcohol },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{label}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ text: 'Yes', v: true }, { text: 'No', v: false }].map(({ text, v }) => (
                    <button key={text} type="button" onClick={() => setter(v)} style={{
                      flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${value === v ? 'var(--primary)' : 'var(--border-light)'}`,
                      background: value === v ? 'var(--primary-50)' : 'white',
                      fontWeight: 600, fontSize: '0.88rem',
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
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
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

      {/* "Skip" notice when advanced is off */}
      {!showAdvanced && (
        <div style={{
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🌿</span>
          <span>Your wellness estimate will be based on your lifestyle inputs from the previous steps. Toggle on above to include health numbers for a more detailed estimate.</span>
        </div>
      )}
    </div>
  );

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
      { label: 'Sleep',          value: sleepOption?.label   || '—' },
      { label: 'Stress level',   value: stressOption?.label  || '—' },
      ...(showAdvanced ? [
        { label: 'Blood pressure',  value: bpOption?.value === 'Exact' ? `${systolic || '—'}/${diastolic || '—'} mmHg` : (bpOption?.label || 'Not provided') },
        { label: 'Blood glucose',   value: glucoseOption?.value === 'Exact' ? `${glucoseValue || '—'} mg/dL` : (glucoseOption?.label || 'Not provided') },
        { label: 'Family history',  value: familyOption?.label  || 'Not provided' },
        { label: 'Smoking',         value: smoking === true ? 'Yes' : smoking === false ? 'No' : 'Not provided' },
        { label: 'Alcohol',         value: alcohol  === true ? 'Yes' : alcohol  === false ? 'No' : 'Not provided' },
        ...(existingConditions.trim() ? [{ label: 'Existing conditions', value: existingConditions.trim() }] : []),
      ] : [
        { label: 'Health metrics',  value: 'Skipped — lifestyle-only estimate' },
      ]),
      { label: 'Symptoms noted', value: symptoms.includes('none') || symptoms.length === 0 ? 'None' : `${symptoms.length} selected` },
    ];

    return (
      <div className="animate-fade-in">
        <SectionTitle
          icon={<FiEye size={18} color="var(--primary)" />}
          title="Symptoms & Review"
          subtitle="Select any recent symptoms, then review your answers before running the wellness check."
        />

        {/* Symptoms */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
            Are you experiencing any of these recently?{' '}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Select all that apply)</span>
          </label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            For informational context only — not for diagnosis.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SYMPTOM_OPTIONS.map(opt => {
              const checked = symptoms.includes(opt.id);
              return (
                <button key={opt.id} id={`hcf-symptom-${opt.id}`} type="button" onClick={() => toggleSymptom(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${checked ? (opt.serious ? '#f97316' : 'var(--primary)') : 'var(--border-light)'}`,
                  background: checked ? (opt.serious ? '#fff7ed' : 'var(--primary-50)') : 'white',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${checked ? (opt.serious ? '#f97316' : 'var(--primary)') : 'var(--border-medium)'}`,
                    background: checked ? (opt.serious ? '#f97316' : 'var(--primary)') : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <FiCheck size={10} color="white" />}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
                    {opt.label}
                  </span>
                  {opt.serious && <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 600 }}>⚠ Urgent</span>}
                </button>
              );
            })}
          </div>

          {/* Serious symptom warning */}
          {hasSerious && (
            <div style={{
              marginTop: '16px', padding: '14px 16px', borderRadius: 'var(--radius-md)',
              background: '#fff7ed', border: '1px solid #fdba74',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <FiAlertTriangle size={18} color="#f97316" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.85rem', color: '#9a3412', lineHeight: 1.6 }}>
                <strong>Please note:</strong> If your symptoms are severe, sudden, or worsening — such as chest discomfort or recurring dizziness — please contact a qualified healthcare professional promptly. VitalIQ Health is not a substitute for medical advice.
              </p>
            </div>
          )}
        </div>

        {/* Review summary */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Review Your Answers
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {reviewItems.map(item => <ReviewRow key={item.label} label={item.label} value={item.value} />)}
          </div>
        </div>

        {/* Estimate type banner */}
        <div style={{
          padding: '14px 18px', marginBottom: '20px', borderRadius: 'var(--radius-md)',
          background: showAdvanced ? '#f0f9ff' : 'var(--primary-50)',
          border: `1px solid ${showAdvanced ? '#bae6fd' : 'rgba(13,110,91,0.2)'}`,
          fontSize: '0.85rem', color: showAdvanced ? '#0369a1' : 'var(--primary)',
          lineHeight: 1.6,
        }}>
          {showAdvanced
            ? '📊 Your estimate will include the optional health metrics you provided.'
            : '🌿 Your estimate will be based on lifestyle inputs. Enable optional health metrics on the previous step for a more detailed estimate.'}
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-box">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Wellness disclaimer: </strong>
              VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.
            </span>
          </div>
        </div>
      </div>
    );
  };

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
          Wellness Screening
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          A friendly lifestyle-based wellness check — no medical expertise required
        </p>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator" style={{ marginBottom: '36px', overflowX: 'auto', paddingBottom: '8px' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className={`step-circle ${i < currentStep ? 'completed' : i === currentStep ? 'active' : 'inactive'}`}>
                {i < currentStep ? <FiCheck size={15} /> : (i + 1)}
              </div>
              <p style={{
                fontSize: '0.65rem', fontWeight: 600, marginTop: '5px', whiteSpace: 'nowrap',
                color: i <= currentStep ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${i < currentStep ? 'active' : ''}`} style={{ margin: '0 4px', marginBottom: '18px', minWidth: '40px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="medical-card hcf-card animate-fade-in" style={{ padding: '32px', maxWidth: '760px', margin: '0 auto' }}>
        {stepRenderers[currentStep]?.()}
      </div>

      {/* Navigation Buttons */}
      <div className="hcf-btn-container" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '760px', margin: '24px auto 0', gap: '16px' }}>
        <button
          className="btn-ghost" onClick={prevStep} disabled={currentStep === 0}
          style={{ opacity: currentStep === 0 ? 0.4 : 1, padding: '12px 28px' }}
        >
          <FiChevronLeft size={18} /> Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button id="hcf-next" className="btn-primary" onClick={nextStep} style={{ padding: '12px 32px' }}>
            Continue <FiChevronRight size={18} />
          </button>
        ) : (
          <button id="hcf-submit" className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 32px' }}>
            {loading ? (
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            ) : (
              <>Run Wellness Check <FiSend size={16} /></>
            )}
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .hcf-card {
            padding: 20px 16px !important;
            border-radius: 12px !important;
          }
          .hcf-btn-container {
            margin-top: 16px !important;
            padding: 0 4px !important;
          }
          .step-indicator {
            margin-bottom: 24px !important;
          }
          .step-line {
            min-width: 15px !important;
            width: 25px !important;
          }
          .step-circle {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthCheckForm;

