import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, Col, Card, Table, Badge, Button, Form, 
  Modal, InputGroup, Spinner, Pagination 
} from 'react-bootstrap';
import { 
  Search, RefreshCw, Download, Filter, ShieldAlert, 
  Activity, Calendar, Users, Eye, Copy, Check, FileText,
  Clock, Server, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const AdminAuditLogs = () => {
  // Data States
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    uniqueUsers: 0,
    securityActions: 0,
    topActions: []
  });
  const [actionsList, setActionsList] = useState([]);

  // UI / Loading States
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copiedIp, setCopiedIp] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await adminAPI.getAuditStats();
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('[ADMIN_AUDIT_STATS_ERR]', err);
    }
  };

  // Fetch Unique Actions
  const fetchActions = async () => {
    try {
      const res = await adminAPI.getAuditActions();
      if (res.data?.success && res.data?.data) {
        setActionsList(res.data.data);
      }
    } catch (err) {
      console.error('[ADMIN_AUDIT_ACTIONS_ERR]', err);
    }
  };

  // Fetch Paginated Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: limit,
        search: searchTerm || undefined,
        action: selectedAction || undefined,
        role: selectedRole || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await adminAPI.getAuditLogs(params);
      if (res.data?.success) {
        setLogs(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('[ADMIN_AUDIT_LOGS_ERR]', err);
      toast.error('Failed to load audit logs from database.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, searchTerm, selectedAction, selectedRole, startDate, endDate]);

  useEffect(() => {
    fetchStats();
    fetchActions();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAction('');
    setSelectedRole('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Copy IP to Clipboard
  const handleCopyIp = (ip, e) => {
    e.stopPropagation();
    if (!ip) return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    toast.success(`IP ${ip} copied!`, { duration: 1500 });
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Export Filtered Logs to CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = {
        page: 1,
        limit: 1000,
        search: searchTerm || undefined,
        action: selectedAction || undefined,
        role: selectedRole || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await adminAPI.getAuditLogs(params);
      const exportData = res.data?.data || logs;

      if (!exportData || exportData.length === 0) {
        toast.error('No logs available to export.');
        return;
      }

      // Generate CSV
      const headers = ['Serial No', 'Timestamp', 'User Name', 'User Email', 'Role', 'Action', 'IP Address', 'Details'];
      const rows = exportData.map((log, idx) => [
        idx + 1,
        `"${new Date(log.created_at).toLocaleString()}"`,
        `"${(log.user_name || 'System / Admin').replace(/"/g, '""')}"`,
        `"${(log.user_email || 'N/A').replace(/"/g, '""')}"`,
        `"${(log.user_role || 'admin').toUpperCase()}"`,
        `"${log.action || ''}"`,
        `"${log.ip_address || 'N/A'}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Admin_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${exportData.length} audit records to CSV!`);
    } catch (err) {
      console.error('[ADMIN_AUDIT_EXPORT_ERROR]', err);
      toast.error('Failed to export audit logs.');
    } finally {
      setExporting(false);
    }
  };

  // Action Badge Color Helper
  const getActionBadge = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('DROP')) {
      return <Badge bg="danger" className="px-2 py-1 text-uppercase">{action}</Badge>;
    }
    if (act.includes('CREATE') || act.includes('INSERT') || act.includes('ADD') || act.includes('REGISTER')) {
      return <Badge bg="success" className="px-2 py-1 text-uppercase">{action}</Badge>;
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY') || act.includes('STATUS')) {
      return <Badge bg="primary" className="px-2 py-1 text-uppercase">{action}</Badge>;
    }
    if (act.includes('RESET') || act.includes('PASSWORD') || act.includes('SECURITY')) {
      return <Badge bg="warning" text="dark" className="px-2 py-1 text-uppercase">{action}</Badge>;
    }
    if (act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('AUTH')) {
      return <Badge bg="info" className="px-2 py-1 text-uppercase">{action}</Badge>;
    }
    return <Badge bg="secondary" className="px-2 py-1 text-uppercase">{action}</Badge>;
  };

  // Format Date Helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return (
      <div>
        <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
          {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 p-sm-3 p-md-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* Header Section */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3 mb-md-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>
            <Activity className="text-danger flex-shrink-0" size={26} style={{ color: '#C62828' }} />
            Audit Logs
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Live audit trail, user activities, and security events across your organization.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-end">
          <Button 
            variant="outline-secondary" 
            size="sm"
            className="d-flex align-items-center gap-1 gap-sm-2 shadow-sm bg-white flex-fill flex-sm-grow-0 justify-content-center py-2 px-3"
            onClick={() => { fetchLogs(); fetchStats(); fetchActions(); toast.success('Audit logs refreshed'); }}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spinner-border spinner-border-sm border-0' : ''} />
            <span>Refresh</span>
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            className="d-flex align-items-center gap-1 gap-sm-2 shadow-sm flex-fill flex-sm-grow-0 justify-content-center py-2 px-3"
            style={{ backgroundColor: '#C62828', borderColor: '#C62828' }}
            onClick={handleExportCSV}
            disabled={exporting || totalRecords === 0}
          >
            <Download size={15} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </Button>
        </div>
      </div>

      {/* Top KPI Summary Metrics */}
      <Row className="g-2 g-md-3 mb-3 mb-md-4">
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #3b82f6' }}>
            <Card.Body className="d-flex align-items-center justify-content-between p-2 p-sm-3">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.3px' }}>
                  Total Logs
                </div>
                <h4 className="fw-bold text-dark mt-1 mb-0" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.4rem)' }}>
                  {stats.totalLogs.toLocaleString()}
                </h4>
              </div>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                style={{ backgroundColor: '#eff6ff', color: '#2563eb', width: '38px', height: '38px' }}
              >
                <FileText size={18} style={{ color: '#2563eb' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <Card.Body className="d-flex align-items-center justify-content-between p-2 p-sm-3">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.3px' }}>
                  Today's Events
                </div>
                <h4 className="fw-bold text-success mt-1 mb-0" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.4rem)' }}>
                  {stats.todayLogs.toLocaleString()}
                </h4>
              </div>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                style={{ backgroundColor: '#ecfdf5', color: '#10b981', width: '38px', height: '38px' }}
              >
                <Clock size={18} style={{ color: '#10b981' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <Card.Body className="d-flex align-items-center justify-content-between p-2 p-sm-3">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.3px' }}>
                  Active Users
                </div>
                <h4 className="fw-bold mt-1 mb-0" style={{ color: '#7c3aed', fontSize: 'clamp(1rem, 3.5vw, 1.4rem)' }}>
                  {stats.uniqueUsers.toLocaleString()}
                </h4>
              </div>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', width: '38px', height: '38px' }}
              >
                <Users size={18} style={{ color: '#7c3aed' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <Card.Body className="d-flex align-items-center justify-content-between p-2 p-sm-3">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.3px' }}>
                  Security Events
                </div>
                <h4 className="fw-bold text-warning mt-1 mb-0" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.4rem)' }}>
                  {stats.securityActions.toLocaleString()}
                </h4>
              </div>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                style={{ backgroundColor: '#fef3c7', color: '#f59e0b', width: '38px', height: '38px' }}
              >
                <ShieldAlert size={18} style={{ color: '#f59e0b' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Panel */}
      <Card className="border-0 shadow-sm rounded-3 mb-3 mb-md-4">
        <Card.Body className="p-3">
          <Row className="g-2 g-md-3">
            {/* Search Bar */}
            <Col xs={12} md={4}>
              <Form.Label className="fw-semibold text-muted small mb-1">Search Logs</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0 text-muted">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search user, action, IP, details..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="border-start-0 ps-0 shadow-none"
                />
              </InputGroup>
            </Col>

            {/* Action Filter */}
            <Col xs={6} sm={6} md={2}>
              <Form.Label className="fw-semibold text-muted small mb-1">Action</Form.Label>
              <Form.Select 
                size="sm"
                value={selectedAction} 
                onChange={(e) => { setSelectedAction(e.target.value); setCurrentPage(1); }}
                className="shadow-none"
              >
                <option value="">All Actions</option>
                {actionsList.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Role Filter */}
            <Col xs={6} sm={6} md={2}>
              <Form.Label className="fw-semibold text-muted small mb-1">Role</Form.Label>
              <Form.Select 
                size="sm"
                value={selectedRole} 
                onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                className="shadow-none"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employer">Employer</option>
                <option value="employee">Employee</option>
                <option value="jobseeker">JobSeeker</option>
                <option value="vendor">Vendor</option>
              </Form.Select>
            </Col>

            {/* Date From */}
            <Col xs={6} sm={6} md={2}>
              <Form.Label className="fw-semibold text-muted small mb-1">From Date</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="shadow-none"
              />
            </Col>

            {/* Date To */}
            <Col xs={6} sm={6} md={2}>
              <Form.Label className="fw-semibold text-muted small mb-1">To Date</Form.Label>
              <div className="d-flex gap-1">
                <Form.Control
                  size="sm"
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="shadow-none"
                />
                {(searchTerm || selectedAction || selectedRole || startDate || endDate) && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    title="Reset Filters"
                    onClick={handleResetFilters}
                    className="px-2"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Audit Logs Card */}
      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
        <Card.Header className="bg-white border-bottom py-2 py-sm-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="fw-bold text-dark d-flex align-items-center gap-2">
            <Server size={17} className="text-danger" style={{ color: '#C62828' }} />
            <span style={{ fontSize: '0.95rem' }}>Activity Trail</span>
            <Badge bg="light" text="dark" className="border ms-1 ms-sm-2" style={{ fontSize: '0.75rem' }}>
              {totalRecords} Records
            </Badge>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Show:</span>
            <Form.Select 
              size="sm" 
              style={{ width: '70px', fontSize: '0.8rem' }} 
              value={limit} 
              onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
              className="shadow-none py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
          </div>
        </Card.Header>

        {/* 1. DESKTOP / TABLET TABLE VIEW (Visible on >= 768px) */}
        <div className="table-responsive d-none d-md-block">
          <Table hover className="align-middle mb-0 text-nowrap">
            <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              <tr>
                <th style={{ width: '60px' }} className="ps-4">#</th>
                <th style={{ width: '150px' }}>Timestamp</th>
                <th style={{ width: '220px' }}>Actor / User</th>
                <th style={{ width: '180px' }}>Action</th>
                <th>Details</th>
                <th style={{ width: '150px' }}>IP Address</th>
                <th style={{ width: '80px' }} className="text-center pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <Spinner animation="border" variant="danger" className="mb-2" />
                    <div className="text-muted small">Loading system audit records...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="p-3">
                      <AlertTriangle size={36} className="text-muted mb-2 opacity-50" />
                      <h6 className="fw-bold text-dark mb-1">No Audit Logs Found</h6>
                      <p className="text-muted small mb-3">
                        No activity matching your selected filter criteria was found in the database.
                      </p>
                      {(searchTerm || selectedAction || selectedRole || startDate || endDate) && (
                        <Button variant="outline-danger" size="sm" onClick={handleResetFilters}>
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const serialNumber = ((currentPage - 1) * limit) + index + 1;
                  return (
                    <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedLog(log); setShowModal(true); }}>
                      <td className="ps-4 fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>
                        #{serialNumber}
                      </td>

                      <td>
                        {formatDateTime(log.created_at)}
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              fontSize: '0.8rem',
                              backgroundColor: '#334155'
                            }}
                          >
                            {(log.user_name ? log.user_name.charAt(0).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                              {log.user_name || 'Admin User'}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {log.user_email || 'admin@example.com'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {getActionBadge(log.action)}
                      </td>

                      <td>
                        <div 
                          className="text-dark text-truncate" 
                          style={{ maxWidth: '380px', fontSize: '0.85rem' }} 
                          title={log.details}
                        >
                          {log.details || <span className="text-muted fst-italic">No additional details recorded</span>}
                        </div>
                      </td>

                      <td>
                        {log.ip_address ? (
                          <div 
                            className="d-inline-flex align-items-center gap-1 px-2 py-1 bg-light border rounded text-muted font-monospace"
                            style={{ fontSize: '0.75rem' }}
                            onClick={(e) => handleCopyIp(log.ip_address, e)}
                            title="Click to copy IP"
                          >
                            <span>{log.ip_address}</span>
                            {copiedIp === log.ip_address ? (
                              <Check size={12} className="text-success" />
                            ) : (
                              <Copy size={12} className="text-muted opacity-75" />
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small">N/A</span>
                        )}
                      </td>

                      <td className="text-center pe-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="light"
                          size="sm"
                          className="border text-primary shadow-sm"
                          onClick={() => { setSelectedLog(log); setShowModal(true); }}
                          title="View Log Details"
                        >
                          <Eye size={15} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* 2. MOBILE CARD FEED VIEW (Visible on < 768px) */}
        <div className="d-md-none p-2 p-sm-3 bg-light">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" className="mb-2" />
              <div className="text-muted small">Loading records...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-4 bg-white rounded-3 p-3 border">
              <AlertTriangle size={32} className="text-muted mb-2 opacity-50" />
              <h6 className="fw-bold text-dark mb-1">No Audit Logs Found</h6>
              <p className="text-muted small mb-2">No activity matching filter criteria.</p>
              {(searchTerm || selectedAction || selectedRole || startDate || endDate) && (
                <Button variant="outline-danger" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {logs.map((log, index) => {
                const serialNumber = ((currentPage - 1) * limit) + index + 1;
                const logDate = log.created_at ? new Date(log.created_at) : new Date();

                return (
                  <Card 
                    key={log.id} 
                    className="border-0 shadow-sm rounded-3"
                    style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                    onClick={() => { setSelectedLog(log); setShowModal(true); }}
                  >
                    <Card.Body className="p-3">
                      {/* Top Row: #ID + Action Badge + Timestamp */}
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.75rem' }}>
                            #{serialNumber}
                          </span>
                          {getActionBadge(log.action)}
                        </div>
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          {logDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Middle: User info */}
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                          style={{ width: '28px', height: '28px', fontSize: '0.75rem', backgroundColor: '#475569' }}
                        >
                          {(log.user_name ? log.user_name.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className="text-truncate">
                          <span className="fw-bold text-dark small me-1">{log.user_name || 'Admin User'}</span>
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>({log.user_email || 'admin@example.com'})</span>
                        </div>
                      </div>

                      {/* Details text */}
                      {log.details && (
                        <p className="text-secondary small mb-2 text-truncate" style={{ fontSize: '0.8rem', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', whiteSpace: 'normal' }}>
                          {log.details}
                        </p>
                      )}

                      {/* Bottom Row: IP + View Details Button */}
                      <div className="d-flex justify-content-between align-items-center pt-2 mt-1 border-top">
                        {log.ip_address ? (
                          <span 
                            className="badge bg-light text-muted border font-monospace py-1 px-2"
                            style={{ fontSize: '0.7rem' }}
                            onClick={(e) => handleCopyIp(log.ip_address, e)}
                          >
                            IP: {log.ip_address}
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>IP: Local</span>
                        )}

                        <Button 
                          variant="light" 
                          size="sm" 
                          className="border text-primary py-0 px-2 d-flex align-items-center gap-1 shadow-sm"
                          style={{ fontSize: '0.75rem', height: '26px' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedLog(log); setShowModal(true); }}
                        >
                          <Eye size={12} /> Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <Card.Footer className="bg-white border-top py-2 py-sm-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <div className="text-muted small text-center text-sm-start" style={{ fontSize: '0.8rem' }}>
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} entries
            </div>
            <Pagination size="sm" className="mb-0 flex-wrap justify-content-center">
              <Pagination.Prev 
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              />
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }

                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}
              <Pagination.Next 
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Detailed View Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        centered 
        size="lg"
      >
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
            <FileText size={20} className="text-danger" />
            Audit Log Event Details (ID #{selectedLog?.id})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
          {selectedLog && (
            <div>
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="text-muted small fw-semibold text-uppercase mb-1">Actor / User Information</div>
                    <div className="fw-bold text-dark">{selectedLog.user_name || 'System / Admin'}</div>
                    <div className="text-muted small">{selectedLog.user_email || 'No email associated'}</div>
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <span className="small text-muted">Role:</span>
                      <Badge bg="secondary" className="text-uppercase" style={{ fontSize: '0.7rem' }}>
                        {selectedLog.user_role || 'ADMIN'}
                      </Badge>
                      {selectedLog.user_id && (
                        <span className="text-muted small font-monospace">User ID: #{selectedLog.user_id}</span>
                      )}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="text-muted small fw-semibold text-uppercase mb-1">Event Metadata</div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted small">Action:</span>
                      <div>{getActionBadge(selectedLog.action)}</div>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted small">Timestamp:</span>
                      <span className="fw-semibold small">{new Date(selectedLog.created_at).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted small">IP Address:</span>
                      <span className="font-monospace small">{selectedLog.ip_address || 'N/A'}</span>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="mb-2">
                <div className="fw-semibold text-dark mb-2">Activity Description / Details:</div>
                <div 
                  className="p-3 rounded-3 bg-dark text-white font-monospace"
                  style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' }}
                >
                  {selectedLog.details || 'No additional payload or details recorded for this action.'}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminAuditLogs;
