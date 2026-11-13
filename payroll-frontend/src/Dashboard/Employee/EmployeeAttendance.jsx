import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaClock, FaSignInAlt, FaSignOutAlt, FaChartBar, FaCheckCircle, FaTimesCircle, FaUserCircle, FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import { employeeAPI } from '../../services/api';
import { Spinner, Alert, Dropdown } from 'react-bootstrap';

// Color scheme
const colors = {
  primary: '#C62828',
  secondary: '#2c3e50',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#9b59b6',
  light: '#f8f9fa',
  dark: '#343a40',
  present: '#2ecc71',
  absent: '#e74c3c',
  late: '#f39c12',
  early: '#3498db',
  halfDay: '#9b59b6'
};

const EmployeeAttendance = () => {
  const [activeView, setActiveView] = useState('list');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile
        const profileRes = await employeeAPI.getProfile();
        if (profileRes?.data?.success) {
          const profile = profileRes.data.data;
          setEmployeeName(profile.name || profile.user?.name || '');
          setEmployeeId(profile.employee_id || profile.id || '');
        }
        
        // Fetch attendance
        const attendanceRes = await employeeAPI.getAttendance();
        if (attendanceRes?.data?.success) {
          const attendance = attendanceRes.data.data || [];
          setAttendanceData(attendance.map(att => ({
            id: att.id,
            date: att.date || att.attendance_date,
            day: new Date(att.date || att.attendance_date).toLocaleDateString('en-US', { weekday: 'long' }),
            inTime: att.check_in_time || att.in_time || '-',
            outTime: att.check_out_time || att.out_time || '-',
            status: att.status || 'Present',
            duration: att.duration || '-',
            lateBy: att.late_by || '-',
          })));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
  }, []);
  
  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Calculate monthly statistics
  const calculateMonthlyStats = () => {
    const monthData = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });
    
    const present = monthData.filter(r => r.status === 'Present').length;
    const absent = monthData.filter(r => r.status === 'Absent').length;
    const late = monthData.filter(r => r.status === 'Late').length;
    const early = monthData.filter(r => r.status === 'Early').length;
    const halfDay = monthData.filter(r => r.status === 'Half Day').length;
    const weeklyOff = monthData.filter(r => r.status === 'Weekly Off').length;
    
    return { present, absent, late, early, halfDay, weeklyOff, total: monthData.length };
  };
  
  const monthlyStats = calculateMonthlyStats();
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-success';
      case 'Absent':
        return 'bg-danger';
      case 'Late':
        return 'bg-warning';
      case 'Early':
        return 'bg-info';
      case 'Half Day':
        return 'bg-secondary';
      case 'Weekly Off':
        return 'bg-primary';
      default:
        return 'bg-light text-dark';
    }
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ minHeight: '100vh', backgroundColor: colors.light }}>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <FaUserCircle style={{ fontSize: '3rem', color: colors.primary }} />
                </div>
                <div>
                  <h1 className="fw-bold mb-1" style={{ color: colors.primary }}>My Attendance</h1>
                  <p className="text-muted mb-0">{employeeName} | {employeeId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <p className="mb-0 text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>This Month</p>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: colors.success, fontSize: isMobile ? '1.4rem' : '1.75rem' }}>{monthlyStats.present}</h3>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Present Days</small>
                </div>
                <div className="p-2 p-md-3 rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', color: colors.success, width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px" }}>
                  <FaCheckCircle style={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <p className="mb-0 text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>This Month</p>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: colors.danger, fontSize: isMobile ? '1.4rem' : '1.75rem' }}>{monthlyStats.absent}</h3>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Absent Days</small>
                </div>
                <div className="p-2 p-md-3 rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: 'rgba(231, 76, 60, 0.15)', color: colors.danger, width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px" }}>
                  <FaTimesCircle style={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <p className="mb-0 text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>This Month</p>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: colors.warning, fontSize: isMobile ? '1.4rem' : '1.75rem' }}>{monthlyStats.late}</h3>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Late Arrivals</small>
                </div>
                <div className="p-2 p-md-3 rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: 'rgba(243, 156, 18, 0.15)', color: colors.warning, width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px" }}>
                  <FaClock style={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <p className="mb-0 text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>This Month</p>
                  <h3 className="fw-bold mb-0 mt-1" style={{ color: colors.info, fontSize: isMobile ? '1.4rem' : '1.75rem' }}>{monthlyStats.early}</h3>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>Early Departures</small>
                </div>
                <div className="p-2 p-md-3 rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: 'rgba(155, 89, 182, 0.15)', color: colors.info, width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px" }}>
                  <FaSignInAlt style={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-2 p-md-3">
              <ul className="nav nav-pills nav-fill gap-2">
                <li className="nav-item">
                  <button
                    className={`nav-link text-center fw-medium ${activeView === 'list' ? 'active' : 'bg-light text-dark'}`}
                    style={activeView === 'list' ? { backgroundColor: colors.primary, color: '#fff', borderRadius: '8px' } : { borderRadius: '8px' }}
                    onClick={() => setActiveView('list')}
                  >
                    <FaClock className="me-2" />Attendance List
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link text-center fw-medium ${activeView === 'summary' ? 'active' : 'bg-light text-dark'}`}
                    style={activeView === 'summary' ? { backgroundColor: colors.primary, color: '#fff', borderRadius: '8px' } : { borderRadius: '8px' }}
                    onClick={() => setActiveView('summary')}
                  >
                    <FaChartBar className="me-2" />Monthly Summary
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance List View */}
      {activeView === 'list' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
                <h5 className="mb-0 fw-bold" style={{ fontSize: '1rem', color: '#0F172A' }}>Attendance History</h5>
                <div className="d-flex align-items-center gap-1">
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
                    style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    title="Previous Month"
                  >
                    <FaChevronLeft size={11} />
                  </button>

                  <Dropdown align="end">
                    <Dropdown.Toggle 
                      variant="outline-secondary" 
                      size="sm" 
                      className="d-flex align-items-center gap-1 fw-semibold text-dark"
                      style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px' }}
                    >
                      <FaCalendarAlt size={11} className="text-danger me-1" />
                      <span>{monthNames[selectedMonth]} {selectedYear}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ maxHeight: '200px', overflowY: 'auto', minWidth: '160px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', fontSize: '0.82rem', zIndex: 1050 }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <Dropdown.Item 
                          key={i} 
                          active={selectedMonth === i}
                          onClick={() => setSelectedMonth(i)}
                        >
                          {monthNames[i]} {selectedYear}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
                    style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    title="Next Month"
                  >
                    <FaChevronRight size={11} />
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {attendanceData.filter(record => {
                  const recordDate = new Date(record.date);
                  return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
                }).length === 0 ? (
                  <div className="text-center py-5">
                    <FaClock size={40} className="text-muted mb-2" />
                    <h6 className="fw-semibold text-dark">No Attendance Records</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>No attendance found for selected month.</p>
                  </div>
                ) : isMobile ? (
                  /* MOBILE ATTENDANCE CARDS */
                  <div className="p-3 d-flex flex-column gap-2">
                    {attendanceData
                      .filter(record => {
                        const recordDate = new Date(record.date);
                        return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
                      })
                      .map((record) => (
                        <div key={record.id} className="p-3 rounded border bg-light" style={{ borderColor: '#E2E8F0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <div>
                              <strong className="text-dark d-block" style={{ fontSize: '0.9rem' }}>{record.date}</strong>
                              <small className="text-muted">{record.day}</small>
                            </div>
                            <span className={`badge ${getStatusBadgeClass(record.status)} px-2 py-1`} style={{ fontSize: '0.75rem' }}>
                              {record.status}
                            </span>
                          </div>
                          <div className="row g-2" style={{ fontSize: '0.82rem' }}>
                            <div className="col-6">
                              <span className="text-muted d-block">Punch In:</span>
                              <div className="d-flex align-items-center text-dark fw-medium">
                                <FaSignInAlt className="me-1 text-success" /> {record.inTime}
                              </div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted d-block">Punch Out:</span>
                              <div className="d-flex align-items-center text-dark fw-medium">
                                <FaSignOutAlt className="me-1 text-danger" /> {record.outTime}
                              </div>
                            </div>
                            <div className="col-6 mt-2">
                              <span className="text-muted d-block">Duration:</span>
                              <span className="text-dark fw-medium">{record.duration}</span>
                            </div>
                            <div className="col-6 mt-2">
                              <span className="text-muted d-block">Late By:</span>
                              <span className="text-warning fw-medium">{record.lateBy}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  /* DESKTOP TABLE */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light text-uppercase text-muted" style={{ fontSize: '0.78rem' }}>
                        <tr>
                          <th className="ps-3 py-3">Date</th>
                          <th className="py-3">Day</th>
                          <th className="py-3">Punch In</th>
                          <th className="py-3">Punch Out</th>
                          <th className="py-3">Status</th>
                          <th className="py-3">Duration</th>
                          <th className="pe-3 py-3">Late By</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: '0.88rem' }}>
                        {attendanceData
                          .filter(record => {
                            const recordDate = new Date(record.date);
                            return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
                          })
                          .map((record) => (
                          <tr key={record.id}>
                            <td className="ps-3 fw-medium text-dark">{record.date}</td>
                            <td className="text-muted">{record.day}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FaSignInAlt className="me-2 text-success" />
                                {record.inTime}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FaSignOutAlt className="me-2 text-danger" />
                                {record.outTime}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td>{record.duration}</td>
                            <td className="pe-3">{record.lateBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Monthly Summary View */}
      {activeView === 'summary' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
                <h5 className="mb-0 fw-bold" style={{ fontSize: '1rem', color: '#0F172A' }}>Monthly Summary - {monthNames[selectedMonth]} {selectedYear}</h5>
                <div className="d-flex align-items-center gap-1">
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
                    style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    title="Previous Month"
                  >
                    <FaChevronLeft size={11} />
                  </button>

                  <Dropdown align="end">
                    <Dropdown.Toggle 
                      variant="outline-secondary" 
                      size="sm" 
                      className="d-flex align-items-center gap-1 fw-semibold text-dark"
                      style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px' }}
                    >
                      <FaCalendarAlt size={11} className="text-danger me-1" />
                      <span>{monthNames[selectedMonth]} {selectedYear}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ maxHeight: '200px', overflowY: 'auto', minWidth: '160px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', fontSize: '0.82rem', zIndex: 1050 }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <Dropdown.Item 
                          key={i} 
                          active={selectedMonth === i}
                          onClick={() => setSelectedMonth(i)}
                        >
                          {monthNames[i]} {selectedYear}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-1"
                    style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    title="Next Month"
                  >
                    <FaChevronRight size={11} />
                  </button>
                </div>
              </div>
              <div className="card-body p-3 p-md-4">
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <h6 className="mb-3 fw-bold text-dark">Attendance Overview</h6>
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <tbody>
                          <tr>
                            <td className="text-muted">Present Days</td>
                            <td className="text-end">
                              <span className="badge bg-success fs-6">{monthlyStats.present}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Absent Days</td>
                            <td className="text-end">
                              <span className="badge bg-danger fs-6">{monthlyStats.absent}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Late Arrivals</td>
                            <td className="text-end">
                              <span className="badge bg-warning fs-6">{monthlyStats.late}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Early Departures</td>
                            <td className="text-end">
                              <span className="badge bg-info fs-6">{monthlyStats.early}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Half Days</td>
                            <td className="text-end">
                              <span className="badge bg-secondary fs-6">{monthlyStats.halfDay}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Weekly Off</td>
                            <td className="text-end">
                              <span className="badge bg-primary fs-6">{monthlyStats.weeklyOff}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <h6 className="mb-3 fw-bold text-dark">Attendance Percentage</h6>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                        <span className="fw-medium text-dark">Present</span>
                        <span className="fw-bold text-success">{monthlyStats.total > 0 ? Math.round((monthlyStats.present / monthlyStats.total) * 100) : 0}%</span>
                      </div>
                      <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          role="progressbar" 
                          style={{ width: `${monthlyStats.total > 0 ? (monthlyStats.present / monthlyStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                        <span className="fw-medium text-dark">Absent</span>
                        <span className="fw-bold text-danger">{monthlyStats.total > 0 ? Math.round((monthlyStats.absent / monthlyStats.total) * 100) : 0}%</span>
                      </div>
                      <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                        <div 
                          className="progress-bar bg-danger" 
                          role="progressbar" 
                          style={{ width: `${monthlyStats.total > 0 ? (monthlyStats.absent / monthlyStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                        <span className="fw-medium text-dark">Late</span>
                        <span className="fw-bold text-warning">{monthlyStats.total > 0 ? Math.round((monthlyStats.late / monthlyStats.total) * 100) : 0}%</span>
                      </div>
                      <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          role="progressbar" 
                          style={{ width: `${monthlyStats.total > 0 ? (monthlyStats.late / monthlyStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;