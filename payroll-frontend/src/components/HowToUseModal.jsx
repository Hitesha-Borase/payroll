import React, { useState } from 'react';
import { 
  FaBookOpen, 
  FaTimes, 
  FaCheckCircle, 
  FaLightbulb, 
  FaRocket, 
  FaSearch, 
  FaBuilding, 
  FaUsers, 
  FaMoneyBillWave, 
  FaCalendarCheck, 
  FaWhatsapp, 
  FaShieldAlt, 
  FaUserTie, 
  FaBriefcase, 
  FaFileInvoiceDollar, 
  FaClock, 
  FaFileAlt, 
  FaCreditCard, 
  FaGraduationCap,
  FaHeadset
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const DASHBOARD_GUIDES = {
  superadmin: {
    title: 'Super Admin Master Guide',
    subtitle: 'Manage multi-tenant organizations, SaaS subscription packages, tenant onboarding, root administration & platform health.',
    badge: 'SUPER ADMIN DASHBOARD',
    icon: FaShieldAlt,
    color: '#B71C1C',
    steps: [
      {
        number: '1',
        title: 'Review System Health & Revenue Overview',
        desc: 'Inspect total active tenant companies, gross monthly MRR subscriptions, registered employers, and employee capacity metrics from the primary analytics cards.',
        link: '/superadmin'
      },
      {
        number: '2',
        title: 'Configure Plans & Pricing Matrix',
        desc: 'Create and update subscription tiers (Free, Pro, Enterprise), set employee limits, monthly/annual fee structures, and Razorpay gateway integration.',
        link: '/superadmin/plans'
      },
      {
        number: '3',
        title: 'Manage Companies & Approve Requests',
        desc: 'Review incoming company registration applications, verify KYC details, approve new tenants, or suspend delinquent organizations.',
        link: '/superadmin/companies'
      },
      {
        number: '4',
        title: 'Admin Oversight & Platform Support',
        desc: 'Delegate organization administrator roles, track system audit trails, and resolve escalated multi-tenant support tickets.',
        link: '/superadmin/admins'
      }
    ],
    modules: [
      {
        name: 'Dashboard Overview',
        icon: FaRocket,
        desc: 'Real-time multi-tenant telemetry: total revenue, active companies, staff capacity, and critical alert feeds.'
      },
      {
        name: 'Plans Management',
        icon: FaCreditCard,
        desc: 'Design SaaS packages, toggle feature flags (biometric, WhatsApp, payroll), and set billing cycles.'
      },
      {
        name: 'Company Management',
        icon: FaBuilding,
        desc: 'Search, filter, edit, or terminate company subscriptions. Export tenant CSV data and audit compliance.'
      },
      {
        name: 'Admin Management',
        icon: FaUserTie,
        desc: 'Create root administrator credentials, manage role privileges, and inspect admin login sessions.'
      },
      {
        name: 'Company & User Requests',
        icon: FaUsers,
        desc: 'Review pending signup applications, verify business documentation, and grant system access.'
      },
      {
        name: 'Support & Escalation',
        icon: FaHeadset,
        desc: 'Resolve company tenant support tickets, view system errors, and monitor platform uptime.'
      }
    ],
    tips: [
      'Always configure Razorpay Webhooks in Settings to ensure automated subscription renewals.',
      'Check Company Requests daily to approve new business registrations without onboarding delay.',
      'Use SuperAdmin Support tickets to directly communicate with company administrators.'
    ]
  },

  admin: {
    title: 'Company Admin Operations Guide',
    subtitle: 'End-to-end workforce governance, 1-click payroll disbursement, biometric attendance, WhatsApp notifications & wallet balance.',
    badge: 'COMPANY ADMIN DASHBOARD',
    icon: FaBuilding,
    color: '#C62828',
    steps: [
      {
        number: '1',
        title: 'Set Up Company Profile & Business Rules',
        desc: 'Configure working hours (e.g. 8 hrs/day), weekly off rules, overtime multiplier, and statutory deductions (PF, ESI, TDS) in Settings.',
        link: '/admin/settings'
      },
      {
        number: '2',
        title: 'Onboard Employers & Employee Database',
        desc: 'Create organizational units, department hierarchies, assign employers, and add employees with bank details and salary structures.',
        link: '/admin/employers'
      },
      {
        number: '3',
        title: 'Connect WhatsApp & Biometric Devices',
        desc: 'Pair WhatsApp Web via QR code in Settings → WhatsApp Connectivity to enable automated punch alerts, salary slips, and announcement broadcasts.',
        link: '/admin/settings'
      },
      {
        number: '4',
        title: 'Recharge Credit & Run Monthly Payroll',
        desc: 'Add wallet balance via Razorpay gateway, review calculated salaries with deductions, and execute 1-click batch disbursements.',
        link: '/admin/credit'
      }
    ],
    modules: [
      {
        name: 'Workforce Dashboard',
        icon: FaRocket,
        desc: 'Live headcount, monthly payroll expense, today’s biometric attendance percentage, and real-time punch feeds.'
      },
      {
        name: 'Employers & Staff List',
        icon: FaUsers,
        desc: 'Manage company branches, assign managers, add new employees, and update bank/salary records.'
      },
      {
        name: 'Attendance & Biometrics',
        icon: FaCalendarCheck,
        desc: 'Live check-in/out logs, biometric machine sync, leave approvals, overtime reports, and shift management.'
      },
      {
        name: 'Credit Balance & Add Credit',
        icon: FaCreditCard,
        desc: 'Add funds to company disbursement wallet via UPI/Card/NetBanking, view recharge invoices and balance.'
      },
      {
        name: 'All Transactions & Ledger',
        icon: FaMoneyBillWave,
        desc: 'Complete financial audit log: wallet recharges, employee salary payouts, vendor transfers, and payment receipts.'
      },
      {
        name: 'Settings & WhatsApp Alerts',
        icon: FaWhatsapp,
        desc: 'Connect WhatsApp Multi-Device, configure automated payslip triggers, SMTP email servers, and company rules.'
      },
      {
        name: 'Announcements & Messaging',
        icon: FaBookOpen,
        desc: 'Broadcast real-time WhatsApp & email announcements to all staff or targeted departments with 1 click.'
      }
    ],
    tips: [
      'Ensure WhatsApp is connected under Settings → WhatsApp Connectivity so employees receive instant punch & payslip alerts.',
      'Always maintain sufficient wallet credit in "Add Credit" before the monthly payroll disbursement cycle.',
      'Use the Announcements tab to send important holiday notices or emergency alerts directly to employees’ WhatsApp.'
    ]
  },

  employer: {
    title: 'Employer Team Management Guide',
    subtitle: 'Manage departmental team members, daily biometric punches, attendance regularizations, salary payouts & job hiring.',
    badge: 'EMPLOYER DASHBOARD',
    icon: FaUserTie,
    color: '#C62828',
    steps: [
      {
        number: '1',
        title: 'Review Department Overview & Active Staff',
        desc: 'Check your team attendance status, present/absent count, monthly wage commitments, and pending leave requests from the dashboard.',
        link: '/employer'
      },
      {
        number: '2',
        title: 'Add Employees & Set Compensation',
        desc: 'Register new department employees, assign designations, monthly basic wage, allowances, and bank account numbers.',
        link: '/employer/add-employee'
      },
      {
        number: '3',
        title: 'Monitor Daily Attendance & Shifts',
        desc: 'Track daily punch-in times, verify biometric check-ins, approve attendance regularizations, and mark manual punches if required.',
        link: '/employer/attendance'
      },
      {
        number: '4',
        title: 'Disburse Salary & Manage Vacancies',
        desc: 'Process monthly department payroll from allocated credit balance and publish new hiring openings in Job Vacancies.',
        link: '/employer/pay-employee'
      }
    ],
    modules: [
      {
        name: 'Overview Dashboard',
        icon: FaRocket,
        desc: 'Summary of team size, today’s attendance rate, credit balance, and pending employee actions.'
      },
      {
        name: 'Add & Manage Employee',
        icon: FaUsers,
        desc: 'Complete employee directory, profile editing, salary structure setup, and bank account verification.'
      },
      {
        name: 'Attendance Management',
        icon: FaCalendarCheck,
        desc: 'Daily punch logs, shift rosters, overtime computation, late-mark tracking, and leave approvals.'
      },
      {
        name: 'Pay Employee (Salary)',
        icon: FaMoneyBillWave,
        desc: 'Review auto-calculated net salaries based on actual working days and disburse payments directly to staff bank accounts.'
      },
      {
        name: 'Job Vacancies & Hiring',
        icon: FaBriefcase,
        desc: 'Create job postings, screen applicant resumes, schedule interviews, and onboard candidates.'
      },
      {
        name: 'Training & Upskilling',
        icon: FaGraduationCap,
        desc: 'Assign training video modules to team members and monitor skill certification progress.'
      }
    ],
    tips: [
      'Review attendance exceptions weekly to ensure precise salary calculation at the end of the month.',
      'Use the "Pay Employee" screen to double-check overtime and deduction calculations before confirming payouts.',
      'Post detailed job requirements in "Job Vacancies" to attract pre-screened talent from the Kiaan Job Portal.'
    ]
  },

  employee: {
    title: 'Employee Self-Service Guide',
    subtitle: 'Real-time attendance check-in, instant salary slips download, leave applications, utility bill payments & upskilling.',
    badge: 'EMPLOYEE PORTAL',
    icon: FaUsers,
    color: '#C62828',
    steps: [
      {
        number: '1',
        title: 'Daily Punch & Check-In',
        desc: 'Use the Check-In / Punch screen to record your daily attendance in real-time. View your daily working hours and punch status.',
        link: '/employee/check-in-out'
      },
      {
        number: '2',
        title: 'View & Download Monthly Payslips',
        desc: 'Access your My Salary tab to download official PDF payslips, inspect gross earnings, PF/ESI deductions, and net disbursed amounts.',
        link: '/employee/my-salary'
      },
      {
        number: '3',
        title: 'Track Attendance Calendar',
        desc: 'Inspect your full monthly attendance calendar: verified check-ins, leaves, holidays, and overtime hours.',
        link: '/employee/attendance'
      },
      {
        number: '4',
        title: 'Bill Payments & Internal Career Growth',
        desc: 'Pay electricity, mobile, DTH and utility bills using earned salary credit, or explore internal job opportunities.',
        link: '/employee/bill-payment'
      }
    ],
    modules: [
      {
        name: 'My Dashboard',
        icon: FaRocket,
        desc: 'Quick overview of current month earnings, total present days, attendance percentage, and company announcements.'
      },
      {
        name: 'Check-In / Punch',
        icon: FaClock,
        desc: '1-click punch-in and punch-out with live timestamps and shift verification.'
      },
      {
        name: 'My Salary & Payslips',
        icon: FaFileInvoiceDollar,
        desc: 'Complete salary history, downloadable PDF payslips, tax deductions, and bank disbursement status.'
      },
      {
        name: 'Attendance History',
        icon: FaCalendarCheck,
        desc: 'Monthly calendar grid showing present, absent, weekly-off, and approved leave days.'
      },
      {
        name: 'Bill Payment',
        icon: FaCreditCard,
        desc: 'Instant recharge and utility bill payments directly deducted from your salary wallet.'
      },
      {
        name: 'Job Applications',
        icon: FaBriefcase,
        desc: 'Apply for internal promotions and job vacancies across Kiaan partner companies.'
      },
      {
        name: 'Training Center',
        icon: FaGraduationCap,
        desc: 'Watch skill training modules assigned by your manager and elevate your professional profile.'
      }
    ],
    tips: [
      'Always remember to punch out at the end of your shift to ensure accurate overtime hours tracking.',
      'Download your PDF salary slips directly from "My Salary" for official loan or tax verification purposes.',
      'Keep your phone number updated in your Profile to receive instant WhatsApp attendance & payslip notifications.'
    ]
  },

  jobportal: {
    title: 'Job Portal & Career Guide',
    subtitle: 'Search verified job openings, build your digital profile, submit resumes, and track interview status in real-time.',
    badge: 'JOB PORTAL DASHBOARD',
    icon: FaBriefcase,
    color: '#C62828',
    steps: [
      {
        number: '1',
        title: 'Complete Your Candidate Profile',
        desc: 'Fill your contact details, education, key skills, industry experience, and preferred work locations.',
        link: '/jobportal/profile'
      },
      {
        number: '2',
        title: 'Upload Verified Resume / CV',
        desc: 'Upload your latest resume in PDF/DOCX format to enable auto-matching with top employer vacancies.',
        link: '/jobportal/submit-resume'
      },
      {
        number: '3',
        title: 'Browse & Filter Job Openings',
        desc: 'Filter thousands of active job listings by salary range, location, experience level, and company tier.',
        link: '/jobportal/jobs'
      },
      {
        number: '4',
        title: 'Apply & Track Applications',
        desc: 'Submit 1-click job applications and receive real-time interview updates and shortlist notifications.',
        link: '/jobportal'
      }
    ],
    modules: [
      {
        name: 'Job Dashboard',
        icon: FaRocket,
        desc: 'Overview of applied jobs, shortlisted interviews, profile strength score, and recommended jobs.'
      },
      {
        name: 'Browse Job Listings',
        icon: FaSearch,
        desc: 'Explore active job vacancies posted directly by verified partner companies and employers.'
      },
      {
        name: 'Submit Resume',
        icon: FaFileAlt,
        desc: 'Upload, manage, and optimize your resume for applicant tracking systems (ATS).'
      },
      {
        name: 'User Profile',
        icon: FaUserTie,
        desc: 'Showcase your skills, portfolio links, certifications, and employment history to hiring managers.'
      }
    ],
    tips: [
      'Keep your skills up to date to appear at the top of employer applicant searches.',
      'Apply to jobs matching your exact qualifications to increase shortlist conversion rates.'
    ]
  },

  vendor: {
    title: 'Vendor Services & Invoice Guide',
    subtitle: 'Manage corporate service contracts, submit commercial invoices, track payments & view ledger settlements.',
    badge: 'VENDOR DASHBOARD',
    icon: FaFileInvoiceDollar,
    color: '#C62828',
    steps: [
      {
        number: '1',
        title: 'Review Active Contracts & Orders',
        desc: 'Inspect approved service work orders, client details, milestone deliverables, and contracted amounts.',
        link: '/vendor'
      },
      {
        number: '2',
        title: 'Generate & Submit Invoices',
        desc: 'Upload commercial GST invoices with bank remittance details and itemized service descriptions.',
        link: '/vendor/payments'
      },
      {
        number: '3',
        title: 'Track Approval & Bank Credit',
        desc: 'Monitor invoice approval stages, disbursement status, TDS deductions, and bank transaction reference numbers.',
        link: '/vendor/payments'
      }
    ],
    modules: [
      {
        name: 'Vendor Dashboard',
        icon: FaRocket,
        desc: 'Summary of total billings, pending receivables, approved payouts, and contract milestones.'
      },
      {
        name: 'Payments & Invoices',
        icon: FaMoneyBillWave,
        desc: 'Create, upload, manage and track payment settlements with complete transactional audit logs.'
      }
    ],
    tips: [
      'Ensure GST and Bank account details match official records for seamless instant bank credit.',
      'Attach clear itemized invoices to avoid payment clearance delays.'
    ]
  }
};

const HowToUseModal = ({ show, onClose, userRole, currentPath = '' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'modules' | 'tips'
  const [searchQuery, setSearchQuery] = useState('');

  if (!show) return null;

  // Determine active guide based on user role or pathname
  const normalizedRole = (userRole || '').toLowerCase();
  const path = (currentPath || '').toLowerCase();

  let guideKey = 'admin'; // default
  if (normalizedRole.includes('super') || path.includes('/superadmin')) {
    guideKey = 'superadmin';
  } else if (normalizedRole.includes('employer') || path.includes('/employer')) {
    guideKey = 'employer';
  } else if (normalizedRole.includes('employee') || path.includes('/employee')) {
    guideKey = 'employee';
  } else if (normalizedRole.includes('vendor') || path.includes('/vendor')) {
    guideKey = 'vendor';
  } else if (normalizedRole.includes('job') || path.includes('/job')) {
    guideKey = 'jobportal';
  } else if (normalizedRole.includes('admin') || path.includes('/admin')) {
    guideKey = 'admin';
  }

  const guide = DASHBOARD_GUIDES[guideKey] || DASHBOARD_GUIDES.admin;
  const GuideIcon = guide.icon;

  const filteredModules = guide.modules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigateToFeature = (link) => {
    if (link) {
      onClose();
      navigate(link);
    }
  };

  return (
    <div
      className="modal fade show"
      tabIndex="-1"
      style={{
        display: 'block',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1070
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        style={{ maxWidth: '820px', width: '95%', margin: '1.5rem auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-2xl border-0" style={{ borderRadius: '18px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
          {/* Header Banner */}
          <div
            className="p-4 text-white position-relative"
            style={{
              background: 'linear-gradient(135deg, #B71C1C 0%, #C62828 60%, #E53935 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <GuideIcon size={26} color="#FFFFFF" />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="badge px-2 py-1"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#B71C1C',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        letterSpacing: '0.5px',
                        borderRadius: '6px'
                      }}
                    >
                      {guide.badge}
                    </span>
                    <span className="text-white-50 small">• Interactive User Manual</span>
                  </div>
                  <h4 className="fw-bold mb-0 text-white" style={{ fontSize: '1.35rem' }}>
                    {guide.title}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm text-white shadow-none p-1 rounded-circle"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '32px', height: '32px' }}
                onClick={onClose}
                aria-label="Close"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <p className="text-white-50 mb-0 mt-2.5" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
              {guide.subtitle}
            </p>

            {/* Navigation Tabs */}
            <div className="d-flex gap-2 mt-3 pt-2">
              <button
                type="button"
                className="btn btn-sm px-3 py-1.5 fw-bold"
                style={{
                  backgroundColor: activeTab === 'steps' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                  color: activeTab === 'steps' ? '#B71C1C' : '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveTab('steps')}
              >
                <FaRocket className="me-1.5" /> 1. Quick Start Workflow
              </button>

              <button
                type="button"
                className="btn btn-sm px-3 py-1.5 fw-bold"
                style={{
                  backgroundColor: activeTab === 'modules' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                  color: activeTab === 'modules' ? '#B71C1C' : '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveTab('modules')}
              >
                <FaBookOpen className="me-1.5" /> 2. Feature &amp; Module Guide
              </button>

              <button
                type="button"
                className="btn btn-sm px-3 py-1.5 fw-bold"
                style={{
                  backgroundColor: activeTab === 'tips' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                  color: activeTab === 'tips' ? '#B71C1C' : '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveTab('tips')}
              >
                <FaLightbulb className="me-1.5" /> 3. Pro Tips &amp; FAQ
              </button>
            </div>
          </div>

          {/* Modal Body Content */}
          <div className="modal-body p-4 bg-light" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {/* TAB 1: STEPS */}
            {activeTab === 'steps' && (
              <div className="d-flex flex-column gap-3">
                <div className="text-muted small mb-1 fw-semibold">
                  Follow this structured sequence to get the best operational efficiency out of your dashboard:
                </div>

                {guide.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-3 border border-slate-200 shadow-sm transition-all d-flex align-items-start gap-3"
                    style={{
                      borderLeft: '4px solid #C62828',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#FEF2F2',
                        color: '#C62828',
                        border: '1px solid #FECACA',
                        fontSize: '0.95rem'
                      }}
                    >
                      {step.number}
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>
                          {step.title}
                        </h6>
                        {step.link && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 fw-semibold text-decoration-none small"
                            style={{ fontSize: '0.78rem' }}
                            onClick={() => handleNavigateToFeature(step.link)}
                          >
                            Open Menu →
                          </button>
                        )}
                      </div>
                      <p className="text-muted small mb-0" style={{ lineHeight: '1.45', fontSize: '0.84rem' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: MODULES */}
            {activeTab === 'modules' && (
              <div>
                <div className="mb-3 position-relative">
                  <input
                    type="text"
                    className="form-control form-control-sm ps-4"
                    placeholder="Search feature or module (e.g., Attendance, Payroll, WhatsApp)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderRadius: '8px', padding: '0.45rem 0.75rem 0.45rem 2rem' }}
                  />
                  <FaSearch
                    className="position-absolute text-muted"
                    style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem' }}
                  />
                </div>

                <div className="row g-3">
                  {filteredModules.map((mod, idx) => {
                    const ModIcon = mod.icon || FaCheckCircle;
                    return (
                      <div key={idx} className="col-md-6">
                        <div
                          className="p-3 bg-white rounded-3 border border-slate-200 h-100 shadow-sm"
                          style={{ transition: 'all 0.15s ease' }}
                        >
                          <div className="d-flex align-items-center gap-2 mb-1.5">
                            <div
                              className="d-flex align-items-center justify-content-center rounded"
                              style={{ width: '28px', height: '28px', backgroundColor: '#FEF2F2', color: '#C62828' }}
                            >
                              <ModIcon size={14} />
                            </div>
                            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.9rem' }}>
                              {mod.name}
                            </h6>
                          </div>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                            {mod.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredModules.length === 0 && (
                  <div className="text-center py-4 text-muted small">
                    No modules match "{searchQuery}". Try another search term.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRO TIPS & FAQ */}
            {activeTab === 'tips' && (
              <div className="d-flex flex-column gap-3">
                <div className="p-3.5 rounded-3 bg-white border border-slate-200 shadow-sm">
                  <div className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.92rem' }}>
                    <FaLightbulb className="text-warning" /> Essential Operational Tips
                  </div>
                  <ul className="mb-0 ps-3 text-muted small" style={{ lineHeight: '1.6' }}>
                    {guide.tips.map((tip, idx) => (
                      <li key={idx} className="mb-1.5">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-3 bg-white border border-slate-200 shadow-sm">
                  <div className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.92rem' }}>
                    <FaHeadset className="text-danger" /> Need Live Assistance?
                  </div>
                  <p className="text-muted small mb-3">
                    If you encounter any unexpected issues, biometric sync delays, or need enterprise onboarding support, our technical team is available 24x7.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm px-3 fw-bold"
                    style={{ borderRadius: '6px' }}
                    onClick={() => {
                      onClose();
                      const role = (userRole || '').toLowerCase();
                      if (role.includes('super')) {
                        navigate('/superadmin/support-tickets');
                      } else {
                        navigate('/admin/support-tickets');
                      }
                    }}
                  >
                    Open Support Ticket
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer py-2.5 px-4 bg-white border-top d-flex justify-content-between align-items-center">
            <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
              Kiaan Technology Workforce &amp; Payroll SaaS • Version 2.0
            </span>
            <button
              type="button"
              className="btn btn-danger btn-sm px-4 fw-bold shadow-sm"
              style={{
                backgroundColor: '#C62828',
                borderColor: '#C62828',
                borderRadius: '8px',
                fontSize: '0.84rem'
              }}
              onClick={onClose}
            >
              Got It, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToUseModal;
