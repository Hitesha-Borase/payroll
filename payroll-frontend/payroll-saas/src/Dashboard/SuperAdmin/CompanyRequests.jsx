import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { FaBuilding, FaEnvelope, FaPhone, FaCalendar, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaEye, FaTrash, FaPaypal } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { superadminAPI } from '../../services/api';
import SuperAdminLayout from './SuperAdminLayout';

const CompanyRequests = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);

    // Form states
    const [password, setPassword] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [requests, filter, searchTerm]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superadminAPI.getAllCompanyRequests();
            if (response?.data?.success) {
                setRequests(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch company requests');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...requests];

        if (filter !== 'all') {
            filtered = filtered.filter(req => req.request_status === filter);
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(req =>
                (req.company_name || '').toLowerCase().includes(search) ||
                (req.email || '').toLowerCase().includes(search) ||
                (req.contact_name || '').toLowerCase().includes(search)
            );
        }

        setFilteredRequests(filtered);
    };

    const handleViewDetails = async (request) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
    };

    const handleAcceptRequest = async () => {
        if (!selectedRequest) return;

        try {
            setActionLoading(true);
            setActionError(null);
            const response = await superadminAPI.acceptCompanyRequest(selectedRequest.id, { password });

            if (response?.data?.success) {
                toast.success(`Company request accepted successfully!\n\nCompany: ${response.data.data.company.company_name}\nAdmin Email: ${response.data.data.admin.email}\n${response.data.data.admin.default_password ? `Default Password: ${response.data.data.admin.default_password}` : ''}`);
                setShowAcceptModal(false);
                setPassword('');
                fetchRequests();
            }
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to accept request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async () => {
        if (!selectedRequest) return;

        try {
            setActionLoading(true);
            setActionError(null);
            const response = await superadminAPI.rejectCompanyRequest(selectedRequest.id, { notes: rejectNotes });

            if (response?.data?.success) {
                toast.success('Company request rejected successfully');
                setShowRejectModal(false);
                setRejectNotes('');
                fetchRequests();
            }
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteConfirmation = (request) => {
        setSelectedRequest(request);
        setShowDeleteModal(true);
    };

    const handleDeleteRequest = async () => {
        if (!selectedRequest) return;
        try {
            setActionLoading(true);
            setActionError(null);
            const response = await superadminAPI.deleteCompanyRequest(selectedRequest.id);
            if (response?.data?.success) {
                toast.success('Company request deleted successfully');
                setShowDeleteModal(false);
                fetchRequests();
            }
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to delete request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdatePaymentStatus = async (requestId, paymentStatus) => {
        try {
            const response = await superadminAPI.updateCompanyRequestPaymentStatus(requestId, { payment_status: paymentStatus });
            if (response?.data?.success) {
                toast.success('Payment status updated successfully');
                fetchRequests();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update payment status');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'warning', text: 'Pending' },
            accepted: { bg: 'success', text: 'Accepted' },
            rejected: { bg: 'danger', text: 'Rejected' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const getPaymentBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'secondary', text: 'Pending' },
            paid: { bg: 'success', text: 'Paid' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <SuperAdminLayout>
            <div style={{ width: '100%' }}>
                <h2 style={{ color: '#0F172A', marginBottom: '24px', fontWeight: '800' }}>Company Requests</h2>

                {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

                {/* Filters */}
                <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }} className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={6} lg={4} className="mb-3 mb-md-0">
                                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Filter by Status</Form.Label>
                                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ borderRadius: '8px', fontSize: '13px' }}>
                                    <option value="all">All Requests</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                </Form.Select>
                            </Col>
                            <Col md={6} lg={4}>
                                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Search</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by company, email, or contact name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ borderRadius: '8px', fontSize: '13px' }}
                                />
                            </Col>
                            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
                                <div className="d-flex gap-2 justify-content-lg-end">
                                    <Badge bg="warning" className="px-3 py-2" style={{ borderRadius: '12px' }}>
                                        Pending: {requests.filter(r => r.request_status === 'pending').length}
                                    </Badge>
                                    <Badge bg="success" className="px-3 py-2" style={{ borderRadius: '12px' }}>
                                        Accepted: {requests.filter(r => r.request_status === 'accepted').length}
                                    </Badge>
                                    <Badge bg="danger" className="px-3 py-2" style={{ borderRadius: '12px' }}>
                                        Rejected: {requests.filter(r => r.request_status === 'rejected').length}
                                    </Badge>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Requests Table */}
                <Card style={{ border: 'none', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
                    <div style={{ backgroundColor: '#C62828', color: '#FFFFFF', padding: '16px 20px', fontWeight: '700', fontSize: '16px', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
                        <FaBuilding className="me-2" /> Company Signup Requests ({filteredRequests.length})
                    </div>
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center p-5">
                                <Spinner animation="border" variant="danger" />
                                <p style={{ marginTop: '12px', color: '#64748B' }}>Loading company requests...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
                                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                                        <tr>
                                            <th>Company Name</th>
                                            <th>Contact Person</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Plan</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4 text-muted">
                                                    No company requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td>
                                                        <div className="fw-bold" style={{ color: '#0F172A' }}>{request.company_name}</div>
                                                    </td>
                                                    <td>{request.contact_name}</td>
                                                    <td style={{ color: '#64748B' }}>{request.email}</td>
                                                    <td style={{ color: '#64748B' }}>{request.phone || '-'}</td>
                                                    <td>
                                                        <div className="fw-semibold">{request.plan?.name || 'N/A'}</div>
                                                        <small className="text-muted">₹{request.plan?.price || 0}</small>
                                                    </td>
                                                    <td>
                                                        {request.request_status === 'pending' ? (
                                                            <Form.Select
                                                                size="sm"
                                                                value={request.payment_status}
                                                                onChange={(e) => handleUpdatePaymentStatus(request.id, e.target.value)}
                                                                className={request.payment_status === 'paid' ? 'bg-success text-white border-success' : 'bg-light'}
                                                                style={{ fontWeight: '600', cursor: 'pointer', borderRadius: '6px' }}
                                                            >
                                                                <option value="pending" className="bg-white text-dark">Pending</option>
                                                                <option value="paid" className="bg-white text-dark">Paid</option>
                                                            </Form.Select>
                                                        ) : (
                                                            getPaymentBadge(request.payment_status)
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(request.request_status)}</td>
                                                    <td style={{ color: '#64748B' }}>{formatDate(request.created_at)}</td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                onClick={() => handleViewDetails(request)}
                                                                style={{ borderRadius: '6px' }}
                                                            >
                                                                <FaEye />
                                                            </Button>
                                                            {request.request_status === 'pending' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="success"
                                                                        onClick={() => {
                                                                            setSelectedRequest(request);
                                                                            setShowAcceptModal(true);
                                                                        }}
                                                                        style={{ borderRadius: '6px' }}
                                                                    >
                                                                        <FaCheckCircle />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="danger"
                                                                        onClick={() => {
                                                                            setSelectedRequest(request);
                                                                            setShowRejectModal(true);
                                                                        }}
                                                                        style={{ borderRadius: '6px' }}
                                                                    >
                                                                        <FaTimesCircle />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                onClick={() => handleDeleteConfirmation(request)}
                                                                style={{ borderRadius: '6px' }}
                                                                title="Delete Request"
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Detail Modal */}
                <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                        <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>Company Request Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {selectedRequest && (
                            <Row className="g-3">
                                <Col md={6}>
                                    <h6 className="text-muted mb-2">Company Information</h6>
                                    <p className="mb-1"><strong>Company Name:</strong> {selectedRequest.company_name}</p>
                                    <p className="mb-1"><strong>Address:</strong> {selectedRequest.company_address || 'N/A'}</p>
                                    <p className="mb-1"><strong>GST Number:</strong> {selectedRequest.gst_number || 'N/A'}</p>
                                    <p className="mb-1"><strong>PAN Number:</strong> {selectedRequest.pan_number || 'N/A'}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-2">Contact Information</h6>
                                    <p className="mb-1"><strong>Contact Person:</strong> {selectedRequest.contact_name}</p>
                                    <p className="mb-1"><strong>Email:</strong> {selectedRequest.email}</p>
                                    <p className="mb-1"><strong>Phone:</strong> {selectedRequest.phone || 'N/A'}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-2 mt-3">Plan Details</h6>
                                    <p className="mb-1"><strong>Plan:</strong> {selectedRequest.plan?.name || 'N/A'}</p>
                                    <p className="mb-1"><strong>Price:</strong> ₹{selectedRequest.plan?.price || 0}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-2 mt-3">Request Status</h6>
                                    <p className="mb-1"><strong>Request Status:</strong> {getStatusBadge(selectedRequest.request_status)}</p>
                                    <p className="mb-1"><strong>Payment Status:</strong> {getPaymentBadge(selectedRequest.payment_status)}</p>
                                    <p className="mb-1"><strong>Created:</strong> {formatDate(selectedRequest.created_at)}</p>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)} style={{ borderRadius: '8px' }}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Accept Modal */}
                <Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                        <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>Accept Company Request</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {actionError && <Alert variant="danger">{actionError}</Alert>}
                        <p>
                            Accept request for <strong>{selectedRequest?.company_name}</strong> and provision company account.
                        </p>
                        <Form.Group className="mt-3">
                            <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Initial Admin Password (Optional)</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Leave empty for auto-generated password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ borderRadius: '8px', fontSize: '13px' }}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAcceptModal(false)} disabled={actionLoading} style={{ borderRadius: '8px' }}>
                            Cancel
                        </Button>
                        <Button style={{ backgroundColor: '#C62828', borderColor: '#C62828', borderRadius: '8px', fontWeight: '700' }} onClick={handleAcceptRequest} disabled={actionLoading}>
                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Accept & Create Account'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Reject Modal */}
                <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                        <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>Reject Company Request</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {actionError && <Alert variant="danger">{actionError}</Alert>}
                        <p>Reject signup request from <strong>{selectedRequest?.company_name}</strong>?</p>
                        <Form.Group className="mt-3">
                            <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Rejection Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter reason for rejection..."
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                style={{ borderRadius: '8px', fontSize: '13px' }}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading} style={{ borderRadius: '8px' }}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleRejectRequest} disabled={actionLoading} style={{ borderRadius: '8px', fontWeight: '700' }}>
                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Reject Request'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                        <Modal.Title style={{ fontSize: '16px', fontWeight: '700' }}>Delete Company Request</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {actionError && <Alert variant="danger">{actionError}</Alert>}
                        <p>Permanently delete request from <strong>{selectedRequest?.company_name}</strong>?</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading} style={{ borderRadius: '8px' }}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteRequest} disabled={actionLoading} style={{ borderRadius: '8px', fontWeight: '700' }}>
                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Delete Request'}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </SuperAdminLayout>
    );
};

export default CompanyRequests;
