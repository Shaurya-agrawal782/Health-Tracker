import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { predictAPI, weeklyCheckinAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiEye, FiDownload, FiSearch, FiCalendar, FiLock, FiLogIn, 
  FiUserPlus, FiTrendingUp, FiInfo, FiActivity, FiArrowRight 
} from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const typeColors = {
  'Screening': { bg: '#dbeafe', color: '#1d4ed8' },
  'Routine Check': { bg: '#d1fae5', color: '#065f46' },
  'Lab Result': { bg: '#d1fae5', color: '#065f46' },
  'Consultation': { bg: '#ffedd5', color: '#c2410c' },
  'Follow-up': { bg: '#dbeafe', color: '#1d4ed8' },
};

const filterTabs = ['All', 'Screening', 'Routine Check', 'Lab Result', 'Consultation', 'Follow-up'];

const MedicalHistory = () => {
  const { user } = useAuth();
  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  
  // Weekly Check-in state
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [loadingWeekly, setLoadingWeekly] = useState(true);

  // Predictions history state
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchWeeklyTrend = async () => {
      setLoadingWeekly(true);
      try {
        if (isGuest) {
          const guestCheckinsStr = localStorage.getItem('vitaliq_weekly_checkins');
          if (guestCheckinsStr) {
            setWeeklyCheckins(JSON.parse(guestCheckinsStr));
          }
        } else {
          const res = await weeklyCheckinAPI.getAll();
          if (res.data?.success) {
            setWeeklyCheckins(res.data.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to load weekly check-ins for trend:', err);
      } finally {
        setLoadingWeekly(false);
      }
    };

    fetchWeeklyTrend();
  }, [isGuest]);

  const loadPredictions = async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await predictAPI.getHistory({ page, type: activeFilter });
      setPredictions(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [activeFilter, page, isGuest]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  };

  const getRiskSummary = (check) => {
    const { results } = check;
    if (!results) return 'Awaiting screening';
    const risks = [];
    if (results.diabetes === 1) risks.push('Elevated glucose-related wellness signal');
    if (results.bp === 1) risks.push('Elevated blood-pressure-related wellness signal');
    if (results.stress === 1) risks.push('Elevated stress-related wellness signal');
    return risks.length > 0 ? risks.join('. ') + '.' : 'No elevated wellness signals flagged.';
  };

  const filteredPredictions = predictions.filter(p => {
    if (!searchQuery) return true;
    const summary = getRiskSummary(p).toLowerCase();
    return summary.includes(searchQuery.toLowerCase()) || 
           (p.checkType || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate statistics
  const latestCheckin = weeklyCheckins[0];
  const averageScore = weeklyCheckins.length > 0
    ? Math.round(weeklyCheckins.reduce((acc, curr) => acc + curr.weeklyScore, 0) / weeklyCheckins.length)
    : 0;

  // Prepare chart data (reverse to chronological order)
  const chartData = [...weeklyCheckins]
    .reverse()
    .map(item => ({
      ...item,
      dateStr: new Date(item.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

  const CheckinTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: '0.8rem'
        }}>
          <p style={{ fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Week of {new Date(data.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
          <p style={{ color: 'var(--primary)', fontWeight: 700, margin: '0 0 4px 0' }}>
            Wellness Score: <span style={{ fontSize: '1rem', fontWeight: 900 }}>{data.weeklyScore}</span>/100
          </p>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.75rem' }}>
            Status: <strong>{data.status}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="gradient-text">Wellness Progress & History</span> <FiTrendingUp color="var(--primary)" />
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
          Track your lifestyle consistency trends and view previous wellness screening records.
        </p>
      </div>

      {/* Weekly Wellness Score Trend Chart */}
      <div className="medical-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Weekly Reflection Trends
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            A composite score tracking your sleep quality, energy levels, stress management, meals, activity, and screen balance.
          </p>
        </div>

        {loadingWeekly ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : weeklyCheckins.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '36px 0', border: '2.5px dashed var(--border-light)', borderRadius: '16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <FiActivity size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px', maxWidth: '280px', lineHeight: 1.4 }}>
              Start logging your weekly lifestyle reflection check-in to build a wellness trend graph.
            </p>
            <Link to="/weekly-checkin" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
              Complete Weekly Check-in
            </Link>
          </div>
        ) : (
          <div>
            {/* Recharts Chart */}
            <div style={{ width: '100%', height: '260px', marginTop: '8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip content={<CheckinTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="weeklyScore" 
                    name="Wellness Score" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    dot={{ fill: 'white', stroke: 'var(--primary)', strokeWidth: 2, r: 5 }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Score Summary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Latest Score</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  {latestCheckin.weeklyScore} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                <span style={{
                  display: 'inline-block',
                  background: latestCheckin.status === 'Consistent' ? '#ecfdf5' : latestCheckin.status === 'Improving' ? '#f0fdfa' : latestCheckin.status === 'Getting started' ? '#fef3c7' : '#fef2f2',
                  color: latestCheckin.status === 'Consistent' ? '#059669' : latestCheckin.status === 'Improving' ? '#0d9488' : latestCheckin.status === 'Getting started' ? '#d97706' : '#dc2626',
                  padding: '2px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, marginTop: '6px'
                }}>
                  {latestCheckin.status}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Score</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  {averageScore} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
                  Calculated over {weeklyCheckins.length} check-in sessions
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Link to="/weekly-checkin" className="btn-ghost" style={{ fontSize: '0.82rem', fontWeight: 700, textAlign: 'center', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '12px' }}>
                  Complete New Reflection
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guest Role Bypass & Lock Presentation */}
      {isGuest ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Info disclaimer */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '16px 20px',
            color: '#b45309', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '10px'
          }}>
            <FiInfo size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Guest reflections are local:</strong> Your check-in history is preserved in this browser only. Register a free account to sync scores securely and unlock structured wellness screening reports!
            </div>
          </div>

          {/* Guest Empty State Card */}
          <EmptyState
            title="Guest results are not saved permanently. Sign in to save your wellness history."
            icon="🔒"
            primaryActionLabel="Create Account"
            primaryActionTo="/register"
            secondaryActionLabel="Start Wellness Check"
            secondaryActionTo="/health-check"
          />
        </div>
      ) : (
        /* Authenticated Users see full History and filters */
        <>
          {/* Filters & Search */}
          <div className="medical-card" style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(tab); setPage(1); }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '220px', padding: '8px 12px 8px 36px' }}
              />
              <FiSearch style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} size={14} />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : filteredPredictions.length === 0 ? (
            <EmptyState
              title="Your wellness history will appear here after your first check."
              description={activeFilter !== 'All' ? `No previous logs found matching the filter: ${activeFilter}` : "Start your wellness screening journey to view historic records."}
              icon="📋"
              primaryActionLabel="Start Wellness Check"
              primaryActionTo="/health-check"
            />
          ) : (
            <div className="medical-card" style={{ overflow: 'hidden' }}>
              <table className="medical-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Summary</th>
                    <th>Risk</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="stagger-children">
                  {filteredPredictions.map((check, i) => {
                    const typeStyle = typeColors[check.checkType] || typeColors['Screening'];
                    const riskLevel = check.overallRisk?.level || 'Low';
                    
                    return (
                      <tr key={check._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiCalendar size={13} color="var(--text-muted)" />
                            {formatDate(check.date)}
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: typeStyle.bg,
                            color: typeStyle.color
                          }}>
                            {check.checkType || 'Screening'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '300px', color: 'var(--text-secondary)' }}>
                          {getRiskSummary(check)}
                        </td>
                        <td>
                          <span className={`badge risk-${riskLevel.toLowerCase()}`} style={{
                            padding: '4px 12px'
                          }}>
                            {riskLevel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <Link to={`/results/${check._id}`} className="link-teal" style={{
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                              <FiEye size={13} /> View
                            </Link>
                            <button className="link-teal" style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px',
                              fontFamily: 'inherit'
                            }}>
                              <FiDownload size={13} /> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid var(--border-light)'
                }}>
                  {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: '32px', height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      border: p === page ? 'none' : '1px solid var(--border-light)',
                      background: p === page ? 'var(--primary)' : 'white',
                      color: p === page ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      fontFamily: 'inherit'
                    }}>
                      {p}
                    </button>
                  ))}
                  {pagination.pages > 5 && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>...</span>
                      <button onClick={() => setPage(pagination.pages)} style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        background: 'white',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}>
                        Next
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MedicalHistory;
