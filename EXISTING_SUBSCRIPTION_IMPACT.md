# KIAAN PAYROLLPLUS — EXISTING SUBSCRIPTION IMPACT ANALYSIS

**Scope:** Protection of Live Customer Subscriptions in `pop_db`  
**Database Engine:** MariaDB 10.4.32 / InnoDB  
**Audit Date:** 2026-11-05  

---

## 1. Inventory of Existing Subscriptions in `pop_db`

Prior to any migration, a full inspection of the `subscriptions` table in `pop_db` was performed:

```sql
SELECT s.id, s.employer_id, e.company_name, u.email, s.plan_id, p.name AS plan_name,
       s.start_date, s.end_date, s.status, s.auto_renew, s.created_at
FROM subscriptions s
JOIN employers e ON s.employer_id = e.id
JOIN users u ON e.user_id = u.id
JOIN plans p ON s.plan_id = p.id;
```

### Result:

| Sub ID | Employer ID | Company Name | User Email | Plan ID | Plan Name | Start Date | End Date | Status | Auto Renew |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|:---:|:---:|
| **1** | 1 | Acme Global Technologies Inc. | employer@example.com | 2 | Professional Plan | 2026-10-28 | 2027-10-28 | `active` | 0 |
| **2** | 2 | Acme Global Technologies Inc. | employer2@example.com | 2 | Professional Plan | 2026-10-28 | 2027-10-28 | `active` | 0 |

---

## 2. Entitlement Preservation & Risk Assessment

### 2.1 Subscription Expiry Date Protection
- **Current End Date:** `2027-10-28` (Valid for 1 full year).
- **Rule:** Under no circumstance may the migration modify, recalculate, or shorten existing subscription end dates.
- **Verification:** Expiry dates remain strictly untouched (`2027-10-28`).

### 2.2 Plan ID Alignment Under Option B
- In the original schema, Plan ID 2 was designated as **Professional Plan**.
- Under approved **Option B**, Plan ID 2 is permanently maintained as **Professional Plan** (50 employee capacity, ₹900/mo).
- Therefore, existing customer subscriptions remain linked to **Plan ID 2**, ensuring seamless business continuity and UI consistency.

### 2.3 Entitlement Snapshot & Decoupling Protection
- In SaaS multi-tenant architectures, relying solely on `p.max_employees` creates a risk: if an administrator later alters the catalog in the SuperAdmin UI, grandfathered customer entitlements could be silently modified.
- To eliminate this risk, the migration adds column `max_employees INT NULL` to `subscriptions`.
- The middleware `checkEmployeeLimit` checks:
  ```sql
  COALESCE(s.max_employees, p.max_employees) AS max_employees
  ```
- By explicitly populating `s.max_employees = 50` for Subscriptions #1 and #2:
  ```sql
  UPDATE subscriptions
  SET max_employees = 50,
      payment_gateway = 'legacy_onboarding'
  WHERE id IN (1, 2) AND max_employees IS NULL;
  ```
  The customer's 50-employee quota is permanently locked to their subscription record. Even if catalog prices or quotas change in the future, these grandfathered subscriptions will retain their 50-seat entitlement until `2027-10-28`.

---

## 3. Impact Assessment Summary Table

| Attribute | Before Migration | After Option B Migration | Impact |
|:---|:---:|:---:|:---:|
| **Subscription ID #1 Status** | `active` | `active` | **NO CHANGE** (Zero downtime) |
| **Subscription ID #2 Status** | `active` | `active` | **NO CHANGE** (Zero downtime) |
| **Plan ID** | 2 (Professional) | 2 (Professional) | **PRESERVED** |
| **Allowed Employee Quota** | 50 (via plans table) | 50 (locked via `s.max_employees`) | **PROTECTED & GRANDFATHERED** |
| **Subscription Start Date** | 2026-10-28 | 2026-10-28 | **UNTOUCHED** |
| **Subscription End Date** | 2027-10-28 | 2027-10-28 | **UNTOUCHED** (Full 1-year preserved) |
| **Customer Login & Access** | Working | Working | **PRESERVED** |
| **Employee Roster** | Preserved | Preserved | **PRESERVED** |
| **Payment Gateway Tag** | `NULL` | `'legacy_onboarding'` | **AUDIT TRAIL ESTABLISHED** |

---

## 4. Verification in Isolated Test Environment

In database `payroll_isolated_final_safety`, the exact migration sequence was executed on a faithful clone of `pop_db`:

```sql
SELECT id, employer_id, plan_id, start_date, end_date, status, payment_gateway, max_employees
FROM subscriptions
WHERE id IN (1, 2);
```

**Output:**
```
id  employer_id  plan_id  start_date  end_date    status  payment_gateway    max_employees
1   1            2        2026-10-28  2027-10-28  active  legacy_onboarding  50
2   2            2        2026-10-28  2027-10-28  active  legacy_onboarding  50
```

**Conclusion:** Zero customer data degradation, zero expiry shortening, zero quota shrinkage. Customer rights are 100% protected.

