import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaBars, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { useAuth } from "../hooks/useAuth";
import Profile from "../Profile/Profile";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const firstFocusableRef = useRef(null);

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
      if (e.key === 'Escape' && showProfileModal) {
        setShowProfileModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileModal]);

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
          }

          .profile-icon-btn:hover {
            transform: scale(1.1);
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

            <button
              className="profile-icon-btn"
              onClick={() => setShowProfileModal(true)}
              aria-label="Open Profile"
            >
              <FaUserCircle size={28} color="#C62828" />
            </button>

            <button
              onClick={handleLogout}
              className="btn d-flex align-items-center gap-1 gap-sm-2 logout-btn"
              aria-label="Logout"
            >
              <FaSignOutAlt size={15} />
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {showProfileModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-0">
                <Profile onUpdate={(updated) => {
                  // Optional: update local user context if needed
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
