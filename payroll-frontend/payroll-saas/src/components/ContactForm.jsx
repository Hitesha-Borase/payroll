import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Form, Button, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import { publicAPI } from '../services/api';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        user_name: '',
        user_email: '',
        message: ''
    });
    const [status, setStatus] = useState({ loading: false, success: false, error: null });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: false, error: null });

        try {
            // 1. Submit to Backend Support Ticket Database
            await publicAPI.createSupportTicket({
                name: formData.user_name,
                email: formData.user_email,
                category: 'Contact Inquiry',
                priority: 'Normal',
                message: formData.message
            }).catch(err => console.log('Backend contact ticket sync notice:', err.message));

            // 2. Send via EmailJS
            const SERVICE_ID = 'service_ebslx2i';
            const TEMPLATE_ID = 'template_y5xlrd7';
            const PUBLIC_KEY = 'pRZwgHFV3aMU8kXab';

            const templateParams = {
                to_email: 'info@kiaantechnology.com',
                user_name: formData.user_name,
                user_email: formData.user_email,
                message: formData.message,
                source: 'Contact Form'
            };

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY).catch(err => console.log('EmailJS notice:', err));

            setStatus({ loading: false, success: true, error: null });
            setFormData({ user_name: '', user_email: '', message: '' });
        } catch (error) {
            console.error(error);
            setStatus({ loading: false, success: false, error: 'Failed to send message. Please try again later.' });
        }
    };

    return (
        <Container className="py-5" id="contact-form-section">
            <Row className="justify-content-center">
                <Col md={8} lg={7}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-3" style={{ color: '#C62828' }}>Contact Us</h2>
                            <div className="d-flex flex-wrap justify-content-center gap-2 mb-4 text-center">
                                <div className="px-3 py-2 bg-light rounded-3">
                                    <small className="text-muted d-block">Email</small>
                                    <a href="mailto:info@kiaantechnology.com" className="fw-semibold text-dark text-decoration-none" style={{ fontSize: '0.88rem' }}>
                                        info@kiaantechnology.com
                                    </a>
                                </div>
                                <div className="px-3 py-2 bg-light rounded-3">
                                    <small className="text-muted d-block">Call / WhatsApp</small>
                                    <a href="https://wa.me/919752100980" target="_blank" rel="noopener noreferrer" className="fw-semibold text-success text-decoration-none" style={{ fontSize: '0.88rem' }}>
                                        +91 97521 00980
                                    </a>
                                </div>
                                <div className="px-3 py-2 bg-light rounded-3">
                                    <small className="text-muted d-block">Location</small>
                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>
                                        Indore, MP, India
                                    </span>
                                </div>
                            </div>
                            <p className="text-center text-muted mb-4">
                                Have any questions? Fill out the form below and we'll get message directly to our inbox.
                            </p>

                            {status.success && <Alert variant="success">Message sent successfully!</Alert>}
                            {status.error && <Alert variant="danger">{status.error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="user_name"
                                        value={formData.user_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your Name"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="user_email"
                                        value={formData.user_email}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your Email"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Message</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="How can we help you?"
                                    />
                                </Form.Group>
                                <div className="d-grid">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={status.loading}
                                        style={{ backgroundColor: '#C62828', borderColor: '#C62828' }}
                                    >
                                        {status.loading ? <Spinner animation="border" size="sm" /> : 'Send Message'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ContactForm;
