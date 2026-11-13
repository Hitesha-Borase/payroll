import { Capacitor, registerPlugin } from '@capacitor/core';
import api from './api';

// Register native Google Play Billing plugin
const GooglePlayBilling = registerPlugin('GooglePlayBilling');

// Canonical Google Play Subscriptions Definition
export const GOOGLE_PLAY_PLANS = [
  {
    id: 'payroll_plan_starter',
    productId: 'payroll_plan_starter',
    basePlanId: 'starter-monthly',
    name: 'Starter Plan',
    price: 700,
    formattedPrice: '₹700 / month',
    billingPeriod: '1 Month',
    maxEmployees: 15,
    popular: false,
    features: [
      'Up to 15 Active Employees',
      'Automated Monthly Payroll & Salary Slips',
      'Direct WhatsApp Slip Delivery',
      'Attendance & Leave Tracking',
      'Standard Email & In-App Support'
    ]
  },
  {
    id: 'payroll_plan_pro',
    productId: 'payroll_plan_pro',
    basePlanId: 'pro-monthly',
    name: 'Professional Plan',
    price: 900,
    formattedPrice: '₹900 / month',
    billingPeriod: '1 Month',
    maxEmployees: 50,
    popular: true,
    features: [
      'Up to 50 Active Employees',
      'Everything in Starter Plan',
      'Job Recruitment & Candidate Tracking',
      'Detailed Compliance & Tax Reports',
      'Custom Allowances & Deductions',
      'Priority Support Assistance'
    ]
  },
  {
    id: 'payroll_plan_premium',
    productId: 'payroll_plan_premium',
    basePlanId: 'premium-monthly',
    name: 'Premium Plan',
    price: 1200,
    formattedPrice: '₹1,200 / month',
    billingPeriod: '1 Month',
    maxEmployees: 100,
    popular: false,
    features: [
      'Up to 100 Active Employees',
      'Everything in Professional Plan',
      'Comprehensive Vendor & Contractor Billing',
      'Advanced Audit Logs & Activity Trails',
      'Unlimited Salary Slip Downloads',
      '24/7 Dedicated Support'
    ]
  }
];

export const isPlayBillingAvailable = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }
  try {
    const res = await GooglePlayBilling.isAvailable();
    return !!res?.available;
  } catch (err) {
    console.warn('[Google Play Billing] Not available:', err.message);
    return false;
  }
};

export const fetchPlayProducts = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return GOOGLE_PLAY_PLANS;
  }
  try {
    const result = await GooglePlayBilling.queryProductDetails();
    const liveProducts = result?.products || [];

    // Merge live Google Play pricing into canonical plans if available
    return GOOGLE_PLAY_PLANS.map(plan => {
      const live = liveProducts.find(p => p.productId === plan.productId);
      if (live && live.offers && live.offers.length > 0) {
        const primaryOffer = live.offers[0];
        return {
          ...plan,
          formattedPrice: primaryOffer.formattedPrice || plan.formattedPrice,
          basePlanId: primaryOffer.basePlanId || plan.basePlanId
        };
      }
      return plan;
    });
  } catch (err) {
    console.warn('[Google Play Billing] Falling back to default plan definitions:', err);
    return GOOGLE_PLAY_PLANS;
  }
};

export const purchasePlaySubscription = async (productId, basePlanId, oldPurchaseToken = null) => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    throw new Error('Google Play Billing is only available on native Android devices.');
  }

  // 1. Launch native Google Play Billing sheet
  const flowParams = {
    productId,
    basePlanId
  };
  if (oldPurchaseToken) {
    flowParams.oldPurchaseToken = oldPurchaseToken;
  }

  const purchaseResult = await GooglePlayBilling.launchPurchaseFlow(flowParams);

  if (!purchaseResult?.purchaseToken) {
    throw new Error('No purchase token returned from Google Play.');
  }

  // Handle pending purchase state (slow payment methods e.g. UPI approval pending)
  if (purchaseResult.isPending || purchaseResult.purchaseState === 2) {
    return {
      success: false,
      isPending: true,
      message: 'Your Google Play purchase is pending confirmation. Your subscription will activate automatically once processed by Google.'
    };
  }

  // 2. Transmit token to backend for authoritative server-side verification and subscription activation
  // Client NEVER grants paid access directly from client callbacks
  const backendResponse = await api.post('payment/google-play/verify', {
    purchase_token: purchaseResult.purchaseToken,
    product_id: productId,
    base_plan_id: basePlanId,
    order_id: purchaseResult.orderId
  });

  // Client-side acknowledgement fallback if backend verification was successful and token is unacknowledged
  if (backendResponse.data?.success && !purchaseResult.isAcknowledged) {
    GooglePlayBilling.acknowledgePurchase({ purchaseToken: purchaseResult.purchaseToken })
      .catch(ackErr => console.warn('[Google Play] Client-side acknowledge fallback note:', ackErr));
  }

  return backendResponse.data;
};

export const restorePlayPurchases = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    throw new Error('Google Play Billing is only available on native Android devices.');
  }

  const result = await GooglePlayBilling.queryPurchases();
  const purchases = result?.purchases || [];

  if (purchases.length === 0) {
    return { restoredCount: 0, message: 'No past subscriptions found on this Google account.' };
  }

  let restoredCount = 0;
  for (const p of purchases) {
    try {
      const productId = p.products?.[0] || 'payroll_plan_starter';
      await api.post('payment/google-play/verify', {
        purchase_token: p.purchaseToken,
        product_id: productId,
        order_id: p.orderId
      });
      restoredCount++;
    } catch (e) {
      console.warn('[Restore Purchase] Sync item failed:', e.response?.data?.message || e.message);
    }
  }

  return {
    restoredCount,
    message: restoredCount > 0
      ? `Successfully restored ${restoredCount} subscription(s).`
      : 'No pending subscriptions needed restoration.'
  };
};

export default {
  GOOGLE_PLAY_PLANS,
  isPlayBillingAvailable,
  fetchPlayProducts,
  purchasePlaySubscription,
  restorePlayPurchases
};

