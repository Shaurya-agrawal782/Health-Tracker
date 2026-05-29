import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiGrid, FiCheckCircle, FiShoppingBag, FiZap, FiList, 
  FiTrendingUp, FiAward, FiShield, FiLogOut, FiUser, 
  FiCalendar, FiTarget, FiMenu, FiX, FiChevronDown 
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import AIAssistant from '../common/AIAssistant';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close all dropdowns & drawers on route changes
  useEffect(() => {
    setShowDropdown(false);
    setShowMoreDropdown(false);
    setShowMoreMenu(false);
  }, [location.pathname]);

  const allNavItems = [
    { path: '/dashboard',       label: 'Dashboard',        icon: <FiGrid size={15} /> },
    { path: '/health-check',    label: 'Wellness Check',   icon: <FiCheckCircle size={15} /> },
    { path: '/meal-planner',    label: 'Meal Planner',     icon: <FiShoppingBag size={15} /> },
    { path: '/daily-actions',   label: 'Daily Actions',    icon: <FiZap size={15} /> },
    { path: '/habits',          label: 'Habits',           icon: <FiList size={15} /> },
    { path: '/progress',        label: 'Progress',         icon: <FiTrendingUp size={15} /> },
    { path: '/weekly-checkin',  label: 'Weekly Check-in',  icon: <FiCalendar size={15} /> },
    { path: '/recommendations', label: 'Recommendations',  icon: <FiTarget size={15} /> },
    { path: '/leaderboard',     label: 'Wellness Streaks', icon: <FiAward size={15} /> },
    { path: '/privacy',         label: 'Privacy',          icon: <FiShield size={15} /> },
    { path: '/profile',         label: 'Profile',          icon: <FiUser size={15} /> },
  ];

  const isGuest = user?.isGuest || user?.role === 'guest' || user?.isMockGoogle || user?.role === 'demo';
  const firstName = isGuest ? 'Guest' : (user?.name?.split(' ')[0] || 'User');

  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Desktop: 5 primary links. Tablet: 4 primary links.
  const desktopPrimaryPaths = ['/dashboard', '/health-check', '/meal-planner', '/habits', '/progress'];
  const tabletPrimaryPaths = ['/dashboard', '/health-check', '/meal-planner', '/habits'];
  const activePrimaryPaths = isTablet ? tabletPrimaryPaths : desktopPrimaryPaths;

  const primaryItems = allNavItems.filter(item => activePrimaryPaths.includes(item.path));
  const secondaryItems = allNavItems.filter(item => !activePrimaryPaths.includes(item.path));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Product Header */}
      <header style={{
        padding: '0 32px',
        height: '76px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{
          textDecoration: 'none',
          fontSize: '1.25rem',
          color: 'var(--primary)',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
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
            fontWeight: 900,
            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.25)'
          }}>V</div>
          <span className="gradient-text">VitalIQ Health</span>
        </Link>

        {/* Center: Premium Nav Pill (Desktop/Tablet) */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'center',
        }} className="dash-nav-desktop" aria-label="Primary navigation">
          {primaryItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                transition: 'all var(--transition-base)',
                whiteSpace: 'nowrap'
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions & User section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* More menu dropdown button (Desktop/Tablet) */}
          <div style={{ position: 'relative' }} className="dash-nav-desktop">
            <button
              aria-label="More navigation options"
              aria-expanded={showMoreDropdown}
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: showMoreDropdown ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => { if(!showMoreDropdown) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'; }}
              onMouseLeave={e => { if(!showMoreDropdown) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>More</span>
              <span style={{ display: 'flex', alignItems: 'center', transform: showMoreDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <FiChevronDown size={14} />
              </span>
            </button>

            {showMoreDropdown && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} 
                  onClick={() => setShowMoreDropdown(false)} 
                />
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  minWidth: '200px',
                  padding: '8px',
                  zIndex: 110,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  animation: 'fadeInUp 0.2s ease-out'
                }}>
                  {secondaryItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMoreDropdown(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(13, 148, 136, 0.06)' : 'transparent',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'var(--transition-fast)'
                      })}
                      onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User profile compact pill */}
          <div style={{ position: 'relative' }}>
            <button
              aria-label="User profile menu"
              aria-expanded={showDropdown}
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 6px',
                borderRadius: '9999px',
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-emerald))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)'
              }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }} className="dash-welcome-text">
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>
                  {firstName}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1' }}>
                  {isGuest ? 'Guest User' : 'Member'}
                </span>
              </div>
              <FiChevronDown size={14} style={{ color: '#64748b', marginLeft: '2px' }} />
            </button>

            {showDropdown && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  minWidth: '220px',
                  padding: '8px',
                  zIndex: 110,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  animation: 'fadeInUp 0.2s ease-out'
                }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name || 'Guest User'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || 'guest@vitaliq.health'}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiUser size={16} /> My Profile & Preferences
                  </Link>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main-content">
        <Outlet />
      </main>

      {/* Responsive Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <NavLink to="/dashboard" className="mobile-nav-item">
          <span className="mobile-nav-icon"><FiGrid /></span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/health-check" className="mobile-nav-item">
          <span className="mobile-nav-icon"><FiCheckCircle /></span>
          <span>Check</span>
        </NavLink>
        <NavLink to="/meal-planner" className="mobile-nav-item">
          <span className="mobile-nav-icon"><FiShoppingBag /></span>
          <span>Meals</span>
        </NavLink>
        <NavLink to="/habits" className="mobile-nav-item">
          <span className="mobile-nav-icon"><FiList /></span>
          <span>Habits</span>
        </NavLink>
        <button 
          aria-label="More menu"
          onClick={() => setShowMoreMenu(true)} 
          className={`mobile-nav-item ${showMoreMenu ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: showMoreMenu ? 'var(--primary)' : '#64748b' }}
        >
          <span className="mobile-nav-icon"><FiMenu /></span>
          <span>More</span>
        </button>
      </div>

      {/* Drawer Overlay for "More" Menu */}
      {showMoreMenu && (
        <div className="more-overlay-drawer" onClick={() => setShowMoreMenu(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>More Health Actions</span>
              <button 
                aria-label="Close more menu"
                onClick={() => setShowMoreMenu(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="drawer-grid">
              {[
                { path: '/daily-actions',   label: 'Daily Actions',    icon: <FiZap size={18} /> },
                { path: '/weekly-checkin',  label: 'Weekly Check-in',  icon: <FiCalendar size={18} /> },
                { path: '/progress',        label: 'Progress',         icon: <FiTrendingUp size={18} /> },
                { path: '/recommendations', label: 'Recommendations', icon: <FiTarget size={18} /> },
                { path: '/leaderboard',     label: 'Streaks',          icon: <FiAward size={18} /> },
                { path: '/profile',         label: 'Profile',          icon: <FiUser size={18} /> },
                { path: '/privacy',         label: 'Privacy',          icon: <FiShield size={18} /> },
                { isAction: true,           label: 'Sign Out',         icon: <FiLogOut size={18} />, onClick: () => { logout(); setShowMoreMenu(false); } }
              ].map(item => (
                item.isAction ? (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="drawer-item"
                    style={{
                      border: '1px solid #fee2e2',
                      background: '#fff5f5',
                      color: '#ef4444',
                      width: '100%'
                    }}
                  >
                    <span className="drawer-item-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`drawer-item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <span className="drawer-item-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      <AIAssistant />

      <style>{`
        .dash-main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px 40px 40px;
          flex: 1;
          width: 100%;
        }
        @media (max-width: 1023px) {
          .dash-welcome-text { display: none !important; }
        }
        @media (max-width: 767px) {
          .dash-nav-desktop { display: none !important; }
          .dash-main-content {
            padding: 0 16px 80px 16px !important;
          }
          header {
            padding: 0 16px !important;
            margin-bottom: 16px !important;
            height: 64px !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;

