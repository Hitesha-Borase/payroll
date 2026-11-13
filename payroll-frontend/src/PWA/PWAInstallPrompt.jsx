import React, { useState, useEffect } from 'react';
import { usePWA } from './usePWA';
import { PWA_CONFIG } from './pwaConfig';
import { 
  Download, X, Smartphone, WifiOff, 
  RefreshCw, CheckCircle2, Share, PlusSquare 
} from 'lucide-react';
import './PWAInstallPrompt.css';

/**
 * PWAInstallPrompt Component
 * 
 * Manages:
 * 1. PWA Install App banner & button (Web & Mobile browser only; NEVER in Capacitor Android APK or Installed PWA)
 * 2. iOS Add to Home Screen Instructions Modal (Browser only; NEVER in native app)
 * 3. Offline notification bar
 * 4. App version update notification
 */
export const PWAInstallPrompt = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isNativeApp,
    showInstallApp,
    isIOS, 
    isOnline, 
    hasUpdate, 
    promptInstall, 
    reloadApp 
  } = usePWA();

  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Check if previously dismissed (browser only)
  useEffect(() => {
    if (isNativeApp) return;
    try {
      const dismissedUntil = localStorage.getItem(PWA_CONFIG.DISMISS_STORAGE_KEY);
      if (dismissedUntil && new Date().getTime() < Number(dismissedUntil)) {
        setDismissed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [isNativeApp]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const expiry = new Date().getTime() + PWA_CONFIG.DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(PWA_CONFIG.DISMISS_STORAGE_KEY, String(expiry));
    } catch {
      // ignore storage errors
    }
  };

  const handleInstallClick = async () => {
    // If native app, this should never be callable
    if (isNativeApp) return;

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setInstalling(true);
      const result = await promptInstall();
      setInstalling(false);
      if (result?.outcome === 'accepted') {
        setDismissed(true);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  // Condition to show installation UI:
  // Must NOT be native Capacitor app, must NOT be installed PWA, must be installable, and not dismissed
  const canShowInstallUI = !isNativeApp && !isInstalled && showInstallApp && !dismissed;

  return (
    <>
      {/* 1. Offline Notification Bar (Network state) */}
      {!isOnline && (
        <div className="pwa-offline-bar">
          <div className="pwa-offline-content">
            <WifiOff size={16} />
            <span>You are currently offline. Using cached offline data.</span>
          </div>
        </div>
      )}

      {/* 2. New Version Available Banner */}
      {hasUpdate && (
        <div className="pwa-update-bar">
          <div className="pwa-update-content">
            <RefreshCw size={16} className="pwa-spin" />
            <span>A new version of Kiaan Payroll is available!</span>
            <button onClick={reloadApp} className="pwa-update-btn">
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* 3. PWA Install App Banner (Visible ONLY in Web / Mobile Browser when installable) */}
      {canShowInstallUI && (
        <div 
          className="pwa-install-banner" 
          role="region" 
          aria-label="Install Kiaan Payroll Application"
          id="pwa-install-banner"
        >
          <div className="pwa-install-banner-content">
            <div className="pwa-install-banner-icon">
              <Smartphone size={22} className="text-white" />
            </div>
            <div className="pwa-install-banner-info">
              <div className="pwa-install-banner-title">Install Kiaan Payroll</div>
              <div className="pwa-install-banner-desc">Install app for instant home screen access and offline capabilities.</div>
            </div>
            <div className="pwa-install-banner-actions">
              <button 
                type="button" 
                className="btn pwa-install-btn" 
                onClick={handleInstallClick}
                disabled={installing}
                id="pwa-install-button"
                aria-label="Install App"
              >
                <Download size={14} className="me-1" />
                {installing ? 'Installing...' : 'Install App'}
              </button>
              <button 
                type="button" 
                className="btn pwa-dismiss-btn" 
                onClick={handleDismiss}
                id="pwa-dismiss-button"
                aria-label="Dismiss installation banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. iOS / Safari Add to Home Screen Instructions Modal (NEVER in Capacitor Native App) */}
      {!isNativeApp && !isInstalled && showIOSModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowIOSModal(false)}>
          <div className="pwa-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <div className="d-flex align-items-center gap-2">
                <Smartphone size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Install on your Device</h5>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="btn-close"
                aria-label="Close"
              />
            </div>

            <div className="pwa-modal-body">
              <p className="text-muted small mb-3">
                Follow these simple steps to install <strong>Kiaan Payroll</strong> on your phone or computer:
              </p>

              <div className="pwa-step-list">
                <div className="pwa-step-item">
                  <div className="pwa-step-number">1</div>
                  <div className="pwa-step-text">
                    Tap the <strong>Share</strong> icon <Share size={15} className="inline text-primary" /> (Safari) or menu <strong>⋮</strong> (Chrome/Edge).
                  </div>
                </div>

                <div className="pwa-step-item">
                  <div className="pwa-step-number">2</div>
                  <div className="pwa-step-text">
                    Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare size={15} className="inline text-primary" /> or <strong>"Install App"</strong>.
                  </div>
                </div>

                <div className="pwa-step-item">
                  <div className="pwa-step-number">3</div>
                  <div className="pwa-step-text">
                    Tap <strong>Add / Install</strong> to launch full-screen directly from your home screen.
                  </div>
                </div>
              </div>

              <div className="pwa-benefit-box mt-3">
                <div className="d-flex align-items-center gap-2 text-success small fw-bold mb-1">
                  <CheckCircle2 size={14} /> Benefits of Installing:
                </div>
                <ul className="small text-muted mb-0 ps-3">
                  <li>Instant 1-tap launcher on your mobile home screen</li>
                  <li>Works even during low network or offline mode</li>
                  <li>Real-time attendance & salary notifications</li>
                </ul>
              </div>
            </div>

            <div className="pwa-modal-footer">
              <button 
                onClick={() => setShowIOSModal(false)}
                className="btn btn-primary btn-sm w-100 fw-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
