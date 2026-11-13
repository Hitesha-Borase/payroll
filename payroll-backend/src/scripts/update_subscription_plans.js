require('dotenv').config();
const db = require('../config/mysql');

/**
 * Option B Subscription Catalog Updater
 * Safely updates plans to Option B canonical mapping using ON DUPLICATE KEY UPDATE.
 * Preserves historical references and foreign key integrity.
 */
async function updateSubscriptionPlans() {
  console.log('=== SYNCHRONIZING SAAS SUBSCRIPTION PLANS TO OPTION B ===\n');
  try {
    const targetPlans = [
      {
        id: 1,
        name: 'Starter Plan',
        price: 700.00,
        duration_months: 1,
        description: 'Ideal for startups, boutique agencies, and small offices up to 15 employees.',
        features: JSON.stringify([
          'Up to 15 Active Employees',
          'Automated Monthly Payroll & Salary Slips',
          'Direct WhatsApp Slip Delivery',
          'Attendance & Leave Tracking',
          'Standard Support'
        ]),
        max_employees: 15,
        max_jobs: 5,
        is_active: 1
      },
      {
        id: 2,
        name: 'Professional Plan',
        price: 900.00,
        duration_months: 1,
        description: 'Complete payroll, attendance, and compliance hub for expanding firms up to 50 employees.',
        features: JSON.stringify([
          'Up to 50 Active Employees',
          'Everything in Starter Plan',
          'Job Recruitment & Candidate Tracking',
          'Detailed Compliance & Tax Reports',
          'Custom Allowances & Deductions',
          'Priority Support'
        ]),
        max_employees: 50,
        max_jobs: 25,
        is_active: 1
      },
      {
        id: 3,
        name: 'Premium Plan',
        price: 1200.00,
        duration_months: 1,
        description: 'Designed for enterprise workforces requiring statutory automation & multi-branch access up to 100 employees.',
        features: JSON.stringify([
          'Up to 100 Active Employees',
          'Everything in Professional Plan',
          'Multi-Branch & Department Management',
          'Comprehensive Vendor & Contractor Billing',
          'Advanced Audit Logs & Activity Trails',
          'Priority 24/7 Support'
        ]),
        max_employees: 100,
        max_jobs: 50,
        is_active: 1
      },
      {
        id: 4,
        name: 'Free Trial',
        price: 0.00,
        duration_months: 1,
        description: '7-Day Free Trial for Payroll & HRMS SaaS up to 10 employees.',
        features: JSON.stringify([
          'Up to 10 Active Employees',
          'Automated Salary Slips & Payroll Preview',
          'Attendance & Leave Tracking',
          'Employee Self-Service (ESS) Portal',
          'Standard Support'
        ]),
        max_employees: 10,
        max_jobs: 5,
        is_active: 1
      },
      {
        id: 5,
        name: 'Enterprise Plan',
        price: 0.00,
        duration_months: 12,
        description: 'Tailored enterprise solution for unlimited workforces, custom SLAs, and ERP integrations.',
        features: JSON.stringify([
          'Unlimited Active Employees',
          'Custom API & Webhook Integrations',
          'Dedicated Cloud Database Node',
          'Custom SLA & 24/7 Dedicated Relationship Manager',
          'Custom Statutory & Governance Workflows'
        ]),
        max_employees: null,
        max_jobs: 999,
        is_active: 1
      }
    ];

    for (const p of targetPlans) {
      await db.query(
        `INSERT INTO plans (id, name, price, duration_months, description, features, max_employees, max_jobs, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           price = VALUES(price),
           duration_months = VALUES(duration_months),
           description = VALUES(description),
           features = VALUES(features),
           max_employees = VALUES(max_employees),
           max_jobs = VALUES(max_jobs),
           is_active = VALUES(is_active),
           updated_at = NOW()`,
        [p.id, p.name, p.price, p.duration_months, p.description, p.features, p.max_employees, p.max_jobs, p.is_active]
      );
    }

    const [updatedPlans] = await db.query('SELECT * FROM plans ORDER BY id ASC');
    console.log('✅ Option B plans synchronized in database:');
    updatedPlans.forEach(plan => {
      console.log(` - ID: ${plan.id} | ${plan.name} | ₹${plan.price} | Max Staff: ${plan.max_employees ?? 'Unlimited'}`);
    });

  } catch (err) {
    console.error('❌ Failed to synchronize Option B plans:', err);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  updateSubscriptionPlans();
}

module.exports = { updateSubscriptionPlans };
