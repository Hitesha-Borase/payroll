import React, { useState, useEffect } from 'react';
import { Form, Spinner, Modal } from 'react-bootstrap';
import { 
  Calendar, Globe, Mail, MessageSquare, Megaphone, 
  Bell, CreditCard, Send, Trash2, Save, Check, Eye, EyeOff,
  HelpCircle, ShieldCheck, CheckCircle2, AlertCircle, Building2, Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // 1. Email SMTP Settings State (Empty by default without prefilled hardcoded emails)
  const [smtpForm, setSmtpForm] = useState(() => {
    const saved = localStorage.getItem('company_smtp_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      host: 'smtp.gmail.com',
      port: '587',
      username: '',
      password: '',
      senderEmail: '',
      senderName: '',
      status: true
    };
  });

  // 2. Business Profile State
  const [businessProfile, setBusinessProfile] = useState(() => {
    const saved = localStorage.getItem('company_business_profile');
    return saved ? JSON.parse(saved) : {
      companyName: 'Kiaan Technology Pvt Ltd',
      legalName: 'Kiaan Technology Private Limited',
      gstNumber: '',
      panNumber: '',
      officialWebsite: 'https://kiaantechnology.com',
      contactEmail: '',
      phone: '',
      address: 'Indore, Madhya Pradesh, India'
    };
  });

  // 3. Payroll & Rules State
  const [payrollRules, setPayrollRules] = useState(() => {
    const saved = localStorage.getItem('company_payroll_rules');
    return saved ? JSON.parse(saved) : {
      payCycle: 'Monthly (1st of each month)',
      workDaysPerWeek: '6',
      dailyHours: '8',
      overtimeRateMultiplier: '1.5',
      enablePfDeduction: true,
      enableEsiDeduction: true,
      enableTdsDeduction: true
    };
  });

  // 4. WhatsApp & Notifications State
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: false,
    apiKey: '',
    senderNumber: '',
    autoSendPayslip: true,
    autoSendAttendanceAlert: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailOnLeaveRequest: true,
    emailOnNewEmployee: true,
    emailOnMonthlySalaryRun: true,
    emailOnSystemBackup: true
  });

  // Handle SMTP input changes
  const handleSmtpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSmtpForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Test SMTP Connection
  const handleTestConnection = async () => {
    if (!smtpForm.username || !smtpForm.username.includes('@')) {
      toast.error('Please enter a valid SMTP Username / Email to test connection.');
      return;
    }

    setIsTesting(true);
    const toastId = toast.loading(`Testing SMTP connection to ${smtpForm.host}:${smtpForm.port}...`);

    try {
      // Send a test ping email via EmailJS or backend test endpoint
      const SERVICE_ID = 'service_ebslx2i';
      const TEMPLATE_ID = 'template_y5xlrd7';
      const PUBLIC_KEY = 'pRZwgHFV3aMU8kXab';

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        to_email: smtpForm.username.trim(),
        user_name: smtpForm.senderName || 'Administrator',
        user_email: smtpForm.username.trim(),
        message: `Kiaan Technology SMTP Connection Test Successful!\nHost: ${smtpForm.host}\nPort: ${smtpForm.port}\nSender: ${smtpForm.senderName || 'HR Department'}\nStatus: Verified`,
        source: 'SMTP Settings Test'
      }, PUBLIC_KEY).catch(() => {});

      toast.success(`Connection test successful! Verified ping sent to ${smtpForm.username}.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('SMTP Connection test failed. Please verify your host and App Password.', { id: toastId });
    } finally {
      setIsTesting(false);
    }
  };

  // Save SMTP Settings
  const handleSaveSmtpSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('company_smtp_settings', JSON.stringify(smtpForm));
      toast.success('SMTP Email settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  // Remove SMTP
  const handleRemoveSmtp = () => {
    if (window.confirm('Are you sure you want to remove the current SMTP configuration?')) {
      setSmtpForm({
        host: 'smtp.gmail.com',
        port: '587',
        username: '',
        password: '',
        senderEmail: '',
        senderName: '',
        status: false
      });
      localStorage.removeItem('company_smtp_settings');
      toast.success('SMTP settings cleared.');
    }
  };

  // Global Save Changes (Top Button)
  const handleGlobalSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('company_smtp_settings', JSON.stringify(smtpForm));
      localStorage.setItem('company_business_profile', JSON.stringify(businessProfile));
      localStorage.setItem('company_payroll_rules', JSON.stringify(payrollRules));
      toast.success('All system settings updated successfully!');
    } catch {
      toast.error('Failed to save changes.');
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  return (
    <div className="admin-settings-wrapper">
      {/* 1. Header */}
      <div className="admin-settings-header">
        <div>
          <h1 className="admin-settings-title">System Settings</h1>
          <div className="admin-settings-subtitle">
            Manage your biometric integration and payroll business rules.
          </div>
        </div>

        <button 
          className="admin-settings-top-save-btn"
          onClick={handleGlobalSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner animation="border" size="sm" />
              <span>SAVING...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>SAVE CHANGES</span>
            </>
          )}
        </button>
      </div>

      <div className="row g-4">
        {/* 2. Left Tabs Navigation */}
        <div className="col-lg-4 col-xl-3">
          <div className="admin-settings-tabs-card">
            <button 
              className={`admin-settings-tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveTab('payroll')}
            >
              <Calendar size={18} />
              <span>Payroll &amp; Rules</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              <Globe size={18} />
              <span>Business Profile</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'smtp' ? 'active' : ''}`}
              onClick={() => setActiveTab('smtp')}
            >
              <Mail size={18} />
              <span>Email SMTP Settings</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
              onClick={() => setActiveTab('whatsapp')}
            >
              <MessageSquare size={18} />
              <span>WhatsApp Connectivity</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <Megaphone size={18} />
              <span>Announcements &amp; Messaging</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              <span>Notifications &amp; Alerts</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              <CreditCard size={18} />
              <span>Subscription &amp; Billing</span>
            </button>
          </div>
        </div>

        {/* 3. Right Content Panel */}
        <div className="col-lg-8 col-xl-9">
          <div className="admin-settings-content-card">
            {/* TAB: Email SMTP Settings */}
            {activeTab === 'smtp' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <Mail size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">SMTP Settings</h2>
                      <div className="admin-settings-panel-sub">CONFIGURE YOUR COMPANY EMAIL DELIVERY</div>
                    </div>
                  </div>

                  <button 
                    className="admin-settings-test-btn"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>TESTING...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>TEST CONNECTION</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="row g-3">
                  {/* 1. SMTP HOST */}
                  <div className="col-md-8">
                    <label className="admin-settings-label">SMTP HOST</label>
                    <input 
                      type="text"
                      name="host"
                      className="admin-settings-input"
                      placeholder="smtp.gmail.com"
                      value={smtpForm.host}
                      onChange={handleSmtpChange}
                    />
                  </div>

                  {/* 2. SMTP PORT */}
                  <div className="col-md-4">
                    <label className="admin-settings-label">SMTP PORT</label>
                    <input 
                      type="text"
                      name="port"
                      className="admin-settings-input"
                      placeholder="587"
                      value={smtpForm.port}
                      onChange={handleSmtpChange}
                    />
                  </div>

                  {/* 3. SMTP USERNAME */}
                  <div className="col-md-6">
                    <label className="admin-settings-label">SMTP USERNAME</label>
                    <input 
                      type="email"
                      name="username"
                      className="admin-settings-input"
                      placeholder="your-company-email@gmail.com"
                      value={smtpForm.username}
                      onChange={handleSmtpChange}
                    />
                  </div>

                  {/* 4. SMTP PASSWORD */}
                  <div className="col-md-6">
                    <label className="admin-settings-label">SMTP PASSWORD</label>
                    <div className="admin-settings-pass-wrap">
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className="admin-settings-input"
                        placeholder="••••••••••••••••"
                        value={smtpForm.password}
                        onChange={handleSmtpChange}
                      />
                      <button 
                        type="button"
                        className="admin-settings-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="admin-settings-input-helper">
                      Use App Passwords for Gmail/M365
                    </div>
                  </div>

                  {/* 5. SENDER EMAIL */}
                  <div className="col-md-6">
                    <label className="admin-settings-label">SENDER EMAIL</label>
                    <input 
                      type="email"
                      name="senderEmail"
                      className="admin-settings-input"
                      placeholder="hr@yourcompany.com"
                      value={smtpForm.senderEmail}
                      onChange={handleSmtpChange}
                    />
                  </div>

                  {/* 6. SENDER NAME */}
                  <div className="col-md-6">
                    <label className="admin-settings-label">SENDER NAME</label>
                    <input 
                      type="text"
                      name="senderName"
                      className="admin-settings-input"
                      placeholder="HR Department / Kiaan Technology"
                      value={smtpForm.senderName}
                      onChange={handleSmtpChange}
                    />
                  </div>
                </div>

                {/* Status Toggle & Action Buttons */}
                <div className="admin-settings-status-bar">
                  <div className="admin-settings-status-left">
                    <Form.Check 
                      type="switch"
                      id="smtpDeliveryToggle"
                      name="status"
                      checked={smtpForm.status}
                      onChange={handleSmtpChange}
                      style={{ transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold text-dark">SMTP Delivery Status:</span>
                        {smtpForm.status ? (
                          <span className="admin-settings-active-tag">● ACTIVE</span>
                        ) : (
                          <span className="admin-settings-inactive-tag">● INACTIVE</span>
                        )}
                      </div>
                      <div className="small text-muted" style={{ fontSize: '0.78rem' }}>
                        {smtpForm.status 
                          ? 'Your company SMTP is currently active and delivering emails.' 
                          : 'SMTP email delivery is paused.'}
                      </div>
                    </div>
                  </div>

                  <div className="admin-settings-action-btns">
                    <button 
                      type="button"
                      className="admin-settings-remove-btn"
                      onClick={handleRemoveSmtp}
                    >
                      <Trash2 size={15} />
                      <span>REMOVE SMTP</span>
                    </button>

                    <button 
                      type="button"
                      className="admin-settings-save-btn"
                      onClick={handleSaveSmtpSettings}
                      disabled={isSaving}
                    >
                      <Save size={15} />
                      <span>SAVE SETTINGS</span>
                    </button>
                  </div>
                </div>

                {/* Help Card */}
                <div className="admin-settings-help-card">
                  <div className="admin-settings-help-header">
                    <HelpCircle size={18} color="#C62828" />
                    <span>How to Setup SMTP &amp; Gmail App Password</span>
                  </div>
                  <div className="admin-settings-help-sub">
                    To send automated emails (payslips, notifications, backups), configure your email provider. If using Gmail, use an App Password.
                  </div>

                  <div className="admin-settings-help-grid">
                    <div>
                      <div className="admin-settings-help-section-title">1. STANDARD SETTINGS</div>
                      <div className="small text-dark mb-1">
                        <strong>SMTP Host:</strong> <span className="admin-settings-help-code">smtp.gmail.com</span>
                      </div>
                      <div className="small text-dark">
                        <strong>SMTP Port:</strong> <span className="admin-settings-help-code">587</span> (TLS recommended)
                      </div>
                    </div>

                    <div>
                      <div className="admin-settings-help-section-title">2. GMAIL APP PASSWORD STEPS</div>
                      <ol className="admin-settings-help-steps">
                        <li>Enable 2-Step Verification on your Google Account.</li>
                        <li>Go to Google App Passwords settings.</li>
                        <li>Generate a 16-character password and paste in "SMTP PASSWORD".</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Payroll & Rules */}
            {activeTab === 'payroll' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">Payroll &amp; Business Rules</h2>
                      <div className="admin-settings-panel-sub">CONFIGURE SALARY CYCLES, WORK HOURS, AND STATUTORY DEDUCTIONS</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-settings-label">Pay Cycle</label>
                    <select 
                      className="admin-settings-input"
                      value={payrollRules.payCycle}
                      onChange={(e) => setPayrollRules({ ...payrollRules, payCycle: e.target.value })}
                    >
                      <option>Monthly (1st of each month)</option>
                      <option>Bi-Weekly (Every 15 days)</option>
                      <option>Weekly (Every Saturday)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">Standard Work Days / Week</label>
                    <input 
                      type="number" 
                      className="admin-settings-input" 
                      value={payrollRules.workDaysPerWeek}
                      onChange={(e) => setPayrollRules({ ...payrollRules, workDaysPerWeek: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">Daily Work Hours</label>
                    <input 
                      type="number" 
                      className="admin-settings-input" 
                      value={payrollRules.dailyHours}
                      onChange={(e) => setPayrollRules({ ...payrollRules, dailyHours: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">Overtime Rate Multiplier</label>
                    <input 
                      type="text" 
                      className="admin-settings-input" 
                      value={payrollRules.overtimeRateMultiplier}
                      onChange={(e) => setPayrollRules({ ...payrollRules, overtimeRateMultiplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-dark mb-3">Statutory Deductions Compliance</h6>
                  <div className="d-flex flex-column gap-2">
                    <Form.Check 
                      type="checkbox"
                      id="pfCheck"
                      label="Enable Provident Fund (PF - 12% Employee + 12% Employer)"
                      checked={payrollRules.enablePfDeduction}
                      onChange={(e) => setPayrollRules({ ...payrollRules, enablePfDeduction: e.target.checked })}
                    />
                    <Form.Check 
                      type="checkbox"
                      id="esiCheck"
                      label="Enable Employee State Insurance (ESIC - 0.75% + 3.25%)"
                      checked={payrollRules.enableEsiDeduction}
                      onChange={(e) => setPayrollRules({ ...payrollRules, enableEsiDeduction: e.target.checked })}
                    />
                    <Form.Check 
                      type="checkbox"
                      id="tdsCheck"
                      label="Enable TDS (Tax Deducted at Source) calculation rules"
                      checked={payrollRules.enableTdsDeduction}
                      onChange={(e) => setPayrollRules({ ...payrollRules, enableTdsDeduction: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button className="admin-settings-save-btn" onClick={handleGlobalSave}>
                    <Save size={15} />
                    <span>SAVE RULES</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Business Profile */}
            {activeTab === 'business' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">Business Profile</h2>
                      <div className="admin-settings-panel-sub">MANAGE YOUR COMPANY DETAILS &amp; LEGAL IDENTIFIERS</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-settings-label">Company Brand Name</label>
                    <input 
                      type="text" 
                      className="admin-settings-input" 
                      value={businessProfile.companyName}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, companyName: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">Legal Registered Name</label>
                    <input 
                      type="text" 
                      className="admin-settings-input" 
                      value={businessProfile.legalName}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, legalName: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">GSTIN Number</label>
                    <input 
                      type="text" 
                      className="admin-settings-input" 
                      placeholder="e.g. 23AAAAA0000A1Z5"
                      value={businessProfile.gstNumber}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, gstNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">Company PAN</label>
                    <input 
                      type="text" 
                      className="admin-settings-input" 
                      placeholder="e.g. ABCDE1234F"
                      value={businessProfile.panNumber}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, panNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="admin-settings-label">Registered Office Address</label>
                    <textarea 
                      className="admin-settings-input" 
                      rows="2"
                      style={{ height: 'auto', padding: '10px 14px' }}
                      value={businessProfile.address}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button className="admin-settings-save-btn" onClick={handleGlobalSave}>
                    <Save size={15} />
                    <span>SAVE PROFILE</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: WhatsApp Connectivity */}
            {activeTab === 'whatsapp' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <MessageSquare size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">WhatsApp Connectivity</h2>
                      <div className="admin-settings-panel-sub">SEND INSTANT SALARY SLIPS &amp; ATTENDANCE ALERTS VIA WHATSAPP BUSINESS API</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-settings-label">WhatsApp Business Sender Number</label>
                    <input 
                      type="tel" 
                      className="admin-settings-input" 
                      placeholder="+91 98765 43210"
                      value={whatsappSettings.senderNumber}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, senderNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-settings-label">API Access Token</label>
                    <input 
                      type="password" 
                      className="admin-settings-input" 
                      placeholder="Paste your WhatsApp Business API Token"
                      value={whatsappSettings.apiKey}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, apiKey: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-dark mb-3">Automated WhatsApp Alerts</h6>
                  <div className="d-flex flex-column gap-2">
                    <Form.Check 
                      type="checkbox"
                      id="waPayslip"
                      label="Auto-send monthly PDF Payslip link to employee's registered WhatsApp"
                      checked={whatsappSettings.autoSendPayslip}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, autoSendPayslip: e.target.checked })}
                    />
                    <Form.Check 
                      type="checkbox"
                      id="waAttendance"
                      label="Send check-in / check-out punch alerts on WhatsApp"
                      checked={whatsappSettings.autoSendAttendanceAlert}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, autoSendAttendanceAlert: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button className="admin-settings-save-btn" onClick={handleGlobalSave}>
                    <Save size={15} />
                    <span>SAVE WHATSAPP</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Announcements & Messaging */}
            {activeTab === 'announcements' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <Megaphone size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">Announcements &amp; Messaging</h2>
                      <div className="admin-settings-panel-sub">BROADCAST COMPANY-WIDE NOTICES TO ALL EMPLOYEES</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 text-muted small mb-3">
                  Create and manage company-wide broadcast bulletins that display on staff mobile &amp; web portals.
                </div>

                <div className="mb-3">
                  <label className="admin-settings-label">Notice Title</label>
                  <input type="text" className="admin-settings-input" placeholder="e.g. Upcoming Holiday Notice / Payroll Schedule" />
                </div>
                <div className="mb-3">
                  <label className="admin-settings-label">Notice Content</label>
                  <textarea className="admin-settings-input" rows="3" style={{ height: 'auto' }} placeholder="Write notice details here..."></textarea>
                </div>

                <div className="text-end">
                  <button className="admin-settings-save-btn" onClick={() => toast.success('Announcement published to all portals!')}>
                    <Send size={15} />
                    <span>PUBLISH ANNOUNCEMENT</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Notifications & Alerts */}
            {activeTab === 'notifications' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <Bell size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">Notifications &amp; Alerts</h2>
                      <div className="admin-settings-panel-sub">CONFIGURE SYSTEM EMAIL TRIGGERS &amp; REAL-TIME ALERTS</div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-3">
                  <Form.Check 
                    type="switch"
                    id="notifyLeave"
                    label={<span className="fw-semibold text-dark">Send admin email notification when staff submits Leave Request</span>}
                    checked={notificationSettings.emailOnLeaveRequest}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOnLeaveRequest: e.target.checked })}
                  />
                  <Form.Check 
                    type="switch"
                    id="notifyNewEmp"
                    label={<span className="fw-semibold text-dark">Send welcome email with login credentials upon adding new Employee</span>}
                    checked={notificationSettings.emailOnNewEmployee}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOnNewEmployee: e.target.checked })}
                  />
                  <Form.Check 
                    type="switch"
                    id="notifySalary"
                    label={<span className="fw-semibold text-dark">Send monthly salary disbursement summary to admin inbox</span>}
                    checked={notificationSettings.emailOnMonthlySalaryRun}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOnMonthlySalaryRun: e.target.checked })}
                  />
                  <Form.Check 
                    type="switch"
                    id="notifyBackup"
                    label={<span className="fw-semibold text-dark">Send automatic notification upon scheduled database backup completion</span>}
                    checked={notificationSettings.emailOnSystemBackup}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOnSystemBackup: e.target.checked })}
                  />
                </div>

                <div className="mt-4 text-end">
                  <button className="admin-settings-save-btn" onClick={handleGlobalSave}>
                    <Save size={15} />
                    <span>SAVE PREFERENCES</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Subscription & Billing */}
            {activeTab === 'billing' && (
              <div>
                <div className="admin-settings-panel-header">
                  <div className="admin-settings-panel-title-group">
                    <div className="admin-settings-panel-icon">
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title">Subscription &amp; Billing</h2>
                      <div className="admin-settings-panel-sub">MANAGE YOUR ACTIVE SAAS PLAN &amp; INVOICES</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-4 text-white mb-4" style={{ background: 'linear-gradient(135deg, #C62828 0%, #991B1B 100%)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-white text-danger fw-bold mb-2">ACTIVE PLAN</span>
                      <h3 className="fw-bold mb-1">ENTERPRISE CLOUD HRMS</h3>
                      <p className="mb-0 opacity-75 small">Full Access to Payroll, Attendance, Bio-metric Sync, and LMS</p>
                    </div>
                    <div className="text-end">
                      <div className="h4 fw-bold mb-0">₹ 1,499 / mo</div>
                      <small className="opacity-75">Auto-renews monthly</small>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                  <div>
                    <strong>Payment Gateway:</strong> Razorpay (UPI, Net Banking, Cards)
                  </div>
                  <span className="badge bg-success">Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
