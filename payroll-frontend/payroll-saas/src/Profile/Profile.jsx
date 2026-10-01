import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import toast from 'react-hot-toast';

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
      const response = await profileAPI.updateProfile({
        name: formData.name,
        phone: formData.phone
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        if (onUpdate) onUpdate(response.data.data); // Notify parent if needed
      }
    } catch (error) {
      console.error("Profile update failed", error);
      toast.error(error.response?.data?.message || 'Failed to update profile.');
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
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading profile...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4">User Profile</h2>

      {/* Profile Info */}
      <h4 className="mb-3 text-muted">Personal Details</h4>
      <form onSubmit={handleProfileUpdate} className="mb-5 p-4 border rounded shadow-sm bg-white">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Full Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control bg-light"
              name="email"
              value={formData.email}
              disabled
              readOnly
              title="Email cannot be changed"
            />
            <small className="text-muted">Email cannot be changed directly.</small>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Phone</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Role</label>
            <input
              type="text"
              className="form-control bg-light"
              value={formData.role.toUpperCase()}
              disabled
              readOnly
            />
          </div>
        </div>

        <div className="text-end">
          <button type="submit" className="btn btn-primary px-4">Save Changes</button>
        </div>
      </form>

      {/* Password Update */}
      <h4 className="mb-3 text-muted">Security</h4>
      <form onSubmit={handlePasswordUpdate} className="p-4 border rounded shadow-sm bg-white">
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label fw-bold">Current Password</label>
            <input
              type="password"
              className="form-control"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-bold">New Password</label>
            <input
              type="password"
              className="form-control"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-bold">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="text-end">
          <button type="submit" className="btn btn-danger px-4">Update Password</button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
