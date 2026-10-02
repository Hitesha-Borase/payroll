import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { useState, useEffect } from "react";
// LandingPage
import LandingPage from "../LandingPage.jsx";
// Layout
import Navbar from "./Layout/Navbar";
import Sidebar from "./Layout/Sidebar";
// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./Auth/Login";
import AdminLogin from "./Auth/AdminLogin";
import Signup from "./Auth/Signup";
import ForgotPassword from "./Auth/ForgotPassword";
import RegistrationForm from "./components/RegistrationForm";

// Admin
import AdminDashboard from "./Dashboard/Admin/AdminDashboard";
import AddCredit from "./Dashboard/Admin/AddCredit";
import AllTransactions from "./Dashboard/Admin/AllTransactions";
import EmployerList from "./Dashboard/Admin/EmployerList";
import JobPortal from "./Dashboard/Admin/JobPortal";
import BillCompanies from "./Dashboard/Admin/BillCompanies";
import PaymentSetup from "./Dashboard/Admin/PaymentSetup";
import AttendanceManagement from "./Dashboard/Admin/AttendanceManagement";
import AdminTraining from "./Dashboard/Admin/AdminTraining";
import UpgradePlan from "./Dashboard/Admin/UpgradePlan";
import AdminSettings from "./Dashboard/Admin/AdminSettings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import Documentation from "./pages/Documentation";
import SupportCenter from "./pages/SupportCenter";
import Unauthorized from "./pages/Unauthorized";
import Brochure from "./pages/Brochure";

// Employer
import EmployerDashboard from "./Dashboard/Employer/EmployerDashboard";
import CreditBalance from "./Dashboard/Employer/MyCredit";
import PayEmployee from "./Dashboard/Employer/PaymentEmployer";
import EmployerTransactions from "./Dashboard/Employer/EmployerTransactions";
import AddEmployee from "./Dashboard/Employer/AddEmployee";
import JobVacancies from "./Dashboard/Employer/JobVacancies";
import EmployerAttendance from "./Dashboard/Employer/EmployerAttendance";
import EmployerTraining from "./Dashboard/Employer/EmployerTraining";

// Employee
import EmployeeDashboard from "./Dashboard/Employee/EmployeeDashboard";
import MySalary from "./Dashboard/Employee/MySalary";
import BillPayment from "./Dashboard/Employee/BillPayment";
import MonthlySalary from "./Dashboard/Employee/MonthlySalary";
import JobApplication from "./Dashboard/Employee/JobApplication";
import EmployeeAttendance from "./Dashboard/Employee/EmployeeAttendance";
import CheckInOut from "./Dashboard/Employee/CheckInOut";
import EmployeeTraining from "./Dashboard/Employee/EmployeeTraining";

// job portal 
import JobDashboard from "./Dashboard/JobPortal/JobDashboard";
import UserProfilePage from "./Dashboard/JobPortal/UserProfilePage";
import JobList from "./Dashboard/JobPortal/JobList";
import SubmitResume from "./Dashboard/JobPortal/SubmitResume";

// Vendor
import VendorDashboard from "./Dashboard/Vendor/VendorDashboard";
import VendorPayments from "./Dashboard/Vendor/Payments/VendorPayments";


import SuperAdminDashboard from "./Dashboard/SuperAdmin/SuperAdminDashboard";
import PlansManagement from "./Dashboard/SuperAdmin/PlansManagement";
import CompanyManagement from "./Dashboard/SuperAdmin/CompanyManagement";
import PaymentsSubscriptions from "./Dashboard/SuperAdmin/PaymentsSubscriptions";

import Settings from "./Dashboard/SuperAdmin/Settings";
import SMTPConfig from "./Dashboard/SuperAdmin/SMTPConfig";
import CompanyRequests from "./Dashboard/SuperAdmin/CompanyRequests";
import UserRequests from "./Dashboard/SuperAdmin/UserRequests";
import SuperAdminSupport from "./Dashboard/SuperAdmin/SuperAdminSupport";
import AdminManagement from "./Dashboard/SuperAdmin/AdminManagement";
import SystemBackup from "./Dashboard/Admin/SystemBackup";
import AdminAuditLogs from "./Dashboard/Admin/AdminAuditLogs";
import HowToUsePage from "./pages/HowToUsePage";

// PWA Install Prompt & Splash Screen
import PWAInstallPrompt from "./PWA/PWAInstallPrompt";
import SplashScreen from "./components/SplashScreen";
import { Toaster } from 'react-hot-toast';

function App() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();

    // Auto-hide sidebar on mobile
    useEffect(() => {
        if (window.innerWidth <= 768) {
            setIsSidebarCollapsed(true);
        }
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => !prev);
    };

    // Pages where sidebar + navbar should NOT show
    const hideLayout =
        location.pathname === "/" ||
        location.pathname === "/features" ||
        location.pathname === "/benefits" ||
        location.pathname === "/testimonials" ||
        location.pathname === "/about" ||
        location.pathname === "/pricing" ||
        location.pathname === "/contact" ||
        location.pathname === "/contact-us" ||
        location.pathname === "/login" ||
        location.pathname === "/admin/login" ||
        location.pathname === "/signup" ||
        location.pathname === "/forgot-password" ||
        location.pathname === "/privacy-policy" ||
        location.pathname === "/terms-conditions" ||
        location.pathname === "/documentation" ||
        location.pathname === "/support-center" ||
        location.pathname === "/brochure" ||
        location.pathname === "/register" ||
        location.pathname.startsWith("/register");

    return (
        <>
            {/* Startup Splash Screen */}
            <SplashScreen />

            <Toaster position="top-right" />
            {/* PWA Floating Install Prompt & Offline Banner */}
            <PWAInstallPrompt />

            {hideLayout ? (
                // -------- AUTH / PUBLIC PAGES --------
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/features" element={<LandingPage />} />
                    <Route path="/benefits" element={<LandingPage />} />
                    <Route path="/testimonials" element={<LandingPage />} />
                    <Route path="/about" element={<LandingPage />} />
                    <Route path="/pricing" element={<LandingPage />} />
                    <Route path="/contact" element={<LandingPage />} />
                    <Route path="/contact-us" element={<LandingPage />} />
                    <Route path="/brochure" element={<Brochure />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-conditions" element={<TermsConditions />} />
                    <Route path="/documentation" element={<Documentation />} />
                    <Route path="/support-center" element={<SupportCenter />} />
                    <Route path="/register" element={<RegistrationForm />} />
                    <Route path="/register/:type" element={<RegistrationForm />} />
                </Routes>
            ) : (
                // -------- MAIN LAYOUT --------
                <>
                    <Navbar toggleSidebar={toggleSidebar} />

                    <div className="main-content">
                        {/* Sidebar */}
                        <Sidebar
                            collapsed={isSidebarCollapsed}
                            setCollapsed={setIsSidebarCollapsed}
                        />

                        {/* Right Content */}
                        <div className={`right-side-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
                            <Routes>
                                {/* ---------------- SUPERADMIN ---------------- */}
                                <Route path="/superadmin/dashboard" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />
                                <Route path="/superadmin/company-requests" element={<ProtectedRoute allowedRoles={['superadmin']}><CompanyRequests /></ProtectedRoute>} />
                                <Route path="/superadmin/user-requests" element={<ProtectedRoute allowedRoles={['superadmin']}><UserRequests /></ProtectedRoute>} />
                                <Route path="/superadmin/admin-management" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminManagement /></ProtectedRoute>} />
                                <Route path="/superadmin/plans-management" element={<ProtectedRoute allowedRoles={['superadmin']}><PlansManagement /></ProtectedRoute>} />
                                <Route path="/superadmin/company-management" element={<ProtectedRoute allowedRoles={['superadmin']}><CompanyManagement /></ProtectedRoute>} />
                                <Route path="/superadmin/payments-subscriptions" element={<ProtectedRoute allowedRoles={['superadmin']}><PaymentsSubscriptions /></ProtectedRoute>} />
                                <Route path="/superadmin/support-tickets" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminSupport /></ProtectedRoute>} />
                                <Route path="/superadmin/settings" element={<ProtectedRoute allowedRoles={['superadmin']}><Settings /></ProtectedRoute>} />
                                <Route path="/superadmin/smtp-config" element={<ProtectedRoute allowedRoles={['superadmin']}><SMTPConfig /></ProtectedRoute>} />
                                <Route path="/superadmin/backups" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><SystemBackup /></ProtectedRoute>} />
                                <Route path="/superadmin/how-to-use" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><HowToUsePage /></ProtectedRoute>} />


                                {/* ---------------- ADMIN ---------------- */}
                                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                                <Route path="/admin/add-credit" element={<ProtectedRoute allowedRoles={['admin']}><AddCredit /></ProtectedRoute>} />
                                <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['admin']}><AllTransactions /></ProtectedRoute>} />
                                <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminAuditLogs /></ProtectedRoute>} />
                                <Route path="/admin/backups" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><SystemBackup /></ProtectedRoute>} />
                                <Route path="/admin/employer-list" element={<ProtectedRoute allowedRoles={['admin']}><EmployerList /></ProtectedRoute>} />
                                <Route path="/admin/job-portal" element={<ProtectedRoute allowedRoles={['admin']}><JobPortal /></ProtectedRoute>} />
                                <Route path="/admin/bill-companies" element={<ProtectedRoute allowedRoles={['admin']}><BillCompanies /></ProtectedRoute>} />
                                <Route path="/admin/payment-setup" element={<ProtectedRoute allowedRoles={['admin']}><PaymentSetup /></ProtectedRoute>} />
                                <Route path="/admin/attendance-management" element={<ProtectedRoute allowedRoles={['admin']}><AttendanceManagement /></ProtectedRoute>} />
                                <Route path="/admin/admin-training" element={<ProtectedRoute allowedRoles={['admin']}><AdminTraining /></ProtectedRoute>} />
                                <Route path="/admin/upgrade-plan" element={<ProtectedRoute allowedRoles={['admin']}><UpgradePlan /></ProtectedRoute>} />
                                <Route path="/admin/support-tickets" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><SuperAdminSupport /></ProtectedRoute>} />
                                <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminSettings /></ProtectedRoute>} />
                                <Route path="/admin/how-to-use" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><HowToUsePage /></ProtectedRoute>} />


                                {/* ---------------- EMPLOYER ---------------- */}
                                <Route path="/employer/dashboard" element={<ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>} />
                                <Route path="/employer/credits/balance" element={<ProtectedRoute allowedRoles={['employer']}><CreditBalance /></ProtectedRoute>} />
                                <Route path="/employer/payment" element={<ProtectedRoute allowedRoles={['employer']}><PayEmployee /></ProtectedRoute>} />
                                <Route path="/employer/transactions" element={<ProtectedRoute allowedRoles={['employer']}><EmployerTransactions /></ProtectedRoute>} />
                                <Route path="/employer/add-employee" element={<ProtectedRoute allowedRoles={['employer']}><AddEmployee /></ProtectedRoute>} />
                                <Route path="/employer/job-vacancies" element={<ProtectedRoute allowedRoles={['employer']}><JobVacancies /></ProtectedRoute>} />
                                <Route path="/employer/employer-attendance" element={<ProtectedRoute allowedRoles={['employer']}><EmployerAttendance /></ProtectedRoute>} />
                                <Route path="/employer/employer-training" element={<ProtectedRoute allowedRoles={['employer']}><EmployerTraining /></ProtectedRoute>} />
                                <Route path="/employer/how-to-use" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><HowToUsePage /></ProtectedRoute>} />


                                {/* ---------------- EMPLOYEE ---------------- */}
                                <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
                                <Route path="/employee/salary" element={<ProtectedRoute allowedRoles={['employee']}><MySalary /></ProtectedRoute>} />
                                <Route path="/employee/bill-payment" element={<ProtectedRoute allowedRoles={['employee']}><BillPayment /></ProtectedRoute>} />
                                <Route path="/employee/attendance" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeAttendance /></ProtectedRoute>} />
                                <Route path="/employee/training" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeTraining /></ProtectedRoute>} />
                                <Route path="/employee/check-in" element={<ProtectedRoute allowedRoles={['employee']}><CheckInOut /></ProtectedRoute>} />
                                <Route path="/employee/bank-details" element={<ProtectedRoute allowedRoles={['employee']}><MonthlySalary /></ProtectedRoute>} />
                                <Route path="/employee/job-application" element={<ProtectedRoute allowedRoles={['employee']}><JobApplication /></ProtectedRoute>} />
                                <Route path="/employee/how-to-use" element={<ProtectedRoute allowedRoles={['employee', 'admin', 'superadmin']}><HowToUsePage /></ProtectedRoute>} />

                                {/* ---------------- JOB PORTAL ---------------- */}
                                <Route path="/job-portal/dashboard" element={<ProtectedRoute allowedRoles={['jobseeker', 'admin', 'superadmin', 'employer', 'employee']}><JobDashboard /></ProtectedRoute>} />
                                <Route path="/job-portal/profile" element={<ProtectedRoute allowedRoles={['jobseeker', 'employee', 'employer', 'admin', 'superadmin']}><UserProfilePage /></ProtectedRoute>} />
                                <Route path="/job-portal/job-list" element={<ProtectedRoute allowedRoles={['jobseeker', 'employee', 'employer', 'admin', 'superadmin']}><JobList /></ProtectedRoute>} />
                                <Route path="/job-portal/submit-resume" element={<ProtectedRoute allowedRoles={['jobseeker', 'employee', 'employer', 'admin', 'superadmin']}><SubmitResume /></ProtectedRoute>} />
                                <Route path="/job-portal/how-to-use" element={<ProtectedRoute allowedRoles={['jobseeker', 'employee', 'employer', 'admin', 'superadmin']}><HowToUsePage /></ProtectedRoute>} />

                                {/* ---------------- VENDOR ---------------- */}
                                <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={['vendor', 'admin', 'superadmin']}><VendorDashboard /></ProtectedRoute>} />
                                <Route path="/vendor/payments" element={<ProtectedRoute allowedRoles={['vendor', 'admin', 'superadmin']}><VendorPayments /></ProtectedRoute>} />
                                <Route path="/vendor/how-to-use" element={<ProtectedRoute allowedRoles={['vendor', 'admin', 'superadmin']}><HowToUsePage /></ProtectedRoute>} />

                                {/* ---------------- SYSTEM / 403 ---------------- */}
                                <Route path="/unauthorized" element={<Unauthorized />} />
                            </Routes>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default App;
