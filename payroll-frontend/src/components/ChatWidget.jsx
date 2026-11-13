import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Form, Button, Spinner } from 'react-bootstrap';
import { BiMessageDots, BiX } from 'react-icons/bi';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        user_name: '',
        user_email: '',
        message: ''
    });
    const [status, setStatus] = useState({ loading: false, success: false, error: null });

    const toggleChat = () => setIsOpen(!isOpen);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: false, error: null });

        // EmailJS Configuration
        const SERVICE_ID = 'service_ebslx2i';
        const TEMPLATE_ID = 'template_y5xlrd7';
        const PUBLIC_KEY = 'pRZwgHFV3aMU8kXab';

        const templateParams = {
            to_email: 'info@kiaantechnology.com',
            user_name: formData.user_name,
            user_email: formData.user_email,
            message: formData.message,
            source: 'Chat Widget' // Adding source to distinguish
        };

        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then((result) => {
                setStatus({ loading: false, success: true, error: null });
                setFormData({ user_name: '', user_email: '', message: '' });
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus({ loading: false, success: false, error: null });
                }, 3000);
            }, (error) => {
                setStatus({ loading: false, success: false, error: 'Failed to send.' });
            });
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={toggleChat}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#C62828',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s'
                }}
                className="chat-widget-btn"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? <BiX /> : <BiMessageDots />}
            </button>

            {/* Chat Box */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '20px',
                    width: '320px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ backgroundColor: '#C62828', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h6 className="m-0">Chat with Us</h6>
                        <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}><BiX /></button>
                    </div>

                    <div className="p-3">
                        {status.success ? (
                            <div className="text-center py-4 text-success">
                                <i className="bi bi-check-circle-fill mb-2" style={{ fontSize: '2rem' }}></i>
                                <p>Message Sent!</p>
                            </div>
                        ) : (
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-2">
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="user_name"
                                        placeholder="Name"
                                        value={formData.user_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Control
                                        size="sm"
                                        type="email"
                                        name="user_email"
                                        placeholder="Email"
                                        value={formData.user_email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Control
                                        size="sm"
                                        as="textarea"
                                        rows={3}
                                        name="message"
                                        placeholder="Type your message..."
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    size="sm"
                                    className="w-100"
                                    disabled={status.loading}
                                    style={{ backgroundColor: '#C62828', borderColor: '#C62828' }}
                                >
                                    {status.loading ? <Spinner animation="border" size="sm" /> : 'Send'}
                                </Button>
                            </Form>
                        )}
                        <small className="d-block text-center mt-2 text-muted" style={{ fontSize: '0.7em' }}>
                            Responses sent to {formData.user_email || 'info@kiaantechnology.com'}.
                        </small>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
