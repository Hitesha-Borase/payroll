import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Table, Badge, Spinner, Alert, Card, Button, Form, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { superadminAPI } from '../../services/api';
import SuperAdminLayout from './SuperAdminLayout';
import { Download, CreditCard, RefreshCw, CheckCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { useRegional } from '../../context/RegionalContext';

const PaymentsSubscriptions = () => {
  const { formatCurrency } = useRegional();
  const [payments, setPayments] = useState([]);
  const [activeSubs, setActiveSubs] = useState([]);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [expiredSubs, setExpiredSubs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manual Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [payRes, activeRes, pendingRes, expiredRes, compRes, planRes] = await Promise.all([
        superadminAPI.getAllPayments(),
        superadminAPI.getAllSubscriptions({ status: 'active' }),
        superadminAPI.getAllSubscriptions({ status: 'pending' }),
        superadminAPI.getAllSubscriptions({ status: 'expired' }),
        superadminAPI.getAllCompanies(),
        superadminAPI.getAllPlans()
      ]);

      if (payRes.data?.success) setPayments(payRes.data.data || []);
      if (activeRes.data?.success) setActiveSubs(activeRes.data.data || []);
      if (pendingRes.data?.success) setPendingSubs(pendingRes.data.data || []);
      if (expiredRes.data?.success) setExpiredSubs(expiredRes.data.data || []);
      if (compRes.data?.success) setCompanies(compRes.data.data || []);
      if (planRes.data?.success) setPlans(planRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load financial and subscription records.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async (id) => {
    if (window.confirm('Mark this payment as RECEIVED? This will instantly activate the company subscription.')) {
      try {
        setLoading(true);
        const res = await superadminAPI.activateSubscription(id);
        if (res.data?.success) {
          toast.success('Subscription activated and payment recorded!');
          fetchData();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to activate subscription.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId || !selectedPlanId) {
      toast.error('Please select both a company and a plan.');
      return;
    }
    try {
      setSubmittingOverride(true);
      const res = await superadminAPI.assignPlanToCompany(selectedCompanyId, { plan_id: selectedPlanId });
      if (res.data?.success) {
        toast.success('Plan assigned successfully to company!');
        setShowOverrideModal(false);
        setSelectedCompanyId('');
        setSelectedPlanId('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign plan.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  // 1-Click CSV Export
  const exportToCSV = () => {
    if (payments.length === 0) {
      toast.error('No payment records to export.');
      return;
    }

    const headers = ['Transaction ID', 'Date', 'Company Name', 'Admin Email', 'Plan', 'Amount (INR)', 'Payment Method', 'Status'];
    const csvRows = [headers.join(',')];

    payments.forEach(pay => {
      const row = [
        `"PAY-${pay.id || ''}"`,
        `"${pay.created_at ? new Date(pay.created_at).toLocaleDateString() : ''}"`,
        `"${(pay.employer?.company_name || 'N/A').replace(/"/g, '""')}"`,
        `"${(pay.employer?.user?.email || 'N/A').replace(/"/g, '""')}"`,
        `"${(pay.invoice?.plan?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${pay.amount || 0}"`,
        `"${(pay.payment_method || 'Razorpay').replace(/"/g, '""')}"`,
        `"${pay.status || 'success'}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kiaan_Payroll_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions CSV exported successfully!');
  };

  const filteredPayments = payments.filter(pay => {
    const matchesSearch = 
      (pay.employer?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.employer?.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.invoice?.plan?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pay.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <SuperAdminLayout>
      <div style={{ width: '100%' }}>
        
        {/* Header Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: isMobile ? '16px' : '24px',
          gap: isMobile ? '12px' : '16px'
        }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard style={{ color: '#C62828', flexShrink: 0 }} size={isMobile ? 22 : 26} /> Payments & Subscriptions Audit
            </h2>
            <p style={{ color: '#64748B', fontSize: isMobile ? '12px' : '14px', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              Track platform transactions, manage multi-tenant billing status & assign subscription overrides.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              onClick={() => setShowOverrideModal(true)}
              style={{
                backgroundColor: '#C62828',
                borderColor: '#C62828',
                fontWeight: '700',
                borderRadius: '8px',
                fontSize: isMobile ? '12px' : '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flex: isMobile ? '1 1 auto' : 'initial',
                padding: isMobile ? '8px 12px' : '8px 16px'
              }}
            >
              + Manual Override
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline-dark"
              style={{
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: isMobile ? '12px' : '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flex: isMobile ? '1 1 auto' : 'initial',
                padding: isMobile ? '8px 12px' : '8px 16px'
              }}
            >
              <Download size={15} /> Export CSV
            </Button>
            <Button
              onClick={fetchData}
              variant="light"
              style={{ border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', padding: isMobile ? '8px 12px' : '8px 14px' }}
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        {/* Metrics Summary Strip - 2x2 on Mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: isMobile ? '10px' : '16px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          <Card style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' }}>
            <Card.Body style={{ padding: isMobile ? '12px 14px' : '16px 20px' }}>
              <div style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Transactions</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{payments.length}</div>
            </Card.Body>
          </Card>
          <Card style={{ border: '1px solid #DCFCE7', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' }}>
            <Card.Body style={{ padding: isMobile ? '12px 14px' : '16px 20px' }}>
              <div style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Active Subs</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#166534', marginTop: '4px' }}>{activeSubs.length}</div>
            </Card.Body>
          </Card>
          <Card style={{ border: '1px solid #FEF3C7', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' }}>
            <Card.Body style={{ padding: isMobile ? '12px 14px' : '16px 20px' }}>
              <div style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: '#B45309', textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>{pendingSubs.length}</div>
            </Card.Body>
          </Card>
          <Card style={{ border: '1px solid #FEE2E2', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' }}>
            <Card.Body style={{ padding: isMobile ? '12px 14px' : '16px 20px' }}>
              <div style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: '#991B1B', textTransform: 'uppercase' }}>Expired Subs</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#991B1B', marginTop: '4px' }}>{expiredSubs.length}</div>
            </Card.Body>
          </Card>
        </div>

        {/* Tabbed Audit View */}
        <Card style={{ border: 'none', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF', padding: isMobile ? '12px' : '16px' }}>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="danger" />
              <p style={{ marginTop: '12px', color: '#64748B' }}>Fetching transaction ledger...</p>
            </div>
          ) : (
            <Tabs defaultActiveKey="payments" className="mb-3 text-dark" style={{ borderBottom: '2px solid #E2E8F0' }}>
              
              {/* TAB 1: PAYMENT HISTORY */}
              <Tab eventKey="payments" title={`Payments (${filteredPayments.length})`}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
                    <Form.Control
                      type="text"
                      placeholder="Search company, email or plan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '34px', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: isMobile ? '100%' : '170px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                  </Form.Select>
                </div>

                {filteredPayments.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                    No transaction audit records matched your filter.
                  </div>
                ) : isMobile ? (
                  /* MOBILE PAYMENT CARDS */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredPayments.map(pay => (
                      <div
                        key={pay.id}
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>PAY-{pay.id}</span>
                          <Badge bg={pay.status === 'success' ? 'success' : 'warning'} style={{ borderRadius: '10px', fontSize: '10px', padding: '3px 8px' }}>
                            {pay.status ? pay.status.toUpperCase() : 'SUCCESS'}
                          </Badge>
                        </div>
                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>
                          {pay.employer?.company_name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          📧 {pay.employer?.user?.email || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                          <div>
                            <Badge bg="light" text="dark" style={{ border: '1px solid #CBD5E1', fontSize: '11px', padding: '4px 6px' }}>
                              {pay.invoice?.plan?.name || 'Standard Plan'}
                            </Badge>
                            <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>{pay.payment_method || 'Online'}</span>
                          </div>
                          <div style={{ fontWeight: '800', color: '#C62828', fontSize: '15px' }}>
                            {formatCurrency(parseFloat(pay.amount || 0))}
                          </div>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'right' }}>
                          {pay.created_at ? new Date(pay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* DESKTOP PAYMENT TABLE */
                  <div className="table-responsive">
                    <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                        <tr>
                          <th>Txn Ref</th>
                          <th>Date</th>
                          <th>Company Name</th>
                          <th>Subscriber Email</th>
                          <th>Plan Purchased</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((pay) => (
                          <tr key={pay.id}>
                            <td style={{ fontWeight: '700', color: '#0F172A' }}>PAY-{pay.id}</td>
                            <td style={{ color: '#64748B' }}>{pay.created_at ? new Date(pay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                            <td style={{ fontWeight: '700', color: '#0F172A' }}>{pay.employer?.company_name || 'N/A'}</td>
                            <td style={{ color: '#64748B' }}>{pay.employer?.user?.email || 'N/A'}</td>
                            <td>
                              <Badge bg="light" text="dark" style={{ border: '1px solid #CBD5E1', padding: '5px 8px' }}>
                                {pay.invoice?.plan?.name || 'Standard Plan'}
                              </Badge>
                            </td>
                            <td style={{ fontWeight: '800', color: '#C62828' }}>{formatCurrency(parseFloat(pay.amount || 0))}</td>
                            <td style={{ color: '#475569', fontWeight: '500' }}>{pay.payment_method || 'Online'}</td>
                            <td>
                              <Badge bg={pay.status === 'success' ? 'success' : 'warning'} style={{ borderRadius: '12px', padding: '4px 10px' }}>
                                {pay.status ? pay.status.toUpperCase() : 'SUCCESS'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab>

              {/* TAB 2: ACTIVE SUBSCRIPTIONS */}
              <Tab eventKey="active" title={`Active Subs (${activeSubs.length})`}>
                {activeSubs.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>No active subscriptions currently.</div>
                ) : isMobile ? (
                  /* MOBILE ACTIVE SUBS CARDS */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeSubs.map(sub => (
                      <div
                        key={sub.id}
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{sub.employer?.company_name || 'N/A'}</span>
                          <span style={{ fontWeight: '800', color: '#C62828', fontSize: '14px' }}>{formatCurrency(parseFloat(sub.plan?.price || 0))}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>
                          Plan: {sub.plan?.name || 'SaaS Plan'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Valid: {sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '-'} to {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                          <Badge bg={sub.payment?.status === 'paid' ? 'success' : 'warning'} text={sub.payment?.status === 'paid' ? 'light' : 'dark'} style={{ fontSize: '10px' }}>
                            {sub.payment?.status?.toUpperCase() || 'PAID'}
                          </Badge>
                          {sub.payment?.status !== 'paid' ? (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => handleActivateSubscription(sub.id)}
                              style={{ borderRadius: '6px', fontSize: '11px', fontWeight: '700', padding: '4px 8px' }}
                            >
                              Mark as Paid
                            </Button>
                          ) : (
                            <span style={{ color: '#166534', fontWeight: '600', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle size={12} /> Active & Paid
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* DESKTOP ACTIVE SUBS TABLE */
                  <div className="table-responsive">
                    <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                        <tr>
                          <th>Company Name</th>
                          <th>Assigned Plan</th>
                          <th>Start Date</th>
                          <th>Expiry Date</th>
                          <th>Price</th>
                          <th>Billing Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSubs.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: '700', color: '#0F172A' }}>{sub.employer?.company_name || 'N/A'}</td>
                            <td>
                              <span style={{ fontWeight: '700', color: '#C62828' }}>{sub.plan?.name || 'SaaS Plan'}</span>
                            </td>
                            <td style={{ color: '#64748B' }}>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '-'}</td>
                            <td style={{ color: '#64748B', fontWeight: '600' }}>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}</td>
                            <td style={{ fontWeight: '700' }}>₹{parseFloat(sub.plan?.price || 0).toLocaleString('en-IN')}</td>
                            <td>
                              <Badge bg={sub.payment?.status === 'paid' ? 'success' : 'warning'} text={sub.payment?.status === 'paid' ? 'light' : 'dark'}>
                                {sub.payment?.status?.toUpperCase() || 'PAID'}
                              </Badge>
                            </td>
                            <td>
                              {sub.payment?.status !== 'paid' ? (
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handleActivateSubscription(sub.id)}
                                  style={{ borderRadius: '6px', fontSize: '12px' }}
                                >
                                  Mark as Paid
                                </Button>
                              ) : (
                                <span style={{ color: '#166534', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle size={14} /> Active & Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab>

              {/* TAB 3: PENDING SUBSCRIPTIONS */}
              <Tab eventKey="pending" title={`Pending (${pendingSubs.length})`}>
                {pendingSubs.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>No pending subscriptions awaiting approval.</div>
                ) : isMobile ? (
                  /* MOBILE PENDING SUBS CARDS */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingSubs.map(sub => (
                      <div
                        key={sub.id}
                        style={{
                          backgroundColor: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{sub.employer?.company_name || 'N/A'}</span>
                          <span style={{ fontWeight: '800', color: '#B45309', fontSize: '14px' }}>₹{parseFloat(sub.plan?.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          Plan: <strong>{sub.plan?.name || 'N/A'}</strong> • Req: {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #FDE68A' }}>
                          <Badge bg="warning" text="dark" style={{ fontSize: '10px' }}>Payment Pending</Badge>
                          <Button
                            size="sm"
                            style={{ backgroundColor: '#C62828', borderColor: '#C62828', fontSize: '11px', fontWeight: '700', padding: '4px 8px' }}
                            onClick={() => handleActivateSubscription(sub.id)}
                          >
                            Confirm & Activate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* DESKTOP PENDING SUBS TABLE */
                  <div className="table-responsive">
                    <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                        <tr>
                          <th>Company Name</th>
                          <th>Selected Plan</th>
                          <th>Requested On</th>
                          <th>Price</th>
                          <th>Payment Status</th>
                          <th>Super Admin Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSubs.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: '700', color: '#0F172A' }}>{sub.employer?.company_name || 'N/A'}</td>
                            <td style={{ fontWeight: '600' }}>{sub.plan?.name || 'N/A'}</td>
                            <td style={{ color: '#64748B' }}>{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-'}</td>
                            <td style={{ fontWeight: '700' }}>₹{parseFloat(sub.plan?.price || 0).toLocaleString('en-IN')}</td>
                            <td>
                              <Badge bg="warning" text="dark">Payment Pending</Badge>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                style={{ backgroundColor: '#C62828', borderColor: '#C62828', fontSize: '12px', fontWeight: '700' }}
                                onClick={() => handleActivateSubscription(sub.id)}
                              >
                                Confirm Payment & Activate
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab>

              {/* TAB 4: EXPIRED SUBSCRIPTIONS */}
              <Tab eventKey="expired" title={`Expired (${expiredSubs.length})`}>
                {expiredSubs.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>No expired subscriptions found.</div>
                ) : isMobile ? (
                  /* MOBILE EXPIRED SUBS CARDS */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {expiredSubs.map(sub => (
                      <div
                        key={sub.id}
                        style={{
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{sub.employer?.company_name || 'N/A'}</span>
                          <Badge bg="danger" style={{ fontSize: '10px' }}>Expired</Badge>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          Plan: <strong>{sub.plan?.name || 'N/A'}</strong> (₹{parseFloat(sub.plan?.price || 0).toLocaleString('en-IN')})
                        </div>
                        <div style={{ fontSize: '11px', color: '#DC2626' }}>
                          Expired On: {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* DESKTOP EXPIRED SUBS TABLE */
                  <div className="table-responsive">
                    <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                        <tr>
                          <th>Company Name</th>
                          <th>Expired Plan</th>
                          <th>Start Date</th>
                          <th>Expired On</th>
                          <th>Plan Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiredSubs.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: '700', color: '#0F172A' }}>{sub.employer?.company_name || 'N/A'}</td>
                            <td>{sub.plan?.name || 'N/A'}</td>
                            <td style={{ color: '#64748B' }}>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '-'}</td>
                            <td style={{ color: '#DC2626', fontWeight: '600' }}>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}</td>
                            <td>₹{parseFloat(sub.plan?.price || 0).toLocaleString('en-IN')}</td>
                            <td><Badge bg="danger">Expired / Access Locked</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab>

            </Tabs>
          )}
        </Card>

        {/* Modal for Manual Plan Override */}
        <Modal show={showOverrideModal} onHide={() => setShowOverrideModal(false)} centered contentClassName="border-0">
          <div style={{ maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', overflow: 'hidden' }}>
            <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: isMobile ? '12px 16px' : '16px 20px' }}>
              <Modal.Title style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '700' }}>
                Assign / Override Company Subscription
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleAssignPlan}>
              <Modal.Body className={isMobile ? "p-3" : "p-4"}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', fontSize: '12px' }}>Select Target Company</Form.Label>
                  <Form.Select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    required
                    style={{ borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="">-- Choose Corporate Company --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.user?.email || 'HR Admin'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', fontSize: '12px' }}>Select Payroll Plan</Form.Label>
                  <Form.Select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    required
                    style={{ borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="">-- Choose SaaS Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{parseFloat(p.price).toLocaleString('en-IN')} ({p.duration_months} month/s)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div style={{ backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #C62828', fontSize: '11px', color: '#991B1B' }}>
                  <strong>Note:</strong> Manually assigning a plan will activate subscription instantly and grant complete system access to the target company.
                </div>
              </Modal.Body>
              <Modal.Footer style={{ padding: isMobile ? '10px 16px' : '14px 20px' }}>
                <Button variant="secondary" onClick={() => setShowOverrideModal(false)} style={{ borderRadius: '8px', fontSize: '13px' }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingOverride} style={{ backgroundColor: '#C62828', borderColor: '#C62828', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}>
                  {submittingOverride ? 'Assigning...' : 'Assign Plan & Grant Access'}
                </Button>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>

      </div>
    </SuperAdminLayout>
  );
};

export default PaymentsSubscriptions;