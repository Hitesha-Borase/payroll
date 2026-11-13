# KIAAN PAYROLLPLUS — OPTION B CANONICAL PLAN MAPPING MATRIX

**Status:** APPROVED & SYNCHRONIZED  
**Authoritative Version:** Option B  
**Target Date:** 2026-11-05  

---

## 1. Executive Summary

To eliminate the billing discrepancies and mapping collisions that affected PetCare Pro (such as cross-plan activation, mismatched pricing, and broken entitlements), Kiaan PayrollPlus establishes a **Single Authoritative Canonical Subscription Catalog (Option B)** across all tiers of the full-stack architecture.

Every layer of the application—Database, Backend Services, Frontend Landing Page, Admin Dashboards, SuperAdmin Management, Google Play Billing Plugin, and Razorpay Gateway—is synchronized against this authoritative matrix.

---

## 2. Canonical Plan Catalog Matrix (Option B)

| Plan ID | Plan Code | Display Name | Price (INR) | Duration | Employee Limit | Google Play Product ID | Google Play Base Plan ID | Auto-Assign Trigger | Payment Gateway |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | `starter` | **Starter Plan** | ₹700.00 | 1 Month (30 Days) | 15 Employees | `payroll_plan_starter` | `starter-monthly` | Upgrade / Direct Purchase | Razorpay / Google Play |
| **2** | `pro` | **Professional Plan** | ₹900.00 | 1 Month (30 Days) | 50 Employees | `payroll_plan_pro` | `pro-monthly` | Upgrade / Direct Purchase | Razorpay / Google Play |
| **3** | `premium` | **Premium Plan** | ₹1,200.00 | 1 Month (30 Days) | 100 Employees | `payroll_plan_premium` | `premium-monthly` | Upgrade / Direct Purchase | Razorpay / Google Play |
| **4** | `trial` | **Free Trial** | ₹0.00 | 7 Days | 10 Employees | *N/A (Free)* | *N/A* | User / Company Registration | Free Trial Auto-Assign |
| **5** | `enterprise` | **Enterprise Plan** | Custom (₹0 / Quote) | 12 Months (Custom) | Unlimited (`NULL`) | *N/A (B2B Contract)* | *N/A* | Super Admin Provisioning | Manual / Wire / Invoice |

---

## 3. Layer-by-Layer Synchronization Audit

### 3.1 Database Schema (`plans` table)
- **Table:** `pop_db.plans` (Engine: InnoDB)
- **Columns:** `id (PK)`, `name`, `price (DECIMAL 10,2)`, `duration_months (INT)`, `description`, `features (JSON)`, `max_employees (INT NULL)`, `max_jobs (INT)`, `is_active (TINYINT)`
- **Behavior:**
  - `id = 1`: `name = 'Starter Plan'`, `price = 700.00`, `max_employees = 15`
  - `id = 2`: `name = 'Professional Plan'`, `price = 900.00`, `max_employees = 50`
  - `id = 3`: `name = 'Premium Plan'`, `price = 1200.00`, `max_employees = 100`
  - `id = 4`: `name = 'Free Trial'`, `price = 0.00`, `max_employees = 10`
  - `id = 5`: `name = 'Enterprise Plan'`, `price = 0.00`, `max_employees = NULL` (unlimited)
  - `AUTO_INCREMENT = 6`

### 3.2 Backend Google Play Billing Service (`googlePlay.service.js`)
- **File:** `payroll-backend/src/services/googlePlay.service.js`
- **Mapping:**
  - `payroll_plan_starter` ➔ `plan_id: 1`, `price: 700.00`, `max_employees: 15`, `base_plan_id: 'starter-monthly'`
  - `payroll_plan_pro` ➔ `plan_id: 2`, `price: 900.00`, `max_employees: 50`, `base_plan_id: 'pro-monthly'`
  - `payroll_plan_premium` ➔ `plan_id: 3`, `price: 1200.00`, `max_employees: 100`, `base_plan_id: 'premium-monthly'`
- **Validation:** 100% matched with Option B.

### 3.3 Backend Registration & Login Controller (`auth.controller.js`)
- **File:** `payroll-backend/src/controllers/auth.controller.js`
- **Fix Applied:**
  - Lines 95 & 153: Registration auto-assign subscription updated from hardcoded `plan_id = 1` (Starter) to `plan_id = 4` (Free Trial).
  - Lines 324, 333, 434: First login 7-day trial sync updated from `s.plan_id = 1` to `s.plan_id = 4`.
- **Result:** Newly registered employers/admins are assigned Plan ID 4 (₹0, 10 employees, 7 days) instead of erroneously granting Plan ID 1.

### 3.4 Backend Razorpay Payment Controller (`payment.controller.js`)
- **File:** `payroll-backend/src/controllers/payment.controller.js`
- **Verification:**
  - Line 88: `SELECT * FROM plans WHERE id = ?`
  - Line 96: `expectedAmountInPaise = Math.round(parseFloat(plan.price || 0) * 100)`
  - Gateway amount verification strictly uses server-side database price. Client cannot tamper with prices.

### 3.5 Backend Plan Limits Middleware (`planLimits.middleware.js` & `planLimits.js`)
- **Files:** `payroll-backend/src/middlewares/planLimits.middleware.js`, `payroll-backend/src/config/planLimits.js`
- **Rule:** `COALESCE(s.max_employees, p.max_employees) AS max_employees`
- **Quota Boundaries:**
  - Starter: 15 staff members
  - Professional: 50 staff members
  - Premium: 100 staff members
  - Free Trial: 10 staff members
  - Enterprise: Unlimited (`NULL`)

### 3.6 Frontend Landing Page (`LandingPage.jsx`)
- **File:** `payroll-frontend/LandingPage.jsx`
- **Fix Applied:**
  - Line 179 & 186: Default selected plan ID initialized to `4` (Free Trial).
  - Lines 231-234: Fallback prices set to `₹ 700` (Starter), `₹ 900` (Pro), `₹ 1,200` (Premium).
  - Line 238: Plan code mapping: `{ starter: 1, pro: 2, premium: 3, trial: 4, custom: 5 }`. Default: `4`.

### 3.7 Frontend Google Play Service (`googleBilling.js`)
- **File:** `payroll-frontend/src/services/googleBilling.js`
- **Verification:**
  - `payroll_plan_starter`: `price: 700`, `maxEmployees: 15`
  - `payroll_plan_pro`: `price: 900`, `maxEmployees: 50`
  - `payroll_plan_premium`: `price: 1200`, `maxEmployees: 100`
- **Validation:** 100% matched with Option B.

### 3.8 Frontend Regional Pricing Context (`RegionalContext.jsx`)
- **File:** `payroll-frontend/src/context/RegionalContext.jsx`
- **Verification:**
  - `BASE_INR_PRICES = { trial: 0, starter: 700, pro: 900, premium: 1200, custom: 'Custom' }`
- **Validation:** 100% matched with Option B.

### 3.9 SuperAdmin Plan Management (`PlansManagement.jsx`)
- **File:** `payroll-frontend/src/Dashboard/SuperAdmin/PlansManagement.jsx`
- **Verification:**
  - Uses `superadminAPI.getAllPlans()` directly querying `plans` table.
  - Dynamically displays database records with zero hardcoding.

---

## 4. Protection Against Historical Failures (PetCare Pro Prevention)

| Failure Mode in PetCare Pro | Root Cause | Solution Implemented in PayrollPlus | Status |
|:---|:---|:---|:---:|
| **Cross-Plan Activation** (e.g. ₹700 purchase activating ₹900 plan) | Disconnected client SKU mapping | Google Play product ID resolved server-side in `googlePlay.service.js` directly to canonical `plan_id: 1` | **VERIFIED FIXED** |
| **₹900 purchase activating Free Trial** | Registration hardcoded default overriding active purchases | Free trial isolated to `plan_id: 4`; active purchases update `status = 'expired'` on prior subs | **VERIFIED FIXED** |
| **₹1,200 purchase activating Enterprise** | Unmapped fallbacks defaulting to max ID | Strict `GOOGLE_PLAY_PLAN_MAP` rejection if SKU is unrecognized (returns HTTP 400) | **VERIFIED FIXED** |
| **Tampered Checkout Prices** | Client-submitted amount passed to gateway | Backend queries `SELECT price FROM plans WHERE id = ?` and computes expected paise server-side | **VERIFIED FIXED** |
| **Stale Subscription Limits** | Reliance on volatile plan rows for grandfathered users | Subscriptions store snapshot `s.max_employees`, prioritized via `COALESCE(s.max_employees, p.max_employees)` | **VERIFIED FIXED** |
| **Token Theft / Replay Across Accounts** | Lack of purchase token uniqueness constraint | `uq_google_purchase_token` unique index + ownership check (`existing.employer_id !== empId`) | **VERIFIED FIXED** |

