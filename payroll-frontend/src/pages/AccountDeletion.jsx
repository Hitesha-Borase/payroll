import React, { useState } from 'react';
import { publicAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Mail, 
  Smartphone,
  Info
} from 'lucide-react';

const AccountDeletion = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organization: '',
    reason: '',
    confirmAcknowledged: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.confirmAcknowledged) {
      alert('Please acknowledge that account deletion is permanent.');
      return;
    }

    setLoading(true);
    try {
      await publicAPI.createSupportTicket({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        category: 'Account Deletion Request',
        priority: 'High',
        message: `[OFFICIAL ACCOUNT & DATA DELETION REQUEST]\nFull Name: ${formData.fullName.trim()}\nEmail: ${formData.email.trim()}\nOrganization: ${formData.organization || 'Not provided'}\nReason: ${formData.reason || 'Not specified'}\nAcknowledgement: User acknowledged permanent removal of account and personal identifiers under Google Play User Data policy.`
      });
      setSubmitted(true);
    } catch (err) {
      // Graceful fallback to mailto if offline or server unreachable
      setSubmitted(true);
      const subject = encodeURIComponent(`Account & Data Deletion Request - ${formData.email}`);
      const body = encodeURIComponent(
        `Full Name: ${formData.fullName}\nEmail: ${formData.email}\nOrganization: ${formData.organization}\nReason: ${formData.reason || 'Not specified'}\n\nI confirm that I am requesting permanent deletion of my account and personal data.`
      );
      window.location.href = `mailto:support@kiaantechnology.com?subject=${subject}&body=${body}`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#0F172A' }}>
      {/* Header Bar */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/payrollplus_logo.png" alt="PayrollPlus Logo" style={{ height: '42px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0F172A' }}>Kiaan PayrollPlus</h1>
              <p style={{ fontSize: '12px', margin: 0, color: '#64748B' }}>Account & Data Deletion Portal</p>
            </div>
          </div>
          <Link 
            to="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              textDecoration: 'none', 
              color: '#475569', 
              fontSize: '13px', 
              fontWeight: '600',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1'
            }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '36px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#FEE2E2', padding: '12px', borderRadius: '12px', color: '#DC2626' }}>
              <Trash2 size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                Account & Personal Data Deletion Request
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
                Google Play Policy Compliance & User Privacy Rights
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', borderLeft: '4px solid #3B82F6' }}>
            <p style={{ fontSize: '14px', margin: 0, lineHeight: 1.6, color: '#334155' }}>
              In compliance with Google Play Store User Data policies, Kiaan Technology provides users with two straightforward methods to permanently delete their account and associated personal data: directly within our application or via this dedicated web-based deletion portal.
            </p>
          </div>

          {/* Dual Deletion Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Option 1: In-App Deletion */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', backgroundColor: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Smartphone size={20} style={{ color: '#C62828' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Option 1: In-App Instant Deletion</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '14px' }}>
                If you have access to your account, you can initiate immediate self-service account deletion directly within the app:
              </p>
              <ol style={{ fontSize: '13px', color: '#334155', paddingLeft: '18px', lineHeight: 1.8, margin: 0 }}>
                <li>Log in to your <strong>PayrollPlus</strong> mobile app or web portal.</li>
                <li>Navigate to <strong>Profile</strong> (or <strong>Settings &gt; Profile</strong>).</li>
                <li>Scroll to the <strong>Danger Zone</strong> section at the bottom.</li>
                <li>Click <strong>Permanently Delete Account</strong>.</li>
                <li>Re-authenticate by entering your current password and confirm.</li>
              </ol>
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#16A34A', fontWeight: '600' }}>
                ⚡ Processing Time: Immediate (login access revoked instantly).
              </div>
            </div>

            {/* Option 2: Web / Email Request */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', backgroundColor: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Mail size={20} style={{ color: '#C62828' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Option 2: Web Request Form</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '14px' }}>
                If you cannot log in or have uninstalled the application, submit an official deletion request using the form below or via direct email:
              </p>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '8px' }}>
                <strong>Support Email:</strong> <a href="mailto:support@kiaantechnology.com" style={{ color: '#C62828' }}>support@kiaantechnology.com</a>
              </p>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                <strong>Subject:</strong> <code>Account &amp; Data Deletion Request</code>
              </p>
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#2563EB', fontWeight: '600' }}>
                ⏳ Processing Time: Within 30 calendar days (after identity verification).
              </div>
            </div>
          </div>

          {/* Web Submission Form */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#0F172A' }}>
              Submit Web Deletion Request
            </h3>

            {submitted ? (
              <div style={{ backgroundColor: '#DCFCE7', borderRadius: '8px', padding: '20px', border: '1px solid #86EFAC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: '700', marginBottom: '8px' }}>
                  <CheckCircle2 size={20} /> Request Received
                </div>
                <p style={{ fontSize: '13.5px', color: '#14532D', margin: 0, lineHeight: 1.6 }}>
                  Thank you. Your request for account and data deletion has been initiated. Our support team will verify your identity and process the deletion within statutory timelines. A confirmation will be sent to <strong>{formData.email}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      Registered Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. user@company.com"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    Company / Organization Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Tell us why you are leaving or requesting deletion..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="ack"
                    required
                    checked={formData.confirmAcknowledged}
                    onChange={(e) => setFormData({ ...formData, confirmAcknowledged: e.target.checked })}
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="ack" style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    I understand that account deletion permanently deletes my profile, login credentials, and personal contact identifiers, and that this action is irreversible.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#C62828',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(198, 40, 40, 0.3)'
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Deletion Request'}
                </button>
              </form>
            )}
          </div>

          {/* Statutory Data Retention & Scope Disclosure */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: '#059669' }} /> Data Retention &amp; Permanent Deletion Scope
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* What is Deleted */}
              <div style={{ backgroundColor: '#F0FDF4', padding: '16px 20px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#166534', margin: '0 0 10px 0' }}>
                  ✅ Data Scrubbed &amp; Permanently Deleted
                </h4>
                <ul style={{ fontSize: '13px', color: '#14532D', paddingLeft: '18px', margin: 0, lineHeight: 1.7 }}>
                  <li>Account username, full name, and display details</li>
                  <li>Personal email address and mobile phone number</li>
                  <li>Password hashes and active session tokens</li>
                  <li>Profile photos and biometric identifiers</li>
                  <li>Active SaaS subscriptions and auto-renewals (terminated)</li>
                </ul>
              </div>

              {/* What is Retained */}
              <div style={{ backgroundColor: '#FEF2F2', padding: '16px 20px', borderRadius: '10px', border: '1px solid #FECACA' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B', margin: '0 0 10px 0' }}>
                  ⚖️ Retained for Statutory &amp; Legal Compliance
                </h4>
                <ul style={{ fontSize: '13px', color: '#7F1D1D', paddingLeft: '18px', margin: 0, lineHeight: 1.7 }}>
                  <li>Historical payroll statements &amp; salary disbursement journals</li>
                  <li>Corporate tax receipts, TDS, and GST payment invoices</li>
                  <li>Statutory financial audit trails and ledger records</li>
                  <li>Fraud prevention and cybersecurity access logs</li>
                </ul>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, marginTop: '16px', fontStyle: 'italic' }}>
              Statutory records are retained solely to fulfill mandatory obligations under applicable corporate governance, income tax, and labor legislation (typically up to 7 to 8 financial years), after which they are systematically purged.
            </p>
          </div>

          {/* Privacy Policy Link */}
          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '24px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/privacy-policy" style={{ fontSize: '13px', color: '#C62828', fontWeight: '600', textDecoration: 'none' }}>
              Read our Full Privacy Policy &rarr;
            </Link>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Kiaan Technology &copy; {new Date().getFullYear()}
            </span>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AccountDeletion;
