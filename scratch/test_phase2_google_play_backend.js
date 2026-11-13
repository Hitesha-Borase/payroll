process.env.NODE_ENV = 'test';
require('dotenv').config({ path: require('path').resolve(__dirname, '../payroll-backend/.env') });
const db = require('../payroll-backend/src/config/mysql');
const googlePlayService = require('../payroll-backend/src/services/googlePlay.service');
const googlePlayController = require('../payroll-backend/src/controllers/googlePlay.controller');

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runPhase2Tests() {
  console.log('======================================================================');
  console.log('   KIAAN PAYROLLPLUS - PHASE 2 GOOGLE PLAY BILLING BACKEND TESTS      ');
  console.log('======================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Tracking for controlled test cleanup
  let createdUserIds = [];
  let createdCompanyIds = [];
  let createdEmployerIds = [];
  let createdSubIds = [];
  let createdInvIds = [];
  let createdPayIds = [];
  let createdRtdnMsgIds = [];

  async function cleanup() {
    if (createdPayIds.length > 0) {
      await db.query('DELETE FROM payments WHERE id IN (?)', [createdPayIds]);
    }
    if (createdInvIds.length > 0) {
      await db.query('DELETE FROM invoices WHERE id IN (?)', [createdInvIds]);
    }
    if (createdSubIds.length > 0) {
      await db.query('DELETE FROM subscriptions WHERE id IN (?)', [createdSubIds]);
    }
    if (createdEmployerIds.length > 0) {
      await db.query('DELETE FROM employers WHERE id IN (?)', [createdEmployerIds]);
    }
    if (createdCompanyIds.length > 0) {
      await db.query('DELETE FROM companies WHERE id IN (?)', [createdCompanyIds]);
    }
    if (createdUserIds.length > 0) {
      await db.query('DELETE FROM users WHERE id IN (?)', [createdUserIds]);
    }
    if (createdRtdnMsgIds.length > 0) {
      await db.query('DELETE FROM google_rtdn_events WHERE message_id IN (?)', [createdRtdnMsgIds]);
    }
  }

  try {
    // 0. Verify connected DB is pop_db
    const [dbRows] = await db.query('SELECT DATABASE() as current_db');
    assert(dbRows[0].current_db === 'pop_db', `Connected to local database "${dbRows[0].current_db}" (must be pop_db)`);

    // Verify existing counts before test
    const [[{ count: preUsers }]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: preSubs }]] = await db.query('SELECT COUNT(*) as count FROM subscriptions');
    const [[{ count: preCompanies }]] = await db.query('SELECT COUNT(*) as count FROM companies');
    const [[{ count: preEmployers }]] = await db.query('SELECT COUNT(*) as count FROM employers');
    console.log(`Pre-test baseline: ${preUsers} users, ${preEmployers} employers, ${preCompanies} companies, ${preSubs} subscriptions.\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Diagnostic Setup Status & Fail-Closed Without Credentials
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Diagnostic Setup Status & Fail-Closed Behavior ---');
    const status = googlePlayService.getSetupStatus();
    assert(status.packageName === 'com.kiaan.payroll', `Package name is configured as com.kiaan.payroll`);
    assert(Array.isArray(status.supportedProducts), `Supported products list is returned`);
    assert(status.supportedProducts.includes('payroll_plan_starter'), `Includes payroll_plan_starter`);
    assert(status.supportedProducts.includes('payroll_plan_pro'), `Includes payroll_plan_pro`);
    assert(status.supportedProducts.includes('payroll_plan_premium'), `Includes payroll_plan_premium`);

    // Without credentials or mock, verification MUST fail closed
    googlePlayService.setMockClientForTesting(null);
    const unconfigRes = await googlePlayService.verifySubscriptionPurchase('test_token_no_creds');
    assert(unconfigRes.isValid === false, `Unconfigured service account fails closed (isValid: false)`);
    assert(unconfigRes.setupPending === true, `Reported as setupPending: true for external setup tracking\n`);

    // -------------------------------------------------------------------------
    // TEST 2: Authoritative Product Plans Catalog Endpoint (Option B)
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Authoritative Google Play Plans Catalog ---');
    const plansRes = createMockRes();
    await googlePlayController.getGooglePlayPlans({}, plansRes, (err) => { if (err) throw err; });
    assert(plansRes.statusCode === 200, `GET /api/payment/google-play/plans returns HTTP 200`);
    assert(plansRes.body?.data?.length === 3, `Returns exactly 3 Google Play subscription plans`);

    const pStarter = plansRes.body.data.find(p => p.productId === 'payroll_plan_starter');
    const pPro = plansRes.body.data.find(p => p.productId === 'payroll_plan_pro');
    const pPrem = plansRes.body.data.find(p => p.productId === 'payroll_plan_premium');

    assert(pStarter && pStarter.price === 700.00 && pStarter.max_employees === 15, `Starter Plan is ₹700 with 15 seats`);
    assert(pPro && pPro.price === 900.00 && pPro.max_employees === 50, `Professional Plan is ₹900 with 50 seats`);
    assert(pPrem && pPrem.price === 1200.00 && pPrem.max_employees === 100, `Premium Plan is ₹1,200 with 100 seats\n`);

    // -------------------------------------------------------------------------
    // TEST 3: Create Controlled Test Tenants in pop_db
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Provision Controlled Test Tenants for Purchase & Security Tests ---');
    const timestamp = Date.now();
    const [userARes] = await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES ('Tenant A Admin', ?, 'Hash123!', 'employer', 'active')",
      [`test_tenant_a_${timestamp}@example.com`]
    );
    const userAId = userARes.insertId;
    createdUserIds.push(userAId);

    const [compARes] = await db.query(
      "INSERT INTO companies (user_id, company_name, subscription_plan, status) VALUES (?, 'Tenant A Tech Pvt Ltd', 'Free Trial', 'active')",
      [userAId]
    );
    const compAId = compARes.insertId;
    createdCompanyIds.push(compAId);

    const [empARes] = await db.query(
      "INSERT INTO employers (user_id, company_id, company_name, designation, status) VALUES (?, ?, 'Tenant A Tech Pvt Ltd', 'Company Admin', 'active')",
      [userAId, compAId]
    );
    const empAId = empARes.insertId;
    createdEmployerIds.push(empAId);

    // Tenant B (for cross-tenant theft testing)
    const [userBRes] = await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES ('Tenant B Admin', ?, 'Hash123!', 'employer', 'active')",
      [`test_tenant_b_${timestamp}@example.com`]
    );
    const userBId = userBRes.insertId;
    createdUserIds.push(userBId);

    const [compBRes] = await db.query(
      "INSERT INTO companies (user_id, company_name, subscription_plan, status) VALUES (?, 'Tenant B Solutions Ltd', 'Free Trial', 'active')",
      [userBId]
    );
    const compBId = compBRes.insertId;
    createdCompanyIds.push(compBId);

    const [empBRes] = await db.query(
      "INSERT INTO employers (user_id, company_id, company_name, designation, status) VALUES (?, ?, 'Tenant B Solutions Ltd', 'Company Admin', 'active')",
      [userBId, compBId]
    );
    const empBId = empBRes.insertId;
    createdEmployerIds.push(empBId);

    assert(userAId > 0 && empAId > 0 && compAId > 0, `Tenant A created (User ${userAId}, Employer ${empAId}, Company ${compAId})`);
    assert(userBId > 0 && empBId > 0 && compBId > 0, `Tenant B created (User ${userBId}, Employer ${empBId}, Company ${compBId})\n`);

    // -------------------------------------------------------------------------
    // TEST 4: Authoritative Google Play Developer API Mock Client Setup
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Configure Authoritative API Mock Client (Test Sandbox) ---');
    const mockTokenStarter = `play_token_starter_${timestamp}`;
    const mockTokenPro = `play_token_pro_${timestamp}`;
    const mockTokenExpired = `play_token_expired_${timestamp}`;
    const mockTokenInvalidProduct = `play_token_invalid_prod_${timestamp}`;
    const mockTokenWrongPackage = `play_token_wrong_pkg_${timestamp}`;
    const mockTokenOnHold = `play_token_on_hold_${timestamp}`;

    const expiryIn30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const expiryPast = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const mockPublisher = {
      purchases: {
        subscriptionsv2: {
          get: async ({ packageName, token }) => {
            if (token === mockTokenStarter) {
              return {
                data: {
                  packageName: 'com.kiaan.payroll',
                  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                  latestOrderId: `GPA.3301-4402-5503-${timestamp}`,
                  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING_PURCHASE_TOKEN_RESERVATION',
                  lineItems: [{
                    productId: 'payroll_plan_starter',
                    expiryTime: expiryIn30Days,
                    offerDetails: { basePlanId: 'starter-monthly' }
                  }]
                }
              };
            }
            if (token === mockTokenPro) {
              return {
                data: {
                  packageName: 'com.kiaan.payroll',
                  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                  latestOrderId: `GPA.7701-8802-9903-${timestamp}`,
                  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING_PURCHASE_TOKEN_RESERVATION',
                  lineItems: [{
                    productId: 'payroll_plan_pro',
                    expiryTime: expiryIn30Days,
                    offerDetails: { basePlanId: 'pro-monthly' }
                  }]
                }
              };
            }
            if (token === mockTokenExpired) {
              return {
                data: {
                  packageName: 'com.kiaan.payroll',
                  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                  latestOrderId: `GPA.EXPIRED-${timestamp}`,
                  lineItems: [{
                    productId: 'payroll_plan_starter',
                    expiryTime: expiryPast,
                    offerDetails: { basePlanId: 'starter-monthly' }
                  }]
                }
              };
            }
            if (token === mockTokenInvalidProduct) {
              return {
                data: {
                  packageName: 'com.kiaan.payroll',
                  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                  latestOrderId: `GPA.UNKNOWN-${timestamp}`,
                  lineItems: [{
                    productId: 'unknown_hacked_plan_tier',
                    expiryTime: expiryIn30Days
                  }]
                }
              };
            }
            if (token === mockTokenWrongPackage) {
              return {
                data: {
                  packageName: 'com.other.fraudulent.app',
                  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
                  lineItems: [{
                    productId: 'payroll_plan_starter',
                    expiryTime: expiryIn30Days
                  }]
                }
              };
            }
            if (token === mockTokenOnHold) {
              return {
                data: {
                  packageName: 'com.kiaan.payroll',
                  subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD',
                  lineItems: [{
                    productId: 'payroll_plan_starter',
                    expiryTime: expiryIn30Days
                  }]
                }
              };
            }
            throw new Error('Google Play API: Purchase token not found (HTTP 404)');
          }
        },
        subscriptions: {
          acknowledge: async ({ packageName, subscriptionId, token }) => {
            return { data: {} };
          }
        }
      }
    };

    googlePlayService.setMockClientForTesting(mockPublisher);
    assert(true, `Authoritative test mock client injected into googlePlayService\n`);

    // -------------------------------------------------------------------------
    // TEST 5: Negative Tests (Client Untrusted & Fraud Rejection)
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: Negative Tests (Client Untrusted & Fraud Rejection) ---');

    // 5A. Missing purchase_token
    const req5A = { body: {}, user: { id: userAId, role: 'employer', company_id: compAId }, employer: { id: empAId, company_id: compAId } };
    const res5A = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req5A, res5A, (err) => { if (err) throw err; });
    assert(res5A.statusCode === 400, `Missing purchase_token returns HTTP 400 Bad Request`);

    // 5B. Non-existent token in Google Play API
    const req5B = { body: { purchase_token: 'fake_non_existent_token' }, user: { id: userAId, role: 'employer', company_id: compAId }, employer: { id: empAId, company_id: compAId } };
    const res5B = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req5B, res5B, (err) => { if (err) throw err; });
    assert(res5B.statusCode === 400, `Invalid token rejected with HTTP 400`);
    assert(res5B.body?.message?.includes('not found') || res5B.body?.message?.includes('failed'), `Clear failure error returned`);

    // 5C. Package name mismatch (Token from a different application)
    const req5C = { body: { purchase_token: mockTokenWrongPackage }, user: { id: userAId, role: 'employer', company_id: compAId }, employer: { id: empAId, company_id: compAId } };
    const res5C = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req5C, res5C, (err) => { if (err) throw err; });
    assert(res5C.statusCode === 400, `Package mismatch rejected with HTTP 400`);
    assert(res5C.body?.message?.includes('Package name mismatch'), `Package mismatch security alert returned`);

    // 5D. Expired token rejection
    const req5D = { body: { purchase_token: mockTokenExpired }, user: { id: userAId, role: 'employer', company_id: compAId }, employer: { id: empAId, company_id: compAId } };
    const res5D = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req5D, res5D, (err) => { if (err) throw err; });
    assert(res5D.statusCode === 400, `Expired subscription token rejected with HTTP 400`);
    assert(res5D.body?.message?.includes('already expired'), `Expired subscription error returned`);

    // 5E. Bad standing state (SUBSCRIPTION_STATE_ON_HOLD)
    const req5E = { body: { purchase_token: mockTokenOnHold }, user: { id: userAId, role: 'employer', company_id: compAId }, employer: { id: empAId, company_id: compAId } };
    const res5E = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req5E, res5E, (err) => { if (err) throw err; });
    assert(res5E.statusCode === 400, `Subscription on hold rejected with HTTP 400`);
    assert(res5E.body?.message?.includes('not in active standing'), `Non-active standing error returned`);

    // 5F. Unknown / unmapped product ID (Client attempts to invent non-existent tier)
    const req5F = { body: { purchase_token: mockTokenInvalidProduct }, user: { id: userAId, role: 'employer', company_id: compAId }, employer: { id: empAId, company_id: compAId } };
    const res5F = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req5F, res5F, (err) => { if (err) throw err; });
    assert(res5F.statusCode === 400, `Unmapped product ID rejected with HTTP 400`);
    assert(res5F.body?.message?.includes('Unrecognized Google Play product ID'), `Product validation alert returned\n`);

    // -------------------------------------------------------------------------
    // TEST 6: Successful Server-Side Verification & Option B Activation
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Successful Verification & Option B Starter Plan Activation ---');
    // Client tries to claim ₹100 price and 500 employee limit - backend MUST ignore client params and use authoritative Option B values
    const req6 = {
      body: {
        purchase_token: mockTokenStarter,
        product_id: 'payroll_plan_starter',
        claimed_price: 100, // Should be ignored! Authoritative price is ₹700
        claimed_max_employees: 500 // Should be ignored! Authoritative limit is 15
      },
      user: { id: userAId, email: `test_tenant_a_${timestamp}@example.com`, role: 'employer', company_id: compAId },
      employer: { id: empAId, company_id: compAId }
    };
    const res6 = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req6, res6, (err) => { if (err) throw err; });

    assert(res6.statusCode === 200, `Verification returned HTTP 200 OK`);
    assert(res6.body?.success === true, `Response success is true`);
    assert(res6.body?.data?.plan_id === 1, `Mapped to Option B Plan ID 1 (Starter Plan)`);
    assert(res6.body?.data?.price === 700.00, `Authoritative price is ₹700 (got ${res6.body?.data?.price})`);
    assert(res6.body?.data?.max_employees === 15, `Authoritative employee quota is 15 (got ${res6.body?.data?.max_employees})`);
    assert(res6.body?.data?.payment_gateway === 'google_play', `Payment gateway is google_play`);
    assert(res6.body?.data?.purchase_token_masked?.includes('...'), `Token is masked in response (${res6.body?.data?.purchase_token_masked})`);

    const subIdA = res6.body.data.subscription_id;
    createdSubIds.push(subIdA);

    // Verify pop_db records created for Test 6
    const [subRows] = await db.query('SELECT * FROM subscriptions WHERE id = ?', [subIdA]);
    assert(subRows.length === 1, `Subscription record exists in pop_db.subscriptions`);
    assert(subRows[0].employer_id === empAId, `Subscription correctly linked to employer ${empAId}`);
    assert(subRows[0].plan_id === 1, `Subscription plan_id is 1`);
    assert(subRows[0].max_employees === 15, `Max employees snapshot is 15`);
    assert(subRows[0].payment_gateway === 'google_play', `Payment gateway is google_play`);
    assert(subRows[0].google_product_id === 'payroll_plan_starter', `Google product ID recorded`);
    assert(subRows[0].google_purchase_token === mockTokenStarter, `Full Google purchase token saved`);
    assert(subRows[0].auto_renew === 1, `Auto-renew is enabled (1)`);
    assert(subRows[0].status === 'active', `Subscription status is active`);

    // Verify invoice creation in pop_db
    const [invRows] = await db.query('SELECT * FROM invoices WHERE subscription_id = ?', [subIdA]);
    assert(invRows.length === 1, `Invoice record created in pop_db.invoices`);
    assert(Number(invRows[0].total_amount) === 700.00, `Invoice total amount is ₹700.00`);
    assert(invRows[0].status === 'paid', `Invoice status is paid`);
    createdInvIds.push(invRows[0].id);

    // Verify payment record in pop_db
    const [payRows] = await db.query('SELECT * FROM payments WHERE invoice_id = ?', [invRows[0].id]);
    assert(payRows.length === 1, `Payment record created in pop_db.payments`);
    assert(Number(payRows[0].amount) === 700.00, `Payment amount is ₹700.00`);
    assert(payRows[0].payment_method === 'Google Play', `Payment method is Google Play`);
    assert(!payRows[0].notes.includes(mockTokenStarter), `Raw purchase token NOT leaked in payment notes (masked correctly)`);
    createdPayIds.push(payRows[0].id);

    // Verify employer & company status updated in pop_db
    const [compAUpdated] = await db.query('SELECT status, subscription_plan FROM companies WHERE id = ?', [compAId]);
    assert(compAUpdated[0].status === 'active', `Company status updated to active`);
    assert(compAUpdated[0].subscription_plan === 'Starter Plan', `Company subscription_plan updated to Starter Plan\n`);

    // -------------------------------------------------------------------------
    // TEST 7: Security - Cross-Account Theft & Replay Protection
    // -------------------------------------------------------------------------
    console.log('--- TEST 7: Security - Cross-Account Theft & Replay Protection ---');
    // Tenant B attempts to claim the purchase token already owned by Tenant A
    const req7Theft = {
      body: {
        purchase_token: mockTokenStarter, // Tenant A's token!
        product_id: 'payroll_plan_starter'
      },
      user: { id: userBId, email: `test_tenant_b_${timestamp}@example.com`, role: 'employer', company_id: compBId },
      employer: { id: empBId, company_id: compBId }
    };
    const res7Theft = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req7Theft, res7Theft, (err) => { if (err) throw err; });

    assert(res7Theft.statusCode === 409, `Cross-account token replay returns HTTP 409 Conflict (got ${res7Theft.statusCode})`);
    assert(res7Theft.body?.message?.includes('already tied to a different account'), `Security alert returned`);

    // Verify Tenant B has NOT gained any active subscription
    const [bSubs] = await db.query('SELECT * FROM subscriptions WHERE employer_id = ?', [empBId]);
    assert(bSubs.length === 0, `Tenant B has zero subscriptions in pop_db (unauthorized activation blocked)`);

    // 7B. Idempotent Re-Submission by Same Tenant (Tenant A resubmits their own active token)
    const req7Idempotent = {
      body: {
        purchase_token: mockTokenStarter,
        product_id: 'payroll_plan_starter'
      },
      user: { id: userAId, email: `test_tenant_a_${timestamp}@example.com`, role: 'employer', company_id: compAId },
      employer: { id: empAId, company_id: compAId }
    };
    const res7Idempotent = createMockRes();
    await googlePlayController.verifyGooglePlayPurchase(req7Idempotent, res7Idempotent, (err) => { if (err) throw err; });

    assert(res7Idempotent.statusCode === 200, `Idempotent resubmission returns HTTP 200 OK`);
    assert(res7Idempotent.body?.data?.already_active === true, `Response indicates subscription is already_active`);

    // Verify no duplicate subscriptions were created for Tenant A
    const [aSubsCount] = await db.query('SELECT COUNT(*) as count FROM subscriptions WHERE employer_id = ?', [empAId]);
    assert(aSubsCount[0].count === 1, `No duplicate subscriptions created (exactly 1 active subscription for Tenant A)\n`);

    // -------------------------------------------------------------------------
    // TEST 8: Full Subscription Lifecycle via Pub/Sub RTDN Webhook
    // -------------------------------------------------------------------------
    console.log('--- TEST 8: Real-Time Developer Notifications (RTDN) Lifecycle ---');

    function createPubSubReq(notificationType, token, eventTimeMillis, msgId) {
      const payload = {
        version: '1.0',
        packageName: 'com.kiaan.payroll',
        eventTimeMillis: String(eventTimeMillis),
        subscriptionNotification: {
          version: '1.0',
          notificationType,
          purchaseToken: token,
          subscriptionId: 'payroll_plan_starter'
        }
      };
      return {
        body: {
          message: {
            messageId: msgId,
            publishTime: new Date(eventTimeMillis).toISOString(),
            data: Buffer.from(JSON.stringify(payload)).toString('base64')
          }
        }
      };
    }

    // 8A. Lifecycle: Cancellation of Auto-Renew (Type 3)
    console.log('  -> Lifecycle Event 3: SUBSCRIPTION_CANCELED (Auto-renew turned off)');
    const msgId3 = `msg_rtdn_cancel_${timestamp}`;
    createdRtdnMsgIds.push(msgId3);
    const req8A = createPubSubReq(3, mockTokenStarter, timestamp + 1000, msgId3);
    const res8A = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8A, res8A, (err) => { if (err) throw err; });

    assert(res8A.statusCode === 200, `RTDN Canceled event acknowledged with HTTP 200`);
    const [sub8A] = await db.query('SELECT auto_renew, status, google_subscription_state FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8A[0].auto_renew === 0, `Auto-renew updated to 0 (disabled)`);
    assert(sub8A[0].status === 'active', `Subscription status REMAINS ACTIVE until end_date (entitlement preserved)`);
    assert(sub8A[0].google_subscription_state === 'SUBSCRIPTION_STATE_CANCELED', `Google subscription state is SUBSCRIPTION_STATE_CANCELED`);

    // 8B. Lifecycle: Reactivation / Restart (Type 7)
    console.log('  -> Lifecycle Event 7: SUBSCRIPTION_RESTARTED (Reactivation before expiry)');
    const msgId7 = `msg_rtdn_restart_${timestamp}`;
    createdRtdnMsgIds.push(msgId7);
    const req8B = createPubSubReq(7, mockTokenStarter, timestamp + 2000, msgId7);
    const res8B = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8B, res8B, (err) => { if (err) throw err; });

    assert(res8B.statusCode === 200, `RTDN Restarted event acknowledged with HTTP 200`);
    const [sub8B] = await db.query('SELECT auto_renew, status, google_subscription_state FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8B[0].auto_renew === 1, `Auto-renew restored to 1 (active)`);
    assert(sub8B[0].status === 'active', `Status is active`);

    // 8C. Lifecycle: In Grace Period (Type 6)
    console.log('  -> Lifecycle Event 6: SUBSCRIPTION_IN_GRACE_PERIOD (Grace period preservation)');
    const msgId6 = `msg_rtdn_grace_${timestamp}`;
    createdRtdnMsgIds.push(msgId6);
    const req8C = createPubSubReq(6, mockTokenStarter, timestamp + 3000, msgId6);
    const res8C = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8C, res8C, (err) => { if (err) throw err; });

    assert(res8C.statusCode === 200, `RTDN Grace Period acknowledged with HTTP 200`);
    const [sub8C] = await db.query('SELECT status, google_subscription_state FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8C[0].status === 'active', `Subscription remains active during grace period`);
    assert(sub8C[0].google_subscription_state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', `Google state is SUBSCRIPTION_STATE_IN_GRACE_PERIOD`);

    // 8D. Lifecycle: Account Hold (Type 5)
    console.log('  -> Lifecycle Event 5: SUBSCRIPTION_ON_HOLD (Payment failed; suspend access)');
    const msgId5 = `msg_rtdn_hold_${timestamp}`;
    createdRtdnMsgIds.push(msgId5);
    const req8D = createPubSubReq(5, mockTokenStarter, timestamp + 4000, msgId5);
    const res8D = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8D, res8D, (err) => { if (err) throw err; });

    assert(res8D.statusCode === 200, `RTDN On Hold acknowledged with HTTP 200`);
    const [sub8D] = await db.query('SELECT status, google_subscription_state FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8D[0].status === 'on_hold', `Subscription status changed to on_hold`);

    // 8E. Lifecycle: Recovered (Type 1)
    console.log('  -> Lifecycle Event 1: SUBSCRIPTION_RECOVERED (Payment recovered)');
    const msgId1 = `msg_rtdn_recovered_${timestamp}`;
    createdRtdnMsgIds.push(msgId1);
    const req8E = createPubSubReq(1, mockTokenStarter, timestamp + 5000, msgId1);
    const res8E = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8E, res8E, (err) => { if (err) throw err; });

    assert(res8E.statusCode === 200, `RTDN Recovered acknowledged with HTTP 200`);
    const [sub8E] = await db.query('SELECT status, google_subscription_state FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8E[0].status === 'active', `Subscription restored to active`);

    // 8F. Lifecycle: Renewal (Type 2)
    console.log('  -> Lifecycle Event 2: SUBSCRIPTION_RENEWED (Authoritative monthly renewal)');
    const msgId2 = `msg_rtdn_renew_${timestamp}`;
    createdRtdnMsgIds.push(msgId2);
    const req8F = createPubSubReq(2, mockTokenStarter, timestamp + 6000, msgId2);
    const res8F = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8F, res8F, (err) => { if (err) throw err; });

    assert(res8F.statusCode === 200, `RTDN Renewed acknowledged with HTTP 200`);
    const [sub8F] = await db.query('SELECT status, auto_renew, end_date FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8F[0].status === 'active', `Renewed subscription status is active`);
    assert(sub8F[0].auto_renew === 1, `Renewed subscription auto_renew is 1`);

    // 8G. Lifecycle: Immediate Revocation / Refund (Type 12)
    console.log('  -> Lifecycle Event 12: SUBSCRIPTION_REVOKED (Refund/chargeback revocation)');
    const msgId12 = `msg_rtdn_revoked_${timestamp}`;
    createdRtdnMsgIds.push(msgId12);
    const req8G = createPubSubReq(12, mockTokenStarter, timestamp + 7000, msgId12);
    const res8G = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8G, res8G, (err) => { if (err) throw err; });

    assert(res8G.statusCode === 200, `RTDN Revoked acknowledged with HTTP 200`);
    const [sub8G] = await db.query('SELECT status, google_subscription_state FROM subscriptions WHERE id = ?', [subIdA]);
    assert(sub8G[0].status === 'expired', `Revoked subscription immediately marked expired`);
    assert(sub8G[0].google_subscription_state === 'SUBSCRIPTION_STATE_REVOKED', `Google state marked SUBSCRIPTION_STATE_REVOKED`);

    // 8H. Out-of-Order Stale Event Protection
    console.log('  -> Out-Of-Order Event Rejection: Stale event (older timestamp) arrives');
    const msgIdStale = `msg_rtdn_stale_${timestamp}`;
    createdRtdnMsgIds.push(msgIdStale);
    // Send timestamp from earlier (e.g. timestamp + 500), which is older than recorded event time (timestamp + 7000)
    const req8H = createPubSubReq(2, mockTokenStarter, timestamp + 500, msgIdStale);
    const res8H = createMockRes();
    await googlePlayController.handleGooglePlayRTDN(req8H, res8H, (err) => { if (err) throw err; });

    assert(res8H.statusCode === 200, `Stale event safely acknowledged without throwing error`);
    const [rtdnStaleRow] = await db.query('SELECT status FROM google_rtdn_events WHERE message_id = ?', [msgIdStale]);
    assert(rtdnStaleRow[0].status === 'skipped_stale', `Stale notification logged as skipped_stale`);

    // Confirm subscription state was NOT reverted by the stale renewal event
    const [subAfterStale] = await db.query('SELECT status FROM subscriptions WHERE id = ?', [subIdA]);
    assert(subAfterStale[0].status === 'expired', `Subscription status preserved as expired (no stale regression)\n`);

    // -------------------------------------------------------------------------
    // TEST 9: Controlled Cleanup of Temporary Test Records in pop_db
    // -------------------------------------------------------------------------
    console.log('--- TEST 9: Controlled Cleanup of Temporary Records in pop_db ---');
    await cleanup();
    console.log('   All temporary test records cleaned up from pop_db.\n');

    // -------------------------------------------------------------------------
    // TEST 10: Baseline Integrity Assertion Post-Cleanup
    // -------------------------------------------------------------------------
    console.log('--- TEST 10: Baseline Customer Integrity Verification ---');
    const [[{ count: postUsers }]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: postSubs }]] = await db.query('SELECT COUNT(*) as count FROM subscriptions');
    const [[{ count: postCompanies }]] = await db.query('SELECT COUNT(*) as count FROM companies');
    const [[{ count: postEmployers }]] = await db.query('SELECT COUNT(*) as count FROM employers');

    assert(postUsers === preUsers, `User count returned to baseline: ${postUsers} == ${preUsers}`);
    assert(postSubs === preSubs, `Subscription count returned to baseline: ${postSubs} == ${preSubs}`);
    assert(postCompanies === preCompanies, `Company count returned to baseline: ${postCompanies} == ${preCompanies}`);
    assert(postEmployers === preEmployers, `Employer count returned to baseline: ${postEmployers} == ${preEmployers}`);

    // Verify existing subscriptions 1 and 2 are 100% untouched
    const [preservedSubs] = await db.query(
      `SELECT id, employer_id, plan_id, 
              DATE_FORMAT(start_date, '%Y-%m-%d') as start_date_str, 
              DATE_FORMAT(end_date, '%Y-%m-%d') as end_date_str, 
              status, auto_renew, payment_gateway 
       FROM subscriptions WHERE id IN (1, 2)`
    );
    assert(preservedSubs.length === 2, `Original subscriptions 1 and 2 exist`);
    assert(preservedSubs[0].end_date_str === '2027-10-28', `Sub 1 end_date preserved (2027-10-28)`);
    assert(preservedSubs[0].plan_id === 2, `Sub 1 plan_id preserved (2 - Professional Plan)`);
    assert(preservedSubs[0].status === 'active', `Sub 1 status is active`);
    assert(preservedSubs[1].end_date_str === '2027-10-28', `Sub 2 end_date preserved (2027-10-28)`);
    assert(preservedSubs[1].plan_id === 2, `Sub 2 plan_id preserved (2 - Professional Plan)`);
    assert(preservedSubs[1].status === 'active', `Sub 2 status is active`);

    console.log('\n======================================================================');
    console.log(`   PHASE 2 TESTS COMPLETED: ${passedTests}/${totalTests} (100% SUCCESS)`);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('Phase 2 test execution failed:', err);
    try {
      await cleanup();
      console.log('Emergency cleanup of test records completed.');
    } catch (cleanErr) {
      console.error('Error during emergency cleanup:', cleanErr);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPhase2Tests();

