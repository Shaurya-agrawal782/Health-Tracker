import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthAPI } from '../services/api';
import { predictAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiEye, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

const statusConfig = {
  completed: { label: 'Completed', class: 'badge-completed', icon: <FiCheckCircle size={12} /> },
  pending: { label: 'Pending', class: 'badge-pending', icon: <FiClock size={12} /> },
  failed: { label: 'Action Required', class: 'badge-action', icon: <FiAlertCircle size={12} /> }
};

const riskColors = {
  Low: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  Medium: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  High: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await predictAPI.getHistory();
        setChecks(res.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  };

  const getRiskSummary = (check) => {
    const { results } = check;
    if (!results) return 'Awaiting analysis';
    const risks = [];
    if (results.diabetes === 1) risks.push('Diabetes');
    if (results.bp === 1) risks.push('Blood Pressure');
    if (results.stress === 1) risks.push('Stress');
    return risks.length > 0 ? `Risk detected: ${risks.join(', ')}` : 'All within normal range.';
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <Link to="/health-check" className="btn-primary" style={{
            padding: '12px 28px',
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <FiPlusCircle size={18} /> Start New Check
          </Link>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Your Recent Health Checks
        </h2>
      </div>

      {checks.length === 0 ? (
        <div className="medical-card animate-fade-in-scale" style={{
          padding: '60px 32px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '40px auto'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏥</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>No Health Checks Yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Start your first health check to get AI-powered predictions for diabetes, blood pressure, and stress.
          </p>
          <Link to="/health-check" className="btn-primary" style={{ padding: '12px 28px' }}>
            <FiPlusCircle /> Start Your First Check
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }} className="stagger-children">
          {checks.map((check, i) => {
            const status = statusConfig[check.status] || statusConfig.completed;
            const risk = riskColors[check.overallRisk?.level] || riskColors.Low;
            
            return (
              <div key={check._id || i} className="medical-card animate-fade-in-up" style={{
                opacity: 0,
                overflow: 'hidden'
              }}>
                {/* Card header */}
                <div style={{
                  padding: '16px 20px',
                  background: 'var(--primary-50)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCalendar size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {formatDate(check.date)}
                    </span>
                  </div>
                  <span className={`badge ${status.class}`} style={{
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {status.icon} {status.label}
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                        {check.checkType || 'Health Screening'}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {getRiskSummary(check)}
                      </p>
                    </div>
                    {check.overallRisk && (
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: risk.bg,
                        color: risk.color,
                        border: `1px solid ${risk.border}`,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        {check.overallRisk.level} Risk
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <Link to={`/results/${check._id}`} className="link-teal" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FiEye size={14} /> View Result
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
