// src/Dashboard/JobPortal/JobList.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, InputGroup, Modal, Table, Spinner, Alert } from 'react-bootstrap';
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaSearch,
  FaCalendarAlt,
  FaEye,
  FaTrash,
  FaFileAlt,
  FaBuilding,
  FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';

// --- Main Applied Jobs Page Component ---
const JobList = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Fetch applied jobs from API
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await publicAPI.getAppliedJobs();
        if (response?.data?.success) {
          const applications = response.data.data || [];
          // Map API response to component format
          const mappedJobs = applications.map(app => ({
            id: app.id,
            jobTitle: app.job?.title || 'N/A',
            company: app.job?.employer?.company_name || 'N/A',
            location: app.job?.location || 'N/A',
            salary: (app.job?.salary_min || app.job?.salary_max) 
              ? `$${app.job?.salary_min || 0} - $${app.job?.salary_max || 0}` 
              : 'Not Disclosed',
            jobType: app.job?.job_type || 'Full Time',
            appliedDate: new Date(app.applied_at || app.created_at),
            status: app.status || 'Pending',
            logo: null,
            resumeName: app.resume ? app.resume.split('/').pop() : 'N/A',
            coverLetter: app.cover_letter || 'N/A',
            jobId: app.job_id,
            applicationData: app,
          }));
          setAppliedJobs(mappedJobs);
        } else {
          setError(response?.data?.message || 'Failed to fetch applied jobs');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch applied jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchAppliedJobs();
  }, []);

  // Memoize unique values for filter dropdown
  const uniqueStatuses = useMemo(() => ['all', ...new Set(appliedJobs.map(job => job.status))], [appliedJobs]);

  // Filter logic
  const filteredJobs = useMemo(() => {
    let result = appliedJobs;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(job =>
        job.jobTitle.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(job => job.status === filterStatus);
    }

    return result;
  }, [appliedJobs, searchTerm, filterStatus]);

  // --- Handler Functions ---
  const handleViewJob = (jobId) => {
    toast(`Viewing job application (ID: ${jobId})`, { icon: 'ℹ️' });
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleWithdrawApplication = (jobId) => {
    const jobToWithdraw = appliedJobs.find(job => job.id === jobId);
    if (window.confirm(`Are you sure you want to withdraw your application for "${jobToWithdraw?.jobTitle}" at "${jobToWithdraw?.company}"?`)) {
      setAppliedJobs(appliedJobs.filter(job => job.id !== jobId));
      toast.success('Application withdrawn successfully.');
    }
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper function for status badge style
  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'shortlisted':
      case 'accepted':
      case 'hired':
        return { backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' };
      case 'pending':
      case 'in review':
      case 'applied':
        return { backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' };
      case 'not selected':
      case 'rejected':
        return { backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' };
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="danger" style={{ width: '2.5rem', height: '2.5rem' }} />
        <span className="text-muted mt-3 small">Loading applied jobs...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-sm-4 py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: isMobile ? '1.5rem' : '1.875rem' }}>
            Applied Jobs
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.875rem' : '0.95rem' }}>
            Track the status of your job applications.
          </p>
        </div>
        <span className="badge rounded-pill bg-white text-dark px-3 py-2 shadow-sm" style={{ border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
          Total Applications: {appliedJobs.length}
        </span>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4 shadow-sm" style={{ borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <div className="card mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div className="card-body p-3 p-sm-4">
          <Row className="g-3 align-items-center">
            <Col xs={12} md={8}>
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                  <FaSearch style={{ color: '#64748B' }} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={isMobile ? "Search by job title, company..." : "Search by Job Title, Company, or Location..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: '1px solid #CBD5E1', borderLeft: 'none', borderRadius: searchTerm ? '0' : '0 8px 8px 0', fontSize: isMobile ? '0.9rem' : '0.95rem' }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSearchTerm('')}
                    style={{ border: '1px solid #CBD5E1', borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: isMobile ? '0.9rem' : '0.95rem' }}
              >
                <option value="all">All Status</option>
                {uniqueStatuses.filter(s => s !== 'all').map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </div>
      </div>

      {/* Job List Content */}
      <Card className="shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Body className="p-0">
          {filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5 px-3">
              <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9' }}>
                <FaBriefcase style={{ fontSize: '28px', color: '#94A3B8' }} />
              </div>
              <h5 className="fw-bold mb-1" style={{ color: '#1E293B' }}>No Applied Jobs Found</h5>
              <p className="text-muted mb-3 small" style={{ maxWidth: '400px', margin: '0 auto' }}>
                {searchTerm || filterStatus !== 'all'
                  ? 'No applied jobs match your current search and filter criteria.'
                  : 'You have not submitted any job applications yet.'}
              </p>
              {(searchTerm || filterStatus !== 'all') && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  style={{ borderRadius: '6px' }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : isMobile ? (
            /* Mobile View - Modern Card-Based Layout */
            <div className="p-3 d-flex flex-column gap-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="card shadow-sm"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Header */}
                  <div className="p-3 pb-2 d-flex justify-content-between align-items-start gap-2" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ flex: 1 }}>
                      <h6 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '1rem' }}>
                        {job.jobTitle}
                      </h6>
                      <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.85rem' }}>
                        <FaBuilding style={{ fontSize: '0.8rem', color: '#64748B' }} />
                        <span className="fw-medium">{job.company}</span>
                      </div>
                    </div>
                    <span
                      className="badge px-2.5 py-1"
                      style={{
                        ...getStatusBadgeStyle(job.status),
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Card Body Details */}
                  <div className="p-3">
                    <div className="p-2.5 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                      <div className="row g-2">
                        <div className="col-6">
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>Location</div>
                          <div className="fw-medium text-truncate" style={{ color: '#334155', fontSize: '0.82rem' }}>
                            <FaMapMarkerAlt className="me-1 text-danger" style={{ fontSize: '0.75rem' }} />
                            {job.location}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>Applied Date</div>
                          <div className="fw-medium text-truncate" style={{ color: '#334155', fontSize: '0.82rem' }}>
                            <FaCalendarAlt className="me-1 text-primary" style={{ fontSize: '0.75rem' }} />
                            {formatDate(job.appliedDate)}
                          </div>
                        </div>
                        <div className="col-6 pt-1">
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>Salary</div>
                          <div className="fw-semibold text-truncate" style={{ color: '#059669', fontSize: '0.82rem' }}>
                            {job.salary}
                          </div>
                        </div>
                        <div className="col-6 pt-1">
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>Job Type</div>
                          <div className="fw-medium text-truncate" style={{ color: '#475569', fontSize: '0.82rem' }}>
                            {job.jobType}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill d-flex align-items-center justify-content-center gap-1"
                        style={{ borderRadius: '8px', padding: '7px 8px', fontSize: '0.8rem', fontWeight: 500 }}
                        onClick={() => handleViewApplication(job)}
                      >
                        <FaFileAlt /> Application
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="d-flex align-items-center justify-content-center gap-1"
                        style={{ borderRadius: '8px', padding: '7px 12px', fontSize: '0.8rem', fontWeight: 500 }}
                        onClick={() => handleWithdrawApplication(job.id)}
                      >
                        <FaTrash /> Withdraw
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop View - Full Responsive Table */
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <th className="border-0 py-3 ps-4" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>JOB TITLE</th>
                    <th className="border-0 py-3" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>COMPANY</th>
                    <th className="border-0 py-3" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>LOCATION</th>
                    <th className="border-0 py-3" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>APPLIED DATE</th>
                    <th className="border-0 py-3" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                    <th className="border-0 py-3 text-center pe-4" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="py-3 ps-4">
                        <span className="fw-semibold text-dark">{job.jobTitle}</span>
                        <div className="text-muted small">{job.jobType}</div>
                      </td>
                      <td className="py-3 fw-medium text-dark">{job.company}</td>
                      <td className="py-3 text-muted">
                        <FaMapMarkerAlt className="me-1 text-danger" style={{ fontSize: '0.8rem' }} />
                        {job.location}
                      </td>
                      <td className="py-3 text-muted">{formatDate(job.appliedDate)}</td>
                      <td className="py-3">
                        <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(job.status), borderRadius: '6px' }}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 text-center pe-4">
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="d-inline-flex align-items-center gap-1"
                            style={{ borderRadius: '6px', fontSize: '0.82rem' }}
                            onClick={() => handleViewApplication(job)}
                          >
                            <FaFileAlt /> View App
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="d-inline-flex align-items-center gap-1"
                            style={{ borderRadius: '6px', fontSize: '0.82rem' }}
                            onClick={() => handleWithdrawApplication(job.id)}
                          >
                            <FaTrash /> Withdraw
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

      {/* Application Detail Modal */}
      {selectedApplication && (
        <Modal
          show={showApplicationModal}
          onHide={() => setShowApplicationModal(false)}
          centered
          size="lg"
          style={{ zIndex: 1050 }}
        >
          <Modal.Header closeButton style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <Modal.Title className="fw-bold mb-0" style={{ fontSize: '1.2rem', color: '#0F172A' }}>
                Application Details
              </Modal.Title>
              <span className="text-muted small">ID: #{selectedApplication.id}</span>
            </div>
          </Modal.Header>
          <Modal.Body className="p-3 p-sm-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-start gap-2 mb-3 pb-3 border-bottom">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#0F172A' }}>{selectedApplication.jobTitle}</h5>
                <p className="text-muted mb-0 d-flex align-items-center gap-1">
                  <FaBuilding style={{ color: '#64748B' }} />
                  {selectedApplication.company}
                </p>
              </div>
              <span className="badge px-3 py-1.5" style={{ ...getStatusBadgeStyle(selectedApplication.status), borderRadius: '20px' }}>
                {selectedApplication.status}
              </span>
            </div>

            <Row className="g-3 mb-3">
              <Col xs={12} sm={6}>
                <div className="p-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div className="text-muted small mb-1">Applied Date</div>
                  <div className="fw-semibold" style={{ color: '#1E293B' }}>{formatDate(selectedApplication.appliedDate)}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="p-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div className="text-muted small mb-1">Uploaded Resume</div>
                  <div className="fw-semibold text-truncate" style={{ color: '#1E293B' }}>{selectedApplication.resumeName}</div>
                </div>
              </Col>
            </Row>

            <div className="p-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <h6 className="fw-bold mb-2" style={{ color: '#1E293B' }}>Cover Letter</h6>
              <p className="text-muted mb-0 small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {selectedApplication.coverLetter || 'No cover letter submitted.'}
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
            <Button
              variant="secondary"
              onClick={() => setShowApplicationModal(false)}
              style={{ borderRadius: '8px', padding: '8px 20px' }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default JobList;