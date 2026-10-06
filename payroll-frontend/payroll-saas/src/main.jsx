import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { RegionalProvider } from './context/RegionalContext';
import ErrorBoundary from './components/ErrorBoundary';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { registerServiceWorker } from './PWA/registerServiceWorker';
import './i18n';

// Initialize PWA Service Worker for offline & caching capabilities
registerServiceWorker();

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <RegionalProvider>
        <AuthProvider>
          {paypalClientId ? (
            <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "USD", deferLoading: true }}>
              <App />
            </PayPalScriptProvider>
          ) : (
            <App />
          )}
        </AuthProvider>
      </RegionalProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
