import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import OtpVerification from '../components/auth/OtpVerification';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRetryUI, setShowRetryUI] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [serverStatus, setServerStatus] = useState('pending');

  useEffect(() => {
    let active = true;
    authAPI.checkHealth()
      .then(() => {
        if (active) setServerStatus('ready');
      })
      .catch((err) => {
        console.error('Health check connection failed:', err);
        if (active) setServerStatus('failed');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowRetryUI(false);
    setEmailError(null);

    const timer = setTimeout(() => {
      setShowRetryUI(true);
    }, 15000);

    try {
      const data = await forgotPassword(email);
      toast.success(data?.message || 'If this email exists, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      const errorType = err.response?.data?.errorType;
      const message = err.response?.data?.message;

      if (errorType === 'email_failure' || errorType === 'email_timeout') {
        setEmailError(message || "We couldn't send the reset email. Please try again.");
        toast.error('Email delivery failed. See details below.');
      } else if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        toast.error('Request is taking too long. The server may still be waking up — please try again.');
      } else {
        toast.error(message || 'Failed to send OTP');
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const handleOtpVerify = async (otpValue) => {
    setOtp(otpValue);
    setStep(3);
    return true; // OtpVerification component expects a promise
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    setShowRetryUI(false);

    const timer = setTimeout(() => {
      setShowRetryUI(true);
    }, 15000);

    try {
      await resetPassword({ email, otp, newPassword });
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        toast.error('Reset is taking too long. Please try again.');
      } else {
        toast.error(err.response?.data?.message || 'Reset failed');
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div className="animate-fade-in-scale" style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Forgot Password?
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {/* Server Connection Status Banner */}
            <div style={{
              margin: '-16px auto 24px auto',
              padding: '6px 12px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              width: '100%',
              background: serverStatus === 'ready' ? '#f0fdf4' : serverStatus === 'failed' ? '#fff1f2' : '#f8fafc',
              border: `1px solid ${serverStatus === 'ready' ? '#d1fae5' : serverStatus === 'failed' ? '#ffe4e6' : '#e2e8f0'}`,
              color: serverStatus === 'ready' ? '#166534' : serverStatus === 'failed' ? '#991b1b' : '#64748b',
              transition: 'all 0.3s'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: serverStatus === 'ready' ? '#22c55e' : serverStatus === 'failed' ? '#ef4444' : '#94a3b8'
              }} />
              <span>
                {serverStatus === 'pending' && 'Waking up secure server...'}
                {serverStatus === 'ready' && 'Server ready'}
                {serverStatus === 'failed' && 'Server is taking longer than usual. You can still try.'}
              </span>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '42px', height: '50px' }}
                  />
                  <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {loading ? <span className="spinner" style={{ width: '20px', height: '20px' }} /> : <>Reset Password <FiArrowRight /></>}
              </button>

              {showRetryUI && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', textAlign: 'center', marginBottom: '20px' }}>
                  Still loading? The server may be waking up. Try again.
                </div>
              )}

              {emailError && !loading && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                    📧 Email delivery issue
                  </div>
                  <div style={{ color: '#b91c1c', marginBottom: '10px' }}>
                    {emailError}
                  </div>
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    style={{
                      padding: '8px 20px',
                      background: '#0d9488',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </form>

            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
              <FiArrowLeft /> Back to login
            </Link>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div className="animate-fade-in">
            <OtpVerification 
              email={email} 
              onVerify={handleOtpVerify} 
              onBack={() => setStep(1)} 
            />
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Set New Password
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Must be at least 6 characters.
              </p>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '42px', height: '50px' }}
                  />
                  <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '42px', height: '50px' }}
                  />
                  <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <span className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Reset Password'}
              </button>

              {showRetryUI && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', textAlign: 'center' }}>
                  Still loading? The server may be waking up. Try again.
                </div>
              )}
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--success)', marginBottom: '24px' }}>
              <FiCheckCircle size={64} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Password Reset
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Your password has been successfully reset. Click below to log in with your new password.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '14px', fontWeight: 700, borderRadius: '12px' }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
