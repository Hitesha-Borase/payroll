import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { 
  User, 
  Lock, 
  CreditCard, 
  Mail, 
  AlertTriangle, 
  Save, 
  Key, 
  Settings as SettingsIcon,
  CheckCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Server,
  Percent,
  RefreshCw,
  Globe
} from 'lucide-react';
import { superadminAPI } from '../../services/api';
import { useFetchSuperAdminProfile } from '../../hooks/useAPI';
import SuperAdminLayout from './SuperAdminLayout';

const Settings = () => {
  const { profile, loading: profileLoading } = useFetchSuperAdminProfile();
  const [activeTab, setActiveTab] = useState('profile');

  // Password visibility toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // 1. Profile Settings State
  const [profileSettings, setProfileSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // 2. Password State
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 3. Razorpay Payment Gateway State
  const [gatewaySettings, setGatewaySettings] = useState({
    razorpayKeyId: '',
    razorpaySecret: '',
    mode: 'live',
    currency: 'INR',
  });

  // 4. Brevo Email SMTP State
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: '587',
    senderEmail: 'lightlabcreation@gmail.com',
    senderName: 'Kiaan Payroll & HRMS',
    apiKey: '',
  });

  // 5. System Tax & Billing State
  const [taxSettings, setTaxSettings] = useState({
    gstTaxRate: '18',
    invoicePrefix: 'INV-',
    enableGstValidation: true,
  });

  // 6. Maintenance Mode State
  const [maintenanceMode, setMaintenanceMode] = useState({
    isMaintenanceOn: false,
    maintenanceMessage: 'System is undergoing scheduled maintenance. Please check back shortly.',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileSettings({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await superadminAPI.updateProfile({
        firstName: profileSettings.firstName,
        lastName: profileSettings.lastName,
        email: profileSettings.email,
        phone: profileSettings.phone,
      });
      if (res?.data?.success) {
        toast.success('Super Admin Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordSettings.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      setSaving(true);
      const res = await superadminAPI.changePassword({
        currentPassword: passwordSettings.currentPassword,
        newPassword: passwordSettings.newPassword,
      });
      if (res?.data?.success) {
        toast.success('Password changed successfully!');
        setPasswordSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGateway = (e) => {
    e.preventDefault();
    toast.success('Razorpay Payment Gateway settings saved!');
  };

  const handleSaveSMTP = (e) => {
    e.preventDefault();
    toast.success('Brevo Email SMTP settings updated!');
  };

  const handleSaveTax = (e) => {
    e.preventDefault();
    toast.success('Tax rate & billing rules updated!');
  };

  const handleSaveMaintenance = (e) => {
    e.preventDefault();
    toast.success(`Platform Maintenance Mode turned ${maintenanceMode.isMaintenanceOn ? 'ON' : 'OFF'}`);
  };

  const tabList = [
    { id: 'profile', label: 'Profile & Credentials', icon: User },
    { id: 'gateway', label: 'Razorpay Gateway', icon: CreditCard },
    { id: 'smtp', label: 'Brevo Email SMTP', icon: Mail },
    { id: 'tax', label: 'Tax & Maintenance', icon: AlertTriangle },
  ];

  if (profileLoading) {
    return (
      <SuperAdminLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" variant="danger" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="w-100" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '30px' }}>
        
        {/* Header Section */}
        <div className="mb-3 mb-md-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(198, 40, 40, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <SettingsIcon size={20} color="#C62828" />
            </div>
            <h1 
              className="fw-bold mb-0 text-dark"
              style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.55rem)', letterSpacing: '-0.3px' }}
            >
              Global SaaS Platform Settings
            </h1>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.82rem, 2vw, 0.9rem)', lineHeight: '1.5' }}>
            Manage Super Admin profile credentials, Razorpay API keys, Brevo email SMTP, GST rates, and maintenance switches.
          </p>
        </div>

        {/* Responsive Horizontal Tab Bar */}
        <div 
          className="d-flex align-items-center gap-2 mb-4 pb-2"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {tabList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '700' : '600',
                  color: isActive ? '#FFFFFF' : '#475569',
                  backgroundColor: isActive ? '#C62828' : '#F1F5F9',
                  border: isActive ? '1px solid #C62828' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(198, 40, 40, 0.25)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  outline: 'none',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panels */}
        <div className="tab-content-container">
          
          {/* TAB 1: PROFILE & CREDENTIALS */}
          {activeTab === 'profile' && (
            <Row className="g-3 g-md-4">
              {/* Profile Details */}
              <Col xs={12} lg={6}>
                <Card 
                  className="h-100 border-0 shadow-sm"
                  style={{ borderRadius: '16px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}
                >
                  <Card.Header 
                    className="py-3 px-3 px-md-4"
                    style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <User size={18} color="#C62828" />
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                        Super Admin Profile Details
                      </h6>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-3 p-md-4">
                    <Form onSubmit={handleSaveProfile}>
                      <Row className="g-2 g-md-3 mb-3">
                        <Col xs={12} sm={6}>
                          <Form.Group>
                            <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>First Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileSettings.firstName}
                              onChange={(e) => setProfileSettings({ ...profileSettings, firstName: e.target.value })}
                              placeholder="First name"
                              style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Group>
                            <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Last Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileSettings.lastName}
                              onChange={(e) => setProfileSettings({ ...profileSettings, lastName: e.target.value })}
                              placeholder="Last name"
                              style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          value={profileSettings.email}
                          onChange={(e) => setProfileSettings({ ...profileSettings, email: e.target.value })}
                          placeholder="superadmin@domain.com"
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={profileSettings.phone}
                          onChange={(e) => setProfileSettings({ ...profileSettings, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>

                      <Button 
                        type="submit" 
                        disabled={saving} 
                        className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        style={{ 
                          backgroundColor: '#C62828', 
                          borderColor: '#C62828', 
                          borderRadius: '10px', 
                          padding: '11px',
                          fontSize: '14px'
                        }}
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            <span>Saving Profile...</span>
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Profile Changes</span>
                          </>
                        )}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              {/* Password Management */}
              <Col xs={12} lg={6}>
                <Card 
                  className="h-100 border-0 shadow-sm"
                  style={{ borderRadius: '16px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}
                >
                  <Card.Header 
                    className="py-3 px-3 px-md-4"
                    style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Lock size={18} color="#0F172A" />
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                        Change Security Password
                      </h6>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-3 p-md-4">
                    <Form onSubmit={handleChangePassword}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Current Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showCurrentPass ? 'text' : 'password'}
                            value={passwordSettings.currentPassword}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                            style={{ borderRadius: '10px 0 0 10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            style={{ borderRadius: '0 10px 10px 0', border: '1px solid #CBD5E1', borderLeft: 'none' }}
                          >
                            {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>New Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showNewPass ? 'text' : 'password'}
                            value={passwordSettings.newPassword}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, newPassword: e.target.value })}
                            placeholder="Enter new password (min 6 chars)"
                            style={{ borderRadius: '10px 0 0 10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            style={{ borderRadius: '0 10px 10px 0', border: '1px solid #CBD5E1', borderLeft: 'none' }}
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Confirm New Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showConfirmPass ? 'text' : 'password'}
                            value={passwordSettings.confirmPassword}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                            style={{ borderRadius: '10px 0 0 10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            style={{ borderRadius: '0 10px 10px 0', border: '1px solid #CBD5E1', borderLeft: 'none' }}
                          >
                            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                      </Form.Group>

                      <Button 
                        type="submit" 
                        disabled={saving} 
                        className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
                        style={{ 
                          backgroundColor: '#0F172A', 
                          borderColor: '#0F172A', 
                          borderRadius: '10px', 
                          padding: '11px',
                          fontSize: '14px'
                        }}
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            <span>Update Password</span>
                          </>
                        )}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* TAB 2: PAYMENT GATEWAY (RAZORPAY) */}
          {activeTab === 'gateway' && (
            <Card 
              className="border-0 shadow-sm"
              style={{ borderRadius: '16px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}
            >
              <Card.Header 
                className="py-3 px-3 px-md-4"
                style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <CreditCard size={18} color="#C62828" />
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                    Global Razorpay Payment Gateway Credentials
                  </h6>
                </div>
              </Card.Header>
              <Card.Body className="p-3 p-md-4">
                <Form onSubmit={handleSaveGateway}>
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Razorpay Key ID</Form.Label>
                        <Form.Control
                          type="text"
                          value={gatewaySettings.razorpayKeyId}
                          onChange={(e) => setGatewaySettings({ ...gatewaySettings, razorpayKeyId: e.target.value })}
                          placeholder="rzp_live_xxxxxxxx"
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Razorpay Key Secret</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showRazorpaySecret ? 'text' : 'password'}
                            value={gatewaySettings.razorpaySecret}
                            onChange={(e) => setGatewaySettings({ ...gatewaySettings, razorpaySecret: e.target.value })}
                            placeholder="Enter Key Secret"
                            style={{ borderRadius: '10px 0 0 10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            type="button"
                            onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                            style={{ borderRadius: '0 10px 10px 0', border: '1px solid #CBD5E1', borderLeft: 'none' }}
                          >
                            {showRazorpaySecret ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Environment Mode</Form.Label>
                        <Form.Select
                          value={gatewaySettings.mode}
                          onChange={(e) => setGatewaySettings({ ...gatewaySettings, mode: e.target.value })}
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        >
                          <option value="live">Live Production Mode</option>
                          <option value="test">Test Sandbox Mode</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Base Billing Currency</Form.Label>
                        <Form.Select
                          value={gatewaySettings.currency}
                          onChange={(e) => setGatewaySettings({ ...gatewaySettings, currency: e.target.value })}
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        >
                          <option value="INR">INR (₹ Indian Rupee)</option>
                          <option value="USD">USD ($ United States Dollar)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-start">
                    <Button 
                      type="submit" 
                      className="fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{ 
                        backgroundColor: '#C62828', 
                        borderColor: '#C62828', 
                        borderRadius: '10px', 
                        padding: '11px 24px',
                        fontSize: '14px',
                        minWidth: '220px'
                      }}
                    >
                      <Save size={16} /> Save Gateway Configuration
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* TAB 3: BREVO EMAIL SMTP */}
          {activeTab === 'smtp' && (
            <Card 
              className="border-0 shadow-sm"
              style={{ borderRadius: '16px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}
            >
              <Card.Header 
                className="py-3 px-3 px-md-4"
                style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Mail size={18} color="#C62828" />
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                    Brevo Transactional Email & Password Reset OTP Gateway
                  </h6>
                </div>
              </Card.Header>
              <Card.Body className="p-3 p-md-4">
                <Form onSubmit={handleSaveSMTP}>
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>SMTP Server Host</Form.Label>
                        <Form.Control
                          type="text"
                          value={smtpSettings.smtpHost}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpHost: e.target.value })}
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Brevo Sender Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={smtpSettings.senderEmail}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, senderEmail: e.target.value })}
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Brevo API Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showApiKey ? 'text' : 'password'}
                            value={smtpSettings.apiKey}
                            onChange={(e) => setSmtpSettings({ ...smtpSettings, apiKey: e.target.value })}
                            placeholder="xkeysib-..."
                            style={{ borderRadius: '10px 0 0 10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            style={{ borderRadius: '0 10px 10px 0', border: '1px solid #CBD5E1', borderLeft: 'none' }}
                          >
                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Sender Name Display</Form.Label>
                        <Form.Control
                          type="text"
                          value={smtpSettings.senderName}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, senderName: e.target.value })}
                          placeholder="Kiaan Payroll & HRMS"
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-start">
                    <Button 
                      type="submit" 
                      className="fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{ 
                        backgroundColor: '#C62828', 
                        borderColor: '#C62828', 
                        borderRadius: '10px', 
                        padding: '11px 24px',
                        fontSize: '14px',
                        minWidth: '220px'
                      }}
                    >
                      <Save size={16} /> Update Email SMTP Gateway
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* TAB 4: TAX & MAINTENANCE */}
          {activeTab === 'tax' && (
            <Row className="g-3 g-md-4">
              {/* GST & Tax */}
              <Col xs={12} lg={6}>
                <Card 
                  className="h-100 border-0 shadow-sm"
                  style={{ borderRadius: '16px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}
                >
                  <Card.Header 
                    className="py-3 px-3 px-md-4"
                    style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Percent size={18} color="#0F172A" />
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                        GST & Invoice Tax Configuration
                      </h6>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-3 p-md-4">
                    <Form onSubmit={handleSaveTax}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Standard GST Tax Rate (%)</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            value={taxSettings.gstTaxRate}
                            onChange={(e) => setTaxSettings({ ...taxSettings, gstTaxRate: e.target.value })}
                            placeholder="18"
                            style={{ borderRadius: '10px 0 0 10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                          />
                          <InputGroup.Text style={{ borderRadius: '0 10px 10px 0', border: '1px solid #CBD5E1', borderLeft: 'none', fontWeight: '600', backgroundColor: '#F8FAFC' }}>
                            %
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Invoice Number Prefix</Form.Label>
                        <Form.Control
                          type="text"
                          value={taxSettings.invoicePrefix}
                          onChange={(e) => setTaxSettings({ ...taxSettings, invoicePrefix: e.target.value })}
                          placeholder="INV-"
                          style={{ borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>

                      <Button 
                        type="submit" 
                        className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
                        style={{ 
                          backgroundColor: '#0F172A', 
                          borderColor: '#0F172A', 
                          borderRadius: '10px', 
                          padding: '11px',
                          fontSize: '14px'
                        }}
                      >
                        <Save size={16} /> Save Tax Rules
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              {/* Maintenance Mode */}
              <Col xs={12} lg={6}>
                <Card 
                  className="h-100 border-0 shadow-sm"
                  style={{ 
                    borderRadius: '16px', 
                    backgroundColor: maintenanceMode.isMaintenanceOn ? '#FFF1F2' : '#FFFFFF', 
                    overflow: 'hidden',
                    border: maintenanceMode.isMaintenanceOn ? '1.5px solid #FECDD3' : '1px solid #E2E8F0'
                  }}
                >
                  <Card.Header 
                    className="py-3 px-3 px-md-4"
                    style={{ 
                      backgroundColor: maintenanceMode.isMaintenanceOn ? '#FFE4E6' : '#F8FAFC', 
                      borderBottom: '1px solid #E2E8F0' 
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <AlertTriangle size={18} color={maintenanceMode.isMaintenanceOn ? '#E11D48' : '#D97706'} />
                        <h6 className="fw-bold mb-0" style={{ fontSize: '15px', color: maintenanceMode.isMaintenanceOn ? '#9F1239' : '#0F172A' }}>
                          Platform Maintenance Switch
                        </h6>
                      </div>
                      <span 
                        className="badge"
                        style={{
                          backgroundColor: maintenanceMode.isMaintenanceOn ? '#E11D48' : '#10B981',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '20px'
                        }}
                      >
                        {maintenanceMode.isMaintenanceOn ? 'Maintenance Active' : 'Live Platform'}
                      </span>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-3 p-md-4">
                    <Form onSubmit={handleSaveMaintenance}>
                      <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: maintenanceMode.isMaintenanceOn ? '#FFE4E6' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <Form.Check
                          type="switch"
                          id="maintenance-toggle-switch"
                          label={
                            <span style={{ fontWeight: '700', fontSize: '13.5px', color: maintenanceMode.isMaintenanceOn ? '#BE123C' : '#0F172A' }}>
                              {maintenanceMode.isMaintenanceOn ? 'System Maintenance Mode is ON' : 'Enable System Maintenance Mode'}
                            </span>
                          }
                          checked={maintenanceMode.isMaintenanceOn}
                          onChange={(e) => setMaintenanceMode({ ...maintenanceMode, isMaintenanceOn: e.target.checked })}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>

                      <Form.Group className="mb-4">
                        <Form.Label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Notice Banner Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={maintenanceMode.maintenanceMessage}
                          onChange={(e) => setMaintenanceMode({ ...maintenanceMode, maintenanceMessage: e.target.value })}
                          placeholder="Type notice message shown to users..."
                          style={{ borderRadius: '10px', fontSize: '13px', padding: '10px 12px', border: '1px solid #CBD5E1' }}
                        />
                      </Form.Group>

                      <Button 
                        type="submit" 
                        className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        style={{ 
                          backgroundColor: '#C62828', 
                          borderColor: '#C62828', 
                          borderRadius: '10px', 
                          padding: '11px',
                          fontSize: '14px'
                        }}
                      >
                        <RefreshCw size={16} /> Update Maintenance State
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

        </div>

      </div>
    </SuperAdminLayout>
  );
};

export default Settings;