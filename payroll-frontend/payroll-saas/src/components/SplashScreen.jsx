import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

/**
 * SplashScreen Component
 * Premium, lightweight, responsive startup splash screen for Web & PWA.
 * Fades out smoothly upon initial app readiness.
 */
export const SplashScreen = ({ minDuration = 1200, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in current session
    // (Still shows on initial app launch / PWA start / fresh tab)
    const splashShown = sessionStorage.getItem('kiaan_splash_shown');
    
    // Safety timer to prevent any infinite stall
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('kiaan_splash_shown', 'true');
        if (onComplete) onComplete();
      }, 400); // match CSS fade-out transition duration
    }, splashShown ? 600 : minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`kiaan-splash-container ${isFadingOut ? 'kiaan-splash-fade-out' : ''}`}
      role="status"
      aria-label="Loading Kiaan Technology"
    >
      {/* Background Ambient Glow */}
      <div className="kiaan-splash-bg-glow" />

      {/* Central Content Box */}
      <div className="kiaan-splash-content">
        {/* Animated Brand Logo */}
        <div className="kiaan-splash-logo-wrapper">
          <div className="kiaan-splash-logo-glow" />
          <img 
            src="/kiaan_logo.png" 
            alt="Kiaan Technology Logo" 
            className="kiaan-splash-logo"
          />
        </div>

        {/* Brand Name & Tagline */}
        <div className="kiaan-splash-text-group">
          <h1 className="kiaan-splash-title">
            KIAAN <span className="kiaan-splash-title-highlight">TECHNOLOGY</span>
          </h1>
          <p className="kiaan-splash-subtitle">
            Next-Gen Workforce & Payroll SaaS
          </p>
        </div>

        {/* Sleek Progress Bar */}
        <div className="kiaan-splash-progress-track">
          <div className="kiaan-splash-progress-bar" />
        </div>

        {/* Security / Compliance Badge */}
        <div className="kiaan-splash-badge">
          <span className="kiaan-splash-badge-dot" />
          <span>Enterprise Secure & Verified</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="kiaan-splash-footer">
        © 2026 Kiaan Technology • All Systems Operational
      </div>
    </div>
  );
};

export default SplashScreen;
