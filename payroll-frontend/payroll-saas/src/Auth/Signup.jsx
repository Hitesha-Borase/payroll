import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Captcha from "../components/Captcha";
import toast from "react-hot-toast";
import "./AuthPages.css";

// --- Color Palette (Identical to Login.jsx) ---
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  lightBeige: '#F7EFE9',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
};

// --- Reusable Button Styles (Identical to Login.jsx) ---
const buttonStyles = {
  backgroundColor: colors.primaryRed,
  color: colors.white,
  border: 'none',
  transition: 'background-color 0.2s ease-in-out',
  padding: '10px 16px',
  borderRadius: '6px',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const Signup = () => {
  const { register, registerCompany } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial account type from URL (default to company trial)
  const searchParams = new URLSearchParams(location.search);
  const initialType = searchParams.get('type') === 'jobseeker' ? 'jobseeker' : 'company';
  const [accountType, setAccountType] = useState(initialType);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const captchaRef = useRef(null);

  // Sync state if URL query changes
  useEffect(() => {
    const typeFromQuery = searchParams.get('type');
    if (typeFromQuery === 'jobseeker' || typeFromQuery === 'company') {
      setAccountType(typeFromQuery);
    }
  }, [location.search]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd)) {
      return 'Password must contain uppercase and lowercase letters';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    setPasswordMismatch(password !== val);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passError = validatePassword(password);
    if (passError) {
      setPasswordError(passError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    // Security Verification CAPTCHA
    if (captchaRef.current && !captchaRef.current.validate()) {
      return;
    }

    setPasswordMismatch(false);
    setIsLoading(true);

    try {
      if (accountType === 'company') {
        // Option 1: Company / Admin (7-Day Free Trial)
        const result = await registerCompany({
          company_name: companyName.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });

        if (result.success) {
          toast.success("Free trial account created! Welcome to your Company Workspace.");
          navigate("/admin/dashboard");
        } else {
          setError(result.error || "Company registration failed. Please try again.");
        }
      } else {
        // Option 2: Job Seeker (Free Forever)
        const result = await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: "jobseeker",
        });

        if (result.success) {
          toast.success("Account created successfully! Welcome to the Job Portal.");
          navigate("/job-portal/dashboard");
        } else {
          setError(result.error || "Job seeker registration failed. Please try again.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center px-3 py-4 auth-container"
      style={{
        backgroundColor: colors.lightBeige,
        minHeight: '100vh'
      }}
    >
      {/* Back to Website Button (Identical to Login) */}
      <div className="w-100 d-flex justify-content-start mb-2 mb-md-3" style={{ maxWidth: "950px" }}>
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded-pill shadow-sm"
          style={{
            backgroundColor: colors.white,
            color: colors.primaryRed,
            border: '1px solid rgba(198, 40, 40, 0.2)',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.25s ease-in-out',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryRed;
            e.currentTarget.style.color = colors.white;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(198, 40, 40, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.white;
            e.currentTarget.style.color = colors.primaryRed;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Website</span>
        </Link>
      </div>

      {/* Main Centered Card (Identical layout & styling to Login) */}
      <div
        className="card shadow w-100 auth-card"
        style={{
          maxWidth: "950px",
          borderRadius: "1.5rem",
          backgroundColor: colors.white,
          border: 'none',
        }}
      >
        <div className="row g-0 align-items-stretch">
          {/* Left Column: Clean Illustration (Identical to Login) */}
          <div
            className="col-md-6 d-none d-md-block auth-image-col"
            style={{ borderRadius: '1.5rem 0 0 1.5rem' }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(198, 40, 40, 0.05) 0%, rgba(183, 28, 28, 0.05) 100%)',
                zIndex: 1
              }}
            />
            <img
              src="/login_business_dashboard.png"
              alt="Professional Payroll Dashboard"
              className="img-fluid"
              style={{
                height: "100%",
                width: "100%",
                minHeight: "100%",
                objectFit: "cover",
                objectPosition: 'center',
                transition: 'transform 0.6s ease',
                position: 'relative',
                zIndex: 0
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80";
              }}
            />
          </div>

          {/* Right Column: Clean Form */}
          <div
            className="col-12 col-md-6 auth-form-col"
            style={{ animation: 'fadeInRight 0.6s ease-out' }}
          >
            <div className="w-100">
              {/* Kiaan Logo (Identical to Login) */}
              <div className="text-center mb-3">
                <img
                  src="/kiaan_logo.png"
                  alt="Kiaan Technology Logo"
                  style={{ height: "60px", width: "auto", objectFit: "contain" }}
                />
              </div>

              {/* Title & Subtitle */}
              <h2 className="fw-bold mb-1 text-center" style={{ color: colors.black, fontFamily: 'inherit' }}>
                Create Account
              </h2>

              <p className="text-center mb-3" style={{ color: colors.darkGray, fontFamily: 'inherit', fontSize: '14px' }}>
                {accountType === 'company'
                  ? "Start your 7-day free trial"
                  : "Create your free candidate account"}
              </p>

              {/* Top Two Simple Tabs: [ Company ] [ Job Seeker ] */}
              <div
                className="d-flex p-1 mb-3 rounded-2"
                style={{
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB'
                }}
              >
                <button
                  type="button"
                  className="btn flex-fill py-2 text-center border-0 fw-semibold"
                  style={{
                    backgroundColor: accountType === 'company' ? colors.white : 'transparent',
                    color: accountType === 'company' ? colors.primaryRed : colors.darkGray,
                    boxShadow: accountType === 'company' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setAccountType('company');
                    setError("");
                  }}
                >
                  Company
                </button>
                <button
                  type="button"
                  className="btn flex-fill py-2 text-center border-0 fw-semibold"
                  style={{
                    backgroundColor: accountType === 'jobseeker' ? colors.white : 'transparent',
                    color: accountType === 'jobseeker' ? colors.primaryRed : colors.darkGray,
                    boxShadow: accountType === 'jobseeker' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setAccountType('jobseeker');
                    setError("");
                  }}
                >
                  Job Seeker
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup}>
                {/* Company Name (When Company selected) */}
                {accountType === 'company' && (
                  <div className="mb-2">
                    <label className="form-label mb-1" style={{ fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      required
                      style={{
                        fontFamily: 'inherit',
                        padding: '8px 12px',
                        border: '1px solid #E2E2E2',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                )}

                {/* Full Name & Phone in compact grid */}
                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label mb-1" style={{ fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      style={{
                        fontFamily: 'inherit',
                        padding: '8px 12px',
                        border: '1px solid #E2E2E2',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label mb-1" style={{ fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      required
                      style={{
                        fontFamily: 'inherit',
                        padding: '8px 12px',
                        border: '1px solid #E2E2E2',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-2">
                  <label className="form-label mb-1" style={{ fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{
                      fontFamily: 'inherit',
                      padding: '8px 12px',
                      border: '1px solid #E2E2E2',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Password & Confirm Password in compact grid */}
                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label mb-1" style={{ fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}>
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Min. 8 chars"
                        required
                        minLength={8}
                        style={{
                          fontFamily: 'inherit',
                          padding: '8px 12px',
                          border: '1px solid #E2E2E2',
                          borderRadius: '8px 0 0 8px',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ border: '1px solid #E2E2E2', borderLeft: 'none' }}
                      >
                        {showPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>
                        {passwordError}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label mb-1" style={{ fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}>
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Re-enter"
                        required
                        style={{
                          fontFamily: 'inherit',
                          padding: '8px 12px',
                          border: '1px solid #E2E2E2',
                          borderRadius: '8px 0 0 8px',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ border: '1px solid #E2E2E2', borderLeft: 'none' }}
                      >
                        {showConfirmPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>
                        Passwords do not match
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Verification CAPTCHA */}
                <Captcha ref={captchaRef} className="mb-3 mt-1" />

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="btn w-100 py-2"
                  style={{
                    ...buttonStyles,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Processing..."
                    : accountType === 'company'
                      ? "Start 7-Day Free Trial"
                      : "Create Free Account"}
                </button>

                {/* Login Redirect (Identical to Login) */}
                <div className="mt-3 text-center">
                  <span style={{ color: colors.darkGray, fontFamily: 'inherit', fontSize: '14px' }}>
                    Already have an account?{" "}
                  </span>
                  <Link
                    to="/login"
                    style={{
                      color: colors.primaryRed,
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontFamily: 'inherit',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}
                  >
                    Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
