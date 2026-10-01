/**
 * Helper to dynamically load Razorpay Checkout SDK script and open Razorpay Checkout Modal
 */

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = async ({
  key_id,
  order_id,
  amount,
  currency = 'INR',
  name = 'Kiaan Technology | Payroll & HRMS',
  description = 'Subscription Plan Purchase',
  image = '/logo.png',
  prefill = {},
  onSuccess,
  onDismiss
}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Failed to load Razorpay Payment Gateway. Please check your internet connection.');
    return;
  }

  const options = {
    key: key_id || 'rzp_test_kiaan_payroll_key',
    amount: amount,
    currency: currency,
    name: name,
    description: description,
    image: image,
    order_id: order_id,
    prefill: {
      name: prefill.name || '',
      email: prefill.email || '',
      contact: prefill.phone || ''
    },
    theme: {
      color: '#C62828'
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess(response);
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) {
          onDismiss();
        }
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
