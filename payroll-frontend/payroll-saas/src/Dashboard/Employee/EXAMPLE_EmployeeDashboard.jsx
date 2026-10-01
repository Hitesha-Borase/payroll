// Example: Employee Dashboard Implementation with API Integration
import React, { useState, useEffect } from 'react';
import { useFetchEmployeeDashboard, useFetchEmployeeProfile, useFetchEmployeeAttendance } from '../hooks/useAPI';
import { useAuth } from '../hooks/useAuth';

const EmployeeDashboardExample = () => {
  const { user, logout } = useAuth();
  const { data: dashboard, loading: dashboardLoading, error: dashboardError } = useFetchEmployeeDashboard();
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useFetchEmployeeProfile();
  const { attendance, loading: attendanceLoading, error: attendanceError, markAttendance } = useFetchEmployeeAttendance();

  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({});

  // Handle Profile Update
  const handleUpdateProfile = async () => {
    const result = await updateProfile(formData);
    if (result.success) {
      setShowProfileModal(false);
      alert('Profile updated successfully!');
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Handle Mark Attendance
  const handleMarkAttendance = async () => {
    const result = await markAttendance({
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      checkInTime: new Date(),
    });
    if (result.success) {
      alert('Attendance marked successfully!');
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>Welcome, {user?.name}!</h1>
          <p className="text-muted">Employee Dashboard</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Loading State */}
      {dashboardLoading && (
        <div className="alert alert-info">Loading dashboard data...</div>
      )}

      {/* Error State */}
      {dashboardError && (
        <div className="alert alert-danger">{dashboardError}</div>
      )}

      {/* Dashboard Content */}
      {!dashboardLoading && !dashboardError && (
        <>
          {/* Navigation Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                Attendance
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tab-pane active">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Total Salary</h5>
                        <p className="card-text">${dashboard?.totalSalary || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Days Present</h5>
                        <p className="card-text">{dashboard?.daysPresent || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Days Absent</h5>
                        <p className="card-text">{dashboard?.daysAbsent || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Pending Applications</h5>
                        <p className="card-text">{dashboard?.pendingApplications || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="tab-pane active">
                {profileLoading && <div className="alert alert-info">Loading profile...</div>}
                {profileError && <div className="alert alert-danger">{profileError}</div>}
                {profile && (
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Employee Profile</h5>
                      <div className="row mt-3">
                        <div className="col-md-6">
                          <p><strong>Name:</strong> {profile?.name}</p>
                          <p><strong>Email:</strong> {profile?.email}</p>
                          <p><strong>Phone:</strong> {profile?.phone}</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Department:</strong> {profile?.department}</p>
                          <p><strong>Position:</strong> {profile?.position}</p>
                          <p><strong>Joined:</strong> {profile?.joinDate}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary mt-3"
                        onClick={() => {
                          setFormData(profile);
                          setShowProfileModal(true);
                        }}
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="tab-pane active">
                {attendanceLoading && <div className="alert alert-info">Loading attendance...</div>}
                {attendanceError && <div className="alert alert-danger">{attendanceError}</div>}
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Mark Attendance</h5>
                    <button
                      className="btn btn-success mb-3"
                      onClick={handleMarkAttendance}
                    >
                      Mark Present
                    </button>
                  </div>
                </div>

                <div className="card mt-3">
                  <div className="card-body">
                    <h5 className="card-title">Attendance History</h5>
                    {attendance && attendance.length > 0 ? (
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check In</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map(record => (
                            <tr key={record.id}>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge bg-${record.status === 'present' ? 'success' : 'danger'}`}>
                                  {record.status}
                                </span>
                              </td>
                              <td>{new Date(record.checkInTime).toLocaleTimeString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-muted">No attendance records</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowProfileModal(false)}
                />
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData?.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData?.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData?.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateProfile}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboardExample;
