import { Link } from 'react-router-dom';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div className="animate-fade-in-scale" style={{
        background: 'white',
        padding: '48px',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ 
          width: '64px', height: '64px', background: '#e0f2fe', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto', color: '#0ea5e9'
        }}>
          <FiAlertCircle size={32} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
          Page Not Found
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
          Oops! The page you're looking for doesn't exist or has been moved. 
          Check the URL or head back to the dashboard.
        </p>
        <Link 
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', background: 'var(--primary)', color: 'white',
            textDecoration: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          <FiHome /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
