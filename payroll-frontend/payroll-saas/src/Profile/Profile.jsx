import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaKey, FaCheckCircle, FaLock } from 'react-icons/fa';

const Profile = ({ onUpdate }) => {
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
      <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
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
    </div>
  );
};

export default Profile;

