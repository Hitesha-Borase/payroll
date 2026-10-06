// src/pages/JobSeeker/SubmitResume.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Form, Button, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import {
  FaFileUpload,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaTools,
  FaBriefcase,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaFilePdf,
  FaTrash,
  FaSave
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';

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

const SubmitResume = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    experience: '',
    resumeFile: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: windowWidth < 768 ? '10px 12px 80px 12px' : '0 15px 40px 15px',
  };

  const cardStyle = {
    backgroundColor: colors.white,
    border: `1px solid ${colors.lightGray}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '30px',
    transition: 'transform 0.3s ease',
  };

  const headerStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    padding: '12px 16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
  };

  const buttonStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: colors.primaryRed,
    border: `1px solid ${colors.primaryRed}`,
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  };

  const formGroupStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: colors.black,
    fontSize: '13px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${colors.lightGray}`,
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical',
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        resumeFile: file
      });
      setUploadedFileName(file.name);

      // Clear error for this field
      if (errors.resumeFile) {
        setErrors({
          ...errors,
          resumeFile: ''
        });
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData({
      ...formData,
      resumeFile: null
    });
    setUploadedFileName('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setShowError(false);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', `${formData.fullName} - Resume`);
      formDataToSend.append('resume_data', JSON.stringify({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        skills: formData.skills,
        experience: formData.experience,
      }));

      if (formData.resumeFile) {
        formDataToSend.append('file', formData.resumeFile);
      }

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Call API
      const response = await publicAPI.submitResume(formDataToSend);

      clearInterval(uploadInterval);
      setUploadProgress(100);

      if (response?.data?.success) {
        setIsSubmitting(false);
        setShowSuccess(true);
        toast.success(response?.data?.message || 'Resume submitted successfully!');

        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            skills: '',
            experience: '',
            resumeFile: null
          });
          setUploadedFileName('');
          setUploadProgress(0);
          setShowSuccess(false);
        }, 3000);
      } else {
        throw new Error(response?.data?.message || 'Failed to submit resume');
      }

    } catch (error) {
      setIsSubmitting(false);
      setShowError(true);
      setUploadProgress(0);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to submit resume');
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      ...formData,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('resumeDraft', JSON.stringify(draftData));
    toast.success('Draft saved successfully!');
  };

  // Load user profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await publicAPI.getProfile();
        if (response?.data?.success && response.data.data) {
          const profile = response.data.data;

          let experienceStr = '';
          if (Array.isArray(profile.experience)) {
            experienceStr = profile.experience.map(exp =>
              `${exp.title || 'Role'} at ${exp.company || 'Company'} (${exp.duration || 'Duration'})\n${exp.description || ''}`
            ).join('\n\n');
          } else {
            experienceStr = profile.experience || '';
          }

          setFormData({
            fullName: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            skills: profile.skills || '',
            experience: experienceStr,
            resumeFile: null
          });
        }
      } catch (err) {
        // If profile doesn't exist, use draft
        const savedDraft = localStorage.getItem('resumeDraft');
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          setFormData({
            fullName: draft.fullName || '',
            email: draft.email || '',
            phone: draft.phone || '',
            skills: draft.skills || '',
            experience: draft.experience || '',
            resumeFile: null
          });
        }
      }
    };
    loadProfile();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.skills || !formData.skills.trim()) {
      newErrors.skills = 'Skills are required';
    }

    if (!formData.experience || !formData.experience.trim()) {
      newErrors.experience = 'Experience is required';
    }

    if (!formData.resumeFile) {
      newErrors.resumeFile = 'Please select a PDF resume file to upload';
    } else if (formData.resumeFile instanceof File) {
      const fileName = formData.resumeFile.name || '';
      const isPdfExt = fileName.toLowerCase().endsWith('.pdf');
      const isPdfMime = formData.resumeFile.type === 'application/pdf' || formData.resumeFile.type === '';
      if (!isPdfExt && !isPdfMime) {
        newErrors.resumeFile = 'Only PDF files are allowed';
      } else if (formData.resumeFile.size > 5 * 1024 * 1024) {
        newErrors.resumeFile = 'File size must be less than 5MB';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  return (
    <div style={{ minHeight: '100vh' }}>


      <div style={containerStyle} className="py-4">
        {/* Success Alert */}
        {showSuccess && (
          <Alert variant="success" className="mb-4" style={{ fontSize: '13px' }}>
            <FaCheckCircle className="me-2" />
            Resume submitted successfully! We will review your application and get back to you soon.
          </Alert>
        )}

        {/* Error Alert */}
        {showError && (
          <Alert variant="danger" className="mb-4" style={{ fontSize: '13px' }}>
            <FaTimesCircle className="me-2" />
            Failed to submit resume. Please try again later.
          </Alert>
        )}

        <Card style={cardStyle}>
          <div style={headerStyle}>
            <FaFileUpload className="me-2" />
            Resume Information
          </div>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group style={formGroupStyle}>
                    <Form.Label style={labelStyle}>
                      <FaUser className="me-2" />
                      Full Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      isInvalid={!!errors.fullName}
                      style={inputStyle}
                    />
                    <Form.Control.Feedback type="invalid" style={{ fontSize: '12px' }}>
                      {errors.fullName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={formGroupStyle}>
                    <Form.Label style={labelStyle}>
                      <FaEnvelope className="me-2" />
                      Email *
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      isInvalid={!!errors.email}
                      style={inputStyle}
                    />
                    <Form.Control.Feedback type="invalid" style={{ fontSize: '12px' }}>
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group style={formGroupStyle}>
                    <Form.Label style={labelStyle}>
                      <FaPhone className="me-2" />
                      Phone *
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      isInvalid={!!errors.phone}
                      style={inputStyle}
                    />
                    <Form.Control.Feedback type="invalid" style={{ fontSize: '12px' }}>
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={formGroupStyle}>
                    <Form.Label style={labelStyle}>
                      <FaTools className="me-2" />
                      Skills *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="e.g., React, Node.js, Python, Java"
                      isInvalid={!!errors.skills}
                      style={inputStyle}
                    />
                    <Form.Control.Feedback type="invalid" style={{ fontSize: '12px' }}>
                      {errors.skills}
                    </Form.Control.Feedback>
                    <Form.Text style={{ fontSize: '11px', color: colors.darkGray }}>
                      Separate multiple skills with commas
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group style={formGroupStyle}>
                <Form.Label style={labelStyle}>
                  <FaBriefcase className="me-2" />
                  Experience *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Describe your work experience, projects, and achievements..."
                  isInvalid={!!errors.experience}
                  style={textareaStyle}
                />
                <Form.Control.Feedback type="invalid" style={{ fontSize: '12px' }}>
                  {errors.experience}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={formGroupStyle}>
                <Form.Label style={labelStyle}>
                  <FaFilePdf className="me-2" />
                  Upload Resume (PDF) *
                </Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    isInvalid={!!errors.resumeFile}
                    style={{ display: 'none' }}
                    id="resume-upload"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => document.getElementById('resume-upload').click()}
                    style={{
                      ...secondaryButtonStyle,
                      backgroundColor: colors.lightBg,
                      borderColor: colors.lightGray,
                      color: colors.darkGray
                    }}
                  >
                    <FaFileUpload className="me-2" />
                    Choose File
                  </Button>
                  {uploadedFileName && (
                    <div className="d-flex align-items-center ms-3">
                      <FaFilePdf color={colors.primaryRed} className="me-2" />
                      <span style={{ fontSize: '13px', color: colors.black }}>{uploadedFileName}</span>
                      <Button
                        variant="link"
                        onClick={handleRemoveFile}
                        style={{ color: colors.primaryRed, padding: '0 0 0 10px' }}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  )}
                </div>
                <Form.Control.Feedback type="invalid" style={{ fontSize: '12px', display: 'block' }}>
                  {errors.resumeFile}
                </Form.Control.Feedback>
                <Form.Text style={{ fontSize: '11px', color: colors.darkGray }}>
                  Maximum file size: 5MB. Only PDF files are allowed.
                </Form.Text>
              </Form.Group>

              {isSubmitting && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '12px', color: colors.darkGray }}>Uploading...</span>
                    <span style={{ fontSize: '12px', color: colors.darkGray }}>{uploadProgress}%</span>
                  </div>
                  <ProgressBar
                    now={uploadProgress}
                    style={{ height: '8px' }}
                    variant="danger"
                  />
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 justify-content-between pt-3 border-top mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate(-1)}
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  style={{ ...buttonStyle, padding: '8px 24px', flex: windowWidth < 500 ? 1 : 'none' }}
                  disabled={isSubmitting}
                  onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = colors.darkRed)}
                  onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = colors.primaryRed)}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Resume'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SubmitResume;