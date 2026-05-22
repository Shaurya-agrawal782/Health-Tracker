import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import HealthInput from './pages/HealthInput';
import HealthCheckForm from './pages/HealthCheckForm';
import AnalyzingResults from './pages/AnalyzingResults';
import HealthResults from './pages/HealthResults';
import MedicalHistory from './pages/MedicalHistory';
import Insights from './pages/Insights';
import Recommendations from './pages/Recommendations';
import DailyActions from './pages/DailyActions';
import MealPlanner from './pages/MealPlanner';
import Leaderboard from './pages/Leaderboard';
import Habits from './pages/Habits';
import WeeklyCheckin from './pages/WeeklyCheckin';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if onboarding is needed
  const isGuest = user?.isGuest || user?.role === 'guest';
  const guestOnboarding = JSON.parse(localStorage.getItem('vitaliq_onboarding') || '{}');
  
  const onboardingCompleted = isGuest 
    ? guestOnboarding.onboardingCompleted 
    : user?.preferences?.onboardingCompleted;
  
  const onboardingSkipped = isGuest
    ? guestOnboarding.onboardingSkipped
    : user?.preferences?.onboardingSkipped;

  const needsOnboarding = !onboardingCompleted && !onboardingSkipped;

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (!needsOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Listen to the auth:unauthorized event from api.js and trigger client-side navigation
const AuthEventListener = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleUnauthorized = () => {
      // Do not repeatedly dispatch or handle if already on login page
      if (window.location.pathname.includes('/login')) {
        return;
      }

      logout({ showExpiredMessage: true });
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate, logout]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthEventListener />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1a2332',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={
            <PublicRoute>
              <GoogleOAuthProvider clientId="762575410029-k5unfs899v0qavjc5vf4ni4lb0tk63cp.apps.googleusercontent.com">
                <Login />
              </GoogleOAuthProvider>
            </PublicRoute>
          } />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* Protected Onboarding Route (No Sidebar/Header layout) */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/health-input" element={<HealthInput />} />
            <Route path="/health-check" element={<HealthCheckForm />} />
            <Route path="/analyzing" element={<AnalyzingResults />} />
            <Route path="/results/:id" element={<HealthResults />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={<MedicalHistory />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/daily-actions" element={<DailyActions />} />
            <Route path="/recommendations" element={<Navigate to="/daily-actions" replace />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/weekly-checkin" element={<WeeklyCheckin />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
