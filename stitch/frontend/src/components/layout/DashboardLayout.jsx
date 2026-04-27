import { Outlet, Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiPlusCircle, FiBarChart2, FiHeart, FiClock, FiLogOut, FiBell, FiUser, FiActivity } from 'react-icons/fi';
import { useState } from 'react';
import AIAssistant from '../common/AIAssistant';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: <FiHome size={18} /> },
    { path: '/health-check', label: 'Screening', icon: <FiPlusCircle size={18} /> },
    { path: '/insights', label: 'Insights', icon: <FiHeart size={18} /> },
    { path: '/meal-planner', label: 'Meal Plan', icon: <FiActivity size={18} /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <FiBarChart2 size={18} /> },
    { path: '/history', label: 'History', icon: <FiClock size={18} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Glass Header */}
      <header className="glass-panel" style={{
        padding: '12px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        marginBottom: '32px'
      }}>
        <Link to="/dashboard" style={{
          textDecoration: 'none',
          fontSize: '1.4rem',
          color: 'var(--primary)',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-emerald))',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
          }}>V</div>
          <span className="gradient-text">VitalIQ</span>
        </Link>

        {/* Center: Nav links */}
        <nav style={{ display: 'flex', gap: '8px' }} className="dash-nav-desktop">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-50)' : 'transparent',
                transition: 'var(--transition-fast)',
                border: isActive ? '1px solid var(--primary-100)' : '1px solid transparent'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: User section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="dash-welcome-text">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Pro Member
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button style={{
              width: '42px',
              height: '42px',
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
              <FiUser size={20} />
            </button>

            {showDropdown && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                minWidth: '220px',
                padding: '8px',
                zIndex: 110,
                animation: 'fadeInUp 0.3s ease-out'
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
        .nav-link:hover {
          color: var(--primary) !important;
          background: var(--primary-50) !important;
        }
        @media (max-width: 768px) {
          .dash-nav-desktop { display: none !important; }
          .dash-welcome-text { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
