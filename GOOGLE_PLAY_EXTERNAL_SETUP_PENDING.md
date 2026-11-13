# KIAAN PAYROLLPLUS — GOOGLE PLAY EXTERNAL SETUP PENDING
## EXTERNAL CONFIGURATION & PUBLISHING CHECKLIST

**Project:** Kiaan PayrollPlus SaaS (Android App: `com.kiaan.payroll`)  
**Lead Engineer:** Principal Architect & Production Readiness Auditor  
**Date:** 2026-11-06  
**Status:** **AUTHORITATIVE EXTERNAL PENDING DISCLOSURE — NO FAKE VERIFICATION**

---

## 1. PURPOSE OF THIS DOCUMENT

In accordance with strict audit rules, **never fabricate successful API verification or invent external configurations**. While the entire backend and frontend integration for Google Play Billing has been written, hardened, and verified via isolated sandboxed tests, live communication with Google servers requires external configuration in Google Cloud and Google Play Console.

This document identifies the exact external items that must be configured by the project owner before live Google Play purchases can be processed.

---

## 2. PENDING EXTERNAL BLOCKERS & CONFIGURATION STEPS

### Blocker 1: Google Cloud Service Account Credentials
- **Requirement:** A Google Cloud service account with permissions to access the Google Play Developer API (`androidpublisher.googleapis.com`).
- **Required Roles:**
  - `Android Publisher` (configured in Google Play Console under **API Access**)
- **Target File Location:**
  - Create directory: `payroll-backend/config/google/`
  - Save key file: `payroll-backend/config/google/play-billing-service-account.json`
- **Environment Variable Update (`payroll-backend/.env`):**
  ```env
  GOOGLE_PLAY_PACKAGE_NAME=com.kiaan.payroll
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH=config/google/play-billing-service-account.json
  ```
- **Backend Current Behavior:**
  When this key is absent, the backend **fails closed**:
  ```json
  {
    "success": false,
    "message": "Google Play Developer API service account credentials are not configured on this server.",
    "setupPending": true
  }
  ```

---

### Blocker 2: Google Play Console In-App Subscription Setup
The following three subscription products and base plans must be created in the **Google Play Console** under **Monetize > Subscriptions**:

#### Product 1: Starter Plan
- **Product ID:** `payroll_plan_starter`
- **Name:** Starter Plan
- **Base Plan ID:** `starter-monthly`
- **Type:** Auto-renewing
- **Billing Period:** 1 Month
- **Price:** ₹700.00 INR (Tax Inclusive)
- **Grace Period:** 7 Days recommended

#### Product 2: Professional Plan
- **Product ID:** `payroll_plan_pro`
- **Name:** Professional Plan
- **Base Plan ID:** `pro-monthly`
- **Type:** Auto-renewing
- **Billing Period:** 1 Month
- **Price:** ₹900.00 INR (Tax Inclusive)
- **Grace Period:** 7 Days recommended

#### Product 3: Premium Plan
- **Product ID:** `payroll_plan_premium`
- **Name:** Premium Plan
- **Base Plan ID:** `premium-monthly`
- **Type:** Auto-renewing
- **Billing Period:** 1 Month
- **Price:** ₹1,200.00 INR (Tax Inclusive)
- **Grace Period:** 7 Days recommended

---

### Blocker 3: Real-Time Developer Notifications (Pub/Sub RTDN)
To receive automated webhook notifications for subscription renewals, cancellations, grace periods, and refunds:

1. **Google Cloud Pub/Sub Topic:**
   - Create Topic: `projects/<your-gcp-project>/topics/play-subscription-notifications`
2. **Grant Publisher Role to Google Play:**
   - Add principal: `google-play-developer-notifications@system.gserviceaccount.com`
   - Role: `Pub/Sub Publisher`
3. **Configure Pub/Sub Push Subscription:**
   - Delivery Type: **Push**
   - Push Endpoint URL: `https://<your-production-backend-domain>/api/payment/google-play/rtdn-webhook?token=<secret-verification-token>`
4. **Environment Variable Update (`payroll-backend/.env`):**
   ```env
   GOOGLE_PUBSUB_VERIFICATION_TOKEN=your_generated_secure_webhook_token_here
   ```
5. **Google Play Console Integration:**
   - Navigate to **Monetize > Monetization setup > Real-time developer notifications**.
   - Set Topic Name to the created Pub/Sub topic.
   - Click **Send Test Notification** to verify delivery.

---

### Blocker 4: Google Play License Testing Accounts
- Add internal tester Gmail accounts in Google Play Console under **Settings > License testing**.
- Set License response to `LICENSED`.
- Allows end-to-end testing of subscription purchases on physical Android devices using real Google Play UI without debiting real bank accounts.

---

## 3. LOCAL APPLICATION STATUS SUMMARY

| Component | Code / Schema Status | External Live Status |
|---|---|---|
| **`googlePlay.service.js`** | **COMPLETED & VERIFIED** | Awaiting service-account JSON |
| **`googlePlay.controller.js`** | **COMPLETED & VERIFIED** | Ready for live webhook traffic |
| **Database `pop_db`** | **MIGRATED & VERIFIED** | Ready for live Google Play records |
| **Android Native Plugin** | **COMPLETED (Billing 9.1.0)** | Ready for testing in release build |
| **Frontend Billing Service** | **COMPLETED & VERIFIED** | Ready for live Android devices |
| **Rate Limiter & Masking** | **ACTIVE & VERIFIED** | Production-ready |

**Nothing has been deployed to production. Local testing remains strictly sandboxed.**

