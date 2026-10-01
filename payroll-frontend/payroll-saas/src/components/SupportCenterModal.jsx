import React, { useState } from 'react';
import { Modal, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Phone, Mail, Clock, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { publicAPI } from '../services/api';
import './SupportCenterModal.css';

const SupportCenterModal = ({ show, onHide }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Billing & Subscriptions',
    priority: 'Normal',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in your Name, Email, and Support Query.');
      return;
    }

    try {
      setLoading(true);
      const res = await publicAPI.createSupportTicket(formData);
      if (res.data?.success) {
        setSubmitted(true);
        toast.success('Support ticket submitted successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to submit support ticket.');
      }
    } catch (err) {
      console.error('[SUPPORT_TICKET_SUBMIT_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      category: 'Billing & Subscriptions',
      priority: 'Normal',
      message: ''
    });
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
      dialogClassName="kiaan-support-modal-dialog"
      contentClassName="kiaan-support-modal-content"
    >
      <div className="kiaan-support-modal-body position-relative p-3 p-sm-4">
        
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={handleClose}
          className="kiaan-support-close-btn d-flex align-items-center justify-content-center"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* TOP HEADER */}
        <div className="mb-3 pe-4 pe-md-0">
          <div className="kiaan-support-badge d-inline-flex align-items-center gap-1.5 mb-1.5">
            <HelpCircle size={13} className="text-warning" />
            <span>KIAAN CARE SUPPORT</span>
          </div>

          <h3 className="kiaan-support-title fw-bold text-white mb-1">
            SUPPORT <span className="kiaan-gold-text">CENTER</span>
          </h3>

          <p className="kiaan-support-subtitle mb-0">
            Submit a service ticket or contact our integration managers for assistance.
          </p>
        </div>

        {/* 3 TOP CONTACT CARDS */}
        <Row className="g-2 mb-3">
          <Col xs={12} sm={4}>
            <div className="kiaan-support-card p-2.5 d-flex align-items-center gap-2.5 h-100">
              <div className="kiaan-support-icon-wrap d-flex align-items-center justify-content-center flex-shrink-0">
                <Phone size={16} className="text-warning" />
              </div>
              <div className="min-w-0">
                <h6 className="fw-bold text-white mb-0.5" style={{ fontSize: '0.82rem' }}>Call Support</h6>
                <a href="tel:+919752100980" className="kiaan-support-card-link text-decoration-none d-block">
                  +91-97521 00980
                </a>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={4}>
            <div className="kiaan-support-card p-2.5 d-flex align-items-center gap-2.5 h-100">
              <div className="kiaan-support-icon-wrap d-flex align-items-center justify-content-center flex-shrink-0">
                <Mail size={16} className="text-warning" />
              </div>
              <div className="min-w-0">
                <h6 className="fw-bold text-white mb-0.5" style={{ fontSize: '0.82rem' }}>Email Support</h6>
                <a href="mailto:info@kiaantechnology.com" className="kiaan-support-card-link text-decoration-none d-block text-break">
                  info@kiaantechnology.com
                </a>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={4}>
            <div className="kiaan-support-card p-2.5 d-flex align-items-center gap-2.5 h-100">
              <div className="kiaan-support-icon-wrap d-flex align-items-center justify-content-center flex-shrink-0">
                <Clock size={16} className="text-warning" />
              </div>
              <div className="min-w-0">
                <h6 className="fw-bold text-white mb-0.5" style={{ fontSize: '0.82rem' }}>Working Hours</h6>
                <span className="kiaan-support-card-subtext d-block">
                  Mon-Sat: 10AM-7PM
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {/* FORM / SUCCESS CONTAINER */}
        <div className="kiaan-support-form-container p-3 p-sm-3.5">
          {submitted ? (
            <div className="text-center py-3">
              <CheckCircle2 size={44} className="text-warning mb-2" />
              <h5 className="fw-bold text-white mb-1.5">Ticket Submitted Successfully!</h5>
              <p className="text-white-50 mb-3" style={{ fontSize: '0.88rem' }}>
                Thank you for contacting Kiaan Care Support. Your ticket has been logged and sent to our team at <strong className="text-warning">info@kiaantechnology.com</strong>.
              </p>
              <Button variant="outline-warning" onClick={handleClose} className="px-3 py-1.5 fw-semibold" style={{ fontSize: '0.85rem' }}>
                Close Window
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <h5 className="fw-bold text-white mb-2.5" style={{ fontSize: '0.98rem' }}>
                Create Support Ticket
              </h5>

              <Row className="g-2 mb-2">
                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="kiaan-form-label">NAME</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="kiaan-form-input"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="kiaan-form-label">EMAIL</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="you@domain.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="kiaan-form-input"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="kiaan-form-label">CATEGORY</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="kiaan-form-input"
                    >
                      <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Account & Access">Account & Access</option>
                      <option value="Payroll & HRMS">Payroll & HRMS</option>
                      <option value="General Query">General Query</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="kiaan-form-label">PRIORITY</Form.Label>
                    <Form.Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="kiaan-form-input"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Low">Low</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="kiaan-form-label">MESSAGE</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="message"
                      placeholder="Briefly describe your support query..."
                      value={formData.message}
                      onChange={handleChange}
                      className="kiaan-form-input kiaan-textarea"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex flex-column flex-sm-row justify-content-end mt-3 gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="kiaan-submit-btn px-3.5 py-1.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                >
                  {loading ? <Spinner animation="border" size="sm" /> : 'Submit Support Ticket'}
                </Button>
              </div>
            </Form>
          )}
        </div>

      </div>
    </Modal>
  );
};

export default SupportCenterModal;

