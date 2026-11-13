import React, { useState } from 'react';
import { Modal, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { MapPin, Phone, Mail, Globe, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { publicAPI } from '../services/api';

const ContactUsModal = ({ show, onHide }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in your Name, Email, and Message inquiry.');
      return;
    }

    try {
      setLoading(true);
      const res = await publicAPI.createSupportTicket({
        name: formData.name,
        email: formData.email,
        category: 'General Inquiry',
        priority: 'Normal',
        message: `[CONTACT US FORM] Phone: ${formData.phone || 'N/A'} | Message: ${formData.message}`
      });

      if (res.data?.success) {
        setSubmitted(true);
        toast.success('Your message has been sent to Kiaan Technology team!');
      }
    } catch (err) {
      console.error('[CONTACT_US_SUBMIT_ERROR]', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '1.2rem' }}>
          <Mail size={24} className="text-warning" />
          Contact Us – Kiaan Technology Private Limited
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ backgroundColor: '#0F172A', color: '#CBD5E1' }} className="p-4">
        <Row className="g-4">
          {/* CONTACT INFORMATION COLUMN */}
          <Col xs={12} md={5} className="border-end border-slate-800">
            <h6 className="fw-bold text-white mb-3">Headquarters Info</h6>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.75rem' }}>Address</small>
                  <span className="text-white" style={{ fontSize: '0.88rem' }}>
                    2341/E, Sudama Nagar, Indore, Madhya Pradesh, India
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.75rem' }}>Call Us</small>
                  <a href="tel:+919752100980" className="text-warning text-decoration-none fw-semibold" style={{ fontSize: '0.9rem' }}>
                    +91-97521 00980
                  </a>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.75rem' }}>Email Us</small>
                  <a href="mailto:info@kiaantechnology.com" className="text-warning text-decoration-none fw-semibold" style={{ fontSize: '0.9rem' }}>
                    info@kiaantechnology.com
                  </a>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>
                  <Globe size={20} />
                </div>
                <div>
                  <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.75rem' }}>Website</small>
                  <a href="https://kiaantechnology.com" target="_blank" rel="noopener noreferrer" className="text-warning text-decoration-none fw-semibold" style={{ fontSize: '0.9rem' }}>
                    kiaantechnology.com
                  </a>
                </div>
              </div>
            </div>
          </Col>

          {/* INQUIRY FORM COLUMN */}
          <Col xs={12} md={7}>
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="text-warning mb-3" />
                <h5 className="fw-bold text-white">Inquiry Received!</h5>
                <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                  Thank you for reaching out to Kiaan Technology. Our representative will contact you shortly.
                </p>
                <Button variant="outline-warning" onClick={handleClose} size="sm" className="mt-2">
                  Close Window
                </Button>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <h6 className="fw-bold text-white mb-3">Send Direct Inquiry</h6>

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">YOUR NAME *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF' }}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">EMAIL ADDRESS *</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="you@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF' }}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">PHONE NUMBER</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small fw-bold">MESSAGE *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Type your inquiry or request details..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF' }}
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="warning" disabled={loading} className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                  {loading ? <Spinner animation="border" size="sm" /> : <><Send size={16} /> Send Inquiry</>}
                </Button>
              </Form>
            )}
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default ContactUsModal;
