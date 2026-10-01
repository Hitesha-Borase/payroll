import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { superadminAPI } from '../../services/api';
import SuperAdminLayout from './SuperAdminLayout';
import { UserCheck, Trash2 } from 'lucide-react';

const UserRequests = () => {
    const [activeTab, setActiveTab] = useState('custom'); // 'general' or 'custom'
    const [requests, setRequests] = useState([]);
    const [customRequests, setCustomRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchRequests();
        fetchCustomRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await superadminAPI.getAllUserRequests();
            if (response?.data?.success) {
                setRequests(response.data.data);
            } else {
                setError('Failed to fetch user requests');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load user requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomRequests = async () => {
        try {
            const response = await superadminAPI.getCustomPlanRequests();
            if (response?.data?.success) {
                setCustomRequests(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching custom plan requests:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this registration request?')) return;

        setDeletingId(id);
        try {
            const res = await superadminAPI.deleteUserRequest(id);
            if (res?.data?.success) {
                setRequests(prev => prev.filter(req => req.id !== id));
            } else {
                setError(res?.data?.message || 'Failed to delete request');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete request.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteCustom = async (id) => {
        if (!window.confirm('Are you sure you want to delete this custom plan requirement?')) return;

        setDeletingId(id);
        try {
            const res = await superadminAPI.deleteCustomPlanRequest(id);
            if (res?.data?.success) {
                setCustomRequests(prev => prev.filter(req => req.id !== id));
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            'jobseekers': 'Job Seeker',
            'vendor': 'Vendor',
            'employers': 'Employer',
            'admin': 'Admin',
            'job-search': 'Job Search',
            'employees': 'Employee',
            'payroll': 'Payroll & HR',
            '2000-companies': 'Corporate Company'
        };
        return labels[type] || type;
    };

    return (
        <SuperAdminLayout>
            <div style={{ width: '100%' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserCheck style={{ color: '#C62828' }} /> User Enquiries & Custom Plan Requests
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0' }}>
                        Audit incoming registration leads and custom payroll software requirement requests.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="d-flex gap-2 mb-4">
                    <Button
                        variant={activeTab === 'custom' ? 'danger' : 'outline-secondary'}
                        onClick={() => setActiveTab('custom')}
                        style={{
                            fontWeight: '600',
                            borderRadius: '20px',
                            backgroundColor: activeTab === 'custom' ? '#C62828' : '#FFF',
                            borderColor: activeTab === 'custom' ? '#C62828' : '#CBD5E1',
                            color: activeTab === 'custom' ? '#FFF' : '#475569'
                        }}
                    >
                        Custom Plan Requests ({customRequests.length})
                    </Button>
                    <Button
                        variant={activeTab === 'general' ? 'danger' : 'outline-secondary'}
                        onClick={() => setActiveTab('general')}
                        style={{
                            fontWeight: '600',
                            borderRadius: '20px',
                            backgroundColor: activeTab === 'general' ? '#C62828' : '#FFF',
                            borderColor: activeTab === 'general' ? '#C62828' : '#CBD5E1',
                            color: activeTab === 'general' ? '#FFF' : '#475569'
                        }}
                    >
                        General Enquiries ({requests.length})
                    </Button>
                </div>

                {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

                <Card style={{ border: 'none', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center p-5">
                                <Spinner animation="border" variant="danger" />
                                <p style={{ marginTop: '12px', color: '#64748B' }}>Fetching requests...</p>
                            </div>
                        ) : activeTab === 'custom' ? (
                            customRequests.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <h4>No custom plan requests found</h4>
                                    <p>Incoming enterprise customization requirements will appear here.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }} className="mb-0">
                                        <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                                            <tr>
                                                <th>Date (IST)</th>
                                                <th>Company Name</th>
                                                <th>HR / Admin Contact</th>
                                                <th>Employee Scale</th>
                                                <th>Detailed Requirements</th>
                                                <th>Status</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customRequests.map(req => (
                                                <tr key={req.id}>
                                                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                                                        {new Date(req.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                    </td>
                                                    <td style={{ fontWeight: '700', color: '#0F172A' }}>
                                                        {req.company_name}
                                                    </td>
                                                    <td>
                                                        <div><strong>{req.name}</strong></div>
                                                        <small className="text-muted"><a href={`mailto:${req.email}`} style={{ color: '#C62828' }}>{req.email}</a></small>
                                                    </td>
                                                    <td>
                                                        <Badge bg="dark" style={{ fontSize: '12px', borderRadius: '6px' }}>
                                                            {req.employee_count}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div style={{ maxWidth: '280px', maxHeight: '80px', overflowY: 'auto', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0', whiteSpace: 'pre-wrap' }}>
                                                            {req.requirements}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={req.status === 'pending' ? 'warning' : 'success'} text={req.status === 'pending' ? 'dark' : 'white'} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                                                            {req.status || 'Pending'}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end">
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteCustom(req.id)}
                                                            disabled={deletingId === req.id}
                                                            style={{ borderRadius: '6px' }}
                                                        >
                                                            {deletingId === req.id ? 'Deleting...' : 'Delete'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )
                        ) : requests.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h4>No public user requests found</h4>
                                <p>New registration enquiries will appear here.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover style={{ verticalAlign: 'middle', fontSize: '13px' }} className="mb-0">
                                    <thead style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                                        <tr>
                                            <th>Date</th>
                                            <th>Request Type</th>
                                            <th>Full Name</th>
                                            <th>Mobile</th>
                                            <th>Location</th>
                                            <th>Address</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map(request => (
                                            <tr key={request.id}>
                                                <td style={{ color: '#64748B' }}>{new Date(request.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <Badge bg="danger" style={{ fontSize: '11px', borderRadius: '10px' }}>
                                                        {getTypeLabel(request.request_type)}
                                                    </Badge>
                                                </td>
                                                <td style={{ fontWeight: '700', color: '#0F172A' }}>
                                                    {request.name}
                                                </td>
                                                <td>{request.mobile}</td>
                                                <td>{`${request.city || ''}, ${request.state || ''}`}</td>
                                                <td>
                                                    <small className="text-muted d-block" style={{ maxWidth: '220px' }}>
                                                        {request.address} ({request.country || 'India'})
                                                    </small>
                                                </td>
                                                <td className="text-end">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(request.id)}
                                                        disabled={deletingId === request.id}
                                                        style={{ borderRadius: '6px' }}
                                                    >
                                                        {deletingId === request.id ? 'Deleting...' : 'Delete'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </SuperAdminLayout>
    );
};

export default UserRequests;
