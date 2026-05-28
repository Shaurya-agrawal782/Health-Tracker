import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { predictAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiAlertTriangle, FiDownload, FiShare2, FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const conditionLabels = {
  diabetes: { name: 'Glucose Pattern', icon: '🩸', riskLabel: 'Elevated Glucose Risk Signal', noRiskLabel: 'No Elevated Glucose Signal' },
  bp: { name: 'Blood Pressure Pattern', icon: '❤️', riskLabel: 'Elevated Blood Pressure Signal', noRiskLabel: 'No Elevated Blood Pressure Signal' },
  stress: { name: 'Stress Pattern', icon: '🧠', riskLabel: 'Elevated Stress Signal', noRiskLabel: 'Lower Stress Signal' }
};

const DISCLAIMER = 'VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.';

const firstProvided = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

const formatInputValue = (value, suffix = '') => {
  const provided = firstProvided(value);
  if (provided === undefined) return 'Not provided';
  if (Array.isArray(provided)) return provided.length > 0 ? provided.join(', ') : 'Not provided';
  if (typeof provided === 'boolean') return provided ? 'Yes' : 'No';
  return `${provided}${suffix}`;
};

const formatBP = (bp) => {
  if (bp === null || bp === undefined || bp === '') return 'Not provided';
  if (typeof bp === 'string') return bp; 
  if (typeof bp === 'object' && bp.systolic && bp.diastolic) return `${bp.systolic}/${bp.diastolic} mmHg`;
  return 'Not provided';
};

const hasAdvancedMetrics = (input) => {
  if (!input) return false;
  if (input.advancedMetricsProvided !== undefined) {
    return input.advancedMetricsProvided === true || input.advancedMetricsProvided === 'true';
  }
  const bpProvided = input.bloodPressure != null && input.bloodPressure !== '';
  const glucoseProvided = input.glucose != null && input.glucose !== 100; 
  return bpProvided || glucoseProvided;
};

const getEstimateLabel = (source, aiGenerated) => {
  if (source === 'ml_model') return 'ML model estimate';
  if (source === 'rule_based') return 'Rule-based wellness estimate';
  if (source === 'ai_assisted' || aiGenerated) return 'AI-assisted wellness estimate';
  return 'Wellness estimate';
};

const HealthResults = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';

  useEffect(() => {
    const load = async () => {
      try {
        const cached = sessionStorage.getItem(`guest_prediction_${id}`);
        if (cached) {
          setPrediction(JSON.parse(cached));
          setLoading(false);
          return;
        }
        const res = await predictAPI.getById(id);
        setPrediction(res.data.data);
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }} className="page-enter">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>Results Not Found</h2>
        <Link to="/dashboard" className="btn-primary" style={{ marginTop: '16px', padding: '12px 28px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { results, overallRisk, explanations, recommendations, input, date } = prediction;
  const riskCount = (results?.diabetes || 0) + (results?.bp || 0) + (results?.stress || 0);
  const estimateSource = overallRisk?.source || prediction.source || (prediction.aiGenerated ? 'ai_assisted' : null);
  const rawConfidence = Number.parseFloat(overallRisk?.confidence ?? prediction.confidence);

  const getFallbackCompleteness = (input) => {
    if (!input) return 60;
    const providedGlucose = (input.glucose !== undefined && input.glucose !== null && input.glucose !== '');
    const providedBP = (input.bloodPressure !== undefined && input.bloodPressure !== null && input.bloodPressure !== '') ||
                       (input.systolic !== undefined && input.systolic !== null && input.systolic !== '' &&
                        input.diastolic !== undefined && input.diastolic !== null && input.diastolic !== '');
    const providedFamily = (input.familyHistory !== undefined && input.familyHistory !== null && input.familyHistory !== '') ||
                           (input.family !== undefined && input.family !== null && input.family !== '');
    const providedSmoking = (input.smoking !== undefined && input.smoking !== null && input.smoking !== '');
    const providedAlcohol = (input.alcohol !== undefined && input.alcohol !== null && input.alcohol !== '');

    const providedCount = [
      providedGlucose,
      providedBP,
      providedFamily,
      providedSmoking,
      providedAlcohol
    ].filter(Boolean).length;

    return Math.round((providedCount / 5) * 100);
  };

  const resolvedCompleteness = typeof overallRisk?.inputCompleteness === 'number'
    ? overallRisk.inputCompleteness
    : (typeof prediction.inputCompleteness === 'number'
      ? prediction.inputCompleteness
      : getFallbackCompleteness(input));

  const hasModelConfidence = estimateSource === 'ml_model' && 
                             Number.isFinite(rawConfidence) && 
                             (overallRisk?.confidenceLabel === 'Model confidence' || prediction.confidenceLabel === 'Model confidence');

  const confidencePercent = hasModelConfidence ? Math.round(Math.min(Math.max(rawConfidence, 0), 1) * 100) : null;
  const estimateLabel = overallRisk?.confidenceLabel || prediction.confidenceLabel || getEstimateLabel(estimateSource, prediction.aiGenerated);
  const inputRows = [
    { label: 'Glucose', value: formatInputValue(input?.glucose, ' mg/dL') },
    { label: 'Blood Pressure', value: formatBP(firstProvided(input?.bloodPressure, input?.blood_pressure, input?.bp)) },
    { label: 'BMI', value: formatInputValue(input?.bmi) },
    { label: 'Sleep', value: formatInputValue(firstProvided(input?.sleepHours, input?.sleep), ' hrs') },
    { label: 'Screen Time', value: formatInputValue(firstProvided(input?.screenHours, input?.screen), ' hrs/day') },
    { label: 'Work Hours', value: formatInputValue(firstProvided(input?.workHours, input?.work), ' hrs/day') },
    { label: 'Daily Activity', value: formatInputValue(firstProvided(input?.dailyActivityMinutes, input?.daily_activity, input?.exerciseMinutes, input?.activity), ' min') },
    { label: 'Stress Level', value: formatInputValue(firstProvided(input?.stressLevel, input?.stress_level)) },
    { label: 'Steps', value: formatInputValue(input?.steps) },
    { label: 'Water Intake', value: formatInputValue(input?.waterIntake, ' L') },
    { label: 'Smoking', value: formatInputValue(input?.smoking) },
    { label: 'Alcohol', value: formatInputValue(input?.alcohol) },
    { label: 'Family History', value: formatInputValue(firstProvided(input?.familyHistory, input?.family)) },
    { label: 'Symptoms', value: formatInputValue(firstProvided(input?.symptoms, prediction.symptoms)) },
    ...(input?.existingConditions ? [{ label: 'Existing Conditions', value: input.existingConditions }] : [])
  ];

  const primaryCondition = results?.diabetes === 1 ? 'diabetes' : results?.bp === 1 ? 'bp' : results?.stress === 1 ? 'stress' : null;
  const primaryLabel = primaryCondition ? conditionLabels[primaryCondition] : null;

  const circumference = 2 * Math.PI * 40;
  const dashOffset = hasModelConfidence ? circumference - (confidencePercent / 100) * circumference : circumference;

  return (
    <div className="page-enter">
      {/* Back nav */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem',
          transition: 'color var(--transition-fast)'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Guest Mode Warning Banner */}
      {prediction.isSaved === false && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#854d0e', fontSize: '0.9rem' }}>Guest Mode Session</strong>
              <p style={{ color: '#a16207', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                This estimate will not be saved permanently. Create an account to save your screening history.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'white' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Lifestyle-only vs Advanced Metrics banner */}
      {(() => {
        const usedAdvanced = hasAdvancedMetrics(input);
        return (
          <div style={{
            padding: '13px 18px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            background: usedAdvanced ? '#f0f9ff' : '#f0fdf4',
            border: `1px solid ${usedAdvanced ? '#bae6fd' : '#bbf7d0'}`,
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '0.85rem',
            color: usedAdvanced ? '#0369a1' : '#166534',
            lineHeight: 1.6,
          }}>
            <span style={{ fontSize: '1.1rem' }}>{usedAdvanced ? '📊' : '🌿'}</span>
            <span>
              {usedAdvanced
                ? 'This wellness estimate includes the optional health metrics you provided.'
                : 'This wellness estimate is based mainly on your lifestyle inputs. You can include health metrics in future screenings for a more detailed estimate.'}
            </span>
          </div>
        );
      })()}

      {/* Primary Screening Card */}
      <div className="teal-card animate-fade-in-up" style={{
        padding: '32px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
            {primaryLabel ? primaryLabel.riskLabel : 'Wellness Screening Results'}
          </h1>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '16px' }}>
            Screening completed on {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <FiCheckCircle size={14} /> VitalIQ Health Screening
            </span>
            {prediction.aiGenerated && (
              <span style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: '#fbbf24',
                color: '#92400e',
                fontSize: '0.75rem',
                fontWeight: 800,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                AI ASSISTED
              </span>
            )}
          </div>

          {/* Risk tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(results || {}).map(([key, val]) => (
              <span key={key} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: val === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                fontSize: '0.8rem',
                fontWeight: 500,
                border: val === 1 ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.15)'
              }}>
                {val === 1 ? <FiXCircle size={12} /> : <FiCheckCircle size={12} />}
                {conditionLabels[key]?.name}: {val === 1 ? 'Elevated Signal' : 'No Elevated Signal'}
              </span>
            ))}
          </div>
        </div>

        {/* Estimate source / model confidence */}
        <div style={{ textAlign: 'center' }}>
          {hasModelConfidence ? (
            <div className="circular-progress" style={{ width: '120px', height: '120px', margin: '0 auto 16px auto' }}>
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <div className="progress-text" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{confidencePercent}%</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>Model Confidence</div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '240px',
              margin: '0 auto 16px auto',
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {estimateSource === 'ai_assisted' ? 'AI-Assisted' : 'Wellness Estimate'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                  {resolvedCompleteness}%
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  {estimateLabel}
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${resolvedCompleteness}%`,
                    height: '100%',
                    background: 'white',
                    borderRadius: '999px',
                    transition: 'width 1s ease-out'
                  }} />
                </div>
              </div>

              <div style={{ 
                fontSize: '0.72rem', 
                lineHeight: '1.4', 
                opacity: 0.88, 
                fontWeight: 500 
              }}>
                This wellness estimate is based on your lifestyle profile. Add optional health metrics for a more detailed estimate.
              </div>
            </div>
          )}
          <button 
            onClick={() => window.print()}
            className="btn-primary" 
            style={{ background: 'white', color: 'var(--primary)', fontWeight: 800, padding: '10px 20px', borderRadius: '12px' }}
          >
            <FiDownload /> Export Summary
          </button>
        </div>
      </div>

      {/* Submitted Health Inputs */}
      <div className="medical-card animate-fade-in-up" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.05s' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
          Submitted Health Inputs
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {inputRows.map(item => (
            <div key={item.label} style={{
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Breakdown & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="medical-card animate-fade-in-up" style={{ padding: '24px', animationDelay: '0.1s', opacity: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
              Wellness Signal Analysis
            </h3>

            {Object.entries(results || {}).map(([key, val]) => {
              const label = conditionLabels[key];
              const explanation = explanations?.[key];
              
              return (
                <div key={key} style={{
                  padding: '16px',
                  background: val === 1 ? '#fee2e2' : '#d1fae5',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '12px',
                  border: `1px solid ${val === 1 ? '#fca5a5' : '#a7f3d0'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: val === 1 ? '#991b1b' : '#065f46'
                    }}>
                      {label?.icon} {label?.name}
                    </span>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: val === 1 ? '#fca5a5' : '#a7f3d0',
                      color: val === 1 ? '#991b1b' : '#065f46'
                    }}>
                      {val === 1 ? 'Elevated Signal' : 'No Elevated Signal'}
                    </span>
                  </div>
                  
                  {explanation?.feature_importance && (
                    <div style={{ marginTop: '8px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Key Contributing Factors:
                      </p>
                      {Object.entries(explanation.feature_importance)
                        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                        .slice(0, 3)
                        .map(([feature, importance]) => (
                          <div key={feature} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <span style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              width: '140px',
                              flexShrink: 0
                            }}>
                              {feature.replace(/_/g, ' ')}
                            </span>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              borderRadius: '3px',
                              background: '#e2e8f0',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(Math.abs(importance) * 100, 100)}%`,
                                background: importance > 0 ? '#ef4444' : '#10b981',
                                borderRadius: '3px',
                                transition: 'width 1s ease-out'
                              }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {overallRisk?.insights && (
            <div className="medical-card animate-fade-in-up" style={{ 
              padding: '24px', 
              animationDelay: '0.15s', 
              opacity: 0,
              background: '#f0f9ff',
              border: '1px solid #bae6fd'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0369a1' }}>
                💡 VitalIQ Health Insights
              </h3>
              <ul style={{ padding: '0 0 0 20px', margin: 0 }}>
                {overallRisk.insights.map((insight, i) => (
                  <li key={i} style={{ fontSize: '0.9rem', color: '#0c4a6e', marginBottom: '8px', lineHeight: 1.6 }}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Lifestyle Plan & Hacks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="medical-card animate-fade-in-up" style={{ padding: '24px', animationDelay: '0.2s', opacity: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Personalized Lifestyle Plan
            </h3>
            <ol style={{ padding: '0 0 0 20px' }}>
              {(recommendations || []).map((rec, i) => (
                <li key={i} style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: '8px'
                }}>
                  {rec}
                </li>
              ))}
            </ol>
          </div>

          {overallRisk?.micro_hacks && (
            <div className="medical-card animate-fade-in-up" style={{ 
              padding: '24px', 
              animationDelay: '0.25s', 
              opacity: 0,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#15803d' }}>
                ⚡ 5-Minute Micro-Hacks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {overallRisk.micro_hacks.map((hack, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    color: '#166534',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                    {hack}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="disclaimer-box animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <FiAlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Important wellness disclaimer: </strong>
                {DISCLAIMER}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guided Next Actions Button Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '28px'
      }} className="animate-fade-in-up" >
        <Link to="/daily-actions" className="btn-primary" style={{ justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
          View Daily Actions
        </Link>
        <Link to="/meal-planner" className="btn-secondary" style={{ justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
          Generate Meal Plan
        </Link>
        {isGuest ? (
          <Link to="/register" className="btn-primary" style={{ background: '#0d9488', color: 'white', justifyContent: 'center', fontWeight: 800 }}>
            Create Account to Save History
          </Link>
        ) : (
          <div style={{
            background: 'var(--primary-50)',
            color: 'var(--primary)',
            padding: '12px 28px',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            <FiCheckCircle /> Saved to History
          </div>
        )}
        <button 
          onClick={() => window.print()}
          className="btn-ghost" 
          style={{ justifyContent: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}
        >
          <FiDownload size={16} /> Download Summary
        </button>
      </div>

      <style>{`
        @media print {
          nav, header, aside, .btn-primary, .btn-secondary, .btn-ghost, .back-nav {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .page-enter {
            animation: none !important;
          }
          .medical-card {
            box-shadow: none !important;
            border: 1px solid #eee !important;
            break-inside: avoid;
          }
          .teal-card {
            background: #f0fdfa !important;
            color: #064e3b !important;
            border: 2px solid #0d9488 !important;
            box-shadow: none !important;
          }
          .teal-card * {
            color: #064e3b !important;
          }
          .circular-progress circle {
            stroke: #0d9488 !important;
          }
          .circular-progress circle:first-child {
            stroke: #f1f5f9 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthResults;
