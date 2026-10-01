// src/pages/JobSeeker/UserProfile.js

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, InputGroup, Modal, ListGroup, Spinner, Alert } from 'react-bootstrap';
import {
  FaUser,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaBriefcase,
  FaGraduationCap,
  FaFileUpload,
  FaPlus,
  FaTrash,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';

// --- Main UserProfilePage Component ---
const UserProfilePage = () => {
  const [profile, setProfile] = useState({
    personalDetails: {
      name: '',
      email: '',
      phone: '',
      location: '',
      headline: '',
    },
    professionalSummary: '',
    skills: [],
    experience: [],
    education: [],
    resume: { fileName: '' },
    jobPreferences: {
      industry: '',
      role: '',
      location: '',
      salary: '',
    },
    profileVisibility: {
      isVisible: true,
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for controlling modals
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Temporary state for form inputs in modals
  const [tempPersonal, setTempPersonal] = useState(profile.personalDetails);
  const [tempSummary, setTempSummary] = useState(profile.professionalSummary);
  const [tempSkills, setTempSkills] = useState(profile.skills.join(', '));
  const [tempExperience, setTempExperience] = useState(profile.experience);
  const [tempEducation, setTempEducation] = useState(profile.education);
  const [tempPreferences, setTempPreferences] = useState(profile.jobPreferences);

  // Update temp states when profile changes
  useEffect(() => {
    setTempPersonal(profile.personalDetails);
    setTempSummary(profile.professionalSummary);
    setTempSkills(profile.skills.join(', '));
    setTempExperience(profile.experience);
    setTempEducation(profile.education);
    setTempPreferences(profile.jobPreferences);
  }, [profile]);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await publicAPI.getProfile();
        if (response?.data?.success && response.data.data) {
          const data = response.data.data;
          setProfile({
            personalDetails: {
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              location: data.location || '',
              headline: data.headline || '',
            },
            professionalSummary: data.summary || data.professionalSummary || '',
            skills: data.skills ? (typeof data.skills === 'string' ? data.skills.split(',') : data.skills) : [],
            experience: data.experience || [],
            education: data.education || [],
            resume: { fileName: data.resume || '' },
            jobPreferences: {
              industry: data.industry || '',
              role: data.role || '',
              location: data.preferred_location || '',
              salary: data.salary_expectation || '',
            },
            profileVisibility: {
              isVisible: data.is_visible !== false,
            }
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Handler Functions ---
  const handleSavePersonal = async () => {
    try {
      const response = await publicAPI.updateProfile({
        name: tempPersonal.name,
        email: tempPersonal.email,
        phone: tempPersonal.phone,
        location: tempPersonal.location,
        headline: tempPersonal.headline,
      });
      if (response?.data?.success) {
        setProfile({ ...profile, personalDetails: tempPersonal });
        setShowPersonalModal(false);
        toast.success("Personal details updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update personal details');
    }
  };

  const handleSaveSummary = async () => {
    try {
      const response = await publicAPI.updateProfile({
        summary: tempSummary,
        professionalSummary: tempSummary,
      });
      if (response?.data?.success) {
        setProfile({ ...profile, professionalSummary: tempSummary });
        setShowSummaryModal(false);
        toast.success("Summary updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update summary');
    }
  };

  const handleSaveSkills = async () => {
    try {
      const skillsArray = tempSkills.split(',').map(s => s.trim()).filter(s => s);
      const response = await publicAPI.updateProfile({
        skills: skillsArray.join(','),
      });
      if (response?.data?.success) {
        setProfile({ ...profile, skills: skillsArray });
        setShowSkillsModal(false);
        toast.success("Skills updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update skills');
    }
  };

  const handleSaveExperience = async () => {
    try {
      const response = await publicAPI.updateProfile({
        experience: tempExperience,
      });
      if (response?.data?.success) {
        setProfile({ ...profile, experience: tempExperience });
        setShowExperienceModal(false);
        toast.success("Experience updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update experience');
    }
  };

  const handleSaveEducation = async () => {
    try {
      const response = await publicAPI.updateProfile({
        education: tempEducation,
      });
      if (response?.data?.success) {
        setProfile({ ...profile, education: tempEducation });
        setShowEducationModal(false);
        toast.success("Education updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update education');
    }
  };

  const handleSavePreferences = async () => {
    try {
      const response = await publicAPI.updateProfile({
        industry: tempPreferences.industry,
        role: tempPreferences.role,
        preferred_location: tempPreferences.location,
        salary_expectation: tempPreferences.salary,
      });
      if (response?.data?.success) {
        setProfile({ ...profile, jobPreferences: tempPreferences });
        setShowPreferencesModal(false);
        toast.success("Job preferences updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update preferences');
    }
  };

  const handleResumeUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('title', 'Resume');
        const response = await publicAPI.submitResume(formData);
        if (response?.data?.success) {
          setProfile({ ...profile, resume: { fileName: e.target.files[0].name } });
          toast.success("Resume uploaded successfully");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to upload resume');
      }
    }
  };

  const toggleProfileVisibility = async () => {
    try {
      const newVisibility = !profile.profileVisibility.isVisible;
      const response = await publicAPI.updateProfile({
        is_visible: newVisibility,
      });
      if (response?.data?.success) {
        setProfile({ ...profile, profileVisibility: { isVisible: newVisibility } });
        toast.success(`Profile is now ${newVisibility ? 'visible' : 'hidden'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update visibility');
    }
  };

  const addExperience = () => {
    setTempExperience([...tempExperience, { id: Date.now(), company: '', title: '', duration: '', description: '' }]);
  };

  const deleteExperience = (id) => {
    setTempExperience(tempExperience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    setTempEducation([...tempEducation, { id: Date.now(), institution: '', degree: '', duration: '' }]);
  };

  const deleteEducation = (id) => {
    setTempEducation(tempEducation.filter(edu => edu.id !== id));
  };

  const handleExperienceChange = (id, field, value) => {
    setTempExperience(tempExperience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const handleEducationChange = (id, field, value) => {
    setTempEducation(tempEducation.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const editBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '6px',
    color: '#C62828',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  };

  return (
    <div className="container-fluid px-3 px-sm-4 py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', maxWidth: '1280px', margin: '0 auto' }}>
      <div>
        {error && (
          <Alert variant="danger" className="mb-4 shadow-sm" style={{ borderRadius: '10px' }}>
            {error}
          </Alert>
        )}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '1.75rem' }}>My Profile</h1>
            <p className="text-muted mb-0 small">Manage your professional profile and resume details</p>
          </div>
        </div>

        <Row className="g-4">
          {/* Left Column */}
          <Col lg={8}>
            {/* Personal Details Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  <FaUser style={{ color: '#C62828' }} /> Personal Details
                </Card.Title>
                <button style={editBtnStyle} onClick={() => { setTempPersonal(profile.personalDetails); setShowPersonalModal(true); }}>
                  <FaEdit size={12} /> Edit
                </button>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <h4 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '1.25rem' }}>{profile.personalDetails.name || 'Your Name'}</h4>
                <p className="text-muted mb-3">{profile.personalDetails.headline || 'Add a professional headline'}</p>
                <div className="d-flex flex-column gap-2 text-muted small">
                  <div className="d-flex align-items-center gap-2"><FaEnvelope className="text-danger" /><span>{profile.personalDetails.email || 'Email not provided'}</span></div>
                  <div className="d-flex align-items-center gap-2"><FaPhone className="text-danger" /><span>{profile.personalDetails.phone || 'Phone not provided'}</span></div>
                  <div className="d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-danger" /><span>{profile.personalDetails.location || 'Location not specified'}</span></div>
                </div>
              </Card.Body>
            </Card>

            {/* Professional Summary Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  Professional Summary
                </Card.Title>
                <button style={editBtnStyle} onClick={() => { setTempSummary(profile.professionalSummary); setShowSummaryModal(true); }}>
                  <FaEdit size={12} /> Edit
                </button>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <p className="mb-0" style={{ color: profile.professionalSummary ? '#334155' : '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {profile.professionalSummary || 'No professional summary added yet. Click Edit to add one.'}
                </p>
              </Card.Body>
            </Card>

            {/* Skills Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  Skills
                </Card.Title>
                <button style={editBtnStyle} onClick={() => { setTempSkills(profile.skills.join(', ')); setShowSkillsModal(true); }}>
                  <FaEdit size={12} /> Edit
                </button>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <div className="d-flex flex-wrap gap-2">
                  {profile.skills.length > 0 ? (
                    profile.skills.map(skill => (
                      <Badge key={skill} bg="light" text="dark" className="px-3 py-2 fw-medium shadow-sm" style={{ border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted small">No skills added yet.</span>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Experience Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  <FaBriefcase style={{ color: '#C62828' }} /> Work Experience
                </Card.Title>
                <button style={editBtnStyle} onClick={() => { setTempExperience(profile.experience); setShowExperienceModal(true); }}>
                  <FaEdit size={12} /> Edit
                </button>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                {profile.experience.length > 0 ? (
                  profile.experience.map(exp => (
                    <div key={exp.id} className="mb-3 pb-3 border-bottom last-border-0">
                      <h6 className="fw-bold mb-1" style={{ color: '#0F172A' }}>{exp.title} - {exp.company}</h6>
                      <p className="text-muted small mb-2">{exp.duration}</p>
                      <p className="text-muted small mb-0">{exp.description}</p>
                    </div>
                  ))
                ) : (
                  <span className="text-muted small">No work experience added yet.</span>
                )}
              </Card.Body>
            </Card>

            {/* Education Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  <FaGraduationCap style={{ color: '#C62828' }} /> Education
                </Card.Title>
                <button style={editBtnStyle} onClick={() => { setTempEducation(profile.education); setShowEducationModal(true); }}>
                  <FaEdit size={12} /> Edit
                </button>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                {profile.education.length > 0 ? (
                  profile.education.map(edu => (
                    <div key={edu.id} className="mb-3 pb-3 border-bottom last-border-0">
                      <h6 className="fw-bold mb-1" style={{ color: '#0F172A' }}>{edu.degree}</h6>
                      <p className="text-muted small mb-0">{edu.institution} | {edu.duration}</p>
                    </div>
                  ))
                ) : (
                  <span className="text-muted small">No education details added yet.</span>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col lg={4}>
            {/* Resume Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  <FaFileUpload style={{ color: '#C62828' }} /> Resume
                </Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <p className="text-muted small mb-1">Current Resume:</p>
                <p className="fw-semibold text-truncate mb-3" style={{ color: '#0F172A' }}>
                  {profile.resume.fileName || 'No resume uploaded'}
                </p>
                <Form.Group controlId="formFile" className="mb-0">
                  <Form.Label className="small fw-medium text-muted">Upload New Resume</Form.Label>
                  <Form.Control type="file" size="sm" onChange={handleResumeUpload} style={{ borderRadius: '6px' }} />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Job Preferences Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  Job Preferences
                </Card.Title>
                <button style={editBtnStyle} onClick={() => { setTempPreferences(profile.jobPreferences); setShowPreferencesModal(true); }}>
                  <FaEdit size={12} /> Edit
                </button>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <ListGroup variant="flush" className="small">
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <strong className="text-muted">Industry:</strong>
                    <span className="text-dark fw-medium">{profile.jobPreferences.industry || 'Not set'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <strong className="text-muted">Role:</strong>
                    <span className="text-dark fw-medium">{profile.jobPreferences.role || 'Not set'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <strong className="text-muted">Location:</strong>
                    <span className="text-dark fw-medium">{profile.jobPreferences.location || 'Not set'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <strong className="text-muted">Salary:</strong>
                    <span className="text-dark fw-medium">{profile.jobPreferences.salary || 'Not set'}</span>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Profile Visibility Card */}
            <Card className="mb-4 shadow-sm" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <Card.Header className="py-2.5 px-3 px-sm-4" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Card.Title as="h5" className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                  Profile Visibility
                </Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <p className="text-muted small mb-3">Make your profile visible to employers and recruiters.</p>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small fw-semibold" style={{ color: profile.profileVisibility.isVisible ? '#059669' : '#64748B' }}>
                    {profile.profileVisibility.isVisible ? '✓ Visible to Recruiters' : '✕ Hidden from Recruiters'}
                  </span>
                  <Form.Check
                    type="switch"
                    id="profile-visibility-switch"
                    checked={profile.profileVisibility.isVisible}
                    onChange={toggleProfileVisibility}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* --- MODALS --- */}

      {/* Personal Details Modal */}
      <Modal show={showPersonalModal} onHide={() => setShowPersonalModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Personal Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control type="text" value={tempPersonal.name} onChange={(e) => setTempPersonal({ ...tempPersonal, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Headline</Form.Label>
              <Form.Control type="text" value={tempPersonal.headline} onChange={(e) => setTempPersonal({ ...tempPersonal, headline: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={tempPersonal.email} onChange={(e) => setTempPersonal({ ...tempPersonal, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" value={tempPersonal.phone} onChange={(e) => setTempPersonal({ ...tempPersonal, phone: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control type="text" value={tempPersonal.location} onChange={(e) => setTempPersonal({ ...tempPersonal, location: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPersonalModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSavePersonal}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Professional Summary Modal */}
      <Modal show={showSummaryModal} onHide={() => setShowSummaryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Professional Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Summary</Form.Label>
              <Form.Control as="textarea" rows={5} value={tempSummary} onChange={(e) => setTempSummary(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSummaryModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSaveSummary}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Skills Modal */}
      <Modal show={showSkillsModal} onHide={() => setShowSkillsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Skills</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Skills (comma separated)</Form.Label>
              <Form.Control type="text" value={tempSkills} onChange={(e) => setTempSkills(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSkillsModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSaveSkills}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Experience Modal */}
      <Modal show={showExperienceModal} onHide={() => setShowExperienceModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Work Experience</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tempExperience.map((exp, index) => (
            <Card key={exp.id} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6>Experience {index + 1}</h6>
                  <Button variant="outline-danger" size="sm" onClick={() => deleteExperience(exp.id)}>
                    <FaTrash />
                  </Button>
                </div>
                <Form.Group className="mb-2">
                  <Form.Control type="text" placeholder="Job Title" value={exp.title} onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control type="text" placeholder="Company" value={exp.company} onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control type="text" placeholder="Duration (e.g., 2019 - 2021)" value={exp.duration} onChange={(e) => handleExperienceChange(exp.id, 'duration', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control as="textarea" rows={2} placeholder="Description" value={exp.description} onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)} />
                </Form.Group>
              </Card.Body>
            </Card>
          ))}
          <Button variant="outline-primary" className="w-100" onClick={addExperience}>
            <FaPlus /> Add More Experience
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExperienceModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSaveExperience}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Education Modal */}
      <Modal show={showEducationModal} onHide={() => setShowEducationModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Education</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tempEducation.map((edu, index) => (
            <Card key={edu.id} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6>Education {index + 1}</h6>
                  <Button variant="outline-danger" size="sm" onClick={() => deleteEducation(edu.id)}>
                    <FaTrash />
                  </Button>
                </div>
                <Form.Group className="mb-2">
                  <Form.Control type="text" placeholder="Degree" value={edu.degree} onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control type="text" placeholder="Institution" value={edu.institution} onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control type="text" placeholder="Duration (e.g., 2015 - 2019)" value={edu.duration} onChange={(e) => handleEducationChange(edu.id, 'duration', e.target.value)} />
                </Form.Group>
              </Card.Body>
            </Card>
          ))}
          <Button variant="outline-primary" className="w-100" onClick={addEducation}>
            <FaPlus /> Add More Education
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEducationModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSaveEducation}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Job Preferences Modal */}
      <Modal show={showPreferencesModal} onHide={() => setShowPreferencesModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Job Preferences</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Industry</Form.Label>
              <Form.Control type="text" value={tempPreferences.industry} onChange={(e) => setTempPreferences({ ...tempPreferences, industry: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control type="text" value={tempPreferences.role} onChange={(e) => setTempPreferences({ ...tempPreferences, role: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control type="text" value={tempPreferences.location} onChange={(e) => setTempPreferences({ ...tempPreferences, location: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Salary</Form.Label>
              <Form.Control type="text" value={tempPreferences.salary} onChange={(e) => setTempPreferences({ ...tempPreferences, salary: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreferencesModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSavePreferences}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserProfilePage;