const BMICard = ({ bmi, bmiCategory, height, weight }) => {
  const categoryColors = {
    Underweight: { color: '#1d4ed8', bg: '#dbeafe' },
    Normal: { color: '#065f46', bg: '#d1fae5' },
    Overweight: { color: '#92400e', bg: '#fef3c7' },
    Obese: { color: '#991b1b', bg: '#fee2e2' },
  };

  const c = categoryColors[bmiCategory] || categoryColors.Normal;

  return (
    <div className="medical-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Body Mass Index
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: c.color }}>{bmi}</span>
          <span style={{
            marginLeft: '8px', padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: c.bg, color: c.color, fontSize: '0.78rem', fontWeight: 600
          }}>
            {bmiCategory}
          </span>
        </div>
      </div>

      {/* BMI Scale */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <div style={{
          height: '8px', borderRadius: '4px',
          background: 'linear-gradient(to right, #3b82f6 0%, #10b981 25%, #f59e0b 60%, #ef4444 100%)'
        }} />
        <div style={{
          position: 'absolute',
          left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%`,
          top: '-4px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: 'white', border: `3px solid ${c.color}`,
          transform: 'translateX(-50%)',
          transition: 'left 1s ease-out',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>15</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>40</span>
      </div>

      {height && weight && (
        <div style={{
          display: 'flex', gap: '16px', marginTop: '12px',
          paddingTop: '12px', borderTop: '1px solid var(--border-light)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Height: <strong style={{ color: 'var(--text-primary)' }}>{height}cm</strong>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Weight: <strong style={{ color: 'var(--text-primary)' }}>{weight}kg</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default BMICard;
