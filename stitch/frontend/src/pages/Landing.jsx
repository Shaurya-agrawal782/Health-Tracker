import { Link } from 'react-router-dom';
import { FiActivity, FiCpu, FiUsers, FiShield, FiArrowRight, FiHeart, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../components/layout/Navbar';

const features = [
  {
    icon: <FiActivity size={28} />,
    title: 'Smart Tracking',
    description: 'Seamlessly log your activity, nutrition, and sleep patterns automatically.',
    color: '#0d6e5b'
  },
  {
    icon: <FiCpu size={28} />,
    title: 'AI Insights',
    description: 'Receive personalized recommendations and actionable health advice based on your data.',
    color: '#0d6e5b'
  },
  {
    icon: <FiUsers size={28} />,
    title: 'Community Support',
    description: 'Connect with a supportive community to share progress, challenges, and tips.',
    color: '#0d6e5b'
  },
  {
    icon: <FiShield size={28} />,
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected, ensuring privacy at all times.',
    color: '#0d6e5b'
  }
];

const howItWorks = [
  { step: '01', title: 'Enter Health Data', desc: 'Fill in your vitals, lifestyle habits, and health parameters' },
  { step: '02', title: 'AI Analysis', desc: 'Our ML models analyze your data for diabetes, BP & stress risk' },
  { step: '03', title: 'Get Results', desc: 'Receive detailed predictions with SHAP-powered explanations' },
  { step: '04', title: 'Take Action', desc: 'Follow personalized recommendations to improve your health' },
];

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '100px 24px 60px',
        background: 'var(--bg-hero)',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center'
        }} className="hero-grid">
          {/* Left: Text */}
          <div className="animate-fade-in-up">
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              letterSpacing: '-1.5px',
              color: 'var(--text-primary)'
            }}>
              Your Personalized Path to{' '}
              <span style={{ color: 'var(--primary)' }}>Better Health.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              marginBottom: '36px',
              lineHeight: 1.7
            }}>
              Stitch helps you track, manage, and improve your wellness with AI-powered insights and community support.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-primary" style={{
                padding: '14px 36px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-lg)'
              }}>
                Get Started
              </Link>
              <a href="#features" className="btn-secondary" style={{
                padding: '14px 36px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-lg)'
              }}>
                Learn More
              </a>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="animate-fade-in" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div className="animate-float" style={{
              width: '380px',
              height: '380px',
              background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-xl)',
                padding: '28px',
                boxShadow: 'var(--shadow-lg)',
                width: '280px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--primary-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiHeart color="var(--primary)" size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Health Score</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>92/100</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Diabetes Risk: Low ✓', 'BP Level: Normal ✓', 'Stress: Managed ✓'].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      background: '#d1fae5',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: '#065f46'
                    }}>
                      <FiCheckCircle size={14} /> {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="animate-heartbeat" style={{
                position: 'absolute',
                top: '30px',
                right: '20px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-teal)'
              }}>
                AI Powered 🧠
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
            .hero-grid > div:last-child { display: none !important; }
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Everything You Need
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            A comprehensive health intelligence platform designed for proactive wellness management.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }} className="stagger-children">
          {features.map((feature, i) => (
            <div key={i} className="medical-card animate-fade-in-up" style={{
              padding: '32px',
              opacity: 0,
              cursor: 'default'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: feature.color,
                marginBottom: '20px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        padding: '100px 24px',
        background: 'var(--primary-50)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              From data entry to personalized health insights in 4 simple steps
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '28px'
          }} className="stagger-children">
            {howItWorks.map((item, i) => (
              <div key={i} className="animate-fade-in-up" style={{
                textAlign: 'center',
                opacity: 0
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  margin: '0 auto 16px',
                  boxShadow: 'var(--shadow-teal)'
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" style={{
        padding: '100px 24px',
        textAlign: 'center'
      }}>
        <div className="medical-card" style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '48px 32px',
          background: 'var(--primary-50)',
          border: '1px solid var(--border-teal)'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>
            Ready to Take Control?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
            Start tracking your health today and get AI-powered insights that matter.
          </p>
          <Link to="/register" className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
            Create Free Account <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-light)',
        padding: '28px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
          Stitch
        </span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy policy</a>
          <a href="#" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of service</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
