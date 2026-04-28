import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward, FiUsers, FiStar, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

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
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
          <span className="gradient-text">Global Wellness Leaderboard</span> 🏆
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Compete with the VitalIQ community and earn rewards for consistent health tracking.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        
        {/* Table Area */}
        <div className="medical-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>RANK</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>USER</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>SCORE</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>STREAK</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>LEVEL</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, idx) => (
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
                      {leader.rank}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiUsers color="#64748b" />
                      </div>
                      <span>{leader.name} {leader.isUser && '(You)'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontWeight: 800, color: 'var(--primary)' }}>
                    {leader.points.toLocaleString()}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                      <FiTrendingUp /> {leader.streak} Days
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
                      background: leader.level === 'Elite' ? '#fef3c7' : '#f1f5f9',
                      color: leader.level === 'Elite' ? '#92400e' : '#475569'
                    }}>
                      {leader.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar: Your Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="medical-card" style={{ 
            padding: '32px', 
            background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <FiAward size={48} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>
              Global Rank #{leaders.find(l => l.isUser)?.rank || 'N/A'}
            </h3>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '24px' }}>
              {leaders.find(l => l.isUser)?.rank <= 3 ? 
                "Incredible! You're among the top wellness leaders." : 
                "Keep logging your health data to climb the leaderboard!"}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', flex: 1 }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Points</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{user?.points || 1200}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', flex: 1 }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Streak</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{user?.currentStreak || 3}</div>
              </div>
            </div>
          </div>

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
