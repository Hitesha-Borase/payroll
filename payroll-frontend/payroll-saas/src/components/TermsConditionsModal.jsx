import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FileText, CheckCircle, ShieldCheck, Scale } from 'lucide-react';

const TermsConditionsModal = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '1.2rem' }}>
          <Scale size={24} className="text-warning" />
          Terms & Conditions – Kiaan Technology Payroll & HRMS SaaS
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: '#0F172A', color: '#CBD5E1', fontSize: '0.9rem', maxHeight: '70vh', overflowY: 'auto' }} className="p-4">
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
          <p className="mb-0 text-warning" style={{ fontSize: '0.85rem' }}>
            <strong>Effective Date:</strong> January 1, 2026 | <strong>Version:</strong> 2.4 (Enterprise Production SLA)
            <br />
            Please read these Terms & Conditions carefully before using Kiaan Technology Payroll & HRMS SaaS.
          </p>
        </div>

        {/* SECTION 1 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 1. Acceptance of Terms
          </h6>
          <p className="text-slate-300">
            By accessing or using the Kiaan Technology Workforce, Payroll & HRMS SaaS platform ("Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree with any part of these terms, you must discontinue platform access immediately.
          </p>
        </div>

        {/* SECTION 2 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-warning" /> 2. User Accounts & Credentials Security
          </h6>
          <p className="text-slate-300">
            Account administrators and employers are responsible for maintaining the confidentiality of their login credentials. Any unauthorized access under your company account must be reported immediately to <strong>info@kiaantechnology.com</strong>.
          </p>
        </div>

        {/* SECTION 3 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 3. Service Usage Rules & Acceptable Use
          </h6>
          <p className="text-slate-300">
            Users shall not attempt to reverse engineer, decompile, scrape, or deploy malicious scripts on the platform. Violation of platform integrity will lead to immediate account suspension and legal action under the Information Technology Act.
          </p>
        </div>

        {/* SECTION 4 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 4. Payroll & HRMS Compliance Disclaimer
          </h6>
          <p className="text-slate-300">
            While Kiaan Technology provides automated salary, EPF, ESI, and tax calculation tools, employers remain solely responsible for ensuring statutory labor law compliance and verifying submitted employee attendance and bank details.
          </p>
        </div>

        {/* SECTION 5 & 6 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 5. Subscription & Non-Refundable Payment Policy
          </h6>
          <p className="text-slate-300">
            SaaS subscription plans (Free Trial, Basic, Professional, Premium, Enterprise) are billed periodically via Razorpay. All paid subscription fees are strictly non-refundable once processed. Upon cancellation, access remains active until the end of the current billing cycle.
          </p>
        </div>

        {/* SECTION 7 & 8 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 7. Intellectual Property & Limitation of Liability
          </h6>
          <p className="text-slate-300">
            All proprietary code, algorithms, designs, logos, and features are the exclusive intellectual property of Kiaan Technology Private Limited. In no event shall Kiaan Technology be liable for indirect, consequential, or punitive damages.
          </p>
        </div>

        {/* SECTION 9 */}
        <div className="mb-4">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 9. Service Level Agreement (99.9% Uptime SLA)
          </h6>
          <p className="text-slate-300">
            Kiaan Technology strives to maintain a 99.9% cloud server uptime. Scheduled maintenance windows will be communicated to Super Admins and HR Admins at least 24 hours in advance.
          </p>
        </div>

        {/* SECTION 12 */}
        <div className="mb-3">
          <h6 className="fw-bold text-white d-flex align-items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-warning" /> 12. Governing Law & Jurisdiction
          </h6>
          <p className="text-slate-300 mb-0">
            These terms shall be governed by and construed in accordance with the laws of India. Any legal dispute or proceeding shall be subject to the exclusive jurisdiction of the courts located in <strong>Indore, Madhya Pradesh, India</strong>.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ backgroundColor: '#0F172A', borderTop: '1px solid #1E293B' }}>
        <Button variant="warning" onClick={onHide} className="fw-semibold px-4">
          I Understand & Agree
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TermsConditionsModal;
