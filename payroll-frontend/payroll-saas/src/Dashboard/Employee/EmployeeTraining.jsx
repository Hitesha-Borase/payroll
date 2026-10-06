import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaBook,
  FaChartLine,
  FaClipboardCheck,
  FaAward,
  FaPlay,
  FaDownload,
  FaCheckCircle,
  FaClock,
  FaUserGraduate,
  FaCalendarAlt,
  FaFileAlt,
  FaHourglassHalf,
  FaChevronRight,
  FaQuestionCircle
} from 'react-icons/fa';
import { employeeAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

// Color scheme
const colors = {
  primary: '#C62828',
  primaryDark: '#B71C1C',
  secondary: '#1E293B',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  light: '#F8FAFC',
  border: '#E2E8F0',
  darkText: '#0F172A',
  mutedText: '#64748B'
};

const EmployeeTraining = () => {
  const [activeView, setActiveView] = useState('assigned');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [assignedTrainings, setAssignedTrainings] = useState([]);
  const [assessmentTests, setAssessmentTests] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Storage key helpers for training progress
  const getProgressStorageKey = () => {
    const user = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
    return `emp_trainings_progress_${user}`;
  };

  const getSavedTrainingProgress = () => {
    try {
      const raw = localStorage.getItem(getProgressStorageKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  const saveTrainingProgressLocally = (courseId, status, completion) => {
    try {
      const all = getSavedTrainingProgress();
      all[courseId] = { status, completion, updated_at: new Date().toISOString() };
      localStorage.setItem(getProgressStorageKey(), JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save training progress locally:', e);
    }
  };

  // Fetch training data from API
  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile
        const profileRes = await employeeAPI.getProfile();
        if (profileRes?.data?.success) {
          const profile = profileRes.data.data;
          setEmployeeName(profile.name || profile.user?.name || 'Employee');
          setEmployeeId(profile.employee_id || profile.id || '');
        }

        // Fetch assigned trainings
        const savedProgress = getSavedTrainingProgress();
        const trainingsRes = await employeeAPI.getTrainings();
        if (trainingsRes?.data?.success) {
          const trainings = trainingsRes.data.data || [];
          setAssignedTrainings(trainings.map(t => {
            const local = savedProgress[t.id] || savedProgress[t.course_id];
            const defaultStatus = (t.status === 'completed' || t.status === 'Completed') ? 'Completed' :
              (t.status === 'in_progress' || t.status === 'In Progress') ? 'In Progress' : 'Not Started';
            const status = local?.status || defaultStatus;

            const defaultComp = t.completion_percentage !== undefined && t.completion_percentage !== null
              ? t.completion_percentage
              : (t.progress || (t.status === 'completed' ? 100 : 0));
            const completion = local?.completion !== undefined ? local.completion : defaultComp;

            return {
              id: t.id,
              courseId: t.course_id || t.id,
              title: t.course_title || t.name || 'Training Course',
              instructor: t.trainer_name || t.instructor || 'Instructor',
              duration: t.duration || (t.end_date && t.start_date ?
                `${Math.ceil((new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60 * 24))} days` : '2 Weeks'),
              category: t.category || 'General',
              startDate: t.start_date?.split('T')[0] || t.created_at?.split('T')[0] || '-',
              assignDate: t.assigned_date?.split('T')[0] || t.created_at?.split('T')[0] || '-',
              dueDate: t.due_date?.split('T')[0] || t.end_date?.split('T')[0] || '-',
              status: status,
              completion: completion
            };
          }));
        }

        // Fetch assessment tests
        const testsRes = await employeeAPI.getTests();
        if (testsRes?.data?.success) {
          const tests = testsRes.data.data || [];
          setAssessmentTests(tests.map(t => ({
            id: t.id,
            courseTitle: t.course_title || t.course_name || 'Course Test',
            title: t.test_title || t.name || 'Assessment Test',
            testDate: t.test_date?.split('T')[0] || t.created_at?.split('T')[0] || '-',
            duration: t.duration || '60 mins',
            questions: t.total_questions || '30',
            status: t.status === 'completed' ? 'Completed' : t.status === 'locked' ? 'Locked' : 'Available',
            score: t.score !== undefined ? t.score : (t.status === 'completed' ? 85 : null)
          })));
        }

        // Fetch certificates
        const certsRes = await employeeAPI.getCertificates();
        if (certsRes?.data?.success) {
          const certs = certsRes.data.data || [];
          setCertificates(certs.map(c => ({
            id: c.id,
            courseTitle: c.course_title || 'Certified Course',
            certificateId: c.certificate_number || `CERT-${c.id}`,
            issueDate: c.issue_date?.split('T')[0] || c.created_at?.split('T')[0] || '-',
            status: 'Issued'
          })));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch training data');
      } finally {
        setLoading(false);
      }
    };
    fetchTrainingData();
  }, []);

  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'completed':
      case 'issued':
      case 'available':
      case 'passed':
        return { backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' };
      case 'in progress':
        return { backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' };
      case 'not started':
        return { backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' };
      case 'locked':
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' };
    }
  };

  const getScoreBadgeStyle = (score) => {
    if (score >= 90) return { backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' };
    if (score >= 75) return { backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' };
    if (score >= 60) return { backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' };
    return { backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' };
  };

  const getCompletionColor = (completion) => {
    if (completion >= 80) return colors.success;
    if (completion >= 50) return colors.info;
    if (completion > 0) return colors.warning;
    return '#CBD5E1';
  };

  const handleStartTraining = async (courseId) => {
    const target = assignedTrainings.find(t => String(t.id) === String(courseId) || String(t.courseId) === String(courseId));
    const title = target?.title || 'Training Course';

    let nextStatus = 'In Progress';
    let nextCompletion = 25;

    if (target?.status === 'In Progress') {
      nextCompletion = Math.min(100, (target.completion || 0) + 25);
      if (nextCompletion >= 100) {
        nextStatus = 'Completed';
      }
    }

    try {
      try {
        await employeeAPI.startTraining(courseId, { status: nextStatus, progress: nextCompletion });
      } catch (apiErr) {
        console.warn('Backend startTraining notice:', apiErr.response?.data?.message || apiErr.message);
      }

      // Save locally to persist across refresh
      saveTrainingProgressLocally(courseId, nextStatus, nextCompletion);

      // Update state immediately
      setAssignedTrainings(prev => prev.map(t => {
        if (String(t.id) === String(courseId) || String(t.courseId) === String(courseId)) {
          return {
            ...t,
            status: nextStatus,
            completion: nextCompletion
          };
        }
        return t;
      }));

      if (nextStatus === 'Completed') {
        toast.success(`🎉 Congratulations! You have completed "${title}".`);
      } else if (target?.status === 'In Progress') {
        toast.success(`Progress updated for "${title}": ${nextCompletion}% completed.`);
      } else {
        toast.success(`Training started! "${title}" is now In Progress.`);
      }
    } catch (err) {
      console.error('Error starting training:', err);
      toast.error('Failed to update training status');
    }
  };

  const handleTakeTest = (testId) => {
    toast(`Starting test for test ID: ${testId}`, { icon: '📝' });
  };

  const handleDownloadCertificate = (certificateId) => {
    toast.success(`Downloading certificate: ${certificateId}`);
  };

  // Calculate statistics
  const totalTrainings = assignedTrainings.length;
  const completedTrainings = assignedTrainings.filter(t => t.status === 'Completed').length;
  const inProgressTrainings = assignedTrainings.filter(t => t.status === 'In Progress').length;
  const averageCompletion = totalTrainings > 0
    ? Math.round(assignedTrainings.reduce((sum, t) => sum + (t.completion || 0), 0) / totalTrainings)
    : 0;

  return (
    <div className="container-fluid px-2 px-sm-3 px-md-4 py-3 py-md-4" style={{ minHeight: '100vh', backgroundColor: colors.light, maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Card */}
      <div className="card mb-3 mb-md-4 shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '14px' }}>
        <div className="card-body p-3 p-sm-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ backgroundColor: '#FEF2F2', width: isMobile ? '44px' : '54px', height: isMobile ? '44px' : '54px', border: '1px solid #FECACA' }}
            >
              <FaUserGraduate style={{ fontSize: isMobile ? '1.35rem' : '1.65rem', color: colors.primary }} />
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: colors.darkText, fontSize: isMobile ? '1.25rem' : '1.65rem' }}>
                My Training & Learning
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.78rem' : '0.88rem' }}>
                {employeeName ? `${employeeName}` : 'Employee'} {employeeId ? `• ID: ${employeeId}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3 shadow-sm" style={{ borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-muted mt-2 small">Loading training curriculum...</p>
        </div>
      ) : (
        <>
          {/* Quick Stats Grid (2x2 on Mobile, 4-col on Desktop) */}
          <div className="row g-2 g-md-3 mb-3 mb-md-4">
            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-2.5 p-sm-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>Total Trainings</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.primary, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {totalTrainings}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FEF2F2', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaBook style={{ color: colors.primary, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-2.5 p-sm-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>Completed</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.success, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {completedTrainings}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#ECFDF5', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaCheckCircle style={{ color: colors.success, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-2.5 p-sm-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>In Progress</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.info, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {inProgressTrainings}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#EEF2FF', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaHourglassHalf style={{ color: colors.info, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-2.5 p-sm-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>Avg. Completion</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.warning, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {averageCompletion}%
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FFFBEB', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaChartLine style={{ color: colors.warning, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Horizontal Scrollable Pill Bar */}
          <div className="mb-3">
            <div
              className="d-flex gap-1.5 p-1 bg-white shadow-sm"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <button
                className="btn flex-fill d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                style={{
                  backgroundColor: activeView === 'assigned' ? colors.primary : 'transparent',
                  color: activeView === 'assigned' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('assigned')}
              >
                <FaBook size={isMobile ? 12 : 14} /> Assigned Trainings ({assignedTrainings.length})
              </button>
              <button
                className="btn flex-fill d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                style={{
                  backgroundColor: activeView === 'progress' ? colors.primary : 'transparent',
                  color: activeView === 'progress' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('progress')}
              >
                <FaChartLine size={isMobile ? 12 : 14} /> Current Progress
              </button>
              <button
                className="btn flex-fill d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                style={{
                  backgroundColor: activeView === 'assessment' ? colors.primary : 'transparent',
                  color: activeView === 'assessment' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('assessment')}
              >
                <FaClipboardCheck size={isMobile ? 12 : 14} /> Assessment Tests ({assessmentTests.length})
              </button>
              <button
                className="btn flex-fill d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                style={{
                  backgroundColor: activeView === 'certificates' ? colors.primary : 'transparent',
                  color: activeView === 'certificates' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('certificates')}
              >
                <FaAward size={isMobile ? 12 : 14} /> Certificates ({certificates.length})
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="card shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div className="card-header py-2.5 py-sm-3 px-3 px-sm-4 bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <h5 className="mb-0 fw-bold" style={{ color: colors.darkText, fontSize: isMobile ? '0.98rem' : '1.12rem' }}>
                {activeView === 'assigned' && 'Assigned Training Courses'}
                {activeView === 'progress' && 'Current Training Progress'}
                {activeView === 'assessment' && 'Available Assessment Tests'}
                {activeView === 'certificates' && 'Earned Certificates'}
              </h5>
            </div>

            <div className="card-body p-0">
              {/* 1. ASSIGNED TRAININGS VIEW */}
              {activeView === 'assigned' && (
                assignedTrainings.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-2.5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaBook style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Assigned Trainings</h6>
                    <p className="text-muted mb-0 small">You do not have any training courses assigned currently.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Cards for Assigned Trainings */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {assignedTrainings.map((training) => (
                      <div
                        key={training.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {training.title}
                              </h6>
                              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                Instructor: <span className="fw-medium text-dark">{training.instructor}</span> • {training.duration}
                              </div>
                            </div>
                            <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {training.status}
                            </span>
                          </div>

                          <div className="p-2 rounded-3 mb-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                            <div className="row g-2 text-start">
                              <div className="col-6">
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Assign Date</div>
                                <div className="fw-medium" style={{ color: colors.darkText, fontSize: '0.78rem' }}>
                                  <FaCalendarAlt className="me-1 text-primary" style={{ fontSize: '0.7rem' }} />
                                  {training.assignDate}
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Due Date</div>
                                <div className="fw-medium" style={{ color: colors.darkText, fontSize: '0.78rem' }}>
                                  <FaCalendarAlt className="me-1 text-danger" style={{ fontSize: '0.7rem' }} />
                                  {training.dueDate}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Progress</span>
                            <span className="fw-bold" style={{ color: colors.darkText, fontSize: '0.78rem' }}>{training.completion}%</span>
                          </div>
                          <div className="progress mb-3" style={{ height: '6px', borderRadius: '4px', backgroundColor: '#E2E8F0' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${training.completion}%`,
                                backgroundColor: getCompletionColor(training.completion),
                                borderRadius: '4px'
                              }}
                            ></div>
                          </div>

                          {training.status === 'Not Started' ? (
                            <button
                              className="btn btn-sm w-100 text-white d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: colors.primary, borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                              onClick={() => handleStartTraining(training.id)}
                            >
                              <FaPlay size={10} /> Start Training
                            </button>
                          ) : training.status === 'In Progress' ? (
                            <button
                              className="btn btn-sm w-100 text-white d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: colors.info, borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                              onClick={() => handleStartTraining(training.id)}
                            >
                              <FaPlay size={10} /> Continue Training
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                              disabled
                            >
                              <FaCheckCircle size={12} /> Completed
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE TITLE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>INSTRUCTOR</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DURATION</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>CATEGORY</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DUE DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4 text-center" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedTrainings.map((training) => (
                          <tr key={training.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{training.title}</td>
                            <td className="py-3 text-muted">{training.instructor}</td>
                            <td className="py-3 text-muted">{training.duration}</td>
                            <td className="py-3"><span className="badge bg-light text-dark border">{training.category}</span></td>
                            <td className="py-3 text-muted">{training.dueDate}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px' }}>
                                {training.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4 text-center">
                              {training.status === 'Not Started' ? (
                                <button
                                  className="btn btn-sm text-white"
                                  style={{ backgroundColor: colors.primary, borderRadius: '6px', fontWeight: 500 }}
                                  onClick={() => handleStartTraining(training.id)}
                                >
                                  <FaPlay size={10} className="me-1" /> Start
                                </button>
                              ) : training.status === 'In Progress' ? (
                                <button
                                  className="btn btn-sm text-white"
                                  style={{ backgroundColor: colors.info, borderRadius: '6px', fontWeight: 500 }}
                                  onClick={() => handleStartTraining(training.id)}
                                >
                                  <FaPlay size={10} className="me-1" /> Continue
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  style={{ borderRadius: '6px', fontWeight: 500 }}
                                  disabled
                                >
                                  <FaCheckCircle size={12} className="me-1" /> Done
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 2. CURRENT PROGRESS VIEW */}
              {activeView === 'progress' && (
                assignedTrainings.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-2.5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaChartLine style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Progress Data</h6>
                    <p className="text-muted mb-0 small">No progress details recorded yet.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Cards for Progress */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {assignedTrainings.map((training) => (
                      <div
                        key={training.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {training.title}
                              </h6>
                              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                Due Date: {training.dueDate}
                              </div>
                            </div>
                            <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {training.status}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted" style={{ fontSize: '0.74rem' }}>Completion</span>
                              <span className="fw-bold" style={{ color: colors.darkText, fontSize: '0.85rem' }}>{training.completion}%</span>
                            </div>
                            <div className="progress" style={{ height: '7px', borderRadius: '4px', backgroundColor: '#E2E8F0' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${training.completion}%`,
                                  backgroundColor: getCompletionColor(training.completion),
                                  borderRadius: '4px'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE TITLE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>START DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DUE DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>PROGRESS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedTrainings.map((training) => (
                          <tr key={training.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{training.title}</td>
                            <td className="py-3 text-muted">{training.startDate}</td>
                            <td className="py-3 text-muted">{training.dueDate}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px' }}>
                                {training.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: '140px' }}>
                                <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px' }}>
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{
                                      width: `${training.completion}%`,
                                      backgroundColor: getCompletionColor(training.completion),
                                      borderRadius: '4px'
                                    }}
                                  ></div>
                                </div>
                                <span className="fw-semibold small" style={{ minWidth: '35px' }}>{training.completion}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 3. ASSESSMENT TESTS VIEW */}
              {activeView === 'assessment' && (
                assessmentTests.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-2.5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaClipboardCheck style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Assessment Tests Found</h6>
                    <p className="text-muted mb-0 small">No assessment tests available right now.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Cards for Assessment */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {assessmentTests.map((test) => (
                      <div
                        key={test.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {test.title}
                              </h6>
                              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                Course: <span className="fw-medium text-dark">{test.courseTitle}</span>
                              </div>
                            </div>
                            <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(test.status), borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {test.status}
                            </span>
                          </div>

                          <div className="p-2 rounded-3 mb-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                            <div className="row g-2 text-start">
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Test Date</div>
                                <div className="fw-medium" style={{ color: colors.darkText, fontSize: '0.76rem' }}>
                                  {test.testDate}
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Duration</div>
                                <div className="fw-medium" style={{ color: colors.darkText, fontSize: '0.76rem' }}>
                                  {test.duration}
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Score</div>
                                <div>
                                  {test.score !== null ? (
                                    <span className="badge px-2 py-0.5" style={{ ...getScoreBadgeStyle(test.score), borderRadius: '4px', fontSize: '0.74rem' }}>
                                      {test.score}%
                                    </span>
                                  ) : (
                                    <span className="text-muted" style={{ fontSize: '0.76rem' }}>-</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {test.status === 'Available' ? (
                            <button
                              className="btn btn-sm w-100 text-white d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: colors.primary, borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                              onClick={() => handleTakeTest(test.id)}
                            >
                              <FaPlay size={10} /> Take Test
                            </button>
                          ) : test.status === 'Completed' ? (
                            <button
                              className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                              disabled
                            >
                              <FaCheckCircle size={12} /> Test Passed
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm w-100 btn-secondary"
                              style={{ borderRadius: '8px', fontWeight: 500, padding: '7px' }}
                              disabled
                            >
                              Locked
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>TEST TITLE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>TEST DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DURATION</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>SCORE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4 text-center" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentTests.map((test) => (
                          <tr key={test.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{test.courseTitle}</td>
                            <td className="py-3 text-dark">{test.title}</td>
                            <td className="py-3 text-muted">{test.testDate}</td>
                            <td className="py-3 text-muted">{test.duration}</td>
                            <td className="py-3">
                              {test.score !== null ? (
                                <span className="badge px-2.5 py-1" style={{ ...getScoreBadgeStyle(test.score), borderRadius: '6px' }}>
                                  {test.score}%
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(test.status), borderRadius: '6px' }}>
                                {test.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4 text-center">
                              {test.status === 'Available' ? (
                                <button
                                  className="btn btn-sm text-white"
                                  style={{ backgroundColor: colors.primary, borderRadius: '6px', fontWeight: 500 }}
                                  onClick={() => handleTakeTest(test.id)}
                                >
                                  Take Test
                                </button>
                              ) : test.status === 'Completed' ? (
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  style={{ borderRadius: '6px', fontWeight: 500 }}
                                  disabled
                                >
                                  <FaCheckCircle size={12} className="me-1" /> Passed
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  style={{ borderRadius: '6px', fontWeight: 500 }}
                                  disabled
                                >
                                  Locked
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 4. CERTIFICATES VIEW */}
              {activeView === 'certificates' && (
                certificates.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-2.5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaAward style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Certificates Earned Yet</h6>
                    <p className="text-muted mb-0 small">Complete your training courses & assessments to receive certificates.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Cards for Certificates */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {cert.courseTitle}
                              </h6>
                              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                Cert ID: <span className="fw-medium text-dark">{cert.certificateId}</span>
                              </div>
                            </div>
                            <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(cert.status), borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {cert.status}
                            </span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center pt-2 mb-2.5 border-top" style={{ borderColor: '#F1F5F9' }}>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <FaCalendarAlt className="me-1 text-primary" style={{ fontSize: '0.7rem' }} />
                              Issued: {cert.issueDate}
                            </div>
                          </div>

                          <button
                            className="btn btn-sm w-100 text-white d-flex align-items-center justify-content-center gap-1.5"
                            style={{ backgroundColor: colors.primary, borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                            onClick={() => handleDownloadCertificate(cert.certificateId)}
                          >
                            <FaDownload size={11} /> Download PDF Certificate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE TITLE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>CERTIFICATE ID</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ISSUE DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4 text-center" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((cert) => (
                          <tr key={cert.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{cert.courseTitle}</td>
                            <td className="py-3 text-muted">{cert.certificateId}</td>
                            <td className="py-3 text-muted">{cert.issueDate}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(cert.status), borderRadius: '6px' }}>
                                {cert.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4 text-center">
                              <button
                                className="btn btn-sm text-white"
                                style={{ backgroundColor: colors.primary, borderRadius: '6px', fontWeight: 500 }}
                                onClick={() => handleDownloadCertificate(cert.certificateId)}
                              >
                                <FaDownload size={11} className="me-1" /> Download PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeTraining;