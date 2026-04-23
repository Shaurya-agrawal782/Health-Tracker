const StatCard = ({ title, value, unit, icon, color = 'teal', subtitle }) => {
  const colorMap = {
    teal: { accent: 'var(--primary)', bg: 'var(--primary-50)' },
    purple: { accent: 'var(--accent-purple)', bg: '#ede9fe' },
    blue: { accent: 'var(--accent-blue)', bg: '#dbeafe' },
    amber: { accent: 'var(--accent-amber)', bg: '#fef3c7' },
    coral: { accent: 'var(--accent-coral)', bg: '#fee2e2' },
    emerald: { accent: 'var(--accent-emerald)', bg: '#d1fae5' },
  };

  const c = colorMap[color] || colorMap.teal;

  return (
    <div className={`medical-card glow-${color}`} style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        <div style={{
          width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
          background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.accent
        }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{subtitle}</span>
      )}
    </div>
  );
};

export default StatCard;
