import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Star, Building2, Quote } from 'lucide-react';

const ClientTestimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Anish Kapadia',
      role: 'VP of Human Resources',
      company: 'Apex Logistics Pvt Ltd',
      employees: '350+ Staff',
      rating: 5,
      review: 'Kiaan Payroll simplified our multi-branch PF and ESI compliance processing. What used to take 4 days every month is now calculated automatically in 15 minutes. Exceptional product stability and support!',
      planName: 'Premium Plan'
    },
    {
      id: 2,
      name: 'Sunita Sharma',
      role: 'Head of Payroll & Finance',
      company: 'TechCorp Global Solutions',
      employees: '120+ Staff',
      rating: 5,
      review: 'The biometric attendance integration and direct bank file transfer features saved us hundreds of manual processing hours. Razorpay billing integration is seamless and transparent.',
      planName: 'Professional Plan'
    },
    {
      id: 3,
      name: 'Rajesh Verma',
      role: 'Managing Director',
      company: 'Verma Infrastructure Group',
      employees: '800+ Staff',
      rating: 5,
      review: 'Switching to Kiaan Technology Enterprise plan gave us 100% data security, multi-tenant isolation, and dedicated SLA support. Highly recommended for any growing Indian enterprise.',
      planName: 'Enterprise Plan'
    }
  ];

  return (
    <div style={{ marginTop: '48px', marginBottom: '32px' }}>
      <div className="text-center mb-4">
        <span style={{
          backgroundColor: '#047857',
          color: '#A7F3D0',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          Client Reviews & Testimonials
        </span>
        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#ECFDF5', marginTop: '12px' }}>
          Trusted by 500+ Corporate Companies & HR Leaders
        </h3>
        <p style={{ color: '#A7F3D0', fontSize: '14px', maxWidth: '600px', margin: '4px auto 0 auto' }}>
          Hear what enterprise payroll administrators and HR directors say about our automated workforce SaaS platform.
        </p>
      </div>

      <Row className="g-4">
        {testimonials.map(item => (
          <Col key={item.id} md={4}>
            <Card style={{
              backgroundColor: 'rgba(6, 78, 59, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #047857',
              borderRadius: '16px',
              padding: '24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              transition: 'transform 0.3s ease',
            }}
            className="hover-card"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-1">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <Quote size={24} style={{ color: '#059669', opacity: 0.6 }} />
              </div>

              <p style={{ color: '#D1FAE5', fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', flexGrow: 1 }}>
                "{item.review}"
              </p>

              <div style={{ borderTop: '1px solid #047857', paddingTop: '16px', marginTop: '16px' }} className="d-flex align-items-center gap-3">
                <div style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '15px'
                }}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h6 style={{ margin: 0, fontWeight: '700', color: '#FFFFFF', fontSize: '14px' }}>{item.name}</h6>
                  <p style={{ margin: 0, color: '#A7F3D0', fontSize: '12px' }}>{item.role} • <strong style={{ color: '#34D399' }}>{item.company}</strong></p>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ClientTestimonials;
