import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Captcha from "../components/Captcha";
import "./AuthPages.css";

// --- Color Palette ---
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  lightBeige: '#F7EFE9',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
  adminGold: '#FFD700', // Gold color for admin mode indicator
};

// --- Reusable Button Styles ---
const buttonStyles = {
  backgroundColor: colors.primaryRed,
  color: colors.white,
  border: 'none',
  transition: 'background-color 0.2s ease-in-out',
  padding: '8px 16px',
  borderRadius: '6px',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const Login = () => {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const captchaRef = useRef(null);

  // State for Hidden Admin Mode
  const [isAdminMode, setIsAdminMode] = useState(false);

  const roleRedirectMap = {
    superadmin: "/superadmin/dashboard",
    admin: "/admin/dashboard",
    employer: "/employer/dashboard",
    employee: "/employee/dashboard",
    jobseeker: "/job-portal/dashboard",
    vendor: "/vendor/dashboard",
  };

  const toggleAdminMode = () => {
    setIsAdminMode(prev => !prev);
    setError(""); // Clear error when switching modes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (captchaRef.current && !captchaRef.current.validate()) {
      return;
    }

    setLoading(true);

    try {
      // Use specialized adminLogin if mode is active, otherwise standard login
      const result = isAdminMode
        ? await adminLogin(email, password)
        : await login(email, password);

      if (result.success) {
        const userRole = result.data?.role?.toLowerCase();
        const redirectPath = roleRedirectMap[userRole] || "/";
        navigate(redirectPath);
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
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
      {/* Back to Website Button */}
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
      <div className="card shadow w-100 auth-card" style={{
        maxWidth: "950px",
        borderRadius: "1.5rem",
        backgroundColor: colors.white,
        border: isAdminMode ? `2px solid ${colors.adminGold}` : 'none' // Subtle indicator for admin
      }}>
        <div className="row g-0 align-items-stretch">
          <div className="col-md-6 d-none d-md-block auth-image-col" style={{ borderRadius: '1.5rem 0 0 1.5rem' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isAdminMode
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(198, 40, 40, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(198, 40, 40, 0.05) 0%, rgba(183, 28, 28, 0.05) 100%)',
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

          <div
            className="col-12 col-md-6 auth-form-col"
            style={{ animation: 'fadeInRight 0.6s ease-out' }}
          >
            <div className="w-100">
              <div className="text-center mb-3">
                <img src="/kiaan_logo.png" alt="Kiaan Technology Logo" style={{ height: "60px", width: "auto", objectFit: "contain" }} />
              </div>
              {/* HIDDEN TRIGGER: Double clicking "Welcome Back!" toggles Admin Mode */}
              <h2
                className="fw-bold mb-3 text-center"
                onDoubleClick={toggleAdminMode}
                style={{
                  color: isAdminMode ? colors.primaryRed : colors.black,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {isAdminMode ? "Admin Workspace" : "Welcome Back!"}
              </h2>

              <p className="text-center mb-4" style={{ color: colors.darkGray, fontFamily: 'inherit' }}>
                {isAdminMode ? "Secure administrative access only" : "Please login to your account"}
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: 'inherit', fontWeight: '500' }}>
                    {isAdminMode ? "Admin Email" : "Email address"}
                  </label>
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
                    }}
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0" style={{ fontFamily: 'inherit', fontWeight: '500' }}>Password</label>
                    <Link
                      to="/forgot-password"
                      style={{
                        fontSize: '0.85rem',
                        color: colors.primaryRed,
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontFamily: 'inherit'
                      }}
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        fontFamily: 'inherit',
                        padding: '10px 14px',
                        border: '1px solid #E2E2E2',
                        borderRadius: '8px 0 0 8px',
                      }}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                    </button>
                  </div>
                </div>

                {/* Security Verification CAPTCHA */}
                <Captcha ref={captchaRef} className="mb-3" />

                <button
                  type="submit"
                  className="btn w-100 py-2"
                  style={{
                    ...buttonStyles,
                    backgroundColor: isAdminMode ? '#333' : colors.primaryRed,
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : isAdminMode ? "Authorize Admin Access" : "Login"}
                </button>

                {!isAdminMode && (
                  <div className="mt-3 text-center">
                    <span style={{ color: colors.darkGray, fontFamily: 'inherit' }}>Don't have an account? </span>
                    <span
                      onClick={() => navigate('/signup')}
                      style={{ color: colors.primaryRed, cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}
                    >
                      Sign Up
                    </span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;