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
  FaQuestionCircle,
  FaTimes,
  FaCheck,
  FaVideo,
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen
} from 'react-icons/fa';
import { employeeAPI } from '../../services/api';
import { Spinner, Alert, Modal, ProgressBar, Badge, Button, Form } from 'react-bootstrap';
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

// Course curriculum lessons
const courseLessons = [
  {
    id: 1,
    title: "Lesson 1: Foundations & Core Architecture",
    duration: "15 Mins",
    summary: "Comprehensive introduction to the core framework, regulatory guidelines, and standard operating procedures.",
    topics: ["Introduction to Security Architecture", "Identity & Access Management (IAM)", "Enterprise Compliance Standards"]
  },
  {
    id: 2,
    title: "Lesson 2: Threat Detection & Defense Vectors",
    duration: "20 Mins",
    summary: "Deep dive into real-world threat models, attack surfaces, phishing vectors, and zero-trust verification.",
    topics: ["Phishing & Social Engineering Vectors", "Malware & Ransomware Mitigation", "Zero Trust Architecture Concepts"]
  },
  {
    id: 3,
    title: "Lesson 3: Safe Data Transmission & Remote Policies",
    duration: "25 Mins",
    summary: "Protocols for secure cloud synchronization, remote workforce security policies, and incident isolation.",
    topics: ["Enterprise VPN & TLS Encryption", "Confidential Data Governance", "Device Encryption & Remote Protocols"]
  },
  {
    id: 4,
    title: "Lesson 4: Incident Response & Final Review",
    duration: "15 Mins",
    summary: "Incident mitigation escalation matrix, audit trailing, and preparation for the final certification exam.",
    topics: ["Incident Escalation Matrix", "Audit Logging & Forensics", "Preparation for Final Assessment Test"]
  }
];

// Interactive Question Bank for Assessment Tests
const courseQuestionBank = {
  default: [
    {
      id: 1,
      question: "Which of the following is considered a best security practice for corporate passwords?",
      options: [
        "Using your date of birth or name with 123",
        "A combination of uppercase, lowercase, numbers, and symbols (minimum 12 characters)",
        "Using the same password across all personal and company logins",
        "Writing down passwords on paper sticky notes near your desk"
      ],
      correctIndex: 1
    },
    {
      id: 2,
      question: "What is the primary objective of Multi-Factor Authentication (MFA / 2FA)?",
      options: [
        "To speed up user login time",
        "To replace the need for strong passwords",
        "To provide an essential extra layer of defense against unauthorized account access",
        "To allow multiple employees to share one account"
      ],
      correctIndex: 2
    },
    {
      id: 3,
      question: "How should an employee respond upon receiving an unexpected email requesting urgent credentials?",
      options: [
        "Click the link immediately to verify what is being requested",
        "Report the suspicious message to IT/Security and avoid clicking any links or attachments",
        "Forward it to all colleagues asking if they received it",
        "Reply directly with credentials to test if it's authentic"
      ],
      correctIndex: 1
    },
    {
      id: 4,
      question: "Why is end-to-end data encryption critical when transmitting sensitive company information?",
      options: [
        "It compresses large files for faster downloads",
        "It prevents unauthorized parties from intercepting and reading confidential information",
        "It automatically fixes corrupted hard drive sectors",
        "It converts confidential files into open public assets"
      ],
      correctIndex: 1
    },
    {
      id: 5,
      question: "When connecting remotely to company systems from public venues, what protocol should be followed?",
      options: [
        "Connect directly to any open unsecured public Wi-Fi network",
        "Always connect through an approved company Virtual Private Network (VPN) with encrypted tunneling",
        "Use free public airport Wi-Fi without encryption",
        "Disable device antivirus to speed up connectivity"
      ],
      correctIndex: 1
    }
  ]
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

  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

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

  // Storage key helpers for assessment tests
  const getTestsStorageKey = () => {
    const user = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
    return `emp_tests_results_${user}`;
  };

  const getSavedTestResults = () => {
    try {
      const raw = localStorage.getItem(getTestsStorageKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  const saveTestResultLocally = (testId, score, status = 'Completed') => {
    try {
      const all = getSavedTestResults();
      all[testId] = { score, status, updated_at: new Date().toISOString() };
      localStorage.setItem(getTestsStorageKey(), JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save test result locally:', e);
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
        const savedTests = getSavedTestResults();
        const testsRes = await employeeAPI.getTests();
        if (testsRes?.data?.success) {
          const tests = testsRes.data.data || [];
          setAssessmentTests(tests.map(t => {
            const local = savedTests[t.id];
            const isCompleted = local?.status === 'Completed' || t.status === 'completed' || t.status === 'Completed';
            const score = local?.score !== undefined ? local.score : (t.score !== undefined && t.score !== null ? t.score : (isCompleted ? 85 : null));
            return {
              id: t.id,
              courseTitle: t.course_title || t.course_name || 'Course Test',
              title: t.test_title || t.name || 'Assessment Test',
              testDate: t.test_date?.split('T')[0] || t.created_at?.split('T')[0] || '-',
              duration: t.duration || '60 mins',
              questions: t.total_questions || '5',
              status: isCompleted ? 'Completed' : t.status === 'locked' ? 'Locked' : 'Available',
              score: score
            };
          }));
        }

        // Fetch certificates
        const certsRes = await employeeAPI.getCertificates();
        let certs = [];
        if (certsRes?.data?.success) {
          certs = (certsRes.data.data || []).map(c => ({
            id: c.id,
            courseTitle: c.course_title || 'Certified Course',
            certificateId: c.certificate_number || `CERT-${c.id}`,
            issueDate: c.issue_date?.split('T')[0] || c.created_at?.split('T')[0] || '-',
            status: 'Issued'
          }));
        }

        // Check if any locally completed tests need certificate representation
        Object.keys(savedTests).forEach(tId => {
          if (savedTests[tId]?.status === 'Completed') {
            const matchingTest = (testsRes?.data?.data || []).find(t => String(t.id) === String(tId));
            const cTitle = matchingTest?.course_title || matchingTest?.course_name || 'CyberSecurity';
            if (!certs.some(c => c.courseTitle.toLowerCase() === cTitle.toLowerCase())) {
              certs.push({
                id: tId,
                courseTitle: cTitle,
                certificateId: `CERT-KT-${tId}-2026`,
                issueDate: savedTests[tId].updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                status: 'Issued'
              });
            }
          }
        });

        setCertificates(certs);
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

  // Open Course Learning Modal
  const handleOpenCoursePlayer = (training) => {
    setSelectedCourse(training);
    const currComp = training.completion || 0;
    const lessonIdx = Math.min(3, Math.floor(currComp / 25));
    setActiveLessonIndex(lessonIdx);
    setShowCourseModal(true);
  };

  // Progress Lesson in Course Learning Modal
  const handleAdvanceLesson = async () => {
    if (!selectedCourse) return;
    const courseId = selectedCourse.id;
    const title = selectedCourse.title;

    const nextComp = Math.min(100, (selectedCourse.completion || 0) + 25);
    const nextStatus = nextComp >= 100 ? 'Completed' : 'In Progress';

    // Update state
    const updatedCourse = {
      ...selectedCourse,
      completion: nextComp,
      status: nextStatus
    };
    setSelectedCourse(updatedCourse);

    setAssignedTrainings(prev => prev.map(t => {
      if (String(t.id) === String(courseId) || String(t.courseId) === String(courseId)) {
        return updatedCourse;
      }
      return t;
    }));

    if (activeLessonIndex < 3) {
      setActiveLessonIndex(activeLessonIndex + 1);
    }

    saveTrainingProgressLocally(courseId, nextStatus, nextComp);

    if (nextStatus === 'Completed') {
      toast.success(`🎉 Curriculum completed for "${title}"! You can now take the Assessment Test.`);
    } else {
      toast.success(`Lesson marked complete! Progress updated: ${nextComp}%.`);
    }

    try {
      await employeeAPI.startTraining(courseId, { status: nextStatus, progress: nextComp });
    } catch (err) {
      // Handled silently
    }
  };

  // Start Training directly from button
  const handleStartTraining = async (course) => {
    const target = (course && typeof course === 'object') ? course : (assignedTrainings.find(t => String(t.id) === String(course) || String(t.courseId) === String(course)) || { id: course || '3', title: 'CyberSecurity', completion: 25 });
    if (target) {
      handleOpenCoursePlayer(target);
    }
  };

  // Open Assessment Test Modal
  const handleTakeTest = (test) => {
    const targetTest = (test && typeof test === 'object') ? test : (assessmentTests.find(t => String(t.id) === String(test)) || { id: test || '3', title: 'Final Assessment', courseTitle: 'CyberSecurity', duration: '60 Mins' });
    setSelectedTest(targetTest);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTestSubmitted(false);
    setTestScore(0);
    setShowTestModal(true);
  };

  // Select Option in Test
  const handleSelectOption = (questionIndex, optionIndex) => {
    if (testSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  // Submit Assessment Test
  const handleSubmitAssessmentTest = async () => {
    if (!selectedTest) return;

    const questions = courseQuestionBank.default;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    // Score calculation
    const calculatedScore = Math.max(60, Math.round((correctCount / questions.length) * 100));
    setTestScore(calculatedScore);
    setTestSubmitted(true);

    const testId = selectedTest.id;
    const testTitle = selectedTest.courseTitle || selectedTest.title || 'Course Assessment';

    // Save locally
    saveTestResultLocally(testId, calculatedScore, 'Completed');

    // Update assessment tests state
    setAssessmentTests(prev => prev.map(t => {
      if (String(t.id) === String(testId)) {
        return {
          ...t,
          status: 'Completed',
          score: calculatedScore
        };
      }
      return t;
    }));

    // Update training progress to 100% completed
    saveTrainingProgressLocally(testId, 'Completed', 100);
    setAssignedTrainings(prev => prev.map(t => {
      if (String(t.id) === String(testId) || String(t.title).toLowerCase() === String(testTitle).toLowerCase()) {
        return { ...t, status: 'Completed', completion: 100 };
      }
      return t;
    }));

    // Automatically issue Certificate
    const certId = `CERT-KT-${testId}-${Date.now().toString().slice(-4)}`;
    setCertificates(prev => {
      if (!prev.some(c => c.courseTitle.toLowerCase() === testTitle.toLowerCase())) {
        return [{
          id: testId,
          courseTitle: testTitle,
          certificateId: certId,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Issued'
        }, ...prev];
      }
      return prev;
    });

    toast.success(`🎉 Assessment submitted successfully! You scored ${calculatedScore}%.`);

    try {
      setIsSubmittingTest(true);
      await employeeAPI.submitTest(testId, { score: calculatedScore, answers: selectedAnswers });
    } catch (err) {
      // Handled silently
    } finally {
      setIsSubmittingTest(false);
    }
  };

  // Download Certificate function (generates instant printable PDF certificate)
  const handleDownloadCertificate = (cert) => {
    const certTitle = typeof cert === 'object' ? cert.courseTitle : 'Course Certificate';
    const certNum = typeof cert === 'object' ? cert.certificateId : `CERT-${cert}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.success(`Certificate ${certNum} generated successfully!`);
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Completion - ${certTitle}</title>
        <style>
          body { font-family: 'Georgia', serif; margin: 0; padding: 40px; background: #fdfdfd; text-align: center; color: #1E293B; }
          .certificate { border: 8px double #C62828; padding: 50px 30px; border-radius: 12px; background: #fff; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .logo { font-size: 26px; font-weight: bold; color: #C62828; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
          h1 { font-size: 38px; color: #0F172A; margin: 10px 0 20px; font-family: 'Times New Roman', serif; }
          p { font-size: 18px; margin: 12px 0; line-height: 1.6; }
          .recipient { font-size: 32px; font-weight: bold; color: #C62828; margin: 25px 0 15px; border-bottom: 2px solid #E2E8F0; display: inline-block; padding: 0 30px 10px; }
          .course { font-size: 24px; font-weight: bold; color: #1E293B; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 40px; }
          .sig { border-top: 1px solid #94A3B8; width: 200px; padding-top: 8px; font-size: 14px; color: #64748B; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">KIAAN TECHNOLOGY WORKFORCE & PAYROLL</div>
          <h1>CERTIFICATE OF ACHIEVEMENT</h1>
          <p>This is to proudly certify that</p>
          <div class="recipient">${employeeName || 'Employee'}</div>
          <p>has successfully completed the curriculum and passed the assessment for</p>
          <div class="course">${certTitle}</div>
          <p style="margin-top: 25px; font-size: 15px; color: #64748B;">Certificate ID: <strong>${certNum}</strong> • Issued on: ${new Date().toLocaleDateString()}</p>
          <div class="footer">
            <div class="sig">Instructor Signature</div>
            <div class="sig">Authorized Registrar</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(`Certificate downloaded for ${certTitle}!`);
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
                              onClick={() => handleStartTraining(training)}
                            >
                              <FaPlay size={10} /> Start Training
                            </button>
                          ) : training.status === 'In Progress' ? (
                            <button
                              className="btn btn-sm w-100 text-white d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: colors.info, borderRadius: '8px', fontWeight: 600, padding: '7px' }}
                              onClick={() => handleStartTraining(training)}
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
                                  onClick={() => handleStartTraining(training)}
                                >
                                  <FaPlay size={10} className="me-1" /> Start
                                </button>
                              ) : training.status === 'In Progress' ? (
                                <button
                                  className="btn btn-sm text-white"
                                  style={{ backgroundColor: colors.info, borderRadius: '6px', fontWeight: 500 }}
                                  onClick={() => handleStartTraining(training)}
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
                              onClick={() => handleTakeTest(test)}
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
                                  onClick={() => handleTakeTest(test)}
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

      {/* Course Learning Player Modal */}
      <Modal
        show={showCourseModal}
        onHide={() => setShowCourseModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: `1px solid ${colors.border}`, padding: '16px 24px' }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge px-2 py-1" style={{ backgroundColor: '#FEF2F2', color: colors.primary, borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                {selectedCourse?.category || 'Training Course'}
              </span>
              <span className="badge px-2 py-1" style={{ ...getStatusBadgeStyle(selectedCourse?.status || 'In Progress'), borderRadius: '6px', fontSize: '11px' }}>
                {selectedCourse?.status || 'In Progress'}
              </span>
            </div>
            <Modal.Title style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.darkText }}>
              {selectedCourse?.title || 'Interactive Course Curriculum'}
            </Modal.Title>
            <small className="text-muted">Instructor: {selectedCourse?.instructor || 'Senior Trainer'} • Duration: {selectedCourse?.duration || '4 Modules'}</small>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {/* Progress Overview */}
          <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: '#F8FAFC', border: `1px solid ${colors.border}` }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold text-dark small">Course Completion</span>
              <span className="fw-bold small" style={{ color: colors.primary }}>{selectedCourse?.completion || 0}% Completed</span>
            </div>
            <ProgressBar
              now={selectedCourse?.completion || 0}
              variant={selectedCourse?.completion >= 100 ? "success" : "danger"}
              style={{ height: '8px', borderRadius: '4px' }}
            />
          </div>

          {/* Video / Interactive Lesson Stage */}
          <div className="rounded-3 p-4 text-center text-white mb-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '56px', height: '56px', backgroundColor: 'rgba(198, 40, 40, 0.9)' }}>
              <FaVideo size={22} color="#ffffff" />
            </div>
            <h5 className="fw-bold mb-1">{courseLessons[activeLessonIndex]?.title}</h5>
            <p className="text-light small mb-0" style={{ maxWidth: '480px', opacity: 0.85 }}>
              {courseLessons[activeLessonIndex]?.summary}
            </p>
            <span className="badge bg-dark border border-secondary mt-3 px-3 py-1.5" style={{ fontSize: '11px' }}>
              <FaClock className="me-1" /> Estimated Duration: {courseLessons[activeLessonIndex]?.duration}
            </span>
          </div>

          {/* Curriculum Modules List */}
          <h6 className="fw-bold mb-3" style={{ color: colors.darkText }}>
            <FaBookOpen className="me-2 text-danger" /> Course Syllabus & Lessons
          </h6>
          <div className="d-flex flex-column gap-2 mb-3">
            {courseLessons.map((lesson, idx) => {
              const isDone = (selectedCourse?.completion || 0) >= ((idx + 1) * 25);
              const isActive = activeLessonIndex === idx;
              return (
                <div
                  key={lesson.id}
                  className={`p-3 rounded-3 d-flex align-items-center justify-content-between transition-all ${isActive ? 'shadow-sm' : ''}`}
                  style={{
                    backgroundColor: isActive ? '#FFF5F5' : '#F8FAFC',
                    border: `1px solid ${isActive ? '#FECACA' : colors.border}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveLessonIndex(idx)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: isDone ? '#ECFDF5' : isActive ? '#FEF2F2' : '#F1F5F9',
                        color: isDone ? colors.success : isActive ? colors.primary : colors.mutedText,
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      {isDone ? <FaCheck size={12} /> : idx + 1}
                    </div>
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: '13px' }}>{lesson.title}</div>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>{lesson.duration} • {lesson.topics.join(' • ')}</div>
                    </div>
                  </div>
                  <div>
                    {isDone ? (
                      <Badge bg="success" style={{ fontSize: '10px' }}>Completed</Badge>
                    ) : isActive ? (
                      <Badge bg="danger" style={{ fontSize: '10px' }}>Current</Badge>
                    ) : (
                      <Badge bg="light" text="dark" className="border" style={{ fontSize: '10px' }}>Upcoming</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: `1px solid ${colors.border}`, padding: '14px 24px' }}>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowCourseModal(false)}>
            Close
          </Button>
          {(selectedCourse?.completion || 0) < 100 ? (
            <Button
              variant="danger"
              size="sm"
              style={{ backgroundColor: colors.primary, borderColor: colors.primary, fontWeight: 600, padding: '7px 18px' }}
              onClick={handleAdvanceLesson}
            >
              <FaCheck className="me-1.5" /> Complete Lesson & Advance (+25%)
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              style={{ fontWeight: 600, padding: '7px 18px' }}
              onClick={() => {
                setShowCourseModal(false);
                setActiveView('assessment');
              }}
            >
              <FaClipboardCheck className="me-1.5" /> Curriculum Completed! Take Assessment Test
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Assessment Test Modal */}
      <Modal
        show={showTestModal}
        onHide={() => setShowTestModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: `1px solid ${colors.border}`, padding: '16px 24px' }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge px-2 py-1" style={{ backgroundColor: '#FEF2F2', color: colors.primary, borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                Official Assessment
              </span>
              <span className="badge px-2 py-1 bg-light text-dark border" style={{ borderRadius: '6px', fontSize: '11px' }}>
                <FaClock className="me-1 text-danger" /> 60 Mins Timed Test
              </span>
            </div>
            <Modal.Title style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.darkText }}>
              {selectedTest?.title || 'Course Final Assessment'} — {selectedTest?.courseTitle || 'CyberSecurity'}
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {testSubmitted ? (
            /* Celebration Scorecard */
            <div className="text-center py-4 px-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                style={{
                  width: '84px',
                  height: '84px',
                  backgroundColor: testScore >= 60 ? '#ECFDF5' : '#FEF2F2',
                  border: `3px solid ${testScore >= 60 ? '#10B981' : '#EF4444'}`
                }}
              >
                {testScore >= 60 ? (
                  <FaCheckCircle size={44} color="#10B981" />
                ) : (
                  <FaTimes size={44} color="#EF4444" />
                )}
              </div>
              <h3 className="fw-bold mb-1" style={{ color: testScore >= 60 ? '#065F46' : '#991B1B' }}>
                {testScore >= 60 ? '🎉 Congratulations! You Passed!' : 'Assessment Attempt Recorded'}
              </h3>
              <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                {testScore >= 60
                  ? 'You demonstrated excellent understanding of the course curriculum.'
                  : 'You have submitted the assessment.'}
              </p>

              <div className="d-inline-flex align-items-center gap-4 p-3 rounded-3 mb-4" style={{ backgroundColor: '#F8FAFC', border: `1px solid ${colors.border}` }}>
                <div>
                  <div className="text-muted small">Your Score</div>
                  <div className="fw-bold h4 mb-0" style={{ color: testScore >= 60 ? colors.success : colors.danger }}>{testScore}%</div>
                </div>
                <div style={{ height: '36px', width: '1px', backgroundColor: '#E2E8F0' }}></div>
                <div>
                  <div className="text-muted small">Passing Threshold</div>
                  <div className="fw-bold h4 mb-0 text-dark">60%</div>
                </div>
                <div style={{ height: '36px', width: '1px', backgroundColor: '#E2E8F0' }}></div>
                <div>
                  <div className="text-muted small">Certification Status</div>
                  <div className="fw-bold h4 mb-0 text-success">Issued</div>
                </div>
              </div>

              <div className="alert alert-success d-flex align-items-center justify-content-center gap-2 mb-0" role="alert" style={{ borderRadius: '10px' }}>
                <FaAward size={20} color="#059669" />
                <span className="small fw-semibold">Your Certificate of Completion has been generated and added to the Certificates tab!</span>
              </div>
            </div>
          ) : (
            /* Interactive Assessment Questions */
            <div>
              {/* Question Progress Tracker */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-semibold text-muted small">
                  Question {currentQuestionIndex + 1} of {courseQuestionBank.default.length}
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1">
                  Answered: {Object.keys(selectedAnswers).length} / {courseQuestionBank.default.length}
                </span>
              </div>
              <ProgressBar
                now={((currentQuestionIndex + 1) / courseQuestionBank.default.length) * 100}
                variant="danger"
                style={{ height: '6px', borderRadius: '3px', marginBottom: '20px' }}
              />

              {/* Current Question */}
              <div className="p-3.5 p-sm-4 rounded-3 mb-4" style={{ backgroundColor: '#F8FAFC', border: `1px solid ${colors.border}` }}>
                <h6 className="fw-bold mb-3" style={{ color: colors.darkText, fontSize: '15px', lineHeight: 1.5 }}>
                  Q{currentQuestionIndex + 1}. {courseQuestionBank.default[currentQuestionIndex]?.question}
                </h6>

                <div className="d-flex flex-column gap-2.5">
                  {courseQuestionBank.default[currentQuestionIndex]?.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-3 d-flex align-items-center gap-3 transition-all ${isSelected ? 'shadow-sm' : ''}`}
                        style={{
                          backgroundColor: isSelected ? '#FEF2F2' : '#ffffff',
                          border: `1.5px solid ${isSelected ? colors.primary : '#E2E8F0'}`,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSelectOption(currentQuestionIndex, oIdx)}
                      >
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: '24px',
                            height: '24px',
                            border: `2px solid ${isSelected ? colors.primary : '#CBD5E1'}`,
                            backgroundColor: isSelected ? colors.primary : '#ffffff',
                            color: isSelected ? '#ffffff' : colors.darkText,
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span style={{ fontSize: '13px', color: isSelected ? colors.darkText : '#334155', fontWeight: isSelected ? 600 : 400 }}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation within Test */}
              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  style={{ borderRadius: '6px' }}
                >
                  <FaArrowLeft className="me-1" /> Previous
                </Button>

                {currentQuestionIndex < courseQuestionBank.default.length - 1 ? (
                  <Button
                    variant="danger"
                    size="sm"
                    style={{ backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: '6px' }}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    Next Question <FaArrowRight className="ms-1" />
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={isSubmittingTest}
                    style={{ fontWeight: 600, padding: '7px 20px', borderRadius: '6px' }}
                    onClick={handleSubmitAssessmentTest}
                  >
                    {isSubmittingTest ? <Spinner size="sm" animation="border" className="me-1" /> : <FaCheckCircle className="me-1.5" />}
                    Submit Assessment Test
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: `1px solid ${colors.border}`, padding: '14px 24px' }}>
          {testSubmitted ? (
            <div className="d-flex justify-content-between w-100">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowTestModal(false)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                style={{ backgroundColor: colors.primary, borderColor: colors.primary, fontWeight: 600 }}
                onClick={() => {
                  setShowTestModal(false);
                  setActiveView('certificates');
                }}
              >
                <FaAward className="me-1.5" /> View Certificates Tab
              </Button>
            </div>
          ) : (
            <Button variant="outline-secondary" size="sm" onClick={() => setShowTestModal(false)}>
              Cancel Test
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeTraining;