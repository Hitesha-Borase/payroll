import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import api, { publicAPI, adminAPI } from '../../services/api';
import Navbar from '../../Layout/Navbar';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import ClientTestimonials from '../../components/ClientTestimonials';
import PaymentReceiptModal from '../../components/PaymentReceiptModal';
import TrialExpiryModal from '../../components/TrialExpiryModal';
import { ShieldCheck, CheckCircle2, Zap, ArrowRight, Lock, Clock, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRegional } from '../../context/RegionalContext';
import { isNativeApp } from '../../utils/platform';
import {
  GOOGLE_PLAY_PLANS,
  fetchPlayProducts,
  purchasePlaySubscription,
  restorePlayPurchases
} from '../../services/googleBilling';

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { formatCurrency, convertAmount, currencyCode } = useRegional();
  const [plans, setPlans] = useState([]);
  const [playPlans, setPlayPlans] = useState(GOOGLE_PLAY_PLANS);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  
  // Step 1: Selected Plan Modal State (Web Razorpay)
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Step 3: Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Trial Expiry State
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [showTrialPopup, setShowTrialPopup] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const isNative = isNativeApp();

      if (isNative) {
        const [subRes, livePlayPlans] = await Promise.all([
          adminAPI.getMySubscription().catch(() => null),
          fetchPlayProducts().catch(() => GOOGLE_PLAY_PLANS)
        ]);

        if (livePlayPlans && livePlayPlans.length > 0) {
          setPlayPlans(livePlayPlans);
        }

        if (subRes?.data?.success && subRes.data.data) {
          processSubscription(subRes.data.data);
        }
      } else {
        const [plansRes, subRes] = await Promise.all([
          publicAPI.getActivePlans(),
          adminAPI.getMySubscription().catch(() => null)
        ]);

        if (plansRes?.data?.success && Array.isArray(plansRes.data.data)) {
          setPlans(plansRes.data.data);
        }
        if (subRes?.data?.success && subRes.data.data) {
          processSubscription(subRes.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching plans & subscription:', error);
      toast.error('Failed to load pricing plans from server.');
    } finally {
      setLoading(false);
    }
  };

  const processSubscription = (sub) => {
    setCurrentSub(sub);
    if (sub.end_date) {
      const end = new Date(sub.end_date).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      setTrialDaysRemaining(diffDays);
      
      const expired = diffDays <= 0 || sub.status === 'expired';
      setIsTrialExpired(expired);

      if (diffDays <= 2 || expired) {
        setShowTrialPopup(true);
      }
    }
  };

  // Google Play Native Purchase Flow
  const handleGooglePlayPurchase = async (plan) => {
    setProcessing(true);
    const toastId = toast.loading(`Connecting to Google Play for ${plan.name}...`);
    try {
      let oldToken = null;
      // Fetch active google_purchase_token securely via server endpoint to prevent token exposure
      if (currentSub?.payment_gateway === 'google_play' || currentSub?.has_google_token) {
        try {
          const tokenRes = await api.get('/payment/google-play/upgrade-token');
          if (tokenRes.data?.success && tokenRes.data?.oldPurchaseToken) {
            oldToken = tokenRes.data.oldPurchaseToken;
          }
        } catch (tErr) {
          console.warn('[GOOGLE_PLAY] Could not fetch upgrade token:', tErr.message);
        }
      }
      const res = await purchasePlaySubscription(plan.productId, plan.basePlanId, oldToken);
      if (res?.success) {
        toast.success(`Successfully subscribed to ${plan.name}!`, { id: toastId });
        setReceiptData({
          planName: plan.name,
          amount: plan.price,
          razorpayOrderId: res.data?.order_id || 'GPA.GOOGLE-PLAY',
          razorpayPaymentId: res.data?.order_id || 'GOOGLE_PLAY_BILLING',
          paymentDate: new Date().toLocaleDateString('en-IN'),
          startDate: new Date().toLocaleDateString('en-IN'),
          endDate: res.data?.end_date ? new Date(res.data.end_date).toLocaleDateString('en-IN') : '1 Month'
        });
        setShowReceipt(true);
        fetchData();
      } else if (res?.isPending) {
        toast(res.message || 'Payment is pending processing by Google Play.', { id: toastId, icon: '⏳' });
      } else {
        toast.error(res?.message || 'Google Play activation could not be verified.', { id: toastId });
      }
    } catch (err) {
      if (err.message && err.message.includes('USER_CANCELED')) {
        toast('Purchase canceled.', { id: toastId, icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.message || err.message || 'Google Play purchase failed.', { id: toastId });
      }
    } finally {
      setProcessing(false);
    }
  };

  // Google Play Restore Purchases
  const handleRestorePurchases = async () => {
    setRestoring(true);
    const toastId = toast.loading('Checking Google Play for previous subscriptions...');
    try {
      const res = await restorePlayPurchases();
      toast.success(res.message, { id: toastId });
      if (res.restoredCount > 0) {
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to restore purchases.', { id: toastId });
    } finally {
      setRestoring(false);
    }
  };

  // Web / PWA Razorpay Flow
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const handleInitiateRazorpay = async () => {
    if (!selectedPlan) return;
    setProcessing(true);

    try {
      const convertedAmount = convertAmount(selectedPlan.price, 'INR', currencyCode);

      const orderRes = await adminAPI.createSubscriptionOrder({
        plan_id: selectedPlan.id,
        amount: convertedAmount,
        currency: currencyCode
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Could not create payment order');
      }

      const { order_id, key_id, amount, currency } = orderRes.data.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: 'Kiaan Technology Private Limited',
        description: `Subscription: ${selectedPlan.name} Plan`,
        order_id: order_id,
        handler: async function (response) {
          try {
            setProcessing(true);
            const verifyRes = await adminAPI.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: selectedPlan.id
            });

            if (verifyRes.data?.success) {
              toast.success('Subscription successfully upgraded!');
              setShowPlanModal(false);
              setReceiptData({
                planName: selectedPlan.name,
                amount: selectedPlan.price,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                paymentDate: new Date().toLocaleDateString('en-IN'),
                startDate: new Date().toLocaleDateString('en-IN'),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
              });
              setShowReceipt(true);
              fetchData();
            } else {
              toast.error(verifyRes.data?.message || 'Payment verification failed');
            }
          } catch (verErr) {
            toast.error(verErr.response?.data?.message || 'Signature validation failed');
          } finally {
            setProcessing(false);
          }
        },
        theme: {
          color: '#10B981'
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Razorpay SDK failed to load. Please refresh.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#022C22', minHeight: '100vh', color: '#ECFDF5', paddingBottom: '60px' }}>
      <Navbar />

      <Container className="py-5" style={{ maxWidth: '1300px' }}>
        
        {/* Header */}
        <div className="text-center mb-5">
          <Badge bg="success" style={{ backgroundColor: '#047857', fontSize: '13px', padding: '8px 18px', borderRadius: '20px', fontWeight: '700' }}>
            <Sparkles size={14} className="me-1 inline" /> KIAAN PAYROLL &amp; HRMS SAAS PRICING
          </Badge>

          <h1 style={{ fontSize: '36px', fontWeight: '800', marginTop: '16px', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Enterprise Subscription Plans
          </h1>
          <p style={{ color: '#A7F3D0', fontSize: '16px', maxWidth: '680px', margin: '8px auto 0 auto' }}>
            {isNativeApp()
              ? 'Select your organization subscription plan. Securely managed and billed through Google Play.'
              : 'Select the ideal SaaS plan for your organization. All paid tiers include automated payroll calculation, statutory compliance, biometric sync, and instant setup.'}
          </p>

          {isNativeApp() && (
            <div className="mt-3">
              <Button
                variant="outline-light"
                size="sm"
                disabled={restoring}
                onClick={handleRestorePurchases}
                style={{ borderRadius: '20px', fontSize: '13px', padding: '6px 18px', borderColor: '#34D399', color: '#34D399' }}
              >
                <RefreshCw size={14} className={`me-2 inline ${restoring ? 'spin' : ''}`} />
                {restoring ? 'Restoring...' : 'Restore Past Google Play Purchases'}
              </Button>
            </div>
          )}
        </div>

        {/* Current Active Subscription Banner */}
        {currentSub && (
          <Card style={{
            backgroundColor: 'rgba(6, 78, 59, 0.9)',
            border: '2px solid #059669',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            marginBottom: '40px',
            color: '#ECFDF5'
          }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <span className="text-uppercase fw-bold text-success" style={{ fontSize: '12px', letterSpacing: '1px' }}>Active Subscription Status</span>
                <h4 style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#FFFFFF' }}>
                  {currentSub.plan?.name || currentSub.plan_name || 'Free Trial Plan'}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#A7F3D0' }}>
                  Expires on: <strong>{currentSub.end_date ? new Date(currentSub.end_date).toLocaleDateString('en-IN') : 'Ongoing'}</strong>
                  {currentSub.payment_gateway && (
                    <span className="ms-2 badge bg-dark text-capitalize" style={{ fontSize: '11px' }}>
                      via {currentSub.payment_gateway.replace('_', ' ')}
                    </span>
                  )}
                </p>
              </div>

              <div className="d-flex align-items-center gap-3">
                <Badge bg={isTrialExpired ? 'danger' : (trialDaysRemaining <= 2 ? 'warning' : 'success')} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '20px' }}>
                  <Clock size={14} className="me-1" />
                  {isTrialExpired ? 'EXPIRED' : (trialDaysRemaining !== null ? `${trialDaysRemaining} Days Remaining` : 'ACTIVE')}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Native Android Google Play Subscriptions */}
        {isNativeApp() ? (
          <div>
            <div className="mb-4 text-center">
              <span className="badge px-3 py-2" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399', border: '1px solid #059669', fontSize: '13px' }}>
                <ShieldCheck size={14} className="me-1 inline" /> Google Play In-App Subscriptions (Auto-Renewable Monthly)
              </span>
            </div>

            <Row className="g-4 align-items-stretch justify-content-center">
              {playPlans.map(plan => {
                const isPopular = plan.popular;
                return (
                  <Col key={plan.id} lg={4} md={6} sm={12}>
                    <Card style={{
                      backgroundColor: isPopular ? '#064E3B' : 'rgba(4, 120, 87, 0.4)',
                      backdropFilter: 'blur(16px)',
                      border: isPopular ? '2px solid #10B981' : '1px solid #059669',
                      borderRadius: '16px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isPopular ? '0 15px 35px rgba(16, 185, 129, 0.25)' : '0 8px 24px rgba(0,0,0,0.2)',
                      position: 'relative'
                    }}>
                      {isPopular && (
                        <span style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#10B981',
                          color: '#022C22',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Most Popular
                        </span>
                      )}

                      <Card.Body className="p-4 d-flex flex-column">
                        <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                          {plan.name}
                        </h4>
                        <p style={{ color: '#A7F3D0', fontSize: '13px', margin: '6px 0 16px 0' }}>
                          Includes up to {plan.maxEmployees} active staff
                        </p>

                        <div className="mb-3">
                          <span style={{ fontSize: '34px', fontWeight: '900', color: '#FFFFFF' }}>
                            {plan.formattedPrice}
                          </span>
                        </div>

                        <div style={{ backgroundColor: 'rgba(2, 44, 34, 0.6)', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#34D399', fontWeight: '700' }}>
                          👥 Up to {plan.maxEmployees} Employees
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', flexGrow: 1, fontSize: '13px', color: '#D1FAE5' }}>
                          {plan.features.map((feat, idx) => (
                            <li key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <CheckCircle2 size={16} style={{ color: '#10B981', marginTop: '2px', flexShrink: 0 }} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          disabled={processing}
                          onClick={() => handleGooglePlayPurchase(plan)}
                          style={{
                            backgroundColor: isPopular ? '#10B981' : '#059669',
                            borderColor: isPopular ? '#10B981' : '#059669',
                            color: isPopular ? '#022C22' : '#FFFFFF',
                            fontWeight: '800',
                            borderRadius: '10px',
                            padding: '12px',
                            fontSize: '14px',
                            width: '100%',
                            marginTop: 'auto'
                          }}
                        >
                          {processing ? <Spinner animation="border" size="sm" /> : `Subscribe with Google Play →`}
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <div className="text-center mt-4">
              <small style={{ color: '#A7F3D0', fontSize: '12px', lineHeight: 1.6 }}>
                Subscriptions are billed to your Google Play account at confirmation of purchase.
                Subscriptions automatically renew unless canceled in Google Play Subscriptions at least 24 hours before the end of the current billing cycle.
              </small>
            </div>
          </div>
        ) : (
          /* Web / PWA Razorpay Pricing Cards */
          loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-emerald-200" style={{ color: '#A7F3D0' }}>Loading live subscription plans...</p>
            </div>
          ) : (
            <Row className="g-4 align-items-stretch">
              {plans.map(plan => {
                const isCurrent = currentSub?.plan_id === plan.id && !isTrialExpired;
                const isPopular = plan.name === 'Professional' || plan.name === 'Premium';
                const priceVal = parseFloat(plan.price || 0);

                let featuresList = [];
                try {
                  featuresList = typeof plan.features === 'string' ? JSON.parse(plan.features) : (Array.isArray(plan.features) ? plan.features : []);
                } catch (e) {
                  featuresList = ['Automated Payroll Processing', 'PF, ESI & TDS Compliance', 'Employee Self-Service'];
                }

                return (
                  <Col key={plan.id} lg={2} md={4} sm={6} style={{ minWidth: '240px', flexGrow: 1 }}>
                    <Card style={{
                      backgroundColor: isPopular ? '#064E3B' : 'rgba(4, 120, 87, 0.4)',
                      backdropFilter: 'blur(16px)',
                      border: isPopular ? '2px solid #10B981' : '1px solid #059669',
                      borderRadius: '16px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isPopular ? '0 15px 35px rgba(16, 185, 129, 0.25)' : '0 8px 24px rgba(0,0,0,0.2)',
                      position: 'relative'
                    }}
                    className="hover-card"
                    >
                      {isPopular && (
                        <span style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#10B981',
                          color: '#022C22',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Most Popular
                        </span>
                      )}

                      <Card.Body className="p-4 d-flex flex-column">
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                          {plan.name}
                        </h4>
                        <p style={{ color: '#A7F3D0', fontSize: '12px', margin: '4px 0 16px 0', height: '36px', overflow: 'hidden' }}>
                          {plan.description || 'Enterprise payroll management module'}
                        </p>

                        <div className="mb-3">
                          {plan.name.toLowerCase().includes('custom') ? (
                            <span style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF' }}>
                              Let's Talk
                            </span>
                          ) : (
                            <>
                              <span style={{ fontSize: '32px', fontWeight: '900', color: '#FFFFFF' }}>
                                {formatCurrency(priceVal)}
                              </span>
                              <span style={{ color: '#A7F3D0', fontSize: '12px' }}> /{plan.duration_months || 1} Month</span>
                            </>
                          )}
                        </div>

                        <div style={{ backgroundColor: 'rgba(2, 44, 34, 0.6)', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#34D399', fontWeight: '700' }}>
                          👥 {plan.max_employees ? `Up to ${plan.max_employees} Employees` : 'Unlimited Employees'}
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', flexGrow: 1, fontSize: '12px', color: '#D1FAE5' }}>
                          {featuresList.map((feat, idx) => (
                            <li key={idx} style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <CheckCircle2 size={14} style={{ color: '#10B981', marginTop: '2px', flexShrink: 0 }} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          disabled={isCurrent || (priceVal === 0 && !plan.name.toLowerCase().includes('custom'))}
                          onClick={() => {
                            if (plan.name.toLowerCase().includes('custom')) {
                              window.open('https://wa.me/919770273892?text=Hi%20Kiaan%20Technology,%20I%20want%20to%20upgrade%20my%20Payroll%20subscription%20to%20a%20Custom%20Plan.', '_blank');
                            } else {
                              handleSelectPlan(plan);
                            }
                          }}
                          style={{
                            backgroundColor: isCurrent ? '#047857' : (isPopular ? '#10B981' : '#059669'),
                            borderColor: isCurrent ? '#047857' : (isPopular ? '#10B981' : '#059669'),
                            color: isPopular ? '#022C22' : '#FFFFFF',
                            fontWeight: '800',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '13px',
                            width: '100%',
                            marginTop: 'auto'
                          }}
                        >
                          {plan.name.toLowerCase().includes('custom') ? 'Contact Sales' : (isCurrent ? 'Current Active Plan' : (priceVal === 0 ? 'Free Trial Active' : `Select ${plan.name}`))}
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )
        )}

        {/* 5-Star Client Reviews */}
        <ClientTestimonials />

        {/* Footer Links for Privacy & Terms */}
        <div className="text-center mt-5 pt-4 border-top border-success" style={{ borderColor: '#047857 !important' }}>
          <p style={{ color: '#A7F3D0', fontSize: '13px', margin: 0 }}>
            Kiaan Technology Private Limited © 2026. All rights reserved. |
            <button onClick={() => navigate('/privacy-policy')} style={{ background: 'none', border: 'none', color: '#34D399', fontWeight: 'bold', marginLeft: '8px', cursor: 'pointer' }}>
              Privacy Policy
            </button> |
            <button onClick={() => navigate('/terms-conditions')} style={{ background: 'none', border: 'none', color: '#34D399', fontWeight: 'bold', marginLeft: '8px', cursor: 'pointer' }}>
              Terms &amp; Conditions
            </button>
          </p>
        </div>

      </Container>

      {/* Step 1: Selected Plan Confirmation & Razorpay Order Modal (Web only) */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#022C22', color: '#ECFDF5', borderBottom: '2px solid #059669' }}>
          <Modal.Title style={{ fontSize: '16px', fontWeight: '800' }}>
            Step 1: Confirm Plan Selection &amp; Order Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#064E3B', color: '#ECFDF5', padding: '24px' }}>
          {selectedPlan && (
            <div>
              <div style={{ backgroundColor: 'rgba(2, 44, 34, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid #047857', marginBottom: '20px' }}>
                <h4 style={{ color: '#FFFFFF', fontWeight: '800', margin: 0 }}>{selectedPlan.name} Plan</h4>
                <p style={{ color: '#A7F3D0', fontSize: '13px', margin: '4px 0 0 0' }}>{selectedPlan.description}</p>
                
                <hr style={{ borderColor: '#047857', margin: '12px 0' }} />
                
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Subscription Price:</span>
                  <strong style={{ fontSize: '20px', color: '#10B981' }}>{formatCurrency(selectedPlan.price)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '13px' }}>
                  <span>Billing Period:</span>
                  <span>{selectedPlan.duration_months} Month(s)</span>
                </div>
                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '13px' }}>
                  <span>Staff / Employee Limit:</span>
                  <span>{selectedPlan.max_employees ? `${selectedPlan.max_employees} Employees` : 'Unlimited Staff'}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#022C22', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} style={{ color: '#10B981' }} />
                <span>Step 2 will launch Razorpay HMAC-SHA256 secure checkout. Backend computes exact amount from database.</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#022C22', borderTop: '1px solid #047857' }}>
          <Button variant="outline-light" onClick={() => setShowPlanModal(false)} style={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            disabled={processing}
            onClick={handleInitiateRazorpay}
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#022C22', fontWeight: '800', borderRadius: '8px' }}
          >
            {processing ? <Spinner animation="border" size="sm" /> : 'Proceed to Step 2: Razorpay Payment →'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Step 3: Verified Payment Receipt Modal */}
      <PaymentReceiptModal
        show={showReceipt}
        onHide={() => setShowReceipt(false)}
        receiptData={receiptData}
      />

      {/* Trial Expiry Auto Popup Modal (Triggers when remaining days <= 2) */}
      <TrialExpiryModal
        show={showTrialPopup}
        onHide={() => setShowTrialPopup(false)}
        daysRemaining={trialDaysRemaining}
        isExpired={isTrialExpired}
        onUpgradeClick={() => {
          setShowTrialPopup(false);
        }}
      />

      {/* Floating WhatsApp Support Widget */}
      <WhatsAppWidget />
    </div>
  );
};

export default UpgradePlan;
