require('dotenv').config({ path: require('path').resolve(__dirname, '../payroll-backend/.env') });
const db = require('../payroll-backend/src/config/mysql');
const authController = require('../payroll-backend/src/controllers/auth.controller');
const paymentController = require('../payroll-backend/src/controllers/payment.controller');
const { checkEmployeeLimit } = require('../payroll-backend/src/middlewares/planLimits.middleware');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runPhase1DTests() {
  console.log('===============================================================');
  console.log('   KIAAN PAYROLLPLUS - PHASE 1D LOCAL POP_DB INTEGRATION TEST  ');
  console.log('===============================================================\n');

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

  const testEmailA = `test_trial_emp_${Date.now()}@example.com`;
  const testEmailB = `test_company_trial_${Date.now()}@example.com`;
  let createdUserIds = [];
  let createdCompanyIds = [];
  let createdEmployerIds = [];
  let createdSubIds = [];

  async function cleanup() {
    if (createdSubIds.length > 0) {
      await db.query(`DELETE FROM subscriptions WHERE id IN (?)`, [createdSubIds]);
    }
    if (createdEmployerIds.length > 0) {
      await db.query(`DELETE FROM employers WHERE id IN (?)`, [createdEmployerIds]);
    }
    if (createdCompanyIds.length > 0) {
      await db.query(`DELETE FROM companies WHERE id IN (?)`, [createdCompanyIds]);
    }
    if (createdUserIds.length > 0) {
      await db.query(`DELETE FROM admins WHERE user_id IN (?)`, [createdUserIds]);
      await db.query(`DELETE FROM audit_logs WHERE user_id IN (?)`, [createdUserIds]);
      await db.query(`DELETE FROM users WHERE id IN (?)`, [createdUserIds]);
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
    // TEST 1: Standard Employer Registration (auth.controller.register)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Standard Employer Registration (Free Trial) ---');
    const req1 = {
      body: {
        name: 'Phase 1D Test Employer',
        email: testEmailA,
        password: 'Password123!',
        phone: '9876543210',
        company_name: 'Phase 1D Innovations Ltd',
        role: 'employer'
      },
      ip: '127.0.0.1'
    };
    const res1 = createMockRes();
    await authController.register(req1, res1, (err) => { if (err) throw err; });

    assert(res1.statusCode === 201, `Registration returned HTTP 201 Created (got ${res1.statusCode})`);
    assert(res1.body?.success === true, `Registration response success is true`);
    assert(res1.body?.data?.accessToken, `Access token returned`);
    assert(res1.body?.data?.user?.email === testEmailA, `Returned user email matches registration`);
    assert(res1.body?.data?.user?.company_id, `User company_id is populated (${res1.body?.data?.user?.company_id})`);

    const newUserId = res1.body.data.user.id;
    const newCompanyId = res1.body.data.user.company_id;
    createdUserIds.push(newUserId);
    createdCompanyIds.push(newCompanyId);

    // Verify database state for Test 1
    const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [newUserId]);
    assert(uRows.length === 1, `User record exists in pop_db.users`);
    assert(uRows[0].phone === '9876543210', `User phone is saved in pop_db.users`);
    assert(uRows[0].company_id === newCompanyId, `User company_id matches assigned company`);

    const [cRows] = await db.query('SELECT * FROM companies WHERE id = ?', [newCompanyId]);
    assert(cRows.length === 1, `Company record created in pop_db.companies`);
    assert(cRows[0].company_name === 'Phase 1D Innovations Ltd', `Company name is correct`);
    assert(cRows[0].subscription_plan === 'Free Trial', `Company subscription_plan is Free Trial`);

    const [eRows] = await db.query('SELECT * FROM employers WHERE user_id = ?', [newUserId]);
    assert(eRows.length === 1, `Employer profile created in pop_db.employers`);
    assert(eRows[0].company_id === newCompanyId, `Employer company_id linked properly`);
    const newEmployerId = eRows[0].id;
    createdEmployerIds.push(newEmployerId);

    // Verify Free Trial Subscription
    const [subRows] = await db.query(
      `SELECT s.*, p.name as plan_name, p.price as plan_price,
              DATEDIFF(s.end_date, s.start_date) as duration_diff
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.employer_id = ?`,
      [newEmployerId]
    );
    assert(subRows.length === 1, `Subscription created in pop_db.subscriptions`);
    const sub = subRows[0];
    createdSubIds.push(sub.id);
    assert(sub.plan_id === 4, `Subscription plan_id is 4 (Free Trial) (got ${sub.plan_id})`);
    assert(sub.plan_name === 'Free Trial', `Plan name is Free Trial`);
    assert(parseFloat(sub.plan_price) === 0, `Plan price is ₹0.00`);
    assert(sub.max_employees === 10, `Max employees quota is 10 (got ${sub.max_employees})`);
    assert(sub.status === 'active', `Subscription status is active`);
    assert(sub.auto_renew === 0, `Auto-renew is disabled (0) for Free Trial`);
    assert(sub.duration_diff === 7, `Duration DATEDIFF(end_date, start_date) is EXACTLY 7 DAYS (got ${sub.duration_diff})`);
    console.log(`   -> Start Date: ${sub.start_date.toISOString().split('T')[0]} | End Date: ${sub.end_date.toISOString().split('T')[0]} | Duration: ${sub.duration_diff} days\n`);

    // -------------------------------------------------------------------------
    // TEST 2: Successful Login with the New Account
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Login with New Free Trial Account ---');
    const req2 = {
      body: {
        email: testEmailA,
        password: 'Password123!'
      },
      ip: '127.0.0.1'
    };
    const res2 = createMockRes();
    await authController.login(req2, res2, (err) => { if (err) throw err; });

    assert(res2.statusCode === 200, `Login returned HTTP 200 OK`);
    assert(res2.body?.data?.user?.company_id === newCompanyId, `Login returns resolved company_id: ${newCompanyId}`);
    assert(res2.body?.data?.user?.role === 'employer', `Login returns correct employer role`);
    assert(res2.body?.data?.accessToken, `Access token generated successfully on login\n`);

    // -------------------------------------------------------------------------
    // TEST 3: Employee Limit Middleware Check for Trial Account
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Employee Limit Middleware Quota Enforcement ---');
    const req3 = {
      user: { id: newUserId, company_id: newCompanyId, role: 'employer' },
      employer: { id: newEmployerId }
    };
    const res3 = createMockRes();
    let middlewarePassed = false;
    await checkEmployeeLimit(req3, res3, () => {
      middlewarePassed = true;
    });
    assert(middlewarePassed === true, `Employee limit middleware passes through when under quota`);

    // Verify limit resolution query directly
    const [quotaRows] = await db.query(
      `SELECT c.company_name, c.subscription_plan, COALESCE(s.max_employees, p.max_employees) AS max_employees
       FROM companies c
       LEFT JOIN employers e ON e.company_id = c.id
       LEFT JOIN subscriptions s ON s.employer_id = e.id AND s.status = 'active'
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE c.id = ?
       ORDER BY s.id DESC LIMIT 1`,
      [newCompanyId]
    );
    assert(quotaRows.length === 1, `Quota query resolves for newly registered company`);
    assert(quotaRows[0].max_employees === 10, `Resolved active employee quota is 10 for Free Trial (got ${quotaRows[0].max_employees})\n`);

    // -------------------------------------------------------------------------
    // TEST 4: Duplicate Email Rejection
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Duplicate Email Handling ---');
    const req4 = {
      body: {
        name: 'Duplicate User',
        email: testEmailA,
        password: 'Password123!',
        company_name: 'Duplicate Corp',
        role: 'employer'
      },
      ip: '127.0.0.1'
    };
    const res4 = createMockRes();
    await authController.register(req4, res4, (err) => { if (err) throw err; });
    assert(res4.statusCode === 409, `Duplicate email registration returns HTTP 409 Conflict (got ${res4.statusCode})`);
    assert(res4.body?.success === false, `Duplicate email response success is false\n`);

    // -------------------------------------------------------------------------
    // TEST 5: Forbidden Administrative Role Rejection
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: Security - Forbidden Role Rejection ---');
    const req5 = {
      body: {
        name: 'Hacker Attempt',
        email: `hacker_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'superadmin'
      },
      ip: '127.0.0.1'
    };
    const res5 = createMockRes();
    await authController.register(req5, res5, (err) => { if (err) throw err; });
    assert(res5.statusCode === 400, `Public registration of 'superadmin' returns HTTP 400 Bad Request`);
    assert(res5.body?.message?.includes('cannot create administrative roles'), `Security alert message returned\n`);

    // -------------------------------------------------------------------------
    // TEST 6: Company Registration via verifyAndRegister (Plan ID 4)
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Company Registration via verifyAndRegister (Free Trial) ---');
    const req6 = {
      body: {
        name: 'Company Admin B',
        email: testEmailB,
        password: 'Password123!',
        company_name: 'Phase 1D Beta Technologies',
        phone: '9123456780',
        plan_id: 4 // Option B Free Trial Plan
      },
      ip: '127.0.0.1'
    };
    const res6 = createMockRes();
    await paymentController.verifyAndRegister(req6, res6, (err) => { if (err) throw err; });

    assert(res6.statusCode === 201 || res6.statusCode === 200, `verifyAndRegister for Free Trial returns HTTP 201 Created (got ${res6.statusCode})`);
    assert(res6.body?.success === true, `verifyAndRegister success is true`);
    assert(res6.body?.data?.user?.email === testEmailB, `User email matches registered email`);

    const userBId = res6.body.data.user.id;
    const companyBId = res6.body.data.company?.id || res6.body.data.user?.company_id;
    createdUserIds.push(userBId);
    if (companyBId) createdCompanyIds.push(companyBId);

    // Verify company, employer, and subscription B
    const [eBRows] = await db.query('SELECT * FROM employers WHERE user_id = ?', [userBId]);
    assert(eBRows.length === 1, `Employer profile created for Company Admin B`);
    const employerBId = eBRows[0].id;
    createdEmployerIds.push(employerBId);

    const [subBRows] = await db.query(
      `SELECT s.*, p.name as plan_name, DATEDIFF(s.end_date, s.start_date) as duration_diff
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.employer_id = ?`,
      [employerBId]
    );
    assert(subBRows.length === 1, `Subscription created via verifyAndRegister`);
    assert(subBRows[0].plan_id === 4, `Subscription plan_id is 4 (Free Trial)`);
    assert(subBRows[0].max_employees === 10, `Subscription quota is 10 employees`);
    assert(subBRows[0].duration_diff === 7, `Subscription duration is exactly 7 days (got ${subBRows[0].duration_diff})\n`);
    createdSubIds.push(subBRows[0].id);

    // -------------------------------------------------------------------------
    // TEST 7: Controlled Cleanup of Temporary Test Records in pop_db
    // -------------------------------------------------------------------------
    console.log('--- TEST 7: Controlled Cleanup of Temporary Test Records in pop_db ---');
    await cleanup();
    console.log(`   Cleaned up temporary test records.`);

    // -------------------------------------------------------------------------
    // TEST 8: Baseline Integrity Assertion Post-Cleanup
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Baseline Integrity Verification ---');
    const [[{ count: postUsers }]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: postSubs }]] = await db.query('SELECT COUNT(*) as count FROM subscriptions');
    const [[{ count: postCompanies }]] = await db.query('SELECT COUNT(*) as count FROM companies');
    const [[{ count: postEmployers }]] = await db.query('SELECT COUNT(*) as count FROM employers');
    assert(postUsers === preUsers, `User count returned to baseline: ${postUsers} == ${preUsers}`);
    assert(postSubs === preSubs, `Subscription count returned to baseline: ${postSubs} == ${preSubs}`);
    assert(postCompanies === preCompanies, `Company count returned to baseline: ${postCompanies} == ${preCompanies}`);
    assert(postEmployers === preEmployers, `Employer count returned to baseline: ${postEmployers} == ${preEmployers}`);

    // Verify existing subscriptions 1 and 2
    const [preservedSubs] = await db.query(
      `SELECT id, employer_id, plan_id, 
              DATE_FORMAT(start_date, '%Y-%m-%d') as start_date_str, 
              DATE_FORMAT(end_date, '%Y-%m-%d') as end_date_str, 
              status 
       FROM subscriptions WHERE id IN (1, 2)`
    );
    assert(preservedSubs.length === 2, `Original subscriptions 1 and 2 exist`);
    assert(preservedSubs[0].end_date_str === '2027-10-28', `Sub 1 end_date is preserved (2027-10-28) (got ${preservedSubs[0].end_date_str})`);
    assert(preservedSubs[1].end_date_str === '2027-10-28', `Sub 2 end_date is preserved (2027-10-28) (got ${preservedSubs[1].end_date_str})`);

    console.log('\n===============================================================');
    console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Test execution failed:', err);
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

runPhase1DTests();
