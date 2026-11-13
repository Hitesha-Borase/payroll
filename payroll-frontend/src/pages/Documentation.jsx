import React, { useState } from 'react';
import { Container, Card, Badge, Nav, Tab, Button } from 'react-bootstrap';
import Navbar from '../Layout/Navbar';
import WhatsAppWidget from '../components/WhatsAppWidget';
import { BookOpen, ArrowLeft, Key, Cpu, Zap, Copy, Check, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Documentation = () => {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState(null);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleCopyCode = (key, code) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlAuthExample = `curl -X GET "http://localhost:5000/api/public/privacy-policy" \\
  -H "Accept: application/json"`;

  const curlAttendanceExample = `curl -X POST "http://localhost:5000/api/employee/check-in" \\
  -H "Authorization: Bearer <YOUR_AUTH_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "location": { "lat": 22.7196, "lng": 75.8577 },
    "deviceId": "DEVICE_BIO_01",
    "timestamp": "2026-09-29T09:30:00Z"
  }'`;

  const webhookExample = `{
  "event": "payroll.disbursed",
  "timestamp": 1786010400,
  "data": {
    "companyId": 102,
    "payrollMonth": "2026-09",
    "totalEmployees": 145,
    "totalDisbursedAmount": 1450000.00,
    "status": "SUCCESS"
  }
}`;

  const salaryCalcExample = `// Sample Payroll Calculation Schema
{
  "basicSalary": 50000,
  "hra": 20000,
  "specialAllowance": 15000,
  "deductions": {
    "providentFund": 1800,
    "professionalTax": 200,
    "tdsTax": 4500
  },
  "netPayable": 78500
}`;

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B', paddingBottom: '60px' }}>
      <Navbar />
      <Container className="pb-5" style={{ maxWidth: '1100px', paddingTop: '95px' }}>
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

        {/* Main Documentation Card */}
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
                <BookOpen size={32} style={{ color: '#C62828' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
                  Developer Documentation & API
                </h1>
                <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>
                  Kiaan Technology – Workforce, HRMS & Payroll REST API Specifications
                </p>
              </div>
            </div>

            <Badge bg="warning" text="dark" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px', fontWeight: '700' }}>
              API Version: v1.0 Live
            </Badge>
          </div>

          {/* Tabbed Content */}
          <Tab.Container defaultActiveKey="auth">
            <Nav variant="pills" className="mb-4 gap-2 border-bottom pb-3">
              <Nav.Item>
                <Nav.Link eventKey="auth" className="d-flex align-items-center gap-2 fw-semibold" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                  <Key size={16} /> API Authentication
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="attendance" className="d-flex align-items-center gap-2 fw-semibold" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                  <Cpu size={16} /> Attendance & Biometrics
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="payroll" className="d-flex align-items-center gap-2 fw-semibold" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                  <Server size={16} /> Payroll & Calculations
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="webhooks" className="d-flex align-items-center gap-2 fw-semibold" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                  <Zap size={16} /> Webhook Events
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* AUTH TAB */}
              <Tab.Pane eventKey="auth">
                <div style={{ lineHeight: '1.8', fontSize: '15px', color: '#334155' }}>
                  <h4 style={{ color: '#0F172A', fontWeight: '700' }}>1. JWT Bearer Token Authentication</h4>
                  <p>
                    All protected endpoints on the Kiaan Technology platform require a JSON Web Token (JWT) provided in the HTTP <code>Authorization</code> header:
                  </p>
                  
                  <div className="position-relative rounded p-3 my-3" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', fontFamily: 'monospace' }}>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-2 text-warning border-0"
                      onClick={() => handleCopyCode('auth', curlAuthExample)}
                    >
                      {copiedKey === 'auth' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                    <pre className="mb-0 text-warning" style={{ fontSize: '0.85rem' }}>
                      {curlAuthExample}
                    </pre>
                  </div>

                  <h5 style={{ color: '#0F172A', fontWeight: '700', marginTop: '24px' }}>Base URLs</h5>
                  <ul>
                    <li><strong>Production API:</strong> <code>https://api.kiaantechnology.com/api</code></li>
                    <li><strong>Local / Staging API:</strong> <code>http://localhost:5000/api</code></li>
                  </ul>
                </div>
              </Tab.Pane>

              {/* ATTENDANCE TAB */}
              <Tab.Pane eventKey="attendance">
                <div style={{ lineHeight: '1.8', fontSize: '15px', color: '#334155' }}>
                  <h4 style={{ color: '#0F172A', fontWeight: '700' }}>2. Employee Attendance & Geo-fenced Punch</h4>
                  <p>
                    Submit punch-in and punch-out events with GPS coordinates or biometric device ID tokens:
                  </p>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="primary">POST</Badge>
                    <code>/api/employee/check-in</code>
                  </div>
                  
                  <div className="position-relative rounded p-3 my-3" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', fontFamily: 'monospace' }}>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-2 text-warning border-0"
                      onClick={() => handleCopyCode('att', curlAttendanceExample)}
                    >
                      {copiedKey === 'att' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                    <pre className="mb-0 text-success" style={{ fontSize: '0.85rem' }}>
                      {curlAttendanceExample}
                    </pre>
                  </div>
                </div>
              </Tab.Pane>

              {/* PAYROLL TAB */}
              <Tab.Pane eventKey="payroll">
                <div style={{ lineHeight: '1.8', fontSize: '15px', color: '#334155' }}>
                  <h4 style={{ color: '#0F172A', fontWeight: '700' }}>3. Salary Structures & Statutory Compliance</h4>
                  <p>
                    Automatic calculation engine supporting Indian statutory compliance (Provident Fund, ESIC, Professional Tax, TDS) alongside custom organization earnings:
                  </p>
                  
                  <div className="position-relative rounded p-3 my-3" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', fontFamily: 'monospace' }}>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-2 text-warning border-0"
                      onClick={() => handleCopyCode('sal', salaryCalcExample)}
                    >
                      {copiedKey === 'sal' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                    <pre className="mb-0 text-info" style={{ fontSize: '0.85rem' }}>
                      {salaryCalcExample}
                    </pre>
                  </div>
                </div>
              </Tab.Pane>

              {/* WEBHOOKS TAB */}
              <Tab.Pane eventKey="webhooks">
                <div style={{ lineHeight: '1.8', fontSize: '15px', color: '#334155' }}>
                  <h4 style={{ color: '#0F172A', fontWeight: '700' }}>4. Webhook Real-Time Event Stream</h4>
                  <p>
                    Configure HTTP endpoints in SuperAdmin settings to receive automated JSON notifications on payroll releases and employee onboarding:
                  </p>

                  <div className="position-relative rounded p-3 my-3" style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', fontFamily: 'monospace' }}>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-2 text-warning border-0"
                      onClick={() => handleCopyCode('wh', webhookExample)}
                    >
                      {copiedKey === 'wh' ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                    <pre className="mb-0 text-warning" style={{ fontSize: '0.85rem' }}>
                      {webhookExample}
                    </pre>
                  </div>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card>
      </Container>
      <WhatsAppWidget />
    </div>
  );
};

export default Documentation;
