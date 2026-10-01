import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { 
  ShieldCheck, Mail, Phone, MapPin, Globe, Smartphone, 
  Lock, UserX, AlertCircle, ExternalLink, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PrivacyPolicyModal = ({ show, onHide }) => {
    const navigate = useNavigate();
    const [serverPolicy, setServerPolicy] = useState(null);

    useEffect(() => {
        if (show) {
            const fetchPolicyData = async () => {
                try {
                    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const url = `${apiBase.replace(/\/+$/, '')}/public/privacy-policy`;
                    const res = await axios.get(url, { timeout: 3000 });
                    if (res.data?.success && res.data?.data) {
                        setServerPolicy(res.data.data);
                    }
                } catch (err) {
                    // Fallback to integrated content
                }
            };
            fetchPolicyData();
        }
    }, [show]);

    const handleOpenFullPage = () => {
        onHide();
        navigate('/privacy-policy');
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            centered 
            scrollable
            contentClassName="bg-dark text-light border border-secondary shadow-lg"
        >
            <Modal.Header className="border-secondary bg-dark text-white d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <ShieldCheck size={26} className="text-warning" />
                    <div>
                        <Modal.Title className="h5 mb-0 fw-bold text-white">Privacy Policy</Modal.Title>
                        <small className="text-muted">Play Store & DPDP Act 2023 Compliant | Last Updated: September 2026</small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={handleOpenFullPage}
                        className="btn btn-sm btn-outline-warning d-none d-sm-flex align-items-center gap-1"
                        style={{ fontSize: '0.78rem' }}
                    >
                        <ExternalLink size={13} /> Open Dedicated URL
                    </button>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={onHide}
                        aria-label="Close"
                    />
                </div>
            </Modal.Header>

            <Modal.Body className="p-4 text-slate-300" style={{ fontSize: '0.92rem', lineHeight: '1.75', backgroundColor: '#0D0D12' }}>
                {/* Developer / Company Header */}
                <div className="p-3 mb-4 rounded border border-warning border-opacity-25" style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
                    <div className="d-flex align-items-center gap-2 text-warning fw-bold mb-1">
                        <CheckCircle2 size={16} /> Official Enterprise Disclosure
                    </div>
                    <div className="small text-light">
                        <strong>Developer & Entity:</strong> {serverPolicy?.companyName || 'Kiaan Technology Private Limited'} <br />
                        <strong>App Scope:</strong> Payroll Management, HRMS, Attendance Tracking, Employee Self-Service & Job Portals <br />
                        <strong>Official Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" className="text-warning">https://kiaantechnology.com/</a>
                    </div>
                </div>

                <p className="lead text-light mb-4" style={{ fontSize: '0.95rem' }}>
                    Welcome to <strong>Kiaan Technology Private Limited</strong>. This Privacy Policy outlines how our cloud platform and mobile applications collect, use, process, and protect your personal, professional, and financial data in full compliance with the <strong>Indian Information Technology Act 2000</strong>, <strong>DPDP Act 2023</strong>, <strong>GDPR</strong>, and <strong>Google Play Store Developer Policies</strong>.
                </p>

                <hr className="border-secondary my-4" />

                {/* Section 1: Mobile App Permissions */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <Smartphone size={18} /> 1. Mobile App Device Permissions (Google Play Disclosure)
                    </h5>
                    <ul className="list-unstyled ms-3">
                        <li className="mb-2">
                            <strong>• Location (GPS & Geofencing):</strong> Required exclusively during active employee punch Check-In/Check-Out to confirm attendance inside the designated workplace geofence. <em>Continuous background location tracking is never performed.</em>
                        </li>
                        <li className="mb-2">
                            <strong>• Camera & Photos:</strong> Used for optional selfie-attendance verification, uploading employee profile photos, and capturing receipts/bills for expense reimbursements.
                        </li>
                        <li className="mb-2">
                            <strong>• Storage & Files:</strong> Used for downloading payslips, tax sheets (Form 16), and uploading resumes for job applications.
                        </li>
                        <li className="mb-2">
                            <strong>• Notifications:</strong> Real-time delivery of salary credit alerts, leave status updates, and security announcements.
                        </li>
                    </ul>
                </div>

                {/* Section 2: Data Collection Categories */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6">2. Categories of Information We Collect</h5>
                    <ul className="list-unstyled ms-3">
                        <li className="mb-2"><strong>Personal Identity:</strong> Full name, email address, mobile number, physical address, profile picture.</li>
                        <li className="mb-2"><strong>Employment & Attendance:</strong> Employee ID, designation, department, work shifts, daily clock-in/out timestamps.</li>
                        <li className="mb-2"><strong>Financial & Statutory Payroll Data:</strong> Bank account numbers, IFSC codes, PAN, and PF/ESIC numbers for salary disbursement and legal tax deductions.</li>
                        <li className="mb-2"><strong>Device Telemetry:</strong> Device model, OS version, IP address, and session UUID for fraud prevention.</li>
                    </ul>
                </div>

                {/* Section 3: Data Usage & Zero Sale */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6">3. Use of Information & Zero Commercial Sale</h5>
                    <p className="mb-2">We process data solely for:</p>
                    <ul className="ms-3 mb-2">
                        <li>Calculating automated salaries, overtime, bonuses, deductions, and generating payslips.</li>
                        <li>Verifying workplace attendance and managing leave balances.</li>
                        <li>Complying with statutory labor tax regulations (PF, ESI, TDS).</li>
                    </ul>
                    <div className="p-2 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger small">
                        <AlertCircle size={14} className="me-1 inline" /> <strong>Zero-Sale Pledge:</strong> We NEVER sell, rent, monetize, or trade customer or employee data to third-party data brokers or advertisers.
                    </div>
                </div>

                {/* Section 4: Data Security */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <Lock size={16} /> 4. Data Storage, Security & Encryption
                    </h5>
                    <p>
                        All data in transit is protected via modern <strong>SSL/TLS 1.3 encryption (HTTPS)</strong>. Stored credentials and sensitive financial identifiers are encrypted with <strong>AES-256 protocols</strong>. Multi-tenant architecture ensures complete logical isolation between subscribing companies. Payment processing is handled by PCI-DSS compliant gateways (Razorpay / PayPal).
                    </p>
                </div>

                {/* Section 5: Account & Data Deletion */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <UserX size={16} /> 5. Account & Personal Data Deletion
                    </h5>
                    <p>
                        In adherence to Google Play policies, users may request account and data deletion at any time by:
                    </p>
                    <ul className="ms-3">
                        <li>Submitting an in-app request through <em>Profile & Settings</em>.</li>
                        <li>Sending an email to <a href="mailto:support@kiaantechnology.com" className="text-warning">support@kiaantechnology.com</a> from the registered email address.</li>
                    </ul>
                    <small className="text-muted d-block">
                        Requests are processed within 30 calendar days, subject to mandatory statutory tax and accounting retention requirements mandated by law.
                    </small>
                </div>

                {/* Section 6: Children's Privacy */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6">6. Children's Privacy</h5>
                    <p>
                        Our platform is strictly intended for enterprise workforce operations and working professionals (18+ years old). We do not knowingly collect information from minors.
                    </p>
                </div>

                {/* Section 7: Grievance Officer & Contact */}
                <div className="p-3 rounded bg-secondary bg-opacity-10 border border-secondary">
                    <h5 className="text-warning fw-bold h6 mb-3">7. Grievance Redressal & Contact Information</h5>
                    <p className="mb-2 small">If you have any questions, compliance audits, or privacy requests, please contact our Grievance Officer:</p>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                        <li className="d-flex align-items-center gap-2">
                            <strong className="text-white">Company:</strong> {serverPolicy?.companyName || 'Kiaan Technology Private Limited'}
                        </li>
                        <li className="d-flex align-items-center gap-2">
                            <MapPin size={16} className="text-warning flex-shrink-0" />
                            <span>{serverPolicy?.address || '2341/E, Sudama Nagar, Indore, Madhya Pradesh, India'}</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                            <Phone size={16} className="text-warning flex-shrink-0" />
                            <a href={`tel:${serverPolicy?.phone?.replace(/\s+/g, '') || '+919752100980'}`} className="text-warning text-decoration-none">{serverPolicy?.phone || '+91-97521 00980'}</a>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                            <Mail size={16} className="text-warning flex-shrink-0" />
                            <a href={`mailto:${serverPolicy?.supportEmail || 'support@kiaantechnology.com'}`} className="text-warning text-decoration-none">{serverPolicy?.supportEmail || 'support@kiaantechnology.com'}</a>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                            <Globe size={16} className="text-warning flex-shrink-0" />
                            <a href={serverPolicy?.officialWebsite || 'https://kiaantechnology.com/'} target="_blank" rel="noopener noreferrer" className="text-warning text-decoration-none">{serverPolicy?.officialWebsite || 'https://kiaantechnology.com/'}</a>
                        </li>
                    </ul>
                </div>
            </Modal.Body>

            <Modal.Footer className="border-secondary bg-dark d-flex justify-content-between align-items-center">
                <Button variant="outline-success" size="sm" onClick={handleOpenFullPage} className="d-flex align-items-center gap-1">
                    <ExternalLink size={14} /> Open Dedicated URL (/privacy-policy)
                </Button>
                <Button variant="outline-warning" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PrivacyPolicyModal;
