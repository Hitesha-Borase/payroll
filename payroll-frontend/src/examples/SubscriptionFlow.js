/**
 * Subscription & Payment System Integration Example
 * 
 * This example demonstrates the end-to-end flow for integrating the subscription system
 * on the frontend using the new APIs.
 */

import { adminAPI, publicAPI } from '../services/api';

// 1. Landing Page: Fetch Active Plans
const loadPlans = async () => {
    try {
        const response = await publicAPI.getActivePlans();
        if (response.data.success) {
            console.log('Available Plans:', response.data.data);
            // Render Plan Cards...
        }
    } catch (error) {
        console.error('Failed to load plans', error);
    }
};

// 2. Admin: Check Subscription Status (Middleware Check)
const checkSubscription = async () => {
    try {
        const response = await adminAPI.getSubscriptionStatus();
        const subscription = response.data.data;

        // Check Status
        if (!subscription || subscription.status === 'expired') {
            // Redirect to /upgrade-plan or show "Expired" alert
            console.warn('Your plan has expired. Please renew to continue.');
            return false;
        }
        return true; // Active
    } catch (error) {
        // 404 means no subscription found
        console.warn('Subscription check failed', error);
    }
};

// 3. Purchase Plan (Mock Gateway Integration)
const handlePurchase = async (planId) => {
    try {
        // In a real flow, you might collect card details here for the "mock" gateway 
        // or just pass a method ID.
        const purchaseData = {
            plan_id: planId,
            payment_method: 'credit_card', // or 'paypal', etc.
        };

        const response = await adminAPI.purchasePlan(purchaseData);

        if (response.data.success) {
            console.log('Purchase Successful!', response.data.data);
            console.log('New Subscription:', response.data.data.subscription);
            console.log('Invoice:', response.data.data.invoice);

            // Refresh user state / Redirect to Dashboard
            window.location.href = '/admin/dashboard';
        }
    } catch (error) {
        console.error('Purchase Failed:', error.response?.data?.message || error.message);
        console.warn('Payment failed. Please try again.');
    }
};

// 4. View Payment History
const loadPaymentHistory = async () => {
    try {
        const response = await adminAPI.getMyPayments();
        if (response.data.success) {
            console.log('Payment History:', response.data.data);
            // Render Table...
        }
    } catch (error) {
        console.error('Error fetching payments', error);
    }
};

export default {
    loadPlans,
    checkSubscription,
    handlePurchase,
    loadPaymentHistory
};
