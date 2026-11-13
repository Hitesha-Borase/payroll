import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Row, Col, Button } from 'react-bootstrap';
import Navbar from '../Layout/Navbar';
import WhatsAppWidget from '../components/WhatsAppWidget';
import { 
  ShieldCheck, Lock, ArrowLeft, Smartphone, MapPin, 
  Mail, Phone, Globe, UserX, CheckCircle2, 
  AlertCircle, Copy, Check, Printer, CreditCard, 
  DollarSign, Server
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [serverPolicy, setServerPolicy] = useState(null);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Fetch live privacy policy data from backend if available
  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'https://api.payroll.kiaantechnology.com/api';
        const url = `${apiBase.replace(/\/+$/, '')}/public/privacy-policy`;
        const res = await axios.get(url, { timeout: 4000 });
        if (res.data?.success && res.data?.data) {
          setServerPolicy(res.data.data);
        }
      } catch (err) {
        // Fallback to integrated policy structure
      }
    };
    fetchPolicyData();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B', paddingBottom: '60px' }}>
      <Navbar />

      <Container className="pb-5" style={{ maxWidth: '1050px', paddingTop: '95px' }}>
        {/* Navigation & Action Bar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <button
            onClick={handleGoBack}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              borderRadius: '8px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleCopyLink}
              className="d-flex align-items-center gap-2"
              style={{ borderRadius: '8px', borderColor: '#C62828', color: '#C62828', fontWeight: '600' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'URL Copied!' : 'Copy Privacy Policy URL'}
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handlePrint}
              className="d-flex align-items-center gap-2"
              style={{ borderRadius: '8px' }}
            >
              <Printer size={14} /> Print Policy
            </Button>
          </div>
        </div>

        {/* Main Policy Card */}
        <Card style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          boxShadow: '0 10px 35px rgba(0,0,0,0.05)',
          padding: '36px',
          color: '#1E293B'
        }}>
          {/* Header */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom pb-4 mb-4" style={{ borderColor: '#E2E8F0' }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'rgba(198, 40, 40, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(198, 40, 40, 0.25)'
              }}>
                <ShieldCheck size={32} style={{ color: '#C62828' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
                  Privacy Policy
                </h1>
                <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>
                  Official Enterprise Compliance & Data Protection Disclosure
                </p>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Badge style={{ backgroundColor: '#C62828', fontSize: '12px', padding: '8px 12px', borderRadius: '6px' }}>
                Privacy & Data Protection Disclosure
              </Badge>
              <Badge bg="secondary" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px' }}>
                DPDP Act 2023 & Privacy Framework
              </Badge>
              <Badge bg="warning" text="dark" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px', fontWeight: '700' }}>
                Updated: September 2026
              </Badge>
            </div>
          </div>

          {/* Quick Info Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px'
          }}>
            <h6 style={{ color: '#C62828', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle2 size={18} /> Application & Entity Identification
            </h6>
            <Row className="g-2" style={{ fontSize: '13.5px', color: '#334155' }}>
              <Col md={6}>
                <strong>Application Name:</strong> Kiaan Payroll, HRMS & Workforce Management
              </Col>
              <Col md={6}>
                <strong>Developer / Entity:</strong> {serverPolicy?.companyName || 'Kiaan Technology Private Limited'}
              </Col>
              <Col md={6}>
                <strong>Platform:</strong> Kiaan Payroll Android Application and web platform
              </Col>
              <Col md={6}>
                <strong>Official Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#C62828', fontWeight: '600' }}>https://kiaantechnology.com/</a>
              </Col>
              <Col md={6}>
                <strong>Official Support:</strong> <a href="mailto:support@kiaantechnology.com" style={{ color: '#C62828', fontWeight: '600' }}>support@kiaantechnology.com</a>
              </Col>
              <Col md={6}>
                <strong>Support Phone:</strong> <a href="tel:+919752100980" style={{ color: '#C62828', fontWeight: '600' }}>+91 97521 00980</a>
              </Col>
            </Row>
          </div>

          {/* Policy Body */}
          <div style={{ lineHeight: '1.85', fontSize: '15px', color: '#334155' }}>
            
            {/* Section 1 */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                1. Introduction & Overview
              </h4>
              <p>
                Welcome to <strong>Kiaan Technology Private Limited</strong> ("we", "our", or "us"). We provide an enterprise Payroll, Human Resource Management System (HRMS), Employee Self-Service (ESS), and workforce management platform accessible via the <strong>Kiaan Payroll Android Application and web platform</strong>.
              </p>
              <p>
                This Privacy Policy describes our policies and practices regarding the collection, use, storage, disclosure, and protection of your personal, professional, and operational information when you download, install, register, access, or use our mobile applications and cloud platform. We process personal data in accordance with applicable data protection and privacy laws, including India's <strong>Digital Personal Data Protection Act (DPDP), 2023</strong>, the <strong>Information Technology Act, 2000</strong>, and the <strong>General Data Protection Regulation (GDPR)</strong> where applicable.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 2 - Device Permissions */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={22} style={{ color: '#C62828' }} /> 2. Mobile App Device Permissions
              </h4>
              <p>
                To provide essential workforce management capabilities, the Kiaan Payroll Android application may request the following device permissions. We strictly adhere to the principle of data minimization and only access features required for operational functions:
              </p>
              
              <div className="d-flex flex-column gap-3 mt-3">
                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>A. Location (Attendance & Geofencing)</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Location access is used solely when an employee initiates attendance Check-In or Check-Out to verify that the punch is occurring within the employer's designated office or job-site geofence perimeter where configured by the organization. <br />
                    <strong>Explicit Disclosure:</strong> Kiaan Payroll does not continuously track users' location in the background. Location data is timestamped only upon active attendance events and is never shared with third-party advertisers.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>B. Camera Access</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Used when employees or administrators take photos for profile pictures, perform optional selfie attendance verification (where enabled by their organization), or capture photos of physical receipts and documents for expense reimbursement or onboarding.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>C. Files & Photos Selection</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> The Android system file/photo selection interface may be used when users voluntarily choose documents or images for upload (such as downloading monthly payslips, viewing tax deduction summaries, attaching reimbursement receipts, or submitting resumes for job applications). The application does not seek broad unauthorized access to private device storage.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>D. Notifications</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Used exclusively to deliver transactional HR and payroll alerts, including salary disbursement notices, leave request status updates, attendance reminders, and critical administrative announcements.
                  </p>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 3 - Information We Collect */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                3. Categories of Information We Collect
              </h4>
              <p>We collect information in the following categories necessary to operate our payroll and workforce management services:</p>
              
              <ul style={{ paddingLeft: '20px' }}>
                <li className="mb-2">
                  <strong>Employee Identity Information:</strong> Full name, date of birth, gender, emergency contact details, and profile photo where provided.
                </li>
                <li className="mb-2">
                  <strong>Contact Information:</strong> Official and personal email addresses, phone numbers, and physical residential addresses.
                </li>
                <li className="mb-2">
                  <strong>Employment & Attendance Records:</strong> Employee ID, job title/designation, department, date of joining, work shifts, daily clock-in/out timestamps, leave balances, and administrative notes.
                </li>
                <li className="mb-2">
                  <strong>Payroll & Statutory Information:</strong> Bank account numbers, IFSC codes, PAN numbers, Provident Fund (PF/UAN) numbers, ESIC numbers, salary breakdown, and tax declarations. This data is collected solely to disburse salaries and calculate statutory compliances.
                </li>
                <li className="mb-2">
                  <strong>Recruitment & Candidate Information:</strong> For candidates applying through our job portal: submitted resumes/CVs, educational credentials, skill endorsements, and prior work history.
                </li>
                <li className="mb-2">
                  <strong>Device, Network & Security Information:</strong> IP address, device brand/model, OS version, browser type, and diagnostic error logs for session security, authentication, and fraud prevention.
                </li>
              </ul>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 4 - Use of Data & Zero-Sale Pledge */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                4. How We Use Your Information & Zero Commercial Sale Pledge
              </h4>
              <p>We process collected data strictly for legitimate operational purposes:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Calculating monthly salaries, overtime, bonuses, deductions, and generating payslips.</li>
                <li>Verifying and recording employee attendance and managing leave requests.</li>
                <li>Executing statutory calculations and labor compliances in accordance with applicable laws.</li>
                <li>HR administration, employee records management, and recruitment workflows.</li>
                <li>Providing customer support and sending critical transactional notifications.</li>
                <li>Detecting and preventing unauthorized access, fraudulent activities, or security incidents.</li>
              </ul>
              
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '16px',
                marginTop: '16px'
              }}>
                <strong style={{ color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={18} /> Our Strict Zero-Sale Data Pledge:
                </strong>
                <p className="mb-0 mt-1" style={{ color: '#991B1B', fontSize: '14px' }}>
                  <strong>Kiaan Technology Private Limited does not sell or rent customer or employee personal information to data brokers or advertisers under any circumstances.</strong>
                </p>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 5 - Transparent Pricing & No Hidden Charges */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={22} style={{ color: '#C62828' }} /> 5. Transparent Pricing & No Hidden Charges
              </h4>
              <p>
                Kiaan Technology Private Limited does not impose undisclosed hidden charges, unexpected platform fees, or unauthorized additional charges on users.
              </p>
              <p>
                All applicable subscription fees, service charges, implementation charges, customization charges, taxes, third-party charges, or other payable amounts, where applicable, are communicated to the customer before purchase, subscription, renewal, implementation, or activation.
              </p>
              <p>
                Kiaan Technology does not automatically add undisclosed platform charges to customer payments. Any optional paid service, customization, integration, add-on, or additional professional service will be communicated separately and requires customer agreement before billing.
              </p>
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Clarification on Disclosed Applicable Charges:</strong>
                <ul className="mb-0 mt-2 ps-3" style={{ fontSize: '14px', color: '#475569' }}>
                  <li>Applicable government taxes such as Goods and Services Tax (GST) may be charged where legally required.</li>
                  <li>Third-party services, payment gateway processing charges, SMS packages, WhatsApp/API messaging charges, cloud infrastructure, or external integrations have separate costs only when applicable and explicitly agreed upon with the customer. These disclosed fees are not hidden charges.</li>
                </ul>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 6 - Payment Information */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: '#C62828' }} /> 6. Payment Information & Processing
              </h4>
              <p>
                Payments may be processed through authorized third-party payment service providers. Kiaan Technology does not intentionally store complete debit/credit card numbers or CVV information on its application servers.
              </p>
              <p>
                All digital transactions and SaaS subscription renewals are handled through authorized payment processing partners adhering to standard data protection and financial security regulations.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 7 - Data Security */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} style={{ color: '#C62828' }} /> 7. Data Security Safeguards
              </h4>
              <p>
                We use reasonable administrative, organizational, and technical safeguards designed to protect personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Data transmitted between supported applications and our production servers is protected using HTTPS/TLS encryption.</li>
                <li>Logical multi-tenant isolation safeguards information between subscribing client organizations.</li>
                <li>Access to production databases is strictly restricted to authorized personnel based on the principle of least privilege.</li>
              </ul>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                While we implement rigorous security measures, no method of electronic data transmission or digital storage can be guaranteed to be 100% secure, and we do not claim absolute security.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 8 - Third-Party Service Providers */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={20} style={{ color: '#C62828' }} /> 8. Third-Party Service Providers
              </h4>
              <p>
                Limited data may be processed by trusted third-party service providers reasonably required to operate our platform and provide services, including:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Cloud hosting and database infrastructure providers</li>
                <li>Email and SMS delivery gateways</li>
                <li>Push notification delivery infrastructure</li>
                <li>Authorized payment service providers</li>
                <li>Authentication, security, and diagnostic services</li>
              </ul>
              <p style={{ fontSize: '14px', color: '#475569' }}>
                Third-party service providers receive only the information reasonably necessary to perform their designated operational services and are bound by confidentiality and data protection obligations.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 9 - Account & Data Deletion */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={22} style={{ color: '#C62828' }} /> 9. Account & Personal Data Deletion
              </h4>
              <p>
                Users who wish to request deletion of their account or associated personal data may contact their organization's authorized HR/Admin or contact Kiaan Technology Support directly.
              </p>

              <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h6 style={{ color: '#0F172A', fontWeight: '700', marginBottom: '12px' }}>
                  How to Submit an Account & Data Deletion Request:
                </h6>
                <p style={{ fontSize: '14.5px', marginBottom: '10px' }}>
                  Send an email directly to <a href="mailto:support@kiaantechnology.com" style={{ color: '#C62828', fontWeight: 'bold' }}>support@kiaantechnology.com</a> or coordinate with your organization HR Administrator.
                </p>
                <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px' }}>
                  <strong>Recommended Email Subject:</strong> <code>Account & Data Deletion Request</code> <br />
                  <strong>Please include in your request:</strong>
                  <ul className="mb-0 mt-1 ps-3">
                    <li>Registered full name</li>
                    <li>Registered email address</li>
                    <li>Organization / company name</li>
                    <li>Employee ID (if applicable)</li>
                  </ul>
                </div>

                <div className="mt-3" style={{ fontSize: '13.5px', color: '#475569' }}>
                  <p className="mb-2">
                    <strong>Identity Verification:</strong> Kiaan Technology may verify the identity of the requester and confirm the request with the organization's authorized administrator before processing to prevent unauthorized deletion of organizational records.
                  </p>
                  <p className="mb-2">
                    <strong>Post-Verification:</strong> After successful verification, eligible account information and personal data will be deleted or anonymized.
                  </p>
                  <p className="mb-2">
                    <strong>Legal & Statutory Retentions:</strong> Some payroll, tax, accounting, audit, security, employment, or statutory records may need to be retained when required by applicable law (such as statutory employment records, tax withholdings, and audit ledgers).
                  </p>
                  <p className="mb-0" style={{ color: '#0F172A', fontWeight: '600' }}>
                    Verified deletion requests are generally processed within 30 calendar days, subject to applicable legal and statutory retention requirements.
                  </p>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 10 - Legal Privacy Rights */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                10. Your Legal Privacy Rights
              </h4>
              <p>Under applicable data protection frameworks (such as the DPDP Act 2023 and GDPR where applicable), you possess the following rights regarding your personal information:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Right to Access:</strong> You can review the personal and attendance data stored in your profile at any time.</li>
                <li><strong>Right to Rectification:</strong> You can request corrections to inaccurate personal details via self-service or HR admin request.</li>
                <li><strong>Right to Withdraw Consent:</strong> You can revoke non-mandatory consents without affecting essential service delivery.</li>
                <li><strong>Right to Grievance Redressal:</strong> You have the right to register complaints regarding data processing with our designated Grievance Officer.</li>
              </ul>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 11 - Children's Privacy */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                11. Children's Privacy
              </h4>
              <p>
                The service is intended primarily for organizations, employers, employees, administrators, and authorized users and is not directed toward children. We do not knowingly collect personal information from individuals under the age of 18. If we learn that personal information of a minor has been inadvertently submitted, we will take appropriate steps to promptly delete such information.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 12 - Grievance Redressal & Contact */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              marginTop: '32px'
            }}>
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} style={{ color: '#C62828' }} /> 12. Grievance Redressal & Contact Details
              </h4>
              <p style={{ fontSize: '14.5px', color: '#475569' }}>
                In accordance with the Indian Information Technology Act 2000 and DPDP Act 2023, if you have questions, feedback, or grievances regarding this Privacy Policy or our data practices, please contact our designated Grievance Officer:
              </p>

              <Row className="g-3 mt-2" style={{ fontSize: '14px' }}>
                <Col md={6}>
                  <div className="d-flex align-items-start gap-2">
                    <strong style={{ color: '#0F172A' }}>Company:</strong>
                    <span>{serverPolicy?.companyName || 'Kiaan Technology Private Limited'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start gap-2">
                    <strong style={{ color: '#0F172A' }}>Officer:</strong>
                    <span>{serverPolicy?.grievanceOfficer?.name || 'Data Protection & Grievance Officer'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start gap-2">
                    <MapPin size={18} className="text-danger mt-1 flex-shrink-0" />
                    <span>{serverPolicy?.address || '2341/E, Sudama Nagar, Indore, Madhya Pradesh, India'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Mail size={18} className="text-danger flex-shrink-0" />
                    <a href={`mailto:${serverPolicy?.supportEmail || 'support@kiaantechnology.com'}`} style={{ color: '#C62828', fontWeight: '600' }}>
                      {serverPolicy?.supportEmail || 'support@kiaantechnology.com'}
                    </a>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Phone size={18} className="text-danger flex-shrink-0" />
                    <a href={`tel:${serverPolicy?.phone?.replace(/\s+/g, '') || '+919752100980'}`} style={{ color: '#C62828', fontWeight: '600' }}>
                      {serverPolicy?.phone || '+91 97521 00980'}
                    </a>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Globe size={18} className="text-danger flex-shrink-0" />
                    <a href={serverPolicy?.officialWebsite || 'https://kiaantechnology.com/'} target="_blank" rel="noopener noreferrer" style={{ color: '#C62828', fontWeight: '600' }}>
                      {serverPolicy?.officialWebsite || 'https://kiaantechnology.com/'}
                    </a>
                  </div>
                </Col>
              </Row>
            </div>

          </div>

          {/* Footer inside Card */}
          <div className="mt-5 pt-3 border-top text-center" style={{ borderColor: '#E2E8F0', fontSize: '13px', color: '#64748B' }}>
            © 2026 Kiaan Technology Private Limited. All rights reserved. | Kiaan Payroll Android Application and web platform
          </div>
        </Card>
      </Container>
      <WhatsAppWidget />
    </div>
  );
};

export default PrivacyPolicy;
