import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LandingPage.css';
import ContactForm from './src/components/ContactForm';
import WhatsAppWidget from './src/components/WhatsAppWidget';
import { motion, useScroll, useTransform, useInView, useAnimation } from 'framer-motion';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { publicAPI, superadminAPI } from './src/services/api';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

import { 
    Globe, Instagram, Linkedin, Facebook, Mail, MapPin, Phone, Youtube, Building, User, Lock, 
    Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles, X, ArrowRight, Check, 
    CreditCard, Users, Clock, Award, FileText, BarChart3, BookOpen, ChevronRight, Star, Quote, Zap, Menu,
    Briefcase, Database, Wallet, UserCheck, RefreshCw, HelpCircle
} from 'lucide-react';
import { openRazorpayCheckout } from './src/utils/razorpay';
import { isNativeApp, isInstalledPWA } from './src/utils/platform';
import PrivacyPolicyModal from './src/components/PrivacyPolicyModal';
import TermsConditionsModal from './src/components/TermsConditionsModal';
import DocumentationModal from './src/components/DocumentationModal';
import SupportCenterModal from './src/components/SupportCenterModal';
import ContactUsModal from './src/components/ContactUsModal';
import LanguageSwitcher from './src/components/LanguageSwitcher';
import PayrollPricingSection from './src/components/PayrollPricingSection';
import Captcha from './src/components/Captcha';
import { useRegional } from './src/context/RegionalContext';
import payrollPlusLogo from './src/assets/payrollplus_mark.png';
import dashboardShowcase from './src/assets/dashboard_showcase.jpg';

// Official Google Play Store URL (set to string once store listing is approved, null during pre-release review)
const GOOGLE_PLAY_STORE_URL = null;


// Core 6 Real Platform Modules in Red & White Theme
const coreModules = [
    {
        id: 1,
        title: "Automated Payroll & Salary Runs",
        description: "1-Click monthly salary calculation with automated PF, ESI, TDS deductions, custom allowances, and direct bank disbursement payouts.",
        icon: CreditCard,
        color: "#C62828",
        bg: "rgba(198, 40, 40, 0.08)"
    },
    {
        id: 2,
        title: "Biometric & Mobile Attendance",
        description: "Real-time employee punch in/out, GPS mobile check-in, shift rostering, overtime tracking, and digital leave management.",
        icon: Clock,
        color: "#D97706",
        bg: "rgba(217, 119, 6, 0.08)"
    },
    {
        id: 3,
        title: "Employee Self-Service (ESS)",
        description: "Dedicated portal for staff to download payslip PDFs, inspect monthly attendance calendar, submit reimbursement claims, and update profile.",
        icon: Users,
        color: "#059669",
        bg: "rgba(5, 150, 105, 0.08)"
    },
    {
        id: 4,
        title: "Corporate LMS & Staff Training",
        description: "In-app Learning Management System for Admin and HR to upload training modules, conduct skill quizzes, and track completion progress.",
        icon: BookOpen,
        color: "#7C3AED",
        bg: "rgba(124, 58, 237, 0.08)"
    },
    {
        id: 5,
        title: "Recruitment & Job Portal",
        description: "End-to-end talent recruitment engine for publishing job openings, reviewing candidate resumes, and managing applicants.",
        icon: Briefcase,
        color: "#B71C1C",
        bg: "rgba(183, 28, 28, 0.08)"
    },
    {
        id: 6,
        title: "7-Day Automatic Backup & Recovery",
        description: "Automated 7-day scheduled database reports, direct email snapshot dispatches, comprehensive audit logs, and 1-click restore.",
        icon: Database,
        color: "#2563EB",
        bg: "rgba(37, 99, 235, 0.08)"
    }
];

// Interactive visual previews for the 6 core modules
const renderModuleVisual = (id) => {
    switch (id) {
        case 1:
            return (
                <div className="p-2.5 rounded-3 mb-3" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)', border: '1px solid #FECACA' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.62rem', fontWeight: '700' }}>
                            ● AUTO-PROCESSED
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.66rem', fontWeight: '600' }}>Nov 2026 Batch</span>
                    </div>
                    <div className="d-flex align-items-baseline justify-content-between">
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>Net Disbursement</div>
                            <div className="fw-extrabold text-dark" style={{ fontSize: '1.02rem', color: '#991B1B' }}>₹ 48,500.00</div>
                        </div>
                        <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '0.62rem' }}>
                            PF ₹1,800 • TDS ₹0
                        </span>
                    </div>
                </div>
            );
        case 2:
            return (
                <div className="p-2.5 rounded-3 mb-3" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FDE68A' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.62rem', fontWeight: '700' }}>
                            ● LIVE GEO-PUNCH
                        </span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.7rem' }}>09:00:14 AM</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.6rem' }}>GPS Check-in</div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.76rem' }}>Indore HQ • Verified</div>
                        </div>
                        <span className="badge rounded-pill" style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontSize: '0.62rem', fontWeight: '700' }}>
                            Accuracy 99.8%
                        </span>
                    </div>
                </div>
            );
        case 3:
            return (
                <div className="p-2.5 rounded-3 mb-3" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)', border: '1px solid #A7F3D0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#E0E7FF', color: '#4338CA', fontSize: '0.62rem', fontWeight: '700' }}>
                            STAFF PORTAL
                        </span>
                        <span className="text-success fw-bold" style={{ fontSize: '0.66rem' }}>18 Days Leave Bal.</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '22px', height: '22px', backgroundColor: '#059669', fontSize: '0.64rem' }}>
                                AC
                            </div>
                            <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.74rem' }}>Alex Carter</div>
                                <div className="text-muted" style={{ fontSize: '0.6rem' }}>Senior Engineer</div>
                            </div>
                        </div>
                        <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.62rem', border: '1px solid #86EFAC' }}>
                            📄 PDF Payslip
                        </span>
                    </div>
                </div>
            );
        case 4:
            return (
                <div className="p-2.5 rounded-3 mb-3" style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', border: '1px solid #DDD6FE' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', fontSize: '0.62rem', fontWeight: '700' }}>
                            ACADEMY LMS
                        </span>
                        <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.62rem', fontWeight: '700' }}>
                            🏆 100% Passed
                        </span>
                    </div>
                    <div>
                        <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: '0.6rem' }}>
                            <span>POSH &amp; Compliance 2026</span>
                            <span className="fw-bold text-dark">85% Complete</span>
                        </div>
                        <div className="progress" style={{ height: '5px', backgroundColor: '#DDD6FE' }}>
                            <div className="progress-bar" style={{ width: '85%', backgroundColor: '#7C3AED' }} />
                        </div>
                    </div>
                </div>
            );
        case 5:
            return (
                <div className="p-2.5 rounded-3 mb-3" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', border: '1px solid #FECACA' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.62rem', fontWeight: '700' }}>
                            TALENT PIPELINE
                        </span>
                        <span className="badge rounded-pill" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.62rem' }}>
                            Active Hiring
                        </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.74rem' }}>Frontend Lead</div>
                            <div className="text-muted" style={{ fontSize: '0.6rem' }}>42 Applied • 6 Shortlisted</div>
                        </div>
                        <span className="badge" style={{ backgroundColor: '#FFFFFF', color: '#B91C1C', border: '1px solid #FCA5A5', fontSize: '0.62rem' }}>
                            +2 Offers Sent
                        </span>
                    </div>
                </div>
            );
        case 6:
            return (
                <div className="p-2.5 rounded-3 mb-3" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontSize: '0.62rem', fontWeight: '700' }}>
                            CLOUD VAULT
                        </span>
                        <span className="text-success fw-bold" style={{ fontSize: '0.62rem' }}>● 100% Intact</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.74rem' }}>Auto-Snapshot: 7 Days</div>
                            <div className="text-muted" style={{ fontSize: '0.6rem' }}>256-bit AES DB Encryption</div>
                        </div>
                        <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.62rem' }}>
                            1-Click Restore
                        </span>
                    </div>
                </div>
            );
        default:
            return null;
    }
};

// 3 Testimonials
const clientTestimonials = [
    {
        id: 1,
        name: "Siddharth Mehta",
        role: "Head of Human Resources",
        company: "Nexus Infotech Ltd.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        text: "Kiaan Payroll cut our monthly salary processing cycle from 4 days to barely 20 minutes! The automated PF/ESI calculations and payslip generator work like a charm."
    },
    {
        id: 2,
        name: "Ananya Deshmukh",
        role: "Operations Director",
        company: "Apex Healthcare Systems",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        text: "The multi-shift attendance and mobile PWA check-in solved our 24/7 staff scheduling issues. Our employees love downloading their payslips directly from the portal."
    },
    {
        id: 3,
        name: "Vikram Malhotra",
        role: "Managing Director",
        company: "Starlight Logistics Global",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        text: "Superb SaaS platform! The statutory tax reports and clean Razorpay billing made compliance completely painless for our 120+ team members."
    }
];

const LandingPage = () => {
    const isNative = isNativeApp();

    // Detect if running inside installed PWA / Android APK / TWA shell
    const [isPwaOrApk, setIsPwaOrApk] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            const isStandalone = 
                window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: fullscreen)').matches ||
                window.matchMedia('(display-mode: minimal-ui)').matches ||
                window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                (window.navigator && window.navigator.standalone === true) ||
                (document.referrer && document.referrer.includes('android-app://')) ||
                (window.location.search && (window.location.search.includes('source=pwa') || window.location.search.includes('mode=pwa'))) ||
                Capacitor.isNativePlatform();
            return Boolean(isStandalone);
        } catch (e) {
            return false;
        }
    });

    useEffect(() => {
        const checkAppMode = () => {
            try {
                const isStandalone = 
                    window.matchMedia('(display-mode: standalone)').matches ||
                    window.matchMedia('(display-mode: fullscreen)').matches ||
                    window.matchMedia('(display-mode: minimal-ui)').matches ||
                    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                    (window.navigator && window.navigator.standalone === true) ||
                    (document.referrer && document.referrer.includes('android-app://')) ||
                    Capacitor.isNativePlatform();
                setIsPwaOrApk(Boolean(isStandalone));
            } catch (e) {}
        };
        checkAppMode();
        try {
            const matcher = window.matchMedia('(display-mode: standalone)');
            if (matcher && matcher.addEventListener) {
                matcher.addEventListener('change', checkAppMode);
                return () => matcher.removeEventListener('change', checkAppMode);
            }
        } catch (e) {}
    }, []);

    const { edition } = useRegional();
    const [activeTab, setActiveTab] = useState('home');
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Signup & Payment Modal States
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    
    const [selectedPlanId, setSelectedPlanId] = useState(4);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState({
        id: 'trial',
        name: 'FREE TRIAL',
        price: '₹ 0',
        period: '/ 7 days',
        badge: '7 DAYS FREE',
        planDbId: 4
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [signupData, setSignupData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });

    const [submissionStatus, setSubmissionStatus] = useState({ loading: false, error: null, success: false });
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const signupCaptchaRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignupClick = (plan) => {
        const planId = typeof plan === 'object' && plan !== null ? plan.id : (plan || 'trial');
        if (planId === 'trial') {
            navigate('/signup?type=company');
            return;
        }
        const planName = typeof plan === 'object' && plan !== null && plan.name ? plan.name : (
            planId === 'starter' ? 'STARTER PLAN' :
            planId === 'pro' ? 'PROFESSIONAL' :
            planId === 'premium' ? 'PREMIUM PLAN' :
            planId === 'custom' ? 'CUSTOM PLAN' : 'FREE TRIAL'
        );
        const dynamicPrice = typeof plan === 'object' && plan?.price 
            ? plan.price 
            : (edition?.prices?.[planId] || (
                planId === 'starter' ? (edition?.currency ? `${edition.currency} 700` : '₹ 700') :
                planId === 'pro' ? (edition?.currency ? `${edition.currency} 900` : '₹ 900') :
                planId === 'premium' ? (edition?.currency ? `${edition.currency} 1,200` : '₹ 1,200') :
                planId === 'custom' ? 'Custom' : (edition?.currency ? `${edition.currency} 0` : '₹ 0')
            ));
        const period = planId === 'trial' ? '/ 7 days' : planId === 'custom' ? '/ quotes' : '/ month';
        
        const planDbIdMap = { starter: 1, pro: 2, premium: 3, trial: 4, custom: 5 };
        const dbId = planDbIdMap[planId] || 4;

        setSelectedPlanDetails({
            id: planId,
            name: planName.toUpperCase(),
            price: dynamicPrice,
            period: period,
            planDbId: dbId,
            currency: edition?.currency || '₹'
        });
        setSelectedPlanId(dbId);
        setShowSignupModal(true);
        setSubmissionStatus({ loading: false, error: null, success: false });
        setPaymentCompleted(false);
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setSubmissionStatus({ loading: true, error: null, success: false });

        if (signupData.password !== signupData.confirm_password) {
            toast.error("Passwords do not match. Please re-enter your password.");
            setSubmissionStatus({ loading: false, error: "Passwords do not match.", success: false });
            return;
        }

        if (signupData.password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            setSubmissionStatus({ loading: false, error: "Password must be at least 6 characters.", success: false });
            return;
        }

        // Security Verification CAPTCHA
        if (signupCaptchaRef.current && !signupCaptchaRef.current.validate()) {
            setSubmissionStatus({ loading: false, error: "Please enter the correct CAPTCHA verification code.", success: false });
            return;
        }

        const currentPlanId = selectedPlanDetails.planDbId || 4;

        // FLOW A: Free Trial (Direct Account Activation)
        if (selectedPlanDetails.id === 'trial' || currentPlanId === 4) {
            try {
                const response = await publicAPI.verifyAndRegister({
                    name: signupData.contact_name,
                    email: signupData.email,
                    password: signupData.password,
                    company_name: signupData.company_name,
                    phone: signupData.phone,
                    plan_id: 4
                });

                if (response.data?.success) {
                    if (response.data.data?.token) {
                        localStorage.setItem('authToken', response.data.data.token);
                    }
                    if (response.data.data?.user) {
                        localStorage.setItem('user', JSON.stringify(response.data.data.user));
                    }
                    setSubmissionStatus({ loading: false, error: null, success: true });
                    toast.success("🎉 Free Trial Account Created! Welcome to Kiaan Payroll.");
                } else {
                    setSubmissionStatus({ loading: false, error: response.data?.message || 'Registration failed.', success: false });
                    toast.error(response.data?.message || 'Registration failed.');
                }
            } catch (err) {
                console.error("Trial registration error:", err);
                const msg = err.response?.data?.message || 'Registration failed. Please try again.';
                setSubmissionStatus({ loading: false, error: msg, success: false });
                toast.error(msg);
            }
            return;
        }

        // FLOW B: Custom Plan (Enterprise Inquiry)
        if (selectedPlanDetails.id === 'custom' || currentPlanId === 5) {
            try {
                const result = await publicAPI.createCompanyRequest({
                    company_name: signupData.company_name,
                    contact_name: signupData.contact_name,
                    email: signupData.email,
                    phone: signupData.phone,
                    plan_id: 5,
                    notes: `Custom Enterprise Requirement by ${signupData.contact_name}`
                });
                if (result.data?.success) {
                    setSubmissionStatus({ loading: false, error: null, success: true });
                    toast.success("Custom Enterprise Request submitted! Our team will contact you shortly.");
                }
            } catch (err) {
                const msg = err.response?.data?.message || 'Failed to submit custom request.';
                setSubmissionStatus({ loading: false, error: msg, success: false });
                toast.error(msg);
            }
            return;
        }

        // FLOW C: Paid Plans (Razorpay Checkout + Auto-Registration)
        try {
            toast.loading(`Initializing ${selectedPlanDetails.name} Razorpay checkout...`);
            const orderRes = await publicAPI.createRazorpayOrder({ plan_id: currentPlanId });
            toast.dismiss();

            if (orderRes.data?.success) {
                const { order_id, key_id, amount, currency, plan_name } = orderRes.data.data;
                openRazorpayCheckout({
                    key_id,
                    order_id,
                    amount,
                    currency,
                    name: 'PayrollPlus | Payroll & HRMS',
                    description: `${selectedPlanDetails.name} (${selectedPlanDetails.price})`,
                    image: payrollPlusLogo,
                    prefill: {
                        name: signupData.contact_name,
                        email: signupData.email,
                        phone: signupData.phone
                    },
                    onSuccess: async (razorpayResponse) => {
                        try {
                            setSubmissionStatus({ loading: true, error: null, success: false });
                            toast.loading('Activating your account and plan...');
                            
                            const regRes = await publicAPI.verifyAndRegister({
                                name: signupData.contact_name,
                                email: signupData.email,
                                password: signupData.password,
                                company_name: signupData.company_name,
                                phone: signupData.phone,
                                plan_id: currentPlanId,
                                razorpay_order_id: razorpayResponse.razorpay_order_id,
                                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                                razorpay_signature: razorpayResponse.razorpay_signature
                            });
                            toast.dismiss();

                            if (regRes.data?.success) {
                                if (regRes.data.data?.token) {
                                    localStorage.setItem('authToken', regRes.data.data.token);
                                }
                                if (regRes.data.data?.user) {
                                    localStorage.setItem('user', JSON.stringify(regRes.data.data.user));
                                }
                                setPaymentCompleted(true);
                                setSubmissionStatus({ loading: false, error: null, success: true });
                                toast.success(`🎉 Payment Successful! Your ${plan_name} account is now active.`);
                            } else {
                                setSubmissionStatus({ loading: false, error: regRes.data?.message || 'Account activation failed.', success: false });
                                toast.error(regRes.data?.message || 'Account activation failed.');
                            }
                        } catch (regErr) {
                            toast.dismiss();
                            console.error("Account activation error:", regErr);
                            const msg = regErr.response?.data?.message || 'Payment received but account creation encountered an error. Please contact support.';
                            setSubmissionStatus({ loading: false, error: msg, success: false });
                            toast.error(msg);
                        }
                    },
                    onDismiss: () => {
                        setSubmissionStatus({ loading: false, error: null, success: false });
                        toast('Payment process cancelled.', { icon: 'ℹ️' });
                    }
                });
            } else {
                setSubmissionStatus({ loading: false, error: orderRes.data?.message || 'Failed to initialize payment gateway.', success: false });
                toast.error(orderRes.data?.message || 'Failed to initialize payment gateway.');
            }
        } catch (err) {
            toast.dismiss();
            console.error("Razorpay order error:", err);
            const msg = err.response?.data?.message || 'Failed to initialize Razorpay checkout.';
            setSubmissionStatus({ loading: false, error: msg, success: false });
            toast.error(msg);
        }
    };

    useEffect(() => {
        const path = (location.pathname || '').toLowerCase();
        if (path === '/features') {
            setActiveTab('features');
            scrollToSection('features');
        } else if (path === '/benefits') {
            setActiveTab('benefits');
            scrollToSection('benefits');
        } else if (path === '/testimonials') {
            setActiveTab('testimonials');
            scrollToSection('testimonials');
        } else if (path === '/pricing') {
            setActiveTab('pricing');
            setTimeout(() => scrollToSection('pricing'), 80);
        } else if (path === '/contact' || path === '/contact-us') {
            setActiveTab('contact');
            scrollToSection('contact');
        } else if (path === '/' || path === '/home') {
            setActiveTab('home');
        }
    }, [location.pathname]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSignupData(prev => ({ ...prev, [name]: value }));
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    };

    const handleNavClick = (e, targetId, path) => {
        if (e && e.preventDefault) e.preventDefault();
        setActiveTab(targetId);
        if (path && location.pathname !== path) {
            navigate(path);
        }
        scrollToSection(targetId);
    };

    return (
        <div className="payroll-landing" style={{ backgroundColor: '#FFFFFF', color: '#0F172A', minHeight: '100vh', overflowX: 'hidden' }}>
            
            {/* 1. CLEAN WHITE & RED HEADER / NAVBAR */}
            <motion.header
                className="fixed-top shadow-sm"
                style={{
                    backgroundColor: scrolled || isMobileMenuOpen ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid #E2E8F0',
                    transition: 'all 0.3s ease',
                    zIndex: 1050
                }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container py-2 px-3">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                        
                        {/* Responsive Logo */}
                        <a href="/" className="navbar-brand d-flex align-items-center gap-1.5 text-decoration-none py-1 flex-shrink-0" style={{ maxWidth: '58%' }}>
                            <img 
                                src={payrollPlusLogo} 
                                alt="PayrollPlus" 
                                style={{ height: '32px', width: 'auto', maxHeight: '34px', objectFit: 'contain', background: 'transparent', border: 'none' }}
                            />
                            <div className="d-flex flex-column text-truncate" style={{ minWidth: 0 }}>
                                <span className="fw-extrabold text-dark text-truncate" style={{ fontSize: '1.02rem', letterSpacing: '0.2px', lineHeight: 1.15 }}>
                                    Payroll<span style={{ color: '#C62828' }}>Plus</span>
                                </span>
                            </div>
                        </a>

                        {/* Navigation Links (Desktop) */}
                        <nav className="d-none d-lg-flex align-items-center gap-4">
                            <a href="/" onClick={(e) => handleNavClick(e, 'home', '/')} className="text-dark text-decoration-none fw-semibold small hover-red">Home</a>
                            <a href="/features" onClick={(e) => handleNavClick(e, 'features', '/features')} className="text-dark text-decoration-none fw-semibold small hover-red">Features</a>
                            <a href="/benefits" onClick={(e) => handleNavClick(e, 'benefits', '/benefits')} className="text-dark text-decoration-none fw-semibold small hover-red">Benefits</a>
                            <a href="/testimonials" onClick={(e) => handleNavClick(e, 'testimonials', '/testimonials')} className="text-dark text-decoration-none fw-semibold small hover-red">Testimonials</a>
                            <a href="/pricing" onClick={(e) => handleNavClick(e, 'pricing', '/pricing')} className="text-dark text-decoration-none fw-semibold small hover-red">Pricing</a>
                            <a href="/contact" onClick={(e) => handleNavClick(e, 'contact', '/contact')} className="text-dark text-decoration-none fw-semibold small hover-red">Contact</a>
                            <a href="/brochure" onClick={(e) => { e.preventDefault(); navigate('/brochure'); }} className="text-dark text-decoration-none fw-semibold small hover-red">Brochure</a>
                        </nav>

                        {/* Right Action Icons & Buttons */}
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            {/* Regional / Language Switcher */}
                            <LanguageSwitcher />

                            {/* Desktop Login Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="btn btn-sm btn-outline-dark px-3 py-1.5 fw-semibold d-none d-md-inline-block"
                                style={{ fontSize: '0.84rem', height: '36px', borderRadius: '8px', border: '1.5px solid #0F172A', color: '#0F172A' }}
                            >
                                Login
                            </button>

                            {/* Desktop Sign Up Button */}
                            <button
                                type="button"
                                onClick={() => handleSignupClick('trial')}
                                className="btn btn-sm text-white px-3.5 py-1.5 fw-bold shadow-sm d-none d-sm-inline-block"
                                style={{ backgroundColor: '#C62828', border: 'none', borderRadius: '8px', fontSize: '0.84rem', height: '36px' }}
                            >
                                Sign Up
                            </button>

                            {/* Mobile Hamburger Menu Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="btn btn-sm d-lg-none d-flex align-items-center justify-content-center border rounded-3 p-1.5"
                                style={{ 
                                    backgroundColor: isMobileMenuOpen ? '#FEF2F2' : '#FFFFFF', 
                                    borderColor: '#CBD5E1', 
                                    color: isMobileMenuOpen ? '#B91C1C' : '#1E293B', 
                                    width: '36px', 
                                    height: '36px' 
                                }}
                                aria-label="Toggle Mobile Navigation"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown Navigation Drawer */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="d-lg-none border-top bg-white shadow-lg px-3 py-3"
                        style={{ borderTopColor: '#E2E8F0' }}
                    >
                        <div className="d-flex flex-column gap-1 mb-3">
                            <a 
                                href="/" 
                                onClick={(e) => { handleNavClick(e, 'home', '/'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Home</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                            <a 
                                href="/features" 
                                onClick={(e) => { handleNavClick(e, 'features', '/features'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Features</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                            <a 
                                href="/benefits" 
                                onClick={(e) => { handleNavClick(e, 'benefits', '/benefits'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Benefits</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                            <a 
                                href="/testimonials" 
                                onClick={(e) => { handleNavClick(e, 'testimonials', '/testimonials'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Testimonials</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                            <a 
                                href="/pricing" 
                                onClick={(e) => { handleNavClick(e, 'pricing', '/pricing'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Pricing Plans</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                            <a 
                                href="/contact" 
                                onClick={(e) => { handleNavClick(e, 'contact', '/contact'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Contact Us</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                            <a 
                                href="/brochure" 
                                onClick={(e) => { e.preventDefault(); navigate('/brochure'); setIsMobileMenuOpen(false); }} 
                                className="px-3 py-2 rounded-2 text-dark text-decoration-none fw-semibold small d-flex justify-content-between align-items-center hover-bg-light"
                            >
                                <span>Brochure</span>
                                <ChevronRight size={15} className="text-muted" />
                            </a>
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="d-flex flex-column gap-2 pt-2 border-top">
                            <button
                                type="button"
                                onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                                className="btn btn-outline-dark w-100 py-2 fw-semibold rounded-pill"
                                style={{ fontSize: '0.86rem' }}
                            >
                                Login to Account
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsMobileMenuOpen(false); handleSignupClick('trial'); }}
                                className="btn text-white w-100 py-2 fw-bold shadow-sm rounded-pill"
                                style={{ background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)', border: 'none', fontSize: '0.86rem' }}
                            >
                                Start 7-Day Free Trial
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.header>

            {/* 2. HERO SECTION (Red & White Software Theme) */}
            <section id="home" className="position-relative d-flex align-items-center" style={{ minHeight: 'auto', paddingTop: '82px', paddingBottom: '28px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #F8FAFC 100%)', overflow: 'hidden' }}>
                
                {/* Background Ambient Glow */}
                <div 
                    className="position-absolute" 
                    style={{ 
                        top: '10%', 
                        left: '5%', 
                        width: '500px', 
                        height: '500px', 
                        background: 'radial-gradient(circle, rgba(198, 40, 40, 0.06) 0%, transparent 70%)', 
                        pointerEvents: 'none',
                        zIndex: 0 
                    }} 
                />

                <div className="container position-relative" style={{ zIndex: 1 }}>
                    <div className="row align-items-center g-4 g-lg-5">
                        
                        {/* Left Column: Heading & CTAs */}
                        <div className="col-lg-6">
                            
                            {/* Pill Badge */}
                            <motion.div 
                                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2"
                                style={{ backgroundColor: 'rgba(198, 40, 40, 0.08)', border: '1px solid rgba(198, 40, 40, 0.25)', color: '#C62828', fontSize: '0.78rem', fontWeight: '700' }}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Sparkles size={13} />
                                <span>NEXT-GEN WORKFORCE &amp; PAYROLL SAAS 2026</span>
                            </motion.div>

                            {/* Main Title */}
                            <motion.h1 
                                className="fw-extrabold text-dark mb-2"
                                style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', lineHeight: '1.16', letterSpacing: '-0.5px' }}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                            >
                                Empowering Modern Enterprises with <span style={{ color: '#C62828' }}>Smart Payroll</span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p 
                                className="mb-3"
                                style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '530px' }}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                Complete all-in-one SaaS platform for automated salary calculations, biometric attendance tracking, statutory tax compliance, LMS training, and direct payslip distribution.
                            </motion.p>

                            {/* Dual Action Buttons */}
                            <motion.div 
                                className="d-flex flex-wrap align-items-center gap-3 mb-3"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.5 }}
                            >
                                <button 
                                    type="button"
                                    onClick={() => handleSignupClick('trial')}
                                    className="btn text-white fw-semibold d-inline-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                                    style={{ 
                                        height: '42px',
                                        minHeight: '42px',
                                        padding: '0 22px',
                                        backgroundColor: '#C62828',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.88rem',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 14px rgba(198, 40, 40, 0.25)',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B71C1C'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <span>Start Free Trial</span>
                                    <ArrowRight size={15} />
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => scrollToSection('pricing')}
                                    className="btn d-inline-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                                    style={{ 
                                        height: '42px',
                                        minHeight: '42px',
                                        padding: '0 22px',
                                        backgroundColor: 'transparent',
                                        border: '1.5px solid #0F172A',
                                        color: '#0F172A',
                                        borderRadius: '8px',
                                        fontSize: '0.88rem',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    Explore Plans & Pricing
                                </button>
                            </motion.div>

                            {/* Official App Store & Direct Download Controls - Web Only */}
                            {(!isNative && !isPwaOrApk) && (
                                <motion.div 
                                    className="d-flex flex-wrap align-items-center gap-2.5 mb-3"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    {/* Google Play Store Badge */}
                                    <a 
                                        href={GOOGLE_PLAY_STORE_URL || "/kiaan-payroll.apk"} 
                                        download={GOOGLE_PLAY_STORE_URL ? undefined : "kiaan-payroll.apk"}
                                        target={GOOGLE_PLAY_STORE_URL ? "_blank" : undefined}
                                        rel={GOOGLE_PLAY_STORE_URL ? "noopener noreferrer" : undefined}
                                        onClick={() => {
                                            if (!GOOGLE_PLAY_STORE_URL) {
                                                try {
                                                    localStorage.setItem('kiaan_pwa_apk_downloaded', 'true');
                                                } catch (e) {}
                                                toast.success("📱 Downloading Kiaan Payroll Android APK...", { icon: '⬇️' });
                                            }
                                        }}
                                        className="d-inline-flex align-items-center text-decoration-none shadow-sm"
                                        style={{
                                            height: '42px',
                                            backgroundColor: '#000000',
                                            color: '#FFFFFF',
                                            border: '1px solid rgba(255, 255, 255, 0.25)',
                                            borderRadius: '8px',
                                            padding: '0 14px',
                                            gap: '9px',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                                    >
                                        <svg width="18" height="20" viewBox="0 0 20 22" fill="none">
                                            <path d="M0.833 0.917C0.536 1.233 0.367 1.724 0.367 2.348V19.652C0.367 20.276 0.536 20.767 0.833 21.083L0.902 21.144L10.59 11.456V11.236L0.902 0.856L0.833 0.917Z" fill="url(#gp_blue)" />
                                            <path d="M13.82 14.686L10.59 11.456V11.236L13.82 8.006L13.893 8.048L17.72 10.222C18.813 10.842 18.813 11.85 17.72 12.47L13.893 14.644L13.82 14.686Z" fill="url(#gp_yellow)" />
                                            <path d="M13.893 14.644L10.59 11.341L0.833 21.098C1.196 21.482 1.8 21.536 2.483 21.148L13.893 14.644Z" fill="url(#gp_red)" />
                                            <path d="M13.893 8.048L2.483 1.544C1.8 1.156 1.196 1.21 0.833 1.594L10.59 11.351L13.893 8.048Z" fill="url(#gp_green)" />
                                            <defs>
                                                <linearGradient id="gp_blue" x1="9.69" y1="1.95" x2="-2.79" y2="14.43" gradientUnits="userSpaceOnUse"><stop stopColor="#00A0FF"/><stop offset="0.007" stopColor="#00A1FF"/><stop offset="0.26" stopColor="#00BEFF"/><stop offset="0.512" stopColor="#00D2FF"/><stop offset="0.76" stopColor="#00DFFF"/><stop offset="1" stopColor="#00E3FF"/></linearGradient>
                                                <linearGradient id="gp_yellow" x1="19.14" y1="11.34" x2="-0.27" y2="11.34" gradientUnits="userSpaceOnUse"><stop stopColor="#FFE000"/><stop offset="0.409" stopColor="#FFBD00"/><stop offset="0.775" stopColor="#FFA500"/><stop offset="1" stopColor="#FF9C00"/></linearGradient>
                                                <linearGradient id="gp_red" x1="12.23" y1="13.01" x2="-5.43" y2="30.67" gradientUnits="userSpaceOnUse"><stop stopColor="#FF3A44"/><stop offset="1" stopColor="#C31162"/></linearGradient>
                                                <linearGradient id="gp_green" x1="-1.68" y1="-4.33" x2="6.6" y2="3.95" gradientUnits="userSpaceOnUse"><stop stopColor="#32A071"/><stop offset="0.069" stopColor="#2DA771"/><stop offset="0.476" stopColor="#15CF74"/><stop offset="0.801" stopColor="#06E775"/><stop offset="1" stopColor="#00F076"/></linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="d-flex flex-column text-start" style={{ lineHeight: '1.1' }}>
                                            <span style={{ fontSize: '0.56rem', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#CBD5E1' }}>GET IT ON</span>
                                            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>Google Play</span>
                                        </div>
                                    </a>

                                    {/* Apple App Store Badge */}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            toast("🍎 iOS listing is in developer review. You can use our responsive Web App or Android APK now.", { 
                                                icon: 'ℹ️',
                                                duration: 4000 
                                            });
                                        }}
                                        className="d-inline-flex align-items-center text-decoration-none shadow-sm"
                                        style={{
                                            height: '42px',
                                            backgroundColor: '#000000',
                                            color: '#FFFFFF',
                                            border: '1px solid rgba(255, 255, 255, 0.25)',
                                            borderRadius: '8px',
                                            padding: '0 14px',
                                            gap: '9px',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                                    >
                                        <svg width="18" height="20" viewBox="0 0 170 170" fill="#FFFFFF">
                                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.42-5.44-8.27-9.85-18.06-13.23-29.38-3.38-11.31-5.07-22.18-5.07-32.6 0-14.68 3.75-26.65 11.26-35.91 7.51-9.26 17.2-13.98 29.07-14.15 4.8 0 10.05 1.25 15.76 3.75 5.71 2.5 9.77 3.86 12.18 4.09 2.07 0 6.36-1.47 12.87-4.42 6.51-2.95 12.1-4.29 16.78-4.03 13.93.98 24.87 6.47 32.82 16.48-11.97 7.29-17.84 17.24-17.62 29.84.22 9.9 4.08 18.23 11.59 24.99 7.51 6.75 16.32 10.45 26.43 11.1-2.61 7.94-5.66 15.68-9.14 23.23zM119.22 31.84c0-7.39 2.67-14.24 8.01-20.55 5.34-6.31 11.98-10.47 19.92-12.48.22 1.09.33 2.07.33 2.94 0 7.39-2.78 14.46-8.33 21.21-5.55 6.75-12.27 10.77-20.16 12.07-.11-1.09-.22-2.18-.22-3.19z" />
                                        </svg>
                                        <div className="d-flex flex-column text-start" style={{ lineHeight: '1.1' }}>
                                            <span style={{ fontSize: '0.56rem', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#CBD5E1' }}>Download on the</span>
                                            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.2px' }}>App Store</span>
                                        </div>
                                    </button>
                                </motion.div>
                            )}

                            {/* 4 Metric Stats in a Row */}
                            <motion.div 
                                className="row g-2 pt-2 border-top"
                                style={{ borderColor: '#E2E8F0' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35, duration: 0.5 }}
                            >
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.22rem' }}>500+</h4>
                                    <span className="text-muted" style={{ fontSize: '0.74rem' }}>Active Companies</span>
                                </div>
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.22rem' }}>50K+</h4>
                                    <span className="text-muted" style={{ fontSize: '0.74rem' }}>Monthly Payslips</span>
                                </div>
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.22rem' }}>99.9%</h4>
                                    <span className="text-muted" style={{ fontSize: '0.74rem' }}>Auto Accuracy</span>
                                </div>
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.22rem' }}>24/7</h4>
                                    <span className="text-muted" style={{ fontSize: '0.74rem' }}>Priority Support</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Hero Graphic - Authentic High-Definition 3D Software Showcase */}
                        <div className="col-lg-6">
                            <motion.div 
                                className="position-relative text-center d-flex align-items-center justify-content-center"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                {/* Soft Crimson Ambient Glow */}
                                <div 
                                    className="position-absolute"
                                    style={{
                                        top: '0%',
                                        right: '0%',
                                        bottom: '0%',
                                        left: '0%',
                                        background: 'radial-gradient(circle at 50% 50%, rgba(198, 40, 40, 0.14) 0%, rgba(248, 250, 252, 0) 70%)',
                                        zIndex: 0,
                                        pointerEvents: 'none',
                                        filter: 'blur(30px)'
                                    }}
                                />

                                {/* High-Resolution 3D Perspective Dashboard Frame */}
                                <div 
                                    className="position-relative w-100"
                                    style={{ 
                                        zIndex: 1,
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <img 
                                        src={dashboardShowcase} 
                                        alt="PayrollPlus Enterprise SaaS Dashboard Interface" 
                                        className="img-fluid"
                                        style={{ 
                                            maxHeight: '480px', 
                                            width: '100%',
                                            maxWidth: '680px',
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 20px 35px rgba(15, 23, 42, 0.12)) drop-shadow(0 4px 12px rgba(198, 40, 40, 0.08))'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 3. PLATFORM CORE MODULES (6 Cards Grid - Red & White Theme) */}
            <section id="features" className="py-4 py-md-5 position-relative" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div className="container py-2 py-md-3">
                    
                    {/* Section Header */}
                    <div className="text-center mb-4">
                        <div 
                            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2"
                            style={{ backgroundColor: 'rgba(198, 40, 40, 0.08)', border: '1px solid rgba(198, 40, 40, 0.25)', color: '#C62828', fontSize: '0.78rem', fontWeight: '700' }}
                        >
                            <Sparkles size={13} />
                            <span>PLATFORM CORE MODULES</span>
                        </div>
                        <h2 className="display-6 fw-bold text-dark mb-2" style={{ fontSize: 'clamp(1.7rem, 2.6vw, 2.2rem)' }}>
                            Everything Your Enterprise Needs in <span style={{ color: '#C62828' }}>One Intelligent Platform</span>
                        </h2>
                        <p className="mx-auto text-muted mb-0" style={{ maxWidth: '620px', fontSize: '0.92rem', lineHeight: '1.55' }}>
                            Streamline workforce workflows, reduce payroll processing hours to minutes, and automate statutory compliance.
                        </p>
                    </div>

                    {/* 6 Cards Grid with Visual Previews */}
                    <div className="row g-3 g-xl-4">
                        {coreModules.map((module) => {
                            const IconComponent = module.icon;
                            return (
                                <div key={module.id} className="col-md-6 col-lg-4">
                                    <motion.div 
                                        className="h-100 p-3 p-md-3.5 rounded-3 d-flex flex-column justify-content-between"
                                        style={{ 
                                            backgroundColor: '#FFFFFF', 
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '16px',
                                            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                                            transition: 'all 0.25s ease'
                                        }}
                                        whileHover={{ y: -4, borderColor: '#C62828', boxShadow: '0 12px 28px rgba(198, 40, 40, 0.08)' }}
                                    >
                                        <div>
                                            {/* Feature Visual Preview Header */}
                                            {renderModuleVisual(module.id)}

                                            {/* Title and Icon */}
                                            <div className="d-flex align-items-center gap-2.5 mb-2">
                                                <div 
                                                    className="rounded-2 d-inline-flex align-items-center justify-content-center p-2 flex-shrink-0"
                                                    style={{ width: '38px', height: '38px', backgroundColor: module.bg, color: module.color, borderRadius: '8px' }}
                                                >
                                                    <IconComponent size={20} />
                                                </div>
                                                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.08rem', letterSpacing: '-0.2px' }}>{module.title}</h4>
                                            </div>

                                            <p className="text-muted small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.5' }}>
                                                {module.description}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => handleSignupClick('trial')}
                                                className="btn btn-link p-0 text-decoration-none fw-semibold small d-inline-flex align-items-center gap-1"
                                                style={{ color: '#C62828', fontSize: '0.82rem' }}
                                            >
                                                <span>Explore Module</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 4. WHY CHOOSE KIAAN SAAS (Split Section - Red & White Theme) */}
            <section id="benefits" className="py-5 position-relative" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        
                        {/* Left Column: Advantages Checklist */}
                        <div className="col-lg-6">
                            <div 
                                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
                                style={{ backgroundColor: 'rgba(198, 40, 40, 0.08)', border: '1px solid rgba(198, 40, 40, 0.25)', color: '#C62828', fontSize: '0.8rem', fontWeight: '700' }}
                            >
                                <Award size={14} />
                                <span>WHY ENTERPRISES CHOOSE US</span>
                            </div>

                            <h2 className="display-6 fw-bold text-dark mb-3" style={{ fontSize: '2.35rem', lineHeight: '1.25' }}>
                                Why Top Enterprises &amp; Fast-Growing Companies <span style={{ color: '#C62828' }}>Choose Kiaan Technology</span>
                            </h2>
                            <p className="text-muted mb-4" style={{ fontSize: '0.98rem', lineHeight: '1.6' }}>
                                Designed specifically to eliminate payroll complexities, automate statutory deductions, and give management complete transparency.
                            </p>

                            <div className="d-flex flex-column gap-3 mb-4">
                                {[
                                    "Increase payroll processing speed by up to 85%",
                                    "Save 15+ hours each month on manual attendance & spreadsheets",
                                    "Zero-error automated tax calculations & statutory deduction filings",
                                    "100% cloud secure with 256-bit encrypted database isolation",
                                    "Integrated LMS courses and career growth management for staff",
                                    "Mobile PWA app with biometric check-in and digital leave approval"
                                ].map((item, idx) => (
                                    <div key={idx} className="d-flex align-items-start gap-3">
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                                            style={{ width: '22px', height: '22px', backgroundColor: '#DCFCE7', color: '#16A34A' }}
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span className="text-dark fw-medium" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Key Metric Badges & Testimonial Quote */}
                        <div className="col-lg-6">
                            <div className="row g-3 mb-4">
                                <div className="col-4">
                                    <div className="p-3.5 rounded-4 text-center" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FECDD3' }}>
                                        <h3 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#C62828' }}>85%</h3>
                                        <span className="small text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Admin Time Saved</span>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-3.5 rounded-4 text-center" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FECDD3' }}>
                                        <h3 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#C62828' }}>15+</h3>
                                        <span className="small text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Hours Saved/mo</span>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-3.5 rounded-4 text-center" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FECDD3' }}>
                                        <h3 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#C62828' }}>99.9%</h3>
                                        <span className="small text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Uptime SLA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quote Card */}
                            <div 
                                className="p-4 rounded-4 position-relative"
                                style={{ 
                                    backgroundColor: '#FFFFFF', 
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '24px',
                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <Quote size={32} className="text-warning mb-3 opacity-50" />
                                <p className="text-dark fst-italic mb-4" style={{ fontSize: '0.98rem', lineHeight: '1.65' }}>
                                    "Kiaan Technology has completely transformed our payroll and attendance operations. The instant payslip generation and multi-branch tracking saved our management countless hours."
                                </p>
                                <div className="d-flex align-items-center gap-3">
                                    <img 
                                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" 
                                        alt="Client avatar" 
                                        className="rounded-circle"
                                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                    />
                                    <div>
                                        <h6 className="fw-bold text-dark mb-0">Dr. Rahul Verma</h6>
                                        <span className="small text-muted" style={{ fontSize: '0.82rem' }}>Group HR Director, Zenith Enterprises</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. CLIENT TESTIMONIALS (3 Cards Grid - Red & White Theme) */}
            <section id="testimonials" className="py-5 position-relative" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div className="container py-4">
                    
                    {/* Section Header */}
                    <div className="text-center mb-5">
                        <div 
                            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
                            style={{ backgroundColor: 'rgba(198, 40, 40, 0.08)', border: '1px solid rgba(198, 40, 40, 0.25)', color: '#C62828', fontSize: '0.8rem', fontWeight: '700' }}
                        >
                            <Sparkles size={14} />
                            <span>CLIENT TESTIMONIALS</span>
                        </div>
                        <h2 className="display-6 fw-bold text-dark mb-3" style={{ fontSize: '2.4rem' }}>
                            Trusted by Enterprises <span style={{ color: '#C62828' }}>Across the Globe</span>
                        </h2>
                        <p className="mx-auto text-muted" style={{ maxWidth: '650px', fontSize: '0.98rem', lineHeight: '1.6' }}>
                            Join hundreds of forward-thinking businesses delivering accurate, on-time payroll.
                        </p>
                    </div>

                    {/* 3 Testimonials Grid */}
                    <div className="row g-4">
                        {clientTestimonials.map((t) => (
                            <div key={t.id} className="col-md-4">
                                <motion.div 
                                    className="h-100 p-4 rounded-4 d-flex flex-column justify-content-between"
                                    style={{ 
                                        backgroundColor: '#FFFFFF', 
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '20px',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
                                    }}
                                    whileHover={{ y: -6, borderColor: '#C62828' }}
                                >
                                    <div>
                                        {/* Stars */}
                                        <div className="d-flex gap-1 text-warning mb-3">
                                            {[...Array(t.rating)].map((_, i) => (
                                                <Star key={i} size={16} fill="#F59E0B" stroke="#F59E0B" />
                                            ))}
                                        </div>

                                        <p className="text-dark mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.65' }}>
                                            "{t.text}"
                                        </p>
                                    </div>

                                    <div className="d-flex align-items-center gap-3 pt-3 border-top" style={{ borderColor: '#F1F5F9' }}>
                                        <img 
                                            src={t.avatar} 
                                            alt={t.name} 
                                            className="rounded-circle"
                                            style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                                        />
                                        <div>
                                            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>{t.name}</h6>
                                            <span className="small text-muted" style={{ fontSize: '0.8rem' }}>{t.role}, {t.company}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. PRICING SECTION (5 Red & White Cards with Multi-Currency Switcher) */}
            <PayrollPricingSection onSelectPlan={(plan) => handleSignupClick(plan)} />

            {/* 7. PRE-FOOTER CTA BANNER (Kiaan Red Luxury Banner) */}
            <section className="py-5 position-relative" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="container py-2">
                    <div 
                        className="p-5 rounded-4 text-center position-relative overflow-hidden text-white shadow-lg"
                        style={{ 
                            background: 'linear-gradient(135deg, #991B1B 0%, #C62828 50%, #7F1D1D 100%)',
                            borderRadius: '24px'
                        }}
                    >
                        <h2 className="display-6 fw-bold mb-3 text-white" style={{ fontSize: '2.35rem' }}>
                            Empowering Modern Enterprises with Smart Payroll
                        </h2>
                        <p className="text-light opacity-90 mx-auto mb-4" style={{ maxWidth: '600px', fontSize: '1rem' }}>
                            Experience seamless employee salaries, automated attendance, and statutory reporting.
                        </p>
                        <button 
                            type="button"
                            onClick={() => handleSignupClick('trial')}
                            className="btn btn-lg bg-white text-danger px-5 py-3 fw-bold rounded-pill shadow"
                            style={{ fontSize: '1rem', border: 'none' }}
                        >
                            Start Free Trial Now →
                        </button>
                    </div>
                </div>
            </section>

            {/* 8. CONTACT FORM */}
            <section id="contact" className="py-5" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div className="container py-3">
                    <ContactForm />
                </div>
            </section>

            {/* 9. FOOTER */}
            <footer className="py-5" style={{ backgroundColor: '#0B0F19', color: '#E2E8F0', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="container">
                    <div className="row g-4 g-lg-5 mb-5">
                        
                        {/* Brand Column */}
                        <div className="col-lg-4 col-md-6 col-12">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <img 
                                    src={payrollPlusLogo} 
                                    alt="PayrollPlus" 
                                    style={{ height: '38px', width: 'auto', objectFit: 'contain', background: 'transparent', border: 'none' }}
                                />
                                <h5 className="fw-bold text-white mb-0" style={{ letterSpacing: '0.5px', fontSize: '1.2rem' }}>PayrollPlus</h5>
                            </div>
                            <p className="small mb-4" style={{ color: '#94A3B8', lineHeight: '1.7', maxWidth: '360px', fontSize: '0.88rem' }}>
                                Next-generation workforce &amp; payroll SaaS platform empowering businesses with intelligent salary automation, attendance tracking, LMS training, and modern recruitment.
                            </p>
                            <div className="d-flex gap-2">
                                <a 
                                    href="https://www.linkedin.com/in/lalit-thakur-8660583a2/?skipRedirect=true" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    aria-label="LinkedIn"
                                    className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                    style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', transition: 'all 0.2s ease' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.borderColor = '#C62828'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                                >
                                    <Linkedin size={16} />
                                </a>
                                <a 
                                    href="https://www.instagram.com/kiaan_technology4/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    aria-label="Instagram"
                                    className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                    style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', transition: 'all 0.2s ease' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.borderColor = '#C62828'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                                >
                                    <Instagram size={16} />
                                </a>
                                <a 
                                    href="https://www.facebook.com/profile.php?id=61589478035248" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    aria-label="Facebook"
                                    className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                    style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', transition: 'all 0.2s ease' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.borderColor = '#C62828'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                                >
                                    <Facebook size={16} />
                                </a>
                                <a 
                                    href="https://www.youtube.com/@kiaantechnology-r3p" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    aria-label="YouTube"
                                    className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                    style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', transition: 'all 0.2s ease' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.borderColor = '#C62828'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                                >
                                    <Youtube size={16} />
                                </a>
                            </div>
                        </div>

                        {/* Core Modules */}
                        <div className="col-lg-3 col-md-6 col-sm-6 col-12">
                            <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.82rem' }}>Core Modules</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2.5 small" style={{ color: '#CBD5E1', fontSize: '0.88rem' }}>
                                <li>
                                    <a href="/signup?type=company" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Automated Payroll
                                    </a>
                                </li>
                                <li>
                                    <a href="/login" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Attendance &amp; Shifts
                                    </a>
                                </li>
                                <li>
                                    <a href="/login" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Employee Self-Service (ESS)
                                    </a>
                                </li>
                                <li>
                                    <a href="/signup?type=company" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Employer &amp; HR Management
                                    </a>
                                </li>
                                <li>
                                    <a href="/signup?type=jobseeker" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Recruitment &amp; Job Portal
                                    </a>
                                </li>
                                <li>
                                    <a href="/login" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Corporate LMS Training
                                    </a>
                                </li>
                                <li>
                                    <a href="/admin/backups" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Backup &amp; Disaster Recovery
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Quick Links */}
                        <div className="col-lg-2 col-md-6 col-sm-6 col-12">
                            <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.82rem' }}>Quick Links</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2.5 small" style={{ color: '#CBD5E1', fontSize: '0.88rem' }}>
                                <li>
                                    <a href="/" onClick={(e) => handleNavClick(e, 'home', '/')} className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Home
                                    </a>
                                </li>
                                <li>
                                    <a href="/features" onClick={(e) => handleNavClick(e, 'features', '/features')} className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="/pricing" onClick={(e) => handleNavClick(e, 'pricing', '/pricing')} className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Pricing
                                    </a>
                                </li>
                                <li>
                                    <a href="/brochure" onClick={(e) => { e.preventDefault(); navigate('/brochure'); }} className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Product Brochure
                                    </a>
                                </li>
                                <li>
                                    <button type="button" onClick={() => setShowDocModal(true)} className="btn btn-link p-0 text-decoration-none text-start" style={{ color: '#CBD5E1', fontSize: '0.88rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Documentation
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => setShowSupportModal(true)} className="btn btn-link p-0 text-decoration-none text-start" style={{ color: '#CBD5E1', fontSize: '0.88rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Support Center
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Information */}
                        <div className="col-lg-3 col-md-6 col-12">
                            <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.82rem' }}>Get In Touch</h6>
                            <div className="d-flex flex-column gap-3 small" style={{ color: '#E2E8F0', fontSize: '0.88rem' }}>
                                <div className="d-flex align-items-start">
                                    <MapPin size={18} style={{ color: '#EF4444', marginRight: '12px', flexShrink: 0, marginTop: '3px' }} />
                                    <span style={{ color: '#E2E8F0', lineHeight: '1.5' }}>248, Sector C, Sukhlia Nagar, Indore, Madhya Pradesh 452010</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Phone size={18} style={{ color: '#EF4444', marginRight: '12px', flexShrink: 0 }} />
                                    <span style={{ color: '#E2E8F0', fontWeight: '500' }}>+91 9770273892</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Mail size={18} style={{ color: '#EF4444', marginRight: '12px', flexShrink: 0 }} />
                                    <span style={{ color: '#E2E8F0', fontWeight: '500' }}>info@kiaantechnology.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-center text-md-start small" style={{ borderColor: 'rgba(255, 255, 255, 0.12)', color: '#94A3B8', fontSize: '0.85rem' }}>
                        <div>
                            &copy; 2026 Kiaan Technology Pvt. Ltd. All rights reserved.
                        </div>
                        <div className="d-flex flex-wrap justify-content-center justify-content-md-end align-items-center gap-2 gap-sm-3">
                            <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }} className="text-decoration-none" style={{ color: '#CBD5E1', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>Privacy Policy</a>
                            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                            <a href="/terms-conditions" onClick={(e) => { e.preventDefault(); navigate('/terms-conditions'); }} className="text-decoration-none" style={{ color: '#CBD5E1', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>Terms &amp; Conditions</a>
                            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                            <a href="/contact" onClick={(e) => { handleNavClick(e, 'contact', '/contact'); }} className="text-decoration-none" style={{ color: '#CBD5E1', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>Contact Us</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* 10. MODERN SIGNUP & SUBSCRIPTION MODAL (Matching Reference Screenshot & Brand Theme) */}
            <Modal 
                show={showSignupModal} 
                onHide={() => setShowSignupModal(false)} 
                size="lg" 
                centered
                contentClassName="border-0 shadow-lg"
                style={{ borderRadius: '24px' }}
            >
                <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', overflow: 'hidden' }}>
                    {/* Modal Header Bar */}
                    <div className="d-flex justify-content-between align-items-center px-4 pt-4 pb-2">
                        {/* Top Plan Pill Badge */}
                        <div 
                            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                            style={{ 
                                backgroundColor: 'rgba(198, 40, 40, 0.08)',
                                color: '#C62828',
                                border: '1px solid rgba(198, 40, 40, 0.2)', 
                                fontSize: '0.8rem', 
                                fontWeight: '700',
                                letterSpacing: '0.5px'
                            }}
                        >
                            <Sparkles size={14} style={{ color: "#C62828" }} />
                            <span>
                                {selectedPlanDetails.name.toUpperCase()} — {selectedPlanDetails.price} {selectedPlanDetails.period || selectedPlanDetails.badge || ''}
                            </span>
                        </div>

                        {/* Close Button */}
                        <button 
                            type="button"
                            onClick={() => setShowSignupModal(false)}
                            className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center border-0 text-muted p-2"
                            style={{ width: '36px', height: '36px' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-4 pb-4 pt-2">
                        {submissionStatus.success ? (
                            <div className="text-center py-4 px-3">
                                <div 
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                    style={{ width: '70px', height: '70px', backgroundColor: '#ECFDF5', color: '#10B981' }}
                                >
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="fw-bold text-dark mb-2">Account Created Successfully!</h3>
                                <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                                    {paymentCompleted 
                                        ? `Thank you! Your payment for the ${selectedPlanDetails.name} plan was successful and your company account is fully activated.`
                                        : `Your company ${signupData.company_name ? `"${signupData.company_name}"` : ''} has been registered with the ${selectedPlanDetails.name} plan.`
                                    }
                                </p>
                                
                                <div className="p-3 bg-light rounded-3 mb-4 text-start mx-auto" style={{ maxWidth: '420px', fontSize: '0.9rem' }}>
                                    <div className="d-flex justify-content-between py-1 border-bottom">
                                        <span className="text-muted">Selected Plan:</span>
                                        <span className="fw-bold text-dark">{selectedPlanDetails.name} ({selectedPlanDetails.price})</span>
                                    </div>
                                    <div className="d-flex justify-content-between py-1 border-bottom">
                                        <span className="text-muted">Admin Email:</span>
                                        <span className="fw-bold text-dark">{signupData.email}</span>
                                    </div>
                                    <div className="d-flex justify-content-between py-1">
                                        <span className="text-muted">Status:</span>
                                        <span className="badge bg-success">Active</span>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-center gap-3">
                                    <Button 
                                        variant="dark" 
                                        onClick={() => {
                                            setShowSignupModal(false);
                                            navigate('/login');
                                        }}
                                        className="px-4 py-2 fw-semibold rounded-pill"
                                        style={{ background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)', border: 'none' }}
                                    >
                                        Go to Login Portal <ArrowRight size={16} className="ms-1" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Form onSubmit={handleSignupSubmit}>
                                {/* Form Title & Subtitle */}
                                <div className="mb-4">
                                    <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.65rem' }}>
                                        Create Your Company Account
                                    </h3>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.92rem' }}>
                                        Quick 2-minute setup. Start managing your payroll &amp; employees instantly.
                                    </p>
                                </div>

                                {submissionStatus.error && (
                                    <Alert variant="danger" className="py-2 px-3 small rounded-3 mb-3">
                                        {submissionStatus.error}
                                    </Alert>
                                )}

                                {/* Form Fields Grid (Exact 6 fields) */}
                                <div className="row g-3 mb-3">
                                    {/* 1. Company Name */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark small mb-1">
                                            Company / Business Name <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted ps-3 pe-2" style={{ borderRadius: '10px 0 0 10px' }}>
                                                <Building size={17} />
                                            </span>
                                            <input
                                                type="text"
                                                name="company_name"
                                                value={signupData.company_name}
                                                onChange={handleChange}
                                                required
                                                className="form-control bg-light border-start-0 py-2 ps-2"
                                                style={{ borderRadius: '0 10px 10px 0', fontSize: '0.92rem' }}
                                                placeholder="Company name"
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Admin Full Name */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark small mb-1">
                                            Admin Full Name <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted ps-3 pe-2" style={{ borderRadius: '10px 0 0 10px' }}>
                                                <User size={17} />
                                            </span>
                                            <input
                                                type="text"
                                                name="contact_name"
                                                value={signupData.contact_name}
                                                onChange={handleChange}
                                                required
                                                className="form-control bg-light border-start-0 py-2 ps-2"
                                                style={{ borderRadius: '0 10px 10px 0', fontSize: '0.92rem' }}
                                                placeholder="Admin full name"
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Work Email */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark small mb-1">
                                            Work Email <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted ps-3 pe-2" style={{ borderRadius: '10px 0 0 10px' }}>
                                                <Mail size={17} />
                                            </span>
                                            <input
                                                type="email"
                                                name="email"
                                                value={signupData.email}
                                                onChange={handleChange}
                                                required
                                                className="form-control bg-light border-start-0 py-2 ps-2"
                                                style={{ borderRadius: '0 10px 10px 0', fontSize: '0.92rem' }}
                                                placeholder="admin@company.com"
                                            />
                                        </div>
                                    </div>

                                    {/* 4. Mobile Number */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark small mb-1">
                                            Mobile Number <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted ps-3 pe-2" style={{ borderRadius: '10px 0 0 10px' }}>
                                                <Phone size={17} />
                                            </span>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={signupData.phone}
                                                onChange={handleChange}
                                                required
                                                className="form-control bg-light border-start-0 py-2 ps-2"
                                                style={{ borderRadius: '0 10px 10px 0', fontSize: '0.92rem' }}
                                                placeholder="98765 43210"
                                            />
                                        </div>
                                    </div>

                                    {/* 5. Password */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark small mb-1">
                                            Password <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted ps-3 pe-2" style={{ borderRadius: '10px 0 0 10px' }}>
                                                <Lock size={17} />
                                            </span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={signupData.password}
                                                onChange={handleChange}
                                                required
                                                className="form-control bg-light border-start-0 border-end-0 py-2 ps-2"
                                                style={{ fontSize: '0.92rem' }}
                                                placeholder="Create password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="input-group-text bg-light border-start-0 text-muted pe-3"
                                                style={{ borderRadius: '0 10px 10px 0', cursor: 'pointer' }}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 6. Confirm Password */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark small mb-1">
                                            Confirm Password <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted ps-3 pe-2" style={{ borderRadius: '10px 0 0 10px' }}>
                                                <Lock size={17} />
                                            </span>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirm_password"
                                                value={signupData.confirm_password}
                                                onChange={handleChange}
                                                required
                                                className="form-control bg-light border-start-0 border-end-0 py-2 ps-2"
                                                style={{ fontSize: '0.92rem' }}
                                                placeholder="Confirm password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="input-group-text bg-light border-start-0 text-muted pe-3"
                                                style={{ borderRadius: '0 10px 10px 0', cursor: 'pointer' }}
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Badge */}
                                <div 
                                    className="d-flex align-items-center gap-2 p-2 px-3 rounded-3 mb-4"
                                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B' }}
                                >
                                    <ShieldCheck size={18} className="text-success flex-shrink-0" />
                                    <span>
                                        256-Bit SSL Encrypted &amp; Secure Cloud Database. 
                                        {selectedPlanDetails.id === 'trial' ? ' No credit card required for 7-day trial.' : ' Instant plan activation upon payment.'}
                                    </span>
                                </div>

                                {/* Security Verification CAPTCHA */}
                                <Captcha ref={signupCaptchaRef} className="mb-3" />

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submissionStatus.loading}
                                    className="btn w-100 py-3 fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)', 
                                        boxShadow: '0 8px 24px rgba(198, 40, 40, 0.25)', 
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        border: 'none',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    {submissionStatus.loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                {selectedPlanDetails.id === 'trial' 
                                                    ? 'Create Account & Start Free Trial' 
                                                    : selectedPlanDetails.id === 'custom'
                                                    ? 'Submit Enterprise Request'
                                                    : `Pay with Razorpay & Create Account (${selectedPlanDetails.price})`
                                                }
                                            </span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </Form>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Other Modals & Widgets */}
            <PrivacyPolicyModal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} />
            <TermsConditionsModal show={showTermsModal} onHide={() => setShowTermsModal(false)} />
            <DocumentationModal show={showDocModal} onHide={() => setShowDocModal(false)} />
            <SupportCenterModal show={showSupportModal} onHide={() => setShowSupportModal(false)} />
            <ContactUsModal show={showContactModal} onHide={() => setShowContactModal(false)} />
            <WhatsAppWidget />
        </div>
    );
};

export default LandingPage;
