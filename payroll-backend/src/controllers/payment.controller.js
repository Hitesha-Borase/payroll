const db = require('../config/mysql');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const authService = require('../services/auth.service');
const paymentService = require('../services/payment.service');
const auditService = require('../services/audit.service');
const { generateToken, generateRefreshToken } = require('../utils/jwt');

/**
 * 1. Create Razorpay Subscription Order
 * API: POST /api/payment/razorpay/create-order
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { plan_id, currency, amount } = req.body;
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_kiaan_payroll_key';

    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'Plan ID is required.' });
    }

    const [planRows] = await db.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    const plan = planRows[0];

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Selected plan not found.' });
    }

    const amountInPaise = amount 
      ? Math.round(parseFloat(amount) * 100) 
      : Math.round(parseFloat(plan.price || 0) * 100);
      
    const finalCurrency = currency || 'INR';

    const orderData = await paymentService.createOrder(amountInPaise, finalCurrency, {
      plan_id: String(plan.id),
      plan_name: plan.name
    });

    res.json({
      success: true,
      message: 'Razorpay order generated successfully.',
      data: {
        order_id: orderData.order_id,
        key_id,
        amount: amountInPaise,
        currency: finalCurrency,
        plan_name: plan.name,
        duration_months: plan.duration_months,
        is_live: orderData.is_live
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Verify Razorpay Payment Signature & Activate Subscription
 * API: POST /api/payment/razorpay/verify-payment
 */
const verifyRazorpayPayment = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, employer_id } = req.body;

    const empId = employer_id || req.employer?.id || req.user?.company_id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id || !empId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order ID, Payment ID, Signature, Plan ID, and Employer ID are required.'
      });
    }

    // Role and tenant authorization: caller must be superadmin or the company admin of the target company
    if (req.user?.role !== 'superadmin' && String(req.user?.company_id) !== String(empId)) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot verify payments for another company.'
      });
    }

    // Fetch Plan Details from database (trusted server record) first
    const [planRows] = await connection.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    const plan = planRows[0];
    if (!plan) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Comprehensive Server-Side Verification: Signature + Gateway Status + Order + Amount + Currency
    const expectedAmountInPaise = Math.round(parseFloat(plan.price || 0) * 100);
    const valResult = await paymentService.verifyAndValidatePayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      expectedAmountInPaise,
      expectedCurrency: 'INR'
    });

    if (!valResult.isValid) {
      await connection.rollback();

      // Dispatch Payment Failed Notification to Super Admin (info@kiaantechnology.com)
      emailService.sendSuperAdminPaymentFailedNotification({
        companyName: req.user?.company_name || `Employer #${empId}`,
        adminEmail: req.user?.email || 'unknown@domain.com',
        planName: plan.name || 'Razorpay Order Verification',
        transactionRef: razorpay_order_id,
        paymentGateway: 'Razorpay',
        failureStatus: valResult.error || 'Payment Verification Failed',
        failureTimestamp: new Date().toLocaleString()
      }).catch(err => console.error('[EMAIL ERROR]:', err.message));

      return res.status(400).json({ success: false, message: valResult.error || 'Payment verification failed.' });
    }

    // Replay / Duplicate Prevention with row locking: Check if payment or order already processed
    const [existingPayment] = await connection.query(
      'SELECT id FROM payments WHERE payment_reference = ? OR transaction_id = ? FOR UPDATE',
      [razorpay_payment_id, razorpay_order_id]
    );
    if (existingPayment.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Duplicate payment: this transaction or payment reference has already been processed.'
      });
    }

    // 1. Expire existing active subscriptions for company
    await connection.query(
      "UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE employer_id = ? AND status = 'active'",
      [empId]
    );

    // 2. Calculate Tenure Dates
    const startDate = new Date();
    const duration = plan.duration_months || 1;
    const endDate = new Date(startDate);
    if (plan.id === 4 || (plan.name && plan.name.toLowerCase().includes('trial'))) {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + duration);
    }

    // 3. Create New Active Subscription
    const [subResult] = await connection.query(
      `INSERT INTO subscriptions (employer_id, plan_id, start_date, end_date, status, auto_renew, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
      [empId, plan_id, startDate, endDate]
    );
    const subscriptionId = subResult.insertId;

    // 4. Create Invoice with 18% GST Tax
    const invoiceNumber = `INV-${Date.now()}-${empId}`;
    const baseAmount = parseFloat(plan.price || 0);
    const taxAmount = parseFloat((baseAmount * 0.18).toFixed(2));
    const totalAmount = baseAmount + taxAmount;

    const [invResult] = await connection.query(
      `INSERT INTO invoices (invoice_number, employer_id, subscription_id, plan_id, amount, tax_amount, total_amount, due_date, status, paid_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'paid', NOW(), NOW(), NOW())`,
      [invoiceNumber, empId, subscriptionId, plan_id, baseAmount, taxAmount, totalAmount]
    );
    const invoiceId = invResult.insertId;

    // 5. Record Payment Log in payments ledger
    await connection.query(
      `INSERT INTO payments (invoice_id, employer_id, amount, payment_method, payment_reference, transaction_id, status, payment_date, created_at, updated_at)
       VALUES (?, ?, ?, 'Razorpay', ?, ?, 'success', NOW(), NOW(), NOW())`,
      [invoiceId, empId, totalAmount, razorpay_payment_id, razorpay_order_id]
    );

    // 6. Update Corporate Company State & Plan Title
    await connection.query(
      'UPDATE companies SET status = "active", subscription_plan = ?, updated_at = NOW() WHERE id = ?',
      [plan.name, empId]
    );
    await connection.query(
      'UPDATE employers SET status = "active", updated_at = NOW() WHERE id = ?',
      [empId]
    );

    // 7. Update User status to active
    const [compRows] = await connection.query('SELECT user_id, company_name FROM companies WHERE id = ?', [empId]);
    const comp = compRows[0];
    if (comp?.user_id) {
      await connection.query('UPDATE users SET status = "active" WHERE id = ?', [comp.user_id]);
    }

    await connection.commit();

    // 8. Dispatch Full Suite of Email Notifications
    const recipientEmail = req.user?.email;
    const recipientName = req.user?.name || 'HR Admin';
    const companyName = comp?.company_name || req.user?.company_name || 'Corporate Tenant';
    const formattedStartDate = startDate.toLocaleDateString();
    const formattedEndDate = endDate.toLocaleDateString();

    if (recipientEmail) {
      // A. HR Admin Subscription Plan Confirmation Email
      emailService.sendHRAdminSubscriptionConfirmationEmail({
        email: recipientEmail,
        name: recipientName,
        companyName,
        planName: plan.name,
        price: totalAmount,
        currency: 'INR',
        billingFrequency: 'Monthly',
        startDate: formattedStartDate,
        expiryDate: formattedEndDate,
        maxEmployees: plan.max_employees || 100,
        features: ['Automated Payroll & Tax Compliance', 'Biometric & Attendance Sync', 'Employee Self-Service'],
        paymentStatus: 'Active',
        transactionId: razorpay_payment_id,
        paymentGateway: 'Razorpay',
        portalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin`
      }).catch(err => console.error('[EMAIL ERROR HR Sub Confirmation]:', err.message));

      // B. HR Admin Payment Confirmation Email
      emailService.sendHRAdminPaymentConfirmationEmail({
        email: recipientEmail,
        name: recipientName,
        companyName,
        transactionId: razorpay_payment_id,
        planName: plan.name,
        amount: totalAmount,
        currency: 'INR',
        paymentGateway: 'Razorpay',
        paymentDate: new Date().toLocaleDateString(),
        paymentStatus: 'SUCCESS'
      }).catch(err => console.error('[EMAIL ERROR HR Payment Confirmation]:', err.message));
    }

    // C. Super Admin Subscription Purchase Alert (info@kiaantechnology.com)
    emailService.sendSuperAdminSubscriptionPurchaseNotification({
      companyName,
      adminName: recipientName,
      email: recipientEmail || 'N/A',
      planName: plan.name,
      price: totalAmount,
      currency: 'INR',
      startDate: formattedStartDate,
      expiryDate: formattedEndDate,
      paymentStatus: 'Active / Paid',
      transactionId: razorpay_payment_id,
      paymentGateway: 'Razorpay',
      purchaseDate: new Date().toLocaleString()
    }).catch(err => console.error('[EMAIL ERROR SA Sub Purchase]:', err.message));

    // D. Super Admin Payment Received Alert (info@kiaantechnology.com)
    emailService.sendSuperAdminPaymentSuccessNotification({
      companyName,
      adminName: recipientName,
      planName: plan.name,
      transactionId: razorpay_payment_id,
      paymentGateway: 'Razorpay',
      amount: totalAmount,
      currency: 'INR',
      paymentDate: new Date().toLocaleDateString(),
      validity: `${formattedStartDate} - ${formattedEndDate}`
    }).catch(err => console.error('[EMAIL ERROR SA Payment Success]:', err.message));

    res.json({
      success: true,
      message: 'Razorpay payment verified & subscription activated successfully!',
      data: {
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        plan_name: plan.name,
        start_date: startDate,
        end_date: endDate,
        status: 'active'
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 3. Verify Payment & Register New Merchant (Landing Page Checkout Flow)
 * API: POST /api/payment/razorpay/verify-and-register
 */
const verifyAndRegister = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const {
      name,
      email,
      password,
      company_name,
      phone,
      plan_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!email || !password || !company_name || !plan_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Email, password, company_name, and plan_id are required.' });
    }

    // Check if user email already registered
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login.' });
    }

    // Fetch Plan Details (trusted server record)
    const [planRows] = await connection.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    const plan = planRows[0];
    if (!plan) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Selected plan not found.' });
    }

    const planName = plan.name || 'Standard';
    const isFreeTrial = Number(plan_id) === 4 || String(planName).toUpperCase().includes('TRIAL') || parseFloat(plan.price || 0) === 0;

    // For paid plans, mandatory server-side signature + gateway verification is required
    if (!isFreeTrial) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for paid plans.'
        });
      }

      const expectedAmountInPaise = Math.round(parseFloat(plan.price || 0) * 100);
      const valResult = await paymentService.verifyAndValidatePayment({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        expectedAmountInPaise,
        expectedCurrency: 'INR'
      });

      if (!valResult.isValid) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: valResult.error || 'Payment verification failed.'
        });
      }

      // Replay prevention with row locking: check if this payment was already processed
      const [existingPayment] = await connection.query(
        'SELECT id FROM payments WHERE payment_reference = ? OR transaction_id = ? FOR UPDATE',
        [razorpay_payment_id, razorpay_order_id]
      );
      if (existingPayment.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Duplicate payment: this transaction or payment reference has already been processed.'
        });
      }
    }

    // 1. Create User Account (Admin role)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userRes] = await connection.query(
      `INSERT INTO users (name, email, password, phone, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', 'active', NOW(), NOW())`,
      [name || company_name, email.trim().toLowerCase(), hashedPassword, phone || null]
    );
    const userId = userRes.insertId;

    // 2. Create Admin record
    const [adminRes] = await connection.query(
      `INSERT INTO admins (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`,
      [userId]
    );
    const adminId = adminRes.insertId;

    // 3. Create Company Record
    const [compRes] = await connection.query(
      `INSERT INTO companies (user_id, admin_id, company_name, subscription_plan, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
      [userId, adminId, company_name, planName]
    );
    const companyId = compRes.insertId;

    // 3b. Create Employer Record
    const [empRes] = await connection.query(
      `INSERT INTO employers (user_id, company_id, company_name, designation, subscription_plan, status, created_at, updated_at)
       VALUES (?, ?, ?, 'Company Admin', ?, 'active', NOW(), NOW())`,
      [userId, companyId, company_name, isFreeTrial ? 'Free Trial' : planName]
    );
    const employerRecordId = empRes.insertId;

    // Link user to company_id
    await connection.query('UPDATE users SET company_id = ? WHERE id = ?', [companyId, userId]);

    // 4. Activate Subscription
    const now = new Date();
    const startDate = now;
    const startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let endDateStr;
    let endDate;
    if (isFreeTrial) {
      endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    } else {
      const duration = plan?.duration_months || 1;
      endDate = new Date(now);
      if (plan.id === 4 || (plan.name && plan.name.toLowerCase().includes('trial'))) {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate.setMonth(endDate.getMonth() + duration);
      }
      endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    }

    const targetSubPlanId = isFreeTrial ? 4 : plan_id;
    const maxSeats = isFreeTrial ? 10 : (plan?.max_employees || null);
    const [subRes] = await connection.query(
      `INSERT INTO subscriptions (employer_id, plan_id, start_date, end_date, status, auto_renew, max_employees, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, NOW(), NOW())`,
      [employerRecordId, targetSubPlanId, startDateStr, endDateStr, isFreeTrial ? 0 : 1, maxSeats]
    );
    const subscriptionId = subRes.insertId;

    // 5. If Paid Plan, record Invoice and Payment in ledger using trusted plan pricing
    if (!isFreeTrial) {
      const invoiceNumber = `INV-${Date.now()}-${employerRecordId}`;
      const baseAmount = parseFloat(plan.price || 0);
      const taxAmount = parseFloat((baseAmount * 0.18).toFixed(2));
      const totalAmount = baseAmount + taxAmount;

      const [invResult] = await connection.query(
        `INSERT INTO invoices (invoice_number, employer_id, subscription_id, plan_id, amount, tax_amount, total_amount, due_date, status, paid_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'paid', NOW(), NOW(), NOW())`,
        [invoiceNumber, employerRecordId, subscriptionId, plan_id, baseAmount, taxAmount, totalAmount]
      );
      const invoiceId = invResult.insertId;

      await connection.query(
        `INSERT INTO payments (invoice_id, employer_id, amount, payment_method, payment_reference, transaction_id, status, payment_date, created_at, updated_at)
         VALUES (?, ?, ?, 'Razorpay', ?, ?, 'success', NOW(), NOW(), NOW())`,
        [invoiceId, employerRecordId, totalAmount, razorpay_payment_id, razorpay_order_id]
      );
    }

    await connection.commit();

    // Generate JWT Token
    const userPayload = { id: userId, email: email.trim().toLowerCase(), role: 'admin', company_id: companyId };
    const token = generateToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userId });

    // 6. Dispatch Email Notifications
    const formattedStartDate = startDate.toLocaleDateString();
    const formattedEndDate = endDate.toLocaleDateString();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name || company_name;

    // A. Super Admin Registration Alert (info@kiaantechnology.com)
    emailService.sendSuperAdminNewRegistrationNotification({
      companyName: company_name,
      adminName: cleanName,
      email: cleanEmail,
      phone: phone || 'N/A',
      createdAt: new Date().toLocaleString(),
      status: 'active',
      planName,
      activationStatus: 'Purchased & Active'
    }).catch(err => console.error('[EMAIL ERROR SA Registration]:', err.message));

    // B. Super Admin Subscription Purchase Alert (info@kiaantechnology.com)
    emailService.sendSuperAdminSubscriptionPurchaseNotification({
      companyName: company_name,
      adminName: cleanName,
      email: cleanEmail,
      planName,
      price: plan?.price || 0,
      currency: 'INR',
      startDate: formattedStartDate,
      expiryDate: formattedEndDate,
      paymentStatus: 'Active',
      transactionId: razorpay_payment_id || 'N/A',
      paymentGateway: 'Razorpay',
      purchaseDate: new Date().toLocaleString()
    }).catch(err => console.error('[EMAIL ERROR SA Sub Purchase]:', err.message));

    // C. HR Admin Subscription Confirmation Email (Includes Login Credentials + Plan Details)
    emailService.sendHRAdminSubscriptionConfirmationEmail({
      email: cleanEmail,
      name: cleanName,
      // Raw password omitted from emails for credential protection
      companyName: company_name,
      planName,
      price: plan?.price || 0,
      currency: 'INR',
      billingFrequency: 'Monthly',
      startDate: formattedStartDate,
      expiryDate: formattedEndDate,
      maxEmployees: plan?.max_employees || 100,
      features: ['Automated Payroll & Tax Compliance', 'Biometric Sync', 'Employee Self-Service'],
      paymentStatus: 'Active',
      transactionId: razorpay_payment_id || 'N/A',
      paymentGateway: 'Razorpay',
      portalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
    }).catch(err => console.error('[EMAIL ERROR HR Sub Confirm]:', err.message));

    res.status(201).json({
      success: true,
      message: 'Account created and plan subscription activated successfully!',
      data: {
        token,
        user: { id: userId, name, email, role: 'admin' },
        company: { id: companyId, company_name, plan: planName, end_date: endDate }
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 4. Create Dynamic/Static UPI Deep-Link Invoice QR Code
 * API: POST /api/payment/create-qr
 */
const createUPIInvoiceQR = async (req, res, next) => {
  try {
    const { amount, payee_name, upi_id, order_ref } = req.body;

    const upiId = upi_id || process.env.COMPANY_UPI_ID || 'kiaanpayroll@upi';
    const payeeName = payee_name || 'Kiaan Technology Pvt Ltd';
    const payAmount = amount || 0;
    const ref = order_ref || `ORD-${Date.now()}`;

    // UPI Deep-Link Format
    const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${payAmount}&cu=INR&tr=${ref}&tn=${encodeURIComponent('Payroll SaaS Plan Payment')}`;

    res.json({
      success: true,
      data: {
        upi_payload: upiPayload,
        upi_id: upiId,
        payee_name: payeeName,
        amount: payAmount,
        transaction_ref: ref
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Manual Confirmation of Payment
 * API: POST /api/payment/confirm-static
 */
const confirmStaticPayment = async (req, res, next) => {
  try {
    // Only superadmin is authorized to confirm manual offline payments
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: manual payment confirmation requires superadmin privileges.'
      });
    }

    const { employer_id, plan_id, payment_ref, notes } = req.body;

    if (!employer_id || !plan_id || !payment_ref) {
      return res.status(400).json({
        success: false,
        message: 'Employer ID, Plan ID, and Payment Reference are required for manual confirmation.'
      });
    }

    // Verify Employer Company Exists
    const [compRows] = await db.query('SELECT * FROM companies WHERE id = ?', [employer_id]);
    const company = compRows[0];
    if (!company) {
      return res.status(404).json({ success: false, message: 'Employer company not found.' });
    }

    // Verify Plan Details
    const [planRows] = await db.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    const plan = planRows[0];
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Replay / Duplicate Prevention on Payment Reference
    const [existingPayment] = await db.query(
      'SELECT id FROM payments WHERE payment_reference = ?',
      [payment_ref]
    );
    if (existingPayment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate payment: this payment reference has already been confirmed.'
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (plan.id === 4 || (plan.name && plan.name.toLowerCase().includes('trial'))) {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + (plan.duration_months || 1));
    }

    await db.query("UPDATE subscriptions SET status = 'expired' WHERE employer_id = ? AND status = 'active'", [employer_id]);

    const [subRes] = await db.query(
      `INSERT INTO subscriptions (employer_id, plan_id, start_date, end_date, status, auto_renew, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
      [employer_id, plan_id, startDate, endDate]
    );
    const subscriptionId = subRes.insertId;

    // Create Invoice & Record Payment
    const invoiceNumber = `INV-MANUAL-${Date.now()}-${employer_id}`;
    const baseAmount = parseFloat(plan.price || 0);
    const taxAmount = parseFloat((baseAmount * 0.18).toFixed(2));
    const totalAmount = baseAmount + taxAmount;

    const [invRes] = await db.query(
      `INSERT INTO invoices (invoice_number, employer_id, subscription_id, plan_id, amount, tax_amount, total_amount, due_date, status, paid_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'paid', NOW(), NOW(), NOW())`,
      [invoiceNumber, employer_id, subscriptionId, plan_id, baseAmount, taxAmount, totalAmount]
    );
    const invoiceId = invRes.insertId;

    await db.query(
      `INSERT INTO payments (invoice_id, employer_id, amount, payment_method, payment_reference, transaction_id, status, payment_date, created_at, updated_at)
       VALUES (?, ?, ?, 'offline_manual', ?, ?, 'success', NOW(), NOW(), NOW())`,
      [invoiceId, employer_id, totalAmount, payment_ref, payment_ref]
    );

    await db.query('UPDATE companies SET status = "active", subscription_plan = ? WHERE id = ?', [plan.name, employer_id]);

    // Audit Log for Superadmin action
    await auditService.log({
      action: 'MANUAL_PAYMENT_CONFIRMED',
      entityType: 'subscription',
      entityId: subscriptionId,
      performedBy: req.user?.id,
      performedByRole: 'superadmin',
      details: {
        employer_id,
        plan_id,
        plan_name: plan.name,
        payment_ref,
        notes: notes || null
      },
      ipAddress: req.ip || req.connection?.remoteAddress
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Payment confirmed manually and subscription activated successfully.',
      data: {
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        payment_reference: payment_ref
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Handle Razorpay Async Webhook Events
 * API: POST /api/payment/razorpay/webhook
 */
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = paymentService.verifyWebhookSignature(rawBody, webhookSignature);
    if (!isValid) {
      console.warn('⚠️ Invalid Razorpay Webhook Signature');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    console.log(`🔔 Received Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const amount = (paymentEntity?.amount || 0) / 100;

      console.log(`✅ Webhook: Payment ${paymentId} captured for Order ${orderId} (Amount: ₹${amount})`);
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      console.warn(`❌ Webhook: Payment ${paymentEntity?.id} failed for Order ${paymentEntity?.order_id}`);
    }

    res.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyAndRegister,
  createUPIInvoiceQR,
  confirmStaticPayment,
  handleRazorpayWebhook
};

