const db = require('../config/mysql');
const googlePlayService = require('../services/googlePlay.service');
const emailService = require('../services/email.service');

const maskToken = (token) => {
  if (!token || typeof token !== 'string') return '';
  if (token.length <= 10) return '***';
  return `${token.substring(0, 6)}...${token.slice(-4)}`;
};

const formatDateOnly = (d) => {
  const dateObj = (d instanceof Date) ? d : new Date(d);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * 1. Verify Google Play In-App Purchase and Activate Subscription
 * API: POST /api/payment/google-play/verify
 */
const verifyGooglePlayPurchase = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { purchase_token, product_id, base_plan_id } = req.body;

    if (!purchase_token || typeof purchase_token !== 'string' || purchase_token.trim().length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Google Play purchase_token is required.'
      });
    }

    // Decoupled dual entity resolution: employerId (for employers/subscriptions) & companyId (for companies)
    let employerId = req.employer?.id || null;
    let companyId = req.employer?.company_id || req.user?.company_id || null;

    if (!employerId && req.user?.id) {
      const [empRows] = await connection.query(
        'SELECT id, company_id FROM employers WHERE user_id = ? OR company_id = ? LIMIT 1',
        [req.user.id, companyId]
      );
      if (empRows.length > 0) {
        employerId = empRows[0].id;
        if (!companyId) companyId = empRows[0].company_id;
      }
    }

    if (!employerId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Authenticated company/employer identity not found.'
      });
    }

    // 1. Authoritative Server-Side Verification via Google Play Developer API
    const verification = await googlePlayService.verifySubscriptionPurchase(purchase_token);
    if (!verification.isValid) {
      await connection.rollback();
      return res.status(verification.setupPending ? 503 : 400).json({
        success: false,
        message: verification.error || 'Google Play purchase verification failed.',
        setupPending: !!verification.setupPending
      });
    }

    const verifiedProductId = verification.productId || product_id;
    const planConfig = googlePlayService.getPlanConfig(verifiedProductId);

    if (!planConfig) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Unknown or unmapped Google Play product: ${verifiedProductId}`
      });
    }

    // 2. Fetch Plan from Database (Option B Canonical Plan)
    const [planRows] = await connection.query('SELECT * FROM plans WHERE id = ?', [planConfig.plan_id]);
    const plan = planRows[0];
    if (!plan) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Mapped internal plan not found in database.' });
    }

    // 3. Replay & Cross-Tenant Theft Protection:
    // Check if this purchase token has already been registered or used by another company
    const [existingSub] = await connection.query(
      'SELECT id, employer_id, status FROM subscriptions WHERE google_purchase_token = ? FOR UPDATE',
      [purchase_token]
    );

    if (existingSub.length > 0) {
      const existing = existingSub[0];
      if (String(existing.employer_id) !== String(employerId)) {
        await connection.rollback();
        console.warn(`[SECURITY ALERT] Cross-account token replay attempt: Token ${maskToken(purchase_token)} belongs to employer ${existing.employer_id}, attempted by employer ${employerId}`);
        return res.status(409).json({
          success: false,
          message: 'Security Alert: This purchase token is already tied to a different account.'
        });
      }
      if (existing.status === 'active') {
        // Token already verified and active for this company (idempotent success)
        await connection.rollback();
        return res.json({
          success: true,
          message: 'Subscription is already active for this purchase token.',
          data: {
            subscription_id: existing.id,
            plan_name: planConfig.name,
            already_active: true
          }
        });
      }
    }

    // 4. Calculate subscription dates with calendar component formatting (zero UTC shift)
    const now = new Date();
    const startDateStr = formatDateOnly(now);
    let endDateStr;
    if (verification.expiryTime && verification.expiryTime > now) {
      endDateStr = formatDateOnly(verification.expiryTime);
    } else {
      const endObj = new Date(now);
      endObj.setMonth(endObj.getMonth() + (planConfig.duration_months || 1));
      endDateStr = formatDateOnly(endObj);
    }

    // 5. Expire existing active subscriptions for this employer
    await connection.query(
      "UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE employer_id = ? AND status = 'active'",
      [employerId]
    );

    // 6. Insert new active subscription with Google Play metadata and explicit employee quota
    const orderId = verification.orderId || `GPA.${Date.now()}`;
    const [subResult] = await connection.query(
      `INSERT INTO subscriptions (
        employer_id, plan_id, start_date, end_date, status, auto_renew,
        payment_gateway, google_product_id, google_base_plan_id,
        google_purchase_token, google_order_id, google_subscription_state,
        max_employees, last_sync_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', 1, 'google_play', ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        employerId,
        plan.id,
        startDateStr,
        endDateStr,
        verifiedProductId,
        verification.basePlanId || base_plan_id || planConfig.base_plan_id,
        purchase_token,
        orderId,
        verification.subscriptionState || 'SUBSCRIPTION_STATE_ACTIVE',
        planConfig.max_employees
      ]
    );
    const subscriptionId = subResult.insertId;

    // 7. Create invoice record (Google Play price is tax-inclusive MRP)
    const invoiceNumber = `INV-GP-${Date.now()}-${employerId}`;
    const totalAmount = planConfig.price;
    const baseAmount = Number((totalAmount / 1.18).toFixed(2));
    const taxAmount = Number((totalAmount - baseAmount).toFixed(2));

    const [invResult] = await connection.query(
      `INSERT INTO invoices (
        invoice_number, employer_id, subscription_id, plan_id,
        amount, tax_amount, total_amount, due_date, status, paid_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'paid', NOW(), NOW(), NOW())`,
      [invoiceNumber, employerId, subscriptionId, plan.id, baseAmount, taxAmount, totalAmount]
    );
    const invoiceId = invResult.insertId;

    // 8. Record in payments table (masking sensitive token from reference)
    await connection.query(
      `INSERT INTO payments (
        invoice_id, employer_id, amount, payment_method,
        payment_reference, transaction_id, status, payment_date,
        created_at, updated_at, notes
      ) VALUES (?, ?, ?, 'Google Play', ?, ?, 'success', NOW(), NOW(), NOW(), ?)`,
      [
        invoiceId,
        employerId,
        totalAmount,
        orderId,
        orderId,
        `Google Play Subscription (${verifiedProductId}) [Token: ${maskToken(purchase_token)}]`
      ]
    );

    // 9. Update employer status and subscription_plan
    await connection.query(
      'UPDATE employers SET status = "active", subscription_plan = ?, updated_at = NOW() WHERE id = ?',
      [planConfig.name, employerId]
    );

    // 10. Update company status and subscription_plan if companyId is resolved
    if (companyId) {
      await connection.query(
        'UPDATE companies SET status = "active", subscription_plan = ?, updated_at = NOW() WHERE id = ?',
        [planConfig.name, companyId]
      );
      const [compRows] = await connection.query('SELECT user_id, company_name FROM companies WHERE id = ?', [companyId]);
      const comp = compRows[0];
      if (comp?.user_id) {
        await connection.query('UPDATE users SET status = "active" WHERE id = ?', [comp.user_id]);
      }
    }

    await connection.commit();

    // 11. Authoritative Acknowledgement with Google Play if pending
    if (verification.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') {
      googlePlayService.acknowledgeSubscription(verifiedProductId, purchase_token)
        .catch(err => console.error('[GOOGLE PLAY ACKNOWLEDGE BG ERROR]:', err?.message || err));
    }

    // 12. Send Confirmation Email asynchronously
    const recipientEmail = req.user?.email;
    const recipientName = req.user?.name || 'Administrator';
    const companyName = req.user?.company_name || 'Kiaan PayrollPlus Tenant';

    if (recipientEmail && typeof emailService.sendHRAdminPaymentConfirmationEmail === 'function') {
      emailService.sendHRAdminPaymentConfirmationEmail({
        email: recipientEmail,
        name: recipientName,
        companyName,
        planName: planConfig.name,
        amount: totalAmount,
        currency: 'INR',
        transactionId: orderId,
        paymentGateway: 'Google Play Billing',
        paymentDate: startDateStr,
        paymentStatus: 'SUCCESS'
      }).catch(err => console.error('[EMAIL ERROR]:', err.message));
    }

    // 13. Return success response (token is masked for client security)
    return res.json({
      success: true,
      message: 'Subscription successfully activated via Google Play.',
      data: {
        subscription_id: subscriptionId,
        plan_id: plan.id,
        plan_name: planConfig.name,
        max_employees: planConfig.max_employees,
        price: planConfig.price,
        currency: 'INR',
        start_date: startDateStr,
        end_date: endDateStr,
        order_id: orderId,
        payment_gateway: 'google_play',
        purchase_token_masked: maskToken(purchase_token)
      }
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * 2. Get Google Play Subscription Plans Available
 * API: GET /api/payment/google-play/plans
 */
const getGooglePlayPlans = async (req, res, next) => {
  try {
    const plans = googlePlayService.getAllPlans();
    return res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Handle Real-Time Developer Notifications (RTDN) Webhook from Google Cloud Pub/Sub
 * API: POST /api/payment/google-play/rtdn-webhook
 */
const handleGooglePlayRTDN = async (req, res, next) => {
  try {
    // 1. Verification of Pub/Sub webhook authorization token if configured (fail-closed)
    const expectedToken = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
    const incomingToken = req.query?.token || req.headers?.['x-pubsub-token'] || req.headers?.['x-goog-rtdn-token'];
    if (expectedToken && (!incomingToken || incomingToken !== expectedToken)) {
      return res.status(403).json({ success: false, message: 'Invalid or missing RTDN verification token.' });
    }

    const pubSubMessage = req.body?.message;
    if (!pubSubMessage || !pubSubMessage.data) {
      return res.status(400).json({ success: false, message: 'Invalid Pub/Sub message payload.' });
    }

    const messageId = pubSubMessage.messageId || `msg_${Date.now()}`;

    // 2. Pub/Sub Deduplication: check if messageId was already processed
    const [existingMsg] = await db.query(
      'SELECT id FROM google_rtdn_events WHERE message_id = ? LIMIT 1',
      [messageId]
    );
    if (existingMsg.length > 0) {
      // Idempotent acknowledgement to Pub/Sub to stop redeliveries
      return res.status(200).json({ success: true, message: 'Notification already processed.' });
    }

    const decodedData = Buffer.from(pubSubMessage.data, 'base64').toString('utf8');
    let notification;
    try {
      notification = JSON.parse(decodedData);
    } catch {
      return res.status(400).json({ success: false, message: 'Could not parse notification payload.' });
    }

    const subNotification = notification.subscriptionNotification;
    if (!subNotification) {
      // Test or non-subscription event (ack successfully to Pub/Sub)
      return res.status(200).json({ success: true, message: 'Non-subscription notification acknowledged.' });
    }

    const { purchaseToken, subscriptionId, notificationType } = subNotification;
    const eventTimeMillis = Number(notification.eventTimeMillis || Date.now());

    if (!purchaseToken) {
      return res.status(200).json({ success: true, message: 'No purchase token in notification.' });
    }

    const [subs] = await db.query(
      'SELECT id, employer_id, plan_id, end_date, last_event_time_millis, status FROM subscriptions WHERE google_purchase_token = ?',
      [purchaseToken]
    );

    if (subs.length === 0) {
      console.warn(`[RTDN] No subscription found matching purchase token: ${maskToken(purchaseToken)}`);
      return res.status(200).json({ success: true, message: 'Token not mapped to active subscription.' });
    }

    const sub = subs[0];

    // 3. Out-Of-Order Event Protection: ignore stale events if newer event was already applied
    if (sub.last_event_time_millis && eventTimeMillis < sub.last_event_time_millis) {
      console.warn(`[RTDN] Out-of-order notification received for subscription #${sub.id} (eventTime: ${eventTimeMillis} < recorded: ${sub.last_event_time_millis}). Stale event skipped.`);
      await db.query(
        'INSERT INTO google_rtdn_events (message_id, purchase_token_masked, notification_type, event_time_millis, subscription_id, status) VALUES (?, ?, ?, ?, ?, "skipped_stale")',
        [messageId, maskToken(purchaseToken), notificationType, eventTimeMillis, sub.id]
      );
      return res.status(200).json({ success: true, message: 'Stale out-of-order notification acknowledged and skipped.' });
    }

    // Notification types:
    // 1: SUBSCRIPTION_RECOVERED (Payment recovered from account hold)
    // 2: SUBSCRIPTION_RENEWED (Active subscription renewed)
    // 3: SUBSCRIPTION_CANCELED (Cancellation of auto-renew)
    // 4: SUBSCRIPTION_PURCHASED (New purchase notification)
    // 5: SUBSCRIPTION_ON_HOLD (Account hold due to payment failure)
    // 6: SUBSCRIPTION_IN_GRACE_PERIOD (Grace period active)
    // 7: SUBSCRIPTION_RESTARTED (Re-activated auto-renew before expiry)
    // 10: SUBSCRIPTION_PAUSED (Subscription paused)
    // 12: SUBSCRIPTION_REVOKED (Refund / chargeback revocation)
    // 13: SUBSCRIPTION_EXPIRED (Expired after tenure)

    if (notificationType === 1) {
      // 1: SUBSCRIPTION_RECOVERED
      await db.query(
        "UPDATE subscriptions SET status = 'active', google_subscription_state = 'SUBSCRIPTION_STATE_ACTIVE', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      await db.query('UPDATE employers SET status = "active", updated_at = NOW() WHERE id = ?', [sub.employer_id]);
      console.log(`[RTDN] Subscription #${sub.id} recovered from hold.`);

    } else if (notificationType === 2) {
      // 2: SUBSCRIPTION_RENEWED
      // Authoritatively verify with Google Play if client available
      let newEndDateStr;
      const verifyRes = await googlePlayService.verifySubscriptionPurchase(purchaseToken);
      if (verifyRes.isValid && verifyRes.expiryTime) {
        newEndDateStr = formatDateOnly(verifyRes.expiryTime);
      } else {
        const curEnd = new Date(sub.end_date);
        const baseDate = curEnd > new Date() ? curEnd : new Date();
        baseDate.setMonth(baseDate.getMonth() + 1);
        newEndDateStr = formatDateOnly(baseDate);
      }

      await db.query(
        "UPDATE subscriptions SET end_date = ?, status = 'active', auto_renew = 1, google_subscription_state = 'SUBSCRIPTION_STATE_ACTIVE', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [newEndDateStr, eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} renewed until ${newEndDateStr}`);

    } else if (notificationType === 3) {
      // 3: SUBSCRIPTION_CANCELED (Auto-renew turned off; user retains active access until end_date)
      await db.query(
        "UPDATE subscriptions SET auto_renew = 0, google_subscription_state = 'SUBSCRIPTION_STATE_CANCELED', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} canceled auto-renewal; retains access until ${sub.end_date}`);

    } else if (notificationType === 4) {
      // 4: SUBSCRIPTION_PURCHASED
      await db.query(
        "UPDATE subscriptions SET status = 'active', google_subscription_state = 'SUBSCRIPTION_STATE_ACTIVE', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} purchase acknowledged.`);

    } else if (notificationType === 5) {
      // 5: SUBSCRIPTION_ON_HOLD (Payment failed; suspend active access)
      await db.query(
        "UPDATE subscriptions SET status = 'on_hold', google_subscription_state = 'SUBSCRIPTION_STATE_ON_HOLD', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} placed on hold.`);

    } else if (notificationType === 6) {
      // 6: SUBSCRIPTION_IN_GRACE_PERIOD (Grace period active; preserve access)
      await db.query(
        "UPDATE subscriptions SET google_subscription_state = 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} entered grace period.`);

    } else if (notificationType === 7) {
      // 7: SUBSCRIPTION_RESTARTED
      await db.query(
        "UPDATE subscriptions SET auto_renew = 1, status = 'active', google_subscription_state = 'SUBSCRIPTION_STATE_ACTIVE', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} restarted.`);

    } else if (notificationType === 10) {
      // 10: SUBSCRIPTION_PAUSED
      await db.query(
        "UPDATE subscriptions SET status = 'paused', google_subscription_state = 'SUBSCRIPTION_STATE_PAUSED', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      console.log(`[RTDN] Subscription #${sub.id} paused.`);

    } else if (notificationType === 12) {
      // 12: SUBSCRIPTION_REVOKED (Refund / Chargeback revocation; immediate access revocation)
      await db.query(
        "UPDATE subscriptions SET status = 'expired', google_subscription_state = 'SUBSCRIPTION_STATE_REVOKED', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      await db.query('UPDATE employers SET status = "inactive", updated_at = NOW() WHERE id = ?', [sub.employer_id]);
      console.log(`[RTDN] Subscription #${sub.id} revoked/refunded.`);

    } else if (notificationType === 13) {
      // 13: SUBSCRIPTION_EXPIRED
      await db.query(
        "UPDATE subscriptions SET status = 'expired', google_subscription_state = 'SUBSCRIPTION_STATE_EXPIRED', last_event_time_millis = ?, last_sync_at = NOW(), updated_at = NOW() WHERE id = ?",
        [eventTimeMillis, sub.id]
      );
      await db.query('UPDATE employers SET status = "inactive", updated_at = NOW() WHERE id = ?', [sub.employer_id]);
      console.log(`[RTDN] Subscription #${sub.id} expired.`);
    }

    // 4. Record event in audit table
    await db.query(
      'INSERT INTO google_rtdn_events (message_id, purchase_token_masked, notification_type, event_time_millis, subscription_id, status) VALUES (?, ?, ?, ?, ?, "processed")',
      [messageId, maskToken(purchaseToken), notificationType, eventTimeMillis, sub.id]
    );

    return res.status(200).json({ success: true, message: 'RTDN event processed successfully.' });
  } catch (error) {
    console.error('[RTDN ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Diagnostic Status Endpoint
 * API: GET /api/payment/google-play/status
 */
const getGooglePlayStatus = async (req, res, next) => {
  try {
    const status = googlePlayService.getSetupStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Securely Retrieve Previous Google Purchase Token for Subscription Upgrade/Downgrade Proration
 * API: GET /api/payment/google-play/upgrade-token
 * Narrowly scoped, authenticated, rate-limited endpoint.
 */
const getUpgradePurchaseToken = async (req, res, next) => {
  try {
    let employerId = req.employer?.id || null;
    let companyId = req.employer?.company_id || req.user?.company_id || null;

    if (!employerId && req.user?.id) {
      const [empRows] = await db.query(
        'SELECT id, company_id FROM employers WHERE user_id = ? OR company_id = ? LIMIT 1',
        [req.user.id, companyId]
      );
      if (empRows.length > 0) {
        employerId = empRows[0].id;
        if (!companyId) companyId = empRows[0].company_id;
      }
    }

    if (!employerId) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated company/employer identity not found.'
      });
    }

    // Retrieve active Google Play subscription for this tenant
    const [subRows] = await db.query(
      `SELECT id, google_product_id, google_base_plan_id, google_purchase_token, status, end_date
       FROM subscriptions
       WHERE employer_id = ? AND payment_gateway = 'google_play' AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [employerId]
    );

    if (subRows.length === 0 || !subRows[0].google_purchase_token) {
      return res.json({
        success: true,
        hasActiveSubscription: false,
        oldPurchaseToken: null,
        currentProductId: null
      });
    }

    const activeSub = subRows[0];
    return res.json({
      success: true,
      hasActiveSubscription: true,
      oldPurchaseToken: activeSub.google_purchase_token,
      currentProductId: activeSub.google_product_id,
      currentBasePlanId: activeSub.google_base_plan_id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyGooglePlayPurchase,
  getGooglePlayPlans,
  handleGooglePlayRTDN,
  getGooglePlayStatus,
  getUpgradePurchaseToken,
  maskToken
};
