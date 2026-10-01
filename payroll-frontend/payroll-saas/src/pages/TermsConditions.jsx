import React from 'react';
import { Container, Card, Badge } from 'react-bootstrap';
import Navbar from '../Layout/Navbar';
import WhatsAppWidget from '../components/WhatsAppWidget';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsConditions = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B', paddingBottom: '60px' }}>
      <Navbar />
      <Container className="pb-5" style={{ maxWidth: '1050px', paddingTop: '95px' }}>
        {/* Navigation Action Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
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
        </div>

        {/* Main Terms Card */}
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
                <FileText size={32} style={{ color: '#C62828' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
                  Terms & Conditions
                </h1>
                <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>
                  Kiaan Technology Private Limited – Subscription & Service Agreement
                </p>
              </div>
            </div>

            <Badge bg="warning" text="dark" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px', fontWeight: '700' }}>
              Effective Date: September 2026
            </Badge>
          </div>

          <div style={{ lineHeight: '1.85', fontSize: '15px', color: '#334155' }}>
            <h4 style={{ color: '#0F172A', marginTop: '20px', fontWeight: '700' }}>1. Acceptance of Subscription Terms</h4>
            <p>
              By accessing or purchasing a SaaS subscription plan on the Kiaan Technology Workforce & Payroll platform, your company agrees to adhere strictly to these terms. Subscriptions are billed on a recurring monthly or annual basis depending on your selected tier.
            </p>

            <h4 style={{ color: '#0F172A', marginTop: '24px', fontWeight: '700' }}>2. Subscription Plans & Payments</h4>
            <p>
              All paid plans (Starter ₹999, Professional ₹1299, Enterprise ₹1499/custom) are processed via secured payment gateways (Razorpay / PayPal). Subscriptions activate immediately upon successful transaction verification.
            </p>

            <h4 style={{ color: '#0F172A', marginTop: '24px', fontWeight: '700' }}>3. Free Trial Policy</h4>
            <p>
              Free Trial plans grant access to core features for testing. When a trial reaches 2 days or less remaining, users receive upgrade notifications to select a paid plan without losing company data.
            </p>

            <h4 style={{ color: '#0F172A', marginTop: '24px', fontWeight: '700' }}>4. Uptime & SLA Guarantee</h4>
            <p>
              We guarantee a 99.9% uptime SLA for all corporate payroll processing systems. System maintenance windows are scheduled outside peak payroll processing hours with advance notice.
            </p>

            <h4 style={{ color: '#0F172A', marginTop: '24px', fontWeight: '700' }}>5. Customer Support & Disputes</h4>
            <p>
              For billing disputes, plan upgrades, or support assistance, contact <a href="mailto:support@kiaantechnology.com" style={{ color: '#C62828', fontWeight: 'bold' }}>support@kiaantechnology.com</a> or call <strong>+91 97521 00980</strong>.
            </p>
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

export default TermsConditions;
