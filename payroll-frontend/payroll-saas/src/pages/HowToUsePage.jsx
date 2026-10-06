import React, { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { publicAPI } from '../services/api';
import {
  FaRocket,
  FaShieldAlt,
  FaUserTie,
  FaBuilding,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaCreditCard,
  FaGraduationCap,
  FaBriefcase,
  FaFileInvoiceDollar,
  FaHeadset,
  FaDatabase,
  FaClipboardList,
  FaCog,
  FaUserCheck,
  FaListAlt,
  FaCheckCircle
} from 'react-icons/fa';
import './HowToUsePage.css';

const DASHBOARD_GUIDES = {
  superadmin: {
    roleKey: 'superadmin',
    title: 'Super Admin Dashboard - How to Use Guide',
    subtitle: 'Comprehensive guide to managing multi-tenant companies, subscription plans, tenant onboarding, root administration, and database backups.',
    badge: 'SUPER ADMIN DASHBOARD',
    icon: FaShieldAlt,
    steps: [
      {
        number: '1',
        title: 'Dashboard Overview',
        tag: 'Analytics & Telemetry',
        icon: FaRocket,
        desc: 'Monitor real-time multi-tenant telemetry including total registered companies, active subscription plans, gross platform revenue, and staff capacity metrics.'
      },
      {
        number: '2',
        title: 'Company Requests (Tenant Approval)',
        tag: 'Tenant Onboarding',
        icon: FaBuilding,
        desc: 'Review incoming company registration applications, verify business documentation and KYC details, and grant or reject platform access.'
      },
      {
        number: '3',
        title: 'User Requests Management',
        tag: 'User Governance',
        icon: FaUsers,
        desc: 'Process and manage platform user registration and verification requests across all tenant organizations.'
      },
      {
        number: '4',
        title: 'Admin Management',
        tag: 'Roles & Privileges',
        icon: FaShieldAlt,
        desc: 'Create root organization administrators, assign login credentials, and configure administrative access permissions.'
      },
      {
        number: '5',
        title: 'Plans Management',
        tag: 'SaaS Pricing & Limits',
        icon: FaCreditCard,
        desc: 'Create and configure SaaS subscription packages (Free, Pro, Enterprise), establish pricing tiers, and define employee limits and feature flags.'
      },
      {
        number: '6',
        title: 'Company Management',
        tag: 'Organizations Directory',
        icon: FaBuilding,
        desc: 'View, search, and manage all registered companies. Edit company details, adjust subscription quotas, or suspend accounts.'
      },
      {
        number: '7',
        title: 'Payments & Subscriptions',
        tag: 'Billing & Invoices',
        icon: FaMoneyBillWave,
        desc: 'Track recurring subscription payouts, invoice histories, credit renewals, and payment gateway transactions across all tenants.'
      },
      {
        number: '8',
        title: 'Support Tickets & Helpdesk',
        tag: 'Support & Escalation',
        icon: FaHeadset,
        desc: 'Review and resolve technical support tickets raised by company administrators and monitor platform issue resolution.'
      },
      {
        number: '9',
        title: 'System Backup & Recovery',
        tag: 'Database Snapshots',
        icon: FaDatabase,
        desc: 'Generate real-time database snapshots and download secure SQL backup archives for disaster recovery and compliance.'
      },
      {
        number: '10',
        title: 'Settings & Configuration',
        tag: 'Global Settings',
        icon: FaCog,
        desc: 'Configure master system parameters, global SMTP email servers, and platform operational credentials.'
      }
    ]
  },

  admin: {
    roleKey: 'admin',
    title: 'Company Admin Dashboard - How to Use Guide',
    subtitle: 'Step-by-step operating guide for managing employers, workforce attendance, credit wallet, WhatsApp broadcasts, and 1-click payroll.',
    badge: 'COMPANY ADMIN DASHBOARD',
    icon: FaBuilding,
    steps: [
      {
        number: '1',
        title: 'Dashboard Overview',
        tag: 'Daily Telemetry',
        icon: FaRocket,
        desc: 'Review high-level workforce metrics including total employees, present vs. absent headcounts, wallet credit balance, and monthly payroll liabilities.'
      },
      {
        number: '2',
        title: 'Employers Management',
        tag: 'Department Heads',
        icon: FaUsers,
        desc: 'Create and manage department employers and managers, assign organizational roles, and configure departmental structure.'
      },
      {
        number: '3',
        title: 'Add Credit (Salary Wallet)',
        tag: 'Wallet Recharge',
        icon: FaMoneyBillWave,
        desc: 'Recharge company wallet and allocate credit balances to department employers to facilitate 1-click automated salary disbursements.'
      },
      {
        number: '4',
        title: 'Attendance Management',
        tag: 'Biometric & Shift Tracking',
        icon: FaUserCheck,
        desc: 'Monitor real-time biometric device synchronization logs, manual employee check-in/out records, and export monthly attendance registers.'
      },
      {
        number: '5',
        title: 'Training Management',
        tag: 'Corporate Learning',
        icon: FaGraduationCap,
        desc: 'Create structured training courses, upload learning materials and videos, and track employee course completion status.'
      },
      {
        number: '6',
        title: 'Job Portal Management',
        tag: 'Recruitment & Hiring',
        icon: FaBriefcase,
        desc: 'Publish company job openings, review candidate resumes and portfolios, and manage recruitment pipeline stages.'
      },
      {
        number: '7',
        title: 'Bill Companies',
        tag: 'Vendor & Utilities',
        icon: FaClipboardList,
        desc: 'Register and manage corporate utility and vendor billing entities for automated monthly invoice settlement.'
      },
      {
        number: '8',
        title: 'Payment Setup',
        tag: 'Banking & Gateways',
        icon: FaCreditCard,
        desc: 'Configure corporate bank accounts, payment gateway credentials, and automated disbursement transfer modes.'
      },
      {
        number: '9',
        title: 'All Transactions Ledger',
        tag: 'Audit Trail',
        icon: FaListAlt,
        desc: 'Search and filter the comprehensive audit ledger of all wallet credits, debits, billing settlements, and salary payments.'
      },
      {
        number: '10',
        title: 'Audit Logs',
        tag: 'Security & Compliance',
        icon: FaShieldAlt,
        desc: 'Inspect tamper-proof activity logs tracking user logins, salary updates, and sensitive administrative actions.'
      },
      {
        number: '11',
        title: 'System Backup',
        tag: 'Data Protection',
        icon: FaDatabase,
        desc: 'Generate on-demand database snapshots and download secure encrypted backups of your organization data.'
      },
      {
        number: '12',
        title: 'Settings & WhatsApp Connectivity',
        tag: 'Broadcasts & Messaging',
        icon: FaCog,
        desc: 'Link your WhatsApp session via QR scanner to send real-time announcements, payslip notices, and punch alerts to staff.'
      }
    ]
  },

  employer: {
    roleKey: 'employer',
    title: 'Employer Dashboard - How to Use Guide',
    subtitle: 'Operational guide for managing department staff, tracking daily attendance, assigning trainings, and executing 1-click salary payouts.',
    badge: 'EMPLOYER DASHBOARD',
    icon: FaUserTie,
    steps: [
      {
        number: '1',
        title: 'Dashboard Overview',
        tag: 'Team Summary',
        icon: FaRocket,
        desc: 'Check department employee headcounts, today\'s present vs. absent statistics, and available credit wallet balance.'
      },
      {
        number: '2',
        title: 'My Credits (Department Wallet)',
        tag: 'Credit Balance',
        icon: FaMoneyBillWave,
        desc: 'Inspect available credit balance required for employee salary disbursements and request balance top-ups from Admin when needed.'
      },
      {
        number: '3',
        title: 'Employees / Staff Onboarding',
        tag: 'Staff Profiles',
        icon: FaUsers,
        desc: 'Register new department employees or contractors, set job designations, assign departments, and configure salary grades.'
      },
      {
        number: '4',
        title: 'Department Attendance Monitoring',
        tag: 'Live Logs',
        icon: FaUserCheck,
        desc: 'Monitor real-time team clock-in times, work shift durations, late arrivals, and approve manual attendance regularization requests.'
      },
      {
        number: '5',
        title: 'Training Assignment',
        tag: 'Skill Development',
        icon: FaGraduationCap,
        desc: 'Enroll department staff into corporate training courses and evaluate module progress and completion certificates.'
      },
      {
        number: '6',
        title: 'Job Vacancies',
        tag: 'Hiring Postings',
        icon: FaBriefcase,
        desc: 'Publish active department job openings with required skillsets and salary ranges, and review incoming candidate applications.'
      },
      {
        number: '7',
        title: 'Pay Employees (1-Click Salary Disbursal)',
        tag: 'Salary Release',
        icon: FaCreditCard,
        desc: 'Execute 1-click month-end salary transfers directly from your credit wallet and automatically generate digital payslips for employees.'
      },
      {
        number: '8',
        title: 'Transactions History',
        tag: 'Payout Receipts',
        icon: FaListAlt,
        desc: 'Access the complete record of all departmental salary disbursements, wallet top-ups, and debit/credit receipts.'
      }
    ]
  },

  employee: {
    roleKey: 'employee',
    title: 'Employee Self-Service Portal - How to Use Guide',
    subtitle: 'Step-by-step guide for clocking daily attendance, downloading monthly payslips, completing trainings, and managing bank details.',
    badge: 'EMPLOYEE PORTAL',
    icon: FaUsers,
    steps: [
      {
        number: '1',
        title: 'Employee Dashboard',
        tag: 'Personal Overview',
        icon: FaRocket,
        desc: 'Review your employment profile summary, latest salary release status, attendance percentage, and assigned training tasks.'
      },
      {
        number: '2',
        title: 'Daily Check-In & Check-Out',
        tag: 'Attendance Punch',
        icon: FaCalendarCheck,
        desc: 'Perform 1-click Check-In at the start of your shift and Check-Out upon completing your working hours.'
      },
      {
        number: '3',
        title: 'My Salary & Payslips',
        tag: 'Payslip Download',
        icon: FaMoneyBillWave,
        desc: 'View comprehensive salary breakdowns (Basic, HRA, Allowances, Deductions) and download official PDF payslips for tax filing.'
      },
      {
        number: '4',
        title: 'Attendance Calendar',
        tag: 'Monthly Records',
        icon: FaUserCheck,
        desc: 'Inspect your monthly calendar records showing present days, absent days, approved leaves, and total working hours.'
      },
      {
        number: '5',
        title: 'Training Center',
        tag: 'Learning Modules',
        icon: FaGraduationCap,
        desc: 'Access and complete training courses, video lectures, and documentation modules assigned by your employer.'
      },
      {
        number: '6',
        title: 'Bank Details Verification',
        tag: 'Direct Deposit',
        icon: FaFileInvoiceDollar,
        desc: 'Verify and update your Bank Name, Account Number, and IFSC code to ensure seamless direct salary deposits.'
      },
      {
        number: '7',
        title: 'Bill Payments & Reimbursements',
        tag: 'Allowances',
        icon: FaCreditCard,
        desc: 'View and manage company-sponsored utility allowances and expense reimbursements.'
      },
      {
        number: '8',
        title: 'Internal Job Applications',
        tag: 'Career Growth',
        icon: FaBriefcase,
        desc: 'Browse internal company job vacancies and apply directly for career advancement opportunities.'
      }
    ]
  },

  jobseeker: {
    roleKey: 'jobseeker',
    title: 'Job Seeker Portal - How to Use Guide',
    subtitle: 'Step-by-step guide for creating candidate profiles, uploading resumes, applying for verified jobs, and tracking applications.',
    badge: 'JOB SEEKER PORTAL',
    icon: FaBriefcase,
    steps: [
      {
        number: '1',
        title: 'Job Seeker Dashboard',
        tag: 'Candidate Overview',
        icon: FaRocket,
        desc: 'Check your profile completion score, applied job summaries, and real-time recruitment updates.'
      },
      {
        number: '2',
        title: 'Complete Candidate Profile',
        tag: 'Profile Setup',
        icon: FaUsers,
        desc: 'Build your professional profile with contact info, education, skills, work experience, and portfolio links.'
      },
      {
        number: '3',
        title: 'Submit & Update Resume',
        tag: 'CV Upload',
        icon: FaFileInvoiceDollar,
        desc: 'Upload your latest CV in PDF or DOCX format for instant 1-click applications across verified company job postings.'
      },
      {
        number: '4',
        title: 'Browse Jobs & Apply',
        tag: 'Job Application',
        icon: FaBriefcase,
        desc: 'Search verified job vacancies by role and salary, submit direct applications, and track your interview status.'
      }
    ]
  },

  vendor: {
    roleKey: 'vendor',
    title: 'Vendor Portal - How to Use Guide',
    subtitle: 'Operating guide for reviewing active service contracts, submitting itemized tax invoices, and tracking bank remittances.',
    badge: 'VENDOR PORTAL',
    icon: FaCreditCard,
    steps: [
      {
        number: '1',
        title: 'Vendor Dashboard',
        tag: 'Contracts & Orders',
        icon: FaRocket,
        desc: 'View pending invoices, cleared payments, and active business service contracts in real time.'
      },
      {
        number: '2',
        title: 'Submit Invoices & Track Payments',
        tag: 'Invoice & Remittance',
        icon: FaMoneyBillWave,
        desc: 'Upload itemized GST tax invoices, track client approval status, and monitor direct bank payment remittances.'
      }
    ]
  }
};

const HowToUsePage = () => {
  const location = useLocation();

  // Determine current active role strictly from pathname or localStorage
  const currentPath = location.pathname.toLowerCase();
  const storedRole = (localStorage.getItem('userRole') || '').toLowerCase();

  const roleKey = useMemo(() => {
    if (currentPath.includes('/superadmin') || storedRole.includes('super')) return 'superadmin';
    if (currentPath.includes('/employer') || storedRole.includes('employer')) return 'employer';
    if (currentPath.includes('/employee') || storedRole.includes('employee')) return 'employee';
    if (currentPath.includes('/vendor') || storedRole.includes('vendor')) return 'vendor';
    if (currentPath.includes('/job') || storedRole.includes('job')) return 'jobseeker';
    return 'admin';
  }, [currentPath, storedRole]);

  const [apiGuideData, setApiGuideData] = useState(null);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await publicAPI.getHowToUseGuides(roleKey);
        if (response?.data?.success) {
          setApiGuideData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch How To Use guide from API:', err);
      }
    };
    fetchGuide();
  }, [roleKey]);

  const defaultGuide = DASHBOARD_GUIDES[roleKey] || DASHBOARD_GUIDES.superadmin || DASHBOARD_GUIDES.admin;
  const guide = {
    ...defaultGuide,
    title: apiGuideData?.title || defaultGuide?.title,
    subtitle: apiGuideData?.subtitle || defaultGuide?.subtitle,
    badge: apiGuideData?.badge || defaultGuide?.badge,
  };
  const GuideIcon = guide?.icon || FaShieldAlt;

  return (
    <div className="how-to-use-wrapper">
      {/* 1. Header Banner Card - Specific to this Dashboard */}
      <div className="how-to-use-header-card">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <GuideIcon size={30} color="#FFFFFF" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="how-to-use-badge">
                {guide?.badge}
              </span>
              <span className="text-white-50 small">• Official User Manual</span>
            </div>
            <h1 className="how-to-use-title">
              {guide?.title}
            </h1>
          </div>
        </div>

        <p className="how-to-use-subtitle mt-2">
          {guide?.subtitle}
        </p>
      </div>

      {/* 2. Step-by-Step Instructions (Clean English & software-accurate) */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.15rem' }}>
            Dashboard Operating Guide (Step-by-Step)
          </h5>
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.78rem' }}>
            Total {guide?.steps?.length || 0} Modules
          </span>
        </div>

        <div className="row g-3">
          {guide?.steps?.map((step, idx) => {
            const StepIcon = step.icon || FaCheckCircle;
            return (
              <div key={idx} className="col-12 col-lg-6">
                <div className="how-to-use-step-card h-100">
                  <div className="how-to-use-step-number">
                    {step.number}
                  </div>
                  <div className="how-to-use-step-content">
                    <div className="how-to-use-step-title">
                      <div className="d-flex align-items-center gap-2">
                        <StepIcon size={16} className="text-danger flex-shrink-0" />
                        <span className="fw-bold">{step.title}</span>
                      </div>
                      {step.tag && (
                        <span className="badge bg-light text-danger border border-danger-subtle small fw-semibold" style={{ fontSize: '0.72rem' }}>
                          {step.tag}
                        </span>
                      )}
                    </div>
                    <p className="how-to-use-step-desc">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HowToUsePage;
