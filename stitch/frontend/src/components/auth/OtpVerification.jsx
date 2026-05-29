import React, { useState, useEffect } from 'react';
import { FiShield, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OtpVerification = ({ email, onVerify, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [showRetryUI, setShowRetryUI] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    
    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && e.target.previousSibling && otp[index] === "") {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setShowRetryUI(false);

    const timerId = setTimeout(() => {
      setShowRetryUI(true);
    }, 15000);

    try {
      await onVerify(otpValue);
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        toast.error('Verification is taking too long. Please try again.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Verification failed');
      }
    } finally {
      clearTimeout(timerId);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <button 
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginBottom: '24px',
          fontSize: '0.9rem',
          padding: 0
        }}
      >
        <FiArrowLeft /> Back to login
      </button>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'var(--primary-50)',
          color: 'var(--primary)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <FiShield size={32} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Two-Step Verification</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          We've sent a 6-digit verification code to <br />
          <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={data}
              onChange={e => handleChange(e.target, index)}
              onKeyDown={e => handleBackspace(e, index)}
              onFocus={e => e.target.select()}
              style={{
                width: '45px',
                height: '55px',
                textAlign: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                background: '#f8fafc',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.target.style.borderColor = 'var(--primary-200)'}
              onMouseLeave={e => e.target.style.borderColor = data ? 'var(--primary)' : '#e2e8f0'}
              className={data ? 'otp-filled' : ''}
            />
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          fontSize: '1rem',
          marginBottom: '20px'
        }}>
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Didn't receive the code?{' '}
            {timer > 0 ? (
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Resend in {timer}s</span>
            ) : (
              <button 
                type="button"
                onClick={() => { setTimer(60); toast.success('New code sent to ' + email); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Resend Code
              </button>
            )}
          </p>
        </div>

        {showRetryUI && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', textAlign: 'center', marginBottom: '20px' }}>
            Still loading? The server may be waking up. Try again.
          </div>
        )}
      </form>

      <style>{`
        .otp-filled {
          border-color: var(--primary) !important;
          background: white !important;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
        }
      `}</style>
    </div>
  );
};

export default OtpVerification;
