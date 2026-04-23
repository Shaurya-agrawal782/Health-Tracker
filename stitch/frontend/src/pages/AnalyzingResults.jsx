import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const statusMessages = [
  'Preparing health data...',
  'Analyzing vitals...',
  'Running diabetes prediction...',
  'Checking blood pressure risk...',
  'Evaluating stress levels...',
  'Computing SHAP explanations...',
  'Generating recommendations...',
  'Finalizing results...'
];

const AnalyzingResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const predictionId = location.state?.predictionId;

  useEffect(() => {
    if (!predictionId) {
      navigate('/health-check');
      return;
    }

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);

    // Cycle messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % statusMessages.length);
    }, 600);

    // Navigate after animation
    const timeout = setTimeout(() => {
      navigate(`/results/${predictionId}`, { replace: true });
    }, 3800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(timeout);
    };
  }, [predictionId, navigate]);

  const displayProgress = Math.min(Math.round(progress), 100);
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (displayProgress / 100) * circumference;

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '24px'
    }} className="page-enter">
      {/* Title */}
      <h1 style={{
        fontSize: '1.8rem',
        fontWeight: 700,
        marginBottom: '40px',
        color: 'var(--text-primary)'
      }} className="animate-fade-in">
        Analyzing Results
      </h1>

      {/* Circular Progress */}
      <div className="circular-progress" style={{
        width: '160px',
        height: '160px',
        marginBottom: '32px'
      }}>
        <svg width="160" height="160" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="var(--border-light)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <span className="progress-text" style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          color: 'var(--primary)'
        }}>
          {displayProgress}%
        </span>
      </div>

      {/* Linear Progress Bar */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        height: '10px',
        borderRadius: '5px',
        background: 'var(--primary-100)',
        overflow: 'hidden',
        marginBottom: '28px'
      }}>
        <div style={{
          height: '100%',
          width: `${displayProgress}%`,
          background: 'linear-gradient(90deg, var(--primary), var(--accent-emerald))',
          borderRadius: '5px',
          transition: 'width 0.1s linear'
        }} />
      </div>

      {/* Status Messages */}
      <div style={{ minHeight: '50px' }}>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }} className="animate-fade-in" key={messageIndex}>
          {statusMessages[messageIndex]}
        </p>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          Please wait while our AI processes your data
        </p>
      </div>

      {/* Pulse animation */}
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'var(--primary)',
        marginTop: '32px',
        animation: 'pulse-glow 1.5s infinite'
      }} />
    </div>
  );
};

export default AnalyzingResults;
