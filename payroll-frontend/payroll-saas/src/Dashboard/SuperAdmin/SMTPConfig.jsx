import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import {
  Mail,
  Save,
  Eye,
  EyeOff,
  Server,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Settings as SettingsIcon,
  Key,
  User,
  Shield,
  Zap
} from 'lucide-react';
import { superadminAPI } from '../../services/api';
import SuperAdminLayout from './SuperAdminLayout';

const SMTPConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [config, setConfig] = useState({
    brevoApiKey: '',
    senderName: '',
    senderEmail: '',
    supportEmail: '',
    smtpHost: '',
    smtpPort: '',
    smtpEncryption: '',
    serviceProvider: '',
    apiEndpoint: '',
    brevoApiKeySet: false,
  });

  const [testEmail, setTestEmail] = useState('');
  const [lastTestResult, setLastTestResult] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await superadminAPI.getSMTPConfig();
      if (res?.data?.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load SMTP configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!config.senderEmail) {
      toast.error('Sender email is required.');
      return;
    }
    try {
      setSaving(true);
      const res = await superadminAPI.updateSMTPConfig({
        brevoApiKey: config.brevoApiKey,
        senderName: config.senderName,
        senderEmail: config.senderEmail,
        supportEmail: config.supportEmail,
      });
      if (res?.data?.success) {
        toast.success(res.data.message || 'SMTP configuration saved successfully.');
        fetchConfig();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      toast.error('Please enter a recipient email address for the test.');
      return;
    }
    try {
      setTesting(true);
      setLastTestResult(null);
      const res = await superadminAPI.testSMTPConfig({ testEmail });
      if (res?.data?.success) {
        setLastTestResult({ success: true, message: res.data.message });
        toast.success(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send test email.';
      setLastTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const infoRowStyle = {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '10px',
  };

  const labelStyle = { fontSize: '12.5px', fontWeight: '600', color: '#334155' };
  const inputStyle = { borderRadius: '10px', fontSize: '14px', padding: '10px 12px', border: '1px solid #CBD5E1' };

  if (loading) {
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
      <div className="w-100" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

        {/* Page Header */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              backgroundColor: 'rgba(198, 40, 40, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Mail size={20} color="#C62828" />
            </div>
            <h1 className="fw-bold mb-0 text-dark"
              style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.55rem)', letterSpacing: '-0.3px' }}>
              SMTP &amp; Email Gateway Configuration
            </h1>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.82rem, 2vw, 0.9rem)', lineHeight: '1.5' }}>
            Manage Brevo (Sendinblue) transactional email API settings for OTP delivery, ticket alerts, and system notifications.
          </p>
        </div>

        <Row className="g-3 g-md-4">

          {/* LEFT: Configuration Form */}
          <Col xs={12} lg={7}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <Card.Header className="py-3 px-3 px-md-4"
                style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <SettingsIcon size={18} color="#C62828" />
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                      Brevo Email Gateway Settings
                    </h6>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700',
                    backgroundColor: config.brevoApiKeySet ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: config.brevoApiKeySet ? '#059669' : '#DC2626',
                    border: `1px solid ${config.brevoApiKeySet ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                    {config.brevoApiKeySet
                      ? <><CheckCircle size={12} /> API Key Configured</>
                      : <><AlertCircle size={12} /> API Key Not Set</>}
                  </span>
                </div>
              </Card.Header>

              <Card.Body className="p-3 p-md-4">
                <Form onSubmit={handleSave}>

                  {/* Brevo API Key */}
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>
                      <Key size={13} className="me-1" />Brevo API Key
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showApiKey ? 'text' : 'password'}
                        value={config.brevoApiKey}
                        onChange={(e) => setConfig({ ...config, brevoApiKey: e.target.value })}
                        placeholder={config.brevoApiKeySet ? 'Leave blank to keep current key' : 'xkeysib-...'}
                        style={{ ...inputStyle, borderRadius: '10px 0 0 10px' }}
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
                    <Form.Text className="text-muted" style={{ fontSize: '11.5px' }}>
                      {config.brevoApiKeySet
                        ? 'A key is already configured. Enter a new key only if you want to replace it.'
                        : 'Enter your Brevo API key from the Brevo dashboard (SMTP &amp; API section).'}
                    </Form.Text>
                  </Form.Group>

                  {/* Sender Name */}
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>
                      <User size={13} className="me-1" />Sender Display Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={config.senderName}
                      onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                      placeholder="Kiaan Technology Pvt Ltd"
                      style={inputStyle}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '11.5px' }}>
                      This name appears as the "From" name in all outgoing emails.
                    </Form.Text>
                  </Form.Group>

                  {/* Sender Email */}
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>
                      <Mail size={13} className="me-1" />Sender Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={config.senderEmail}
                      onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                      placeholder="info@kiaantechnology.com"
                      style={inputStyle}
                      required
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '11.5px' }}>
                      Must be a verified sender email in your Brevo account.
                    </Form.Text>
                  </Form.Group>

                  {/* Support Email */}
                  <Form.Group className="mb-4">
                    <Form.Label style={labelStyle}>
                      <Shield size={13} className="me-1" />Support Notification Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={config.supportEmail}
                      onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                      placeholder="support@kiaantechnology.com"
                      style={inputStyle}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '11.5px' }}>
                      Receives copies of support ticket notifications and system alerts.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{
                        backgroundColor: '#C62828',
                        borderColor: '#C62828',
                        borderRadius: '10px',
                        padding: '11px 24px',
                        fontSize: '14px',
                        minWidth: '200px'
                      }}
                    >
                      {saving
                        ? <><Spinner size="sm" animation="border" /> Saving...</>
                        : <><Save size={16} /> Save Configuration</>}
                    </Button>

                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={fetchConfig}
                      disabled={loading}
                      title="Reload current configuration from server"
                      style={{ borderRadius: '10px', padding: '11px 14px', border: '1px solid #CBD5E1' }}
                    >
                      <RefreshCw size={16} />
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT: System Info + Test Email */}
          <Col xs={12} lg={5}>

            {/* Connection Info */}
            <Card className="border-0 shadow-sm mb-3 mb-md-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <Card.Header className="py-3 px-3 px-md-4"
                style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <div className="d-flex align-items-center gap-2">
                  <Server size={18} color="#0F172A" />
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                    Email Service Details
                  </h6>
                </div>
              </Card.Header>

              <Card.Body className="p-3 p-md-4">
                {[
                  { label: 'Service Provider', value: config.serviceProvider || 'Brevo (Sendinblue)', icon: Zap },
                  { label: 'SMTP Host', value: config.smtpHost || 'smtp-relay.brevo.com', icon: Server },
                  { label: 'SMTP Port', value: config.smtpPort || '587', icon: Info },
                  { label: 'Encryption', value: config.smtpEncryption || 'TLS / STARTTLS', icon: Shield },
                  { label: 'API Endpoint', value: config.apiEndpoint || 'https://api.brevo.com/v3/smtp/email', icon: Key, small: true },
                ].map(({ label, value, icon: Icon, small }) => (
                  <div key={label} style={infoRowStyle}>
                    <div className="d-flex align-items-start gap-2">
                      <Icon size={14} color="#94A3B8" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: small ? '11.5px' : '13.5px', fontWeight: '700', color: '#0F172A', wordBreak: 'break-all', marginTop: '2px' }}>{value}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{
                  backgroundColor: 'rgba(198,40,40,0.06)',
                  border: '1px solid rgba(198,40,40,0.2)',
                  borderRadius: '10px',
                  padding: '10px 13px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Info size={13} color="#C62828" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: '#9B1C1C', fontWeight: '600' }}>
                    Server details are defined by Brevo and cannot be changed.
                  </span>
                </div>
              </Card.Body>
            </Card>

            {/* Test Email */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <Card.Header className="py-3 px-3 px-md-4"
                style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <div className="d-flex align-items-center gap-2">
                  <Send size={18} color="#0F172A" />
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>
                    Send Test Email
                  </h6>
                </div>
              </Card.Header>

              <Card.Body className="p-3 p-md-4">
                <Form onSubmit={handleTestEmail}>
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>Recipient Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={inputStyle}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '11.5px' }}>
                      A verification email will be sent to confirm SMTP is working.
                    </Form.Text>
                  </Form.Group>

                  {lastTestResult && (
                    <div style={{
                      padding: '11px 13px', borderRadius: '10px', marginBottom: '14px',
                      backgroundColor: lastTestResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${lastTestResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      display: 'flex', alignItems: 'flex-start', gap: '8px'
                    }}>
                      {lastTestResult.success
                        ? <CheckCircle size={15} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
                        : <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />}
                      <span style={{
                        fontSize: '12.5px', fontWeight: '600',
                        color: lastTestResult.success ? '#065F46' : '#991B1B'
                      }}>
                        {lastTestResult.message}
                      </span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={testing || !config.brevoApiKeySet}
                    className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    style={{
                      backgroundColor: '#0F172A',
                      borderColor: '#0F172A',
                      borderRadius: '10px',
                      padding: '11px',
                      fontSize: '14px',
                      opacity: !config.brevoApiKeySet ? 0.55 : 1,
                    }}
                  >
                    {testing
                      ? <><Spinner size="sm" animation="border" /> Sending...</>
                      : <><Send size={16} /> Send Test Email</>}
                  </Button>

                  {!config.brevoApiKeySet && (
                    <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: '11.5px' }}>
                      Save a valid Brevo API key to enable test emails.
                    </p>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </SuperAdminLayout>
  );
};

export default SMTPConfig;
