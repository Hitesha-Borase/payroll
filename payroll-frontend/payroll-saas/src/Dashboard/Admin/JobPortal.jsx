import React, { useState, useEffect } from "react";
import { adminAPI } from '../../services/api';
import { publicAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function JobPortal() {
  // Color scheme
  const colors = {
    primary: "#C62828",
    primaryDark: "#B71C1C",
    secondary: "#F44336",
    white: "#FFFFFF",
    black: "#212121",
    gray: "#757575",
    lightGray: "#E0E0E0",
    success: "#4CAF50",
    warning: "#FF9800",
    modalOverlay: "rgba(0, 0, 0, 0.6)",
  };

  const [employers, setEmployers] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [jobSeekers, setJobSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Fetch employers
      const empResponse = await adminAPI.getEmployers();
      if (empResponse?.data?.success) {
        const employersData = empResponse.data.data || [];
        setEmployers(employersData.map(emp => ({
          id: emp.id,
          name: emp.user?.name || 'N/A',
          company: emp.company_name || 'N/A',
          email: emp.user?.email || 'N/A',
          phone: emp.user?.phone || '',
        })));
      }

      // Fetch jobs (from Internal Admin API)
      const jobsResponse = await adminAPI.getJobVacancies();
      if (jobsResponse?.data?.success) {
        const jobsData = jobsResponse.data.data || [];
        setVacancies(jobsData.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department || 'N/A',
          location: job.location,
          description: job.description,
          status: job.status,
          postedDate: job.created_at ? job.created_at.substring(0, 10) : '',
          salary: job.salary || (job.salary_min && job.salary_max ? `${parseFloat(job.salary_min)} - ${parseFloat(job.salary_max)}` : (job.salary_min ? `${parseFloat(job.salary_min)}` : '')),
          employer: job.employer_name || 'N/A',
          level: job.level || 'N/A',
          employmentType: job.job_type,
          experienceRequired: job.experience_required || 'N/A',
          expiryDate: job.expiry_date ? job.expiry_date.substring(0, 10) : '',
          requirements: job.skills || '',
        })));
      }

      // Fetch Job Seekers
      const seekersResponse = await adminAPI.getJobSeekers();
      if (seekersResponse?.data?.success) {
        setJobSeekers(seekersResponse.data.data);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // State for tracking applications
  const [applications, setApplications] = useState([
    { id: 1001, vacancyId: 1, jobSeekerId: 101, status: "Applied", date: "2023-10-16" },
    { id: 1002, vacancyId: 2, jobSeekerId: 102, status: "Shortlisted", date: "2023-10-12" },
  ]);

  // UI state management
  const [modalType, setModalType] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [selectedJobSeeker, setSelectedJobSeeker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("vacancies");
  const [jobSeekerFilter, setJobSeekerFilter] = useState({
    skills: "",
    level: "All",
    experience: ""
  });

  // Update isMobileView on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions
  const getApplicationsForVacancy = (vacancyId) => {
    return applications.filter(app => app.vacancyId === vacancyId);
  };

  const getJobSeekerById = (id) => {
    return jobSeekers.find(js => js.id === id);
  };

  // Calculate match score between vacancy and job seeker
  const calculateMatchScore = (vacancy, jobSeeker) => {
    let score = 0;

    // Level matching
    if (vacancy.level === jobSeeker.level) {
      score += 30;
    } else if (
      (vacancy.level === "Senior" && jobSeeker.level === "Manager") ||
      (vacancy.level === "Manager" && jobSeeker.level === "Senior") ||
      (vacancy.level === "Mid-level" && jobSeeker.level === "Senior") ||
      (vacancy.level === "Entry" && jobSeeker.level === "Mid-level")
    ) {
      score += 15;
    }

    // Skills matching
    const vacancySkills = vacancy.description.toLowerCase().split(' ');
    const jobSeekerSkills = (jobSeeker.skills || "").toLowerCase().split(', ');

    let skillMatch = 0;
    jobSeekerSkills.forEach(skill => {
      if (vacancySkills.some(vSkill => vSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(vSkill))) {
        skillMatch++;
      }
    });

    if (jobSeekerSkills.length > 0) {
      score += (skillMatch / jobSeekerSkills.length) * 70;
    }

    return Math.round(score);
  };

  // Modal handlers
  const openModal = (type, data = null) => {
    setModalType(type);
    if (data) {
      if (type === 'jobSeekerDetails') {
        setSelectedJobSeeker(data);
      } else if (type === 'addJobSeeker') {
        setSelectedVacancy(data);
      } else if (type === 'editVacancy') {
        setSelectedVacancy(data);
      } else if (type === 'viewVacancy') {
        setSelectedVacancy(data);
      } else if (type === 'matchJobSeekers') {
        setSelectedVacancy(data);
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedJobSeeker(null);
    setSelectedVacancy(null);
  };

  // Action handlers
  const handleAddVacancy = async (e) => {
    e.preventDefault();
    try {
      const newVacancy = {
        title: e.target.title.value,
        department: e.target.department.value,
        location: e.target.location.value,
        description: e.target.description.value,
        salary: e.target.salary.value,
        employer: e.target.employer.value,
        jobType: e.target.employmentType.value,
        experience: e.target.experienceRequired.value,
        expiryDate: e.target.expiryDate.value,
        requirements: e.target.requirements.value,
        status: "Active",
        level: "Mid-level" // Defaulting
      };
      await adminAPI.createJobVacancy(newVacancy);
      toast.success('Vacancy created successfully');
      closeModal();
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vacancy');
    }
  };

  const handleEditVacancy = async (e) => {
    e.preventDefault();
    try {
      const updatedVacancy = {
        title: e.target.title.value,
        department: e.target.department.value,
        location: e.target.location.value,
        description: e.target.description.value,
        salary: e.target.salary.value,
        employer: e.target.employer.value,
        jobType: e.target.employmentType.value,
        experience: e.target.experienceRequired.value,
        expiryDate: e.target.expiryDate.value,
        requirements: e.target.requirements.value,
        status: selectedVacancy.status,
        level: selectedVacancy.level
      };
      await adminAPI.updateJobVacancy(selectedVacancy.id, updatedVacancy);
      toast.success('Vacancy updated successfully');
      closeModal();
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update vacancy');
    }
  };

  const handleDeleteVacancy = async (vacancyId) => {
    if (window.confirm("Are you sure you want to delete this vacancy?")) {
      try {
        await adminAPI.deleteJobVacancy(vacancyId);
        toast.success('Vacancy deleted successfully');
        setVacancies(prev => prev.filter(v => v.id !== vacancyId));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete vacancy');
      }
    }
  };

  const handleAddJobSeeker = async (e) => {
    e.preventDefault();
    try {
      const newJobSeeker = {
        name: e.target.name.value,
        email: e.target.email.value,
        phone: e.target.phone.value,
        skills: e.target.skills.value,
        experience: e.target.experience.value,
        education: e.target.education.value,
        currentCompany: e.target.currentCompany.value,
        level: e.target.level.value,
      };
      await adminAPI.createJobSeeker(newJobSeeker);
      toast.success('Job seeker added successfully');
      closeModal();
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add job seeker');
    }
  };

  const handleDeleteJobSeeker = async (jobSeekerId) => {
    if (window.confirm("Are you sure you want to delete this job seeker?")) {
      try {
        await adminAPI.deleteJobSeeker(jobSeekerId);
        toast.success('Job seeker deleted successfully');
        setJobSeekers(prev => prev.filter(s => s.id !== jobSeekerId && s.user_id !== jobSeekerId));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete job seeker');
      }
    }
  };

  const handleAddEmployer = (e) => {
    e.preventDefault();
    const newEmployer = {
      id: employers.length + 1,
      name: e.target.name.value,
      company: e.target.company.value,
      email: e.target.email.value,
      phone: e.target.phone.value,
    };
    setEmployers([...employers, newEmployer]);
    closeModal();
  };

  const handleDeleteEmployer = (employerId) => {
    if (window.confirm("Are you sure you want to delete this employer?")) {
      setEmployers(employers.filter(e => e.id !== employerId));
      closeModal();
    }
  };

  const handleAddJobSeekerToVacancy = (jobSeekerId) => {
    const existingApplication = applications.find(
      app => app.vacancyId === selectedVacancy.id && app.jobSeekerId === jobSeekerId
    );

    if (existingApplication) {
      toast.error("This job seeker has already applied for this vacancy");
      return;
    }

    const newApplication = {
      id: applications.length + 1001,
      vacancyId: selectedVacancy.id,
      jobSeekerId: jobSeekerId,
      status: "Applied",
      date: new Date().toISOString().split('T')[0],
    };
    setApplications([...applications, newApplication]);
    toast.success("Candidate has been sent to employer!");
    closeModal();
  };

  const handleUpdateApplicationStatus = (applicationId, newStatus) => {
    setApplications(applications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    ));
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} this account?`)) {
      try {
        const response = await adminAPI.toggleUserStatus(user.id, newStatus);
        if (response?.data?.success) {
          toast.success(response.data.message);
          setJobSeekers(prev => prev.map(s => (s.id === user.id || s.user_id === user.id ? { ...s, status: newStatus } : s)));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update user status');
      }
    }
  };

  // Filter vacancies based on search and status
  const filteredVacancies = vacancies.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.employer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter job seekers based on filter criteria
  const filteredJobSeekers = jobSeekers.filter(js => {
    const matchesSkills = jobSeekerFilter.skills === "" ||
      js.skills.toLowerCase().includes(jobSeekerFilter.skills.toLowerCase());
    const matchesLevel = jobSeekerFilter.level === "All" || js.level === jobSeekerFilter.level;
    const matchesExperience = jobSeekerFilter.experience === "" ||
      js.experience.includes(jobSeekerFilter.experience);
    return matchesSkills && matchesLevel && matchesExperience;
  });

  // Reusable form field component
  const FormField = ({ label, name, type = "text", placeholder, required = true, options, defaultValue, flex = 1 }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex }}>
        <label style={{ marginBottom: '0.5rem', color: colors.black, fontWeight: '500' }}>{label}</label>
        {type === "select" ? (
          <select
            name={name}
            defaultValue={defaultValue}
            required={required}
            style={{
              ...styles.input(colors.lightGray),
              fontSize: isMobileView ? '0.9rem' : '1rem',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>{option.label || option}</option>
            ))}
          </select>
        ) : (
          <input
            name={name}
            type={type}
            placeholder={placeholder}
            defaultValue={defaultValue}
            required={required}
            style={{
              ...styles.input(colors.lightGray),
              fontSize: isMobileView ? '0.9rem' : '1rem',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        )}
      </div>
    );
  };

  // Reusable action buttons component
  const ActionButtons = ({ item, onView, onEdit, onDelete, onToggle }) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
        {onView && (
          <button
            onClick={() => onView(item)}
            title="View Details"
            style={{ ...styles.actionBtn(colors.primary), backgroundColor: colors.primary }}
          >
            <i className="bi bi-eye-fill" style={{ fontSize: "12px" }}></i>
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            title="Edit Details"
            style={{ ...styles.actionBtn(colors.primary), backgroundColor: colors.primary }}
          >
            <i className="bi bi-pencil-fill" style={{ fontSize: "12px" }}></i>
          </button>
        )}
        {onToggle && (
          <button
            onClick={() => onToggle(item)}
            title={item.status === 'blocked' ? "Enable Account" : "Disable Account"}
            style={{
              ...styles.actionBtn(item.status === 'blocked' ? colors.success : colors.warning),
              backgroundColor: item.status === 'blocked' ? colors.success : colors.warning
            }}
          >
            <i className={`bi ${item.status === 'blocked' ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`} style={{ fontSize: "12px" }}></i>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            title="Delete"
            style={{ ...styles.actionBtn(colors.primary), backgroundColor: colors.primary }}
          >
            <i className="bi bi-trash-fill" style={{ fontSize: "12px" }}></i>
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${colors.lightGray}`,
        padding: isMobileView ? '0.5rem 1rem' : '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: colors.white
      }}>
        <h1 style={{ margin: 0, color: colors.primary, fontSize: isMobileView ? '1.2rem' : '1.5rem' }}>Job Portal</h1>

        {isMobileView ? (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: colors.primary
            }}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>
        ) : (
          <div>
            <button onClick={() => openModal('addVacancy')} style={styles.button(colors.primary, colors.white, 'small')}>+ Add Vacancy</button>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      {isMobileView && showMobileMenu && (
        <div style={{
          borderBottom: `1px solid ${colors.lightGray}`,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button onClick={() => { openModal('addVacancy'); setShowMobileMenu(false); }} style={styles.button(colors.primary, colors.white, 'small')}>+ Add Vacancy</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${colors.lightGray}`,
        backgroundColor: colors.white
      }}>
        <button
          onClick={() => setActiveTab("vacancies")}
          style={{
            ...styles.tabButton,
            borderBottom: activeTab === "vacancies" ? `3px solid ${colors.primary}` : 'none',
            color: activeTab === "vacancies" ? colors.primary : colors.gray,
            fontWeight: activeTab === "vacancies" ? 'bold' : 'normal'
          }}
        >
          Vacancies
        </button>
        <button
          onClick={() => setActiveTab("jobseekers")}
          style={{
            ...styles.tabButton,
            borderBottom: activeTab === "jobseekers" ? `3px solid ${colors.primary}` : 'none',
            color: activeTab === "jobseekers" ? colors.primary : colors.gray,
            fontWeight: activeTab === "jobseekers" ? 'bold' : 'normal'
          }}
        >
          Job Seekers
        </button>
      </div>

      {/* Main Content */}
      <main style={{
        padding: isMobileView ? '0.5rem' : '1rem'
      }}>
        {/* Vacancies Tab */}
        {activeTab === "vacancies" && (
          <>
            {/* Search and Filter */}
            <div style={{
              marginBottom: '1rem',
              display: 'flex',
              gap: '1rem',
              flexDirection: isMobileView ? 'column' : 'row'
            }}>
              <input
                type="text"
                placeholder="Search vacancies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...styles.input(colors.lightGray),
                  flex: 1,
                  padding: isMobileView ? '0.75rem' : '0.75rem',
                  fontSize: isMobileView ? '0.9rem' : '1rem'
                }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  ...styles.input(colors.lightGray),
                  width: isMobileView ? '100%' : '200px',
                  padding: isMobileView ? '0.75rem' : '0.75rem',
                  fontSize: isMobileView ? '0.9rem' : '1rem'
                }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Vacancies Table/List */}
            <div style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              {isMobileView ? (
                // Mobile Card View
                <div style={{ padding: '1rem' }}>
                  {filteredVacancies.length > 0 ? (
                    filteredVacancies.map(v => {
                      const appCount = getApplicationsForVacancy(v.id).length;
                      return (
                        <div key={v.id} style={{
                          border: `1px solid ${colors.lightGray}`,
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <h3 style={{
                              margin: 0,
                              color: colors.primary,
                              fontSize: '1.1rem',
                              fontWeight: 'bold'
                            }}>
                              {v.title}
                            </h3>
                            <p style={{
                              margin: '0.25rem 0 0',
                              color: colors.gray,
                              fontSize: '0.9rem'
                            }}>
                              {v.employer} • {v.location} • {v.experienceRequired}
                            </p>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                          }}>
                            <span style={{
                              fontSize: '0.9rem',
                              color: colors.gray
                            }}>
                              {appCount} Applicants
                            </span>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              backgroundColor: v.status === 'Active' ? '#e8f5e9' : '#f3f3f3',
                              color: v.status === 'Active' ? colors.success : colors.gray
                            }}>
                              {v.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                            <ActionButtons
                              item={v}
                              onView={() => openModal('viewVacancy', v)}
                              onEdit={() => openModal('editVacancy', v)}
                              onDelete={handleDeleteVacancy}
                            />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: colors.gray }}>
                      No vacancies found matching your criteria.
                    </div>
                  )}
                </div>
              ) : (
                // Desktop Table View
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.primary, color: colors.white }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Employer</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Job Title</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Location</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Experience</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Applicants</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVacancies.length > 0 ? (
                      filteredVacancies.map(v => {
                        const appCount = getApplicationsForVacancy(v.id).length;
                        return (
                          <tr key={v.id} style={{ borderBottom: `1px solid ${colors.lightGray}` }}>
                            <td style={{ padding: '1rem', color: colors.black }}>{v.employer}</td>
                            <td style={{ padding: '1rem' }}>
                              <div>
                                <strong style={{ color: colors.primary }}>{v.title}</strong>
                                <div style={{ fontSize: '0.85rem', color: colors.gray, marginTop: '0.25rem' }}>
                                  {v.department} • {v.salary}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: colors.black }}>{v.location}</td>
                            <td style={{ padding: '1rem', color: colors.black }}>{v.experienceRequired}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                backgroundColor: colors.lightGray,
                                color: colors.black,
                                fontWeight: 'bold'
                              }}>
                                {appCount}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                backgroundColor: v.status === 'Active' ? '#e8f5e9' : '#f3f3f3',
                                color: v.status === 'Active' ? colors.success : colors.gray
                              }}>
                                {v.status}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <ActionButtons
                                item={v}
                                onView={() => openModal('viewVacancy', v)}
                                onEdit={() => openModal('editVacancy', v)}
                                onDelete={handleDeleteVacancy}
                              />
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: colors.gray }}>
                          No vacancies found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Job Seekers Tab */}
        {activeTab === "jobseekers" && (
          <>
            {/* Job Seeker Filters */}
            <div style={{
              marginBottom: '1rem',
              display: 'flex',
              gap: '1rem',
              flexDirection: isMobileView ? 'column' : 'row'
            }}>
              <input
                type="text"
                placeholder="Filter by skills..."
                value={jobSeekerFilter.skills}
                onChange={(e) => setJobSeekerFilter({ ...jobSeekerFilter, skills: e.target.value })}
                style={{
                  ...styles.input(colors.lightGray),
                  flex: 1,
                  padding: isMobileView ? '0.75rem' : '0.75rem',
                  fontSize: isMobileView ? '0.9rem' : '1rem'
                }}
              />
              <select
                value={jobSeekerFilter.level}
                onChange={(e) => setJobSeekerFilter({ ...jobSeekerFilter, level: e.target.value })}
                style={{
                  ...styles.input(colors.lightGray),
                  width: isMobileView ? '100%' : '200px',
                  padding: isMobileView ? '0.75rem' : '0.75rem',
                  fontSize: isMobileView ? '0.9rem' : '1rem'
                }}
              >
                <option value="All">All Levels</option>
                <option value="Entry">Entry Level</option>
                <option value="Mid-level">Mid-level</option>
                <option value="Senior">Senior</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
              </select>
              <input
                type="text"
                placeholder="Filter by experience..."
                value={jobSeekerFilter.experience}
                onChange={(e) => setJobSeekerFilter({ ...jobSeekerFilter, experience: e.target.value })}
                style={{
                  ...styles.input(colors.lightGray),
                  width: isMobileView ? '100%' : '200px',
                  padding: isMobileView ? '0.75rem' : '0.75rem',
                  fontSize: isMobileView ? '0.9rem' : '1rem'
                }}
              />
            </div>

            {/* Job Seekers List */}
            <div style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              {isMobileView ? (
                // Mobile Card View
                <div style={{ padding: '1rem' }}>
                  {filteredJobSeekers.length > 0 ? (
                    filteredJobSeekers.map(js => (
                      <div key={js.id} style={{
                        border: `1px solid ${colors.lightGray}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <h3 style={{
                            margin: 0,
                            color: colors.primary,
                            fontSize: '1.1rem',
                            fontWeight: 'bold'
                          }}>
                            {js.name}
                          </h3>
                          <p style={{
                            margin: '0.25rem 0 0',
                            color: colors.gray,
                            fontSize: '0.9rem'
                          }}>
                            {js.currentCompany} • {js.level} • {js.experience}
                          </p>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <span style={{
                            fontSize: '0.9rem',
                            color: colors.gray
                          }}>
                            {(js.skills || "").split(',')[0]}{(js.skills || "").split(',').length > 1 ? '...' : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                          <ActionButtons
                            item={js}
                            onView={() => openModal('jobSeekerDetails', js)}
                            onToggle={handleToggleStatus}
                            onDelete={() => handleDeleteJobSeeker(js.id)}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: colors.gray }}>
                      No job seekers found matching your criteria.
                    </div>
                  )}
                </div>
              ) : (
                // Desktop Table View
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.primary, color: colors.white }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Current Company</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Level</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Experience</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Skills</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobSeekers.length > 0 ? (
                      filteredJobSeekers.map(js => (
                        <tr key={js.id} style={{ borderBottom: `1px solid ${colors.lightGray}` }}>
                          <td style={{ padding: '1rem', color: colors.black }}>
                            <div>
                              <strong>{js.name}</strong>
                              <div style={{ fontSize: '0.85rem', color: colors.gray, marginTop: '0.25rem' }}>
                                {js.email}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: colors.black }}>{js.currentCompany}</td>
                          <td style={{ padding: '1rem', color: colors.black }}>{js.level}</td>
                          <td style={{ padding: '1rem', color: colors.black }}>{js.experience}</td>
                          <td style={{ padding: '1rem', color: colors.black }}>{js.skills}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <ActionButtons
                              item={js}
                              onView={() => openModal('jobSeekerDetails', js)}
                              onToggle={handleToggleStatus}
                              onDelete={() => handleDeleteJobSeeker(js.id)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: colors.gray }}>
                          No job seekers found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {modalType && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={{
            ...styles.modalBox(colors.white),
            width: isMobileView ? '95%' : '70%',
            maxWidth: isMobileView ? '95%' : '600px',
            maxHeight: isMobileView ? '90vh' : '80vh',
            padding: isMobileView ? '1rem' : '1.5rem'
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} style={styles.closeButton}>×</button>

            {/* Add Vacancy Modal */}
            {modalType === 'addVacancy' && (
              <>
                <h2 style={{ fontSize: isMobileView ? '1.1rem' : '1.3rem', color: colors.primary, marginBottom: '1.5rem' }}>Post New Vacancy</h2>
                <form onSubmit={handleAddVacancy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Row 1: Job Title and Department */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Job Title"
                        name="title"
                        placeholder="e.g. Senior Frontend Developer"
                      />
                      <FormField
                        label="Department"
                        name="department"
                        placeholder="e.g. Engineering"
                      />
                    </div>

                    {/* Row 2: Employer and Salary */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Employer"
                        name="employer"
                        type="select"
                        options={employers.map(e => e.company)}
                      />
                      <FormField
                        label="Salary Range"
                        name="salary"
                        placeholder="e.g. $80,000 - $120,000"
                      />
                    </div>

                    {/* Row 3: Location and Employment Type */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Location"
                        name="location"
                        placeholder="e.g. Mumbai, Maharashtra"
                      />
                      <FormField
                        label="Employment Type"
                        name="employmentType"
                        type="select"
                        options={["Full-time", "Part-time", "Contract", "Internship"]}
                      />
                    </div>

                    {/* Row 4: Experience Required and Expiry Date */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Experience Required"
                        name="experienceRequired"
                        placeholder="e.g. 3+ years"
                      />
                      <FormField
                        label="Expiry Date"
                        name="expiryDate"
                        type="date"
                      />
                    </div>

                    {/* Row 5: Job Description */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ marginBottom: '0.5rem', color: colors.black, fontWeight: '500' }}>Job Description</label>
                      <textarea
                        name="description"
                        placeholder="Enter job description..."
                        rows="4"
                        required
                        style={{
                          ...styles.input(colors.lightGray),
                          fontSize: isMobileView ? '0.9rem' : '1rem',
                          padding: '0.75rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>

                    {/* Row 6: Requirements */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ marginBottom: '0.5rem', color: colors.black, fontWeight: '500' }}>Requirements</label>
                      <textarea
                        name="requirements"
                        placeholder="Enter job requirements..."
                        rows="4"
                        required
                        style={{
                          ...styles.input(colors.lightGray),
                          fontSize: isMobileView ? '0.9rem' : '1rem',
                          padding: '0.75rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        ...styles.button(colors.lightGray, colors.black, 'small'),
                        background: colors.lightGray,
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        ...styles.button(colors.primary, colors.white, 'small'),
                        backgroundColor: colors.primary,
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      Post Vacancy
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Edit Vacancy Modal */}
            {modalType === 'editVacancy' && selectedVacancy && (
              <>
                <h2 style={{ fontSize: isMobileView ? '1.1rem' : '1.3rem', color: colors.primary }}>Edit Vacancy</h2>
                <form onSubmit={handleEditVacancy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Row 1: Job Title and Department */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Job Title"
                        name="title"
                        defaultValue={selectedVacancy.title}
                      />
                      <FormField
                        label="Department"
                        name="department"
                        defaultValue={selectedVacancy.department}
                      />
                    </div>

                    {/* Row 2: Employer and Salary */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Employer"
                        name="employer"
                        type="select"
                        options={employers.map(e => e.company)}
                        defaultValue={selectedVacancy.employer}
                      />
                      <FormField
                        label="Salary Range"
                        name="salary"
                        defaultValue={selectedVacancy.salary}
                      />
                    </div>

                    {/* Row 3: Location and Employment Type */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Location"
                        name="location"
                        defaultValue={selectedVacancy.location}
                      />
                      <FormField
                        label="Employment Type"
                        name="employmentType"
                        type="select"
                        options={["Full-time", "Part-time", "Contract", "Internship"]}
                        defaultValue={selectedVacancy.employmentType}
                      />
                    </div>

                    {/* Row 4: Experience Required and Expiry Date */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Experience Required"
                        name="experienceRequired"
                        defaultValue={selectedVacancy.experienceRequired}
                      />
                      <FormField
                        label="Expiry Date"
                        name="expiryDate"
                        type="date"
                        defaultValue={selectedVacancy.expiryDate}
                      />
                    </div>

                    {/* Row 5: Job Description */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ marginBottom: '0.5rem', color: colors.black, fontWeight: '500' }}>Job Description</label>
                      <textarea
                        name="description"
                        defaultValue={selectedVacancy.description}
                        rows="4"
                        required
                        style={{
                          ...styles.input(colors.lightGray),
                          fontSize: isMobileView ? '0.9rem' : '1rem',
                          padding: '0.75rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>

                    {/* Row 6: Requirements */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ marginBottom: '0.5rem', color: colors.black, fontWeight: '500' }}>Requirements</label>
                      <textarea
                        name="requirements"
                        defaultValue={selectedVacancy.requirements}
                        rows="4"
                        required
                        style={{
                          ...styles.input(colors.lightGray),
                          fontSize: isMobileView ? '0.9rem' : '1rem',
                          padding: '0.75rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button type="button" onClick={closeModal} style={{ ...styles.button(colors.lightGray, colors.black, 'small'), background: colors.lightGray }}>Cancel</button>
                    <button type="submit" style={styles.button(colors.primary, colors.white, 'small')}>Save Changes</button>
                  </div>
                </form>
              </>
            )}

            {/* View Vacancy Modal */}
            {modalType === 'viewVacancy' && selectedVacancy && (
              <>
                <h2 style={{ fontSize: isMobileView ? '1.1rem' : '1.3rem', color: colors.primary }}>Vacancy Details</h2>
                <div style={{ display: isMobileView ? 'block' : 'flex', gap: '20px' }}>
                  <div style={{ flex: 1, marginBottom: isMobileView ? '1rem' : '0' }}>
                    <h4 style={{ color: colors.primary, fontSize: isMobileView ? '0.95rem' : '1rem' }}>Job Information</h4>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Title:</strong> {selectedVacancy.title}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Department:</strong> {selectedVacancy.department}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Location:</strong> {selectedVacancy.location}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Experience:</strong> {selectedVacancy.experienceRequired}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Salary:</strong> {selectedVacancy.salary}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Status:</strong> {selectedVacancy.status}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Posted Date:</strong> {selectedVacancy.postedDate}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: colors.primary, fontSize: isMobileView ? '0.95rem' : '1rem' }}>Employer Information</h4>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Employer:</strong> {selectedVacancy.employer}</p>
                    <h4 style={{ color: colors.primary, fontSize: isMobileView ? '0.95rem' : '1rem', marginTop: '1rem' }}>Description</h4>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}>{selectedVacancy.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                  <button onClick={closeModal} style={styles.button(colors.primary, colors.white, 'small')}>Close</button>
                </div>
              </>
            )}

            {/* Add Job Seeker Modal */}
            {modalType === 'addJobSeeker' && (
              <>
                <h2 style={{ fontSize: isMobileView ? '1.1rem' : '1.3rem', color: colors.primary, marginBottom: '1.5rem' }}>
                  Add Job Seeker Resume
                </h2>
                <form onSubmit={handleAddJobSeeker}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Row 1: Name and Email */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Full Name"
                        name="name"
                        placeholder="Full Name"
                      />
                      <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="Email Address"
                      />
                    </div>

                    {/* Row 2: Phone and Education */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Phone Number"
                        name="phone"
                        placeholder="Phone Number"
                      />
                      <FormField
                        label="Education"
                        name="education"
                        placeholder="Education"
                      />
                    </div>

                    {/* Row 3: Current Company and Experience */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Current Company"
                        name="currentCompany"
                        placeholder="Current Company"
                      />
                      <FormField
                        label="Experience"
                        name="experience"
                        placeholder="Experience (e.g., 3 years)"
                      />
                    </div>

                    {/* Row 4: Level and Skills */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobileView ? 'column' : 'row' }}>
                      <FormField
                        label="Level"
                        name="level"
                        type="select"
                        options={["Entry Level", "Mid-level", "Senior", "Manager", "Director"]}
                      />
                      <FormField
                        label="Key Skills"
                        name="skills"
                        placeholder="Key Skills (e.g., React, HR, PMP)"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        ...styles.button(colors.lightGray, colors.black, 'small'),
                        background: colors.lightGray,
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        ...styles.button(colors.primary, colors.white, 'small'),
                        backgroundColor: colors.primary,
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      Save Resume
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Job Seeker Details Modal */}
            {modalType === 'jobSeekerDetails' && selectedJobSeeker && (
              <>
                <h2 style={{ fontSize: isMobileView ? '1.1rem' : '1.3rem', color: colors.primary }}>Job Seeker Resume</h2>
                <div style={{ display: isMobileView ? 'block' : 'flex', gap: '20px' }}>
                  <div style={{ flex: 1, marginBottom: isMobileView ? '1rem' : '0' }}>
                    <h4 style={{ color: colors.primary, fontSize: isMobileView ? '0.95rem' : '1rem' }}>Personal Information</h4>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Name:</strong> {selectedJobSeeker.name}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Email:</strong> {selectedJobSeeker.email}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Phone:</strong> {selectedJobSeeker.phone}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Level:</strong> {selectedJobSeeker.level}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: colors.primary, fontSize: isMobileView ? '0.95rem' : '1rem' }}>Professional Information</h4>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Education:</strong> {selectedJobSeeker.education}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Current Company:</strong> {selectedJobSeeker.currentCompany}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Experience:</strong> {selectedJobSeeker.experience}</p>
                    <p style={{ fontSize: isMobileView ? '0.9rem' : '1rem' }}><strong>Skills:</strong> {selectedJobSeeker.skills}</p>
                  </div>
                </div>
                {selectedVacancy && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ color: colors.primary, fontSize: isMobileView ? '0.95rem' : '1rem' }}>Match Score for {selectedVacancy.title}</h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '0.5rem'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: calculateMatchScore(selectedVacancy, selectedJobSeeker) >= 70 ? '#e8f5e9' : calculateMatchScore(selectedVacancy, selectedJobSeeker) >= 40 ? '#fff3e0' : '#ffebee',
                        color: calculateMatchScore(selectedVacancy, selectedJobSeeker) >= 70 ? colors.success : calculateMatchScore(selectedVacancy, selectedJobSeeker) >= 40 ? colors.warning : colors.secondary
                      }}>
                        {calculateMatchScore(selectedVacancy, selectedJobSeeker)}%
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                  <button onClick={closeModal} style={styles.button(colors.primary, colors.white, 'small')}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Styles
const styles = {
  button: (bg, color, size = 'medium') => ({
    backgroundColor: bg,
    color: color,
    border: 'none',
    padding: size === 'small' ? '8px 16px' : '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    fontSize: size === 'small' ? '0.9rem' : '1rem',
  }),
  input: (borderColor) => ({
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    border: `1px solid ${borderColor}`,
    borderRadius: '5px',
    boxSizing: 'border-box',
    fontSize: '1rem',
  }),
  actionBtn: (color) => ({
    padding: "4px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "500",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    border: "none",
    cursor: "pointer"
  }),
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBox: (bg) => ({
    backgroundColor: bg,
    padding: '1.5rem',
    borderRadius: '10px',
    width: '70%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
  }),
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#757575',
  },
  tabButton: {
    flex: 1,
    padding: '1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    textAlign: 'center',
    transition: 'all 0.3s',
  },
};