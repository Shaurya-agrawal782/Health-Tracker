const RiskGauge = ({ score, level, explanation }) => {
  const levelColors = {
    Low: { color: '#065f46', bg: '#d1fae5', accent: '#10b981' },
    Medium: { color: '#92400e', bg: '#fef3c7', accent: '#f59e0b' },
    High: { color: '#991b1b', bg: '#fee2e2', accent: '#ef4444' },
    Unknown: { color: '#64748b', bg: '#f1f5f9', accent: '#94a3b8' }
  };

  const c = levelColors[level] || levelColors.Unknown;
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="medical-card" style={{ padding: '24px', textAlign: 'center' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Health Risk Score
      </h3>

      <div className="circular-progress" style={{ width: '120px', height: '120px', margin: '0 auto 16px' }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={c.accent} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="progress-text" style={{ color: c.color }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{score}</div>
        </div>
      </div>

      <span className={`badge risk-${level.toLowerCase()}`} style={{
        padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600
      }}>
        {level} Risk
      </span>

      {explanation && (
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.5
        }}>
          {explanation}
        </p>
      )}
    </div>
  );
};

export default RiskGauge;
