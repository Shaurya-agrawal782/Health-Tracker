import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthAPI, predictAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  FiPlusCircle, FiEye, FiCalendar, FiClock, FiCheckCircle, 
  FiAlertCircle, FiActivity, FiZap, FiDownload, FiTarget, FiArrowRight 
} from 'react-icons/fi';
import HealthChart from '../components/dashboard/HealthChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [checksRes, summaryRes] = await Promise.all([
          predictAPI.getHistory(),
          healthAPI.getSummary(7)
        ]);
        setChecks(checksRes.data.data || []);
        setSummary(summaryRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const userHealthScore = summary?.activityScore || 0;
  const isNewUser = checks.length === 0 && !summary;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 🚀 New Hero Section: Immediate Impact */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
        padding: '40px',
        borderRadius: '24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(13, 148, 136, 0.2)'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
            {isNewUser ? (
              "Welcome to VitalIQ Health! Complete your first wellness screening to see your wellness score and start your journey."
            ) : (
              <>Your wellness score is <strong>{userHealthScore}/100</strong> today. Keep tracking to stay on top of your health!</>
            )}
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <Link to="/health-check" className="btn-primary" style={{ background: 'white', color: '#0d9488', fontWeight: 800, padding: '14px 28px' }}>
              <FiPlusCircle /> New Wellness Screening
            </Link>
            <Link to="/insights" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              View Trends <FiArrowRight />
            </Link>
          </div>
        </div>
        <div style={{ width: '140px', height: '140px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{userHealthScore}</div>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="65" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
            <circle cx="70" cy="70" r="65" fill="none" stroke="white" strokeWidth="10" strokeDasharray="408" strokeDashoffset={408 - (408 * userHealthScore / 100)} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 📊 Feature Grid: No More Empty Space */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Statistics Card */}
        <div className="medical-card" style={{ padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Weekly Averages</h3>
            <FiActivity color="#0d9488" size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Daily Steps</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{summary?.averages?.steps?.toLocaleString() || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Sleep Hours</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{summary?.averages?.sleepHours || '0'}h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Water Intake</span>
              <span style={{ fontWeight: 800, color: '#0d9488' }}>{summary?.averages?.waterIntake || '0'}L</span>
            </div>
          </div>
        </div>

        {/* Wellness Goals Card */}
        <div className="medical-card" style={{ padding: '24px', background: '#f0fdfa', border: '1px solid #99f6e4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064e3b' }}>Wellness Goals</h3>
            <FiTarget color="#0d9488" size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700 }}>Exercise Streak</span>
                <span>{user?.currentStreak || 0}/7 Days</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: '#0d9488' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'white', borderRadius: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#ccfbf1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏆</div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Current Reward Points</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0d9488' }}>{(user?.points || 0).toLocaleString()} PTS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Insight Card */}
        <div className="medical-card" style={{ padding: '24px', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#2dd4bf', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
            <FiZap /> Daily Wellness Insight
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '20px' }}>
            "Walking for just 10 minutes after a meal can lower your blood sugar spike by up to 12%."
          </p>
          <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', width: 'fit-content', fontWeight: 700 }}>
            Read More
          </button>
        </div>
      </div>

      {/* 📜 History Section: Visible and Interactive */}
      <div className="medical-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Wellness History</h3>
          <Link to="/history" style={{ fontSize: '0.9rem', color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}>See All History</Link>
        </div>
        {checks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed #f1f5f9', borderRadius: '16px' }}>
            <FiActivity size={40} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b' }}>No wellness screenings yet. Start your first AI-assisted screening today!</p>
            <Link to="/health-check" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Start Screening</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {checks.slice(0, 4).map((check, i) => (
              <div key={i} style={{ 
                padding: '20px', 
                background: '#f8fafc', 
                borderRadius: '16px', 
                border: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}>{check.checkType || 'General Check'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(check.date).toLocaleDateString()}</div>
                </div>
                <Link to={`/results/${check._id}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <FiEye /> View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
