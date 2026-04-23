import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { predictAPI } from '../services/api';
import { FiEye, FiDownload, FiSearch, FiCalendar } from 'react-icons/fi';

const typeColors = {
  'Screening': { bg: '#dbeafe', color: '#1d4ed8' },
  'Routine Check': { bg: '#d1fae5', color: '#065f46' },
  'Lab Result': { bg: '#d1fae5', color: '#065f46' },
  'Consultation': { bg: '#ffedd5', color: '#c2410c' },
  'Follow-up': { bg: '#dbeafe', color: '#1d4ed8' },
};

const filterTabs = ['All', 'Screening', 'Routine Check', 'Lab Result', 'Consultation', 'Follow-up'];

const MedicalHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const loadData = async () => {
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
    loadData();
  }, [activeFilter, page]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  };

  const getRiskSummary = (check) => {
    const { results } = check;
    if (!results) return 'Awaiting analysis';
    const risks = [];
    if (results.diabetes === 1) risks.push('Diabetes risk detected');
    if (results.bp === 1) risks.push('High BP risk detected');
    if (results.stress === 1) risks.push('High stress detected');
    return risks.length > 0 ? risks.join('. ') + '.' : 'All indicators within normal range.';
  };

  const filteredPredictions = predictions.filter(p => {
    if (!searchQuery) return true;
    const summary = getRiskSummary(p).toLowerCase();
    return summary.includes(searchQuery.toLowerCase()) || 
           (p.checkType || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Medical History
        </h1>
      </div>

      {/* Filters & Search */}
      <div className="medical-card" style={{
        padding: '16px 20px',
        marginBottom: '24px',
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
        <div className="medical-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No Records Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {activeFilter !== 'All' ? `No ${activeFilter} records found.` : 'Start a health check to create your medical history.'}
          </p>
          <Link to="/health-check" className="btn-primary" style={{ padding: '10px 24px' }}>
            Start Health Check
          </Link>
        </div>
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
                  <tr key={check._id || i} className="animate-fade-in-up" style={{ opacity: 0 }}>
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
    </div>
  );
};

export default MedicalHistory;
