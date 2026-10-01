// src/pages/Employee/JobApplication.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Modal, Form, InputGroup, Dropdown, Alert, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../services/api';
import { publicAPI } from '../../services/api';
import {
  FaBriefcase,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaClock,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaInfoCircle,
  FaUserTie,
  FaEllipsisV,
  FaFileUpload,
  FaFileAlt,
  FaTrash,
  FaEye,
  FaDownload
} from 'react-icons/fa';

// Color Palette
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
  lightBg: '#F8F9FA',
  successGreen: '#28A745',
  warningOrange: '#FFC107',
  lightRed: '#FFEBEE',
};

const JobApplication = () => {
  const navigate = useNavigate();
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('postedDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterAppliedDate, setFilterAppliedDate] = useState('all');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const fileInputRef = useRef(null);

  // Custom Dropdown states and refs
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const statusDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentApplications, setCurrentApplications] = useState([]);
  const [newJobs, setNewJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch job applications and available jobs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch applied jobs
        const applicationsRes = await employeeAPI.getMyApplications();
        if (applicationsRes?.data?.success) {
          const applications = applicationsRes.data.data || [];
          setCurrentApplications(applications.map(app => ({
            id: app.id,
            title: app.job_title || 'N/A',
            company: app.company_name || 'N/A',
            location: app.location || 'N/A',
            salary: app.salary_min ? `$${app.salary_min} - $${app.salary_max}` : 'N/A',
            postedDate: app.job_created_at || '',
            appliedDate: app.applied_at || app.created_at,
            status: app.status || 'Pending',
            experience: app.experience || 'N/A',
            skills: app.skills ? (typeof app.skills === 'string' ? app.skills.split(',') : app.skills) : [],
            jobType: app.job_type || 'Full-time',
            description: app.job_description || '',
            resumeUrl: app.resume || '',
          })));
        }

        // Fetch available jobs
        const jobsRes = await employeeAPI.getAllJobs();
        if (jobsRes?.data?.success) {
          const jobs = jobsRes.data.data || [];
          setNewJobs(jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.employer?.company_name || job.company_name || 'N/A',
            location: job.location,
            salary: `$${job.salary_min || 0} - $${job.salary_max || 0}`,
            postedDate: job.created_at,
            experience: job.experience_required || 'N/A',
            skills: job.skills ? (typeof job.skills === 'string' ? job.skills.split(',') : job.skills) : [],
            jobType: job.job_type,
            description: job.description || '',
          })));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [applicationForm, setApplicationForm] = useState({
    coverLetter: '',
    expectedSalary: '',
    availableFromDate: '',
    currentCTC: '',
    noticePeriod: '',
  });

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: windowWidth < 768 ? '0 10px' : '0 15px',
  };

  const cardStyle = {
    backgroundColor: colors.white,
    border: `1px solid ${colors.lightGray}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '20px',
    transition: 'transform 0.3s ease',
    height: '100%',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    padding: windowWidth < 768 ? '8px 12px' : '10px 14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    fontSize: windowWidth < 768 ? '12px' : '14px',
  };

  const buttonStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    border: 'none',
    padding: windowWidth < 768 ? '6px 10px' : '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: windowWidth < 768 ? '11px' : '12px',
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: colors.primaryRed,
    border: `1px solid ${colors.primaryRed}`,
    padding: windowWidth < 768 ? '6px 10px' : '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: windowWidth < 768 ? '11px' : '12px',
  };

  const tabStyle = {
    padding: windowWidth < 768 ? '6px 10px' : '8px 14px',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    color: colors.darkGray,
    fontWeight: '500',
    transition: 'all 0.2s',
    fontSize: windowWidth < 768 ? '11px' : '13px',
  };

  const activeTabStyle = {
    ...tabStyle,
    color: colors.primaryRed,
    borderBottom: `3px solid ${colors.primaryRed}`,
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return String(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    } catch (e) {
      return String(dateString);
    }
  };

  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetailModal(true);
  };

  const handleApplyJob = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf' &&
        file.type !== 'application/msword' &&
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        toast.error('Please upload a PDF or Word document');
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setResumeFile(file);

      // Create preview for PDF files
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          setResumePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setResumePreview(null);
      }
    }
  };

  const handleUploadResume = () => {
    if (!resumeFile) {
      toast.error('Please select a resume file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // In a real app, this would be an API call to upload resume
    // API endpoint: POST /api/employee/upload-resume
    // Request body: FormData with resume file
    // Response: { success: true, fileUrl: 'https://example.com/resume.pdf' }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();

    if (!selectedJob) return;

    try {
      setIsUploading(true);
      setError(null);

      // Upload resume first if file is selected
      let resumeId = null;
      if (resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        const uploadRes = await publicAPI.uploadResume(formData);
        if (uploadRes?.data?.success) {
          resumeId = uploadRes.data.data.id;
        }
      }

      // Apply for job
      const applyData = {
        job_id: selectedJob.id,
        resume_id: resumeId,
        cover_letter: applicationForm.coverLetter || '',
        experience: applicationForm.experience || '',
        skills: Array.isArray(applicationForm.skills) ? applicationForm.skills.join(',') : applicationForm.skills || '',
        education: applicationForm.education || '',
        phone: applicationForm.phone || '',
      };

      const response = await employeeAPI.applyForJob(selectedJob.id, applyData);

      if (response?.data?.success) {
        setShowApplyModal(false);
        setShowJobDetailModal(false);
        toast.success('Your application has been submitted successfully!');
        setActiveTab('applications');

        // Refresh applications list
        const applicationsRes = await employeeAPI.getMyApplications();
        if (applicationsRes?.data?.success) {
          const applications = applicationsRes.data.data || [];
          setCurrentApplications(applications.map(app => ({
            id: app.id,
            title: app.job_title || 'N/A',
            company: app.company_name || 'N/A',
            location: app.location || 'N/A',
            salary: app.salary_min ? `$${app.salary_min} - $${app.salary_max}` : 'N/A',
            postedDate: app.job_created_at || '',
            appliedDate: app.applied_at || app.created_at,
            status: app.status || 'Pending',
            experience: app.experience || 'N/A',
            skills: app.skills ? (typeof app.skills === 'string' ? app.skills.split(',') : app.skills) : [],
            jobType: app.job_type || 'Full-time',
            description: app.job_description || '',
            resumeUrl: app.resume || '',
          })));
        }

        // Refresh available jobs
        const jobsRes = await employeeAPI.getAllJobs();
        if (jobsRes?.data?.success) {
          const jobs = jobsRes.data.data || [];
          setNewJobs(jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.employer?.company_name || job.company_name || 'N/A',
            location: job.location,
            salary: `$${job.salary_min || 0} - $${job.salary_max || 0}`,
            postedDate: job.created_at,
            experience: job.experience_required || 'N/A',
            skills: job.skills ? (typeof job.skills === 'string' ? job.skills.split(',') : job.skills) : [],
            jobType: job.job_type,
            description: job.description || '',
          })));
        }

        // Reset form
        setApplicationForm({
          coverLetter: '',
          expectedSalary: '',
          availableFromDate: '',
          currentCTC: '',
          noticePeriod: '',
        });
        setResumeFile(null);
        setResumePreview(null);
        setSelectedJob(null);

      } else {
        toast.error(response?.data?.message || 'Failed to submit application');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort style={{ opacity: 0.6 }} />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const applicationStatuses = ['all', ...new Set(currentApplications.map(app => app.status).filter(Boolean))];

  const applyFiltersAndSort = (jobs) => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter for applications
    if (activeTab === 'applications' && filterStatus !== 'all') {
      filtered = filtered.filter(job =>
        (job.status || '').toString().toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Apply applied date filter for applications
    if (activeTab === 'applications' && filterAppliedDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(app => {
        if (!app.appliedDate) return false;
        const aDate = new Date(app.appliedDate);
        if (isNaN(aDate.getTime())) return true;
        const appDay = new Date(aDate.getFullYear(), aDate.getMonth(), aDate.getDate());

        if (filterAppliedDate === 'today') {
          return appDay.getTime() === today.getTime();
        } else if (filterAppliedDate === 'thisWeek') {
          const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return appDay >= sevenDaysAgo && appDay <= today;
        } else if (filterAppliedDate === 'thisMonth') {
          return appDay.getFullYear() === today.getFullYear() && appDay.getMonth() === today.getMonth();
        } else if (filterAppliedDate === 'last30Days') {
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return appDay >= thirtyDaysAgo && appDay <= today;
        }
        return true;
      });
    }

    // Apply location filter for new jobs
    if (activeTab === 'newjobs' && filterLocation !== 'all') {
      filtered = filtered.filter(job =>
        (job.location || '').toString().toLowerCase() === filterLocation.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'postedDate' || sortBy === 'appliedDate') {
        aValue = aValue ? new Date(aValue).getTime() || 0 : 0;
        bValue = bValue ? new Date(bValue).getTime() || 0 : 0;
      } else if (sortBy === 'salary') {
        aValue = parseFloat((aValue || '').toString().replace(/[^0-9.-]+/g, '')) || 0;
        bValue = parseFloat((bValue || '').toString().replace(/[^0-9.-]+/g, '')) || 0;
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (aValue === bValue) return 0;
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredApplications = applyFiltersAndSort(currentApplications);
  const filteredNewJobs = applyFiltersAndSort(newJobs);

  // Get unique locations for filter dropdown
  const locations = [...new Set(newJobs.map(job => job.location))];

  // Responsive application table component
  const ResponsiveApplicationTable = () => {
    if (windowWidth < 768) {
      // Mobile view - card layout
      return (
        <div className="row">
          {filteredApplications.map(application => (
            <div key={application.id} className="col-12 mb-3">
              <Card className="h-100" style={{ border: `1px solid ${colors.lightGray}` }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1" style={{ fontSize: '14px', fontWeight: '600' }}>{application.title}</h5>
                      <p className="mb-1" style={{ fontSize: '12px', color: colors.darkGray }}>{application.company}</p>
                      <div className="d-flex flex-wrap gap-1">
                        <Badge
                          bg={
                            application.status === 'Accepted' ? 'success' :
                              application.status === 'Rejected' ? 'danger' : 'warning'
                          }
                          style={{ fontSize: '10px' }}
                        >
                          {application.status}
                        </Badge>
                        <Badge bg="light" text="dark" style={{ fontSize: '10px' }}>
                          {application.experience}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-end">
                      <h5 className="mb-0" style={{ fontSize: '14px', fontWeight: '600', color: colors.primaryRed }}>
                        {application.salary}
                      </h5>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="d-flex align-items-center mb-1">
                      <FaMapMarkerAlt className="me-2" size={12} color={colors.darkGray} />
                      <span style={{ fontSize: '12px', color: colors.darkGray }}>{application.location}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-2" size={12} color={colors.darkGray} />
                      <span style={{ fontSize: '12px', color: colors.darkGray }}>Applied: {formatDate(application.appliedDate)}</span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex flex-wrap gap-1">
                      {application.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} bg="light" text="dark" style={{ fontSize: '10px' }}>
                          {skill}
                        </Badge>
                      ))}
                      {application.skills.length > 3 && (
                        <Badge bg="light" text="dark" style={{ fontSize: '10px' }}>
                          +{application.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.primaryRed, padding: '0', fontSize: '12px' }}
                      onClick={() => handleViewJobDetails(application)}
                    >
                      <FaInfoCircle /> Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      );
    } else {
      // Desktop view - table layout
      return (
        <div className="table-responsive">
          <Table hover className="align-middle" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Job Title {getSortIcon('title')}
                </th>
                <th onClick={() => handleSort('company')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Company {getSortIcon('company')}
                </th>
                <th onClick={() => handleSort('location')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Location {getSortIcon('location')}
                </th>
                <th onClick={() => handleSort('salary')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Salary {getSortIcon('salary')}
                </th>
                <th onClick={() => handleSort('appliedDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Applied Date {getSortIcon('appliedDate')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status {getSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map(application => (
                <tr key={application.id}>
                  <td style={{ fontWeight: '600', fontSize: '12px' }}>{application.title}</td>
                  <td style={{ fontSize: '12px' }}>{application.company}</td>
                  <td style={{ fontSize: '12px' }}>{application.location}</td>
                  <td style={{ fontSize: '12px' }}>{application.salary}</td>
                  <td style={{ fontSize: '12px' }}>{formatDate(application.appliedDate)}</td>
                  <td>
                    <Badge
                      bg={
                        application.status === 'Accepted' ? 'success' :
                          application.status === 'Rejected' ? 'danger' : 'warning'
                      }
                      style={{ fontSize: '11px' }}
                    >
                      {application.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.primaryRed, padding: '0', fontSize: '12px' }}
                      onClick={() => handleViewJobDetails(application)}
                    >
                      <FaInfoCircle />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }
  };

  // Responsive new jobs table component
  const ResponsiveNewJobsTable = () => {
    if (windowWidth < 768) {
      // Mobile view - card layout
      return (
        <div className="row">
          {filteredNewJobs.map(job => (
            <div key={job.id} className="col-12 mb-3">
              <Card className="h-100" style={{ border: `1px solid ${colors.lightGray}` }}>
                <Card.Body className="p-3">
                  <div className="mb-2">
                    <h5 className="mb-1" style={{ fontSize: '14px', fontWeight: '600' }}>{job.title}</h5>
                    <p className="mb-1" style={{ fontSize: '12px', color: colors.darkGray }}>{job.company}</p>
                    <div className="d-flex flex-wrap gap-1">
                      <Badge bg="light" text="dark" style={{ fontSize: '10px' }}>
                        {job.experience}
                      </Badge>
                      <Badge bg="light" text="dark" style={{ fontSize: '10px' }}>
                        {job.jobType}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="d-flex align-items-center mb-1">
                      <FaMapMarkerAlt className="me-2" size={12} color={colors.darkGray} />
                      <span style={{ fontSize: '12px', color: colors.darkGray }}>{job.location}</span>
                    </div>
                    <div className="d-flex align-items-center mb-1">
                      <FaMoneyBillWave className="me-2" size={12} color={colors.darkGray} />
                      <span style={{ fontSize: '12px', color: colors.darkGray }}>{job.salary}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-2" size={12} color={colors.darkGray} />
                      <span style={{ fontSize: '12px', color: colors.darkGray }}>Posted: {formatDate(job.postedDate)}</span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} bg="light" text="dark" style={{ fontSize: '10px' }}>
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 3 && (
                        <Badge bg="light" text="dark" style={{ fontSize: '10px' }}>
                          +{job.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      style={buttonStyle}
                      onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                      onClick={() => handleApplyJob(job)}
                    >
                      Apply
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      );
    } else {
      // Desktop view - table layout
      return (
        <div className="table-responsive">
          <Table hover className="align-middle" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Job Title {getSortIcon('title')}
                </th>
                <th onClick={() => handleSort('company')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Company {getSortIcon('company')}
                </th>
                <th onClick={() => handleSort('location')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Location {getSortIcon('location')}
                </th>
                <th onClick={() => handleSort('salary')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Salary {getSortIcon('salary')}
                </th>
                <th onClick={() => handleSort('postedDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Posted Date {getSortIcon('postedDate')}
                </th>
                <th onClick={() => handleSort('experience')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Experience {getSortIcon('experience')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNewJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: '600', fontSize: '12px' }}>{job.title}</td>
                  <td style={{ fontSize: '12px' }}>{job.company}</td>
                  <td style={{ fontSize: '12px' }}>{job.location}</td>
                  <td style={{ fontSize: '12px' }}>{job.salary}</td>
                  <td style={{ fontSize: '12px' }}>{formatDate(job.postedDate)}</td>
                  <td>
                    <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>
                      {job.experience}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex">
                      <Button
                        variant="link"
                        size="sm"
                        style={{ color: colors.primaryRed, padding: '0', fontSize: '12px', marginRight: '8px' }}
                        onClick={() => handleViewJobDetails(job)}
                      >
                        <FaInfoCircle />
                      </Button>
                      <Button
                        style={buttonStyle}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                        onClick={() => handleApplyJob(job)}
                      >
                        Apply
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', }}>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}`,
        padding: '12px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={containerStyle}>
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <div className="d-flex align-items-center">
              <Button
                variant="link"
                className="me-2 p-0"
                onClick={() => navigate('/Employee/dashboard')}
                style={{ color: colors.primaryRed }}
              >
                <FaArrowLeft size={18} />
              </Button>
              <h2 style={{ color: colors.black, margin: 0, fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: '700' }}>
                Job Applications
              </h2>
            </div>
            <div className="w-100 w-sm-auto" style={{ maxWidth: windowWidth < 576 ? '100%' : '260px' }}>
              <InputGroup size="sm">
                <InputGroup.Text style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRight: 'none' }}>
                  <FaSearch size={13} color={colors.darkGray} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search jobs, companies, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '13px', border: '1px solid #CBD5E1', borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                />
              </InputGroup>
            </div>
          </div>
        </div>
      </div>

      <div style={containerStyle} className="py-3 py-md-4">
        {/* Success Alert */}
        {showSuccessAlert && (
          <Alert
            variant="success"
            className="d-flex align-items-center mb-3"
            style={{ fontSize: windowWidth < 768 ? '12px' : '14px' }}
            onClose={() => setShowSuccessAlert(false)}
            dismissible
          >
            <FaCheckCircle className="me-2" />
            Your application has been submitted successfully!
          </Alert>
        )}

        {/* Tabs */}
        <div className="d-flex mb-3 gap-2 overflow-auto" style={{ borderBottom: `1px solid ${colors.lightGray}`, WebkitOverflowScrolling: 'touch' }}>
          <div
            style={activeTab === 'applications' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('applications')}
            className="text-nowrap"
          >
            Current Applications ({currentApplications.length})
          </div>
          <div
            style={activeTab === 'newjobs' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('newjobs')}
            className="text-nowrap"
          >
            New Jobs ({newJobs.length})
          </div>
        </div>

        {activeTab === 'applications' && (
          <Card style={cardStyle}>
            <div 
              style={{
                backgroundColor: colors.primaryRed,
                color: colors.white,
                padding: windowWidth < 576 ? '10px 12px' : '12px 16px',
                fontWeight: '600',
              }}
              className="d-flex flex-wrap justify-content-between align-items-center gap-2"
            >
              <div className="d-flex align-items-center">
                <FaBriefcase className="me-2" />
                <span style={{ fontSize: windowWidth < 576 ? '13px' : '15px' }}>Current Applications</span>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center ms-auto">
                {/* Status Filter Dropdown */}
                <div className="position-relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowDateDropdown(false);
                    }}
                    className="btn btn-sm btn-light d-flex align-items-center gap-1 shadow-sm text-nowrap"
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 10px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      color: colors.primaryRed,
                      backgroundColor: '#FFFFFF',
                      border: 'none',
                    }}
                  >
                    <span>Status: {filterStatus === 'all' ? 'All' : filterStatus}</span>
                  </button>
                  {showStatusDropdown && (
                    <div
                      className="position-absolute shadow-lg bg-white rounded-3 py-2 border"
                      style={{
                        top: 'calc(100% + 5px)',
                        left: 0,
                        minWidth: '150px',
                        maxWidth: 'calc(100vw - 24px)',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        zIndex: 1070,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div className="px-3 py-1 text-muted small fw-bold text-uppercase" style={{ fontSize: '10px' }}>Filter Status</div>
                      {applicationStatuses.map((st) => (
                        <div
                          key={st}
                          onClick={() => {
                            setFilterStatus(st);
                            setShowStatusDropdown(false);
                          }}
                          className="px-3 py-1.5 small"
                          style={{
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '6px 14px',
                            backgroundColor: filterStatus.toLowerCase() === st.toLowerCase() ? colors.primaryRed : 'transparent',
                            color: filterStatus.toLowerCase() === st.toLowerCase() ? '#ffffff' : '#333333',
                            fontWeight: filterStatus.toLowerCase() === st.toLowerCase() ? '600' : 'normal',
                          }}
                        >
                          {st === 'all' ? 'All Statuses' : st}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applied Date Sort & Filter Dropdown */}
                <div className="position-relative" ref={dateDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDateDropdown(!showDateDropdown);
                      setShowStatusDropdown(false);
                    }}
                    className="btn btn-sm btn-light d-flex align-items-center gap-1 shadow-sm text-nowrap"
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 10px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      color: colors.primaryRed,
                      backgroundColor: '#FFFFFF',
                      border: 'none',
                    }}
                  >
                    <FaCalendarAlt size={11} />
                    <span>Applied Date {filterAppliedDate !== 'all' ? `(${filterAppliedDate})` : (sortBy === 'appliedDate' ? (sortOrder === 'desc' ? '↓' : '↑') : '▾')}</span>
                  </button>
                  {showDateDropdown && (
                    <div
                      className="position-absolute shadow-lg bg-white rounded-3 py-2 border"
                      style={{
                        top: 'calc(100% + 5px)',
                        right: 0,
                        left: 'auto',
                        minWidth: '190px',
                        maxWidth: 'calc(100vw - 24px)',
                        zIndex: 1070,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div className="px-3 py-1 text-muted fw-bold text-uppercase" style={{ fontSize: '10px' }}>Sort Order</div>
                      <div
                        onClick={() => { setSortBy('appliedDate'); setSortOrder('desc'); setShowDateDropdown(false); }}
                        className="px-3 py-1.5 small text-dark d-flex justify-content-between align-items-center"
                        style={{ cursor: 'pointer', fontSize: '12px', padding: '6px 14px' }}
                      >
                        <span>Newest Applied First</span>
                        {sortBy === 'appliedDate' && sortOrder === 'desc' && <span className="text-danger fw-bold ms-2">✓</span>}
                      </div>
                      <div
                        onClick={() => { setSortBy('appliedDate'); setSortOrder('asc'); setShowDateDropdown(false); }}
                        className="px-3 py-1.5 small text-dark d-flex justify-content-between align-items-center"
                        style={{ cursor: 'pointer', fontSize: '12px', padding: '6px 14px' }}
                      >
                        <span>Oldest Applied First</span>
                        {sortBy === 'appliedDate' && sortOrder === 'asc' && <span className="text-danger fw-bold ms-2">✓</span>}
                      </div>
                      <div className="dropdown-divider my-1 border-top" style={{ borderColor: '#E2E8F0' }} />
                      <div className="px-3 py-1 text-muted fw-bold text-uppercase" style={{ fontSize: '10px' }}>Filter by Applied Date</div>
                      {[
                        { key: 'all', label: 'All Dates' },
                        { key: 'today', label: 'Applied Today' },
                        { key: 'thisWeek', label: 'Applied Last 7 Days' },
                        { key: 'thisMonth', label: 'Applied This Month' },
                        { key: 'last30Days', label: 'Last 30 Days' },
                      ].map((item) => (
                        <div
                          key={item.key}
                          onClick={() => { setFilterAppliedDate(item.key); setShowDateDropdown(false); }}
                          className="px-3 py-1.5 small d-flex justify-content-between align-items-center"
                          style={{
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '6px 14px',
                            backgroundColor: filterAppliedDate === item.key ? colors.primaryRed : 'transparent',
                            color: filterAppliedDate === item.key ? '#ffffff' : '#333333',
                            fontWeight: filterAppliedDate === item.key ? '600' : 'normal',
                          }}
                        >
                          <span>{item.label}</span>
                          {filterAppliedDate === item.key && <span className="fw-bold ms-2">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Card.Body className="p-2 p-sm-3">
              {filteredApplications.length > 0 ? (
                <ResponsiveApplicationTable />
              ) : (
                <div className="text-center py-4">
                  <FaBriefcase size={40} color={colors.lightGray} />
                  <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>
                    No applications found matching your criteria
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'newjobs' && (
          <Card style={cardStyle}>
            <div 
              style={{
                backgroundColor: colors.primaryRed,
                color: colors.white,
                padding: windowWidth < 576 ? '10px 12px' : '12px 16px',
                fontWeight: '600',
              }}
              className="d-flex flex-wrap justify-content-between align-items-center gap-2"
            >
              <div className="d-flex align-items-center">
                <FaBriefcase className="me-2" />
                <span style={{ fontSize: windowWidth < 576 ? '13px' : '15px' }}>New Jobs List</span>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center ms-auto">
                <div className="position-relative" ref={locationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="btn btn-sm btn-light d-flex align-items-center gap-1 shadow-sm text-nowrap"
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 10px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      color: colors.primaryRed,
                      backgroundColor: '#FFFFFF',
                      border: 'none',
                    }}
                  >
                    <span>Location: {filterLocation === 'all' ? 'All' : filterLocation}</span>
                  </button>
                  {showLocationDropdown && (
                    <div
                      className="position-absolute shadow-lg bg-white rounded-3 py-2 border"
                      style={{
                        top: 'calc(100% + 5px)',
                        left: 0,
                        minWidth: '160px',
                        maxWidth: 'calc(100vw - 24px)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 1070,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div
                        onClick={() => { setFilterLocation('all'); setShowLocationDropdown(false); }}
                        className="px-3 py-1.5 small"
                        style={{
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '6px 14px',
                          backgroundColor: filterLocation === 'all' ? colors.primaryRed : 'transparent',
                          color: filterLocation === 'all' ? '#ffffff' : '#333333',
                          fontWeight: filterLocation === 'all' ? '600' : 'normal',
                        }}
                      >
                        All Locations
                      </div>
                      {locations.map(location => (
                        <div
                          key={location}
                          onClick={() => { setFilterLocation(location); setShowLocationDropdown(false); }}
                          className="px-3 py-1.5 small"
                          style={{
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '6px 14px',
                            backgroundColor: filterLocation === location ? colors.primaryRed : 'transparent',
                            color: filterLocation === location ? '#ffffff' : '#333333',
                            fontWeight: filterLocation === location ? '600' : 'normal',
                          }}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handleSort('postedDate')}
                  className="shadow-sm text-nowrap"
                  style={{
                    fontSize: '11.5px',
                    padding: '5px 10px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    color: colors.primaryRed,
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                  }}
                >
                  Posted Date {getSortIcon('postedDate')}
                </Button>
              </div>
            </div>
            <Card.Body className="p-2 p-sm-3">
              {filteredNewJobs.length > 0 ? (
                <ResponsiveNewJobsTable />
              ) : (
                <div className="text-center py-4">
                  <FaBriefcase size={40} color={colors.lightGray} />
                  <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>
                    No jobs found matching your criteria
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Job Details Modal */}
      <Modal show={showJobDetailModal} onHide={() => setShowJobDetailModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Job Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && (
            <div>
              <div className="mb-3">
                <h4 style={{ color: colors.black, fontWeight: '600', fontSize: '18px' }}>{selectedJob.title}</h4>
                <h5 style={{ color: colors.darkGray, fontSize: '16px' }}>{selectedJob.company}</h5>
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <FaMapMarkerAlt className="me-2" color={colors.primaryRed} />
                    <span style={{ fontSize: '13px' }}>Location: {selectedJob.location}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaMoneyBillWave className="me-2" color={colors.primaryRed} />
                    <span style={{ fontSize: '13px' }}>Salary: {selectedJob.salary}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FaClock className="me-2" color={colors.primaryRed} />
                    <span style={{ fontSize: '13px' }}>Experience: {selectedJob.experience}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <FaCalendarAlt className="me-2" color={colors.primaryRed} />
                    <span style={{ fontSize: '13px' }}>
                      Posted: {formatDate(selectedJob.postedDate)}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaBriefcase className="me-2" color={colors.primaryRed} />
                    <span style={{ fontSize: '13px' }}>Job Type: {selectedJob.jobType}</span>
                  </div>
                  {selectedJob.appliedDate && (
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-2" color={colors.primaryRed} />
                      <span style={{ fontSize: '13px' }}>
                        Applied: {formatDate(selectedJob.appliedDate)}
                      </span>
                    </div>
                  )}
                </Col>
              </Row>

              <div className="mb-3">
                <h6 style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '500' }}>Required Skills:</h6>
                <div className="d-flex flex-wrap">
                  {selectedJob.skills.map((skill, index) => (
                    <Badge key={index} bg="light" text="dark" className="me-2 mb-2" style={{ fontSize: '11px' }}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h6 style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '500' }}>Job Description:</h6>
                <p style={{ fontSize: '13px', color: colors.black }}>{selectedJob.description}</p>
              </div>

              {selectedJob.status && (
                <div className="mb-4">
                  <h6 style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '500' }}>Application Status:</h6>
                  <Badge
                    bg={
                      selectedJob.status === 'Accepted' ? 'success' :
                        selectedJob.status === 'Rejected' ? 'danger' : 'warning'
                    }
                    style={{ fontSize: '12px' }}
                  >
                    {selectedJob.status}
                  </Badge>
                </div>
              )}

              {selectedJob.resumeUrl && (
                <div className="mb-4">
                  <h6 style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '500' }}>Resume:</h6>
                  <div className="d-flex align-items-center">
                    <FaFileAlt className="me-2" color={colors.primaryRed} />
                    <a
                      href={selectedJob.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: colors.primaryRed, textDecoration: 'none', fontSize: '13px' }}
                    >
                      View Resume
                    </a>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end">
                {!selectedJob.status && (
                  <Button
                    style={buttonStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                    onClick={() => handleApplyJob(selectedJob)}
                  >
                    Apply Now
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="ms-2"
                  onClick={() => setShowJobDetailModal(false)}
                  style={{ fontSize: '13px' }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Apply Job Modal - Made more compact */}
      <Modal
        show={showApplyModal}
        onHide={() => setShowApplyModal(false)}
        centered
        size="md"
        dialogClassName={windowWidth < 768 ? "modal-90w" : ""}
        contentClassName={windowWidth < 768 ? "p-2" : ""}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: colors.primaryRed,
            color: colors.white,
            padding: windowWidth < 768 ? '8px 12px' : '10px 15px'
          }}
        >
          <Modal.Title style={{ fontSize: windowWidth < 768 ? '14px' : '16px' }}>
            Apply for Job
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: windowWidth < 768 ? '10px' : '15px' }}>
          {selectedJob && (
            <div>
              <div className="mb-3">
                <h5 style={{ color: colors.black, fontWeight: '600', fontSize: windowWidth < 768 ? '14px' : '16px' }}>
                  {selectedJob.title}
                </h5>
                <h6 style={{ color: colors.darkGray, fontSize: windowWidth < 768 ? '12px' : '14px' }}>
                  {selectedJob.company}
                </h6>
              </div>

              <Form onSubmit={handleApplySubmit}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '13px' }}>Resume *</Form.Label>
                  <div className="border rounded p-2" style={{ backgroundColor: colors.lightBg }}>
                    {resumeFile ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <FaFileAlt className="me-2" color={colors.primaryRed} />
                          <span style={{ fontSize: '12px' }}>{resumeFile.name}</span>
                          <span className="ms-2 text-muted" style={{ fontSize: '11px' }}>
                            ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={handleRemoveResume}
                          style={{ fontSize: '12px' }}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div
                          className="text-center p-2 border-dashed rounded"
                          style={{
                            border: '2px dashed #ccc',
                            cursor: 'pointer',
                            backgroundColor: '#f9f9f9',
                            padding: windowWidth < 768 ? '10px' : '15px'
                          }}
                          onClick={() => fileInputRef.current.click()}
                        >
                          <FaFileUpload size={windowWidth < 768 ? 20 : 24} color={colors.darkGray} />
                          <p className="mt-1 mb-0" style={{ fontSize: '12px', color: colors.darkGray }}>
                            Click to upload
                          </p>
                          <p className="mb-0" style={{ fontSize: '10px', color: colors.darkGray }}>
                            PDF or Word, max 5MB
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    )}

                    {isUploading && (
                      <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: '11px' }}>Uploading...</span>
                          <span style={{ fontSize: '11px' }}>{uploadProgress}%</span>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${uploadProgress}%`,
                              backgroundColor: colors.primaryRed
                            }}
                            aria-valuenow={uploadProgress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '13px' }}>Cover Letter *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={windowWidth < 768 ? 2 : 3}
                    value={applicationForm.coverLetter}
                    onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                    placeholder="Tell us why you're a good fit for this role..."
                    required
                    style={{ fontSize: '12px' }}
                  />
                </Form.Group>

                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontSize: '13px' }}>Expected Salary *</Form.Label>
                      <Form.Control
                        type="text"
                        value={applicationForm.expectedSalary}
                        onChange={(e) => setApplicationForm({ ...applicationForm, expectedSalary: e.target.value })}
                        placeholder="e.g., $120,000"
                        required
                        style={{ fontSize: '12px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontSize: '13px' }}>Current CTC *</Form.Label>
                      <Form.Control
                        type="text"
                        value={applicationForm.currentCTC}
                        onChange={(e) => setApplicationForm({ ...applicationForm, currentCTC: e.target.value })}
                        placeholder="e.g., $100,000"
                        required
                        style={{ fontSize: '12px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontSize: '13px' }}>Available From *</Form.Label>
                      <Form.Control
                        type="date"
                        value={applicationForm.availableFromDate}
                        onChange={(e) => setApplicationForm({ ...applicationForm, availableFromDate: e.target.value })}
                        required
                        style={{ fontSize: '12px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontSize: '13px' }}>Notice Period *</Form.Label>
                      <Form.Select
                        value={applicationForm.noticePeriod}
                        onChange={(e) => setApplicationForm({ ...applicationForm, noticePeriod: e.target.value })}
                        required
                        style={{ fontSize: '12px' }}
                      >
                        <option value="">Select Notice Period</option>
                        <option value="Immediate">Immediate</option>
                        <option value="15 days">15 days</option>
                        <option value="30 days">30 days</option>
                        <option value="60 days">60 days</option>
                        <option value="90 days">90 days</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => setShowApplyModal(false)}
                    style={{ fontSize: '12px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    style={buttonStyle}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default JobApplication;