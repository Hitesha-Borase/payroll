import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import Captcha from './Captcha';
import '../../LandingPage.css';
import { publicAPI } from '../services/api';

// ========== EMAIL NOTIFICATION CONFIGURATION ==========
// Set to true to send email notifications, false to disable
const SEND_EMAIL_NOTIFICATION = true;
// ======================================================

const RegistrationForm = () => {
    const navigate = useNavigate();
    const { type } = useParams();
    const currentType = type || 'employers';
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        mobile: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const captchaRef = useRef(null);

    // Security Check: Block Admin Registration
    if (currentType === 'admin') {
        return (
            <Container className="py-5 text-center" style={{ marginTop: '100px' }}>
                <Alert variant="danger" className="d-inline-block shadow-sm">
                    <Alert.Heading>Access Denied</Alert.Heading>
                    <p>Public registration for Admin is restricted. Please contact the system administrator.</p>
                    <Button variant="outline-danger" onClick={() => navigate('/')}>Return Home</Button>
                </Alert>
            </Container>
        );
    }

    const typeLabels = {
        'jobseekers': 'Job Seeker',
        'vendor': 'Vendor',
        'employers': 'Employer',
        // 'admin': 'Admin', // Removed for security
        'job-search': 'Job Search',
        'employees': 'Employee',
        'e-pay': 'E-Pay',
        'ngo': 'NGO',
        'elderly-support': 'Elderly Support',
        'rural-support': 'Rural Support',
        'water-support': 'Water Support',
        'mortgage': 'Mortgage',
        'auto-loan': 'Auto Loan',
        'payroll': 'Payroll',
        'insurance': 'Insurance',
        '2000-companies': '2000 Companies'
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Security Verification CAPTCHA
        if (captchaRef.current && !captchaRef.current.validate()) {
            return;
        }

        setLoading(true);

        try {
            // Step 1: Save to backend database
            await publicAPI.createRequest({
                ...formData,
                request_type: currentType
            });

            // Step 2: Send email notification if enabled
            if (SEND_EMAIL_NOTIFICATION) {
                try {
                    const SERVICE_ID = 'service_ebslx2i';
                    const TEMPLATE_ID = 'template_y5xlrd7';
                    const PUBLIC_KEY = 'pRZwgHFV3aMU8kXab';

                    const templateParams = {
                        to_email: 'info@kiaantechnology.com',
                        user_name: formData.name,
                        user_email: formData.mobile, // Using mobile as user_email field
                        message: `New ${typeLabels[currentType] || 'Registration'} registration request received.\n\nDetails:\nAddress: ${formData.address}\nCity: ${formData.city}\nState: ${formData.state}\nCountry: ${formData.country}\nMobile: ${formData.mobile}`,
                        source: `${typeLabels[currentType] || 'Registration'} Registration Form`
                    };

                    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
                    console.log('Email notification sent successfully');
                } catch (emailError) {
                    console.error('Email notification failed:', emailError);
                    // Don't throw error - registration was successful, email is just a notification
                }
            }

            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className="registration-page" style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
            paddingTop: '80px',
            paddingBottom: '80px'
        }}>
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Card className="shadow-lg border-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <Card.Header className="bg-primary text-white text-center py-4">
                            <h2 className="mb-0">{typeLabels[currentType] || 'Registration'} Form</h2>
                        </Card.Header>
                        <Card.Body className="p-5">
                            {submitted ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-center"
                                >
                                    <div className="mb-4 text-success">
                                        <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                                    </div>
                                    <h3 className="mb-3">Registration Successful!</h3>
                                    <p className="text-muted mb-4">
                                        Thank you for registering as {typeLabels[currentType] || 'Member'}. We will contact you shortly.
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleBackToHome}
                                    >
                                        Back to Home
                                    </Button>
                                </motion.div>
                            ) : (
                                <Form onSubmit={handleSubmit}>
                                    {error && (
                                        <Alert variant="danger" className="mb-4">
                                            {error}
                                        </Alert>
                                    )}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your full name"
                                            size="lg"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Address <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your address"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">City <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your city"
                                            size="lg"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">State <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your state"
                                            size="lg"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Country <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your country"
                                            size="lg"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Mobile No <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="tel"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter your mobile number"
                                            size="lg"
                                        />
                                    </Form.Group>

                                    {/* Security Verification CAPTCHA */}
                                    <Captcha ref={captchaRef} className="mb-4" />

                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            size="lg"
                                            className="fw-semibold"
                                            disabled={loading}
                                        >
                                            {loading ? 'Submitting...' : 'Submit Registration'}
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleBackToHome}
                                            size="lg"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </motion.div>
            </Container>
        </div>
    );
};

export default RegistrationForm;
