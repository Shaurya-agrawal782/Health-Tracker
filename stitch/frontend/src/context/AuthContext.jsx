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
    const storedToken = localStorage.getItem('stitch_token');
    const storedUser = localStorage.getItem('stitch_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = response.data;

    localStorage.setItem('stitch_token', newToken);
    localStorage.setItem('stitch_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return response.data;
  };

  const register = async (formData) => {
    const response = await authAPI.register(formData);
    const { token: newToken, user: userData } = response.data;

    localStorage.setItem('stitch_token', newToken);
    localStorage.setItem('stitch_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('stitch_token');
    localStorage.removeItem('stitch_user');
    setToken(null);
    setUser(null);
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
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
