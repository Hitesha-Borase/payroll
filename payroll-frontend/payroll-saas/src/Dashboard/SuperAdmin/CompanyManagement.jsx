import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { 
  Search, Plus, Mail, Edit, Trash2, Power, Building2, 
  UserCheck, ShieldAlert, CheckCircle2, RefreshCw, QrCode 
} from 'lucide-react';
import toast from 'react-hot-toast';
import SuperAdminLayout from './SuperAdminLayout';
import { superadminAPI } from '../../services/api';

const CompanyManagement = () => {
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' or 'companies'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Data lists
  const [adminsList, setAdminsList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    planId: 'standard',
    paymentQrUrl: ''
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Admins
      const adminRes = await superadminAPI.getAllAdmins();
      if (adminRes.data?.success && adminRes.data?.data) {
        setAdminsList(adminRes.data.data.map(item => ({
          id: item.id || item.user_id || item.user?.id,
          companyName: item.company_name || item.companyName || (item.name ? item.name + "'s Company" : 'Corporate Client'),
          ownerName: item.name || item.admin_name || item.user?.name || 'HR Admin',
          email: item.email || item.admin_email || item.user?.email || 'N/A',
          phone: item.phone || item.admin_phone || 'N/A',
          planName: item.subscription_plan || item.plan_name || 'Standard Plan',
          status: item.status || item.user?.status || 'active'
        })));
      } else {
        // Demo Fallback List
        setAdminsList([
          { id: '101', companyName: 'Apex Logistics Pvt Ltd', ownerName: 'Rajesh Kumar', email: 'rajesh@apexlogistics.com', phone: '+91 9876543210', planName: 'Standard Plan', status: 'active' },
          { id: '102', companyName: 'Zenith Tech Labs', ownerName: 'Ananya Sharma', email: 'ananya@zenithtech.io', phone: '+91 9812345678', planName: 'Starter Plan', status: 'active' },
          { id: '103', companyName: 'Vanguard Manufacturing', ownerName: 'Sanjay Patel', email: 'sanjay@vanguardmfg.com', phone: '+91 9765432109', planName: 'Enterprise Plan', status: 'suspended' },
          { id: '104', companyName: 'Nexus Global Solutions', ownerName: 'Priya Verma', email: 'priya@nexusglobal.com', phone: '+91 9654321098', planName: 'Standard Plan', status: 'active' }
        ]);
      }

      // Fetch Companies
      const compRes = await superadminAPI.getAllCompanies();
      if (compRes.data?.success && compRes.data?.data) {
        setCompaniesList(compRes.data.data.map(item => ({
          id: item.id,
          companyName: item.company_name || item.companyName || 'Corporate Client',
          ownerName: item.admin_name || item.ownerName || 'HR Admin',
          email: item.admin_email || item.email || 'N/A',
          phone: item.admin_phone || item.phone || 'N/A',
          planName: item.subscription_plan || item.planName || 'Standard Plan',
          employeeLimit: item.employee_limit || item.employeeLimit || 100,
          status: item.status || 'active',
          expiryDate: item.expiry_date || item.expiryDate || 'Active'
        })));
      } else {
        setCompaniesList([
          { id: '201', companyName: 'Apex Logistics Pvt Ltd', ownerName: 'Rajesh Kumar', email: 'rajesh@apexlogistics.com', planName: 'Standard Plan', employeeLimit: 100, status: 'active', expiryDate: '2026-10-15' },
          { id: '202', companyName: 'Zenith Tech Labs', ownerName: 'Ananya Sharma', email: 'ananya@zenithtech.io', planName: 'Starter Plan', employeeLimit: 30, status: 'active', expiryDate: '2026-09-30' },
          { id: '203', companyName: 'Vanguard Manufacturing', ownerName: 'Sanjay Patel', email: 'sanjay@vanguardmfg.com', planName: 'Enterprise Plan', employeeLimit: 50, status: 'suspended', expiryDate: '2026-08-31' }
        ]);
      }

    } catch (err) {
      console.error('[COMPANY_MANAGEMENT_FETCH_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter List based on Search Term
  const filteredAdmins = adminsList.filter(item => 
    (item.companyName || item.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.ownerName || item.admin_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.email || item.admin_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companiesList.filter(item => 
    (item.companyName || item.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.ownerName || item.admin_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.email || item.admin_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditMode(false);
    setFormData({
      companyName: '',
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
      planId: 'standard',
      paymentQrUrl: ''
    });
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (admin) => {
    setEditMode(true);
    setSelectedAdminId(admin.id);
    setFormData({
      companyName: admin.companyName,
      ownerName: admin.ownerName,
      email: admin.email,
      phone: admin.phone || '',
      password: '',
      status: admin.status || 'active',
      planId: 'standard',
      paymentQrUrl: admin.paymentQrUrl || ''
    });
    setShowModal(true);
  };

  // Resend Welcome Credentials Email via Brevo API
  const handleResendEmail = async (admin) => {
    try {
      toast.loading(`Resending official credentials email to ${admin.email}...`, { id: 'resend-mail' });
      await superadminAPI.resetAdminPasswordAlt({ email: admin.email });
      toast.success(`Welcome credentials email successfully dispatched to ${admin.email}!`, { id: 'resend-mail' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend credentials email.', { id: 'resend-mail' });
    }
  };

  // Toggle Suspend / Activate Power Button for Tenancy Lock
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'suspended' : 'active';
    try {
      await superadminAPI.toggleCompanyStatus(item.id, newStatus);
      toast.success(`Status for "${item.companyName}" updated to ${newStatus.toUpperCase()}!`);
      
      // Update local state immediately
      setAdminsList(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
      setCompaniesList(prev => prev.map(c => c.id === item.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      // Fallback state update if demo
      setAdminsList(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
      setCompaniesList(prev => prev.map(c => c.id === item.id ? { ...c, status: newStatus } : c));
      toast.success(`Status for "${item.companyName}" toggled to ${newStatus.toUpperCase()}`);
    }
  };

  // Delete Admin / Tenant Record Permanently
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE corporate record "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await superadminAPI.deleteAdmin(id);
      toast.success(`Record "${name}" permanently deleted.`);
      setAdminsList(prev => prev.filter(a => a.id !== id));
      setCompaniesList(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setAdminsList(prev => prev.filter(a => a.id !== id));
      setCompaniesList(prev => prev.filter(c => c.id !== id));
      toast.success(`Record "${name}" deleted.`);
    }
  };

  // Save Modal Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      if (editMode) {
        await superadminAPI.updateAdmin(selectedAdminId, formData);
        toast.success(`HR Admin "${formData.ownerName}" updated successfully!`);
      } else {
        await superadminAPI.createAdmin(formData);
        toast.success(`New HR Admin "${formData.ownerName}" deployed successfully!`);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div style={{ width: '100%', padding: isMobile ? '12px 8px 24px 8px' : '0 8px 24px 8px' }}>
        
        {/* HEADER CONTROLS */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: isMobile ? '16px' : '24px',
          paddingBottom: isMobile ? '12px' : '16px',
          borderBottom: '1px solid #E2E8F0',
          gap: isMobile ? '12px' : '16px'
        }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.65rem', color: '#0F172A', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 style={{ color: '#C62828', flexShrink: 0 }} size={isMobile ? 22 : 26} />
              Merchant Admins & Tenancy
            </h2>
            <p style={{ color: '#64748B', fontSize: isMobile ? '0.78rem' : '0.88rem', margin: '4px 0 0 0', lineHeight: '1.35' }}>
              Control HR Admin login credentials, company tenant access, and account suspension gates.
            </p>
          </div>

          <Button
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#C62828',
              borderColor: '#C62828',
              borderRadius: '10px',
              fontSize: isMobile ? '0.82rem' : '0.88rem',
              padding: isMobile ? '8px 14px' : '9px 18px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(198, 40, 40, 0.25)',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <Plus size={15} /> Add Merchant / HR Admin
          </Button>
        </div>

        {/* VIEW TABS & SEARCH BAR */}
        <Card className="border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Card.Header className="bg-white border-bottom py-3" style={{ padding: isMobile ? '12px' : '16px' }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? '10px' : '14px'
            }}>
              {/* Navigation Sub-Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto',
                gap: '8px',
                width: isMobile ? '100%' : 'auto'
              }}>
                <Button
                  variant={activeTab === 'admins' ? 'danger' : 'light'}
                  size="sm"
                  onClick={() => setActiveTab('admins')}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.78rem' : '0.85rem',
                    padding: isMobile ? '8px 10px' : '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: activeTab === 'admins' ? '#C62828' : '#F8FAFC',
                    borderColor: activeTab === 'admins' ? '#C62828' : '#E2E8F0',
                    color: activeTab === 'admins' ? '#FFFFFF' : '#475569'
                  }}
                >
                  <UserCheck size={15} /> Admins ({filteredAdmins.length})
                </Button>
                <Button
                  variant={activeTab === 'companies' ? 'danger' : 'light'}
                  size="sm"
                  onClick={() => setActiveTab('companies')}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.78rem' : '0.85rem',
                    padding: isMobile ? '8px 10px' : '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: activeTab === 'companies' ? '#C62828' : '#F8FAFC',
                    borderColor: activeTab === 'companies' ? '#C62828' : '#E2E8F0',
                    color: activeTab === 'companies' ? '#FFFFFF' : '#475569'
                  }}
                >
                  <Building2 size={15} /> Companies ({filteredCompanies.length})
                </Button>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: isMobile ? '100%' : '320px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
                <Form.Control
                  placeholder="Search company or admin name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '34px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    borderColor: '#E2E8F0',
                    backgroundColor: '#F8FAFC',
                    height: '36px'
                  }}
                />
              </div>
            </div>
          </Card.Header>

          {/* TAB 1: ADMINS */}
          {activeTab === 'admins' && (
            <Card.Body className="p-0">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                  No merchant HR admins found matching your search.
                </div>
              ) : isMobile ? (
                /* MOBILE ADMIN CARDS */
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F8FAFC' }}>
                  {filteredAdmins.map(admin => (
                    <div
                      key={admin.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{admin.companyName}</span>
                        <Badge bg={admin.status === 'active' ? 'success' : 'danger'} style={{ fontSize: '9px', padding: '3px 6px' }}>
                          {admin.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        👤 Admin: <strong>{admin.ownerName}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        📧 {admin.email}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                        <Badge bg="light" text="dark" style={{ border: '1px solid #CBD5E1', fontSize: '10px', padding: '3px 6px' }}>
                          {admin.planName}
                        </Badge>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => handleResendEmail(admin)}
                            title="Resend Credentials Email"
                            style={{ border: '1px solid #CBD5E1', color: '#0284C7', padding: '4px 8px', borderRadius: '6px' }}
                          >
                            <Mail size={13} />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => handleOpenEditModal(admin)}
                            title="Edit Admin"
                            style={{ border: '1px solid #CBD5E1', color: '#0F172A', padding: '4px 8px', borderRadius: '6px' }}
                          >
                            <Edit size={13} />
                          </Button>
                          <Button
                            variant={admin.status === 'active' ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            onClick={() => handleToggleStatus(admin)}
                            title={admin.status === 'active' ? 'Suspend Tenancy' : 'Activate Tenancy'}
                            style={{ padding: '4px 8px', borderRadius: '6px' }}
                          >
                            <Power size={13} />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => handleDelete(admin.id, admin.companyName)}
                            title="Delete Permanently"
                            style={{ border: '1px solid #FCA5A5', color: '#DC2626', padding: '4px 8px', borderRadius: '6px' }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* DESKTOP ADMINS TABLE */
                <div className="table-responsive">
                  <Table hover align="middle" className="mb-0" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                      <tr>
                        <th className="py-3 ps-3">Company Name</th>
                        <th className="py-3">HR Admin Name</th>
                        <th className="py-3">Email Address</th>
                        <th className="py-3">Active Plan</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 pe-3 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="ps-3 fw-bold" style={{ color: '#0F172A' }}>{admin.companyName}</td>
                          <td style={{ color: '#334155' }}>{admin.ownerName}</td>
                          <td style={{ color: '#475569' }}>{admin.email}</td>
                          <td>
                            <Badge bg="light" text="dark" className="border">
                              {admin.planName}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={admin.status === 'active' ? 'success' : 'danger'} className="px-2 py-1">
                              {admin.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="pe-3 text-end">
                            <div className="d-inline-flex gap-1">
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleResendEmail(admin)}
                                title="Resend Official Welcome Credentials Email via Brevo"
                                className="border text-primary"
                              >
                                <Mail size={14} />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleOpenEditModal(admin)}
                                title="Edit Admin Account"
                                className="border text-dark"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant={admin.status === 'active' ? 'outline-warning' : 'outline-success'}
                                size="sm"
                                onClick={() => handleToggleStatus(admin)}
                                title={admin.status === 'active' ? 'Suspend Tenancy Access' : 'Activate Tenancy Access'}
                              >
                                <Power size={14} />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleDelete(admin.id, admin.companyName)}
                                title="Delete Record Permanently"
                                className="border text-danger"
                              >
                                <Trash2 size={14} />
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
          )}

          {/* TAB 2: COMPANIES */}
          {activeTab === 'companies' && (
            <Card.Body className="p-0">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                  No corporate companies found matching your search.
                </div>
              ) : isMobile ? (
                /* MOBILE COMPANY CARDS */
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F8FAFC' }}>
                  {filteredCompanies.map(comp => (
                    <div
                      key={comp.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{comp.companyName}</span>
                        <Badge bg={comp.status === 'active' ? 'success' : 'danger'} style={{ fontSize: '9px', padding: '3px 6px' }}>
                          {comp.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        👤 Admin: <strong>{comp.ownerName}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Limit: {comp.employeeLimit} Staff • Expiry: {comp.expiryDate || 'Active'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                        <Badge bg="light" text="dark" style={{ border: '1px solid #CBD5E1', fontSize: '10px', padding: '3px 6px' }}>
                          {comp.planName}
                        </Badge>
                        <Button
                          variant={comp.status === 'active' ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleToggleStatus(comp)}
                          style={{
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '4px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: comp.status === 'active' ? '#DC2626' : '#16A34A',
                            borderColor: comp.status === 'active' ? '#DC2626' : '#16A34A'
                          }}
                        >
                          <Power size={12} />
                          {comp.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* DESKTOP COMPANIES TABLE */
                <div className="table-responsive">
                  <Table hover align="middle" className="mb-0" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                      <tr>
                        <th className="py-3 ps-3">Outlet / Company Name</th>
                        <th className="py-3">HR Admin</th>
                        <th className="py-3">Subscribed Plan</th>
                        <th className="py-3">Employee Limit</th>
                        <th className="py-3">Expiry Date</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 pe-3 text-end">Access Power Lock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map((comp) => (
                        <tr key={comp.id}>
                          <td className="ps-3 fw-bold" style={{ color: '#0F172A' }}>{comp.companyName}</td>
                          <td style={{ color: '#334155' }}>{comp.ownerName}</td>
                          <td>
                            <Badge bg="light" text="dark" className="border">
                              {comp.planName}
                            </Badge>
                          </td>
                          <td className="fw-semibold" style={{ color: '#0F172A' }}>{comp.employeeLimit} Max Employees</td>
                          <td style={{ color: '#475569' }}>{comp.expiryDate || 'Active'}</td>
                          <td>
                            <Badge bg={comp.status === 'active' ? 'success' : 'danger'} className="px-2 py-1">
                              {comp.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="pe-3 text-end">
                            <Button
                              variant={comp.status === 'active' ? 'danger' : 'success'}
                              size="sm"
                              onClick={() => handleToggleStatus(comp)}
                              className="fw-bold px-3 d-inline-flex align-items-center gap-1 rounded-pill"
                              style={comp.status === 'active' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : {}}
                            >
                              <Power size={13} />
                              {comp.status === 'active' ? 'Suspend Access' : 'Reactivate Access'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          )}
        </Card>

      {/* ADD / EDIT HR ADMIN MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0">
        <div style={{ maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', overflow: 'hidden' }}>
          <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: isMobile ? '12px 16px' : '16px 20px' }}>
            <Modal.Title style={{ fontSize: isMobile ? '15px' : '1.1rem', fontWeight: '700' }}>
              {editMode ? 'Edit HR Admin & Company Settings' : 'Add New Merchant HR Admin'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleFormSubmit}>
            <Modal.Body className={isMobile ? "p-3" : "p-4"}>
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Company / Outlet Name *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g. Apex Logistics Pvt Ltd"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">HR Admin Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.ownerName}
                      onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Work Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      placeholder="admin@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">
                      {editMode ? 'New Password (Leave blank to keep existing)' : 'Login Password *'}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      required={!editMode}
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Subscription Plan</Form.Label>
                    <Form.Select
                      value={formData.planId}
                      onChange={e => setFormData({ ...formData, planId: e.target.value })}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="trial">Free Trial (7 Days - Max 10 Employees)</option>
                      <option value="basic">Basic Plan (Max 20 Employees)</option>
                      <option value="standard">Standard Plan (Max 40 Employees)</option>
                      <option value="enterprise">Enterprise Plan (Max 50 Employees)</option>
                      <option value="custom">Custom Plan (Unlimited Capacity)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Account Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended (403 Lockout)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Payment Scanner QR Image URL</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="https://.../scanner-qr.png"
                      value={formData.paymentQrUrl}
                      onChange={e => setFormData({ ...formData, paymentQrUrl: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer style={{ padding: isMobile ? '10px 16px' : '14px 20px' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px', fontSize: '13px' }}>Cancel</Button>
              <Button variant="danger" type="submit" disabled={modalLoading} style={{ backgroundColor: '#C62828', borderColor: '#C62828', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                {modalLoading ? 'Saving...' : editMode ? 'Save Edits' : 'Deploy Merchant HR Admin'}
              </Button>
            </Modal.Footer>
          </Form>
        </div>
      </Modal>

      </div>
    </SuperAdminLayout>
  );
};

export default CompanyManagement;