import { useEffect, useState } from 'react';
import { healthAPI, predictAPI, recommendationAPI } from '../services/api';
import RiskGauge from '../components/dashboard/RiskGauge';
import { FiAlertCircle, FiInfo, FiPlusCircle, FiCheckCircle, FiChevronRight, FiActivity, FiHeart, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import HealthMap from '../components/dashboard/HealthMap';
import EmergencyLocator from '../components/dashboard/EmergencyLocator';

const firstProvided = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

const getEstimateLabel = (source, aiGenerated) => {
  if (source === 'ml_model') return 'ML model estimate';
  if (source === 'rule_based') return 'Rule-based wellness estimate';
  if (source === 'ai_assisted' || aiGenerated) return 'AI-assisted wellness estimate';
  return 'Wellness estimate';
};

const hasModelConfidence = (risk) => (
  risk?.source === 'ml_model' &&
  typeof risk.confidence === 'number' &&
  Number.isFinite(risk.confidence)
);

const Insights = () => {
  const [risk, setRisk] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Fetch from BOTH data sources in parallel
        const [riskRes, predRes, recRes] = await Promise.allSettled([
          healthAPI.getRisk(),
          predictAPI.getHistory({ limit: 1 }),
          recommendationAPI.getAll()
        ]);

        // Use the latest prediction (screening) if available
        const pred = predRes.status === 'fulfilled' && predRes.value.data.data?.length > 0
          ? predRes.value.data.data[0]
          : null;
        setLatestPrediction(pred);

        // Build the risk object: prefer prediction data over health-log risk
        if (pred && pred.overallRisk) {
          // Use prediction-based risk (from the screening form)
          const source = pred.overallRisk.source || pred.source || (pred.aiGenerated ? 'ai_assisted' : null);
          const confidence = typeof pred.overallRisk.confidence === 'number' ? pred.overallRisk.confidence : null;
          const predRisk = {
            level: pred.overallRisk.level,
            score: pred.overallRisk.score,
            confidence,
            confidenceLabel: pred.overallRisk.confidenceLabel || pred.confidenceLabel || getEstimateLabel(source, pred.aiGenerated),
            source,
            aiGenerated: pred.aiGenerated,
            explanation: pred.overallRisk.explanation || `Based on your screening on ${new Date(pred.date).toLocaleDateString()}`,
            factors: buildFactorsFromPrediction(pred),
            bmi: pred.input?.bmi || null,
            bmiCategory: pred.input?.bmi ? getBMICategory(pred.input.bmi) : null,
            assessedAt: pred.date
          };
          setRisk(predRisk);
        } else if (riskRes.status === 'fulfilled' && riskRes.value.data.data) {
          setRisk(riskRes.value.data.data);
        }

        // Recommendations
        if (recRes.status === 'fulfilled' && recRes.value.data.data) {
          setRecommendations(recRes.value.data.data);
        } else if (pred && pred.recommendations) {
          // Use inline recommendations from prediction
          setRecommendations(pred.recommendations.map((r, i) => ({
            title: r,
            category: 'general',
            priority: i < 2 ? 'high' : 'medium',
            actions: [],
            icon: '💡'
          })));
        }
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Build dynamic factors from a prediction result
  function buildFactorsFromPrediction(pred) {
    const factors = [];
    const results = pred.results || {};
    const input = pred.input || {};
    const sleepHours = firstProvided(input.sleepHours, input.sleep, 'N/A');
    const workHours = firstProvided(input.workHours, input.work, 'N/A');
    const screenHours = firstProvided(input.screenHours, input.screen);
    const dailyActivityMinutes = firstProvided(input.dailyActivityMinutes, input.daily_activity, input.exerciseMinutes, input.activity);

    if (results.diabetes === 1) {
      factors.push({
        factor: 'Elevated Glucose Risk Signal',
        impact: '+30%',
        detail: `Glucose level ${input.glucose || 'N/A'} mg/dL is above the reference range used for this lifestyle screening. BMI and family history may contribute.`,
        severity: 'high'
      });
    }

    if (results.bp === 1) {
      factors.push({
        factor: 'Elevated Blood Pressure Signal',
        impact: '+25%',
        detail: `Salt intake and stress levels are associated with elevated wellness risk in this screening.`,
        severity: 'high'
      });
    }

    if (results.stress === 1) {
      factors.push({
        factor: 'Elevated Stress',
        impact: '+20%',
        detail: `Sleep ${sleepHours}hrs and work ${workHours}hrs/day pattern shows high stress load.`,
        severity: 'medium'
      });
    }

    // Add positive factors if low risk
    if (results.diabetes === 0) {
      factors.push({
        factor: 'Glucose Levels Normal',
        impact: '-5%',
        detail: `Blood glucose within healthy range. Continue monitoring regularly.`,
        severity: 'low'
      });
    }

    if (results.bp === 0 && results.stress === 0) {
      factors.push({
        factor: 'Blood Pressure and Stress Signals Look Lower',
        impact: '-10%',
        detail: `No elevated blood pressure or chronic stress signal was flagged in this screening.`,
        severity: 'low'
      });
    }

    // Add input-specific factors
    if (screenHours && screenHours > 6) {
      factors.push({
        factor: 'High Screen Time',
        impact: '+8%',
        detail: `${screenHours}hrs of screen time daily — may cause eye strain and sleep disruption.`,
        severity: 'medium'
      });
    }

    if (dailyActivityMinutes && dailyActivityMinutes < 30) {
      factors.push({
        factor: 'Low Physical Activity',
        impact: '+12%',
        detail: `Only ${dailyActivityMinutes} min/day of activity — aim toward 30 minutes daily or 150 minutes weekly.`,
        severity: 'medium'
      });
    }

    return factors;
  }

  function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!risk || !risk.factors || risk.factors.length === 0) {
    return (
      <div className="page-enter" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>No Insights Yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Complete a health screening first to get dynamic AI insights.
        </p>
        <Link to="/health-check" className="btn-primary" style={{ padding: '12px 28px' }}>
          <FiPlusCircle /> Start Screening
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
          <span className="gradient-text">Health Insights</span> 🔍
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          AI-assisted analysis based on your {latestPrediction ? 'latest screening' : 'health data'} — updates automatically with each check.
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {hasModelConfidence(risk) ? 'Model Confidence' : 'Estimate Source'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', textAlign: 'right' }}>
                {hasModelConfidence(risk)
                  ? `${Math.round(Math.min(Math.max(risk.confidence, 0), 1) * 100)}%`
                  : risk.confidenceLabel || getEstimateLabel(risk.source, risk.aiGenerated)}
              </span>
            </div>
            {hasModelConfidence(risk) && (
              <div style={{
                height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', width: `${Math.min(Math.max(risk.confidence, 0), 1) * 100}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--accent-emerald))',
                  borderRadius: '3px', transition: 'width 1s ease-out'
                }} />
              </div>
            )}
          </div>

          {/* Last Updated Info */}
          {risk.assessedAt && (
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Last assessed: {new Date(risk.assessedAt).toLocaleString()}
            </div>
          )}

          {/* EMERGENCY LOCATOR: Triggers when risk is High */}
          {risk.level === 'High' && (
            <EmergencyLocator />
          )}
        </div>

        <div>
          <div className="medical-card" style={{
            padding: '16px 20px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--primary-50)', borderColor: 'var(--border-teal)'
          }}>
            <FiInfo color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--primary)' }}>Explainable screening:</strong> Each factor shows how it may influence your wellness risk estimate.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {risk.factors.map((factor, i) => (
              <div key={i} className="medical-card" style={{
                padding: '20px',
                borderLeft: `3px solid ${getSeverityColor(factor.severity)}`,
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
                    height: '100%', width: `${Math.abs(parseInt(factor.impact))}%`,
                    background: getSeverityColor(factor.severity),
                    borderRadius: '2px', transition: 'width 0.8s ease-out'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RECOMMENDATIONS SECTION ===== */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
              Personalized Recommendations 💡
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Actionable steps based on your lifestyle risk signals — updated after every screening.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {recommendations.slice(0, 6).map((rec, i) => (
              <div key={i} className="medical-card" style={{
                padding: '24px',
                borderTop: `3px solid ${getPriorityColor(rec.priority)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{rec.icon || '💡'}</span>
                    {rec.title}
                  </h4>
                  <span style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                    color: getPriorityColor(rec.priority),
                    background: `${getPriorityColor(rec.priority)}15`,
                    textTransform: 'uppercase'
                  }}>
                    {rec.priority}
                  </span>
                </div>
                {rec.reason && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rec.reason}
                  </p>
                )}
                {rec.actions && rec.actions.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {rec.actions.slice(0, 3).map((action, j) => (
                      <li key={j} style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geospatial Insights Map */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
            Regional Wellness Map 🗺️
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Environmental and community health factors in your vicinity.
          </p>
        </div>
        <HealthMap />
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
