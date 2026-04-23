import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid, FiPlusCircle, FiTrendingUp,
  FiHeart, FiAward, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/health-input', label: 'Log Data', icon: FiPlusCircle },
  { path: '/insights', label: 'Insights', icon: FiTrendingUp },
  { path: '/recommendations', label: 'Recommendations', icon: FiHeart },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      <aside style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        bottom: 0,
        width: collapsed ? '72px' : '240px',
        background: 'rgba(10, 14, 26, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-base)',
        zIndex: 90,
        overflowX: 'hidden'
      }}
        className="sidebar-desktop"
      >
        {/* Toggle button */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute',
          top: '24px',
          right: '-14px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all var(--transition-base)'
        }}>
          {collapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
        </button>

        {/* Nav Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '0 12px',
          marginTop: '20px'
        }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '12px 14px' : '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 212, 170, 0.2)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  justifyContent: collapsed ? 'center' : 'flex-start'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom section */}
        {!collapsed && (
          <div style={{
            marginTop: 'auto',
            padding: '16px',
            margin: '0 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-card)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FiAward size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-amber)' }}>ML-Ready</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Architecture designed for seamless ML model integration
            </p>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10, 14, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'none',
        justifyContent: 'space-around',
        padding: '8px 0',
        zIndex: 90
      }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)',
                fontSize: '0.65rem',
                padding: '4px 8px'
              }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
