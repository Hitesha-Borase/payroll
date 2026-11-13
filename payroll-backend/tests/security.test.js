const { describe, it, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

// Setup environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_automated_testing_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_automated_testing_654321';
process.env.CORS_ORIGIN = 'http://localhost:5173,https://payroll.approved-domain.com';

const env = require('../src/config/env');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../src/utils/jwt');
const { authenticate, authorize } = require('../src/middlewares/auth.middleware');
const errorHandler = require('../src/middlewares/error.middleware');
const emailService = require('../src/services/email.service');
const app = require('../src/app');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');
const paymentService = require('../src/services/payment.service');
const paymentController = require('../src/controllers/payment.controller');
const adminController = require('../src/controllers/admin.controller');
const employeeController = require('../src/controllers/employee.controller');
const creditController = require('../src/controllers/credit.controller');
const profileController = require('../src/controllers/profile.controller');
const vendorController = require('../src/controllers/vendor.controller');
const bcrypt = require('bcrypt');
const db = require('../src/config/mysql');

describe('Security Regression Test Suite', () => {

  after(async () => {
    try {
      const db = require('../src/config/mysql');
      if (db && typeof db.end === 'function') {
        await db.end();
      }
    } catch {}
  });

  // Test 1: CORS Protection
  describe('1. CORS Origin Enforcement', () => {
    let server;
    let baseUrl;

    before(async () => {
      server = http.createServer(app);
      await new Promise((resolve) => server.listen(0, resolve));
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    after(async () => {
      await new Promise((resolve) => server.close(resolve));
    });

    it('should reject unapproved browser origins', async () => {
      const res = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': 'https://malicious-attacker-site.com',
        },
      });

      // The unapproved origin must NOT be reflected in Access-Control-Allow-Origin
      const allowOriginHeader = res.headers.get('access-control-allow-origin');
      assert.notEqual(
        allowOriginHeader,
        'https://malicious-attacker-site.com',
        'Unapproved origin must not be granted CORS header'
      );
    });

    it('should approve configured legitimate origins', async () => {
      const res = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': 'http://localhost:5173',
        },
      });

      const allowOriginHeader = res.headers.get('access-control-allow-origin');
      assert.equal(
        allowOriginHeader,
        'http://localhost:5173',
        'Approved origin must receive Access-Control-Allow-Origin header'
      );
    });

    it('should allow non-browser requests without Origin header (mobile apps, server-to-server)', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });
  });

  // Test 2: Token Type Separation & Rejection of Refresh Tokens on Protected Routes
  describe('2. JWT Token Separation & Protected Route Validation', () => {
    it('access tokens must have type: access and verify correctly', () => {
      const token = generateAccessToken({ id: 101, email: 'emp@domain.com', role: 'employee' });
      const decoded = verifyAccessToken(token);

      assert.ok(decoded);
      assert.equal(decoded.id, 101);
      assert.equal(decoded.type, 'access');
    });

    it('refresh tokens must have type: refresh and verify with refresh secret', () => {
      const token = generateRefreshToken({ id: 101 });
      const decoded = verifyRefreshToken(token);

      assert.ok(decoded);
      assert.equal(decoded.id, 101);
      assert.equal(decoded.type, 'refresh');
    });

    it('verifyAccessToken must reject refresh tokens', () => {
      const refreshToken = generateRefreshToken({ id: 101 });
      const decoded = verifyAccessToken(refreshToken);

      assert.equal(decoded, null, 'verifyAccessToken must reject tokens created as refresh tokens');
    });

    it('authenticate middleware must reject refresh tokens with 401', async () => {
      const refreshToken = generateRefreshToken({ id: 101 });
      const req = {
        headers: {
          authorization: `Bearer ${refreshToken}`,
        },
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) {
          statusCalled = code;
          return this;
        },
        json(payload) {
          jsonCalled = payload;
          return this;
        },
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await authenticate(req, res, next);

      assert.equal(statusCalled, 401);
      assert.equal(jsonCalled.success, false);
      assert.equal(nextCalled, false, 'Middleware must not call next() for a refresh token');
    });
  });

  // Test 3: Refresh Endpoint Rejects Access Tokens
  describe('3. Refresh Endpoint Rejection of Access Tokens', () => {
    it('verifyRefreshToken must reject access tokens', () => {
      const accessToken = generateAccessToken({ id: 101, email: 'emp@domain.com', role: 'employee' });
      const decoded = verifyRefreshToken(accessToken);

      assert.equal(decoded, null, 'verifyRefreshToken must reject access tokens');
    });
  });

  // Test 4: Backup & Restore Role Lockdown (SuperAdmin Only)
  describe('4. Backup and Restore Authorization Gate', () => {
    const backupGate = authorize('superadmin');

    it('should reject employer role with 403 Forbidden', () => {
      const req = { user: { id: 5, role: 'employer' } };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; },
      };
      let nextCalled = false;

      backupGate(req, res, () => { nextCalled = true; });

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.equal(nextCalled, false);
    });

    it('should reject company admin role with 403 Forbidden', () => {
      const req = { user: { id: 2, role: 'admin' } };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; },
      };
      let nextCalled = false;

      backupGate(req, res, () => { nextCalled = true; });

      assert.equal(statusCalled, 403);
      assert.equal(nextCalled, false);
    });

    it('should allow superadmin role', () => {
      const req = { user: { id: 1, role: 'superadmin' } };
      const res = {};
      let nextCalled = false;

      backupGate(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true, 'SuperAdmin must be granted access');
    });
  });

  // Test 5: Passwords Omitted from Outgoing Email Templates
  describe('5. Email Template Password Sanitization', () => {
    it('sendWelcomeEmail template must not contain any plaintext password value', async () => {
      const samplePassword = 'PlaintextSuperSecretPassword999!';
      let capturedHtml = '';
      const originalSendEmail = emailService.sendEmail;

      emailService.sendEmail = async ({ htmlContent }) => {
        capturedHtml = htmlContent;
        return { success: true };
      };

      try {
        await emailService.sendWelcomeEmail({
          email: 'testuser@domain.com',
          name: 'Test User',
          password: samplePassword,
          role: 'employee',
          companyName: 'Test Corp',
          portalUrl: 'http://localhost:5173/login',
        });

        assert.ok(
          !capturedHtml.includes(samplePassword),
          'Welcome email must NEVER render the user password in plaintext'
        );
        assert.ok(
          !capturedHtml.includes('>Password:<'),
          'Welcome email must not have a Password credential field'
        );
      } finally {
        emailService.sendEmail = originalSendEmail;
      }
    });

    it('sendHRAdminSubscriptionConfirmationEmail template must not contain plaintext password', async () => {
      const samplePassword = 'AdminSecretPassword999!';
      let capturedHtml = '';
      const originalSendEmail = emailService.sendEmail;

      emailService.sendEmail = async ({ htmlContent }) => {
        capturedHtml = htmlContent;
        return { success: true };
      };

      try {
        await emailService.sendHRAdminSubscriptionConfirmationEmail({
          email: 'admin@domain.com',
          name: 'Admin User',
          password: samplePassword,
          companyName: 'Admin Corp',
          planName: 'Enterprise Plan',
          price: 9999,
          startDate: '2026-10-01',
          expiryDate: '2027-10-01',
        });

        assert.ok(
          !capturedHtml.includes(samplePassword),
          'Subscription email must NEVER render the password in plaintext'
        );
      } finally {
        emailService.sendEmail = originalSendEmail;
      }
    });
  });

  // Test 6: Production Error Sanitization
  describe('6. Production Server Error Sanitization', () => {
    const originalEnv = process.env.NODE_ENV;

    after(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return generic error message for database exceptions in production without leaking SQL internals', () => {
      process.env.NODE_ENV = 'production';

      const simulatedDbError = new Error('Table pop_db.users does not exist in query: SELECT * FROM users WHERE secret = 1');
      simulatedDbError.code = 'ER_NO_SUCH_TABLE';
      simulatedDbError.sql = 'SELECT * FROM users WHERE secret = 1';
      simulatedDbError.sqlMessage = 'Table pop_db.users does not exist';

      const req = { originalUrl: '/api/admin/employees', method: 'GET', ip: '127.0.0.1' };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; },
      };

      errorHandler(simulatedDbError, req, res, () => {});

      assert.equal(statusCalled, 500);
      assert.equal(jsonCalled.success, false);
      assert.equal(
        jsonCalled.message,
        'An unexpected internal server error occurred. Please contact administrator.',
        'Production response must return generic safe message'
      );
      assert.ok(
        !JSON.stringify(jsonCalled).includes('pop_db'),
        'Production response must not leak database schema names'
      );
      assert.ok(
        !jsonCalled.stack,
        'Production response must not contain stack trace'
      );
    });

    it('should format CORS policy rejections with 403 status', () => {
      process.env.NODE_ENV = 'production';
      const corsError = new Error('CORS policy blocked access from origin: https://evil.com');

      const req = { originalUrl: '/api/health', method: 'GET', ip: '127.0.0.1' };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; },
      };

      errorHandler(corsError, req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.equal(jsonCalled.message, 'Access denied by CORS policy.');
    });
  });


  // Test 7: Razorpay Payment Signature & Webhook Verification
  describe('7. Razorpay Signature & Webhook Verification', () => {
    it('payment signature verification must fail closed when secret is missing', () => {
      const origSecret = process.env.RAZORPAY_KEY_SECRET;
      delete process.env.RAZORPAY_KEY_SECRET;
      try {
        const verified = paymentService.verifySignature('order_test', 'pay_test', 'any_signature');
        assert.equal(verified, false, 'Must fail closed when RAZORPAY_KEY_SECRET is unset');
      } finally {
        if (origSecret) process.env.RAZORPAY_KEY_SECRET = origSecret;
      }
    });

    it('payment signature verification must reject mismatched or tampered signatures', () => {
      const testSecret = 'test_razorpay_secret_999888';
      process.env.RAZORPAY_KEY_SECRET = testSecret;

      const orderId = 'order_valid_123';
      const paymentId = 'pay_valid_456';
      const validSig = crypto.createHmac('sha256', testSecret).update(`${orderId}|${paymentId}`).digest('hex');

      // Valid check
      assert.equal(paymentService.verifySignature(orderId, paymentId, validSig), true);

      // Tampered signature
      assert.equal(paymentService.verifySignature(orderId, paymentId, 'tampered_signature_hex'), false);

      // Mismatched order ID
      assert.equal(paymentService.verifySignature('order_tampered', paymentId, validSig), false);

      // Mismatched payment ID
      assert.equal(paymentService.verifySignature(orderId, 'pay_tampered', validSig), false);
    });

    it('webhook verification must fail closed when secret is missing', () => {
      const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
      try {
        const verified = paymentService.verifyWebhookSignature('{"event":"payment.captured"}', 'sig_test');
        assert.equal(verified, false, 'Must fail closed when RAZORPAY_WEBHOOK_SECRET is unset');
      } finally {
        if (origWebhookSecret) process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret;
      }
    });

    it('webhook verification must reject tampered payloads', () => {
      const testWhSecret = 'whsec_test_secret_777';
      process.env.RAZORPAY_WEBHOOK_SECRET = testWhSecret;

      const rawPayload = JSON.stringify({ event: 'payment.captured', entity: { id: 'pay_123' } });
      const validWhSig = crypto.createHmac('sha256', testWhSecret).update(rawPayload).digest('hex');

      assert.equal(paymentService.verifyWebhookSignature(rawPayload, validWhSig), true);
      assert.equal(paymentService.verifyWebhookSignature(rawPayload, 'forged_webhook_signature'), false);
      assert.equal(paymentService.verifyWebhookSignature('{"event":"tampered"}', validWhSig), false);
    });
  });

  // Test 8: Payment Gate Authorization and Route Lockdown
  describe('8. Payment Route and Authorization Lockdown', () => {
    let server;
    let baseUrl;

    before(async () => {
      server = http.createServer(app);
      await new Promise((resolve) => server.listen(0, resolve));
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    after(async () => {
      await new Promise((resolve) => server.close(resolve));
    });

    it('POST /api/payment/confirm-static must reject unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/payment/confirm-static`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employer_id: 1, plan_id: 2, payment_ref: 'OFFLINE_REF_1' })
      });
      assert.equal(res.status, 401);
    });

    it('POST /api/payment/confirm-static route must reject non-superadmin caller with 403', () => {
      const gate = authorize('superadmin');
      const req = { user: { id: 10, role: 'admin', company_id: 1 } };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      gate(req, res, () => {});
      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('Access denied'));
    });

    it('confirmStaticPayment controller must reject missing required parameters with 400', async () => {
      const req = {
        user: { id: 1, role: 'superadmin' },
        body: { employer_id: 1, plan_id: 2 } // missing payment_ref
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await paymentController.confirmStaticPayment(req, res, () => {});
      assert.equal(statusCalled, 400);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('Payment Reference are required'));
    });

    it('PUT /api/public/company-request/:id/payment-status must return 404 (removed from public router)', async () => {
      const res = await fetch(`${baseUrl}/api/public/company-request/99/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid' })
      });
      assert.equal(res.status, 404, 'Public route tampering endpoint must not exist');
    });

    it('verifyRazorpayPayment controller must reject cross-tenant callers with 403', async () => {
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
      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('cannot verify payments for another company'));
    });
  });

  // Test 9: Independent Production JWT Refresh Secret Startup Check
  describe('9. Production JWT Refresh Secret Independence Enforcement', () => {
    const rootPath = path.resolve(__dirname, '..');
    const { spawnSync } = require('child_process');

    it('should throw CRITICAL SECURITY ERROR when JWT_REFRESH_SECRET is unset in production', () => {
      const result = spawnSync(process.execPath, [
        '-e',
        `process.env.NODE_ENV = 'production'; delete process.env.JWT_ACCESS_SECRET; process.env.JWT_SECRET = 'primary_prod_sec_123'; process.env.JWT_REFRESH_SECRET = ''; require('./src/config/env');`
      ], { cwd: rootPath, encoding: 'utf8' });

      assert.notEqual(result.status, 0, 'Process must exit with non-zero status code when refresh secret is unset');
      assert.ok(
        result.stderr.includes('JWT_REFRESH_SECRET environment variable is required in production'),
        `Expected error message in stderr, got: ${result.stderr}`
      );
    });

    it('should throw CRITICAL SECURITY ERROR when JWT_REFRESH_SECRET equals primary JWT_SECRET in production', () => {
      const result = spawnSync(process.execPath, [
        '-e',
        `process.env.NODE_ENV = 'production'; delete process.env.JWT_ACCESS_SECRET; process.env.JWT_SECRET = 'identical_secret_123'; process.env.JWT_REFRESH_SECRET = 'identical_secret_123'; require('./src/config/env');`
      ], { cwd: rootPath, encoding: 'utf8' });

      assert.notEqual(result.status, 0, 'Process must exit with non-zero status code when refresh secret equals access secret');
      assert.ok(
        result.stderr.includes('JWT_REFRESH_SECRET must be distinct'),
        `Expected distinct error message in stderr, got: ${result.stderr}`
      );
    });
  });

  // Test 10: Employer Management Tenant Isolation (IDOR Defense)
  describe('10. Employer Management Tenant Isolation (IDOR Defense)', () => {
    let origQuery;
    let origGetConnection;

    before(() => {
      origQuery = db.query;
      origGetConnection = db.getConnection;
    });

    after(() => {
      db.query = origQuery;
      db.getConnection = origGetConnection;
    });

    it('getEmployerById must reject cross-tenant employer access and ignore forged company_id in body', async () => {
      let capturedSql = '';
      let capturedParams = [];

      db.query = async (sql, params) => {
        capturedSql = sql;
        capturedParams = params;
        return [[]]; // Employer 200 not found for company 100
      };

      const req = {
        params: { id: 200 },
        body: { company_id: 200 }, // Forged company_id in request body
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.getEmployerById(req, res, () => {});

      assert.equal(statusCalled, 404, 'Cross-tenant employer access must return 404');
      assert.ok(
        capturedSql.includes('u.company_id = ? OR e.company_id = ?'),
        'Database query must enforce tenant boundary in SQL WHERE clause'
      );
      assert.deepEqual(
        capturedParams,
        [200, 100, 100],
        'Must derive tenant identity strictly from req.user.company_id, ignoring forged body parameters'
      );
    });

    it('getEmployerById must allow SuperAdmin access without tenant restriction', async () => {
      let capturedSql = '';

      db.query = async (sql, params) => {
        capturedSql = sql;
        return [[{ id: 200, user_id: 5, u_name: 'SuperCorp', credit_balance: 500 }]];
      };

      const req = {
        params: { id: 200 },
        user: { id: 1, role: 'superadmin' }
      };
      let jsonCalled = null;
      const res = {
        status(code) { return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.getEmployerById(req, res, () => {});

      assert.ok(!capturedSql.includes('u.company_id = ?'), 'SuperAdmin query must not restrict company_id');
      assert.equal(jsonCalled.success, true);
      assert.equal(jsonCalled.data.id, 200);
    });

    it('updateEmployer must reject cross-tenant update attempts', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('SELECT e.*, u.company_id')) {
            return [[]]; // Employer 200 does not belong to company 100
          }
          return [{ affectedRows: 0 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 200 },
        body: { company_name: 'Hacked Name', company_id: 200 },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.updateEmployer(req, res, () => {});

      assert.equal(statusCalled, 404, 'Must return 404 when updating employer outside tenant');
      assert.equal(jsonCalled.success, false);
    });

    it('deleteEmployer must reject cross-tenant deletion attempts', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('SELECT e.id, e.user_id')) {
            return [[]]; // Not found in caller tenant
          }
          return [{ affectedRows: 0 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 200 },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.deleteEmployer(req, res, () => {});

      assert.equal(statusCalled, 404, 'Must return 404 when deleting employer outside tenant');
      assert.equal(jsonCalled.success, false);
    });

    it('addCredit must reject cross-tenant credit attempts', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('FROM employers e')) {
          return [[]]; // Employer 200 does not belong to company 100
        }
        return [{ affectedRows: 0 }];
      };

      const req = {
        params: { id: 200 },
        body: { amount: 500, company_id: 200 },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.addCredit(req, res, () => {});

      assert.equal(statusCalled, 404, 'Must return 404 when adding credits to employer outside tenant');
      assert.equal(jsonCalled.success, false);
    });

    it('addCreditBulk must reject request with 403 when employer IDs contain external tenant', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('SELECT e.id FROM employers e')) {
            // Only employer 100 belongs to company 100; employer 200 does not
            return [[{ id: 100 }]];
          }
          return [{ affectedRows: 0 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { employer_ids: [100, 200], amount: 250 },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.addCreditBulk(req, res, () => {});

      assert.equal(statusCalled, 403, 'Must return 403 Forbidden when bulk list contains external employer');
      assert.ok(jsonCalled.message.includes('do not belong to your company'));
    });
  });

  // Test 11: Employee Bank Details Authorization & Isolation
  describe('11. Employee Bank Details Authorization & Isolation', () => {
    let origQuery;
    let origGetConnection;

    before(() => {
      origQuery = db.query;
      origGetConnection = db.getConnection;
    });

    after(() => {
      db.query = origQuery;
      db.getConnection = origGetConnection;
    });

    it('addBankDetails must derive employee identity strictly from req.user.id and ignore forged ids', async () => {
      let insertedEmployeeId = null;
      let insertedEmployerId = null;

      const mockConn = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('SELECT id, employer_id, company_id FROM employees WHERE user_id = ?')) {
            assert.equal(params[0], 505, 'Must query employee using authenticated req.user.id');
            return [[{ id: 77, employer_id: 12, company_id: 12 }]];
          }
          if (sql.includes('INSERT INTO bank_details')) {
            insertedEmployeeId = params[0];
            insertedEmployerId = params[1];
            return [{ insertId: 1 }];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: {
          employee_id: 9999, // Forged employee_id in body
          employer_id: 8888, // Forged employer_id in body
          company_id: 7777,   // Forged company_id in body
          bankName: 'HDFC Bank',
          accountNumber: '123456789012',
          ifscCode: 'HDFC0001234',
          isPrimary: true
        },
        user: { id: 505, role: 'employee', company_id: 12 }
      };
      let jsonCalled = null;
      const res = {
        status(code) { return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await employeeController.addBankDetails(req, res, () => {});

      assert.equal(jsonCalled.success, true);
      assert.equal(insertedEmployeeId, 77, 'Must insert verified employee ID (77), not forged 9999');
      assert.equal(insertedEmployerId, 12, 'Must insert verified employer ID (12), not forged 8888');
    });

    it('setPrimaryBankDetails must reject setting another employee bank account as primary with 404', async () => {
      const executedQueries = [];
      const mockConn = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async (sql, params) => {
          executedQueries.push({ sql, params });
          if (sql.includes('SELECT id FROM employees WHERE user_id = ?')) {
            return [[{ id: 77 }]]; // Authenticated user is employee 77
          }
          if (sql.includes('SELECT id FROM bank_details WHERE id = ? AND employee_id = ?')) {
            // Bank record 99 belongs to employee 88, NOT 77
            return [[]];
          }
          return [{ affectedRows: 0 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 99 },
        user: { id: 505, role: 'employee' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await employeeController.setPrimaryBankDetails(req, res, () => {});

      assert.equal(statusCalled, 404, 'Must return 404 for bank account belonging to another employee');
      assert.ok(jsonCalled.message.includes('not found or access denied'));

      // CRITICAL CHECK: Global unscoped reset must NEVER be executed
      const globalReset = executedQueries.some(q => q.sql === 'UPDATE bank_details SET is_primary = 0');
      assert.equal(globalReset, false, 'CRITICAL: Must NEVER execute global un-scoped is_primary reset!');
    });

    it('setPrimaryBankDetails must execute atomic scoped primary reset for legitimate owner only', async () => {
      const executedQueries = [];
      const mockConn = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async (sql, params) => {
          executedQueries.push({ sql, params });
          if (sql.includes('SELECT id FROM employees WHERE user_id = ?')) {
            return [[{ id: 77 }]];
          }
          if (sql.includes('SELECT id FROM bank_details WHERE id = ? AND employee_id = ?')) {
            return [[{ id: 42 }]]; // Verified ownership of account 42
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 42 },
        user: { id: 505, role: 'employee' }
      };
      let jsonCalled = null;
      const res = {
        status(code) { return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await employeeController.setPrimaryBankDetails(req, res, () => {});

      assert.equal(jsonCalled.success, true);

      // Verify scoped reset query
      const scopedReset = executedQueries.find(q =>
        q.sql.includes('UPDATE bank_details SET is_primary = 0 WHERE employee_id = ?')
      );
      assert.ok(scopedReset, 'Primary account reset must be strictly scoped to WHERE employee_id = ?');
      assert.equal(scopedReset.params[0], 77, 'Must scope reset to caller employee ID');

      // Verify scoped primary activation
      const scopedSet = executedQueries.find(q =>
        q.sql.includes('UPDATE bank_details SET is_primary = 1') && q.sql.includes('employee_id = ?')
      );
      assert.ok(scopedSet, 'Primary account activation must be strictly scoped to WHERE id = ? AND employee_id = ?');
    });

    it('deleteBankDetails must reject deleting bank records belonging to another employee', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('SELECT id FROM employees WHERE user_id = ?')) {
            return [[{ id: 77 }]];
          }
          if (sql.includes('SELECT id FROM bank_details WHERE id = ? AND employee_id = ?')) {
            return [[]]; // Record 888 does not belong to employee 77
          }
          return [{ affectedRows: 0 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 888 },
        user: { id: 505, role: 'employee' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await employeeController.deleteBankDetails(req, res, () => {});

      assert.equal(statusCalled, 404);
      assert.ok(jsonCalled.message.includes('not found or access denied'));
    });

    it('getBankDetails must mask sensitive financial account numbers in API response', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('SELECT id FROM employees WHERE user_id = ?')) {
          return [[{ id: 77 }]];
        }
        if (sql.includes('SELECT * FROM bank_details WHERE employee_id = ?')) {
          return [[
            {
              id: 1,
              employee_id: 77,
              bank_name: 'State Bank of India',
              account_number: '987654321098',
              ifsc_code: 'SBIN0001234',
              is_primary: 1
            }
          ]];
        }
        return [[]];
      };

      const req = { user: { id: 505, role: 'employee' } };
      let jsonCalled = null;
      const res = {
        status(code) { return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await employeeController.getBankDetails(req, res, () => {});

      assert.equal(jsonCalled.success, true);
      const bankItem = jsonCalled.data[0];
      assert.ok(bankItem.account_number.includes('••••••••1098'), 'Account number must be masked in response');
      assert.ok(!bankItem.account_number.includes('98765432'), 'Plaintext full account number must not be exposed');
    });
  });

  // Test 12: Credit Management Cross-Tenant Protection (Adjacent Endpoints)
  describe('12. Credit Management Cross-Tenant Protection', () => {
    let origGetConnection;

    before(() => {
      origGetConnection = db.getConnection;
    });

    after(() => {
      db.getConnection = origGetConnection;
    });

    it('creditController.addCreditSingle must reject crediting another company with 403', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async () => [{ affectedRows: 0 }]
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { employer_id: 200, amount: 100 }, // Company 200
        user: { id: 10, role: 'admin', company_id: 100 } // Admin of Company 100
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await creditController.addCreditSingle(req, res, () => {});

      assert.equal(statusCalled, 403, 'Must reject adding credit to external tenant with 403');
      assert.ok(jsonCalled.message.includes('cannot add credit to another company'));
    });

    it('creditController.addCreditBulk must reject request with 403 when company IDs contain external tenant', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async () => [{ affectedRows: 0 }]
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { employer_ids: [100, 200], amount: 150 },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await creditController.addCreditBulk(req, res, () => {});

      assert.equal(statusCalled, 403, 'Must reject bulk credit with external company with 403');
      assert.ok(jsonCalled.message.includes('cannot add credit to other companies'));
    });

    it('creditController.addCreditSingle must allow SuperAdmin crediting any company', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('SELECT id FROM companies WHERE id = ?')) {
            return [[{ id: 200 }]];
          }
          if (sql.includes('SELECT * FROM credits WHERE employer_id = ?')) {
            return [[{ id: 1, balance: 100 }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { employer_id: 200, amount: 50 },
        user: { id: 1, role: 'superadmin' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await creditController.addCreditSingle(req, res, () => {});

      assert.equal(statusCalled, 201, 'SuperAdmin credit must succeed with 201 Created');
      assert.equal(jsonCalled.success, true);
    });
  });

  // Test 13: Payment Intent and Verified Purchase Flow
  describe('13. Payment Gateway Intent, Order Generation & Verified Purchase', () => {
    const originalQuery = db.query;
    const originalGetConn = db.getConnection;

    afterEach(() => {
      db.query = originalQuery;
      db.getConnection = originalGetConn;
    });

    it('paymentService.createPaymentIntent must generate a valid order structure', async () => {
      const intent = await paymentService.createPaymentIntent(999, 'INR', { plan_id: 2 });
      assert.ok(intent.order_id, 'Must contain order_id');
      assert.ok(intent.transactionId, 'Must contain transactionId');
      assert.equal(intent.amount, 99900, 'Must convert rupees to paise (999 * 100)');
      assert.equal(intent.currency, 'INR');
    });

    it('paymentService.verifyPayment must fail closed when signature is missing', async () => {
      const result = await paymentService.verifyPayment('order_123', 'pay_123', null);
      assert.equal(result.success, false, 'Must fail closed when signature is absent');
    });

    it('purchasePlan must initiate an order if payment proof is missing for a paid plan', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM employers WHERE id = ?')) {
            return [[{ id: 100, company_name: 'Test Corp' }]];
          }
          if (sql.includes('FROM plans WHERE id = ?')) {
            return [[{ id: 2, name: 'Pro Plan', price: '999.00', duration_months: 1 }]];
          }
          return [{ insertId: 1, affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { plan_id: 2 },
        user: { id: 10, role: 'admin', company_id: 100 },
        ip: '127.0.0.1'
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.purchasePlan(req, res, () => {});

      assert.equal(statusCalled, 200);
      assert.equal(jsonCalled.requires_payment, true);
      assert.ok(jsonCalled.data.order_id);
      assert.equal(jsonCalled.data.plan_id, 2);
    });

    it('purchasePlan must reject paid plan with invalid signature with 400', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'secure_test_secret_key_1234567890';
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM employers WHERE id = ?')) {
            return [[{ id: 100, company_name: 'Test Corp' }]];
          }
          if (sql.includes('FROM plans WHERE id = ?')) {
            return [[{ id: 2, name: 'Pro Plan', price: '999.00', duration_months: 1 }]];
          }
          return [{ insertId: 1, affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: {
          plan_id: 2,
          razorpay_order_id: 'order_test_123',
          razorpay_payment_id: 'pay_test_456',
          razorpay_signature: 'forged_fake_signature'
        },
        user: { id: 10, role: 'admin', company_id: 100 },
        ip: '127.0.0.1'
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.purchasePlan(req, res, () => {});

      assert.equal(statusCalled, 400, 'Must reject invalid signature with 400');
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('signature'));
    });

    it('verifyAndRegister must reject paid plans when signature is omitted', async () => {
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
        }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await paymentController.verifyAndRegister(req, res, () => {});

      assert.equal(statusCalled, 400, 'Must reject paid registration without signature');
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('razorpay_signature'));
    });
  });

  // Test 14: Google Play Account Deletion, Direct Admin Employee Management & Statutory Archival
  describe('14. Google Play In-App Account Deletion & Statutory Record Archival', () => {
    const originalQuery = db.query;
    const originalGetConn = db.getConnection;

    afterEach(() => {
      db.query = originalQuery;
      db.getConnection = originalGetConn;
    });

    it('deleteAccount must permit employee self-deletion and scrub personal PII while retaining statutory records', async () => {
      const req = {
        body: { password: 'Password123!' },
        user: { id: 50, role: 'employee', company_id: 10 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      const hash = await bcrypt.hash('Password123!', 10);
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM users WHERE id = ?')) {
            return [[{ id: 50, password: hash, email: 'emp@test.com', company_id: 10, role: 'employee' }]];
          }
          return [[]];
        }
      };
      db.getConnection = async () => mockConn;

      await profileController.deleteAccount(req, res, () => {});

      assert.equal(jsonCalled.success, true);
      assert.ok(jsonCalled.message.includes('personal account has been deleted'));
    });

    it('deleteAccount must permit employer self-deletion and deactivate company while retaining statutory records', async () => {
      const req = {
        body: { password: 'Password123!' },
        user: { id: 40, role: 'employer', company_id: 10 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      const hash = await bcrypt.hash('Password123!', 10);
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM users WHERE id = ?')) {
            return [[{ id: 40, password: hash, email: 'owner@test.com', company_id: 10, role: 'employer' }]];
          }
          return [[]];
        }
      };
      db.getConnection = async () => mockConn;

      await profileController.deleteAccount(req, res, () => {});

      assert.equal(jsonCalled.success, true);
      assert.ok(jsonCalled.message.includes('statutory financial, invoice, and tax records are retained'));
    });

    it('deleteAccount must reject deletion when password is missing with 400 for authorized roles', async () => {
      const req = {
        body: {},
        user: { id: 50, role: 'jobseeker' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async () => [[]]
      };
      db.getConnection = async () => mockConn;

      await profileController.deleteAccount(req, res, () => {});

      assert.equal(statusCalled, 400);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('password is required'));
    });

    it('deleteAccount must reject deletion with incorrect password with 400 for authorized roles', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql) => {
          if (sql.includes('FROM users WHERE id = ?')) {
            return [[{ id: 50, name: 'Job Seeker', email: 'js@test.com', role: 'jobseeker', password: hashedPassword }]];
          }
          return [[]];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { password: 'WrongPassword999' },
        user: { id: 50, role: 'jobseeker' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await profileController.deleteAccount(req, res, () => {});

      assert.equal(statusCalled, 400);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('Incorrect password'));
    });

    it('deleteAccount must soft-delete user, anonymize PII, and preserve statutory records for company admin upon valid password', async () => {
      const hashedPassword = await bcrypt.hash('ValidPass123!', 10);
      const executedQueries = [];

      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          executedQueries.push({ sql, params });
          if (sql.includes('FROM users WHERE id = ?')) {
            return [[{ id: 10, name: 'Company Admin', email: 'admin@company.com', role: 'admin', company_id: 1, password: hashedPassword }]];
          }
          if (sql.includes('SELECT id FROM users WHERE company_id = ?')) {
            return [[{ id: 50 }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { password: 'ValidPass123!' },
        user: { id: 10, role: 'admin', company_id: 1 },
        ip: '192.168.1.100'
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await profileController.deleteAccount(req, res, () => {});

      assert.equal(statusCalled, null, 'Status default 200 on success');
      assert.equal(jsonCalled.success, true);
      assert.ok(jsonCalled.message.includes('anonymized'));

      // Verify that user status is set to deleted and email scrubbed
      const userUpdateQuery = executedQueries.find(q => q.sql.includes('UPDATE users') && q.params && q.params[2] === 10);
      assert.ok(userUpdateQuery, 'Must execute UPDATE users to soft-delete and anonymize admin');
      assert.ok(userUpdateQuery.sql.includes("status = 'deleted'"));
      assert.ok(userUpdateQuery.sql.includes("name = 'Deactivated User'"));

      // Verify company status set to inactive
      const compUpdateQuery = executedQueries.find(q => q.sql.includes('UPDATE companies'));
      assert.ok(compUpdateQuery, 'Must mark company inactive');
      assert.ok(compUpdateQuery.sql.includes("status = 'inactive'"));

      // Verify associated employees deactivated and bank details scrubbed
      const empUpdateQuery = executedQueries.find(q => q.sql.includes('UPDATE employees'));
      assert.ok(empUpdateQuery, 'Must mark company employees inactive');
      assert.ok(empUpdateQuery.sql.includes("status = 'inactive'"));

      const bankUpdateQuery = executedQueries.find(q => q.sql.includes('UPDATE bank_details'));
      assert.ok(bankUpdateQuery, 'Must anonymize employee bank details');

      // Verify statutory audit log is created
      const auditLogQuery = executedQueries.find(q => q.sql.includes('INSERT INTO audit_logs'));
      assert.ok(auditLogQuery, 'Must record statutory audit log');
      assert.equal(auditLogQuery.params[1], 'ACCOUNT_DELETED');

      // CRITICAL: Ensure NO DELETE statements were run against invoices, salary_records, or payments
      const destructiveQueries = executedQueries.filter(q =>
        q.sql.toLowerCase().includes('delete from invoices') ||
        q.sql.toLowerCase().includes('delete from salary_records') ||
        q.sql.toLowerCase().includes('delete from payments')
      );
      assert.equal(destructiveQueries.length, 0, 'Must NEVER cascade-delete statutory financial records');
    });

    it('deleteAccount for vendor must deactivate vendor record and scrub vendor bank details', async () => {
      const hashedPassword = await bcrypt.hash('VendorSecret123', 10);
      const executedQueries = [];

      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          executedQueries.push({ sql, params });
          if (sql.includes('FROM users WHERE id = ?')) {
            return [[{ id: 70, name: 'Vendor User', email: 'v@test.com', role: 'vendor', password: hashedPassword }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: { password: 'VendorSecret123' },
        user: { id: 70, role: 'vendor' },
        ip: '10.0.0.1'
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await profileController.deleteAccount(req, res, () => {});

      assert.equal(statusCalled, null);
      assert.equal(jsonCalled.success, true);

      const vendorUpdate = executedQueries.find(q => q.sql.includes('UPDATE vendors'));
      assert.ok(vendorUpdate, 'Must update vendor record');
      assert.ok(vendorUpdate.sql.includes("status = 'inactive'"));

      const vbaUpdate = executedQueries.find(q => q.sql.includes('UPDATE vendor_bank_accounts'));
      assert.ok(vbaUpdate, 'Must anonymize vendor bank accounts');
    });

    it('employerController.deleteEmployee must strictly reject employee deletion with 403 Forbidden', async () => {
      const employerController = require('../src/controllers/employer.controller');
      const req = {
        params: { employeeId: 50 },
        user: { id: 40, role: 'employer', company_id: 1 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await employerController.deleteEmployee(req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('Only Company Administrators are authorized'));
    });

    it('adminController.deleteEmployee must reject cross-tenant deletion attempts with 403 Forbidden', async () => {
      const mockConn = {
        query: async (sql, params) => {
          if (sql.includes('FROM employees emp')) {
            // Employee belongs to company 2
            return [[{ id: 99, user_id: 50, company_id: 2, user_company_id: 2 }]];
          }
          return [[]];
        },
        release: () => {}
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 99 },
        user: { id: 10, role: 'admin', company_id: 1 } // Admin belongs to company 1
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.deleteEmployee(req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('another company'));
    });

    it('adminController.deleteEmployee must successfully delete employee belonging to own company', async () => {
      const executed = [];
      const mockConn = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query: async (sql, params) => {
          executed.push({ sql, params });
          if (sql.includes('FROM employees emp')) {
            // Employee belongs to company 1
            return [[{ id: 99, user_id: 50, company_id: 1, user_company_id: 1 }]];
          }
          return [{ affectedRows: 1 }];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 99 },
        user: { id: 10, role: 'admin', company_id: 1 },
        ip: '127.0.0.1'
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.deleteEmployee(req, res, () => {});

      assert.equal(statusCalled, null);
      assert.equal(jsonCalled.success, true);
      assert.ok(executed.some(q => q.sql.includes('DELETE FROM employees WHERE id = ?')));
      assert.ok(executed.some(q => q.sql.includes('DELETE FROM users WHERE id = ?')));
    });

    it('adminController.toggleUserStatus must reject cross-company status toggle with 403 Forbidden', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('FROM users WHERE id = ?')) {
          return [[{ id: 50, company_id: 2 }]]; // Belongs to company 2
        }
        return [[]];
      };

      const req = {
        params: { id: 50 },
        body: { status: 'blocked' },
        user: { id: 10, role: 'admin', company_id: 1 } // Admin belongs to company 1
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.toggleUserStatus(req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('Cross-company operation is not permitted'));
    });
  });

  // Test 15: Payment Gateway Verification Beyond Signature & Capture Validation
  describe('15. Payment Gateway Verification Beyond Signature & Capture Validation', () => {
    const originalQuery = db.query;
    const originalGetConn = db.getConnection;
    const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;

    before(() => {
      process.env.RAZORPAY_KEY_SECRET = 'secure_test_razorpay_secret_1234567890';
    });

    after(() => {
      process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
      paymentService.mockPaymentFetcher = null;
    });

    afterEach(() => {
      db.query = originalQuery;
      db.getConnection = originalGetConn;
      paymentService.mockPaymentFetcher = null;
    });

    const createValidSignature = (orderId, paymentId) => {
      return crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    };

    it('verifyAndValidatePayment must reject payment when gateway status is uncaptured (authorized/failed)', async () => {
      const orderId = 'order_test_999';
      const paymentId = 'pay_test_999';
      const signature = createValidSignature(orderId, paymentId);

      paymentService.mockPaymentFetcher = () => ({
        id: paymentId,
        order_id: orderId,
        amount: 99900,
        currency: 'INR',
        status: 'authorized' // Not captured!
      });

      const result = await paymentService.verifyAndValidatePayment({
        orderId,
        paymentId,
        signature,
        expectedAmountInPaise: 99900,
        expectedCurrency: 'INR'
      });

      assert.equal(result.isValid, false);
      assert.ok(result.error.includes('captured'));
    });

    it('verifyAndValidatePayment must reject payment when order ID mismatches gateway record', async () => {
      const orderId = 'order_test_111';
      const paymentId = 'pay_test_111';
      const signature = createValidSignature(orderId, paymentId);

      paymentService.mockPaymentFetcher = () => ({
        id: paymentId,
        order_id: 'order_OTHER_DIFFERENT_ORDER',
        amount: 99900,
        currency: 'INR',
        status: 'captured'
      });

      const result = await paymentService.verifyAndValidatePayment({
        orderId,
        paymentId,
        signature,
        expectedAmountInPaise: 99900,
        expectedCurrency: 'INR'
      });

      assert.equal(result.isValid, false);
      assert.ok(result.error.includes('order mismatch'));
    });

    it('verifyAndValidatePayment must reject payment when amount mismatches expected plan price', async () => {
      const orderId = 'order_test_222';
      const paymentId = 'pay_test_222';
      const signature = createValidSignature(orderId, paymentId);

      paymentService.mockPaymentFetcher = () => ({
        id: paymentId,
        order_id: orderId,
        amount: 100, // Client paid 100 paise instead of 99900
        currency: 'INR',
        status: 'captured'
      });

      const result = await paymentService.verifyAndValidatePayment({
        orderId,
        paymentId,
        signature,
        expectedAmountInPaise: 99900,
        expectedCurrency: 'INR'
      });

      assert.equal(result.isValid, false);
      assert.ok(result.error.includes('amount mismatch'));
    });

    it('verifyAndValidatePayment must reject payment when currency mismatches expected currency', async () => {
      const orderId = 'order_test_333';
      const paymentId = 'pay_test_333';
      const signature = createValidSignature(orderId, paymentId);

      paymentService.mockPaymentFetcher = () => ({
        id: paymentId,
        order_id: orderId,
        amount: 99900,
        currency: 'USD', // Mismatched currency
        status: 'captured'
      });

      const result = await paymentService.verifyAndValidatePayment({
        orderId,
        paymentId,
        signature,
        expectedAmountInPaise: 99900,
        expectedCurrency: 'INR'
      });

      assert.equal(result.isValid, false);
      assert.ok(result.error.includes('currency mismatch'));
    });

    it('verifyRazorpayPayment must reject replay / duplicate payment with 409 Conflict', async () => {
      const orderId = 'order_dup_123';
      const paymentId = 'pay_dup_123';
      const signature = createValidSignature(orderId, paymentId);

      paymentService.mockPaymentFetcher = () => ({
        id: paymentId,
        order_id: orderId,
        amount: 99900,
        currency: 'INR',
        status: 'captured'
      });

      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql) => {
          if (sql.includes('FROM plans WHERE id = ?')) {
            return [[{ id: 2, name: 'Pro Plan', price: '999.00', duration_months: 1 }]];
          }
          if (sql.includes('FROM payments WHERE payment_reference = ? OR transaction_id = ?')) {
            return [[{ id: 88, transaction_id: paymentId }]]; // Already processed!
          }
          return [[]];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        body: {
          empId: 100,
          plan_id: 2,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await paymentController.verifyRazorpayPayment(req, res, () => {});

      assert.equal(statusCalled, 409, 'Must return 409 Conflict on duplicate payment');
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('Duplicate payment'));
    });
  });

  // Test 16: Vendor Bank Details and Financial IDOR Protections
  describe('16. Vendor Bank Details and Financial IDOR Protections', () => {
    const originalQuery = db.query;
    const originalGetConn = db.getConnection;

    afterEach(() => {
      db.query = originalQuery;
      db.getConnection = originalGetConn;
    });

    it('getBankAccounts must mask sensitive account numbers in response', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('SELECT id, user_id, company_id FROM vendors')) {
          return [[{ id: 5, user_id: 30, company_id: 100 }]];
        }
        if (sql.includes('FROM vendor_bank_accounts')) {
          return [[{
            id: 1,
            bankName: 'HDFC Bank',
            accountNumber: '12345678901234',
            accountType: 'Current',
            ifscCode: 'HDFC0001234',
            branch: 'Main Branch',
            isPrimary: 1
          }]];
        }
        return [[]];
      };

      const req = {
        user: { id: 30, role: 'vendor' },
        query: {}
      };
      let jsonCalled = null;
      const res = {
        json(payload) { jsonCalled = payload; return this; }
      };

      await vendorController.getBankAccounts(req, res, () => {});

      assert.equal(jsonCalled.success, true);
      assert.equal(jsonCalled.data[0].accountNumber, '•••• •••• •••• 1234', 'Account number must be masked');
    });

    it('getBankAccounts must reject cross-tenant admin query with 403', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('SELECT id, user_id, company_id FROM vendors WHERE id = ?')) {
          return [[{ id: 9, user_id: 99, company_id: 200 }]]; // Vendor belongs to company 200
        }
        return [[]];
      };

      const req = {
        user: { id: 10, role: 'admin', company_id: 100 }, // Caller from company 100
        query: { vendor_id: 9 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await vendorController.getBankAccounts(req, res, () => {});

      assert.equal(statusCalled, 403, 'Must return 403 when querying vendor from another company');
      assert.equal(jsonCalled.success, false);
    });

    it('setPrimaryBankAccount must reject updating bank account of another vendor/tenant', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM vendor_bank_accounts ba')) {
            // Target bank account belongs to user 99, company 200
            return [[{ id: 10, user_id: 99, vendor_company_id: 200 }]];
          }
          return [[]];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 10 },
        user: { id: 30, role: 'vendor' } // Caller is vendor with user_id 30
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await vendorController.setPrimaryBankAccount(req, res, () => {});

      assert.equal(statusCalled, 404);
      assert.equal(jsonCalled.success, false);
    });

    it('adminController.updateVendor must reject updating vendor of another company with 403', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('SELECT * FROM vendors WHERE id = ?')) {
          return [[{ id: 5, company_id: 200, company_name: 'External Vendor' }]];
        }
        return [{ affectedRows: 0 }];
      };

      const req = {
        params: { id: 5 },
        body: { company_name: 'Hacked Name' },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.updateVendor(req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('another company'));
    });

    it('adminController.deleteTransaction must reject cross-tenant transaction deletion with 403', async () => {
      db.query = async (sql, params) => {
        if (sql.includes('FROM transactions t')) {
          return [[]]; // Not in caller tenant
        }
        return [{ affectedRows: 0 }];
      };

      const req = {
        params: { id: 50 },
        user: { id: 10, role: 'admin', company_id: 100 }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.deleteTransaction(req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
    });

    it('adminController.approveCreditRequest must reject cross-tenant approval with 403', async () => {
      const mockConn = {
        beginTransaction: async () => {},
        rollback: async () => {},
        commit: async () => {},
        release: () => {},
        query: async (sql, params) => {
          if (sql.includes('FROM transactions t')) {
            return [[{ id: 25, employer_id: 99, emp_company_id: 200, status: 'pending', amount: '100' }]];
          }
          return [[]];
        }
      };
      db.getConnection = async () => mockConn;

      const req = {
        params: { id: 25 },
        user: { id: 10, role: 'admin', company_id: 100 } // Company 100 caller
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status(code) { statusCalled = code; return this; },
        json(payload) { jsonCalled = payload; return this; }
      };

      await adminController.approveCreditRequest(req, res, () => {});

      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
      assert.ok(jsonCalled.message.includes('another company'));
    });
  });

});
