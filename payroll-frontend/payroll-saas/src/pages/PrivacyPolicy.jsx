import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Row, Col, Button } from 'react-bootstrap';
import Navbar from '../Layout/Navbar';
import WhatsAppWidget from '../components/WhatsAppWidget';
import { 
  ShieldCheck, Lock, ArrowLeft, Smartphone, MapPin, 
  Mail, Phone, Globe, UserX, CheckCircle2, 
  AlertCircle, Copy, Check, Printer
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
        console.log('Using integrated policy structure');
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
        {/* Navigation & Action Bar - Positioned cleanly below fixed Header */}
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
              {copied ? 'URL Copied!' : 'Copy Play Store URL'}
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

        {/* Main Policy Card with Project Theme */}
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
                  Official Play Store & Enterprise SaaS Compliance Disclosure
                </p>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Badge style={{ backgroundColor: '#C62828', fontSize: '12px', padding: '8px 12px', borderRadius: '6px' }}>
                Google Play Store Compliant
              </Badge>
              <Badge bg="secondary" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px' }}>
                DPDP Act 2023 & GDPR
              </Badge>
              <Badge bg="warning" text="dark" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px', fontWeight: '700' }}>
                Updated: September 2026
              </Badge>
            </div>
          </div>

          {/* Quick Info Box for Google Play Reviewers & Users */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px'
          }}>
            <h6 style={{ color: '#C62828', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle2 size={18} /> Direct App & Developer Identification
            </h6>
            <Row className="g-2" style={{ fontSize: '13.5px', color: '#334155' }}>
              <Col md={6}>
                <strong>Application Name:</strong> Kiaan Payroll, HRMS & Workforce Management
              </Col>
              <Col md={6}>
                <strong>Developer / Entity:</strong> {serverPolicy?.companyName || 'Kiaan Technology Private Limited'}
              </Col>
              <Col md={6}>
                <strong>Official Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#C62828', fontWeight: '600' }}>https://kiaantechnology.com/</a>
              </Col>
              <Col md={6}>
                <strong>Official Support:</strong> <a href="mailto:support@kiaantechnology.com" style={{ color: '#C62828', fontWeight: '600' }}>support@kiaantechnology.com</a>
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
                Welcome to <strong>Kiaan Technology Private Limited</strong> ("we", "our", or "us"). We provide an end-to-end enterprise Payroll, Human Resource Management System (HRMS), Employee Self-Service (ESS), and Recruitment platform accessible via web and mobile applications (including Progressive Web Apps and Android applications).
              </p>
              <p>
                This Privacy Policy describes our policies and practices regarding the collection, use, storage, disclosure, and protection of your personal and professional information when you download, install, register, or use our mobile applications and cloud platform. We are fully committed to complying with the <strong>Digital Personal Data Protection Act (DPDP) 2023</strong> (India), the <strong>Information Technology Act, 2000</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and <strong>Google Play Store Developer Policies</strong>.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 2 - Mobile Permissions (Play Store Crucial) */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={22} style={{ color: '#C62828' }} /> 2. Mobile App Device Permissions (Google Play Disclosure)
              </h4>
              <p>
                To provide essential workforce management capabilities, our mobile application may request the following device permissions. We strictly follow the principle of data minimization:
              </p>
              
              <div className="d-flex flex-column gap-3 mt-3">
                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>A. Location Data (GPS & Geofencing)</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Used solely when an employee initiates attendance Check-In or Check-Out to verify that the punch is occurring within the employer's designated office or job-site geofence perimeter. <br />
                    <strong>Explicit Note:</strong> We <em>DO NOT</em> track your location continuously in the background outside attendance punch events. Location data is timestamped only upon your active action and is never shared with advertisers.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>B. Camera & Photo Library Access</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Allows employees and administrators to upload profile pictures, capture selfie verification for contactless attendance (where enabled by their organization), and take pictures of physical receipts/bills for expense reimbursements or resume/KYC uploads.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>C. Storage / Files Access</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Allows downloading and saving monthly payslips, tax deduction sheets (Form 16/TDS), company policy documents, and uploading resumes for job portal applications.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #C62828', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>D. Push Notifications</strong>
                  <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#475569' }}>
                    <strong>Purpose:</strong> Delivering real-time transactional alerts, including monthly salary credits, leave approvals/rejections, attendance reminders, and system security notices.
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
              <p>We collect information in the following categories necessary to operate our payroll and HR services:</p>
              
              <ul style={{ paddingLeft: '20px' }}>
                <li className="mb-2">
                  <strong>Personal Identity Information:</strong> Full name, date of birth, gender, marital status, emergency contact details, and profile photos.
                </li>
                <li className="mb-2">
                  <strong>Contact Information:</strong> Official and personal email addresses, phone numbers, and physical residential addresses.
                </li>
                <li className="mb-2">
                  <strong>Employment & Attendance Records:</strong> Employee ID, job title/designation, department, date of joining, work shifts, daily clock-in/out timestamps, leave balances, and performance notes.
                </li>
                <li className="mb-2">
                  <strong>Financial & Statutory Payroll Data:</strong> Bank account numbers, IFSC codes, PAN card numbers, Provident Fund (PF/UAN) numbers, ESIC numbers, salary breakdown (Basic, HRA, allowances, deductions), and tax declarations. This data is collected solely to disburse salaries and calculate statutory compliances.
                </li>
                <li className="mb-2">
                  <strong>Job Portal & Recruitment Data:</strong> For candidates applying through our recruitment portal: uploaded resume/CV, education credentials, skill endorsements, and prior work history.
                </li>
                <li className="mb-2">
                  <strong>Device & Network Identifiers:</strong> IP address, device brand/model, OS version, unique device identifier (UUID), browser type, and diagnostic error logs for session security and fraud prevention.
                </li>
              </ul>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 4 - Use of Data & Zero-Sale Pledge */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                4. How We Use Your Data & Zero Commercial Sale Pledge
              </h4>
              <p>We process collected data strictly for legitimate operational purposes:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Calculating monthly salaries, overtime, bonuses, deductions, and generating official payslips.</li>
                <li>Verifying and recording employee attendance and managing leave requests.</li>
                <li>Executing statutory tax withholdings (TDS, PF, ESI, Professional Tax) in compliance with Indian laws.</li>
                <li>Providing customer support and sending critical transactional notifications.</li>
                <li>Detecting and preventing unauthorized access, fraudulent clock-ins, or security incidents.</li>
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
                  <strong>We DO NOT sell, rent, monetize, or trade your personal or financial data to third-party data brokers, marketers, or advertisers under any circumstances.</strong>
                </p>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 5 - Data Security & Storage */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} style={{ color: '#C62828' }} /> 5. Data Security, Encryption & Storage
              </h4>
              <p>
                We employ industry-leading security practices to safeguard all client and employee data:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Encryption in Transit:</strong> All communications between your mobile device/browser and our backend servers are encrypted using modern SSL/TLS 1.3 encryption (HTTPS).</li>
                <li><strong>Encryption at Rest:</strong> Sensitive database records, authentication credentials, and financial metadata are stored using industry-standard AES-256 encryption.</li>
                <li><strong>Multi-Tenant Data Isolation:</strong> Every subscriber organization operates within logically segregated database environments to guarantee that no organization can access another organization's records.</li>
                <li><strong>Payment Security:</strong> All financial transactions and SaaS subscriptions are handled by PCI-DSS Level-1 certified payment gateways (e.g., Razorpay, PayPal). We never store raw debit/credit card numbers or CVVs on our servers.</li>
              </ul>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 6 - Account Deletion & Data Retention (Google Play Mandatory) */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={22} style={{ color: '#C62828' }} /> 6. Account & Data Deletion Policy (Google Play Mandatory)
              </h4>
              <p>
                Google Play requires developers to provide a clear path for users to request the deletion of their account and associated personal data.
              </p>

              <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h6 style={{ color: '#0F172A', fontWeight: '700', marginBottom: '12px' }}>
                  How to Request Account & Data Deletion:
                </h6>
                <ol style={{ paddingLeft: '20px', marginBottom: '12px', fontSize: '14.5px' }}>
                  <li className="mb-2">
                    <strong>In-App Request:</strong> Open the mobile app / web portal, navigate to <em>Profile & Settings</em>, and click on <em>"Request Data Deletion"</em> or contact your organization HR Admin.
                  </li>
                  <li className="mb-2">
                    <strong>Email Request:</strong> Send an email directly to <a href="mailto:support@kiaantechnology.com" style={{ color: '#C62828', fontWeight: 'bold' }}>support@kiaantechnology.com</a> with the subject <em>"Account / Data Deletion Request"</em> from your registered email address along with your name and organization name.
                  </li>
                </ol>
                <p className="mb-0" style={{ fontSize: '13.5px', color: '#64748B' }}>
                  <strong>Processing Timeline:</strong> We will process and confirm deletion within <strong>30 calendar days</strong>. <br />
                  <em>Note on Legal Retentions:</em> In accordance with Indian tax and employment laws, statutory payroll disbursement ledgers, tax withholding vouchers, and audit records must be retained for the minimum period mandated by applicable law before permanent purging.
                </p>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 7 - User Rights */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                7. Your Legal Privacy Rights
              </h4>
              <p>Under the DPDP Act 2023 and GDPR, you possess the following rights regarding your personal information:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Right to Access:</strong> You can review the personal and attendance data stored in your profile at any time.</li>
                <li><strong>Right to Rectification:</strong> You can correct inaccurate personal details via self-service or HR admin request.</li>
                <li><strong>Right to Withdraw Consent:</strong> You can revoke non-mandatory consents (e.g. promotional emails) without affecting essential service delivery.</li>
                <li><strong>Right to Grievance Redressal:</strong> You have the right to register complaints regarding data processing with our designated Grievance Officer.</li>
              </ul>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 8 - Children's Privacy */}
            <div className="mb-4">
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '12px' }}>
                8. Children's Privacy
              </h4>
              <p>
                Our services and mobile applications are strictly intended for working professionals and enterprise corporate use. We do not knowingly collect, solicit, or maintain personal information from individuals under the age of 18. If we learn that a minor has submitted personal details, we will promptly delete such information.
              </p>
            </div>

            <hr style={{ borderColor: '#E2E8F0', margin: '28px 0' }} />

            {/* Section 9 - Contact & Grievance Officer */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              marginTop: '32px'
            }}>
              <h4 style={{ color: '#0F172A', fontWeight: '700', fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} style={{ color: '#C62828' }} /> 9. Grievance Redressal & Contact Details
              </h4>
              <p style={{ fontSize: '14.5px', color: '#475569' }}>
                In accordance with the Indian Information Technology Act 2000 and DPDP Act 2023, if you have questions, feedback, or grievance regarding this Privacy Policy or our data practices, please contact our designated Grievance Officer:
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
                    <span>{serverPolicy?.address || '2341/E, Sudama Nagar, Indore, Madhya Pradesh 452009, India'}</span>
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
                      {serverPolicy?.phone || '+91-97521 00980'}
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
            © 2026 Kiaan Technology Private Limited. All rights reserved. | Enterprise Workforce SaaS Platform
          </div>
        </Card>
      </Container>
      <WhatsAppWidget />
    </div>
  );
};

export default PrivacyPolicy;
