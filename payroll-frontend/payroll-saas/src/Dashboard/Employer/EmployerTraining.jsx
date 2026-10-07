import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaUserGraduate,
  FaChartBar,
  FaClipboardCheck,
  FaPlus,
  FaBook,
  FaUserCheck,
  FaCheckCircle,
  FaSearch,
  FaCalendarAlt,
  FaTimes,
  FaBuilding,
  FaUser
} from 'react-icons/fa';
import { employerAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';

// Color scheme
const colors = {
  primary: '#C62828',
  primaryDark: '#B71C1C',
  secondary: '#1E293B',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
  light: '#F8FAFC',
  border: '#E2E8F0',
  darkText: '#0F172A',
  mutedText: '#64748B'
};

const EmployerTraining = () => {
  const [activeView, setActiveView] = useState('assign');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [employees, setEmployees] = useState([]);
  const [trainingCourses, setTrainingCourses] = useState([]);
  const [assignedTrainings, setAssignedTrainings] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state for assigning training
  const [assignForm, setAssignForm] = useState({
    courseId: '',
    employeeId: '',
    dueDate: ''
  });

  // Form state for creating training
  const [createTrainingForm, setCreateTrainingForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    instructor: '',
    category: 'Technical'
  });

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString).split('T')[0];
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Fetch data on mount & listen to storage sync events
  useEffect(() => {
    fetchData();

    const handleStorageChange = (e) => {
      if (!e.key || e.key.includes('training') || e.key.includes('test') || e.key.includes('payroll')) {
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to read synchronized employee progress from localStorage/sessionStorage
  const getSyncedTrainingInfo = (assignment, training) => {
    try {
      const empName = String(assignment.employee?.user?.name || assignment.employee?.name || assignment.employeeName || '').toLowerCase().trim();
      const courseTitle = String(training?.title || assignment.courseTitle || '').toLowerCase().trim();
      const empId = String(assignment.employee_id || assignment.employeeId || '');
      const courseId = String(training?.id || assignment.courseId || '');

      // 1. Check payroll_training_sync across localStorage and sessionStorage
      const syncRaw = localStorage.getItem('payroll_training_sync') || sessionStorage.getItem('payroll_training_sync');
      if (syncRaw) {
        const syncMap = JSON.parse(syncRaw);
        const candidates = [
          syncMap[`${empId}_${courseId}`],
          syncMap[`${empName}_${courseTitle}`],
          syncMap[`${empName}_${courseId}`],
          syncMap[`${empId}_${courseTitle}`],
          syncMap[`course_${courseId}`],
          syncMap[`title_${courseTitle}`],
          syncMap[courseId],
          syncMap[courseTitle]
        ];
        for (const c of candidates) {
          if (c && (c.status === 'Completed' || c.completion === 100)) return c;
        }

        for (const item of Object.values(syncMap)) {
          if (!item || typeof item !== 'object') continue;
          const iTitle = String(item.courseTitle || item.courseId || '').toLowerCase().trim();
          const iName = String(item.employeeName || item.employeeId || '').toLowerCase().trim();
          const iEmpId = String(item.employeeId || '').trim();
          const iCourseId = String(item.courseId || '').trim();

          const courseMatches = (courseId && iCourseId === courseId) ||
            (courseTitle && iTitle && (courseTitle === iTitle || courseTitle.includes(iTitle) || iTitle.includes(courseTitle)));

          const empMatches = (empId && iEmpId === empId) ||
            (empName && iName && (empName === iName || empName.includes(iName) || iName.includes(empName)));

          if (courseMatches && empMatches) {
            return item;
          }
        }
      }

      // 2. Scan all emp_trainings_progress_* keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('emp_trainings_progress_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const prog = JSON.parse(raw);
            for (const [key, val] of Object.entries(prog)) {
              if (val && (val.status === 'Completed' || val.completion === 100)) {
                const valTitle = String(val.courseTitle || '').toLowerCase().trim();
                const keyMatches = String(key) === courseId;
                const titleMatches = courseTitle && valTitle && (courseTitle === valTitle || courseTitle.includes(valTitle) || valTitle.includes(courseTitle));
                if (keyMatches || titleMatches) {
                  return val;
                }
              }
            }
          }
        }
      }

      // 3. Scan all emp_tests_results_* keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('emp_tests_results_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const tests = JSON.parse(raw);
            for (const [key, val] of Object.entries(tests)) {
              if (val && (val.status === 'Completed' || (val.score && val.score >= 60))) {
                const valTitle = String(val.courseTitle || '').toLowerCase().trim();
                const keyMatches = String(key) === courseId;
                const titleMatches = courseTitle && valTitle && (courseTitle === valTitle || courseTitle.includes(valTitle) || valTitle.includes(courseTitle));
                if (keyMatches || titleMatches) {
                  return { status: 'Completed', completion: 100, score: val.score };
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse sync progress:', e);
    }
    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees and trainings in parallel
      const [employeesRes, trainingsRes] = await Promise.all([
        employerAPI.getMyEmployees(),
        employerAPI.getAllTrainings()
      ]);

      if (employeesRes?.data?.success) {
        setEmployees(employeesRes.data.data || []);
      }

      if (trainingsRes?.data?.success) {
        const trainings = trainingsRes.data.data || [];
        setTrainingCourses(trainings.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || 'No description provided.',
          instructor: t.trainer_name || t.instructor || 'Not assigned',
          start_date: t.start_date,
          end_date: t.end_date,
          duration: t.duration || (t.end_date && t.start_date ?
            `${Math.ceil((new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60 * 24))} days` : 'N/A'),
          category: t.category || 'Technical',
          assignedCount: (t.assignments || []).length
        })));

        // Extract assigned trainings from training assignments
        const assignments = [];
        trainings.forEach(training => {
          if (training.assignments && training.assignments.length > 0) {
            training.assignments.forEach(assignment => {
              const empName = assignment.employee?.user?.name || assignment.employee?.name || 'Employee';
              const synced = getSyncedTrainingInfo(assignment, training);

              const isCompleted = synced?.status === 'Completed' || synced?.completion === 100 ||
                String(assignment.status || '').toLowerCase() === 'completed' ||
                Number(assignment.completion_percentage) >= 100 ||
                Number(assignment.score) >= 60 ||
                Number(assignment.test_score) >= 60;

              const finalStatus = isCompleted ? 'Completed' :
                (synced?.status || (assignment.status === 'in_progress' || assignment.status === 'In Progress' ? 'In Progress' :
                 (assignment.status === 'assigned' || assignment.status === 'Assigned' ? 'Assigned' : 'Not Started')));

              const finalCompletion = isCompleted ? 100 :
                (synced?.completion !== undefined ? synced.completion :
                 (assignment.completion_percentage !== undefined && assignment.completion_percentage !== null
                  ? assignment.completion_percentage : 0));

              assignments.push({
                id: assignment.id,
                courseId: training.id,
                courseTitle: training.title,
                employeeId: assignment.employee_id,
                employeeName: empName,
                assignDate: assignment.assigned_date || assignment.created_at || training.start_date,
                dueDate: assignment.due_date || training.due_date || training.end_date,
                status: finalStatus,
                completion: finalCompletion,
                score: synced?.score || assignment.score || assignment.test_score || assignment.assessment_score || (isCompleted ? 100 : null)
              });
            });
          }
        });
        setAssignedTrainings(assignments);

        // Generate assessment results from completed trainings
        const results = assignments
          .filter(a => a.status === 'Completed' || a.completion === 100)
          .map(a => ({
            id: a.id,
            courseId: a.courseId,
            courseTitle: a.courseTitle,
            employeeId: a.employeeId,
            employeeName: a.employeeName,
            assessmentDate: a.dueDate,
            score: a.score || a.assessment_score || 90,
            status: 'Passed'
          }));
        setAssessmentResults(results);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTraining = async (e) => {
    e.preventDefault();
    if (!assignForm.courseId || !assignForm.employeeId || !assignForm.dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await employerAPI.assignTrainingToEmployees(assignForm.courseId, {
        employee_ids: [parseInt(assignForm.employeeId)],
        due_date: assignForm.dueDate
      });

      if (response?.data?.success) {
        setSuccessMessage('Training assigned successfully!');
        setShowAssignModal(false);
        setAssignForm({ courseId: '', employeeId: '', dueDate: '' });
        fetchData();
      } else {
        setError(response?.data?.message || 'Failed to assign training.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign training.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTraining = async (e) => {
    e.preventDefault();
    if (!createTrainingForm.title || !createTrainingForm.start_date || !createTrainingForm.end_date) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await employerAPI.createTraining({
        title: createTrainingForm.title,
        description: createTrainingForm.description,
        start_date: createTrainingForm.start_date,
        end_date: createTrainingForm.end_date,
        instructor: createTrainingForm.instructor,
        category: createTrainingForm.category
      });

      if (response?.data?.success) {
        setSuccessMessage('Training course created successfully!');
        setCreateTrainingForm({
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          instructor: '',
          category: 'Technical'
        });
        setShowCreateModal(false);
        setActiveView('courses');
        fetchData();
      } else {
        setError(response?.data?.message || 'Failed to create training.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create training.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = (courseId) => {
    setAssignForm({
      courseId: courseId,
      employeeId: '',
      dueDate: ''
    });
    setShowAssignModal(true);
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'completed':
      case 'passed':
        return { backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' };
      case 'in progress':
        return { backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' };
      case 'assigned':
      case 'not started':
        return { backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' };
      case 'failed':
        return { backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' };
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

  // Filter data based on search term
  const filteredCourses = trainingCourses.filter(course => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (course.title && course.title.toLowerCase().includes(term)) ||
      (course.instructor && course.instructor.toLowerCase().includes(term)) ||
      (course.category && course.category.toLowerCase().includes(term)) ||
      (course.description && course.description.toLowerCase().includes(term))
    );
  });

  const filteredAssignedTrainings = assignedTrainings.filter(training => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      training.employeeName.toLowerCase().includes(term) ||
      training.courseTitle.toLowerCase().includes(term) ||
      training.status.toLowerCase().includes(term)
    );
  });

  const filteredAssessmentResults = assessmentResults.filter(result => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      result.employeeName.toLowerCase().includes(term) ||
      result.courseTitle.toLowerCase().includes(term) ||
      result.status.toLowerCase().includes(term)
    );
  });

  // Calculate statistics
  const totalEmployees = employees.length;
  const totalCourses = trainingCourses.length;
  const totalAssignments = assignedTrainings.length;
  const completedAssignments = assignedTrainings.filter(t => t.status === 'Completed' || t.completion === 100).length;
  const averageCompletion = totalAssignments > 0
    ? Math.round(assignedTrainings.reduce((sum, t) => sum + (t.completion || 0), 0) / totalAssignments)
    : 0;

  return (
    <div className="container-fluid px-2 px-sm-3 px-md-4 py-3 py-md-4" style={{ minHeight: '100vh', backgroundColor: colors.light, maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Quick Actions */}
      <div className="card mb-3 mb-md-4 shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '14px' }}>
        <div className="card-body p-3 p-sm-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#FEF2F2', width: isMobile ? '44px' : '54px', height: isMobile ? '44px' : '54px', border: '1px solid #FECACA' }}
              >
                <FaUserGraduate style={{ fontSize: isMobile ? '1.35rem' : '1.65rem', color: colors.primary }} />
              </div>
              <div>
                <h2 className="fw-bold mb-0" style={{ color: colors.darkText, fontSize: isMobile ? '1.2rem' : '1.6rem' }}>
                  Training Management
                </h2>
                <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.78rem' : '0.875rem' }}>
                  Manage and track employee training programs and performance
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 w-100 w-md-auto">
              <button
                className="btn text-white d-flex align-items-center justify-content-center gap-2 flex-fill flex-md-grow-0"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: '10px',
                  fontWeight: 600,
                  padding: isMobile ? '8px 12px' : '10px 18px',
                  fontSize: isMobile ? '0.82rem' : '0.9rem',
                  boxShadow: '0 2px 4px rgba(198, 40, 40, 0.2)'
                }}
                onClick={() => setShowAssignModal(true)}
              >
                <FaPlus size={12} /> Assign Training
              </button>
              <button
                className="btn text-white d-flex align-items-center justify-content-center gap-2 flex-fill flex-md-grow-0"
                style={{
                  backgroundColor: colors.secondary,
                  borderRadius: '10px',
                  fontWeight: 600,
                  padding: isMobile ? '8px 12px' : '10px 18px',
                  fontSize: isMobile ? '0.82rem' : '0.9rem'
                }}
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus size={12} /> Create Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-muted mt-2 small">Loading training data...</p>
        </div>
      )}

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3 shadow-sm" style={{ borderRadius: '10px' }}>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible className="mb-3 shadow-sm" style={{ borderRadius: '10px' }}>{successMessage}</Alert>}

      {!loading && (
        <>
          {/* Quick Stats Grid */}
          <div className="row g-2 g-md-3 mb-3 mb-md-4">
            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-2.5 p-sm-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>Employees</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.primary, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {totalEmployees}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FEF2F2', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaUserCheck style={{ color: colors.primary, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div
                className="card shadow-sm h-100"
                style={{ border: `1px solid ${activeView === 'courses' ? colors.primary : colors.border}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveView('courses')}
                title="Click to view all courses"
              >
                <div className="card-body p-2.5 p-sm-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>Courses</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.info, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {totalCourses}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#EEF2FF', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaBook style={{ color: colors.info, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
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
                        {completedAssignments}
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
                      <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500 }}>Avg. Completion</p>
                      <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.warning, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                        {averageCompletion}%
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FFFBEB', width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px' }}
                    >
                      <FaChartBar style={{ color: colors.warning, fontSize: isMobile ? '0.9rem' : '1.15rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Clean Horizontal Scrollable Segmented Bar on Mobile */}
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
                  backgroundColor: activeView === 'courses' ? colors.primary : 'transparent',
                  color: activeView === 'courses' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('courses')}
              >
                <FaBook size={isMobile ? 12 : 14} /> Course Catalog ({trainingCourses.length})
              </button>
              <button
                className="btn flex-fill d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                style={{
                  backgroundColor: activeView === 'assign' ? colors.primary : 'transparent',
                  color: activeView === 'assign' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('assign')}
              >
                <FaUserCheck size={isMobile ? 12 : 14} /> Assigned Trainings ({assignedTrainings.length})
              </button>
              <button
                className="btn flex-fill d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                style={{
                  backgroundColor: activeView === 'completion' ? colors.primary : 'transparent',
                  color: activeView === 'completion' ? '#ffffff' : colors.mutedText,
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.78rem' : '0.88rem',
                  padding: isMobile ? '7px 12px' : '8px 16px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveView('completion')}
              >
                <FaChartBar size={isMobile ? 12 : 14} /> Completion Tracking
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
                <FaClipboardCheck size={isMobile ? 12 : 14} /> Assessment Results
              </button>
            </div>
          </div>

          {/* Tab Views Content */}
          <div className="card shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            {/* View Header with Search */}
            <div className="card-header py-2.5 py-sm-3 px-3 px-sm-4 bg-white" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 fw-bold" style={{ color: colors.darkText, fontSize: isMobile ? '0.98rem' : '1.12rem' }}>
                    {activeView === 'courses' && `Course Catalog (${filteredCourses.length})`}
                    {activeView === 'assign' && `Assigned Trainings (${filteredAssignedTrainings.length})`}
                    {activeView === 'completion' && `Completion Tracking (${filteredAssignedTrainings.length})`}
                    {activeView === 'assessment' && `Assessment Results (${filteredAssessmentResults.length})`}
                  </h5>
                </div>
                <div className="d-flex align-items-center" style={{ width: isMobile ? '100%' : '260px' }}>
                  <div className="input-group">
                    <span className="input-group-text py-1.5 px-2.5" style={{ backgroundColor: colors.light, border: `1px solid ${colors.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                      <FaSearch style={{ color: colors.mutedText, fontSize: '0.8rem' }} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search courses, employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderLeft: 'none',
                        borderRadius: searchTerm ? '0' : '0 8px 8px 0',
                        fontSize: isMobile ? '0.82rem' : '0.88rem',
                        padding: isMobile ? '6px 10px' : '8px 12px'
                      }}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary py-1 px-2.5"
                        type="button"
                        onClick={() => setSearchTerm('')}
                        style={{ border: `1px solid ${colors.border}`, borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                      >
                        <FaTimes size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* View Body */}
            <div className="card-body p-0">
              {/* 0. COURSES CATALOG VIEW */}
              {activeView === 'courses' && (
                filteredCourses.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaBook style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Courses Found</h6>
                    <p className="text-muted mb-3 small">
                      {searchTerm ? 'No courses match your search criteria.' : 'Create your first training course to get started.'}
                    </p>
                    <button
                      className="btn text-white btn-sm px-3 py-1.5"
                      style={{ backgroundColor: colors.primary, borderRadius: '8px', fontWeight: 600 }}
                      onClick={() => setShowCreateModal(true)}
                    >
                      <FaPlus size={11} className="me-1" /> Create Course
                    </button>
                  </div>
                ) : (
                  <div className="p-3 p-sm-4">
                    <div className="row g-3">
                      {filteredCourses.map((course) => (
                        <div key={course.id} className="col-12 col-md-6 col-lg-4">
                          <div
                            className="card h-100 shadow-sm border-0"
                            style={{
                              borderRadius: '14px',
                              backgroundColor: '#ffffff',
                              border: `1px solid ${colors.border}`,
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                          >
                            <div className="card-body p-3.5 d-flex flex-column justify-content-between">
                              <div>
                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                  <span
                                    className="badge px-2.5 py-1"
                                    style={{
                                      backgroundColor: '#EEF2FF',
                                      color: '#4F46E5',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    {course.category || 'General'}
                                  </span>
                                  <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                    {course.duration}
                                  </span>
                                </div>

                                <h6 className="fw-bold mb-1.5 text-dark" style={{ fontSize: '1rem', lineHeight: '1.4' }}>
                                  {course.title}
                                </h6>

                                <p className="text-muted small mb-3" style={{ fontSize: '0.8rem', minHeight: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {course.description}
                                </p>

                                <div className="p-2.5 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                                  <div className="d-flex align-items-center gap-1.5 mb-1 text-muted" style={{ fontSize: '0.78rem' }}>
                                    <FaUser style={{ color: colors.primary, fontSize: '0.72rem' }} />
                                    <span>Instructor:</span>
                                    <strong className="text-dark">{course.instructor}</strong>
                                  </div>
                                  <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.78rem' }}>
                                    <FaCalendarAlt style={{ color: colors.info, fontSize: '0.72rem' }} />
                                    <span>Schedule:</span>
                                    <span className="text-dark">{formatDate(course.start_date)} - {formatDate(course.end_date)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                  <strong>{course.assignedCount || 0}</strong> assigned
                                </span>
                                <button
                                  className="btn btn-sm text-white d-flex align-items-center gap-1 px-3 py-1.5"
                                  style={{
                                    backgroundColor: colors.primary,
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.8rem'
                                  }}
                                  onClick={() => handleQuickAssign(course.id)}
                                >
                                  <FaPlus size={10} /> Assign
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* 1. ASSIGNED TRAININGS VIEW */}
              {activeView === 'assign' && (
                filteredAssignedTrainings.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaBook style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Assigned Trainings Found</h6>
                    <p className="text-muted mb-0 small">
                      {searchTerm ? 'No assignments match your search.' : 'Click "Assign Training" to assign a course to an employee.'}
                    </p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View for Assigned Trainings */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {filteredAssignedTrainings.map((training) => (
                      <div
                        key={training.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3 pb-2.5">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {training.courseTitle}
                              </h6>
                              <div className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
                                <FaUser style={{ color: colors.primary, fontSize: '0.75rem' }} />
                                <span className="fw-medium text-dark">{training.employeeName}</span>
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
                                  {formatDate(training.assignDate)}
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Due Date</div>
                                <div className="fw-medium" style={{ color: colors.darkText, fontSize: '0.78rem' }}>
                                  <FaCalendarAlt className="me-1 text-danger" style={{ fontSize: '0.7rem' }} />
                                  {formatDate(training.dueDate)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Progress</span>
                              <span className="fw-bold" style={{ color: colors.darkText, fontSize: '0.78rem' }}>{training.completion}%</span>
                            </div>
                            <div className="progress" style={{ height: '6px', borderRadius: '4px', backgroundColor: '#E2E8F0' }}>
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
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>EMPLOYEE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ASSIGN DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DUE DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COMPLETION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignedTrainings.map((training) => (
                          <tr key={training.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{training.employeeName}</td>
                            <td className="py-3 text-dark">{training.courseTitle}</td>
                            <td className="py-3 text-muted">{formatDate(training.assignDate)}</td>
                            <td className="py-3 text-muted">{formatDate(training.dueDate)}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px' }}>
                                {training.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: '130px' }}>
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

              {/* 2. COMPLETION TRACKING VIEW */}
              {activeView === 'completion' && (
                filteredAssignedTrainings.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaChartBar style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Completion Data Found</h6>
                    <p className="text-muted mb-0 small">No training completion data recorded yet.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View for Completion */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {filteredAssignedTrainings.map((training) => (
                      <div
                        key={training.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3 pb-2.5">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {training.courseTitle}
                              </h6>
                              <div className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
                                <FaUser style={{ color: colors.primary, fontSize: '0.75rem' }} />
                                <span className="fw-medium text-dark">{training.employeeName}</span>
                              </div>
                            </div>
                            <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {training.status}
                            </span>
                          </div>

                          <div className="p-2 rounded-3 mb-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Completion Rate</span>
                              <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{training.completion}%</span>
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

                          <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                            <span>Assigned: {formatDate(training.assignDate)}</span>
                            <span>Due: {formatDate(training.dueDate)}</span>
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
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>EMPLOYEE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ASSIGN DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DUE DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>PROGRESS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignedTrainings.map((training) => (
                          <tr key={training.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{training.employeeName}</td>
                            <td className="py-3 text-dark">{training.courseTitle}</td>
                            <td className="py-3 text-muted">{formatDate(training.assignDate)}</td>
                            <td className="py-3 text-muted">{formatDate(training.dueDate)}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(training.status), borderRadius: '6px' }}>
                                {training.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: '140px' }}>
                                <div className="progress flex-grow-1" style={{ height: '10px', borderRadius: '5px' }}>
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{
                                      width: `${training.completion}%`,
                                      backgroundColor: getCompletionColor(training.completion),
                                      borderRadius: '5px'
                                    }}
                                  ></div>
                                </div>
                                <span className="fw-bold small" style={{ minWidth: '38px' }}>{training.completion}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* 3. ASSESSMENT RESULTS VIEW */}
              {activeView === 'assessment' && (
                filteredAssessmentResults.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaClipboardCheck style={{ fontSize: '20px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.95rem' }}>No Assessment Results Found</h6>
                    <p className="text-muted mb-0 small">Assessment scores will be listed once completed.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View for Assessment */
                  <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
                    {filteredAssessmentResults.map((result) => (
                      <div
                        key={result.id}
                        className="card shadow-sm border-0"
                        style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}
                      >
                        <div className="p-3 pb-2.5">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: '0.92rem' }}>
                                {result.courseTitle}
                              </h6>
                              <div className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
                                <FaUser style={{ color: colors.primary, fontSize: '0.75rem' }} />
                                <span className="fw-medium text-dark">{result.employeeName}</span>
                              </div>
                            </div>
                            <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(result.status), borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {result.status}
                            </span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <FaCalendarAlt className="me-1 text-primary" style={{ fontSize: '0.7rem' }} />
                              {formatDate(result.assessmentDate)}
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Score:</span>
                              <span className="badge px-2.5 py-1 fw-bold" style={{ ...getScoreBadgeStyle(result.score), fontSize: '0.82rem', borderRadius: '6px' }}>
                                {result.score}%
                              </span>
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
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>EMPLOYEE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>COURSE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>ASSESSMENT DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>SCORE</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssessmentResults.map((result) => (
                          <tr key={result.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{result.employeeName}</td>
                            <td className="py-3 text-dark">{result.courseTitle}</td>
                            <td className="py-3 text-muted">{formatDate(result.assessmentDate)}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getScoreBadgeStyle(result.score), borderRadius: '6px' }}>
                                {result.score}%
                              </span>
                            </td>
                            <td className="py-3 pe-4">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(result.status), borderRadius: '6px' }}>
                                {result.status}
                              </span>
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

      {/* Assign Training Modal */}
      {showAssignModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: isMobile ? '94%' : '520px', margin: '1.75rem auto' }}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div className="modal-header py-3 px-4" style={{ backgroundColor: colors.light, borderBottom: `1px solid ${colors.border}` }}>
                <h5 className="modal-title fw-bold mb-0" style={{ color: colors.darkText, fontSize: '1.15rem' }}>
                  Assign Training to Employee
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <form onSubmit={handleAssignTraining}>
                <div className="modal-body p-3 p-sm-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Select Employee</label>
                    <select
                      className="form-select"
                      value={assignForm.employeeId}
                      onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                      required
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.user?.name || employee.name || 'Unknown'} {employee.designation ? `(${employee.designation})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Select Course</label>
                    <select
                      className="form-select"
                      value={assignForm.courseId}
                      onChange={(e) => setAssignForm({ ...assignForm, courseId: e.target.value })}
                      required
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    >
                      <option value="">Select Course</option>
                      {trainingCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title} - {course.duration}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={assignForm.dueDate}
                      onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                      required
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
                <div className="modal-footer py-2.5 px-4" style={{ backgroundColor: colors.light, borderTop: `1px solid ${colors.border}` }}>
                  <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px', padding: '8px 16px' }} onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn text-white fw-semibold" style={{ backgroundColor: colors.primary, borderRadius: '8px', padding: '8px 18px' }} disabled={loading}>
                    {loading ? 'Assigning...' : 'Assign Training'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Training Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: isMobile ? '94%' : '560px', margin: '1.75rem auto' }}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div className="modal-header py-3 px-4" style={{ backgroundColor: colors.light, borderBottom: `1px solid ${colors.border}` }}>
                <h5 className="modal-title fw-bold mb-0" style={{ color: colors.darkText, fontSize: '1.15rem' }}>
                  Create New Training Course
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTraining}>
                <div className="modal-body p-3 p-sm-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Course Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTrainingForm.title}
                      onChange={(e) => setCreateTrainingForm({ ...createTrainingForm, title: e.target.value })}
                      placeholder="e.g. Cybersecurity Essentials"
                      required
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Description</label>
                    <textarea
                      className="form-control"
                      value={createTrainingForm.description}
                      onChange={(e) => setCreateTrainingForm({ ...createTrainingForm, description: e.target.value })}
                      placeholder="Enter course description"
                      rows="3"
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Instructor</label>
                      <input
                        type="text"
                        className="form-control"
                        value={createTrainingForm.instructor}
                        onChange={(e) => setCreateTrainingForm({ ...createTrainingForm, instructor: e.target.value })}
                        placeholder="Instructor Name"
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Category</label>
                      <select
                        className="form-select"
                        value={createTrainingForm.category}
                        onChange={(e) => setCreateTrainingForm({ ...createTrainingForm, category: e.target.value })}
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      >
                        <option value="Technical">Technical</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Sales">Sales</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Product">Product</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-3 mb-2">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={createTrainingForm.start_date}
                        onChange={(e) => setCreateTrainingForm({ ...createTrainingForm, start_date: e.target.value })}
                        required
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={createTrainingForm.end_date}
                        onChange={(e) => setCreateTrainingForm({ ...createTrainingForm, end_date: e.target.value })}
                        required
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer py-2.5 px-4" style={{ backgroundColor: colors.light, borderTop: `1px solid ${colors.border}` }}>
                  <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px', padding: '8px 16px' }} onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn text-white fw-semibold" style={{ backgroundColor: colors.primary, borderRadius: '8px', padding: '8px 18px' }} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerTraining;
