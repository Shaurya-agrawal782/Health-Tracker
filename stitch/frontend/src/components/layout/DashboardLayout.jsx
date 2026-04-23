import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiPlusCircle, FiBarChart2, FiHeart, FiClock, FiLogOut, FiBell, FiUser } from 'react-icons/fi';
import { useState } from 'react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: <FiHome size={16} /> },
    { path: '/health-check', label: 'New Check', icon: <FiPlusCircle size={16} /> },
    { path: '/insights', label: 'Insights', icon: <FiBarChart2 size={16} /> },
    { path: '/history', label: 'History', icon: <FiClock size={16} /> },
    { path: '/recommendations', label: 'Wellness', icon: <FiHeart size={16} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Header Bar */}
      <header style={{
        background: 'var(--primary)',
        color: 'white',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }} className="animate-slide-in-down">
        {/* Left: Logo */}
        <Link to="/dashboard" style={{
          textDecoration: 'none',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 800,
          letterSpacing: '-0.3px'
        }}>
          Stitch Dashboard
        </Link>

        {/* Center: Nav links */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }} className="dash-nav-desktop">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 500,
              textDecoration: 'none',
              color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)',
              background: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all var(--transition-base)'
            }}
              onMouseEnter={e => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={e => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: User section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }} className="dash-welcome-text">
            Welcome, {user?.name?.split(' ')[0]}
          </span>

          <button style={{
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            transition: 'all var(--transition-fast)',
            position: 'relative'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <FiBell size={16} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid var(--primary)'
            }} />
          </button>

          <div style={{ position: 'relative' }}>
            <button style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all var(--transition-fast)'
            }}
              onClick={() => setShowDropdown(!showDropdown)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <FiUser size={16} />
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                background: 'white',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)',
                minWidth: '180px',
                overflow: 'hidden',
                zIndex: 100
              }} className="animate-fade-in-scale">
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  {user?.email}
                </div>
                <Link to="/dashboard" style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  transition: 'background var(--transition-fast)'
                }}
                  onClick={() => setShowDropdown(false)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Profile
                </Link>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--accent-coral)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  transition: 'background var(--transition-fast)'
                }}
                  onClick={() => { logout(); setShowDropdown(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <FiLogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '28px 24px'
      }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .dash-nav-desktop { display: none !important; }
          .dash-welcome-text { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
