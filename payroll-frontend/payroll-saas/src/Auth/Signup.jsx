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
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center px-3 py-4 position-relative"
      style={{
        backgroundColor: colors.lightBeige,
        paddingTop: '2rem',
        paddingBottom: '2rem'
      }}
    >
      {/* Back to Website Button */}
      <Link
        to="/"
        className="position-absolute top-0 start-0 m-3 m-md-4 d-inline-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded-pill shadow-sm"
        style={{
          backgroundColor: colors.white,
          color: colors.primaryRed,
          border: '1px solid rgba(198, 40, 40, 0.2)',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.25s ease-in-out',
          zIndex: 100,
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
        <ArrowLeft size={18} />
        <span>Back to Website</span>
      </Link>
      <div className="card shadow w-100" style={{ maxWidth: "950px", borderRadius: "1.5rem", backgroundColor: colors.white }}>
        <div className="row g-0">
          {/* Left Image Section - Same as Login */}
          <div className="col-md-6 d-none d-md-block position-relative overflow-hidden" style={{ borderRadius: '1.5rem 0 0 1.5rem' }}>
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
              src="/signup_professional.png"
              alt="Join Our Professional Team"
              className="img-fluid"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
                objectPosition: 'center',
                transition: 'transform 0.6s ease',
                position: 'relative',
                zIndex: 0
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80";
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </div>

          {/* Right Form Section - Same as Login */}
          <div
            className="col-md-6 d-flex align-items-center p-4 py-5"
            style={{
              animation: 'fadeInRight 0.6s ease-out'
            }}
          >
            <style>
              {`
                @keyframes fadeInRight {
                  from {
                    opacity: 0;
                    transform: translateX(30px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
              `}
            </style>
            <div className="w-100">
              <div className="text-center mb-3">
                <img src="/kiaan_logo.png" alt="Kiaan Technology Logo" style={{ height: "60px", width: "auto", objectFit: "contain" }} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              </div>
              {/* Heading */}
              <h2 className="fw-bold mb-3 text-center" style={{ color: colors.black, fontFamily: 'inherit' }}>Create Your Account</h2>
              <p className="text-center mb-4" style={{ color: colors.darkGray, fontFamily: 'inherit' }}>Join us and start managing payroll efficiently</p>

              {/* Error message */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup}>
                {/* Full Name */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      fontFamily: 'inherit',
                      padding: '10px 14px',
                      border: '1px solid #E2E2E2',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primaryRed;
                      e.target.style.boxShadow = '0 0 0 3px rgba(198, 40, 40, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E2E2E2';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      fontFamily: 'inherit',
                      padding: '10px 14px',
                      border: '1px solid #E2E2E2',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primaryRed;
                      e.target.style.boxShadow = '0 0 0 3px rgba(198, 40, 40, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E2E2E2';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Role Selection */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Select Role</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    style={{
                      fontFamily: 'inherit',
                      padding: '10px 14px',
                      border: '1px solid #E2E2E2',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primaryRed;
                      e.target.style.boxShadow = '0 0 0 3px rgba(198, 40, 40, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E2E2E2';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="find-job">Find Job</option>
                    <option value="jobseeker">Job Seeker</option>
                    <option value="employer">Employer</option>
                    <option value="employee">Employee</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      minLength="8"
                      style={{
                        fontFamily: 'inherit',
                        padding: '10px 14px',
                        border: '1px solid #E2E2E2',
                        borderRadius: '8px 0 0 8px',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primaryRed;
                        e.target.style.boxShadow = '0 0 0 3px rgba(198, 40, 40, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#E2E2E2';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <i className="bi bi-eye-slash-fill"></i>
                      ) : (
                        <i className="bi bi-eye-fill"></i>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <div className="text-danger small mt-1">{passwordError}</div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        fontFamily: 'inherit',
                        padding: '10px 14px',
                        border: '1px solid #E2E2E2',
                        borderRadius: '8px 0 0 8px',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primaryRed;
                        e.target.style.boxShadow = '0 0 0 3px rgba(198, 40, 40, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#E2E2E2';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <i className="bi bi-eye-slash-fill"></i>
                      ) : (
                        <i className="bi bi-eye-fill"></i>
                      )}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <div className="form-text text-danger">
                      Passwords do not match
                    </div>
                  )}
                </div>

                {/* Security Verification CAPTCHA */}
                <Captcha ref={captchaRef} className="mb-3" />

                {/* Sign Up Button - Same style as Login */}
                <button
                  type="submit"
                  className="btn w-100 py-2"
                  style={{
                    backgroundColor: colors.primaryRed,
                    color: colors.white,
                    border: 'none',
                    transition: 'all 0.3s ease',
                    padding: '12px 32px',
                    borderRadius: '50px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    letterSpacing: '0.5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit'
                  }}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = colors.darkRed;
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(198, 40, 40, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = colors.primaryRed;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </button>

                {/* Login Link */}
                <div className="text-center mt-3">
                  <span style={{ color: colors.darkGray, fontFamily: 'inherit' }}>Already have an account? </span>
                  <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: colors.primaryRed, fontFamily: 'inherit' }}>
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

