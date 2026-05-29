import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiCheckCircle, FiShoppingBag, FiZap, FiAward,
  FiArrowRight, FiShield, FiTrendingUp, FiActivity,
  FiMoon, FiDroplet
} from 'react-icons/fi';

const disclaimer =
  'VitalIQ Health provides wellness insights and lifestyle wellness estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.';

/* ─── small reusable sub-components ─── */

const FeatureCard = ({ icon: Icon, color, bg, title, desc }) => (
  <div style={{
    background: 'white', border: '1px solid #e2e8f0',
    padding: '32px 28px', borderRadius: '24px', textAlign: 'left',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}
  >
    <div style={{
      width: '48px', height: '48px', background: bg, borderRadius: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
    }}>
      <Icon size={22} color={color} />
    </div>
    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px', color: '#064e3b' }}>{title}</h3>
    <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.65 }}>{desc}</p>
  </div>
);

const AudienceCard = ({ emoji, title, subtitle, points, accentColor }) => (
  <div style={{
    background: 'white', border: '1.5px solid #e2e8f0',
    borderRadius: '24px', padding: '32px 28px', textAlign: 'left',
    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    transition: 'border-color 0.2s ease, transform 0.2s ease'
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ fontSize: '2.4rem', marginBottom: '14px', lineHeight: 1 }}>{emoji}</div>
    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{title}</h3>
    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '18px' }}>{subtitle}</p>
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {points.map((pt, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: '#334155' }}>
          <FiCheckCircle size={16} color={accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
          {pt}
        </li>
      ))}
    </ul>
  </div>
);

const StepBubble = ({ num, color }) => (
  <div style={{
    width: '52px', height: '52px', borderRadius: '50%',
    background: color, color: 'white', fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.2rem', boxShadow: `0 6px 18px ${color}55`, flexShrink: 0
  }}>
    {num}
  </div>
);

/* ─── Main Landing component ─── */

const Landing = () => {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [guestLoading, setGuestLoading] = React.useState(false);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>

      {/* Subtle background orbs */}
      <div style={{
        position: 'fixed', top: '-8%', left: '-6%', width: '700px', height: '700px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 65%)',
        borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-6%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)',
        borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
      }} />

      {/* ══════════════════════════ NAVBAR ══════════════════════════ */}
      <nav className="landing-nav" style={{
        padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 10px rgba(0,0,0,0.03)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #0d9488, #10b981)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '1rem',
            boxShadow: '0 4px 10px rgba(13,148,136,0.25)'
          }}>V</div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#064e3b', letterSpacing: '-0.5px' }}>
            VitalIQ Health
          </span>
        </div>

        {/* Nav links (anchor-scroll) */}
        <div className="landing-nav-links" style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
          {['Features', 'How it Works', 'For You'].map(lbl => (
            <a key={lbl} href={`#${lbl.toLowerCase().replace(/ /g, '-')}`} style={{
              color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
              transition: 'color 0.15s'
            }}
              onMouseEnter={e => e.target.style.color = '#0d9488'}
              onMouseLeave={e => e.target.style.color = '#475569'}
            >
              {lbl}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="landing-nav-auth" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/login" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            Login
          </Link>
          <Link to="/register" style={{
            background: '#0d9488', color: 'white', textDecoration: 'none',
            padding: '11px 26px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 14px rgba(13,148,136,0.22)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(13,148,136,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(13,148,136,0.22)'; }}
          >
            Get Started <FiArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <main className="landing-main" style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 10 }}>

        <section className="landing-hero-sec" style={{ padding: '100px 0 80px', textAlign: 'center' }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '7px 18px', background: '#f0fdfa', borderRadius: '999px',
            border: '1px solid #99f6e4', color: '#0d9488',
            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: '28px'
          }}>
            <FiActivity size={14} /> AI-Assisted Wellness Platform
          </div>

          {/* Main headline */}
          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 4.6rem)', fontWeight: 900, lineHeight: 1.08,
            letterSpacing: '-2px', marginBottom: '24px', color: '#0f172a'
          }}>
            Your daily wellness companion<br />
            <span style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #10b981 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              for food, sleep, stress & habits.
            </span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: '1.2rem', color: '#475569',
            maxWidth: '680px', margin: '0 auto 48px', lineHeight: 1.65
          }}>
            Get simple wellness insights, budget-friendly meal plans, and daily actions built around your routine — no medical reports needed.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="landing-hero-btn" style={{
              background: 'linear-gradient(135deg, #0d9488, #10b981)',
              color: 'white', textDecoration: 'none', padding: '17px 42px',
              fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700,
              boxShadow: '0 10px 28px rgba(13,148,136,0.28)',
              transition: 'transform 0.18s, box-shadow 0.18s',
              display: 'inline-flex', alignItems: 'center', gap: '9px'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(13,148,136,0.34)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(13,148,136,0.28)'; }}
            >
              Start Your Wellness Check — Free <FiArrowRight size={17} />
            </Link>
            <button onClick={handleGuestLogin} disabled={guestLoading} className="landing-hero-btn" style={{
              background: 'white', color: '#0d9488',
              padding: '17px 38px', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700,
              border: '2px solid #0d9488', cursor: 'pointer',
              transition: 'all 0.18s',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {guestLoading ? 'Starting...' : 'Try as Guest'}
            </button>
            <Link to="/login" className="landing-hero-btn" style={{
              background: 'white', color: '#334155', textDecoration: 'none',
              padding: '17px 38px', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700,
              border: '2px solid #e2e8f0',
              transition: 'border-color 0.18s, color 0.18s'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.color = '#0d9488'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
            >
              Sign In
            </Link>
          </div>

          {/* Safety disclaimer */}
          <p style={{
            maxWidth: '720px', margin: '28px auto 0', padding: '14px 20px',
            border: '1px solid #e2e8f0', borderRadius: '12px',
            background: '#f8fafc', color: '#64748b', fontSize: '0.83rem', lineHeight: 1.6
          }}>
            {disclaimer}
          </p>
        </section>

        {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
        <section id="how-it-works" style={{ padding: '80px 0 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#064e3b', letterSpacing: '-1px', marginBottom: '12px' }}>
              How VitalIQ Works
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }}>
              Four simple steps — no lab tests, no medical jargon, no prescriptions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { num: 1, color: '#0d9488', icon: FiActivity, title: 'Tell us your routine', desc: 'Share sleep hours, meals, water intake, stress levels, and basic lifestyle details.' },
              { num: 2, color: '#10b981', icon: FiCheckCircle, title: 'Get wellness insights', desc: 'Receive AI-assisted lifestyle wellness estimates and trend feedback instantly.' },
              { num: 3, color: '#f59e0b', icon: FiZap, title: 'Follow daily actions', desc: 'Simple action steps, dietary swaps, and habit suggestions built around your life.' },
              { num: 4, color: '#8b5cf6', icon: FiAward, title: 'Track your progress', desc: 'Build streaks, earn wellness points, and watch your habits improve over time.' },
            ].map(({ num, color, icon: Icon, title, desc }) => (
              <div key={num} style={{
                background: 'white', border: '1px solid #f1f5f9', borderRadius: '20px',
                padding: '28px 24px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                  <StepBubble num={num} color={color} />
                </div>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `${color}15`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 14px'
                }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════ FEATURES ══════════════════════════ */}
        <section id="features" style={{ padding: '60px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#064e3b', letterSpacing: '-1px', marginBottom: '12px' }}>
              Everything in One Platform
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '560px', margin: '0 auto' }}>
              From wellness checks to budget meal plans — tools designed for your real daily routine.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '22px' }}>
            <FeatureCard icon={FiCheckCircle} color="#0d9488" bg="#f0fdfa"
              title="Wellness Check"
              desc="Answer a few lifestyle questions and instantly get AI-assisted wellness insights about sleep, stress, activity, and diet patterns." />
            <FeatureCard icon={FiShoppingBag} color="#10b981" bg="#f0fdf4"
              title="Budget-Friendly Meal Planner"
              desc="Set your daily budget (Low / Medium / High) and food preferences. VitalIQ suggests affordable, realistic Indian meal plans for your routine." />
            <FeatureCard icon={FiZap} color="#f59e0b" bg="#fffbeb"
              title="Daily Actions"
              desc="Personalized daily wellness actions — simple dietary swaps, movement suggestions, and stress relief tips based on your latest check." />
            <FeatureCard icon={FiMoon} color="#8b5cf6" bg="#f5f3ff"
              title="Sleep & Stress Tracking"
              desc="Log your nightly sleep and daily stress levels. See trends and get tailored insights to help you rest and recover better." />
            <FeatureCard icon={FiTrendingUp} color="#0ea5e9" bg="#f0f9ff"
              title="Progress History"
              desc="View your wellness journey over time with a clean history of past checks, wellness score changes, and improvement streaks." />
            <FeatureCard icon={FiAward} color="#ec4899" bg="#fdf2f8"
              title="Wellness Streaks"
              desc="Earn wellness points for consistent daily logging. Celebrate consistency with the VitalIQ community using privacy-safe display names." />
          </div>
        </section>

        {/* ══════════════════════════ WHO IT'S FOR ══════════════════════════ */}
        <section id="for-you" style={{ padding: '60px 0 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#064e3b', letterSpacing: '-1px', marginBottom: '12px' }}>
              Built for Your Lifestyle
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }}>
              Whether you're a student, professional, or just starting your wellness journey.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <AudienceCard
              emoji="🎓" title="Students" accentColor="#0d9488"
              subtitle="Manage exam stress, eat well on a tight budget, and build healthy habits."
              points={[
                'Budget meal plans from ₹80/day',
                'Stress & sleep tracking during exams',
                'Quick daily wellness check (< 3 minutes)',
                'Habits that fit a hostel routine',
              ]}
            />
            <AudienceCard
              emoji="💼" title="Working Professionals" accentColor="#10b981"
              subtitle="Spot burnout early, plan nutritious meals, and track consistency despite a busy schedule."
              points={[
                'Burnout & stress signal detection',
                'Meal plans for office lunches and WFH days',
                'Daily wellness actions in under 5 minutes',
                'Progress tracking across weeks and months',
              ]}
            />
            <AudienceCard
              emoji="🌿" title="General Wellness Users" accentColor="#0ea5e9"
              subtitle="Start your wellness journey without needing reports, prescriptions, or prior knowledge."
              points={[
                'No medical history required to begin',
                'Simple inputs — no clinical numbers',
                'Personalised food and activity suggestions',
                'Privacy-safe community Wellness Streaks',
              ]}
            />
          </div>
        </section>

        {/* ══════════════════════════ FINAL CTA ══════════════════════════ */}
        <section className="landing-cta-sec" style={{
          margin: '0 0 80px', padding: '60px 40px', borderRadius: '28px',
          background: 'linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #10b981 100%)',
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-40%', right: '-10%', width: '400px', height: '400px',
            background: 'rgba(255,255,255,0.04)', borderRadius: '50%'
          }} />
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Ready to start your wellness journey?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 36px', lineHeight: 1.65 }}>
            Free to use. No medical reports needed. Just your daily routine — and we'll help you understand it better.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="landing-cta-btn" style={{
              background: 'white', color: '#064e3b', textDecoration: 'none',
              padding: '15px 38px', fontSize: '1rem', borderRadius: '14px', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'transform 0.18s', display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Create Free Account <FiArrowRight />
            </Link>
            <Link to="/health-check" className="landing-cta-btn" style={{
              background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none',
              padding: '15px 38px', fontSize: '1rem', borderRadius: '14px', fontWeight: 700,
              border: '1.5px solid rgba(255,255,255,0.3)',
              transition: 'background 0.18s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              Try as Guest
            </Link>
          </div>
        </section>
      </main>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer style={{
        borderTop: '1px solid #f1f5f9', padding: '48px 0',
        textAlign: 'center', background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #0d9488, #10b981)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.85rem'
          }}>V</div>
          <span style={{ fontWeight: 800, color: '#064e3b', fontSize: '1rem' }}>VitalIQ Health</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
          AI-Assisted Wellness Platform
        </p>
        <p style={{ maxWidth: '760px', margin: '0 auto', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7, padding: '0 24px' }}>
          {disclaimer}
        </p>
        <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '20px' }}>
          © 2026 VitalIQ Health. All rights reserved.
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .landing-nav {
            padding: 12px 16px !important;
          }
          .landing-nav-links {
            display: none !important;
          }
          .landing-main {
            padding: 0 16px !important;
          }
          .landing-hero-sec {
            padding: 48px 0 32px !important;
          }
          .landing-hero-sec h1 {
            font-size: 1.8rem !important;
            letter-spacing: -1px !important;
          }
          .landing-hero-sec p {
            font-size: 0.95rem !important;
            margin-bottom: 24px !important;
          }
          .landing-hero-btn, .landing-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }
          .landing-cta-sec {
            padding: 32px 16px !important;
            margin-bottom: 40px !important;
          }
          .landing-cta-sec h2 {
            font-size: 1.45rem !important;
          }
          .landing-cta-sec p {
            font-size: 0.88rem !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
