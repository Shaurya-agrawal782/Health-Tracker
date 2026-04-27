import React from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiCpu, FiShield, FiTrendingUp, FiZap, FiArrowRight, FiCheck } from 'react-icons/fi';

const Landing = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff', 
      color: '#0f172a', 
      overflow: 'hidden', 
      position: 'relative' 
    }}>
      
      {/* Soft Background Orbs */}
      <div style={{
        position: 'absolute',
        top: '-5%',
        left: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 0
      }} />

      {/* Navbar */}
      <nav style={{
        padding: '24px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#0d9488', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>V</div>
          <span style={{ color: '#064e3b' }}>VitalIQ</span>
        </div>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <Link to="/login" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Login</Link>
          <Link to="/register" style={{ 
            background: '#0d9488', 
            color: 'white', 
            textDecoration: 'none', 
            padding: '12px 28px', 
            borderRadius: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
          }}>
            Get Started <FiArrowRight />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '100px 40px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: '#f0fdfa',
          borderRadius: '999px',
          border: '1px solid #99f6e4',
          color: '#0d9488',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '24px'
        }}>
          <FiZap /> Next-Generation Wellness
        </div>

        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: '28px',
          letterSpacing: '-2px',
          color: '#064e3b' /* Deep Green for Headlines */
        }}>
          Your Health, <br />
          <span style={{ 
            background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Decoded by AI.</span>
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: '#334155', /* High Contrast Slate */
          maxWidth: '700px',
          margin: '0 auto 48px auto',
          lineHeight: 1.6
        }}>
          VitalIQ uses advanced Gemini AI to analyze your lifestyle, predict health risks, and provide actionable micro-hacks for a longer, healthier life.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link to="/register" style={{ 
            background: '#0d9488', 
            color: 'white', 
            textDecoration: 'none',
            padding: '18px 40px', 
            fontSize: '1.1rem', 
            borderRadius: '18px',
            fontWeight: 700,
            boxShadow: '0 10px 25px -5px rgba(13,148,136,0.3)'
          }}>
            Launch VitalIQ Free
          </Link>
          <button style={{ 
            background: 'white',
            color: '#334155', 
            border: '2px solid #e2e8f0', 
            padding: '18px 40px', 
            borderRadius: '18px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            See How it Works
          </button>
        </div>

        {/* Feature Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px',
          marginTop: '120px'
        }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '40px', borderRadius: '32px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '50px', height: '50px', background: '#f0fdfa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', marginBottom: '24px' }}>
              <FiCpu size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#064e3b' }}>Gemini Analysis</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Deep correlation analysis of sleep, stress, and activity using Google's most advanced LLM.
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '40px', borderRadius: '32px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '50px', height: '50px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '24px' }}>
              <FiTrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#064e3b' }}>Predictive Risks</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Early detection of diabetes, hypertension, and burnout risks before they become critical.
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '40px', borderRadius: '32px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '50px', height: '50px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', marginBottom: '24px' }}>
              <FiShield size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#064e3b' }}>Wellness Map</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Real-time environmental monitoring to keep you safe from local health hazards.
            </p>
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid #f1f5f9',
        padding: '60px 0',
        marginTop: '60px',
        textAlign: 'center',
        background: '#f8fafc'
      }}>
        <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
          Powered By Google Gemini & VitalIQ Engine
        </p>
      </footer>
    </div>
  );
};

export default Landing;
