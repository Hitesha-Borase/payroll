import React, { useState } from 'react';
import { Modal, Button, Badge, Tab, Nav } from 'react-bootstrap';
import { BookOpen, Code, Terminal, Key, Cpu, Zap, Copy, Check } from 'lucide-react';

const DocumentationModal = ({ show, onHide }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X GET "https://api.kiaantechnology.com/v1/hrm/attendance" \\
  -H "Authorization: Bearer kt_live_secret_key_987654321" \\
  -H "Content-Type: application/json"`;

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

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '1.2rem' }}>
          <BookOpen size={24} className="text-warning" />
          Kiaan Technology – Payroll & HRMS Developer API Documentation
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ backgroundColor: '#0F172A', color: '#CBD5E1', fontSize: '0.9rem', maxHeight: '70vh', overflowY: 'auto' }} className="p-4">
        <Tab.Container defaultActiveKey="auth">
          <Nav variant="pills" className="mb-4 gap-2 border-bottom pb-3">
            <Nav.Item>
              <Nav.Link eventKey="auth" className="d-flex align-items-center gap-2" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                <Key size={16} /> API Keys & Auth
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="attendance" className="d-flex align-items-center gap-2" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                <Cpu size={16} /> Biometric Sync API
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="webhooks" className="d-flex align-items-center gap-2" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                <Zap size={16} /> Webhook Events
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* AUTH TAB */}
            <Tab.Pane eventKey="auth">
              <h6 className="fw-bold text-white mb-2">1. Authentication & API Key Structure</h6>
              <p className="text-slate-300">
                All requests to the Kiaan Technology REST API require Bearer Token authorization. API keys can be managed in the Super Admin or HR Admin settings panel.
              </p>
              
              <div className="position-relative bg-slate-900 rounded p-3 my-3" style={{ backgroundColor: '#020617', border: '1px solid #1E293B', fontFamily: 'monospace' }}>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="position-absolute top-0 end-0 m-2 text-warning border-0"
                  onClick={() => handleCopyCode(curlExample)}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
                <pre className="mb-0 text-amber-400" style={{ fontSize: '0.85rem' }}>
                  {curlExample}
                </pre>
              </div>
            </Tab.Pane>

            {/* ATTENDANCE TAB */}
            <Tab.Pane eventKey="attendance">
              <h6 className="fw-bold text-white mb-2">2. Biometric Attendance Punch Sync API</h6>
              <p className="text-slate-300">
                Integrate external biometric hardware or facial recognition scanners directly into Kiaan Payroll using the punch-sync endpoint:
              </p>
              <Badge bg="success" className="me-2 mb-2">POST</Badge>
              <code>/api/v1/hrm/attendance/sync</code>
              
              <div className="bg-slate-900 rounded p-3 my-3" style={{ backgroundColor: '#020617', border: '1px solid #1E293B', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <div className="text-emerald-400">// Request Payload</div>
                {`{
  "employeeId": "EMP-1092",
  "punchTime": "2026-09-19T09:30:00Z",
  "punchType": "CHECK_IN",
  "deviceId": "BIO-DEVICE-Indore-01"
}`}
              </div>
            </Tab.Pane>

            {/* WEBHOOKS TAB */}
            <Tab.Pane eventKey="webhooks">
              <h6 className="fw-bold text-white mb-2">3. Webhook Real-time Events</h6>
              <p className="text-slate-300">
                Configure HTTP webhooks to receive instant JSON notifications whenever salary disbursements, employee registrations, or billing transactions complete:
              </p>

              <div className="bg-slate-900 rounded p-3 my-3" style={{ backgroundColor: '#020617', border: '1px solid #1E293B', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <pre className="mb-0 text-sky-400">
                  {webhookExample}
                </pre>
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>

      <Modal.Footer style={{ backgroundColor: '#0F172A', borderTop: '1px solid #1E293B' }}>
        <Button variant="warning" onClick={onHide} className="fw-semibold px-4">
          Close Documentation
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentationModal;
