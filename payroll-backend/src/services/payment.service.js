/**
 * Razorpay Payment Gateway Service
 * Manages Razorpay SDK initialization, Order creation, and HMAC SHA256 Signature Verification.
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/mysql');

class PaymentService {
  constructor() {
    this.razorpayInstance = null;
  }

  /**
   * Get or initialize Razorpay SDK Instance
   */
  getRazorpayInstance() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_id.startsWith('rzp_test_kiaan_') || process.env.NODE_ENV === 'test') {
      return null; // Fallback to test order mode if keys are placeholders or in test environment
    }

    if (!this.razorpayInstance) {
      this.razorpayInstance = new Razorpay({
        key_id,
        key_secret
      });
    }

    return this.razorpayInstance;
  }

  /**
   * Create Razorpay Order
   * @param {number} amountInPaise
   * @param {string} currency
   * @param {object} notes
   */
  async createOrder(amountInPaise, currency = 'INR', notes = {}) {
    const instance = this.getRazorpayInstance();

    if (instance) {
      const options = {
        amount: Math.round(amountInPaise),
        currency,
        receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        notes
      };
      const order = await instance.orders.create(options);
      return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
        is_live: true
      };
    }

    // Fallback Mock Order ID for development / testing without live API keys
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      order_id: mockOrderId,
      amount: amountInPaise,
      currency,
      status: 'created',
      receipt: `rcpt_mock_${Date.now()}`,
      is_live: false
    };
  }

  /**
   * Verify Razorpay Payment Signature (HMAC SHA-256)
   * Fails closed if keys, IDs, or signature are absent or invalid.
   * @param {string} orderId
   * @param {string} paymentId
   * @param {string} signature
   * @returns {boolean}
   */
  verifySignature(orderId, paymentId, signature) {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret || !signature || !orderId || !paymentId) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
      const providedBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== providedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Verify Webhook Signature (HMAC SHA-256)
   * Fails closed if secret, body, or signature are absent or invalid.
   * @param {string|Buffer} rawBody
   * @param {string} webhookSignature
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, webhookSignature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !webhookSignature || !rawBody) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const providedBuffer = Buffer.from(webhookSignature, 'utf8');

      if (expectedBuffer.length !== providedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Create Payment Intent (Compatibility wrapper for createOrder)
   * Converts standard currency units to smallest currency sub-units (paise/cents).
   * @param {number} amount
   * @param {string} currency
   * @param {object} notes
   */
  async createPaymentIntent(amount, currency = 'INR', notes = {}) {
    const amountInPaise = Math.round(Number(amount || 0) * 100);
    const order = await this.createOrder(amountInPaise, currency, notes);
    return {
      order_id: order.order_id,
      transactionId: order.order_id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
      is_live: order.is_live
    };
  }

  /**
   * Verify Payment (Compatibility wrapper for verifySignature)
   * Fails closed if any identifier or signature is missing or fails HMAC validation.
   * @param {string} orderId
   * @param {string} paymentId
   * @param {string} signature
   */
  async verifyPayment(orderId, paymentId, signature) {
    if (!orderId || !paymentId || !signature) {
      return {
        success: false,
        message: 'Order ID, Payment ID, and Signature are required for payment verification.'
      };
    }
    const isValid = this.verifySignature(orderId, paymentId, signature);
    return {
      success: isValid,
      transactionId: paymentId,
      message: isValid ? 'Payment verified successfully.' : 'Payment signature verification failed.'
    };
  }

  /**
   * Fetch payment details directly from Razorpay Gateway
   * @param {string} paymentId
   */
  async fetchPayment(paymentId) {
    if (!paymentId) return null;
    const instance = this.getRazorpayInstance();
    if (instance) {
      try {
        return await instance.payments.fetch(paymentId);
      } catch (err) {
        console.error('[RAZORPAY_FETCH_ERROR]:', err?.error?.description || err.message);
        return null;
      }
    }
    // In automated testing environment, support mock hook if configured
    if (process.env.NODE_ENV === 'test' && typeof this.mockPaymentFetcher === 'function') {
      return this.mockPaymentFetcher(paymentId);
    }
    return null;
  }

  /**
   * Verify Payment Server-Side Beyond Signature
   * Validates:
   * 1. HMAC-SHA256 Signature
   * 2. Gateway Capture Status (status === 'captured')
   * 3. Order ID matching gateway record
   * 4. Amount matching expected plan price in paise
   * 5. Currency matching expected currency
   * @param {Object} options
   * @param {string} options.orderId
   * @param {string} options.paymentId
   * @param {string} options.signature
   * @param {number} options.expectedAmountInPaise
   * @param {string} options.expectedCurrency
   */
  async verifyAndValidatePayment({ orderId, paymentId, signature, expectedAmountInPaise, expectedCurrency = 'INR' }) {
    if (!orderId || !paymentId || !signature) {
      return {
        isValid: false,
        error: 'Payment verification failed: order ID, payment ID, and signature are required.'
      };
    }

    // Step 1: Cryptographic HMAC-SHA256 signature validation
    const isValidSignature = this.verifySignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      return {
        isValid: false,
        error: 'Invalid Razorpay payment signature verification failed.'
      };
    }

    // Step 2: Query Razorpay server-side API to confirm payment exists and is captured
    const payment = await this.fetchPayment(paymentId);

    if (!payment) {
      const instance = this.getRazorpayInstance();
      if (instance) {
        return {
          isValid: false,
          error: 'Unable to verify payment with payment gateway. Payment was not found.'
        };
      }
      // If running in live production without valid keys configured
      if (process.env.NODE_ENV === 'production') {
        return {
          isValid: false,
          error: 'Payment gateway configuration is missing or inactive on server.'
        };
      }
      // In test / development without live API keys, synthesize verified payment matching order
      return {
        isValid: true,
        payment: {
          id: paymentId,
          order_id: orderId,
          amount: expectedAmountInPaise,
          currency: expectedCurrency,
          status: 'captured'
        }
      };
    }

    // Step 3: Confirm payment status is captured
    if (payment.status !== 'captured') {
      return {
        isValid: false,
        error: `Payment cannot be accepted. Expected captured status, but gateway reported: '${payment.status}'.`
      };
    }

    // Step 4: Confirm payment belongs to expected order
    if (payment.order_id && payment.order_id !== orderId) {
      return {
        isValid: false,
        error: `Payment order mismatch. Payment belongs to order '${payment.order_id}', not '${orderId}'.`
      };
    }

    // Step 5: Confirm amount matches expected plan price
    if (expectedAmountInPaise !== undefined && expectedAmountInPaise !== null) {
      if (Number(payment.amount) !== Number(expectedAmountInPaise)) {
        return {
          isValid: false,
          error: `Payment amount mismatch. Expected: ${expectedAmountInPaise} paise, but gateway recorded: ${payment.amount} paise.`
        };
      }
    }

    // Step 6: Confirm currency matches
    if (expectedCurrency && payment.currency && payment.currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
      return {
        isValid: false,
        error: `Payment currency mismatch. Expected: ${expectedCurrency}, but gateway recorded: ${payment.currency}.`
      };
    }

    return { isValid: true, payment };
  }
}

module.exports = new PaymentService();

