import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaSignInAlt, FaSignOutAlt, FaClock, FaCalendarAlt, FaUserCircle, FaHistory, FaMapMarkerAlt } from 'react-icons/fa';
import { employeeAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';

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
  early: '#3498db'
};

const CheckInOut = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [location, setLocation] = useState('Office');
  const [notes, setNotes] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch attendance data
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

        // Fetch attendance history
        const attendanceRes = await employeeAPI.getAttendance();
        if (attendanceRes?.data?.success) {
          const attendance = attendanceRes.data.data || [];
          setRecentHistory(attendance.map(att => ({
            id: att.id,
            date: att.date_str || att.date,
            checkIn: att.check_in_time || '-',
            checkOut: att.check_out_time || '-',
            duration: att.working_hours ? `${att.working_hours} hrs` : '-',
            status: att.status || 'Present',
          })));

          // Check today's attendance
          const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
          const todayRecord = attendance.find(att => {
            const attDate = att.date_str || (att.date ? new Date(att.date).toLocaleDateString('en-CA') : null);
            return attDate === today;
          });

          if (todayRecord) {
            setTodayAttendance({
              ...todayRecord,
              checkIn: todayRecord.check_in_time || '-',
              checkOut: todayRecord.check_out_time || '-',
              duration: todayRecord.working_hours ? `${todayRecord.working_hours} hrs` : '-'
            });
            setIsCheckedIn(todayRecord.check_out ? false : true);
            setCheckInTime(todayRecord.check_in_time);
            setCheckOutTime(todayRecord.check_out_time);
            setNotes(todayRecord.notes || '');
            setLocation(todayRecord.location || 'Office');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
  }, []);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCheckIn = async () => {
    try {
      setError(null);
      const response = await employeeAPI.checkIn({ location, notes });
      if (response?.data?.success) {
        setIsCheckedIn(true);
        // Refresh attendance history
        const attendanceRes = await employeeAPI.getAttendance();
        if (attendanceRes?.data?.success) {
          const attendance = attendanceRes.data.data || [];
          setRecentHistory(attendance.map(att => ({
            id: att.id,
            date: att.date_str || att.date,
            checkIn: att.check_in_time || '-',
            checkOut: att.check_out_time || '-',
            duration: att.working_hours ? `${att.working_hours} hrs` : '-',
            status: att.status || 'Present',
          })));

          const today = new Date().toLocaleDateString('en-CA');
          const todayRecord = attendance.find(att => (att.date_str || new Date(att.date).toLocaleDateString('en-CA')) === today);

          if (todayRecord) {
            setTodayAttendance({
              ...todayRecord,
              checkIn: todayRecord.check_in_time || '-',
              checkOut: todayRecord.check_out_time || '-',
              duration: todayRecord.working_hours ? `${todayRecord.working_hours} hrs` : '-'
            });
            setCheckInTime(todayRecord.check_in_time);
          }
        }
        setAlertMessage(`Successfully checked in!`);
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      setError(null);
      const response = await employeeAPI.checkOut({ location, notes });
      if (response?.data?.success) {
        setIsCheckedIn(false);
        // setCheckOutTime(new Date().toLocaleTimeString()); // Will be updated from fetch

        // Refresh attendance history
        const attendanceRes = await employeeAPI.getAttendance();
        if (attendanceRes?.data?.success) {
          const attendance = attendanceRes.data.data || [];
          setRecentHistory(attendance.map(att => ({
            id: att.id,
            date: att.date_str || att.date,
            checkIn: att.check_in_time || '-',
            checkOut: att.check_out_time || '-',
            duration: att.working_hours ? `${att.working_hours} hrs` : '-',
            status: att.status || 'Present',
          })));

          const today = new Date().toLocaleDateString('en-CA');
          const todayRecord = attendance.find(att => (att.date_str || new Date(att.date).toLocaleDateString('en-CA')) === today);

          if (todayRecord) {
            setTodayAttendance({
              ...todayRecord,
              checkIn: todayRecord.check_in_time || '-',
              checkOut: todayRecord.check_out_time || '-',
              duration: todayRecord.working_hours ? `${todayRecord.working_hours} hrs` : '-'
            });
            setCheckOutTime(todayRecord.check_out_time);
          }
        }

        setAlertMessage(`Successfully checked out! Working duration: ${response.data.hours} hours`);
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
    }
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="alert alert-success alert-dismissible fade show position-fixed" style={{ top: '20px', right: '20px', zIndex: 9999, minWidth: '300px' }} role="alert">
          <strong>Success!</strong> {alertMessage}
          <button type="button" className="btn-close" onClick={() => setShowSuccessAlert(false)}></button>
        </div>
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
                  <h1 className="fw-bold mb-1" style={{ color: colors.primary }}>Check In / Check Out</h1>
                  <p className="text-muted mb-0">{employeeName} | {employeeId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h2 className="fw-bold mb-2" style={{ color: colors.primary }}>{formatCurrentTime()}</h2>
              <p className="text-muted mb-0">{formatDate()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Check In/Out Section */}
      <div className="row mb-4">
        <div className="col-12 col-lg-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-4">Today's Attendance</h5>

              {todayAttendance ? (
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Status:</span>
                    <span className={`badge ${todayAttendance.status === 'Present' ? 'bg-success' : todayAttendance.status === 'Late' ? 'bg-warning' : todayAttendance.status === 'Early' ? 'bg-info' : 'bg-secondary'}`}>
                      {todayAttendance.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Check In:</span>
                    <span>{todayAttendance.checkIn}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Check Out:</span>
                    <span>{todayAttendance.checkOut}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Duration:</span>
                    <span>{todayAttendance.duration}</span>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <span>Location:</span>
                    <span className="text-primary">{todayAttendance.location || 'N/A'}</span>
                  </div>
                  {todayAttendance.notes && (
                    <div className="mt-2">
                      <small className="text-muted d-block">Notes:</small>
                      <div className="p-2 bg-light rounded" style={{ fontSize: '0.9rem' }}>
                        {todayAttendance.notes}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4 text-center">
                  <p className="text-muted">You haven't checked in today</p>
                </div>
              )}

              <div className="d-grid gap-2">
                {!isCheckedIn ? (
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleCheckIn}
                  >
                    <FaSignInAlt className="me-2" />Check In
                  </button>
                ) : (
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={handleCheckOut}
                  >
                    <FaSignOutAlt className="me-2" />Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-4">Additional Details</h5>

              <div className="mb-3">
                <label htmlFor="location" className="form-label">Location</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaMapMarkerAlt />
                  </span>
                  <select
                    className="form-select"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="Office">Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Client Site">Client Site</option>
                    <option value="Field Work">Field Work</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  id="notes"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your work today..."
                ></textarea>
              </div>

              <div className="d-grid">
                <button className="btn btn-outline-primary">
                  Save Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <h5 className="mb-0 fw-bold" style={{ fontSize: '1rem', color: '#0F172A' }}>
                <FaHistory className="me-2 text-danger" />Recent History
              </h5>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                {recentHistory.length} Records
              </span>
            </div>
            <div className="card-body p-0">
              {recentHistory.length === 0 ? (
                <div className="text-center py-5">
                  <FaHistory size={40} className="text-muted mb-2" />
                  <h6 className="fw-semibold text-dark">No Recent History</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>No attendance history available yet.</p>
                </div>
              ) : isMobile ? (
                /* MOBILE HISTORY CARDS */
                <div className="p-3 d-flex flex-column gap-2">
                  {recentHistory.map((record) => (
                    <div key={record.id} className="p-3 rounded border bg-light" style={{ borderColor: '#E2E8F0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{record.date}</strong>
                        <span className={`badge ${record.status === 'Present' ? 'bg-success' : record.status === 'Late' || record.status === 'late' ? 'bg-warning' : record.status === 'Early' ? 'bg-info' : 'bg-secondary'} px-2 py-1`} style={{ fontSize: '0.75rem' }}>
                          {record.status}
                        </span>
                      </div>
                      <div className="row g-2" style={{ fontSize: '0.82rem' }}>
                        <div className="col-6">
                          <span className="text-muted d-block">Check In:</span>
                          <div className="d-flex align-items-center text-dark fw-medium">
                            <FaSignInAlt className="me-1 text-success" /> {record.checkIn}
                          </div>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Check Out:</span>
                          <div className="d-flex align-items-center text-dark fw-medium">
                            <FaSignOutAlt className="me-1 text-danger" /> {record.checkOut}
                          </div>
                        </div>
                        <div className="col-12 mt-2">
                          <span className="text-muted d-block">Working Hours:</span>
                          <span className="text-dark fw-medium">{record.duration}</span>
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
                        <th className="py-3">In</th>
                        <th className="py-3">Out</th>
                        <th className="py-3">Working Hours</th>
                        <th className="pe-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.88rem' }}>
                      {recentHistory.map((record) => (
                        <tr key={record.id}>
                          <td className="ps-3 fw-medium text-dark">{record.date}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaSignInAlt className="me-2 text-success" />
                              {record.checkIn}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaSignOutAlt className="me-2 text-danger" />
                              {record.checkOut}
                            </div>
                          </td>
                          <td className="fw-medium">{record.duration}</td>
                          <td className="pe-3">
                            <span className={`badge ${record.status === 'Present' ? 'bg-success' : record.status === 'Late' || record.status === 'late' ? 'bg-warning' : record.status === 'Early' ? 'bg-info' : 'bg-secondary'}`}>
                              {record.status}
                            </span>
                          </td>
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
    </div>
  );
};

export default CheckInOut;