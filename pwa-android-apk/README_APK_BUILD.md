# Kiaan Payroll - PWA to Android APK

Yeh directory **PWA ko Android APK (.apk)** banane ke liye create ki gayi hai.

---

## Folder Structure
- `twa-manifest.json` : PWA settings (Domain, App Name, Icon, Package ID: `com.kiaantechnology.payroll`).
- `build/` : Is folder me generate hone ke baad `app-release-signed.apk` aayega.

---

## APK Generate Karne Ke 2 Tarike:

### Tarika 1: 1-Click Online Generator (PWABuilder - Sabse Aasan)
1. **[https://www.pwabuilder.com/](https://www.pwabuilder.com/)** open karein.
2. Apni live URL dalein: `https://payroll.kiaantechnology.com`
3. **"Package for Stores"** par click karein aur **Android** select karein.
4. **"Download Package" / "Generate APK"** par click karein.
5. Direct `.apk` file download ho jayegi.

### Tarika 2: Local CLI se (Bubblewrap)
Aapke computer me Java (JDK) install hone par aap is folder me terminal open karke yeh command chala sakte hain:
```bash
cd "d:\kiaan projects\payroll\pwa-android-apk"
npx @bubblewrap/cli build
```
Yeh command run hote hi `app-release-signed.apk` generate ho jayega.
