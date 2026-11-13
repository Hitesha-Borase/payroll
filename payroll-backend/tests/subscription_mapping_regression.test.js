const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_automated_testing_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_automated_testing_654321';

const db = require('../src/config/mysql');
const paymentController = require('../src/controllers/payment.controller');
const emailService = require('../src/services/email.service');

describe('Kiaan PayrollPlus Option B Subscription Mapping & Security Regression Suite', () => {
  let origSendEmail;

  before(() => {
    origSendEmail = emailService.sendEmail;
    emailService.sendEmail = async () => ({ success: true, messageId: 'test-mock-id' });
  });

  after(async () => {
    if (origSendEmail) {
      emailService.sendEmail = origSendEmail;
    }
    try {
      if (db && typeof db.end === 'function') {
        await db.end();
      }
    } catch {}
  });

  // =========================================================================
  // 1. Authoritative Option B Database Plans Verification
  // =========================================================================
  describe('1. pop_db Option B Canonical Plans Integrity', () => {
    it('pop_db.plans must contain exactly 5 authoritative Option B plans', async () => {
      const [plans] = await db.query('SELECT id, name, price, duration_months, duration_days, max_employees FROM plans ORDER BY id ASC');
      assert.strictEqual(plans.length, 5, `Expected 5 plans, found ${plans.length}`);

      // Plan 1: Starter Plan (₹700, 15 seats)
      assert.strictEqual(plans[0].id, 1);
      assert.strictEqual(plans[0].name, 'Starter Plan');
      assert.strictEqual(parseFloat(plans[0].price), 700.00);
      assert.strictEqual(plans[0].max_employees, 15);

      // Plan 2: Professional Plan (₹900, 50 seats)
      assert.strictEqual(plans[1].id, 2);
      assert.strictEqual(plans[1].name, 'Professional Plan');
      assert.strictEqual(parseFloat(plans[1].price), 900.00);
      assert.strictEqual(plans[1].max_employees, 50);

      // Plan 3: Premium Plan (₹1200, 100 seats)
      assert.strictEqual(plans[2].id, 3);
      assert.strictEqual(plans[2].name, 'Premium Plan');
      assert.strictEqual(parseFloat(plans[2].price), 1200.00);
      assert.strictEqual(plans[2].max_employees, 100);

      // Plan 4: Free Trial (₹0, 10 seats, 7 days)
      assert.strictEqual(plans[3].id, 4);
      assert.strictEqual(plans[3].name, 'Free Trial');
      assert.strictEqual(parseFloat(plans[3].price), 0.00);
      assert.strictEqual(plans[3].duration_days, 7);
      assert.strictEqual(plans[3].max_employees, 10);

      // Plan 5: Enterprise Plan (Custom, unlimited seats)
      assert.strictEqual(plans[4].id, 5);
      assert.strictEqual(plans[4].name, 'Enterprise Plan');
      assert.strictEqual(plans[4].max_employees, null);
    });

    it('pop_db.subscriptions must preserve existing subscriptions #1 and #2 on Plan 2', async () => {
      const [subs] = await db.query('SELECT id, employer_id, plan_id, status FROM subscriptions WHERE id IN (1, 2) ORDER BY id ASC');
      assert.strictEqual(subs.length, 2, 'Expected exactly 2 existing subscriptions');
      assert.strictEqual(subs[0].id, 1);
      assert.strictEqual(subs[0].plan_id, 2, 'Subscription 1 must remain on Plan 2 (Professional)');
      assert.strictEqual(subs[0].status, 'active');

      assert.strictEqual(subs[1].id, 2);
      assert.strictEqual(subs[1].plan_id, 2, 'Subscription 2 must remain on Plan 2 (Professional)');
      assert.strictEqual(subs[1].status, 'active');
    });
  });

  // =========================================================================
  // 2. Frontend Subscription Routing Logic Audit
  // =========================================================================
  describe('2. Canonical Plan Routing Logic (LandingPage.jsx simulation)', () => {
    const planDbIdMap = { starter: 1, pro: 2, premium: 3, trial: 4, custom: 5 };

    it('Starter must map to Plan ID 1 and route to paid Razorpay flow, NEVER Free Trial', () => {
      const planId = 'starter';
      const dbId = planDbIdMap[planId] || 4;
      const selectedPlanDetails = { id: planId, planDbId: dbId };
      const currentPlanId = selectedPlanDetails.planDbId || 4;

      const isFreeTrialFlow = (selectedPlanDetails.id === 'trial' || currentPlanId === 4);
      const isCustomFlow = (selectedPlanDetails.id === 'custom' || currentPlanId === 5);
      const isPaidFlow = !isFreeTrialFlow && !isCustomFlow;

      assert.strictEqual(currentPlanId, 1);
      assert.strictEqual(isFreeTrialFlow, false, 'Starter must NOT trigger Free Trial flow');
      assert.strictEqual(isPaidFlow, true, 'Starter MUST trigger Paid Razorpay flow');
    });

    it('Professional must map to Plan ID 2 and route to paid Razorpay flow', () => {
      const planId = 'pro';
      const dbId = planDbIdMap[planId] || 4;
      const selectedPlanDetails = { id: planId, planDbId: dbId };
      const currentPlanId = selectedPlanDetails.planDbId || 4;

      const isFreeTrialFlow = (selectedPlanDetails.id === 'trial' || currentPlanId === 4);
      const isPaidFlow = !isFreeTrialFlow && selectedPlanDetails.id !== 'custom';

      assert.strictEqual(currentPlanId, 2);
      assert.strictEqual(isFreeTrialFlow, false);
      assert.strictEqual(isPaidFlow, true);
    });

    it('Premium must map to Plan ID 3 and route to paid Razorpay flow', () => {
      const planId = 'premium';
      const dbId = planDbIdMap[planId] || 4;
      const selectedPlanDetails = { id: planId, planDbId: dbId };
      const currentPlanId = selectedPlanDetails.planDbId || 4;

      const isFreeTrialFlow = (selectedPlanDetails.id === 'trial' || currentPlanId === 4);
      const isPaidFlow = !isFreeTrialFlow && selectedPlanDetails.id !== 'custom';

      assert.strictEqual(currentPlanId, 3);
      assert.strictEqual(isFreeTrialFlow, false);
      assert.strictEqual(isPaidFlow, true);
    });

    it('Free Trial must map to Plan ID 4 and route to Free Trial direct flow', () => {
      const planId = 'trial';
      const dbId = planDbIdMap[planId] || 4;
      const selectedPlanDetails = { id: planId, planDbId: dbId };
      const currentPlanId = selectedPlanDetails.planDbId || 4;

      const isFreeTrialFlow = (selectedPlanDetails.id === 'trial' || currentPlanId === 4);

      assert.strictEqual(currentPlanId, 4);
      assert.strictEqual(isFreeTrialFlow, true, 'Free Trial MUST trigger Free Trial flow');
    });

    it('Enterprise must map to Plan ID 5 and route to Custom Enterprise Request flow', () => {
      const planId = 'custom';
      const dbId = planDbIdMap[planId] || 4;
      const selectedPlanDetails = { id: planId, planDbId: dbId };
      const currentPlanId = selectedPlanDetails.planDbId || 4;

      const isCustomFlow = (selectedPlanDetails.id === 'custom' || currentPlanId === 5);

      assert.strictEqual(currentPlanId, 5);
      assert.strictEqual(isCustomFlow, true, 'Custom MUST trigger Custom Enterprise flow');
    });
  });

  // =========================================================================
  // 3. Payment Bypass Prevention & Security Verification (Backend API)
  // =========================================================================
  describe('3. Payment Bypass Prevention on verifyAndRegister', () => {
    it('verifyAndRegister must reject Plan ID 1 (Starter) if Razorpay payment parameters are missing', async () => {
      let statusCode = 200;
      let responseBody = null;

      const req = {
        body: {
          name: 'Test Employer',
          email: 'test_starter_bypass_' + Date.now() + '@example.com',
          password: 'Password123!',
          company_name: 'Test Starter Corp',
          phone: '9876543210',
          plan_id: 1
          // no razorpay_order_id, razorpay_payment_id, razorpay_signature
        }
      };

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseBody = data;
              return data;
            }
          };
        },
        json: (data) => {
          responseBody = data;
          return data;
        }
      };

      await paymentController.verifyAndRegister(req, res, (err) => {
        if (err) throw err;
      });

      assert.strictEqual(statusCode, 400, 'Expected 400 Bad Request when trying to activate Plan 1 without payment');
      assert.strictEqual(responseBody?.success, false);
      assert.match(responseBody?.message, /razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for paid plans/i);
    });

    it('verifyAndRegister must reject Plan ID 2 (Professional) if payment parameters are missing', async () => {
      let statusCode = 200;
      let responseBody = null;

      const req = {
        body: {
          name: 'Test Employer',
          email: 'test_pro_bypass_' + Date.now() + '@example.com',
          password: 'Password123!',
          company_name: 'Test Pro Corp',
          phone: '9876543210',
          plan_id: 2
        }
      };

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; return data; } };
        },
        json: (data) => { responseBody = data; return data; }
      };

      await paymentController.verifyAndRegister(req, res, (err) => { if (err) throw err; });

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(responseBody?.success, false);
    });

    it('verifyAndRegister must reject Plan ID 3 (Premium) if payment parameters are missing', async () => {
      let statusCode = 200;
      let responseBody = null;

      const req = {
        body: {
          name: 'Test Employer',
          email: 'test_premium_bypass_' + Date.now() + '@example.com',
          password: 'Password123!',
          company_name: 'Test Premium Corp',
          phone: '9876543210',
          plan_id: 3
        }
      };

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; return data; } };
        },
        json: (data) => { responseBody = data; return data; }
      };

      await paymentController.verifyAndRegister(req, res, (err) => { if (err) throw err; });

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(responseBody?.success, false);
    });

    it('createRazorpayOrder must generate exact order amount in paise according to server DB plan price', async () => {
      // Test Plan 1: Starter (₹700 -> 70000 paise)
      let responseData1 = null;
      await paymentController.createRazorpayOrder(
        { body: { plan_id: 1 } },
        { json: (d) => { responseData1 = d; } },
        (err) => { if (err) throw err; }
      );
      assert.strictEqual(responseData1?.success, true);
      assert.strictEqual(responseData1?.data?.amount, 70000, 'Plan 1 Starter must generate 70000 paise');

      // Test Plan 2: Pro (₹900 -> 90000 paise)
      let responseData2 = null;
      await paymentController.createRazorpayOrder(
        { body: { plan_id: 2 } },
        { json: (d) => { responseData2 = d; } },
        (err) => { if (err) throw err; }
      );
      assert.strictEqual(responseData2?.success, true);
      assert.strictEqual(responseData2?.data?.amount, 90000, 'Plan 2 Pro must generate 90000 paise');

      // Test Plan 3: Premium (₹1200 -> 120000 paise)
      let responseData3 = null;
      await paymentController.createRazorpayOrder(
        { body: { plan_id: 3 } },
        { json: (d) => { responseData3 = d; } },
        (err) => { if (err) throw err; }
      );
      assert.strictEqual(responseData3?.success, true);
      assert.strictEqual(responseData3?.data?.amount, 120000, 'Plan 3 Premium must generate 120000 paise');
    });
  });

  // =========================================================================
  // 4. Free Trial Boundary & Enforcement
  // =========================================================================
  describe('4. Free Trial Plan 4 Safety & Limits', () => {
    it('Free Trial registration creates subscription strictly with plan_id: 4 and max_employees: 10', async () => {
      const testEmail = `freetrial_test_${Date.now()}@example.com`;
      let statusCode = 200;
      let responseBody = null;

      const req = {
        body: {
          name: 'Free Trial User',
          email: testEmail,
          password: 'TestPassword123!',
          company_name: 'Free Trial Corp',
          phone: '9998887776',
          plan_id: 4
        }
      };

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; return data; } };
        },
        json: (data) => { responseBody = data; return data; }
      };

      await paymentController.verifyAndRegister(req, res, (err) => { if (err) throw err; });

      try {
        assert.strictEqual(statusCode, 201, 'verifyAndRegister must return 201 Created for new registration');
        assert.strictEqual(responseBody?.success, true);

        // Verify in database that this created subscription is strictly plan_id = 4 and max_employees = 10
        const [users] = await db.query('SELECT id, company_id FROM users WHERE email = ?', [testEmail]);
        assert.strictEqual(users.length, 1);
        const userId = users[0].id;

        const [employers] = await db.query('SELECT id FROM employers WHERE user_id = ?', [userId]);
        assert.strictEqual(employers.length, 1);
        const employerId = employers[0].id;

        const [subs] = await db.query('SELECT plan_id, max_employees, status, DATEDIFF(end_date, start_date) as duration_days FROM subscriptions WHERE employer_id = ?', [employerId]);
        assert.strictEqual(subs.length, 1);
        assert.strictEqual(subs[0].plan_id, 4, 'Free trial user must be assigned plan_id = 4');
        assert.strictEqual(subs[0].max_employees, 10, 'Free trial must be capped at 10 employees');
        assert.strictEqual(subs[0].duration_days, 7, 'Free trial must be exactly 7 days');

      } finally {
        // Clean up test user records to maintain zero test pollution
        const [users] = await db.query('SELECT id, company_id FROM users WHERE email = ?', [testEmail]);
        if (users.length > 0) {
          const uid = users[0].id;
          const cid = users[0].company_id;
          const [emps] = await db.query('SELECT id FROM employers WHERE user_id = ?', [uid]);
          if (emps.length > 0) {
            await db.query('DELETE FROM subscriptions WHERE employer_id = ?', [emps[0].id]);
            await db.query('DELETE FROM employers WHERE id = ?', [emps[0].id]);
          }
          await db.query('DELETE FROM admins WHERE user_id = ?', [uid]);
          await db.query('DELETE FROM companies WHERE id = ?', [cid]);
          await db.query('DELETE FROM users WHERE id = ?', [uid]);
        }
      }
    });
  });

});
