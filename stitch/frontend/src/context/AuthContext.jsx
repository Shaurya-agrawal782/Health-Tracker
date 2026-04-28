import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('vitaliq_token');
    const storedUser = localStorage.getItem('vitaliq_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // In a real app, this would call the API to check credentials and send OTP
    const response = await authAPI.login({ email, password });
    // We return the data but DON'T set the state yet (waiting for OTP)
    return response.data;
  };

  const completeLogin = (userData, tokenData) => {
    localStorage.setItem('vitaliq_token', tokenData);
    localStorage.setItem('vitaliq_user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const sendRegisterOtp = async (email) => {
    const response = await authAPI.sendRegisterOtp({ email });
    return response.data;
  };

  const register = async (formData) => {
    const response = await authAPI.register(formData);
    const { token: newToken, user: userData } = response.data;

    localStorage.setItem('vitaliq_token', newToken);
    localStorage.setItem('vitaliq_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return response.data;
  };

  const loginAsGuest = () => {
    const guestUser = {
      _id: 'guest_123',
      name: 'Guest Explorer',
      email: 'guest@vitaliq.ai',
      role: 'guest'
    };
    const guestToken = 'vitaliq_guest_access_token';

    localStorage.setItem('vitaliq_token', guestToken);
    localStorage.setItem('vitaliq_user', JSON.stringify(guestUser));
    setToken(guestToken);
    setUser(guestUser);
  };

  const logout = () => {
    localStorage.removeItem('vitaliq_token');
    localStorage.removeItem('vitaliq_user');
    setToken(null);
    setUser(null);
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await authAPI.verifyOtp({ email, otp });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Verification failed');
    }
  };

  const forgotPassword = async (email) => {
    const response = await authAPI.forgotPassword({ email });
    return response.data;
  };

  const resetPassword = async (data) => {
    const response = await authAPI.resetPassword(data);
    return response.data;
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      loginAsGuest,
      verifyOtp,
      completeLogin,
      sendRegisterOtp,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
