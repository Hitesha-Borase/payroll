const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Setup environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_automated_testing_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_automated_testing_654321';
process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.kiaan.payroll';

const db = require('../src/config/mysql');
const googlePlayService = require('../src/services/googlePlay.service');
const googlePlayController = require('../src/controllers/googlePlay.controller');
const paymentController = require('../src/controllers/payment.controller');
const { checkEmployeeLimit } = require('../src/middlewares/planLimits.middleware');

describe('Google Play Billing Implementation & Subscription Suite', () => {

  after(async () => {
    try {
      if (db && typeof db.end === 'function') {
        await db.end();
      }
    } catch {}
  });

  // =========================================================================
  // 1. Google Play Service & Plan Mapping Tests
  // =========================================================================
  describe('1. Plan Mapping & Pricing Configuration', () => {
    it('should map payroll_plan_starter to Plan ID 1, 15 max employees, ₹700', () => {
      const plan = googlePlayService.getPlanConfig('payroll_plan_starter');
      assert.ok(plan);
      assert.strictEqual(plan.plan_id, 1);
      assert.strictEqual(plan.name, 'Starter Plan');
      assert.strictEqual(plan.max_employees, 15);
      assert.strictEqual(plan.price, 700.00);
      assert.strictEqual(plan.base_plan_id, 'starter-monthly');
      assert.strictEqual(plan.currency, 'INR');
    });

    it('should map payroll_plan_pro to Plan ID 2, 50 max employees, ₹900', () => {
      const plan = googlePlayService.getPlanConfig('payroll_plan_pro');
      assert.ok(plan);
      assert.strictEqual(plan.plan_id, 2);
      assert.strictEqual(plan.name, 'Professional Plan');
      assert.strictEqual(plan.max_employees, 50);
      assert.strictEqual(plan.price, 900.00);
      assert.strictEqual(plan.base_plan_id, 'pro-monthly');
      assert.strictEqual(plan.currency, 'INR');
    });

    it('should map payroll_plan_premium to Plan ID 3, 100 max employees, ₹1,200', () => {
      const plan = googlePlayService.getPlanConfig('payroll_plan_premium');
      assert.ok(plan);
      assert.strictEqual(plan.plan_id, 3);
      assert.strictEqual(plan.name, 'Premium Plan');
      assert.strictEqual(plan.max_employees, 100);
      assert.strictEqual(plan.price, 1200.00);
      assert.strictEqual(plan.base_plan_id, 'premium-monthly');
      assert.strictEqual(plan.currency, 'INR');
    });

    it('should return null for unknown product IDs', () => {
      const plan = googlePlayService.getPlanConfig('unknown_product_xyz');
      assert.strictEqual(plan, null);
    });

    it('getAllPlans should return all 3 configured subscription tiers', () => {
      const plans = googlePlayService.getAllPlans();
      assert.strictEqual(plans.length, 3);
      const productIds = plans.map(p => p.productId);
      assert.ok(productIds.includes('payroll_plan_starter'));
      assert.ok(productIds.includes('payroll_plan_pro'));
      assert.ok(productIds.includes('payroll_plan_premium'));
    });
  });

  // =========================================================================
  // 2. Token Verification & Fraud Prevention
  // =========================================================================
  describe('2. Fail-Closed Token Verification & Security', () => {
    it('should reject missing, empty, or whitespace tokens', async () => {
      const res1 = await googlePlayService.verifySubscriptionPurchase('');
      assert.strictEqual(res1.isValid, false);

      const res2 = await googlePlayService.verifySubscriptionPurchase(null);
      assert.strictEqual(res2.isValid, false);

      const res3 = await googlePlayService.verifySubscriptionPurchase('   ');
      assert.strictEqual(res3.isValid, false);
    });

    it('should fail closed when Google Play service account credentials are missing and no publisher client exists', async () => {
      googlePlayService.setMockClientForTesting(null);
      const res = await googlePlayService.verifySubscriptionPurchase('some_random_token_123');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('credentials are not configured'));
    });

    it('should reject pending purchases and never activate paid entitlements', async () => {
      const mockPendingClient = {
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_PENDING',
                lineItems: [{ productId: 'payroll_plan_pro', expiryTime: new Date(Date.now() + 86400000).toISOString() }]
              }
            })
          }
        }
      };
      googlePlayService.setMockClientForTesting(mockPendingClient);

      const res = await googlePlayService.verifySubscriptionPurchase('pending_token_test');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('not in active standing'));
    });

    it('should reject expired subscriptions even if token exists', async () => {
      const mockExpiredClient = {
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                lineItems: [{ productId: 'payroll_plan_pro', expiryTime: new Date(Date.now() - 3600000).toISOString() }]
              }
            })
          }
        }
      };
      googlePlayService.setMockClientForTesting(mockExpiredClient);

      const res = await googlePlayService.verifySubscriptionPurchase('expired_token_test');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('already expired'));
    });

    it('should reject package name mismatches', async () => {
      const mockMismatchClient = {
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.other.malicious.app',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                lineItems: [{ productId: 'payroll_plan_pro', expiryTime: new Date(Date.now() + 86400000).toISOString() }]
              }
            })
          }
        }
      };
      googlePlayService.setMockClientForTesting(mockMismatchClient);

      const res = await googlePlayService.verifySubscriptionPurchase('mismatch_token_test');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('Package name mismatch'));
    });
  });

  // =========================================================================
  // 3. Backend Verification Controller Endpoints
  // =========================================================================
  describe('3. POST /api/payment/google-play/verify Controller', () => {
    it('should reject requests missing purchase_token with 400', async () => {
      const req = {
        user: { company_id: 1, email: 'admin@test.com' },
        body: {}
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await googlePlayController.verifyGooglePlayPurchase(req, res, () => {});
      assert.strictEqual(statusCalled, 400);
      assert.strictEqual(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('purchase_token is required'));
    });

    it('should reject requests without authenticated company/employer identity with 400', async () => {
      const req = {
        user: null,
        employer: null,
        body: { purchase_token: 'mock_token_starter_123' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await googlePlayController.verifyGooglePlayPurchase(req, res, () => {});
      assert.strictEqual(statusCalled, 400);
      assert.strictEqual(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('identity not found'));
    });

    it('should activate subscription, set max_employees = 100 for Premium, and compute tax-inclusive invoice', async () => {
      const mockValidClient = {
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                latestOrderId: 'GPA.3312-4567-8901-23456',
                lineItems: [{
                  productId: 'payroll_plan_premium',
                  expiryTime: new Date(Date.now() + 30 * 86400000).toISOString(),
                  offerDetails: { basePlanId: 'premium-monthly' }
                }]
              }
            })
          },
          subscriptions: {
            acknowledge: async () => ({})
          }
        }
      };
      googlePlayService.setMockClientForTesting(mockValidClient);

      const originalGetConnection = db.getConnection;
      let committed = false;
      let insertedSub = null;
      let insertedInv = null;

      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => { committed = true; },
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM plans WHERE id = ?')) {
            return [[{ id: 3, name: 'Enterprise', price: '87.99', max_employees: 50 }]];
          }
          if (sql.includes('FROM subscriptions WHERE google_purchase_token = ?')) {
            return [[]]; // No existing subscription with this token
          }
          if (sql.includes('INSERT INTO subscriptions')) {
            insertedSub = params;
            return [{ insertId: 501 }];
          }
          if (sql.includes('INSERT INTO invoices')) {
            insertedInv = params;
            return [{ insertId: 701 }];
          }
          if (sql.includes('FROM companies WHERE id = ?')) {
            return [[{ user_id: 10, company_name: 'Acme Test Corp' }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      try {
        const req = {
          user: { id: 10, company_id: 10, email: 'admin@acme.com', name: 'Acme Admin' },
          employer: { id: 10, company_id: 10 },
          body: {
            purchase_token: 'auth_verified_premium_token_99999',
            product_id: 'payroll_plan_premium'
          }
        };
        let jsonCalled = null;
        const res = {
          status(code) { return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        let nextCalled = null;
        await googlePlayController.verifyGooglePlayPurchase(req, res, (err) => { nextCalled = err; });

        if (nextCalled) throw nextCalled;

        assert.strictEqual(committed, true, 'Transaction must be committed on successful verification');
        assert.strictEqual(jsonCalled.success, true);
        assert.strictEqual(jsonCalled.data.plan_name, 'Premium Plan');
        assert.strictEqual(jsonCalled.data.max_employees, 100, 'Premium plan must grant 100 employees');
        assert.strictEqual(jsonCalled.data.price, 1200.00);
        assert.strictEqual(jsonCalled.data.payment_gateway, 'google_play');
        assert.ok(jsonCalled.data.purchase_token_masked.includes('...'), 'Token must be masked in API output');

        // Verify inclusive tax computation: Total 1200, Base = 1200/1.18 = 1016.95, Tax = 183.05
        assert.ok(insertedInv);
        const [invNum, empId, subId, planId, baseAmt, taxAmt, totalAmt] = insertedInv;
        assert.strictEqual(totalAmt, 1200.00, 'Invoice total must match Google Play price of 1200');
        assert.strictEqual(baseAmt, 1016.95, 'Base amount before 18% GST');
        assert.strictEqual(taxAmt, 183.05, '18% GST amount');
      } finally {
        db.getConnection = originalGetConnection;
      }
    });

    it('should reject replay or cross-tenant theft with 409 Conflict', async () => {
      const mockValidClient = {
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                lineItems: [{ productId: 'payroll_plan_starter', expiryTime: new Date(Date.now() + 86400000).toISOString() }]
              }
            })
          }
        }
      };
      googlePlayService.setMockClientForTesting(mockValidClient);

      const originalGetConnection = db.getConnection;
      let rolledBack = false;

      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => { rolledBack = true; },
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM plans WHERE id = ?')) {
            return [[{ id: 1, name: 'Basic', price: '8.99', max_employees: 20 }]];
          }
          if (sql.includes('FROM subscriptions WHERE google_purchase_token = ?')) {
            // Already tied to company 999
            return [[{ id: 400, employer_id: 999, status: 'active' }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      try {
        const req = {
          user: { id: 55, company_id: 55, email: 'thief@othercorp.com' }, // Different company ID
          employer: { id: 55, company_id: 55 },
          body: {
            purchase_token: 'stolen_purchase_token_123',
            product_id: 'payroll_plan_starter'
          }
        };
        let statusCalled = null;
        let jsonCalled = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await googlePlayController.verifyGooglePlayPurchase(req, res, () => {});

        assert.strictEqual(statusCalled, 409, 'Must return 409 Conflict for cross-tenant token use');
        assert.strictEqual(jsonCalled.success, false);
        assert.ok(jsonCalled.message.includes('Security Alert'));
        assert.strictEqual(rolledBack, true);
      } finally {
        db.getConnection = originalGetConnection;
      }
    });

    it('should be idempotent when the same company re-submits an already active token', async () => {
      const mockValidClient = {
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                lineItems: [{ productId: 'payroll_plan_starter', expiryTime: new Date(Date.now() + 86400000).toISOString() }]
              }
            })
          }
        }
      };
      googlePlayService.setMockClientForTesting(mockValidClient);

      const originalGetConnection = db.getConnection;
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM plans WHERE id = ?')) {
            return [[{ id: 1, name: 'Basic', price: '8.99', max_employees: 20 }]];
          }
          if (sql.includes('FROM subscriptions WHERE google_purchase_token = ?')) {
            // Tied to company 10 and already active
            return [[{ id: 400, employer_id: 10, status: 'active' }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      try {
        const req = {
          user: { id: 10, company_id: 10, email: 'owner@acme.com' },
          employer: { id: 10, company_id: 10 },
          body: {
            purchase_token: 'active_token_already_verified',
            product_id: 'payroll_plan_starter'
          }
        };
        let jsonCalled = null;
        const res = {
          status(code) { return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await googlePlayController.verifyGooglePlayPurchase(req, res, () => {});

        assert.strictEqual(jsonCalled.success, true);
        assert.strictEqual(jsonCalled.data.already_active, true);
        assert.strictEqual(jsonCalled.data.subscription_id, 400);
      } finally {
        db.getConnection = originalGetConnection;
      }
    });
  });

  // =========================================================================
  // 4. Employee Limits Middleware with Subscription Quota Override
  // =========================================================================
  describe('4. Entitlement Middleware (Quota Check)', () => {
    it('checkEmployeeLimit must grant 100 employees when subscription max_employees is 100 even if plan table is 50', async () => {
      const originalQuery = db.query;
      db.query = async (sql, params) => {
        if (sql.includes('FROM companies c')) {
          return [[{
            company_name: 'Big Corp',
            subscription_plan: 'Premium Plan',
            max_employees: 100 // COALESCE(s.max_employees, p.max_employees) returns 100
          }]];
        }
        if (sql.includes('COUNT(*) as active_count')) {
          return [[{ active_count: 75 }]]; // 75 employees (above 50, but below 100)
        }
        return [[]];
      };

      try {
        const req = { user: { company_id: 88 } };
        let nextCalled = false;
        let resCalled = false;
        const res = {
          status: () => ({ json: () => { resCalled = true; } })
        };

        await checkEmployeeLimit(req, res, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, 'Company with 75 employees must be allowed on 100-employee quota');
        assert.strictEqual(resCalled, false);
      } finally {
        db.query = originalQuery;
      }
    });

    it('checkEmployeeLimit must reject adding employee when 100 employee quota is reached', async () => {
      const originalQuery = db.query;
      db.query = async (sql, params) => {
        if (sql.includes('FROM companies c')) {
          return [[{
            company_name: 'Big Corp',
            subscription_plan: 'Premium Plan',
            max_employees: 100
          }]];
        }
        if (sql.includes('COUNT(*) as active_count')) {
          return [[{ active_count: 100 }]]; // Limit reached
        }
        return [[]];
      };

      try {
        const req = { user: { company_id: 88 } };
        let statusCalled = null;
        let jsonCalled = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await checkEmployeeLimit(req, res, () => {});
        assert.strictEqual(statusCalled, 403, 'Must return 403 when quota is reached');
        assert.strictEqual(jsonCalled.code, 'LIMIT_EXCEEDED');
        assert.strictEqual(jsonCalled.allowedLimit, 100);
      } finally {
        db.query = originalQuery;
      }
    });
  });

  // =========================================================================
  // 5. Real-Time Developer Notifications (RTDN) Webhook Tests
  // =========================================================================
  describe('5. POST /api/payment/google-play/rtdn-webhook', () => {
    const validToken = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || 'dev_pubsub_verification_token';

    it('should reject requests with invalid or missing verification token with 403', async () => {
      const req = { body: {}, query: { token: 'invalid_token' }, headers: {} };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await googlePlayController.handleGooglePlayRTDN(req, res, () => {});
      assert.strictEqual(statusCalled, 403);
      assert.strictEqual(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('RTDN verification token'));
    });

    it('should reject empty or missing pubsub messages with 400', async () => {
      const req = { body: {}, query: { token: validToken }, headers: {} };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await googlePlayController.handleGooglePlayRTDN(req, res, () => {});
      assert.strictEqual(statusCalled, 400);
      assert.strictEqual(jsonCalled.success, false);
    });

    it('should process SUBSCRIPTION_RENEWED (type 2) notification and extend end_date', async () => {
      let updateExecuted = false;
      const originalQuery = db.query;

      db.query = async (sql, params) => {
        if (sql.includes('FROM subscriptions WHERE google_purchase_token = ?')) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 5);
          return [[{ id: 101, employer_id: 20, plan_id: 2, end_date: futureDate }]];
        }
        if (sql.includes('UPDATE subscriptions SET end_date = ?')) {
          updateExecuted = true;
          return [{ affectedRows: 1 }];
        }
        return [[]];
      };

      try {
        const payload = {
          version: '1.0',
          packageName: 'com.kiaan.payroll',
          subscriptionNotification: {
            version: '1.0',
            notificationType: 2, // SUBSCRIPTION_RENEWED
            purchaseToken: 'test_renewal_token',
            subscriptionId: 'payroll_plan_pro'
          }
        };

        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
        const req = {
          body: { message: { data: encoded } },
          query: { token: validToken },
          headers: {}
        };

        let statusCalled = null;
        let jsonCalled = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await googlePlayController.handleGooglePlayRTDN(req, res, () => {});

        assert.strictEqual(statusCalled, 200);
        assert.strictEqual(jsonCalled.success, true);
        assert.strictEqual(updateExecuted, true, 'End date must be extended in DB');
      } finally {
        db.query = originalQuery;
      }
    });

    it('should process SUBSCRIPTION_CANCELED (type 3) without prematurely revoking access (sets auto_renew = 0)', async () => {
      let cancelExecuted = false;
      const originalQuery = db.query;

      db.query = async (sql, params) => {
        if (sql.includes('FROM subscriptions WHERE google_purchase_token = ?')) {
          return [[{ id: 102, employer_id: 21, plan_id: 1, end_date: new Date() }]];
        }
        if (sql.includes('auto_renew = 0')) {
          cancelExecuted = true;
          return [{ affectedRows: 1 }];
        }
        return [[]];
      };

      try {
        const payload = {
          version: '1.0',
          packageName: 'com.kiaan.payroll',
          subscriptionNotification: {
            version: '1.0',
            notificationType: 3, // SUBSCRIPTION_CANCELED
            purchaseToken: 'test_cancel_token',
            subscriptionId: 'payroll_plan_starter'
          }
        };

        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
        const req = {
          body: { message: { data: encoded } },
          query: { token: validToken },
          headers: {}
        };

        let statusCalled = null;
        let jsonCalled = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await googlePlayController.handleGooglePlayRTDN(req, res, () => {});

        assert.strictEqual(statusCalled, 200);
        assert.strictEqual(jsonCalled.success, true);
        assert.strictEqual(cancelExecuted, true, 'auto_renew must be set to 0');
      } finally {
        db.query = originalQuery;
      }
    });
  });

  // =========================================================================
  // 6. Preserving Web/PWA Razorpay Flow
  // =========================================================================
  describe('6. Web / PWA Razorpay Flow Preservation', () => {
    it('createRazorpayOrder should continue to generate Razorpay orders for web users', async () => {
      const originalQuery = db.query;
      db.query = async (sql, params) => {
        if (sql.includes('FROM plans WHERE id = ?')) {
          return [[{ id: 1, name: 'Basic', price: '700.00', duration_months: 1 }]];
        }
        return [[]];
      };

      try {
        const req = {
          body: { plan_id: 1, currency: 'INR' }
        };
        let statusCalled = null;
        let jsonCalled = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await paymentController.createRazorpayOrder(req, res, () => {});

        assert.strictEqual(jsonCalled.success, true);
        assert.ok(jsonCalled.data.order_id);
        assert.strictEqual(jsonCalled.data.amount, 70000); // 700 INR in paise
        assert.strictEqual(jsonCalled.data.currency, 'INR');
      } finally {
        db.query = originalQuery;
      }
    });
  });
});
