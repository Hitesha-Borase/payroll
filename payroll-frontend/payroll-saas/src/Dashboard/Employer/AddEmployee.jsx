import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaEdit, FaTrash, FaUserTie, FaUsers, FaChartLine, FaBuilding } from 'react-icons/fa';
import { employerAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';

const EmployerDashboard = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("employees");

  // State for detecting mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch employees and vendors from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch employees
        const employeesRes = await employerAPI.getMyEmployees();
        if (employeesRes?.data?.success) {
          const employeesData = employeesRes.data.data || [];
          setEmployees(employeesData.map(emp => ({
            id: emp.id,
            name: emp.user?.name || 'N/A',
            email: emp.user?.email || 'N/A',
            phone: emp.phone || 'N/A',
            joiningDate: emp.joining_date || emp.created_at || '',
            jobTitle: emp.designation || 'N/A',
            salaryAmount: emp.salary || '0'
          })));
        }

        // Fetch vendors
        const vendorsRes = await employerAPI.getMyVendors();
        if (vendorsRes?.data?.success) {
          const vendorsData = vendorsRes.data.data || [];
          setVendors(vendorsData.map(v => ({
            id: v.id,
            name: v.user?.name || v.company_name || 'N/A',
            email: v.user?.email || 'N/A',
            phone: v.phone || 'N/A',
            joiningDate: v.joining_date || v.created_at || '',
            jobTitle: v.services || v.service_type || 'N/A',
            salaryAmount: v.salary || '0'
          })));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    joiningDate: "",
    jobTitle: "",
    salaryAmount: "",
    password: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        designation: formData.jobTitle,
        salary: parseFloat(formData.salaryAmount) || 0,
        joining_date: formData.joiningDate,
      };

      if (activeTab === "employees") {
        const response = await employerAPI.addEmployee(submitData);
        if (response?.data?.success) {
          // Refresh employees list
          const employeesRes = await employerAPI.getMyEmployees();
          if (employeesRes?.data?.success) {
            const employeesData = employeesRes.data.data || [];
            setEmployees(employeesData.map(emp => ({
              id: emp.id,
              name: emp.user?.name || 'N/A',
              email: emp.user?.email || 'N/A',
              phone: emp.phone || 'N/A',
              joiningDate: emp.joining_date || emp.created_at || '',
              jobTitle: emp.designation || 'N/A',
              salaryAmount: emp.salary || '0'
            })));
          }
        } else {
          setError(response?.data?.message || 'Failed to add employee');
        }
      } else {
        const response = await employerAPI.addVendor(submitData);
        if (response?.data?.success) {
          // Refresh vendors list
          const vendorsRes = await employerAPI.getMyVendors();
          if (vendorsRes?.data?.success) {
            const vendorsData = vendorsRes.data.data || [];
            setVendors(vendorsData.map(v => ({
              id: v.id,
              name: v.user?.name || v.company_name || 'N/A',
              email: v.user?.email || 'N/A',
              phone: v.phone || 'N/A',
              joiningDate: v.joining_date || v.created_at || '',
              jobTitle: v.services || v.service_type || 'N/A',
              salaryAmount: v.salary || '0'
            })));
          }
        } else {
          setError(response?.data?.message || 'Failed to add vendor');
        }
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        joiningDate: "",
        jobTitle: "",
        salaryAmount: "",
        password: ""
      });
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    }
  };

  const handleEdit = (id) => {
    const item = activeTab === "employees"
      ? employees.find(emp => emp.id === id)
      : vendors.find(v => v.id === id);

    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        email: item.email,
        phone: item.phone,
        joiningDate: item.joiningDate,
        jobTitle: item.jobTitle,
        salaryAmount: item.salaryAmount
      });
      setShowEditModal(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.jobTitle,
        salary: parseFloat(formData.salaryAmount) || 0,
        joining_date: formData.joiningDate,
        // Add fields for vendors
        company_name: formData.name,
        contact_person: formData.name,
      };

      if (activeTab === "employees") {
        const response = await employerAPI.updateEmployee(editingItem.id, updateData);
        if (response?.data?.success) {
          // Refresh employees list
          const employeesRes = await employerAPI.getMyEmployees();
          if (employeesRes?.data?.success) {
            const employeesData = employeesRes.data.data || [];
            setEmployees(employeesData.map(emp => ({
              id: emp.id,
              name: emp.user?.name || 'N/A',
              email: emp.user?.email || 'N/A',
              phone: emp.phone || 'N/A',
              joiningDate: emp.joining_date || emp.created_at || '',
              jobTitle: emp.designation || 'N/A',
              salaryAmount: emp.salary || '0'
            })));
          }
        } else {
          setError(response?.data?.message || 'Failed to update employee');
        }
      } else {
        const vendorUpdateData = {
          ...updateData,
          service_type: formData.jobTitle,
          company_name: formData.name,
          contact_person: formData.name,
        };
        const response = await employerAPI.updateVendor(editingItem.id, vendorUpdateData);
        if (response?.data?.success) {
          // Refresh vendors list
          const vendorsRes = await employerAPI.getMyVendors();
          if (vendorsRes?.data?.success) {
            const vendorsData = vendorsRes.data.data || [];
            setVendors(vendorsData.map(v => ({
              id: v.id,
              name: v.user?.name || v.company_name || 'N/A',
              email: v.user?.email || 'N/A',
              phone: v.phone || 'N/A',
              joiningDate: v.joining_date || v.created_at || '',
              jobTitle: v.services || v.service_type || 'N/A',
              salaryAmount: v.salary || '0'
            })));
          }
        } else {
          setError(response?.data?.message || 'Failed to update vendor');
        }
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        joiningDate: "",
        jobTitle: "",
        salaryAmount: ""
      });
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab === "employees" ? "employee" : "vendor"}?`)) {
      try {
        setError(null);
        if (activeTab === "employees") {
          const response = await employerAPI.deleteEmployee(id);
          if (response?.data?.success) {
            // Refresh employees list
            const employeesRes = await employerAPI.getMyEmployees();
            if (employeesRes?.data?.success) {
              const employeesData = employeesRes.data.data || [];
              setEmployees(employeesData.map(emp => ({
                id: emp.id,
                name: emp.user?.name || 'N/A',
                email: emp.user?.email || 'N/A',
                phone: emp.phone || 'N/A',
                joiningDate: emp.joining_date || emp.created_at || '',
                jobTitle: emp.designation || 'N/A',
                salaryAmount: emp.salary || '0'
              })));
            }
          } else {
            setError(response?.data?.message || 'Failed to delete employee');
          }
        } else {
          // Note: Vendor delete API might not exist, handle accordingly
          setVendors(vendors.filter(vendor => vendor.id !== id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    return activeTab === "employees" ? employees : vendors;
  };

  // Calculate unique departments based on job titles
  const uniqueDepartments = [...new Set(getCurrentData().map(item => item.jobTitle))].length;

  const customStyles = {
    primaryRed: '#C62828',
    darkRed: '#B71C1C',
    pureWhite: '#FFFFFF',
    blackText: '#000000',
    darkGrayText: '#4A4A4A',
    lightGrayBorder: '#E2E2E2',
    lightBg: '#F9F9F9'
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{}}>
      {error && (
        <Alert variant="danger" className="mb-4" style={{ margin: '15px' }}>
          {error}
        </Alert>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm mb-4" style={{ borderBottom: `1px solid ${customStyles.lightGrayBorder}` }}>
        <div className="container-fluid p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="me-2 me-md-3" style={{ width: '35px', height: '35px', backgroundColor: customStyles.primaryRed, borderRadius: '6px' }}></div>
              <h1 className="h3 h2-md mb-0" style={{ color: customStyles.darkRed }}>
                {activeTab === "employees" ? "Employee" : "Vendor"} Management
              </h1>
            </div>
            <button
              className="btn d-flex align-items-center text-white px-3 py-2"
              onClick={() => setShowModal(true)}
              style={{ backgroundColor: customStyles.primaryRed, fontSize: '0.875rem' }}
            >
              <FaPlus className="me-2" /> Add {activeTab === "employees" ? "Employee" : "Vendor"}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container-fluid p-3 p-md-4">
        <div className="card shadow-sm mb-4" style={{ borderRadius: "10px", border: `1px solid ${customStyles.lightGrayBorder}` }}>
          <div className="card-body p-0">
            <ul className="nav nav-tabs" style={{ borderBottom: `1px solid ${customStyles.lightGrayBorder}` }}>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "employees" ? "active" : ""}`}
                  onClick={() => setActiveTab("employees")}
                  style={{
                    color: activeTab === "employees" ? customStyles.pureWhite : customStyles.primaryRed,
                    backgroundColor: activeTab === "employees" ? customStyles.primaryRed : "transparent",
                    border: "none",
                    borderBottom: activeTab === "employees" ? `3px solid ${customStyles.darkRed}` : "none",
                    fontWeight: "bold",
                    borderRadius: "0"
                  }}
                >
                  Employees
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "vendors" ? "active" : ""}`}
                  onClick={() => setActiveTab("vendors")}
                  style={{
                    color: activeTab === "vendors" ? customStyles.pureWhite : customStyles.primaryRed,
                    backgroundColor: activeTab === "vendors" ? customStyles.primaryRed : "transparent",
                    border: "none",
                    borderBottom: activeTab === "vendors" ? `3px solid ${customStyles.darkRed}` : "none",
                    fontWeight: "bold",
                    borderRadius: "0"
                  }}
                >
                  Vendors
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid p-3 p-md-4">
        {/* Employee/Vendor Cards */}
        <div className="row g-3 g-md-4 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small" style={{ color: customStyles.darkGrayText }}>
                      Total {activeTab === "employees" ? "Employees" : "Vendors"}
                    </h6>
                    <h3 className="card-title mb-0" style={{ color: customStyles.blackText }}>
                      {getCurrentData().length}
                    </h3>
                  </div>
                  <FaUsers className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small" style={{ color: customStyles.darkGrayText }}>New This Month</h6>
                    <h3 className="card-title mb-0" style={{ color: customStyles.blackText }}>2</h3>
                  </div>
                  <FaChartLine className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small" style={{ color: customStyles.darkGrayText }}>
                      Active {activeTab === "employees" ? "Employees" : "Vendors"}
                    </h6>
                    <h3 className="card-title mb-0" style={{ color: customStyles.blackText }}>
                      {getCurrentData().length}
                    </h3>
                  </div>
                  <FaUserTie className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small" style={{ color: customStyles.darkGrayText }}>Departments</h6>
                    <h3 className="card-title mb-0" style={{ color: customStyles.blackText }}>{uniqueDepartments}</h3>
                  </div>
                  <FaBuilding className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee/Vendor List */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white" style={{ borderBottom: `1px solid ${customStyles.lightGrayBorder}` }}>
            <h5 className="mb-0" style={{ color: customStyles.blackText }}>
              {activeTab === "employees" ? "Employee" : "Vendor"} List
            </h5>
          </div>
          <div className="card-body p-0">
            {/* Desktop Table View */}
            <div className="d-none d-md-block">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr style={{ backgroundColor: customStyles.lightBg }}>
                      <th style={{ color: customStyles.darkGrayText }}>Name</th>
                      <th style={{ color: customStyles.darkGrayText }}>Email</th>
                      <th style={{ color: customStyles.darkGrayText }}>Phone</th>
                      <th style={{ color: customStyles.darkGrayText }}>Joining Date</th>
                      <th style={{ color: customStyles.darkGrayText }}>Job Title</th>
                      <th style={{ color: customStyles.darkGrayText }}>Salary</th>
                      <th style={{ color: customStyles.darkGrayText }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentData().map(item => (
                      <tr key={item.id}>
                        <td style={{ color: customStyles.blackText }}>{item.name}</td>
                        <td style={{ color: customStyles.blackText }}>{item.email}</td>
                        <td style={{ color: customStyles.blackText }}>{item.phone}</td>
                        <td style={{ color: customStyles.blackText }}>{item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ color: customStyles.blackText }}>{item.jobTitle}</td>
                        <td style={{ color: customStyles.blackText }}>${item.salaryAmount}</td>
                        <td>
                          <button
                            className="btn btn-sm me-2"
                            onClick={() => handleEdit(item.id)}
                            style={{ color: customStyles.primaryRed, backgroundColor: 'transparent' }}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDelete(item.id)}
                            style={{ color: customStyles.primaryRed, backgroundColor: 'transparent' }}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="d-md-none">
              {getCurrentData().map(item => (
                <div key={item.id} className="border-bottom p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0" style={{ color: customStyles.blackText }}>{item.name}</h6>
                    <div>
                      <button
                        className="btn btn-sm me-1"
                        onClick={() => handleEdit(item.id)}
                        style={{ color: customStyles.primaryRed, backgroundColor: 'transparent', padding: '0.25rem 0.5rem' }}
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleDelete(item.id)}
                        style={{ color: customStyles.primaryRed, backgroundColor: 'transparent', padding: '0.25rem 0.5rem' }}
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="row g-2 small">
                    <div className="col-6">
                      <span style={{ color: customStyles.darkGrayText }}>Email:</span>
                      <div style={{ color: customStyles.blackText }}>{item.email}</div>
                    </div>
                    <div className="col-6">
                      <span style={{ color: customStyles.darkGrayText }}>Phone:</span>
                      <div style={{ color: customStyles.blackText }}>{item.phone}</div>
                    </div>
                    <div className="col-6">
                      <span style={{ color: customStyles.darkGrayText }}>Joining:</span>
                      <div style={{ color: customStyles.blackText }}>{item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div className="col-6">
                      <span style={{ color: customStyles.darkGrayText }}>Job:</span>
                      <div style={{ color: customStyles.blackText }}>{item.jobTitle}</div>
                    </div>
                    <div className="col-6">
                      <span style={{ color: customStyles.darkGrayText }}>Salary:</span>
                      <div style={{ color: customStyles.blackText }}>${item.salaryAmount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee/Vendor Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`} style={{
            maxWidth: isMobile ? '95%' : '600px',
            width: isMobile ? '95%' : '600px',
            margin: isMobile ? '5px auto' : '1.75rem auto'
          }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: customStyles.primaryRed, color: customStyles.pureWhite, padding: isMobile ? '8px 12px' : '' }}>
                <h5 className="modal-title" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>
                  Add New {activeTab === "employees" ? "Employee" : "Vendor"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{
                  padding: isMobile ? '8px' : '15px',
                  maxHeight: isMobile ? '70vh' : 'auto',
                  overflowY: isMobile ? 'auto' : 'visible'
                }}>
                  <div className="row g-2">
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Name</label>
                      <input
                        type="text"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Email</label>
                      <input
                        type="email"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Password</label>
                      <input
                        type="password"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Phone</label>
                      <input
                        type="tel"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Joining Date</label>
                      <input
                        type="date"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Job Title</label>
                      <input
                        type="text"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Salary Amount</label>
                      <input
                        type="number"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="salaryAmount"
                        value={formData.salaryAmount}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: isMobile ? '8px 12px' : '' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)} style={{ backgroundColor: customStyles.lightGrayBorder, color: customStyles.blackText, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Cancel</button>
                  <button type="submit" className="btn btn-sm text-white" style={{ backgroundColor: customStyles.primaryRed, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                    Add {activeTab === "employees" ? "Employee" : "Vendor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee/Vendor Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`} style={{
            maxWidth: isMobile ? '95%' : '600px',
            width: isMobile ? '95%' : '600px',
            margin: isMobile ? '5px auto' : '1.75rem auto'
          }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: customStyles.primaryRed, color: customStyles.pureWhite, padding: isMobile ? '8px 12px' : '' }}>
                <h5 className="modal-title" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>
                  Edit {activeTab === "employees" ? "Employee" : "Vendor"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body" style={{
                  padding: isMobile ? '8px' : '15px',
                  maxHeight: isMobile ? '70vh' : 'auto',
                  overflowY: isMobile ? 'auto' : 'visible'
                }}>
                  <div className="row g-2">
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Name</label>
                      <input
                        type="text"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Email</label>
                      <input
                        type="email"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Phone</label>
                      <input
                        type="tel"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Joining Date</label>
                      <input
                        type="date"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Job Title</label>
                      <input
                        type="text"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                    <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-2'}>
                      <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Salary Amount</label>
                      <input
                        type="number"
                        className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                        name="salaryAmount"
                        value={formData.salaryAmount}
                        onChange={handleInputChange}
                        style={{ borderColor: customStyles.lightGrayBorder, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: isMobile ? '8px 12px' : '' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setShowEditModal(false)} style={{ backgroundColor: customStyles.lightGrayBorder, color: customStyles.blackText, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Cancel</button>
                  <button type="submit" className="btn btn-sm text-white" style={{ backgroundColor: customStyles.primaryRed, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                    Update {activeTab === "employees" ? "Employee" : "Vendor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;