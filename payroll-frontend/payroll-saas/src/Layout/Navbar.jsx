import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaBars, FaSignOutAlt, FaUser, FaHeadset, FaBookOpen, FaGlobe, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';
import { useAuth } from "../hooks/useAuth";
import { useRegional } from "../context/RegionalContext";
import Profile from "../Profile/Profile";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const { edition: currentEdition, changeEdition, editions } = useRegional();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
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
            min-width: 260px;
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

          .navbar-how-to-use-btn {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background-color: #FFFFFF;
            border: 1.5px solid #C62828;
            color: #C62828;
            border-radius: 12px;
            padding: 6px 14px;
            font-size: 0.88rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(198, 40, 40, 0.08);
            transition: all 0.2s ease;
          }

          .navbar-how-to-use-btn:hover {
            background-color: #C62828;
            color: #FFFFFF;
            box-shadow: 0 4px 12px rgba(198, 40, 40, 0.25);
            transform: translateY(-1px);
          }

          .navbar-how-to-use-btn:active {
            transform: translateY(0);
          }

          @media (max-width: 576px) {
            .navbar-how-to-use-btn {
              padding: 5px 8px;
              font-size: 0.78rem;
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
            {/* Header 'How to Use' Button */}
            <button
              type="button"
              className="navbar-how-to-use-btn"
              onClick={() => {
                const curPath = (location.pathname || '').toLowerCase();
                const role = (user?.role || localStorage.getItem('userRole') || '').toLowerCase();
                
                let target = '/admin/how-to-use';
                if (curPath.includes('/superadmin') || role.includes('super')) {
                  target = '/superadmin/how-to-use';
                } else if (curPath.includes('/employer') || role.includes('employer')) {
                  target = '/employer/how-to-use';
                } else if (curPath.includes('/employee') || role.includes('employee')) {
                  target = '/employee/how-to-use';
                } else if (curPath.includes('/vendor') || role.includes('vendor')) {
                  target = '/vendor/how-to-use';
                } else if (curPath.includes('/job') || role.includes('job')) {
                  target = '/job-portal/how-to-use';
                }
                navigate(target);
              }}
              title="How to Use this Dashboard"
            >
              <FaBookOpen size={14} />
              <span>How to Use</span>
            </button>

            {/* Header 'Help Desk' Button next to How to Use */}
            <button
              type="button"
              className="navbar-how-to-use-btn"
              onClick={() => {
                const role = (user?.role || localStorage.getItem('userRole') || '').toLowerCase();
                if (role.includes('super')) {
                  navigate('/superadmin/support-tickets');
                } else {
                  navigate('/admin/support-tickets');
                }
              }}
              title="Open Help Desk / Support Tickets"
            >
              <FaHeadset size={14} />
              <span>Help Desk</span>
            </button>

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
                <div className="profile-dropdown-menu notranslate" translate="no">
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-bottom bg-light notranslate" translate="no">
                    <div className="fw-bold text-truncate text-dark notranslate" translate="no" style={{ fontSize: '0.88rem' }}>
                      {user?.name || "User Account"}
                    </div>
                    <div className="text-muted small text-truncate notranslate" translate="no" style={{ fontSize: '0.74rem' }}>
                      {user?.email || ""}
                    </div>
                    <div className="mt-1 notranslate" translate="no">
                      <span
                        className="badge notranslate"
                        translate="no"
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

                  {/* Language / Region Switcher Section inside Dropdown */}
                  <div className="border-bottom py-1 notranslate" translate="no">
                    <button
                      type="button"
                      className="profile-dropdown-item d-flex justify-content-between align-items-center notranslate"
                      translate="no"
                      onClick={() => setShowLangMenu(!showLangMenu)}
                      style={{ userSelect: 'none' }}
                    >
                      <div className="d-flex align-items-center notranslate" translate="no">
                        <FaGlobe className="me-2 text-danger" style={{ fontSize: '0.85rem' }} />
                        <span className="notranslate" translate="no">Language / Region</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted small notranslate" translate="no">
                        <span
                          className="badge notranslate"
                          translate="no"
                          style={{
                            backgroundColor: '#FEF2F2',
                            color: '#C62828',
                            border: '1px solid #FECACA',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                        >
                          {currentEdition?.code || 'IN'} ({currentEdition?.currency || '₹'})
                        </span>
                        {showLangMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                      </div>
                    </button>

                    {showLangMenu && (
                      <div className="bg-light px-2 py-1.5 border-top notranslate" translate="no" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {editions.map((ed) => {
                          const isSelected = currentEdition?.id === ed.id;
                          return (
                            <button
                              key={ed.id}
                              type="button"
                              translate="no"
                              className="d-flex align-items-center justify-content-between w-100 border-0 py-1.5 px-2 rounded text-start mb-1 notranslate"
                              style={{
                                backgroundColor: isSelected ? '#FEF2F2' : 'transparent',
                                color: isSelected ? '#C62828' : '#334155',
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'background-color 0.15s'
                              }}
                              onClick={() => {
                                changeEdition(ed);
                                if (ed.lang) {
                                  i18n.changeLanguage(ed.lang);
                                }
                              }}
                            >
                              <div className="d-flex align-items-center gap-2 notranslate" translate="no">
                                <span
                                  className="badge notranslate"
                                  translate="no"
                                  style={{
                                    backgroundColor: isSelected ? '#C62828' : '#E2E8F0',
                                    color: isSelected ? '#FFFFFF' : '#475569',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    minWidth: '26px'
                                  }}
                                >
                                  {ed.code}
                                </span>
                                <span className="notranslate" translate="no">{ed.label}</span>
                              </div>
                              {isSelected && <FaCheck size={12} color="#C62828" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dropdown items */}
                  <div className="py-1 notranslate" translate="no">
                    <button
                      className="profile-dropdown-item notranslate"
                      translate="no"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowProfileModal(true);
                      }}
                    >
                      <FaUser className="me-2 text-danger" style={{ fontSize: '0.85rem' }} />
                      <span className="notranslate" translate="no">Profile</span>
                    </button>
                  </div>

                  <div className="border-top py-1 notranslate" translate="no">
                    <button
                      className="profile-dropdown-item text-danger notranslate"
                      translate="no"
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                    >
                      <FaSignOutAlt className="me-2" style={{ fontSize: '0.85rem' }} />
                      <span className="notranslate" translate="no">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
