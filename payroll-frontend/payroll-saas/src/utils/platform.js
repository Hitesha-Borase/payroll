import { Capacitor } from '@capacitor/core';

/**
 * Detects if the application is running inside a native Capacitor shell
 * (e.g., Capacitor Android APK or iOS native shell).
 * Uses official runtime detection rather than user-agent sniffing.
 * 
 * @returns {boolean} true if running in native app, false in web/PWA browser.
 */
export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch (err) {
    return false;
  }
};

/**
 * Detects if the web application is running as an installed PWA
 * (standalone display mode, iOS home screen bookmark, or Android TWA wrapper).
 * 
 * @returns {boolean} true if running in installed PWA standalone mode.
 */
export const isInstalledPWA = () => {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator && window.navigator.standalone === true;
    const isAndroidReferrer = typeof document !== 'undefined' && 
      document.referrer && 
      document.referrer.includes('android-app://');

    return Boolean(isStandaloneDisplay || isIOSStandalone || isAndroidReferrer);
  } catch (err) {
    return false;
  }
};

/**
 * Centralized rule to determine whether PWA installation UI / buttons should be shown.
 * 
 * Rule:
 * showInstallApp = !isNativeApp && !isInstalledPWA && canInstallPWA;
 * 
 * In Capacitor Android APK: always returns false.
 * In Installed PWA: always returns false.
 * In Web / Mobile browser: returns true when canInstallPWA is true.
 * 
 * @param {boolean} canInstallPWA - whether the browser event or platform allows installation
 * @returns {boolean}
 */
export const shouldShowInstallApp = (canInstallPWA = false) => {
  if (isNativeApp()) return false;
  if (isInstalledPWA()) return false;
  return Boolean(canInstallPWA);
};

export default {
  isNativeApp,
  isInstalledPWA,
  shouldShowInstallApp,
};
