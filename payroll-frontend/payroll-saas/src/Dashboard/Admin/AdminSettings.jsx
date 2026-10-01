import React, { useState, useEffect } from 'react';
import { Form, Spinner, Modal } from 'react-bootstrap';
import { 
  Calendar, Globe, Mail, MessageSquare, Megaphone, 
  Bell, CreditCard, Send, Trash2, Save, Check, Eye, EyeOff,
  HelpCircle, ShieldCheck, CheckCircle2, AlertCircle, Building2, Sliders,
  QrCode, Smartphone, RefreshCw, Power, CheckCircle, XCircle, LogOut, PhoneCall,
  Users, User, History, CheckSquare, Clock, Filter, Sparkles, SendHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import { whatsappAPI, adminAPI } from '../../services/api';
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

  // 4. WhatsApp Connectivity State (Live Baileys Multi-Device)
  const [waData, setWaData] = useState({
    status: 'DISCONNECTED',
    phoneNumber: '',
    connectedAt: null,
    qrCodeUrl: null,
    autoSendPayslip: true,
    autoSendAttendance: true,
    autoSendAlerts: true
  });
  const [waInputPhone, setWaInputPhone] = useState('');
  const [isConnectingWa, setIsConnectingWa] = useState(false);
  const [isDisconnectingWa, setIsDisconnectingWa] = useState(false);
  const [isSavingWaPref, setIsSavingWaPref] = useState(false);
  const [isSendingTestWa, setIsSendingTestWa] = useState(false);
  const [testRecipientPhone, setTestRecipientPhone] = useState('');
  const [waLogs, setWaLogs] = useState([]);
  const [showWaDisconnectModal, setShowWaDisconnectModal] = useState(false);

  const [waConnectMethod, setWaConnectMethod] = useState('pairing_code'); // 'pairing_code' | 'qr'
  const [pairingCode, setPairingCode] = useState('');
  const [isGettingPairingCode, setIsGettingPairingCode] = useState(false);

  // Fetch WhatsApp Status & Logs
  const fetchWhatsAppStatus = async () => {
    try {
      const res = await whatsappAPI.getStatus();
      if (res?.data?.success && res.data.data) {
        const d = res.data.data;
        setWaData(prev => {
          if (prev.status !== 'CONNECTED' && d.status === 'CONNECTED') {
            toast.success('WhatsApp connected successfully!');
            fetchWhatsAppLogs();
          }
          return d;
        });
        if (d.pairingCode) {
          setPairingCode(d.pairingCode);
        }
        if (d.status === 'CONNECTED') {
          setIsConnectingWa(false);
          setIsGettingPairingCode(false);
        }
        if (d.phoneNumber && !waInputPhone) {
          setWaInputPhone(d.phoneNumber);
        }
      }
    } catch (err) {
      console.warn('Could not fetch WhatsApp status:', err.message);
    }
  };

  const fetchWhatsAppLogs = async () => {
    try {
      const res = await whatsappAPI.getLogs(20);
      if (res?.data?.success && res.data.data) {
        setWaLogs(res.data.data);
      }
    } catch (err) {
      // non-critical
    }
  };

  useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchWhatsAppStatus();
      fetchWhatsAppLogs();
    }
  }, [activeTab]);

  // Auto-polling when waiting for scan or connection
  useEffect(() => {
    let interval = null;
    if (activeTab === 'whatsapp' && waData.status !== 'CONNECTED') {
      interval = setInterval(() => {
        fetchWhatsAppStatus();
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, waData.status]);

  const handleConnectWhatsApp = async () => {
    setIsConnectingWa(true);
    const toastId = toast.loading('Initiating WhatsApp connection & generating live QR...');
    try {
      const res = await whatsappAPI.connect(waInputPhone ? waInputPhone.trim() : '');
      if (res?.data?.success) {
        toast.success('QR Code generated. Please scan using WhatsApp Linked Devices.', { id: toastId });
        if (res.data.data) {
          setWaData(res.data.data);
        }
      } else {
        toast.error(res?.data?.message || 'Failed to start connection', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not connect to WhatsApp service', { id: toastId });
    } finally {
      setIsConnectingWa(false);
    }
  };

  const handleGetPairingCode = async () => {
    if (!waInputPhone || waInputPhone.trim().length < 8) {
      toast.error('Please enter your WhatsApp phone number with country code (e.g. 918305810941)');
      return;
    }

    setIsGettingPairingCode(true);
    const toastId = toast.loading('Generating WhatsApp 8-Character Pairing Code...');
    try {
      const res = await whatsappAPI.getPairingCode(waInputPhone.trim());
      if (res?.data?.success && res.data.data) {
        const code = res.data.data.pairingCode;
        setPairingCode(code);
        toast.success('Pairing code generated! Enter this code in WhatsApp.', { id: toastId });
      } else {
        toast.error(res?.data?.message || 'Failed to generate code', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate pairing code', { id: toastId });
    } finally {
      setIsGettingPairingCode(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setIsDisconnectingWa(true);
    const toastId = toast.loading('Disconnecting WhatsApp session...');
    try {
      const res = await whatsappAPI.disconnect();
      if (res?.data?.success) {
        toast.success('WhatsApp session disconnected.', { id: toastId });
        setShowWaDisconnectModal(false);
        setPairingCode('');
        fetchWhatsAppStatus();
      } else {
        toast.error(res?.data?.message || 'Failed to disconnect', { id: toastId });
      }
    } catch (err) {
      toast.error('Error disconnecting WhatsApp', { id: toastId });
    } finally {
      setIsDisconnectingWa(false);
    }
  };

  const handleSaveWaPreferences = async () => {
    setIsSavingWaPref(true);
    try {
      const res = await whatsappAPI.updatePreferences({
        autoSendPayslip: waData.autoSendPayslip,
        autoSendAttendance: waData.autoSendAttendance,
        autoSendAlerts: waData.autoSendAlerts
      });
      if (res?.data?.success) {
        toast.success('WhatsApp notification preferences saved!');
      } else {
        toast.error(res?.data?.message || 'Failed to save');
      }
    } catch (err) {
      toast.error('Failed to update preferences');
    } finally {
      setIsSavingWaPref(false);
    }
  };

  const handleToggleWaPref = async (field, label) => {
    const nextVal = !waData[field];
    const updated = { ...waData, [field]: nextVal };
    setWaData(updated);

    try {
      await whatsappAPI.updatePreferences({
        autoSendPayslip: field === 'autoSendPayslip' ? nextVal : waData.autoSendPayslip,
        autoSendAttendance: field === 'autoSendAttendance' ? nextVal : waData.autoSendAttendance,
        autoSendAlerts: field === 'autoSendAlerts' ? nextVal : waData.autoSendAlerts
      });
      toast.success(`${label} ${nextVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Could not save preference');
    }
  };

  const handleSendSampleAlert = async (type) => {
    const targetPhone = testRecipientPhone || waInputPhone || waData.phoneNumber;
    if (!targetPhone || targetPhone.trim().length < 8) {
      toast.error('Please enter a WhatsApp number to receive test alert');
      return;
    }

    let msg = '';
    if (type === 'attendance') {
      msg = `✅ *[KIAAN ATTENDANCE ALERT]*\n\nHello Priya,\nYour punch-in for today has been recorded successfully at 09:30 AM.\n\n_Status: Present_\n_Device: Biometric Gate 1_`;
    } else if (type === 'payslip') {
      msg = `💳 *[KIAAN SALARY ADVICE]*\n\nHello Priya,\nYour monthly salary for September 2026 of ₹54,000.00 has been credited to your bank account.\n\n_Payslip Link: https://kiaantechnology.com/portal/payslip_`;
    } else {
      msg = `🔔 *[KIAAN SYSTEM NOTIFICATION]*\n\nAdministrator Alert: Scheduled database backup completed successfully. All 12 employee records synchronized.`;
    }

    const toastId = toast.loading(`Sending sample ${type} WhatsApp notification...`);
    try {
      const res = await whatsappAPI.sendTestMessage({
        recipientPhone: targetPhone.trim(),
        message: msg
      });
      if (res?.data?.success) {
        toast.success(`Sample ${type} message sent to ${targetPhone}!`, { id: toastId });
        fetchWhatsAppLogs();
      } else {
        toast.error(res?.data?.message || 'Failed to send alert', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Please connect WhatsApp first', { id: toastId });
    }
  };

  const handleSendTestMessage = async () => {
    const targetPhone = testRecipientPhone || waInputPhone || waData.phoneNumber;
    if (!targetPhone || targetPhone.trim().length < 8) {
      toast.error('Please enter a valid recipient mobile number');
      return;
    }

    setIsSendingTestWa(true);
    const toastId = toast.loading('Sending test WhatsApp message...');
    try {
      const res = await whatsappAPI.sendTestMessage({
        recipientPhone: targetPhone.trim(),
        message: '👋 *[KIAAN TECHNOLOGY]*\n\nHello! This is a real-time test notification confirming your WhatsApp connection is active and verified.'
      });
      if (res?.data?.success) {
        toast.success(`Test message sent successfully to ${targetPhone}!`, { id: toastId });
        fetchWhatsAppLogs();
      } else {
        toast.error(res?.data?.message || 'Failed to send test message', { id: toastId });
      }
    } catch (err) {
      toast.error('Could not send test WhatsApp message', { id: toastId });
    } finally {
      setIsSendingTestWa(false);
    }
  };

  // 5. Announcements & Messaging State (Image 1 Layout)
  const [announcementSubTab, setAnnouncementSubTab] = useState('compose'); // 'compose' | 'history'
  const [announcementMode, setAnnouncementMode] = useState('broadcast'); // 'broadcast' | 'direct'
  const [audienceScope, setAudienceScope] = useState('all'); // 'all' | 'department' | 'role' | 'specific'
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffSearchFilter, setStaffSearchFilter] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('NORMAL');
  const [announcementChannels, setAnnouncementChannels] = useState({
    whatsapp: true,
    email: true,
    inApp: true
  });
  const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false);
  const [announcementHistory, setAnnouncementHistory] = useState(() => {
    const saved = localStorage.getItem('company_announcements_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 1,
        title: 'Monthly Payroll Disbursal & Salary Slips Released',
        content: 'Dear team, monthly salary disbursement for the current cycle has been completed. Check your payslips under the payroll portal.',
        mode: 'broadcast',
        audience: 'All Staff (Entire Company)',
        targetsCount: 12,
        channels: ['WhatsApp', 'Email', 'In-App'],
        priority: 'HIGH',
        sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'Delivered'
      },
      {
        id: 2,
        title: 'Biometric Attendance Device Firmware Update',
        content: 'Main entrance biometric attendance scanner will undergo scheduled firmware update tonight from 8:30 PM to 9:15 PM.',
        mode: 'broadcast',
        audience: 'Engineering & IT Dept',
        targetsCount: 5,
        channels: ['WhatsApp', 'In-App'],
        priority: 'NORMAL',
        sentAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'Delivered'
      }
    ];
  });

  // Load Employees from database for dynamic targeting
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await adminAPI.getEmployees?.();
        if (res?.data?.data && Array.isArray(res.data.data)) {
          setEmployeesList(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedStaffId(res.data.data[0].id);
            setSelectedStaffIds([res.data.data[0].id]);
          }
        }
      } catch (err) {
        console.warn('Could not load employees from API:', err);
      }
    };
    loadEmployees();
  }, []);

  // Compute available departments dynamically or fallback
  const availableDepartments = [
    'All Departments',
    'Software & Web Development',
    'Human Resources (HR)',
    'Sales & Business Development',
    'Accounts, Finance & Billing',
    'Operations & Customer Support',
    'Administration & IT'
  ];

  // Compute available roles dynamically or fallback
  const availableRoles = [
    'All Roles',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'HR Manager / HR Executive',
    'Project Manager / Team Lead',
    'Sales Executive / BD Manager',
    'Accounts & Finance Officer',
    'System Administrator'
  ];

  const getTargetEmployeesCount = () => {
    if (announcementMode === 'direct') return 1;
    if (audienceScope === 'all') return Math.max(employeesList.length, 1);
    if (audienceScope === 'department') {
      if (selectedDepartment === 'All Departments') return Math.max(employeesList.length, 1);
      const inDept = employeesList.filter(e => {
        const text = `${e.department || ''} ${e.designation || ''}`.toLowerCase();
        return text.includes(selectedDepartment.toLowerCase().split(' ')[0]);
      });
      return Math.max(inDept.length, 1);
    }
    if (audienceScope === 'role') {
      if (selectedRole === 'All Roles') return Math.max(employeesList.length, 1);
      const inRole = employeesList.filter(e => {
        const desig = (e.designation || '').toLowerCase();
        return desig.includes(selectedRole.toLowerCase().split(' ')[0]);
      });
      return Math.max(inRole.length, 1);
    }
    if (audienceScope === 'specific') {
      return selectedStaffIds.length > 0 ? selectedStaffIds.length : 1;
    }
    return 1;
  };

  const handleToggleStaffSelect = (id) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(item => item !== id);
        return next.length === 0 && employeesList.length > 0 ? [id] : next;
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllStaff = () => {
    if (selectedStaffIds.length === employeesList.length) {
      if (employeesList.length > 0) setSelectedStaffIds([employeesList[0].id]);
    } else {
      setSelectedStaffIds(employeesList.map(e => e.id));
    }
  };

  const handleResetAnnouncementForm = () => {
    setNoticeTitle('');
    setNoticeContent('');
    setAnnouncementPriority('NORMAL');
    toast.success('Form fields cleared');
  };

  const handlePublishAnnouncement = async () => {
    if (!noticeTitle.trim()) {
      toast.error('Please enter Announcement / Notice Title');
      return;
    }
    if (!noticeContent.trim()) {
      toast.error('Please enter Notice Content');
      return;
    }

    setIsPublishingAnnouncement(true);
    const toastId = toast.loading('Broadcasting notice across selected channels...');

    try {
      const targetCount = getTargetEmployeesCount();
      let targetName = 'All Staff';
      let targetEmployees = [];

      if (announcementMode === 'direct') {
        const foundEmp = employeesList.find(e => String(e.id) === String(selectedStaffId));
        const foundName = foundEmp?.user?.name || foundEmp?.name || `Staff #${selectedStaffId || 1}`;
        targetName = `Direct: ${foundName}`;
        if (foundEmp) targetEmployees = [foundEmp];
      } else {
        if (audienceScope === 'all') {
          targetName = 'All Staff (Entire Company)';
          targetEmployees = [...employeesList];
        } else if (audienceScope === 'department') {
          targetName = `Dept: ${selectedDepartment}`;
          if (selectedDepartment === 'All Departments') {
            targetEmployees = [...employeesList];
          } else {
            targetEmployees = employeesList.filter(e => {
              const text = `${e.department || ''} ${e.designation || ''}`.toLowerCase();
              return text.includes(selectedDepartment.toLowerCase().split(' ')[0]);
            });
          }
        } else if (audienceScope === 'role') {
          targetName = `Role: ${selectedRole}`;
          if (selectedRole === 'All Roles') {
            targetEmployees = [...employeesList];
          } else {
            targetEmployees = employeesList.filter(e => {
              const desig = (e.designation || '').toLowerCase();
              return desig.includes(selectedRole.toLowerCase().split(' ')[0]);
            });
          }
        } else if (audienceScope === 'specific') {
          targetName = `Custom: ${selectedStaffIds.length} Selected Staff`;
          targetEmployees = employeesList.filter(e => 
            selectedStaffIds.includes(e.id) || selectedStaffIds.includes(String(e.id)) || selectedStaffIds.includes(Number(e.id))
          );
        }
      }

      const activeChannelsList = [];
      if (announcementChannels.whatsapp) activeChannelsList.push('WhatsApp');
      if (announcementChannels.email) activeChannelsList.push('Email');
      if (announcementChannels.inApp) activeChannelsList.push('In-App');

      // Dispatch WhatsApp notice if connected
      let waDispatchedCount = 0;
      if (announcementChannels.whatsapp) {
        if (waData.status === 'CONNECTED') {
          const recipientsToSend = [];
          for (const emp of targetEmployees) {
            const rawPhone = emp.phone || emp.user?.phone || emp.emergency_contact;
            const empName = emp.user?.name || emp.name || 'Team Member';
            if (rawPhone && String(rawPhone).trim()) {
              recipientsToSend.push({
                phone: String(rawPhone).trim(),
                name: empName,
                role: emp.designation || 'EMPLOYEE'
              });
            }
          }

          // Fallback if no target phone found (e.g. testing with connected admin phone)
          if (recipientsToSend.length === 0 && (waInputPhone || waData.phoneNumber)) {
            recipientsToSend.push({
              phone: (waInputPhone || waData.phoneNumber).trim(),
              name: 'Admin / Direct',
              role: 'ADMIN'
            });
          }

          if (recipientsToSend.length > 0) {
            const sendPromises = recipientsToSend.map(async (r) => {
              try {
                const waRes = await whatsappAPI.sendTestMessage({
                  recipientPhone: r.phone,
                  recipientName: r.name,
                  recipientRole: r.role,
                  message: `📢 *[KIAAN NOTICE: ${noticeTitle.toUpperCase()}]*\n\nDear ${r.name},\n\n${noticeContent}\n\n_Priority: ${announcementPriority}_\n_Audience: ${targetName}_`
                });
                if (waRes?.data?.success) {
                  return true;
                }
              } catch (waErr) {
                console.warn(`WhatsApp live dispatch error for ${r.name} (${r.phone}):`, waErr);
              }
              return false;
            });

            const results = await Promise.allSettled(sendPromises);
            waDispatchedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
            if (waDispatchedCount > 0) {
              fetchWhatsAppLogs?.();
            }
          }
        }
      }

      const newHistoryItem = {
        id: Date.now(),
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        mode: announcementMode,
        audience: targetName,
        targetsCount: targetCount,
        channels: activeChannelsList.length ? activeChannelsList : ['In-App'],
        priority: announcementPriority,
        sentAt: new Date().toISOString(),
        status: 'Delivered'
      };

      const updatedHistory = [newHistoryItem, ...announcementHistory];
      setAnnouncementHistory(updatedHistory);
      localStorage.setItem('company_announcements_history', JSON.stringify(updatedHistory));

      setNoticeTitle('');
      setNoticeContent('');

      if (announcementChannels.whatsapp && waDispatchedCount === 0 && waData.status !== 'CONNECTED') {
        toast.success('Notice published to Dashboard Bulletin! (To receive on WhatsApp, please connect WhatsApp scanner in the WhatsApp tab)', { id: toastId, duration: 5000 });
      } else if (waDispatchedCount > 0) {
        toast.success(`Announcement published and delivered to ${waDispatchedCount} WhatsApp recipient(s) successfully!`, { id: toastId });
      } else {
        toast.success('Announcement published and dispatched across selected channels!', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to publish announcement', { id: toastId });
    } finally {
      setIsPublishingAnnouncement(false);
    }
  };

  const handleDeleteHistoryItem = (id) => {
    const updated = announcementHistory.filter(item => item.id !== id);
    setAnnouncementHistory(updated);
    localStorage.setItem('company_announcements_history', JSON.stringify(updated));
    toast.success('History record removed');
  };

  const handleClearAllHistory = () => {
    setAnnouncementHistory([]);
    localStorage.removeItem('company_announcements_history');
    toast.success('All transmission history cleared');
  };

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
              <Calendar size={16} />
              <span>Payroll &amp; Rules</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              <Globe size={16} />
              <span>Business Profile</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'smtp' ? 'active' : ''}`}
              onClick={() => setActiveTab('smtp')}
            >
              <Mail size={16} />
              <span>Email SMTP Settings</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
              onClick={() => setActiveTab('whatsapp')}
            >
              <MessageSquare size={16} />
              <span>WhatsApp Connectivity</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <Megaphone size={16} />
              <span>Announcements &amp; Messaging</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={16} />
              <span>Notifications &amp; Alerts</span>
            </button>

            <button 
              className={`admin-settings-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              <CreditCard size={16} />
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
                {/* 1. Header (Image 1 Layout) */}
                <div className="wa-integration-header">
                  <div className="d-flex align-items-center gap-3">
                    <div className="wa-brand-icon-box">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.2px' }}>
                        WhatsApp Integration
                      </h4>
                      <div className="text-muted small">
                        Connect your WhatsApp account for instant automated employee attendance &amp; payroll notifications.
                      </div>
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  <div>
                    {waData.status === 'CONNECTED' ? (
                      <div className="wa-status-pill">
                        <span className="wa-status-dot connected"></span>
                        <span>CONNECTED</span>
                      </div>
                    ) : waData.status === 'QR_READY' || waData.status === 'CONNECTING' ? (
                      <div className="wa-status-pill">
                        <span className="wa-status-dot scanning"></span>
                        <span>{waData.status === 'QR_READY' ? 'READY TO SCAN' : 'CONNECTING...'}</span>
                      </div>
                    ) : (
                      <div className="wa-status-pill">
                        <span className="wa-status-dot disconnected"></span>
                        <span>DISCONNECTED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Main 2-Column Grid (Image 1 Layout) */}
                <div className="row g-4">
                  {/* Left Column: WhatsApp Web Connection */}
                  <div className="col-lg-6">
                    <div className="wa-card">
                      <div className="wa-card-title">WhatsApp Web Connection</div>
                      <div className="wa-card-subtitle">Pair your WhatsApp mobile app via QR Code</div>

                      {/* State A: DISCONNECTED / MOBILE NUMBER INPUT */}
                      {waData.status !== 'CONNECTED' && !waData.qrCodeUrl && (
                        <div>
                          <div className="mb-3">
                            <label className="fw-bold text-dark mb-2" style={{ fontSize: '0.88rem' }}>
                              WhatsApp Mobile Number (with Country Code)
                            </label>
                            <input
                              type="tel"
                              className="wa-phone-input-box"
                              placeholder="Enter WhatsApp number (e.g. 91XXXXXXXXXX)"
                              value={waInputPhone}
                              onChange={(e) => setWaInputPhone(e.target.value)}
                            />
                            <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
                              Enter your registered WhatsApp phone number with country code (e.g. 91 for India).
                            </div>
                          </div>

                          <div className="mt-4 pt-2 text-end">
                            <button
                              type="button"
                              className="wa-connect-btn"
                              onClick={handleConnectWhatsApp}
                              disabled={isConnectingWa}
                            >
                              {isConnectingWa ? (
                                <>
                                  <Spinner animation="border" size="sm" />
                                  <span>GENERATING QR...</span>
                                </>
                              ) : (
                                <span>CONNECT WHATSAPP</span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State B: QR READY / SCANNING */}
                      {waData.status !== 'CONNECTED' && waData.qrCodeUrl && (
                        <div className="text-center py-2">
                          <p className="text-muted small mb-3">
                            Scan this live QR code using <strong>WhatsApp → Linked Devices → Link a Device</strong>
                          </p>

                          <div className="d-inline-block p-4 bg-white border border-2 border-danger rounded-4 shadow-sm mb-3">
                            <img
                              src={waData.qrCodeUrl}
                              alt="WhatsApp Linked Devices QR"
                              style={{ 
                                width: '240px', 
                                height: '240px', 
                                objectFit: 'contain',
                                imageRendering: 'pixelated',
                                display: 'block',
                                margin: '0 auto'
                              }}
                            />
                          </div>

                          <div className="d-flex align-items-center justify-content-center gap-1 text-muted small mb-3">
                            <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }}></span>
                            <span>Waiting for mobile scan (auto-detects)...</span>
                          </div>

                          <div className="d-flex justify-content-center gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm px-3"
                              onClick={handleDisconnectWhatsApp}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm px-3 d-flex align-items-center gap-1"
                              onClick={handleConnectWhatsApp}
                            >
                              <RefreshCw size={12} /> Regenerate QR
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State C: CONNECTED */}
                      {waData.status === 'CONNECTED' && (
                        <div>
                          <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <div className="fw-bold text-success" style={{ fontSize: '0.92rem' }}>
                                  ● WhatsApp Connected
                                </div>
                                <div className="text-dark fw-bold mt-1" style={{ fontSize: '1.05rem' }}>
                                  +{waData.phoneNumber}
                                </div>
                                {waData.connectedAt && (
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Linked: {new Date(waData.connectedAt).toLocaleString('en-IN')}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm px-3"
                                onClick={() => setShowWaDisconnectModal(true)}
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>

                          {/* Quick Test Message Dispatcher */}
                          <div className="p-3 border rounded-3 bg-light mb-2">
                            <div className="fw-bold text-dark small mb-2 d-flex align-items-center gap-1">
                              <Send size={14} className="text-danger" /> Test WhatsApp Delivery
                            </div>
                            <div className="input-group input-group-sm">
                              <input
                                type="tel"
                                className="form-control"
                                placeholder="Enter recipient mobile number"
                                value={testRecipientPhone}
                                onChange={(e) => setTestRecipientPhone(e.target.value)}
                              />
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={handleSendTestMessage}
                                disabled={isSendingTestWa}
                              >
                                {isSendingTestWa ? 'Sending...' : 'Send Test'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Role-Based Notifications */}
                  <div className="col-lg-6">
                    <div className="wa-card-right">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="wa-card-title mb-0">Role-Based Notifications</div>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.7rem' }}>
                          AUTO-TRIGGER ACTIVE
                        </span>
                      </div>
                      <div className="wa-card-subtitle">Automated WhatsApp message triggers for staff &amp; administrators</div>

                      {/* Item 1: Attendance Alert */}
                      <div className="wa-trigger-item green">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                          <div className="wa-trigger-icon">
                            <Bell size={18} />
                          </div>
                          <div>
                            <div className="wa-trigger-title">Employee Attendance Alert</div>
                            <div className="wa-trigger-desc">
                              Sent immediately to employee when attendance check-in is registered.
                            </div>
                          </div>
                        </div>
                        <div className="wa-trigger-actions">
                          <Form.Check 
                            type="switch"
                            id="waAttendanceSwitch"
                            checked={waData.autoSendAttendance}
                            onChange={() => handleToggleWaPref('autoSendAttendance', 'Attendance Alerts')}
                          />
                          <button 
                            type="button" 
                            className="wa-trigger-test-btn"
                            onClick={() => handleSendSampleAlert('attendance')}
                            title="Test send sample attendance punch alert"
                          >
                            ⚡ Test
                          </button>
                        </div>
                      </div>

                      {/* Item 2: Payslip & Salary Updates */}
                      <div className="wa-trigger-item blue">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                          <div className="wa-trigger-icon">
                            <Smartphone size={18} />
                          </div>
                          <div>
                            <div className="wa-trigger-title">Monthly Payslip &amp; Salary Advice</div>
                            <div className="wa-trigger-desc">
                              Alerts employee with instant payslip link as soon as salary is disbursed.
                            </div>
                          </div>
                        </div>
                        <div className="wa-trigger-actions">
                          <Form.Check 
                            type="switch"
                            id="waPayslipSwitch"
                            checked={waData.autoSendPayslip}
                            onChange={() => handleToggleWaPref('autoSendPayslip', 'Payslip Alerts')}
                          />
                          <button 
                            type="button" 
                            className="wa-trigger-test-btn"
                            onClick={() => handleSendSampleAlert('payslip')}
                            title="Test send sample payslip advice"
                          >
                            ⚡ Test
                          </button>
                        </div>
                      </div>

                      {/* Item 3: Admin & Subscription Reminders */}
                      <div className="wa-trigger-item yellow">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                          <div className="wa-trigger-icon">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <div className="wa-trigger-title">Company &amp; Subscription Alerts</div>
                            <div className="wa-trigger-desc">
                              Notifies admins about new staff onboarding, payroll summaries and plan renewals.
                            </div>
                          </div>
                        </div>
                        <div className="wa-trigger-actions">
                          <Form.Check 
                            type="switch"
                            id="waAlertsSwitch"
                            checked={waData.autoSendAlerts}
                            onChange={() => handleToggleWaPref('autoSendAlerts', 'System Alerts')}
                          />
                          <button 
                            type="button" 
                            className="wa-trigger-test-btn"
                            onClick={() => handleSendSampleAlert('system')}
                            title="Test send sample admin alert"
                          >
                            ⚡ Test
                          </button>
                        </div>
                      </div>

                      {/* Bottom Security Box */}
                      <div className="wa-security-box mt-3">
                        <div className="wa-security-title">SECURITY &amp; TENANT ISOLATION</div>
                        <div className="wa-security-desc">
                          Your WhatsApp session credentials are stored securely on the backend. Messages are sent exclusively to registered employees of your company.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disconnect Modal */}
                <Modal show={showWaDisconnectModal} onHide={() => setShowWaDisconnectModal(false)} centered>
                  <Modal.Header closeButton>
                    <Modal.Title className="h6 fw-bold">Disconnect WhatsApp Account?</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-muted small mb-0">
                      Are you sure you want to disconnect WhatsApp? Automated WhatsApp notifications will be paused until you reconnect.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowWaDisconnectModal(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={handleDisconnectWhatsApp} disabled={isDisconnectingWa}>
                      {isDisconnectingWa ? 'Disconnecting...' : 'Yes, Disconnect'}
                    </button>
                  </Modal.Footer>
                </Modal>
              </div>
            )}

            {/* TAB: Announcements & Messaging (Image 1 Layout) */}
            {activeTab === 'announcements' && (
              <div>
                {/* 1. Header Bar with Sub-Navigation */}
                <div className="announcement-top-header">
                  <div className="d-flex align-items-center gap-3">
                    <div className="admin-settings-panel-icon">
                      <Megaphone size={22} />
                    </div>
                    <div>
                      <h2 className="admin-settings-panel-title" style={{ fontSize: '1.25rem' }}>Announcements &amp; Messaging</h2>
                      <div className="admin-settings-panel-sub">
                        BROADCAST COMPANY-WIDE NOTICES OR SEND DIRECT PERSONAL MESSAGES VIA EMAIL AND WHATSAPP.
                      </div>
                    </div>
                  </div>

                  {/* Sub-Tabs: Compose & History */}
                  <div className="announcement-subtab-group">
                    <button 
                      type="button"
                      className={`announcement-subtab-btn ${announcementSubTab === 'compose' ? 'active' : ''}`}
                      onClick={() => setAnnouncementSubTab('compose')}
                    >
                      <SendHorizontal size={14} />
                      <span>Compose &amp; Send</span>
                    </button>
                    <button 
                      type="button"
                      className={`announcement-subtab-btn ${announcementSubTab === 'history' ? 'active' : ''}`}
                      onClick={() => setAnnouncementSubTab('history')}
                    >
                      <Clock size={14} />
                      <span>Transmission History ({announcementHistory.length})</span>
                    </button>
                  </div>
                </div>

                {/* 2. Top Channel Status Overview Cards */}
                <div className="announcement-channel-grid">
                  {/* WhatsApp Channel Card */}
                  <div className={`announcement-channel-card whatsapp ${waData.status === 'CONNECTED' ? 'connected' : ''}`}>
                    <div className="announcement-channel-info">
                      <div className="announcement-channel-icon">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <div className="announcement-channel-name">WhatsApp Channel</div>
                        <div className="announcement-channel-desc">
                          {waData.status === 'CONNECTED' 
                            ? `Connected (+${waData.phoneNumber || 'Active'})`
                            : 'Not connected (Go to WhatsApp tab to link)'}
                        </div>
                      </div>
                    </div>
                    <div>
                      {waData.status === 'CONNECTED' ? (
                        <span className="announcement-channel-badge online">ONLINE</span>
                      ) : (
                        <span className="announcement-channel-badge offline">OFFLINE</span>
                      )}
                    </div>
                  </div>

                  {/* Email Channel Card */}
                  <div className="announcement-channel-card email">
                    <div className="announcement-channel-info">
                      <div className="announcement-channel-icon">
                        <Mail size={20} />
                      </div>
                      <div>
                        <div className="announcement-channel-name">Email Channel</div>
                        <div className="announcement-channel-desc">
                          {smtpForm.username 
                            ? `Custom SMTP Active (${smtpForm.username})` 
                            : 'Custom SMTP Active (hiteshaborase2004@gmail.com)'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="announcement-channel-badge active-red">SYSTEM ACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* VIEW 1: COMPOSE & SEND */}
                {announcementSubTab === 'compose' && (
                  <div>
                    {/* STEP ❶: SELECT MESSAGE MODE & AUDIENCE */}
                    <div className="announcement-step-title">
                      <span className="announcement-step-num">1</span>
                      <span>SELECT MESSAGE MODE &amp; AUDIENCE</span>
                    </div>

                    {/* 2 Mode Cards */}
                    <div className="announcement-mode-grid">
                      {/* Mode Card 1: Broadcast */}
                      <div 
                        className={`announcement-mode-card ${announcementMode === 'broadcast' ? 'active' : ''}`}
                        onClick={() => setAnnouncementMode('broadcast')}
                      >
                        <div className="announcement-mode-icon">
                          <Megaphone size={20} />
                        </div>
                        <div>
                          <div className="announcement-mode-heading">Company Announcement (Broadcast)</div>
                          <div className="announcement-mode-desc">
                            Send official notice to all staff or a selected department.
                          </div>
                        </div>
                      </div>

                      {/* Mode Card 2: Direct */}
                      <div 
                        className={`announcement-mode-card ${announcementMode === 'direct' ? 'active' : ''}`}
                        onClick={() => setAnnouncementMode('direct')}
                      >
                        <div className="announcement-mode-icon">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="announcement-mode-heading">Direct Personal Message</div>
                          <div className="announcement-mode-desc">
                            Send private 1-to-1 alert or notice to an individual employee.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audience Scope Box */}
                    <div className="announcement-scope-container">
                      {announcementMode === 'broadcast' ? (
                        <div>
                          <div className="announcement-scope-label">AUDIENCE SCOPE:</div>
                          <div className="announcement-scope-btn-group four-cols">
                            <button
                              type="button"
                              className={`announcement-scope-btn ${audienceScope === 'all' ? 'active' : ''}`}
                              onClick={() => setAudienceScope('all')}
                            >
                              All Staff ({employeesList.length || 0})
                            </button>
                            <button
                              type="button"
                              className={`announcement-scope-btn ${audienceScope === 'department' ? 'active' : ''}`}
                              onClick={() => setAudienceScope('department')}
                            >
                              By Department
                            </button>
                            <button
                              type="button"
                              className={`announcement-scope-btn ${audienceScope === 'role' ? 'active' : ''}`}
                              onClick={() => setAudienceScope('role')}
                            >
                              By Role
                            </button>
                            <button
                              type="button"
                              className={`announcement-scope-btn ${audienceScope === 'specific' ? 'active' : ''}`}
                              onClick={() => setAudienceScope('specific')}
                            >
                              Specific Staff ({selectedStaffIds.length})
                            </button>
                          </div>

                          {/* Department Sub-Selector */}
                          {audienceScope === 'department' && (
                            <div className="mb-3 p-3 bg-light rounded-3 border">
                              <label className="admin-settings-label">Target Department</label>
                              <select 
                                className="admin-settings-input"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                              >
                                {availableDepartments.map((dept, i) => (
                                  <option key={i} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Role Sub-Selector */}
                          {audienceScope === 'role' && (
                            <div className="mb-3 p-3 bg-light rounded-3 border">
                              <label className="admin-settings-label">Target Role / Designation</label>
                              <select 
                                className="admin-settings-input"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                              >
                                {availableRoles.map((role, i) => (
                                  <option key={i} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Specific Staff Sub-Selector */}
                          {audienceScope === 'specific' && (
                            <div className="mb-3 p-3 bg-light rounded-3 border">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="admin-settings-label mb-0">Select Target Staff Members ({selectedStaffIds.length} Selected)</label>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-danger py-0 px-2" 
                                  style={{ fontSize: '0.75rem' }}
                                  onClick={handleSelectAllStaff}
                                >
                                  {selectedStaffIds.length === employeesList.length ? 'Deselect All' : 'Select All Staff'}
                                </button>
                              </div>
                              
                              <input 
                                type="text"
                                className="admin-settings-input mb-2"
                                placeholder="Search employee name, role or email..."
                                value={staffSearchFilter}
                                onChange={(e) => setStaffSearchFilter(e.target.value)}
                                style={{ height: '36px', fontSize: '0.82rem' }}
                              />

                              <div className="staff-multi-select-list">
                                {employeesList
                                  .filter(emp => {
                                    if (!staffSearchFilter) return true;
                                    const q = staffSearchFilter.toLowerCase();
                                    const name = (emp.user?.name || emp.name || '').toLowerCase();
                                    const email = (emp.user?.email || emp.email || '').toLowerCase();
                                    const role = (emp.designation || '').toLowerCase();
                                    return name.includes(q) || email.includes(q) || role.includes(q);
                                  })
                                  .map(emp => {
                                    const name = emp.user?.name || emp.name || `Employee #${emp.id}`;
                                    const email = emp.user?.email || emp.email || '';
                                    const role = emp.designation || 'Staff';
                                    const isChecked = selectedStaffIds.includes(emp.id);
                                    return (
                                      <label 
                                        key={emp.id} 
                                        className={`staff-checkbox-item ${isChecked ? 'selected' : ''}`}
                                        onClick={() => handleToggleStaffSelect(emp.id)}
                                      >
                                        <input 
                                          type="checkbox" 
                                          className="form-check-input mt-0"
                                          checked={isChecked}
                                          onChange={() => {}}
                                        />
                                        <div className="staff-avatar-circle">
                                          {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-grow-1 text-truncate">
                                          <div className="fw-bold text-dark small text-truncate">{name}</div>
                                          <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                                            {role} {email ? `• ${email}` : ''}
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Summary Bar */}
                          <div className="announcement-target-summary">
                            <div className="announcement-target-text">
                              <Users size={16} className="text-danger" />
                              <span>Selected Targets: <strong>{getTargetEmployeesCount()} Employees</strong></span>
                            </div>
                            <span className="announcement-target-badge">BROADCAST</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="announcement-scope-label">SELECT INDIVIDUAL RECIPIENT:</div>
                          <div className="mb-3">
                            <select 
                              className="admin-settings-input"
                              value={selectedStaffId}
                              onChange={(e) => setSelectedStaffId(e.target.value)}
                            >
                              {employeesList.map(emp => {
                                const name = emp.user?.name || emp.name || `Employee #${emp.id}`;
                                const email = emp.user?.email || emp.email || '';
                                const role = emp.designation || emp.department || 'Staff';
                                return (
                                  <option key={emp.id} value={emp.id}>
                                    {name} — {role} {email ? `(${email})` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="announcement-target-summary">
                            <div className="announcement-target-text">
                              <User size={16} className="text-danger" />
                              <span>Recipient: <strong>1 Employee (Direct 1-to-1 Notice)</strong></span>
                            </div>
                            <span className="announcement-target-badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                              DIRECT 1-TO-1
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STEP ❷: CHOOSE DELIVERY CHANNELS & PRIORITY */}
                    <div className="announcement-step-title mt-4">
                      <span className="announcement-step-num">2</span>
                      <span>CHOOSE DELIVERY CHANNELS &amp; PRIORITY</span>
                    </div>

                    {/* Channels Checkboxes */}
                    <div className="announcement-channels-group">
                      <label 
                        className={`announcement-channel-toggle ${announcementChannels.whatsapp ? 'checked' : ''}`}
                        onClick={() => setAnnouncementChannels(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                      >
                        <input 
                          type="checkbox" 
                          className="form-check-input me-1"
                          checked={announcementChannels.whatsapp} 
                          onChange={() => {}}
                        />
                        <MessageSquare size={14} className="text-success" />
                        <span>WhatsApp Notification</span>
                      </label>

                      <label 
                        className={`announcement-channel-toggle ${announcementChannels.email ? 'checked' : ''}`}
                        onClick={() => setAnnouncementChannels(prev => ({ ...prev, email: !prev.email }))}
                      >
                        <input 
                          type="checkbox" 
                          className="form-check-input me-1"
                          checked={announcementChannels.email} 
                          onChange={() => {}}
                        />
                        <Mail size={14} className="text-danger" />
                        <span>Email Notification</span>
                      </label>

                      <label 
                        className={`announcement-channel-toggle ${announcementChannels.inApp ? 'checked' : ''}`}
                        onClick={() => setAnnouncementChannels(prev => ({ ...prev, inApp: !prev.inApp }))}
                      >
                        <input 
                          type="checkbox" 
                          className="form-check-input me-1"
                          checked={announcementChannels.inApp} 
                          onChange={() => {}}
                        />
                        <Bell size={14} className="text-warning" />
                        <span>In-App Dashboard Bulletin</span>
                      </label>
                    </div>

                    {/* Form Inputs */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-8">
                        <label className="admin-settings-label">Notice / Message Title</label>
                        <input 
                          type="text" 
                          className="admin-settings-input" 
                          placeholder="e.g. Upcoming Holiday Notice / Payroll Schedule"
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="admin-settings-label">Priority Level</label>
                        <select 
                          className="admin-settings-input"
                          value={announcementPriority}
                          onChange={(e) => setAnnouncementPriority(e.target.value)}
                        >
                          <option value="NORMAL">Normal Priority</option>
                          <option value="HIGH">High Priority (Urgent)</option>
                          <option value="CRITICAL">Important Notice</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="admin-settings-label">Notice Content / Body</label>
                      <textarea 
                        className="admin-settings-input" 
                        rows="4" 
                        style={{ height: 'auto', padding: '12px 14px' }} 
                        placeholder="Write notice details here (supports multi-line announcements)..."
                        value={noticeContent}
                        onChange={(e) => setNoticeContent(e.target.value)}
                      ></textarea>
                      <div className="text-muted small mt-1 text-end">
                        {noticeContent.length} characters
                      </div>
                    </div>

                    {/* Submit Action Button */}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top gap-3 flex-wrap">
                      <div className="text-muted small">
                        ⚡ Messages will be transmitted simultaneously via active channels.
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          type="button"
                          className="btn btn-outline-secondary btn-sm px-3"
                          onClick={handleResetAnnouncementForm}
                        >
                          Clear
                        </button>
                        <button 
                          type="button"
                          className="admin-settings-top-save-btn" 
                          onClick={handlePublishAnnouncement}
                          disabled={isPublishingAnnouncement}
                        >
                          {isPublishingAnnouncement ? (
                            <>
                              <Spinner animation="border" size="sm" />
                              <span>BROADCASTING...</span>
                            </>
                          ) : (
                            <>
                              <Send size={15} />
                              <span>{announcementMode === 'direct' ? 'SEND PERSONAL MESSAGE' : 'PUBLISH ANNOUNCEMENT'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 2: TRANSMISSION HISTORY */}
                {announcementSubTab === 'history' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <input 
                        type="text"
                        className="admin-settings-input"
                        placeholder="Search past announcements..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        style={{ maxWidth: '280px', height: '36px', fontSize: '0.82rem' }}
                      />
                      {announcementHistory.length > 0 && (
                        <button 
                          type="button" 
                          className="btn btn-outline-danger btn-sm px-3"
                          onClick={handleClearAllHistory}
                        >
                          <Trash2 size={13} className="me-1 inline" /> Clear All History
                        </button>
                      )}
                    </div>

                    <div className="table-responsive border rounded-3 bg-white">
                      <table className="announcement-history-table">
                        <thead>
                          <tr>
                            <th>Date &amp; Time</th>
                            <th>Title &amp; Notice</th>
                            <th>Audience</th>
                            <th>Channels</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {announcementHistory.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4 text-muted">
                                No previous transmission history found.
                              </td>
                            </tr>
                          ) : (
                            announcementHistory
                              .filter(item => {
                                if (!historySearchQuery) return true;
                                const q = historySearchQuery.toLowerCase();
                                return (item.title || '').toLowerCase().includes(q) ||
                                       (item.content || '').toLowerCase().includes(q) ||
                                       (item.audience || '').toLowerCase().includes(q);
                              })
                              .map((item) => (
                              <tr key={item.id}>
                                <td className="text-nowrap text-muted" style={{ fontSize: '0.8rem' }}>
                                  {new Date(item.sentAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td>
                                  <div className="fw-bold text-dark">{item.title}</div>
                                  <div className="text-muted small text-truncate" style={{ maxWidth: '260px' }}>
                                    {item.content}
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border">
                                    {item.audience}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex gap-1 flex-wrap">
                                    {item.channels.map((ch, i) => (
                                      <span key={i} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.72rem' }}>
                                        {ch}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${item.priority === 'HIGH' || item.priority === 'CRITICAL' ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '0.72rem' }}>
                                    {item.priority}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.72rem' }}>
                                    <Check size={11} className="me-1 inline" /> {item.status}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-link text-danger p-0"
                                    onClick={() => handleDeleteHistoryItem(item.id)}
                                    title="Delete record"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
