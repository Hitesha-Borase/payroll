// Example: Employer Dashboard Implementation with API Integration
import React, { useState } from 'react';
import { useFetchEmployerJobs, useFetchJobApplications } from '../hooks/useAPI';
import { useAuth } from '../hooks/useAuth';

const EmployerDashboardExample = () => {
  const { user, logout } = useAuth();
  const { 
    jobs, 
    loading: jobsLoading, 
    error: jobsError, 
    createJob, 
    updateJob, 
    deleteJob 
  } = useFetchEmployerJobs();

  const [activeTab, setActiveTab] = useState('jobs');
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    requirements: '',
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      salary: '',
      requirements: '',
    });
    setSelectedJobId(null);
  };

  // Handle Create/Update Job
  const handleSaveJob = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (selectedJobId) {
      // Update existing job
      const result = await updateJob(selectedJobId, formData);
      if (result.success) {
        alert('Job updated successfully!');
        setShowJobModal(false);
        resetForm();
      } else {
        alert('Error: ' + result.error);
      }
    } else {
      // Create new job
      const result = await createJob(formData);
      if (result.success) {
        alert('Job created successfully!');
        setShowJobModal(false);
        resetForm();
      } else {
        alert('Error: ' + result.error);
      }
    }
  };

  // Handle Delete Job
  const handleDeleteJob = async (jobId) => {
    if (confirm('Are you sure you want to delete this job?')) {
      const result = await deleteJob(jobId);
      if (result.success) {
        alert('Job deleted successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    }
  };

  // Handle Edit Job
  const handleEditJob = (job) => {
    setFormData(job);
    setSelectedJobId(job.id);
    setShowJobModal(true);
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
          <p className="text-muted">Employer Dashboard</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Job Postings
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            Applications
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="tab-pane active">
            {jobsLoading && <div className="alert alert-info">Loading jobs...</div>}
            {jobsError && <div className="alert alert-danger">{jobsError}</div>}

            <div className="mb-3">
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowJobModal(true);
                }}
              >
                Create New Job
              </button>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="row">
                {jobs.map(job => (
                  <div key={job.id} className="col-md-6 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">{job.title}</h5>
                        <p className="card-text">{job.description.substring(0, 100)}...</p>
                        <div className="mb-2">
                          <span className="badge bg-info">{job.location}</span>
                          <span className="badge bg-success ms-2">${job.salary}</span>
                        </div>
                        <small className="text-muted">
                          Posted: {new Date(job.createdAt).toLocaleDateString()}
                        </small>
                        <div className="mt-3">
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditJob(job)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            Delete
                          </button>
                          <button
                            className="btn btn-sm btn-info ms-2"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setActiveTab('applications');
                            }}
                          >
                            View Applications
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">No jobs posted yet</div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <JobApplicationsTab jobId={selectedJobId} />
        )}
      </div>

      {/* Job Modal */}
      {showJobModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedJobId ? 'Edit Job' : 'Create New Job'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowJobModal(false)}
                />
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Job Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Senior Developer"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Job description..."
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Location *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g., New York, NY"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Salary Range</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          placeholder="e.g., 100000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Requirements</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Required qualifications..."
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJobModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveJob}
                >
                  Save Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Job Applications Component
const JobApplicationsTab = ({ jobId }) => {
  const { applications, loading, error, updateApplicationStatus } = useFetchJobApplications(jobId);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    const result = await updateApplicationStatus(applicationId, newStatus);
    if (result.success) {
      alert('Status updated successfully!');
    } else {
      alert('Error: ' + result.error);
    }
  };

  if (!jobId) {
    return <div className="alert alert-info">Select a job to view applications</div>;
  }

  if (loading) return <div className="alert alert-info">Loading applications...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      {applications && applications.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Job Applications</h5>
            <table className="table table-striped mt-3">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>{app.applicantName}</td>
                    <td>{app.applicantEmail}</td>
                    <td>
                      <span className={`badge bg-${
                        app.status === 'approved' ? 'success' : 
                        app.status === 'rejected' ? 'danger' : 
                        'warning'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success me-1"
                        onClick={() => handleUpdateStatus(app.id, 'approved')}
                        disabled={app.status !== 'pending'}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        disabled={app.status !== 'pending'}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">No applications yet</div>
      )}
    </div>
  );
};

export default EmployerDashboardExample;
