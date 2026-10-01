import React, { useState, useEffect } from "react";
import { adminAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';


const extractBankDetails = (emp) => {
  try {
    const setup = emp.paymentSetups?.find(p => p.provider === "bank_transfer");
    if (!setup || !setup.config) {
      return {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branch: "",
      };
    }

    const config = JSON.parse(setup.config);

    return {
      bankName: config.bank_name || "",
      accountNumber: config.account_number || "",
      ifscCode: config.ifsc_code || "",
      branch: config.branch || "",
    };
  } catch (err) {
    console.error("Bank config parse error:", err);
    return {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
    };
  }
};


const COLORS = {
  primary: "#C62828",
  primaryDark: "#B71C1C",
  white: "#FFFFFF",
  black: "#000000",
  text: "#4A4A4A",
  border: "#E2E2E2",
  // Additional colors for different actions
  info: "#1976D2",
  warning: "#F57C00",
  success: "#2E7D32",
  lightGray: "#F5F5F5",
  danger: "#D32F2F",
};

const ManagementSystem = () => {
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

  // State for list of employers
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch employers from API
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getEmployers();
        if (response?.data?.success) {
          const employersData = response.data.data || [];
          setEmployers(employersData.map(emp => {
            // Parse bank details from paymentSetups config JSON string
            let bankConfig = {};
            if (emp.paymentSetups && emp.paymentSetups.length > 0 && emp.paymentSetups[0].config) {
              try {
                bankConfig = JSON.parse(emp.paymentSetups[0].config);
              } catch (e) {
                console.error('Failed to parse bank config:', e);
              }
            }
            return ({
              id: emp.id,
              name: emp.company_name || emp.user?.name || 'N/A',
              email: emp.user?.email || emp.email,
              phone: emp.user?.phone || '',
              address: emp.company_address || '',
              username: emp.user?.email || '',
              password: '***',
              balance: emp.credit?.balance !== undefined ? emp.credit.balance : 0,
              level: emp.subscription_plan || 'Basic',
              bankName: bankConfig.bank_name || '',
              accountNumber: bankConfig.account_number || '',
              ifscCode: bankConfig.ifsc_code || '',
              branch: bankConfig.branch || '',
              panNumber: emp.pan_number || bankConfig.pan_number || '',
              gstNumber: emp.gst_number || bankConfig.gst_number || '',
              user: emp.user,
              credit: emp.credit,
              paymentSetups: emp.paymentSetups, // Keep raw if needed
            });
          }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch employers');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployers();
  }, []);

  // State for Assign Credit Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [credit, setCredit] = useState("");

  // State for Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "", email: "", phone: "", address: "", username: "", password: "", balance: "", level: "",
    bankName: "", accountNumber: "", ifscCode: "", branch: "", panNumber: "", gstNumber: ""
  });

  // State for View Modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [itemToView, setItemToView] = useState(null);

  // State for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // --- Handlers for Assign Credit ---
  const openAssignModal = (item) => {
    setSelectedItem(item);
    setShowAssignModal(true);
  };
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setCredit("");
  };
  const assignCredit = async () => {
    if (!credit || credit <= 0) {
      toast.error("Please enter a valid credit amount.");
      return;
    }

    try {
      // API call to add balance using new wallet system
      const response = await adminAPI.addCredit(selectedItem.id, {
        amount: parseFloat(credit),
        reference: 'Balance added by admin',
        payment_method: 'CASH'
      });
      if (response?.data?.success) {
        toast.success(`Assigned $${credit} to ${selectedItem.name}`);

        // Refresh employers list to show updated wallet balance
        const empResponse = await adminAPI.getEmployers();
        if (empResponse?.data?.success) {
          const employersData = empResponse.data.data || [];
          setEmployers(employersData.map(emp => {
            // Parse bank details from paymentSetups config JSON string
            let bankConfig = {};
            if (emp.paymentSetups && emp.paymentSetups.length > 0 && emp.paymentSetups[0].config) {
              try {
                bankConfig = JSON.parse(emp.paymentSetups[0].config);
              } catch (e) {
                console.error('Failed to parse bank config:', e);
              }
            }
            return ({
              id: emp.id,
              name: emp.company_name || emp.user?.name || 'N/A',
              email: emp.user?.email || emp.email,
              phone: emp.user?.phone || '',
              address: emp.company_address || '',
              username: emp.user?.email || '',
              password: '***',
              balance: emp.credit?.balance !== undefined ? emp.credit.balance : 0,
              level: emp.subscription_plan || 'Basic',
              bankName: bankConfig.bank_name || '',
              accountNumber: bankConfig.account_number || '',
              ifscCode: bankConfig.ifsc_code || '',
              branch: bankConfig.branch || '',
              panNumber: emp.pan_number || bankConfig.pan_number || '',
              gstNumber: emp.gst_number || bankConfig.gst_number || '',
              user: emp.user,
              credit: emp.credit,
              paymentSetups: emp.paymentSetups,
            });
          }));
        }
        closeAssignModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign credit');
    }
  };

  // --- Handlers for Add Item ---
  const openAddModal = () => {
    setShowAddModal(true);
  };
  const closeAddModal = () => {
    setShowAddModal(false);
    setNewItem({
      name: "", email: "", phone: "", address: "", username: "", password: "", balance: "", level: "",
      bankName: "", accountNumber: "", ifscCode: "", branch: "", panNumber: "", gstNumber: ""
    });
  };
  const handleAddChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };
  const addItem = async () => {
    if (!newItem.name || !newItem.email || !newItem.password) {
      toast.error("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    try {
      const response = await adminAPI.createEmployer({
        name: newItem.name,
        email: newItem.email,
        password: newItem.password,
        company_name: newItem.name,
        company_address: newItem.address || '',
        phone: newItem.phone || '',
        pan_number: newItem.panNumber || '',
        gst_number: newItem.gstNumber || '',
        bank_name: newItem.bankName || '',
        account_number: newItem.accountNumber || '',
        level: newItem.level || 'BASIC',
        ifsc_code: newItem.ifscCode || '',
        branch: newItem.branch || '',
        balance: newItem.balance || 0,
      });

      if (response?.data?.success) {
        // Refresh employers list
        const empResponse = await adminAPI.getEmployers();
        if (empResponse?.data?.success) {
          const employersData = empResponse.data.data || [];
          setEmployers(employersData.map(emp => {
            // Parse bank details from paymentSetups config JSON string
            let bankConfig = {};
            if (emp.paymentSetups && emp.paymentSetups.length > 0 && emp.paymentSetups[0].config) {
              try {
                bankConfig = JSON.parse(emp.paymentSetups[0].config);
              } catch (e) {
                console.error('Failed to parse bank config:', e);
              }
            }
            return ({
              id: emp.id,
              name: emp.company_name || emp.user?.name || 'N/A',
              email: emp.user?.email || emp.email,
              phone: emp.user?.phone || '',
              address: emp.company_address || '',
              username: emp.user?.email || '',
              password: '***',
              balance: emp.credit?.balance !== undefined ? emp.credit.balance : 0,
              level: emp.subscription_plan || 'Basic',
              bankName: bankConfig.bank_name || '',
              accountNumber: bankConfig.account_number || '',
              ifscCode: bankConfig.ifsc_code || '',
              branch: bankConfig.branch || '',
              panNumber: emp.pan_number || bankConfig.pan_number || '',
              gstNumber: emp.gst_number || bankConfig.gst_number || '',
              user: emp.user,
              credit: emp.credit,
              paymentSetups: emp.paymentSetups,
            });
          }));
        }
        toast.success(`Added new employer: ${newItem.name}`);
        closeAddModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employer');
    }
  };

  // --- Handlers for View Item ---
  const openViewModal = (item) => {
    setItemToView(item);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setShowViewModal(false);
    setItemToView(null);
  };

  // --- Handlers for Edit Item ---
  const openEditModal = async (item) => {
    // Open modal immediately with current item to ensure UI responsiveness
    setItemToEdit(item);
    setShowEditModal(true);

    try {
      // Attempt to fetch fresh employer details and update modal when available
      const id = item?.id || item?.user?.id;
      if (!id) return;
      if (!adminAPI.getEmployerById) return;

      const response = await adminAPI.getEmployerById(id);
      if (response?.data?.success) {
        const emp = response.data.data;
        // Parse bank details from paymentSetups config JSON string
        let bankConfig = {};
        if (emp.paymentSetups && emp.paymentSetups.length > 0 && emp.paymentSetups[0].config) {
          try {
            bankConfig = JSON.parse(emp.paymentSetups[0].config);
          } catch (e) {
            console.error('Failed to parse bank config:', e);
          }
        }
        const updatedItem = {
          id: emp.id,
          name: emp.company_name || emp.user?.name || 'N/A',
          email: emp.user?.email || emp.email,
          phone: emp.user?.phone || '',
          address: emp.company_address || '',
          username: emp.user?.email || '',
          password: '***',
          balance: emp.balance !== undefined ? emp.balance : (emp.credit?.balance !== undefined ? emp.credit.balance : 0),
          level: emp.subscription_plan || 'Basic',
          bankName: bankConfig.bank_name || '',
          accountNumber: bankConfig.account_number || '',
          ifscCode: bankConfig.ifsc_code || '',
          branch: bankConfig.branch || '',
          panNumber: emp.pan_number || bankConfig.pan_number || '',
          gstNumber: emp.gst_number || bankConfig.gst_number || '',
          user: emp.user,
          credit: emp.credit,
          paymentSetups: emp.paymentSetups,
        };
        setItemToEdit(updatedItem);
      }
    } catch (err) {
      console.error('Error fetching employer details:', err);
      // keep existing item shown in modal
    }
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setItemToEdit(null);
  };
  const handleEditChange = (e) => {
    setItemToEdit({ ...itemToEdit, [e.target.name]: e.target.value });
  };
  const updateItem = async () => {
    try {
      const response = await adminAPI.updateEmployer(itemToEdit.id, {
        name: itemToEdit.name,
        email: itemToEdit.email,
        company_name: itemToEdit.name,
        company_address: itemToEdit.address || '',
        phone: itemToEdit.phone || '',
        pan_number: itemToEdit.panNumber || '',
        gst_number: itemToEdit.gstNumber || '',
        bank_name: itemToEdit.bankName || '',
        account_number: itemToEdit.accountNumber || '',
        level: itemToEdit.level || '',
        ifsc_code: itemToEdit.ifscCode || '',
        branch: itemToEdit.branch || '',
      });

      if (response?.data?.success) {
        toast.success(`Updated details for ${itemToEdit.name}`);

        // Refresh employers list to show updated data
        const empResponse = await adminAPI.getEmployers();
        if (empResponse?.data?.success) {
          const employersData = empResponse.data.data || [];
          setEmployers(employersData.map(emp => {
            return ({
              id: emp.id,
              name: emp.company_name || emp.user?.name || 'N/A',
              email: emp.user?.email || emp.email,
              phone: emp.user?.phone || '',
              address: emp.company_address || '',
              username: emp.user?.email || '',
              password: '***',
              balance: emp.credit?.balance !== undefined ? emp.credit.balance : 0,
              level: emp.subscription_plan || 'Basic',
              bankName: emp.paymentSetups?.[0]?.provider === 'bank_transfer' ? (JSON.parse(emp.paymentSetups[0].config).bank_name || '') : (emp.bank_name || ''),
              accountNumber: emp.paymentSetups?.[0]?.provider === 'bank_transfer' ? (JSON.parse(emp.paymentSetups[0].config).account_number || '') : (emp.account_number || ''),
              ifscCode: emp.paymentSetups?.[0]?.provider === 'bank_transfer' ? (JSON.parse(emp.paymentSetups[0].config).ifsc_code || '') : (emp.ifsc_code || ''),
              branch: emp.paymentSetups?.[0]?.provider === 'bank_transfer' ? (JSON.parse(emp.paymentSetups[0].config).branch || '') : (emp.branch || ''),
              panNumber: emp.pan_number || '',
              gstNumber: emp.gst_number || '',
              user: emp.user,
              credit: emp.credit,
              paymentSetups: emp.paymentSetups,
            });
          }));
        }
        closeEditModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employer');
    }
  };

  // --- Handler for Delete Item ---
  const deleteEmployer = async (id) => {
    const employerToDelete = employers.find(emp => emp.id === id);
    if (window.confirm(`Are you sure you want to delete ${employerToDelete.name}? This action cannot be undone.`)) {
      try {
        const response = await adminAPI.deleteEmployer(id);
        if (response?.data?.success) {
          // Refresh employers list
          const empResponse = await adminAPI.getEmployers();
          if (empResponse?.data?.success) {
            const employersData = empResponse.data.data || [];
            setEmployers(employersData.map(emp => {
              // Parse bank details from paymentSetups config JSON string
              let bankConfig = {};
              if (emp.paymentSetups && emp.paymentSetups.length > 0 && emp.paymentSetups[0].config) {
                try {
                  bankConfig = JSON.parse(emp.paymentSetups[0].config);
                } catch (e) {
                  console.error('Failed to parse bank config:', e);
                }
              }
              return ({
                id: emp.id,
                name: emp.company_name || emp.user?.name || 'N/A',
                email: emp.user?.email || emp.email,
                phone: emp.user?.phone || '',
                address: emp.company_address || '',
                username: emp.user?.email || '',
                password: '***',
                balance: emp.credit?.balance !== undefined ? emp.credit.balance : 0,
                level: emp.subscription_plan || 'Basic',
                bankName: bankConfig.bank_name || '',
                accountNumber: bankConfig.account_number || '',
                ifscCode: bankConfig.ifsc_code || '',
                branch: bankConfig.branch || '',
                panNumber: emp.pan_number || bankConfig.pan_number || '',
                gstNumber: emp.gst_number || bankConfig.gst_number || '',
                user: emp.user,
                credit: emp.credit,
                paymentSetups: emp.paymentSetups,
              });
            }));
          }
          toast.success(`Employer ${employerToDelete.name} has been deleted.`);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete employer');
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} this account?`)) {
      try {
        const response = await adminAPI.toggleUserStatus(userId, newStatus);
        if (response?.data?.success) {
          toast.success(response.data.message);
          window.location.reload();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update user status');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="py-2 py-md-4" style={{ minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-column flex-md-row">
        <h2 className="fw-bold mb-3 mb-md-0" style={{ color: COLORS.primary, fontSize: isMobile ? '1.5rem' : '2rem' }}>Employer Management</h2>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Add Button */}
      <div className="d-flex justify-content-end mb-4">
        <button
          className="btn text-white px-3 px-md-4 py-2"
          onClick={openAddModal}
          style={{
            backgroundColor: COLORS.primary,
            border: "none",
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          Add Employer
        </button>
      </div>

      {/* --- SECTION 1: LIST WITH CONTACT DETAILS --- */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
        <div className="card-header" style={{ background: COLORS.primary, color: COLORS.white, borderRadius: "10px 10px 0 0" }}>
          <h4 className="mb-0" style={{ fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
            Employer List
          </h4>
        </div>
        <div className="card-body p-0">
          {isMobile ? (
            // Mobile Card View
            <div className="p-3">
              {employers.map((item) => (
                <div key={item.id} className="card shadow-sm mb-3" style={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0" style={{ color: COLORS.primary }}>{item.name}</h5>
                      <span className="badge" style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>${item.balance}</span>
                    </div>
                    <div className="mb-2">
                      <p className="mb-1 small"><strong>Email:</strong> {item.email}</p>
                      <p className="mb-1 small"><strong>Phone:</strong> {item.phone}</p>
                      <p className="mb-1 small"><strong>Address:</strong> {item.address}</p>
                      <p className="mb-1 small"><strong>Username:</strong> {item.username}</p>
                      <p className="mb-2 small"><strong>Level:</strong> {item.level}</p>
                    </div>
                    <div className="d-flex justify-content-between">
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm text-white d-flex align-items-center justify-content-center"
                          onClick={() => openViewModal(item)}
                          title="View Details"
                          style={{
                            backgroundColor: COLORS.primary,
                            padding: "4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "500",
                            width: "28px",
                            height: "28px"
                          }}
                        >
                          <i className="bi bi-eye-fill" style={{ fontSize: "12px" }}></i>
                        </button>
                        <button
                          className="btn btn-sm text-white d-flex align-items-center justify-content-center"
                          onClick={() => openEditModal(item)}
                          title="Edit Details"
                          style={{
                            backgroundColor: COLORS.primary,
                            padding: "4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "500",
                            width: "28px",
                            height: "28px"
                          }}
                        >
                          <i className="bi bi-pencil-fill" style={{ fontSize: "12px" }}></i>
                        </button>
                        <button
                          className="btn btn-sm text-white d-flex align-items-center justify-content-center"
                          onClick={() => deleteEmployer(item.id)}
                          title="Delete Employer"
                          style={{
                            backgroundColor: COLORS.danger,
                            padding: "4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "500",
                            width: "28px",
                            height: "28px"
                          }}
                        >
                          <i className="bi bi-trash-fill" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead style={{ background: COLORS.primary, color: COLORS.white }}>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Username</th>
                    <th>Level</th>
                    <th>Balance</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employers.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: COLORS.text }}>{item.name}</td>
                      <td style={{ color: COLORS.text }}>{item.email}</td>
                      <td style={{ color: COLORS.text }}>{item.phone}</td>
                      <td style={{ color: COLORS.text }}>{item.address}</td>
                      <td style={{ color: COLORS.text }}>{item.username}</td>
                      <td style={{ color: COLORS.text }}>{item.level}</td>
                      <td style={{ color: COLORS.text }}>${item.balance}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center"
                            onClick={() => openViewModal(item)}
                            title="View Details"
                            style={{
                              backgroundColor: COLORS.primary,
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "500",
                              width: "28px",
                              height: "28px"
                            }}
                          >
                            <i className="bi bi-eye-fill" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center"
                            onClick={() => openEditModal(item)}
                            title="Edit Details"
                            style={{
                              backgroundColor: COLORS.primary,
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "500",
                              width: "28px",
                              height: "28px"
                            }}
                          >
                            <i className="bi bi-pencil-fill" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center"
                            onClick={() => handleToggleStatus(item.user?.id || item.id, item.user?.status || 'active')}
                            title={item.user?.status === 'blocked' ? "Enable Account" : "Disable Account"}
                            style={{
                              backgroundColor: item.user?.status === 'blocked' ? COLORS.success : COLORS.warning,
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "500",
                              width: "28px",
                              height: "28px"
                            }}
                          >
                            <i className={`bi ${item.user?.status === 'blocked' ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`} style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center"
                            onClick={() => deleteEmployer(item.id)}
                            title="Delete Employer"
                            style={{
                              backgroundColor: COLORS.danger,
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "500",
                              width: "28px",
                              height: "28px"
                            }}
                          >
                            <i className="bi bi-trash-fill" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- SECTION 2: BANK DETAILS --- */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
        <div className="card-header" style={{ background: COLORS.primary, color: COLORS.white, borderRadius: "10px 10px 0 0" }}>
          <h4 className="mb-0" style={{ fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
            Employer Bank Details
          </h4>
        </div>
        <div className="card-body p-0">
          {isMobile ? (
            // Mobile Card View for Bank Details
            <div className="p-3">
              {employers.map((item) => (
                <div key={item.id} className="card shadow-sm mb-3" style={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                  <div className="card-body p-3">
                    <h5 className="card-title mb-2" style={{ color: COLORS.primary }}>{item.name}</h5>
                    <div className="mb-2">
                      <p className="mb-1 small"><strong>Bank Name:</strong> {item.bankName}</p>
                      <p className="mb-1 small"><strong>Account Number:</strong> {item.accountNumber}</p>
                      <p className="mb-1 small"><strong>IFSC Code:</strong> {item.ifscCode}</p>
                      <p className="mb-1 small"><strong>Branch:</strong> {item.branch}</p>
                      <p className="mb-1 small"><strong>PAN Number:</strong> {item.panNumber}</p>
                      <p className="mb-0 small"><strong>GST Number:</strong> {item.gstNumber}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table View for Bank Details
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead style={{ background: COLORS.primary, color: COLORS.white }}>
                  <tr>
                    <th>Name</th>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>IFSC Code</th>
                    <th>Branch</th>
                    <th>PAN Number</th>
                    <th>GST Number</th>
                  </tr>
                </thead>
                <tbody>
                  {employers.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: COLORS.text }}>{item.name}</td>
                      <td style={{ color: COLORS.text }}>{item.bankName}</td>
                      <td style={{ color: COLORS.text }}>{item.accountNumber}</td>
                      <td style={{ color: COLORS.text }}>{item.ifscCode}</td>
                      <td style={{ color: COLORS.text }}>{item.branch}</td>
                      <td style={{ color: COLORS.text }}>{item.panNumber}</td>
                      <td style={{ color: COLORS.text }}>{item.gstNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- Add Modal --- */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`} style={{
            // Much smaller modal for mobile
            maxWidth: isMobile ? '90%' : '80%',
            width: isMobile ? '90%' : '800px',
            margin: isMobile ? '5px auto' : '1.75rem auto'
          }}>
            <div className="modal-content" style={{ borderRadius: "10px" }}>
              <div className="modal-header" style={{ background: COLORS.primary, color: COLORS.white, padding: isMobile ? '8px 12px' : '' }}>
                <h5 className="modal-title" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>
                  Add New Employer
                </h5>
                <button className="btn-close btn-close-white" onClick={closeAddModal}></button>
              </div>
              <div className="modal-body" style={{
                padding: isMobile ? '8px' : '20px',
                maxHeight: isMobile ? '70vh' : 'auto',
                overflowY: isMobile ? 'auto' : 'visible'
              }}>
                <div className="row">
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Name</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="name" value={newItem.name} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Email</label>
                    <input type="email" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="email" value={newItem.email} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Phone</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="phone" value={newItem.phone} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Initial Balance</label>
                    <input type="number" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="balance" value={newItem.balance} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-12 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Address</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="address" value={newItem.address} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Username</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="username" value={newItem.username} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Password</label>
                    <input type="password" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="password" value={newItem.password} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Level</label>
                    <select className={`form-select ${isMobile ? 'form-select-sm' : ''}`} name="level" value={newItem.level} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                      <option value="">Select Level</option>
                      <option value="Basic">Basic</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                  </div>

                  <div className={isMobile ? 'col-12 mt-2 mb-1' : 'col-12 mt-4 mb-3'}>
                    <h5 style={{ color: COLORS.primary, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px', fontSize: isMobile ? '0.85rem' : '1.1rem' }}>Bank Details</h5>
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Bank Name</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="bankName" value={newItem.bankName} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Account Number</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="accountNumber" value={newItem.accountNumber} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>IFSC Code</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="ifscCode" value={newItem.ifscCode} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Branch</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="branch" value={newItem.branch} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>PAN Number</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="panNumber" value={newItem.panNumber} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>GST Number</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="gstNumber" value={newItem.gstNumber} onChange={handleAddChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: isMobile ? '8px 12px' : '' }}>
                <button className="btn" onClick={closeAddModal} style={{ background: COLORS.border, color: COLORS.black, fontSize: isMobile ? '0.75rem' : '1rem' }}>Cancel</button>
                <button className="btn text-white" style={{ background: COLORS.primary, fontSize: isMobile ? '0.75rem' : '1rem' }} onClick={addItem}>
                  Add Employer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- View Modal --- */}
      {showViewModal && itemToView && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`} style={{
            maxWidth: isMobile ? '90%' : '80%',
            width: isMobile ? '90%' : '800px',
            margin: isMobile ? '5px auto' : '1.75rem auto'
          }}>
            <div className="modal-content" style={{ borderRadius: "10px" }}>
              <div className="modal-header" style={{ background: COLORS.primary, color: COLORS.white, padding: isMobile ? '8px 12px' : '' }}>
                <h5 className="modal-title" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>
                  Employer Details
                </h5>
                <button className="btn-close btn-close-white" onClick={closeViewModal}></button>
              </div>
              <div className="modal-body" style={{
                padding: isMobile ? '8px' : '20px',
                maxHeight: isMobile ? '70vh' : 'auto',
                overflowY: isMobile ? 'auto' : 'visible'
              }}>
                <div className="row">
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <h5 style={{ color: COLORS.primary, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px', fontSize: isMobile ? '0.85rem' : '1.1rem' }}>Basic Information</h5>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Name:</strong> {itemToView.name}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Email:</strong> {itemToView.email}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Phone:</strong> {itemToView.phone}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Address:</strong> {itemToView.address}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Username:</strong> {itemToView.username}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Level:</strong> {itemToView.level}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Current Balance:</strong> ${itemToView.balance}</p>
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <h5 style={{ color: COLORS.primary, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px', fontSize: isMobile ? '0.85rem' : '1.1rem' }}>Bank Details</h5>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Bank Name:</strong> {itemToView.bankName}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Account Number:</strong> {itemToView.accountNumber}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>IFSC Code:</strong> {itemToView.ifscCode}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>Branch:</strong> {itemToView.branch}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>PAN Number:</strong> {itemToView.panNumber}</p>
                    <p style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}><strong>GST Number:</strong> {itemToView.gstNumber}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: isMobile ? '8px 12px' : '' }}>
                <button className="btn text-white" style={{ background: COLORS.primary, fontSize: isMobile ? '0.75rem' : '1rem' }} onClick={closeViewModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {showEditModal && itemToEdit && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`} style={{
            maxWidth: isMobile ? '90%' : '80%',
            width: isMobile ? '90%' : '800px',
            margin: isMobile ? '5px auto' : '1.75rem auto'
          }}>
            <div className="modal-content" style={{ borderRadius: "10px" }}>
              <div className="modal-header" style={{ background: COLORS.primary, color: COLORS.white, padding: isMobile ? '8px 12px' : '' }}>
                <h5 className="modal-title" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>
                  Edit Employer
                </h5>
                <button className="btn-close btn-close-white" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body" style={{
                padding: isMobile ? '8px' : '20px',
                maxHeight: isMobile ? '70vh' : 'auto',
                overflowY: isMobile ? 'auto' : 'visible'
              }}>
                <div className="row">
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Name</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="name" value={itemToEdit.name} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Email</label>
                    <input type="email" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="email" value={itemToEdit.email} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Phone</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="phone" value={itemToEdit.phone} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Balance</label>
                    <input type="number" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="balance" value={itemToEdit.balance} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-12 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Address</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="address" value={itemToEdit.address} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Username</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="username" value={itemToEdit.username} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Password</label>
                    <input type="password" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="password" value={itemToEdit.password} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Level</label>
                    <select className={`form-select ${isMobile ? 'form-select-sm' : ''}`} name="level" value={itemToEdit.level} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                      <option value="">Select Level</option>
                      <option value="Basic">Basic</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                  </div>

                  <div className={isMobile ? 'col-12 mt-2 mb-1' : 'col-12 mt-4 mb-3'}>
                    <h5 style={{ color: COLORS.primary, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px', fontSize: isMobile ? '0.85rem' : '1.1rem' }}>Bank Details</h5>
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Bank Name</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="bankName" value={itemToEdit.bankName} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Account Number</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="accountNumber" value={itemToEdit.accountNumber} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>IFSC Code</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="ifscCode" value={itemToEdit.ifscCode} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>Branch</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="branch" value={itemToEdit.branch} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>PAN Number</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="panNumber" value={itemToEdit.panNumber} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                  <div className={isMobile ? 'col-12 mb-1' : 'col-md-6 mb-3'}>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>GST Number</label>
                    <input type="text" className={`form-control ${isMobile ? 'form-control-sm' : ''}`} name="gstNumber" value={itemToEdit.gstNumber} onChange={handleEditChange} style={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: isMobile ? '8px 12px' : '' }}>
                <button className="btn" onClick={closeEditModal} style={{ background: COLORS.border, color: COLORS.black, fontSize: isMobile ? '0.75rem' : '1rem' }}>Cancel</button>
                <button className="btn text-white" style={{ background: COLORS.primary, fontSize: isMobile ? '0.75rem' : '1rem' }} onClick={updateItem}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Assign Credit Modal --- */}
      {showAssignModal && selectedItem && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`} style={{
            maxWidth: isMobile ? '90%' : '500px',
            width: isMobile ? '90%' : '500px',
            margin: isMobile ? '5px auto' : '1.75rem auto'
          }}>
            <div className="modal-content" style={{ borderRadius: "10px" }}>
              <div className="modal-header" style={{ background: COLORS.primary, color: COLORS.white, padding: isMobile ? '8px 12px' : '' }}>
                <h5 className="modal-title" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>Assign Credit</h5>
                <button className="btn-close btn-close-white" onClick={closeAssignModal}></button>
              </div>
              <div className="modal-body" style={{ padding: isMobile ? '8px' : '20px' }}>
                <div className="mb-3">
                  <p style={{ color: COLORS.black, fontSize: isMobile ? '0.75rem' : '1rem' }}>
                    Employer: <strong>{selectedItem.name}</strong>
                  </p>
                  <p style={{ color: COLORS.black, fontSize: isMobile ? '0.75rem' : '1rem' }}>Current Balance: <strong>${selectedItem.balance}</strong></p>
                </div>
                <label className="form-label" style={{ color: COLORS.text, fontSize: isMobile ? '0.75rem' : '1rem' }}>Enter Credit Amount</label>
                <input
                  type="number"
                  className={`form-control ${isMobile ? 'form-control-sm' : ''}`}
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.black, fontSize: isMobile ? '0.75rem' : '1rem' }}
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="Enter amount to add"
                />
                {credit && (
                  <div className="mt-2">
                    <small style={{ color: COLORS.text, fontSize: isMobile ? '0.75rem' : '1rem' }}>
                      New Balance: <strong>${selectedItem.balance + parseInt(credit)}</strong>
                    </small>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ padding: isMobile ? '8px 12px' : '' }}>
                <button className="btn" onClick={closeAssignModal} style={{ background: COLORS.border, color: COLORS.black, fontSize: isMobile ? '0.75rem' : '1rem' }}>Cancel</button>
                <button className="btn text-white" style={{ background: COLORS.primary, fontSize: isMobile ? '0.75rem' : '1rem' }} onClick={assignCredit}>Assign Credit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prevent page scroll when any modal is open */}
      {(showAddModal || showViewModal || showEditModal || showAssignModal) && <div style={{ height: "1px" }}></div>}
    </div>
  );
};

export default ManagementSystem;