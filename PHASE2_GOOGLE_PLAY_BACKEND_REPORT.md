# KIAAN PAYROLLPLUS — PHASE 2 IMPLEMENTATION REPORT
## GOOGLE PLAY BILLING BACKEND & SUBSCRIPTION SECURITY

**Project:** Kiaan PayrollPlus SaaS (Web + Android Mobile)  
**Database:** Local `pop_db` (MariaDB 10.4.32-MariaDB via XAMPP)  
**Auditor & Implementation Lead:** Principal Architect, Google Play Billing Specialist & Security Auditor  
**Date:** 2026-11-06  
**Status:** **PHASE 2 COMPLETE — ALL 92 ASSERTIONS VERIFIED PASS**

---

## EXECUTIVE SUMMARY

Phase 2 focused on architecting, hardening, and verifying a production-grade, authoritative server-side **Google Play Billing** backend and subscription lifecycle management system. The system enforces strict separation between Web (Razorpay) and Android native payments (Google Play Billing), completely distrusts client-provided pricing or entitlements, eliminates cross-tenant purchase token theft, safely handles real-time developer notifications (Pub/Sub RTDN), and guarantees zero disruption to existing customer data in local `pop_db`.

### Key Milestones Achieved:
1. **Zero Database Proliferation:** All operations, tests, and schema enhancements were executed strictly against local `pop_db`. Zero cloned or disposable databases were created.
2. **Authoritative Server-Side Verification Pipeline:** Client parameters (claimed price, employee quota, or expiry dates) are completely ignored. All entitlements are authoritatively resolved from Google Play Developer API (androidpublisher v3) and mapped strictly to canonical Option B plans.
3. **Fail-Closed Security Architecture:** Without valid Google Play service account credentials, verification calls fail closed (`isValid: false`, `setupPending: true`) with HTTP 503/400. No mock or dev bypass exists in production paths.
4. **Anti-Theft & Replay Protection:** A purchase token already registered to another tenant is blocked with **HTTP 409 Conflict**. Re-submissions by the owning tenant return **HTTP 200 idempotent success** without duplicate subscriptions, invoices, or payments.
5. **Full Lifecycle Webhook (RTDN):** Implemented handlers for all Google Play Pub/Sub notification types (New Purchase, Renewal, Cancellation, Grace Period, Account Hold, Payment Recovery, Restart, Paused, Revocation, Expiry) with out-of-order and message deduplication safeguards.
6. **Token & Secret Masking:** Full purchase tokens are never logged or exposed in client responses; all logging and payment notes use `maskToken(token)` format (`play_t...4571`).
7. **Referential Integrity Decoupling:** Fixed relational ambiguity between `employers.id` and `companies.id` across billing, invoicing, payments, and subscriptions.
8. **Automated Test Scorecard:** **92 / 92 test assertions PASSED** (100% success rate) directly on `pop_db`. Post-test baseline database counts (12 users, 2 employers, 1 company, 2 subscriptions) were fully restored.

---

## 1. PHASE 1D INTEGRITY VERIFICATION

Prior to commencing Phase 2 implementations, direct queries on local `pop_db` confirmed:
- **Storage Engines:** All 55 existing tables were verified as `InnoDB` (`ROW_FORMAT = DYNAMIC`). Remaining MyISAM tables: **0**.
- **Option B Canonical Plans:** 5 active plans confirmed (Starter ₹700/15 seats, Pro ₹900/50 seats, Premium ₹1200/100 seats, Free Trial ₹0/10 seats, Enterprise Custom).
- **Existing Subscriptions #1 and #2:** 100% intact with `plan_id = 2`, `end_date = 2027-10-28`, `status = active`, `auto_renew = 1`, and `payment_gateway = NULL`.
- **Pre-Test Baseline Counts:** Exactly 12 users, 2 employers, 1 company, 2 subscriptions.

---

## 2. GOOGLE PLAY BILLING BACKEND ARCHITECTURE

```
+-----------------------------------------------------------------------------------+
|                         ANDROID CLIENT (Capacitor Native)                         |
|   GooglePlayBillingPlugin.java (Billing Library 9.1.0) -> googleBilling.js        |
+-----------------------------------------+-----------------------------------------+
                                          |
                      1. Submits purchase_token & product_id
                                          v
+-----------------------------------------------------------------------------------+
|                        NODE.JS / EXPRESS BACKEND API                              |
|   POST /api/payment/google-play/verify (Authenticated + Rate Limited)             |
+-----------------------------------------+-----------------------------------------+
                                          |
              2. Authoritative Verification Request (androidpublisher v3)
                                          v
+-----------------------------------------------------------------------------------+
|                     GOOGLE PLAY DEVELOPER API (v3)                                |
|   purchases.subscriptionsv2.get({ packageName, token })                          |
|   - Verifies package name, line items, subscriptionState, expiryTime             |
+-----------------------------------------+-----------------------------------------+
                                          |
                        3. Authoritative Verification Result
                                          v
+-----------------------------------------------------------------------------------+
|                    SERVER-SIDE OPTION B ENFORCEMENT & pop_db                      |
|   - Replay check: SELECT ... FOR UPDATE (Reject 409 if cross-account)            |
|   - Map verified product_id -> Option B plan (Ignore client claims)              |
|   - Insert pop_db.subscriptions (employer_id, max_employees, gateway)            |
|   - Insert pop_db.invoices & pop_db.payments (Masked token notes)                 |
|   - Update pop_db.employers & pop_db.companies (status: active, plan: name)       |
|   - purchases.subscriptions.acknowledge (Authoritative Ack to Google)            |
+-----------------------------------------------------------------------------------+
```

---

## 3. CANONICAL PRODUCT & OPTION B PLAN MAPPING

| Product ID | Internal Plan ID | Plan Name | Price (MRP) | Max Employees | Base Plan ID | Duration |
|---|---|---|---|---|---|---|
| `payroll_plan_starter` | **1** | Starter Plan | ₹700.00 | 15 | `starter-monthly` | 1 Month (30d) |
| `payroll_plan_pro` | **2** | Professional Plan | ₹900.00 | 50 | `pro-monthly` | 1 Month (30d) |
| `payroll_plan_premium` | **3** | Premium Plan | ₹1,200.00 | 100 | `premium-monthly` | 1 Month (30d) |

### Strict Enforcement Rules:
- The Android client **CANNOT** specify or alter the price. The backend charges MRP based strictly on internal catalog.
- The Android client **CANNOT** specify or alter the employee limit. Quotas are snapshotted to `subscriptions.max_employees` from the server catalog.
- The Android client **CANNOT** force an expiry date. Dates derive from Google Play's `expiryTime` or server calendar month calculation.

---

## 4. RELATIONAL DATA MODEL CORRECTION (`employer_id` vs `company_id`)

### The Vulnerability Diagnosed:
In `pop_db`, an organization is represented by two related entities:
- `companies` table (identified by `companies.id`)
- `employers` table (identified by `employers.id`, linked via `employers.company_id = companies.id`)
- `subscriptions`, `invoices`, and `payments` tables store `employer_id` (referencing `employers.id`)

Earlier code paths frequently conflated `req.user.company_id` and `employerId`, which caused operations to target non-existent IDs whenever company and employer auto-increments diverged (e.g. Acme Global has `companies.id = 1` and `employers.id = 2`).

### The Solution Implemented in `googlePlay.controller.js`:
```javascript
let employerId = req.employer?.id || null;
let companyId = req.employer?.company_id || req.user?.company_id || null;

if (!employerId && req.user?.id) {
  const [empRows] = await connection.query(
    'SELECT id, company_id FROM employers WHERE user_id = ? OR company_id = ? LIMIT 1',
    [req.user.id, companyId]
  );
  if (empRows.length > 0) {
    employerId = empRows[0].id;
    if (!companyId) companyId = empRows[0].company_id;
  }
}
```
All subsequent writes:
- `subscriptions`, `invoices`, and `payments` store `employerId`.
- `employers` table is updated by `WHERE id = employerId`.
- `companies` table is updated by `WHERE id = companyId`.

---

## 5. DATABASE SCHEMA ENHANCEMENTS IN pop_db

Two non-destructive schema additions were applied to local `pop_db` to support robust RTDN event deduplication and out-of-order protection:

1. **`subscriptions.last_event_time_millis`:**
   ```sql
   ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_event_time_millis BIGINT NULL AFTER last_sync_at;
   ```
2. **`google_rtdn_events` Table:**
   ```sql
   CREATE TABLE IF NOT EXISTS google_rtdn_events (
     id INT AUTO_INCREMENT PRIMARY KEY,
     message_id VARCHAR(100) NOT NULL UNIQUE,
     purchase_token_masked VARCHAR(50) NULL,
     notification_type INT NOT NULL,
     event_time_millis BIGINT NOT NULL,
     subscription_id INT NULL,
     status VARCHAR(50) DEFAULT 'processed',
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_rtdn_msg (message_id),
     INDEX idx_rtdn_sub (subscription_id)
   ) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
   ```

- All 56 tables in `pop_db` are confirmed `InnoDB` with `ROW_FORMAT = DYNAMIC`. Remaining MyISAM tables: **0**.

---

## 6. RATE LIMITING & SECURITY DEFENSES

1. **Rate Limiting Middleware ([`rateLimit.middleware.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/middlewares/rateLimit.middleware.js)):**
   - Configured with a sliding window of 15 minutes and max 30 verification attempts per client.
   - Applied to `POST /api/payment/google-play/verify`.
   - Returns standard `HTTP 429 Too Many Requests` with `Retry-After` header upon violation.
2. **SQL Transaction & Row-Level Locking:**
   - Verification runs within `connection.beginTransaction()`.
   - Replay check executes `SELECT ... FOR UPDATE` on `google_purchase_token`.
   - Eliminates concurrency race conditions during simultaneous token verifications.
3. **Secret Masking:**
   - All console logs, API responses, and database payment notes execute `maskToken(token)`.
   - Full raw purchase tokens and service account private keys are never leaked to logs or client responses.

---

## 7. AUTOMATED INTEGRATION TEST SCORECARD

The Phase 2 test suite ([`scratch/test_phase2_google_play_backend.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/scratch/test_phase2_google_play_backend.js)) was executed directly against `pop_db`:

| Test Group | Assertions | Result | Details |
|---|---|---|---|
| **Test 1: Diagnostic Setup & Fail-Closed** | 7 | **PASS** | Package name verified; unconfigured credentials fail closed (`isValid: false`, `setupPending: true`). |
| **Test 2: Authoritative Plans Catalog** | 5 | **PASS** | HTTP 200; Option B Starter (₹700/15), Pro (₹900/50), Premium (₹1200/100) verified. |
| **Test 3: Controlled Tenant Provisioning** | 2 | **PASS** | Isolated tenants A and B provisioned in `pop_db`. |
| **Test 4: Mock Client Injection** | 1 | **PASS** | Mock client safely injected strictly in `NODE_ENV = 'test'`. |
| **Test 5: Negative & Fraud Tests** | 10 | **PASS** | Missing token (400), invalid token (400), wrong package (400), expired token (400), on hold (400), unmapped product (400). |
| **Test 6: Successful Verification & Activation** | 22 | **PASS** | Option B Plan 1 activated; claimed params ignored; subscription, invoice, and payment created; masked notes. |
| **Test 7: Cross-Account Theft & Replay** | 5 | **PASS** | Cross-tenant replay rejected (409 Conflict); tenant B gets 0 access; idempotent resubmit succeeds (200 OK, already_active). |
| **Test 8: RTDN Pub/Sub Lifecycle** | 29 | **PASS** | Events 1, 2, 3, 5, 6, 7, 12 tested; out-of-order stale event skipped; message deduplication verified. |
| **Test 9: Controlled Test Cleanup** | 1 | **PASS** | All temporary test records removed cleanly from `pop_db`. |
| **Test 10: Baseline Integrity Verification** | 10 | **PASS** | 12 users, 2 employers, 1 company, 2 subscriptions restored; Subs #1 and #2 preserved with `end_date = 2027-10-28`. |
| **TOTAL SCORECARD** | **92 / 92** | **PASS** | **100% SUCCESS RATE** |

---

## 8. CODE FILES MODIFIED / CREATED

1. [`payroll-backend/src/services/googlePlay.service.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/services/googlePlay.service.js) — Authoritative Google Play verification service with fail-closed checks, setup diagnostics, and Option B mapping.
2. [`payroll-backend/src/controllers/googlePlay.controller.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/controllers/googlePlay.controller.js) — Verification, tenant isolation, anti-theft 409 rejection, token masking, and 10 RTDN lifecycle handlers.
3. [`payroll-backend/src/routes/payment.routes.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/routes/payment.routes.js) — Route definitions with rate limiting and diagnostic status endpoints.
4. [`payroll-backend/src/middlewares/rateLimit.middleware.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/middlewares/rateLimit.middleware.js) — Sliding window rate limiter for verification endpoints.
5. [`payroll-frontend/src/App.jsx`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-frontend/src/App.jsx) — Added `/employer/upgrade-plan` and expanded `/admin/upgrade-plan` allowed roles.
6. [`payroll-frontend/src/components/TrialExpiryModal.jsx`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-frontend/src/components/TrialExpiryModal.jsx) — Corrected native Android upgrade routing to in-app upgrade flow.
7. [`scratch/test_phase2_google_play_backend.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/scratch/test_phase2_google_play_backend.js) — Comprehensive 92-assertion test suite.

---

## 9. CONCLUSION & GATE APPROVAL REQUEST

Phase 2 is **100% COMPLETE**.
- The Google Play Billing backend is securely integrated, architecturally hardened, and verified directly against local `pop_db`.
- Subscriptions #1 and #2, as well as baseline customer records, remain perfectly preserved.
- Work is strictly local. Zero deployments have been made.

**STOPPED. Standing by for user review and explicit approval before proceeding to Phase 3.**

