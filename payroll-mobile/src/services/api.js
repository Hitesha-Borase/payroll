import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to every outgoing request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API_AUTH_TOKEN_ERROR]', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.multiRemove(['userToken', 'userData', 'userRole']);
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// Employee Endpoints
export const employeeAPI = {
  getDashboard: () => api.get('/employee/dashboard'),
  getAttendance: (params) => api.get('/employee/attendance', { params }),
  checkIn: (data) => api.post('/employee/check-in', data),
  checkOut: (data) => api.post('/employee/check-out', data),
  getSalary: (params) => api.get('/employee/salary', { params }),
  getBankDetails: () => api.get('/employee/bank-details'),
  updateBankDetails: (data) => api.post('/employee/bank-details', data),
  applyLeave: (data) => api.post('/employee/leave-apply', data),
};

// Employer Endpoints
export const employerAPI = {
  getDashboard: () => api.get('/employer/dashboard'),
  getEmployees: () => api.get('/employer/employees'),
  getCredits: () => api.get('/employer/credits/balance'),
  getTransactions: () => api.get('/employer/transactions'),
};

export default api;
