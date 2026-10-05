import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { 
  ShieldCheck, Mail, Phone, MapPin, Globe, Smartphone, 
  Lock, UserX, AlertCircle, ExternalLink, CheckCircle2,
  DollarSign, CreditCard, Server
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
                    const apiBase = import.meta.env.VITE_API_URL || 'https://api.payroll.kiaantechnology.com/api';
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
                        <small className="text-muted">Privacy & Data Protection Disclosure | Updated: September 2026</small>
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
                        <strong>Platform:</strong> Kiaan Payroll Android Application and web platform <br />
                        <strong>App Scope:</strong> Payroll Management, HRMS, Attendance Tracking, Employee Self-Service & Job Portals <br />
                        <strong>Official Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" className="text-warning">https://kiaantechnology.com/</a>
                    </div>
                </div>

                <p className="lead text-light mb-4" style={{ fontSize: '0.95rem' }}>
                    Welcome to <strong>Kiaan Technology Private Limited</strong>. This Privacy Policy outlines how the <strong>Kiaan Payroll Android Application and web platform</strong> collects, uses, processes, and protects your personal, professional, and operational information in accordance with applicable data protection laws, including the <strong>Digital Personal Data Protection Act, 2023</strong> (India), the <strong>Information Technology Act, 2000</strong>, and the <strong>GDPR</strong> where applicable.
                </p>

                <hr className="border-secondary my-4" />

                {/* Section 1: Mobile App Permissions */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <Smartphone size={18} /> 1. Mobile App Device Permissions
                    </h5>
                    <ul className="list-unstyled ms-3">
                        <li className="mb-2">
                            <strong>• Location (Attendance & Geofencing):</strong> Required exclusively during active employee Check-In/Check-Out to confirm attendance inside the designated workplace perimeter. <em>Kiaan Payroll does not continuously track users' location in the background.</em>
                        </li>
                        <li className="mb-2">
                            <strong>• Camera:</strong> Used when employees or administrators take photos for profile pictures, optional attendance verification, or capturing receipts/documents for expense claims.
                        </li>
                        <li className="mb-2">
                            <strong>• Files & Photos Selection:</strong> The Android system file/photo selection interface is used when users voluntarily choose documents or images for upload (payslips, tax documents, reimbursement receipts, or resumes).
                        </li>
                        <li className="mb-2">
                            <strong>• Notifications:</strong> Delivery of real-time transactional HR alerts, salary notices, and security announcements.
                        </li>
                    </ul>
                </div>

                {/* Section 2: Data Collection Categories */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6">2. Categories of Information We Collect</h5>
                    <ul className="list-unstyled ms-3">
                        <li className="mb-2"><strong>Employee Identity:</strong> Full name, email address, phone number, emergency contacts, profile picture.</li>
                        <li className="mb-2"><strong>Employment & Attendance:</strong> Employee ID, designation, department, work shifts, daily clock-in/out timestamps.</li>
                        <li className="mb-2"><strong>Payroll & Statutory Data:</strong> Bank account numbers, IFSC codes, PAN, and PF/ESIC numbers for salary disbursement and statutory calculations.</li>
                        <li className="mb-2"><strong>Device & Security Logs:</strong> Device model, OS version, IP address, and session logs for authentication and security.</li>
                    </ul>
                </div>

                {/* Section 3: Data Usage & Zero Sale */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6">3. Use of Information & Zero Commercial Sale</h5>
                    <p className="mb-2">We process data strictly for:</p>
                    <ul className="ms-3 mb-2">
                        <li>Calculating automated salaries, overtime, bonuses, deductions, and generating payslips.</li>
                        <li>Verifying workplace attendance and managing leave balances.</li>
                        <li>Executing statutory labor and tax calculations in compliance with applicable laws.</li>
                        <li>Providing customer support and transactional communications.</li>
                    </ul>
                    <div className="p-2 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger small">
                        <AlertCircle size={14} className="me-1 inline" /> <strong>Zero-Sale Pledge:</strong> Kiaan Technology Private Limited does not sell or rent customer or employee personal information to data brokers or advertisers under any circumstances.
                    </div>
                </div>

                {/* Section 4: Transparent Pricing */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <DollarSign size={16} /> 4. Transparent Pricing & No Hidden Charges
                    </h5>
                    <p className="small mb-1">
                        Kiaan Technology Private Limited does not impose undisclosed hidden charges, unexpected platform fees, or unauthorized additional charges on users.
                    </p>
                    <p className="small text-muted mb-0">
                        All applicable subscription fees, taxes (e.g. GST), or agreed third-party add-on services are communicated to the customer before purchase, subscription, renewal, or activation.
                    </p>
                </div>

                {/* Section 5: Data Security */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <Lock size={16} /> 5. Data Security Safeguards
                    </h5>
                    <p className="small">
                        We use reasonable administrative, organizational, and technical safeguards designed to protect personal information against unauthorized access, alteration, disclosure, or destruction. Data transmitted between supported applications and our production servers is protected using HTTPS/TLS encryption.
                    </p>
                </div>

                {/* Section 6: Account & Data Deletion */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6 d-flex align-items-center gap-2">
                        <UserX size={16} /> 6. Account & Personal Data Deletion
                    </h5>
                    <p className="small mb-1">
                        Users who wish to request deletion of their account or associated personal data may contact their organization's authorized HR/Admin or contact Kiaan Technology Support directly at <a href="mailto:support@kiaantechnology.com" className="text-warning">support@kiaantechnology.com</a> with subject <em>"Account & Data Deletion Request"</em>.
                    </p>
                    <small className="text-muted d-block mt-1">
                        Verified deletion requests are generally processed within 30 calendar days, subject to mandatory legal and statutory retention requirements.
                    </small>
                </div>

                {/* Section 7: Children's Privacy */}
                <div className="mb-4">
                    <h5 className="text-warning fw-bold h6">7. Children's Privacy</h5>
                    <p className="small">
                        The service is intended primarily for organizations, employers, employees, administrators, and authorized users and is not directed toward children. We do not knowingly collect information from individuals under the age of 18.
                    </p>
                </div>

                {/* Section 8: Grievance Officer & Contact */}
                <div className="p-3 rounded bg-secondary bg-opacity-10 border border-secondary">
                    <h5 className="text-warning fw-bold h6 mb-3">8. Grievance Redressal & Contact Information</h5>
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
                            <a href={`tel:${serverPolicy?.phone?.replace(/\s+/g, '') || '+919752100980'}`} className="text-warning text-decoration-none">{serverPolicy?.phone || '+91 97521 00980'}</a>
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
