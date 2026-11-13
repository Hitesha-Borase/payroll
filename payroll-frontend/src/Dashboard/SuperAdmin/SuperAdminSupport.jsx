import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge, Table, Modal, Spinner, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';
import SuperAdminLayout from './SuperAdminLayout';
import { superadminAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { 
  Search, 
  RefreshCw, 
  Plus, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Lock, 
  Building2, 
  Clock, 
  ChevronRight,
  X,
  FileText,
  LifeBuoy
} from 'lucide-react';

const SuperAdminSupport = () => {
  const { user } = useAuth();
  const api = user?.role === 'admin' ? adminAPI : superadminAPI;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Selected ticket for side drawer / detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [createForm, setCreateForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    subject: '',
    category: 'General',
    priority: 'Normal',
    message: ''
  });

  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, JPEG, GIF, WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB.');
        return;
      }
      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
      setAttachmentPreview(null);
    }
    const inputEl = document.getElementById('ticket-image-upload');
    if (inputEl) inputEl.value = '';
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    handleRemoveFile();
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Fetch Live Tickets from MySQL Backend
  const fetchTickets = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const targetApi = (user?.role === 'admin' ? adminAPI : superadminAPI);
      const res = await targetApi.getAllTickets();
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const formatted = res.data.data.map(t => ({
          id: t.ticket_number || `PAY-TKT-${t.id}`,
          rawId: t.id,
          subject: t.subject,
          company_name: t.company_name || 'Corporate Tenant',
          contact_name: t.contact_name || 'HR Admin',
          contact_email: t.contact_email || 'hr@company.com',
          category: t.category || 'General',
          priority: t.priority || 'Normal',
          status: t.status || 'Open',
          created_at: t.created_at || new Date().toISOString(),
          messages: Array.isArray(t.messages) ? t.messages.map(m => ({
            id: m.id,
            sender: m.sender_name || (m.role === 'staff' ? (m.is_internal ? 'Super Admin (Internal Note)' : 'Super Admin (Kiaan Support)') : 'HR Admin'),
            role: m.role,
            message: m.message,
            attachment_url: m.attachment_url,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
            is_internal: Boolean(m.is_internal)
          })) : []
        }));
        setTickets(formatted);

        // Update selected ticket if currently open
        if (selectedTicket) {
          const updated = formatted.find(item => item.id === selectedTicket.id || item.rawId === selectedTicket.rawId);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to load tickets from server:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reply Templates
  const templates = [
    'We are currently investigating your ticket and will update you shortly.',
    'Please verify your tax configuration settings under HR Admin > Tax Setup.',
    'Your subscription upgrade request has been approved and activated.',
    'Please re-authenticate your biometric API credentials.'
  ];

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Please enter a message or internal note.');
      return;
    }

    if (!selectedTicket) return;
    const ticketIdToUse = selectedTicket.rawId || selectedTicket.id;
    const finalMessage = replyText.trim() + (attachmentName ? `\n[Attached File: ${attachmentName}]` : '');

    try {
      await api.replyTicket(ticketIdToUse, {
        message: finalMessage,
        isInternal: isInternalNote
      });
      toast.success(isInternalNote ? 'Internal staff note saved!' : 'Client response sent successfully!');
      setReplyText('');
      setAttachmentName('');
      setIsInternalNote(false);
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch reply');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    const ticketIdToUse = selectedTicket.rawId || selectedTicket.id;

    try {
      await api.updateTicketStatus(ticketIdToUse, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.message.trim()) {
      toast.error('Subject and Issue description are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('companyName', createForm.companyName || '');
      formData.append('contactName', createForm.contactName || '');
      formData.append('contactEmail', createForm.contactEmail || '');
      formData.append('subject', createForm.subject);
      formData.append('category', createForm.category);
      formData.append('priority', createForm.priority);
      formData.append('message', createForm.message);
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      const res = await api.createTicket(formData);
      if (res.data?.success) {
        toast.success('Support Ticket raised & notification sent to support@kiaantechnology.com!');
        handleCloseCreateModal();
        setCreateForm({
          companyName: '',
          contactName: '',
          contactEmail: '',
          subject: '',
          category: 'General',
          priority: 'Normal',
          message: ''
        });
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create support ticket');
    }
  };

  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      (t.id || '').toLowerCase().includes(term) ||
      (t.subject || '').toLowerCase().includes(term) ||
      (t.company_name || '').toLowerCase().includes(term) ||
      (t.category || '').toLowerCase().includes(term)
    );
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent': return <Badge bg="danger" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>Urgent</Badge>;
      case 'High': return <Badge bg="warning" text="dark" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>High</Badge>;
      case 'Normal': return <Badge bg="info" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>Normal</Badge>;
      default: return <Badge bg="secondary" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>Low</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return <Badge bg="danger" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>Open</Badge>;
      case 'In Progress': return <Badge bg="primary" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>In Progress</Badge>;
      case 'Resolved': return <Badge bg="success" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>Resolved</Badge>;
      case 'Closed': return <Badge bg="dark" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>Closed</Badge>;
      default: return <Badge bg="secondary" style={{ fontWeight: '700', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}>{status}</Badge>;
    }
  };

  return (
    <SuperAdminLayout>
      <div style={{ width: '100%', padding: isMobile ? '12px 8px 24px 8px' : '0 8px 24px 8px' }}>

        {/* 1. Unified Header Banner */}
        <Card className="mb-3 mb-md-4 border-0 shadow-sm" style={{ borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', marginTop: isMobile ? '6px' : '0' }}>
          <div className="card-body" style={{ padding: isMobile ? '14px 14px' : '20px 24px' }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? '14px' : '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ backgroundColor: '#FEF2F2', width: isMobile ? '42px' : '52px', height: isMobile ? '42px' : '52px', border: '1px solid #FECACA' }}
                >
                  <LifeBuoy style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', color: '#C62828' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.65rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Support Tickets
                  </h2>
                  <p style={{ color: '#64748B', fontSize: isMobile ? '0.78rem' : '0.88rem', margin: '2px 0 0 0', lineHeight: '1.35' }}>
                    Raise and monitor payroll support tickets for your organizations
                  </p>
                </div>
              </div>

              {/* Action Buttons - Distinct, cleanly spaced with gap */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto',
                gap: isMobile ? '10px' : '12px',
                width: isMobile ? '100%' : 'auto',
                alignItems: 'center'
              }}>
                <Button
                  variant="outline-secondary"
                  onClick={() => fetchTickets(true)}
                  disabled={refreshing}
                  style={{
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    padding: isMobile ? '9px 10px' : '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    color: '#334155',
                    width: '100%',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
                  <span>Refresh</span>
                </Button>

                <Button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    backgroundColor: '#C62828',
                    borderColor: '#C62828',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    padding: isMobile ? '9px 12px' : '9px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(198, 40, 40, 0.25)',
                    width: '100%',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Plus size={15} />
                  <span>Create Ticket</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Search Bar */}
        <div className="mb-3">
          <div style={{ position: 'relative', width: isMobile ? '100%' : '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '11px', color: '#94A3B8' }} />
            <Form.Control
              type="text"
              placeholder="Search Ticket ID, company or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '38px',
                borderRadius: '10px',
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                height: '38px'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 3. Tickets Container */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '14px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div className="card-header bg-white py-2.5 px-3 px-sm-4 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #E2E8F0' }}>
            <h5 className="mb-0 fw-bold" style={{ color: '#0F172A', fontSize: isMobile ? '0.98rem' : '1.12rem' }}>
              All Support Tickets ({filteredTickets.length})
            </h5>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="danger" style={{ width: '2rem', height: '2rem' }} />
                <p style={{ marginTop: '10px', color: '#64748B', fontSize: '13px' }}>Loading support tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div className="mx-auto mb-2.5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F8FAFC' }}>
                  <MessageSquare size={20} color="#94A3B8" />
                </div>
                <h6 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '0.95rem' }}>No Tickets Found</h6>
                <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                  {searchTerm ? 'No tickets match your search filter.' : 'No support tickets raised yet.'}
                </p>
              </div>
            ) : isMobile ? (
              /* Mobile Cards for Support Tickets */
              <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                {filteredTickets.map(t => (
                  <div
                    key={t.id}
                    className="card shadow-sm border-0"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedTicket(t);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="p-3">
                      {/* Top Row: Ticket ID + Priority + Status */}
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                        <span style={{ fontWeight: '800', color: '#C62828', fontSize: '0.85rem' }}>
                          {t.id}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getPriorityBadge(t.priority)}
                          {getStatusBadge(t.status)}
                        </div>
                      </div>

                      {/* Subject */}
                      <h6 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '0.92rem', lineHeight: 1.4 }}>
                        {t.subject}
                      </h6>

                      {/* Company & Category Strip */}
                      <div className="p-2 rounded-3 mb-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6', fontSize: '0.76rem' }}>
                        <div className="d-flex align-items-center justify-content-between text-muted mb-1">
                          <div className="d-flex align-items-center gap-1.5 text-truncate">
                            <Building2 size={12} color="#64748B" />
                            <span className="fw-medium text-dark text-truncate">{t.company_name}</span>
                          </div>
                          <span className="badge bg-white text-muted border px-1.5 py-0.5">{t.category}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          User: <span className="text-dark">{t.contact_name} ({t.contact_email})</span>
                        </div>
                      </div>

                      {/* Bottom Info Strip */}
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                        <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <Clock size={11} />
                          {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="d-flex align-items-center gap-1 text-danger fw-semibold" style={{ fontSize: '0.76rem' }}>
                          <MessageSquare size={12} />
                          <span>{t.messages.length} replies</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="table-responsive">
                <Table hover className="mb-0" style={{ verticalAlign: 'middle', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: '800', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">COMPANY</th>
                      <th className="py-3 px-4">SUBJECT</th>
                      <th className="py-3 px-4">CATEGORY</th>
                      <th className="py-3 px-4">PRIORITY</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4">SUBMITTED AT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setSelectedTicket(t);
                          setShowDetailModal(true);
                        }}
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                        className="table-row-hover"
                      >
                        <td className="py-3 px-4" style={{ fontWeight: '700', color: '#C62828' }}>
                          {t.id}
                        </td>
                        <td className="py-3 px-4">
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{t.company_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{t.contact_email}</div>
                        </td>
                        <td className="py-3 px-4" style={{ fontWeight: '600', color: '#1E293B', maxWidth: '300px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.subject}
                          </div>
                        </td>
                        <td className="py-3 px-4" style={{ color: '#475569', fontWeight: '600' }}>
                          {t.category}
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadge(t.priority)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(t.status)}
                        </td>
                        <td className="py-3 px-4" style={{ color: '#64748B', fontSize: '12px' }}>
                          {new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Ticket Conversation & Response Modal / Drawer */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="xl">
        <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderBottom: '2px solid #C62828', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <Modal.Title style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '800' }}>
            Ticket Details – {selectedTicket?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#F8FAFC', padding: isMobile ? '14px' : '24px', maxHeight: '80vh', overflowY: 'auto' }}>
          {selectedTicket && (
            <div>
              {/* Header Details */}
              <div style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '14px' : '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2.5">
                  <div>
                    <span style={{ backgroundColor: '#C62828', color: '#FFFFFF', fontWeight: '800', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
                      {selectedTicket.id}
                    </span>
                    <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: '#0F172A', marginTop: '8px', marginBottom: '4px' }}>
                      {selectedTicket.subject}
                    </h3>
                    <p style={{ margin: 0, fontSize: isMobile ? '12px' : '13px', color: '#64748B' }}>
                      Company: <strong>{selectedTicket.company_name}</strong> | User: <strong>{selectedTicket.contact_name} ({selectedTicket.contact_email})</strong>
                    </p>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Status:</span>
                      <Form.Select
                        size="sm"
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        style={{ width: '120px', fontWeight: '700', borderRadius: '8px', fontSize: '12px' }}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </Form.Select>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Priority:</span>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Messages */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: isMobile ? '14px' : '20px', marginBottom: '16px', maxHeight: '340px', overflowY: 'auto' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
                  Conversation Thread ({selectedTicket.messages.length} messages)
                </h5>

                <div className="d-flex flex-column gap-2.5">
                  {selectedTicket.messages.length === 0 ? (
                    <div className="text-center py-3 text-muted small">No replies in this thread yet.</div>
                  ) : (
                    selectedTicket.messages.map(msg => {
                      const isStaff = msg.role === 'staff';
                      const isInternal = msg.is_internal;

                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isStaff ? 'flex-end' : 'flex-start',
                            maxWidth: isMobile ? '92%' : '80%',
                            backgroundColor: isInternal ? '#FFFBEB' : (isStaff ? '#0F172A' : '#F8FAFC'),
                            color: isInternal ? '#78350F' : (isStaff ? '#FFFFFF' : '#0F172A'),
                            border: isInternal ? '1px solid #FCD34D' : (isStaff ? 'none' : '1px solid #E2E8F0'),
                            borderRadius: '12px',
                            padding: '12px 14px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: isInternal ? '#92400E' : (isStaff ? '#94A3B8' : '#64748B') }}>
                            <span>
                              {isInternal && <Lock size={11} className="me-1 inline" />}
                              {msg.sender}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>

                          <div style={{ fontSize: '12.5px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                            {msg.message}
                          </div>

                          {msg.attachment_url && (
                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                              {/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.attachment_url) && (
                                <div className="mb-1">
                                  <a href={getAttachmentUrl(msg.attachment_url)} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={getAttachmentUrl(msg.attachment_url)}
                                      alt="Attachment preview"
                                      style={{
                                        maxWidth: '180px',
                                        maxHeight: '120px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  </a>
                                </div>
                              )}
                              <a
                                href={getAttachmentUrl(msg.attachment_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: isStaff ? '#60A5FA' : '#C62828', fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline' }}
                              >
                                📎 View Attached Image
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: isMobile ? '14px' : '20px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm" style={{ border: '1px solid #CBD5E1', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px' }}>
                      Canned Templates
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ fontSize: '12px' }}>
                      {templates.map((tpl, idx) => (
                        <Dropdown.Item key={idx} onClick={() => setReplyText(tpl)}>
                          {tpl}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <Form.Check
                    type="switch"
                    id="internal-note-toggle"
                    label={<span style={{ fontSize: '11.5px', fontWeight: '700', color: isInternalNote ? '#B45309' : '#64748B' }}>🔒 Internal Staff Note Only</span>}
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                  />
                </div>

                <Form onSubmit={handleSendReply}>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={isInternalNote ? "Enter internal note for team reference..." : "Type official response to customer..."}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      borderColor: isInternalNote ? '#F59E0B' : '#E2E8F0',
                      backgroundColor: isInternalNote ? '#FFFBEB' : '#FFFFFF'
                    }}
                  />

                  <div className="d-flex justify-content-between align-items-center mt-2.5 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                          const file = prompt('Enter attachment URL / file name:', 'system_log.png');
                          if (file) setAttachmentName(file);
                        }}
                        style={{ border: '1px solid #CBD5E1', fontSize: '11.5px', borderRadius: '6px' }}
                      >
                        <Paperclip size={13} /> Attach File
                      </Button>
                      {attachmentName && (
                        <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>
                          📎 {attachmentName}
                        </span>
                      )}
                    </div>

                    <Button
                      type="submit"
                      style={{
                        backgroundColor: isInternalNote ? '#B45309' : '#C62828',
                        borderColor: isInternalNote ? '#B45309' : '#C62828',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        padding: '6px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Send size={13} /> {isInternalNote ? 'Save Internal Note' : 'Send Reply'}
                    </Button>
                  </div>
                </Form>
              </div>

            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderBottom: '2px solid #C62828', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <Modal.Title style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '800' }}>
            Raise New Support Ticket
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-sm-4" style={{ backgroundColor: '#FFFFFF', maxHeight: '80vh', overflowY: 'auto' }}>
          <Form onSubmit={handleCreateTicketSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>Company / Organization Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Acme Tech Solutions"
                    value={createForm.companyName}
                    onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '12.5px' }}
                  />
                </Form.Group>
              </div>

              <div className="col-12 col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="e.g. hr@acmetech.com"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '12.5px' }}
                  />
                </Form.Group>
              </div>

              <div className="col-12 col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>Category</Form.Label>
                  <Form.Select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '12.5px' }}
                  >
                    <option value="General">General Support</option>
                    <option value="Payroll Compliance">Payroll & Tax Compliance</option>
                    <option value="Attendance Sync">Attendance & Biometric Sync</option>
                    <option value="Billing & Subscription">Billing & Subscription</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-12 col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>Priority Level</Form.Label>
                  <Form.Select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '12.5px' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>Ticket Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Brief summary of the issue..."
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '12.5px' }}
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>Issue Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    required
                    placeholder="Provide full details of the problem..."
                    value={createForm.message}
                    onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '12.5px' }}
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '700', fontSize: '12.5px', color: '#334155' }}>
                    Upload Image / Screenshot (Optional)
                  </Form.Label>
                  <div
                    style={{
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="file"
                        id="ticket-image-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="ticket-image-upload"
                        className="btn btn-sm btn-outline-secondary mb-0 d-flex align-items-center gap-1.5"
                        style={{
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '12px',
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF'
                        }}
                      >
                        <Paperclip size={14} /> Choose Image
                      </label>
                      <span style={{ fontSize: '12px', color: attachmentFile ? '#0F172A' : '#94A3B8', fontWeight: attachmentFile ? '600' : 'normal' }}>
                        {attachmentFile ? attachmentFile.name : 'No image chosen (PNG, JPG, JPEG, GIF, WEBP)'}
                      </span>
                    </div>

                    {attachmentFile && (
                      <div className="d-flex align-items-center gap-2">
                        {attachmentPreview && (
                          <img
                            src={attachmentPreview}
                            alt="Preview"
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1'
                            }}
                          />
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-danger p-0 d-flex align-items-center"
                          title="Remove image"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </Form.Group>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
              <Button variant="secondary" onClick={handleCloseCreateModal} style={{ borderRadius: '8px', fontSize: '12.5px' }}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#C62828', borderColor: '#C62828', fontWeight: '700', borderRadius: '8px', fontSize: '12.5px' }}>
                Submit Ticket
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </SuperAdminLayout>
  );
};

export default SuperAdminSupport;
