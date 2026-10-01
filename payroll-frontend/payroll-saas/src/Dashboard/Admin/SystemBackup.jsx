import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal, Spinner, Dropdown, Alert, Collapse } from 'react-bootstrap';
import { 
  Database, HardDrive, Download, Upload, Trash2, RotateCcw, 
  Building2, FileArchive, CheckCircle2, AlertTriangle, Shield, 
  Calendar, RefreshCw, Plus, Clock, FileText, ArrowDownToLine,
  Layers, Lock, ChevronDown, Mail, Send, CalendarClock, History,
  Sparkles, Check, XCircle, AlertCircle, ExternalLink, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI, superadminAPI } from '../../services/api';

const SystemBackup = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backupsList, setBackupsList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);

  // Automated 7-Day Report States
  const [reportStatus, setReportStatus] = useState(null);
  const [reportStatusLoading, setReportStatusLoading] = useState(false);
  const [triggeringReport, setTriggeringReport] = useState(false);
  const [showReportHistory, setShowReportHistory] = useState(false);

  // Email Backup Modal States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailBackupType, setEmailBackupType] = useState('database');
  const [emailCompanyId, setEmailCompanyId] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [sendingEmailBackup, setSendingEmailBackup] = useState(false);

  // Existing Modals & dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = React.useRef(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMobile = windowWidth <= 768;
  const isSmallPhone = windowWidth <= 480;

  // Use adminAPI primarily with fallback to superadminAPI
  const api = adminAPI.getBackups ? adminAPI : superadminAPI;

  // Fetch Backups and Companies list
  const fetchBackupsData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [backupRes, companyRes] = await Promise.all([
        api.getBackups().catch(() => ({ data: { success: false, data: [] } })),
        adminAPI.getEmployers ? adminAPI.getEmployers().catch(() => ({ data: { success: false, data: [] } })) : Promise.resolve({ data: { success: false, data: [] } })
      ]);

      if (backupRes?.data?.success) {
        setBackupsList(backupRes.data.data || []);
      }

      if (companyRes?.data?.success) {
        setCompaniesList(companyRes.data.data || companyRes.data.employers || []);
      }
    } catch (err) {
      console.error('[FETCH_BACKUPS_ERROR]', err);
      toast.error('Failed to load system backups.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Automated Report Schedule Status
  const fetchReportStatus = async () => {
    try {
      setReportStatusLoading(true);
      if (api.getAutomatedReportStatus) {
        const res = await api.getAutomatedReportStatus();
        if (res?.data?.success) {
          setReportStatus(res.data.data);
          if (res.data.data?.defaultRecipient && !emailRecipient) {
            setEmailRecipient(res.data.data.defaultRecipient);
          }
        }
      }
    } catch (err) {
      console.error('[FETCH_REPORT_STATUS_ERROR]', err);
    } finally {
      setReportStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupsData();
    fetchReportStatus();
  }, []);

  // Trigger 7-Day Report Manual/Forced Dispatch
  const handleTriggerReportNow = async () => {
    try {
      setTriggeringReport(true);
      toast.loading('Generating live database metrics & sending 7-day report...', { id: 'report-task' });

      const res = await api.triggerAutomatedReport({ force: true });
      if (res?.data?.success) {
        toast.success(res.data.message || '7-Day automated data report sent to email successfully!', { id: 'report-task' });
        fetchReportStatus();
        fetchBackupsData();
      } else {
        toast.error(res?.data?.message || 'Failed to dispatch report.', { id: 'report-task' });
      }
    } catch (err) {
      console.error('[TRIGGER_REPORT_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to send automated report.', { id: 'report-task' });
    } finally {
      setTriggeringReport(false);
    }
  };

  // Direct Send Backup to Email Form Submit
  const handleSendEmailBackupSubmit = async (e) => {
    e.preventDefault();
    if (!emailRecipient || !emailRecipient.includes('@')) {
      toast.error('Please enter a valid recipient email address.');
      return;
    }

    try {
      setSendingEmailBackup(true);
      toast.loading(`Creating snapshot and emailing to ${emailRecipient}...`, { id: 'send-email-backup' });

      const payload = {
        toEmail: emailRecipient.trim(),
        type: emailBackupType,
        companyId: emailBackupType === 'company' ? emailCompanyId : null,
        notes: emailNotes.trim()
      };

      const res = await api.sendBackupEmail(payload);
      if (res?.data?.success) {
        toast.success(res.data.message || `Backup snapshot dispatched to ${emailRecipient} successfully!`, { id: 'send-email-backup' });
        setShowEmailModal(false);
        setEmailNotes('');
        fetchBackupsData();
        fetchReportStatus();
      } else {
        toast.error(res?.data?.message || 'Failed to send backup email.', { id: 'send-email-backup' });
      }
    } catch (err) {
      console.error('[SEND_BACKUP_EMAIL_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to send backup to email.', { id: 'send-email-backup' });
    } finally {
      setSendingEmailBackup(false);
    }
  };

  // 1. Create Full or Company Database Backup
  const handleCreateDatabaseBackup = async (companyId = null) => {
    try {
      setActionLoading(true);
      toast.loading(companyId ? 'Generating company database snapshot...' : 'Generating full database snapshot...', { id: 'backup-task' });
      
      const res = await api.createBackup({
        type: 'database',
        companyId: companyId || null
      });

      if (res?.data?.success) {
        toast.success(res.data.message || 'Database snapshot created successfully!', { id: 'backup-task' });
        setShowCompanyModal(false);
        setSelectedCompanyId('');
        fetchBackupsData();
      } else {
        toast.error(res?.data?.message || 'Failed to create database backup.', { id: 'backup-task' });
      }
    } catch (err) {
      console.error('[CREATE_DB_BACKUP_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to create backup.', { id: 'backup-task' });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Create Uploads / Media Zip Backup
  const handleCreateUploadsBackup = async () => {
    try {
      setActionLoading(true);
      toast.loading('Archiving uploads and documents to zip...', { id: 'backup-task' });

      const res = await api.createBackup({ type: 'uploads' });

      if (res?.data?.success) {
        toast.success(res.data.message || 'Uploads zip archive created successfully!', { id: 'backup-task' });
        fetchBackupsData();
      } else {
        toast.error(res?.data?.message || 'Failed to create uploads backup.', { id: 'backup-task' });
      }
    } catch (err) {
      console.error('[CREATE_UPLOADS_BACKUP_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to archive uploads.', { id: 'backup-task' });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Download Backup File
  const handleDownloadBackup = (filename) => {
    const downloadUrl = api.getDownloadBackupUrl(filename);
    window.open(downloadUrl, '_blank');
  };

  // 4. Restore Database from Server File
  const handleRestoreSubmit = async () => {
    if (!selectedBackup) return;
    try {
      setActionLoading(true);
      toast.loading(`Restoring database from ${selectedBackup.filename}...`, { id: 'restore-task' });

      const res = await api.restoreBackup(selectedBackup.filename);

      if (res?.data?.success) {
        toast.success('Database snapshot restored successfully!', { id: 'restore-task' });
        setShowRestoreModal(false);
        setSelectedBackup(null);
      } else {
        toast.error(res?.data?.message || 'Restoration failed.', { id: 'restore-task' });
      }
    } catch (err) {
      console.error('[RESTORE_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to restore database.', { id: 'restore-task' });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Upload File and 1-Click Restore
  const handleUploadAndRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a .json.gz, .json, or .sql file to upload.');
      return;
    }

    try {
      setActionLoading(true);
      toast.loading('Uploading and restoring database snapshot...', { id: 'upload-restore-task' });

      const formData = new FormData();
      formData.append('backupFile', uploadFile);

      const res = await api.uploadAndRestoreBackup(formData);

      if (res?.data?.success) {
        toast.success(res.data.message || 'Backup file restored successfully!', { id: 'upload-restore-task' });
        setShowUploadModal(false);
        setUploadFile(null);
        fetchBackupsData();
      } else {
        toast.error(res?.data?.message || 'Upload & restoration failed.', { id: 'upload-restore-task' });
      }
    } catch (err) {
      console.error('[UPLOAD_RESTORE_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to upload and restore backup.', { id: 'upload-restore-task' });
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Delete Backup
  const handleDeleteSubmit = async () => {
    if (!selectedBackup) return;
    try {
      setActionLoading(true);
      const res = await api.deleteBackup(selectedBackup.filename);
      if (res?.data?.success) {
        toast.success('Backup file deleted successfully.');
        setShowDeleteModal(false);
        setSelectedBackup(null);
        fetchBackupsData();
      } else {
        toast.error(res?.data?.message || 'Failed to delete backup.');
      }
    } catch (err) {
      console.error('[DELETE_BACKUP_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to delete backup.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats
  const totalSnapshots = backupsList.length;
  const dbSnapshotsCount = backupsList.filter(b => b.type === 'database').length;
  const uploadsSnapshotsCount = backupsList.filter(b => b.type === 'uploads').length;
  const latestBackupDate = backupsList.length > 0 ? new Date(backupsList[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'None';

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* HEADER SECTION */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center">
          <div 
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ 
              width: isSmallPhone ? '40px' : '48px', 
              height: isSmallPhone ? '40px' : '48px', 
              borderRadius: '12px', 
              backgroundColor: '#FEF2F2', 
              color: '#C62828',
              marginRight: '14px'
            }}
          >
            <Shield size={isSmallPhone ? 22 : 26} />
          </div>
          <div>
            <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px', fontSize: isSmallPhone ? '1.25rem' : isMobile ? '1.45rem' : '1.75rem' }}>
              Backup & Recovery Management
            </h2>
            <p className="text-muted mb-0 mt-0.5" style={{ fontSize: isSmallPhone ? '0.78rem' : '0.86rem' }}>
              Secure database snapshots, enterprise recovery, and file storage archiving.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS GROUP */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* REFRESH BUTTON */}
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              fetchBackupsData(true);
              fetchReportStatus();
            }}
            disabled={refreshing}
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ borderRadius: '8px', width: '40px', height: '40px', borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}
            title="Refresh Backups List & Report Status"
          >
            <RefreshCw size={17} className={refreshing ? 'spin' : ''} style={{ color: '#475569' }} />
          </Button>

          {/* EMAIL BACKUP FORM MODAL BUTTON */}
          <Button
            variant="outline-primary"
            onClick={() => setShowEmailModal(true)}
            className="d-flex align-items-center justify-content-center px-3 py-2 fw-medium text-nowrap"
            style={{ borderRadius: '8px', height: '40px', fontSize: '0.86rem', borderColor: '#93C5FD', color: '#1D4ED8', backgroundColor: '#EFF6FF' }}
            title="Send DB Snapshot to Email"
          >
            <Mail size={16} style={{ marginRight: '8px' }} /> Email Backup
          </Button>

          {/* UPLOAD & RESTORE */}
          <Button
            variant="outline-danger"
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center justify-content-center px-3 py-2 fw-medium text-nowrap"
            style={{ borderRadius: '8px', height: '40px', fontSize: '0.86rem', borderColor: '#FCA5A5', color: '#B91C1C', backgroundColor: '#FEF2F2' }}
          >
            <Upload size={16} style={{ marginRight: '8px' }} /> Upload & Restore
          </Button>

          {/* ACTION DROPDOWN */}
          <div className="position-relative" ref={dropdownRef}>
            <Button
              onClick={() => setShowDropdown(!showDropdown)}
              className="d-flex align-items-center justify-content-center px-3 py-2 text-white fw-medium shadow-sm border-0 text-nowrap"
              style={{ 
                backgroundColor: '#C62828', 
                borderRadius: '8px', 
                height: '40px', 
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} style={{ marginRight: '6px' }} /> Create Backup 
              <ChevronDown size={15} style={{ marginLeft: '6px', transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </Button>

            {showDropdown && (
              <div 
                className="shadow-lg border p-2 position-absolute" 
                style={{ 
                  top: 'calc(100% + 6px)',
                  right: 0,
                  left: 'auto',
                  minWidth: '290px', 
                  maxWidth: '340px',
                  width: isMobile ? 'calc(100vw - 32px)' : '320px',
                  borderRadius: '12px', 
                  fontSize: '0.86rem', 
                  zIndex: 1060,
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div 
                  onClick={() => {
                    setShowDropdown(false);
                    handleCreateDatabaseBackup();
                  }}
                  className="d-flex align-items-start p-2 rounded cursor-pointer"
                  style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#FEF2F2', color: '#C62828', marginRight: '10px', marginTop: '2px' }}
                  >
                    <Database size={17} />
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">Full Database Snapshot</div>
                    <div className="text-muted small">Complete system backup (.json.gz)</div>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setShowDropdown(false);
                    setShowCompanyModal(true);
                  }}
                  className="d-flex align-items-start p-2 rounded cursor-pointer"
                  style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#EFF6FF', color: '#2563EB', marginRight: '10px', marginTop: '2px' }}
                  >
                    <Building2 size={17} />
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">Company Scoped Backup</div>
                    <div className="text-muted small">Export single corporate company data</div>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setShowDropdown(false);
                    handleCreateUploadsBackup();
                  }}
                  className="d-flex align-items-start p-2 rounded cursor-pointer"
                  style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#FEF3C7', color: '#D97706', marginRight: '10px', marginTop: '2px' }}
                  >
                    <FileArchive size={17} />
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">Uploads & Storage Archive</div>
                    <div className="text-muted small">Documents, logos & media (.zip)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AUTOMATIC 7-DAY DATA & BACKUP REPORT STATUS CARD */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #E2E8F0' }}>
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div className="d-flex align-items-center">
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '10px', 
                  backgroundColor: '#EFF6FF', 
                  color: '#2563EB',
                  marginRight: '14px',
                  border: '1px solid #BFDBFE'
                }}
              >
                <CalendarClock size={22} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.3px', fontSize: isSmallPhone ? '0.98rem' : '1.08rem' }}>
                    Automatic 7-Day Data & Backup Report
                  </h5>
                  <Badge bg="" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px' }}>
                    <span className="d-inline-block rounded-circle me-1.5" style={{ width: '6px', height: '6px', backgroundColor: '#16A34A' }}></span>
                    Cron Active (Every 7 Days)
                  </Badge>
                </div>
                <p className="text-muted mb-0 small mt-1" style={{ fontSize: isSmallPhone ? '0.75rem' : '0.82rem' }}>
                  Automated background cron runs daily at 06:00 AM, calculates live 7-day database analytics, generates snapshots & emails executive reports.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-lg-auto justify-content-start justify-content-lg-end mt-2 mt-lg-0">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowReportHistory(!showReportHistory)}
                className="d-flex align-items-center fw-medium px-3 py-2"
                style={{ borderRadius: '8px', fontSize: '0.82rem', height: '38px', borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}
              >
                <History size={16} style={{ marginRight: '8px' }} />
                {showReportHistory ? 'Hide Logs' : 'View Report Logs'}
                {reportStatus?.historyLogs?.length > 0 && (
                  <span className="badge bg-secondary ms-2 rounded-pill" style={{ fontSize: '0.70rem' }}>
                    {reportStatus.historyLogs.length}
                  </span>
                )}
              </Button>

              <Button
                onClick={handleTriggerReportNow}
                disabled={triggeringReport}
                className="d-flex align-items-center text-white fw-semibold border-0 px-3 py-2"
                style={{ backgroundColor: '#C62828', borderRadius: '8px', fontSize: '0.84rem', height: '38px' }}
                title="Force execute 7-day report and email dispatch now"
              >
                {triggeringReport ? (
                  <>
                    <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} /> Generating...
                  </>
                ) : (
                  <>
                    <Send size={15} style={{ marginRight: '8px' }} /> Run 7-Day Report Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* COLLAPSIBLE HISTORY & ERROR LOGS TABLE */}
          <Collapse in={showReportHistory}>
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold text-dark small d-flex align-items-center">
                  <FileText size={15} className="text-secondary" style={{ marginRight: '8px' }} /> Recent 7-Day Report Dispatch & Error History
                </div>
                <span className="text-muted small">Auto-tracked in database</span>
              </div>

              {!reportStatus?.historyLogs || reportStatus.historyLogs.length === 0 ? (
                <div className="p-3 text-center bg-white rounded border text-muted small">
                  No execution logs recorded yet. Click "Run 7-Day Report Now" to generate the first log.
                </div>
              ) : (
                <div className="table-responsive rounded border bg-white">
                  <Table hover size="sm" className="mb-0 text-nowrap" style={{ fontSize: '0.80rem' }}>
                    <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.70rem' }}>
                      <tr>
                        <th className="py-2 px-3">Date & Time</th>
                        <th className="py-2">Report Type</th>
                        <th className="py-2">Recipient</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Metrics Summary / Snapshot</th>
                        <th className="py-2 text-end px-3">Retries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportStatus.historyLogs.map((log) => {
                        let parsedStats = null;
                        try {
                          parsedStats = typeof log.stats_summary === 'string' ? JSON.parse(log.stats_summary) : log.stats_summary;
                        } catch (e) {}

                        return (
                          <tr key={log.id}>
                            <td className="px-3 py-2 text-muted">
                              {new Date(log.created_at || log.sent_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-2 fw-medium text-dark">
                              {log.report_type === 'WEEKLY_7_DAY_DATA_REPORT' ? '7-Day Weekly Report' : log.report_type}
                            </td>
                            <td className="py-2 text-dark font-monospace">{log.recipient_email}</td>
                            <td className="py-2">
                              {log.status === 'success' ? (
                                <Badge bg="" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '0.70rem' }}>
                                  <Check size={12} className="me-1 inline" /> Sent
                                </Badge>
                              ) : (
                                <Badge bg="" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', fontSize: '0.70rem' }} title={log.error_message || 'Failed'}>
                                  <XCircle size={12} className="me-1 inline" /> Failed
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {parsedStats?.totals ? (
                                <span>
                                  <strong>{parsedStats.totals.totalEmployees}</strong> emps, <strong>{parsedStats.totals.totalPresent}</strong> attendance, <strong>₹{parsedStats.totals.totalPayrollDisbursed}</strong> disbursed
                                </span>
                              ) : log.backup_filename ? (
                                <span className="font-monospace small">{log.backup_filename}</span>
                              ) : (
                                <span className="text-muted fst-italic">Standard report snapshot</span>
                              )}
                            </td>
                            <td className="py-2 text-end px-3">
                              {log.retry_count > 0 ? (
                                <Badge bg="warning" text="dark" style={{ fontSize: '0.68rem' }}>
                                  {log.retry_count} retries
                                </Badge>
                              ) : (
                                <span className="text-muted">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Collapse>
        </Card.Body>
      </Card>

      {/* STATS OVERVIEW CARDS */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-3 d-flex align-items-center">
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#FEE2E2', 
                  color: '#DC2626', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px',
                  marginRight: '14px'
                }}
              >
                <Layers size={22} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>Total Backups</div>
                <div className="fw-bold fs-5 text-dark lh-1 mt-1">{totalSnapshots}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-3 d-flex align-items-center">
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#EFF6FF', 
                  color: '#2563EB', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px',
                  marginRight: '14px'
                }}
              >
                <Database size={22} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>Database Snapshots</div>
                <div className="fw-bold fs-5 text-dark lh-1 mt-1">{dbSnapshotsCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-3 d-flex align-items-center">
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#FEF3C7', 
                  color: '#D97706', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px',
                  marginRight: '14px'
                }}
              >
                <FileArchive size={22} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>Media Archives</div>
                <div className="fw-bold fs-5 text-dark lh-1 mt-1">{uploadsSnapshotsCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-3 d-flex align-items-center">
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  backgroundColor: '#DCFCE7', 
                  color: '#16A34A', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px',
                  marginRight: '14px'
                }}
              >
                <Clock size={22} />
              </div>
              <div className="overflow-hidden">
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>Latest Backup</div>
                <div className="fw-semibold text-dark text-truncate mt-1" style={{ fontSize: '0.85rem' }}>{latestBackupDate}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* BACKUPS DATA TABLE */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <Card.Header className="bg-white border-bottom py-3 px-3 px-md-4 d-flex justify-content-between align-items-center">
          <div className="fw-bold fs-6 text-dark d-flex align-items-center">
            <HardDrive size={18} className="text-secondary" style={{ marginRight: '8px' }} /> Available Server Snapshots & Archives
          </div>
          <Badge bg="light" text="dark" className="border px-2.5 py-1.5 fw-medium" style={{ fontSize: '0.78rem' }}>
            {backupsList.length} Files
          </Badge>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="text-muted mt-2 small">Scanning backup directory...</p>
            </div>
          ) : backupsList.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Database size={48} className="text-muted opacity-50 mb-3" />
              <h5 className="fw-semibold text-dark">No backups found</h5>
              <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
                You have not created any snapshots yet. Click "Create Backup" above to generate your first full or company database archive.
              </p>
              <Button 
                onClick={() => handleCreateDatabaseBackup()} 
                className="mt-2 text-white border-0 px-3 py-2 fw-medium" 
                style={{ backgroundColor: '#C62828', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                Create First Snapshot
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover align="middle" className="mb-0 text-nowrap" style={{ fontSize: '0.875rem' }}>
                <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.6px' }}>
                  <tr>
                    <th className="py-3 px-3 px-md-4">Filename / Identifier</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Scope / Organization</th>
                    <th className="py-3">File Size</th>
                    <th className="py-3">Created On</th>
                    <th className="py-3 text-end px-3 px-md-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backupsList.map((backup, idx) => {
                    const isDb = backup.type === 'database';
                    const isCompany = !!backup.companyName;

                    return (
                      <tr key={idx} className="border-bottom">
                        {/* Filename with dedicated, clearly-spaced icon container */}
                        <td className="px-3 px-md-4 py-3">
                          <div className="d-flex align-items-center">
                            <div 
                              className="d-flex align-items-center justify-content-center rounded flex-shrink-0" 
                              style={{ 
                                width: '38px',
                                height: '38px',
                                minWidth: '38px',
                                minHeight: '38px',
                                marginRight: '14px',
                                borderRadius: '8px',
                                backgroundColor: isDb ? '#EFF6FF' : '#FEF3C7', 
                                color: isDb ? '#2563EB' : '#D97706',
                                border: `1px solid ${isDb ? '#DBEAFE' : '#FDE68A'}`
                              }}
                            >
                              {isDb ? <Database size={18} /> : <FileArchive size={18} />}
                            </div>
                            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                              <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.84rem', wordBreak: 'break-all', marginBottom: '2px' }}>
                                {backup.filename}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                                {backup.compressed ? 'GZIP Compressed JSON' : backup.filename.endsWith('.zip') ? 'ZIP Archive' : 'Standard SQL/JSON'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td>
                          <Badge 
                            bg="" 
                            style={{ 
                              backgroundColor: isDb ? '#EFF6FF' : '#FEF3C7',
                              color: isDb ? '#1D4ED8' : '#B45309',
                              border: `1px solid ${isDb ? '#BFDBFE' : '#FDE68A'}`,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '5px 10px',
                              borderRadius: '6px'
                            }}
                          >
                            {isDb ? 'Database Snapshot' : 'Uploads ZIP'}
                          </Badge>
                        </td>

                        {/* Scope */}
                        <td>
                          {isCompany ? (
                            <div className="d-flex align-items-center text-dark fw-medium" style={{ fontSize: '0.83rem' }}>
                              <Building2 size={16} className="text-primary flex-shrink-0" style={{ marginRight: '8px' }} /> 
                              <span>{backup.companyName}</span>
                            </div>
                          ) : isDb ? (
                            <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.83rem' }}>
                              <Layers size={16} className="text-secondary flex-shrink-0" style={{ marginRight: '8px' }} /> 
                              <span>Global System (Full)</span>
                            </div>
                          ) : (
                            <span className="text-muted small">Storage Files</span>
                          )}
                        </td>

                        {/* Size */}
                        <td className="fw-medium text-dark font-monospace" style={{ fontSize: '0.82rem' }}>
                          {backup.sizeFormatted || `${(backup.sizeBytes / (1024 * 1024)).toFixed(2)} MB`}
                        </td>

                        {/* Created At */}
                        <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                          {new Date(backup.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Action Buttons */}
                        <td className="text-end px-3 px-md-4">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            {/* Download */}
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleDownloadBackup(backup.filename)}
                              className="d-flex align-items-center justify-content-center border"
                              style={{ width: '34px', height: '34px', borderRadius: '7px', color: '#1E293B', backgroundColor: '#F8FAFC' }}
                              title="Download Backup"
                            >
                              <ArrowDownToLine size={16} />
                            </Button>

                            {/* Restore (DB only) */}
                            {isDb && (
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setShowRestoreModal(true);
                                }}
                                className="d-flex align-items-center justify-content-center border"
                                style={{ width: '34px', height: '34px', borderRadius: '7px', color: '#059669', backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                                title="Restore This Snapshot"
                              >
                                <RotateCcw size={16} />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowDeleteModal(true);
                              }}
                              className="d-flex align-items-center justify-content-center border"
                              style={{ width: '34px', height: '34px', borderRadius: '7px', color: '#DC2626', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
                              title="Delete File"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* MODAL 1: COMPANY-SCOPED BACKUP SELECTION */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom py-3">
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center">
            <Building2 className="text-primary" size={20} style={{ marginRight: '10px' }} /> Create Company Scoped Backup
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
          <p className="text-muted small mb-3">
            Select a specific corporate company or employer to generate an isolated snapshot containing only their employees, payroll, and logs.
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small text-dark">Select Company / Tenant</Form.Label>
            <Form.Select 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="py-2"
              style={{ borderRadius: '8px' }}
            >
              <option value="">-- Choose Corporate Company --</option>
              {companiesList.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.company_name || comp.name || `Company #${comp.id}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top p-3">
          <Button variant="light" onClick={() => setShowCompanyModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => handleCreateDatabaseBackup(selectedCompanyId)}
            disabled={!selectedCompanyId || actionLoading}
            className="text-white fw-semibold border-0 px-3"
            style={{ backgroundColor: '#C62828', borderRadius: '8px' }}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Generate Snapshot'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL 2: UPLOAD & RESTORE */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered backdrop="static">
        <Form onSubmit={handleUploadAndRestoreSubmit}>
          <Modal.Header closeButton className="border-bottom py-3">
            <Modal.Title className="fw-bold fs-5 text-danger d-flex align-items-center">
              <Upload className="text-danger" size={20} style={{ marginRight: '10px' }} /> Upload & Restore Backup Archive
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4">
            <Alert variant="warning" className="d-flex align-items-start py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ marginRight: '10px' }} />
              <div>
                <strong>Caution:</strong> Restoring an archive will write and overwrite records in active tables. Ensure you have taken a snapshot first.
              </div>
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Select Backup File (.json.gz, .json, .sql)</Form.Label>
              <Form.Control
                type="file"
                accept=".gz,.json,.sql"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="py-2"
                style={{ borderRadius: '8px' }}
                required
              />
              <Form.Text className="text-muted small">
                Maximum file upload size allowed: 500 MB.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top p-3">
            <Button variant="light" onClick={() => setShowUploadModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!uploadFile || actionLoading}
              className="text-white fw-semibold border-0 px-3"
              style={{ backgroundColor: '#C62828', borderRadius: '8px' }}
            >
              {actionLoading ? <Spinner animation="border" size="sm" /> : 'Upload & Restore Now'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL 3: RESTORE CONFIRMATION */}
      <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom py-3">
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center">
            <RotateCcw className="text-success" size={20} style={{ marginRight: '10px' }} /> Confirm Database Restoration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4 text-center">
          <div className="mb-3 text-success">
            <RotateCcw size={48} />
          </div>
          <h5 className="fw-bold text-dark">Restore Database Snapshot?</h5>
          <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
            You are about to restore system data from snapshot file:
          </p>
          <div className="p-2.5 rounded bg-light border font-monospace text-dark mb-3 text-break" style={{ fontSize: '0.82rem' }}>
            {selectedBackup?.filename}
          </div>
          <p className="text-muted small mb-0">
            Foreign key checks will be temporarily bypassed during atomic insertion to ensure integrity.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top p-3 justify-content-center">
          <Button variant="light" onClick={() => setShowRestoreModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleRestoreSubmit}
            disabled={actionLoading}
            className="px-4 fw-semibold"
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Yes, Restore Database'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL 4: DELETE CONFIRMATION */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom py-3">
          <Modal.Title className="fw-bold fs-5 text-danger d-flex align-items-center">
            <AlertTriangle className="text-danger" size={22} style={{ marginRight: '10px' }} /> Delete Backup Snapshot
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4 text-center">
          <div className="mb-3 text-danger">
            <Trash2 size={48} />
          </div>
          <h5 className="fw-bold text-dark">Are you sure?</h5>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            You are about to delete backup file <strong className="text-break">"{selectedBackup?.filename}"</strong>. This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top p-3 justify-content-center">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSubmit}
            disabled={actionLoading}
            className="px-4"
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Yes, Delete Backup'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL 5: DIRECT EMAIL DATABASE BACKUP */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered backdrop="static">
        <Form onSubmit={handleSendEmailBackupSubmit}>
          <Modal.Header closeButton className="border-bottom py-3">
            <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center">
              <Mail className="text-primary" size={20} style={{ marginRight: '10px' }} /> Email Database Backup Snapshot
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4">
            <p className="text-muted small mb-3">
              Generate an immediate real-time database snapshot and dispatch it securely with download links to any email address.
            </p>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">
                Recipient Email Address <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="e.g. admin@kiaantechnology.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                required
                className="py-2"
                style={{ borderRadius: '8px' }}
              />
              <Form.Text className="text-muted small">
                The database backup archive link and executive report will be delivered here.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Backup Archive Type</Form.Label>
              <Form.Select
                value={emailBackupType}
                onChange={(e) => setEmailBackupType(e.target.value)}
                className="py-2"
                style={{ borderRadius: '8px' }}
              >
                <option value="database">Full Database Snapshot (.json.gz) - Global System</option>
                <option value="company">Company / Tenant Scoped Data (.json.gz)</option>
                <option value="uploads">Uploads & Storage Archive (.zip)</option>
              </Form.Select>
            </Form.Group>

            {emailBackupType === 'company' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-dark">Select Company / Employer</Form.Label>
                <Form.Select
                  value={emailCompanyId}
                  onChange={(e) => setEmailCompanyId(e.target.value)}
                  className="py-2"
                  style={{ borderRadius: '8px' }}
                  required
                >
                  <option value="">-- Choose Corporate Company --</option>
                  {companiesList.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.company_name || comp.name || `Company #${comp.id}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Notes / Message (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional notes or audit remarks for the email recipient..."
                value={emailNotes}
                onChange={(e) => setEmailNotes(e.target.value)}
                style={{ borderRadius: '8px', fontSize: '0.86rem' }}
              />
            </Form.Group>

            <Alert variant="info" className="d-flex align-items-start py-2 px-3 mb-0" style={{ fontSize: '0.80rem' }}>
              <Shield size={16} className="flex-shrink-0 mt-0.5 text-primary" style={{ marginRight: '8px' }} />
              <div>
                <strong>Secure Delivery:</strong> Backups are compressed with GZIP for optimal transmission and logged in system audit records.
              </div>
            </Alert>
          </Modal.Body>
          <Modal.Footer className="border-top p-3">
            <Button variant="light" onClick={() => setShowEmailModal(false)} disabled={sendingEmailBackup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendingEmailBackup || !emailRecipient}
              className="text-white fw-semibold border-0 px-3 d-flex align-items-center"
              style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}
            >
              {sendingEmailBackup ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Sending Snapshot...
                </>
              ) : (
                <>
                  <Send size={15} className="me-2" /> Send Backup to Email
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default SystemBackup;
