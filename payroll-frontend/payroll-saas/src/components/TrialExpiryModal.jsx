import React from 'react';
import { Modal } from 'react-bootstrap';
import { Clock, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrialExpiryModal = ({ show, onHide, daysRemaining = 0, isExpired = false, onUpgradeClick }) => {
  const navigate = useNavigate();

  if (!show) {
    return null;
  }

  const handleUpgrade = () => {
    if (onHide) onHide();
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/pricing');
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      contentClassName="border-0 bg-transparent shadow-none"
      style={{ zIndex: 1060 }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.16), 0 0 25px rgba(198, 40, 40, 0.08)',
          padding: '38px 32px 30px 32px',
          position: 'relative',
          textAlign: 'center',
          color: '#0F172A',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          maxWidth: '460px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Top-Right Dismiss Cross Button */}
        <button
          onClick={onHide}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '18px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FEE2E2';
            e.currentTarget.style.color = '#DC2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <X size={18} />
        </button>

        {/* Circular Hourglass / Clock Brand Icon Badge */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.1)',
            border: isExpired ? '2px solid rgba(239, 68, 68, 0.25)' : '2px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <Clock size={34} style={{ color: isExpired ? '#DC2626' : '#D97706' }} />
        </div>

        {/* Modal Heading */}
        <h3
          style={{
            fontSize: '23px',
            fontWeight: '800',
            color: '#0F172A',
            marginBottom: '12px',
            letterSpacing: '-0.3px',
          }}
        >
          {isExpired ? 'Free Trial Expired!' : 'Free Trial Expiring Soon!'}
        </h3>

        {/* Dynamic Notice Body according to Software */}
        <p
          style={{
            color: '#64748B',
            fontSize: '14.5px',
            lineHeight: '1.6',
            maxWidth: '430px',
            margin: '0 auto 26px auto',
          }}
        >
          {isExpired ? (
            <>
              Notice: Your <strong style={{ color: '#DC2626' }}>7-Day Free Trial</strong> has concluded. Upgrade your plan now to restore full payroll processing, biometric attendance sync, and tax reports.
            </>
          ) : (
            <>
              Notice: You have only{' '}
              <strong
                style={{
                  color: '#D97706',
                  fontWeight: '800',
                  fontSize: '15.5px',
                }}
              >
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
              </strong>{' '}
              in your 7-Day Free Trial plan. Upgrade your plan now to avoid workforce and payroll management limits.
            </>
          )}
        </p>

        {/* Primary CTA Upgrade Button */}
        <button
          onClick={handleUpgrade}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '15px',
            letterSpacing: '0.5px',
            boxShadow: '0 8px 24px rgba(198, 40, 40, 0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(198, 40, 40, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(198, 40, 40, 0.35)';
          }}
        >
          UPGRADE PLAN NOW <ArrowRight size={18} />
        </button>

        {/* Remind Me Later Dismissal Link */}
        <div>
          <button
            onClick={onHide}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '14px',
              fontWeight: '600',
              marginTop: '16px',
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
            }}
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TrialExpiryModal;
