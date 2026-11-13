# KIAAN PAYROLLPLUS — PHASE 1D IMPLEMENTATION REPORT
## LOCAL pop_db MIGRATION + REGISTRATION & DATE BUG FIX

**Project:** Kiaan PayrollPlus SaaS (Web + Android Mobile)  
**Database:** Local `pop_db` (MariaDB 10.4.32-MariaDB via XAMPP)  
**Auditor & Implementation Lead:** Principal Architect, Database Specialist & Security Auditor  
**Date:** 2026-11-06  
**Status:** **PHASE 1D COMPLETE — ALL ACCEPTANCE CRITERIA VERIFIED PASS**

---

## EXECUTIVE SUMMARY

Phase 1D required executing the verified Phase 1C migration directly on the **ONLY** application database, **local `pop_db`**, resolving new user registration failures, fixing UTC/local date shift bugs, enforcing 7-day Free Trial boundaries, and verifying Option B plan catalog synchronization across the entire full-stack application.

### Key Milestones Achieved:
1. **Zero Cloned or Disposable Databases:** All operations were executed strictly against local `pop_db`.
2. **100% InnoDB Engine Migration:** All 26 legacy `MyISAM` tables were converted to `InnoDB` (`ROW_FORMAT = DYNAMIC`). Remaining MyISAM tables in `pop_db`: **0**. Total tables: **55 InnoDB**.
3. **Google Play Billing Schema Deployed:** Added 8 billing columns and performance indexes to `pop_db.subscriptions`, including unique un-truncated token index `uq_google_purchase_token (Sub_part = NULL)`.
4. **Option B Canonical Catalog Synchronized:** Authoritative plans 1 to 5 synchronized in `pop_db.plans` with `duration_days` support.
5. **Historical Subscriptions Preserved:** Subscriptions #1 and #2 remain 100% intact with end date `2027-10-28` and zero data corruption.
6. **Registration Pipeline Restructured & Fixed:** Discovered and repaired relational model disconnect between `users`, `employers`, and `companies`. New employers now seamlessly create all three entities and receive active Free Trial (`plan_id = 4`, 10 seats, 7 days).
7. **Date Shifting & Calculation Corrected:** Eliminated UTC/local 1-day subtraction bugs using local calendar string formatting. Free Trial is confirmed to be exactly 7 days (`DATEDIFF = 7`).
8. **Automated Test Scorecard:** 48/48 integration assertions PASSED with 100% success rate on `pop_db`. Baseline database counts (12 users, 2 employers, 1 company, 2 subscriptions) were fully restored post-test.

---

## 1. PRE-MIGRATION BACKUP & SAFETY BASELINE

Before any schema modification on `pop_db`, full consistency and restorable backups were established:

- **Target Database Environment:** MariaDB `10.4.32-MariaDB`, Port 3306, Database: `pop_db`
- **Active Backend Configuration:** Verified `payroll-backend/.env` points to `DB_NAME=pop_db`
- **Live Backup File:** `payroll-backend/backups/pop_db_live_backup_phase1d_exec.sql` (74,027 bytes, UTF-8 clean dump with routines & triggers)
- **Pre-Migration Baseline Counts:**
  - `users`: 12
  - `employers`: 2
  - `companies`: 1 (Acme Global Technologies Inc.)
  - `subscriptions`: 2 (both Plan 2, end_date `2027-10-28`, status `active`, auto_renew `1`)
  - `plans`: 3 (legacy)

---

## 2. DATABASE ENGINE CONVERSION RESULTS

All 26 transactional tables identified in the Phase 1C audit were converted to transactional InnoDB with `ROW_FORMAT = DYNAMIC`.

```sql
ALTER TABLE <table_name> ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
```

### Table Conversion Verification Table

| # | Table Name | Engine Before | Engine After | Row Format | Status |
|---|---|---|---|---|---|
| 1 | `admins` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 2 | `attendances` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 3 | `audit_logs` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 4 | `bank_details` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 5 | `beneficiaries` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 6 | `bills` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 7 | `companies` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 8 | `company_requests` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 9 | `credits` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 10 | `credit_transactions`| MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 11 | `employees` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 12 | `employers` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 13 | `employer_wallets` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 14 | `invoices` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 15 | `jobs` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 16 | `job_applications` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 17 | `payments` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 18 | `plans` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 19 | `resumes` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 20 | `roles` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 21 | `salary_records` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 22 | `subscriptions` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 23 | `transactions` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 24 | `users` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 25 | `vendors` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |
| 26 | `vendor_employers` | MyISAM | **InnoDB** | DYNAMIC | **VERIFIED PASS** |

### Database Engine Summary Query Result
```text
MariaDB [pop_db]> SELECT engine, COUNT(*) FROM information_schema.tables WHERE table_schema='pop_db' GROUP BY engine;
+--------+----------+
| engine | COUNT(*) |
+--------+----------+
| InnoDB |       55 |
+--------+----------+
1 row in set (0.005 sec)
```
- Remaining MyISAM tables in `pop_db`: **0**
- Total InnoDB tables: **55**

---

## 3. GOOGLE PLAY BILLING SCHEMA & INDEX VERIFICATION

The `subscriptions` table was upgraded with Google Play Billing columns and indexes:

```sql
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_gateway ENUM('razorpay', 'google_play', 'manual') NULL DEFAULT NULL AFTER auto_renew,
  ADD COLUMN IF NOT EXISTS google_product_id VARCHAR(100) NULL AFTER payment_gateway,
  ADD COLUMN IF NOT EXISTS google_base_plan_id VARCHAR(100) NULL AFTER google_product_id,
  ADD COLUMN IF NOT EXISTS google_purchase_token VARCHAR(500) NULL AFTER google_base_plan_id,
  ADD COLUMN IF NOT EXISTS google_order_id VARCHAR(100) NULL AFTER google_purchase_token,
  ADD COLUMN IF NOT EXISTS google_subscription_state VARCHAR(50) NULL AFTER google_order_id,
  ADD COLUMN IF NOT EXISTS max_employees INT NULL AFTER google_subscription_state,
  ADD COLUMN IF NOT EXISTS last_sync_at DATETIME NULL AFTER max_employees;

ALTER TABLE subscriptions
  ADD UNIQUE INDEX IF NOT EXISTS uq_google_purchase_token (google_purchase_token),
  ADD INDEX IF NOT EXISTS idx_subs_google_order (google_order_id),
  ADD INDEX IF NOT EXISTS idx_subs_gateway (payment_gateway);
```

### Verified Schema Output:
```text
Field                      Type                                     Null Key Default Extra
id                         int(11)                                  NO   PRI NULL    auto_increment
employer_id                int(11)                                  NO       NULL    
plan_id                    int(11)                                  NO       NULL    
start_date                 date                                     NO       NULL    
end_date                   date                                     NO       NULL    
status                     varchar(20)                              NO       pending 
auto_renew                 tinyint(1)                               YES      0       
payment_gateway            enum('razorpay','google_play','manual')  YES  MUL NULL    
google_product_id          varchar(100)                             YES      NULL    
google_base_plan_id        varchar(100)                             YES      NULL    
google_purchase_token      varchar(500)                             YES  UNI NULL    
google_order_id            varchar(100)                             YES  MUL NULL    
google_subscription_state  varchar(50)                              YES      NULL    
max_employees              int(11)                                  YES      NULL    
last_sync_at               datetime                                 YES      NULL    
created_at                 datetime                                 NO       current_timestamp()
updated_at                 datetime                                 NO       current_timestamp() on update
```

### PetCare Pro Prevention Check (Un-truncated Purchase Token Index):
```text
Table         Non_unique Key_name                 Column_name           Sub_part Index_type
subscriptions 0          uq_google_purchase_token google_purchase_token NULL     BTREE
subscriptions 1          idx_subs_google_order    google_order_id       NULL     BTREE
subscriptions 1          idx_subs_gateway         payment_gateway       NULL     BTREE
```
- `Sub_part = NULL` confirms the full 500 characters of `google_purchase_token` are indexed.
- No duplicate token collision can occur on purchase tokens sharing identical prefixes.

---

## 4. OPTION B CANONICAL SUBSCRIPTION CATALOG SYNCHRONIZATION

The `plans` table was updated with `duration_days INT NULL DEFAULT NULL` and populated with Option B authoritative plans:

```text
MariaDB [pop_db]> SELECT id, name, price, duration_months, duration_days, max_employees, is_active FROM plans ORDER BY id;
+----+-------------------+---------+-----------------+---------------+---------------+-----------+
| id | name              | price   | duration_months | duration_days | max_employees | is_active |
+----+-------------------+---------+-----------------+---------------+---------------+-----------+
|  1 | Starter Plan      |  700.00 |               1 |            30 |            15 |         1 |
|  2 | Professional Plan |  900.00 |               1 |            30 |            50 |         1 |
|  3 | Premium Plan      | 1200.00 |               1 |            30 |           100 |         1 |
|  4 | Free Trial        |    0.00 |               0 |             7 |            10 |         1 |
|  5 | Enterprise Plan   |    0.00 |              12 |           365 |          NULL |         1 |
+----+-------------------+---------+-----------------+---------------+---------------+-----------+
5 rows in set (0.001 sec)
```

### Option B Plan Specifications
1. **Plan 1 — Starter Plan:** ₹700/mo, 15 seats, 30 days tenure, Google Play SKU: `payroll_plan_starter`.
2. **Plan 2 — Professional Plan:** ₹900/mo, 50 seats, 30 days tenure, Google Play SKU: `payroll_plan_pro`.
3. **Plan 3 — Premium Plan:** ₹1,200/mo, 100 seats, 30 days tenure, Google Play SKU: `payroll_plan_premium`.
4. **Plan 4 — Free Trial:** ₹0, 10 seats, exactly 7 days tenure (`duration_months = 0, duration_days = 7`), auto-assigned to all new registrations.
5. **Plan 5 — Enterprise Plan:** Custom quote, unlimited seats (`max_employees = NULL`), 365 days tenure.

---

## 5. EXISTING CUSTOMER DATA PRESERVATION

Verified that existing customer subscriptions #1 and #2 were preserved without corruption:

```text
MariaDB [pop_db]> SELECT id, employer_id, plan_id, start_date, end_date, status, auto_renew, payment_gateway, max_employees FROM subscriptions WHERE id IN (1, 2);
+----+-------------+---------+------------+------------+--------+------------+-----------------+---------------+
| id | employer_id | plan_id | start_date | end_date   | status | auto_renew | payment_gateway | max_employees |
+----+-------------+---------+------------+------------+--------+------------+-----------------+---------------+
|  1 |           1 |       2 | 2026-10-28 | 2027-10-28 | active |          1 | NULL            | NULL          |
|  2 |           2 |       2 | 2026-10-28 | 2027-10-28 | active |          1 | NULL            | NULL          |
+----+-------------+---------+------------+------------+--------+------------+-----------------+---------------+
2 rows in set (0.001 sec)
```

- **Entitlement Preservation:** Both subscriptions point to `plan_id = 2` (Professional Plan, ₹900, 50 seats). Under `COALESCE(s.max_employees, p.max_employees)`, both accounts resolve to 50 employees.
- **Tenure Preservation:** Full expiry through `2027-10-28` is intact.
- **Data Integrity:** No synthetic gateway tags (`legacy_onboarding`) were introduced; `payment_gateway` remains `NULL`.

---

## 6. REGISTRATION BUG INVESTIGATION & CODE FIXES

### The Root Cause Disconnect:
Prior to this fix, new employer registrations were failing with broken sessions and missing permissions due to three architectural flaws:
1. **Missing Company Entity in `/auth/register`:** The registration endpoint inserted a record into `employers`, but left `users.company_id = NULL` and never inserted a row into `companies`. Downstream endpoints checking `req.user.company_id` failed with HTTP 403 or 400.
2. **Missing Employer Entity in `/payment/razorpay/verify-and-register`:** The checkout registration created `companies` and `admins`, but never created `employers`. Downstream endpoints querying `employers WHERE user_id = ?` returned 0 rows.
3. **Hardcoded Legacy Plan ID 1:** Frontend `AuthContext.jsx` line 130 hardcoded `plan_id: 1` during registration. Under Option B, Plan 1 is the paid Starter Plan (₹700), triggering Razorpay signature checks instead of granting the 7-day Free Trial.
4. **Validation Mismatch:** `auth.validation.js` rejected the `'company'` role passed by registration flows.
5. **Phone Number Not Persisted:** `users.phone` was not stored during employer onboarding.

### Code Files Modified & Verified:

#### 1. [`payroll-backend/src/controllers/auth.controller.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/controllers/auth.controller.js)
- **Lines 80-140 (`register`):**
  - Creates `companies` record with `subscription_plan = 'Free Trial'`.
  - Links `users.company_id = companyId` and persists `users.phone`.
  - Creates `employers` record linked to `company_id`.
  - Automatically provisions `subscriptions` record for Option B Free Trial: `plan_id = 4`, `status = 'active'`, `auto_renew = 0`, `max_employees = 10`, `start_date = CURRENT_DATE`, `end_date = CURRENT_DATE + 7 DAYS`.
  - Returns `company_id` in token and response payload.
- **Lines 320-375 (`login` & `adminLogin`):**
  - Resolves `company_id` for user session.
  - Inspects Free Trial subscriptions using `plan_id = 4`.
  - Allows expired accounts to log in with `isSubscriptionExpired: true` to view renewal and billing options without 403 lockouts.

#### 2. [`payroll-backend/src/controllers/payment.controller.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/controllers/payment.controller.js)
- **Lines 360-535 (`verifyAndRegister`):**
  - Updated `isFreeTrial` check to evaluate `Number(plan_id) === 4` (Option B) instead of `1`.
  - Creates both `companies` and `employers` records to maintain dual relational consistency.
  - Links `employer_id` to subscription.
  - Formats 7-day Free Trial dates without UTC shifts.

#### 3. [`payroll-backend/src/validations/auth.validation.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/validations/auth.validation.js)
- Added `'company'` alias to Joi role validation: `.valid('jobseeker', 'employer', 'company')`.

#### 4. [`payroll-frontend/src/context/AuthContext.jsx`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-frontend/src/context/AuthContext.jsx)
- Updated `registerCompany` line 130: corrected default registration payload from `plan_id: 1` to `plan_id: 4` (Free Trial).

#### 5. [`payroll-backend/src/utils/jwt.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/utils/jwt.js)
- Added `company_id: user.company_id || null` to JWT access token generation.

#### 6. [`payroll-backend/src/middlewares/auth.middleware.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/middlewares/auth.middleware.js)
- Added fallback lookup to query `employers` by `user.id` to dynamically resolve `company_id` if missing from legacy JWTs.

#### 7. [`payroll-backend/src/middlewares/planLimits.middleware.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/payroll-backend/src/middlewares/planLimits.middleware.js)
- Corrected ambiguous table join to:
  ```sql
  FROM companies c 
  LEFT JOIN employers e ON e.company_id = c.id 
  LEFT JOIN subscriptions s ON s.employer_id = e.id AND s.status = 'active' 
  LEFT JOIN plans p ON s.plan_id = p.id 
  WHERE c.id = ? 
  ORDER BY s.id DESC LIMIT 1
  ```

---

## 7. START_DATE & END_DATE LOGIC FIX (UTC SHIFT PREVENTION)

### The One-Day Shift Vulnerability:
When JavaScript runs `new Date().toISOString().split('T')[0]`, local time is converted to UTC. For users in India Standard Time (UTC+05:30), any timestamp generated between 00:00:00 and 05:29:59 IST rolls back to the previous day in UTC.
- *Example:* On `2026-11-06 01:00:00 IST`, `toISOString()` outputs `2026-11-05`, truncating the user's trial by one full calendar day.

### The Fix Implemented:
All dates saved to `pop_db` now use calendar component formatting:
```javascript
const now = new Date();
const startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const endObj = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const endDateStr = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`;
```
- **Free Trial Tenure:** Exactly 7 days (`DATEDIFF(end_date, start_date) = 7`).
- **Paid Monthly Tenure:** Exactly 1 calendar month (`endDate.setMonth(endDate.getMonth() + duration)`).
- **Graceful Expiration:** Accounts with `end_date <= CURRENT_DATE` are marked expired but are NOT blocked with HTTP 403, allowing full self-service upgrade/renewal.

---

## 8. AUTOMATED INTEGRATION TEST RESULTS ON pop_db

The integration test suite ([`scratch/test_phase1d_pop_db.js`](file:///c:/Users/dell/Desktop/playstore/payroll%20vishal/scratch/test_phase1d_pop_db.js)) was executed directly on `pop_db`.

### Scorecard Summary

```text
===============================================================
   KIAAN PAYROLLPLUS - PHASE 1D LOCAL POP_DB INTEGRATION TEST  
===============================================================

[PASS] Connected to local database "pop_db" (must be pop_db)
Pre-test baseline: 12 users, 2 employers, 1 companies, 2 subscriptions.

--- TEST 1: Standard Employer Registration (Free Trial) ---
[PASS] Registration returned HTTP 201 Created (got 201)
[PASS] Registration response success is true
[PASS] Access token returned
[PASS] Returned user email matches registration
[PASS] User company_id is populated (8)
[PASS] User record exists in pop_db.users
[PASS] User phone is saved in pop_db.users
[PASS] User company_id matches assigned company
[PASS] Company record created in pop_db.companies
[PASS] Company name is correct
[PASS] Company subscription_plan is Free Trial
[PASS] Employer profile created in pop_db.employers
[PASS] Employer company_id linked properly
[PASS] Subscription created in pop_db.subscriptions
[PASS] Subscription plan_id is 4 (Free Trial) (got 4)
[PASS] Plan name is Free Trial
[PASS] Plan price is ₹0.00
[PASS] Max employees quota is 10 (got 10)
[PASS] Subscription status is active
[PASS] Auto-renew is disabled (0) for Free Trial
[PASS] Duration DATEDIFF(end_date, start_date) is EXACTLY 7 DAYS (got 7)

--- TEST 2: Login with New Free Trial Account ---
[PASS] Login returned HTTP 200 OK
[PASS] Login returns resolved company_id: 8
[PASS] Login returns correct employer role
[PASS] Access token generated successfully on login

--- TEST 3: Employee Limit Middleware Quota Enforcement ---
[PASS] Employee limit middleware passes through when under quota
[PASS] Quota query resolves for newly registered company
[PASS] Resolved active employee quota is 10 for Free Trial (got 10)

--- TEST 4: Duplicate Email Handling ---
[PASS] Duplicate email registration returns HTTP 409 Conflict (got 409)
[PASS] Duplicate email response success is false

--- TEST 5: Security - Forbidden Role Rejection ---
[PASS] Public registration of 'superadmin' returns HTTP 400 Bad Request
[PASS] Security alert message returned

--- TEST 6: Company Registration via verifyAndRegister (Free Trial) ---
[PASS] verifyAndRegister for Free Trial returns HTTP 201 Created (got 201)
[PASS] verifyAndRegister success is true
[PASS] User email matches registered email
[PASS] Employer profile created for Company Admin B
[PASS] Subscription created via verifyAndRegister
[PASS] Subscription plan_id is 4 (Free Trial)
[PASS] Subscription quota is 10 employees
[PASS] Subscription duration is exactly 7 days (got 7)

--- TEST 7: Controlled Cleanup of Temporary Test Records in pop_db ---
Cleaned up temporary test records.

--- TEST 8: Baseline Integrity Verification ---
[PASS] User count returned to baseline: 12 == 12
[PASS] Subscription count returned to baseline: 2 == 2
[PASS] Company count returned to baseline: 1 == 1
[PASS] Employer count returned to baseline: 2 == 2
[PASS] Original subscriptions 1 and 2 exist
[PASS] Sub 1 end_date is preserved (2027-10-28) (got 2027-10-28)
[PASS] Sub 2 end_date is preserved (2027-10-28) (got 2027-10-28)

===============================================================
   ALL TESTS PASSED: 48/48 (100% SUCCESS)
===============================================================
```

---

## 9. FULL-STACK OPTION B SYNCHRONIZATION AUDIT

| Layer | Component | Option B Value | Status |
|---|---|---|---|
| **Database** | `pop_db.plans` | Starter ₹700, Pro ₹900, Premium ₹1,200, Trial ₹0 (7d), Enterprise Custom | **VERIFIED PASS** |
| **Backend Config** | `planLimits.js` | Starter: 15, Pro: 50, Premium: 100, Trial: 10, Enterprise: Unlimited | **VERIFIED PASS** |
| **Backend Google Play**| `googlePlay.service.js` | `payroll_plan_starter` (₹700), `payroll_plan_pro` (₹900), `payroll_plan_premium` (₹1200) | **VERIFIED PASS** |
| **Backend Razorpay** | `payment.controller.js` | Reads dynamically from `pop_db.plans` (no hardcoding) | **VERIFIED PASS** |
| **Backend Registration**| `auth.controller.js` | Auto-assigns `plan_id = 4` (7 days tenure, 10 employees) | **VERIFIED PASS** |
| **Frontend Pricing** | `PayrollPricingSection.jsx`| Starter ₹ 700/mo, Pro ₹ 900/mo, Premium ₹ 1,200/mo, Trial 7 Days | **VERIFIED PASS** |
| **Frontend Regional** | `RegionalContext.jsx` | Base INR: starter: 700, pro: 900, premium: 1200, trial: 0 | **VERIFIED PASS** |
| **Frontend Limits** | `planLimits.ts` | Starter: 15, Pro: 50, Premium: 100, Trial: 10, Enterprise: Unlimited | **VERIFIED PASS** |
| **Frontend Terms** | `TermsConditions.jsx` | Updated to ₹700, ₹900, ₹1,200 and 7-day Free Trial | **VERIFIED PASS** |
| **Google Play Console** | External SKUs | Subscription products in Play Console | **PENDING EXTERNAL SETUP** |

---

## 10. REMAINING RISKS & PENDING EXTERNAL ACTIONS

1. **Google Play Console Subscription Products:** The backend Google Play service is configured for `payroll_plan_starter`, `payroll_plan_pro`, and `payroll_plan_premium`. These product IDs and base plans must be registered in the Google Play Console prior to Android client testing.
2. **Google Service Account JSON:** `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH` in `.env` must point to a valid service account key with Android Publisher permissions before live Play Billing receipt verification can be tested.
3. **No Production Deployment:** This project is strictly local. No code or schema changes have been deployed to production.

---

## 11. CONCLUSION & GATE APPROVAL REQUEST

Phase 1D is **100% COMPLETE**.
- `pop_db` is fully converted to InnoDB with 0 MyISAM tables remaining.
- All 12 baseline users, 2 employers, 1 company, and 2 subscriptions remain perfectly intact.
- The registration failure root cause has been diagnosed, resolved, and verified via end-to-end automated tests.
- Date calculation and timezone shifts have been eliminated.
- The entire full-stack application conforms to Option B.

**STOPPED. Standing by for user review and explicit approval before proceeding to Phase 2.**

