const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const googlePlayController = require('../controllers/googlePlay.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { googlePlayVerifyLimiter } = require('../middlewares/rateLimit.middleware');

// Public Payment & Checkout Endpoints (Web / PWA Razorpay)
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);
router.post('/razorpay/verify-and-register', paymentController.verifyAndRegister);
router.post('/razorpay/webhook', paymentController.handleRazorpayWebhook);
router.post('/create-qr', paymentController.createUPIInvoiceQR);

// Authenticated Payment Endpoints (Web / PWA Razorpay)
router.post('/razorpay/verify-payment', authenticate, paymentController.verifyRazorpayPayment);
router.post('/confirm-static', authenticate, authorize('superadmin'), paymentController.confirmStaticPayment);

// Google Play Billing Endpoints (Android App Subscriptions)
router.get('/google-play/plans', googlePlayController.getGooglePlayPlans);
router.get('/google-play/status', googlePlayController.getGooglePlayStatus);
router.get('/google-play/upgrade-token', authenticate, googlePlayVerifyLimiter, googlePlayController.getUpgradePurchaseToken);
router.post('/google-play/verify', authenticate, googlePlayVerifyLimiter, googlePlayController.verifyGooglePlayPurchase);
router.post('/google-play/rtdn-webhook', googlePlayController.handleGooglePlayRTDN);

module.exports = router;
