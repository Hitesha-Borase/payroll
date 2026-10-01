import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal, InputGroup, Spinner, Dropdown } from 'react-bootstrap';
import { 
  Users, UserCheck, UserMinus, ShieldAlert, Search, Plus, 
  RefreshCw, Edit, Key, Trash2, Building2, Mail, Phone, 
  CheckCircle2, XCircle, AlertTriangle, Shield, Calendar, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import SuperAdminLayout from './SuperAdminLayout';
import { superadminAPI } from '../../services/api';

const AdminManagement = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [adminsList, setAdminsList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    password: '',
    status: 'active'
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    status: 'active'
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Admins & Statistics from Backend API
  const fetchAdminsData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await superadminAPI.getAllAdmins();
      
      if (res.data?.success) {
        const rawData = res.data.data || [];
        setAdminsList(rawData);

        // Update stats from backend or calculate
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          const total = rawData.length;
          const active = rawData.filter(a => a.status === 'active').length;
          const inactive = rawData.filter(a => a.status === 'inactive').length;
          const suspended = rawData.filter(a => a.status === 'suspended' || a.status === 'blocked').length;
          setStats({ total, active, inactive, suspended });
        }
      }
    } catch (err) {
      console.error('[ADMIN_MANAGEMENT_FETCH_ERROR]', err);
      toast.error('Failed to load HR Admins list from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminsData();
  }, []);

  // Filtered list based on search term
  const filteredAdmins = adminsList.filter(admin => {
    const term = searchTerm.toLowerCase();
    const name = (admin.name || '').toLowerCase();
    const email = (admin.email || '').toLowerCase();
    const phone = (admin.phone || '').toLowerCase();
    const company = (admin.company_name || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term) || company.includes(term);
  });

  // Handle Add Admin Submit
  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.email || !addFormData.password) {
      toast.error('Name, Email, and Password are required.');
      return;
    }

    if (addFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await superadminAPI.createAdmin(addFormData);

      if (res.data?.success) {
        toast.success(res.data.message || 'HR Admin created successfully!');
        setShowAddModal(false);
        setAddFormData({
          name: '',
          email: '',
          phone: '',
          company_name: '',
          password: '',
          status: 'active'
        });
        fetchAdminsData();
      }
    } catch (err) {
      console.error('[CREATE_ADMIN_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to create HR Admin.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      company_name: admin.company_name || '',
      status: admin.status || 'active'
    });
    setShowEditModal(true);
  };

  // Handle Edit Admin Submit
  const handleEditAdminSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      setActionLoading(true);
      const res = await superadminAPI.updateAdmin(selectedAdmin.id, editFormData);

      if (res.data?.success) {
        toast.success('Admin account updated successfully!');
        setShowEditModal(false);
        fetchAdminsData();
      }
    } catch (err) {
      console.error('[UPDATE_ADMIN_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to update HR Admin.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Status Change
  const handleStatusToggle = async (admin, newStatus) => {
    try {
      toast.loading(`Updating status to ${newStatus}...`, { id: 'status-update' });
      const res = await superadminAPI.updateAdminStatus(admin.id, newStatus);
      if (res.data?.success) {
        toast.success(`Admin status changed to ${newStatus}!`, { id: 'status-update' });
        fetchAdminsData();
      }
    } catch (err) {
      console.error('[TOGGLE_STATUS_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to update admin status.', { id: 'status-update' });
    }
  };

  // Open Reset Password Modal
  const handleOpenPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setPasswordFormData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  // Handle Password Reset Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordFormData.newPassword) {
      toast.error('New password is required.');
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await superadminAPI.resetAdminPassword({
        adminId: selectedAdmin.id,
        newPassword: passwordFormData.newPassword
      });

      if (res.data?.success) {
        toast.success('Admin password reset successfully!');
        setShowPasswordModal(false);
      }
    } catch (err) {
      console.error('[RESET_PASSWORD_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  // Handle Delete Admin Submit
  const handleDeleteAdminSubmit = async () => {
    if (!selectedAdmin) return;
    try {
      setActionLoading(true);
      const res = await superadminAPI.deleteAdmin(selectedAdmin.id);
      if (res.data?.success) {
        toast.success('Admin account deleted successfully.');
        setShowDeleteModal(false);
        fetchAdminsData();
      }
    } catch (err) {
      console.error('[DELETE_ADMIN_ERROR]', err);
      toast.error(err.response?.data?.message || 'Failed to delete admin.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function for status badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success" className="px-2 py-1 px-md-3 py-md-2 text-uppercase fw-semibold" style={{ fontSize: '0.72rem', borderRadius: '6px' }}><CheckCircle2 size={12} className="me-1 inline" /> Active</Badge>;
      case 'inactive':
        return <Badge bg="secondary" className="px-2 py-1 px-md-3 py-md-2 text-uppercase fw-semibold" style={{ fontSize: '0.72rem', borderRadius: '6px' }}><XCircle size={12} className="me-1 inline" /> Inactive</Badge>;
      case 'suspended':
      case 'blocked':
        return <Badge bg="danger" className="px-2 py-1 px-md-3 py-md-2 text-uppercase fw-semibold" style={{ fontSize: '0.72rem', borderRadius: '6px' }}><ShieldAlert size={12} className="me-1 inline" /> Suspended</Badge>;
      default:
        return <Badge bg="light" className="text-dark px-2 py-1 px-md-3 py-md-2 text-uppercase fw-semibold" style={{ fontSize: '0.72rem', borderRadius: '6px' }}>{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        
        {/* HEADER SECTION */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3 mb-4 pb-3 border-bottom">
          <div>
            <h2 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: '#0F172A', letterSpacing: '-0.5px', fontSize: isMobile ? '1.4rem' : '1.8rem' }}>
              <Shield className="text-danger inline flex-shrink-0" size={isMobile ? 24 : 28} /> Admin Management
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
              Create, configure, and manage HR Admin accounts across companies.
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
            {/* SEARCH BAR */}
            <InputGroup style={{ width: '100%', maxWidth: isMobile ? '100%' : '260px' }}>
              <InputGroup.Text style={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderColor: '#E2E8F0', fontSize: '0.88rem' }}
              />
            </InputGroup>

            {/* ACTION BUTTONS (REFRESH & ADD NEW ADMIN) */}
            <div className="d-flex align-items-center gap-2">
              {/* REFRESH BUTTON */}
              <Button 
                variant="outline-secondary" 
                onClick={() => fetchAdminsData(true)}
                disabled={refreshing}
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ borderRadius: '8px', width: '42px', height: '38px' }}
                title="Refresh Data"
              >
                <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              </Button>

              {/* ADD NEW ADMIN BUTTON */}
              <Button
                onClick={() => setShowAddModal(true)}
                className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 text-white fw-medium shadow-sm flex-grow-1 flex-sm-grow-0"
                style={{ 
                  backgroundColor: '#C62828', 
                  borderColor: '#C62828', 
                  borderRadius: '8px', 
                  height: '38px', 
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={18} /> Add New Admin
              </Button>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS CARDS */}
        <Row className="g-2 g-md-3 mb-4">
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Admins</span>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: '#0F172A', fontSize: isMobile ? '1.3rem' : '1.6rem' }}>{stats.total}</h3>
                </div>
                <div className="p-2 p-md-3 rounded-circle" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <Users size={isMobile ? 20 : 24} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Active Admins</span>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: '#166534', fontSize: isMobile ? '1.3rem' : '1.6rem' }}>{stats.active}</h3>
                </div>
                <div className="p-2 p-md-3 rounded-circle" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <UserCheck size={isMobile ? 20 : 24} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Inactive Admins</span>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: '#475569', fontSize: isMobile ? '1.3rem' : '1.6rem' }}>{stats.inactive}</h3>
                </div>
                <div className="p-2 p-md-3 rounded-circle" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                  <UserMinus size={isMobile ? 20 : 24} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Suspended</span>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: '#991B1B', fontSize: isMobile ? '1.3rem' : '1.6rem' }}>{stats.suspended}</h3>
                </div>
                <div className="p-2 p-md-3 rounded-circle" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  <ShieldAlert size={isMobile ? 20 : 24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* MAIN DIRECTORY SECTION */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <Card.Header className="bg-white border-bottom py-3 px-3 px-md-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="fw-bold mb-0" style={{ color: '#0F172A', fontSize: '1rem' }}>
              Registered HR Admins Directory
            </h5>
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Showing {filteredAdmins.length} of {adminsList.length} Accounts
            </span>
          </Card.Header>

          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="danger" />
                <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.9rem' }}>Loading HR Admins from database...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-5 px-3">
                <Users size={40} className="text-muted mb-2" />
                <h6 className="fw-semibold text-dark">No HR Admins Found</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                  {searchTerm ? 'No results match your search filter.' : 'Click "Add New Admin" to register your first HR Admin account.'}
                </p>
              </div>
            ) : isMobile ? (
              /* MOBILE CARDS VIEW */
              <div className="p-3 d-flex flex-column gap-3">
                {filteredAdmins.map((admin) => (
                  <Card key={admin.id || admin.user_id} className="border shadow-none" style={{ borderRadius: '10px', borderColor: '#E2E8F0' }}>
                    <Card.Body className="p-3">
                      {/* Top Row: Avatar, Name, and Status */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                            style={{ 
                              width: '38px', 
                              height: '38px', 
                              backgroundColor: '#C62828', 
                              fontSize: '1rem',
                              flexShrink: 0
                            }}
                          >
                            {(admin.name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{admin.name || 'HR Admin'}</div>
                            <small className="text-muted">ID: #{admin.id || admin.user_id}</small>
                          </div>
                        </div>
                        <div>
                          {renderStatusBadge(admin.status)}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: '0.82rem' }}>
                        <div className="d-flex align-items-center gap-2 text-dark">
                          <Mail size={14} className="text-muted flex-shrink-0" />
                          <span className="text-truncate">{admin.email || 'N/A'}</span>
                        </div>
                        {admin.phone && (
                          <div className="d-flex align-items-center gap-2 text-muted">
                            <Phone size={14} className="text-muted flex-shrink-0" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                        <div className="d-flex align-items-center gap-2 text-muted">
                          <Building2 size={14} className="text-danger flex-shrink-0" />
                          <span className="fw-medium text-dark">{admin.company_name || 'N/A'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted">
                          <Calendar size={14} className="text-muted flex-shrink-0" />
                          <span>Joined: {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="d-flex align-items-center gap-1 px-2 py-1"
                          onClick={() => handleOpenEditModal(admin)}
                          style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                        >
                          <Edit size={13} /> Edit
                        </Button>

                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          className="d-flex align-items-center gap-1 px-2 py-1 text-dark"
                          onClick={() => handleOpenPasswordModal(admin)}
                          style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                        >
                          <Key size={13} /> Password
                        </Button>

                        <Dropdown align="end" className="d-inline">
                          <Dropdown.Toggle variant="outline-secondary" size="sm" className="px-2 py-1" style={{ fontSize: '0.78rem', borderRadius: '6px' }}>
                            <RefreshCw size={12} className="me-1 inline" /> Status
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0" style={{ fontSize: '0.85rem' }}>
                            <Dropdown.Header>Change Status</Dropdown.Header>
                            <Dropdown.Item onClick={() => handleStatusToggle(admin, 'active')} className="text-success">
                              <CheckCircle2 size={14} className="me-2 inline" /> Activate
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleStatusToggle(admin, 'inactive')} className="text-secondary">
                              <XCircle size={14} className="me-2 inline" /> Deactivate
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleStatusToggle(admin, 'suspended')} className="text-danger">
                              <ShieldAlert size={14} className="me-2 inline" /> Suspend
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>

                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="px-2 py-1"
                          onClick={() => handleOpenDeleteModal(admin)}
                          style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              /* DESKTOP TABLE VIEW */
              <div className="table-responsive">
                <Table hover align="middle" className="mb-0">
                  <thead style={{ backgroundColor: '#F8FAFC', fontSize: '0.8rem' }} className="text-uppercase text-muted border-bottom">
                    <tr>
                      <th className="ps-4 py-3">Admin Details</th>
                      <th className="py-3">Contact Info</th>
                      <th className="py-3">Company Name</th>
                      <th className="py-3">Role / Access</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Registration Date</th>
                      <th className="pe-4 py-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.9rem' }}>
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id || admin.user_id}>
                        {/* ADMIN DETAILS */}
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                backgroundColor: '#C62828', 
                                fontSize: '1.1rem',
                                flexShrink: 0
                              }}
                            >
                              {(admin.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{admin.name || 'HR Admin'}</div>
                              <small className="text-muted">ID: #{admin.id || admin.user_id}</small>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT INFO */}
                        <td className="py-3">
                          <div className="d-flex flex-column gap-1">
                            <span className="d-flex align-items-center gap-1 text-dark">
                              <Mail size={13} className="text-muted" /> {admin.email || 'N/A'}
                            </span>
                            {admin.phone && (
                              <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.82rem' }}>
                                <Phone size={13} className="text-muted" /> {admin.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* COMPANY NAME */}
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <Building2 size={16} className="text-danger" />
                            <span className="fw-medium text-dark">{admin.company_name || 'N/A'}</span>
                          </div>
                        </td>

                        {/* ROLE / ACCESS */}
                        <td className="py-3">
                          <Badge bg="light" className="text-dark border px-2 py-1" style={{ fontSize: '0.78rem' }}>
                            <Shield size={12} className="me-1 text-danger inline" /> HR Admin
                          </Badge>
                        </td>

                        {/* STATUS */}
                        <td className="py-3">
                          {renderStatusBadge(admin.status)}
                        </td>

                        {/* CREATED DATE */}
                        <td className="py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                          <div className="d-flex align-items-center gap-1">
                            <Calendar size={13} />
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="pe-4 py-3 text-end">
                          <div className="d-flex align-items-center justify-content-end gap-1">
                            {/* Edit Button */}
                            <Button 
                              variant="light" 
                              size="sm"
                              className="text-primary border-0"
                              onClick={() => handleOpenEditModal(admin)}
                              title="Edit Admin Account"
                              style={{ borderRadius: '6px' }}
                            >
                              <Edit size={16} />
                            </Button>

                            {/* Reset Password Button */}
                            <Button 
                              variant="light" 
                              size="sm"
                              className="text-warning border-0"
                              onClick={() => handleOpenPasswordModal(admin)}
                              title="Reset Password"
                              style={{ borderRadius: '6px' }}
                            >
                              <Key size={16} />
                            </Button>

                            {/* Status Toggle Dropdown */}
                            <Dropdown align="end" className="d-inline">
                              <Dropdown.Toggle variant="light" size="sm" className="border-0 px-2" style={{ borderRadius: '6px' }}>
                                <RefreshCw size={14} className="text-muted" />
                              </Dropdown.Toggle>

                              <Dropdown.Menu className="shadow-sm border-0" style={{ fontSize: '0.85rem' }}>
                                <Dropdown.Header>Change Status</Dropdown.Header>
                                <Dropdown.Item onClick={() => handleStatusToggle(admin, 'active')} className="text-success">
                                  <CheckCircle2 size={14} className="me-2 inline" /> Activate
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusToggle(admin, 'inactive')} className="text-secondary">
                                  <XCircle size={14} className="me-2 inline" /> Deactivate
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusToggle(admin, 'suspended')} className="text-danger">
                                  <ShieldAlert size={14} className="me-2 inline" /> Suspend
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>

                            {/* Delete Button */}
                            <Button 
                              variant="light" 
                              size="sm"
                              className="text-danger border-0"
                              onClick={() => handleOpenDeleteModal(admin)}
                              title="Delete Admin Account"
                              style={{ borderRadius: '6px' }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* MODAL 1: ADD NEW ADMIN */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-bottom py-3">
            <Modal.Title className="fw-bold fs-5" style={{ color: '#0F172A' }}>
              <Plus className="me-2 text-danger inline" size={22} /> Add New HR Admin
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddAdminSubmit}>
            <Modal.Body className="p-3 p-md-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Ramesh Shah"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="admin@company.com"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="+91 9876543210"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Kiaan Enterprises Pvt Ltd"
                      value={addFormData.company_name}
                      onChange={(e) => setAddFormData({ ...addFormData, company_name: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Initial Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="At least 6 characters"
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Account Status</Form.Label>
                    <Form.Select
                      value={addFormData.status}
                      onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-top p-3">
              <Button variant="light" onClick={() => setShowAddModal(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={actionLoading} className="px-4" style={{ backgroundColor: '#C62828', borderColor: '#C62828' }}>
                {actionLoading ? <Spinner animation="border" size="sm" /> : 'Create HR Admin'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* MODAL 2: EDIT ADMIN */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-bottom py-3">
            <Modal.Title className="fw-bold fs-5" style={{ color: '#0F172A' }}>
              <Edit className="me-2 text-danger inline" size={22} /> Edit Admin Account
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleEditAdminSubmit}>
            <Modal.Body className="p-3 p-md-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.company_name}
                      onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Account Status</Form.Label>
                    <Form.Select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-top p-3">
              <Button variant="light" onClick={() => setShowEditModal(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={actionLoading} className="px-4" style={{ backgroundColor: '#C62828', borderColor: '#C62828' }}>
                {actionLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* MODAL 3: RESET PASSWORD */}
        <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-bottom py-3">
            <Modal.Title className="fw-bold fs-5" style={{ color: '#0F172A' }}>
              <Key className="me-2 text-warning inline" size={22} /> Reset Admin Password
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleResetPasswordSubmit}>
            <Modal.Body className="p-3 p-md-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="p-3 mb-3 rounded border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
                <p className="mb-0 text-dark" style={{ fontSize: '0.85rem' }}>
                  Resetting password for admin: <strong>{selectedAdmin?.name}</strong> ({selectedAdmin?.email})
                </p>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>New Password *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Confirm New Password *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  required
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-top p-3">
              <Button variant="light" onClick={() => setShowPasswordModal(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="warning" disabled={actionLoading} className="px-4 text-dark fw-semibold">
                {actionLoading ? <Spinner animation="border" size="sm" /> : 'Update Password'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* MODAL 4: DELETE CONFIRMATION */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-bottom py-3">
            <Modal.Title className="fw-bold fs-5 text-danger">
              <AlertTriangle className="me-2 inline" size={22} /> Delete Admin Account
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4 text-center" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div className="mb-3 text-danger">
              <Trash2 size={48} />
            </div>
            <h5 className="fw-bold text-dark">Are you sure?</h5>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              You are about to delete HR Admin account <strong>"{selectedAdmin?.name}"</strong> ({selectedAdmin?.email}). This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer className="border-top p-3 justify-content-center">
            <Button variant="light" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAdminSubmit} disabled={actionLoading} className="px-4" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
              {actionLoading ? <Spinner animation="border" size="sm" /> : 'Yes, Delete Account'}
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </SuperAdminLayout>
  );
};

export default AdminManagement;
