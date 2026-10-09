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
    Globe, Instagram, Linkedin, Mail, MapPin, Phone, Youtube, Building, User, Lock, 
    Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles, X, ArrowRight, Check, 
    CreditCard, Users, Clock, Award, FileText, BarChart3, BookOpen, ChevronRight, Star, Quote, Zap, Menu,
    Briefcase, Database, Wallet, UserCheck, RefreshCw, HelpCircle
} from 'lucide-react';
import { openRazorpayCheckout } from './src/utils/razorpay';
import PrivacyPolicyModal from './src/components/PrivacyPolicyModal';
import TermsConditionsModal from './src/components/TermsConditionsModal';
import DocumentationModal from './src/components/DocumentationModal';
import SupportCenterModal from './src/components/SupportCenterModal';
import ContactUsModal from './src/components/ContactUsModal';
import LanguageSwitcher from './src/components/LanguageSwitcher';
import PayrollPricingSection from './src/components/PayrollPricingSection';
import Captcha from './src/components/Captcha';
import { useRegional } from './src/context/RegionalContext';
import ktLogo from './src/assets/kt_logo_transparent.png';

// High quality professional hero image (preserves existing software image)
const heroImageUrl = "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&h=800&fit=crop&q=80";

// Real Software Module Navigation Portals
const mainButtons = [
    { label: 'EMPLOYER / HR PORTAL', path: '/register/employers' },
    { label: 'EMPLOYEE SELF-SERVICE', path: '/register/employees' },
    { label: 'ADMIN CONTROL PANEL', path: '/admin/login' },
    { label: 'SUPER ADMIN MASTER', path: '/superadmin/dashboard' },
    { label: 'JOB SEEKER DESK', path: '/register/jobseekers' },
    { label: 'VENDOR MANAGEMENT', path: '/register/vendor' },
    { label: 'AUTOMATED PAYROLL', path: '/register/payroll' },
    { label: 'ATTENDANCE TRACKER', path: '/register/employees' },
    { label: 'CORPORATE LMS', path: '/login' },
    { label: 'CREDIT WALLET & BILLS', path: '/login' },
    { label: 'BACKUP & DISASTER RECOVERY', path: '/admin/backups' },
    { label: 'SUPPORT DESK', path: '/login' }
];

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
    const isNativeApp = Capacitor.isNativePlatform();
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
    
    const [selectedPlanId, setSelectedPlanId] = useState(1);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState({
        id: 'trial',
        name: 'FREE TRIAL',
        price: '₹ 0',
        period: '/ 7 days',
        badge: '7 DAYS FREE',
        planDbId: 1
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
        const planName = typeof plan === 'object' && plan !== null && plan.name ? plan.name : (
            planId === 'starter' ? 'STARTER PLAN' :
            planId === 'pro' ? 'PROFESSIONAL' :
            planId === 'premium' ? 'PREMIUM PLAN' :
            planId === 'custom' ? 'CUSTOM PLAN' : 'FREE TRIAL'
        );
        const dynamicPrice = typeof plan === 'object' && plan?.price 
            ? plan.price 
            : (edition?.prices?.[planId] || (
                planId === 'starter' ? (edition?.currency ? `${edition.currency} 999` : '₹ 999') :
                planId === 'pro' ? (edition?.currency ? `${edition.currency} 1,299` : '₹ 1,299') :
                planId === 'premium' ? (edition?.currency ? `${edition.currency} 1,499` : '₹ 1,499') :
                planId === 'custom' ? 'Custom' : (edition?.currency ? `${edition.currency} 0` : '₹ 0')
            ));
        const period = planId === 'trial' ? '/ 7 days' : planId === 'custom' ? '/ quotes' : '/ month';
        
        const planDbIdMap = { trial: 1, starter: 2, pro: 3, premium: 4, custom: 5 };
        const dbId = planDbIdMap[planId] || 1;

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

        const currentPlanId = selectedPlanDetails.planDbId || 1;

        // FLOW A: Free Trial (Direct Account Activation)
        if (selectedPlanDetails.id === 'trial' || currentPlanId === 1) {
            try {
                const response = await publicAPI.verifyAndRegister({
                    name: signupData.contact_name,
                    email: signupData.email,
                    password: signupData.password,
                    company_name: signupData.company_name,
                    phone: signupData.phone,
                    plan_id: 1
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
                    name: 'Kiaan Technology | Payroll & HRMS',
                    description: `${selectedPlanDetails.name} (${selectedPlanDetails.price})`,
                    image: ktLogo,
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
                                razorpay_payment_id: razorpayResponse.razorpay_payment_id
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
                                src={ktLogo} 
                                alt="Kiaan Technology" 
                                style={{ height: '32px', width: 'auto', maxHeight: '34px', objectFit: 'contain', background: 'transparent', border: 'none' }}
                            />
                            <div className="d-flex flex-column text-truncate" style={{ minWidth: 0 }}>
                                <span className="fw-extrabold text-dark text-truncate" style={{ fontSize: '1.02rem', letterSpacing: '0.2px', lineHeight: 1.15 }}>
                                    KIAAN <span style={{ color: '#C62828' }}>TECH</span><span className="d-none d-sm-inline" style={{ color: '#C62828' }}>NOLOGY</span>
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
                                className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1.5 fw-semibold d-none d-md-inline-block"
                                style={{ fontSize: '0.82rem', height: '36px' }}
                            >
                                Login
                            </button>

                            {/* Desktop Sign Up Button */}
                            <button
                                type="button"
                                onClick={() => handleSignupClick('trial')}
                                className="btn btn-sm text-white rounded-pill px-3.5 py-1.5 fw-bold shadow-sm d-none d-sm-inline-block"
                                style={{ background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)', border: 'none', fontSize: '0.82rem', height: '36px' }}
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
            <section id="home" className="position-relative d-flex align-items-center" style={{ minHeight: '92vh', paddingTop: '120px', paddingBottom: '70px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #F8FAFC 100%)', overflow: 'hidden' }}>
                
                {/* Background Ambient Glow */}
                <div 
                    className="position-absolute" 
                    style={{ 
                        top: '15%', 
                        left: '5%', 
                        width: '500px', 
                        height: '500px', 
                        background: 'radial-gradient(circle, rgba(198, 40, 40, 0.06) 0%, transparent 70%)', 
                        pointerEvents: 'none',
                        zIndex: 0 
                    }} 
                />

                <div className="container position-relative" style={{ zIndex: 1 }}>
                    <div className="row align-items-center g-5">
                        
                        {/* Left Column: Heading & CTAs */}
                        <div className="col-lg-6">
                            
                            {/* Pill Badge */}
                            <motion.div 
                                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
                                style={{ backgroundColor: 'rgba(198, 40, 40, 0.08)', border: '1px solid rgba(198, 40, 40, 0.25)', color: '#C62828', fontSize: '0.82rem', fontWeight: '700' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Sparkles size={14} />
                                <span>NEXT-GEN WORKFORCE &amp; PAYROLL SAAS 2026</span>
                            </motion.div>

                            {/* Main Title */}
                            <motion.h1 
                                className="display-4 fw-extrabold text-dark mb-3"
                                style={{ fontSize: '2.9rem', lineHeight: '1.18', letterSpacing: '-0.5px' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.6 }}
                            >
                                Empowering Modern Enterprises with <span style={{ color: '#C62828' }}>Smart Payroll</span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p 
                                className="lead mb-4"
                                style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.65' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                Complete all-in-one SaaS platform for automated salary calculations, biometric attendance tracking, statutory tax compliance, LMS training, and direct payslip distribution.
                            </motion.p>

                            {/* Dual Action Buttons */}
                            <motion.div 
                                className="d-flex flex-wrap align-items-center gap-3 mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                            >
                                <button 
                                    type="button"
                                    onClick={() => handleSignupClick('trial')}
                                    className="btn btn-lg text-white px-4 py-3 fw-bold rounded-pill shadow-sm d-inline-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                                    style={{ background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)', border: 'none', fontSize: '0.98rem' }}
                                >
                                    <span>Start 7-Day Free Trial</span>
                                    <ArrowRight size={18} />
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => scrollToSection('pricing')}
                                    className="btn btn-lg btn-outline-dark px-4 py-3 fw-semibold rounded-pill d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                                    style={{ fontSize: '0.98rem' }}
                                >
                                    Explore Plans &amp; Pricing
                                </button>
                            </motion.div>

                            {/* Android & iOS App Download Buttons (Red & White Theme) - Web / Browser Only */}
                            {!isNativeApp && (
                                <motion.div 
                                    className="d-flex flex-wrap align-items-center gap-3 mb-5"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35, duration: 0.6 }}
                                >
                                {/* Android Download Button */}
                                <a 
                                    href="/kiaan-payroll.apk" 
                                    download="kiaan-payroll.apk"
                                    onClick={() => toast.success("📱 Downloading Kiaan Payroll Android APK...", { icon: '⬇️' })}
                                    className="btn d-inline-flex align-items-center text-decoration-none shadow-sm flex-fill"
                                    style={{ 
                                        backgroundColor: '#FFFFFF', 
                                        color: '#0F172A', 
                                        border: '1.5px solid #E2E8F0',
                                        borderRadius: '16px',
                                        padding: '10px 20px',
                                        gap: '14px',
                                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                                        flex: '1 1 180px',
                                        maxWidth: '100%',
                                        transition: 'all 0.25s ease'
                                    }}
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.borderColor = '#C62828'; 
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 22px rgba(198, 40, 40, 0.12)';
                                    }}
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.borderColor = '#E2E8F0'; 
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.04)';
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ 
                                            width: '42px', 
                                            height: '42px', 
                                            minWidth: '42px', 
                                            borderRadius: '12px', 
                                            backgroundColor: 'rgba(198, 40, 40, 0.08)' 
                                        }}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#C62828">
                                            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4128 13.8533 8.1 12 8.1s-3.5902.3128-5.1355.8517L4.8422 5.4487a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.996 3.4572C2.6889 11.1867.3432 14.6589 0 18.7999h24c-.3432-4.141-2.6889-7.6132-6.1185-9.4785"/>
                                        </svg>
                                    </div>
                                    <div className="d-flex flex-column align-items-start text-start" style={{ lineHeight: '1.25' }}>
                                        <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Download for</span>
                                        <span style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.2px' }}>Android APK</span>
                                    </div>
                                </a>

                                {/* iOS Download Button */}
                                <a 
                                    href="/kiaan-payroll.apk" 
                                    download="kiaan-payroll-ios.apk"
                                    onClick={() => toast.success("🍎 Downloading Kiaan Payroll for iOS...", { icon: '⬇️' })}
                                    className="btn d-inline-flex align-items-center text-decoration-none shadow-sm flex-fill"
                                    style={{ 
                                        backgroundColor: '#FFFFFF', 
                                        color: '#0F172A', 
                                        border: '1.5px solid #E2E8F0',
                                        borderRadius: '16px',
                                        padding: '10px 20px',
                                        gap: '14px',
                                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                                        flex: '1 1 180px',
                                        maxWidth: '100%',
                                        transition: 'all 0.25s ease'
                                    }}
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.borderColor = '#C62828'; 
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 22px rgba(198, 40, 40, 0.12)';
                                    }}
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.borderColor = '#E2E8F0'; 
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.04)';
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ 
                                            width: '42px', 
                                            height: '42px', 
                                            minWidth: '42px', 
                                            borderRadius: '12px', 
                                            backgroundColor: 'rgba(198, 40, 40, 0.08)' 
                                        }}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#C62828">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.71-.93 2.73 1.02.08 2.05-.49 2.65-1.23z"/>
                                        </svg>
                                    </div>
                                    <div className="d-flex flex-column align-items-start text-start" style={{ lineHeight: '1.25' }}>
                                        <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Download for</span>
                                        <span style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.2px' }}>iOS / Apple</span>
                                    </div>
                                </a>
                            </motion.div>
                            )}

                            {/* 4 Metric Stats in a Row */}
                            <motion.div 
                                className="row g-3 pt-2 border-top"
                                style={{ borderColor: '#E2E8F0' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.4rem' }}>500+</h4>
                                    <span className="small text-muted" style={{ fontSize: '0.78rem' }}>Active Companies</span>
                                </div>
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.4rem' }}>50K+</h4>
                                    <span className="small text-muted" style={{ fontSize: '0.78rem' }}>Monthly Payslips</span>
                                </div>
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.4rem' }}>99.9%</h4>
                                    <span className="small text-muted" style={{ fontSize: '0.78rem' }}>Auto Accuracy</span>
                                </div>
                                <div className="col-3">
                                    <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.4rem' }}>24/7</h4>
                                    <span className="small text-muted" style={{ fontSize: '0.78rem' }}>Priority Support</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Hero Graphic */}
                        <div className="col-lg-6">
                            <motion.div 
                                className="position-relative text-center"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.7 }}
                            >
                                <div 
                                    className="p-2 rounded-4 shadow position-relative" 
                                    style={{ 
                                        backgroundColor: '#FFFFFF', 
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)'
                                    }}
                                >
                                    <img 
                                        src={heroImageUrl} 
                                        alt="Kiaan Payroll SaaS Dashboard" 
                                        className="img-fluid rounded-4 w-100"
                                        style={{ maxHeight: '420px', objectFit: 'cover' }}
                                    />

                                    {/* Floating Live Badge */}
                                    <div 
                                        className="position-absolute bottom-0 start-0 m-4 p-3 rounded-3 d-flex align-items-center gap-3 shadow"
                                        style={{ 
                                            backgroundColor: '#FFFFFF', 
                                            border: '1px solid #E2E8F0',
                                            color: '#0F172A'
                                        }}
                                    >
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '40px', height: '40px', backgroundColor: 'rgba(198, 40, 40, 0.1)', color: '#C62828' }}
                                        >
                                            <Zap size={20} />
                                        </div>
                                        <div className="text-start">
                                            <div className="fw-bold small text-dark">Automated Salary Runs</div>
                                            <div className="text-success small fw-semibold" style={{ fontSize: '0.78rem' }}>● 100% Zero Calculation Errors</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Quick Module Grid Buttons */}
                    <div className="mt-5 pt-3">
                        <div className="text-center mb-3">
                            <span className="small text-muted fw-bold" style={{ letterSpacing: '1px' }}>CORE PLATFORM PORTALS &amp; ACCESS POINTS</span>
                        </div>
                        <div className="row g-2 justify-content-center">
                            {mainButtons.map((btn) => (
                                <div key={btn.label} className="col-6 col-md-4 col-lg-auto">
                                    <button
                                        type="button"
                                        onClick={() => navigate(btn.path)}
                                        className="btn btn-sm w-100 py-2 px-3 text-uppercase fw-semibold rounded-pill"
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #CBD5E1',
                                            color: '#334155',
                                            fontSize: '0.78rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C62828'; e.currentTarget.style.color = '#C62828'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {btn.label}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. PLATFORM CORE MODULES (6 Cards Grid - Red & White Theme) */}
            <section id="features" className="py-5 position-relative" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div className="container py-4">
                    
                    {/* Section Header */}
                    <div className="text-center mb-5">
                        <div 
                            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
                            style={{ backgroundColor: 'rgba(198, 40, 40, 0.08)', border: '1px solid rgba(198, 40, 40, 0.25)', color: '#C62828', fontSize: '0.8rem', fontWeight: '700' }}
                        >
                            <Sparkles size={14} />
                            <span>PLATFORM CORE MODULES</span>
                        </div>
                        <h2 className="display-6 fw-bold text-dark mb-3" style={{ fontSize: '2.4rem' }}>
                            Everything Your Enterprise Needs in <span style={{ color: '#C62828' }}>One Intelligent Platform</span>
                        </h2>
                        <p className="mx-auto text-muted" style={{ maxWidth: '650px', fontSize: '0.98rem', lineHeight: '1.6' }}>
                            Streamline workforce workflows, reduce payroll processing hours to minutes, and automate statutory compliance.
                        </p>
                    </div>

                    {/* 6 Cards Grid */}
                    <div className="row g-4">
                        {coreModules.map((module) => {
                            const IconComponent = module.icon;
                            return (
                                <div key={module.id} className="col-md-6 col-lg-4">
                                    <motion.div 
                                        className="h-100 p-4 rounded-4 d-flex flex-column justify-content-between"
                                        style={{ 
                                            backgroundColor: '#FFFFFF', 
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '20px',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        whileHover={{ y: -8, borderColor: '#C62828', boxShadow: '0 16px 36px rgba(198, 40, 40, 0.12)' }}
                                    >
                                        <div>
                                            <div 
                                                className="rounded-3 d-inline-flex align-items-center justify-content-center p-3 mb-3"
                                                style={{ backgroundColor: module.bg, color: module.color }}
                                            >
                                                <IconComponent size={24} />
                                            </div>
                                            <h4 className="fw-bold text-dark mb-2" style={{ fontSize: '1.25rem' }}>{module.title}</h4>
                                            <p className="text-muted small mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                                {module.description}
                                            </p>
                                        </div>
                                        <div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleSignupClick('trial')}
                                                className="btn btn-link p-0 text-decoration-none fw-semibold small d-inline-flex align-items-center gap-1"
                                                style={{ color: '#C62828' }}
                                            >
                                                <span>Explore Module</span>
                                                <ChevronRight size={16} />
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
                                    src={ktLogo} 
                                    alt="Kiaan Technology" 
                                    style={{ height: '38px', width: 'auto', objectFit: 'contain', background: 'transparent', border: 'none' }}
                                />
                                <h5 className="fw-bold text-white mb-0" style={{ letterSpacing: '0.5px', fontSize: '1.2rem' }}>KIAAN TECHNOLOGY</h5>
                            </div>
                            <p className="small mb-4" style={{ color: '#94A3B8', lineHeight: '1.7', maxWidth: '360px', fontSize: '0.88rem' }}>
                                Next-generation workforce &amp; payroll SaaS platform empowering businesses with intelligent salary automation, attendance tracking, LMS training, and modern recruitment.
                            </p>
                            <div className="d-flex gap-2">
                                <a 
                                    href="https://linkedin.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                    style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', transition: 'all 0.2s ease' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.borderColor = '#C62828'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                                >
                                    <Linkedin size={16} />
                                </a>
                                <a 
                                    href="https://instagram.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                    style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', transition: 'all 0.2s ease' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C62828'; e.currentTarget.style.borderColor = '#C62828'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                                >
                                    <Instagram size={16} />
                                </a>
                                <a 
                                    href="https://youtube.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
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
                                    <a href="/register/payroll" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Automated Payroll
                                    </a>
                                </li>
                                <li>
                                    <a href="/register/employees" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Attendance &amp; Shifts
                                    </a>
                                </li>
                                <li>
                                    <a href="/register/employees" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Employee Self-Service (ESS)
                                    </a>
                                </li>
                                <li>
                                    <a href="/register/employers" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                                        Employer &amp; HR Management
                                    </a>
                                </li>
                                <li>
                                    <a href="/register/jobseekers" className="text-decoration-none" style={{ color: '#CBD5E1', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
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
