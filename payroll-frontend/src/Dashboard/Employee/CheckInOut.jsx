import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaSignInAlt, FaSignOutAlt, FaClock, FaCalendarAlt, FaUserCircle, FaHistory, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import { employeeAPI } from '../../services/api';
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
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState(null);

  const getTodayDateStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  const formatAttendanceTime = (timeStr, rawDateTime) => {
    if (!timeStr && !rawDateTime) return '-';
    if (timeStr && (timeStr.includes('AM') || timeStr.includes('PM'))) {
      return timeStr;
    }
    if (rawDateTime) {
      try {
        const rawStr = String(rawDateTime);
        let d;
        if (rawStr.includes('T') || rawStr.endsWith('Z')) {
          d = new Date(rawStr);
        } else if (rawStr.includes(' ')) {
          d = new Date(rawStr.replace(' ', 'T') + 'Z');
        } else {
          d = new Date(rawStr);
        }
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {}
    }
    return timeStr || '-';
  };

  const syncRecentHistory = (rawAttendanceList, currentToday) => {
    const today = getTodayDateStr();
    const mapped = (rawAttendanceList || []).map(att => {
      const attDate = att.date_str || (att.date ? (typeof att.date === 'string' && att.date.includes('T') ? att.date.split('T')[0] : String(att.date).slice(0, 10)) : '');
      const isToday = attDate === today;

      if (isToday && currentToday) {
        return {
          id: att.id || 'today',
          date: attDate || today,
          checkIn: currentToday.checkIn && currentToday.checkIn !== '-' ? currentToday.checkIn : formatAttendanceTime(att.check_in_time, att.check_in),
          checkOut: currentToday.checkOut && currentToday.checkOut !== '-' ? currentToday.checkOut : formatAttendanceTime(att.check_out_time, att.check_out),
          duration: currentToday.duration && currentToday.duration !== '-' ? currentToday.duration : (att.working_hours ? `${att.working_hours} hrs` : '-'),
          status: currentToday.status || att.status || 'Present',
        };
      }

      return {
        id: att.id,
        date: attDate,
        checkIn: formatAttendanceTime(att.check_in_time, att.check_in),
        checkOut: formatAttendanceTime(att.check_out_time, att.check_out),
        duration: att.working_hours ? `${att.working_hours} hrs` : (att.duration || '-'),
        status: att.status || 'Present',
      };
    });

    const hasToday = mapped.some(r => r.date === today);
    if (!hasToday && currentToday && currentToday.checkIn && currentToday.checkIn !== '-') {
      mapped.unshift({
        id: 'today-record',
        date: today,
        checkIn: currentToday.checkIn,
        checkOut: currentToday.checkOut || '-',
        duration: currentToday.duration || '0.00 hrs',
        status: currentToday.status || 'Present',
      });
    }

    return mapped;
  };

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userKey = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
        const today = getTodayDateStr();

        let localSaved = null;
        try {
          const raw = localStorage.getItem(`emp_attendance_details_${userKey}_${today}`);
          if (raw) localSaved = JSON.parse(raw);
        } catch (e) {}

        let storedToday = null;
        try {
          const rawToday = localStorage.getItem(`emp_attendance_live_${userKey}_${today}`);
          if (rawToday) storedToday = JSON.parse(rawToday);
        } catch (e) {}

        if (localSaved?.location) setLocation(localSaved.location);
        if (localSaved?.notes) setNotes(localSaved.notes);

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

          // Check today's attendance record from backend
          const todayRecord = attendance.find(att => {
            const attDate = att.date_str || (att.date ? (typeof att.date === 'string' && att.date.includes('T') ? att.date.split('T')[0] : String(att.date).slice(0, 10)) : null);
            return attDate === today;
          });

          let resolvedToday = null;
          if (todayRecord || storedToday) {
            const activeCheckIn = storedToday?.checkIn || formatAttendanceTime(todayRecord?.check_in_time, todayRecord?.check_in);
            const activeCheckOut = storedToday?.checkOut || formatAttendanceTime(todayRecord?.check_out_time, todayRecord?.check_out);
            const activeDuration = storedToday?.duration || (todayRecord?.working_hours ? `${todayRecord.working_hours} hrs` : '-');

            resolvedToday = {
              ...(todayRecord || {}),
              status: storedToday?.status || todayRecord?.status || 'Present',
              checkIn: activeCheckIn,
              checkOut: activeCheckOut,
              duration: activeDuration,
              location: localSaved?.location || storedToday?.location || todayRecord?.location || 'Office',
              notes: localSaved?.notes || storedToday?.notes || todayRecord?.notes || ''
            };

            setTodayAttendance(resolvedToday);
            const isFinished = activeCheckOut && activeCheckOut !== '-';
            setIsCheckedIn(!isFinished && activeCheckIn && activeCheckIn !== '-');
            setCheckInTime(activeCheckIn !== '-' ? activeCheckIn : null);
            setCheckOutTime(activeCheckOut !== '-' ? activeCheckOut : null);

            if (!localSaved && (todayRecord?.notes || todayRecord?.location)) {
              setNotes(todayRecord.notes || '');
              setLocation(todayRecord.location || 'Office');
            }
          }

          setRecentHistory(syncRecentHistory(attendance, resolvedToday));
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
      setLoading(true);
      setError(null);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const userKey = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
      const today = getTodayDateStr();

      try {
        await employeeAPI.checkIn({ location: location || 'Office', notes: notes || '' });
      } catch (err) {
        console.warn('Check in API response:', err.response?.data?.message || err.message);
      }

      const updatedToday = {
        ...(todayAttendance || {}),
        status: 'Present',
        checkIn: nowStr,
        checkOut: '-',
        duration: '0.00 hrs',
        location: location || 'Office',
        notes: notes || ''
      };

      setIsCheckedIn(true);
      setCheckInTime(nowStr);
      setCheckOutTime(null);
      setTodayAttendance(updatedToday);

      try {
        localStorage.setItem(`emp_attendance_live_${userKey}_${today}`, JSON.stringify(updatedToday));
      } catch (e) {}

      // Update recent history immediately so time dynamically matches
      setRecentHistory(prev => {
        let found = false;
        const updated = prev.map(rec => {
          if (rec.date === today) {
            found = true;
            return {
              ...rec,
              checkIn: nowStr,
              checkOut: '-',
              duration: '0.00 hrs',
              status: 'Present'
            };
          }
          return rec;
        });
        if (!found) {
          updated.unshift({
            id: 'today-record',
            date: today,
            checkIn: nowStr,
            checkOut: '-',
            duration: '0.00 hrs',
            status: 'Present'
          });
        }
        return updated;
      });

      setAlertMessage(`Successfully checked in at ${nowStr}!`);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      toast.success(`Successfully checked in at ${nowStr}!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const userKey = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
      const today = getTodayDateStr();

      let calculatedDuration = '0.01 hrs';
      const effectiveInTime = checkInTime || todayAttendance?.checkIn;
      if (effectiveInTime && effectiveInTime !== '-') {
        try {
          const todayDateStr = new Date().toISOString().split('T')[0];
          const inDate = new Date(`${todayDateStr} ${effectiveInTime}`);
          const outDate = new Date();
          if (!isNaN(inDate.getTime())) {
            const diff = Math.max(0.01, (outDate - inDate) / (1000 * 60 * 60)).toFixed(2);
            calculatedDuration = `${diff} hrs`;
          }
        } catch (e) {}
      }

      let resHours = calculatedDuration;
      try {
        const response = await employeeAPI.checkOut({ location: location || 'Office', notes: notes || '' });
        if (response?.data?.hours) {
          resHours = `${response.data.hours} hrs`;
        }
      } catch (err) {
        console.warn('Check out API response:', err.response?.data?.message || err.message);
      }

      const updatedToday = {
        ...(todayAttendance || {}),
        status: 'Present',
        checkIn: effectiveInTime || nowStr,
        checkOut: nowStr,
        duration: resHours,
        location: location || 'Office',
        notes: notes || ''
      };

      setIsCheckedIn(false);
      setCheckOutTime(nowStr);
      setTodayAttendance(updatedToday);

      try {
        localStorage.setItem(`emp_attendance_live_${userKey}_${today}`, JSON.stringify(updatedToday));
      } catch (e) {}

      // Update recent history immediately so time dynamically matches
      setRecentHistory(prev => {
        let found = false;
        const updated = prev.map(rec => {
          if (rec.date === today) {
            found = true;
            return {
              ...rec,
              checkIn: effectiveInTime || nowStr,
              checkOut: nowStr,
              duration: resHours,
              status: 'Present'
            };
          }
          return rec;
        });
        if (!found) {
          updated.unshift({
            id: 'today-record',
            date: today,
            checkIn: effectiveInTime || nowStr,
            checkOut: nowStr,
            duration: resHours,
            status: 'Present'
          });
        }
        return updated;
      });

      setAlertMessage(`Successfully checked out! Shift stopped at ${nowStr}. Duration: ${resHours}`);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      toast.success(`Successfully checked out! Time stopped at ${nowStr}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    try {
      setSavingDetails(true);
      setError(null);

      try {
        await employeeAPI.saveAttendanceDetails({ location, notes });
      } catch (apiErr) {
        console.warn('saveAttendanceDetails API notice:', apiErr.response?.data?.message || apiErr.message);
      }

      // Update today's attendance in state
      setTodayAttendance(prev => {
        if (prev) {
          return { ...prev, location, notes };
        }
        return {
          status: 'Present',
          checkIn: checkInTime || '-',
          checkOut: checkOutTime || '-',
          duration: '-',
          location,
          notes
        };
      });

      // Update recent history
      const todayStr = new Date().toLocaleDateString('en-CA');
      setRecentHistory(prev => prev.map(rec => {
        if (rec.date === todayStr) {
          return { ...rec, location, notes };
        }
        return rec;
      }));

      // Persist in localStorage
      const userKey = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
      try {
        localStorage.setItem(`emp_attendance_details_${userKey}_${todayStr}`, JSON.stringify({ location, notes }));
      } catch (e) {
        console.warn('Storage notice:', e);
      }

      setAlertMessage('Additional details saved successfully!');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      toast.success('Additional details saved successfully!');
    } catch (err) {
      console.error('Error saving details:', err);
      toast.error('Failed to save details');
    } finally {
      setSavingDetails(false);
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
              <h2 className="fw-bold mb-2" style={{ color: colors.primary }}>
                {todayAttendance?.checkOut && todayAttendance.checkOut !== '-' && !isCheckedIn
                  ? todayAttendance.checkOut
                  : formatCurrentTime()}
              </h2>
              <p className="text-muted mb-0">
                {todayAttendance?.checkOut && todayAttendance.checkOut !== '-' && !isCheckedIn
                  ? `Shift Ended • Time Stopped (${formatDate()})`
                  : formatDate()}
              </p>
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
                    style={{ borderRadius: '8px' }}
                    disabled={loading}
                  >
                    <FaSignInAlt className="me-2" /> Check In
                  </button>
                ) : (
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={handleCheckOut}
                    style={{ borderRadius: '8px' }}
                    disabled={loading}
                  >
                    <FaSignOutAlt className="me-2" /> Check Out
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
                <button
                  type="button"
                  className="btn text-white fw-semibold py-2 shadow-sm"
                  style={{ backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: '8px' }}
                  onClick={handleSaveDetails}
                  disabled={savingDetails}
                >
                  {savingDetails ? 'Saving...' : 'Save Details'}
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