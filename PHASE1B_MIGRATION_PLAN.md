# KIAAN PAYROLLPLUS — PHASE 1B PRODUCTION MIGRATION PLAN FOR POP_DB

**Target Database:** `pop_db`  
**Database Server:** MariaDB 10.4.32 (XAMPP on Windows)  
**Safety Protocol:** Isolated verification complete. Approval required before execution on `pop_db`.  
**Backup Archive:** `payroll-backend/backups/pop_db_live_backup_20261105.sql` (151,788 bytes)  

---

## 1. Migration Overview & Pre-Conditions

### 1.1 Pre-Conditions Verified
1. **Live Backup Created & Tested:** A full backup was taken using `mysqldump` and tested by restoring cleanly into `payroll_isolated_final_safety`. Checksums matched 100%.
2. **Engine Conversion Validated:** All 25 MyISAM tables converted to InnoDB in isolation with zero row loss and zero key truncation.
3. **Full-Column Token Indexing Validated:** Full 500-character unique index on `google_purchase_token` verified in MariaDB 10.4 DYNAMIC row format with `Sub_part = NULL`.
4. **Option B Tested:** End-to-end purchasing, auto-assign, quota boundaries, and legacy subscription preservation verified in isolation.

---

## 2. Complete Migration SQL Script (`pop_db_phase1b_migration.sql`)

```sql
-- ==============================================================================
-- KIAAN PAYROLLPLUS - PHASE 1B COMPLETE MIGRATION SCRIPT
-- Target: pop_db (MariaDB 10.4.32)
-- ==============================================================================

USE pop_db;

-- ------------------------------------------------------------------------------
-- STEP 1: CONVERT ALL 25 MYISAM TABLES TO INNODB
-- ------------------------------------------------------------------------------
ALTER TABLE admins ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE advance_requests ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE bank_details ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE beneficiaries ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE bills ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE companies ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE credits ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE department ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE employees ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE employers ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE invoices ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE job_applications ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE job_seeker_education ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE job_seeker_experience ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE job_seeker_profiles ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE job_seeker_skills ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE job_seekers ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE jobs ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE payments ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE plans ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE subscriptions ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE support_tickets ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE user_requests ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE users ENGINE = InnoDB ROW_FORMAT = DYNAMIC;
ALTER TABLE vendors ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- ------------------------------------------------------------------------------
-- STEP 2: UPGRADE SUBSCRIPTIONS TABLE SCHEMA FOR GOOGLE PLAY BILLING
-- ------------------------------------------------------------------------------
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_gateway ENUM('razorpay', 'google_play', 'manual', 'legacy_onboarding') DEFAULT 'razorpay' AFTER auto_renew,
  ADD COLUMN IF NOT EXISTS google_product_id VARCHAR(100) NULL AFTER payment_gateway,
  ADD COLUMN IF NOT EXISTS google_base_plan_id VARCHAR(100) NULL AFTER google_product_id,
  ADD COLUMN IF NOT EXISTS google_purchase_token VARCHAR(500) NULL AFTER google_base_plan_id,
  ADD COLUMN IF NOT EXISTS google_order_id VARCHAR(100) NULL AFTER google_purchase_token,
  ADD COLUMN IF NOT EXISTS google_subscription_state VARCHAR(50) NULL AFTER google_order_id,
  ADD COLUMN IF NOT EXISTS max_employees INT NULL AFTER google_subscription_state,
  ADD COLUMN IF NOT EXISTS last_sync_at DATETIME NULL AFTER max_employees;

-- Add Unique and Performance Indexes safely
ALTER TABLE subscriptions
  ADD UNIQUE INDEX IF NOT EXISTS uq_google_purchase_token (google_purchase_token),
  ADD INDEX IF NOT EXISTS idx_subs_google_order (google_order_id),
  ADD INDEX IF NOT EXISTS idx_subs_gateway (payment_gateway);

-- ------------------------------------------------------------------------------
-- STEP 3: PRESERVE & GRANDFATHER EXISTING CUSTOMER SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
UPDATE subscriptions
SET max_employees = 50,
    payment_gateway = 'legacy_onboarding',
    updated_at = NOW()
WHERE id IN (1, 2) AND max_employees IS NULL;

-- ------------------------------------------------------------------------------
-- STEP 4: SYNCHRONIZE AUTHORITATIVE OPTION B CANONICAL SUBSCRIPTION PLANS
-- ------------------------------------------------------------------------------
INSERT INTO plans (id, name, price, duration_months, description, features, max_employees, max_jobs, is_active, created_at, updated_at)
VALUES
(
  1,
  'Starter Plan',
  700.00,
  1,
  'Ideal for startups, boutique agencies, and small offices up to 15 employees.',
  '["Up to 15 Active Employees","Automated Monthly Payroll & Salary Slips","Direct WhatsApp Slip Delivery","Attendance & Leave Tracking","Standard Support"]',
  15,
  5,
  1,
  NOW(),
  NOW()
),
(
  2,
  'Professional Plan',
  900.00,
  1,
  'Complete payroll, attendance, and compliance hub for expanding firms up to 50 employees.',
  '["Up to 50 Active Employees","Everything in Starter Plan","Job Recruitment & Candidate Tracking","Detailed Compliance & Tax Reports","Custom Allowances & Deductions","Priority Support"]',
  50,
  25,
  1,
  NOW(),
  NOW()
),
(
  3,
  'Premium Plan',
  1200.00,
  1,
  'Designed for enterprise workforces requiring statutory automation & multi-branch access up to 100 employees.',
  '["Up to 100 Active Employees","Everything in Professional Plan","Multi-Branch & Department Management","Comprehensive Vendor & Contractor Billing","Advanced Audit Logs & Activity Trails","Priority 24/7 Support"]',
  100,
  50,
  1,
  NOW(),
  NOW()
),
(
  4,
  'Free Trial',
  0.00,
  1,
  '7-Day Free Trial for Payroll & HRMS SaaS up to 10 employees.',
  '["Up to 10 Active Employees","Automated Salary Slips & Payroll Preview","Attendance & Leave Tracking","Employee Self-Service (ESS) Portal","Standard Support"]',
  10,
  5,
  1,
  NOW(),
  NOW()
),
(
  5,
  'Enterprise Plan',
  0.00,
  12,
  'Tailored enterprise solution for unlimited workforces, custom SLAs, and ERP integrations.',
  '["Unlimited Active Employees","Custom API & Webhook Integrations","Dedicated Cloud Database Node","Custom SLA & 24/7 Dedicated Relationship Manager","Custom Statutory & Governance Workflows"]',
  NULL,
  999,
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  duration_months = VALUES(duration_months),
  description = VALUES(description),
  features = VALUES(features),
  max_employees = VALUES(max_employees),
  max_jobs = VALUES(max_jobs),
  is_active = VALUES(is_active),
  updated_at = NOW();

ALTER TABLE plans AUTO_INCREMENT = 6;
```

---

## 3. Post-Migration Verification Queries

Immediately after execution, the following 3 SQL queries must be executed to verify success:

### Verification Query 1: Storage Engine Check
```sql
SELECT table_name, engine
FROM information_schema.tables
WHERE table_schema = 'pop_db' AND engine = 'MyISAM';
```
*Expected Result:* 0 rows returned (all 25 tables are InnoDB).

### Verification Query 2: Option B Plans Check
```sql
SELECT id, name, price, max_employees, duration_months, is_active
FROM pop_db.plans
ORDER BY id ASC;
```
*Expected Result:* Exactly 5 plans:
1. Starter Plan | ₹700.00 | 15 employees
2. Professional Plan | ₹900.00 | 50 employees
3. Premium Plan | ₹1200.00 | 100 employees
4. Free Trial | ₹0.00 | 10 employees
5. Enterprise Plan | ₹0.00 | Unlimited (`NULL`)

### Verification Query 3: Existing Subscriptions Check
```sql
SELECT id, employer_id, plan_id, start_date, end_date, status, payment_gateway, max_employees
FROM pop_db.subscriptions
WHERE id IN (1, 2);
```
*Expected Result:*
- Both records present.
- `plan_id = 2`
- `end_date = '2027-10-28'`
- `status = 'active'`
- `payment_gateway = 'legacy_onboarding'`
- `max_employees = 50`

---

## 4. Rollback Plan

If any error occurs during execution, the rollback can be completed in under 5 seconds using the verified backup:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root pop_db < "payroll-backend\backups\pop_db_live_backup_20261105.sql"
```

---

## 5. Explicit Approval Gate

Under Strict Safety Rule #8 and Phase 1B instructions:
**This migration script will NOT be executed on `pop_db` until the user provides explicit written authorization.**

