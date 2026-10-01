import { Platform } from 'react-native';

// In development, Android emulator connects to host via 10.0.2.2, iOS simulator via localhost, and real devices via your local Wi-Fi IP address.
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

export const CONFIG = {
  API_BASE_URL: DEV_API_URL,
  APP_NAME: 'Kiaan Payroll & HRMS',
  VERSION: '1.0.0',
};
