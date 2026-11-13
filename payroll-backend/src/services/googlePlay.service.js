const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Canonical Authoritative mapping between Google Play In-App Product IDs and Internal Plans (Option B)
const GOOGLE_PLAY_PLAN_MAP = {
  'payroll_plan_starter': {
    plan_id: 1,
    name: 'Starter Plan',
    base_plan_id: 'starter-monthly',
    max_employees: 15,
    price: 700.00,
    currency: 'INR',
    duration_months: 1,
    duration_days: 30
  },
  'payroll_plan_pro': {
    plan_id: 2,
    name: 'Professional Plan',
    base_plan_id: 'pro-monthly',
    max_employees: 50,
    price: 900.00,
    currency: 'INR',
    duration_months: 1,
    duration_days: 30
  },
  'payroll_plan_premium': {
    plan_id: 3,
    name: 'Premium Plan',
    base_plan_id: 'premium-monthly',
    max_employees: 100,
    price: 1200.00,
    currency: 'INR',
    duration_months: 1,
    duration_days: 30
  }
};

class GooglePlayService {
  constructor() {
    this.packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.kiaan.payroll';
    this.serviceAccountPath = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH || null;
    this.androidPublisher = null;
    this._testMockClient = null;
    this._credentialsConfigured = false;
    this._initClient();
  }

  _initClient() {
    try {
      if (this.serviceAccountPath) {
        const resolvedPath = path.isAbsolute(this.serviceAccountPath)
          ? this.serviceAccountPath
          : path.resolve(process.cwd(), this.serviceAccountPath);

        if (fs.existsSync(resolvedPath)) {
          const auth = new google.auth.GoogleAuth({
            keyFile: resolvedPath,
            scopes: ['https://www.googleapis.com/auth/androidpublisher']
          });
          this.androidPublisher = google.androidpublisher({ version: 'v3', auth });
          this._credentialsConfigured = true;
          console.log('[GOOGLE PLAY] Google Play Publisher API client initialized successfully.');
          return;
        }
      }
      this._credentialsConfigured = false;
      console.warn('[GOOGLE PLAY] Service account credentials not present. Verification calls will fail closed until configured.');
    } catch (err) {
      this._credentialsConfigured = false;
      console.error('[GOOGLE PLAY] Failed to initialize Google Publisher client:', err.message);
    }
  }

  /**
   * Diagnostic setup status report
   */
  getSetupStatus() {
    return {
      packageName: this.packageName,
      serviceAccountConfigured: this._credentialsConfigured,
      serviceAccountPath: this.serviceAccountPath || 'NOT_CONFIGURED',
      clientReady: !!this.androidPublisher,
      supportedProducts: Object.keys(GOOGLE_PLAY_PLAN_MAP)
    };
  }

  /**
   * Strictly isolated test-only mock client injection
   * Only permitted when NODE_ENV === 'test'
   */
  setMockClientForTesting(client) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('SECURITY VIOLATION: Mock client injection is strictly forbidden outside test environment.');
    }
    this._testMockClient = client;
  }

  getPlanConfig(productId) {
    return GOOGLE_PLAY_PLAN_MAP[productId] || null;
  }

  getAllPlans() {
    return Object.entries(GOOGLE_PLAY_PLAN_MAP).map(([productId, cfg]) => ({
      productId,
      ...cfg
    }));
  }

  /**
   * Authoritative verification of purchase token via Google Play Developer API (Subscriptions v2)
   * Fails closed with no mock/dev bypasses in production.
   */
  async verifySubscriptionPurchase(purchaseToken) {
    if (!purchaseToken || typeof purchaseToken !== 'string' || purchaseToken.trim().length === 0) {
      return { isValid: false, error: 'Purchase token is missing or invalid.' };
    }

    const publisher = (process.env.NODE_ENV === 'test' && this._testMockClient)
      ? this._testMockClient
      : this.androidPublisher;

    if (!publisher) {
      return {
        isValid: false,
        error: 'Google Play Developer API service account credentials are not configured on this server.',
        setupPending: true
      };
    }

    try {
      const res = await publisher.purchases.subscriptionsv2.get({
        packageName: this.packageName,
        token: purchaseToken
      });

      const purchase = res.data;
      if (!purchase) {
        return { isValid: false, error: 'Empty response received from Google Play Developer API.' };
      }

      // 1. Verify target package name
      if (purchase.packageName && purchase.packageName !== this.packageName) {
        return {
          isValid: false,
          error: `Package name mismatch. Expected ${this.packageName}, received ${purchase.packageName}`
        };
      }

      // 2. Line Items Inspection
      const lineItem = purchase.lineItems && purchase.lineItems[0];
      if (!lineItem) {
        return { isValid: false, error: 'No subscription items found in Google Play purchase response.' };
      }

      const productId = lineItem.productId;
      const basePlanId = lineItem.offerDetails?.basePlanId;
      const subscriptionState = purchase.subscriptionState;
      const expiryTime = lineItem.expiryTime ? new Date(lineItem.expiryTime) : null;
      const orderId = purchase.latestOrderId;

      // 3. Verify Product ID is a recognized Option B Plan
      const planConfig = this.getPlanConfig(productId);
      if (!planConfig) {
        return {
          isValid: false,
          error: `Unrecognized Google Play product ID: ${productId}. Not mapped to internal catalog.`
        };
      }

      // 4. Subscription Standing Check (Only active or grace period standing qualify)
      const isGoodStanding = [
        'SUBSCRIPTION_STATE_ACTIVE',
        'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
      ].includes(subscriptionState);

      if (!isGoodStanding) {
        return {
          isValid: false,
          error: `Subscription is not in active standing (State: ${subscriptionState || 'UNKNOWN'}). Access denied.`,
          subscriptionState,
          productId,
          orderId
        };
      }

      // 5. Verify Expiry Date has not passed
      if (expiryTime && expiryTime.getTime() <= Date.now()) {
        return {
          isValid: false,
          error: `Subscription has already expired at ${expiryTime.toISOString()}.`,
          subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED',
          productId,
          orderId
        };
      }

      return {
        isValid: true,
        productId,
        basePlanId,
        subscriptionState,
        expiryTime,
        orderId: orderId || `GPA.${Date.now()}`,
        acknowledgementState: purchase.acknowledgementState,
        planConfig,
        raw: purchase
      };
    } catch (apiError) {
      console.error('[GOOGLE PLAY API ERROR]:', apiError?.response?.data || apiError.message);
      return {
        isValid: false,
        error: apiError?.response?.data?.error?.message || apiError.message || 'Authoritative verification with Google Play failed.'
      };
    }
  }

  /**
   * Authoritative acknowledgement of subscription purchase via Google Play Developer API
   */
  async acknowledgeSubscription(productId, purchaseToken) {
    const publisher = (process.env.NODE_ENV === 'test' && this._testMockClient)
      ? this._testMockClient
      : this.androidPublisher;

    if (!publisher) {
      return { acknowledged: false, error: 'Publisher client not configured.' };
    }

    try {
      await publisher.purchases.subscriptions.acknowledge({
        packageName: this.packageName,
        subscriptionId: productId,
        token: purchaseToken
      });
      return { acknowledged: true };
    } catch (err) {
      console.error('[GOOGLE PLAY ACKNOWLEDGE ERROR]:', err.message);
      return { acknowledged: false, error: err.message };
    }
  }
}

module.exports = new GooglePlayService();
