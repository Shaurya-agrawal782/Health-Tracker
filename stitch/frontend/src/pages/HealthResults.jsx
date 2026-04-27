import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { predictAPI } from '../services/api';
import { FiAlertTriangle, FiDownload, FiShare2, FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const conditionLabels = {
  diabetes: { name: 'Diabetes', icon: '🩸', riskLabel: 'Diabetes Risk', noRiskLabel: 'No Diabetes Risk' },
  bp: { name: 'Blood Pressure', icon: '❤️', riskLabel: 'High BP Risk', noRiskLabel: 'Normal BP' },
  stress: { name: 'Stress', icon: '🧠', riskLabel: 'High Stress', noRiskLabel: 'Low Stress' }
};

const HealthResults = () => {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
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
  const confidence = overallRisk?.confidence ? Math.round(overallRisk.confidence * 100) : 85;

  // Find primary condition
  const primaryCondition = results?.diabetes === 1 ? 'diabetes' : results?.bp === 1 ? 'bp' : results?.stress === 1 ? 'stress' : null;
  const primaryLabel = primaryCondition ? conditionLabels[primaryCondition] : null;

  // Circumference for donut
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (confidence / 100) * circumference;

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

      {/* Primary Prediction Card */}
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
            {primaryLabel ? primaryLabel.riskLabel : 'Health Analysis Results'}
          </h1>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '16px' }}>
            Analysis completed on {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
              <FiCheckCircle size={14} /> VitalIQ AI Analysis
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
                PREMIUM AI
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
                {conditionLabels[key]?.name}: {val === 1 ? 'At Risk' : 'Normal'}
              </span>
            ))}
          </div>
        </div>

        {/* Confidence donut */}
        <div style={{ textAlign: 'center' }}>
          <div className="circular-progress" style={{ width: '120px', height: '120px', margin: '0 auto 16px auto' }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div className="progress-text" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{confidence}%</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>Confidence</div>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="btn-primary" 
            style={{ background: 'white', color: 'var(--primary)', fontWeight: 800, padding: '10px 20px', borderRadius: '12px' }}
          >
            <FiDownload /> Export Report
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* AI Insights & Micro-hacks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Detailed Breakdown */}
          <div className="medical-card animate-fade-in-up" style={{ padding: '24px', animationDelay: '0.1s', opacity: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
              Condition Analysis
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
                      {val === 1 ? 'At Risk' : 'Normal'}
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

          {/* AI Insights Panel */}
          {overallRisk?.insights && (
            <div className="medical-card animate-fade-in-up" style={{ 
              padding: '24px', 
              animationDelay: '0.15s', 
              opacity: 0,
              background: '#f0f9ff',
              border: '1px solid #bae6fd'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0369a1' }}>
                💡 VitalIQ AI Insights
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

        {/* Recommendations & Micro-hacks */}
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

          {/* Micro-hacks Panel */}
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

          {/* Disclaimer */}
          <div className="disclaimer-box animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <FiAlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>IMPORTANT DISCLAIMER: </strong>
                This analysis is generated by an AI model and is NOT a medical diagnosis. It is intended for informational purposes only and should not replace professional medical advice.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginTop: '28px'
      }} className="animate-fade-in-up" >
        <Link to="/health-check" className="btn-primary" style={{ justifyContent: 'center' }}>
          New Health Check
        </Link>
        <Link to="/history" className="btn-secondary" style={{ justifyContent: 'center' }}>
          View All History
        </Link>
        <button 
          onClick={() => window.print()}
          className="btn-ghost" 
          style={{ justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}
        >
          <FiDownload size={16} /> Download Official Report
        </button>
        <button className="btn-ghost" style={{ justifyContent: 'center' }}>
          <FiShare2 size={16} /> Share with Doctor
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
