import { useState, useEffect, useCallback } from 'react';
import { PWA_CONFIG } from './pwaConfig';
import { isNativeApp, isInstalledPWA, shouldShowInstallApp } from '../utils/platform';

/**
 * usePWA Custom Hook
 * Provides full PWA lifecycle state (Install prompt, isStandalone, isOnline, hasUpdate)
 * Intelligently suppresses installation mechanisms inside Capacitor Native shells (e.g. Android APK).
 */
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => isInstalledPWA() || isNativeApp());
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasUpdate, setHasUpdate] = useState(false);

  const native = isNativeApp();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running as installed standalone app or native shell
    const checkStandalone = () => {
      const standalone = isInstalledPWA() || isNativeApp();
      setIsInstalled(standalone);
    };
    checkStandalone();

    // Check if iOS device (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Handlers for PWA events
    const handleBeforeInstallPrompt = (e) => {
      // In native Capacitor Android app, NEVER register or use beforeinstallprompt
      if (isNativeApp()) {
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      console.log('[PWA] Application successfully installed.');
    };

    // Listen for network connectivity changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for SW update
    const handleUpdate = () => setHasUpdate(true);

    // Register event listeners
    // Rule: Ensure beforeinstallprompt only runs in browser/PWA-capable web environment
    if (!native) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa-update-available', handleUpdate);

    // Listen for display mode changes (e.g. user launches standalone)
    let mediaMatcher = null;
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };
    try {
      mediaMatcher = window.matchMedia('(display-mode: standalone)');
      if (mediaMatcher.addEventListener) {
        mediaMatcher.addEventListener('change', handleMediaChange);
      } else if (mediaMatcher.addListener) {
        mediaMatcher.addListener(handleMediaChange);
      }
    } catch {
      // Media query listener not supported
    }

    return () => {
      if (!native) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-update-available', handleUpdate);
      if (mediaMatcher) {
        if (mediaMatcher.removeEventListener) {
          mediaMatcher.removeEventListener('change', handleMediaChange);
        } else if (mediaMatcher.removeListener) {
          mediaMatcher.removeListener(handleMediaChange);
        }
      }
    };
  }, [native]);

  // Trigger Native Install Prompt
  const promptInstall = useCallback(async () => {
    // In native Capacitor Android APK, installation is not supported
    if (isNativeApp()) {
      return { outcome: 'native_shell' };
    }

    if (!deferredPrompt) {
      return { outcome: 'unavailable' };
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      return choiceResult;
    } catch (err) {
      console.error('[PWA] Install prompt failed:', err);
      return { outcome: 'error', error: err };
    }
  }, [deferredPrompt]);

  // Reload for App Update
  const reloadApp = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // Shared platform & installation states:
  // canInstallPWA: true if browser environment supports PWA installation (via deferred prompt or iOS instructions)
  const canInstallPWA = !native && !isInstalled && (isInstallable || isIOS);
  // showInstallApp: !isNativeApp && !isInstalledPWA && canInstallPWA
  const showInstallApp = shouldShowInstallApp(canInstallPWA);

  return {
    isInstallable: !native && isInstallable,
    isInstalled,
    isInstalledPWA: isInstalledPWA(),
    isNativeApp: native,
    canInstallPWA,
    showInstallApp,
    isIOS: !native && isIOS,
    isOnline,
    hasUpdate,
    promptInstall,
    reloadApp,
    pwaConfig: PWA_CONFIG,
  };
}

export default usePWA;
