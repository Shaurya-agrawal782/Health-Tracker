import { FiList, FiDroplet, FiMoon, FiActivity, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const habitCards = [
  { icon: FiDroplet, label: 'Hydration', target: '8 glasses / day', color: '#0ea5e9', bg: '#f0f9ff', sample: '0 / 8 logged' },
  { icon: FiMoon,    label: 'Sleep',     target: '7–9 hours',        color: '#8b5cf6', bg: '#f5f3ff', sample: '0 hrs tracked' },
  { icon: FiActivity,label: 'Movement',  target: '30 min activity',  color: '#10b981', bg: '#f0fdf4', sample: '0 min logged' },
  { icon: FiZap,     label: 'Energy',    target: 'Low stress day',   color: '#f59e0b', bg: '#fffbeb', sample: 'Not rated' },
];

const Habits = () => {
  return (
    <div className="page-enter">
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0d9488, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(13,148,136,0.25)'
          }}>
            <FiList size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2px' }}>
              <span className="gradient-text">Habit Tracking</span> ✅
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Build daily wellness habits that stick — sleep, hydration, movement, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div style={{
        padding: '24px 28px',
        marginBottom: '36px',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
        border: '1.5px dashed #6ee7b7',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <span style={{ fontSize: '2.4rem', lineHeight: 1, flexShrink: 0 }}>🚀</span>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46', marginBottom: '6px' }}>
            Habit Tracking — Coming Soon
          </h2>
          <p style={{ color: '#047857', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '12px' }}>
            Full daily habit tracker is on its way! You'll be able to check off water intake, sleep goals, movement minutes, and custom wellness habits — right from your daily routine.
          </p>
          <p style={{ color: '#065f46', fontSize: '0.85rem', fontWeight: 600 }}>
            In the meantime, start logging your daily wellness data to build consistency and earn Wellness Streaks. 💚
          </p>
          <div style={{ marginTop: '16px' }}>
            <Link
              to="/health-check"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 22px', borderRadius: '12px',
                background: '#0d9488', color: 'white',
                textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(13,148,136,0.2)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FiZap size={16} /> Start Wellness Check
            </Link>
          </div>
        </div>
      </div>

      {/* Placeholder Habit Cards */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Preview: Daily Habit Modules
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}>
          {habitCards.map(({ icon: Icon, label, target, color, bg, sample }) => (
            <div key={label} className="medical-card" style={{
              padding: '24px',
              opacity: 0.7,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Coming Soon overlay badge */}
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: '999px',
                background: '#f1f5f9', color: '#94a3b8', letterSpacing: '0.5px'
              }}>
                Soon
              </div>

              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '16px'
              }}>
                <Icon size={22} color={color} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{label}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Target: {target}
              </p>
              <div style={{
                height: '8px', borderRadius: '999px',
                background: '#e2e8f0', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', width: '0%',
                  background: color, borderRadius: '999px',
                  transition: 'width 0.6s ease'
                }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {sample}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Habits;
