import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import OtpVerification from '../components/auth/OtpVerification';

const Register = () => {
  const navigate = useNavigate();
  const { register, sendRegisterOtp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showRetryUI, setShowRetryUI] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'male',
    height: '',
    weight: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowRetryUI(false);

    const timer = setTimeout(() => {
      setShowRetryUI(true);
    }, 15000);

    try {
      // Step 1: Send OTP to verify email
      await sendRegisterOtp(formData.email);
      setShowOtp(true);
      toast.success('Please verify your email to complete registration.');
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        toast.error('Registration is taking too long. Please try again.');
      } else {
        toast.error(err.response?.data?.message || 'Verification failed');
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const handleOtpVerify = async (otpValue) => {
    try {
      const payload = {
        ...formData,
        otp: otpValue,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight)
      };
      await register(payload);
      toast.success('Welcome to VitalIQ Health! Your wellness profile has been created.');
      navigate('/dashboard');
    } catch (err) {
      throw err;
    }
  };

  if (showOtp) {
    return (
      <div className="auth-outer-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div className="animate-fade-in-scale login-card" style={{ background: 'white', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px' }}>
          <OtpVerification 
            email={formData.email} 
            onVerify={handleOtpVerify} 
            onBack={() => setShowOtp(false)} 
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
      background: '#f1f5f9',
      padding: '20px'
    }}>
      <div className="animate-fade-in-scale login-card" style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--primary-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <FiHeart color="var(--primary)" size={22} />
          </div>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '4px'
          }}>
            Join VitalIQ Health
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Create your wellness profile to get started
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input type="text" className="input-field" placeholder="John Doe"
                value={formData.name} onChange={e => handleChange('name', e.target.value)}
                required style={{ paddingLeft: '42px' }} />
              <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={formData.email} onChange={e => handleChange('email', e.target.value)}
                required style={{ paddingLeft: '42px' }} />
              <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} className="input-field"
                placeholder="Min 6 characters"
                value={formData.password} onChange={e => handleChange('password', e.target.value)}
                required minLength={6} style={{ paddingLeft: '42px', paddingRight: '42px' }} />
              <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px'
              }}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Age & Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="input-label">Age</label>
              <input type="number" className="input-field" placeholder="25"
                value={formData.age} onChange={e => handleChange('age', e.target.value)}
                required min="1" max="120" />
            </div>
            <div>
              <label className="input-label">Gender</label>
              <select className="select-field" value={formData.gender}
                onChange={e => handleChange('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Height & Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label className="input-label">Height (cm)</label>
              <input type="number" className="input-field" placeholder="170"
                value={formData.height} onChange={e => handleChange('height', e.target.value)}
                required min="50" max="300" />
            </div>
            <div>
              <label className="input-label">Weight (kg)</label>
              <input type="number" className="input-field" placeholder="70"
                value={formData.weight} onChange={e => handleChange('weight', e.target.value)}
                required min="10" max="500" />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading} style={{
            width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '16px'
          }}>
            {loading ? (
              <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : (
              'Verify & Create Account'
            )}
          </button>

          {showRetryUI && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', textAlign: 'center' }}>
              Still loading? The server may be waking up. Try again.
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
      <style>{`
        .login-card {
          padding: 40px;
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

export default Register;
