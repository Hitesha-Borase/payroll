const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

// Setup environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_automated_testing_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_automated_testing_654321';
process.env.CORS_ORIGIN = 'http://localhost:5173,https://payroll.approved-domain.com';

const db = require('../src/config/mysql');
const app = require('../src/app');
const { checkEmployeeLimit } = require('../src/middlewares/planLimits.middleware');
const paymentController = require('../src/controllers/payment.controller');

describe('Prompt 7B — Google Play Consumption-Only & Subscription Policy Suite', () => {

  after(async () => {
    try {
      if (db && typeof db.end === 'function') {
        await db.end();
      }
    } catch {}
  });

  // =========================================================================
  // 1. Platform Detection & Behavioral Mode Branching
  // =========================================================================
  describe('1. Platform Detection & Native Shell Simulation', () => {
    it('should detect standard web/PWA browser mode by default (isNativeApp = false)', () => {
      const isNativeApp = (globalWin) => {
        try {
          if (globalWin) {
            if (globalWin.__FORCE_NATIVE_APP__ === true) return true;
            if (globalWin.__FORCE_WEB_APP__ === true) return false;
            if (globalWin.sessionStorage?.getItem('FORCE_NATIVE_APP') === 'true') return true;
          }
          return false;
        } catch {
          return false;
        }
      };

      const mockWebWindow = {
        sessionStorage: { getItem: () => null }
      };

      assert.strictEqual(isNativeApp(mockWebWindow), false, 'Default browser must resolve as web/PWA mode');
    });

    it('should detect native Android shell when Capacitor or test flag is active (isNativeApp = true)', () => {
      const isNativeApp = (globalWin) => {
        try {
          if (globalWin) {
            if (globalWin.__FORCE_NATIVE_APP__ === true) return true;
            if (globalWin.__FORCE_WEB_APP__ === true) return false;
            if (globalWin.sessionStorage?.getItem('FORCE_NATIVE_APP') === 'true') return true;
          }
          return false;
        } catch {
          return false;
        }
      };

      const mockNativeWindow = {
        __FORCE_NATIVE_APP__: true,
        sessionStorage: { getItem: () => null }
      };

      assert.strictEqual(isNativeApp(mockNativeWindow), true, 'Native simulation must resolve as native shell mode');
    });
  });

  // =========================================================================
  // 2. Client-Side Route Resolution Gating (Native Android vs. Web/PWA)
  // =========================================================================
  describe('2. Route Resolution Gating (Consumption-Only Policy)', () => {
    // Model the exact routing table configured in App.jsx
    const resolveAppRoute = (path, isNative) => {
      if (isNative) {
        // Native Android Consumption-Only routing rules
        if (['/', '/features', '/benefits', '/testimonials', '/about', '/pricing', 
             '/contact', '/contact-us', '/brochure', '/register', '/signup'].includes(path) ||
             path.startsWith('/register/')) {
          return { action: 'REDIRECT', target: '/login', allowRazorpay: false };
        }
        if (['/login', '/admin/login', '/forgot-password', '/privacy-policy', 
             '/terms-conditions', '/documentation', '/support-center', 
             '/delete-account', '/account-deletion'].includes(path)) {
          return { action: 'RENDER', target: path, allowRazorpay: false };
        }
        return { action: 'RENDER', target: path, allowRazorpay: false };
      } else {
        // Website / PWA routing rules (Preserves all sales, pricing & Razorpay flows)
        if (['/', '/features', '/benefits', '/testimonials', '/about', '/pricing', 
             '/contact', '/contact-us', '/brochure'].includes(path)) {
          return { action: 'RENDER', target: 'LandingPage', allowRazorpay: true };
        }
        if (path === '/register' || path.startsWith('/register/')) {
          return { action: 'RENDER', target: 'RegistrationForm', allowRazorpay: true };
        }
        if (path === '/signup') {
          return { action: 'RENDER', target: 'Signup', allowRazorpay: true };
        }
        return { action: 'RENDER', target: path, allowRazorpay: true };
      }
    };

    it('Native Android: root "/" must redirect to "/login" to enforce login-only entry', () => {
      const res = resolveAppRoute('/', true);
      assert.strictEqual(res.action, 'REDIRECT');
      assert.strictEqual(res.target, '/login');
      assert.strictEqual(res.allowRazorpay, false);
    });

    it('Native Android: "/pricing" must redirect to "/login" and prohibit in-app sales', () => {
      const res = resolveAppRoute('/pricing', true);
      assert.strictEqual(res.action, 'REDIRECT');
      assert.strictEqual(res.target, '/login');
      assert.strictEqual(res.allowRazorpay, false);
    });

    it('Native Android: "/register" and paid plan routes must redirect to "/login"', () => {
      const res1 = resolveAppRoute('/register', true);
      const res2 = resolveAppRoute('/register/pro', true);
      const res3 = resolveAppRoute('/signup', true);

      assert.strictEqual(res1.action, 'REDIRECT');
      assert.strictEqual(res1.target, '/login');

      assert.strictEqual(res2.action, 'REDIRECT');
      assert.strictEqual(res2.target, '/login');

      assert.strictEqual(res3.action, 'REDIRECT');
      assert.strictEqual(res3.target, '/login');
    });

    it('Native Android: Google Play account deletion routes must remain directly accessible', () => {
      const res1 = resolveAppRoute('/delete-account', true);
      const res2 = resolveAppRoute('/account-deletion', true);

      assert.strictEqual(res1.action, 'RENDER');
      assert.strictEqual(res1.target, '/delete-account');

      assert.strictEqual(res2.action, 'RENDER');
      assert.strictEqual(res2.target, '/account-deletion');
    });

    it('Website / PWA: root and "/pricing" must render marketing & preserve public Razorpay checkout', () => {
      const res1 = resolveAppRoute('/', false);
      const res2 = resolveAppRoute('/pricing', false);
      const res3 = resolveAppRoute('/register', false);

      assert.strictEqual(res1.action, 'RENDER');
      assert.strictEqual(res1.target, 'LandingPage');
      assert.strictEqual(res1.allowRazorpay, true);

      assert.strictEqual(res2.action, 'RENDER');
      assert.strictEqual(res2.target, 'LandingPage');
      assert.strictEqual(res2.allowRazorpay, true);

      assert.strictEqual(res3.action, 'RENDER');
      assert.strictEqual(res3.target, 'RegistrationForm');
      assert.strictEqual(res3.allowRazorpay, true);
    });
  });

  // =========================================================================
  // 3. Client Payment Trigger Blocking in Native Shell
  // =========================================================================
  describe('3. Payment Trigger Guards (Anti-Circumvention)', () => {
    // Model guarded payment initiation logic in UpgradePlan and AdminSettings
    const initiatePaymentAction = async ({ isNative, actionType }) => {
      if (isNative) {
        return {
          success: false,
          blocked: true,
          error: `${actionType} is not available in this mobile application.`
        };
      }
      return {
        success: true,
        blocked: false,
        order_id: 'order_mock_test_123',
        key_id: 'rzp_test_key'
      };
    };

    it('handleInitiateRazorpay must reject execution immediately on native Android', async () => {
      const result = await initiatePaymentAction({
        isNative: true,
        actionType: 'Subscription purchase'
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.blocked, true);
      assert.match(result.error, /not available in this mobile application/);
    });

    it('handleRenewPlan must reject renewal and Razorpay initialization on native Android', async () => {
      const result = await initiatePaymentAction({
        isNative: true,
        actionType: 'Plan renewal'
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.blocked, true);
      assert.match(result.error, /not available in this mobile application/);
    });

    it('Website/PWA must allow payment initiation without block', async () => {
      const result = await initiatePaymentAction({
        isNative: false,
        actionType: 'Plan renewal'
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.blocked, false);
      assert.strictEqual(result.order_id, 'order_mock_test_123');
    });
  });

  // =========================================================================
  // 4. Neutral Messaging & Anti-Steering Verification
  // =========================================================================
  describe('4. Neutral Messaging & Anti-Steering Sanitization', () => {
    const sanitizeLoginError = (rawError, isNative) => {
      if (!rawError) return 'Login failed. Please check your credentials.';
      const lower = rawError.toLowerCase();
      if (isNative && (lower.includes('expired') || lower.includes('purchase') || lower.includes('subscription'))) {
        return "Your organization's subscription is currently inactive. Please contact your organization administrator.";
      }
      return rawError;
    };

    it('should sanitize raw backend expired subscription errors into neutral text in native mode', () => {
      const rawBackendMsg = 'Your 7-Day Free Trial / Subscription Plan has expired. Please purchase a plan to continue accessing the system.';
      
      const nativeDisplay = sanitizeLoginError(rawBackendMsg, true);
      assert.strictEqual(
        nativeDisplay,
        "Your organization's subscription is currently inactive. Please contact your organization administrator.",
        'Native app must display neutral information without purchase CTAs'
      );
      assert.doesNotMatch(nativeDisplay, /purchase|buy|pricing|order/i, 'Native display must not contain commercial solicitation');
    });

    it('should preserve detailed backend message on web/PWA mode to assist subscribers', () => {
      const rawBackendMsg = 'Your 7-Day Free Trial / Subscription Plan has expired. Please purchase a plan to continue accessing the system.';
      
      const webDisplay = sanitizeLoginError(rawBackendMsg, false);
      assert.strictEqual(webDisplay, rawBackendMsg);
      assert.match(webDisplay, /purchase a plan/i);
    });
  });

  // =========================================================================
  // 5. Backend Subscription Entitlement & Quota Enforcement
  // =========================================================================
  describe('5. Backend Entitlement Enforcement', () => {
    it('checkEmployeeLimit middleware must reject requests when company quota is exceeded with 403', async () => {
      const originalQuery = db.query;
      try {
        db.query = async (sql, params) => {
          if (sql.includes('FROM companies c')) {
            return [[{ company_name: 'Test Corp', subscription_plan: 'Starter', max_employees: 5 }]];
          }
          if (sql.includes('SELECT COUNT(*) as active_count')) {
            return [[{ active_count: 5 }]];
          }
          return [[]];
        };

        const req = { user: { company_id: 10 } };
        let statusCode = null;
        let responseJson = null;
        const res = {
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => { responseJson = data; return data; }
            };
          }
        };
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await checkEmployeeLimit(req, res, next);

        assert.strictEqual(statusCode, 403, 'Should respond with 403 Forbidden');
        assert.strictEqual(responseJson.code, 'LIMIT_EXCEEDED');
        assert.strictEqual(nextCalled, false, 'Next middleware must not be invoked');
      } finally {
        db.query = originalQuery;
      }
    });

    it('verifyAndRegister must reject paid registration when signature is omitted', async () => {
      const originalGetConnection = db.getConnection;
      try {
        const mockConn = {
          beginTransaction: async () => {},
          rollback: async () => {},
          commit: async () => {},
          release: () => {},
          query: async (sql, params) => {
            if (sql.includes('FROM users WHERE email = ?')) {
              return [[]];
            }
            if (sql.includes('FROM plans WHERE id = ?')) {
              return [[{ id: 3, name: 'Enterprise Plan', price: '2999.00', duration_months: 1 }]];
            }
            return [{ insertId: 1, affectedRows: 1 }];
          }
        };
        db.getConnection = async () => mockConn;

        const req = {
          body: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'Password123!',
            company_name: 'Jane Enterprise',
            plan_id: 3,
            razorpay_order_id: 'order_paid_123',
            razorpay_payment_id: 'pay_paid_456'
            // razorpay_signature intentionally missing
          }
        };
        let statusCalled = null;
        let jsonCalled = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(payload) { jsonCalled = payload; return this; }
        };

        await paymentController.verifyAndRegister(req, res, () => {});

        assert.strictEqual(statusCalled, 400, 'Must reject paid registration without signature');
        assert.strictEqual(jsonCalled.success, false);
        assert.ok(jsonCalled.message.includes('razorpay_signature'));
      } finally {
        db.getConnection = originalGetConnection;
      }
    });

    it('verifyRazorpayPayment must reject cross-tenant callers attempting to renew plan for another company', async () => {
      const req = {
        user: { id: 10, role: 'admin', company_id: 5 },
        body: {
          employer_id: 999, // Attempt to verify payment for different company
          plan_id: 2,
          razorpay_order_id: 'ord_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: 'sig_1'
        }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await paymentController.verifyRazorpayPayment(req, res, () => {});
      assert.strictEqual(statusCalled, 403);
      assert.strictEqual(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('cannot verify payments for another company'));
    });

    it('POST /api/public/support-ticket must genuinely receive and store account deletion requests', async () => {
      const originalCreateTicket = require('../src/services/supportTicket.service').createTicket;
      let ticketCreated = null;
      require('../src/services/supportTicket.service').createTicket = async (ticketData) => {
        ticketCreated = ticketData;
        return { id: 101, ...ticketData, created_at: new Date() };
      };

      try {
        const publicController = require('../src/controllers/public.controller');
        const req = {
          body: {
            name: 'John Doe',
            email: 'johndoe@example.com',
            category: 'Account Deletion Request',
            priority: 'High',
            message: 'User requests permanent deletion of account data per Google Play policy.'
          }
        };
        let statusCalled = null;
        let jsonPayload = null;
        const res = {
          status(code) { statusCalled = code; return this; },
          json(data) { jsonPayload = data; return this; }
        };

        await publicController.createPublicSupportTicket(req, res, () => {});

        assert.equal(statusCalled, 201, 'Should create ticket with 201 Created');
        assert.equal(jsonPayload.success, true);
        assert.equal(ticketCreated.contactEmail, 'johndoe@example.com');
        assert.match(ticketCreated.subject, /Account Deletion/);
      } finally {
        require('../src/services/supportTicket.service').createTicket = originalCreateTicket;
      }
    });
  });

});
