import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaEdit, FaTrash, FaUserTie, FaUsers, FaChartLine, FaBuilding, FaSyncAlt } from 'react-icons/fa';
import { employerAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

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

  // Storage key helpers for vendors
  const getVendorStorageKey = () => {
    const user = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
    return `employer_vendors_${user}`;
  };

  const getSavedVendors = () => {
    try {
      const key = getVendorStorageKey();
      const local = localStorage.getItem(key) || localStorage.getItem('employer_custom_vendors');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  };

  const saveVendorsLocally = (vendorList) => {
    try {
      const key = getVendorStorageKey();
      localStorage.setItem(key, JSON.stringify(vendorList));
      localStorage.setItem('employer_custom_vendors', JSON.stringify(vendorList));
    } catch (e) {
      console.warn('Failed to save vendors in localStorage:', e);
    }
  };

  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState(() => getSavedVendors());
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [editModalError, setEditModalError] = useState(null);

  // Fetch employees from API
  const fetchEmployees = async (showTabLoading = true) => {
    try {
      if (showTabLoading) setTabLoading(true);
      setError(null);
      const employeesRes = await employerAPI.getMyEmployees();
      const raw = employeesRes?.data;
      let employeesData = [];
      if (Array.isArray(raw)) {
        employeesData = raw;
      } else if (Array.isArray(raw?.data)) {
        employeesData = raw.data;
      } else if (Array.isArray(raw?.employees)) {
        employeesData = raw.employees;
      }

      if (employeesData) {
        setEmployees(employeesData.map(emp => ({
          id: emp.id,
          name: emp.user?.name || emp.name || 'N/A',
          email: emp.user?.email || emp.email || 'N/A',
          phone: emp.phone || emp.user?.phone || 'N/A',
          joiningDate: emp.joining_date || emp.created_at || '',
          jobTitle: emp.designation || emp.job_title || 'N/A',
          salaryAmount: emp.salary || '0',
          status: emp.user?.status || emp.status || 'active'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  // Fetch vendors from API
  const fetchVendors = async (showTabLoading = true) => {
    try {
      if (showTabLoading) setTabLoading(true);
      setError(null);

      const localVendors = getSavedVendors();
      let formattedApiVendors = [];

      try {
        const vendorsRes = await employerAPI.getMyVendors();
        const raw = vendorsRes?.data;
        let apiVendors = [];
        if (Array.isArray(raw)) {
          apiVendors = raw;
        } else if (Array.isArray(raw?.data)) {
          apiVendors = raw.data;
        } else if (Array.isArray(raw?.vendors)) {
          apiVendors = raw.vendors;
        } else if (Array.isArray(raw?.data?.vendors)) {
          apiVendors = raw.data.vendors;
        }

        formattedApiVendors = apiVendors.map(v => ({
          id: v.id,
          name: v.user?.name || v.contact_person || v.company_name || v.name || 'N/A',
          companyName: v.company_name || v.name || 'N/A',
          email: v.user?.email || v.email || 'N/A',
          phone: v.phone || v.user?.phone || 'N/A',
          joiningDate: v.joining_date || v.created_at || '',
          jobTitle: v.services || v.service_type || v.job_title || 'N/A',
          salaryAmount: v.salary || '0',
          status: v.user?.status || v.status || 'active'
        }));
      } catch (apiErr) {
        console.warn('Failed to fetch vendors from API, falling back to local cache:', apiErr);
      }

      // Merge API vendors with locally stored/created vendors so created vendors are never lost
      // localVendors takes precedence so recent edits (name, phone, payout, role) are not reverted
      const mergedVendors = formattedApiVendors.map(apiV => {
        const localMatch = localVendors.find(loc => 
          (loc.id && apiV.id && String(loc.id) === String(apiV.id)) ||
          (loc.email && apiV.email && loc.email.toLowerCase() === apiV.email.toLowerCase())
        );
        return localMatch ? { ...apiV, ...localMatch, id: apiV.id || localMatch.id } : apiV;
      });

      localVendors.forEach(loc => {
        const exists = mergedVendors.some(
          v => (v.id && loc.id && String(v.id) === String(loc.id)) ||
               (v.email && loc.email && v.email.toLowerCase() === loc.email.toLowerCase())
        );
        if (!exists) {
          mergedVendors.push(loc);
        }
      });

      setVendors(mergedVendors);
      if (mergedVendors.length > 0) {
        saveVendorsLocally(mergedVendors);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      const localVendors = getSavedVendors();
      if (localVendors.length > 0) {
        setVendors(localVendors);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch vendors');
      }
    } finally {
      if (showTabLoading) setTabLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(false), fetchVendors(false)]);
      setLoading(false);
    };
    loadInitial();
  }, []);

  // Handle Tab Switch with Live API Call
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setError(null);
    setModalError(null);
    setEditModalError(null);
    if (tab === "employees") {
      await fetchEmployees(true);
    } else {
      await fetchVendors(true);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    joiningDate: "",
    jobTitle: "",
    salaryAmount: "",
    password: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      joiningDate: new Date().toISOString().substring(0, 10),
      jobTitle: "",
      salaryAmount: "",
      password: ""
    });
    setError(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setModalError(null);
      setSubmitting(true);

      if (activeTab === "employees") {
        const submitData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          job_title: formData.jobTitle,
          designation: formData.jobTitle,
          salary: parseFloat(formData.salaryAmount) || 0,
          joining_date: formData.joiningDate,
        };
        const response = await employerAPI.addEmployee(submitData);
        if (response?.data?.success || response?.status === 201) {
          toast.success('Employee added successfully!');
          await fetchEmployees(false);
          setShowModal(false);
          setModalError(null);
        } else {
          const errMsg = response?.data?.message || 'Failed to add employee';
          setModalError(errMsg);
          toast.error(errMsg);
        }
      } else {
        const vendorData = {
          name: formData.name,
          company_name: formData.company_name || formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || 'Vendor@123',
          job_title: formData.jobTitle,
          designation: formData.jobTitle,
          service_type: formData.jobTitle,
          salary: parseFloat(formData.salaryAmount) || 0,
          joining_date: formData.joiningDate,
        };

        let createdId = `vendor_${Date.now()}`;
        try {
          const response = await employerAPI.addVendor(vendorData);
          if (response?.data?.success || response?.status === 201) {
            createdId = response?.data?.data?.id || response?.data?.id || createdId;
            // If API didn't return an ID, try fetching vendors to match real numeric ID
            if (String(createdId).startsWith('vendor_')) {
              try {
                const listRes = await employerAPI.getMyVendors();
                const rawList = listRes?.data?.data || listRes?.data || [];
                const matched = rawList.find(v => (v.email || v.user?.email) === vendorData.email);
                if (matched?.id) {
                  createdId = matched.id;
                }
              } catch (e) {}
            }
          } else {
            const errMsg = response?.data?.message || 'Failed to add vendor';
            setModalError(errMsg);
            toast.error(errMsg);
            return;
          }
        } catch (apiErr) {
          console.error('API vendor create error:', apiErr);
          const errMsg = apiErr.response?.data?.message || apiErr.message || 'Failed to add vendor';
          setModalError(errMsg);
          toast.error(errMsg);
          return;
        }

        const newVendorItem = {
          id: createdId,
          name: vendorData.name,
          companyName: vendorData.company_name,
          email: vendorData.email,
          phone: vendorData.phone,
          joiningDate: vendorData.joining_date,
          jobTitle: vendorData.job_title,
          salaryAmount: String(vendorData.salary),
          status: 'active'
        };

        // 1. Immediately update localStorage synchronously
        const currentSaved = getSavedVendors();
        const filtered = currentSaved.filter(v => v.email !== newVendorItem.email && String(v.id) !== String(newVendorItem.id));
        const updated = [newVendorItem, ...filtered];
        saveVendorsLocally(updated);

        // 2. Immediately update state
        setVendors(updated);

        toast.success('Vendor added successfully!');
        setShowModal(false);
        setModalError(null);
        setFormData({
          name: "",
          company_name: "",
          email: "",
          phone: "",
          joiningDate: new Date().toISOString().split('T')[0],
          jobTitle: "",
          salaryAmount: "",
          password: ""
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit';
      setModalError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (id) => {
    const item = activeTab === "employees"
      ? employees.find(emp => emp.id === id)
      : vendors.find(v => String(v.id) === String(id));

    if (item) {
      setEditingItem(item);
      let dateFormatted = '';
      if (item.joiningDate) {
        try {
          const d = new Date(item.joiningDate);
          if (!isNaN(d.getTime())) {
            dateFormatted = d.toISOString().substring(0, 10);
          } else {
            dateFormatted = String(item.joiningDate).substring(0, 10);
          }
        } catch (e) {
          dateFormatted = String(item.joiningDate).substring(0, 10);
        }
      }

      setFormData({
        name: item.name || '',
        company_name: item.companyName || item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        joiningDate: dateFormatted,
        jobTitle: item.jobTitle || '',
        salaryAmount: item.salaryAmount || '',
        password: ''
      });
      setEditModalError(null);
      setShowEditModal(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setEditModalError(null);
      setSubmitting(true);

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.jobTitle,
        job_title: formData.jobTitle,
        salary: parseFloat(formData.salaryAmount) || 0,
        joining_date: formData.joiningDate,
        company_name: formData.company_name || formData.name,
        contact_person: formData.name,
      };

      if (activeTab === "employees") {
        const response = await employerAPI.updateEmployee(editingItem.id, updateData);
        if (response?.data?.success) {
          toast.success('Employee updated successfully!');
          await fetchEmployees(false);
          setShowEditModal(false);
          setEditingItem(null);
        } else {
          const errMsg = response?.data?.message || 'Failed to update employee';
          setEditModalError(errMsg);
          toast.error(errMsg);
        }
      } else {
        const vendorUpdateData = {
          ...updateData,
          service_type: formData.jobTitle,
          company_name: formData.company_name || formData.name,
          contact_person: formData.name,
        };

        const updatedItem = {
          ...editingItem,
          name: vendorUpdateData.name,
          companyName: vendorUpdateData.company_name,
          email: vendorUpdateData.email,
          phone: vendorUpdateData.phone,
          designation: vendorUpdateData.designation,
          jobTitle: vendorUpdateData.service_type,
          salaryAmount: String(vendorUpdateData.salary),
          joiningDate: vendorUpdateData.joining_date
        };

        // 1. Immediately update localStorage synchronously
        const currentSaved = getSavedVendors();
        let foundInSaved = false;
        const updatedList = currentSaved.map(v => {
          if (String(v.id) === String(editingItem.id) || (v.email && editingItem.email && v.email.toLowerCase() === editingItem.email.toLowerCase())) {
            foundInSaved = true;
            return { ...v, ...updatedItem };
          }
          return v;
        });
        if (!foundInSaved) {
          updatedList.push(updatedItem);
        }
        saveVendorsLocally(updatedList);

        // 2. Immediately update state
        setVendors(prev => prev.map(v => 
          (String(v.id) === String(editingItem.id) || (v.email && editingItem.email && v.email.toLowerCase() === editingItem.email.toLowerCase()))
            ? updatedItem
            : v
        ));

        // 3. Close modal & notify user
        toast.success('Vendor updated successfully!');
        setShowEditModal(false);
        setEditingItem(null);

        // 4. Update on server if real ID exists or can be matched
        let targetVendorId = editingItem.id;
        const isNumericId = targetVendorId && !isNaN(Number(targetVendorId)) && !String(targetVendorId).startsWith('vendor_');

        if (isNumericId) {
          try {
            await employerAPI.updateVendor(targetVendorId, vendorUpdateData);
          } catch (apiErr) {
            console.warn('API vendor update warning:', apiErr);
          }
        } else {
          try {
            const listRes = await employerAPI.getMyVendors();
            const rawList = listRes?.data?.data || listRes?.data || [];
            const matched = rawList.find(v => (v.email || v.user?.email) === editingItem.email);
            if (matched?.id) {
              await employerAPI.updateVendor(matched.id, vendorUpdateData);
              // Upgrade client ID in storage and state to numeric ID
              const syncedList = getSavedVendors().map(v => 
                (String(v.id) === String(editingItem.id) || (v.email && v.email.toLowerCase() === editingItem.email.toLowerCase()))
                  ? { ...v, id: matched.id }
                  : v
              );
              saveVendorsLocally(syncedList);
              setVendors(syncedList);
            }
          } catch (apiErr) {
            console.warn('Could not sync vendor update to server:', apiErr);
          }
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to update';
      setEditModalError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const itemName = activeTab === "employees" ? "employee" : "vendor";
    if (window.confirm(`Are you sure you want to delete this ${itemName}?`)) {
      try {
        setError(null);
        if (activeTab === "employees") {
          const response = await employerAPI.deleteEmployee(id);
          if (response?.data?.success) {
            toast.success('Employee deleted successfully');
            await fetchEmployees(false);
          } else {
            const errMsg = response?.data?.message || 'Failed to delete employee';
            setError(errMsg);
            toast.error(errMsg);
          }
        } else {
          // 1. Immediately remove from localStorage
          const currentSaved = getSavedVendors();
          const filtered = currentSaved.filter(v => String(v.id) !== String(id));
          saveVendorsLocally(filtered);

          // 2. Remove from state immediately
          setVendors(prev => prev.filter(v => String(v.id) !== String(id)));

          // 3. Call API delete only if numeric ID or resolve from server
          const isNumericId = id && !isNaN(Number(id)) && !String(id).startsWith('vendor_');
          if (isNumericId) {
            try {
              await employerAPI.deleteVendor(id);
            } catch (apiErr) {
              console.warn('API vendor delete warning:', apiErr);
            }
          } else {
            try {
              const listRes = await employerAPI.getMyVendors();
              const rawList = listRes?.data?.data || listRes?.data || [];
              const target = currentSaved.find(v => String(v.id) === String(id));
              if (target?.email) {
                const matched = rawList.find(v => (v.email || v.user?.email) === target.email);
                if (matched?.id) {
                  await employerAPI.deleteVendor(matched.id);
                }
              }
            } catch (apiErr) {
              console.warn('Could not sync vendor delete to server:', apiErr);
            }
          }

          toast.success('Vendor deleted successfully');
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || 'Failed to delete';
        setError(errMsg);
        toast.error(errMsg);
      }
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    return activeTab === "employees" ? employees : vendors;
  };

  const currentData = getCurrentData();

  // Dynamic calculations based on real data
  const totalCount = currentData.length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const newThisMonth = currentData.filter(item => {
    if (!item.joiningDate) return false;
    const d = new Date(item.joiningDate);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const activeCount = currentData.filter(item => {
    const s = String(item.status || 'active').toLowerCase();
    return s === 'active';
  }).length;

  // Calculate unique departments/categories based on job titles
  const uniqueDepartments = [...new Set(currentData.map(item => item.jobTitle).filter(t => t && t !== 'N/A'))].length;

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
    <div className="min-vh-100 pb-5" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <div className="bg-white shadow-sm mb-4" style={{ borderBottom: `1px solid ${customStyles.lightGrayBorder}` }}>
        <div className="container-fluid p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center">
              <div className="me-2 me-md-3" style={{ width: '35px', height: '35px', backgroundColor: customStyles.primaryRed, borderRadius: '6px' }}></div>
              <div>
                <h1 className="h3 h2-md mb-0 fw-bold" style={{ color: customStyles.darkRed }}>
                  {activeTab === "employees" ? "Employee" : "Vendor"} Management
                </h1>
                <small className="text-muted">Manage your organization's {activeTab === "employees" ? "workforce and staff" : "vendors and partners"}</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary d-flex align-items-center px-3 py-2"
                onClick={() => handleTabChange(activeTab)}
                disabled={tabLoading}
                title="Refresh Data"
                style={{ fontSize: '0.875rem', borderRadius: '6px' }}
              >
                <FaSyncAlt className={`me-2 ${tabLoading ? 'fa-spin' : ''}`} /> Refresh
              </button>
              <button
                className="btn d-flex align-items-center text-white px-3 py-2"
                onClick={handleOpenAddModal}
                style={{ backgroundColor: customStyles.primaryRed, fontSize: '0.875rem', borderRadius: '6px' }}
              >
                <FaPlus className="me-2" /> Add {activeTab === "employees" ? "Employee" : "Vendor"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid px-3 px-md-4">
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: "10px" }}>
          <div className="card-body p-2">
            <ul className="nav nav-pills gap-2">
              <li className="nav-item">
                <button
                  type="button"
                  id="tab-employees-btn"
                  className={`btn px-4 py-2 fw-bold d-flex align-items-center gap-2 ${activeTab === "employees" ? "text-white shadow-sm" : "btn-light text-dark"}`}
                  onClick={() => handleTabChange("employees")}
                  style={{
                    backgroundColor: activeTab === "employees" ? customStyles.primaryRed : "#F1F3F5",
                    borderColor: activeTab === "employees" ? customStyles.primaryRed : "transparent",
                    borderRadius: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaUsers size={16} />
                  <span>Employees</span>
                  <span className={`badge ms-1 ${activeTab === "employees" ? "bg-white text-danger" : "bg-secondary text-white"}`}>
                    {employees.length}
                  </span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  id="tab-vendors-btn"
                  className={`btn px-4 py-2 fw-bold d-flex align-items-center gap-2 ${activeTab === "vendors" ? "text-white shadow-sm" : "btn-light text-dark"}`}
                  onClick={() => handleTabChange("vendors")}
                  style={{
                    backgroundColor: activeTab === "vendors" ? customStyles.primaryRed : "#F1F3F5",
                    borderColor: activeTab === "vendors" ? customStyles.primaryRed : "transparent",
                    borderRadius: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaBuilding size={16} />
                  <span>Vendors</span>
                  <span className={`badge ms-1 ${activeTab === "vendors" ? "bg-white text-danger" : "bg-secondary text-white"}`}>
                    {vendors.length}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="row g-3 g-md-4 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "10px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small text-muted">
                      Total {activeTab === "employees" ? "Employees" : "Vendors"}
                    </h6>
                    <h3 className="card-title mb-0 fw-bold" style={{ color: customStyles.blackText }}>
                      {totalCount}
                    </h3>
                  </div>
                  <FaUsers className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "10px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small text-muted">New This Month</h6>
                    <h3 className="card-title mb-0 fw-bold" style={{ color: customStyles.blackText }}>{newThisMonth}</h3>
                  </div>
                  <FaChartLine className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "10px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small text-muted">
                      Active {activeTab === "employees" ? "Employees" : "Vendors"}
                    </h6>
                    <h3 className="card-title mb-0 fw-bold" style={{ color: customStyles.blackText }}>
                      {activeCount}
                    </h3>
                  </div>
                  <FaUserTie className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "10px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-subtitle mb-2 small text-muted">
                      {activeTab === "employees" ? "Departments" : "Categories"}
                    </h6>
                    <h3 className="card-title mb-0 fw-bold" style={{ color: customStyles.blackText }}>{uniqueDepartments}</h3>
                  </div>
                  <FaBuilding className="text-muted" size={24} style={{ opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee/Vendor List */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
          <div className="card-header bg-white d-flex justify-content-between align-items-center py-3" style={{ borderBottom: `1px solid ${customStyles.lightGrayBorder}` }}>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold" style={{ color: customStyles.blackText }}>
                {activeTab === "employees" ? "Employee List" : "Vendor List"}
              </h5>
              {tabLoading && <Spinner animation="border" size="sm" variant="danger" />}
            </div>
            <button
              className="btn btn-sm d-flex align-items-center text-white px-3 py-2 rounded-2"
              onClick={handleOpenAddModal}
              style={{ backgroundColor: customStyles.primaryRed, fontWeight: "600" }}
            >
              <FaPlus className="me-2" /> Add {activeTab === "employees" ? "Employee" : "Vendor"}
            </button>
          </div>
          <div className="card-body p-0">
            {/* Desktop Table View */}
            <div className="d-none d-md-block">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: customStyles.lightBg }}>
                    <tr>
                      <th style={{ color: customStyles.darkGrayText }}>Name</th>
                      {activeTab === "vendors" && <th style={{ color: customStyles.darkGrayText }}>Company Name</th>}
                      <th style={{ color: customStyles.darkGrayText }}>Email</th>
                      <th style={{ color: customStyles.darkGrayText }}>Phone</th>
                      <th style={{ color: customStyles.darkGrayText }}>Joining Date</th>
                      <th style={{ color: customStyles.darkGrayText }}>
                        {activeTab === "employees" ? "Job Title" : "Service Type"}
                      </th>
                      <th style={{ color: customStyles.darkGrayText }}>
                        {activeTab === "employees" ? "Salary" : "Payout / Contract"}
                      </th>
                      <th style={{ color: customStyles.darkGrayText }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === "vendors" ? "8" : "7"} className="text-center py-5 text-muted">
                          <div className="py-3">
                            <p className="mb-2 fs-6">No {activeTab === "employees" ? "employees" : "vendors"} found in database.</p>
                            <button
                              className="btn btn-sm text-white px-3 py-2"
                              onClick={handleOpenAddModal}
                              style={{ backgroundColor: customStyles.primaryRed, borderRadius: "6px" }}
                            >
                              <FaPlus className="me-2" /> Add {activeTab === "employees" ? "Employee" : "Vendor"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentData.map(item => (
                        <tr key={item.id}>
                          <td style={{ color: customStyles.blackText }} className="fw-semibold">{item.name}</td>
                          {activeTab === "vendors" && (
                            <td style={{ color: customStyles.blackText }}>{item.companyName || item.name}</td>
                          )}
                          <td style={{ color: customStyles.blackText }}>{item.email}</td>
                          <td style={{ color: customStyles.blackText }}>{item.phone}</td>
                          <td style={{ color: customStyles.blackText }}>
                            {item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ color: customStyles.blackText }}>
                            <span className="badge bg-light text-dark border">{item.jobTitle}</span>
                          </td>
                          <td style={{ color: customStyles.blackText }} className="fw-bold">
                            ₹{item.salaryAmount}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm me-2"
                              onClick={() => handleEdit(item.id)}
                              style={{ color: customStyles.primaryRed, backgroundColor: 'transparent' }}
                              title="Edit"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => handleDelete(item.id)}
                              style={{ color: customStyles.primaryRed, backgroundColor: 'transparent' }}
                              title="Delete"
                            >
                              <FaTrash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="d-md-none">
              {currentData.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-2">No {activeTab === "employees" ? "employees" : "vendors"} found.</p>
                  <button
                    className="btn btn-sm text-white px-3 py-2"
                    onClick={handleOpenAddModal}
                    style={{ backgroundColor: customStyles.primaryRed, borderRadius: "6px" }}
                  >
                    <FaPlus className="me-2" /> Add {activeTab === "employees" ? "Employee" : "Vendor"}
                  </button>
                </div>
              ) : (
                currentData.map(item => (
                  <div key={item.id} className="border-bottom p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-0 fw-bold" style={{ color: customStyles.blackText }}>{item.name}</h6>
                        {activeTab === "vendors" && item.companyName && (
                          <small className="text-muted">{item.companyName}</small>
                        )}
                      </div>
                      <div>
                        <button
                          className="btn btn-sm me-1"
                          onClick={() => handleEdit(item.id)}
                          style={{ color: customStyles.primaryRed, backgroundColor: 'transparent', padding: '0.25rem 0.5rem' }}
                          title="Edit"
                        >
                          <FaEdit size={15} />
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleDelete(item.id)}
                          style={{ color: customStyles.primaryRed, backgroundColor: 'transparent', padding: '0.25rem 0.5rem' }}
                          title="Delete"
                        >
                          <FaTrash size={15} />
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
                        <span style={{ color: customStyles.darkGrayText }}>{activeTab === "employees" ? "Job Title:" : "Service:"}</span>
                        <div style={{ color: customStyles.blackText }}>{item.jobTitle}</div>
                      </div>
                      <div className="col-6">
                        <span style={{ color: customStyles.darkGrayText }}>{activeTab === "employees" ? "Salary:" : "Amount:"}</span>
                        <div style={{ color: customStyles.blackText }} className="fw-bold">₹{item.salaryAmount}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
            <div className="modal-content border-0 shadow" style={{ borderRadius: '12px' }}>
              <div className="modal-header" style={{ backgroundColor: customStyles.primaryRed, color: customStyles.pureWhite, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <h5 className="modal-title fw-bold" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                  Add New {activeTab === "employees" ? "Employee" : "Vendor"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4" style={{
                  maxHeight: isMobile ? '70vh' : 'auto',
                  overflowY: isMobile ? 'auto' : 'visible'
                }}>
                  {modalError && (
                    <div className="alert alert-danger py-2 px-3 mb-3 small d-flex justify-content-between align-items-center">
                      <span>{modalError}</span>
                      <button type="button" className="btn-close btn-sm" onClick={() => setModalError(null)}></button>
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">
                        {activeTab === "employees" ? "Full Name" : "Contact Person Name"}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={activeTab === "employees" ? "e.g. John Doe" : "e.g. Vendor Representative"}
                      />
                    </div>

                    {activeTab === "vendors" && (
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Company / Vendor Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Global Tech Solutions"
                        />
                      </div>
                    )}

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. user@example.com"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Account login password"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. +91 9876543210"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">
                        {activeTab === "employees" ? "Job Title / Role" : "Service Type"}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        required
                        placeholder={activeTab === "employees" ? "e.g. Full Stack Developer" : "e.g. IT Services, Security"}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">
                        {activeTab === "employees" ? "Salary Amount (₹)" : "Contract / Payout (₹)"}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="salaryAmount"
                        value={formData.salaryAmount}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm text-white px-3"
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : `Add ${activeTab === "employees" ? "Employee" : "Vendor"}`}
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
            <div className="modal-content border-0 shadow" style={{ borderRadius: '12px' }}>
              <div className="modal-header" style={{ backgroundColor: customStyles.primaryRed, color: customStyles.pureWhite, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <h5 className="modal-title fw-bold" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                  Edit {activeTab === "employees" ? "Employee" : "Vendor"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body p-4" style={{
                  maxHeight: isMobile ? '70vh' : 'auto',
                  overflowY: isMobile ? 'auto' : 'visible'
                }}>
                  {editModalError && (
                    <div className="alert alert-danger py-2 px-3 mb-3 small d-flex justify-content-between align-items-center">
                      <span>{editModalError}</span>
                      <button type="button" className="btn-close btn-sm" onClick={() => setEditModalError(null)}></button>
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">
                        {activeTab === "employees" ? "Full Name" : "Contact Person Name"}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {activeTab === "vendors" && (
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Company / Vendor Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">
                        {activeTab === "employees" ? "Job Title / Role" : "Service Type"}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">
                        {activeTab === "employees" ? "Salary Amount (₹)" : "Contract / Payout (₹)"}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="salaryAmount"
                        value={formData.salaryAmount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm text-white px-3"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update'}
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