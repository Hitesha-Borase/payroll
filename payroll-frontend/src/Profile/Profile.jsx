import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaKey, FaCheckCircle, FaLock, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';

const Profile = ({ onUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();
      if (response.data.success) {
        const user = response.data.data;
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || ''
        }));
      }
    } catch (error) {
      console.error("Failed to load profile", error);
      toast.error('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const response = await profileAPI.updateProfile({
        name: formData.name,
        phone: formData.phone
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        if (onUpdate) onUpdate(response.data.data);
      }
    } catch (error) {
      console.error("Profile update failed", error);
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const currentRole = (formData.role || user?.role || '').toLowerCase();
  const isCompanyAdmin = currentRole === 'employer' || currentRole === 'admin' || currentRole === 'superadmin';
  const isEmployee = currentRole === 'employee';

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error('Please enter your current password to confirm account deletion.');
      return;
    }

    try {
      setDeletingAccount(true);
      const response = await profileAPI.deleteAccount({ password: deletePassword });
      if (response.data.success) {
        toast.success(response.data.message || 'Account successfully deleted.');
        setShowDeleteModal(false);
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 1200);
      } else {
        toast.error(response.data.message || 'Account deletion failed.');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account. Please verify your password.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSavingPassword(true);
      const response = await profileAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      console.error("Password update failed", error);
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-danger" role="status" style={{ width: '2rem', height: '2rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2 mb-0 small">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-3 p-sm-4" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Title */}
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
          <FaUser style={{ color: '#C62828', fontSize: '1rem' }} />
        </div>
        <div>
          <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.25rem' }}>User Profile</h4>
          <p className="text-muted mb-0 small" style={{ fontSize: '0.78rem' }}>Manage your personal details and security credentials</p>
        </div>
      </div>

      {/* Personal Details Form */}
      <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header bg-white py-2.5 px-3 px-sm-4 border-bottom">
          <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>Personal Details</span>
        </div>
        <div className="card-body p-3 p-sm-4">
          <form onSubmit={handleProfileUpdate}>
            <div className="row g-2.5 g-sm-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px' }}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-secondary small mb-1">Email</label>
                <input
                  type="email"
                  className="form-control bg-light"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px' }}
                  name="email"
                  value={formData.email}
                  disabled
                  readOnly
                  title="Email cannot be changed directly"
                />
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>Email cannot be changed directly.</small>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-secondary small mb-1">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px' }}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold text-secondary small mb-1">Role</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px', fontWeight: 600, color: '#C62828' }}
                  value={formData.role ? formData.role.toUpperCase() : 'USER'}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
              <button
                type="submit"
                className="btn text-white fw-semibold d-inline-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#C62828', borderRadius: '8px', padding: '8px 20px', fontSize: '0.88rem', minWidth: '130px' }}
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Form */}
      <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header bg-white py-2.5 px-3 px-sm-4 border-bottom">
          <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>Security &amp; Password</span>
        </div>
        <div className="card-body p-3 p-sm-4">
          <form onSubmit={handlePasswordUpdate}>
            <div className="row g-2.5 g-sm-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  Current Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px' }}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Current password"
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  New Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px' }}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  Confirm New Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '9px 12px' }}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
              <button
                type="submit"
                className="btn btn-outline-danger fw-semibold d-inline-flex align-items-center justify-content-center"
                style={{ borderRadius: '8px', padding: '8px 20px', fontSize: '0.88rem', minWidth: '150px' }}
                disabled={savingPassword}
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Google Play Compliant Account Deletion (Danger Zone) */}
      <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden', borderLeft: '4px solid #DC2626' }}>
        <div className="card-header bg-white py-2.5 px-3 px-sm-4 border-bottom d-flex align-items-center gap-2">
          <FaExclamationTriangle className="text-danger" />
          <span className="fw-bold text-danger" style={{ fontSize: '0.95rem' }}>
            {isCompanyAdmin ? 'Danger Zone: Delete Organization Account' : isEmployee ? 'Danger Zone: Delete Employee Account' : 'Danger Zone: Delete Account'}
          </span>
        </div>
        <div className="card-body p-3 p-sm-4">
          <p className="text-secondary small mb-2" style={{ fontSize: '0.85rem' }}>
            {isCompanyAdmin
              ? 'Permanently deactivate your organization account and anonymize member profiles. All active subscriptions will be cancelled. In accordance with Google Play Store data safety standards and statutory labor and taxation compliance, historical statutory payroll records, invoices, and audit logs are retained as required by regulatory mandates.'
              : isEmployee
              ? 'Permanently delete your personal employee login credentials and personal contact identifiers (name, email, phone, bank details). Your company organization and other members remain unaffected. Historical statutory payroll and tax disbursement records are retained by your organization as required by labor law.'
              : 'Permanently delete your personal profile, credentials, and personal contact identifiers. In accordance with data safety standards, personal data will be anonymized and login access deactivated.'}
          </p>
          <div className="d-flex justify-content-start mt-2">
            <button
              type="button"
              className="btn btn-danger fw-semibold d-inline-flex align-items-center gap-2"
              style={{ borderRadius: '8px', padding: '8px 18px', fontSize: '0.85rem' }}
              onClick={() => {
                setDeletePassword('');
                setShowDeleteModal(true);
              }}
            >
              <FaTrashAlt />
              {isCompanyAdmin ? 'Delete Organization Account' : isEmployee ? 'Delete Employee Account' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header border-bottom py-3 px-4 bg-danger text-white" style={{ borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
                <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
                  <FaExclamationTriangle />
                  Confirm Account Deletion
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  aria-label="Close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                />
              </div>
              <div className="modal-body p-4">
                <div className="alert alert-danger py-2 px-3 small mb-3" style={{ fontSize: '0.82rem' }}>
                  <strong>Warning:</strong> This action is permanent and cannot be reversed.
                </div>
                <p className="text-secondary small mb-3" style={{ fontSize: '0.85rem' }}>
                  By confirming below:
                </p>
                <ul className="text-secondary small ps-3 mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                  <li>Your user login and authentication access will be immediately revoked.</li>
                  <li>Your personal contact identifiers (name, email, phone) will be permanently scrubbed and anonymized.</li>
                  <li>Any active subscription will be terminated.</li>
                  <li>Historical payroll statements and tax receipts will remain securely archived solely for legal and regulatory compliance.</li>
                </ul>

                <form onSubmit={handleDeleteAccount}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small mb-1">
                      Enter Your Current Password to Confirm <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      style={{ borderRadius: '8px', fontSize: '0.88rem' }}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-secondary fw-semibold"
                      style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '8px 16px' }}
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deletingAccount}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger fw-semibold d-inline-flex align-items-center gap-2"
                      style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '8px 18px' }}
                      disabled={deletingAccount || !deletePassword}
                    >
                      {deletingAccount ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrashAlt />
                          Permanently Delete Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

