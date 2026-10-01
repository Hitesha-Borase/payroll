import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { AlertTriangle, Sparkles, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrialExpiryModal = ({ show, onHide, daysRemaining, isExpired, onUpgradeClick }) => {
  const navigate = useNavigate();

  // Strict enforcement: Only show if remaining <= 2 or already expired
  if (!show || (!isExpired && daysRemaining > 2)) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#022C22', color: '#ECFDF5', borderBottom: '2px solid #059669' }}>
        <Modal.Title style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isExpired ? (
            <ShieldAlert style={{ color: '#EF4444' }} />
          ) : (
            <AlertTriangle style={{ color: '#F59E0B' }} />
          )}
          {isExpired ? 'Free Trial Expired' : 'Free Trial Expiring Soon!'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#064E3B', color: '#ECFDF5', padding: '32px' }}>
        <div className="text-center mb-4">
          <Badge bg={isExpired ? 'danger' : 'warning'} text="dark" style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '20px', fontWeight: '800' }}>
            <Clock size={14} className="me-1" />
            {isExpired ? 'Trial Status: EXPIRED' : `Action Required: Only ${daysRemaining} Day(s) Remaining`}
          </Badge>

          <h3 style={{ fontSize: '26px', fontWeight: '800', marginTop: '16px', color: '#FFFFFF' }}>
            {isExpired
              ? 'Your Free Trial Has Ended'
              : 'Upgrade to Paid Plan to Maintain Uninterrupted Access'}
          </h3>
          <p style={{ color: '#A7F3D0', fontSize: '14px', maxWidth: '620px', margin: '8px auto 0 auto' }}>
            {isExpired
              ? 'Your 14-day free trial period has concluded. Choose a paid corporate subscription plan to restore full payroll processing, biometric sync, and report export features.'
              : `Your free trial access will expire in ${daysRemaining} day(s). Upgrade now to keep your company employee records, tax configurations, and payroll setup active.`}
          </p>
        </div>

        {/* Benefits list */}
        <div style={{ backgroundColor: 'rgba(2, 44, 34, 0.7)', border: '1px solid #047857', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h5 style={{ fontSize: '14px', color: '#34D399', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> What Happens When You Upgrade:
          </h5>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#D1FAE5', lineHeight: '1.8' }}>
            <li>Instant activation of paid tier (Basic ₹999, Professional ₹1299, Premium ₹1499, Enterprise ₹2999).</li>
            <li>Zero data loss – all existing employee and salary records remain completely preserved.</li>
            <li>Official GST Tax Receipt generated automatically.</li>
            <li>Priority SLA email & WhatsApp support.</li>
          </ul>
        </div>

        <div className="d-flex justify-content-center gap-3">
          <Button
            variant="outline-light"
            onClick={onHide}
            style={{ borderRadius: '8px', padding: '10px 24px', fontWeight: '600' }}
          >
            Remind Me Later
          </Button>
          <Button
            onClick={() => {
              onHide();
              if (onUpgradeClick) {
                onUpgradeClick();
              } else {
                navigate('/admin/upgrade-plan');
              }
            }}
            style={{
              backgroundColor: '#059669',
              borderColor: '#059669',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '10px 28px',
              fontWeight: '800',
              fontSize: '15px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Upgrade Subscription Now <ArrowRight size={16} />
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TrialExpiryModal;
