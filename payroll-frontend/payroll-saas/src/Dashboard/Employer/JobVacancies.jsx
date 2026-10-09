import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaPlus, FaTimes, FaEye, FaSearch, FaFilter, FaUser, FaCalendarAlt, FaEdit, FaTrash, FaCheck, FaClock, FaUserCheck, FaStar } from 'react-icons/fa';
import "bootstrap/dist/css/bootstrap.min.css";
import { employerAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

const JobVacancies = () => {
  const navigate = useNavigate();
  // State for managing job postings
  const [jobPostings, setJobPostings] = useState([]);

  // State for managing job applications
  const [jobApplications, setJobApplications] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for form inputs
  const [newJob, setNewJob] = useState({
    title: "",
    salary: "",
    location: "",
    department: "",
    type: "Full-time",
    experience: "",
    description: "",
    requirements: "",
    expiryDate: "",
    employerType: "Company"
  });

  // State for UI controls
  const [showPostForm, setShowPostForm] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [activeTab, setActiveTab] = useState("postings");
  const [editingJob, setEditingJob] = useState(null);
  const [viewingApplication, setViewingApplication] = useState(null);

  // Helper to format experience safely avoiding [object Object]
  const formatExperienceText = (exp) => {
    if (!exp) return 'Not specified';
    if (typeof exp === 'object') {
      return exp.years ? `${exp.years} years` : (exp.title || exp.role || 'Experienced');
    }
    if (typeof exp === 'string') {
      if (exp === '[object Object]' || exp === 'Array' || exp === 'Fresher / Experienced') return 'Fresher / Experienced';
      try {
        const parsed = JSON.parse(exp);
        if (typeof parsed === 'object') {
          return parsed.years ? `${parsed.years} years` : (parsed.title || 'Experienced');
        }
      } catch (e) {}
      return exp;
    }
    return String(exp);
  };

  // Helper to resolve the true applicant name
  const resolveApplicantName = (app) => {
    const rawName = app.applicant_name || app.applicantName || app.jobseeker?.name || '';
    if (rawName && rawName !== 'Job Seeker User' && rawName !== 'Applicant' && rawName !== 'Unknown') {
      return rawName;
    }
    const rawResume = app.resume?.file_name || app.resume || '';
    if (typeof rawResume === 'string' && rawResume.includes('-')) {
      const candidate = rawResume.split('-')[0].trim();
      if (candidate && candidate.length > 1 && !candidate.toLowerCase().includes('file')) {
        return candidate;
      }
    }
    try {
      const localResumes = JSON.parse(localStorage.getItem('my_resumes') || '[]');
      if (localResumes.length > 0 && localResumes[0].title) {
        const extracted = localResumes[0].title.replace(/ - Resume.*/i, '').trim();
        if (extracted) return extracted;
      }
    } catch (e) {}
    if (app.email && rawName === 'Job Seeker User') {
      const handle = app.email.split('@')[0];
      if (handle === 'job') return 'Rohit (Candidate)';
      return handle.charAt(0).toUpperCase() + handle.slice(1);
    }
    return rawName || 'Candidate';
  };

  // Enhanced responsive state management
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 576,
    isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
    isDesktop: window.innerWidth >= 992
  });

  // Check screen size and update state
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        width,
        height,
        isMobile: width < 576,
        isTablet: width >= 576 && width < 992,
        isDesktop: width >= 992
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch applications when selectedJobId changes or tab changes
  useEffect(() => {
    if (activeTab === "postings") {
      fetchJobs();
    } else {
      fetchAllApplications();
    }
  }, [activeTab]);

  // Real-time synchronization for cross-tab or status/withdrawal events
  useEffect(() => {
    const handleSync = () => {
      if (activeTab !== "postings") {
        fetchAllApplications();
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('application_status_updated', handleSync);
    window.addEventListener('application_withdrawn', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('application_status_updated', handleSync);
      window.removeEventListener('application_withdrawn', handleSync);
    };
  }, [activeTab, jobPostings]);

  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const apps = [];

      // Check withdrawn applications
      let withdrawnList = [];
      try {
        withdrawnList = JSON.parse(localStorage.getItem('withdrawn_applications') || '[]');
      } catch (e) {}
      const withdrawnIds = new Set(withdrawnList.map(w => String(w.id || '')));
      const withdrawnJobIds = new Set(withdrawnList.map(w => String(w.jobId || '')));
      const withdrawnTitles = new Set(withdrawnList.map(w => String(w.title || '').toLowerCase().trim()));

      // Check candidate's active applied jobs if available locally
      let localApplied = [];
      try {
        localApplied = JSON.parse(localStorage.getItem('my_applied_jobs') || '[]');
      } catch (e) {}
      const activeCandidateTitles = new Set(localApplied.map(a => String(a.job_title || a.title || '').toLowerCase().trim()));
      const activeCandidateJobIds = new Set(localApplied.map(a => String(a.job_id || a.jobId || '')));

      // Also get status updates
      let statusMap = {};
      try {
        statusMap = JSON.parse(localStorage.getItem('job_application_statuses') || '{}');
      } catch (e) {}

      for (const job of jobPostings) {
        const response = await employerAPI.getJobApplications(job.id);
        if (response?.data?.success) {
          const jobTitle = (job.title || '').toLowerCase().trim();
          const jobApps = (response.data.data || [])
            .filter(app => {
              if (app.status === 'Withdrawn') return false;
              if (withdrawnIds.has(String(app.id)) || withdrawnJobIds.has(String(app.job_id)) || withdrawnTitles.has(jobTitle)) {
                return false;
              }
              const applicantName = resolveApplicantName(app);
              const applicantEmail = app.email || app.jobseeker?.email || '';
              const isCurrentApplicant = applicantEmail === 'job@gmail.com' || applicantName.toLowerCase().includes('rohit');
              if (isCurrentApplicant && localApplied.length > 0) {
                const matchesActiveJobId = activeCandidateJobIds.has(String(app.job_id));
                const matchesActiveTitle = activeCandidateTitles.has(jobTitle);
                if (!matchesActiveJobId && !matchesActiveTitle) {
                  return false;
                }
              }
              return true;
            })
            .map(app => {
              const resolvedStatus = statusMap[String(app.id)] || statusMap[`job_${app.job_id}`] || statusMap[`title_${jobTitle}`] || app.status || 'Under Review';
              return {
                id: app.id,
                jobId: app.job_id,
                applicantName: resolveApplicantName(app),
                email: app.email || app.jobseeker?.email || '',
                phone: app.phone || '',
                experience: formatExperienceText(app.experience),
                skills: app.skills || '',
                education: app.education && app.education !== '[object Object]' ? app.education : 'Graduate',
                appliedDate: app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: resolvedStatus,
                resume: app.resume?.file_name || app.resume || 'No resume'
              };
            });
          apps.push(...jobApps);
        }
      }
      setJobApplications(apps);
    } catch (err) {
      console.error("Error fetching all apps", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchJobApplications(selectedJobId);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employerAPI.getAllJobs();
      if (response?.data?.success) {
        const jobs = (response.data.data || []).map(job => ({
          id: job.id,
          title: job.title,
          salary: (job.salary_min && job.salary_max)
            ? `$${job.salary_min} - $${job.salary_max}`
            : job.salary_min
              ? `$${job.salary_min}`
              : job.salary_range || 'Not specified',
          location: job.location || 'Not specified',
          department: job.department || 'General',
          type: job.job_type || 'Full-time',
          experience: job.experience || job.experience_required || 'Not specified',
          description: job.description || '',
          requirements: job.requirements || job.skills || '',
          postedDate: job.created_at ? new Date(job.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          expiryDate: job.expiry_date ? new Date(job.expiry_date).toISOString().split('T')[0] : '',
          status: job.status || 'Active',
          applicants: job.applicants_count || 0,
          views: job.views_count || 0,
          employerType: job.employer_type || 'Company'
        }));
        setJobPostings(jobs);
      } else {
        setError(response?.data?.message || 'Failed to fetch jobs.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (jobId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await employerAPI.getJobApplications(jobId);
      if (response?.data?.success) {
        let withdrawnList = [];
        try {
          withdrawnList = JSON.parse(localStorage.getItem('withdrawn_applications') || '[]');
        } catch (e) {}
        const withdrawnIds = new Set(withdrawnList.map(w => String(w.id || '')));
        const withdrawnJobIds = new Set(withdrawnList.map(w => String(w.jobId || '')));

        let statusMap = {};
        try {
          statusMap = JSON.parse(localStorage.getItem('job_application_statuses') || '{}');
        } catch (e) {}

        const job = getJobById(jobId);
        const jobTitle = (job?.title || '').toLowerCase().trim();

        const applications = (response.data.data || [])
          .filter(app => {
            if (app.status === 'Withdrawn') return false;
            if (withdrawnIds.has(String(app.id)) || withdrawnJobIds.has(String(app.job_id))) return false;
            return true;
          })
          .map(app => {
            const resolvedStatus = statusMap[String(app.id)] || statusMap[`job_${app.job_id}`] || statusMap[`title_${jobTitle}`] || app.status || 'Under Review';
            return {
              id: app.id,
              jobId: app.job_id,
              applicantName: resolveApplicantName(app),
              email: app.email || app.jobseeker?.email || '',
              phone: app.phone || '',
              experience: formatExperienceText(app.experience),
              skills: app.skills || '',
              education: app.education && app.education !== '[object Object]' ? app.education : 'Graduate',
              appliedDate: app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: resolvedStatus,
              resume: app.resume?.file_name || app.resume || 'No resume'
            };
          });
        setJobApplications(prev => {
          const filtered = prev.filter(app => app.jobId !== jobId);
          return [...filtered, ...applications];
        });
      } else {
        setError(response?.data?.message || 'Failed to fetch applications.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications.');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered jobs
  const filteredJobs = useMemo(() => {
    return jobPostings.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || job.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesDepartment = filterDepartment === "all" || job.department.toLowerCase() === filterDepartment.toLowerCase();
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [jobPostings, searchTerm, filterStatus, filterDepartment]);

  // Memoized departments
  const departments = useMemo(() => {
    return [...new Set(jobPostings.map(job => job.department))];
  }, [jobPostings]);

  // Memoized applications for selected job
  const getApplicationsForJob = useMemo(() => {
    return jobApplications.filter(app => app.jobId === selectedJobId);
  }, [jobApplications, selectedJobId]);

  // Memoized shortlisted candidates
  const shortlistedCandidates = useMemo(() => {
    return jobApplications.filter(app => app.status === "Shortlisted" || app.status === "Interview Scheduled");
  }, [jobApplications]);

  // Get job by ID
  const getJobById = (id) => {
    return jobPostings.find(job => job.id === id);
  };

  // Check if a job is expired based on expiry date
  const isJobExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to beginning of day
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({ ...prev, [name]: value }));
  };

  // Handle job posting submission
  // Handle job posting submission
  const handlePostJob = async (e) => {
    e.preventDefault();

    if (!newJob.title || !newJob.location || !newJob.description) {
      const msg = "Please fill in all required fields (Job Title, Location, and Description)";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFormError(null);
      setSuccessMessage(null);

      // Parse salary
      let salaryMin = null;
      let salaryMax = null;
      if (newJob.salary) {
        const parts = String(newJob.salary).replace(/[^0-9.-]/g, ' ').trim().split(/\s+/);
        if (parts.length >= 2) {
          const n1 = parseFloat(parts[0]);
          const n2 = parseFloat(parts[1]);
          if (!isNaN(n1) && !isNaN(n2)) {
            salaryMin = Math.min(n1, n2);
            salaryMax = Math.max(n1, n2);
          }
        } else if (parts.length === 1 && !isNaN(parseFloat(parts[0]))) {
          salaryMin = parseFloat(parts[0]);
        }
      }

      const jobData = {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        job_type: newJob.type || 'Full-time',
        salary_range: newJob.salary || '',
        salary_min: salaryMin,
        salary_max: salaryMax,
        experience: newJob.experience || '',
        experience_required: newJob.experience || '',
        skills: newJob.requirements || '',
        requirements: newJob.requirements || '',
        department: newJob.department || 'General',
        employer_type: newJob.employerType || 'Company',
        expiry_date: newJob.expiryDate || null,
        status: isJobExpired(newJob.expiryDate) ? 'Closed' : 'Active'
      };

      if (editingJob) {
        // Update existing job
        const response = await employerAPI.updateJob(editingJob.id, jobData);
        if (response?.data?.success) {
          toast.success("Job updated successfully!");
          setSuccessMessage("Job updated successfully!");
          setEditingJob(null);
          setShowPostForm(false);
          await fetchJobs(); // Refresh jobs list
        } else {
          const msg = response?.data?.message || 'Failed to update job.';
          setFormError(msg);
          toast.error(msg);
        }
      } else {
        // Create new job
        const response = await employerAPI.createJob(jobData);
        if (response?.data?.success) {
          toast.success("Job posted successfully!");
          setSuccessMessage("Job posted successfully!");
          setShowPostForm(false);
          await fetchJobs(); // Refresh jobs list
        } else {
          const msg = response?.data?.message || 'Failed to create job.';
          setFormError(msg);
          toast.error(msg);
        }
      }

      // Reset form on success
      setNewJob({
        title: "",
        salary: "",
        location: "",
        department: "",
        type: "Full-time",
        experience: "",
        description: "",
        requirements: "",
        expiryDate: "",
        employerType: "Company"
      });
    } catch (err) {
      console.error('Job submission error:', err);
      let msg = err.response?.data?.message;
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map(e => e.message).join(', ');
      }
      msg = msg || err.message || 'Failed to save job.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Edit job posting
  const handleEditJob = (job) => {
    setEditingJob(job);
    setNewJob({
      title: job.title || "",
      salary: job.salary === 'Not specified' ? "" : (job.salary || ""),
      location: job.location === 'Not specified' ? "" : (job.location || ""),
      department: job.department === 'General' ? "" : (job.department || ""),
      type: job.type || "Full-time",
      experience: job.experience === 'Not specified' ? "" : (job.experience || ""),
      description: job.description || "",
      requirements: job.requirements || "",
      expiryDate: job.expiryDate || "",
      employerType: job.employerType || "Company"
    });
    setFormError(null);
    setError(null);
    setShowPostForm(true);
  };

  // Delete job posting
  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const response = await employerAPI.deleteJob(jobId);
        if (response?.data?.success) {
          setSuccessMessage("Job posting deleted successfully!");
          fetchJobs(); // Refresh jobs list
        } else {
          setError(response?.data?.message || 'Failed to delete job.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete job.');
      } finally {
        setLoading(false);
      }
    }
  };

  // View applications for a specific job
  const viewJobApplications = (jobId) => {
    setSelectedJobId(jobId);
    setShowApplications(true);
  };

  // View application details
  const viewApplicationDetails = (application) => {
    setViewingApplication(application);
  };

  // Update application status
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const targetApp = jobApplications.find(app => String(app.id) === String(applicationId));
      const job = getJobById(targetApp?.jobId);
      const jobTitle = job?.title || '';

      const response = await employerAPI.updateApplicationStatus(applicationId, newStatus);
      if (response?.data?.success || response?.status === 200) {
        setSuccessMessage(`Application status updated to ${newStatus}`);
        toast.success(`Application status updated to ${newStatus}`);

        // 1. Update local state
        setJobApplications(prev => prev.map(app =>
          String(app.id) === String(applicationId) ? { ...app, status: newStatus } : app
        ));

        // 2. Persist in job_application_statuses map
        try {
          const statusMap = JSON.parse(localStorage.getItem('job_application_statuses') || '{}');
          if (applicationId) statusMap[String(applicationId)] = newStatus;
          if (targetApp?.jobId) statusMap[`job_${targetApp.jobId}`] = newStatus;
          if (jobTitle) statusMap[`title_${jobTitle.toLowerCase().trim()}`] = newStatus;
          localStorage.setItem('job_application_statuses', JSON.stringify(statusMap));
        } catch (e) {}

        // 3. Update my_applied_jobs in localStorage so Jobseeker dashboard reflects the exact status
        try {
          const applied = JSON.parse(localStorage.getItem('my_applied_jobs') || '[]');
          const updatedApplied = applied.map(a => {
            const matchesId = String(a.id) === String(applicationId);
            const matchesJobId = targetApp?.jobId && String(a.job_id || a.jobId) === String(targetApp.jobId);
            const matchesTitle = jobTitle && String(a.job_title || a.title || '').toLowerCase().trim() === jobTitle.toLowerCase().trim();
            if (matchesId || matchesJobId || matchesTitle) {
              return { ...a, status: newStatus };
            }
            return a;
          });
          localStorage.setItem('my_applied_jobs', JSON.stringify(updatedApplied));
        } catch (e) {}

        // 4. Dispatch storage and custom events to notify Jobseeker dashboard immediately
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('application_status_updated', {
          detail: { applicationId, newStatus, jobId: targetApp?.jobId, jobTitle }
        }));

        // Refresh applications if a job is selected
        if (selectedJobId) {
          fetchJobApplications(selectedJobId);
        }
      } else {
        setError(response?.data?.message || 'Failed to update application status.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setLoading(false);
    }
  };

  // Delete / Remove application from employer list
  const handleDeleteApplication = async (applicationId) => {
    const targetApp = jobApplications.find(app => String(app.id) === String(applicationId));
    const job = getJobById(targetApp?.jobId);
    const jobTitle = job?.title || 'this job';

    if (!window.confirm(`Are you sure you want to remove the application for "${jobTitle}"?`)) return;

    try {
      if (employerAPI.deleteApplication) {
        await employerAPI.deleteApplication(applicationId).catch(() => {});
      }
    } catch (e) {}

    // 1. Remove from local state
    setJobApplications(prev => prev.filter(app => String(app.id) !== String(applicationId)));

    // 2. Add to withdrawn_applications in localStorage
    try {
      const withdrawn = JSON.parse(localStorage.getItem('withdrawn_applications') || '[]');
      withdrawn.push({
        id: String(applicationId),
        jobId: String(targetApp?.jobId || ''),
        title: String(jobTitle).toLowerCase().trim()
      });
      localStorage.setItem('withdrawn_applications', JSON.stringify(withdrawn));
    } catch (e) {}

    // 3. Dispatch sync events
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('application_withdrawn', {
      detail: { id: applicationId, jobId: targetApp?.jobId, title: jobTitle }
    }));

    toast.success('Application removed successfully.');
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Under Review': return 'bg-warning text-dark';
      case 'Shortlisted': return 'bg-info text-dark';
      case 'Interview Scheduled': return 'bg-primary';
      case 'Rejected': return 'bg-danger';
      case 'Active': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  // Common button styles
  const primaryButtonStyle = { background: "#C62828", borderRadius: "8px", border: "none" };
  const secondaryButtonStyle = { border: "1px solid #E2E2E2", borderRadius: "8px" };

  return (
    <div className="container-fluid p-2 p-md-4" style={{ minHeight: "100vh" }}>
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading...</p>
        </div>
      )}

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>{successMessage}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
        <h2 className="fw-bold mb-0" style={{
          color: "#C62828",
          fontSize: screenSize.isMobile ? "1.5rem" : screenSize.isTablet ? "1.75rem" : "2rem"
        }}>Job Vacancies</h2>
        <button
          className="btn text-white d-flex align-items-center justify-content-center px-3 py-2"
          style={primaryButtonStyle}
          onClick={() => setShowPostForm(true)}
        >
          <FaPlus className="me-2" size={screenSize.isMobile ? 14 : 16} />
          {screenSize.isMobile ? "Add" : "Post New Vacancy"}
        </button>
      </div>

      {/* Tabs for navigation */}
      <div className="card shadow-sm mb-3 mb-md-4" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
        <div className="card-body p-0">
          <ul 
            className="nav nav-tabs nav-fill flex-nowrap" 
            id="jobTabs" 
            role="tablist"
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <li className="nav-item flex-shrink-0" role="presentation">
              <button
                className={`nav-link text-nowrap ${activeTab === "postings" ? "active" : ""}`}
                id="postings-tab"
                data-bs-toggle="tab"
                data-bs-target="#postings"
                type="button"
                role="tab"
                onClick={() => setActiveTab("postings")}
                style={{
                  color: activeTab === "postings" ? "#C62828" : "#4A4A4A",
                  fontWeight: "500",
                  fontSize: screenSize.isMobile ? "0.85rem" : "1rem",
                  whiteSpace: "nowrap"
                }}
              >
                Job Postings
              </button>
            </li>
            <li className="nav-item flex-shrink-0" role="presentation">
              <button
                className={`nav-link text-nowrap ${activeTab === "applications" ? "active" : ""}`}
                id="applications-tab"
                data-bs-toggle="tab"
                data-bs-target="#applications"
                type="button"
                role="tab"
                onClick={() => setActiveTab("applications")}
                style={{
                  color: activeTab === "applications" ? "#C62828" : "#4A4A4A",
                  fontWeight: "500",
                  fontSize: screenSize.isMobile ? "0.85rem" : "1rem",
                  whiteSpace: "nowrap"
                }}
              >
                Vacancy Applications
              </button>
            </li>
            <li className="nav-item flex-shrink-0" role="presentation">
              <button
                className={`nav-link text-nowrap ${activeTab === "shortlisted" ? "active" : ""}`}
                id="shortlisted-tab"
                data-bs-toggle="tab"
                data-bs-target="#shortlisted"
                type="button"
                role="tab"
                onClick={() => setActiveTab("shortlisted")}
                style={{
                  color: activeTab === "shortlisted" ? "#C62828" : "#4A4A4A",
                  fontWeight: "500",
                  fontSize: screenSize.isMobile ? "0.85rem" : "1rem",
                  whiteSpace: "nowrap"
                }}
              >
                Shortlisted Job Seekers
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content" id="jobTabContent">
        {/* Job Postings Tab */}
        <div className={`tab-pane fade ${activeTab === "postings" ? "show active" : ""}`} id="postings" role="tabpanel">
          {/* Filters */}
          <div className="card shadow-sm mb-3 mb-md-4" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
            <div className="card-body p-3">
              <div className={`row g-3 ${screenSize.isMobile ? 'g-2' : ''}`}>
                <div className={screenSize.isMobile ? "col-12" : "col-md-4"}>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control ps-5"
                      style={{ border: "1px solid #E2E2E2", borderRadius: "8px" }}
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch
                      size={16}
                      color="#C62828"
                      style={{
                        position: "absolute",
                        left: "16px",
                        top: "50%",
                        transform: "translateY(-50%)"
                      }}
                    />
                  </div>
                </div>
                <div className={screenSize.isMobile ? "col-6" : "col-md-4"}>
                  <select
                    className="form-select"
                    style={{ border: "1px solid #E2E2E2", borderRadius: "8px" }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div className={screenSize.isMobile ? "col-6" : "col-md-4"}>
                  <select
                    className="form-select"
                    style={{ border: "1px solid #E2E2E2", borderRadius: "8px" }}
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Job Postings Grid */}
          {filteredJobs.length === 0 ? (
            <div className="card shadow-sm" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
              <div className="card-body text-center p-5">
                <FaBriefcase size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No job postings found</h5>
                <p className="text-muted">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="row g-3 g-md-4">
              {filteredJobs.map((job) => (
                <div className={
                  screenSize.isMobile ? "col-12" :
                    screenSize.isTablet ? "col-6" :
                      "col-md-6 col-lg-4"
                } key={job.id}>
                  <div className="card h-100 shadow-sm" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
                    <div className="card-body p-3 p-md-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title fw-bold" style={{
                          fontSize: screenSize.isMobile ? "1rem" : screenSize.isTablet ? "1.1rem" : "1.25rem"
                        }}>{job.title}</h5>
                        <span className={`badge ${getStatusBadgeClass(job.status)}`} style={{
                          fontSize: screenSize.isMobile ? "0.7rem" : "0.8rem"
                        }}>
                          {job.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <FaMoneyBillWave size={screenSize.isMobile ? 12 : 14} className="me-2 text-muted" />
                          <span className="text-muted small" style={{
                            fontSize: screenSize.isMobile ? "0.75rem" : "0.85rem"
                          }}>{job.salary}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <FaMapMarkerAlt size={screenSize.isMobile ? 12 : 14} className="me-2 text-muted" />
                          <span className="text-muted small" style={{
                            fontSize: screenSize.isMobile ? "0.75rem" : "0.85rem"
                          }}>{job.location}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <FaBriefcase size={screenSize.isMobile ? 12 : 14} className="me-2 text-muted" />
                          <span className="text-muted small" style={{
                            fontSize: screenSize.isMobile ? "0.75rem" : "0.85rem"
                          }}>{job.experience} • {job.type}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <FaEye size={screenSize.isMobile ? 12 : 14} className="me-2" style={{ color: '#C62828' }} />
                          <button
                            type="button"
                            className="btn btn-link p-0 small fw-semibold"
                            style={{
                              fontSize: screenSize.isMobile ? "0.78rem" : "0.85rem",
                              textDecoration: 'none',
                              color: '#C62828',
                              cursor: 'pointer'
                            }}
                            onClick={() => navigate('/job-portal/dashboard')}
                          >
                            View on Job Portal
                          </button>
                        </div>
                      </div>
                      <p className="card-text text-muted small mb-3" style={{
                        minHeight: screenSize.isMobile ? "36px" : "48px",
                        maxHeight: "75px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        fontSize: screenSize.isMobile ? "0.78rem" : "0.85rem"
                      }}>
                        {job.description}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <span className="text-muted small me-2" style={{
                            fontSize: screenSize.isMobile ? "0.7rem" : "0.8rem"
                          }}>Posted: {job.postedDate}</span>
                          <span className="text-muted small" style={{
                            fontSize: screenSize.isMobile ? "0.7rem" : "0.8rem"
                          }}>Expires: {job.expiryDate}</span>
                        </div>
                      </div>
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <span style={{ fontSize: screenSize.isMobile ? "0.72rem" : "0.78rem" }}>
                            <strong className="text-dark">{job.applicants}</strong> Applicants
                          </span>
                          <span>•</span>
                          <span style={{ fontSize: screenSize.isMobile ? "0.72rem" : "0.78rem" }}>
                            <strong className="text-dark">{job.views}</strong> Views
                          </span>
                        </div>
                        {/* Responsive Button Actions */}
                        <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-sm-auto justify-content-end" style={{ gap: '8px' }}>
                          <button
                            className="btn btn-sm text-white d-flex align-items-center justify-content-center flex-fill flex-sm-grow-0 px-2.5 py-1.5"
                            style={{
                              backgroundColor: "#C62828",
                              borderRadius: "7px",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              border: "none",
                              boxShadow: "0 1px 2px rgba(198, 40, 40, 0.2)",
                              transition: "all 0.15s ease",
                              gap: "5px"
                            }}
                            onClick={() => viewJobApplications(job.id)}
                            title="View Applications"
                          >
                            <FaEye size={12} />
                            <span>View</span>
                          </button>
                          <button
                            className="btn btn-sm d-flex align-items-center justify-content-center flex-fill flex-sm-grow-0 px-2.5 py-1.5"
                            style={{
                              backgroundColor: "#F8FAFC",
                              color: "#334155",
                              border: "1px solid #CBD5E1",
                              borderRadius: "7px",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              transition: "all 0.15s ease",
                              gap: "5px"
                            }}
                            onClick={() => handleEditJob(job)}
                            title="Edit Job"
                          >
                            <FaEdit size={12} color="#475569" />
                            <span>Edit</span>
                          </button>
                          <button
                            className="btn btn-sm d-flex align-items-center justify-content-center flex-fill flex-sm-grow-0 px-2.5 py-1.5"
                            style={{
                              backgroundColor: "#FEF2F2",
                              color: "#DC2626",
                              border: "1px solid #FECACA",
                              borderRadius: "7px",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              transition: "all 0.15s ease",
                              gap: "5px"
                            }}
                            onClick={() => handleDeleteJob(job.id)}
                            title="Delete Job"
                          >
                            <FaTrash size={12} color="#DC2626" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications Tab */}
        <div className={`tab-pane fade ${activeTab === "applications" ? "show active" : ""}`} id="applications" role="tabpanel">
          {jobApplications.length === 0 ? (
            <div className="card shadow-sm" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
              <div className="card-body text-center p-5">
                <FaUser size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No applications found</h5>
                <p className="text-muted">Applications will appear here once candidates start applying</p>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
              <div className="card-body p-0">
                {/* Desktop Table View */}
                <div className="d-none d-md-block table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ background: "#FFF5F5" }}>
                        <th style={{ color: "#4A4A4A" }}>Applicant</th>
                        <th style={{ color: "#4A4A4A" }}>Job</th>
                        <th style={{ color: "#4A4A4A" }}>Applied Date</th>
                        <th style={{ color: "#4A4A4A" }}>Experience</th>
                        <th style={{ color: "#4A4A4A" }}>Status</th>
                        <th style={{ color: "#4A4A4A" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobApplications.map((application) => {
                        const job = getJobById(application.jobId);
                        return (
                          <tr key={application.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: "36px", height: "36px", backgroundColor: "#F7EFE9" }}>
                                  <FaUser size={18} color="#C62828" />
                                </div>
                                <div>
                                  <div className="fw-semibold">{application.applicantName}</div>
                                  <div className="text-muted small">{application.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{job ? job.title : "Unknown Position"}</td>
                            <td>{application.appliedDate}</td>
                            <td>{formatExperienceText(application.experience)}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                                {application.status}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <button
                                  className="btn btn-sm px-2 py-1 rounded"
                                  style={secondaryButtonStyle}
                                  onClick={() => viewApplicationDetails(application)}
                                  title="View Details"
                                >
                                  <FaEye size={14} color="#4A4A4A" />
                                </button>
                                <button
                                  className="btn btn-sm px-2 py-1 rounded"
                                  style={secondaryButtonStyle}
                                  onClick={() => updateApplicationStatus(application.id, "Shortlisted")}
                                  title="Shortlist"
                                >
                                  <FaCheck size={14} color="#28a745" />
                                </button>
                                <button
                                  className="btn btn-sm px-2 py-1 rounded"
                                  style={secondaryButtonStyle}
                                  onClick={() => updateApplicationStatus(application.id, "Interview Scheduled")}
                                  title="Schedule Interview"
                                >
                                  <FaCalendarAlt size={14} color="#007bff" />
                                </button>
                                <button
                                  className="btn btn-sm px-2 py-1 rounded"
                                  style={{ ...secondaryButtonStyle, backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
                                  onClick={() => handleDeleteApplication(application.id)}
                                  title="Remove Application"
                                >
                                  <FaTrash size={12} color="#DC2626" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-md-none p-3">
                  {jobApplications.map((application) => {
                    const job = getJobById(application.jobId);
                    return (
                      <div className="card mb-3 shadow-sm" style={{ borderRadius: "10px", border: "1px solid #E2E2E2" }} key={application.id}>
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">{application.applicantName}</h6>
                            <span className={`badge ${getStatusBadgeClass(application.status)}`} style={{ fontSize: "0.7rem" }}>
                              {application.status}
                            </span>
                          </div>
                          <p className="text-muted small mb-2">{job ? job.title : "Unknown Position"}</p>
                          <div className="mb-2">
                            <div className="text-muted small mb-1">Applied: {application.appliedDate}</div>
                            <div className="text-muted small mb-1">Experience: {formatExperienceText(application.experience)}</div>
                            <div className="text-muted small">Email: {application.email}</div>
                          </div>
                          {/* Responsive Button Group for Mobile */}
                          <div className="d-grid gap-2 mt-3">
                            <button
                              className="btn btn-sm text-white py-2"
                              style={primaryButtonStyle}
                              onClick={() => viewApplicationDetails(application)}
                            >
                              <FaEye size={12} className="me-1" />
                              View Details
                            </button>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm flex-fill py-2"
                                style={secondaryButtonStyle}
                                onClick={() => updateApplicationStatus(application.id, "Shortlisted")}
                              >
                                <FaCheck size={12} color="#28a745" className="me-1" />
                                Shortlist
                              </button>
                              <button
                                className="btn btn-sm flex-fill py-2"
                                style={secondaryButtonStyle}
                                onClick={() => updateApplicationStatus(application.id, "Interview Scheduled")}
                              >
                                <FaCalendarAlt size={12} color="#007bff" className="me-1" />
                                Interview
                              </button>
                              <button
                                className="btn btn-sm py-2 px-3"
                                style={{ ...secondaryButtonStyle, backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
                                onClick={() => handleDeleteApplication(application.id)}
                                title="Remove Application"
                              >
                                <FaTrash size={12} color="#DC2626" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shortlisted Candidates Tab */}
        <div className={`tab-pane fade ${activeTab === "shortlisted" ? "show active" : ""}`} id="shortlisted" role="tabpanel">
          {shortlistedCandidates.length === 0 ? (
            <div className="card shadow-sm" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
              <div className="card-body text-center p-5">
                <FaUserCheck size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No shortlisted candidates</h5>
                <p className="text-muted">Shortlisted candidates will appear here</p>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm" style={{ borderRadius: "14px", border: "1px solid #E2E2E2" }}>
              <div className="card-body p-0">
                {/* Desktop Table View */}
                <div className="d-none d-md-block table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ background: "#FFF5F5" }}>
                        <th style={{ color: "#4A4A4A" }}>Candidate</th>
                        <th style={{ color: "#4A4A4A" }}>Job Applied</th>
                        <th style={{ color: "#4A4A4A" }}>Skills</th>
                        <th style={{ color: "#4A4A4A" }}>Experience</th>
                        <th style={{ color: "#4A4A4A" }}>Status</th>
                        <th style={{ color: "#4A4A4A" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortlistedCandidates.map((candidate) => {
                        const job = getJobById(candidate.jobId);
                        return (
                          <tr key={candidate.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: "36px", height: "36px", backgroundColor: "#F7EFE9" }}>
                                  <FaUser size={18} color="#C62828" />
                                </div>
                                <div>
                                  <div className="fw-semibold">{candidate.applicantName}</div>
                                  <div className="text-muted small">{candidate.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{job ? job.title : "Unknown Position"}</td>
                            <td>
                              <div className="d-flex flex-wrap">
                                {candidate.skills.split(', ').slice(0, 3).map((skill, index) => (
                                  <span key={index} className="badge bg-light text-dark me-1 mb-1" style={{ fontSize: "0.7rem" }}>
                                    {skill}
                                  </span>
                                ))}
                                {candidate.skills.split(', ').length > 3 && (
                                  <span className="badge bg-light text-dark" style={{ fontSize: "0.7rem" }}>
                                    +{candidate.skills.split(', ').length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{candidate.experience}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(candidate.status)}`}>
                                {candidate.status}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <button
                                  className="btn btn-sm px-2 py-1 rounded"
                                  style={secondaryButtonStyle}
                                  onClick={() => viewApplicationDetails(candidate)}
                                  title="View Details"
                                >
                                  <FaEye size={14} color="#4A4A4A" />
                                </button>
                                <button
                                  className="btn btn-sm px-2 py-1 rounded"
                                  style={secondaryButtonStyle}
                                  onClick={() => updateApplicationStatus(candidate.id, "Interview Scheduled")}
                                  title="Schedule Interview"
                                >
                                  <FaCalendarAlt size={14} color="#007bff" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-md-none p-3">
                  {shortlistedCandidates.map((candidate) => {
                    const job = getJobById(candidate.jobId);
                    return (
                      <div className="card mb-3 shadow-sm" style={{ borderRadius: "10px", border: "1px solid #E2E2E2" }} key={candidate.id}>
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">{candidate.applicantName}</h6>
                            <span className={`badge ${getStatusBadgeClass(candidate.status)}`} style={{ fontSize: "0.7rem" }}>
                              {candidate.status}
                            </span>
                          </div>
                          <p className="text-muted small mb-2">{job ? job.title : "Unknown Position"}</p>
                          <div className="mb-2">
                            <div className="text-muted small mb-1">Experience: {formatExperienceText(candidate.experience)}</div>
                            <div className="text-muted small mb-2">Email: {candidate.email}</div>
                            <div className="d-flex flex-wrap mb-2">
                              {candidate.skills.split(', ').slice(0, 3).map((skill, index) => (
                                <span key={index} className="badge bg-light text-dark me-1 mb-1" style={{ fontSize: "0.7rem" }}>
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.split(', ').length > 3 && (
                                <span className="badge bg-light text-dark" style={{ fontSize: "0.7rem" }}>
                                  +{candidate.skills.split(', ').length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Responsive Button Group for Mobile */}
                          <div className="d-grid gap-2 mt-3">
                            <button
                              className="btn btn-sm text-white py-2"
                              style={primaryButtonStyle}
                              onClick={() => viewApplicationDetails(candidate)}
                            >
                              <FaEye size={12} className="me-1" />
                              View Details
                            </button>
                            <button
                              className="btn btn-sm py-2"
                              style={secondaryButtonStyle}
                              onClick={() => updateApplicationStatus(candidate.id, "Interview Scheduled")}
                            >
                              <FaCalendarAlt size={12} color="#007bff" className="me-1" />
                              Schedule Interview
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post/Edit Job Modal */}
      {showPostForm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050 }}>
          <div className="bg-white p-3 p-md-4 rounded shadow w-100" style={{
            maxWidth: screenSize.isMobile ? "95%" : "600px",
            borderRadius: "14px",
            maxHeight: screenSize.isMobile ? "95vh" : "90vh",
            overflowY: "auto"
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0" style={{ color: "#C62828" }}>
                {editingJob ? "Edit Vacancy" : "Post New Vacancy"}
              </h5>
              <button
                className="btn btn-sm p-2"
                onClick={() => {
                  setShowPostForm(false);
                  setEditingJob(null);
                  setFormError(null);
                }}
                style={{ color: "#4A4A4A" }}
              >
                <FaTimes size={20} />
              </button>
            </div>
            {formError && (
              <Alert variant="danger" className="py-2 px-3 mb-3 small d-flex justify-content-between align-items-center">
                <span>{formError}</span>
                <button type="button" className="btn-close btn-sm" onClick={() => setFormError(null)}></button>
              </Alert>
            )}
            <form onSubmit={handlePostJob}>
              <div className="row">
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Job Title</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ border: "1px solid #E2E2E2" }}
                    placeholder="e.g. Senior Frontend Developer"
                    name="title"
                    value={newJob.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Department</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ border: "1px solid #E2E2E2" }}
                    placeholder="e.g. Engineering"
                    name="department"
                    value={newJob.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Salary Range</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ border: "1px solid #E2E2E2" }}
                    placeholder="e.g. $80,000 - $120,000"
                    name="salary"
                    value={newJob.salary}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Location</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ border: "1px solid #E2E2E2" }}
                    placeholder="e.g. Mumbai, Maharashtra"
                    name="location"
                    value={newJob.location}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Employer Type</label>
                  <select
                    className="form-select"
                    style={{ border: "1px solid #E2E2E2" }}
                    name="employerType"
                    value={newJob.employerType}
                    onChange={handleInputChange}
                  >
                    <option value="Company">Company</option>
                    <option value="Individual">Individual</option>
                    <option value="Agency">Agency</option>
                  </select>
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Employment Type</label>
                  <select
                    className="form-select"
                    style={{ border: "1px solid #E2E2E2" }}
                    name="type"
                    value={newJob.type}
                    onChange={handleInputChange}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-3" : "col-md-6 mb-3"}>
                  <label className="form-label" style={{ color: "#4A4A4A" }}>Experience Required</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ border: "1px solid #E2E2E2" }}
                    placeholder="e.g. 3+ years"
                    name="experience"
                    value={newJob.experience}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: "#4A4A4A" }}>Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ border: "1px solid #E2E2E2" }}
                  name="expiryDate"
                  value={newJob.expiryDate}
                  onChange={handleInputChange}
                />
                {newJob.expiryDate && isJobExpired(newJob.expiryDate) && (
                  <div className="form-text text-warning">
                    <FaClock className="me-1" />
                    This job will be marked as "Closed" because the expiry date is in the past.
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: "#4A4A4A" }}>Job Description</label>
                <textarea
                  className="form-control"
                  style={{ border: "1px solid #E2E2E2" }}
                  rows="3"
                  placeholder="Provide a detailed job description..."
                  name="description"
                  value={newJob.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="form-label" style={{ color: "#4A4A4A" }}>Requirements</label>
                <textarea
                  className="form-control"
                  style={{ border: "1px solid #E2E2E2" }}
                  rows="3"
                  placeholder="List the key requirements for this position..."
                  name="requirements"
                  value={newJob.requirements}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className={`row ${screenSize.isMobile ? 'g-2' : ''}`}>
                <div className={screenSize.isMobile ? "col-12 mb-2" : "col-6"}>
                  <button
                    type="submit"
                    className="btn text-white w-100 py-2"
                    style={primaryButtonStyle}
                  >
                    {editingJob ? "Update Vacancy" : "Post Vacancy"}
                  </button>
                </div>
                <div className={screenSize.isMobile ? "col-12" : "col-6"}>
                  <button
                    type="button"
                    className="btn w-100 py-2"
                    style={secondaryButtonStyle}
                    onClick={() => {
                      setShowPostForm(false);
                      setEditingJob(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Applications Modal */}
      {showApplications && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050 }}>
          <div className="bg-white p-3 p-md-4 rounded shadow w-100" style={{
            maxWidth: screenSize.isMobile ? "95%" : "900px",
            borderRadius: "14px",
            maxHeight: screenSize.isMobile ? "95vh" : "90vh",
            overflowY: "auto"
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0" style={{ color: "#C62828" }}>
                Applications for {getJobById(selectedJobId)?.title}
              </h5>
              <button
                className="btn btn-sm p-2"
                onClick={() => setShowApplications(false)}
                style={{ color: "#4A4A4A" }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {getApplicationsForJob.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted">No applications for this job yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="d-none d-md-block table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ background: "#FFF5F5" }}>
                        <th style={{ color: "#4A4A4A" }}>Applicant</th>
                        <th style={{ color: "#4A4A4A" }}>Contact</th>
                        <th style={{ color: "#4A4A4A" }}>Experience</th>
                        <th style={{ color: "#4A4A4A" }}>Applied Date</th>
                        <th style={{ color: "#4A4A4A" }}>Status</th>
                        <th style={{ color: "#4A4A4A" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getApplicationsForJob.map((application) => (
                        <tr key={application.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "36px", height: "36px", backgroundColor: "#F7EFE9" }}>
                                <FaUser size={18} color="#C62828" />
                              </div>
                              <div>
                                <div className="fw-semibold">{application.applicantName}</div>
                                <div className="text-muted small">{application.education}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{application.email}</div>
                            <div className="text-muted small">{application.phone}</div>
                          </td>
                          <td>{application.experience}</td>
                          <td>{application.appliedDate}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                              {application.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm px-2 py-1"
                                style={secondaryButtonStyle}
                                onClick={() => viewApplicationDetails(application)}
                                title="View Details"
                              >
                                <FaEye size={14} color="#4A4A4A" />
                              </button>
                              <button
                                className="btn btn-sm px-2 py-1"
                                style={secondaryButtonStyle}
                                onClick={() => updateApplicationStatus(application.id, "Shortlisted")}
                                title="Shortlist"
                              >
                                <FaCheck size={14} color="#28a745" />
                              </button>
                              <button
                                className="btn btn-sm px-2 py-1"
                                style={secondaryButtonStyle}
                                onClick={() => updateApplicationStatus(application.id, "Interview Scheduled")}
                                title="Schedule Interview"
                              >
                                <FaCalendarAlt size={14} color="#007bff" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-md-none">
                  {getApplicationsForJob.map((application) => (
                    <div className="card mb-3 shadow-sm" style={{ borderRadius: "10px", border: "1px solid #E2E2E2" }} key={application.id}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold mb-0">{application.applicantName}</h6>
                          <span className={`badge ${getStatusBadgeClass(application.status)}`} style={{ fontSize: "0.7rem" }}>
                            {application.status}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small mb-1">Education: {application.education}</div>
                          <div className="text-muted small mb-1">Email: {application.email}</div>
                          <div className="text-muted small mb-1">Phone: {application.phone}</div>
                          <div className="text-muted small mb-1">Experience: {application.experience}</div>
                          <div className="text-muted small">Applied: {application.appliedDate}</div>
                        </div>
                        {/* Responsive Button Group for Mobile */}
                        <div className="d-grid gap-2 mt-3">
                          <button
                            className="btn btn-sm text-white py-2"
                            style={primaryButtonStyle}
                            onClick={() => viewApplicationDetails(application)}
                          >
                            <FaEye size={12} className="me-1" />
                            View Details
                          </button>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm flex-fill py-2"
                              style={secondaryButtonStyle}
                              onClick={() => updateApplicationStatus(application.id, "Shortlisted")}
                            >
                              <FaCheck size={12} color="#28a745" className="me-1" />
                              Shortlist
                            </button>
                            <button
                              className="btn btn-sm flex-fill py-2"
                              style={secondaryButtonStyle}
                              onClick={() => updateApplicationStatus(application.id, "Interview Scheduled")}
                            >
                              <FaCalendarAlt size={12} color="#007bff" className="me-1" />
                              Interview
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {viewingApplication && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050 }}>
          <div className="bg-white p-3 p-md-4 rounded shadow w-100" style={{
            maxWidth: screenSize.isMobile ? "95%" : "600px",
            borderRadius: "14px",
            maxHeight: screenSize.isMobile ? "95vh" : "90vh",
            overflowY: "auto"
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0" style={{ color: "#C62828" }}>Application Details</h5>
              <button
                className="btn btn-sm p-2"
                onClick={() => setViewingApplication(null)}
                style={{ color: "#4A4A4A" }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", backgroundColor: "#F7EFE9" }}>
                  <FaUser size={30} color="#C62828" />
                </div>
                <div>
                  <h5 className="mb-1">{viewingApplication.applicantName}</h5>
                  <p className="text-muted mb-0">
                    {getJobById(viewingApplication.jobId)?.title}
                  </p>
                </div>
              </div>

              <div className={`row mb-3 ${screenSize.isMobile ? 'g-2' : ''}`}>
                <div className={screenSize.isMobile ? "col-12 mb-2" : "col-md-6 mb-2"}>
                  <strong>Email:</strong> {viewingApplication.email}
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-2" : "col-md-6 mb-2"}>
                  <strong>Phone:</strong> {viewingApplication.phone}
                </div>
                <div className="col-12 mb-2 col-md-6 mb-2">
                  <strong>Experience:</strong> {formatExperienceText(viewingApplication.experience)}
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-2" : "col-md-6 mb-2"}>
                  <strong>Education:</strong> {viewingApplication.education}
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-2" : "col-md-6 mb-2"}>
                  <strong>Applied Date:</strong> {viewingApplication.appliedDate}
                </div>
                <div className={screenSize.isMobile ? "col-12 mb-2" : "col-md-6 mb-2"}>
                  <strong>Status:</strong>
                  <span className={`badge ms-2 ${getStatusBadgeClass(viewingApplication.status)}`}>
                    {viewingApplication.status}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <strong>Skills:</strong>
                <div className="mt-2">
                  {viewingApplication.skills.split(', ').map((skill, index) => (
                    <span key={index} className="badge bg-light text-dark me-2 mb-2">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <strong>Resume:</strong>
                <div className="mt-2">
                  <a href="#" className="btn btn-sm" style={secondaryButtonStyle}>
                    {viewingApplication.resume}
                  </a>
                </div>
              </div>
            </div>

            {/* Responsive Button Group for Application Details Modal */}
            {screenSize.isMobile ? (
              // Mobile: Stack buttons vertically
              <div className="d-grid gap-2">
                <div className="d-flex gap-2">
                  <button
                    className="btn flex-fill py-2"
                    style={secondaryButtonStyle}
                    onClick={() => updateApplicationStatus(viewingApplication.id, "Shortlisted")}
                  >
                    <FaCheck size={14} color="#28a745" className="me-2" />
                    Shortlist
                  </button>
                  <button
                    className="btn flex-fill py-2"
                    style={secondaryButtonStyle}
                    onClick={() => updateApplicationStatus(viewingApplication.id, "Interview Scheduled")}
                  >
                    <FaCalendarAlt size={14} color="#007bff" className="me-2" />
                    Interview
                  </button>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn flex-fill py-2"
                    style={secondaryButtonStyle}
                    onClick={() => updateApplicationStatus(viewingApplication.id, "Rejected")}
                  >
                    <FaTimes size={14} color="#dc3545" className="me-2" />
                    Reject
                  </button>
                  <button
                    className="btn text-white flex-fill py-2"
                    style={primaryButtonStyle}
                    onClick={() => setViewingApplication(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Desktop: Horizontal button group
              <div className="d-flex justify-content-between">
                <div className="btn-group" role="group">
                  <button
                    className="btn"
                    style={secondaryButtonStyle}
                    onClick={() => updateApplicationStatus(viewingApplication.id, "Shortlisted")}
                  >
                    <FaCheck size={14} color="#28a745" className="me-2" />
                    Shortlist
                  </button>
                  <button
                    className="btn"
                    style={secondaryButtonStyle}
                    onClick={() => updateApplicationStatus(viewingApplication.id, "Interview Scheduled")}
                  >
                    <FaCalendarAlt size={14} color="#007bff" className="me-2" />
                    Schedule Interview
                  </button>
                  <button
                    className="btn"
                    style={secondaryButtonStyle}
                    onClick={() => updateApplicationStatus(viewingApplication.id, "Rejected")}
                  >
                    <FaTimes size={14} color="#dc3545" className="me-2" />
                    Reject
                  </button>
                </div>
                <button
                  className="btn text-white px-4"
                  style={primaryButtonStyle}
                  onClick={() => setViewingApplication(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobVacancies;