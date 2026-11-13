const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Setup environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_automated_testing_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_automated_testing_654321';
process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.kiaan.payroll';

const db = require('../src/config/mysql');
const googlePlayService = require('../src/services/googlePlay.service');
const googlePlayController = require('../src/controllers/googlePlay.controller');

describe('Kiaan PayrollPlus Phase 3 Integration Verification Suite', () => {

  after(async () => {
    try {
      if (db && typeof db.end === 'function') {
        await db.end();
      }
    } catch {}
  });

  // =========================================================================
  // 1. Local Database Engine & Option B Catalog Integrity
  // =========================================================================
  describe('1. pop_db Engine & Subscription Catalog Verification', () => {
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

    it('pop_db.plans must contain canonical Option B subscription plans with correct limits and pricing', async () => {
      const [plans] = await db.query('SELECT * FROM plans ORDER BY id ASC');
      assert.strictEqual(plans.length, 5, `Expected 5 subscription plans in plans table, found ${plans.length}`);

      // Plan 1: Starter Plan
      const starter = plans.find(p => p.id === 1);
      assert.ok(starter, 'Plan 1 must exist');
      assert.ok(starter.name.includes('Starter'), 'Plan 1 name must be Starter');
      assert.strictEqual(Number(starter.price), 700.00);
      assert.strictEqual(Number(starter.max_employees), 15);
      assert.strictEqual(Number(starter.duration_months), 1);

      // Plan 2: Professional Plan
      const pro = plans.find(p => p.id === 2);
      assert.ok(pro, 'Plan 2 must exist');
      assert.ok(pro.name.includes('Professional'), 'Plan 2 name must be Professional');
      assert.strictEqual(Number(pro.price), 900.00);
      assert.strictEqual(Number(pro.max_employees), 50);
      assert.strictEqual(Number(pro.duration_months), 1);

      // Plan 3: Premium Plan
      const premium = plans.find(p => p.id === 3);
      assert.ok(premium, 'Plan 3 must exist');
      assert.ok(premium.name.includes('Premium'), 'Plan 3 name must be Premium');
      assert.strictEqual(Number(premium.price), 1200.00);
      assert.strictEqual(Number(premium.max_employees), 100);
      assert.strictEqual(Number(premium.duration_months), 1);

      // Plan 4: Free Trial
      const trial = plans.find(p => p.id === 4);
      assert.ok(trial, 'Plan 4 must exist');
      assert.ok(trial.name.includes('Free Trial'), 'Plan 4 name must be Free Trial');
      assert.strictEqual(Number(trial.price), 0.00);
      assert.strictEqual(Number(trial.max_employees), 10);
      assert.strictEqual(Number(trial.duration_days), 7);

      // Plan 5: Enterprise Plan
      const enterprise = plans.find(p => p.id === 5);
      assert.ok(enterprise, 'Plan 5 must exist');
      assert.ok(enterprise.name.includes('Enterprise'), 'Plan 5 name must be Enterprise');
    });

    it('existing customer subscriptions #1 and #2 must be preserved with end_date 2027-10-28', async () => {
      const [subs] = await db.query("SELECT id, plan_id, status, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date_str FROM subscriptions WHERE id IN (1, 2) ORDER BY id ASC");
      assert.strictEqual(subs.length, 2, 'Subscriptions #1 and #2 must exist');

      for (const s of subs) {
        assert.strictEqual(s.plan_id, 2, `Subscription #${s.id} must remain Plan 2`);
        assert.strictEqual(s.status, 'active', `Subscription #${s.id} must be active`);
        assert.strictEqual(s.end_date_str, '2027-10-28', `Subscription #${s.id} end_date must be preserved as 2027-10-28`);
      }
    });

    it('must have zero orphaned records in pop_db baseline', async () => {
      const [orphanedSubs] = await db.query(`
        SELECT s.id FROM subscriptions s
        LEFT JOIN employers e ON s.employer_id = e.id
        WHERE e.id IS NULL
      `);
      assert.strictEqual(orphanedSubs.length, 0, 'No orphaned subscriptions allowed');

      const [orphanedEmployers] = await db.query(`
        SELECT e.id FROM employers e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE u.id IS NULL
      `);
      assert.strictEqual(orphanedEmployers.length, 0, 'No orphaned employers allowed');
    });
  });

  // =========================================================================
  // 2. Google Play Backend Service & Plan Mappings
  // =========================================================================
  describe('2. Google Play Backend Mappings & Security Constraints', () => {
    it('Option B Google Play product IDs must map exactly to canonical plans', () => {
      const starter = googlePlayService.getPlanConfig('payroll_plan_starter');
      assert.strictEqual(starter.plan_id, 1);
      assert.strictEqual(starter.max_employees, 15);
      assert.strictEqual(starter.price, 700.00);

      const pro = googlePlayService.getPlanConfig('payroll_plan_pro');
      assert.strictEqual(pro.plan_id, 2);
      assert.strictEqual(pro.max_employees, 50);
      assert.strictEqual(pro.price, 900.00);

      const premium = googlePlayService.getPlanConfig('payroll_plan_premium');
      assert.strictEqual(premium.plan_id, 3);
      assert.strictEqual(premium.max_employees, 100);
      assert.strictEqual(premium.price, 1200.00);
    });

    it('backend must fail closed on invalid, pending, or expired purchases', async () => {
      // Missing token
      const resMissing = await googlePlayService.verifySubscriptionPurchase('');
      assert.strictEqual(resMissing.isValid, false);

      // Pending state simulation
      googlePlayService.setMockClientForTesting({
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_PENDING',
                lineItems: [{ productId: 'payroll_plan_starter', expiryTime: new Date(Date.now() + 86400000).toISOString() }]
              }
            })
          }
        }
      });
      const resPending = await googlePlayService.verifySubscriptionPurchase('mock_pending_token');
      assert.strictEqual(resPending.isValid, false);
      assert.ok(resPending.error.includes('not in active standing'));

      // Expired state simulation
      googlePlayService.setMockClientForTesting({
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                lineItems: [{ productId: 'payroll_plan_starter', expiryTime: new Date(Date.now() - 3600000).toISOString() }]
              }
            })
          }
        }
      });
      const resExpired = await googlePlayService.verifySubscriptionPurchase('mock_expired_token');
      assert.strictEqual(resExpired.isValid, false);
      assert.ok(resExpired.error.includes('already expired'));
    });
  });

  // =========================================================================
  // 3. Android GooglePlayBillingPlugin.java Source Audit
  // =========================================================================
  describe('3. Android Native Plugin Source Code Verification', () => {
    const pluginPath = path.resolve(__dirname, '../../payroll-frontend/android/app/src/main/java/com/kiaan/payroll/GooglePlayBillingPlugin.java');

    it('GooglePlayBillingPlugin.java must exist and be accessible', () => {
      assert.ok(fs.existsSync(pluginPath), `Plugin file missing at: ${pluginPath}`);
    });

    it('must implement required Capacitor methods: isAvailable, queryProductDetails, launchPurchaseFlow, acknowledgePurchase, queryPurchases', () => {
      const src = fs.readFileSync(pluginPath, 'utf8');
      assert.ok(src.includes('public void isAvailable(PluginCall call)'), 'isAvailable method missing');
      assert.ok(src.includes('public void queryProductDetails(PluginCall call)'), 'queryProductDetails method missing');
      assert.ok(src.includes('public void launchPurchaseFlow(PluginCall call)'), 'launchPurchaseFlow method missing');
      assert.ok(src.includes('public void acknowledgePurchase(PluginCall call)'), 'acknowledgePurchase method missing');
      assert.ok(src.includes('public void queryPurchases(PluginCall call)'), 'queryPurchases method missing');
    });

    it('must support subscription upgrade/downgrade replacement modes in launchPurchaseFlow', () => {
      const src = fs.readFileSync(pluginPath, 'utf8');
      assert.ok(src.includes('SubscriptionUpdateParams'), 'SubscriptionUpdateParams missing in plugin');
      assert.ok(src.includes('setOldPurchaseToken'), 'setOldPurchaseToken missing');
      assert.ok(src.includes('setSubscriptionReplacementMode'), 'setSubscriptionReplacementMode missing');
      assert.ok(src.includes('ReplacementMode.CHARGE_PRORATED_PRICE'), 'CHARGE_PRORATED_PRICE missing');
    });

    it('must identify and report pending purchases without granting access directly', () => {
      const src = fs.readFileSync(pluginPath, 'utf8');
      assert.ok(src.includes('Purchase.PurchaseState.PENDING'), 'PENDING purchase check missing');
      assert.ok(src.includes('res.put("isPending", isPending);'), 'isPending flag reporting missing');
    });

    it('must use BillingClient 9.1.0 compatible getProductDetailsList()', () => {
      const src = fs.readFileSync(pluginPath, 'utf8');
      assert.ok(src.includes('productDetailsResult.getProductDetailsList()'), 'Must use getProductDetailsList() for 9.1.0 compatibility');
    });
  });

  // =========================================================================
  // 4. Frontend Web & Native Separation & Configuration
  // =========================================================================
  describe('4. Frontend Web vs Native Separation & Navigation Verification', () => {
    it('googleBilling.js must reject pending purchases and require server verification', () => {
      const gbPath = path.resolve(__dirname, '../../payroll-frontend/src/services/googleBilling.js');
      const src = fs.readFileSync(gbPath, 'utf8');
      assert.ok(src.includes('isPending'), 'isPending handling missing in googleBilling.js');
      assert.ok(src.includes('oldPurchaseToken'), 'oldPurchaseToken support missing in googleBilling.js');
      assert.ok(src.includes('acknowledgePurchase'), 'acknowledgePurchase call missing in googleBilling.js');
    });

    it('UpgradePlan.jsx must branch cleanly between Google Play Billing (native) and Razorpay (web)', () => {
      const upPath = path.resolve(__dirname, '../../payroll-frontend/src/Dashboard/Admin/UpgradePlan.jsx');
      const src = fs.readFileSync(upPath, 'utf8');
      assert.ok(src.includes('isNativeApp()'), 'isNativeApp platform check missing in UpgradePlan.jsx');
      assert.ok(src.includes('purchasePlaySubscription'), 'purchasePlaySubscription missing in UpgradePlan.jsx');
      assert.ok(src.includes('handleInitiateRazorpay'), 'Web Razorpay trigger missing in UpgradePlan.jsx');
      assert.ok(src.includes('handleGooglePlayPurchase'), 'Native Google Play trigger missing in UpgradePlan.jsx');
      assert.ok(src.includes('google_purchase_token'), 'Upgrade token passing missing');
    });

    it('TrialExpiryModal.jsx must navigate directly to /admin/upgrade-plan or /employer/upgrade-plan without redirecting to login', () => {
      const modalPath = path.resolve(__dirname, '../../payroll-frontend/src/components/TrialExpiryModal.jsx');
      const src = fs.readFileSync(modalPath, 'utf8');
      assert.ok(src.includes('/admin/upgrade-plan'), '/admin/upgrade-plan path missing in TrialExpiryModal');
      assert.ok(src.includes('/employer/upgrade-plan'), '/employer/upgrade-plan path missing in TrialExpiryModal');
      assert.ok(src.includes('isNativeApp() || localStorage.getItem(\'token\')'), 'Platform / auth branch missing');
    });

    it('App.jsx must permit both employer and admin roles on upgrade-plan routes', () => {
      const appPath = path.resolve(__dirname, '../../payroll-frontend/src/App.jsx');
      const src = fs.readFileSync(appPath, 'utf8');
      assert.ok(src.includes("path=\"/admin/upgrade-plan\""), '/admin/upgrade-plan route missing in App.jsx');
      assert.ok(src.includes("path=\"/employer/upgrade-plan\""), '/employer/upgrade-plan route missing in App.jsx');
    });

    it('api.js must resolve to Android emulator host (10.0.2.2) or configurable API URL on native app', () => {
      const apiPath = path.resolve(__dirname, '../../payroll-frontend/src/services/api.js');
      const src = fs.readFileSync(apiPath, 'utf8');
      assert.ok(src.includes('isNativeApp()'), 'isNativeApp check missing in api.js');
      assert.ok(src.includes('10.0.2.2:5000/api/'), 'Android emulator gateway fallback missing in api.js');
    });
  });

  // =========================================================================
  // 5. End-to-End Simulation & pop_db Baseline Protection
  // =========================================================================
  describe('5. End-to-End Simulation & pop_db Baseline Protection', () => {
    let testUserId = null;
    let testEmployerId = null;
    let testSubId = null;

    it('should complete full Google Play verification and activate subscription in pop_db', async () => {
      // 1. Create temporary test employer
      const [userRes] = await db.query(
        "INSERT INTO users (name, email, password, role, status, created_at, updated_at) VALUES ('Phase3 User', 'phase3_user@kiaan.com', 'mock_hash', 'employer', 'active', NOW(), NOW())"
      );
      testUserId = userRes.insertId;

      const [empRes] = await db.query(
        "INSERT INTO employers (user_id, company_name, created_at, updated_at) VALUES (?, 'Phase3 Test Corp', NOW(), NOW())",
        [testUserId]
      );
      testEmployerId = empRes.insertId;

      // 2. Configure mock client for active Starter purchase
      const purchaseToken = 'phase3_simulated_token_' + Date.now();
      const orderId = 'GPA.3333-4444-5555-' + Date.now();
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      googlePlayService.setMockClientForTesting({
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
                lineItems: [{
                  productId: 'payroll_plan_starter',
                  expiryTime: expiryDate.toISOString()
                }],
                latestOrderId: orderId
              }
            })
          }
        }
      });

      // 3. Process subscription verification via service
      const verifyRes = await googlePlayService.verifySubscriptionPurchase(purchaseToken);
      assert.strictEqual(verifyRes.isValid, true);
      assert.strictEqual(verifyRes.productId, 'payroll_plan_starter');
      assert.strictEqual(verifyRes.planConfig.plan_id, 1);
      assert.strictEqual(verifyRes.planConfig.max_employees, 15);

      // 4. Record subscription in pop_db
      const [subRes] = await db.query(`
        INSERT INTO subscriptions (
          employer_id, plan_id, start_date, end_date, status, payment_gateway,
          google_purchase_token, google_order_id, google_product_id,
          max_employees, auto_renew, created_at, updated_at
        ) VALUES (?, ?, NOW(), ?, 'active', 'google_play', ?, ?, ?, ?, 1, NOW(), NOW())
      `, [testEmployerId, verifyRes.planConfig.plan_id, expiryDate, purchaseToken, orderId, 'payroll_plan_starter', verifyRes.planConfig.max_employees]);

      testSubId = subRes.insertId;
      assert.ok(testSubId > 0, 'Subscription must be inserted');

      // Verify subscription record in pop_db
      const [subRow] = await db.query('SELECT * FROM subscriptions WHERE id = ?', [testSubId]);
      assert.strictEqual(subRow.length, 1);
      assert.strictEqual(subRow[0].plan_id, 1);
      assert.strictEqual(subRow[0].payment_gateway, 'google_play');
      assert.strictEqual(subRow[0].max_employees, 15);
      assert.strictEqual(subRow[0].google_purchase_token, purchaseToken);
      assert.strictEqual(subRow[0].google_order_id, orderId);

      // 5. Test Upgrade Flow: upgrade from Starter (Plan 1) to Pro (Plan 2) with replacement
      const upgradeToken = 'phase3_upgrade_token_' + Date.now();
      const upgradeOrderId = 'GPA.9999-8888-7777-' + Date.now();
      const upgradeExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      googlePlayService.setMockClientForTesting({
        purchases: {
          subscriptionsv2: {
            get: async () => ({
              data: {
                packageName: 'com.kiaan.payroll',
                subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
                lineItems: [{
                  productId: 'payroll_plan_pro',
                  expiryTime: upgradeExpiry.toISOString()
                }],
                latestOrderId: upgradeOrderId
              }
            })
          }
        }
      });

      const upgradeVerify = await googlePlayService.verifySubscriptionPurchase(upgradeToken);
      assert.strictEqual(upgradeVerify.isValid, true);
      assert.strictEqual(upgradeVerify.planConfig.plan_id, 2);
      assert.strictEqual(upgradeVerify.planConfig.max_employees, 50);

      // Cancel old subscription and activate upgraded subscription
      await db.query("UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [testSubId]);
      
      const [upgSubRes] = await db.query(`
        INSERT INTO subscriptions (
          employer_id, plan_id, start_date, end_date, status, payment_gateway,
          google_purchase_token, google_order_id, google_product_id,
          max_employees, auto_renew, created_at, updated_at
        ) VALUES (?, ?, NOW(), ?, 'active', 'google_play', ?, ?, ?, ?, 1, NOW(), NOW())
      `, [testEmployerId, 2, upgradeExpiry, upgradeToken, upgradeOrderId, 'payroll_plan_pro', 50]);

      const upgradedSubId = upgSubRes.insertId;

      // Verify upgraded subscription in pop_db
      const [upgRows] = await db.query('SELECT * FROM subscriptions WHERE id = ?', [upgradedSubId]);
      assert.strictEqual(upgRows.length, 1);
      assert.strictEqual(upgRows[0].plan_id, 2);
      assert.strictEqual(upgRows[0].max_employees, 50);
      assert.strictEqual(upgRows[0].status, 'active');

      // Verify old subscription is marked cancelled
      const [oldRows] = await db.query('SELECT status FROM subscriptions WHERE id = ?', [testSubId]);
      assert.strictEqual(oldRows[0].status, 'cancelled');

      // 6. Clean up temporary test records to strictly maintain pop_db baseline
      await db.query('DELETE FROM subscriptions WHERE id IN (?, ?)', [testSubId, upgradedSubId]);
      await db.query('DELETE FROM employers WHERE id = ?', [testEmployerId]);
      await db.query('DELETE FROM users WHERE id = ?', [testUserId]);
    });

    it('pop_db baseline must remain exactly intact after test execution', async () => {
      const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
      assert.strictEqual(userCount[0].count, 12, 'pop_db must have exactly 12 baseline users');

      const [employerCount] = await db.query('SELECT COUNT(*) as count FROM employers');
      assert.strictEqual(employerCount[0].count, 2, 'pop_db must have exactly 2 baseline employers');

      const [companyCount] = await db.query('SELECT COUNT(*) as count FROM companies');
      assert.strictEqual(companyCount[0].count, 1, 'pop_db must have exactly 1 baseline company');

      const [subCount] = await db.query('SELECT COUNT(*) as count FROM subscriptions');
      assert.strictEqual(subCount[0].count, 2, 'pop_db must have exactly 2 baseline subscriptions');
    });
  });
});
