import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Captcha from "../components/Captcha";
import "./AuthPages.css";

const colors = {
    primaryRed: '#C62828',
    darkRed: '#B71C1C',
    lightBeige: '#F7EFE9',
    white: '#FFFFFF',
    black: '#000000',
    darkGray: '#4A4A4A',
    lightGray: '#E2E2E2',
};

const buttonStyles = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    border: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '20px',
    transition: 'all 0.3s ease'
};

const AdminLogin = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const captchaRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (captchaRef.current && !captchaRef.current.validate()) {
            return;
        }

        setLoading(true);

        try {
            const result = await adminLogin(email, password);

            if (result.success) {
                const userRole = result.data?.role?.toLowerCase();
                if (userRole === 'admin' || userRole === 'superadmin') {
                    navigate(userRole === 'superadmin' ? "/superadmin/dashboard" : "/admin/dashboard");
                } else {
                    setError("Access denied. Admin access only.");
                }
            } else {
                setError(result.error || "Login failed.");
            }
        } catch (err) {
            setError("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center px-3 py-4 auth-container" style={{ backgroundColor: colors.lightBeige }}>
            {/* Back to Website Button */}
            <div className="w-100 d-flex justify-content-start mb-2 mb-md-3" style={{ maxWidth: "450px" }}>
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
            <div className="card shadow-lg p-4 p-md-5 auth-card" style={{ maxWidth: "450px", width: "100%", borderRadius: "20px", backgroundColor: colors.white }}>
                <div className="text-center mb-3">
                    <img src="/kiaan_logo.png" alt="Kiaan Technology Logo" style={{ height: "65px", width: "auto", objectFit: "contain" }} />
                </div>
                <h2 className="text-center fw-bold mb-2" style={{ color: colors.primaryRed }}>Admin Access</h2>
                <p className="text-center text-muted mb-4">Secure Gateway for Administrators</p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px' }}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px' }}
                        />
                    </div>

                    {/* Security Verification CAPTCHA */}
                    <Captcha ref={captchaRef} className="mb-2" />

                    <button
                        type="submit"
                        style={buttonStyles}
                        disabled={loading}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                    >
                        {loading ? "Verifying..." : "Login to Workspace"}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <span onClick={() => navigate('/login')} style={{ color: colors.primaryRed, cursor: 'pointer', fontSize: '14px' }}>Back to Staff Login</span>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
