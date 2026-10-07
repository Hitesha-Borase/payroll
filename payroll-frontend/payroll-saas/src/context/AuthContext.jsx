import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize auth state synchronously from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    return !!(token && storedUser);
  });
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync state if localStorage changes (optional but good for multi-tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userId', userData.id);

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.adminLogin(email, password);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userId', userData.id);

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(formData);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userId', userData.id);

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      const syncBackup = localStorage.getItem('payroll_training_sync');
      const authKeys = [
        'token', 'authToken', 'accessToken', 'refreshToken',
        'user', 'role', 'userRole', 'userId', 'userName', 'userEmail'
      ];
      authKeys.forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      if (syncBackup) {
        localStorage.setItem('payroll_training_sync', syncBackup);
        sessionStorage.setItem('payroll_training_sync', syncBackup);
      }
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    adminLogin,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
