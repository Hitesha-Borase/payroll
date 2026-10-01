import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaBars, FaSignOutAlt, FaUser, FaHeadset, FaBookOpen } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import toast from 'react-hot-toast';
import { useAuth } from "../hooks/useAuth";
import Profile from "../Profile/Profile";
import LanguageSwitcher from "../components/LanguageSwitcher";
import HowToUseModal from "../components/HowToUseModal";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const firstFocusableRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load user profile from AuthContext
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "User",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "User",
        branch: "All Branches",
        notifyEmail: true,
        notifySMS: false,
      });
    }
  }, [user]);

  // Prevent background scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showProfileModal ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [showProfileModal]);

  // Focus management for modal
  useEffect(() => {
    if (showProfileModal && firstFocusableRef.current) {
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }

    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showProfileModal) setShowProfileModal(false);
        if (showDropdown) setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileModal, showDropdown]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      toast.success("Profile saved!");
      setShowProfileModal(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <>
      <style>
        {`
          .navbar-toggle-btn {
            background-color: #FFFFFF;
            border: 1px solid #CBD5E1;
            color: #334155;
            border-radius: 8px;
            transition: all 0.2s ease;
            padding: 0.4rem 0.55rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .navbar-toggle-btn:hover {
            background-color: #FEF2F2;
            border-color: #C62828;
            color: #C62828;
          }

          .navbar-toggle-btn svg {
            color: currentColor;
          }

          .logout-btn {
            background-color: transparent;
            border: 1px solid #CBD5E1;
            color: #475569;
            border-radius: 8px;
            transition: all 0.2s ease;
            padding: 0.35rem 0.65rem;
            font-size: 0.82rem;
            font-weight: 600;
          }

          .logout-btn:hover {
            background-color: #FEF2F2;
            border-color: #C62828;
            color: #C62828;
          }

          .profile-icon-btn {
            border: none;
            background: transparent;
            cursor: pointer;
            transition: transform 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .profile-icon-btn:hover {
            transform: scale(1.08);
          }

          .profile-dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 225px;
            border-radius: 12px;
            background-color: #FFFFFF;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
            border: 1px solid #E2E8F0;
            z-index: 1060;
            animation: fadeInScale 0.15s ease-out;
            overflow: hidden;
          }

          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-6px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .profile-dropdown-item {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 9px 16px;
            font-size: 0.84rem;
            font-weight: 500;
            color: #334155;
            background: transparent;
            border: none;
            text-align: left;
            transition: all 0.15s ease;
            cursor: pointer;
          }

          .profile-dropdown-item:hover {
            background-color: #FEF2F2;
            color: #C62828;
          }

          .nav-link-custom {
            text-decoration: none;
            color: #4A4A4A;
            font-weight: 600;
            font-size: 0.85rem;
            transition: color 0.2s ease;
          }
          .nav-link-custom:hover {
            color: #C62828;
          }

          .navbar-brand-text {
            font-size: 1.2rem;
            font-weight: 800;
            color: #B71C1C;
            letter-spacing: 0.5px;
            font-family: 'Poppins', sans-serif;
            line-height: 1.2;
            transition: all 0.2s ease;
          }

          @media (max-width: 768px) {
            .navbar-brand-text {
              font-size: 1rem;
            }
          }

          @media (max-width: 576px) {
            .navbar-brand-text {
              display: none;
            }
            .navbar-toggle-btn {
              padding: 0.35rem 0.45rem;
            }
            .logout-btn {
              padding: 0.35rem 0.55rem;
            }
          }
        `}
      </style>

      <nav
        className="navbar navbar-expand px-2 px-sm-3 py-2 d-flex justify-content-between align-items-center fixed-top"
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          height: "var(--navbar-height)",
        }}
      >
        <div className="d-flex align-items-center gap-2 gap-sm-3 w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <button
              className="btn navbar-toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <FaBars />
            </button>

            <div className="d-flex align-items-center">
              <img
                src="/kiaan_logo.png"
                alt="Kiaan Technology Logo"
                style={{
                  height: "32px",
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: "4px",
                  marginRight: "8px",
                  flexShrink: 0
                }}
              />
              <span className="navbar-brand-text d-none d-md-inline" style={{ letterSpacing: '0.6px', fontWeight: 800 }}>
                KIAAN TECHNOLOGY
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <LanguageSwitcher />

            {/* Profile Icon with Dropdown */}
            <div className="position-relative" ref={dropdownRef}>
              <button
                className="profile-icon-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User Account Menu"
                aria-expanded={showDropdown}
              >
                <FaUserCircle size={28} color="#C62828" />
              </button>

              {showDropdown && (
                <div className="profile-dropdown-menu">
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-bottom bg-light">
                    <div className="fw-bold text-truncate text-dark" style={{ fontSize: '0.88rem' }}>
                      {user?.name || "User Account"}
                    </div>
                    <div className="text-muted small text-truncate" style={{ fontSize: '0.74rem' }}>
                      {user?.email || ""}
                    </div>
                    <div className="mt-1">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: '#FEF2F2',
                          color: '#C62828',
                          border: '1px solid #FECACA',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          borderRadius: '4px'
                        }}
                      >
                        {user?.role ? user.role.toUpperCase() : 'USER'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown items */}
                  <div className="py-1">
                    <button
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowProfileModal(true);
                      }}
                    >
                      <FaUser className="me-2 text-danger" style={{ fontSize: '0.85rem' }} />
                      <span>Profile</span>
                    </button>

                    <button
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowHowToUse(true);
                      }}
                    >
                      <FaBookOpen className="me-2 text-danger" style={{ fontSize: '0.85rem' }} />
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <span>How to Use Guide</span>
                        <span 
                          className="badge ms-2"
                          style={{ 
                            backgroundColor: '#FEF2F2', 
                            color: '#C62828', 
                            border: '1px solid #FECACA', 
                            fontSize: '0.62rem', 
                            padding: '2px 5px' 
                          }}
                        >
                          MANUAL
                        </span>
                      </div>
                    </button>

                    <button
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        const role = (user?.role || '').toLowerCase();
                        if (role === 'superadmin') {
                          navigate('/superadmin/support-tickets');
                        } else {
                          navigate('/admin/support-tickets');
                        }
                      }}
                    >
                      <FaHeadset className="me-2 text-danger" style={{ fontSize: '0.85rem' }} />
                      <span>Support Tickets</span>
                    </button>
                  </div>

                  <div className="border-top py-1">
                    <button
                      className="profile-dropdown-item text-danger"
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                    >
                      <FaSignOutAlt className="me-2" style={{ fontSize: '0.85rem' }} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* How to Use Interactive Guide Modal */}
      <HowToUseModal
        show={showHowToUse}
        onClose={() => setShowHowToUse(false)}
        userRole={user?.role}
        currentPath={location.pathname}
      />

      {showProfileModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(3px)", zIndex: 1060 }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{ maxWidth: '680px', width: '95%', margin: '1.5rem auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header border-0 pb-0 pt-3 px-3 px-sm-4 bg-light d-flex justify-content-end">
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-0">
                <Profile onUpdate={(updated) => {
                  setShowProfileModal(false);
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
