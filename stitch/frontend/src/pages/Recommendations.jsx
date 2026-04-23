import { useEffect, useState } from 'react';
import { recommendationAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { FiPlusCircle } from 'react-icons/fi';

const priorityConfig = {
  high: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  medium: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  low: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
};

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [riskLevel, setRiskLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await recommendationAPI.getAll();
        setRecommendations(res.data.data || []);
        setRiskLevel(res.data.riskLevel);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
          <span className="gradient-text">Wellness Recommendations</span> 💚
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Personalized health advice based on your latest data and risk profile.
        </p>
        {riskLevel && (
          <span className={`badge risk-${riskLevel.toLowerCase()}`} style={{ marginTop: '8px', display: 'inline-block' }}>
            Current Risk Level: {riskLevel}
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="medical-card" style={{ padding: '60px 32px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💡</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>No Recommendations Yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Log your health data to receive personalized recommendations.
          </p>
          <Link to="/health-input" className="btn-primary" style={{ padding: '12px 28px' }}>
            <FiPlusCircle /> Log Health Data
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }} className="stagger-children">
          {recommendations.map((rec, i) => {
            const p = priorityConfig[rec.priority] || priorityConfig.low;
            return (
              <div key={i} className="medical-card animate-fade-in-up" style={{
                padding: '24px', opacity: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{rec.icon || '💡'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{rec.title}</h3>
                      <span style={{
                        padding: '2px 10px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem', fontWeight: 600,
                        background: p.bg, color: p.color, border: `1px solid ${p.border}`,
                        textTransform: 'uppercase'
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {rec.reason}
                    </p>
                    <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                      {rec.category}
                    </span>
                  </div>
                </div>

                {rec.actions && rec.actions.length > 0 && (
                  <div style={{
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '12px'
                  }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Action Steps:
                    </p>
                    <ul style={{
                      listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                      {rec.actions.map((action, j) => (
                        <li key={j} style={{
                          fontSize: '0.82rem', color: 'var(--text-secondary)',
                          display: 'flex', alignItems: 'flex-start', gap: '8px',
                          padding: '4px 0'
                        }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'var(--primary-50)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)',
                            flexShrink: 0
                          }}>
                            {j + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
