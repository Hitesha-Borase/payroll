import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartBar,
    faUsers,
    faCreditCard,
    faList,
    faWallet,
    faHandHoldingUsd,
    faMoneyBillWave,
    faUserGroup,
    faClipboard,
    faBriefcase,
    faFileInvoiceDollar,
    faBookOpen,
    faSignInAlt,
    faUserCheck,
    faClipboardCheck,
    faUser,
    faUserShield,
    faBuilding,
    faTags,
    faGear,
    faHeadset,
    faDatabase
} from "@fortawesome/free-solid-svg-icons";

import "./Sidebar.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role) setUserRole(role.toUpperCase());
    }, []);

    useEffect(() => {
        const handleStorage = () => {
            const role = localStorage.getItem("userRole");
            if (role) setUserRole(role.toUpperCase());
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const toggleMenu = (key) => {
        setActiveMenu(activeMenu === key ? null : key);
    };

    const isActive = (path) => location.pathname === path;

    const handleNavigate = (path) => {
        navigate(path);
        if (window.innerWidth <= 768) setCollapsed(true);
    };

    // ---------------- MENUS -----------------
    const allMenus = {
        SUPERADMIN: [
            {
                name: "Dashboard",
                icon: faChartBar,
                path: "/superadmin/dashboard",
            },
            {
                name: "Company Requests",
                icon: faBuilding,
                path: "/superadmin/company-requests",
            },
            {
                name: "User Requests",
                icon: faUsers,
                path: "/superadmin/user-requests",
            },
            {
                name: "Admin Management",
                icon: faUserShield,
                path: "/superadmin/admin-management",
            },
            {
                name: "Plans Management",
                icon: faTags,
                path: "/superadmin/plans-management",
            },
            {
                name: "Company Management",
                icon: faBuilding,
                path: "/superadmin/company-management",
            },
            {
                name: "Payments & Subscriptions",
                icon: faWallet,
                path: "/superadmin/payments-subscriptions",
            },
            {
                name: "Support Tickets",
                icon: faHeadset,
                path: "/superadmin/support-tickets",
            }
        ],

        ADMIN: [
            {
                name: "Dashboard",
                icon: faChartBar,
                path: "/admin/dashboard",
            },
            {
                name: "Employers",
                icon: faUsers,
                path: "/admin/employer-list",
            },
            {
                name: "Credit",
                icon: faWallet,
                path: "/admin/add-credit",
            },
            {
                name: "Attendance Management",
                icon: faUserCheck,
                path: "/admin/attendance-management",
            },
            {
                name: "Training",
                icon: faBookOpen,
                path: "/admin/admin-training",
            },
            {
                name: "Job Portal",
                icon: faUserGroup,
                path: "/admin/job-portal",
            },
            {
                name: "Bill Companies",
                icon: faClipboard,
                path: "/admin/bill-companies",
            },
            {
                name: "Payment Setup",
                icon: faGear,
                path: "/admin/payment-setup",
            },
            {
                name: "Transactions",
                icon: faList,
                path: "/admin/transactions",
            },
            {
                name: "Audit Logs",
                icon: faClipboardCheck,
                path: "/admin/audit-logs",
            },
            {
                name: "System Backup",
                icon: faDatabase,
                path: "/admin/backups",
            },
            {
                name: "Support Tickets",
                icon: faHeadset,
                path: "/admin/support-tickets",
            },
        ],

        EMPLOYER: [
            {
                name: "Dashboard",
                icon: faChartBar,
                path: "/employer/dashboard",
            },
            {
                name: "My Credits",
                icon: faWallet,
                path: "/employer/credits/balance",
            },
            {
                name: "Employees / Vendors",
                icon: faUsers,
                path: "/employer/add-employee",
            },
            {
                name: "Attendance",
                icon: faUserCheck,
                path: "/employer/employer-attendance",
            },
            {
                name: "Training",
                icon: faBookOpen,
                path: "/employer/Employer-Training",
            },

            {
                name: "Job Vacancies",
                icon: faWallet,
                path: "/employer/job-vacancies",
            },

            {
                name: "Payments",
                icon: faHandHoldingUsd,
                path: "/employer/payment",
            },
            {
                name: "Job Portal",
                icon: faUserGroup,
                path: "/job-portal/dashboard",
            },
            {
                name: "Transactions",
                icon: faList,
                path: "/employer/transactions",
            },
        ],

        EMPLOYEE: [
            {
                name: "Dashboard",
                icon: faChartBar,
                path: "/employee/dashboard",
            },
            {
                name: "My Salary",
                icon: faMoneyBillWave,
                path: "/employee/salary",
            },
            {
                name: "Bill Payment",
                icon: faCreditCard,
                path: "/employee/bill-payment",
            },
            {
                name: "Attendance",
                icon: faUserCheck,
                path: "/employee/attendance",
            },
            {
                name: "Training",
                icon: faBookOpen,
                path: "/employee/training",
            },
            {
                name: "Check-In",
                icon: faSignInAlt,
                path: "/employee/check-in",
            },
            {
                name: "Bank Details",
                icon: faFileInvoiceDollar,
                path: "/employee/bank-details",
            },
            {
                name: "Job Application",
                icon: faBriefcase,
                path: "/employee/job-application",
            }
        ],

        JOBSEEKER: [
            {
                name: "Dashboard",
                icon: faChartBar,
                path: "/job-portal/dashboard",
            },
            {
                name: "Applied Jobs",
                icon: faClipboardCheck,
                path: "/job-portal/job-list",
            },
            {
                name: "Submit Resume",
                icon: faFileInvoiceDollar,
                path: "/job-portal/submit-resume",
            },
            {
                name: "Profile",
                icon: faUser,
                path: "/job-portal/profile",
            }
        ],

        VENDOR: [
            {
                name: "Dashboard",
                icon: faChartBar,
                path: "/vendor/dashboard",
            },
            {
                name: "My Payments",
                icon: faMoneyBillWave,
                path: "/vendor/payments",
            },
        ],
    };

    const userMenus = userRole ? allMenus[userRole] : allMenus.ADMIN;

    if (!userRole) {
        return (
            <div className="sidebar-container">
                <div className="sidebar p-3 text-center">
                    <div className="spinner-border text-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar">
                <div className={`sidebar-brand px-3 pb-3 mb-2 border-bottom d-flex align-items-center ${collapsed ? "justify-content-center" : ""}`}>
                    <img
                        src="/kiaan_logo.png"
                        alt="Kiaan Technology Logo"
                        style={{
                            height: collapsed ? "32px" : "34px",
                            width: "auto",
                            objectFit: "contain",
                            marginRight: collapsed ? "0" : "10px",
                            flexShrink: 0,
                            transition: "all 0.3s ease"
                        }}
                    />
                    {!collapsed && (
                        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                            <span className="fw-bold text-dark text-nowrap" style={{ fontSize: "0.85rem", letterSpacing: "0.3px", lineHeight: "1.2" }}>
                                KIAAN TECHNOLOGY
                            </span>
                            <span className="text-muted text-nowrap" style={{ fontSize: "0.68rem", lineHeight: "1.2" }}>
                                Workforce &amp; Payroll
                            </span>
                        </div>
                    )}
                </div>
                <ul className="menu">
                    {userMenus.map((menu, index) => (
                        <li key={index} className="menu-item">
                            <div
                                className={`menu-link ${isActive(menu.path) ? "active" : ""}`}
                                onClick={() => handleNavigate(menu.path)}
                            >
                                <FontAwesomeIcon icon={menu.icon} className="menu-icon" />
                                {!collapsed && <span className="menu-text">{menu.name}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
