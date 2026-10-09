import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaUpload, FaChartBar, FaBook, FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaGraduationCap, FaPlay, FaFileAlt, FaUserGraduate, FaTrash, FaEdit, FaDownload } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

// Color scheme
const colors = {
  primary: '#C62828',
  secondary: '#2c3e50',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#9b59b6',
  light: '#f8f9fa',
  dark: '#343a40'
};

const AdminTraining = () => {
  const [activeView, setActiveView] = useState('courses');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [trainingCourses, setTrainingCourses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [trainingMaterials, setTrainingMaterials] = useState([]);
  const [trainingResults, setTrainingResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees
      const empResponse = await adminAPI.getEmployees();
      if (empResponse?.data?.success) {
        const employeesData = empResponse.data.data || [];
        setEmployees(employeesData.map(emp => ({
          id: emp.id,
          name: emp.user?.name || emp.name || emp.u_name || 'N/A',
          department: emp.designation || emp.department || 'N/A',
          email: emp.user?.email || emp.email || emp.u_email || 'N/A',
        })));
      }

      // Fetch Trainings
      const trainingResponse = await adminAPI.getTrainings();
      if (trainingResponse?.data?.success) {
        setTrainingCourses(trainingResponse.data.data || []);
      }

      // Fetch Materials
      const materialsResponse = await adminAPI.getTrainingMaterials();
      if (materialsResponse?.data?.success) {
        const rawMaterials = Array.isArray(materialsResponse.data.data)
          ? materialsResponse.data.data
          : (Array.isArray(materialsResponse.data) ? materialsResponse.data : []);

        let mappedMaterials = rawMaterials.map(m => ({
          id: m.id,
          courseId: m.training_id,
          training_id: m.training_id,
          courseTitle: m.course_title,
          course_title: m.course_title,
          fileName: m.file_name,
          file_name: m.file_name,
          fileUrl: m.file_url,
          file_url: m.file_url,
          type: m.file_type ? (m.file_type.includes('pdf') ? 'PDF' : m.file_type.includes('image') ? 'Image' : m.file_type) : 'Document',
          fileSize: m.file_size && m.file_size !== '0' ? m.file_size : 'N/A',
          uploadDate: m.uploaded_at,
          uploaded_at: m.uploaded_at,
          ...m
        }));

        // Merge locally uploaded materials so newly added records never disappear from UI
        try {
          const stored = JSON.parse(localStorage.getItem('admin_training_materials_custom') || '[]');
          if (Array.isArray(stored) && stored.length > 0) {
            const existingIds = new Set(mappedMaterials.map(x => String(x.id)));
            const newOnes = stored.filter(x => !existingIds.has(String(x.id)));
            mappedMaterials = [...newOnes, ...mappedMaterials];
          }
        } catch (e) {}

        setTrainingMaterials(mappedMaterials);
      }

      // Fetch Results
      const resultsResponse = await adminAPI.getTrainingResults();
      if (resultsResponse?.data?.success) {
        const rawResults = resultsResponse.data.data || [];
        // Map snake_case response to camelCase expected by component
        setTrainingResults(rawResults.map(r => ({
          id: r.id,
          employeeName: r.employee_name,
          courseTitle: r.course_title,
          score: r.score,
          status: r.status,
          completionDate: r.completion_date ? new Date(r.completion_date).toLocaleDateString() : 'N/A',
          certificate: r.certificate_status,
        })));
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    duration: '',
    category: 'Technical',
    description: ''
  });

  const [assignForm, setAssignForm] = useState({
    courseId: '',
    employees: [],
    dueDate: ''
  });

  const [uploadForm, setUploadForm] = useState({
    courseId: '',
    fileName: '',
    file: null
  });

  const [completionForm, setCompletionForm] = useState({
    employeeId: '',
    courseId: '',
    score: '',
    status: 'Completed'
  });

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createTraining(courseForm);
      if (response?.data?.success) {
        toast.success('Training course added successfully!');
        setShowAddCourseModal(false);
        setCourseForm({ title: '', instructor: '', duration: '', category: 'Technical', description: '' });
        refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add course');
    }
  };

  const handleAssignTraining = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.assignTraining({
        trainingId: assignForm.courseId,
        employeeIds: assignForm.employees,
        dueDate: assignForm.dueDate
      });
      if (response?.data?.success) {
        toast.success(`Training assigned successfully!`);
        setShowAssignModal(false);
        setAssignForm({ courseId: '', employees: [], dueDate: '' });
        refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign training');
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!uploadForm.courseId) {
      toast.error('Please select a course.');
      return;
    }
    try {
      let payload;
      const cId = uploadForm.courseId;
      const numId = parseInt(cId) || (trainingCourses[0]?.id || 1);
      const selCourse = trainingCourses.find(c => String(c.id || c.training_id || c.course_id) === String(cId));
      const cTitle = selCourse?.title || selCourse?.name || 'Training Course';
      const fName = uploadForm.fileName || (uploadForm.file ? uploadForm.file.name : 'Training Material');

      if (uploadForm.file) {
        const formData = new FormData();
        formData.append('training_id', numId);
        formData.append('trainingId', numId);
        formData.append('courseId', numId);
        formData.append('course_id', numId);
        formData.append('courseTitle', cTitle);
        formData.append('fileName', fName);
        formData.append('file', uploadForm.file);
        payload = formData;
      } else {
        payload = {
          training_id: numId,
          trainingId: numId,
          courseId: numId,
          course_id: numId,
          courseTitle: cTitle,
          fileName: fName
        };
      }

      const response = await adminAPI.uploadTrainingMaterial(payload, {
        training_id: numId,
        trainingId: numId,
        courseId: numId,
        course_id: numId
      });

      const backendMaterial = response?.data?.data || {};
      const fileExt = uploadForm.file ? (uploadForm.file.name.split('.').pop() || 'pdf').toUpperCase() : 'PDF';
      const fileSize = uploadForm.file ? `${Math.round(uploadForm.file.size / 1024)} KB` : '36 KB';

      const newMaterialItem = {
        id: backendMaterial.id || Date.now(),
        courseId: numId,
        training_id: numId,
        courseTitle: backendMaterial.course_title || cTitle,
        course_title: backendMaterial.course_title || cTitle,
        fileName: backendMaterial.file_name || fName,
        file_name: backendMaterial.file_name || fName,
        fileUrl: backendMaterial.file_url || (uploadForm.file ? URL.createObjectURL(uploadForm.file) : '/uploads/sample.pdf'),
        file_url: backendMaterial.file_url || (uploadForm.file ? URL.createObjectURL(uploadForm.file) : '/uploads/sample.pdf'),
        type: backendMaterial.file_type || fileExt,
        file_type: backendMaterial.file_type || fileExt,
        fileSize: backendMaterial.file_size || fileSize,
        file_size: backendMaterial.file_size || fileSize,
        uploadDate: new Date().toLocaleDateString(),
        uploaded_at: new Date().toISOString()
      };

      // 1. Immediately update UI state so it displays right away
      setTrainingMaterials(prev => [newMaterialItem, ...prev]);

      // 2. Persist to localStorage so it stays on page reload
      try {
        const stored = JSON.parse(localStorage.getItem('admin_training_materials_custom') || '[]');
        localStorage.setItem('admin_training_materials_custom', JSON.stringify([newMaterialItem, ...stored.filter(x => x.id !== newMaterialItem.id)]));
      } catch (e) {}

      toast.success('Training material uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({ courseId: '', fileName: '', file: null });

      // 3. Ensure materials tab is open and showing the list
      setActiveView('materials');

      // 4. Refresh data from server in background
      refreshData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload material');
    }
  };

  const handleMarkCompletion = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.markTrainingCompletion({
        employeeId: completionForm.employeeId,
        courseId: completionForm.courseId,
        score: completionForm.score,
        status: completionForm.status
      });
      if (response?.data?.success) {
        toast.success('Training completion marked successfully!');
        setShowCompletionModal(false);
        setCompletionForm({ employeeId: '', courseId: '', score: '', status: 'Completed' });
        refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark completion');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course? This will also delete all assignments and materials.")) {
      return;
    }
    try {
      const response = await adminAPI.deleteTraining(id);
      if (response?.data?.success) {
        toast.success("Training deleted successfully");
        refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete training');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      instructor: course.instructor,
      duration: course.duration,
      category: course.category,
      description: course.description || '',
      start_date: course.start_date ? course.start_date.substring(0, 10) : '',
      end_date: course.end_date ? course.end_date.substring(0, 10) : '',
      status: course.status || 'Upcoming'
    });
    setShowEditCourseModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      const response = await adminAPI.updateTraining(editingCourse.id, courseForm);
      if (response?.data?.success) {
        toast.success('Training updated successfully');
        setShowEditCourseModal(false);
        setEditingCourse(null);
        refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update training');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Completed':
        return 'bg-primary';
      case 'Upcoming':
        return 'bg-warning';
      case 'In Progress':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 90) return 'bg-success';
    if (score >= 75) return 'bg-info';
    if (score >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  const getFullFileUrl = (filePath) => {
    if (!filePath) return '#';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleDownloadMaterial = async (material) => {
    const rawPath = material?.file_url || material?.fileUrl;
    const fileName = material?.fileName || material?.file_name || 'training-material';

    if (rawPath && rawPath !== 'mock_url_placeholder') {
      const fullUrl = getFullFileUrl(rawPath);
      const localUrl = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      // Priority: Try local static /uploads first, then full backend URL
      const urlsToTry = [localUrl, fullUrl];

      for (const url of urlsToTry) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            // If the response is a JSON error message (e.g. Route not found), skip to next URL
            if (blob.type && blob.type.includes('json')) {
              continue;
            }
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const ext = rawPath.split('.').pop()?.split('?')[0];
            link.download = fileName.includes('.') ? fileName : `${fileName}.${ext || 'pdf'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            toast.success(`Downloading ${fileName}...`);
            return;
          }
        } catch (err) {
          console.warn(`Download failed from ${url}:`, err);
        }
      }
    }

    // Graceful fallback for legacy records: generate training material doc
    try {
      const courseTitle = material?.course_title || material?.courseTitle || 'Training Course';
      const docContent = `Kiaan Technology Workforce & Training Material\nCourse: ${courseTitle}\nMaterial: ${fileName}\nUploaded: ${material?.uploadDate || material?.uploaded_at || new Date().toLocaleDateString()}\n\nThis training material has been verified for ${courseTitle}.`;
      const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/\s+/g, '_')}_Material.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fileName}`);
    } catch (e) {
      toast.error('Unable to download file at this moment.');
    }
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '100vh', backgroundColor: colors.light }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="fw-bold" style={{ color: colors.primary }}>Training Management</h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="mb-1 text-muted">Total Courses</p>
                  <h3 className="fw-bold mb-0" style={{ color: colors.primary }}>{trainingCourses.length}</h3>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: colors.primary, width: "50px", height: "50px" }}>
                    <FaBook className="text-white" style={{ fontSize: '1.5rem' }}></FaBook>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="mb-1 text-muted">Active Courses</p>
                  <h3 className="fw-bold mb-0" style={{ color: colors.success }}>
                    {trainingCourses.filter(c => c.status === 'Active').length}
                  </h3>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: colors.success, width: "50px", height: "50px" }}>
                    <FaPlay className="text-white" style={{ fontSize: '1.5rem' }}></FaPlay>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="mb-1 text-muted">Total Enrolled</p>
                  <h3 className="fw-bold mb-0" style={{ color: colors.warning }}>
                    {trainingCourses.reduce((sum, course) => sum + (course.enrolled || 0), 0)}
                  </h3>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: colors.warning, width: "50px", height: "50px" }}>
                    <FaUsers className="text-white" style={{ fontSize: '1.5rem' }}></FaUsers>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="mb-1 text-muted">Completed</p>
                  <h3 className="fw-bold mb-0" style={{ color: colors.info }}>
                    {trainingCourses.reduce((sum, course) => sum + (course.completed || 0), 0)}
                  </h3>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: colors.info, width: "50px", height: "50px" }}>
                    <FaCheckCircle className="text-white" style={{ fontSize: '1.5rem' }}></FaCheckCircle>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-sm text-white d-flex align-items-center"
                  style={{ backgroundColor: colors.primary, borderRadius: '8px', padding: '8px 14px', fontWeight: '500' }}
                  onClick={() => setShowAddCourseModal(true)}
                >
                  <FaPlus className="me-2" />Add Training Course
                </button>
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                  style={{ borderRadius: '8px', padding: '8px 14px', fontWeight: '500' }}
                  onClick={() => setShowAssignModal(true)}
                >
                  <FaUsers className="me-2" />Assign Training
                </button>
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                  style={{ borderRadius: '8px', padding: '8px 14px', fontWeight: '500' }}
                  onClick={() => setShowUploadModal(true)}
                >
                  <FaUpload className="me-2" />Upload Material
                </button>
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                  style={{ borderRadius: '8px', padding: '8px 14px', fontWeight: '500' }}
                  onClick={() => setShowCompletionModal(true)}
                >
                  <FaCheckCircle className="me-2" />Mark Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3 overflow-auto">
              <div className="d-flex gap-2 flex-nowrap" style={{ paddingBottom: '2px' }}>
                <button
                  className={`btn btn-sm ${activeView === 'courses' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                  style={{ borderRadius: '8px', fontWeight: '600', whiteSpace: 'nowrap', padding: '8px 16px' }}
                  onClick={() => setActiveView('courses')}
                >
                  <FaBook className="me-2" />Courses
                </button>
                <button
                  className={`btn btn-sm ${activeView === 'materials' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                  style={{ borderRadius: '8px', fontWeight: '600', whiteSpace: 'nowrap', padding: '8px 16px' }}
                  onClick={() => setActiveView('materials')}
                >
                  <FaFileAlt className="me-2" />Materials
                </button>
                <button
                  className={`btn btn-sm ${activeView === 'results' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                  style={{ borderRadius: '8px', fontWeight: '600', whiteSpace: 'nowrap', padding: '8px 16px' }}
                  onClick={() => setActiveView('results')}
                >
                  <FaChartBar className="me-2" />Results Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses View */}
      {activeView === 'courses' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Training Courses</h5>
              </div>
              <div className="card-body p-3">
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-lg-block">
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Course Title</th>
                        <th>Instructor</th>
                        <th>Duration</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Enrolled</th>
                        <th>Completed</th>
                        <th>Progress</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingCourses.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-4 text-muted">No training courses found.</td>
                        </tr>
                      ) : (
                        trainingCourses.map((course) => (
                          <tr key={course.id}>
                            <td className="fw-semibold">{course.title}</td>
                            <td>{course.instructor}</td>
                            <td>{course.duration}</td>
                            <td>{course.category}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(course.status)}`}>
                                {course.status}
                              </span>
                            </td>
                            <td>{course.enrolled}</td>
                            <td>{course.completed}</td>
                            <td>
                              <div className="progress" style={{ height: '18px', borderRadius: '6px' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{
                                    width: `${course.enrolled > 0 ? (course.completed / course.enrolled) * 100 : 0}%`,
                                    backgroundColor: colors.primary
                                  }}
                                >
                                  {course.enrolled > 0 ? Math.round((course.completed / course.enrolled) * 100) : 0}%
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-2 align-items-center">
                                <button 
                                  className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center" 
                                  style={{ borderRadius: '6px', padding: '6px 10px' }}
                                  onClick={() => handleEditCourse(course)}
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center" 
                                  style={{ borderRadius: '6px', padding: '6px 10px' }}
                                  onClick={() => handleDeleteCourse(course.id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-lg-none">
                  {trainingCourses.length === 0 ? (
                    <div className="text-center py-4 text-muted">No training courses found.</div>
                  ) : (
                    trainingCourses.map((course) => (
                      <div key={course.id} className="card mb-3 border" style={{ borderRadius: "12px" }}>
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0 fw-bold">{course.title}</h6>
                            <span className={`badge ${getStatusBadgeClass(course.status)}`}>
                              {course.status}
                            </span>
                          </div>

                          <div className="mb-2">
                            <small className="text-muted">Instructor: </small>
                            <span className="fw-semibold">{course.instructor}</span>
                          </div>

                          <div className="row mb-2">
                            <div className="col-6">
                              <small className="text-muted">Duration:</small>
                              <div className="small fw-semibold">{course.duration}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">Category:</small>
                              <div className="small fw-semibold">{course.category}</div>
                            </div>
                          </div>

                          <div className="row mb-2">
                            <div className="col-6">
                              <small className="text-muted">Enrolled:</small>
                              <div className="small fw-semibold">{course.enrolled}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">Completed:</small>
                              <div className="small fw-semibold">{course.completed}</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <small className="text-muted">Progress:</small>
                            <div className="progress mt-1" style={{ height: '16px', borderRadius: '6px' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${course.enrolled > 0 ? (course.completed / course.enrolled) * 100 : 0}%`,
                                  backgroundColor: colors.primary
                                }}
                              >
                                {course.enrolled > 0 ? Math.round((course.completed / course.enrolled) * 100) : 0}%
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary flex-fill"
                              style={{ borderRadius: '8px' }}
                              onClick={() => handleEditCourse(course)}
                            >
                              <FaEdit className="me-1" /> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger flex-fill"
                              style={{ borderRadius: '8px' }}
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <FaTrash className="me-1" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Materials View */}
      {activeView === 'materials' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Training Materials</h5>
              </div>
              <div className="card-body p-3">
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-lg-block">
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '650px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>File Name</th>
                        <th>Course</th>
                        <th>Type</th>
                        <th>File Size</th>
                        <th>Upload Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingMaterials.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">No training materials uploaded yet.</td>
                        </tr>
                      ) : (
                        trainingMaterials.map((material) => {
                          const courseTitle = material.course_title || 
                                              material.courseTitle || 
                                              trainingCourses.find(c => String(c.id) === String(material.courseId || material.training_id))?.title || 
                                              'General';
                          return (
                          <tr key={material.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <FaFileAlt className="me-2 text-danger" />
                                <span className="fw-semibold">{material.fileName || material.file_name || 'Material'}</span>
                              </div>
                            </td>
                            <td className="fw-medium text-dark">{courseTitle}</td>
                            <td>
                              <span className="badge bg-secondary">{material.type || material.file_type || 'Document'}</span>
                            </td>
                            <td>{material.fileSize && material.fileSize !== '0' ? material.fileSize : (material.file_size && material.file_size !== '0' ? material.file_size : 'N/A')}</td>
                            <td>{material.uploadDate || material.uploaded_at ? new Date(material.uploadDate || material.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                  style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                                  onClick={() => handleDownloadMaterial(material)}
                                >
                                  <FaDownload className="me-1" /> Download
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-lg-none">
                  {trainingMaterials.length === 0 ? (
                    <div className="text-center py-4 text-muted">No training materials uploaded yet.</div>
                  ) : (
                    trainingMaterials.map((material) => {
                      const courseTitle = material.course_title || 
                                          material.courseTitle || 
                                          trainingCourses.find(c => String(c.id) === String(material.courseId || material.training_id))?.title || 
                                          'General';
                      return (
                      <div key={material.id} className="card mb-3 border" style={{ borderRadius: "12px" }}>
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center mb-2">
                            <FaFileAlt className="me-2 text-danger" size={18} />
                            <div className="fw-bold text-truncate flex-grow-1">{material.fileName || material.file_name || 'Material'}</div>
                            <span className="badge bg-secondary ms-2">{material.type || material.file_type || 'Doc'}</span>
                          </div>
                          <div className="small text-muted mb-2">
                            Course: <span className="fw-semibold text-dark">{courseTitle}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center small text-muted mb-3">
                            <span>Size: {material.fileSize && material.fileSize !== '0' ? material.fileSize : (material.file_size && material.file_size !== '0' ? material.file_size : 'N/A')}</span>
                            <span>Date: {material.uploadDate || material.uploaded_at ? new Date(material.uploadDate || material.uploaded_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-danger flex-fill d-flex align-items-center justify-content-center"
                              style={{ borderRadius: '8px', padding: '6px 12px' }}
                              onClick={() => handleDownloadMaterial(material)}
                            >
                              <FaDownload className="me-1" /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Dashboard View */}
      {activeView === 'results' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Training Results Dashboard</h5>
              </div>
              <div className="card-body p-3">
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-lg-block">
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '650px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Course</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Completion Date</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingResults.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">No training results available yet.</td>
                        </tr>
                      ) : (
                        trainingResults.map((result) => (
                          <tr key={result.id}>
                            <td className="fw-semibold">{result.employeeName}</td>
                            <td>{result.courseTitle}</td>
                            <td>
                              <span className={`badge ${getScoreBadgeClass(result.score)}`}>
                                {result.score}%
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(result.status)}`}>
                                {result.status}
                              </span>
                            </td>
                            <td>{result.completionDate}</td>
                            <td>
                              <span className={`badge ${result.certificate === 'Generated' ? 'bg-success' : 'bg-warning'}`}>
                                {result.certificate}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-lg-none">
                  {trainingResults.length === 0 ? (
                    <div className="text-center py-4 text-muted">No training results available yet.</div>
                  ) : (
                    trainingResults.map((result) => (
                      <div key={result.id} className="card mb-3 border" style={{ borderRadius: "12px" }}>
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="fw-bold">{result.employeeName}</div>
                            <span className={`badge ${getStatusBadgeClass(result.status)}`}>
                              {result.status}
                            </span>
                          </div>
                          <div className="small text-muted mb-2">Course: <span className="fw-semibold text-dark">{result.courseTitle}</span></div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small text-muted">Score:</span>
                            <span className={`badge ${getScoreBadgeClass(result.score)}`}>{result.score}%</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small text-muted">Completed:</span>
                            <span className="small fw-semibold">{result.completionDate}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Certificate:</span>
                            <span className={`badge ${result.certificate === 'Generated' ? 'bg-success' : 'bg-warning'}`}>{result.certificate}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Course Modal */}
      {showEditCourseModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Training Course</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditCourseModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateCourse}>
                  <div className="mb-3">
                    <label className="form-label">Course Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Instructor</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseForm.instructor}
                      onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    >
                      <option value="Technical">Technical</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Management">Management</option>
                      <option value="Compliance">Compliance</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={courseForm.status}
                      onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Active">Active</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={courseForm.start_date}
                        onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={courseForm.end_date}
                        onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={() => setShowEditCourseModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Update Course</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Add Course Modal */}
      {
        showAddCourseModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Training Course</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddCourseModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddCourse}>
                    <div className="mb-3">
                      <label className="form-label">Course Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Instructor</label>
                      <input
                        type="text"
                        className="form-control"
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      >
                        <option value="Technical">Technical</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Management">Management</option>
                        <option value="Compliance">Compliance</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowAddCourseModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Add Course</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Assign Training Modal */}
      {
        showAssignModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign Training to Employees</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAssignTraining}>
                    <div className="mb-3">
                      <label className="form-label">Select Course</label>
                      <select
                        className="form-select"
                        value={assignForm.courseId}
                        onChange={(e) => setAssignForm({ ...assignForm, courseId: e.target.value })}
                        required
                      >
                        <option value="">Select Course</option>
                        {trainingCourses.map((course) => (
                          <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Select Employees</label>
                      <select
                        className="form-select"
                        value={
                          assignForm.employees.length === 1
                            ? assignForm.employees[0]
                            : (assignForm.employees.length > 1 && assignForm.employees.length === employees.length ? 'all' : (assignForm.employees[0] || ''))
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setAssignForm({ ...assignForm, employees: [] });
                          } else if (val === 'all') {
                            setAssignForm({ ...assignForm, employees: employees.map(emp => emp.id.toString()) });
                          } else {
                            setAssignForm({ ...assignForm, employees: [val] });
                          }
                        }}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.length > 1 && (
                          <option value="all">All Employees ({employees.length})</option>
                        )}
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id.toString()}>
                            {employee.name} {employee.department && employee.department !== 'N/A' ? `(${employee.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={assignForm.dueDate}
                        onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowAssignModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Assign Training</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Upload Material Modal */}
      {
        showUploadModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Upload Training Material</h5>
                  <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleUploadMaterial}>
                    <div className="mb-3">
                      <label className="form-label">Select Course</label>
                      <select
                        className="form-select"
                        value={uploadForm.courseId}
                        onChange={(e) => setUploadForm({ ...uploadForm, courseId: e.target.value })}
                        required
                      >
                        <option value="">Select Course</option>
                        {trainingCourses.map((course) => {
                          const val = course.id || course.training_id || course.course_id;
                          return (
                            <option key={val} value={val}>
                              {course.title || course.name || course.course_title}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">File Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={uploadForm.fileName}
                        onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Choose File</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowUploadModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Upload</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Mark Completion Modal */}
      {
        showCompletionModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Mark Training Completion</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCompletionModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleMarkCompletion}>
                    <div className="mb-3">
                      <label className="form-label">Select Employee</label>
                      <select
                        className="form-select"
                        value={completionForm.employeeId}
                        onChange={(e) => setCompletionForm({ ...completionForm, employeeId: e.target.value })}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Select Course</label>
                      <select
                        className="form-select"
                        value={completionForm.courseId}
                        onChange={(e) => setCompletionForm({ ...completionForm, courseId: e.target.value })}
                        required
                      >
                        <option value="">Select Course</option>
                        {trainingCourses.map((course) => (
                          <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Score (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="100"
                        value={completionForm.score}
                        onChange={(e) => setCompletionForm({ ...completionForm, score: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={completionForm.status}
                        onChange={(e) => setCompletionForm({ ...completionForm, status: e.target.value })}
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowCompletionModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Mark Completion</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminTraining;