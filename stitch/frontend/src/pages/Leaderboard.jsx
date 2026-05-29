import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward, FiUsers, FiStar, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import EmptyState from '../components/common/EmptyState';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await authAPI.getLeaderboard();
        setLeaders(res.data.data);
      } catch (err) {
        console.error('Failed to fetch wellness streaks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Retrieving leaderboard streaks...
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Calculating community consistency rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
          <span className="gradient-text">Global Wellness Streaks</span> 🏆
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Celebrate consistency with the VitalIQ Health community and earn rewards for wellness tracking.
        </p>
      </div>

      {/* Privacy Note */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.85rem',
        color: '#065f46',
        fontWeight: 500
      }}>
        <FiShield size={18} style={{ flexShrink: 0, color: '#10b981' }} />
        <span>🔒 Wellness Streaks highlights consistency using privacy-safe display names. Personal health data is never shown here.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        
        {/* Table Area */}
        <div className="medical-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>POSITION</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>USER</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>WELLNESS POINTS</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>STREAK</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>BADGE</th>
              </tr>
            </thead>
            <tbody>
              {leaders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px' }}>
                    <EmptyState
                      title="Streak board is currently loading or empty"
                      description="No consistency data recorded yet. Complete today's wellness check or log your habits to join the board!"
                      icon="🏆"
                      primaryActionLabel="Start Wellness Check"
                      primaryActionTo="/health-check"
                    />
                  </td>
                </tr>
              ) : (
                leaders.map((leader, idx) => (
                <tr key={idx} style={{ 
                  borderBottom: '1px solid #f1f5f9',
                  background: leader.isUser ? '#f0fdfa' : 'transparent',
                  fontWeight: leader.isUser ? 700 : 400
                }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: idx < 3 ? 'var(--primary-light)' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: idx < 3 ? 'var(--primary)' : '#64748b'
                    }}>
                      {leader.position}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiUsers color="#64748b" />
                      </div>
                      <span>{leader.displayName} {leader.isUser && '(You)'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontWeight: 800, color: 'var(--primary)' }}>
                    {(leader.wellnessPoints || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                      <FiTrendingUp /> {leader.streak} Days
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
                      background: leader.badge === 'Elite' ? '#fef3c7' : leader.badge === 'Expert' ? '#dbeafe' : '#f1f5f9',
                      color: leader.badge === 'Elite' ? '#92400e' : leader.badge === 'Expert' ? '#1e40af' : '#475569'
                    }}>
                      {leader.badge}
                    </span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sidebar: Your Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!user || !user.currentStreak || user.currentStreak === 0 ? (
            <EmptyState
              title="Build your first streak"
              description="Complete daily actions or habits to start a wellness streak."
              icon="🏆"
              primaryActionLabel="Start Daily Actions"
              primaryActionTo="/daily-actions"
            />
          ) : (
            <div className="medical-card" style={{ 
              padding: '32px', 
              background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
              color: 'white',
              textAlign: 'center'
            }}>
              <FiAward size={48} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>
                Position #{leaders.find(l => l.isUser)?.position || 'N/A'}
              </h3>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '24px' }}>
                {leaders.find(l => l.isUser)?.position <= 3 ? 
                  "Incredible! You're among the top wellness leaders." : 
                  "Keep logging your health data to maintain your wellness consistency!"}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Wellness Points</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{user?.points || 0}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Streak</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{user?.currentStreak || 0}</div>
                </div>
              </div>
            </div>
          )}

          <div className="medical-card" style={{ padding: '24px' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiStar color="#f59e0b" /> Reward Tiers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>Elite (4000+ pts)</span>
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Monthly Pro Subscription</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>Expert (3000+ pts)</span>
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Exclusive AI Meal Plans</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                <span style={{ fontSize: '0.85rem' }}>Pro (1000+ pts)</span>
                <span style={{ fontSize: '0.75rem' }}>Basic Insights</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
