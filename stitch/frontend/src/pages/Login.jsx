import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiArrowRight } from 'react-icons/fi';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import OtpVerification from '../components/auth/OtpVerification';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsGuest, verifyOtp, completeLogin } = useAuth();
  const isGoogleDemoEnabled = import.meta.env.DEV;
  
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      setTempAuthData(data); // Store token/user temporarily
      setShowOtpScreen(true);
      toast.success('Credentials verified! Please enter OTP.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: () => {
      if (!isGoogleDemoEnabled) {
        toast.error('Google sign-in demo is available in local development only.');
        return;
      }

      // Local development demo only. Production Google sign-in must use a
      // backend endpoint that verifies Google-issued ID tokens.
      const mockGoogleData = {
        user: {
          id: 'google-demo-user',
          name: 'Google Demo User',
          email: 'google-demo@vitaliq.local',
          role: 'demo',
          isMockGoogle: true
        },
        token: 'mock_google_token'
      };
      completeLogin(mockGoogleData.user, mockGoogleData.token);
      toast.success('Google sign-in demo started.');
      navigate('/dashboard');
    },
    onError: () => toast.error('Google sign-in demo failed.')
  });

  const handleOtpVerify = async (otpValue) => {
    try {
      const data = await verifyOtp(formData.email, otpValue);
      
      // FINALLY log the user in with the REAL data from the backend
      if (data && data.token) {
        completeLogin(data.user, data.token);
        toast.success('Welcome to VitalIQ Health!');
        navigate('/dashboard');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);

    try {
      await loginAsGuest();
      toast.success('Welcome! Exploring as a Guest.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Guest login is temporarily unavailable. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  if (showOtpScreen) {
    return (
      <div className="auth-outer-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div className="animate-fade-in-scale login-card" style={{ background: 'white', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px' }}>
          <OtpVerification 
            email={formData.email} 
            onVerify={handleOtpVerify} 
            onBack={() => setShowOtpScreen(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-outer-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div className="animate-fade-in-scale login-card" style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--primary)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            margin: '0 auto 16px auto',
            fontSize: '1.4rem',
            fontWeight: 800
          }}>V</div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.5px'
          }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Login to your VitalIQ Health wellness dashboard
          </p>
        </div>

        {/* Social Logins */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            type="button" 
            onClick={() => {
              if (!isGoogleDemoEnabled) {
                toast.error('Google sign-in demo is available in local development only.');
                return;
              }
              googleLogin();
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google demo
          </button>
          <button 
            type="button" 
            onClick={handleGuestLogin}
            disabled={guestLoading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: guestLoading ? 'not-allowed' : 'pointer',
              color: 'var(--primary)'
            }}
          >
            {guestLoading ? (
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            ) : (
              <>
                <FiUserPlus />
                Guest
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>or with email</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        </div>

        <form onSubmit={handleLoginSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Email address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="name@company.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{ paddingLeft: '42px', height: '50px' }}
              />
              <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{ paddingLeft: '42px', paddingRight: '42px', height: '50px' }}
              />
              <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link to="/forgot-password" style={{
                fontSize: '0.8rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none'
              }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading} style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {loading ? (
              <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : (
              <>Sign In <FiArrowRight /></>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          New to VitalIQ Health?{' '}
          <Link to="/register" style={{
            color: 'var(--primary)',
            fontWeight: 700,
            textDecoration: 'none'
          }}>
            Create account
          </Link>
        </p>
      </div>
      <style>{`
        .login-card {
          padding: 48px 40px;
        }
        @media (max-width: 600px) {
          .auth-outer-container {
            padding: 10px !important;
          }
          .login-card {
            padding: 24px 16px !important;
            border-radius: 16px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
