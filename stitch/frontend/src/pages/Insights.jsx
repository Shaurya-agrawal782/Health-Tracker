import { useEffect, useState } from 'react';
import { healthAPI } from '../services/api';
import RiskGauge from '../components/dashboard/RiskGauge';
import { FiAlertCircle, FiInfo, FiPlusCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Insights = () => {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRisk = async () => {
      try {
        const res = await healthAPI.getRisk();
        setRisk(res.data.data);
      } catch (err) {
        console.error('Failed to load risk data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRisk();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!risk || risk.factors.length === 0) {
    return (
      <div className="page-enter" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>No Insights Yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Log your daily health data first to get risk insights.
        </p>
        <Link to="/health-input" className="btn-primary" style={{ padding: '12px 28px' }}>
          <FiPlusCircle /> Log Health Data
        </Link>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
          <span className="gradient-text">Health Insights</span> 🔍
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          AI-powered analysis of your health risk factors with explainable breakdowns.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 380px) 1fr',
        gap: '20px',
        alignItems: 'start'
      }} className="insights-grid">
        <div>
          <RiskGauge score={risk.score} level={risk.level} explanation={risk.explanation} />

          {risk.bmi && (
            <div className="medical-card" style={{ padding: '20px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your BMI</span>
                <span style={{
                  fontSize: '1.2rem', fontWeight: 700,
                  color: risk.bmiCategory === 'Normal' ? '#065f46' : '#92400e'
                }}>
                  {risk.bmi} ({risk.bmiCategory})
                </span>
              </div>
            </div>
          )}

          <div className="medical-card" style={{ padding: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prediction Confidence</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                {Math.round(risk.confidence * 100)}%
              </span>
            </div>
            <div style={{
              height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${risk.confidence * 100}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent-emerald))',
                borderRadius: '3px', transition: 'width 1s ease-out'
              }} />
            </div>
          </div>
        </div>

        <div>
          <div className="medical-card" style={{
            padding: '16px 20px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--primary-50)', borderColor: 'var(--border-teal)'
          }}>
            <FiInfo color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--primary)' }}>Explainable AI:</strong> Each factor shows exactly how it contributes to your risk score.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="stagger-children">
            {risk.factors.map((factor, i) => (
              <div key={i} className="medical-card animate-fade-in-up" style={{
                padding: '20px',
                borderLeft: `3px solid ${getSeverityColor(factor.severity)}`,
                opacity: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAlertCircle size={16} color={getSeverityColor(factor.severity)} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{factor.factor}</h4>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem', fontWeight: 700,
                    color: getSeverityColor(factor.severity),
                    background: `${getSeverityColor(factor.severity)}15`,
                    border: `1px solid ${getSeverityColor(factor.severity)}40`
                  }}>
                    {factor.impact}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {factor.detail}
                </p>
                <div style={{
                  marginTop: '10px', height: '4px', borderRadius: '2px',
                  background: '#e2e8f0', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', width: `${parseInt(factor.impact)}%`,
                    background: getSeverityColor(factor.severity),
                    borderRadius: '2px', transition: 'width 0.8s ease-out'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .insights-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Insights;
