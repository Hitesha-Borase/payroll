const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Setup environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_automated_testing_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_automated_testing_654321';
process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.kiaan.payroll';

const db = require('../src/config/mysql');
const googlePlayService = require('../src/services/googlePlay.service');
const googlePlayController = require('../src/controllers/googlePlay.controller');
const profileController = require('../src/controllers/profile.controller');
const adminController = require('../src/controllers/admin.controller');

describe('Kiaan PayrollPlus Phase 4 Security, Compliance & Release Readiness Suite', () => {

  after(async () => {
    try {
      if (db && typeof db.end === 'function') {
        await db.end();
      }
    } catch {}
  });

  // =========================================================================
  // 1. Database Integrity & Engine Baseline
  // =========================================================================
  describe('1. pop_db Baseline & Engine Audit', () => {
    it('pop_db must contain exactly 56 tables and all 56 must use InnoDB (0 MyISAM)', async () => {
      const [rows] = await db.query(
        "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'pop_db'"
      );
      assert.strictEqual(rows.length, 56, `Expected 56 tables in pop_db, found ${rows.length}`);
      
      const myisamTables = rows.filter(r => r.ENGINE.toUpperCase() === 'MYISAM');
      assert.strictEqual(myisamTables.length, 0, `Expected 0 MyISAM tables, found: ${myisamTables.map(t => t.TABLE_NAME).join(', ')}`);
      
      const innodbTables = rows.filter(r => r.ENGINE.toUpperCase() === 'INNODB');
      assert.strictEqual(innodbTables.length, 56, `Expected all 56 tables to be InnoDB, found ${innodbTables.length}`);
    });

    it('pop_db customer subscriptions #1 and #2 must remain active with end_date 2027-10-28', async () => {
      const [subs] = await db.query("SELECT id, employer_id, plan_id, status, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date_str FROM subscriptions WHERE id IN (1, 2) ORDER BY id ASC");
      assert.strictEqual(subs.length, 2);

      for (const s of subs) {
        assert.strictEqual(s.plan_id, 2);
        assert.strictEqual(s.status, 'active');
        assert.strictEqual(s.end_date_str, '2027-10-28');
      }
    });

    it('pop_db baseline counts must be strictly 12 users, 2 employers, 1 company, 2 subscriptions', async () => {
      const [users] = await db.query('SELECT count(*) as c FROM users');
      assert.strictEqual(users[0].c, 12);

      const [employers] = await db.query('SELECT count(*) as c FROM employers');
      assert.strictEqual(employers[0].c, 2);

      const [companies] = await db.query('SELECT count(*) as c FROM companies');
      assert.strictEqual(companies[0].c, 1);

      const [subs] = await db.query('SELECT count(*) as c FROM subscriptions');
      assert.strictEqual(subs[0].c, 2);
    });
  });

  // =========================================================================
  // 2. Token Masking & Narrowly Scoped Upgrade Token Endpoint
  // =========================================================================
  describe('2. Token Masking & Secure Upgrade Token Retrieval', () => {
    it('getMySubscription must NEVER expose raw unmasked Google purchase token in general responses', async () => {
      let jsonPayload = null;
      const req = {
        user: { id: 3, company_id: 1, role: 'employer' }
      };
      const res = {
        json(data) { jsonPayload = data; return this; },
        status() { return this; }
      };

      await adminController.getMySubscription(req, res, () => {});
      assert.ok(jsonPayload);
      assert.strictEqual(jsonPayload.success, true);
      
      if (jsonPayload.data?.google_purchase_token) {
        // Must be masked (e.g. play_t...xxxx)
        assert.ok(jsonPayload.data.google_purchase_token.startsWith('play_t'), 'Google purchase token must be masked');
        assert.ok(jsonPayload.data.google_purchase_token.includes('...'), 'Google purchase token must be masked with ellipsis');
      }
    });

    it('getUpgradePurchaseToken endpoint must return the purchase token ONLY to the authenticated tenant', async () => {
      // Create temporary active subscription with a known purchase token
      const rawToken = 'super_secret_upgrade_token_abcdef123456789';
      await db.query(
        "UPDATE subscriptions SET google_purchase_token = ?, payment_gateway = 'google_play' WHERE id = 1",
        [rawToken]
      );

      let resultJson = null;
      const req = {
        user: { id: 3, company_id: 1, role: 'employer' },
        employer: { id: 1, company_id: 1 }
      };
      const res = {
        json(data) { resultJson = data; return this; },
        status() { return this; }
      };

      await googlePlayController.getUpgradePurchaseToken(req, res, () => {});
      assert.ok(resultJson);
      assert.strictEqual(resultJson.success, true);
      assert.strictEqual(resultJson.hasActiveSubscription, true);
      assert.strictEqual(resultJson.oldPurchaseToken, rawToken);

      // Revert subscription #1 to pristine state
      await db.query(
        "UPDATE subscriptions SET google_purchase_token = NULL, payment_gateway = NULL WHERE id = 1"
      );
    });

    it('RTDN webhook must fail closed (403) when verification token is configured and missing from request', async () => {
      const origEnv = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
      process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN = 'secret_pubsub_token_xyz999';

      let statusCode = null;
      const req = {
        query: {},
        headers: {},
        body: { message: { data: Buffer.from('{}').toString('base64') } }
      };
      const res = {
        status(code) { statusCode = code; return this; },
        json() { return this; }
      };

      await googlePlayController.handleGooglePlayRTDN(req, res, () => {});
      assert.strictEqual(statusCode, 403, 'Must return 403 Forbidden when verification token is omitted');

      // Restore env
      if (origEnv) {
        process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN = origEnv;
      } else {
        delete process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
      }
    });
  });

  // =========================================================================
  // 3. Account Deletion Compliance & Data Retention
  // =========================================================================
  describe('3. Account Deletion & Statutory Retention Compliance', () => {
    let testCompId = null;
    let testEmpUserId = null;
    let testEmployerId = null;
    let testEmployeeUserId = null;
    let testEmployeeId = null;

    it('Company Admin/Employer can delete company account: deactivates company, cancels sub, scrubs PII, retains audit log', async () => {
      const hashedPassword = await bcrypt.hash('DeleteSecret123!', 10);
      let testSubId = null;

      try {
        // 1. Create temporary company, employer, and employee
        const [compRes] = await db.query(
          "INSERT INTO companies (company_name, subscription_plan, status, created_at, updated_at) VALUES ('Delete Test Corp', 'Starter Plan', 'active', NOW(), NOW())"
        );
        testCompId = compRes.insertId;

        const [empUserRes] = await db.query(
          "INSERT INTO users (name, email, password, role, company_id, status, created_at, updated_at) VALUES ('Delete Owner', 'del_owner@test.com', ?, 'employer', ?, 'active', NOW(), NOW())",
          [hashedPassword, testCompId]
        );
        testEmpUserId = empUserRes.insertId;

        const [empRes] = await db.query(
          "INSERT INTO employers (user_id, company_id, company_name, status, created_at, updated_at) VALUES (?, ?, 'Delete Test Corp', 'active', NOW(), NOW())",
          [testEmpUserId, testCompId]
        );
        testEmployerId = empRes.insertId;

        const [eeUserRes] = await db.query(
          "INSERT INTO users (name, email, password, role, company_id, status, created_at, updated_at) VALUES ('Delete Employee', 'del_emp@test.com', ?, 'employee', ?, 'active', NOW(), NOW())",
          [hashedPassword, testCompId]
        );
        testEmployeeUserId = eeUserRes.insertId;

        const [eeRes] = await db.query(
          "INSERT INTO employees (user_id, company_id, employer_id, designation, salary, status, created_at, updated_at) VALUES (?, ?, ?, 'Staff', 50000, 'active', NOW(), NOW())",
          [testEmployeeUserId, testCompId, testEmployerId]
        );
        testEmployeeId = eeRes.insertId;

        // Create subscription for this test company
        const [subRes] = await db.query(
          "INSERT INTO subscriptions (employer_id, plan_id, start_date, end_date, status, auto_renew, created_at, updated_at) VALUES (?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'active', 1, NOW(), NOW())",
          [testEmployerId]
        );
        testSubId = subRes.insertId;

        // 2. Execute deleteAccount with wrong password -> should be rejected
        let wrongPwStatus = null;
        let wrongPwJson = null;
        const failReq = {
          user: { id: testEmpUserId, role: 'employer', company_id: testCompId },
          body: { password: 'wrongPassword!' }
        };
        const failRes = {
          status(code) { wrongPwStatus = code; return this; },
          json(data) { wrongPwJson = data; return this; }
        };

        await profileController.deleteAccount(failReq, failRes, () => {});
        assert.strictEqual(wrongPwStatus, 400, 'Must reject deletion with incorrect password');
        assert.ok(wrongPwJson.message.includes('Incorrect password'));

        // 3. Execute deleteAccount with valid password
        let successJson = null;
        const successReq = {
          user: { id: testEmpUserId, role: 'employer', company_id: testCompId },
          body: { password: 'DeleteSecret123!' },
          ip: '127.0.0.1'
        };
        const successRes = {
          status() { return this; },
          json(data) { successJson = data; return this; }
        };

        await profileController.deleteAccount(successReq, successRes, () => {});
        assert.ok(successJson);
        assert.strictEqual(successJson.success, true);
        assert.ok(successJson.message.includes('statutory financial, invoice, and tax records are retained'));

        // 4. Verify in pop_db:
        // Company status = inactive
        const [compCheck] = await db.query('SELECT status FROM companies WHERE id = ?', [testCompId]);
        assert.strictEqual(compCheck[0].status, 'inactive');

        // Subscription cancelled
        const [subCheck] = await db.query('SELECT status FROM subscriptions WHERE id = ?', [testSubId]);
        assert.strictEqual(subCheck[0].status, 'cancelled');

        // Employer status = inactive
        const [empCheck] = await db.query('SELECT status FROM employers WHERE id = ?', [testEmployerId]);
        assert.strictEqual(empCheck[0].status, 'inactive');

        // User status = deleted and PII scrubbed
        const [userCheck] = await db.query('SELECT name, email, phone, status FROM users WHERE id = ?', [testEmpUserId]);
        assert.strictEqual(userCheck[0].status, 'deleted');
        assert.strictEqual(userCheck[0].name, 'Deactivated User');
        assert.ok(userCheck[0].email.includes('@deactivated.local'));
        assert.strictEqual(userCheck[0].phone, null);

        // Audit log entry created
        const [auditCheck] = await db.query("SELECT * FROM audit_logs WHERE user_id = ? AND action = 'ACCOUNT_DELETED'", [testEmpUserId]);
        assert.strictEqual(auditCheck.length, 1);
        assert.ok(auditCheck[0].details.includes('Statutory financial records retained'));
      } finally {
        // Clean up test records completely to preserve pop_db baseline
        if (testEmpUserId || testEmployeeUserId) {
          await db.query('DELETE FROM audit_logs WHERE user_id IN (?, ?)', [testEmpUserId || 0, testEmployeeUserId || 0]);
        }
        if (testSubId) {
          await db.query('DELETE FROM subscriptions WHERE id = ?', [testSubId]);
        }
        if (testEmployeeId) {
          await db.query('DELETE FROM employees WHERE id = ?', [testEmployeeId]);
        }
        if (testEmployerId) {
          await db.query('DELETE FROM employers WHERE id = ?', [testEmployerId]);
        }
        if (testEmpUserId || testEmployeeUserId) {
          await db.query('DELETE FROM users WHERE id IN (?, ?)', [testEmpUserId || 0, testEmployeeUserId || 0]);
        }
        if (testCompId) {
          await db.query('DELETE FROM companies WHERE id = ?', [testCompId]);
        }
      }
    });

    it('Employee account deletion only deactivates employee and personal user, leaving company intact', async () => {
      const hashedPassword = await bcrypt.hash('EmpDelete123!', 10);
      let singleCompId = null;
      let singleUserId = null;
      let singleEmpId = null;

      try {
        // Create company and employee
        const [compRes] = await db.query(
          "INSERT INTO companies (company_name, subscription_plan, status, created_at, updated_at) VALUES ('Employee Isolation Corp', 'Starter Plan', 'active', NOW(), NOW())"
        );
        singleCompId = compRes.insertId;

        const [eeUserRes] = await db.query(
          "INSERT INTO users (name, email, password, role, company_id, status, created_at, updated_at) VALUES ('Solo Employee', 'solo_emp@test.com', ?, 'employee', ?, 'active', NOW(), NOW())",
          [hashedPassword, singleCompId]
        );
        singleUserId = eeUserRes.insertId;

        const [eeRes] = await db.query(
          "INSERT INTO employees (user_id, company_id, designation, salary, status, created_at, updated_at) VALUES (?, ?, 'Junior Dev', 30000, 'active', NOW(), NOW())",
          [singleUserId, singleCompId]
        );
        singleEmpId = eeRes.insertId;

        // Delete employee account
        let resJson = null;
        const req = {
          user: { id: singleUserId, role: 'employee', company_id: singleCompId },
          body: { password: 'EmpDelete123!' },
          ip: '127.0.0.1'
        };
        const res = {
          status() { return this; },
          json(data) { resJson = data; return this; }
        };

        await profileController.deleteAccount(req, res, () => {});
        assert.ok(resJson);
        assert.strictEqual(resJson.success, true);
        assert.ok(resJson.message.includes('personal account has been deleted'));

        // Verify company is STILL active!
        const [compCheck] = await db.query('SELECT status FROM companies WHERE id = ?', [singleCompId]);
        assert.strictEqual(compCheck[0].status, 'active', 'Company must remain active when an employee deletes their account');

        // Verify employee record is inactive
        const [empCheck] = await db.query('SELECT status FROM employees WHERE id = ?', [singleEmpId]);
        assert.strictEqual(empCheck[0].status, 'inactive');
      } finally {
        // Clean up test records
        if (singleUserId) {
          await db.query('DELETE FROM audit_logs WHERE user_id = ?', [singleUserId]);
        }
        if (singleEmpId) {
          await db.query('DELETE FROM employees WHERE id = ?', [singleEmpId]);
        }
        if (singleUserId) {
          await db.query('DELETE FROM users WHERE id = ?', [singleUserId]);
        }
        if (singleCompId) {
          await db.query('DELETE FROM companies WHERE id = ?', [singleCompId]);
        }
      }
    });
  });

  // =========================================================================
  // 4. Baseline Integrity Post-Test Check
  // =========================================================================
  describe('4. Strict Baseline Preservation Post-Test', () => {
    it('pop_db baseline must remain exactly 12 users, 2 employers, 1 company, 2 subscriptions', async () => {
      const [users] = await db.query('SELECT count(*) as c FROM users');
      assert.strictEqual(users[0].c, 12, 'pop_db must have exactly 12 users');

      const [employers] = await db.query('SELECT count(*) as c FROM employers');
      assert.strictEqual(employers[0].c, 2, 'pop_db must have exactly 2 employers');

      const [companies] = await db.query('SELECT count(*) as c FROM companies');
      assert.strictEqual(companies[0].c, 1, 'pop_db must have exactly 1 company');

      const [subs] = await db.query('SELECT count(*) as c FROM subscriptions');
      assert.strictEqual(subs[0].c, 2, 'pop_db must have exactly 2 subscriptions');
    });
  });
});

