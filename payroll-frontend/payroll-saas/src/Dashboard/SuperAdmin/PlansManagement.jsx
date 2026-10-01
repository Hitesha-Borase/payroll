import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Table, Form, Modal, Badge, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { superadminAPI } from '../../services/api';
import SuperAdminLayout from './SuperAdminLayout';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { Layers, ShieldCheck, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useRegional } from '../../context/RegionalContext';

const PlansManagement = () => {
  const { formatCurrency } = useRegional();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({});

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superadminAPI.getAllPlans();
      if (response?.data?.success) {
        setPlans(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subscription plans from database');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentPlan({
      name: '',
      description: '',
      priceMonthly: '',
      users: '',
      duration_months: '1',
      modules: {
        payroll: true,
        attendance: true,
        taxCompliance: true,
        essPortal: true,
        bankExport: false
      },
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleEdit = async (plan) => {
    try {
      const planId = typeof plan === 'object' ? plan.id : plan;
      const response = await superadminAPI.getPlanById(planId);
      if (response?.data?.success) {
        const planData = response.data.data;
        let featArray = [];
        try {
          featArray = typeof planData.features === 'string' ? JSON.parse(planData.features) : (Array.isArray(planData.features) ? planData.features : []);
        } catch (e) {
          featArray = [];
        }

        setIsEditMode(true);
        setCurrentPlan({
          id: planData.id,
          name: planData.name,
          description: planData.description || '',
          priceMonthly: parseFloat(planData.price || 0),
          duration_months: planData.duration_months || 1,
          users: planData.max_employees || 'Unlimited',
          featuresText: Array.isArray(featArray) ? featArray.join('\n') : '',
          status: planData.is_active ? 'Active' : 'Inactive',
        });
        setShowModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plan details');
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this subscription plan from database?')) {
      try {
        const response = await superadminAPI.deletePlan(planId);
        if (response?.data?.success) {
          fetchPlans();
          toast.success('Subscription plan deleted successfully!');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPlan({});
  };

  const handleSave = async () => {
    try {
      if (!currentPlan.name || currentPlan.priceMonthly === undefined || currentPlan.priceMonthly === '') {
        toast.error('Plan name and valid price are required.');
        return;
      }

      // Parse feature lines
      const featuresArray = currentPlan.featuresText
        ? currentPlan.featuresText.split('\n').filter(line => line.trim().length > 0)
        : ['Automated Payroll Processing', 'PF/ESI Statutory Compliance', 'Employee Self-Service (ESS) Portal'];

      const payload = {
        name: currentPlan.name,
        description: currentPlan.description || '',
        price: parseFloat(currentPlan.priceMonthly || 0),
        duration_months: parseInt(currentPlan.duration_months || 1),
        max_employees: (currentPlan.users === 'Unlimited' || !currentPlan.users) ? null : parseInt(currentPlan.users),
        max_jobs: null,
        features: JSON.stringify(featuresArray),
        is_active: currentPlan.status === 'Active' ? 1 : 0
      };

      if (isEditMode) {
        const response = await superadminAPI.updatePlan(currentPlan.id, payload);
        if (response?.data?.success) {
          fetchPlans();
          handleCloseModal();
          toast.success('Subscription plan updated successfully in database!');
        }
      } else {
        const response = await superadminAPI.createPlan(payload);
        if (response?.data?.success) {
          fetchPlans();
          handleCloseModal();
          toast.success('New subscription plan created successfully!');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlan({ ...currentPlan, [name]: value });
  };

  const handleStatusToggle = () => {
    setCurrentPlan({ ...currentPlan, status: currentPlan.status === 'Active' ? 'Inactive' : 'Active' });
  };

  return (
    <SuperAdminLayout>
      <div style={{ width: '100%', padding: isMobile ? '12px 8px 24px 8px' : '0 8px 24px 8px' }}>
        
        {/* Header */}
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
                  <Layers style={{ color: '#C62828' }} size={isMobile ? 22 : 26} />
                </div>
                <div>
                  <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.65rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    SaaS Subscription Plans
                  </h2>
                  <p style={{ color: '#64748B', fontSize: isMobile ? '0.78rem' : '0.88rem', margin: '2px 0 0 0', lineHeight: '1.35' }}>
                    Configure corporate pricing plans, employee limits, and payroll module permissions.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleAddNew}
                style={{
                  backgroundColor: '#C62828',
                  borderColor: '#C62828',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  borderRadius: '10px',
                  fontSize: isMobile ? '0.82rem' : '0.88rem',
                  padding: isMobile ? '9px 14px' : '9px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(198, 40, 40, 0.25)',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <FaPlus size={13} /> Create New Plan
              </Button>
            </div>
          </div>
        </Card>

        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

        {/* Overview Cards */}
        {!loading && plans.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '10px' : '16px',
            marginBottom: isMobile ? '16px' : '24px'
          }}>
            {plans.map(p => (
              <Card key={p.id} style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 style={{ margin: 0, fontWeight: '800', fontSize: isMobile ? '14px' : '16px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h5>
                  <Badge bg={p.is_active ? 'success' : 'danger'} style={{ fontSize: isMobile ? '9px' : '11px', padding: '3px 6px' }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '900', color: '#C62828', marginTop: '6px' }}>
                  {formatCurrency(p.price || 0)} <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 'normal' }}>/{p.duration_months}mo</span>
                </div>
                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748B', marginTop: '3px' }}>
                  👥 {p.max_employees ? `Up to ${p.max_employees} Staff` : 'Unlimited Staff'}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Live Plans Table / Mobile Cards */}
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" variant="danger" />
            <p style={{ marginTop: '12px', color: '#64748B' }}>Loading database subscription plans...</p>
          </div>
        ) : (
          <Card style={{ border: '1px solid #E2E8F0', borderRadius: '14px', backgroundColor: '#FFFFFF', padding: isMobile ? '14px' : '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Active Plan Configurations ({plans.length})
              </h4>
            </div>

            {plans.length === 0 ? (
              <div className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                No subscription plans found. Click "Create New Plan" to add one.
              </div>
            ) : isMobile ? (
              /* MOBILE CARDS VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plans.map(plan => {
                  const priceVal = parseFloat(plan.price || 0);
                  return (
                    <div
                      key={plan.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {plan.name || '-'}
                            {priceVal === 0 && <Badge bg="warning" text="dark" style={{ fontSize: '9px' }}>Free Trial</Badge>}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            Duration: {plan.duration_months || 1} Month/s • 👥 {plan.max_employees ? `${plan.max_employees} Staff` : 'Unlimited'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', color: '#C62828', fontSize: '16px' }}>
                            {formatCurrency(priceVal)}
                          </div>
                          <Badge bg={plan.is_active ? 'success' : 'danger'} style={{ fontSize: '9px', marginTop: '2px' }}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Enabled Modules */}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '3px 7px', borderRadius: '6px' }}>Payroll Processing</span>
                        <span style={{ fontSize: '10px', fontWeight: '600', backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '3px 7px', borderRadius: '6px' }}>PF/ESI/TDS Reports</span>
                        <span style={{ fontSize: '10px', fontWeight: '600', backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '3px 7px', borderRadius: '6px' }}>ESS Portal</span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleEdit(plan)}
                          style={{ flex: 1, borderRadius: '8px', fontSize: '12px', fontWeight: '700', padding: '7px 0', backgroundColor: '#FFFFFF' }}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(plan.id)}
                          style={{ flex: 1, borderRadius: '8px', fontSize: '12px', fontWeight: '700', padding: '7px 0', backgroundColor: '#FFFFFF' }}
                        >
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DESKTOP TABLE VIEW */
              <div className="table-responsive">
                <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                    <tr>
                      <th>Plan Name</th>
                      <th>Price (INR)</th>
                      <th>Duration</th>
                      <th>Max Staff Limit</th>
                      <th>Payroll Modules Enabled</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(plan => {
                      const priceVal = parseFloat(plan.price || 0);
                      return (
                        <tr key={plan.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>
                            {plan.name || '-'}
                            {priceVal === 0 && <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '10px' }}>Free Trial</Badge>}
                          </td>
                          <td style={{ fontWeight: '900', color: '#C62828', fontSize: '15px' }}>
                            {formatCurrency(priceVal)}
                          </td>
                          <td style={{ color: '#475569' }}>{plan.duration_months || 1} Month/s</td>
                          <td style={{ fontWeight: '700', color: '#0F172A' }}>
                            {plan.max_employees ? `${plan.max_employees} Staff` : 'Unlimited Staff'}
                          </td>
                          <td>
                            <div className="d-flex gap-1.5 flex-wrap">
                              <span style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                Payroll Processing
                              </span>
                              <span style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                PF/ESI/TDS Reports
                              </span>
                              <span style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                ESS Portal
                              </span>
                            </div>
                          </td>
                          <td>
                            <Badge bg={plan.is_active ? 'success' : 'danger'}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(plan)} style={{ borderRadius: '6px', fontSize: '12px' }}>
                                <FaEdit /> Edit
                              </Button>
                              <Button size="sm" variant="outline-danger" onClick={() => handleDelete(plan.id)} style={{ borderRadius: '6px', fontSize: '12px' }}>
                                <FaTrash /> Delete
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
          </Card>
        )}

        {/* Add/Edit Plan Modal */}
        <Modal show={showModal} onHide={handleCloseModal} centered scrollable size="lg" contentClassName="border-0 shadow-lg" style={{ zIndex: 1055 }}>
          <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: isMobile ? '12px 16px' : '16px 24px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <Modal.Title style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '800' }}>
              {isEditMode ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: isMobile ? '16px' : '24px' }}>
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Plan Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={currentPlan.name || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Basic / Professional / Enterprise"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Price (INR ₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="priceMonthly"
                      value={currentPlan.priceMonthly !== undefined ? currentPlan.priceMonthly : ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 0 for Free Trial, 999, 1299"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Validity Duration (Months)</Form.Label>
                    <Form.Control
                      type="number"
                      name="duration_months"
                      value={currentPlan.duration_months || ''}
                      onChange={handleInputChange}
                      min="1"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Max Staff / Employee Limit</Form.Label>
                    <Form.Control
                      type="text"
                      name="users"
                      value={currentPlan.users === 'Unlimited' ? '' : (currentPlan.users || '')}
                      onChange={handleInputChange}
                      placeholder="Leave empty or type 'Unlimited'"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Plan Description</Form.Label>
                    <Form.Control
                      type="text"
                      name="description"
                      value={currentPlan.description || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Essential payroll for small teams"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Enabled Features List (One per line)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="featuresText"
                      value={currentPlan.featuresText || ''}
                      onChange={handleInputChange}
                      placeholder="Automated Payroll & Salary Slip Generation&#10;PF, ESI & TDS Statutory Compliance Reports"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '700', fontSize: '12px', color: '#475569' }}>Plan Active Status</Form.Label>
                    <Form.Check
                      type="switch"
                      id="plan-status-switch"
                      label={currentPlan.status === 'Active' ? 'Active' : 'Inactive'}
                      checked={currentPlan.status === 'Active'}
                      onChange={handleStatusToggle}
                      style={{ color: '#0F172A', fontWeight: 'bold' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outline-secondary" onClick={handleCloseModal} style={{ borderRadius: '8px', fontSize: '13px', padding: '8px 16px' }}>
              <FaTimes className="me-1" /> Cancel
            </Button>
            <Button onClick={handleSave} style={{ backgroundColor: '#C62828', borderColor: '#C62828', color: '#FFFFFF', borderRadius: '8px', fontWeight: '700', fontSize: '13px', padding: '8px 20px' }}>
              <FaSave className="me-1" /> Save Plan Record
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Floating WhatsApp Support */}
        <WhatsAppWidget />

      </div>
    </SuperAdminLayout>
  );
};

export default PlansManagement;