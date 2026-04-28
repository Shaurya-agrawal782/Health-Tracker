import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            background: 'white',
            padding: '48px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ 
              width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px auto', color: '#ef4444'
            }}>
              <FiAlertTriangle size={32} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
              We encountered an unexpected error. Don't worry, your data is safe. 
              Please try refreshing the page or return to the home screen.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', background: 'var(--primary)', color: 'white',
                  border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <FiRefreshCw /> Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <FiHome /> Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '32px', textAlign: 'left', fontSize: '0.8rem', color: '#ef4444', background: '#fef2f2', padding: '12px', borderRadius: '8px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error Details</summary>
                <pre style={{ marginTop: '8px', overflowX: 'auto' }}>{this.state.error?.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
