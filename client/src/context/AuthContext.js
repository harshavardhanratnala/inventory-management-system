import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);

  const verifySession = async () => {
    try {
      console.log('🔍 Verifying session with /auth/me...');
      const res = await api.get('/auth/me');
      console.log('✅ Session verified:', res.data);
      setUser(res.data);
    } catch (err) {
      console.error('❌ Session verification failed:', {
        message: err.message,
        code: err.code,
        response: err.response?.data
      });
      setUser(null);
    } finally {
      setLoading(false);
      setHasVerified(true);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login...');
      const res = await api.post('/auth/login', { email, password });
      console.log('✅ Login successful:', res.data);
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error('❌ Login failed:', err);
      setUser(null);
      throw err;
    }
  };

  const register = async (fullName, email, password, role) => {
    try {
      console.log('📝 Attempting registration...', { fullName, email, role });
      const res = await api.post('/auth/register', { 
        fullName, 
        email, 
        password, 
        role 
      });
      console.log('✅ Registration successful:', res.data);
      setUser(res.data);
      return res.data;
    } catch (error) {
      console.error('❌ Registration failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'Registration failed. Please try again.';
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      localStorage.setItem('logout-event', Date.now());
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    hasVerified,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>Checking authentication...</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};