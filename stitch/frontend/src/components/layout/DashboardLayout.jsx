import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiCheckCircle, FiShoppingBag, FiZap, FiList, FiTrendingUp, FiAward, FiShield, FiLogOut, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import AIAssistant from '../common/AIAssistant';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { path: '/dashboard',       label: 'Dashboard',        icon: <FiGrid size={16} /> },
    { path: '/health-check',    label: 'Wellness Check',   icon: <FiCheckCircle size={16} /> },
    { path: '/meal-planner',    label: 'Meal Planner',     icon: <FiShoppingBag size={16} /> },
    { path: '/recommendations', label: 'Daily Actions',    icon: <FiZap size={16} /> },
    { path: '/habits',          label: 'Habits',           icon: <FiList size={16} /> },
    { path: '/history',         label: 'Progress',         icon: <FiTrendingUp size={16} /> },
    { path: '/leaderboard',     label: 'Wellness Streaks', icon: <FiAward size={16} /> },
    { path: '/privacy',         label: 'Privacy',          icon: <FiShield size={16} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Floating Header */}
      <header style={{
        padding: '14px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #f1f5f9',
        marginBottom: '32px',
        boxShadow: '0 2px 15px rgba(0,0,0,0.03)'
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{
          textDecoration: 'none',
          fontSize: '1.3rem',
          color: 'var(--primary)',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-emerald))',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
          }}>V</div>
          <span className="gradient-text">VitalIQ Health</span>
        </Link>

        {/* Center: Premium Nav Pill */}
        <nav style={{
          display: 'flex',
          gap: '2px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          padding: '5px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 25px rgba(13, 148, 136, 0.15)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }} className="dash-nav-desktop">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.88)',
                background: isActive ? 'white' : 'transparent',
                transition: 'all var(--transition-base)',
                boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap'
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: User section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="dash-welcome-text">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Wellness Member
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#f1f5f9',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'var(--transition-fast)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
              onClick={() => setShowDropdown(!showDropdown)}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FiUser size={18} />
            </button>

            {showDropdown && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                minWidth: '220px',
                padding: '8px',
                zIndex: 110,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid #f1f5f9',
                animation: 'fadeInUp 0.2s ease-out'
              }}>
                <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <button
                  onClick={() => { logout(); setShowDropdown(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <FiLogOut size={16} /> Sign Out
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
        padding: '0 40px 40px 40px',
        flex: 1,
        width: '100%'
      }}>
        <Outlet />
      </main>

      <AIAssistant />

      <style>{`
        @media (max-width: 1100px) {
          .dash-nav-desktop { gap: 1px !important; }
          .dash-nav-desktop a { padding: 6px 9px !important; font-size: 0.72rem !important; }
        }
        @media (max-width: 900px) {
          .dash-nav-desktop { display: none !important; }
          .dash-welcome-text { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
