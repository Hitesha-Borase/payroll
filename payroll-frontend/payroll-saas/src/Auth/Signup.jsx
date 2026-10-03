import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Captcha from "../components/Captcha";
import "./AuthPages.css";

// --- Color Palette (matching Login page) ---
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  lightBeige: '#F7EFE9',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
};

const Signup = () => {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("jobseeker");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  const roleRedirectMap = {
    superadmin: "/superadmin/dashboard",
    admin: "/admin/dashboard",
    employer: "/employer/dashboard",
    employee: "/employee/dashboard",
    jobseeker: "/job-portal/dashboard",
    vendor: "/vendor/dashboard",
    "find-job": "/job-portal/dashboard",
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters';
    }
    if (!hasUpperCase || !hasLowerCase) {
      return 'Password must contain uppercase and lowercase letters';
    }
    if (!hasNumber) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
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
      const roleToSend = role === 'find-job' ? 'jobseeker' : role;
      const result = await register({
        name,
        email,
        password,
        role: roleToSend,
      });

      if (result.success) {
        const redirectPath = roleRedirectMap[role] || "/";
        navigate(redirectPath);
      } else {
        setError(result.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center px-2 px-sm-3 py-3 py-md-4 auth-container"
      style={{
        backgroundColor: colors.lightBeige,
        minHeight: '100vh'
      }}
    >
      {/* Back to Website Button */}
      <div className="w-100 d-flex justify-content-start mb-2 mb-md-3" style={{ maxWidth: "1020px" }}>
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

      <div className="card shadow w-100 auth-card" style={{ maxWidth: "1020px", borderRadius: "1.5rem", backgroundColor: colors.white }}>
        <div className="row g-0 align-items-stretch">
          {/* Left Image Section */}
          <div className="col-md-5 col-lg-5 d-none d-md-block auth-image-col" style={{ borderRadius: '1.5rem 0 0 1.5rem' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(198, 40, 40, 0.08) 0%, rgba(183, 28, 28, 0.05) 100%)',
                zIndex: 1
              }}
            />
            <img
              src="/signup_professional.png"
              alt="Join Our Professional Team"
              className="img-fluid"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
                objectPosition: 'center',
                minHeight: '100%',
                position: 'relative',
                zIndex: 0
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80";
              }}
            />
          </div>

          {/* Right Form Section */}
          <div className="col-12 col-md-7 col-lg-7 auth-form-col">
            <div className="w-100">
              {/* Logo & Header */}
              <div className="text-center mb-2">
                <img
                  src="/kt_logo_transparent.png"
                  alt="Kiaan Technology Logo"
                  style={{ height: "46px", width: "auto", objectFit: "contain" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/kiaan_logo.png";
                  }}
                />
              </div>
              <h3 className="fw-bold mb-1 text-center" style={{ color: colors.black, fontSize: '1.35rem' }}>
                Create Your Account
              </h3>
              <p className="text-center text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                Join us and start managing workforce &amp; payroll efficiently
              </p>

              {/* Error message */}
              {error && (
                <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup}>
                <div className="row g-2 g-sm-3">
                  {/* Full Name */}
                  <div className="col-12 col-sm-6">
                    <label className="auth-form-label">Full Name</label>
                    <input
                      type="text"
                      className="auth-form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="col-12 col-sm-6">
                    <label className="auth-form-label">Email Address</label>
                    <input
                      type="email"
                      className="auth-form-control"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="col-12">
                    <label className="auth-form-label">Select Account Role</label>
                    <select
                      className="auth-form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="jobseeker">Job Seeker (Candidate Portal)</option>
                      <option value="employer">Employer / Company (HR &amp; Payroll Management)</option>
                      <option value="employee">Employee (Workforce &amp; Payslips)</option>
                      <option value="vendor">Vendor / Partner</option>
                      <option value="find-job">Find Job / Explorer</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="col-12 col-sm-6">
                    <label className="auth-form-label">Password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control auth-form-control"
                        placeholder="Min. 8 chars"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        minLength="8"
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
                      >
                        {showPassword ? (
                          <i className="bi bi-eye-slash-fill"></i>
                        ) : (
                          <i className="bi bi-eye-fill"></i>
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>{passwordError}</div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="col-12 col-sm-6">
                    <label className="auth-form-label">Confirm Password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control auth-form-control"
                        placeholder="Re-type password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
                      >
                        {showPassword ? (
                          <i className="bi bi-eye-slash-fill"></i>
                        ) : (
                          <i className="bi bi-eye-fill"></i>
                        )}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                        Passwords do not match
                      </div>
                    )}
                  </div>

                  {/* Security Verification CAPTCHA */}
                  <div className="col-12">
                    <Captcha ref={captchaRef} className="my-1" />
                  </div>

                  {/* Sign Up Button */}
                  <div className="col-12 mt-2">
                    <button
                      type="submit"
                      className="btn w-100"
                      style={{
                        backgroundColor: colors.primaryRed,
                        color: colors.white,
                        border: 'none',
                        transition: 'all 0.3s ease',
                        padding: '11px 24px',
                        borderRadius: '50px',
                        fontWeight: '600',
                        fontSize: '0.92rem',
                        letterSpacing: '0.3px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(198, 40, 40, 0.2)'
                      }}
                      disabled={isLoading}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.target.style.backgroundColor = colors.darkRed;
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(198, 40, 40, 0.35)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.target.style.backgroundColor = colors.primaryRed;
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(198, 40, 40, 0.2)';
                        }
                      }}
                    >
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </button>
                  </div>

                  {/* Login Link */}
                  <div className="col-12 text-center mt-2">
                    <span style={{ color: colors.darkGray, fontSize: '0.85rem' }}>Already have an account? </span>
                    <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: colors.primaryRed, fontSize: '0.85rem' }}>
                      Login
                    </Link>
                  </div>
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

