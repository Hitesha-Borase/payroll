import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Sparkles, ChevronRight, X, ShieldCheck, Zap } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { publicAPI } from '../services/api';
import { useRegional, REGIONAL_EDITIONS } from '../context/RegionalContext';
import './PayrollPricingSection.css';

const plansData = [
  {
    id: 'trial',
    badge: 'TEST DRIVE',
    name: 'FREE TRIAL',
    subtitle: 'Experience the full platform core with dummy employee data & attendance log.',
    price: '₹ 0',
    period: '/ 7 days',
    popular: false,
    ctaText: 'START 7-DAY TRIAL',
    features: [
      'Basic Attendance & Salary calculation',
      '1 Department structure setup',
      'Staff profile log access',
      '1 Connected Admin Terminal',
      '7-Day trial duration'
    ]
  },
  {
    id: 'starter',
    badge: 'SMALL TEAMS',
    name: 'STARTER PLAN',
    subtitle: 'Ideal for startups, boutique agencies, and growing small offices.',
    price: '₹ 999',
    period: '/ month',
    popular: false,
    ctaText: 'CHOOSE STARTER',
    features: [
      'Up to 15 Active Employees',
      'Automated Monthly Payroll Runs',
      'Basic Tax & PF/ESI Calculation',
      'Downloadable Payslip PDFs',
      'Email Support'
    ]
  },
  {
    id: 'pro',
    badge: 'MOST POPULAR',
    name: 'PROFESSIONAL',
    subtitle: 'Complete payroll, attendance, and compliance hub for expanding firms.',
    price: '₹ 1,299',
    period: '/ month',
    popular: true,
    ctaText: 'UPGRADE TO PRO',
    features: [
      'Up to 50 Active Employees',
      'Multi-Shift & Attendance Tracking',
      'Overtime & Leave Management',
      'Custom Allowances & Deductions',
      'Priority Support (Phone/Email)'
    ]
  },
  {
    id: 'premium',
    badge: 'HIGH CAPACITY',
    name: 'PREMIUM PLAN',
    subtitle: 'Designed for enterprise workforces requiring statutory automation & portal access.',
    price: '₹ 1,499',
    period: '/ month',
    popular: false,
    ctaText: 'GO PREMIUM',
    features: [
      'Up to 100 Active Employees',
      'Employee & Manager Self-Service Portal',
      'Statutory Compliance & Tax Declarations',
      'Biometric & Mobile Check-in Integration',
      'Dedicated Account Manager'
    ]
  },
  {
    id: 'custom',
    badge: 'ENTERPRISE',
    name: 'CUSTOM PLAN',
    subtitle: 'Tailored limits, dedicated cloud node, custom SLAs & statutory setups.',
    price: 'Custom',
    period: '/ quotes',
    popular: false,
    ctaText: 'REQUEST CUSTOM PLAN',
    features: [
      'Unlimited Employees & Custom Scaling',
      'Custom ERP/HRMS System Integration',
      'Statutory & Complex Compliance Automation',
      'Custom Shift & Biometric Integration',
      '24/7 Dedicated Priority Support'
    ]
  }
];

const faqData = [
  {
    question: 'How does the 7-Day Free Trial work?',
    answer: 'You get full, unrestricted access to the core payroll & attendance features for 7 days. No credit card is required to begin.'
  },
  {
    question: 'Can I switch or upgrade my plan later?',
    answer: 'Yes! You can upgrade your plan or change employee limits from your Admin Dashboard under Billing & Subscriptions anytime.'
  },
  {
    question: 'What happens if our employee count exceeds our current plan limit?',
    answer: 'Our system alerts you when you approach your limit. You can seamlessly upgrade to the next plan tier directly.'
  },
  {
    question: 'Are statutory tax calculations automated?',
    answer: 'Yes, PF, ESI, TDS, professional tax, and state labor regulations are calculated automatically according to current guidelines.'
  },
  {
    question: 'Is our company data encrypted and secure?',
    answer: 'Yes, all sensitive employee salaries and bank information are secured with 256-bit AES database encryption and ISO-compliant cloud storage.'
  }
];

const PayrollPricingSection = ({ onSelectPlan }) => {
  const { edition, changeEdition } = useRegional();
  const [openFaq, setOpenFaq] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFormData, setCustomFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    employeeCount: '',
    requirements: ''
  });
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setLoadingCustom(true);
    setSuccessBanner('');
    try {
      const payload = {
        name: customFormData.contactName,
        email: customFormData.email,
        companyName: customFormData.companyName,
        employeeCount: customFormData.employeeCount,
        requirements: customFormData.requirements
      };
      const res = await publicAPI.createCustomPlanRequest(payload);
      if (res?.data?.success) {
        setSuccessBanner("Thank you! Your payroll customization request has been submitted. Our team will contact you soon.");
        setCustomFormData({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          employeeCount: '',
          requirements: ''
        });
      } else {
        toast.error(res?.data?.message || "Failed to submit custom plan request.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit custom plan request. Please check your inputs.");
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleInitiatePayment = (plan) => {
    const localizedPlan = {
      ...plan,
      price: edition?.prices?.[plan.id] || plan.price,
      currency: edition?.currency || '₹',
      currencyCode: edition?.currencyCode || 'INR'
    };
    if (onSelectPlan) {
      onSelectPlan(localizedPlan);
      return;
    }
    if (plan.id === 'custom') {
      setShowCustomModal(true);
      return;
    }
    window.location.href = `/register?plan=${plan.id}`;
  };

  return (
    <section id="pricing" className="py-5 position-relative" style={{ backgroundColor: '#FFF7F7', color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Background glow effects */}
      <div 
        className="position-absolute" 
        style={{ 
          top: '20%', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '600px', 
          height: '600px', 
          background: 'radial-gradient(circle, rgba(198, 40, 40, 0.05) 0%, transparent 70%)', 
          pointerEvents: 'none',
          zIndex: 0 
        }} 
      />

      <div className="container py-4 position-relative" style={{ zIndex: 1 }}>

        {/* SECTION HEADER */}
        <div className="text-center mb-4">
          <div 
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" 
            style={{ 
              backgroundColor: 'rgba(198, 40, 40, 0.08)', 
              border: '1px solid rgba(198, 40, 40, 0.25)', 
              color: '#C62828', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              letterSpacing: '1px' 
            }}
          >
            <Sparkles size={14} />
            TRANSPARENT PRICING PLANS
          </div>
          <h2 className="display-6 fw-extrabold mb-3" style={{ fontSize: '2.5rem', color: '#0F172A', letterSpacing: '-0.5px' }}>
            Choose Your <span style={{ color: '#C62828' }}>Perfect Plan</span>
          </h2>
          <p className="mx-auto mb-0" style={{ maxWidth: '650px', color: '#475569', fontSize: '1rem', lineHeight: '1.6' }}>
            Flexible packages scaled exactly to your employee headcount. Real-time pricing managed directly by platform administration.
          </p>
        </div>

        {/* 5-CARD PRICING GRID (Red & White Theme) */}
        <div className="row g-3 mb-5 justify-content-center pt-2">
          {plansData.map((plan) => (
            <div key={plan.id} className="pricing-card-col mb-3">
              <motion.div
                className="h-100 p-4 rounded-4 position-relative d-flex flex-column justify-content-between"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: plan.popular ? '2px solid #C62828' : '1px solid #E2E8F0',
                  borderRadius: '22px',
                  boxShadow: plan.popular ? '0 16px 40px rgba(198, 40, 40, 0.18)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{ y: -8, boxShadow: '0 16px 36px rgba(198, 40, 40, 0.15)' }}
              >
                {/* Popular Ribbon Badge */}
                {plan.popular && (
                  <div
                    className="position-absolute top-0 end-0 px-3 py-1 fw-bold text-white shadow-sm"
                    style={{
                      backgroundColor: '#C62828',
                      borderTopRightRadius: '20px',
                      borderBottomLeftRadius: '10px',
                      fontSize: '0.7rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div>
                  {/* Top Pill Badge */}
                  <div
                    className="d-inline-block px-3 py-1 rounded-pill fw-bold mb-3"
                    style={{
                      backgroundColor: plan.popular ? 'rgba(198, 40, 40, 0.1)' : '#F1F5F9',
                      color: plan.popular ? '#C62828' : '#475569',
                      fontSize: '0.72rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {plan.badge}
                  </div>

                  {/* Plan Name */}
                  <h4 className="fw-bold mb-2" style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: '800' }}>{plan.name}</h4>
                  <p className="small mb-3" style={{ color: '#64748B', minHeight: '48px', fontSize: '0.82rem', lineHeight: '1.5' }}>
                    {plan.subtitle}
                  </p>

                  {/* Price */}
                  <div className="d-flex align-items-baseline gap-1 mb-4 pb-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                    <span className="display-6 fw-bold" style={{ fontSize: '2.1rem', color: '#0F172A', fontWeight: '900' }}>
                      {edition?.prices?.[plan.id] || plan.price}
                    </span>
                    <span className="small font-medium" style={{ color: '#64748B', fontSize: '0.85rem' }}>{plan.period}</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="list-unstyled d-flex flex-column gap-2.5 mb-4 small" style={{ color: '#334155', fontSize: '0.83rem' }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="d-flex align-items-start gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                          style={{ width: '18px', height: '18px', backgroundColor: '#DCFCE7', color: '#16A34A' }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span style={{ color: '#334155', lineHeight: '1.4' }}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA Button */}
                <button
                  type="button"
                  onClick={() => handleInitiatePayment(plan)}
                  className="btn w-100 py-2.5 rounded-pill fw-bold text-nowrap d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  style={{
                    background: plan.popular ? 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)' : '#FFFFFF',
                    color: plan.popular ? '#FFFFFF' : '#0F172A',
                    border: plan.popular ? 'none' : '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{plan.ctaText}</span>
                  <ChevronRight size={15} />
                </button>
              </motion.div>
            </div>
          ))}
        </div>

        {/* FREQUENTLY ASKED QUESTIONS (Red & White Theme) */}
        <div className="mt-5 pt-5 border-top" style={{ borderColor: 'rgba(198, 40, 40, 0.12)' }}>
          <div className="text-center mb-5">
            <div 
              className="d-inline-flex align-items-center gap-2 px-3.5 py-1.5 rounded-pill mb-3" 
              style={{ 
                backgroundColor: 'rgba(198, 40, 40, 0.08)', 
                border: '1px solid rgba(198, 40, 40, 0.25)', 
                color: '#C62828', 
                fontSize: '0.82rem', 
                fontWeight: '700',
                letterSpacing: '0.5px' 
              }}
            >
              <Sparkles size={14} />
              <span>GOT QUESTIONS?</span>
            </div>
            <h3 className="fw-extrabold mb-3" style={{ fontSize: '2.2rem', color: '#0F172A', letterSpacing: '-0.5px' }}>
              Frequently Asked <span style={{ color: '#C62828' }}>Questions</span>
            </h3>
            <p className="mx-auto mb-0" style={{ maxWidth: '620px', color: '#64748B', fontSize: '1rem', lineHeight: '1.65' }}>
              Everything you need to know about setting up, plan tiers, and running automated payroll with Kiaan Technology.
            </p>
          </div>

          <div className="mx-auto" style={{ maxWidth: '850px' }}>
            <div className="d-flex flex-column gap-3">
              {faqData.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="overflow-hidden"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: isOpen ? '1.5px solid #C62828' : '1.5px solid #E2E8F0',
                      borderRadius: '16px',
                      boxShadow: isOpen ? '0 10px 30px rgba(198, 40, 40, 0.08)' : '0 2px 10px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-100 d-flex align-items-center justify-content-between text-start bg-transparent border-0"
                      style={{ 
                        padding: '18px 24px', 
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 pe-3">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: isOpen ? 'rgba(198, 40, 40, 0.1)' : '#F8FAFC',
                            color: isOpen ? '#C62828' : '#64748B',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <span 
                          style={{ 
                            fontSize: '1.02rem', 
                            fontWeight: isOpen ? '700' : '600', 
                            color: isOpen ? '#C62828' : '#0F172A',
                            lineHeight: '1.4',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {faq.question}
                        </span>
                      </div>

                      <div 
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ms-2"
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          backgroundColor: isOpen ? '#C62828' : '#F1F5F9',
                          color: isOpen ? '#FFFFFF' : '#64748B',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <ChevronDown
                          size={18}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <div 
                            style={{ 
                              padding: '12px 24px 20px 68px', 
                              color: '#475569', 
                              fontSize: '0.94rem', 
                              lineHeight: '1.7',
                              borderTop: '1px dashed #F1F5F9'
                            }}
                          >
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PayrollPricingSection;
