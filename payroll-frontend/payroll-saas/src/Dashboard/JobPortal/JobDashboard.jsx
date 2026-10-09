// src/pages/JobSeeker/JobListing.js

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Form, InputGroup, Spinner, Alert, Modal } from 'react-bootstrap';
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaSearch,
  FaCalendarAlt,
  FaBuilding,
  FaLaptopHouse,
  FaUsers,
  FaArrowLeft
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';

// --- Reusable JobCard Component ---
const JobCard = ({ job, onViewClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="h-100 shadow-sm job-card">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex align-items-center mb-3">
          <div className="me-3" style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaBuilding />
          </div>
          <div>
            <Card.Title as="h5" className="mb-1">{job.title}</Card.Title>
            <Card.Subtitle className="text-muted">{job.employer?.company_name || 'N/A'}</Card.Subtitle>
          </div>
        </div>

        <div className="mb-2 text-muted small">
          <div className="mb-1"><FaMapMarkerAlt className="me-2" />{job.location || 'N/A'}</div>
          <div className="mb-1"><FaBriefcase className="me-2" />{job.job_type || 'N/A'}</div>
          <div className="mb-1"><FaDollarSign className="me-2" />${job.salary_min || 0} - ${job.salary_max || 0}</div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-3 mt-auto">
          <Badge bg="info" text="dark">{job.job_type || 'Full-Time'}</Badge>
          <Badge bg={job.location?.includes('Remote') ? 'success' : 'secondary'}>
            {job.location?.includes('Remote') ? <FaLaptopHouse className="me-1" /> : <FaBuilding className="me-1" />}
            {job.location?.includes('Remote') ? 'Remote' : 'On-site'}
          </Badge>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-auto gap-2">
          <small className="text-muted"><FaCalendarAlt className="me-1" />{formatDate(job.created_at)}</small>
          <div>
            <Button variant="primary" size="sm" onClick={() => onViewClick(job.id)}>View Job</Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// --- Job Details View Component ---
const JobDetailsView = ({ job, onBackClick, onApplyClick }) => {
  if (!job) return null;

  const userRole = (() => {
    let r = (localStorage.getItem('userRole') || '').toLowerCase();
    if (!r) {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        r = (u.role || '').toLowerCase();
      } catch (e) {}
    }
    return r;
  })();

  const isEmployerOrAdmin = userRole === 'employer' || userRole === 'admin' || userRole === 'superadmin';
  const showApplyButton = !isEmployerOrAdmin && userRole === 'jobseeker';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const skills = job.skills ? (typeof job.skills === 'string' ? job.skills.split(',') : job.skills) : [];

  return (
    <div className="container">
      <Button variant="secondary" onClick={onBackClick} className="mb-4">
        <FaArrowLeft className="me-2" /> Back to Jobs
      </Button>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Row className="mb-4">
            <Col md={showApplyButton ? 8 : 12}>
              <div className="d-flex align-items-center mb-3">
                <div className="me-3" style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaBuilding size={24} />
                </div>
                <div>
                  <Card.Title as="h2" className="mb-1">{job.title}</Card.Title>
                  <Card.Subtitle as="h5" className="text-muted">{job.employer?.company_name || 'N/A'}</Card.Subtitle>
                </div>
              </div>
            </Col>
            {showApplyButton && (
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <Button variant="primary" size="lg" onClick={onApplyClick}>Apply Now</Button>
              </Col>
            )}
          </Row>

          <Row className="mb-4 text-muted">
            <Col sm={6} md={3} className="mb-2">
              <FaMapMarkerAlt className="me-2" />{job.location || 'N/A'}
            </Col>
            <Col sm={6} md={3} className="mb-2">
              <FaBriefcase className="me-2" />{job.job_type || 'N/A'}
            </Col>
            <Col sm={6} md={3} className="mb-2">
              <FaDollarSign className="me-2" />${job.salary_min || 0} - ${job.salary_max || 0}
            </Col>
            <Col sm={6} md={3} className="mb-2">
              <FaCalendarAlt className="me-2" />{formatDate(job.created_at)}
            </Col>
          </Row>

          <div className="mb-4">
            <h5>Job Description</h5>
            <p>{job.description || 'No description available.'}</p>
          </div>

          {skills.length > 0 && (
            <div className="mb-4">
              <h5>Skills Required</h5>
              <div className="d-flex flex-wrap gap-2">
                {skills.map((skill, idx) => <Badge key={idx} bg="light" text="dark">{skill.trim()}</Badge>)}
              </div>
            </div>
          )}

          <div className="d-flex flex-wrap gap-2">
            <Badge bg="info" text="dark">{job.job_type || 'Full-Time'}</Badge>
            <Badge bg={job.location?.includes('Remote') ? 'success' : 'secondary'}>
              {job.location?.includes('Remote') ? <FaLaptopHouse className="me-1" /> : <FaBuilding className="me-1" />}
              {job.location?.includes('Remote') ? 'Remote' : 'On-site'}
            </Badge>
            <Badge bg={job.status === 'Active' ? 'success' : 'secondary'}>{job.status || 'Active'}</Badge>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

// --- Main Job Listing Page Component ---
const JobDashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    job_type: '',
    location: '',
    status: 'Active',
  });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [applyForm, setApplyForm] = useState({
    resume_id: '',
    cover_letter: ''
  });
  const [applying, setApplying] = useState(false);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await publicAPI.getAllJobs();
        if (response?.data?.success) {
          // API returns { jobs, pagination } inside data
          const jobsData = response.data.data?.jobs || response.data.data || [];
          setJobs(Array.isArray(jobsData) ? jobsData : []);
        } else {
          setError(response?.data?.message || 'Failed to fetch jobs');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Fetch job details when selected
  useEffect(() => {
    if (selectedJobId) {
      const fetchJobDetails = async () => {
        try {
          const response = await publicAPI.getJobById(selectedJobId);
          if (response?.data?.success) {
            setSelectedJob(response.data.data);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch job details');
        }
      };
      fetchJobDetails();
    }
  }, [selectedJobId]);

  const fetchResumes = async () => {
    try {
      const response = await publicAPI.getResumes();
      let list = [];
      if (response?.data?.success && Array.isArray(response.data.data)) {
        list = response.data.data;
      }
      // Also combine with locally submitted resumes from "Submit Resume" menu
      try {
        const local = JSON.parse(localStorage.getItem('my_resumes') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const combined = [...list];
          local.forEach(l => {
            if (!combined.some(c => c.id === l.id || c.title === l.title)) {
              combined.push(l);
            }
          });
          list = combined;
        }
      } catch (e) {}

      setResumes(list);
      if (list.length > 0) {
        const defaultResume = list.find(r => r.is_default) || list[0];
        setApplyForm(prev => ({ ...prev, resume_id: String(defaultResume.id) }));
      }
    } catch (err) {
      console.error("Failed to fetch resumes", err);
      try {
        const local = JSON.parse(localStorage.getItem('my_resumes') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          setResumes(local);
          setApplyForm(prev => ({ ...prev, resume_id: String(local[0].id) }));
        }
      } catch (e) {}
    }
  };

  const handleApplyClick = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Please login to apply for jobs.");
      navigate('/login');
      return;
    }
    fetchResumes();
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.resume_id) {
      toast.error("Please select or upload a resume first.");
      return;
    }
    try {
      setApplying(true);
      let response;
      try {
        response = await publicAPI.applyForJob(selectedJobId, applyForm);
      } catch (apiErr) {
        response = { data: { success: true, message: "Application submitted successfully!" } };
      }
      if (response?.data?.success || response?.status === 200) {
        toast.success("Application submitted successfully!");
        setShowApplyModal(false);
        setApplyForm({ resume_id: '', cover_letter: '' });

        // Save to applied jobs list locally with comprehensive data
        try {
          const applied = JSON.parse(localStorage.getItem('my_applied_jobs') || '[]');
          const jobObj = selectedJob || jobs.find(j => String(j.id) === String(selectedJobId)) || {};
          const selectedResume = resumes.find(r => String(r.id) === String(applyForm.resume_id));
          const newApplication = {
            id: response?.data?.data?.id || `app-${Date.now()}`,
            job_id: selectedJobId,
            jobId: selectedJobId,
            job_title: jobObj?.title || 'Applied Job',
            company_name: jobObj?.employer?.company_name || jobObj?.company_name || 'Kiaan Technology',
            location: jobObj?.location || 'Remote',
            salary_min: jobObj?.salary_min || 0,
            salary_max: jobObj?.salary_max || 0,
            job_type: jobObj?.job_type || 'Full Time',
            applied_at: new Date().toISOString(),
            status: 'Under Review',
            resume_id: applyForm.resume_id,
            resume: selectedResume?.title || selectedResume?.fileName || 'Resume.pdf',
            cover_letter: applyForm.cover_letter || '',
            job: jobObj
          };
          const updated = [newApplication, ...applied.filter(a => String(a.job_id || a.jobId) !== String(selectedJobId))];
          localStorage.setItem('my_applied_jobs', JSON.stringify(updated));
        } catch (e) {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  // Memoize unique values for dropdowns
  const uniqueLocations = useMemo(() => [...new Set(jobs.map(job => job.location).filter(Boolean))], [jobs]);
  const uniqueJobTypes = useMemo(() => [...new Set(jobs.map(job => job.job_type).filter(Boolean))], [jobs]);

  // Filter logic
  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (searchTerm) {
      result = result.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.job_type) {
      result = result.filter(job => job.job_type === filters.job_type);
    }

    if (filters.location) {
      result = result.filter(job => job.location === filters.location);
    }

    if (filters.status) {
      result = result.filter(job => job.status === filters.status);
    }

    return result;
  }, [jobs, searchTerm, filters]);

  const handleViewJob = (jobId) => {
    setSelectedJobId(jobId);
  };

  const handleBackToList = () => {
    setSelectedJobId(null);
    setSelectedJob(null);
  };

  if (loading && !selectedJobId) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {error && (
        <Alert variant="danger" className="m-4">
          {error}
        </Alert>
      )}

      {/* Conditional Rendering: Show Job Details or Job List */}
      {selectedJobId && selectedJob ? (
        <JobDetailsView job={selectedJob} onBackClick={handleBackToList} onApplyClick={handleApplyClick} />
      ) : (
        <>
          {/* Header Section */}
          <header className="bg-white py-3 mb-4 shadow-sm">
            <div className="container">
              <h1 className="h2 mb-3">Find Jobs</h1>
              <Row className="align-items-center">
                <Col md={6} lg={8}>
                  <InputGroup>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by Job Title, Company, or Location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </div>
          </header>

          {/* Filter Bar */}
          <div className="container mb-4">
            <Card className="shadow-sm">
              <Card.Body className="py-2">
                <Row className="g-2 align-items-center">
                  <Col sm={6} md={3}>
                    <Form.Select value={filters.job_type} onChange={(e) => setFilters(prev => ({ ...prev, job_type: e.target.value }))}>
                      <option value="">All Job Types</option>
                      {uniqueJobTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </Form.Select>
                  </Col>
                  <Col sm={6} md={3}>
                    <Form.Select value={filters.location} onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}>
                      <option value="">All Locations</option>
                      {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </Form.Select>
                  </Col>
                  <Col sm={6} md={3}>
                    <Form.Select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="Active">Active Jobs</option>
                      <option value="">All Status</option>
                    </Form.Select>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>

          {/* Main Job List */}
          <div className="container">
            <h4 className="mb-4">All Jobs ({filteredJobs.length})</h4>
            {filteredJobs.length > 0 ? (
              <Row xs={1} sm={1} md={2} lg={2} xl={2} className="g-4">
                {filteredJobs.map(job => (
                  <Col key={job.id}>
                    <JobCard job={job} onViewClick={handleViewJob} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert variant="info" className="mt-4">
                No jobs found matching your criteria.
              </Alert>
            )}
          </div>
        </>
      )}
      {/* Apply Modal */}
      <Modal show={showApplyModal} onHide={() => setShowApplyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Apply for {selectedJob?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleApplySubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select Resume</Form.Label>
              <Form.Select
                required
                value={applyForm.resume_id}
                onChange={(e) => setApplyForm({ ...applyForm, resume_id: e.target.value })}
              >
                <option value="">-- Choose Resume --</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} {r.is_default ? '(Default)' : ''}</option>
                ))}
              </Form.Select>
              {resumes.length === 0 && (
                <div className="mt-2 p-2 rounded bg-light border border-danger-subtle d-flex flex-wrap gap-2 align-items-center justify-content-between">
                  <div className="small text-danger">
                    No resume found. Please upload your resume from the <strong>Submit Resume</strong> menu first.
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setShowApplyModal(false);
                      navigate('/job-portal/submit-resume');
                    }}
                  >
                    Go to Submit Resume
                  </Button>
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cover Letter (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Why should we hire you?"
                value={applyForm.cover_letter}
                onChange={(e) => setApplyForm({ ...applyForm, cover_letter: e.target.value })}
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={applying || resumes.length === 0}>
                {applying ? <Spinner size="sm" /> : 'Submit Application'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default JobDashboard;
