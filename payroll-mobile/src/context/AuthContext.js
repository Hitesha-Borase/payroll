import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on app launch
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser = await AsyncStorage.getItem('userData');
        const savedRole = await AsyncStorage.getItem('userRole');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setRole(savedRole ? savedRole.toUpperCase() : 'EMPLOYEE');
        }
      } catch (error) {
        console.error('[LOAD_SESSION_ERROR]', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.data && response.data.success) {
        const { token: authToken, user: userData } = response.data.data;
        const userRole = (userData.role || 'employee').toUpperCase();

        await AsyncStorage.setItem('userToken', authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userRole', userRole);

        setToken(authToken);
        setUser(userData);
        setRole(userRole);

        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data?.message || 'Login failed' };
      }
    } catch (error) {
      console.error('[LOGIN_ERROR]', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Server connection error. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData', 'userRole']);
      setUser(null);
      setToken(null);
      setRole(null);
    } catch (error) {
      console.error('[LOGOUT_ERROR]', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
