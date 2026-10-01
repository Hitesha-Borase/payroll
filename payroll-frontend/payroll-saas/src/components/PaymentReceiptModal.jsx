import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { CheckCircle2, Download, Printer, ShieldCheck, FileCheck } from 'lucide-react';

const PaymentReceiptModal = ({ show, onHide, receiptData }) => {
  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#022C22', color: '#ECFDF5', borderBottom: '2px solid #059669' }}>
        <Modal.Title style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck style={{ color: '#10B981' }} /> Official Razorpay Payment Receipt
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#F8FAFC', padding: '32px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                KIAAN TECHNOLOGY PVT LTD
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '13px' }}>
                Payroll & HRMS Multi-Tenant SaaS Platform
              </p>
              <p style={{ margin: '2px 0 0 0', color: '#94A3B8', fontSize: '12px' }}>
                GSTIN: 23AAACK1029F1Z4 | support@kiaantechnology.com
              </p>
            </div>
            <div className="text-end">
              <Badge bg="success" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px' }}>
                <CheckCircle2 size={12} className="me-1" /> VERIFIED & PAID
              </Badge>
              <p style={{ margin: '6px 0 0 0', color: '#64748B', fontSize: '12px', fontWeight: '700' }}>
                Receipt Date: {receiptData.paymentDate || new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="row g-3 mb-4" style={{ fontSize: '14px', color: '#334155' }}>
            <div className="col-md-6">
              <div style={{ backgroundColor: '#F1F5F9', padding: '14px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Subscribed Organization</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0F172A' }}>{receiptData.companyName || 'Corporate Client'}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#475569' }}>{receiptData.adminEmail || 'admin@company.com'}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '14px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>Subscription Tier</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#064E3B', fontSize: '16px' }}>{receiptData.planName || 'Selected Plan'}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#047857' }}>Validity: {receiptData.startDate} to {receiptData.endDate}</p>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <table className="table table-bordered mb-4" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#064E3B', color: '#FFFFFF' }}>
              <tr>
                <th>Description</th>
                <th>Razorpay Transaction Identifiers</th>
                <th className="text-end">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{receiptData.planName} SaaS Subscription</strong>
                  <br />
                  <small className="text-muted">Includes Automated Payroll, Statutory Compliance & HRMS Access</small>
                </td>
                <td>
                  <div>Order ID: <code>{receiptData.razorpayOrderId || 'N/A'}</code></div>
                  <div>Payment ID: <code style={{ color: '#059669', fontWeight: 'bold' }}>{receiptData.razorpayPaymentId || 'N/A'}</code></div>
                </td>
                <td className="text-end align-middle" style={{ fontSize: '16px', fontWeight: '800', color: '#047857' }}>
                  ₹{parseFloat(receiptData.amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer note */}
          <div style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '12px 16px', borderRadius: '4px', fontSize: '12px', color: '#92400E' }}>
            <FileCheck size={14} className="me-1 inline" />
            This is an official system-generated electronic receipt for your SaaS subscription purchase. Razorpay HMAC-SHA256 verification confirmed.
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer style={{ backgroundColor: '#F1F5F9', borderTop: '1px solid #E2E8F0' }}>
        <Button variant="outline-secondary" onClick={handlePrint} style={{ borderRadius: '8px', fontWeight: '600' }}>
          <Printer size={16} className="me-1" /> Print Receipt
        </Button>
        <Button variant="success" onClick={onHide} style={{ backgroundColor: '#059669', borderColor: '#059669', borderRadius: '8px', fontWeight: '700' }}>
          Close & Return to Dashboard
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentReceiptModal;
