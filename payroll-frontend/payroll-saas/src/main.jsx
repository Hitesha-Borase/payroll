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

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <RegionalProvider>
        <AuthProvider>
          <PayPalScriptProvider options={{ "client-id": "AZv9QxgSKA7EX8CwdLaIE8R_k6xA3kAl2HusjEsewykrACj2UEK6Z5v51GX6IIx6zhPaj1RCM2xKb6gC", currency: "USD" }}>
            <App />
          </PayPalScriptProvider>
        </AuthProvider>
      </RegionalProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
