import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import Captcha from './Captcha';
import { publicAPI, authAPI } from '../services/api';
import { useRegional } from '../context/RegionalContext';
import './RegistrationForm.css';

// ========== EMAIL NOTIFICATION CONFIGURATION ==========
const SEND_EMAIL_NOTIFICATION = true;
// ======================================================

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const { convertAmount, currencyCode } = useRegional();

  // URL search params for plan selection
  const searchParams = new URLSearchParams(window.location.search);
  const planParam = searchParams.get('plan');
  const isPlanCheckout = !!planParam;

  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);

  const captchaRef = useRef(null);

  useEffect(() => {
    if (isPlanCheckout) {
      fetchPlans();
    }
  }, [isPlanCheckout]);

  const fetchPlans = async () => {
    try {
      const res = await publicAPI.getActivePlans();
      if (res?.data?.success) {
        const fetchedPlans = res.data.data;
        setPlans(fetchedPlans);
        let matchedPlan = null;
        if (planParam === 'starter') matchedPlan = fetchedPlans.find(p => p.name.toLowerCase().includes('starter'));
        else if (planParam === 'pro') matchedPlan = fetchedPlans.find(p => p.name.toLowerCase().includes('pro'));
        else if (planParam === 'premium') matchedPlan = fetchedPlans.find(p => p.name.toLowerCase().includes('premium'));
        else if (planParam === 'trial') matchedPlan = fetchedPlans.find(p => p.name.toLowerCase().includes('trial') || p.price == 0);

        if (matchedPlan) setActivePlan(matchedPlan);
        else setActivePlan(fetchedPlans[0]);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (captchaRef.current && !captchaRef.current.validate()) {
      return;
    }

    setLoading(true);

    // 1. PLAN CHECKOUT WITH PAYMENT
    if (isPlanCheckout) {
      if (!activePlan) {
        setError('No valid subscription plan selected.');
        setLoading(false);
        return;
      }

      try {
        const convertedAmount = convertAmount(activePlan.price, 'INR', currencyCode);
        const orderRes = await publicAPI.createRazorpayOrder({
          plan_id: activePlan.id,
          amount: convertedAmount,
          currency: currencyCode,
        });

        if (!orderRes?.data?.success) throw new Error('Failed to create payment order');

        const { order_id, key_id, amount, currency, plan_name } = orderRes.data.data;

        const options = {
          key: key_id,
          amount: amount,
          currency: currency,
          name: 'Kiaan Technology',
          description: `${plan_name} SaaS Subscription`,
          image: '/kt_logo_transparent.png',
          order_id: order_id,
          handler: async function (response) {
            try {
              setLoading(true);
              const verifyRes = await publicAPI.verifyAndRegister({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                company_name: formData.company_name,
                phone: formData.mobile,
                plan_id: activePlan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              });

              if (verifyRes?.data?.success) {
                setSubmitted(true);
              } else {
                setError(verifyRes?.data?.message || 'Payment verification failed.');
              }
            } catch (err) {
              setError(err.response?.data?.message || 'Payment verification failed.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.mobile,
          },
          theme: { color: '#C62828' },
        };

        if (window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            setError('Payment failed: ' + response.error.description);
          });
          rzp.open();
        } else {
          // Fallback test
          const verifyRes = await publicAPI.verifyAndRegister({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            company_name: formData.company_name,
            phone: formData.mobile,
            plan_id: activePlan.id,
            razorpay_order_id: order_id,
            razorpay_payment_id: `pay_${Date.now()}_test`,
          });
          if (verifyRes?.data?.success) {
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Payment initiation failed.');
      } finally {
        setLoading(false);
      }
    } else {
      // 2. STANDARD COMPANY ACCOUNT REGISTRATION (FREE TRIAL / ONBOARDING)
      try {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: 'employer',
          phone: formData.mobile.trim(),
          company_name: formData.company_name.trim(),
        };

        const response = await authAPI.register(payload);

        if (response?.data?.success) {
          const authData = response.data.data;
          if (authData?.accessToken) {
            localStorage.setItem('authToken', authData.accessToken);
            localStorage.setItem('refreshToken', authData.refreshToken);
            localStorage.setItem('user', JSON.stringify(authData.user));
            localStorage.setItem('userRole', authData.user?.role || 'employer');
            localStorage.setItem('userEmail', authData.user?.email || formData.email);
            localStorage.setItem('userId', authData.user?.id);
          }

          // Email notification
          if (SEND_EMAIL_NOTIFICATION) {
            try {
              const SERVICE_ID = 'service_ebslx2i';
              const TEMPLATE_ID = 'template_y5xlrd7';
              const PUBLIC_KEY = 'pRZwgHFV3aMU8kXab';

              const templateParams = {
                to_email: 'info@kiaantechnology.com',
                user_name: formData.name,
                user_email: formData.email,
                message: `New Company Account Registered:\nCompany: ${formData.company_name}\nAdmin: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.mobile}`,
                source: 'Corporate Registration Form',
              };

              await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            } catch (emailError) {
              console.warn('Email notification skipped:', emailError);
            }
          }

          setSubmitted(true);
        } else {
          setError(response?.data?.message || 'Registration failed. Please try again.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        setError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="reg-page-wrapper">
      <motion.div
        className="reg-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Top Header Bar */}
        <div className="reg-top-bar">
          <div className="reg-trial-badge">
            FREE TRIAL — $0 7 DAYS FREE
          </div>
          <button type="button" onClick={handleBackToHome} className="reg-back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Success State */}
        {submitted ? (
          <motion.div
            className="reg-success-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="reg-success-icon">
              <CheckCircle2 size={44} />
            </div>
            <h2 className="reg-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              Account Created Successfully!
            </h2>
            <p className="reg-subtitle" style={{ maxWidth: '480px', margin: '0 auto 1.75rem auto' }}>
              Welcome to Kiaan Technology. Your company account for <strong>{formData.company_name || 'your organization'}</strong> is now ready.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="reg-submit-btn"
                style={{ maxWidth: '240px', marginTop: 0 }}
                onClick={() => navigate('/employer/dashboard')}
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                className="reg-back-link"
                style={{ padding: '0.75rem 1.25rem', border: '1px solid #E2E8F0', borderRadius: '12px' }}
                onClick={handleBackToHome}
              >
                Home
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header Title & Subtitle */}
            <div className="reg-header">
              <h1 className="reg-title">Create Your Company Account</h1>
              <p className="reg-subtitle">
                Quick 2-minute setup. Start managing your workforce &amp; payroll instantly.
              </p>
            </div>

            {/* Plan Checkout Banner */}
            {isPlanCheckout && activePlan && (
              <div className="reg-alert-plan" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <strong>{activePlan.name} Plan:</strong> ₹{activePlan.price} / {activePlan.duration_months} Month(s)
                </div>
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>Selected Plan</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="reg-alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Main 2-Column Form */}
            <form onSubmit={handleSubmit}>
              <div className="reg-form-grid">
                {/* 1. Company / Business Name */}
                <div className="reg-field-group">
                  <label className="reg-label" htmlFor="company_name">
                    Company / Business Name <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-box">
                    <Building2 size={18} className="reg-input-icon" />
                    <input
                      id="company_name"
                      type="text"
                      name="company_name"
                      className="reg-input"
                      placeholder="Company name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* 2. Admin Full Name */}
                <div className="reg-field-group">
                  <label className="reg-label" htmlFor="name">
                    Admin Full Name <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-box">
                    <User size={18} className="reg-input-icon" />
                    <input
                      id="name"
                      type="text"
                      name="name"
                      className="reg-input"
                      placeholder="Admin full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* 3. Work Email */}
                <div className="reg-field-group">
                  <label className="reg-label" htmlFor="email">
                    Work Email <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-box">
                    <Mail size={18} className="reg-input-icon" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="reg-input"
                      placeholder="admin@yourcompany.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* 4. Mobile Number */}
                <div className="reg-field-group">
                  <label className="reg-label" htmlFor="mobile">
                    Mobile Number <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-box">
                    <Phone size={18} className="reg-input-icon" />
                    <input
                      id="mobile"
                      type="tel"
                      name="mobile"
                      className="reg-input"
                      placeholder="98765 43210"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* 5. Password */}
                <div className="reg-field-group">
                  <label className="reg-label" htmlFor="password">
                    Password <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-box">
                    <Lock size={18} className="reg-input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="reg-input reg-input-password"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="reg-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 6. Confirm Password */}
                <div className="reg-field-group">
                  <label className="reg-label" htmlFor="confirmPassword">
                    Confirm Password <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-box">
                    <Lock size={18} className="reg-input-icon" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="reg-input reg-input-password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="reg-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 7. Security Verification CAPTCHA */}
                <div className="reg-captcha-box">
                  <Captcha ref={captchaRef} />
                </div>

                {/* 8. Submit Button */}
                <button
                  type="submit"
                  className="reg-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{isPlanCheckout ? 'Processing Payment...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <span>{isPlanCheckout ? 'Proceed to Payment' : 'Create Company Account'}</span>
                  )}
                </button>

                {/* 9. Footer Login Link */}
                <div className="reg-footer">
                  <span>Already have an account?</span>
                  <Link to="/login" className="reg-login-link">
                    Log in
                  </Link>
                </div>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RegistrationForm;
